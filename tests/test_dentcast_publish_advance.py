"""Exercise batching through the real checkpoint writer and temporary Git."""
import unittest
from unittest.mock import patch
import test_dentcast_publish_lifecycle as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

class AdvanceTests(unittest.TestCase):
    setUp = fixtures.LifecycleTests.setUp
    prepare = fixtures.LifecycleTests.prepare

    def test_complete_and_start_are_two_durable_writes(self):
        initial = self.prepare()
        begun = lc.step(self.root, initial['sha256'], 'rules', 'started', [], None)
        observed = []
        original = h.write_atomic
        def capture(root, state):
            observed.append([(r['id'], r['status']) for r in state['publication']['steps'][:2]])
            return original(root, state)
        with patch.object(h, 'write_atomic', side_effect=capture):
            result = lc.advance(self.root, begun['sha256'], 'rules', ['fixture:rules-read'], start_next=True)
        self.assertEqual(observed, [[('rules', 'completed'), ('0', 'pending')], [('rules', 'completed'), ('0', 'started')]])
        self.assertFalse(result['publication_completed'])

    def test_cannot_complete_unstarted_work(self):
        initial = self.prepare()
        with self.assertRaisesRegex(h.Blocked, 'STEP_MUST_BE_STARTED'):
            lc.advance(self.root, initial['sha256'], 'rules', ['fixture'])

    def test_invalid_skip_preflight_writes_nothing(self):
        initial = self.prepare()
        raw = (self.root / h.STATE_PATH).read_bytes()
        with self.assertRaises(h.Blocked):
            lc.advance(self.root, initial['sha256'], skips=[('rules', 'invalid exemption')])
        self.assertEqual(raw, (self.root / h.STATE_PATH).read_bytes())

    def test_missing_evidence_rejected_before_write(self):
        initial = self.prepare()
        begun = lc.step(self.root, initial['sha256'], 'rules', 'started', [], None)
        with self.assertRaisesRegex(h.Blocked, 'COMPLETION_EVIDENCE_REQUIRED'):
            lc.advance(self.root, begun['sha256'], 'rules', [])

    def test_stale_digest_rejected(self):
        self.prepare()
        with self.assertRaisesRegex(h.Blocked, 'STALE_HANDOFF_WRITE'):
            lc.advance(self.root, 'stale', start_next=True)

    def test_interruption_preserves_first_write(self):
        initial = self.prepare()
        begun = lc.step(self.root, initial['sha256'], 'rules', 'started', [], None)
        original = lc.step
        def interrupt(root, digest, sid, status, *args):
            if sid == '0':
                raise OSError('simulated interruption')
            return original(root, digest, sid, status, *args)
        with patch.object(lc, 'step', side_effect=interrupt):
            result = lc.advance(self.root, begun['sha256'], 'rules', ['fixture'], start_next=True)
        self.assertEqual(result['status'], 'blocked')
        self.assertEqual(result['transitions_written'], [{'id': 'rules', 'status': 'completed'}])
        state, digest = h.load_state(self.root)
        self.assertEqual(digest, result['sha256'])
        self.assertEqual(h.next_step(state['publication']), '0')

    def test_consecutive_skips_keep_individual_reasons(self):
        initial = self.prepare()
        state, _ = h.load_state(self.root)
        for row in state['publication']['steps'][:2]:
            row.update(status='completed', evidence=['fixture:done'])
        digest = h.write_atomic(self.root, state)
        result = lc.advance(self.root, digest, skips=[('A', 'fixture:canonical A exception'), ('B.1', 'fixture:canonical B.1 exception')], start_next=True)
        self.assertEqual(len(result['transitions_written']), 3)
        state, _ = h.load_state(self.root)
        self.assertEqual(state['publication']['steps'][2]['reason'], 'fixture:canonical A exception')
        self.assertEqual(state['publication']['steps'][4]['status'], 'started')

    def bare_started_a(self):
        self.prepare()
        state, _ = h.load_state(self.root)
        for row in state['publication']['steps'][:2]:
            row.update(status='completed', evidence=['fixture:done'])
        digest = h.write_atomic(self.root, state)
        return lc.advance(self.root, digest, start_next=True)['sha256']

    def test_skip_row_that_start_next_opened(self):
        digest = self.bare_started_a()
        result = lc.advance(self.root, digest, skips=[('A', 'fixture:canonical A exception')], start_next=True)
        self.assertEqual(result['transitions_written'], [{'id': 'A', 'status': 'skipped'}, {'id': 'B.1', 'status': 'started'}])
        state, _ = h.load_state(self.root)
        self.assertEqual(state['publication']['steps'][2]['reason'], 'fixture:canonical A exception')

    def test_started_row_with_drift_or_evidence_still_rejected(self):
        digest = self.bare_started_a()
        (self.root / 'note.html').write_text('work done during A\n')
        raw = (self.root / h.STATE_PATH).read_bytes()
        with self.assertRaisesRegex(h.Blocked, 'ONLY_PENDING_STEPS_CAN_BE_BATCH_SKIPPED'):
            lc.advance(self.root, digest, skips=[('A', 'fixture:exception')])
        self.assertEqual(raw, (self.root / h.STATE_PATH).read_bytes())
        (self.root / 'note.html').write_text('original\n')
        state, _ = h.load_state(self.root)
        state['publication']['steps'][2]['evidence'] = ['fixture:partial-work']
        digest = h.write_atomic(self.root, state)
        with self.assertRaisesRegex(h.Blocked, 'ONLY_PENDING_STEPS_CAN_BE_BATCH_SKIPPED'):
            lc.advance(self.root, digest, skips=[('A', 'fixture:exception')])

    def test_started_row_skip_keeps_external_outcome_guard(self):
        digest = self.bare_started_a()
        state, _ = h.load_state(self.root)
        # Attributed to another step, so only the in-flight outcome can block.
        state['publication']['external_actions'] = [{'id': 'C.4.10.1:upload', 'target': 'fixture', 'status': 'outcome_unknown', 'evidence': []}]
        digest = h.write_atomic(self.root, state)
        with self.assertRaisesRegex(h.Blocked, 'EXTERNAL_OUTCOME_UNKNOWN'):
            lc.advance(self.root, digest, skips=[('A', 'fixture:exception')])

    def with_action(self, digest, action_id):
        state, _ = h.load_state(self.root)
        state['publication']['external_actions'] = [
            {'id': action_id, 'target': 'drive:fixture', 'status': 'completed', 'evidence': ['fixture:observed']}]
        return h.write_atomic(self.root, state)

    def test_started_row_with_its_own_external_action_is_not_batch_skipped(self):
        for action_id in ('A:drive-upload', 'drive-upload-without-step-prefix'):
            with self.subTest(action=action_id):
                self.setUp()
                digest = self.with_action(self.bare_started_a(), action_id)
                with self.assertRaisesRegex(h.Blocked, 'ONLY_PENDING_STEPS_CAN_BE_BATCH_SKIPPED'):
                    lc.advance(self.root, digest, skips=[('A', 'fixture:exception')])

    def test_external_action_of_another_step_does_not_block_the_skip(self):
        digest = self.with_action(self.bare_started_a(), 'C.4.10.1:drive-move')
        result = lc.advance(self.root, digest, skips=[('A', 'fixture:exception')])
        self.assertEqual(result['transitions_written'], [{'id': 'A', 'status': 'skipped'}])

    def test_action_step_reads_only_real_ledger_prefixes(self):
        p = {'steps': lc.plan()}
        self.assertEqual(lc.action_step(p, {'id': 'C.4.10.1:drive-move'}), 'C.4.10.1')
        self.assertIsNone(lc.action_step(p, {'id': 'drive:abc'}))
        self.assertIsNone(lc.action_step(p, {'id': 'upload'}))

    def test_unknown_external_outcome_blocks_advance(self):
        initial = self.prepare()
        state, _ = h.load_state(self.root)
        state['publication']['external_actions'] = [{'id': 'upload', 'target': 'fixture', 'status': 'outcome_unknown', 'evidence': []}]
        digest = h.write_atomic(self.root, state)
        with self.assertRaisesRegex(h.Blocked, 'EXTERNAL_OUTCOME_UNKNOWN'):
            lc.advance(self.root, digest, start_next=True)

    def test_cli_dispatch_starts_only_requested_next_step(self):
        import io, json
        from contextlib import redirect_stdout
        initial = self.prepare()
        output = io.StringIO()
        with redirect_stdout(output):
            code = h.main(['--repo', str(self.root), 'advance', '--expected-sha256', initial['sha256'], '--start-next'])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(output.getvalue())['transitions_written'], [{'id': 'rules', 'status': 'started'}])

    def test_phase_f_cannot_be_completed_by_advance(self):
        self.prepare(complete=True)
        state, _ = h.load_state(self.root)
        for row in state['publication']['steps']:
            if row['id'] == 'F': row.update(status='started', evidence=[], reason=None)
            if row['id'] == 'G': row.update(status='pending', evidence=[], reason=None)
        digest = h.write_atomic(self.root, state)
        with self.assertRaisesRegex(h.Blocked, 'USE_REAL_VERIFY_FOR_PHASE_F'):
            lc.advance(self.root, digest, 'F', ['fake:pass'])

if __name__ == '__main__':
    unittest.main()
