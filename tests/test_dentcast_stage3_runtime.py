"""Stage 3 full dry-run across 15 callable validators, with failure/side-effect guards.

The fixtures contain synthetic digest reports only. They never claim actual
page publication, scientific execution, source access or founder approvals.
"""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / file)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


route_compiler = load("test_s3_compile", "dentcast_stage3_route.py")
module_engine = load("test_s3_modules", "dentcast_stage3_modules.py")
runner = load("test_s3_runner", "dentcast_stage3_orchestrator.py")
DIGEST = "a" * 64
REVISION = "b" * 40


def request(category="clinical", paper=False, challenge=False):
    return {"has_text": True, "has_paper": paper, "category": category,
            "challenge": challenge}


def fake_report(invocation):
    """Synthetic shape fixture, NEVER external verification or founder approval."""
    output = {}
    for k, v in invocation["required_output_schema"].items():
        output[k] = {
            "digest": DIGEST, "optional_digest": DIGEST, "text": "placeholder",
            "bool_true": True, "bool_false": False, "nonnegative": 0,
            "positive": 1, "zero": 0, "one": 1,
            "list": [], "mapping": {},
        }[v]
    if invocation["step"]["step_id"] == "intake:route":
        output["route"] = invocation["context"]["route"]
    return {"step_id": invocation["step"]["step_id"],
            "module_id": invocation["step"]["module_id"],
            "input_digest": invocation["input_digest"],
            "status": "completed",
            "outputs": output,
            "external_receipt_digest": DIGEST,
            "approval_receipt_digest": None,
            "error": None}


def ids(plan):
    return [s["step_id"] for s in plan["ordered_steps"]]


class Stage3RouteTests(unittest.TestCase):
    def test_publication_exact_substep_order(self):
        p = route_compiler.compile_steps(request())
        self.assertEqual(p["status"], "compiled_staging_requires_operator")
        self.assertEqual(ids(p), [
            "intake:route", "page:draft", "taxonomy:lock", "navigation:publish",
            "semantic-links:specialist", "learning-assets:flashcards",
            "learning-assets:quiz", "evidence:des-fidelity", "brain:append",
            "pathways:place", "notification:pulse", "build:version",
            "build:rebuild", "english:mirror", "notification:push-marker",
            "verify:phase-f",
        ])
        self.assertFalse(p["execution_authorized"])
        self.assertEqual(p["side_effects_permitted"], [])

    def test_all_seven_route_variants(self):
        fixtures = [
            (request(), "publication"),
            (request(paper=True), "publication+paper"),
            (request(category="litecast"), "litecast"),
            (request(category="litecast", paper=True), "litecast+paper"),
            (request(challenge=True), "challenge"),
            (request(challenge=True, paper=True), "challenge+paper"),
            ({"has_text": False, "has_paper": True}, "paper-only"),
        ]
        for req, expected in fixtures:
            with self.subTest(route=expected):
                p = route_compiler.compile_steps(req)
                self.assertEqual(p["route"], expected)
                s = ids(p)
                self.assertEqual(len(s), len(set(s)))
                self.assertEqual(s[0], "intake:route")
                if expected == "paper-only":
                    self.assertEqual(s, ["intake:route", "paper-cabinet:drive",
                                         "paper-cabinet:catalog", "verify:paper-only"])
                else:
                    self.assertEqual(s[-1], "verify:phase-f")
                    self.assertLess(s.index("notification:pulse"), s.index("build:rebuild"))
                    if "english:mirror" in s:
                        self.assertLess(s.index("build:rebuild"), s.index("english:mirror"))
                    if "notification:push-marker" in s:
                        self.assertLess(s.index("build:rebuild"), s.index("notification:push-marker"))
                if expected.startswith("litecast"):
                    self.assertIn("semantic-links:litecast", s)
                    for item in ("taxonomy:lock", "brain:append", "english:mirror",
                                 "notification:push-marker", "pathways:place"):
                        self.assertNotIn(item, s)
                if expected.startswith("challenge"):
                    self.assertIn("challenge:public", s)
                    for item in ("evidence:des-fidelity", "english:mirror",
                                 "learning-assets:quiz", "pathways:place"):
                        self.assertNotIn(item, s)
                    self.assertIn("notification:push-marker", s)
                if "+paper" in expected:
                    self.assertIn("paper-cabinet:credit", s)
                    self.assertLess(s.index("paper-cabinet:catalog"),
                                    s.index("paper-cabinet:credit"))

    def test_unknown_route_and_missing_challenge_fail_closed(self):
        for request_input in (
            {"has_text": False, "has_paper": False},
            {"has_text": True, "has_paper": False, "category": "clinical"},
            request(category="bogus"),
            request(category="glossary"),
            request(category="litecast", challenge=True),
        ):
            with self.subTest(request=request_input):
                self.assertEqual(route_compiler.compile_steps(request_input)["status"],
                                 "blocked")

    def test_all_15_owners_have_real_callable_handlers_and_owned_steps(self):
        p = route_compiler.compile_steps(request(paper=True))
        used = {s["module_id"] for s in p["ordered_steps"]}
        used.add("challenge")
        self.assertEqual(set(module_engine.HANDLERS), set(route_compiler.planner.MODULES))
        self.assertEqual(used, set(module_engine.HANDLERS))
        self.assertTrue(all(callable(fn) for fn in module_engine.HANDLERS.values()))
        self.assertTrue(set(route_compiler.SOURCE_STEPS) <= set(module_engine.SCHEMAS))

    def test_source_paths_and_prerequisites_are_concrete(self):
        p = route_compiler.compile_steps(request(paper=True))
        for i, step in enumerate(p["ordered_steps"]):
            self.assertTrue((ROOT / step["source"]).is_file())
            self.assertEqual(step["requires_step"],
                             p["ordered_steps"][i-1]["step_id"] if i else None)
            self.assertTrue(step["requires_external_result"])


class Stage3ModuleTests(unittest.TestCase):
    def setup_invocation(self, req=None):
        state = runner.begin(req or request(), "test-run", REVISION)
        return state, runner.next_invocation(state)

    def test_every_step_accepts_only_schema_validated_synthetic_reports(self):
        for req in (request(), request(paper=True), request(category="litecast"),
                    request(challenge=True), {"has_text": False, "has_paper": True}):
            state = runner.begin(req, "synthetic-1", REVISION)
            count = len(state["plan"]["ordered_steps"])
            for _ in range(count):
                inv = runner.next_invocation(state)
                self.assertIsNotNone(inv)
                state = runner.submit(state, fake_report(inv))
                self.assertFalse(state["execution_authorized"])
                self.assertFalse(state["real_publish_completed"])
            self.assertIsNone(runner.next_invocation(state))
            self.assertEqual(runner.stage3_status(state),
                             "all_contract_reports_validated_staging_only_not_published")
            self.assertEqual(len(state["receipts"]), count)

    def test_no_implicit_approval_or_scientific_calculation(self):
        inv = runner.next_invocation(runner.begin(request(), "test-2", REVISION))
        self.assertIn("user-string-provenance", inv["step"]["approval_gates"])
        self.assertFalse(inv["execution_authorized"])
        self.assertTrue(inv["requires_external_operator"])
        self.assertNotIn("source_text", inv["required_output_schema"])

    def test_rejects_forged_report_identity_and_digest(self):
        state, inv = self.setup_invocation()
        for field, value in (("module_id", "brain"), ("step_id", "brain:append"),
                             ("input_digest", "c" * 64)):
            with self.subTest(field=field):
                report = fake_report(inv)
                report[field] = value
                with self.assertRaises(ValueError):
                    runner.submit(state, report)
        self.assertEqual(state["next_index"], 0)

    def test_rejects_missing_artifact_receipt_and_unknown_outputs(self):
        state, inv = self.setup_invocation()
        for case in ("without_proof", "extra_field", "bad_digest"):
            report = fake_report(inv)
            if case == "without_proof":
                report["external_receipt_digest"] = None
            elif case == "extra_field":
                report["outputs"]["patient_name"] = "SECRET"
            else:
                report["outputs"]["request_digest"] = "too short"
            with self.subTest(case=case), self.assertRaises(ValueError):
                runner.submit(state, report)

    def test_all_semantic_links_must_be_fresh_and_not_six(self):
        for category in ("clinical", "litecast"):
            state = runner.begin(request(category=category), "semantics", REVISION)
            while runner.next_invocation(state)["step"]["module_id"] != "semantic-links":
                state = runner.submit(state, fake_report(runner.next_invocation(state)))
            inv = runner.next_invocation(state)
            for update in (
                {"related_link_count": 6},
                {"fresh_05": False} if category == "litecast" else {"fresh_47": False},
            ):
                report = fake_report(inv)
                report["outputs"].update(update)
                with self.subTest(cat=category, update=update), self.assertRaises(ValueError):
                    runner.submit(state, report)

    def test_evidence_cannot_fake_missing_independent_reviews(self):
        state = runner.begin(request(), "evidence", REVISION)
        while runner.next_invocation(state)["step"]["module_id"] != "evidence":
            state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        report = fake_report(inv)
        report["outputs"]["independent_checks_verified"] = False
        with self.assertRaisesRegex(ValueError, "INVALID_OUTPUT_FIELD"):
            runner.submit(state, report)

    def test_skip_only_with_canonical_authority_and_approval(self):
        state = runner.begin(request(), "skiptest", REVISION)
        while runner.next_invocation(state)["step"]["module_id"] != "evidence":
            state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        report = fake_report(inv)
        report.update({"status": "skipped_with_reason", "outputs":
                       {"canonical_skip_rule": "FOUNDER_APPROVED_NO_DES"}})
        with self.assertRaisesRegex(ValueError, "SKIP_REQUIRES"):
            runner.submit(state, report)
        report["approval_receipt_digest"] = DIGEST
        state = runner.submit(state, report)
        self.assertEqual(state["receipts"]["evidence:des-fidelity"]["status"],
                         "canonical_skip_staging_only")

    def test_pause_recover_requires_matching_receipt_digest(self):
        state, inv = self.setup_invocation()
        report = fake_report(inv)
        report.update({"status": "awaiting_approval", "outputs": {},
                       "external_receipt_digest": None, "error": "FOUNDER_GATE"})
        paused = runner.submit(state, report)
        self.assertEqual(runner.stage3_status(paused), "paused_staging")
        with self.assertRaisesRegex(ValueError, "PAUSED_REQUIRES"):
            runner.next_invocation(paused)
        with self.assertRaisesRegex(ValueError, "PAUSE_RECEIPT_CHANGED"):
            runner.recover(paused, "0" * 64)
        digest = module_engine.hash_public(paused["receipts"]["intake:route"])
        resumed = runner.recover(paused, digest)
        self.assertFalse(resumed["paused"])
        self.assertEqual(resumed["next_index"], 0)
        completed = runner.submit(resumed, fake_report(runner.next_invocation(resumed)))
        self.assertEqual(completed["next_index"], 1)
        self.assertEqual(len(completed["history"]), 3)

    def test_tampered_receipt_and_plan_not_accepted(self):
        state, inv = self.setup_invocation()
        complete = runner.submit(state, fake_report(inv))
        corrupted = copy.deepcopy(complete)
        corrupted["receipts"]["intake:route"]["status"] = "made_up"
        with self.assertRaises(ValueError):
            runner.validate_state(corrupted)
        tampered_plan = copy.deepcopy(complete)
        tampered_plan["plan"]["ordered_steps"].pop()
        with self.assertRaisesRegex(ValueError, "TAMPERED_PLAN"):
            runner.validate_state(tampered_plan)

    def test_local_checkpoint_cas_stale_writer_and_restart(self):
        state = runner.begin(request(), "checked", REVISION)
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "checkpoint.json"
            digest = runner.save_checked(path, state)
            loaded = runner.load_checked(path, "checked", REVISION, state["plan_digest"])
            self.assertEqual(loaded, state)
            progressed = runner.submit(loaded, fake_report(runner.next_invocation(loaded)))
            new_digest = runner.save_checked(path, progressed, expected_digest=digest)
            self.assertNotEqual(new_digest, digest)
            with self.assertRaisesRegex(ValueError, "STALE_CHECKPOINT_WRITER"):
                runner.save_checked(path, state, expected_digest=digest)
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_ALREADY_EXISTS"):
                runner.save_checked(path, state)
            with self.assertRaisesRegex(ValueError, "CHECKPOINT_IDENTITY_MISMATCH"):
                runner.load_checked(path, "other", REVISION, state["plan_digest"])

    def test_no_filesystem_content_writes_or_publish_even_if_reports_all_valid(self):
        state = runner.begin({"has_text": False, "has_paper": True}, "safe", REVISION)
        for _ in state["plan"]["ordered_steps"]:
            state = runner.submit(state, fake_report(runner.next_invocation(state)))
        self.assertFalse(state["execution_authorized"])
        self.assertFalse(state["real_publish_completed"])
        self.assertNotIn("verify:phase-f", state["receipts"])
        self.assertIn("verify:paper-only", state["receipts"])


if __name__ == "__main__":
    unittest.main()
