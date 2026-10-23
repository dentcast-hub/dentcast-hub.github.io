"""Synthetic metadata tests; no external action or publication is performed."""
import copy
import json
from pathlib import Path
import sys
import unittest
import test_dentcast_publish_three_deliveries as three

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_publish_handoff as h
import dentcast_connected_state as c
import dentcast_connected_first_push as fp
from test_dentcast_publish_connected_state import (
    fresh, step_sequence, workflow, HEAD, PAGE, IMAGE, BODY, WEBP)
from test_dentcast_publish_connected_wire import node
from test_dentcast_connected_first_push import FakeGitHub


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


def record(s, actions, context=None):
    return c.update_context(s, c.cas(s),
                            context=context or s["state"]["publication"]["context"],
                            external_actions=actions, review_note="fixture:reviewed-service-outcome")


def recovered():
    s = fresh()
    s = record(s, [action("attempt-1", "started")])
    s = record(s, [action("attempt-1", "failed")])
    # The failure can be repaired at the cut, without replaying any step.
    s = step_sequence(s)
    s = record(s, [action("attempt-1", "failed"), action("attempt-2", "started")])
    s = record(s, [action("attempt-1", "failed"), action("attempt-2", "completed")])
    context = copy.deepcopy(s["state"]["publication"]["context"])
    context["decisions"].append(receipt())
    return record(s, s["state"]["publication"]["external_actions"], context)


class ExternalReconciliationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = recovered()

    def routes(self, s, accepts):
        p = s["state"]["publication"]
        targets = {PAGE: BODY, IMAGE: WEBP}
        wire = h.render(s["state"]).encode()
        remote = FakeGitHub()
        calls = {
            "compiler": lambda: c.compile_cut1(
                s, c.cas(s), observed_branch="content/connected-fixture",
                observed_head=HEAD, observed_workflow_sources=workflow(), actual_targets=targets),
            "transport": lambda: fp.deliver(remote, "content/connected-fixture", HEAD,
                                           {**targets, h.STATE_PATH: wire}, 1024 * 1024),
            "receiver": lambda: c.receive_cut1(
                wire, branch="content/connected-fixture", target_bytes=targets,
                sha_by_path={k: c.digest(v) for k, v in targets.items()}),
        }
        for route, call in calls.items():
            with self.subTest(route=route):
                if accepts:
                    call()
                else:
                    with self.assertRaises(ValueError):
                        call()
        if not accepts:
            self.assertEqual(remote.updated, 0)
            self.assertEqual(remote.blobs, {})
        script = ("import {renderCut1,inspectCut1} from './tools/dentcast_connected_wire.mjs';"
                  "try{const w=renderCut1(JSON.parse(process.argv[1]));inspectCut1(w);"
                  "process.stdout.write(w)}catch(e){process.stdout.write('BLOCKED:'+e.message)}")
        result = node(script, p)
        if accepts:
            self.assertEqual(result.encode(), wire)
        else:
            self.assertTrue(result.startswith("BLOCKED:"), result[:100])

    def test_verified_retry_passes_all_routes_and_survives_roundtrip(self):
        s = copy.deepcopy(self.base)
        before = copy.deepcopy(s)
        self.routes(s, True)
        decoded, _ = h.parse_state(h.render(s["state"]).encode())
        self.assertEqual(decoded["publication"], s["state"]["publication"])
        self.assertEqual(s, before)
        self.assertEqual(decoded["publication"]["external_actions"][0], action("attempt-1", "failed"))
        with self.assertRaisesRegex(h.Blocked, "CUT_DELIVERY_REQUIRED"):
            c.update_step(s, c.cas(s), "C.4.10.1", "started")

    def test_invalid_or_missing_reconciliation_fails_every_route(self):
        cases = ["missing", "duplicate", "self", "missing_id", "wrong_target",
                 "wrong_receipt_target", "empty_evidence", "empty_reason",
                 "missing_verification", "unbound_verification", "extra_field",
                 "success_failed", "success_started", "success_unknown", "success_not_performed",
                 "source_unknown", "source_started", "source_completed", "reversed",
                 "unresolved_other", "unknown_other", "started_other"]
        for case in cases:
            with self.subTest(case=case):
                s = copy.deepcopy(self.base); p = s["state"]["publication"]
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
                self.routes(s, False)

    def test_multiple_failures_need_individual_receipts(self):
        s = copy.deepcopy(self.base)
        p = s["state"]["publication"]
        p["external_actions"].insert(1, action("attempt-middle", "failed"))
        self.routes(s, False)
        extra = receipt(); extra["failed_id"] = "attempt-middle"
        p["context"]["decisions"].append(extra)
        self.routes(s, True)

    def test_history_cannot_be_deleted_rewritten_or_reordered(self):
        old = self.base["state"]["publication"]
        for case in ("delete_failure", "rewrite_failure", "reorder", "delete_receipt", "rewrite_receipt"):
            with self.subTest(case=case):
                new = copy.deepcopy(old)
                if case == "delete_failure": new["external_actions"].pop(0)
                elif case == "rewrite_failure": new["external_actions"][0]["evidence"].append("changed")
                elif case == "reorder": new["external_actions"].reverse()
                elif case == "delete_receipt": new["context"]["decisions"].pop()
                else: new["context"]["decisions"][-1]["reason"] = "rewritten"
                with self.assertRaises(h.Blocked): h.preserve_actions(old, new)
                with self.assertRaises(h.Blocked):
                    record(self.base, new["external_actions"], new["context"])

    def test_unknown_or_started_attempt_cannot_be_retried_even_with_combined_resolution(self):
        for status in ("started", "outcome_unknown"):
            for resolve_together in (False, True):
                with self.subTest(status=status, combined=resolve_together):
                    s = record(fresh(), [action("attempt-1", status)])
                    actions = [action("attempt-1", "failed" if resolve_together else status),
                               action("attempt-2", "started")]
                    with self.assertRaisesRegex(h.Blocked, "UNKNOWN_DO_NOT_RETRY"):
                        record(s, actions)
                    # First reconcile the actual old outcome in a separate write.
                    s = record(s, [action("attempt-1", "failed")])
                    record(s, [action("attempt-1", "failed"), action("attempt-2", "started")])

    def test_retry_must_start_before_completion_and_cannot_batch_parallel_retries(self):
        s = record(fresh(), [action("attempt-1", "failed")])
        with self.assertRaisesRegex(h.Blocked, "RETRY_MUST_START_FIRST"):
            record(s, [action("attempt-1", "failed"), action("attempt-2", "completed")])
        with self.assertRaisesRegex(h.Blocked, "UNKNOWN_DO_NOT_RETRY"):
            record(s, [action("attempt-1", "failed"), action("attempt-2", "started"),
                       action("attempt-3", "started")])

    def test_retry_receipt_does_not_bypass_other_gates_or_stale_digest(self):
        for case in ("question", "approval", "blocker"):
            with self.subTest(case=case):
                s = copy.deepcopy(self.base); p = s["state"]["publication"]
                if case == "question": p["context"]["pending_questions"].append("fixture:unanswered")
                elif case == "blocker": p["blocker"] = "fixture:blocker"
                else: p["context"]["approvals"].append({"scope": "fixture:approval", "status": "rejected", "decision": "no", "evidence": ["fixture:no"]})
                self.routes(s, False)
        p = self.base["state"]["publication"]
        with self.assertRaisesRegex(h.Blocked, "STALE_CONNECTED_STATE"):
            c.update_context(self.base, "0"*64, context=p["context"], external_actions=p["external_actions"], review_note="fixture:review")
        with self.assertRaisesRegex(h.Blocked, "CUT_EXTERNAL_RECOVERY_ONLY"):
            record(self.base, p["external_actions"] + [action("unrelated", "started", "other")])
        context = copy.deepcopy(p["context"]); context["inputs"].append("changed")
        with self.assertRaisesRegex(h.Blocked, "CUT_DELIVERY_REQUIRED"):
            record(self.base, p["external_actions"], context)


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
