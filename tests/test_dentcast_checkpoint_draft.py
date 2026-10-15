import importlib.util
import unittest
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "tools/dentcast_checkpoint_draft.py"
spec = importlib.util.spec_from_file_location("checkpoint", p)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def plan():
    return {"status": "draft_requires_audit", "no_side_effects": True,
            "ordered_modules": [{"id": "intake"}, {"id": "page"}]}


def receipt(mid="intake", status="completed"):
    return {"module_id": mid, "status": status, "source_revision": "abc",
            "input_fingerprint": "f" * 64, "artifact_receipts": [],
            "verification": {"passed": True}}


class CheckpointTests(unittest.TestCase):
    def test_no_execution_authority(self):
        self.assertFalse(mod.begin(plan(), "run1", "abc")["execution_authorized"])

    def test_completion_advances_without_mutation(self):
        state = mod.begin(plan(), "run1", "abc")
        self.assertEqual(mod.accept(state, receipt(), "abc")["next_index"], 1)
        self.assertEqual(state["next_index"], 0)

    def test_idempotent_replay(self):
        state = mod.accept(mod.begin(plan(), "run1", "abc"), receipt(), "abc")
        self.assertEqual(mod.accept(state, receipt(), "abc"), state)

    def test_out_of_order(self):
        with self.assertRaises(ValueError):
            mod.accept(mod.begin(plan(), "run1", "abc"), receipt("page"), "abc")

    def test_stale_revision(self):
        with self.assertRaises(ValueError):
            mod.accept(mod.begin(plan(), "run1", "abc"), receipt(), "new")

    def test_unverified_completion(self):
        x = receipt()
        x["verification"]["passed"] = False
        with self.assertRaises(ValueError):
            mod.accept(mod.begin(plan(), "run1", "abc"), x, "abc")

    def test_side_effect_receipt_rejected(self):
        x = receipt()
        x["artifact_receipts"] = [{"path": "published.html"}]
        with self.assertRaises(ValueError):
            mod.accept(mod.begin(plan(), "run1", "abc"), x, "abc")

    def test_blocked_pauses(self):
        state = mod.accept(mod.begin(plan(), "run1", "abc"), receipt(status="blocked"), "abc")
        self.assertTrue(state["paused"])
        self.assertEqual(state["next_index"], 0)

    def test_unsafe_plan(self):
        p = plan()
        p["no_side_effects"] = False
        with self.assertRaises(ValueError):
            mod.begin(p, "run1", "abc")


if __name__ == "__main__":
    unittest.main()
