"""No-checkout contract parity: connected compiler reuses canonical source rules."""
import copy
import hashlib
import unittest
from unittest.mock import patch
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_connected_state as c
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

HEAD = "a" * 40
PAGE = "insight/insight-connected-fixture.html"
IMAGE = "insight/images/connected-fixture.webp"
WEBP = bytes.fromhex("524946460c0000005745425056503820")  # synthetic file bytes: transport fixture only
BODY = b"<!doctype html><html><body>Fixture: NOT published</body></html>"


def workflow():
    return {name: hashlib.sha256(("fixture:" + name).encode()).hexdigest()
            for name in h.WORKFLOW_PATHS}


def fresh():
    return c.start(content_id="insight/insight-connected-fixture",
                   category="insight", target_paths=[PAGE, IMAGE],
                   repository=c.REPO, branch="content/connected-fixture",
                   base_head=HEAD, workflow_sources=workflow(),
                   inputs=["fixture:public-safe-input-reference"])


def step_sequence(obj, until="C.4.9"):
    # Deliberately synthetic receipts: proves structural preservation ONLY.
    for item in lc.plan():
        obj = c.update_step(obj, c.cas(obj), item["id"], "started")
        obj = c.update_step(obj, c.cas(obj), item["id"], "completed",
                            evidence=["fixture:synthetic:" + item["id"]])
        if item["id"] == until:
            break
    return obj


class ConnectedTests(unittest.TestCase):
    def test_exact_v3_wire_roundtrip_and_no_git_dependency(self):
        with patch.object(h, "git", side_effect=AssertionError("GIT_CALLED")), \
             patch.object(h, "snapshot", side_effect=AssertionError("SCAN_CALLED")):
            session = step_sequence(fresh())
            self.assertEqual(lc.delivery_boundary(session["state"]["publication"]), 1)
            out = c.compile_cut1(session, c.cas(session),
                                 observed_branch="content/connected-fixture",
                                 observed_head=HEAD,
                                 observed_workflow_sources=workflow(),
                                 actual_targets={PAGE: BODY, IMAGE: WEBP})
            state, d = h.parse_state(out["handoff_bytes"])
        self.assertEqual(out["sha256"], d)
        self.assertEqual(out["next_step"], "C.4.10.1")
        self.assertEqual(state["schema"], h.SCHEMA)
        self.assertEqual(state["publication"]["steps"],
                         session["state"]["publication"]["steps"])
        self.assertEqual(out["handoff_bytes"], h.render(session["state"]).encode())
        self.assertNotIn(b"private transcript", out["handoff_bytes"])

    def test_explicit_started_and_evidence_not_inferred(self):
        s = fresh()
        with self.assertRaisesRegex(h.Blocked, "CONNECTED_COMPLETION_REQUIRES"):
            c.update_step(s, c.cas(s), "rules", "completed", evidence=["invented"])
        with self.assertRaisesRegex(h.Blocked, "CONNECTED_SKIP_REQUIRES"):
            c.update_step(s, c.cas(s), "rules", "skipped", reason="unnecessary")
        before = c.cas(s)
        next_state = c.update_step(s, before, "rules", "started")
        with self.assertRaisesRegex(h.Blocked, "STALE_CONNECTED_STATE"):
            c.update_step(next_state, before, "rules", "completed",
                          evidence=["fixture:receipt"])
        self.assertEqual(s["state"]["publication"]["steps"][0]["status"], "pending")
        self.assertEqual(next_state["state"]["publication"]["steps"][0]["status"],
                         "started")

    def test_incomplete_cut_and_source_head_drift_rejected(self):
        s = fresh()
        with self.assertRaisesRegex(h.Blocked, "CANONICAL_FIRST_CUT_NOT_READY"):
            c.compile_cut1(s, c.cas(s), observed_branch="content/connected-fixture",
                           observed_head=HEAD, observed_workflow_sources=workflow(),
                           actual_targets={PAGE: BODY, IMAGE: WEBP})
        s = step_sequence(s)
        with self.assertRaisesRegex(h.Blocked, "CONNECTED_SOURCES_OR_HEAD_CHANGED"):
            c.compile_cut1(s, c.cas(s), observed_branch="content/connected-fixture",
                           observed_head="b"*40, observed_workflow_sources=workflow(),
                           actual_targets={PAGE: BODY, IMAGE: WEBP})
        changed = workflow()
        first = next(iter(changed))
        changed[first] = "f"*64
        with self.assertRaisesRegex(h.Blocked, "CONNECTED_SOURCES_OR_HEAD_CHANGED"):
            c.compile_cut1(s, c.cas(s), observed_branch="content/connected-fixture",
                           observed_head=HEAD, observed_workflow_sources=changed,
                           actual_targets={PAGE: BODY, IMAGE: WEBP})

    def test_exact_target_inventory_no_gaps_or_extras(self):
        s = step_sequence(fresh())
        common = {"observed_branch": "content/connected-fixture",
                  "observed_head": HEAD, "observed_workflow_sources": workflow()}
        with self.assertRaisesRegex(h.Blocked, "ALL_DECLARED_TARGET_BYTES_REQUIRED"):
            c.compile_cut1(s, c.cas(s), **common, actual_targets={PAGE: BODY})
        with self.assertRaisesRegex(h.Blocked, "UNREVIEWED_FILE_SCOPE"):
            c.compile_cut1(s, c.cas(s), **common,
                           actual_targets={PAGE: BODY, IMAGE: WEBP,
                                           "secret.txt": b"private"})
        out = c.compile_cut1(s, c.cas(s), **common,
                             actual_targets={PAGE: BODY, IMAGE: WEBP})
        accepted = c.receive_cut1(
            out["handoff_bytes"], branch="content/connected-fixture",
            sha_by_path=out["target_sha256"], target_bytes={PAGE: BODY, IMAGE: WEBP})
        self.assertEqual(accepted["status"], "cut1_wire_and_bytes_verified")
        with self.assertRaisesRegex(h.Blocked, "RECEIVED_TARGET_BYTES_MISMATCH"):
            c.receive_cut1(out["handoff_bytes"], branch="content/connected-fixture",
                           sha_by_path=out["target_sha256"],
                           target_bytes={PAGE: BODY, IMAGE: b"tampered"})

    def test_confirmed_approval_history_and_unknown_external_outcome(self):
        s = fresh()
        p = s["state"]["publication"]
        context = copy.deepcopy(p["context"])
        context["approvals"].append({
            "scope": "fixture:opening", "decision": "approved first paragraph",
            "status": "confirmed", "evidence": ["fixture:user-approval"]})
        s = c.update_context(s, c.cas(s), context=context, external_actions=[],
                             review_note="fixture:explicit written approval")
        bad = copy.deepcopy(s["state"]["publication"]["context"])
        bad["approvals"] = []
        with self.assertRaisesRegex(h.Blocked, "APPROVAL_HISTORY_CANNOT_BE_DROPPED"):
            c.update_context(s, c.cas(s), context=bad, external_actions=[],
                             review_note="fixture:attempt removal")
        actions = [{"id":"fixture-drive", "target":"drive:fixture-file",
                    "status":"outcome_unknown", "evidence":[]}]
        s = c.update_context(s, c.cas(s), context=context, external_actions=actions,
                             review_note="fixture:upload outcome not observed")
        with self.assertRaisesRegex(h.Blocked, "EXTERNAL_ACTION_OUTCOME_UNKNOWN"):
            c.update_step(s, c.cas(s), "rules", "started")

    def test_enroll_target_explicit_and_blocks_unreviewed(self):
        s = fresh()
        with self.assertRaisesRegex(h.Blocked, "CONNECTED_PATH_REVIEW_REQUIRED"):
            c.enroll_target(s, c.cas(s), "insight/other.webp", "")
        added = c.enroll_target(s, c.cas(s), "insight/other.webp",
                                "fixture:reviewed-asset")
        self.assertIn("insight/other.webp",
                      added["state"]["publication"]["target_paths"])
        self.assertNotIn("insight/other.webp",
                         s["state"]["publication"]["target_paths"])

    def test_inputs_cannot_be_silently_rebound(self):
        s = fresh()
        p = s["state"]["publication"]
        bad = copy.deepcopy(p["context"])
        bad["inputs"] = ["another input, invalidates evidence"]
        with self.assertRaisesRegex(h.Blocked, "INPUT_CHANGED_INVALIDATE"):
            c.update_context(s, c.cas(s), context=bad, external_actions=[],
                             review_note="fixture:bad change")

    def test_no_step_past_first_cut_even_with_status_claim(self):
        s = step_sequence(fresh())
        with self.assertRaisesRegex(h.Blocked, "CUT_DELIVERY_REQUIRED"):
            c.update_step(s, c.cas(s), "C.4.10.1", "started")

    def test_schema_and_workflow_inventory_must_be_complete(self):
        with self.assertRaisesRegex(h.Blocked, "CONNECTED_WORKFLOW_FINGERPRINTS"):
            c.start(content_id="insight/x",category="insight",target_paths=[PAGE],
                    repository=c.REPO,branch="content/fixture",base_head=HEAD,
                    workflow_sources={"fake":"a"*64})
        with self.assertRaisesRegex(h.Blocked, "CONNECTED_REPOSITORY_REF"):
            c.start(content_id="insight/x",category="insight",target_paths=[PAGE],
                    repository=c.REPO,branch="main",base_head=HEAD,
                    workflow_sources=workflow())


if __name__ == "__main__":
    unittest.main()
