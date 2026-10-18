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
        self.assertEqual(h.inspect(self.root, check_remote=True)["git_snapshot_portable"], "no")
        run(self.root, "push", "origin", "main")
        view = h.inspect(self.root, check_remote=True)
        self.assertEqual(view["issues"], [])
        self.assertEqual(view["git_snapshot_portable"], "yes")
        self.assertFalse(view["publication_completed"])

    def test_ignored_required_file_is_not_portable(self):
        folder = self.root / ".ignored"
        folder.mkdir()
        (folder / "input.txt").write_text("not in Git")
        self.p["target_paths"].append(".ignored/input.txt")
        self.start()
        run(self.root, "add", h.STATE_PATH)
        run(self.root, "commit", "-m", "checkpoint without ignored input")
        run(self.root, "push", "origin", "main")
        view = h.inspect(self.root, check_remote=True)
        self.assertEqual(view["git_snapshot_portable"], "no")
        self.assertEqual(view["portability_reason"], "UNTRACKED_OR_IGNORED_REQUIRED_FILE")

    def test_remote_advancement_is_observed_without_fetching_or_restoring(self):
        self.start()
        run(self.root, "add", h.STATE_PATH)
        run(self.root, "commit", "-m", "checkpoint")
        run(self.root, "push", "origin", "main")
        cached = run(self.root, "rev-parse", "origin/main").stdout
        other = self.base / "other"
        subprocess.run(["git", "clone", str(self.remote), str(other)], check=True, capture_output=True)
        run(other, "config", "user.name", "Other")
        run(other, "config", "user.email", "other@example.invalid")
        (other / "note.html").write_text("changed elsewhere")
        run(other, "add", "note.html")
        run(other, "commit", "-m", "remote changed")
        run(other, "push", "origin", "main")
        before = (self.root / "note.html").read_bytes()
        view = h.inspect(self.root, check_remote=True)
        self.assertEqual(view["status"], "blocked")
        self.assertIn("REMOTE_HISTORY_NOT_LOCAL_REVIEW_REQUIRED", view["issues"])
        self.assertEqual(run(self.root, "rev-parse", "origin/main").stdout, cached)
        self.assertEqual((self.root / "note.html").read_bytes(), before)
        run(self.root, "fetch", "origin")  # Test operator fetches; helper never does.
        self.assertIn("REMOTE_BRANCH_ADVANCED_REVIEW_REQUIRED", h.inspect(self.root, True)["issues"])

    def test_remote_failure_remains_unknown_and_does_not_leak_urls(self):
        self.start()
        run(self.root, "remote", "rename", "origin", "old-origin")
        run(self.root, "remote", "add", "origin", str(self.base / "missing.git"))
        # Identity drift is blocked, and local remote failure is reported as unknown.
        view = h.inspect(self.root, True)
        self.assertIn("REPOSITORY_CHANGED", view["issues"])
        self.assertEqual(view["current_snapshot"]["remote"]["status"], "unknown")

    def test_branch_or_content_identity_cannot_be_silently_rebound(self):
        result = self.start()
        bad = copy.deepcopy(self.p)
        bad["content_id"] = "another-publication"
        self.assert_blocked("PUBLICATION_IDENTITY_CHANGED", h.save, self.root, bad,
                            expected=result["sha256"])
        run(self.root, "switch", "-c", "another-branch")
        self.assertIn("BRANCH_CHANGED", h.inspect(self.root)["issues"])
        self.assert_blocked("REPOSITORY_OR_BRANCH_CHANGED", h.save, self.root, self.p,
                            expected=result["sha256"], note="cannot change branch")

    def test_new_commit_changing_other_files_requires_review(self):
        self.start()
        (self.root / "other.txt").write_text("other change")
        run(self.root, "add", "other.txt")
        run(self.root, "commit", "-m", "unrelated commit")
        self.assertIn("HEAD_CHANGED_REVIEW_REQUIRED", h.inspect(self.root)["issues"])

    def test_git_rename_and_newline_names_are_preserved(self):
        run(self.root, "mv", "note.html", "renamed file.html")
        if os.name != "nt":
            (self.root / "line\nbreak.txt").write_text("extra")
        self.start()
        files = self.state()["snapshot"]["files"]
        self.assertEqual(files["note.html"]["kind"], "missing")
        self.assertEqual(files["renamed file.html"]["status"], "R ")
        if os.name != "nt":
            self.assertIn("line\nbreak.txt", files)

    def test_unsafe_targets_rejected_before_state_creation(self):
        for target in ("../outside", "/tmp/outside", ".git/config", "a/../b", "C:/x", "a\\b", h.STATE_PATH):
            with self.subTest(target=target):
                bad = copy.deepcopy(self.p)
                bad["target_paths"] = [target]
                self.assertRaises(h.Blocked, h.save, self.root, bad, initial=True)
        self.assertFalse((self.root / h.STATE_PATH).exists())

    @unittest.skipIf(os.name == "nt", "Symlink creation needs platform privileges")
    def test_state_and_parent_symlinks_do_not_write_outside_checkout(self):
        outside = self.base / "outside.txt"
        outside.write_text("untouched")
        path = self.root / h.STATE_PATH
        path.symlink_to(outside)
        self.assert_blocked("SYMLINK_PARENT_OR_STATE", self.start)
        self.assertEqual(outside.read_text(), "untouched")
        path.unlink()
        (self.root / ".dentcast").rename(self.root / ".dentcast-real")
        (self.root / ".dentcast").symlink_to(self.root / ".dentcast-real", target_is_directory=True)
        self.assert_blocked("SYMLINK_PARENT_OR_STATE", self.start)

    def test_advisory_lock_rejects_another_cooperating_writer(self):
        initial = self.start()
        with h.locked(self.root):
            self.assert_blocked("HANDOFF_BUSY", h.save, self.root, self.p, expected=initial["sha256"])

    def test_atomic_replace_failure_preserves_previous_state(self):
        initial = self.start()
        before = (self.root / h.STATE_PATH).read_bytes()
        with patch.object(h.os, "replace", side_effect=OSError("fixture failure")):
            self.assertRaises(OSError, h.save, self.root, self.p, expected=initial["sha256"])
        self.assertEqual((self.root / h.STATE_PATH).read_bytes(), before)
        self.assertEqual(list((self.root / ".dentcast").glob(".publish-handoff-*")), [])

    def test_credentials_are_not_saved_from_origin_url(self):
        run(self.root, "remote", "set-url", "origin", "https://user:PRIVATE_TOKEN@example.invalid/team/repo.git")
        self.start()
        text = (self.root / h.STATE_PATH).read_text()
        self.assertNotIn("PRIVATE_TOKEN", text)
        self.assertEqual(self.state()["snapshot"]["repository"], "example.invalid/team/repo")

    def test_missing_workflow_and_detached_head_fail_closed(self):
        path = self.root / h.WORKFLOW_PATHS[0]
        original = path.read_bytes()
        path.unlink()
        self.assert_blocked("ACTIVE_WORKFLOW_FILE_MISSING", self.start)
        path.write_bytes(original)
        run(self.root, "switch", "--detach")
        self.assert_blocked("DETACHED_HEAD", self.start)

    def test_cli_consumes_explicit_input_and_missing_state_is_nonzero(self):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = h.main(["--repo", str(self.root), "inspect"])
        self.assertEqual(code, 2)
        self.assertEqual(json.loads(err.getvalue())["error"], "HANDOFF_MISSING")
        inp = self.base / "operator-input.json"
        import dentcast_publish_lifecycle as lifecycle
        self.p["steps"] = lifecycle.plan()
        inp.write_text(json.dumps(self.p))
        with redirect_stdout(io.StringIO()):
            self.assertEqual(h.main(["--repo", str(self.root), "init", "--input", str(inp)]), 0)
        self.assertTrue((self.root / h.STATE_PATH).is_file())


if __name__ == "__main__":
    unittest.main()
