"""Real local Git repositories and bare remotes; no external network or publishing."""
import copy
from contextlib import redirect_stdout, redirect_stderr
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_publish_handoff as h


def run(root, *args, check=True):
    p = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True)
    if check and p.returncode:
        raise AssertionError((args, p.stderr))
    return p


def publication():
    return {
        "content_id": "insight-fixture", "category": "insight",
        "target_paths": ["note.html"], "status": "in_progress", "blocker": None,
        "context": {k: [] for k in ("inputs", "decisions", "approvals", "pending_questions",
                                    "validation", "delivery", "unrelated_changes")},
        "steps": [
            {"id": "A", "module": "02-routing-intake.md", "status": "pending", "evidence": [], "reason": None},
            {"id": "C.2", "module": "03-litecast-and-page.md", "status": "pending", "evidence": [], "reason": None}],
        "external_actions": [],
    }


class HandoffTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / "checkout"
        self.root.mkdir()
        self.remote = self.base / "remote.git"
        subprocess.run(["git", "init", "--bare", "--initial-branch=main", str(self.remote)],
                       check=True, capture_output=True)
        run(self.root, "init", "--initial-branch=main")
        run(self.root, "config", "user.name", "Fixture")
        run(self.root, "config", "user.email", "fixture@example.invalid")
        run(self.root, "config", "core.autocrlf", "false")
        run(self.root, "remote", "add", "origin", str(self.remote))
        for name in h.WORKFLOW_PATHS:
            p = self.root / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text("active fixture\n", encoding="utf-8")
        (self.root / "note.html").write_text("original\n")
        (self.root / ".gitignore").write_text(".ignored/\n")
        run(self.root, "add", ".")
        run(self.root, "commit", "-m", "fixture baseline")
        run(self.root, "push", "-u", "origin", "main")
        self.p = publication()

    def start(self, **kw):
        return h.save(self.root, self.p, initial=True, **kw)

    def state(self):
        return h.load_state(self.root)[0]

    def assert_blocked(self, code, call, *args, **kw):
        with self.assertRaisesRegex(h.Blocked, code):
            call(*args, **kw)

    def test_init_inspect_and_missing_state_do_not_invent_completion(self):
        self.assert_blocked("HANDOFF_MISSING", h.inspect, self.root)
        result = self.start()
        self.assertEqual(result["next_step"], "A")
        view = h.inspect(self.root)
        self.assertEqual(view["status"], "awaiting_operator_review")
        self.assertEqual(view["git_snapshot_portable"], "unknown")
        self.assertFalse(view["publication_completed"])
        self.assertTrue(view["requires_operator_review"])
        self.assertNotIn(h.STATE_PATH, view["current_snapshot"]["files"])
        self.assert_blocked("HANDOFF_ALREADY_EXISTS", self.start)

    def test_staged_worktree_and_untracked_are_distinguished_without_contents(self):
        secret = "private-body-must-not-be-copied"
        (self.root / "note.html").write_text("staged\n")
        run(self.root, "add", "note.html")
        (self.root / "note.html").write_text(secret)
        (self.root / "untracked.txt").write_text("new payload")
        self.start()
        files = self.state()["snapshot"]["files"]
        self.assertEqual(files["note.html"]["status"], "MM")
        self.assertEqual(files["note.html"]["sha256"], h.digest(secret.encode()))
        self.assertEqual(files["note.html"]["index"][0]["stage"], 0)
        self.assertEqual(files["untracked.txt"]["status"], "??")
        self.assertEqual(files["untracked.txt"]["index"], [])
        self.assertNotIn(secret, (self.root / h.STATE_PATH).read_text())
        self.assertEqual(h.inspect(self.root)["git_snapshot_portable"], "no")

    def test_changed_work_requires_explicit_reconciliation_and_stale_writer_fails(self):
        initial = self.start()
        (self.root / "note.html").write_text("new work")
        view = h.inspect(self.root)
        self.assertIn("WORK_OR_INDEX_CHANGED", view["issues"])
        self.assertEqual(view["status"], "blocked")
        self.assert_blocked("RECONCILIATION_REQUIRED", h.save, self.root, self.p,
                            expected=initial["sha256"])
        result = h.save(self.root, self.p, expected=initial["sha256"], note="Reviewed actual changed page")
        self.assertEqual(result["generation"], 2)
        before = (self.root / h.STATE_PATH).read_bytes()
        self.assert_blocked("STALE_HANDOFF_WRITE", h.save, self.root, self.p,
                            expected=initial["sha256"], note="old writer")
        self.assertEqual((self.root / h.STATE_PATH).read_bytes(), before)

    def test_next_step_advances_only_for_a_resolved_prefix(self):
        initial = self.start()
        bad = copy.deepcopy(self.p)
        bad["steps"][1].update(status="completed", evidence=["receipt:page"])
        self.assert_blocked("OUT_OF_ORDER_STEP_STATE", h.save, self.root, bad,
                            expected=initial["sha256"])
        self.p["steps"][0].update(status="completed", evidence=["receipt:intake"])
        result = h.save(self.root, self.p, expected=initial["sha256"])
        self.assertEqual(result["next_step"], "C.2")
        self.assertFalse(result["publication_completed"])

    def test_skips_and_completion_require_reasons_or_evidence(self):
        bad = copy.deepcopy(self.p)
        bad["steps"][0]["status"] = "skipped"
        self.assert_blocked("STEP_REASON_REQUIRED", h.validate_publication, bad)
        bad["steps"][0]["status"] = "completed"
        self.assert_blocked("COMPLETION_EVIDENCE_REQUIRED", h.validate_publication, bad)
        bad["steps"][0]["status"] = "pending"
        bad["steps"].reverse()
        self.assert_blocked("MODULE_ORDER_INVALID", h.validate_publication, bad)

    def test_workflow_drift_requires_all_steps_invalidated(self):
        self.p["steps"][0].update(status="completed", evidence=["receipt:original source"])
        result = self.start()
        path = self.root / h.WORKFLOW_PATHS[0]
        path.write_text("changed source\n")
        self.assertIn("WORKFLOW_CHANGED", h.inspect(self.root)["issues"])
        self.assert_blocked("WORKFLOW_CHANGE_REQUIRES_STEP_INVALIDATION", h.save, self.root, self.p,
                            expected=result["sha256"], note="source updated")
        self.p["steps"][0].update(status="pending", evidence=[])
        h.save(self.root, self.p, expected=result["sha256"], note="all steps invalidated for new source")
        self.assertEqual(h.inspect(self.root)["next_step"], "A")

    def test_started_external_action_blocks_resume_and_cannot_disappear(self):
        action = {"id": "upload-1", "target": "drive:safe-reference", "status": "started", "evidence": []}
        self.p["external_actions"].append(action)
        initial = self.start()
        self.assertIn("EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY", h.inspect(self.root)["issues"])
        bad = copy.deepcopy(self.p)
        bad["external_actions"] = []
        self.assert_blocked("EXTERNAL_HISTORY_CANNOT_BE_DROPPED", h.save, self.root, bad,
                            expected=initial["sha256"], note="cannot erase")
        action.update(status="completed", evidence=["verified-public-safe-receipt:123"])
        self.assert_blocked("RECONCILIATION_REQUIRED", h.save, self.root, self.p, expected=initial["sha256"])
        h.save(self.root, self.p, expected=initial["sha256"], note="Reconciled existing upload; did not retry")
        self.assertNotIn("EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY", h.inspect(self.root)["issues"])

    def test_pending_questions_block_resume(self):
        self.p["context"]["pending_questions"].append("Which pillar?")
        self.start()
        self.assertIn("PENDING_QUESTIONS", h.inspect(self.root)["issues"])

    def test_known_pending_approval_blocks_and_confirmed_requires_evidence(self):
        approval = {"scope": "opening paragraph", "decision": None, "status": "pending", "evidence": []}
        self.p["context"]["approvals"].append(approval)
        self.start()
        self.assertIn("PENDING_OR_REJECTED_APPROVAL", h.inspect(self.root)["issues"])
        approval.update(status="confirmed", decision="approved")
        self.assert_blocked("APPROVAL_DECISION_AND_EVIDENCE_REQUIRED", h.validate_publication, self.p)

    def test_input_change_cannot_keep_completed_claims(self):
        self.p["context"]["inputs"] = ["original-public-safe-input-reference"]
        self.p["steps"][0].update(status="completed", evidence=["receipt:original"])
        result = self.start()
        self.p["context"]["inputs"] = ["changed-input-reference"]
        self.assert_blocked("INPUT_CHANGE_REQUIRES_STEP_INVALIDATION", h.save, self.root, self.p,
                            expected=result["sha256"], note="input replaced")

    def test_approval_history_cannot_be_erased_to_unblock_a_run(self):
        approval = {"scope": "opening", "decision": None, "status": "pending", "evidence": []}
        self.p["context"]["approvals"].append(approval)
        result = self.start()
        bad = copy.deepcopy(self.p)
        bad["context"]["approvals"] = []
        self.assert_blocked("APPROVAL_HISTORY_CANNOT_BE_DROPPED", h.save, self.root, bad,
                            expected=result["sha256"], note="cannot erase an outstanding approval")
        approval.update(status="confirmed", decision="approved", evidence=["safe-reference:decision"])
        self.assert_blocked("RECONCILIATION_REQUIRED", h.save, self.root, self.p, expected=result["sha256"])
        h.save(self.root, self.p, expected=result["sha256"], note="Reviewed real scoped approval")
        self.assertNotIn("PENDING_OR_REJECTED_APPROVAL", h.inspect(self.root)["issues"])

    def test_clearing_a_known_question_requires_a_reconciliation_note(self):
        self.p["context"]["pending_questions"] = ["Which pillar?"]
        result = self.start()
        self.p["context"]["pending_questions"] = []
        self.assert_blocked("RECONCILIATION_REQUIRED", h.save, self.root, self.p, expected=result["sha256"])

    def test_terminal_external_receipt_cannot_be_rewritten_or_dropped(self):
        action = {"id": "upload", "target": "safe:target", "status": "completed", "evidence": ["receipt:old"]}
        self.p["external_actions"].append(action)
        result = self.start()
        action["status"] = "started"
        self.assert_blocked("EXTERNAL_TERMINAL_RECORD_IMMUTABLE", h.save, self.root, self.p,
                            expected=result["sha256"], note="new attempts need a new action ID")

    def test_strict_json_rejects_duplicate_keys_and_nonstandard_numbers(self):
        self.assert_blocked("DUPLICATE_JSON_KEY", h.decode_json, '{"x":1,"x":2}')
        self.assert_blocked("NONSTANDARD_JSON_NUMBER", h.decode_json, '{"x":NaN}')

    def test_unresolved_git_conflict_is_reported(self):
        run(self.root, "switch", "-c", "side")
        (self.root / "note.html").write_text("side version\n")
        run(self.root, "add", "note.html")
        run(self.root, "commit", "-m", "side")
        run(self.root, "switch", "main")
        (self.root / "note.html").write_text("main version\n")
        run(self.root, "add", "note.html")
        run(self.root, "commit", "-m", "main")
        self.assertNotEqual(run(self.root, "merge", "side", check=False).returncode, 0)
        self.start()
        view = h.inspect(self.root)
        self.assertIn("UNRESOLVED_GIT_CONFLICT", view["issues"])
        self.assertEqual(len(view["current_snapshot"]["files"]["note.html"]["index"]), 3)

    def test_relative_local_origin_is_resolved_from_checkout(self):
        run(self.root, "remote", "set-url", "origin", "../remote.git")
        self.start()
        self.assertEqual(self.state()["snapshot"]["repository"], h.identity(str(self.remote)))

    def test_corrupt_summary_and_invalid_semantic_state_fail_closed(self):
        self.start()
        path = self.root / h.STATE_PATH
        original = path.read_text()
        path.write_text(original.replace("# Publication handoff", "# Incorrect summary", 1))
        self.assert_blocked("HANDOFF_SUMMARY_OR_ENCODING_CHANGED", h.inspect, self.root)
        path.write_text(original)
        state = self.state()
        state["publication"]["status"] = "not-a-valid-status"
        path.write_text(h.render(state))
        self.assert_blocked("INVALID_STATUS", h.inspect, self.root)
        path.write_text("old manual checkpoint, not structured data")
        self.assert_blocked("HANDOFF_FORMAT_INVALID", h.inspect, self.root)

    def test_unpushed_commits_are_real_and_no_remote_is_assumed_offline(self):
        (self.root / "note.html").write_text("local commit")
        run(self.root, "add", "note.html")
        run(self.root, "commit", "-m", "unpublished local work")
        local = run(self.root, "rev-parse", "HEAD").stdout.strip()
        self.start()
        offline = h.inspect(self.root)
        self.assertEqual(offline["current_snapshot"]["remote"]["status"], "unknown")
        self.assertIsNone(offline["current_snapshot"]["remote"]["unpushed_commits"])
        self.assertIn(local, offline["current_snapshot"]["remote"]["commits_not_in_cached_upstream"])
        online = h.inspect(self.root, check_remote=True)
        self.assertIn(local, online["current_snapshot"]["remote"]["unpushed_commits"])
        self.assertEqual(online["portability_reason"], "LOCAL_COMMITS_NOT_ON_REMOTE_BRANCH")
        self.assertEqual(run(self.remote, "rev-parse", "main").stdout.strip(),
                         run(self.root, "rev-parse", "origin/main").stdout.strip())

    def test_handoff_only_commit_does_not_stale_it_and_remote_state_is_verified(self):
        self.start()
        run(self.root, "add", h.STATE_PATH)
        run(self.root, "commit", "-m", "checkpoint only")
        self.assertEqual(h.inspect(self.root)["issues"], [])
        self.assertEqual(h.inspect(self.root, check_remote=True)["git_snapshot_portable"], "no#ÏtæÚ$z{-®éÜj×€€€€€€€€€É•ÍÕ±Ñl‰É…¹¡•Í}¡•­•t€¬ô€Ä(€€€€€€€€€€€€€€€½¹Ñ¥¹Õ”(€€€€€€€€€€€É•ÍÕ±Ñl•ÉÉ½ÉÌt¹…ÁÁ•¹¡ì‰É…¹ œè‰É…¹ °€Á¡…Í”œè€É•…‘}¡…¹‘½™˜œ°€½‘”œèÍÑÈ¡•áŒ¥ô¤(€€€€€€€€€€€É•ÑÕÉ¸É•ÍÕ±Ğ(€€€€€€€É•ÍÕ±Ñl‰É…¹¡•Í}¡•­•t€¬ô€Ä(€€€€€€€ÑÉäè(€€€€€€€€€€€É•ÍÕ±Ñl…¹‘¥‘…Ñ•Ìt¹…ÁÁ•¹¡…¹‘¥‘…Ñ”¡É•Á¼°‰É…¹ °¡•…°•¹ÑÉä¤¤(€€€€€€€•á•ÁĞ€¡ ¹	±½­•°-•åÉÉ½È°QåÁ•ÉÉ½È°ÑÑÉ¥‰ÕÑ•ÉÉ½È¤è(€€€€€€€€€€€É•ÍÕ±Ñl•ÉÉ½ÉÌt¹…ÁÁ•¹¡ì‰É…¹ œè‰É…¹ °€Á¡…Í”œè€Ù…±¥‘…Ñ•}¡…¹‘½™˜œ°€½‘”œèÍ…™•}•ÉÉ½È ¥ô¤(€€€ÑÉäè(€€€€€€€™¥¹…°€ô±¥ÍÑ}¡•…‘Ì¡É•Á¼°É•…¤(€€€€€€€ ¹É•ÅÕ¥É”¡™¥¹…°€ôô¡•…‘Ì°€%M=YIe}	I9!}!M}!9}IQIdœ¤(€€€•á•ÁĞ€¡ ¹	±½­•°-•åÉÉ½È°QåÁ•ÉÉ½È°ÑÑÉ¥‰ÕÑ•ÉÉ½È¤è(€€€€€€€É•ÍÕ±Ñl•ÉÉ½ÉÌt¹…ÁÁ•¹¡ìÁ¡…Í”œè€±¥ÍÑ}™¥¹…°œ°€½‘”œèÍ…™•}•ÉÉ½È ¥ô¤(€€€€€€€É•ÑÕÉ¸É•ÍÕ±Ğ(€€€É•ÍÕ±Ñl‘¥Í½Ù•Éå}½µÁ±•Ñ”t€ôQÉÕ”(€€€¥˜É•ÍÕ±Ñl•ÉÉ½ÉÌtè(€€€€€€€É•ÑÕÉ¸É•ÍÕ±Ğ(€€€¥˜±•¸¡É•ÍÕ±Ñl…¹‘¥‘…Ñ•Ìt¤€ø€Äè(€€€€€€€É•ÍÕ±Ñl•ÉÉ½ÉÌt¹…ÁÁ•¹¡ìÁ¡…Í”œè€Í•±•Ğœ°€½‘”œè€5U1Q%A1}Q%Y}!9=M}IEU%I}M1Q%=8ô¤(€€€•±¥˜É•ÍÕ±Ñl…¹‘¥‘…Ñ•Ìtè(€€€€€€€É•ÍÕ±Ğ¹ÕÁ‘…Ñ”¡ÍÑ…ÑÕÌô¡…¹‘½™™}™½Õ¹œ°Í•±•Ñ•õÉ•ÍÕ±Ñl…¹‘¥‘…Ñ•ÌulÁt¤(€€€•±Í”è(€€€€€€€É•ÍÕ±ÑlÍÑ…ÑÕÌt€ô€¹½Ñ}™½Õ¹œ(€€€É•ÑÕÉ¸É•ÍÕ±Ğ(()‘•˜Í…™•}•ÉÉ½È ¤è(€€€¥µÁ½ÉĞÍåÌ(€€€•ÉÉ½È€ôÍåÌ¹•á}¥¹™¼ ¥lÅt(€€€É•ÑÕÉ¸ÍÑÈ¡•ÉÉ½È¤¥˜¥Í¥¹ÍÑ…¹”¡•ÉÉ½È° ¹	±½­•¤•±Í”€%M=YIe}IMA=9M}%9Y1%œ