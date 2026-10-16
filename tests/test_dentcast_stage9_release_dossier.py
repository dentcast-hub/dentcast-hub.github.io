"""Stage 9 final offline handoff checks; no release authority is generated."""
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
import sys
sys.path.insert(0, str(ROOT / "tools"))
spec = importlib.util.spec_from_file_location(
    "dc_stage9_dossier", ROOT / "tools/dentcast_stage9_release_dossier.py")
dossier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dossier)


class Stage9ReleaseBoundaryTests(unittest.TestCase):
    def test_explicit_staging_writers_only(self):
        valid = (
            ".dentcast/workflows/README.md",
            ".dentcast/workflows/modules/STAGE-9-PRE-ACTIVATION.md",
            ".github/workflows/publishing-route-staging-tests.yml",
            "tools/dentcast_stage9_release_dossier.py",
            "tools/audit_dentcast_stage2_contract.py",
            "tools/validate_dentcast_route_plan_draft.py",
            "tests/test_dentcast_stage7_parity.py",
            ".dentcast/execution-memory/runs/stage6-smoke-20261016/state.json",
        )
        for path in valid:
            self.assertTrue(dossier.in_staging_scope(path), path)
        invalid = (
            "sharehub/share-34.html", "plus/des-scores.json",
            ".dentcast/des-v3.4-knowledge.md",
            "tools/des_fidelity_units.py", "CLAUDE.md", "AGENTS.md",
            ".cursor/rules/dentcast-router.mdc", "dc-nav.js",
            ".dentcast/execution-memory/runs/real-patient/state.json",
        )
        for path in invalid:
            self.assertFalse(dossier.in_staging_scope(path), path)

    def test_actual_git_dossier_still_blocks_every_external_gate(self):
        out = dossier.evaluate("origin/main")
        self.assertEqual(out["issues"], [], out["issues"])
        self.assertEqual(out["stage9_offline"], "FINAL_STAGING_HANDOFF_PASS")
        self.assertTrue(out["changed_file_count"] > 0)
        self.assertEqual(out["out_of_scope_files"], [])
        self.assertTrue(out["live_entrypoints_identical_to_main"])
        self.assertEqual(len(out["closed_external_gates"]), 7)
        self.assertFalse(out["permission_to_merge"])
        self.assertFalse(out["permission_to_publish"])
        self.assertFalse(out["permission_to_activate_router"])
        self.assertFalse(out["founder_consent_verified"])
        self.assertFalse(out["verified_live_end_to_end_parity"])
        self.assertEqual(len(out["candidate_sha"]), 40)
        self.assertEqual(len(out["main_baseline_sha"]), 40)

    def test_unexpected_real_page_mutation_blocks_handoff(self):
        original = dossier.stage9_changed_files
        with patch.object(dossier, "stage9_changed_files",
                          side_effect=lambda ref: original(ref) + ["sharehub/share-999.html"]):
            out = dossier.evaluate("origin/main")
        self.assertIn("OUT_OF_SCOPE_FILE:sharehub/share-999.html", out["issues"])
        self.assertEqual(out["stage9_offline"], "FINAL_STAGING_HANDOFF_BLOCKED")
        self.assertFalse(out["permission_to_publish"])

    def test_missing_baseline_cannot_make_fake_green(self):
        with patch.object(dossier, "git", side_effect=ValueError("MISSING_GIT_REF")):
            out = dossier.evaluate("origin/main")
        self.assertEqual(out["stage9_offline"], "FINAL_STAGING_HANDOFF_BLOCKED")
        self.assertTrue(any("GIT_RELEASE_INSPECTION_BLOCKED" in item
                            for item in out["issues"]))
        self.assertFalse(out["permission_to_merge"])


if __name__ == "__main__":
    unittest.main()
