"""Read-only performance probe for the existing canonical checkpoint cost.

Counts actual helper calls and hashed file-byte volume on an isolated local Git
fixture. This is NOT a scientific execution, a token counter or an end-to-end
publishing timing estimate. Performance observations do not waive any guards.
"""
import json
import time
import unittest
from pathlib import Path
import sys
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc


class BaselineProbe(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp

    def test_measure_a_real_step_without_claiming_full_publish_speed(self):
        self.p["steps"] = lc.plan()
        counts = {"git_calls": 0, "git_stdout_bytes": 0,
                  "file_info_calls": 0, "file_bytes_hashed_approx": 0,
                  "snapshot_calls": 0, "status_paths_calls": 0}
        real_git, real_info = h.git, h.file_info
        real_snapshot, real_status = h.snapshot, h.status_paths

        def git_spy(*args, **kwargs):
            result = real_git(*args, **kwargs)
            counts["git_calls"] += 1
            counts["git_stdout_bytes"] += len(result or b"")
            return result

        def info_spy(root, path):
            result = real_info(root, path)
            counts["file_info_calls"] += 1
            if result["kind"] == "file":
                # An approximate byte read counter based on the actual file
                # size after the digest, not a claim of OS-level disk I/O.
                counts["file_bytes_hashed_approx"] += (
                    root / path).stat().st_size
            return result

        def snapshot_spy(*args, **kwargs):
            counts["snapshot_calls"] += 1
            return real_snapshot(*args, **kwargs)

        def status_spy(*args, **kwargs):
            counts["status_paths_calls"] += 1
            return real_status(*args, **kwargs)

        before = time.perf_counter()
        with patch.object(h, "git", side_effect=git_spy), \
             patch.object(h, "file_info", side_effect=info_spy), \
             patch.object(h, "snapshot", side_effect=snapshot_spy), \
             patch.object(h, "status_paths", side_effect=status_spy):
            initial = h.save(self.root, self.p, initial=True)
            started = lc.step(self.root, initial["sha256"], "rules", "started", [], None)
            result = lc.step(self.root, started["sha256"], "rules",
                             "completed", ["fixture:canonical rules read"], None)
        counts.update(elapsed_seconds=round(time.perf_counter()-before, 3),
                      fixture="init+started+completed_rules",
                      actual_tokens="NOT MEASURED",
                      remote_transfers="NOT TESTED",
                      scientific_review="NOT RUN")
        print("DENTCAST_CHECKPOINT_BASELINE " + json.dumps(counts, sort_keys=True))
        self.assertEqual(result["next_step"], "0")
        self.assertEqual(counts["snapshot_calls"], 3)
        self.assertGreater(counts["git_calls"], 0)
        self.assertGreater(counts["file_info_calls"], 0)


if __name__ == "__main__":
    unittest.main()
