"""Round 5 (Claude cloud path) regressions: founder-approved exam-row fixes reach
CI/Phase F, reordered rows warn, paper-only delivery evidence is required before
its single final handoff, the Stop hook keeps a delivered paper-only handoff
from ending the session before finish, and the stale-tool hint works on an
existing ccr-* session branch."""
import copy
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
from test_dentcast_publish_round2_fixes import stop_hook
from test_exam_bank_guard import Repo

run = fixtures.run
ROOT = Path(__file__).resolve().parents[1]
CID, QID = "chairside/chairside-1", "r-aaaa0002"


class ExamEditApprovalTests(unittest.TestCase):
    def setUp(self):
        self.repo = Repo()
        d = self.repo.bank()
        d["byContent"][CID]["questions"][1]["prompt_fa"] = "پرسش دوم بازنویسی‌شده؟"
        self.repo.dump("plus/exam-questions.json", d)

    def tearDown(self):
        self.repo.close()

    def approve(self, sha=None, status="confirmed"):
        if sha is None:
            r = self.repo.validate("--row-sha256", f"{CID}#{QID}")
            self.assertEqual(r.returncode, 0, r.stdout)
            sha = r.stdout.strip()
        self.repo.dump(".dentcast/exam-edit-approvals.json", {f"{CID}#{QID}": {
            "content_id": CID, "question_id": QID, "row_sha256": sha,
            "approval": {"status": status, "decision": "wording fix", "evidence": ["founder-chat:fixture"]}}})

    def bank_row(self):
        vp = self.repo.verify_module()
        rep = vp.Report(CID)
        vp.check_bank_preservation(rep, CID)
        return [r for r in rep.rows if r[1] == "4.12-ب bank"]

    def test_allow_edit_alone_is_only_a_local_preview(self):
        r = self.repo.validate("--allow-edit", CID)
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("local preview only", r.stdout)
        rows = self.bank_row()
        self.assertEqual(rows[-1][0], "FAIL")
        self.assertIn(".dentcast/exam-edit-approvals.json", rows[-1][2])

    def test_recorded_approval_passes_validator_and_phase_f(self):
        self.approve()
        r = self.repo.validate()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("under the founder approval", r.stdout)
        self.assertEqual([s for s, *_ in self.bank_row()], ["WARN", "PASS"])

    def test_approval_binds_the_exact_row_and_status(self):
        for sha, status in (("0" * 64, "confirmed"), (None, "pending")):
            with self.subTest(status=status):
                self.approve(sha, status)
                r = self.repo.validate()
                self.assertEqual(r.returncode, 1, r.stdout)
                self.assertIn(f"{CID}#{QID}: existing question modified (prompt_fa)", r.stdout)
                self.assertEqual(self.bank_row()[-1][0], "FAIL")

    def test_reordering_existing_rows_warns(self):
        d = json.loads(json.dumps(self.repo.bank()))
        d["byContent"][CID]["questions"][1]["prompt_fa"] = "پرسش دوم؟"  # undo the edit
        d["byContent"][CID]["questions"].reverse()
        self.repo.dump("plus/exam-questions.json", d)
        r = self.repo.validate()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn(f"{CID}: existing rows reordered", r.stdout)


class PaperOnlyFinalHandoffTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare

    def test_stage_delivery_requires_delivery_evidence_first(self):
        initial = self.prepare(complete=True, paper=True)
        state, _ = h.load_state(self.root)
        p = copy.deepcopy(state["publication"])
        p["context"]["delivery"] = []
        sha = h.save(self.root, p, expected=initial["sha256"], note="fixture: no delivery evidence yet")["sha256"]
        self.assert_blocked("DELIVERY_EVIDENCE_REQUIRED", lc.stage_delivery, self.root, sha,
                            ["dentcast_cabinet_full_catalog.json"])

    def test_stop_hook_blocks_a_delivered_final_handoff_until_finish(self):
        initial = self.prepare(complete=True, paper=True)
        run(self.root, "add", h.STATE_PATH)
        run(self.root, "commit", "-m", "paper-only final handoff")
        run(self.root, "push", "origin", "main")
        self.assertEqual(lc.guard(self.root, "stop")["status"], "guard_passed")
        out = json.loads(stop_hook({"cwd": str(self.root)}, self.root).stdout)
        self.assertEqual(out["decision"], "block")
        self.assertIn("FINAL_HANDOFF_DELIVERED_FINISH_REQUIRED", out["reason"])
        self.assertIn("confirm-cleanup", out["reason"])
        self.assertEqual(lc.finish(self.root, initial["sha256"])["status"], "cleanup_pending_delivery")
        self.assertIn("CLEANUP_DELIVERY_PENDING",
                      json.loads(stop_hook({"cwd": str(self.root)}, self.root).stdout)["reason"])


class StaleToolHintTests(unittest.TestCase):
    def test_hint_moves_an_existing_session_branch_without_tracking_main(self):
        text = (ROOT / "tools/dentcast_publish_handoff.py").read_text(encoding="utf-8")
        start = text.index('"TOOL_OLDER_THAN_ORIGIN_MAIN: "')
        hint = text[start:text.index("\n    return []", start)]
        self.assertIn("git switch -C <current-branch> --no-track origin/main", hint)
        self.assertIn("--no-track", (ROOT / ".dentcast/workflows/publish-checkpoints.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
