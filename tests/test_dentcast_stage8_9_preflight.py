"""Stages 8-9 independent offline integration and fail-closed release tests."""
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "dentcast_s89_preflight", ROOT / "tools/dentcast_stage8_9_preflight.py")
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)


class OfflineIntegrationTests(unittest.TestCase):
    def test_all_17_public_safe_routes_with_canonical_oracle(self):
        with patch.object(preflight, "baseline_check", return_value=[]):
            outcome = preflight.analyze("origin/main")
        self.assertEqual(outcome["issues"], [], outcome["issues"])
        self.assertEqual(outcome["route_cases_checked"], 17)
        self.assertEqual(outcome["stage8"], "STAGING_INTEGRATION_PASS")
        self.assertEqual(outcome["stage9"],
                         "PRE_ACTIVATION_PACKAGE_READY_ACTIVATION_BLOCKED")
        self.assertEqual(outcome["baseline_entrypoints_and_science"], "identical")
        for key in ("execution_authorized", "publish_authorized",
                    "merge_authorized", "activation_authorized",
                    "founder_approval_verified", "full_behavioral_parity_proven"):
            self.assertIs(outcome[key], False)
        self.assertEqual(len(outcome["blocked_external_gates"]), 7)
        self.assertTrue(all(not case["issues"] for case in outcome["routes"]))

    def test_live_entrypoint_drift_blocks_integration(self):
        with patch.object(preflight, "baseline_check", return_value=["CLAUDE.md"]):
            outcome = preflight.analyze("origin/main")
        self.assertIn("LIVE_CONTRACT_DRIFT:CLAUDE.md", outcome["issues"])
        self.assertEqual(outcome["stage8"], "STAGING_INTEGRATION_BLOCKED")
        self.assertFalse(outcome["activation_authorized"])

    def test_missing_or_unsafe_baseline_never_green(self):
        with self.assertRaisesRegex(ValueError, "UNSAFE_BASELINE_REF"):
            preflight.baseline_check((), "--upload=whatever")
        with patch.object(preflight, "baseline_check",
                          side_effect=ValueError("MISSING_BASELINE_FILE")):
            outcome = preflight.analyze("origin/main")
        self.assertEqual(outcome["baseline_entrypoints_and_science"], "not_verified")
        self.assertTrue(any("BASELINE_CHECK_FAILED:" in x for x in outcome["issues"]))
        self.assertFalse(outcome["merge_authorized"])
        self.assertIn("BASELINE_NOT_CHECKED", preflight.analyze()["issues"])

    def test_missing_canonical_step_detected_by_independent_oracle(self):
        original = preflight._load
        class BrokenRoute:
            @staticmethod
            def compile_steps(request):
                plan = original("test_real_s89_route", "tools/dentcast_stage3_route.py").compile_steps(request)
                if plan["route"] == "publication" and request.get("category") == "clinical":
                    plan["ordered_steps"] = [
                        s for s in plan["ordered_steps"]
                        if s["step_id"] != "evidence:des-fidelity"]
                return plan
        def load(name, file):
            return BrokenRoute if name == "s89_route" else original(name, file)
        with patch.object(preflight, "_load", side_effect=load):
            with patch.object(preflight, "baseline_check", return_value=[]):
                result = preflight.analyze("origin/main")
        self.assertTrue(any("MISSING_REQUIRED_STEP:evidence:des-fidelity" in s
                            for s in result["issues"]), result["issues"])
        self.assertFalse(result["activation_authorized"])

    def test_cycle3_independent_missing_route_steps_fail_closed(self):
        route = preflight._load("cycle3_route", "tools/dentcast_stage3_route.py")
        oracle = preflight._load("cycle3_oracle", "tools/audit_dentcast_stage7_parity.py")
        for cat, challenge, omitted in (
            ("glossary", False, "brain:glossary-register"),
            ("litecast", False, "page:litecast-register"),
            ("sharehub", False, "english:mirror"),
            ("sharehub", True, "challenge:public"),
        ):
            with self.subTest(category=cat, challenge=challenge):
                request = {"has_text": True, "has_paper": False,
                           "category": cat, "challenge": challenge}
                plan = route.compile_steps(request)
                self.assertEqual(oracle.inspect_route(plan), [])
                plan["ordered_steps"] = [s for s in plan["ordered_steps"]
                                         if s["step_id"] != omitted]
                self.assertIn("MISSING_REQUIRED_STEP:" + omitted,
                              oracle.inspect_route(plan))

    def test_real_stage9_cannot_be_self_certified_by_a_boolean(self):
        with patch.object(preflight, "baseline_check", return_value=[]):
            result = preflight.analyze("origin/main")
        self.assertTrue(result["blocked_external_gates"])
        self.assertFalse(result["founder_approval_verified"])
        self.assertFalse(result["full_behavioral_parity_proven"])
        self.assertFalse(result["activation_authorized"])


if __name__ == "__main__":
    unittest.main()
