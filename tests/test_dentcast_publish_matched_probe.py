"""Matched canonical-vs-Fast-Local checkpoint microprobe, no publication.

Both paths use a fresh local Git fixture, identical 52-step publication,
one initial handoff and the real 'rules' started/completed transitions.
Measurements are local, isolated and environment-dependent; not proof
of end-to-end speed or token savings. Nothing is written to GitHub.
"""
import copy
import json
import statistics
import time
import unittest
from pathlib import Path
import sys
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import dentcast_publish_fastlocal as fastlocal


class MatchedCheckpointProbe(unittest.TestCase):
    def run_case(self, mode):
        fixtures.HandoffTests.setUp(self)
        root = self.root
        p = copy.deepcopy(self.p)
        p["steps"] = lc.plan()
        p["context"]["decisions"] = [{"kind": lc.DELIVERY_POLICY}]
        counts = {
            "git_calls": 0, "file_info_calls": 0, "file_bytes_hashed_approx": 0,
            "snapshot_calls": 0, "status_paths_calls": 0}
        real_git, real_info = h.git, h.file_info
        real_snap, real_status = h.snapshot, h.status_paths

        def git_count(*args, **kwargs):
            counts["git_calls"] += 1
            return real_git(*args, **kwargs)

        def file_count(*args, **kwargs):
            counts["file_info_calls"] += 1
            info = real_info(*args, **kwargs)
            if info["kind"] == "file":
                counts["file_bytes_hashed_approx"] += (args[0] / args[1]).stat().st_size
            return info

        def snapshot_count(*args, **kwargs):
            counts["snapshot_calls"] += 1
            return real_snap(*args, **kwargs)

        def status_count(*args, **kwargs):
            counts["status_paths_calls"] += 1
            return real_status(*args, **kwargs)

        with patch.object(h, "git", side_effect=git_count), \
             patch.object(h, "file_info", side_effect=file_count), \
             patch.object(h, "snapshot", side_effect=snapshot_count), \
             patch.object(h, "status_paths", side_effect=status_count):
            start = time.perf_counter()
            initial = h.save(root, p, initial=True)
            if mode == "canonical":
                started = lc.step(root, initial["sha256"], "rules",
                                  "started", [], None)
                last = lc.step(root, started["sha256"], "rules",
                               "completed", ["fixture:rules-reviewed"], None)
                self.assertEqual(last["next_step"], "0")
            else:
                began = fastlocal.begin(root, initial["sha256"])
                started = fastlocal.step(root, began["digest"], "rules", "started")
                last = fastlocal.step(root, started["digest"], "rules", "completed",
                                      ["fixture:rules-reviewed"])
                self.assertEqual(last["next_step"], "0")
                self.assertTrue(fastlocal.active(root))
            counts["elapsed_seconds"] = round(time.perf_counter() - start, 4)
        return counts

    def test_equal_actions_measured_without_scientific_or_token_claims(self):
        # Alternating order reduces (but does not eliminate) warm-cache bias.
        rows = {"canonical": [], "fast_local": []}
        for a, b in (("canonical", "fast_local"),
                     ("fast_local", "canonical")):
            rows[a].append(self.run_case(a))
            rows[b].append(self.run_case(b))
        report = {}
        for name, samples in rows.items():
            report[name] = {
                k: round(statistics.median(s[k] for s in samples), 4)
                for k in samples[0]}
        output = {
            "fixture": "initial_handoff_plus_started_and_completed_rules",
            "sample_count_per_mode": 2,
            "baseline": report["canonical"],
            "fast_local": report["fast_local"],
            "end_to_end_publish": "NOT TESTED",
            "real_remote_delivery": "NOT TESTED",
            "tokens": "NOT MEASURED",
            "scientific_review": "NOT RUN"}
        print("DENTCAST_MATCHED_CHECKPOINT_PROBE " +
              json.dumps(output, ensure_ascii=True, sort_keys=True))
        self.assertGreater(report["canonical"]["git_calls"], 0)
        self.assertGreater(report["fast_local"]["git_calls"], 0)
        self.assertEqual(report["fast_local"]["snapshot_calls"], 1)
        self.assertGreater(report["canonical"]["snapshot_calls"], 1)


if __name__ == "__main__":
    unittest.main()
