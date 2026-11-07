"""Founder decision 2026-11-07: cut 1 is replaced by one unguarded save point.

A v2 run may commit and push its scoped work and handoff once DES/Fidelity
(C.4.13) has started, typically just before message M3b, so the science
survives a lost session. The save is not a delivery: no readiness gate, no
remote read-back, no hold on the next step. Push 2 keeps every check.
Real local Git remotes; the semantic results are explicit fixtures.
"""
import subprocess
import unittest

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_ledger_order_v2 as v2
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import check_publish_merge_gate as merge

run = fixtures.run
M3B = {"message": "M3b", "step": "C.4.13", "question": "fixture:still-flagged sentence",
       "answered": False}


class SavePointTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = v2.LedgerOrderV2Tests.prepare
    walk = v2.LedgerOrderV2Tests.walk
    deliver = v2.LedgerOrderV2Tests.deliver
    start_v2 = v2.LedgerOrderV2Tests.start_v2

    def publication(self):
        return h.load_state(self.root)[0]["publication"]

    def at_m3b(self):
        """C.4.13 started, measurements recorded, M3b still open."""
        sha = self.walk(self.start_v2(), "C.4.10.3")
        self.assertFalse(lc.save_point(self.publication()))
        sha = lc.step(self.root, sha, "C.4.13", "started", [], None)["sha256"]
        state, _ = h.load_state(self.root)
        state["publication"]["context"]["pending_questions"].append(dict(M3B))
        return h.save(self.root, state["publication"], expected=sha,
                      note="fixture:M3b sent")["sha256"]

    def save(self, sha, push=True):
        result = lc.stage_delivery(self.root, sha, ["note.html"])
        self.assertIn("save point", result["next_action"])
        run(self.root, "commit", "-m", "save point")
        lc.guard(self.root, "ci")
        if push:
            run(self.root, "push", "origin", "main")
        return result["sha256"]

    def test_no_save_before_des_starts(self):
        sha = self.walk(self.start_v2(), "C.4.10.3")
        self.assert_blocked("STAGE_DELIVERY_ONLY_AT_FIXED_CUT", lc.stage_delivery,
                            self.root, sha, ["note.html"])
        run(self.root, "add", h.STATE_PATH)
        self.assert_blocked("ONLY_THREE_FIXED_DELIVERIES_ALLOWED", lc.guard, self.root, "pre-commit")

    def test_save_with_open_m3b_needs_no_readiness_and_holds_nothing(self):
        sha = self.save(self.at_m3b())
        head = h.text_git(self.root, "rev-parse", "HEAD")
        self.assertEqual(h.git(self.root, "show", head + ":" + h.STATE_PATH),
                         (self.root / h.STATE_PATH).read_bytes())
        # The open question survives in the pushed handoff.
        self.assertEqual(self.publication()["context"]["pending_questions"], [M3B])
        # The answer is recorded on top of the save: no cut-style refusal.
        state, _ = h.load_state(self.root)
        state["publication"]["context"]["pending_questions"] = []
        sha = h.save(self.root, state["publication"], expected=sha,
                     note="fixture:M3b answered, recorded as C.4.13 evidence")["sha256"]
        lc.guard(self.root, "stop")
        sha = lc.step(self.root, sha, "C.4.13", "completed", ["fixture:C.4.13"], None)["sha256"]
        # No delivery is due at the old C.4.9 cut.
        sha = self.walk(sha, "C.4.9")
        self.assertIsNone(lc.delivery_boundary(self.publication()))
        lc.guard(self.root, "stop")
        result = lc.advance(self.root, sha, start_next=True)
        self.assertNotEqual(result.get("status"), "delivery_required")

    def test_unpushed_save_does_not_block_the_run(self):
        sha = self.save(self.at_m3b(), push=False)
        state, _ = h.load_state(self.root)
        state["publication"]["context"]["pending_questions"] = []
        sha = h.save(self.root, state["publication"], expected=sha, note="fixture:answered")["sha256"]
        lc.guard(self.root, "stop")
        sha = lc.step(self.root, sha, "C.4.13", "completed", ["fixture:C.4.13"], None)["sha256"]
        self.walk(sha, "C.4.7")

    def test_push2_keeps_its_gates_and_sits_on_the_save(self):
        sha = self.save(self.at_m3b())
        save = h.text_git(self.root, "rev-parse", "HEAD")
        sha = lc.step(self.root, sha, "C.4.13", "completed", ["fixture:C.4.13"], None)["sha256"]
        sha = self.walk(sha, "C.5.6-b")
        sha = lc.step(self.root, sha, "C.6", "started", [], None)["sha256"]
        # The forgotten M3b answer still blocks closing C.6 and so Push 2.
        self.assert_blocked("SECOND_CUT_JUDGMENTS_UNRESOLVED", lc.step, self.root, sha,
                            "C.6", "completed", ["fixture:C.6"], None)
        state, sha = h.load_state(self.root)
        state["publication"]["context"]["pending_questions"] = []
        sha = h.save(self.root, state["publication"], expected=sha, note="fixture:answered")["sha256"]
        lc.step(self.root, sha, "C.6", "completed", ["fixture:C.6"], None)
        self.assertEqual(lc.delivery_boundary(self.publication()), 1)
        self.deliver("delivery 2")
        self.assertEqual(h.text_git(self.root, "rev-parse", "HEAD^"), save)

    def test_whole_run_with_a_save_completes_and_passes_the_merge_gate(self):
        sha = self.save(self.at_m3b())
        state, _ = h.load_state(self.root)
        state["publication"]["context"]["pending_questions"] = []
        sha = h.save(self.root, state["publication"], expected=sha, note="fixture:answered")["sha256"]
        sha = lc.step(self.root, sha, "C.4.13", "completed", ["fixture:C.4.13"], None)["sha256"]
        self.walk(sha, "C.6")
        self.deliver("delivery 2")
        local = self.root
        self.root = self.base / "actions-runner"
        subprocess.run(["git", "clone", "-q", "file://" + str(self.remote), str(self.root)],
                       check=True, capture_output=True)
        run(self.root, "config", "user.name", "Fixture")
        run(self.root, "config", "user.email", "fixture@example.invalid")
        try:
            sha = self.walk(h.load_state(self.root)[1], "G")
            state, _ = h.load_state(self.root)
            state["publication"]["context"]["delivery"] = [{"scope": "fixture Action", "evidence": ["fixture:run"]}]
            sha = h.save(self.root, state["publication"], expected=sha)["sha256"]
            lc.finish(self.root, sha)
            run(self.root, "add", "-A", "note.html", h.STATE_PATH, lc.completion_path({"content_id": "note"}),
                lc.technical_report_path({"content_id": "note", "category": "litecast"}))
            run(self.root, "commit", "-m", "delivery 3 by Actions")
            run(self.root, "push", "origin", "main")
        finally:
            self.root = local
        run(self.root, "pull", "-q", "--ff-only")
        self.assertTrue(lc.confirm_cleanup(self.root)["publication_completed"])
        self.assertEqual(merge.verify_publication_history(self.root, self.baseline, []), {"note"})

    def test_run_without_any_save_still_completes(self):
        sha = self.walk(self.start_v2(), "C.6")
        self.deliver("delivery 2")
        self.assertEqual(h.git(self.root, "show", "HEAD^:" + h.STATE_PATH, optional=True), None)


if __name__ == "__main__":
    unittest.main()
