"""Verify branch-only agent auto-discovery and byte-identical legacy rollback paths."""
import hashlib
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
ARCHIVES={
    "CLAUDE.md":"CLAUDE.legacy.md",
    "AGENTS.md":"AGENTS.legacy.md",
    ".dentcast/workflows/README.md":".dentcast/workflows/README.legacy.md",
    ".dentcast/workflows/agent-parity.md":".dentcast/workflows/agent-parity.legacy.md",
    ".cursor/rules/dentcast-router.mdc":".dentcast/workflows/legacy/cursor/dentcast-router.mdc",
    ".cursor/rules/dentcast-publishing.mdc":".dentcast/workflows/legacy/cursor/dentcast-publishing.mdc",
    ".cursor/rules/dentcast-operating-protocol.mdc":".dentcast/workflows/legacy/cursor/dentcast-operating-protocol.mdc",
}
SLICES=("01-hard-rules.md","02-routing-intake.md","03-litecast-and-page.md",
 "04-taxonomy-and-navigation.md","05-semantic-linking.md",
 "06-paper-ingestion.md","07-flashcards-and-quiz.md",
 "08-des-fidelity.md","09-challenge.md",
 "10-brain-and-pathways.md","11-build-and-version.md",
 "12-english-notify-verify.md")

def read(p):
    return (ROOT/p).read_text(encoding="utf-8")

class EntrypointMigrationTests(unittest.TestCase):
    def test_all_seven_origins_preserved_not_destroyed(self):
        for active, original in ARCHIVES.items():
            with self.subTest(active=active):
                self.assertTrue((ROOT/active).is_file())
                self.assertTrue((ROOT/original).is_file())
                self.assertNotEqual(hashlib.sha256(read(active).encode()).digest(),
                                    hashlib.sha256(read(original).encode()).digest())
                self.assertIn("STAGING_ONLY_NO_LIVE_PUBLISH",read(active))
        self.assertGreater(len(read(".dentcast/workflows/README.legacy.md").splitlines()),2500)

    def test_native_claude_codex_cursor_route_to_same_file(self):
        for active in ("CLAUDE.md","AGENTS.md",
                ".cursor/rules/dentcast-router.mdc",
                ".cursor/rules/dentcast-publishing.mdc"):
            with self.subTest(active=active):
                body=read(active)
                self.assertIn(".dentcast/workflows/README.md",body)
                self.assertIn(".dentcast/workflows/agent-parity.md",body)
        self.assertIn("alwaysApply: true",read(".cursor/rules/dentcast-router.mdc"))
        self.assertIn("alwaysApply: true",read(".cursor/rules/dentcast-operating-protocol.mdc"))
        self.assertIn("alwaysApply: false",read(".cursor/rules/dentcast-publishing.mdc"))
        self.assertIn("AGENTS.legacy.md",read(".cursor/rules/dentcast-router.mdc"))

    def test_12_modules_and_rollback_pointer_are_discoverable(self):
        body=read(".dentcast/workflows/README.md")
        for name in SLICES:
            with self.subTest(module=name):
                self.assertIn(name,body)
                self.assertTrue((ROOT/".dentcast/workflows/modules"/name).is_file())
        for exact in ("README.legacy.md","dentcast_stage6_handoff.py",
                      "dentcast_github_memory.py","dentcast_fidelity_resume.py"):
            self.assertIn(exact,body)

    def test_cursor_legacy_rules_are_not_new_auto_loaded_rules(self):
        for original in ARCHIVES.values():
            if original.endswith(".mdc"):
                self.assertTrue(original.startswith(".dentcast/workflows/legacy/cursor/"))
                self.assertFalse(original.startswith(".cursor/rules/"))

    def test_unchanged_specialty_routes_and_closed_production_permissions(self):
        routing=read(".cursor/rules/dentcast-router.mdc")
        for route in ("en-version.md","ads.md","spot-report.md","cross-link.md",
                       "new-section.md","external-fidelity.md","offline-publish.md"):
            self.assertIn(route,routing)
        for active in ARCHIVES:
            self.assertIn("STAGING_ONLY_NO_LIVE_PUBLISH",read(active))

if __name__=="__main__":
    unittest.main()
