"""Checkpoint transitions and delivery boundaries against local Git remotes."""
import copy
import unittest

import test_dentcast_publish_lifecycle as lifecycle_fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

run = lifecycle_fixtures.run


class StepDeliveryTests(unittest.TestCase):
    setUp = lifecycle_fixtures.LifecycleTests.setUp
    prepare = lifecycle_fixtures.LifecycleTests.prepare
    deliver = lifecycle_fixtures.LifecycleTests.deliver
    assert_blocked = lifecycle_fixtures.LifecycleTests.assert_blocked

    def resolved_rules(self):
        initial = self.prepare()
        started = lc.step(self.root, initial['sha256'], 'rules', 'started', [], None)
        return lc.step(self.root, started['sha256'], 'rules', 'completed', ['fixture:read rules'], None)

    def start_next(self, sha):
        return lc.step(self.root, sha, '0', 'started', [], None)

    def test_local_checkpoint_can_advance_without_micro_commit(self):
        done = self.resolved_rules()
        before = (self.root/h.STATE_PATH).read_bytes()
        result = self.start_next(done['sha256'])
        self.assertEqual(result['next_step'], '0')
        self.assertNotEqual((self.root/h.STATE_PATH).read_bytes(), before)

    def test_local_commit_without_push_can_advance(self):
        done = self.resolved_rules()
        run(self.root, 'add', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'local checkpoint')
        self.assertEqual(self.start_next(done['sha256'])['next_step'], '0')

    def test_pushed_exact_checkpoint_allows_next_step(self):
        done = self.resolved_rules()
        self.deliver()
        result = self.start_next(done['sha256'])
        self.assertEqual(result['next_step'], '0')
        state, _ = h.load_state(self.root)
        self.assertEqual(state['publication']['steps'][1]['status'], 'started')

    def test_stop_requires_current_checkpoint_delivered(self):
        self.resolved_rules()
        self.assert_blocked('PREVIOUS_STEP_PUSH_NOT_CONFIRMED', lc.guard, self.root, 'stop')
        self.deliver()
        self.assertEqual(lc.guard(self.root, 'stop')['status'], 'guard_passed')

    def test_remote_outage_does_not_block_local_step_progress(self):
        done = self.resolved_rules()
        self.deliver()
        # Same configured identity and cached upstream, genuinely unavailable remote.
        self.remote.rename(self.base/'offline.git')
        self.assertEqual(self.start_next(done['sha256'])['next_step'], '0')

    def test_completion_and_next_start_cannot_share_a_record(self):
        initial = self.prepare()
        started = lc.step(self.root, initial['sha256'], 'rules', 'started', [], None)
        state, _ = h.load_state(self.root)
        p = copy.deepcopy(state['publication'])
        p['steps'][0].update(status='completed', evidence=['fixture:read'])
        p['steps'][1].update(status='started')
        self.assert_blocked('START_NEXT_STEP_IN_SEPARATE_CHECKPOINT', h.save, self.root, p,
                            expected=started['sha256'])

    def test_new_local_handoff_can_advance_before_next_delivery_batch(self):
        self.resolved_rules()
        self.deliver()
        state, sha = h.load_state(self.root)
        state['publication']['context']['decisions'].append('fixture:new decision')
        latest = h.save(self.root, state['publication'], expected=sha)
        self.assertEqual(self.start_next(latest['sha256'])['next_step'], '0')

    def test_record_cannot_bypass_boundary_or_batch_steps(self):
        done = self.resolved_rules()
        state, _ = h.load_state(self.root)
        publication = copy.deepcopy(state['publication'])
        publication['steps'][1].update(status='skipped', reason='fixture:attempt bypass')
        self.assert_blocked('REQUIRED_CHECKPOINT_CANNOT_BE_SKIPPED', lc.require_plan, publication)
        publication['steps'][1].update(status='started', reason=None)
        result = h.save(self.root, publication, expected=done['sha256'])
        self.assertEqual(result['next_step'], '0')
        state, sha = h.load_state(self.root)
        publication = copy.deepcopy(state['publication'])
        publication['steps'][1].update(status='completed', evidence=['fixture:fake'])
        publication['steps'][2].update(status='started')
        self.assert_blocked('START_NEXT_STEP_IN_SEPARATE_CHECKPOINT', h.save, self.root, publication, expected=sha)

    def test_blocked_checkpoint_can_be_resolved_locally(self):
        done = self.resolved_rules()
        blocked = lc.step(self.root, done['sha256'], '0', 'blocked', [], 'fixture:cannot push')
        resumed = lc.step(self.root, blocked['sha256'], '0', 'started', [], None, 'Reviewed blocker')
        self.assertEqual(resumed['next_step'], '0')

    def test_uncommitted_work_is_not_covered_by_checkpoint_push(self):
        self.resolved_rules()
        self.deliver()
        (self.root/'note.html').write_text('new uncommitted work')
        state, sha = h.load_state(self.root)
        with self.assertRaisesRegex(h.Blocked, 'PREVIOUS_STEP_WORK_NOT_COMMITTED'):
            lc.require_step_delivery(self.root, state, sha)


if __name__ == '__main__':
    unittest.main()
