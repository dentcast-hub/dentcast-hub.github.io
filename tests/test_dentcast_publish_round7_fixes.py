"""Round 7 regressions: cross-checkout continuation (stale checkout, run moved to a new branch)."""
import copy
import json
import subprocess
import unittest
from pathlib import Path

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

run = lifecycle_fixtures.run
ROOT = Path(__file__).resolve().parents[1]


class CrossCheckoutTests(unittest.TestCase):
    setUp = lifecycle_fixtures.LifecycleTests.setUp
    prepare = lifecycle_fixtures.LifecycleTests.prepare
    deliver = lifecycle_fixtures.LifecycleTests.deliver
    assert_blocked = lifecycle_fixtures.LifecycleTests.assert_blocked

    def resolved_rules(self):
        initial = self.prepare()
        started = lc.step(self.root, initial['sha256'], 'rules', 'started', [], None)
        return lc.step(self.root, started['sha256'], 'rules', 'completed', ['fixture:read rules'], None)

    def other_checkout_pushes(self):
        other = self.base / 'other'
        subprocess.run(['git', 'clone', '-q', str(self.remote), str(other)], check=True, capture_output=True)
        run(other, 'config', 'user.name', 'Other'); run(other, 'config', 'user.email', 'o@example.invalid')
        (other / 'other.txt').write_text('continued elsewhere\n')
        run(other, 'add', 'other.txt'); run(other, 'commit', '-m', 'other checkout continued')
        run(other, 'push', 'origin', 'main')

    def test_stale_checkout_is_detected_before_a_diverging_cut_commit(self):
        self.resolved_rules()
        self.deliver()
        self.assertIsNone(lc.stale_checkout(self.root))
        self.other_checkout_pushes()
        stale = lc.stale_checkout(self.root)
        self.assertTrue(stale.startswith('REMOTE_BRANCH_MOVED_STALE_CHECKOUT: origin/main'), stale)
        self.assertIn('Stale checkout after a switch', stale)
        # Fetched but still behind: the same refusal.
        run(self.root, 'fetch', 'origin')
        self.assertIn('REMOTE_BRANCH_MOVED_STALE_CHECKOUT', lc.stale_checkout(self.root))
        run(self.root, 'pull', '--ff-only')
        self.assertIsNone(lc.stale_checkout(self.root))

    def test_local_unpushed_commit_alone_is_not_stale(self):
        self.resolved_rules()
        self.deliver()
        (self.root / 'local.txt').write_text('x\n')
        run(self.root, 'add', 'local.txt'); run(self.root, 'commit', '-m', 'local only')
        self.assertIsNone(lc.stale_checkout(self.root))

    def test_paper_final_stage_delivery_refuses_stale_checkout(self):
        initial = self.prepare(complete=True, paper=True)
        self.other_checkout_pushes()
        self.assert_blocked('REMOTE_BRANCH_MOVED_STALE_CHECKOUT', lc.stage_delivery, self.root,
                            initial['sha256'], ['dentcast_cabinet_full_catalog.json'])

    def test_run_moved_to_a_new_branch_names_the_delivered_branch(self):
        self.resolved_rules()
        run(self.root, 'add', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'checkpoint')
        run(self.root, 'push', 'origin', 'HEAD:refs/heads/pub/note')
        # Receiving cloud session copied the delivered commit onto its own new branch.
        run(self.root, 'switch', '-q', '-c', 'ccr-abc123')
        self.assert_blocked('DELIVERED_CUT_IS_ON_ANOTHER_BRANCH: origin/pub/note', lc.guard, self.root, 'stop')
        stop = subprocess.run(['python3', str(ROOT / 'scripts/publishing-stop-guard.py')], cwd=self.root,
                              input=json.dumps({'cwd': str(self.root)}), capture_output=True, text=True)
        reason = json.loads(stop.stdout)['reason']
        self.assertIn('git switch --track origin/pub/note', reason)
        self.assertNotIn('stage-delivery', reason)
        # On the delivered branch itself the stop is allowed.
        run(self.root, 'switch', '-q', '-c', 'pub/note', '--track', 'origin/pub/note')
        self.assertEqual(lc.guard(self.root, 'stop')['status'], 'guard_passed')

    def test_unreachable_origin_names_the_cause_not_a_recommit(self):
        self.resolved_rules()
        self.deliver()
        self.remote.rename(self.base / 'offline.git')
        with self.assertRaises(h.Blocked) as ctx:
            lc.guard(self.root, 'stop')
        self.assertTrue(str(ctx.exception).startswith('PREVIOUS_STEP_PUSH_NOT_CONFIRMED: origin/main could not be read'))
        self.assertIn('never commit again', str(ctx.exception))


class RecoveryAdviceTests(unittest.TestCase):
    def test_missing_handoff_advice_points_explicit_recovery_to_discovery(self):
        p = subprocess.run(['python3', str(ROOT / 'tools/dentcast_publish_handoff.py'), '--repo', str(ROOT), 'inspect'],
                           capture_output=True, text=True)
        if (ROOT / h.STATE_PATH).exists():
            self.skipTest('active handoff in this checkout')
        out = json.loads(p.stderr)
        self.assertEqual(out['error'], 'HANDOFF_MISSING')
        self.assertIn('does not authorize branch discovery', out['next_action'])
        self.assertIn('discover --recover-incomplete', out['next_action'])

    def test_docs_name_single_branch_retrieval_and_stale_checkout(self):
        discovery = (ROOT / '.dentcast/workflows/publish-discovery.md').read_text(encoding='utf-8')
        self.assertIn('git remote set-branches --add origin <branch>', discovery)
        self.assertIn('ccr-*', discovery)
        handoff = (ROOT / '.dentcast/workflows/publish-handoff.md').read_text(encoding='utf-8')
        self.assertIn('**Stale checkout after a switch.**', handoff)
        self.assertIn('DELIVERED_CUT_IS_ON_ANOTHER_BRANCH', handoff)


if __name__ == '__main__':
    unittest.main()
