"""Round 4 regressions: record after a pushed cut, paper-only mid-run Stop."""
import copy
import unittest

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import test_dentcast_publish_three_deliveries as three
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

run = fixtures.run


class Round4Tests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare
    start = three.ThreeDeliveriesTests.start
    walk = three.ThreeDeliveriesTests.walk
    deliver = three.ThreeDeliveriesTests.deliver

    def test_record_after_pushed_cut_is_refused_before_it_strands_the_run(self):
        sha = self.walk(self.start(), 'C.4.9')
        self.deliver('delivery 1')
        state, sha = h.load_state(self.root)
        before = (self.root/h.STATE_PATH).read_bytes()
        p = copy.deepcopy(state['publication'])
        p['context']['decisions'].append({'kind': 'fixture', 'evidence': ['fixture:late note']})
        self.assert_blocked('RECORD_AFTER_DELIVERED_CUT_START_NEXT_STEP_FIRST', h.save, self.root, p,
                            expected=sha, note='late record')
        self.assertEqual((self.root/h.STATE_PATH).read_bytes(), before)
        self.assertEqual(lc.guard(self.root, 'stop')['status'], 'guard_passed')
        # The documented order: start the next step, then record.
        sha = lc.step(self.root, sha, 'C.4.10.1', 'started', [], None)['sha256']
        state, _ = h.load_state(self.root)
        p = copy.deepcopy(state['publication'])
        p['context']['decisions'].append({'kind': 'fixture', 'evidence': ['fixture:late note']})
        self.assertEqual(h.save(self.root, p, expected=sha, note='late record')['status'], 'checkpoint_written')
        self.assertEqual(lc.guard(self.root, 'stop')['status'], 'guard_passed')

    def test_record_at_cut_before_commit_and_audited_invalidation_stay_allowed(self):
        sha = self.walk(self.start(), 'C.4.9')
        state, sha = h.load_state(self.root)
        # Not yet committed: recording at the cut is ordinary.
        sha = h.save(self.root, state['publication'], expected=sha, note='pre-commit review')['sha256']
        self.deliver('delivery 1')
        state, sha = h.load_state(self.root)
        self.assertEqual(lc.invalidate(self.root, sha, 'C.2', 'fixture reviewed post-cut change')['status'],
                         'checkpoint_written')

    def test_paper_only_stop_allows_local_progress_and_blocks_undelivered_final(self):
        result = self.prepare(paper=True)
        sha = lc.step(self.root, result['sha256'], 'rules', 'started', [], None)['sha256']
        sha = lc.step(self.root, sha, 'rules', 'completed', ['fixture:rules'], None)['sha256']
        # Mid-run: one final delivery only, so no per-step push is required.
        self.assertEqual(lc.guard(self.root, 'stop')['status'], 'guard_passed')
        (self.root/'dentcast_cabinet_full_catalog.json').write_text('{"papers": []}')
        self.assert_blocked('CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP', lc.guard, self.root, 'stop')

    def test_paper_only_completed_final_handoff_must_be_delivered(self):
        self.prepare(complete=True, paper=True)
        self.assert_blocked('PREVIOUS_STEP_PUSH_NOT_CONFIRMED', lc.guard, self.root, 'stop')
        run(self.root, 'add', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'paper-only final handoff')
        run(self.root, 'push', 'origin', 'main')
        self.assertEqual(lc.guard(self.root, 'stop')['status'], 'guard_passed')


if __name__ == '__main__':
    unittest.main()
