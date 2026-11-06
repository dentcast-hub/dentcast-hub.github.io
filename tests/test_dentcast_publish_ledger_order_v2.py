"""Founder decision 2026-11-06: the v2 ledger order and the light post-Push-2 path.

Real local Git remotes; the verifier and semantic results are explicit
fixtures, not real scientific work.
"""
import copy
import subprocess
import unittest
from unittest.mock import patch

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import test_dentcast_publish_three_deliveries as three
import test_dentcast_publish_second_cut_editorial as editorial
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import check_publish_merge_gate as merge

run = fixtures.run


class LedgerOrderV2Tests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare
    walk = three.ThreeDeliveriesTests.walk
    deliver = three.ThreeDeliveriesTests.deliver

    def start_v2(self):
        """A new v2 run: v2 order (init marker), v2 cuts, frozen Phase F text."""
        (self.root/'dentcast-brain.json').write_text('[]')
        run(self.root, 'add', 'dentcast-brain.json')
        run(self.root, 'commit', '-m', 'fixture empty brain')
        self.p['category'] = 'litecast'  # English exempt: no mirror fixture needed
        self.prepare()
        state, sha = h.load_state(self.root)
        p = state['publication']
        self.assertTrue(lc.ledger_order_v2(p))
        p['context']['decisions'].extend([
            {'kind': lc.DELIVERY_POLICY}, {'kind': lc.DELIVERY_POLICY_V2},
            {'kind': 'first_cut_lead_provenance_v1', 'origin': 'not_applicable',
             'source_ref': 'fixture:page-already-has-prose',
             'evidence': ['fixture:synthetic-lead-origin-review']}])
        p['context']['decisions'].append(editorial.receipt(p))
        p['context']['approvals'] = [
            {'scope': 'title', 'status': 'confirmed', 'decision': 'fixture title',
             'evidence': ['fixture:title approved']},
            {'scope': 'caption', 'status': 'confirmed', 'decision': 'fixture caption',
             'evidence': ['fixture:caption approved']}]
        sha = h.save(self.root, p, expected=sha)['sha256']
        run(self.root, 'push', 'origin', 'main')
        self.baseline = h.text_git(self.root, 'rev-parse', 'HEAD')
        return sha

    def deliver_two_v2(self):
        sha = self.walk(self.start_v2(), 'C.4.9')
        ids = [s['id'] for s in h.load_state(self.root)[0]['publication']['steps']]
        # Cut 1 now carries the paper and DES/Fidelity checkpoints.
        self.assertLess(ids.index('C.4.13'), ids.index('C.4.9'))
        self.deliver('delivery 1')
        sha = self.walk(h.load_state(self.root)[1], 'C.6')
        self.assertEqual(lc.delivery_boundary(h.load_state(self.root)[0]['publication']), 2)
        self.deliver('delivery 2')
        return h.text_git(self.root, 'rev-parse', 'HEAD')

    def actions_delivers_third(self):
        """Delivery 3 made in another checkout, as post-cut2-mechanical.yml does."""
        push2 = self.deliver_two_v2()
        local = self.root
        self.root = self.base / 'actions-runner'
        subprocess.run(['git', 'clone', '-q', 'file://' + str(self.remote), str(self.root)],
                       check=True, capture_output=True)
        run(self.root, 'config', 'user.name', 'Fixture')
        run(self.root, 'config', 'user.email', 'fixture@example.invalid')
        try:
            state, sha = h.load_state(self.root)
            sha = self.walk(sha, 'G')
            state, _ = h.load_state(self.root)
            state['publication']['context']['delivery'] = [{'scope': 'fixture Action', 'evidence': ['fixture:run']}]
            sha = h.save(self.root, state['publication'], expected=sha)['sha256']
            lc.finish(self.root, sha)
            run(self.root, 'add', '-A', 'note.html', h.STATE_PATH, lc.completion_path({'content_id': 'note'}),
                lc.technical_report_path({'content_id': 'note', 'category': 'litecast'}))
            run(self.root, 'commit', '-m', 'delivery 3 by Actions')
            run(self.root, 'push', 'origin', 'main')
            self.assertTrue(lc.confirm_cleanup(self.root)['publication_completed'])
        finally:
            self.root = local
        return push2

    def test_new_order_run_delivers_three_and_confirm_trusts_the_committed_receipt(self):
        push2 = self.actions_delivers_third()
        run(self.root, 'pull', '-q', '--ff-only')
        self.assertFalse((self.root/h.STATE_PATH).exists())
        # No local Phase F rerun (and so no origin/main fetch) on the v2 path.
        with patch.object(lc, 'gate', side_effect=AssertionError('Phase F must not rerun')):
            result = lc.confirm_cleanup(self.root)
        self.assertTrue(result['publication_completed'])
        self.assertEqual(result['delivered_by'], 'remote_final_delivery')
        self.assertEqual(result['phase_f'], 'trusted_committed_receipt')
        self.assertEqual(result['second_delivery_commit'], push2)
        self.assertEqual(h.text_git(self.root, 'rev-parse', 'HEAD^'), push2)
        # The merge gate still reruns Phase F and accepts the v2-order receipt.
        self.assertEqual(merge.verify_publication_history(self.root, self.baseline, []), {'note'})

    def test_trusting_confirm_still_checks_fingerprints_and_the_parent(self):
        self.actions_delivers_third()
        run(self.root, 'pull', '-q', '--ff-only')
        with patch.object(lc, 'gate', side_effect=AssertionError('Phase F must not rerun')):
            (self.root/'note.html').write_text('edited after delivery 3\n')
            self.assert_blocked('FINAL_RECEIPT_FILE_MISMATCH:note.html', lc.confirm_cleanup, self.root)
            run(self.root, 'checkout', '--', 'note.html')
            run(self.root, 'commit', '--allow-empty', '-m', 'local only')
            self.assert_blocked('CLEANUP_RECORD_MISSING_OR_INVALID', lc.confirm_cleanup, self.root)

    def test_v1_remote_confirm_keeps_the_local_phase_f_rerun(self):
        # Legacy v1 runs (old order, cut 2 at C.4.13) keep the verifier rerun.
        r3 = __import__('test_dentcast_publish_round3_cursor').Round3CursorTests
        r3.actions_delivers_third(self)
        run(self.root, 'pull', '-q', '--ff-only')
        calls = []
        real = lc.gate
        with patch.object(lc, 'gate', side_effect=lambda *a, **k: calls.append(1) or real(*a, **k)):
            result = lc.confirm_cleanup(self.root)
        self.assertEqual(result['phase_f'], 'rerun_locally')
        self.assertTrue(calls)

    clone = __import__('test_dentcast_publish_round2_fixes').Round2Tests.clone
    complete_two = three.ThreeDeliveriesTests.complete_two
    start = three.ThreeDeliveriesTests.start

    def test_in_flight_old_order_handoff_continues_in_the_old_order(self):
        sha = self.start()
        p = h.load_state(self.root)[0]['publication']
        self.assertFalse(lc.ledger_order_v2(p))
        sha = self.walk(sha, 'C.4.9')
        self.assertEqual(h.next_step(h.load_state(self.root)[0]['publication']), 'C.4.10.1')
        self.deliver('delivery 1')
        self.walk(h.load_state(self.root)[1], 'C.4.13')
        self.assertEqual(lc.delivery_boundary(h.load_state(self.root)[0]['publication']), 2)


class StandingAcceptanceLeadTests(unittest.TestCase):
    def test_agent_lead_accepts_a_standing_acceptance_record_without_a_founder_reply(self):
        from dentcast_connected_cut_gates import validate_lead_provenance
        p = editorial.sample(category='insight', second='C.4.9')
        lead = next(d for d in p['context']['decisions'] if d.get('kind') == 'first_cut_lead_provenance_v1')
        lead.update(origin='agent_authored', source_ref='fixture:agent-lead')
        p['context']['approvals'].append({
            'scope': 'authored-intro', 'status': 'confirmed',
            'decision': 'agent-written lead accepted under the standing acceptance',
            'evidence': ['standing acceptance record (پذیرش ایستا) for agent-written leads']})
        validate_lead_provenance(p)
        lc.require_fixed_cut_readiness(p)
        # Still fail closed without any confirmed authored-intro record.
        p['context']['approvals'] = [a for a in p['context']['approvals'] if a['scope'] != 'authored-intro']
        with self.assertRaisesRegex(h.Blocked, 'AGENT_LEAD_EXPLICIT_FOUNDER_APPROVAL_REQUIRED'):
            validate_lead_provenance(p)


if __name__ == '__main__':
    unittest.main()
