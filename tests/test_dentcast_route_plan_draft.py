"""Staging route planner smoke tests; no GitHub, network or write operations."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "tools/dentcast_route_plan_draft.py"
spec = importlib.util.spec_from_file_location("route_draft", PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class RoutePlanTests(unittest.TestCase):
    def test_paper_only_never_publishes(self):
        result = mod.plan({"has_text": False, "has_paper": True})
        self.assertEqual(result["route"], "paper-only")
        self.assertEqual([x["id"] for x in result["ordered_modules"]],
                         ["intake", "paper-cabinet"])
        self.assertIn("NO Part 3 credit", " ".join(result["unresolved"]))

    def test_attached_paper_adds_cabinet(self):
        result = mod.plan({"has_text": True, "has_paper": True, "category": "clinical"})
        self.assertIn("paper-cabinet", [x["id"] for x in result["ordered_modules"]])
        self.assertEqual(result["status"], "draft_requires_audit")

    def test_litecast_no_english(self):
        result = mod.plan({"has_text": True, "has_paper": False, "category": "litecast"})
        self.assertNotIn("english", [x["id"] for x in result["ordered_modules"]])

    def test_challenge_no_english(self):
        result = mod.plan({"has_text": True, "has_paper": False, "category": "sharehub", "challenge": True})
        self.assertNotIn("english", [x["id"] for x in result["ordered_modules"]])
        self.assertIn("challenge", [x["id"] for x in result["ordered_modules"]])

    def test_closed_categories(self):
        for cat in ("dentai", "photocast"):
            with self.subTest(cat=cat):
                self.assertEqual(mod.plan({"has_text": True, "has_paper": False,
                                           "category": cat})["code"], "CATEGORY_CLOSED")

    def test_missing_inputs_fail_closed(self):
        self.assertEqual(mod.plan({"has_text": True})["code"], "ROUTE_INPUT_UNKNOWN")
        self.assertEqual(mod.plan({"has_text": True, "has_paper": False})["code"],
                         "CATEGORY_UNRESOLVED")

    def test_unknown_category_not_assumed(self):
        self.assertEqual(mod.plan({"has_text": True, "has_paper": False,
                                   "category": "imaginary"})["code"], "CATEGORY_RULES_NOT_MAPPED")

    def test_real_categories(self):
        for category in ("clinical", "chairside", "sharehub", "notecast", "meta", "episode"):
            with self.subTest(category=category):
                self.assertEqual(mod.plan({"has_text": True, "has_paper": False,
                                           "category": category})["status"], "draft_requires_audit")

    def test_challenge_flag_is_independent(self):
        result = mod.plan({"has_text": True, "has_paper": False,
                           "category": "sharehub", "challenge": True})
        self.assertEqual(result["route"], "challenge")
        self.assertNotIn("english", [x["id"] for x in result["ordered_modules"]])

    def test_invalid_challenge_flag(self):
        self.assertEqual(mod.plan({"has_text": True, "has_paper": False,
                                   "category": "clinical", "challenge": "yes"})["code"],
                         "CHALLENGE_UNRESOLVED")

    def test_empty_route(self):
        self.assertEqual(mod.plan({"has_text": False, "has_paper": False})["code"], "ROUTE_EMPTY")

    def test_no_authorized_skips_in_draft(self):
        result = mod.plan({"has_text": True, "has_paper": False, "category": "clinical"})
        self.assertTrue(all(x["status"] == "not_scheduled_pending_rule_audit"
                            for x in result["not_scheduled"]))


if __name__ == "__main__":
    unittest.main()
