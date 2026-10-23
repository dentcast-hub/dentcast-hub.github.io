"""Fast Local contract: remove duplicate reads, not durable checkpoints."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc


class FastLocalTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp

    def test_advance_uses_one_canonical_load_per_step_without_duplicate_inspect(self):
        self.p["steps"] = lc.plan()
        first = h.save(self.root, self.p, initial=True)
        started = lc.step(self.root, first["sha256"], "rules", "started", [], None)
        # Two transitions: complete the already started rules checkpoint, and
        # start step 0. Each step() loads twice (read + CAS save), and advance
        # loads once at entry. Previously it redundantly loaded before each
        # transition as well. The skipped reads are neither remote verification
        # nor validation; save still reconstructs the full canonical snapshot.
        with patch.object(h, "load_state", wraps=h.load_state) as reads:
            out = lc.advance(self.root, started["sha256"], sid="rules",
                             evidence=["fixture:read full applicable hard rules"],
                             start_next=True)
        self.assertEqual(reads.call_count, 5)
        self.assertEqual([(x["id"], x["status"]) for x in out["transitions_written"]],
                         [("rules", "completed"), ("0", "started")])
        live, _ = h.load_state(self.root)
        self.assertEqual(live["publication"]["steps"][0]["status"], "completed")
        self.assertEqual(live["publication"]["steps"][1]["status"], "started")
        self.assertEqual(out["next_step"], "0")


if __name__ == "__main__":
    unittest.main()
