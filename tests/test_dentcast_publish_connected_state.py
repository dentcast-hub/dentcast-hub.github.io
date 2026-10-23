"""No-checkout contract parity: connected compiler reuses canonical source rules."""
import base64
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
WEBP = base64.b64decode("UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=")
BODY = b"<!doctype html><html><body>Fixture: NOT published</body></html>"


def workflow():
    return {name: hashlib.sha256(("fixture:" + name).encode()).hexdigest()
            for name in h.WORKFLOW_PATHS}


def fresh():
    return c.start(content_id="insight/insight-connected-fixture",
                   category="insight", target_paths=[PAGE, IMAGE],
                   repository=c.REPO, branch="content/connected-fixture",
                   base_head=HEAD, workflow_sources=workflow(),
                   inputs=["fixture:public-safe-input-reference"],
                   decisions=[
                       {"kind": "first_cut_lead_provenance_v1",
                        "origin": "not_applicable", "source_ref": "fixture:no-lead",
                        "evidence": ["fixture:structural-only"]},
                       {"kind": "first_cut_scope_audit_v1",
                        "landing_path": "insight/index.html",
                        "landing_mode": "generated_later",
                        "builder_ref": "fixture:synthetic-builder",
                        "related_changed_paths": [],
                        "observed_changed_paths": [PAGE, IMAGE],
                        "evidence": ["fixture:synthetic-audit"]}])


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

    def test_first_cut_pending_or_rejected_approval_blocks_compiler(self):
        common = {"observed_branch": "content/connected-fixture",
                  "observed_head": HEAD, "observed_workflow_sources": workflow()}
        for status in ("pending", "rejected"):
            with self.subTest(status=status):
                s = step_sequence(fresh())
                p = s["state"]["publication"]
                p["context"]["approvals"].append({
                    "scope": "authored-intro", "status": status,
                    "decision": None if status == "pending" else "declined",
                    "evidence": [] if status == "pending" else ["fixture:declined"]})
                with self.assertRaisesRegex(h.Blocked, "FIRST_CUT_UNRESOLVED_APPROVAL"):
                    c.compile_cut1(s, c.cas(s), **common,
                                   actual_targets={PAGE: BODY, IMAGE: WEBP})

    def test_receive_cut1_blocks_pending_approval(self):
        s = step_sequence(fresh())
        s["state"]["publication"]["context"]["approvals"].append({
            "scope": "authored-intro", "status": "pending",
            "decision": None, "evidence": []})
        raw = h.render(s["state"]).encode()
        with self.assertRaisesRegex(h.Blocked, "RECEIVED_UNRESOLVED_APPROVAL"):
            c.receive_cut1(raw, branch="content/connected-fixture",
                           sha_by_path={PAGE: c.digest(BODY), IMAGE: c.digest(WEBP)},
                           target_bytes={PAGE: BODY, IMAGE: WEBP})

    def test_compiler_lead_provenance_absent_vs_agent_approved(self):
        common = {"observed_branch": "content/connected-fixture",
                  "observed_head": HEAD, "observed_workflow_sources": workflow(),
                  "actual_targets": {PAGE: BODY, IMAGE: WEBP}}
        for scenario in ("absent", "agent_missing", "agent_confirmed", "author_original"):
            with self.subTest(scenario=scenario):
                s = step_sequence(fresh())
                p = s["state"]["publication"]
                lead = next(d for d in p["context"]["decisions"]
                            if d["kind"] == "first_cut_lead_provenance_v1")
                if scenario == "absent":
                    p["context"]["decisions"].remove(lead)
                if scenario.startswith("agent"):
                    lead["origin"] = "agent_authored"
                    lead["source_ref"] = "fixture:agent-authored"
                if scenario == "author_original":
                    lead["origin"] = "author_original"
                    lead["source_ref"] = "fixture:author-text"
                if scenario == "agent_confirmed":
                    p["context"]["approvals"].append({
                        "scope": "authored-intro", "status": "confirmed",
                        "decision": "approved", "evidence": ["fixture:explicit-yes"]})
                if scenario in ("absent", "agent_missing"):
                    with self.assertRaises(h.Blocked):
                        c.compile_cut1(s, c.cas(s), **common)
                else:
                    self.assertEqual(c.compile_cut1(s, c.cas(s), **common)["next_step"],
                                     "C.4.10.1")

    def test_page_and_webp_are_genuine_bytes_not_just_declared_paths(self):
        s = step_sequence(fresh())
        common = {"observed_branch": "content/connected-fixture",
                  "observed_head": HEAD, "observed_workflow_sources": workflow()}
        with self.assertRaisesRegex(h.Blocked, "ACTUAL_WEBP_BYTES_REQUIRED"):
            c.compile_cut1(s, c.cas(s), **common,
                           actual_targets={PAGE: BODY, IMAGE: b"fake-webp"})
        with self.assertRaisesRegex(h.Blocked, "ACTUAL_PAGE_HTML_REQUIRED"):
            c.compile_cut1(s, c.cas(s), **common,
                           actual_targets={PAGE: b"not an html page", IMAGE: WEBP})

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
