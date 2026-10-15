import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


store = load_module("store", "dentcast_checkpoint_store_draft.py")
checkpoint = load_module("checkpoint", "dentcast_checkpoint_draft.py")


def sample():
    plan = {"status": "draft_requires_audit", "no_side_effects": True,
            "ordered_modules": [{"id": "intake"}, {"id": "page"}]}
    return checkpoint.begin(plan, "run-1", "revision-1")


class CheckpointStoreTests(unittest.TestCase):
    def test_round_trip(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            state = sample()
            store.save(path, state)
            self.assertEqual(store.load(path, "run-1", "revision-1", state["plan_digest"]), state)

    def test_resume_after_completed_module(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            state = sample()
            receipt = {"module_id": "intake", "status": "completed",
                       "source_revision": "revision-1", "input_fingerprint": "a" * 64,
                       "artifact_receipts": [], "verification": {"passed": True}}
            state = checkpoint.accept(state, receipt, "revision-1")
            store.save(path, state)
            restored = store.load(path, "run-1", "revision-1", state["plan_digest"])
            self.assertEqual(restored["sequence"][restored["next_index"]], "page")

    def test_reject_stale_revision(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            state = sample()
            store.save(path, state)
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_IDENTITY_MISMATCH"):
                store.load(path, "run-1", "changed", state["plan_digest"])

    def test_reject_changed_plan(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            state = sample()
            store.save(path, state)
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_IDENTITY_MISMATCH"):
                store.load(path, "run-1", "revision-1", "f" * 64)

    def test_reject_unsafe_state(self):
        with tempfile.TemporaryDirectory() as folder:
            state = sample()
            state["execution_authorized"] = True
            with self.assertRaisesRegex(ValueError, "UNSAFE_STATE"):
                store.save(Path(folder) / "state.json", state)

    def test_reject_malformed_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            path.write_text("not json", encoding="utf-8")
            with self.assertRaises(json.JSONDecodeError):
                store.load(path, "run-1", "revision-1", "f" * 64)

    def test_reject_inconsistent_cursor(self):
        with tempfile.TemporaryDirectory() as folder:
            state = sample()
            state["next_index"] = 1
            with self.assertRaisesRegex(ValueError, "CURSOR_RECEIPT_MISMATCH"):
                store.save(Path(folder) / "state.json", state)

    def test_reject_future_receipt(self):
        with tempfile.TemporaryDirectory() as folder:
            state = sample()
            state["receipts"]["page"] = {"status": "completed"}
            with self.assertRaisesRegex(ValueError, "FUTURE_RECEIPT"):
                store.save(Path(folder) / "state.json", state)

    def test_reject_pause_without_receipt(self):
        with tempfile.TemporaryDirectory() as folder:
            state = sample()
            state["paused"] = True
            with self.assertRaisesRegex(ValueError, "PAUSE_RECEIPT_MISMATCH"):
                store.save(Path(folder) / "state.json", state)

    def test_reject_non_string_sequence(self):
        with tempfile.TemporaryDirectory() as folder:
            state = sample()
            state["sequence"] = ["intake", ["page"]]
            with self.assertRaisesRegex(ValueError, "INVALID_SEQUENCE"):
                store.save(Path(folder) / "state.json", state)

    def test_reject_non_object_receipt(self):
        with tempfile.TemporaryDirectory() as folder:
            state = sample()
            state["receipts"]["intake"] = None
            with self.assertRaisesRegex(ValueError, "INVALID_RECEIPT_SHAPE"):
                store.save(Path(folder) / "state.json", state)

    def test_reject_completed_pause_receipt(self):
        with tempfile.TemporaryDirectory() as folder:
            state = sample()
            state["paused"] = True
            state["receipts"]["intake"] = {"status": "completed"}
            with self.assertRaisesRegex(ValueError, "INVALID_PAUSE_RECEIPT"):
                store.save(Path(folder) / "state.json", state)

    def test_reject_symlink(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "real.json"
            target.write_text("{}", encoding="utf-8")
            link = Path(folder) / "link.json"
            link.symlink_to(target)
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_SYMLINK_FORBIDDEN"):
                store.save(link, sample())


if __name__ == "__main__":
    unittest.main()
