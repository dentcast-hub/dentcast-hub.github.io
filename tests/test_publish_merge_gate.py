"""Unit tests for the pre-merge publication completion and counter gate."""
import sys
from pathlib import Path
import unittest
import json
import tempfile
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import check_publish_merge_gate as gate
import dentcast_publish_handoff as h


def handoff(status="in_progress"):
    fence = chr(96) * 3
    return (
        "<!-- dentcast-publish-state-v1 -->\n" + fence + "json\n"
        + '{"publication":{"content_id":"sharehub/share-35","status":"'
        + status + '"}}\n' + fence
        + "\n<!-- /dentcast-publish-state-v1 -->"
    )


def counters(content="۳", share="۱"):
    return (
        "<!-- COUNTER:CONTENT:START -->" + content + "<!-- COUNTER:CONTENT:END -->"
        + "<!-- COUNTER:CAT_SHAREHUB:START -->" + share
        + "<!-- COUNTER:CAT_SHAREHUB:END -->"
    )


def sources(index=None):
    return {
        "index_html": index if index is not None else counters(),
        "brain_text": '[{"type":"sharehub"}]',
        "glossary_text": '{"glossary":[{}]}',
        "lite_text": '{"LightGlossary":[{}]}',
    }


class PublicationMergeGateTests(unittest.TestCase):
    def test_active_handoff_blocks_publication_changes(self):
        ok, reason = gate.check_merge(["sharehub/share-35.html"], handoff(), sources())
        self.assertFalse(ok)
        self.assertIn("UNFINISHED_PUBLICATION_HANDOFF", reason)

    def test_non_content_pr_ignores_existing_handoff(self):
        ok, reason = gate.check_merge([".github/workflows/sitemap_only.yml"], handoff(), None)
        self.assertTrue(ok)
        self.assertEqual(reason, "no publication content changed")

    def test_clean_handoff_requires_correct_generated_counters(self):
        ok, reason = gate.check_merge(["sharehub/share-35.html"], None, sources())
        self.assertTrue(ok)
        self.assertIn("CONTENT=۳", reason)

    def test_stale_counters_block_publication_merge(self):
        ok, reason = gate.check_merge(["dentcast-brain.json"], None, sources(counters("۲", "۰")))
        self.assertFalse(ok)
        self.assertIn("STALE_HOMEPAGE_COUNTER", reason)

    def test_malformed_handoff_fails_closed_for_publication(self):
        ok, reason = gate.check_merge(["dentcast-brain.json"], "not a handoff", sources())
        self.assertFalse(ok)
        self.assertEqual(reason, "PUBLISH_HANDOFF_FORMAT_INVALID")

    def test_content_sources_are_classified(self):
        for path in ("dentcast-brain.json", "insight/insight-1.html",
                     "glossary/glossary.json", "plus/des-scores.json"):
            with self.subTest(path=path):
                self.assertTrue(gate.is_publication_path(path))


class CompletionEvidenceTests(unittest.TestCase):
    def history(self, added, old=None, new=None, deleted=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "dentcast-brain.json").write_text(json.dumps(new or []))
            def git(_root, *args, **kwargs):
                if args[0] == "show" and args[1].endswith(":dentcast-brain.json"):
                    return json.dumps(old or []).encode()
                return b"receipt"
            with patch.object(h, "git", side_effect=git), patch.object(h, "text_git", return_value=deleted or ""):
                return gate.verify_publication_history(root, "base", added)

    def test_new_page_without_handoff_cannot_pass(self):
        with self.assertRaisesRegex(h.Blocked, "COMPLETION_RECEIPT_MISSING"):
            self.history(["sharehub/share-99.html"])

    def test_new_brain_entry_with_preexisting_page_cannot_pass(self):
        with self.assertRaisesRegex(h.Blocked, "COMPLETION_RECEIPT_MISSING"):
            self.history([], new=[{"page_url": "/sharehub/share-99.html"}])

    def test_unrelated_edit_needs_no_new_publication_receipt(self):
        self.assertEqual(self.history([]), set())

    def test_english_and_landing_are_not_new_publications(self):
        self.assertEqual(gate.publication_ids(["sharehub/en/share-99.html", "sharehub/index.html"]), set())

    def test_receipt_in_earlier_commit_is_used(self):
        with patch.object(gate, "reconcile_share35", return_value=False), patch.object(
                gate, "validate_completion", return_value="sharehub/share-99") as validate:
            self.assertEqual(self.history(["sharehub/share-99.html"], deleted="earlier-cleanup"), {"sharehub/share-99"})
            validate.assert_called_once()

    def test_receipt_survives_synthetic_pr_merge_checkout(self):
        import subprocess
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(["git", *args], cwd=root, text=True).strip()
            git("init", "-q")
            git("config", "user.name", "Test")
            git("config", "user.email", "test@example.invalid")
            (root / "dentcast-brain.json").write_text("[]")
            git("add", ".")
            git("commit", "-qm", "base")
            base = git("rev-parse", "HEAD")
            state = root / gate.STATE_PATH
            state.parent.mkdir()
            state.write_text("completed receipt")
            git("add", ".")
            git("commit", "-qm", "completed publication")
            checkpoint = git("rev-parse", "HEAD")
            state.unlink()
            git("add", "-u")
            git("commit", "-qm", "cleanup")
            tip = git("rev-parse", "HEAD")
            merge = git("commit-tree", "HEAD^{tree}", "-p", base, "-p", tip,
                        "-m", "synthetic PR merge")
            git("reset", "--hard", merge)
            self.assertEqual(h.checkpoint_revision(root, h.digest(b"completed receipt")), checkpoint)
            with patch.object(gate, "reconcile_share35", return_value=False), patch.object(
                    gate, "validate_completion", return_value="sharehub/share-99") as validate:
                self.assertEqual(gate.verify_publication_history(
                    root, base, ["sharehub/share-99.html"]), {"sharehub/share-99"})
                validate.assert_called_once_with(root, b"completed receipt")

    def test_receipt_for_another_page_does_not_authorize_new_page(self):
        with patch.object(gate, "reconcile_share35", return_value=False), patch.object(
                gate, "validate_completion", return_value="sharehub/share-98"):
            with self.assertRaisesRegex(h.Blocked, "COMPLETION_RECEIPT_MISSING"):
                self.history(["sharehub/share-99.html"], deleted="cleanup")

    def test_unrecognized_legacy_state_is_not_exempt(self):
        self.assertFalse(gate.reconcile_share35(ROOT, b"arbitrary stale state"))

    def test_receipt_failure_is_not_swallowed(self):
        with patch.object(gate, "reconcile_share35", return_value=False), patch.object(
                gate, "validate_completion", side_effect=h.Blocked("CURRENT_PUBLICATION_VERIFICATION_FAILED")):
            with self.assertRaisesRegex(h.Blocked, "VERIFICATION_FAILED"):
                self.history(["sharehub/share-99.html"], deleted="cleanup")


class CompletionTreeTests(unittest.TestCase):
    from test_dentcast_publish_lifecycle import LifecycleTests as Fixture
    setUp = Fixture.setUp
    prepare = Fixture.prepare
    deliver = Fixture.deliver

    def test_completed_checkpoint_is_checked_against_current_tree(self):
        self.prepare(complete=True)
        self.deliver()
        raw = (self.root / h.STATE_PATH).read_bytes()
        self.assertEqual(gate.validate_completion(self.root, raw), "note")
        (self.root / "note.html").write_text("changed after verification")
        with self.assertRaisesRegex(h.Blocked, "CHANGED_AFTER_COMPLETION"):
            gate.validate_completion(self.root, raw)

    def test_pending_ledger_is_rejected(self):
        self.prepare()
        self.deliver()
        with self.assertRaisesRegex(h.Blocked, "INCOMPLETE_PUBLICATION_RECEIPT"):
            gate.validate_completion(self.root, (self.root / h.STATE_PATH).read_bytes())

    def test_actual_verifier_failure_blocks_completed_ledger(self):
        self.prepare(complete=True)
        self.deliver()
        with patch.dict("os.environ", {"DENTCAST_FIXTURE_FAIL": "1"}):
            with self.assertRaisesRegex(h.Blocked, "CURRENT_PUBLICATION_VERIFICATION_FAILED"):
                gate.validate_completion(self.root, (self.root / h.STATE_PATH).read_bytes())


if __name__ == "__main__":
    unittest.main()
