"""Stage 2 canonical-contract audit and adversarial route fixtures (no publishing)."""
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


audit_module = load("stage2_contract_audit", "tools/audit_dentcast_stage2_contract.py")
planner = load("stage2_planner", "tools/dentcast_route_plan_draft.py")
dependencies = load("stage2_dependencies", "tools/audit_dentcast_route_dependencies.py")
validator = load("stage2_validator", "tools/validate_dentcast_route_plan_draft.py")


def route(category="clinical", paper=False, challenge=False):
    return planner.plan({"has_text": True, "has_paper": paper,
                         "category": category, "challenge": challenge})


def ids(plan):
    return [m["id"] for m in plan["ordered_modules"]]


class Stage2ContractTests(unittest.TestCase):
    def test_canonical_all_rules_slices_entrypoints_and_15_modules(self):
        report = audit_module.audit()
        self.assertEqual(report["issues"], [])
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["hard_rules_mapped"], 17)
        self.assertEqual(report["contract_modules_mapped"], 15)
        self.assertEqual(len(report["canonical_slice_ranges"]), 12)
        self.assertEqual(report["live_entrypoints_checked"], 5)
        self.assertGreaterEqual(report["canonical_headings_with_owner"], 85)
        self.assertTrue(report["not_execution_or_behavioral_parity"])

    def test_negative_missing_slice_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.fixture_root(tmp)
            p = root / ".dentcast/workflows/modules/09-challenge.md"
            p.write_text(p.read_text(encoding="utf-8").replace("public half", "public HALF", 1),
                         encoding="utf-8")
            problems = audit_module.audit(root)["issues"]
            self.assertTrue(any("CANONICAL_SLICE_MISMATCH" in x for x in problems), problems)

    def test_negative_old_litecast_build_dependency_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.fixture_root(tmp)
            p = root / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json"
            obj = json.loads(p.read_text(encoding="utf-8"))
            next(m for m in obj["modules"] if m["id"] == "build")["requires"].append("brain")
            p.write_text(json.dumps(obj), encoding="utf-8")
            problems = audit_module.audit(root)["issues"]
            self.assertIn("LITECAST_BUILD_WRONGLY_REQUIRES_BRAIN", problems)

    def test_negative_merge_pulse_push_phases_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.fixture_root(tmp)
            p = root / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json"
            obj = json.loads(p.read_text(encoding="utf-8"))
            next(m for m in obj["modules"] if m["id"] == "notification")["phase_invocations"] = []
            p.write_text(json.dumps(obj), encoding="utf-8")
            self.assertIn("NOTIFICATION_PULSE_AND_PUSH_PHASES_NOT_SPLIT",
                          audit_module.audit(root)["issues"])

    def test_negative_glossary_push_marker_skip_deleted(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.fixture_root(tmp)
            p = root / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json"
            obj = json.loads(p.read_text(encoding="utf-8"))
            notification = next(m for m in obj["modules"] if m["id"] == "notification")
            notification["phase_invocations"][1]["may_skip_for"].remove("glossary")
            p.write_text(json.dumps(obj), encoding="utf-8")
            self.assertIn("PHASE_E_CANONICAL_SKIP_SET_MISMATCH",
                          audit_module.audit(root)["issues"])

    def test_negative_entrypoint_rerouted_early_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.fixture_root(tmp)
            p = root / "CLAUDE.md"
            p.write_text(p.read_text(encoding="utf-8") +
                         "\nPublish using dentcast_orchestrator_draft.py\n", encoding="utf-8")
            self.assertTrue(any("LIVE_ENTRYPOINT_PREMATURE_STAGING_ACTIVATION" in e
                                for e in audit_module.audit(root)["issues"]))

    @staticmethod
    def fixture_root(folder):
        root = Path(folder)
        paths = [".dentcast/workflows/README.md",
                 ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json",
                 ".dentcast/workflows/modules/MODULE-REGISTRY.draft.json",
                 *audit_module.ENTRYPOINTS,
                 *(".dentcast/workflows/modules/" + name for name in audit_module.SLICES)]
        contracts = json.loads((ROOT / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json").read_text(encoding="utf-8"))
        paths += [m["source_of_truth"] for m in contracts["modules"]]
        for rel in set(paths):
            to = root / rel
            to.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / rel, to)
        return root


class Stage2RoutesTests(unittest.TestCase):
    def check_route(self, plan, wanted, absent, name):
        self.assertEqual(plan["route"], name)
        self.assertEqual(plan["status"], "draft_requires_audit")
        actual = set(ids(plan))
        self.assertTrue(set(wanted) <= actual, (name, wanted, actual))
        self.assertFalse(set(absent) & actual, (name, absent, actual))
        self.assertEqual(dependencies.audit(plan), [], name)
        self.assertEqual(validator.validate(plan, set(planner.MODULES)), [], name)
        self.assertTrue(plan["no_side_effects"])
        self.assertTrue(plan["unresolved"], "This is NOT an executable/publishable plan")

    def test_paper_only_cabinet_two_parts_no_publish(self):
        p = planner.plan({"has_text": False, "has_paper": True})
        self.check_route(p, ["intake", "paper-cabinet"],
                         ["page", "brain", "english", "build", "notification", "verify", "semantic-links"],
                         "paper-only")
        self.assertIn("NO Part 3 credit", " ".join(p["unresolved"]))

    def test_publication_requires_brain_paths_pulse_build_then_english(self):
        p = route()
        self.check_route(p, ["page", "taxonomy", "navigation", "semantic-links",
                             "brain", "pathways", "notification", "build", "english", "verify"],
                         ["paper-cabinet", "challenge"], "publication")
        seq = ids(p)
        self.assertLess(seq.index("page"), seq.index("taxonomy"))
        self.assertLess(seq.index("taxonomy"), seq.index("navigation"))
        self.assertLess(seq.index("brain"), seq.index("pathways"))
        self.assertLess(seq.index("notification"), seq.index("build"))
        self.assertLess(seq.index("build"), seq.index("english"))
        self.assertLess(seq.index("english"), seq.index("verify"))

    def test_publication_attached_paper_in_all_categories(self):
        for cat in ("sharehub", "clinical", "notecast", "chairside", "episode"):
            with self.subTest(cat=cat):
                self.check_route(route(category=cat, paper=True),
                                 ["paper-cabinet", "page", "english", "verify"], [],
                                 "publication+paper")

    def test_litecast_uses_internal_semantics_pulse_and_build(self):
        self.check_route(route(category="litecast"),
                         ["page", "semantic-links", "notification", "build", "verify"],
                         ["taxonomy", "navigation", "brain", "pathways", "english"],
                         "litecast")

    def test_litecast_with_paper_keeps_paper_additive(self):
        self.check_route(route(category="litecast", paper=True),
                         ["paper-cabinet", "semantic-links", "notification", "build", "verify"],
                         ["brain", "taxonomy", "english"], "litecast+paper")

    def test_challenge_keeps_brain_push_and_skips_des_pathway_english(self):
        self.check_route(route(category="sharehub", challenge=True),
                         ["page", "taxonomy", "semantic-links", "challenge", "brain",
                          "notification", "build", "verify"],
                         ["pathways", "english", "evidence", "learning-assets"], "challenge")

    def test_glossary_phase_e_skip_contract_while_pulse_still_runs(self):
        p = route(category="glossary")
        self.check_route(p, ["page", "taxonomy", "semantic-links", "brain",
                             "notification", "build", "english", "verify"], [], "publication")
        import json
        contract = json.loads((ROOT / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json").read_text(encoding="utf-8"))
        marker = next(m for m in contract["modules"] if m["id"] == "notification")["phase_invocations"][1]
        self.assertIn("glossary", marker["may_skip_for"])

    def test_challenge_paper_additive(self):
        self.check_route(route(category="chairside", challenge=True, paper=True),
                         ["paper-cabinet", "challenge", "brain", "notification", "build", "verify"],
                         ["english", "pathways"], "challenge+paper")

    def test_negative_no_content_no_paper_and_unknown_challenge(self):
        self.assertEqual(planner.plan({"has_text": False, "has_paper": False})["code"], "ROUTE_EMPTY")
        self.assertEqual(planner.plan({"has_text": True, "has_paper": False,
                                      "category": "clinical"})["code"], "CHALLENGE_UNRESOLVED")
        self.assertEqual(planner.plan({"has_text": True, "has_paper": False,
                                      "category": "bogus", "challenge": False})["code"], "CATEGORY_RULES_NOT_MAPPED")

    def test_negative_validator_rejects_false_english_and_false_paper(self):
        p = route(category="litecast")
        p["ordered_modules"].insert(-1, {"id": "english", "contract": "wrong"})
        self.assertIn("LITECAST_ENGLISH_FORBIDDEN",
                      validator.validate(p, set(planner.MODULES)))
        p2 = route(category="clinical")
        p2["ordered_modules"].append({"id": "paper-cabinet", "contract": "wrong"})
        self.assertIn("UNJUSTIFIED_PAPER_BRANCH",
                      validator.validate(p2, set(planner.MODULES)))


if __name__ == "__main__":
    unittest.main()
