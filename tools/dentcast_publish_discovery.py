"""Read-only GitHub branch discovery; no checkout, fetch, commit or side effects."""
import base64
import binascii
import os
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

API = 'https://api.github.com'
MAX_BRANCHES = 1000


def repository_name(value):
    h.require(isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', value)
              and all(part not in ('.', '..') for part in value.split('/')), 'GITHUB_REPOSITORY_REQUIRED')
    return value


def infer_repository(root):
    origin = h.config(root, 'remote.origin.url')
    h.require(bool(origin), 'ORIGIN_REQUIRED')
    identity = h.identity(origin, root)
    h.require(identity.startswith('github.com/'), 'GITHUB_ORIGIN_REQUIRED')
    return repository_name(identity[len('github.com/'):])


class GitHubReader:
    def __init__(self, token_env=None):
        self.token = None
        if token_env:
            h.require(re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', token_env), 'TOKEN_ENV_NAME_INVALID')
            self.token = os.environ.get(token_env)
            h.require(bool(self.token), 'TOKEN_ENV_UNAVAILABLE')

    def __call__(self, url):
        h.require(url.startswith(API + '/repos/'), 'DISCOVERY_URL_INVALID')
        headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'DentCast-handoff-discovery',
                   'X-GitHub-Api-Version': '2022-11-28', 'Cache-Control': 'no-cache'}
        if self.token:
            headers['Authorization'] = 'Bearer ' + self.token
        try:
            with urlopen(Request(url, headers=headers), timeout=15) as response:
                raw = response.read(h.LIMIT * 3 + 1)
            h.require(len(raw) <= h.LIMIT * 3, 'DISCOVERY_RESPONSE_TOO_LARGE')
            return h.decode_json(raw.decode('utf-8'))
        except HTTPError as exc:
            # Do not surface server messages, credentials or response bodies.
            raise h.Blocked('DISCOVERY_HTTP_' + str(exc.code)) from None
        except (URLError, TimeoutError, OSError):
            raise h.Blocked('DISCOVERY_NETWORK_UNAVAILABLE') from None
        except (UnicodeError, ValueError):
            raise h.Blocked('DISCOVERY_RESPONSE_INVALID') from None


def list_heads(repo, read):
    heads = {}
    for page in range(1, MAX_BRANCHES // 100 + 2):
        rows = read(f'{API}/repos/{repo}/branches?per_page=100&page={page}')
        h.require(isinstance(rows, list) and len(rows) <= 100, 'DISCOVERY_BRANCH_RESPONSE_INVALID')
        for row in rows:
            name, sha = row['name'], row['commit']['sha']
            h.require(h.nonempty(name) and isinstance(sha, str) and re.fullmatch(r'[0-9a-f]{40}', sha),
                      'DISCOVERY_BRANCH_RESPONSE_INVALID')
            h.require(name not in heads, 'DISCOVERY_BRANCH_LIST_CHANGED')
            heads[name] = sha
        h.require(len(heads) <= MAX_BRANCHES, 'DISCOVERY_BRANCH_LIMIT_INCOMPLETE')
        if len(rows) < 100:
            return heads
    raise h.Blocked('DISCOVERY_BRANCH_LIMIT_INCOMPLETE')


def candidate(repo, branch, head, entry):
    h.require(isinstance(entry, dict) and entry.get('type') == 'file'
              and entry.get('path') == h.STATE_PATH and entry.get('encoding') == 'base64',
              'DISCOVERY_HANDOFF_RESPONSE_INVALID')
    h.require(type(entry.get('size')) is int and 0 < entry['size'] <= h.LIMIT, 'HANDOFF_TOO_LARGE')
    encoded = entry.get('content')
    h.require(isinstance(encoded, str) and len(encoded) <= h.LIMIT * 2, 'DISCOVERY_HANDOFF_RESPONSE_INVALID')
    try:
        raw = base64.b64decode(''.join(encoded.split()), validate=True)
    except (ValueError, binascii.Error):
        raise h.Blocked('DISCOVERY_HANDOFF_BASE64_INVALID') from None
    h.require(len(raw) == entry['size'], 'DISCOVERY_HANDOFF_SIZE_MISMATCH')
    state, sha = h.parse_state(raw)
    lc.require_plan(state['publication'])
    return {'branch': branch, 'head_sha': head, 'handoff_sha256': sha, 'schema': state['schema'],
            'handoff_url': f'https://github.com/{repo}/blob/{head}/{h.STATE_PATH}',
            'publication': state['publication'], 'next_step': h.next_step(state['publication']),
            'requires_checkout_verification': True}


def discover(repository, read=None):
    repo = repository_name(repository)
    read = read or GitHubReader()
    result = {'status': 'blocked', 'repository': repo, 'observed_at': h.now(),
              'discovery_complete': False, 'branches_checked': 0, 'candidates': [],
              'errors': [], 'selected': None, 'requires_operator_review': True,
              'publication_completed': False}
    try:
        heads = list_heads(repo, read)
    except (h.Blocked, KeyError, TypeError, AttributeError):
        result['errors'].append({'phase': 'list_initial', 'code': safe_error()})
        return result
    if heads:
        try:
            # Metadata-only credentials can list branches while Contents returns
            # masked 404s. Prove repository content-read access before treating
            # any missing-path 404 as absence.
            head = heads[sorted(heads)[0]]
            commit = read(f'{API}/repos/{repo}/git/commits/{head}')
            h.require(isinstance(commit, dict) and commit.get('sha') == head,
                      'DISCOVERY_CONTENT_ACCESS_UNVERIFIED')
        except (h.Blocked, KeyError, TypeError, AttributeError):
            result['errors'].append({'phase': 'verify_contents_access', 'code': safe_error()})
            return result
    for branch, head in sorted(heads.items()):
        url = f'{API}/repos/{repo}/contents/{h.STATE_PATH}?ref={quote(head, safe="")}'
        contents_found = False
        try:
            entry = read(url)
            contents_found = True
            # GitHub Contents omits base64 for files above 1 MiB. Fetch the
            # immutable blob rather than following an arbitrary download URL.
            if isinstance(entry, dict) and entry.get('type') == 'file' and entry.get('encoding') == 'none':
                h.require(type(entry.get('size')) is int and 0 < entry['size'] <= h.LIMIT, 'HANDOFF_TOO_LARGE')
                blob_sha = entry.get('sha')
                h.require(isinstance(blob_sha, str) and re.fullmatch(r'[0-9a-f]{40}', blob_sha),
                          'DISCOVERY_BLOB_ID_INVALID')
                blob = read(f'{API}/repos/{repo}/git/blobs/{blob_sha}')
                h.require(isinstance(blob, dict) and blob.get('sha') == blob_sha
                          and blob.get('size') == entry['size'], 'DISCOVERY_BLOB_ID_MISMATCH')
                entry = {**blob, 'path': h.STATE_PATH, 'type': 'file'}
        except h.Blocked as exc:
            if str(exc) == 'DISCOVERY_HTTP_404' and not contents_found:
                result['branches_checked'] += 1
                continue
            result['errors'].append({'branch': branch, 'phase': 'read_handoff', 'code': str(exc)})
            return result
        result['branches_checked'] += 1
        try:
            result['candidates'].append(candidate(repo, branch, head, entry))
        except (h.Blocked, KeyError, TypeError, AttributeError):
            result['errors'].append({'branch': branch, 'phase': 'validate_handoff', 'code': safe_error()})
    try:
        final = list_heads(repo, read)
        h.require(final == heads, 'DISCOVERY_BRANCH_HEADS_CHANGED_RETRY')
    except (h.Blocked, KeyError, TypeError, AttributeError):
        result['errors'].append({'phase': 'list_final', 'code': safe_error()})
        return result
    result['discovery_complete'] = True
    if result['errors']:
        return result
    if len(result['candidates']) > 1:
        result['errors'].append({'phase': 'select', 'code': 'MULTIPLE_ACTIVE_HANDOFFS_REQUIRE_SELECTION'})
    elif result['candidates']:
        result.update(status='handoff_found', selected=result['candidates'][0])
    else:
        result['status'] = 'not_found'
    return result


def safe_error():
    import sys
    error = sys.exc_info()[1]
    return str(error) if isinstance(error, h.Blocked) else 'DISCOVERY_RESPONSE_INVALID'
