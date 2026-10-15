"""Exercise the same staging orchestrator as Claude Code, Cursor and Codex."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("orchestrator", ROOT / "tools/dentcast_orchestrator_draft.py")
orchestrator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(orchestrator)


class CrossAgentOrchestratorTests(unittest.TestCase):
    def test_claude_cursor_codex_identical_checkpoint(self):
        request = {"has_text": True, "has_paper": False, "category": "clinical", "challenge": False}
        outputs = {}
        for agent in ("claude", "cursor", "codex"):
            result = orchestrator.dry_run(request, "same-run", "same-revision")
            outputs[agent] = result
            self.assertFalse(result["execution_authorized"])
            self.assertEqual(result["next_module"], "page")
        self.assertEqual(outputs["claude"], outputs["cursor"])
        self.assertEqual(outputs["cursor"], outputs["codex"])

    def test_real_disk_checkpoint_round_trip(self):
        request = {"has_text": False, "has_paper": True}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "checkpoint.json"
            result = orchestrator.dry_run(request, "run-paper", "rev", path)
            self.assertEqual(result["next_module"], "paper-cabinet")
            restored = orchestrator.store.load(path, "run-paper", "rev",
                                               result["checkpoint"]["plan_digest"])
            self.assertEqual(restored, result["checkpoint"])

    def test_unknown_category_does_not_write(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "checkpoint.json"
            result = orchestrator.dry_run({"has_text": True, "has_paper": False,
                                           "category": "imaginary", "challenge": False},
                                          "run", "rev", path)
            self.assertEqual(result["status"], "blocked")
            self.assertFalse(path.exists())

    def test_orchestrator_blocks_forged_adapter_without_writing(self):
        request = {"has_text": True, "has_paper": False, "category": "clinical", "challenge": False}
        original = orchestrator.adapter.dispatch
        def forged(invocation):
            response = original(invocation)
            response["outputs"]["route"] = "challenge"
            return response
        orchestrator.adapter.dispatch = forged
        try:
            with tempfile.TemporaryDirectory() as folder:
                path = Path(folder) / "state.json"
                with self.assertRaisesRegex(ValueError, "OUTPUT_MISMATCH"):
                    orchestrator.dry_run(request, "run", "rev", path)
                self.assertFalse(path.exists())
        finally:
            orchestrator.adapter.dispatch = original

    def test_reject_non_object(self):
        with self.assertRaisesRegex(ValueError, "INVALID_REQUEST"):
            orchestrator.dry_run([], "run", "rev")


if __name__ == "__main__":
    unittest.main()
