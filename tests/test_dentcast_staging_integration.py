"""Read-only staging integration: plan -> validate -> checkpoint -> pause -> recover."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


planner = module("planner", "dentcast_route_plan_draft.py")
validator = module("validator", "validate_dentcast_route_plan_draft.py")
checkpoint = module("checkpoint", "dentcast_checkpoint_draft.py")
store = module("store", "dentcast_checkpoint_store_draft.py")
REGISTRY = set(planner.MODULES)


def receipt(mid, status):
    return {"module_id": mid, "status": status, "source_revision": "staging-sha",
            "input_fingerprint": "a" * 64, "artifact_receipts": [],
            "verification": {"passed": status == "completed"}}


class IntegrationTests(unittest.TestCase):
    def test_publication_pause_restart_recover_and_resume(self):
        plan = planner.plan({"has_text": True, "has_paper": False,
                             "category": "clinical", "challenge": False})
        self.assertEqual(plan["status"], "draft_requires_audit")
        self.assertEqual(validator.validate(plan, REGISTRY), [])
        state = checkpoint.begin(plan, "integration-1", "staging-sha")
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "checkpoint.json"
            store.save(path, state)
            state = store.load(path, "integration-1", "staging-sha", state["plan_digest"])
            state = checkpoint.accept(state, receipt("intake", "completed"), "staging-sha")
            store.save(path, state)
            state = store.load(path, "integration-1", "staging-sha", state["plan_digest"])
            self.assertEqual(state["sequence"][state["next_index"]], "taxonomy")
            failed = receipt("taxonomy", "failed")
            state = checkpoint.accept(state, failed, "staging-sha")
            store.save(path, state)
            state = store.load(path, "integration-1", "staging-sha", state["plan_digest"])
            self.assertTrue(state["paused"])
            with self.assertRaisesRegex(ValueError, "PAUSED_REQUIRES_EXPLICIT_RECOVERY"):
                checkpoint.accept(state, receipt("taxonomy", "completed"), "staging-sha")
            state = checkpoint.recover(state, "staging-sha", "taxonomy", checkpoint.digest(failed))
            state = checkpoint.accept(state, receipt("taxonomy", "completed"), "staging-sha")
            store.save(path, state)
            state = store.load(path, "integration-1", "staging-sha", state["plan_digest"])
            self.assertEqual(state["sequence"][state["next_index"]], "page")
            self.assertEqual(len(state["history"]), 1)
            self.assertFalse(state["execution_authorized"])

    def test_paper_only_round_trip_without_publication(self):
        plan = planner.plan({"has_text": False, "has_paper": True})
        self.assertEqual(validator.validate(plan, REGISTRY), [])
        state = checkpoint.begin(plan, "paper-1", "staging-sha")
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            store.save(path, state)
            restored = store.load(path, "paper-1", "staging-sha", state["plan_digest"])
            self.assertEqual(restored["sequence"], ["intake", "paper-cabinet"])
            self.assertFalse(restored["execution_authorized"])


if __name__ == "__main__":
    unittest.main()
