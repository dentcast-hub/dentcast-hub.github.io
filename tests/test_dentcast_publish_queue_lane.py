"""Queue lane: one push before the post-cut2 Action, then delivery 2 by the Action.

The interactive profile keeps its three deliveries (test_dentcast_publish_three_deliveries.py).
"""
import json
import subprocess
import unittest

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import dentcast_post_cut2_runner as runner
import check_publish_merge_gate as merge

run = fixtures.run
CID = "insight/note"
PAGE = "insight/note.html"
ENG = "insight/en/note.html"


def cut_records(cid="insight/insight-9"):
    section, _, slug = cid.rpartition("/")
    english = f"{section}/en/{slug}.html" if section else f"en/{slug}.html"
    scopes = [{"scope": s, "status": "resolved", "evidence": ["fixture:frozen-queue-item"]}
              for s in sorted(lc.EDITORIAL_SCOPES - {"challenge"})]
    scopes.append({"scope": "challenge", "status": "not_applicable", "evidence": ["fixture:not-a-challenge"]})
    return english, [
        {"kind": "queue_approvals_v1", "queue_ref": "queue/09-fixture", "sha256sums": "0" * 64,
         "status_sha256": "1" * 64, "receipt_sha256": "2" * 64, "evidence": ["fixture:00-status"]},
        {"kind": "first_cut_lead_provenance_v1", "origin": "author_original",
         "source_ref": "fixture:01-text", "evidence": ["fixture:frozen"]},
        {"kind": "second_cut_editorial_lock_v1", "scopes": scopes,
         "english": {"status": "ready", "path": english, "evidence": ["fixture:06"]},
         "evidence": ["fixture:generated"]},
    ], [
        {"scope": "title", "status": "confirmed", "decision": "fixture title", "evidence": ["fixture:02"]},
        {"scope": "caption", "status": "confirmed", "decision": "fixture caption", "evidence": ["fixture:02"]},
    ]


class QueueLaneTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked

    def start(self):
        lifecycle_fixtures.LifecycleTests.prepare(self)  # fixture gate + CLI; its handoff is replaced below
        (self.root / h.STATE_PATH).unlink()
        (self.root / "dentcast-brain.json").write_text("[]")
        english, decisions, approvals = cut_records(CID)
        (self.root / "insight/en").mkdir(parents=True, exist_ok=True)
        (self.root / PAGE).write_text("page\n")
        (self.root / english).write_text("mirror\n")
        self.p["content_id"], self.p["category"] = CID, "insight"
        self.p["target_paths"] = [PAGE, english]
        self.p["steps"] = lc.plan(queue=True)
        self.p["context"]["decisions"] = [{"kind": lc.QUEUE_LANE}, {"kind": lc.DELIVERY_POLICY},
                                          {"kind": lc.DELIVERY_POLICY_V2}] + decisions
        self.p["context"]["approvals"] = approvals
        run(self.root, "add", "-A")
        run(self.root, "commit", "-m", "fixture base")
        result = h.save(self.root, self.p, initial=True)
        run(self.root, "push", "origin", "main")
        self.baseline = h.text_git(self.root, "rev-parse", "HEAD")
        return result["sha256"]

    def walk(self, sha, until):
        while True:
            state, _ = h.load_state(self.root)
            sid = h.next_step(state["publication"])
            if sid == "F":
                result = lc.verify(self.root, sha, "fixture title", "fixture caption")
            else:
                row = next(r for r in state["publication"]["steps"] if r["id"] == sid)
                started = {"sha256": sha} if row["status"] == "started" else lc.step(self.root, sha, sid, "started", [], None)
                result = lc.step(self.root, started["sha256"], sid, "completed", ["fixture:" + sid], None)
            sha = result["sha256"]
            if sid == until:
                return sha

    def deliver(self, label):
        state, sha = h.load_state(self.root)
        run(self.root, "add", PAGE, ENG)
        result = h.save(self.root, state["publication"], expected=sha, note="Reviewed staged fixture work")
        run(self.root, "add", h.STATE_PATH)
        lc.guard(self.root, "pre-commit")
        run(self.root, "commit", "-m", label)
        lc.guard(self.root, "ci")
        run(self.root, "push", "origin", "main")
        return result["sha256"]

    def test_plan_profile(self):
        ids = [s["id"] for s in lc.plan(queue=True)]
        self.assertEqual(tuple(ids), lc.QUEUE_IDS)
        self.assertLess(ids.index("C.8"), ids.index("C.7"))
        p = fixtures.publication()
        p["steps"] = lc.plan(queue=True)
        p["context"]["decisions"] = [{"kind": lc.QUEUE_LANE}]
        lc.require_plan(p)
        self.assertEqual(lc.delivery_cuts(p), ("C.6",))
        self.assertEqual(lc.final_delivery(p), 2)
        p["steps"].pop(2)
        self.assert_blocked("CANONICAL_PLAN_REQUIRED", lc.require_plan, p)
        p["steps"] = lc.plan(queue=True)
        p["context"]["decisions"] = []
        self.assert_blocked("CANONICAL_PLAN_REQUIRED", lc.require_plan, p)  # a short plan needs the marker

    def test_interactive_profile_unchanged(self):
        p = fixtures.publication()
        p["steps"] = lc.plan()
        p["context"]["decisions"] = [{"kind": lc.DELIVERY_POLICY}, {"kind": lc.DELIVERY_POLICY_V2}]
        # 2026-11-07: Push 2 is the only fixed cut; C.4.13 opens the save window.
        self.assertEqual(lc.delivery_cuts(p), ("C.6",))
        self.assertEqual(lc.final_delivery(p), 2)

    def test_rules_phase0_F_G_cannot_be_skipped(self):
        p = fixtures.publication()
        p["steps"] = lc.plan(queue=True)
        p["context"]["decisions"] = [{"kind": lc.QUEUE_LANE}]
        p["steps"][0].update(status="skipped", reason="fixture")
        self.assert_blocked("REQUIRED_CHECKPOINT_CANNOT_BE_SKIPPED", lc.require_plan, p)

    def test_commit_before_the_cut_is_rejected(self):
        sha = self.walk(self.start(), "C.4.9")
        run(self.root, "add", h.STATE_PATH)
        self.assert_blocked("ONLY_TWO_QUEUE_DELIVERIES_ALLOWED", lc.guard, self.root, "pre-commit")
        run(self.root, "commit", "-m", "fixture: not a cut")
        self.assert_blocked("ONLY_TWO_QUEUE_DELIVERIES_ALLOWED", lc.guard, self.root, "ci")

    def test_invalidation_is_refused(self):
        sha = self.walk(self.start(), "C.2")
        self.assert_blocked("QUEUE_LANE_NO_INVALIDATION", lc.invalidate, self.root, sha, "C.2", "fixture")

    def test_cut_requires_editorial_lock(self):
        sha = self.start()
        state, _ = h.load_state(self.root)
        p = state["publication"]
        p["context"]["decisions"] = [d for d in p["context"]["decisions"]
                                     if d.get("kind") != "second_cut_editorial_lock_v1"]
        sha = h.save(self.root, p, expected=sha)["sha256"]
        sha = self.walk(sha, "C.5.6")
        sha = lc.step(self.root, sha, "C.6", "started", [], None)["sha256"]
        self.assert_blocked("SECOND_CUT_EDITORIAL_LOCK_REQUIRED", lc.step, self.root, sha, "C.6", "completed",
                            ["fixture:C.6"], None)

    def test_runner_enters_on_the_queue_push(self):
        self.walk(self.start(), "C.6")
        decision = runner.classify(self.root)
        self.assertTrue(decision["continue"], decision)
        self.assertEqual(decision["reason"], "QUEUE_LANE_DELIVERY")
        pub, _ = runner.publication(self.root)
        cmds = [" ".join(c) for c in runner.command_plan(self.root, pub)]
        self.assertIn("node tools/build_flashcards_index.mjs", cmds)
        self.assertIn("node tools/build_quiz_index.mjs", cmds)
        self.assertNotIn("node tools/build_challenge_index.mjs", cmds)

    def test_exactly_two_deliveries(self):
        sha = self.walk(self.start(), "C.6")
        sha = self.deliver("queue delivery 1")
        sha = lc.step(self.root, sha, "C.8", "started", [], None)["sha256"]
        (self.root / PAGE).write_text('page<meta name="dc-notify" content="true">\n')  # Phase E marker only
        state, _ = h.load_state(self.root)
        sha = h.save(self.root, state["publication"], expected=sha, note="Reviewed builder output")["sha256"]
        sha = self.walk(sha, "G")
        state, _ = h.load_state(self.root)
        state["publication"]["context"]["delivery"] = [{"scope": "fixture checks", "evidence": ["fixture:checked"]}]
        sha = h.save(self.root, state["publication"], expected=sha)["sha256"]
        before = h.text_git(self.root, "rev-parse", "HEAD")
        self.assertEqual(lc.finish(self.root, sha)["status"], "cleanup_pending_delivery")
        report = lc.completion_path({"content_id": CID})
        run(self.root, "add", PAGE, h.STATE_PATH, report,
            lc.technical_report_path({"content_id": CID, "category": "insight"}))
        lc.guard(self.root, "pre-commit")
        run(self.root, "commit", "-m", "queue delivery 2")
        lc.guard(self.root, "ci")
        run(self.root, "push", "origin", "main")
        self.assertTrue(lc.confirm_cleanup(self.root)["publication_completed"])
        self.assertEqual(h.text_git(self.root, "rev-list", "--count", self.baseline + "..HEAD"), "2")
        self.assertEqual(h.text_git(self.root, "rev-parse", "HEAD^"), before)
        self.assertEqual(merge.verify_publication_history(self.root, self.baseline, []), {CID})
        data = h.decode_json((self.root / report).read_text())
        self.assertEqual(lc.validate_final_receipt(self.root, data, "HEAD"), CID)
        run(self.root, "commit", "--allow-empty", "-m", "forbidden third delivery")
        self.assert_blocked("EXTRA_DELIVERY_COMMIT_FORBIDDEN", lc.validate_final_receipt, self.root, data, "HEAD")


if __name__ == "__main__":
    unittest.main()
