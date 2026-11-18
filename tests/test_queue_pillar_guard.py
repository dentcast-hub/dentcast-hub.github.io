"""Queue items must not reach Push 2 with a subtopic Phase F rejects.

Queue item 22 (2026-11-18) froze `pillar.subtopic = null` under the structured
pillar `removable-pros`; the queue tools accepted it and only Phase F, after
Push 2, refused it. queue_manifest.pillar_problem now runs at freeze
(queue_stamp P6) and in the publish-day dry run (queue_apply PILLAR_SUBTOPIC).
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import queue_manifest as qm  # noqa: E402
from build_pillar import PILLARS  # noqa: E402


class PillarGuard(unittest.TestCase):
    def setUp(self):
        self.structured = next(k for k, v in PILLARS.items() if v["subtopics"])
        self.slug = PILLARS[self.structured]["subtopics"][0]["slug"]

    def test_structured_pillar_needs_live_subtopic(self):
        self.assertIsNone(qm.pillar_problem({"primary": self.structured, "subtopic": self.slug}))
        self.assertIn("structured", qm.pillar_problem({"primary": self.structured, "subtopic": None}))
        self.assertIn("structured", qm.pillar_problem({"primary": self.structured, "subtopic": "no-such-slug"}))

    def test_unstructured_pillar_needs_null(self):
        self.assertIsNone(qm.pillar_problem({"primary": "not-a-structured-pillar", "subtopic": None}))
        self.assertIn("unstructured", qm.pillar_problem({"primary": "not-a-structured-pillar", "subtopic": "x"}))

    def test_no_pillar_is_fine(self):
        self.assertIsNone(qm.pillar_problem({"primary": None, "subtopic": None}))
        self.assertIsNone(qm.pillar_problem(None))

    def test_digital_removable_is_live(self):
        self.assertIsNone(qm.pillar_problem({"primary": "removable-pros", "subtopic": "digital-removable"}))


if __name__ == "__main__":
    unittest.main()
