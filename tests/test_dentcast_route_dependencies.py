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

    def test_paper_only_honors_registered_dependencies(self):
        p = planner.plan({"has_text": False, "has_paper": True})
        self.assertEqual(audit.audit(p), [])

    def test_litecast_build_dependency_needs_contract_review(self):
        p = planner.plan({"has_text": True, "has_paper": False, "category": "litecast", "challenge": False})
        self.assertIn({"module": "build", "requires": "brain",
                       "code": "MISSING_OR_LATE_DEPENDENCY", "review_required": True},
                      audit.audit(p))


if __name__ == "__main__":
    unittest.main()
