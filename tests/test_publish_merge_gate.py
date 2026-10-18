"""Unit tests for the pre-merge publication completion gate."""
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import check_publish_merge_gate as gate


def handoff(status="in_progress"):
    fence = chr(96) * 3
    return (
        "<!-- dentcast-publish-state-v1 -->\n" + fence + "json\n"
        + '{"publication":{"content_id":"sharehub/share-35","status":"'
        + status + '"}}\n' + fence
        + "\n<!-- /dentcast-publish-state-v1 -->"
    )


class PublicationMergeGateTests(unittest.TestCase):
    def test_active_handoff_blocks_publication_changes(self):
        ok, reason = gate.check_merge(["sharehub/share-35.html"], handoff())
        self.assertFalse(ok)
        self.assertIn("UNFINISHED_PUBLICATION_HANDOFF", reason)

    def test_non_content_pr_ignores_existing_handoff(self):
        ok, reason = gate.check_merge([".github/workflows/sitemap_only.yml"], handoff())
        self.assertTrue(ok)
        self.assertEqual(reason, "no publication content changed")

    def test_removed_handoff_allows_content_after_completion(self):
        ok, reason = gate.check_merge(["sharehub/share-35.html"], None)
        self.assertTrue(ok)
        self.assertEqual(reason, "no active handoff remains")

    def test_malformed_handoff_fails_closed_for_publication(self):
        ok, reason = gate.check_merge(["dentcast-brain.json"], "not a handoff")
        self.assertFalse(ok)
        self.assertEqual(reason, "PUBLISH_HANDOFF_FORMAT_INVALID")

    def test_content_sources_are_classified(self):
        for path in ("dentcast-brain.json", "insight/insight-1.html",
                     "glossary/glossary.json", "plus/des-scores.json"):
            with self.subTest(path=path):
                self.assertTrue(gate.is_publication_path(path))


if __name__ == "__main__":
    unittest.main()
