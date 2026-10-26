"""Regressions for the Claude Code path audit (round 2), on real local Git remotes.

The verifier and semantic results are explicit fixtures, not real scientific work.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import test_dentcast_publish_three_deliveries as three
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import check_publish_merge_gate as merge

run = fixtures.run
ROOT = Path(__file__).resolve().parents[1]
STOP_GUARD = ROOT / 'scripts/publishing-stop-guard.py'


def stop_hook(payload, cwd, **env):
    clean = {k: v for k, v in os.environ.items()
             if k not in ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR', 'CURSOR_PROJECT_DIR')}
    return subprocess.run([sys.executable, str(STOP_GUARD)], input=json.dumps(payload), text=True,
                          capture_output=True, cwd=str(cwd), env={**clean, **env}, timeout=60)


class Round2Tests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare
    start = three.ThreeDeliveriesTests.start
    walk = three.ThreeDeliveriesTests.walk
    deliver = three.ThreeDeliveriesTests.deliver
    complete_two = three.ThreeDeliveriesTests.complete_two
    prepare_final = three.ThreeDeliveriesTests.prepare_final
    complete_three = three.ThreeDeliveriesTests.complete_three
    deliver_checkpoint = lifecycle_fixtures.LifecycleTests.deliver

    def clone(self, name, *extra):
        other = self.base / name
        # file:// so that --depth is honoured for a local remote.
        subprocess.run(['git', 'clone', '-q', *extra, 'file://' + str(self.remote), str(other)],
                       check=True, capture_output=True)
        run(other, 'config', 'user.name', 'Fixture')
        run(other, 'config', 'user.email', 'fixture@example.invalid')
        return other

    def actions_delivers_third(self):
        """Delivery 3 made in another checkout (as post-cut2 Actions does) and pushed."""
        self.complete_two()
        local = self.root
        self.root = self.clone('actions-runner')
        try:
            state, sha = h.load_state(self.root)
            sha = lc.step(self.root, sha, 'C.4.14', 'started', [], None)['sha256']
            (self.root/'note.html').write_text('final fixture bytes\n')
            state, _ = h.load_state(self.root)
            sha = h.save(self.root, state['publication'], expected=sha, note='Reviewed final fixture edit')['sha256']
            sha = self.walk(sha, 'G')
            state, _ = h.load_state(self.root)
            state['publication']['context']['delivery'] = [{'scope': 'fixture', 'evidence': ['fixture:checked']}]
            sha = h.save(self.root, state['publication'], expected=sha)['sha256']
            lc.finish(self.root, sha)
            run(self.root, 'add', '-A', 'note.html', h.STATE_PATH, lc.completion_path({'content_id': 'note'}),
                lc.technical_report_path({'content_id': 'note', 'category': 'insight'}))
            run(self.root, 'commit', '-m', 'delivery 3 by Actions')
            run(self.root, 'push', 'origin', 'main')
            self.assertTrue(lc.confirm_cleanup(self.root)['publication_completed'])
        finally:
            self.root = local

    # Bug 1 -----------------------------------------------------------------
    def test_stop_after_actions_delivery_three_advises_pull_not_cleanup(self):
        self.actions_delivers_third()
        self.assertTrue((self.root/h.STATE_PATH).exists())
        # Remote objects not fetched yet: still name the exact command.
        self.assert_blocked(r'REMOTE_BRANCH_ADVANCED_NOT_FETCHED.*git pull --ff-only', lc.guard, self.root, 'stop')
        run(self.root, 'fetch', '-q', 'origin')
        self.assert_blocked(r'DELIVERY_3_ON_REMOTE_PULL_REQUIRED.*git pull --ff-only', lc.guard, self.root, 'stop')
        self.assert_blocked(r'DELIVERY_3_ON_REMOTE_PULL_REQUIRED', lc.confirm_cleanup, self.root)
        self.assertIn('git pull --ff-only', h.inspect(self.root, check_remote=True)['next_action'])
        # The fixture checkout carries only the two lifecycle tools; the
        # connected cut-gate adapter they import comes from this repository.
        hook = stop_hook({'cwd': str(self.root)}, self.base, PYTHONPATH=str(ROOT/'tools'))
        out = json.loads(hook.stdout)
        self.assertEqual(out['decision'], 'block')
        self.assertIn('git pull --ff-only', out['reason'])
        self.assertNotIn('confirm-cleanup/restore-cleanup', out['reason'])
        run(self.root, 'pull', '-q', '--ff-only')
        self.assertFalse((self.root/h.STATE_PATH).exists())
        self.assertEqual(lc.guard(self.root, 'stop')['status'], 'guard_passed')
        self.assertEqual(stop_hook({'cwd': str(self.root)}, self.base).stdout, '')

    def test_remote_without_completion_keeps_push_not_confirmed(self):
        sha = self.walk(self.start(), 'C.4.9')
        self.deliver('delivery 1')
        other = self.clone('other')
        run(other, 'commit', '-q', '--allow-empty', '-m', 'unrelated remote commit')
        run(other, 'push', '-q', 'origin', 'main')
        run(self.root, 'fetch', '-q', 'origin')
        self.assert_blocked('PREVIOUS_STEP_PUSH_NOT_CONFIRMED', lc.guard, self.root, 'stop')

    # Bug 2 -----------------------------------------------------------------
    def test_stop_hook_uses_payload_cwd_and_allows_outside_a_publication(self):
        outside = Path(tempfile.mkdtemp(dir=self.base))
        # No project env, cwd outside any repository, no publication: allow.
        self.assertEqual(stop_hook({}, outside).stdout, '')
        self.assertEqual(stop_hook({'cwd': str(outside)}, outside).stdout, '')
        # A repository without a handoff: allow without loading the guard.
        self.assertEqual(stop_hook({'cwd': str(self.root)}, outside).stdout, '')

    def test_stop_hook_blocks_once_then_reports_when_stop_hook_active(self):
        self.prepare()
        self.deliver_checkpoint()
        (self.root/'note.html').write_text('unrecorded native edit')
        first = stop_hook({'cwd': str(self.root), 'stop_hook_active': False}, self.base)
        self.assertEqual(json.loads(first.stdout)['decision'], 'block')
        again = stop_hook({'cwd': str(self.root), 'stop_hook_active': True}, self.base)
        out = json.loads(again.stdout)
        self.assertNotIn('decision', out)
        self.assertIn('CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP', out['systemMessage'])
        self.assertIn('CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP', again.stderr)
        # The env project directory still works when the payload has no cwd.
        env = stop_hook({}, self.base, CLAUDE_PROJECT_DIR=str(self.root))
        self.assertEqual(json.loads(env.stdout)['decision'], 'block')

    def test_ls_remote_is_bounded_by_the_hook_timeout(self):
        with patch.dict(os.environ, {'DENTCAST_GIT_REMOTE_TIMEOUT': '8'}):
            self.assertEqual(h.remote_timeout(), 8.0)
        for bad in ('x', '0', '99'):
            with patch.dict(os.environ, {'DENTCAST_GIT_REMOTE_TIMEOUT': bad}):
                self.assertEqual(h.remote_timeout(), 15.0)
        calls = []
        real = h.git

        def spy(root, *args, **kw):
            if args and args[0] == 'ls-remote':
                calls.append(kw.get('timeout'))
            return real(root, *args, **kw)
        with patch.dict(os.environ, {'DENTCAST_GIT_REMOTE_TIMEOUT': '3'}), patch.object(h, 'git', spy):
            h.remote_observation(self.root, h.text_git(self.root, 'rev-parse', 'HEAD'), 'main', True)
        self.assertEqual(calls, [3.0])

    # Bug 3 -----------------------------------------------------------------
    def test_first_cut_step_requires_lead_provenance(self):
        sha = self.walk(self.start(), 'C.4.8')
        state, _ = h.load_state(self.root)
        state['publication']['context']['decisions'] = [
            d for d in state['publication']['context']['decisions']
            if d.get('kind') != 'first_cut_lead_provenance_v1']
        sha = h.write_atomic(self.root, state)
        sha = lc.step(self.root, sha, 'C.4.9', 'started', [], None)['sha256']
        self.assert_blocked('FIRST_CUT_DECLARATION_REQUIRED', lc.step, self.root, sha, 'C.4.9',
                            'completed', ['fixture:linking'], None)
        result = lc.advance(self.root, sha, 'C.4.9', ['fixture:linking'])
        self.assertEqual(result['status'], 'blocked')
        self.assertIn('FIRST_CUT_DECLARATION_REQUIRED', result['error'])
        self.assertEqual(h.load_state(self.root)[1], sha)

    # Bug 4 -----------------------------------------------------------------
    def test_content_id_form_is_checked_at_bind_and_paper_only_is_exempt(self):
        for good in ('insight/insight-99', 'litecast/lite-CAST42', 'dentai/promptologist/prompt-append2-6',
                     'plak-sefr/plak1-10'):
            h.require_content_id({'content_id': good, 'category': 'insight'})
        for bad in ('note', 'insight/', '/insight/x', 'insight/x.html', 'insight//x', 'Insight/x'):
            with self.subTest(bad=bad):
                self.assert_blocked('CONTENT_ID_INVALID', h.require_content_id,
                                    {'content_id': bad, 'category': 'insight'})
        h.require_content_id({'content_id': 'P0001', 'category': 'paper-only'})
        h.require_content_id({'content_id': 'unassigned', 'category': 'pending'})
        self.prepare()
        state, _ = h.load_state(self.root)
        state['publication'].update(content_id='unassigned', category='pending')
        sha = h.write_atomic(self.root, state)
        self.assert_blocked('CONTENT_ID_INVALID', lc.bind, self.root, sha, 'note', 'insight',
                            ['note.html'], 'fixture:intake')
        self.assertEqual(lc.bind(self.root, sha, 'P0001', 'paper-only', ['note.html'],
                                 'fixture:intake')['status'], 'checkpoint_written')

    # Bug 5 -----------------------------------------------------------------
    def test_shallow_clone_names_the_deepen_command(self):
        self.prepare()
        self.deliver_checkpoint()
        shallow = self.clone('shallow', '--depth', '1')
        with self.assertRaises(h.Blocked) as caught:
            h.inspect(shallow)
        self.assertIn('SHALLOW_CLONE_DEEPEN_REQUIRED', str(caught.exception))
        self.assertIn('git fetch --deepen', str(caught.exception))
        run(shallow, 'fetch', '-q', '--deepen=1')
        self.assertFalse(any(i.startswith('UNREVIEWED_COMMITTED_PATHS')
                             for i in h.inspect(shallow)['issues']))

    # Bug 6 -----------------------------------------------------------------
    def test_plan_warns_when_the_tool_is_older_than_origin_main(self):
        self.prepare()
        run(self.root, 'push', '-q', 'origin', 'main')
        cli = lambda: json.loads(subprocess.run(
            [sys.executable, str(self.root/'tools/dentcast_publish_handoff.py'), '--repo', str(self.root), 'plan'],
            capture_output=True, text=True, check=True).stdout)
        self.assertNotIn('warnings', cli())
        tool = self.root/'tools/dentcast_publish_lifecycle.py'
        tool.write_text(tool.read_text() + '\n# newer tool on main\n')
        run(self.root, 'commit', '-qam', 'main: newer tool')
        run(self.root, 'push', '-q', 'origin', 'main')
        run(self.root, 'reset', '-q', '--hard', 'HEAD~1')  # stale local main
        warnings = cli()['warnings']
        self.assertTrue(warnings[0].startswith('TOOL_OLDER_THAN_ORIGIN_MAIN'))
        # A publication branch with its own commits, started from origin/main: no warning.
        run(self.root, 'switch', '-q', '-c', 'publication', 'origin/main')
        run(self.root, 'commit', '-q', '--allow-empty', '-m', 'publication work')
        self.assertNotIn('warnings', cli())

    # Bug 7 -----------------------------------------------------------------
    def test_merge_gate_ignores_main_side_changes_but_not_the_prs_own(self):
        self.p['target_paths'].append('dentcast-brain.json')
        self.complete_three()
        delivered = h.text_git(self.root, 'rev-parse', 'HEAD')
        run(self.root, 'branch', 'publication')
        # Destination main: another publication changed a shared file meanwhile.
        run(self.root, 'switch', '-q', '-c', 'dest', self.baseline)
        (self.root/'dentcast-brain.json').write_text('[{"id": "other-publication"}]')
        run(self.root, 'commit', '-qam', 'main: another publication')
        run(self.root, 'merge', '-q', '--no-ff', '--no-edit', 'publication')  # synthetic PR merge
        self.assertEqual(merge.verify_publication_history(self.root, self.baseline, []), {'note'})
        # Strict for the PR's own change after its delivery.
        run(self.root, 'switch', '-q', 'publication')
        (self.root/'dentcast-brain.json').write_text('[{"id": "edited-after-delivery"}]')
        run(self.root, 'commit', '-qam', 'pr: edit after delivery 3')
        run(self.root, 'switch', '-q', '-c', 'merge2', 'dest')
        run(self.root, 'reset', '-q', '--hard', 'HEAD^1')
        merged = subprocess.run(['git', '-C', str(self.root), 'merge', '-q', '--no-ff', '--no-edit', 'publication'],
                                capture_output=True, text=True)
        if merged.returncode:  # both sides changed the shared file: take the PR's bytes
            (self.root/'dentcast-brain.json').write_text('[{"id": "edited-after-delivery"}]')
            run(self.root, 'add', 'dentcast-brain.json')
            run(self.root, 'commit', '-q', '--no-edit')
        self.assertEqual(h.text_git(self.root, 'rev-parse', 'HEAD^2^'), delivered)
        self.assert_blocked('FINAL_RECEIPT_FILE_MISMATCH:dentcast-brain.json',
                            merge.verify_publication_history, self.root, self.baseline, [])

    def test_receipt_workflow_inventory_comes_from_the_delivery_commit(self):
        report = self.complete_three()
        delivered = h.text_git(self.root, 'rev-parse', 'HEAD')
        data = h.decode_json((self.root/report).read_text())
        newer = h.WORKFLOW_PATHS + ('.dentcast/workflows/new-rule-added-on-main.md',)
        with patch.object(h, 'WORKFLOW_PATHS', newer):
            self.assertEqual(lc.validate_final_receipt(self.root, data, delivered), 'note')
            self.assert_blocked('INCOMPLETE_FINAL_FINGERPRINTS', lc.validate_final_receipt, self.root, data)


if __name__ == '__main__':
    unittest.main()
