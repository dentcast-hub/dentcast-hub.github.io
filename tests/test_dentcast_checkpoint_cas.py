"""Staging compare-and-swap checkpoint tests; POSIX only."""
import copy
import importlib.util
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / file)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


store = load("store", "dentcast_checkpoint_store_draft.py")
checkpoint = load("checkpoint", "dentcast_checkpoint_draft.py")


def sample():
    return checkpoint.begin({"status": "draft_requires_audit", "no_side_effects": True,
                             "ordered_modules": [{"id": "intake"}, {"id": "page"}]},
                            "run-1", "rev-1")


def completed():
    return {"module_id": "intake", "status": "completed", "source_revision": "rev-1",
            "input_fingerprint": "a" * 64, "artifact_receipts": [],
            "verification": {"passed": True}}


@unittest.skipUnless(os.name == "posix", "POSIX flock only")
class CheckpointCASTests(unittest.TestCase):
    def test_create_then_update(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            old = sample()
            token = store.save_checked(path, old)
            new = checkpoint.accept(old, completed(), "rev-1")
            new_token = store.save_checked(path, new, token)
            self.assertNotEqual(token, new_token)
            self.assertEqual(store.load(path, "run-1", "rev-1", old["plan_digest"]), new)

    def test_second_creator_cannot_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            store.save_checked(path, sample())
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_ALREADY_EXISTS"):
                store.save_checked(path, sample())

    def test_stale_writer_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            old = sample()
            token = store.save_checked(path, old)
            updated = checkpoint.accept(old, completed(), "rev-1")
            store.save_checked(path, updated, token)
            with self.assertRaisesRegex(ValueError, "STALE_CHECKPOINT_WRITER"):
                store.save_checked(path, old, token)
            self.assertEqual(store.load(path, "run-1", "rev-1", old["plan_digest"]), updated)

    def test_mismatched_run_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            old = sample()
            token = store.save_checked(path, old)
            other = copy.deepcopy(old)
            other["run_id"] = "other-run"
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_IDENTITY_MISMATCH"):
                store.save_checked(path, other, token)

    def test_missing_checkpoint_cannot_be_updated(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_MISSING"):
                store.save_checked(Path(folder) / "state.json", sample(), "a" * 64)

    def test_bad_expected_digest_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, "INVALID_EXPECTED_DIGEST"):
                store.save_checked(Path(folder) / "state.json", sample(), "invalid")

    def test_lock_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            lock = Path(folder) / "state.json.lock"
            target = Path(folder) / "target"
            target.write_text("keep", encoding="utf-8")
            lock.symlink_to(target)
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_LOCK_SYMLINK_FORBIDDEN"):
                store.save_checked(path, sample())


if __name__ == "__main__":
    unittest.main()
