"""Fresh-process/checkout recovery acceptance; no publication or external services.

Uses the unmodified production verifier for negative page gates and the real
catalog gate for a synthetic paper-only lifecycle. No fixture verifier here.
Completed scientific ledgers, where needed to reach a gate, are test setup via
the internal API, not proof that scientific or client work was performed.
"""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import unittest

import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

ROOT = Path(__file__).resolve().parents[1]
run = fixtures.run


class RecoveryAcceptanceTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp

    def prepare(self):
        for name in ('dentcast_publish_handoff.py', 'dentcast_publish_lifecycle.py', 'verify_publish.py'):
            shutil.copyfile(ROOT / 'tools' / name, self.root / 'tools' / name)
        for name, value in [('dentcast-brain.json', []),
                            ('litecast/lite-glossary.json', {'LightGlossary': []}),
                            ('glossary/glossary.json', {'glossary': []})]:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(value))
        run(self.root, 'add', '.')
        run(self.root, 'commit', '-m', 'production helpers and empty content indexes')
        run(self.root, 'push', 'origin', 'main')
        self.p.update(content_id='note', steps=lc.plan())

    def cli(self, *args, root=None, code=0):
        root = root or self.root
        result = subprocess.run([sys.executable, str(root / 'tools/dentcast_publish_handoff.py'),
                                 '--repo', str(root), *args], capture_output=True, text=True)
        self.assertEqual(result.returncode, code, result.stdout + result.stderr)
        return json.loads(result.stdout or result.stderr)

    def record(self, p, sha, root=None, note=None):
        path = self.base / 'operator-input.json'
        path.write_text(json.dumps(p))
        args = ['record', '--input', str(path), '--expected-sha256', sha]
        if note:
            args += ['--reconcile-note', note]
        return self.cli(*args, root=root)

    def init(self):
        path = self.base / 'operator-input.json'
        path.write_text(json.dumps(self.p))
        return self.cli('init', '--input', str(path))

    def clone(self):
        clone = self.base / 'receiving-agent'
        run(self.base, 'clone', str(self.remote), str(clone))
        run(clone, 'config', 'user.name', 'Receiving fixture agent')
        run(clone, 'config', 'user.email', 'receiver@example.invalid')
        return clone

    def deliver_checkpoint(self):
        run(self.root, 'add', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'deliver boundary checkpoint')
        run(self.root, 'push', 'origin', 'main')

    def test_same_checkout_fresh_process_keeps_dirty_bytes_and_resumes_next_step(self):
        self.prepare()
        (self.root / 'note.html').write_text('uncommitted operator work')
        initial = self.init()
        started = self.cli('step', '--id', 'rules', '--status', 'started', '--expected-sha256', initial['sha256'])
        done = self.cli('step', '--id', 'rules', '--status', 'completed', '--evidence', 'fixture:read rules',
                        '--expected-sha256', started['sha256'])
        view = self.cli('inspect', '--check-remote')
        self.assertEqual(view['next_step'], '0')
        self.assertEqual(view['sha256'], done['sha256'])
        self.assertEqual(view['git_snapshot_portable'], 'no')
        self.assertEqual((self.root / 'note.html').read_text(), 'uncommitted operator work')
        self.assertEqual(view['recorded_state']['publication']['steps'][0]['status'], 'completed')

    def test_unpushed_commit_is_local_and_fresh_clone_cannot_find_handoff(self):
        self.prepare()
        (self.root / 'note.html').write_text('local commit only')
        run(self.root, 'add', 'note.html')
        run(self.root, 'commit', '-m', 'not pushed')
        self.init()
        view = self.cli('inspect', '--check-remote')
        self.assertEqual(view['portability_reason'], 'LOCAL_COMMITS_NOT_ON_REMOTE_BRANCH')
        clone = self.clone()
        blocked = self.cli('inspect', root=clone, code=2)
        self.assertIn('HANDOFF_MISSING', blocked['error'])
        self.assertEqual((clone / 'note.html').read_text(), 'original\n')

    def test_copying_only_handoff_does_not_transfer_dirty_work(self):
        self.prepare()
        (self.root / 'note.html').write_text('untransferred bytes')
        self.init()
        clone = self.clone()
        shutil.copyfile(self.root / h.STATE_PATH, clone / h.STATE_PATH)
        before = (clone / h.STATE_PATH).read_bytes()
        view = self.cli('inspect', '--check-remote', root=clone, code=2)
        self.assertIn('WORK_OR_INDEX_CHANGED', view['issues'])
        self.assertFalse(view['publication_completed'])
        self.assertEqual((clone / h.STATE_PATH).read_bytes(), before)

    def test_committed_transfer_rebuilds_git_facts_and_keeps_resolved_prefix(self):
        self.prepare()
        initial = self.init()
        started = self.cli('step', '--id', 'rules', '--status', 'started', '--expected-sha256', initial['sha256'])
        done = self.cli('step', '--id', 'rules', '--status', 'completed', '--evidence', 'fixture:rules read',
                        '--expected-sha256', started['sha256'])
        (self.root / 'note.html').write_text('transferred work')
        state, _ = h.load_state(self.root)
        self.record(state['publication'], done['sha256'], note='Reviewed changed page bytes')
        run(self.root, 'add', '.')
        run(self.root, 'commit', '-m', 'deliver work and checkpoint')
        run(self.root, 'push', 'origin', 'main')
        clone = self.clone()
        view = self.cli('inspect', '--check-remote', root=clone)
        self.assertEqual(view['issues'], [])
        self.assertEqual(view['git_snapshot_portable'], 'yes')
        self.assertEqual((clone / 'note.html').read_text(), 'transferred work')
        refreshed = self.record(view['recorded_state']['publication'], view['sha256'], root=clone,
                                note='Verified transferred page SHA and resolved evidence in receiving checkout')
        self.assertEqual(refreshed['next_step'], '0')
        run(clone, 'add', h.STATE_PATH)
        run(clone, 'commit', '-m', 'receiving checkpoint reconciliation')
        run(clone, 'push', 'origin', 'main')
        current = self.cli('inspect', '--check-remote', root=clone)
        self.assertEqual(current['git_snapshot_portable'], 'yes')
        self.assertEqual(current['recorded_state']['publication']['steps'][0]['status'], 'completed')

    def test_corrupt_and_stale_state_never_get_overwritten_by_inspection(self):
        self.prepare()
        self.init()
        path = self.root / h.STATE_PATH
        saved = path.read_bytes()
        path.write_bytes(saved + b'corrupt trailing data')
        corrupt = path.read_bytes()
        self.cli('inspect', code=2)
        self.assertEqual(path.read_bytes(), corrupt)
        path.write_bytes(saved)
        (self.root / 'note.html').write_text('unexpected edit')
        view = self.cli('inspect', code=2)
        self.assertIn('WORK_OR_INDEX_CHANGED', view['issues'])
        self.assertEqual(path.read_bytes(), saved)

    def test_ambiguous_external_action_survives_fresh_process_without_retry(self):
        self.prepare()
        self.p['external_actions'] = [{'id': 'upload', 'target': 'drive:synthetic',
                                      'status': 'outcome_unknown', 'evidence': ['fixture:timeout']}]
        self.init()
        view = self.cli('inspect', code=2)
        self.assertIn('EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY', view['issues'])
        self.assertEqual(view['recorded_state']['publication']['external_actions'], self.p['external_actions'])
        self.assertFalse(view['publication_completed'])

    def test_unmodified_real_page_verifier_failure_is_persisted_and_blocks_cleanup(self):
        self.prepare()
        self.assertEqual((self.root / 'tools/verify_publish.py').read_bytes(),
                         (ROOT / 'tools/verify_publish.py').read_bytes())
        # Fixture ledger positions the CLI at F; it does not certify real science.
        for row in self.p['steps']:
            if row['id'] in ('F', 'G'):
                break
            row.update(status='completed', evidence=['fixture:boundary setup'])
        initial = h.save(self.root, self.p, initial=True)
        self.deliver_checkpoint()
        result = self.cli('verify', '--expected-sha256', initial['sha256'], code=2)
        self.assertEqual(result['verification']['exit_code'], 1)
        self.assertIn('no entry whose page_url/url', result['verification']['output'])
        self.assertIn('publish is INCOMPLETE', result['verification']['output'])
        state, sha = h.load_state(self.root)
        self.assertEqual(next(s for s in state['publication']['steps'] if s['id'] == 'F')['status'], 'failed')
        self.cli('finish', '--expected-sha256', sha, code=2)
        self.assertTrue((self.root / h.STATE_PATH).exists())

    def test_real_catalog_gate_cleanup_and_remote_confirmation_across_processes(self):
        self.prepare()
        self.p.update(category='paper-only', target_paths=['dentcast_cabinet_full_catalog.json'], steps=lc.plan(True))
        record = {'id': 'synthetic-paper', 'drive_id': 'synthetic-drive',
                  'drive_view': 'https://drive.google.com/file/d/synthetic-drive/view',
                  'drive_download': 'https://drive.google.com/uc?export=download&id=synthetic-drive'}
        (self.root / self.p['target_paths'][0]).write_text(json.dumps({'papers': [record]}))
        self.p['external_actions'] = [{'id': 'fixture', 'target': 'drive:synthetic-drive',
                                      'status': 'completed', 'evidence': ['fixture:no actual upload']}]
        self.p['context']['delivery'] = [{'scope': 'synthetic local acceptance only', 'evidence': ['fixture:review']}]
        for row in self.p['steps'][:-1]:
            row.update(status='completed', evidence=['fixture:boundary setup'])
        run(self.root, 'add', '.')
        run(self.root, 'commit', '-m', 'synthetic catalog')
        initial = h.save(self.root, self.p, initial=True)
        self.deliver_checkpoint()
        verified = self.cli('verify', '--catalog-id', 'synthetic-paper', '--expected-sha256', initial['sha256'])
        self.assertEqual(verified['verification']['kind'], 'paper_catalog_gate')
        self.deliver_checkpoint()
        state, sha = h.load_state(self.root)
        started = self.cli('step', '--id', 'G', '--status', 'started', '--expected-sha256', sha)
        done = self.cli('step', '--id', 'G', '--status', 'completed', '--evidence', 'fixture:report',
                        '--expected-sha256', started['sha256'])
        run(self.root, 'add', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'checkpoint delivered')
        run(self.root, 'push', 'origin', 'main')
        finished = self.cli('finish', '--expected-sha256', done['sha256'])
        self.assertFalse(finished['publication_completed'])
        self.cli('inspect', code=2)
        self.cli('confirm-cleanup', code=2)
        run(self.root, 'add', '-u', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'cleanup deletion')
        self.cli('confirm-cleanup', code=2)
        run(self.root, 'push', 'origin', 'main')
        self.assertTrue(self.cli('confirm-cleanup')['publication_completed'])
        self.assertFalse(h.observation_path(self.root).exists())
        clone = self.clone()
        self.assertFalse((clone / h.STATE_PATH).exists())
        self.cli('guard', '--phase', 'ci', root=clone)


if __name__ == '__main__':
    unittest.main()
