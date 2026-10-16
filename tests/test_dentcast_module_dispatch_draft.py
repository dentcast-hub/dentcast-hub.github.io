"""First callable staging module: cross-agent intake shape adapter."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


planner = load("planner", "dentcast_route_plan_draft.py")
adapter = load("adapter", "dentcast_module_dispatch_draft.py")
checkpoint = load("checkpoint", "dentcast_checkpoint_draft.py")
store = load("store", "dentcast_checkpoint_store_draft.py")


def sample():
    return planner.plan({"has_text": True, "has_paper": False, "category": "clinical", "challenge": False})


class ModuleDispatchTests(unittest.TestCase):
    def test_intake_dispatch_is_read_only(self):
        p = sample()
        req = adapter.invocation(p, "run-1", "rev-1")
        result = adapter.dispatch(req)
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["outputs"]["route"], "publication")
        self.assertFalse(result["execution_authorized"])
        self.assertEqual(result["artifacts"], [])

    def test_checkpoint_round_trip_from_real_adapter(self):
        p = sample()
        state = checkpoint.begin(p, "run-1", "rev-1")
        result = adapter.dispatch(adapter.invocation(p, "run-1", "rev-1"))
        state = checkpoint.accept(state, adapter.checkpoint_receipt(result, adapter.invocation(p, "run-1", "rev-1")), "rev-1")
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            store.save(path, state)
            state = store.load(path, "run-1", "rev-1", state["plan_digest"])
        self.assertEqual(state["sequence"][state["next_index"]], "page")
        self.assertFalse(state["execution_authorized"])

    def test_reject_unimplemented_module(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        req["module_id"] = "evidence"
        with self.assertRaisesRegex(ValueError, "MODULE_NOT_IMPLEMENTED"):
            adapter.dispatch(req)

    def test_reject_tampered_inputs(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        req["inputs"]["plan"]["route"] = "challenge"
        with self.assertRaisesRegex(ValueError, "INPUT_FINGERPRINT_MISMATCH"):
            adapter.dispatch(req)

    def test_reject_contract_version_mismatch(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        req["module_contract_version"] = "0.2"
        with self.assertRaisesRegex(ValueError, "CONTRACT_VERSION_MISMATCH"):
            adapter.dispatch(req)

    def test_reject_implicit_approval(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        req["approvals"] = {"publish": True}
        with self.assertRaisesRegex(ValueError, "UNSUPPORTED_DEPENDENCIES_OR_APPROVALS"):
            adapter.dispatch(req)

    def test_reject_unsafe_plan_even_with_correct_hash(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        req["inputs"]["plan"]["no_side_effects"] = False
        req["input_fingerprint"] = adapter.fingerprint(req["inputs"])
        with self.assertRaisesRegex(ValueError, "UNSAFE_PLAN"):
            adapter.dispatch(req)

    def test_reject_missing_original_invocation(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        with self.assertRaisesRegex(ValueError, "ORIGINAL_INVOCATION_REQUIRED"):
            adapter.checkpoint_receipt(adapter.dispatch(req))

    def test_reject_forged_run_identity(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        response = adapter.dispatch(req)
        response["run_id"] = "other-run"
        with self.assertRaisesRegex(ValueError, "ADAPTER_IDENTITY_MISMATCH"):
            adapter.checkpoint_receipt(response, req)

    def test_reject_forged_output(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        response = adapter.dispatch(req)
        response["outputs"]["route"] = "paper-only"
        with self.assertRaisesRegex(ValueError, "OUTPUT_MISMATCH"):
            adapter.checkpoint_receipt(response, req)

    def test_reject_hidden_approval_request(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        response = adapter.dispatch(req)
        response["approval_requests"] = ["publish"]
        with self.assertRaisesRegex(ValueError, "UNSAFE_ADAPTER_RESULT"):
            adapter.checkpoint_receipt(response, req)

    def test_reject_false_verification_scope(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        response = adapter.dispatch(req)
        response["verification"]["scope"] = "full-publish"
        with self.assertRaisesRegex(ValueError, "INVALID_VERIFICATION"):
            adapter.checkpoint_receipt(response, req)

    def test_reject_extra_response_field(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        response = adapter.dispatch(req)
        response["unreviewed"] = True
        with self.assertRaisesRegex(ValueError, "INVALID_RESPONSE_SCHEMA"):
            adapter.checkpoint_receipt(response, req)

    def test_reject_side_effect_result_as_checkpoint(self):
        req = adapter.invocation(sample(), "run-1", "rev-1")
        result = adapter.dispatch(req)
        result["artifacts"] = [{"path": "live.html"}]
        with self.assertRaisesRegex(ValueError, "UNSAFE_ADAPTER_RESULT"):
            adapter.checkpoint_receipt(result, req)


if __name__ == "__main__":
    unittest.main()
