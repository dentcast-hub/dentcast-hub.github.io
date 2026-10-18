"""GitHub discovery response contracts; no external network or remote writes."""
import base64
import copy
from contextlib import redirect_stdout, redirect_stderr
import io
import json
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from unittest.mock import patch
import unittest

import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import dentcast_publish_discovery as d

REPO = 'example/repository'


class MemoryGitHub:
    def __init__(self, heads, files=None, final_heads=None):
        self.heads, self.files = heads, files or {}
        self.final_heads = final_heads
        self.list_round = 0
        self.calls = []

    def __call__(self, url):
        self.calls.append(url)
        parts, query = urlsplit(url), parse_qs(urlsplit(url).query)
        if '/git/commits/' in parts.path:
            return {'sha': parts.path.rsplit('/', 1)[1]}
        if parts.path.endswith('/branches'):
            page = int(query['page'][0])
            if page == 1:
                self.list_round += 1
            heads = self.final_heads if self.final_heads is not None and self.list_round > 1 else self.heads
            rows = [{'name': name, 'commit': {'sha': sha}} for name, sha in sorted(heads.items())]
            return rows[(page-1)*100:page*100]
        sha = query['ref'][0]
        value = self.files.get(sha)
        if isinstance(value, Exception):
            raise value
        if value is None:
            raise h.Blocked('DISCOVERY_HTTP_404')
        return copy.deepcopy(value)


class DiscoveryTests(unittest.TestCase):
    def setUp(self):
        fixtures.HandoffTests.setUp(self)
        self.p['steps'] = lc.plan()
        h.save(self.root, self.p, initial=True)
        self.template, _ = h.load_state(self.root)

    def entry(self, branch='publish/work', repository=REPO, schema=h.SCHEMA):
        state = copy.deepcopy(self.template)
        state['schema'] = schema
        if schema in ('publish-handoff-v1', 'publish-handoff-v2'):
            state['snapshot'].update(repository='github.com/' + repository, branch=branch)
        raw = h.render(state).encode()
        return {'path': h.STATE_PATH, 'type': 'file', 'encoding': 'base64',
                'size': len(raw), 'content': base64.b64encode(raw).decode()}

    def test_one_candidate_returns_latest_head_and_semantic_state(self):
        reader = MemoryGitHub({'main': 'a'*40, 'publish/work': 'b'*40}, {'b'*40: self.entry()})
        result = d.discover(REPO, reader)
        self.assertEqual(result['status'], 'handoff_found')
        self.assertTrue(result['discovery_complete'])
        selected = result['selected']
        self.assertEqual(selected['head_sha'], 'b'*40)
        self.assertEqual(selected['branch'], 'publish/work')
        self.assertEqual(selected['publication'], self.p)
        self.assertEqual(selected['next_step'], 'rules')
        self.assertTrue(selected['requires_checkout_verification'])
        self.assertIn('/blob/'+'b'*40+'/', selected['handoff_url'])
        self.assertFalse(result['publication_completed'])

    def test_not_found_only_after_complete_stable_scan(self):
        result = d.discover(REPO, MemoryGitHub({'main': 'a'*40}))
        self.assertEqual(result['status'], 'not_found')
        self.assertTrue(result['discovery_complete'])
        self.assertIsNone(result['selected'])

    def test_metadata_only_access_cannot_turn_masked_404s_into_absence(self):
        reader = MemoryGitHub({'main': 'a'*40})
        def read(url):
            if '/git/commits/' in url:
                raise h.Blocked('DISCOVERY_HTTP_404')
            return reader(url)
        result = d.discover(REPO, read)
        self.assertFalse(result['discovery_complete'])
        self.assertEqual(result['branches_checked'], 0)
        self.assertEqual(result['errors'][0]['phase'], 'verify_contents_access')

    def test_full_six_hundred_branch_pagination_finds_last_page(self):
        heads = {f'branch-{i:03}': f'{i+1:040x}' for i in range(600)}
        reader = MemoryGitHub(heads, {f'{600:040x}': self.entry('branch-599')})
        result = d.discover(REPO, reader)
        self.assertEqual(result['branches_checked'], 600)
        self.assertEqual(result['selected']['branch'], 'branch-599')
        self.assertEqual(reader.list_round, 2)
        self.assertEqual(len([u for u in reader.calls if '/branches?' in u]), 14)

    def test_multiple_candidates_are_never_selected_by_order_or_name(self):
        reader = MemoryGitHub({'a-old': 'a'*40, 'z-new': 'b'*40},
                              {'a'*40: self.entry('a-old'), 'b'*40: self.entry('z-new')})
        result = d.discover(REPO, reader)
        self.assertEqual(result['status'], 'blocked')
        self.assertIsNone(result['selected'])
        self.assertEqual(len(result['candidates']), 2)
        self.assertEqual(result['errors'][0]['code'], 'MULTIPLE_ACTIVE_HANDOFFS_REQUIRE_SELECTION')

    def test_rate_limit_after_a_candidate_does_not_select_it(self):
        reader = MemoryGitHub({'a': 'a'*40, 'z': 'b'*40},
                              {'a'*40: self.entry('a'), 'b'*40: h.Blocked('DISCOVERY_HTTP_429')})
        result = d.discover(REPO, reader)
        self.assertFalse(result['discovery_complete'])
        self.assertIsNone(result['selected'])
        self.assertEqual(len(result['candidates']), 1)

    def test_corrupt_handoff_prevents_selecting_another_branch(self):
        bad = self.entry('z')
        bad.update(content=base64.b64encode(b'not a handoff').decode(), size=13)
        result = d.discover(REPO, MemoryGitHub({'a': 'a'*40, 'z': 'b'*40},
                            {'a'*40: self.entry('a'), 'b'*40: bad}))
        self.assertTrue(result['discovery_complete'])
        self.assertEqual(result['status'], 'blocked')
        self.assertIsNone(result['selected'])

    def test_branch_identity_is_taken_from_discovery_not_repeated_in_handoff(self):
        result = d.discover(REPO, MemoryGitHub({'copied-branch': 'a'*40}, {'a'*40: self.entry()}))
        self.assertEqual(result['selected']['branch'], 'copied-branch')
        wire = self.entry()
        raw = base64.b64decode(wire['content'])
        self.assertNotIn('snapshot', h.decode_json(raw.decode().split(h.BEGIN, 1)[1].split(h.END, 1)[0]))

    def test_repository_identity_is_taken_from_discovery_not_repeated_in_handoff(self):
        result = d.discover(REPO, MemoryGitHub({'publish/work': 'a'*40},
                            {'a'*40: self.entry(repository='other/repo')}))
        self.assertEqual(result['status'], 'handoff_found')
        self.assertEqual(result['selected']['branch'], 'publish/work')

    def test_changed_branch_head_requires_retry(self):
        result = d.discover(REPO, MemoryGitHub({'publish/work': 'a'*40}, {'a'*40: self.entry()},
                            final_heads={'publish/work': 'b'*40}))
        self.assertFalse(result['discovery_complete'])
        self.assertIsNone(result['selected'])
        self.assertEqual(result['errors'][0]['code'], 'DISCOVERY_BRANCH_HEADS_CHANGED_RETRY')

    def test_branch_created_during_scan_requires_retry(self):
        result = d.discover(REPO, MemoryGitHub({'main': 'a'*40},
                            final_heads={'main': 'a'*40, 'new': 'b'*40}))
        self.assertFalse(result['discovery_complete'])
        self.assertNotEqual(result['status'], 'not_found')

    def test_branch_limit_is_incomplete_not_absent(self):
        heads = {f'b{i}': f'{i+1:040x}' for i in range(1001)}
        result = d.discover(REPO, MemoryGitHub(heads))
        self.assertFalse(result['discovery_complete'])
        self.assertEqual(result['errors'][0]['code'], 'DISCOVERY_BRANCH_LIMIT_INCOMPLETE')

    def test_v1_handoff_remains_discoverable(self):
        result = d.discover(REPO, MemoryGitHub({'publish/work': 'a'*40},
                            {'a'*40: self.entry(schema='publish-handoff-v1')}))
        self.assertEqual(result['selected']['schema'], 'publish-handoff-v1')

    def test_large_handoff_uses_pinned_blob_when_contents_omits_encoding(self):
        self.template['publication']['context']['inputs'] = ['fixture:' + 'x'*1100000]
        entry = self.entry()
        self.assertGreater(entry['size'], 1024*1024)
        reader = MemoryGitHub({'publish/work': 'a'*40},
                              {'a'*40: {**entry, 'encoding': 'none', 'content': '', 'sha': 'b'*40}})
        def read(url):
            if '/git/blobs/' in url:
                self.assertTrue(url.endswith('b'*40))
                return {**entry, 'sha': 'b'*40}
            return reader(url)
        result = d.discover(REPO, read)
        self.assertEqual(result['status'], 'handoff_found')
        self.assertTrue(result['discovery_complete'])

    def test_blob_read_failure_is_incomplete_not_a_missing_handoff(self):
        for code in ('404', '503'):
            with self.subTest(code=code):
                reader = MemoryGitHub({'publish/work': 'a'*40}, {'a'*40:
                            {**self.entry(), 'encoding': 'none', 'content': '', 'sha': 'b'*40}})
                def read(url):
                    if '/git/blobs/' in url:
                        raise h.Blocked('DISCOVERY_HTTP_' + code)
                    return reader(url)
                result = d.discover(REPO, read)
                self.assertFalse(result['discovery_complete'])
                self.assertIsNone(result['selected'])

    def test_repeated_page_and_auth_failure_do_not_claim_absence(self):
        def repeated(url):
            return [{'name': 'same', 'commit': {'sha': 'a'*40}}]*100
        self.assertFalse(d.discover(REPO, repeated)['discovery_complete'])
        def denied(url):
            raise h.Blocked('DISCOVERY_HTTP_401')
        result = d.discover(REPO, denied)
        self.assertEqual(result['errors'][0]['code'], 'DISCOVERY_HTTP_401')
        self.assertFalse(result['discovery_complete'])

    def test_cli_explicit_repository_does_not_need_or_modify_a_checkout(self):
        before = (self.root/h.STATE_PATH).read_bytes()
        out, err = io.StringIO(), io.StringIO()
        with patch.object(d, 'GitHubReader', return_value=MemoryGitHub({'main': 'a'*40})), \
             redirect_stdout(out), redirect_stderr(err):
            code = h.main(['--repo', str(self.base/'no-checkout'), 'discover', '--repository', REPO])
        self.assertEqual(code, 0, err.getvalue())
        self.assertEqual(json.loads(out.getvalue())['status'], 'not_found')
        self.assertEqual((self.root/h.STATE_PATH).read_bytes(), before)

    def test_cli_ambiguity_returns_exit_two(self):
        reader = MemoryGitHub({'a': 'a'*40, 'b': 'b'*40},
                              {'a'*40: self.entry('a'), 'b'*40: self.entry('b')})
        out = io.StringIO()
        with patch.object(d, 'GitHubReader', return_value=reader), redirect_stdout(out):
            code = h.main(['discover', '--repository', REPO])
        self.assertEqual(code, 2)
        self.assertIsNone(json.loads(out.getvalue())['selected'])

    def test_unsafe_repository_or_non_github_origin_is_rejected(self):
        for value in ('../repo', 'https://other.invalid/repo', 'owner/repo?ref=x'):
            with self.assertRaises(h.Blocked):
                d.repository_name(value)
        with self.assertRaisesRegex(h.Blocked, 'GITHUB_ORIGIN_REQUIRED'):
            d.infer_repository(self.root)
        fixtures.run(self.root, 'remote', 'set-url', 'origin', 'git@github.com:example/repository.git')
        self.assertEqual(d.infer_repository(self.root), REPO)

    def test_oversized_or_invalid_base64_is_blocked(self):
        for update in ({'size': h.LIMIT+1}, {'content': '@@@'}, {'type': 'symlink'}):
            entry = self.entry()
            entry.update(update)
            result = d.discover(REPO, MemoryGitHub({'publish/work': 'a'*40}, {'a'*40: entry}))
            self.assertEqual(result['status'], 'blocked')
            self.assertIsNone(result['selected'])

    def test_transport_uses_only_pinned_get_and_sanitizes_errors(self):
        seen = []
        def denied(request, timeout):
            seen.append(request)
            self.assertEqual(timeout, 15)
            raise HTTPError(request.full_url, 403, 'private-token-must-not-appear', {}, None)
        with patch.object(d, 'urlopen', side_effect=denied):
            with self.assertRaisesRegex(h.Blocked, '^DISCOVERY_HTTP_403$'):
                d.GitHubReader()(d.API+'/repos/'+REPO+'/branches')
        self.assertEqual(seen[0].get_method(), 'GET')
        with self.assertRaisesRegex(h.Blocked, 'DISCOVERY_URL_INVALID'):
            d.GitHubReader()('https://other.invalid/repos/example/repo')
        with patch.object(d, 'urlopen', side_effect=URLError('private details')):
            with self.assertRaisesRegex(h.Blocked, '^DISCOVERY_NETWORK_UNAVAILABLE$'):
                d.GitHubReader()(d.API+'/repos/'+REPO+'/branches')

    def test_transport_reads_json_and_uses_only_explicit_token_environment(self):
        def respond(request, timeout):
            self.assertEqual(request.get_header('Authorization'), 'Bearer fixture-token')
            self.assertEqual(request.get_header('Cache-control'), 'no-cache')
            return io.BytesIO(b'[{"name":"main","commit":{"sha":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}}]')
        with patch.dict('os.environ', {'DENTCAST_DISCOVERY_TEST_TOKEN': 'fixture-token'}), \
             patch.object(d, 'urlopen', side_effect=respond):
            rows = d.GitHubReader('DENTCAST_DISCOVERY_TEST_TOKEN')(d.API+'/repos/'+REPO+'/branches')
        self.assertEqual(rows[0]['name'], 'main')
        with patch.dict('os.environ', {}, clear=True):
            with self.assertRaisesRegex(h.Blocked, 'TOKEN_ENV_UNAVAILABLE'):
                d.GitHubReader('DENTCAST_DISCOVERY_TEST_TOKEN')


if __name__ == '__main__':
    unittest.main()
