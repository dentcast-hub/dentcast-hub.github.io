"""Synthetic metadata tests; no external action or publication is performed.

The reconciliation validators are exercised directly (h.require_external_outcomes,
h.preserve_actions) and through the real local-Git delivery fixture below. The
GitHub-only connected cut-1 routes that used to carry these checks were retired
with cut 1 (2026-11-07).
"""
import copy
from pathlib import Path
import sys
import unittest
import test_dentcast_publish_three_deliveries as three

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_publish_handoff as h


def action(identifier, status, target="fixture:drive-paper"):
    return {"id": identifier, "status": status, "target": target,
            "evidence": [] if status in ("started", "outcome_unknown")
            else ["fixture:" + identifier + ":observed"]}


def receipt():
    return {"kind": h.EXTERNAL_RECONCILIATION, "failed_id": "attempt-1",
            "successful_id": "attempt-2", "target": "fixture:drive-paper",
            "reason": "Fixture: confirmed failure, explicit retry, verified destination",
            "verification_ref": "fixture:attempt-2:observed",
            "evidence": ["fixture:attempt-2:observed", "fixture:operator-review"]}


def recovered():
    return {"external_actions": [action("attempt-1", "failed"), action("attempt-2", "completed")],
            "context": {"decisions": [receipt()]}}


def bare(actions):
    return {"external_actions": actions, "context": {"decisions": []}}


class ExternalReconciliationTests(unittest.TestCase):
    def accepts(self, p, ok):
        if ok:
            h.require_external_outcomes(p)
        else:
            with self.assertRaises(h.Blocked):
                h.require_external_outcomes(p)

    def test_verified_retry_is_accepted(self):
        self.accepts(recovered(), True)
        self.accepts(bare([action("attempt-1", "failed"), action("attempt-2", "completed")]), False)

    def test_invalid_or_missing_reconciliation_is_refused(self):
        cases = ["missing", "duplicate", "self", "missing_id", "wrong_target",
                 "wrong_receipt_target", "empty_evidence", "empty_reason",
                 "missing_verification", "unbound_verification", "extra_field",
                 "success_failed", "success_started", "success_unknown", "success_not_performed",
                 "source_unknown", "source_started", "source_completed", "reversed",
                 "unresolved_other", "unknown_other", "started_other"]
        for case in cases:
            with self.subTest(case=case):
                p = recovered()
                r = p["context"]["decisions"][-1]
                if case == "missing": p["context"]["decisions"].pop()
                elif case == "duplicate": p["context"]["decisions"].append(copy.deepcopy(r))
                elif case == "self": r["successful_id"] = r["failed_id"]
                elif case == "missing_id": r["successful_id"] = "absent"
                elif case == "wrong_target": p["external_actions"][1]["target"] = "different"
                elif case == "wrong_receipt_target": r["target"] = "different"
                elif case == "empty_evidence": r["evidence"] = []
                elif case == "empty_reason": r["reason"] = " "
                elif case == "missing_verification": del r["verification_ref"]
                elif case == "unbound_verification": r["verification_ref"] = "unverified"
                elif case == "extra_field": r["waiver"] = True
                elif case.startswith("success_"):
                    p["external_actions"][1]["status"] = case.removeprefix("success_").replace("unknown", "outcome_unknown")
                elif case.startswith("source_"):
                    p["external_actions"][0]["status"] = case.removeprefix("source_").replace("unknown", "outcome_unknown")
                elif case == "reversed": p["external_actions"].reverse()
                else:
                    status = {"unresolved_other": "failed", "unknown_other": "outcome_unknown", "started_other": "started"}[case]
                    p["external_actions"].append(action("other", status, "fixture:other"))
                self.accepts(p, False)

    def test_multiple_failures_need_individual_receipts(self):
        p = recovered()
        p["external_actions"].insert(1, action("attempt-middle", "failed"))
        self.accepts(p, False)
        extra = receipt(); extra["failed_id"] = "attempt-middle"
        p["context"]["decisions"].append(extra)
        self.accepts(p, True)

    def test_history_cannot_be_deleted_rewritten_or_reordered(self):
        old = recovered()
        for case in ("delete_failure", "rewrite_failure", "reorder", "delete_receipt", "rewrite_receipt"):
            with self.subTest(case=case):
                new = copy.deepcopy(old)
                if case == "delete_failure": new["external_actions"].pop(0)
                elif case == "rewrite_failure": new["external_actions"][0]["evidence"].append("changed")
                elif case == "reorder": new["external_actions"].reverse()
                elif case == "delete_receipt": new["context"]["decisions"].pop()
                else: new["context"]["decisions"][-1]["reason"] = "rewritten"
                with self.assertRaises(h.Blocked): h.preserve_actions(old, new)

    def test_unknown_or_started_attempt_cannot_be_retried_even_with_combined_resolution(self):
        for status in ("started", "outcome_unknown"):
            for resolve_together in (False, True):
                with self.subTest(status=status, combined=resolve_together):
                    old = bare([action("attempt-1", status)])
                    new = bare([action("attempt-1", "failed" if resolve_together else status),
                                action("attempt-2", "started")])
                    with self.assertRaisesRegex(h.Blocked, "UNKNOWN_DO_NOT_RETRY"):
                        h.preserve_actions(old, new)
                    # First reconcile the actual old outcome in a separate write.
                    failed = bare([action("attempt-1", "failed")])
                    h.preserve_actions(old, failed)
                    h.preserve_actions(failed, bare([action("attempt-1", "failed"), action("attempt-2", "started")]))

    def test_retry_must_start_before_completion_and_cannot_batch_parallel_retries(self):
        old = bare([action("attempt-1", "failed")])
        with self.assertRaisesRegex(h.Blocked, "RETRY_MUST_START_FIRST"):
            h.preserve_actions(old, bare([action("attempt-1", "failed"), action("attempt-2", "completed")]))
        with self.assertRaisesRegex(h.Blocked, "UNKNOWN_DO_NOT_RETRY"):
            h.preserve_actions(old, bare([action("attempt-1", "failed"), action("attempt-2", "started"),
                                          action("attempt-3", "started")]))


class ReconciliationDeliveryTests(unittest.TestCase):
    # Reuse the real local-Git three-delivery fixture, not its other tests.
    setUp = three.ThreeDeliveriesTests.setUp
    assert_blocked = three.ThreeDeliveriesTests.assert_blocked
    prepare = three.ThreeDeliveriesTests.prepare
    walk = three.ThreeDeliveriesTests.walk
    deliver = three.ThreeDeliveriesTests.deliver
    complete_two = three.ThreeDeliveriesTests.complete_two
    prepare_final = three.ThreeDeliveriesTests.prepare_final

    def start(self):
        sha = three.ThreeDeliveriesTests.start(self)
        actions = []
        for status, new_attempt in (("started", False), ("failed", False),
                                    ("started", True), ("completed", True)):
            state, _ = h.load_state(self.root)
            if new_attempt:
                actions = [action("attempt-1", "failed"), action("attempt-2", status)]
            else:
                actions = [action("attempt-1", status)]
            state["publication"]["external_actions"] = actions
            sha = h.save(self.root, state["publication"], expected=sha,
                         note="fixture:verified external outcome")["sha256"]
        state, _ = h.load_state(self.root)
        state["publication"]["context"]["decisions"].append(receipt())
        return h.save(self.root, state["publication"], expected=sha,
                      note="fixture:explicit reconciliation")["sha256"]

    def test_preserved_failure_passes_three_deliveries_and_cold_final_validation(self):
        three.ThreeDeliveriesTests.test_exactly_three_deliveries_and_final_work_without_final_handoff(self)
        report = self.root / three.lc.completion_path({"content_id": "note"})
        data = h.decode_json(report.read_text())
        p = data["state"]["publication"]
        self.assertEqual(p["external_actions"][0], action("attempt-1", "failed"))
        self.assertIn(receipt(), p["context"]["decisions"])


if __name__ == "__main__":
    unittest.main()
