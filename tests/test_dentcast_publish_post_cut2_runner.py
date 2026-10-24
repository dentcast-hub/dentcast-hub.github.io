"""Focused contract tests for the post-cut2 runner's safety and recovery edges."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_post_cut2_runner as runner
import dentcast_publish_lifecycle as lifecycle


HEAD = "a" * 40
BRANCH = "content/litecast-40-test"


def sample_publication():
    rows = lifecycle.plan()
    states = {row["id"]: row for row in rows}
    for row in rows:
        if row["id"] == "C.8":
            break
        row["status"] = "skipped" if row["id"] == "C.4.14" else "completed"
    return {
        "content_id": "insight/insight100",
        "category": "insight",
        "target_paths": ["insight/insight100.html", "insight/en/insight100.html"],
        "context": {"approvals": []},
        "external_actions": [],
        "steps": rows,
    }


class PostCut2RunnerTests(unittest.TestCase):
    def test_runner_and_automation_workflow_are_handoff_inputs(self):
        self.assertIn("tools/dentcast_post_cut2_runner.py", runner.handoff.WORKFLOW_PATHS)
        self.assertIn(".github/workflows/post-cut2-mechanical.yml", runner.handoff.WORKFLOW_PATHS)

    def test_push1_preflight_is_a_noop(self):
        pub = sample_publication()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / runner.HANDOFF).parent.mkdir(parents=True)
            (root / runner.HANDOFF).write_text("handoff", encoding="utf-8")
            with patch.object(runner, "git", side_effect=[HEAD, BRANCH, HEAD]), \
                 patch.object(runner, "publication", return_value=(pub, "digest")), \
                 patch.object(lifecycle, "editorial_cut_v2", return_value=True), \
                 patch.object(lifecycle, "delivery_boundary", return_value=1), \
                 patch.object(runner, "command_plan") as commands:
                result = runner.preflight(root, HEAD, BRANCH)
                commands.assert_not_called()
        self.assertFalse(result["continue"])
        self.assertEqual(result["reason"], "NOT_AT_V2_SECOND_DELIVERY")

    def test_push2_preflight_enters_mechanical_job(self):
        pub = sample_publication()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / runner.HANDOFF).parent.mkdir(parents=True)
            (root / runner.HANDOFF).write_text("handoff", encoding="utf-8")
            with patch.object(runner, "git", side_effect=[HEAD, BRANCH, HEAD]), \
                 patch.object(runner, "publication", return_value=(pub, "digest")), \
                 patch.object(lifecycle, "editorial_cut_v2", return_value=True), \
                 patch.object(lifecycle, "delivery_boundary", return_value=2):
                result = runner.preflight(root, HEAD, BRANCH)
        self.assertTrue(result["continue"])
        self.assertEqual(result["boundary"], 2)

    def test_phase_f_uses_frozen_handoff_approvals(self):
        pub = sample_publication()
        pub["context"]["approvals"] = [
            {"scope": "title", "status": "confirmed", "decision": "Exact approved title"},
            {"scope": "caption", "status": "confirmed", "decision": "Exact approved caption"},
        ]
        args = type("Args", (), {"expect_title": None, "expect_caption": None})()
        self.assertEqual(
            runner.phase_f_expectations(pub, args),
            ("Exact approved title", "Exact approved caption"),
        )

    def test_phase_f_rejects_manual_text_that_conflicts_with_frozen_approval(self):
        pub = sample_publication()
        pub["context"]["approvals"] = [
            {"scope": "title", "status": "confirmed", "decision": "Exact approved title"},
        ]
        args = type("Args", (), {"expect_title": "different title", "expect_caption": "caption"})()
        with self.assertRaisesRegex(runner.RunnerError, "APPROVED_EXPECTED_TEXT_MISMATCH:title"):
            runner.phase_f_expectations(pub, args)

    def test_first_cut_is_rejected_before_any_builder(self):
        pub = sample_publication()
        args = type("Args", (), {
            "expected_head": HEAD, "expected_branch": BRANCH,
            "expect_title": "title", "expect_caption": "caption",
        })()
        with patch.object(runner, "git", side_effect=[HEAD, BRANCH, HEAD]), \
             patch.object(runner, "publication", return_value=(pub, "digest")), \
             patch.object(lifecycle, "editorial_cut_v2", return_value=True), \
             patch.object(lifecycle, "delivery_boundary", return_value=1), \
             patch.object(lifecycle, "require_fixed_cut_readiness"), \
             patch.object(runner, "command_plan") as commands:
            with self.assertRaisesRegex(runner.RunnerError, "NOT_AT_V2_SECOND_DELIVERY"):
                runner.run_phase(Path("."), Path("/tmp/runner-artifacts"), args)
            commands.assert_not_called()

    def test_legacy_v1_is_rejected_before_any_builder(self):
        pub = sample_publication()
        args = type("Args", (), {
            "expected_head": HEAD, "expected_branch": BRANCH,
            "expect_title": "title", "expect_caption": "caption",
        })()
        with patch.object(runner, "git", side_effect=[HEAD, BRANCH, HEAD]), \
             patch.object(runner, "publication", return_value=(pub, "digest")), \
             patch.object(lifecycle, "editorial_cut_v2", return_value=False), \
             patch.object(runner, "command_plan") as commands:
            with self.assertRaisesRegex(runner.RunnerError, "V2_REQUIRED"):
                runner.run_phase(Path("."), Path("/tmp/runner-artifacts"), args)
            commands.assert_not_called()

    def test_success_stops_at_g_without_delivery_three(self):
        from contextlib import ExitStack

        pub = sample_publication()
        states = {row["id"]: row for row in pub["steps"]}
        args = type("Args", (), {
            "expected_head": HEAD, "expected_branch": BRANCH,
            "expect_title": "title", "expect_caption": "caption",
        })()

        def record(_root, sid, status, evidence=(), reason=None):
            states[sid]["status"] = status
            return "digest"

        def command(_root, _artifact, label, _argv, _logs):
            if label == "F-verify-publish":
                states["F"]["status"] = "completed"

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            page = root / "insight/insight100.html"
            page.parent.mkdir(parents=True)
            page.write_text("<html><head></head><body></body></html>", encoding="utf-8")
            with ExitStack() as stack:
                stack.enter_context(patch.object(runner, "git", side_effect=[HEAD, BRANCH, HEAD]))
                stack.enter_context(patch.object(runner, "publication", return_value=(pub, "digest")))
                stack.enter_context(patch.object(lifecycle, "editorial_cut_v2", return_value=True))
                stack.enter_context(patch.object(lifecycle, "delivery_boundary", return_value=2))
                stack.enter_context(patch.object(lifecycle, "require_fixed_cut_readiness"))
                stack.enter_context(patch.object(runner, "command_plan", return_value=[["python3", "builder"]]))
                stack.enter_context(patch.object(runner, "record_step", side_effect=record))
                stack.enter_context(patch.object(runner, "run_command", side_effect=command))
                stack.enter_context(patch.object(runner, "verify_scope"))
                result = runner.run_phase(root, root / "artifacts", args)
        self.assertEqual(result["status"], "mechanical_steps_complete")
        self.assertEqual(result["next_step"], "G")
        self.assertFalse(result["third_delivery_created"])

    def test_failed_command_preserves_a_recovery_attempt(self):
        pub = sample_publication()
        args = type("Args", (), {
            "expected_head": HEAD, "expected_branch": BRANCH,
            "expect_title": "title", "expect_caption": "caption",
        })()
        with tempfile.TemporaryDirectory() as tmp, \
             patch.object(runner, "git", side_effect=[HEAD, BRANCH, HEAD]), \
             patch.object(runner, "publication", return_value=(pub, "digest")), \
             patch.object(lifecycle, "editorial_cut_v2", return_value=True), \
             patch.object(lifecycle, "delivery_boundary", return_value=2), \
             patch.object(lifecycle, "require_fixed_cut_readiness"), \
             patch.object(runner, "command_plan", return_value=[["python3", "builder"]]), \
             patch.object(runner, "record_step"), \
             patch.object(runner, "run_command", side_effect=runner.RunnerError("injected builder failure")), \
             patch.object(runner, "verify_scope"), \
             patch.object(runner, "write_recovery") as recovery:
            with self.assertRaisesRegex(runner.RunnerError, "injected builder failure"):
                runner.run_phase(Path(tmp), Path(tmp) / "artifacts", args)
        recovery.assert_called_once()
        self.assertEqual(recovery.call_args.args[4], "blocked")

    def test_recovery_bundle_excludes_out_of_scope_files_and_restores_after_review(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "repo"
            artifact = Path(tmp) / "artifact"
            root.mkdir()
            (root / ".dentcast").mkdir()
            (root / runner.HANDOFF).write_text("canonical handoff bytes", encoding="utf-8")
            (root / "index.html").write_text("generated output", encoding="utf-8")
            (root / "private.env").write_text("secret", encoding="utf-8")
            pub = {
                "content_id": "insight/insight100",
                "category": "insight",
                "target_paths": ["insight/insight100.html"],
            }
            changed = {runner.HANDOFF, "index.html", "private.env"}
            with patch.object(runner, "git", side_effect=lambda _r, *a, **k:
                              BRANCH if a[:2] == ("branch", "--show-current") else HEAD), \
                 patch.object(runner, "changed_paths", return_value=changed):
                manifest = runner.write_recovery(root, artifact, pub, HEAD,
                                                 "blocked", "C.8", [], "injected failure")
            self.assertNotIn("private.env", manifest["recovery_paths"])
            self.assertIn("private.env", manifest["changed_paths"])

            # Restoration starts from a clean checkout at the same immutable SHA.
            for name in (runner.HANDOFF, "index.html", "private.env"):
                (root / name).unlink()
            calls = []
            completed = subprocess.CompletedProcess([], 0, stdout="invalidated", stderr="")
            with patch.object(runner, "git", side_effect=lambda _r, *a, **k:
                              BRANCH if a[:2] == ("branch", "--show-current") else HEAD), \
                 patch.object(runner, "changed_paths", return_value=set()), \
                 patch.object(runner, "publication", return_value=({"publication": True}, "digest")), \
                 patch.object(runner.subprocess, "run", side_effect=lambda *a, **k:
                              (calls.append(a[0]) or completed)):
                runner.restore_recovery(root, artifact, HEAD, BRANCH, "reviewed retry")
            self.assertEqual((root / runner.HANDOFF).read_text(encoding="utf-8"),
                             "canonical handoff bytes")
            self.assertFalse((root / "private.env").exists())
            self.assertIn("--reconcile-note", calls[0])

    def test_finalization_creates_one_third_delivery_then_confirms_cleanup(self):
        pub = sample_publication()
        states = {row["id"]: row for row in pub["steps"]}
        for row in pub["steps"]:
            if row["id"] == "G":
                break
            row["status"] = "completed"
        pub["context"]["delivery"] = []
        base = "b" * 40
        third = "c" * 40
        report_path = Path(".dentcast/publication-reports/insight/insight100.completion.json")
        root = Path("/tmp/fake-post-cut2-repo")

        def fake_git(_root, *args, check=True):
            if args[:2] == ("rev-parse", "HEAD"):
                return third
            if args[:2] == ("rev-parse", "HEAD^"):
                return base
            if args and args[0] == "ls-remote":
                return third + "\trefs/heads/automation/test"
            return ""

        completed = subprocess.CompletedProcess([], 0, stdout="ok", stderr="")
        with tempfile.TemporaryDirectory() as tmp, \
             patch.object(runner, "publication", return_value=(pub, "digest")), \
             patch.object(runner, "record_step", side_effect=["g-start", "g-complete"]), \
             patch.object(runner, "record_publication", return_value="delivery-recorded"), \
             patch.object(runner, "git", side_effect=fake_git), \
             patch.object(runner, "changed_paths", return_value={runner.HANDOFF, "index.html", str(report_path)}), \
             patch.object(runner.lifecycle, "pending", return_value=False), \
             patch.object(runner.subprocess, "run", return_value=completed):
            result = runner.finalize_and_push(
                root, Path(tmp), base, "automation/test",
                "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/123")
        self.assertEqual(result["status"], "publication_completed")
        self.assertEqual(result["third_delivery_sha"], third)
        self.assertTrue(result["publication_completed"])

    def test_rejected_third_push_preserves_same_commit_and_cleanup_record(self):
        pub = sample_publication()
        for row in pub["steps"]:
            if row["id"] == "G":
                break
            row["status"] = "completed"
        pub["context"]["delivery"] = []
        base = "b" * 40
        third = "c" * 40
        report_path = ".dentcast/publication-reports/insight/insight100.completion.json"
        completed = subprocess.CompletedProcess([], 0, stdout="ok", stderr="")
        rejected = subprocess.CompletedProcess([], 1, stdout="branch protection rejected push", stderr="")

        def fake_git(_root, *args, check=True):
            if args[:2] == ("rev-parse", "HEAD"):
                return third
            if args[:2] == ("rev-parse", "HEAD^"):
                return base
            if args and args[0] == "ls-remote":
                return base + "\trefs/heads/automation/test"
            return ""

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "repo"
            root.mkdir()
            artifact = Path(tmp) / "artifact"
            cleanup = Path(tmp) / "cleanup-record.json"
            cleanup.write_text("cleanup receipt", encoding="utf-8")
            with patch.object(runner, "publication", return_value=(pub, "digest")), \
                 patch.object(runner, "record_step", side_effect=["g-start", "g-complete"]), \
                 patch.object(runner, "record_publication", return_value="delivery-recorded"), \
                 patch.object(runner, "git", side_effect=fake_git), \
                 patch.object(runner, "changed_paths", return_value={runner.HANDOFF, "index.html", report_path}), \
                 patch.object(runner.lifecycle, "pending", return_value=True), \
                 patch.object(runner.lifecycle, "metadata_path", return_value=cleanup), \
                 patch.object(runner.subprocess, "run", side_effect=[completed, completed, rejected, completed]):
                with self.assertRaisesRegex(runner.RunnerError, "FINAL_DELIVERY_PUSH_UNCONFIRMED"):
                    runner.finalize_and_push(
                        root, artifact, base, "automation/test",
                        "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/123")
            manifest = json.loads((artifact / "final-delivery-recovery.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["attempted_head"], third)
            self.assertEqual(manifest["remote_head_observed"], base)
            self.assertTrue((artifact / "cleanup-record.json").is_file())


if __name__ == "__main__":
    unittest.main()
