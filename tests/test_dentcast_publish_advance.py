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
