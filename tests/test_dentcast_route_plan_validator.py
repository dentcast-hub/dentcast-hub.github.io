"""Negative tests for staging plan validation. No publishing operations."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("route_validator", ROOT / "tools/validate_dentcast_route_plan_draft.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
REGISTRY = {"intake", "paper-cabinet", "page", "english", "verify"}


def sample(route="paper-only", ids=None):
    if ids is None:
        ids = ["intake", "paper-cabinet"]
    return {"status": "draft_requires_audit", "no_side_effects": True,
            "route": route, "ordered_modules": [{"id": x} for x in ids],
            "unresolved": ["paper-only: NO Part 3 credit"]}


class ValidatorTests(unittest.TestCase):
    def test_paper_only(self):
        self.assertEqual(mod.validate(sample(), REGISTRY), [])

    def test_paper_only_rejects_page(self):
        self.assertIn("PAPER_ONLY_MUST_NOT_PUBLISH",
                      mod.validate(sample(ids=["intake", "page", "paper-cabinet"]), REGISTRY))

    def test_paper_only_requires_part3_exception(self):
        p = sample()
        p["unresolved"] = ["other pending rule"]
        self.assertIn("PAPER_ONLY_PART3_RULE_MISSING", mod.validate(p, REGISTRY))

    def test_side_effects_must_be_disabled(self):
        p = sample()
        p["no_side_effects"] = False
        self.assertIn("SIDE_EFFECTS_NOT_DISABLED", mod.validate(p, REGISTRY))

    def test_duplicate_modules(self):
        self.assertIn("DUPLICATE_MODULE",
                      mod.validate(sample(ids=["intake", "paper-cabinet", "paper-cabinet"]), REGISTRY))

    def test_litecast_no_english(self):
        self.assertIn("LITECAST_ENGLISH_FORBIDDEN",
                      mod.validate(sample("litecast", ["intake", "page", "english", "verify"]), REGISTRY))

    def test_challenge_no_english(self):
        self.assertIn("CHALLENGE_ENGLISH_FORBIDDEN",
                      mod.validate(sample("challenge", ["intake", "page", "english", "verify"]), REGISTRY))

    def test_normal_publish_requires_english(self):
        self.assertIn("ENGLISH_MISSING",
                      mod.validate(sample("publication", ["intake", "page", "verify"]), REGISTRY))

    def test_unknown_module(self):
        self.assertIn("UNKNOWN_MODULE:bogus",
                      mod.validate(sample(ids=["intake", "bogus"]), REGISTRY))

    def test_invalid_module_identifier(self):
        p = sample()
        p["ordered_modules"] = [{"id": ["not", "hashable"]}]
        self.assertIn("INVALID_MODULE_ID", mod.validate(p, REGISTRY))

    def test_non_string_route(self):
        p = sample()
        p["route"] = None
        self.assertIn("INVALID_ROUTE", mod.validate(p, REGISTRY))

    def test_unknown_route(self):
        p = sample()
        p["route"] = "unmapped"
        self.assertIn("UNKNOWN_ROUTE", mod.validate(p, REGISTRY))

    def test_challenge_route_requires_flag(self):
        p = sample("challenge", ["intake", "page", "verify"])
        p["challenge"] = False
        self.assertIn("CHALLENGE_FLAG_MISMATCH", mod.validate(p, REGISTRY))

    def test_publication_cannot_claim_challenge(self):
        p = sample("publication", ["intake", "page", "english", "verify"])
        p["challenge"] = True
        self.assertIn("CHALLENGE_FLAG_MISMATCH", mod.validate(p, REGISTRY))

    def test_attached_paper_requires_module(self):
        p = sample("publication+paper", ["intake", "page", "english", "verify"])
        self.assertIn("PAPER_MODULE_MISSING", mod.validate(p, REGISTRY))

    def test_litecast_route_requires_category_match(self):
        p = sample("litecast", ["intake", "page", "verify"])
        p["category"] = "clinical"
        self.assertIn("LITECAST_CATEGORY_MISMATCH", mod.validate(p, REGISTRY))

    def test_unresolved_gate_must_be_list(self):
        p = sample()
        p["unresolved"] = 42
        issues = mod.validate(p, REGISTRY)
        self.assertIn("UNRESOLVED_AUDIT_GATES_MISSING", issues)
        self.assertIn("PAPER_ONLY_PART3_RULE_MISSING", issues)

    def test_unresolved_gate_must_contain_strings(self):
        p = sample()
        p["unresolved"] = [{"unsafe": True}]
        issues = mod.validate(p, REGISTRY)
        self.assertIn("UNRESOLVED_AUDIT_GATES_MISSING", issues)

    def test_not_authorized_to_execute(self):
        p = sample()
        p["status"] = "ready"
        self.assertIn("NOT_A_DRAFT_PLAN", mod.validate(p, REGISTRY))


if __name__ == "__main__":
    unittest.main()
