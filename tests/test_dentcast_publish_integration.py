"""Production CLI across two real clones and a bare remote with Git-backed API.

The GitHub transport is an adapter over that local bare remote, not a network
service. Paper metadata/receipts are explicitly synthetic; no scientific work,
Drive upload, notification or real publication is performed.
"""
import base64
import json
from pathlib import Path
import shutil
import subprocess
import sys
import unittest
from urllib.parse import parse_qs, urlsplit

import test_dentcast_publish_recovery as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

ROOT = Path(__file__).resolve().parents[1]
REPO = 'example/recovery-acceptance'
ORIGIN = 'https://github.com/' + REPO + '.git'
BRANCH = 'publish/resume-acceptance'
CATALOG = 'dentcast_cabinet_full_catalog.json'
run = fixtures.run


class GitBackedGitHub:
    """Read branch/commit/file responses from actual Git objects, not ledgers."""
    def __init__(self, remote):
        self.remote = Path(remote)

    def __call__(self, url):
        parts, query = urlsplit(url), parse_qs(urlsplit(url).query)
        if parts.path.endswith('/branches'):
            rows = run(self.remote, 'for-each-ref', '--format=%(refname:strip=2) %(objectname)', 'refs/heads').stdout.splitlines()
            records = [{'name': row.split(' ', 1)[0], 'commit': {'sha': row.split(' ', 1)[1]}} for row in rows]
            page = int(query['page'][0])
            return records[(page-1)*100:page*100]
        if '/git/commits/' in parts.path:
            sha = parts.path.rsplit('/', 1)[1]
            assert run(self.remote, 'cat-file', '-t', sha).stdout.strip() == 'commit'
            return {'sha': sha}
        sha = query['ref'][0]
        result = subprocess.run(['git', '-C', str(self.remote), 'show', sha+':'+h.STATE_PATH], capture_output=True)
        if result.returncode:
            raise h.Blocked('DISCOVERY_HTTP_404')
        raw = result.stdout
        return {'path': h.STATE_PATH, 'type': 'file', 'encoding': 'base64',
                'size': len(raw), 'content': base64.b64encode(raw).decode()}


class IntegratedRecoveryTests(unittest.TestCase):
    setUp = fixtures.RecoveryAcceptanceTests.setUp
    cli = fixtures.RecoveryAcceptanceTests.cli
    record = fixtures.RecoveryAcceptanceTests.record
    init = fixtures.RecoveryAcceptanceTests.init

    def prepare(self):
        fixtures.RecoveryAcceptanceTests.prepare(self)
        shutil.copyfile(ROOT/'tools/dentcast_publish_discovery.py', self.root/'tools/dentcast_publish_discovery.py')
        run(self.root, 'add', 'tools/dentcast_publish_discovery.py')
        run(self.root, 'commit', '-m', 'production discovery reader')
        run(self.root, 'push', 'origin', 'main')
        run(self.root, 'switch', '-c', BRANCH)
        self.configure_origin(self.root)
        self.p.update(content_id='synthetic-paper', category='paper-only', target_paths=[CATALOG], steps=lc.plan(True))
        self.init()

    def configure_origin(self, root):
        # Git reports the GitHub run identity, but all transport is local.
        run(root, 'remote', 'set-url', 'origin', ORIGIN)
        run(root, 'config', 'url.' + str(self.remote) + '.insteadOf', ORIGIN)

    def discover(self):
        code = ('import sys\n'
                f'sys.path[:0]=[{str(ROOT/"tools")!r},{str(ROOT/"tests")!r}]\n'
                'import dentcast_publish_handoff as h\n'
                'import dentcast_publish_discovery as d\n'
                'from test_dentcast_publish_integration import GitBackedGitHub\n'
                f'd.GitHubReader=lambda token_env=None:GitBackedGitHub({str(self.remote)!r})\n'
                f'raise SystemExit(h.main(["discover","--repository",{REPO!r}]))\n')
        result = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return json.loads(result.stdout)

    def start(self, sid):
        sha = h.load_state(self.root)[1]
        return self.cli('step', '--id', sid, '--status', 'started', '--expected-sha256', sha,
                        '--reconcile-note', 'Fixture: inspected previous commit and delivery')

    def complete(self, sid):
        sha = h.load_state(self.root)[1]
        return self.cli('step', '--id', sid, '--status', 'completed', '--expected-sha256', sha,
                        '--evidence', 'fixture:synthetic-'+sid,
                        '--reconcile-note', 'Fixture: reviewed actual local changes')

    def checkpoint_commit(self):
        # Exercise the actual production pre-commit boundary after scoped staging.
        if (self.root/CATALOG).exists():
            run(self.root, 'add', CATALOG)
        state, sha = h.load_state(self.root)
        self.record(state['publication'], sha, note='Fixture: reviewed staged scoped work')
        run(self.root, 'add', h.STATE_PATH)
        self.cli('guard', '--phase', 'pre-commit')
        run(self.root, 'commit', '-m', 'fixture step and fixed checkpoint')

    def deliver(self):
        self.checkpoint_commit()
        run(self.root, 'push', 'origin', BRANCH)

    def intake(self):
        self.start('rules');self.complete('rules');self.deliver()
        self.start('0');self.complete('0');self.deliver()

    def synthetic_catalog(self, unknown=False):
        self.start('C.4.10.1')
        record = {'id': 'synthetic-paper', 'drive_id': 'synthetic-drive',
                  'drive_view': 'https://drive.google.com/file/d/synthetic-drive/view',
                  'drive_download': 'https://drive.google.com/uc?export=download&id=synthetic-drive'}
        (self.root/CATALOG).write_text(json.dumps({'papers': [record]}))
        state, sha = h.load_state(self.root)
        state['publication']['external_actions'] = [{'id': 'synthetic-upload', 'target': 'drive:synthetic-drive',
                    'status': 'outcome_unknown' if unknown else 'completed',
                    'evidence': ['fixture:no actual upload; synthetic receipt']}]
        self.record(state['publication'], sha, note='Fixture: synthetic catalog and external ledger')
        if unknown:
            sha = h.load_state(self.root)[1]
            self.cli('step', '--id', 'C.4.10.1', '--status', 'blocked', '--reason', 'Fixture: ambiguous outcome',
                     '--expected-sha256', sha)
        else:
            self.complete('C.4.10.1')
        self.deliver()

    def receive(self):
        selected = self.discover()['selected']
        self.assertEqual(selected['branch'], BRANCH)
        clone = self.base/'receiving-agent'
        run(self.base, 'clone', '--branch', selected['branch'], str(self.remote), str(clone))
        run(clone, 'config', 'user.name', 'Receiving fixture agent')
        run(clone, 'config', 'user.email', 'receiver@example.invalid')
        self.configure_origin(clone)
        self.assertEqual(run(clone, 'rev-parse', 'HEAD').stdout.strip(), selected['head_sha'])
        self.assertFalse(h.observation_path(clone).exists())
        self.root = clone
        return selected

    def finish_ledger(self):
        self.start('C.4.10.2')
        catalog = json.loads((self.root/CATALOG).read_text())
        catalog['papers'][0]['title'] = 'Synthetic acceptance metadata'
        (self.root/CATALOG).write_text(json.dumps(catalog))
        self.complete('C.4.10.2');self.deliver()
        sha = h.load_state(self.root)[1]
        self.cli('verify', '--catalog-id', 'synthetic-paper', '--expected-sha256', sha)
        sha = h.load_state(self.root)[1]
        blocked = self.cli('step', '--id', 'G', '--status', 'started', '--expected-sha256', sha, code=2)
        self.assertIn('HANDOFF_NOT_DELIVERED', blocked['error'])
        self.deliver()
        self.start('G')
        state, sha = h.load_state(self.root)
        state['publication']['context']['delivery'] = [{'scope': 'synthetic local acceptance',
                                                       'evidence': ['fixture:no live delivery']}]
        self.record(state['publication'], sha)
        self.complete('G');self.deliver()

    def test_full_discovery_transfer_resume_and_confirmed_cleanup(self):
        self.prepare();self.intake();self.synthetic_catalog()
        selected = self.receive()
        view = self.cli('inspect', '--check-remote')
        self.assertEqual(view['sha256'], selected['handoff_sha256'])
        self.assertEqual(view['next_step'], 'C.4.10.2')
        self.assertEqual(view['git_snapshot_portable'], 'yes')
        self.finish_ledger()
        sha = h.load_state(self.root)[1]
        result = self.cli('finish', '--expected-sha256', sha)
        self.assertFalse(result['publication_completed'])
        self.cli('guard', '--phase', 'stop', code=2)
        self.cli('confirm-cleanup', code=2)
        run(self.root, 'add', '-u', h.STATE_PATH)
        self.cli('guard', '--phase', 'pre-commit')
        run(self.root, 'commit', '-m', 'cleanup only')
        run(self.root, 'push', 'origin', BRANCH)
        self.assertTrue(self.cli('confirm-cleanup')['publication_completed'])
        self.assertFalse(h.observation_path(self.root).exists())
        self.assertEqual(self.discover()['status'], 'not_found')
        final = self.base/'final-ci-clone'
        run(self.base, 'clone', '--branch', BRANCH, str(self.remote), str(final))
        self.cli('guard', '--phase', 'ci', root=final)

    def test_rejected_push_keeps_local_checkpoint_and_blocks_next_step(self):
        self.prepare();self.start('rules');self.complete('rules')
        self.checkpoint_commit()
        hook = self.remote/'hooks/pre-receive'
        hook.write_text('#!/bin/sh\nexit 1\n');hook.chmod(0o755)
        self.assertNotEqual(run(self.root, 'push', 'origin', BRANCH, check=False).returncode, 0)
        sha = h.load_state(self.root)[1]
        blocked = self.cli('step', '--id', '0', '--status', 'started', '--expected-sha256', sha, code=2)
        self.assertIn('PUSH_NOT_CONFIRMED', blocked['error'])
        self.assertTrue((self.root/h.STATE_PATH).exists())
        self.assertEqual(self.discover()['status'], 'not_found')
        hook.unlink();run(self.root, 'push', 'origin', BRANCH)
        self.receive()
        self.assertEqual(self.cli('inspect', '--check-remote')['next_step'], '0')

    def test_unknown_external_outcome_survives_discovery_and_blocks_retry(self):
        self.prepare();self.intake();self.synthetic_catalog(unknown=True)
        selected = self.receive()
        self.assertEqual(selected['publication']['external_actions'][0]['status'], 'outcome_unknown')
        view = self.cli('inspect', '--check-remote', code=2)
        self.assertIn('EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY', view['issues'])
        blocked = self.cli('step', '--id', 'C.4.10.1', '--status', 'started', '--expected-sha256', view['sha256'],
                           '--reconcile-note', 'Fixture: outcome still unknown', code=2)
        self.assertIn('EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY', blocked['error'])
        state, sha = h.load_state(self.root)
        publication = state['publication']
        publication.update(status='in_progress', blocker=None)
        next(s for s in publication['steps'] if s['id'] == 'C.4.10.1')['status'] = 'started'
        path = self.base/'retry-input.json'
        path.write_text(json.dumps(publication))
        blocked = self.cli('record', '--input', str(path), '--expected-sha256', sha,
                           '--reconcile-note', 'Fixture: attempted raw-record bypass', code=2)
        self.assertIn('EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY', blocked['error'])

    def test_interrupted_cleanup_restores_same_fixed_handoff(self):
        self.prepare();self.intake();self.synthetic_catalog();self.receive();self.finish_ledger()
        sha = h.load_state(self.root)[1]
        self.cli('finish', '--expected-sha256', sha)
        self.cli('confirm-cleanup', code=2)
        restored = self.cli('restore-cleanup')
        self.assertFalse(restored['publication_completed'])
        self.assertTrue((self.root/h.STATE_PATH).exists())
        state, _ = h.load_state(self.root)
        self.assertEqual(state['publication']['status'], 'cleanup_pending')
        self.assertEqual(state['publication']['external_actions'][0]['status'], 'completed')


if __name__ == '__main__':
    unittest.main()
