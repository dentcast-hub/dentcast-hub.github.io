"""Dependency audit tests document staging contract mismatches without authorizing skips."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


planner = load("planner", "tools/dentcast_route_plan_draft.py")
audit = load("dag_audit", "tools/audit_dentcast_route_dependencies.py")


class DraftDependencyAuditTests(unittest.TestCase):
    def test_normal_route_honors_registered_dependencies(self):
        p = planner.plan({"has_text": True, "has_paper": False, "category": "clinical", "challenge": False})
        self.assertEqual(audit.audit(p), [])

    def test_challenge_still_runs_push_but_not_english_or_pathways(self):
        p = planner.plan({"has_text": True, "has_paper": False, "category": "clinical", "challenge": True})
        ids = [m["id"] for m in p["ordered_modules"]]
        self.assertIn("notification", ids)
        self.assertNotIn("english", ids)
        self.assertNotIn("pathways", ids)
        self.assertEqual(audit.audit(p), [])

    def test_paper_only_honors_registered_dependencies(self):
        p = planner.plan({"has_text": False, "has_paper": True})
        self.assertEqual(audit.audit(p), [])

    def test_litecast_internal_links_and_build_without_specialist_brain(self):
        p = planner.plan({"has_text": True, "has_paper": False, "category": "litecast", "challenge": False})
        ids = [m["id"] for m in p["ordered_modules"]]
        self.assertIn("semantic-links", ids)
        self.assertIn("notification", ids)  # C6 Pulse, not Phase E push
        self.assertIn("build", ids)
        self.assertNotIn("brain", ids)
        self.assertNotIn("english", ids)
        self.assertEqual(audit.audit(p), [])


if __name__ == "__main__":
    unittest.main()
