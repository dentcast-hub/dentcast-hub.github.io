"""Staging-only platform-neutral module dispatch.

The first adapter is intentionally read-only: intake validates an already
constructed draft route. It does not claim to execute canonical Phase 0.
"""
import copy
import hashlib
import json

ALLOWED = {"intake"}
REQUIRED = {"run_id", "module_id", "module_contract_version", "source_revision",
            "attempt", "input_fingerprint", "inputs", "dependencies", "approvals"}


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


def dispatch(request):
    if not isinstance(request, dict) or not REQUIRED <= request.keys():
        raise ValueError("INVALID_INVOCATION")
    if request["module_id"] not in ALLOWED:
        raise ValueError("MODULE_NOT_IMPLEMENTED")
    if request["module_contract_version"] != "0.1":
        raise ValueError("CONTRACT_VERSION_MISMATCH")
    if not isinstance(request["run_id"], str) or not request["run_id"].strip():
        raise ValueError("INVALID_RUN_ID")
    if not isinstance(request["source_revision"], str) or not request["source_revision"].strip():
        raise ValueError("INVALID_SOURCE_REVISION")
    if type(request["attempt"]) is not int or request["attempt"] < 1:
        raise ValueError("INVALID_ATTEMPT")
    if request["dependencies"] != {} or request["approvals"] != {}:
        raise ValueError("UNSUPPORTED_DEPENDENCIES_OR_APPROVALS")
    inputs = request["inputs"]
    if not isinstance(inputs, dict) or set(inputs) != {"plan"}:
        raise ValueError("INVALID_INPUTS")
    if request["input_fingerprint"] != fingerprint(inputs):
        raise ValueError("INPUT_FINGERPRINT_MISMATCH")
    plan = inputs["plan"]
    if not isinstance(plan, dict) or plan.get("status") != "draft_requires_audit" or plan.get("no_side_effects") is not True:
        raise ValueError("UNSAFE_PLAN")
    ordered = plan.get("ordered_modules")
    if not isinstance(ordered, list) or not ordered or not isinstance(ordered[0], dict) or ordered[0].get("id") != "intake":
        raise ValueError("INTAKE_NOT_FIRST")
    return {"run_id": request["run_id"], "module_id": "intake",
            "module_contract_version": "0.1", "source_revision": request["source_revision"],
            "status": "completed", "input_fingerprint": request["input_fingerprint"],
            "outputs": {"route": plan.get("route"), "draft_status": "draft_requires_audit"},
            "artifacts": [], "decisions": [], "approval_requests": [],
            "invalidates": [], "verification": {"passed": True, "scope": "draft-shape-only"},
            "error": None, "execution_authorized": False}


def validate_response(request, response):
    """Independent fail-closed validation; never trust a module's self-reported success."""
    if not isinstance(request, dict) or not isinstance(response, dict):
        raise ValueError("INVALID_ADAPTER_RESULT")
    required = {"run_id", "module_id", "module_contract_version", "source_revision",
                "status", "input_fingerprint", "outputs", "artifacts", "decisions",
                "approval_requests", "invalidates", "verification", "error",
                "execution_authorized"}
    if set(response) != required:
        raise ValueError("INVALID_RESPONSE_SCHEMA")
    for field in ("run_id", "module_id", "module_contract_version", "source_revision",
                  "input_fingerprint"):
        if response[field] != request.get(field):
            raise ValueError("ADAPTER_IDENTITY_MISMATCH")
    if response["module_id"] != "intake" or response["status"] != "completed":
        raise ValueError("INVALID_ADAPTER_RESULT")
    if response["execution_authorized"] is not False:
        raise ValueError("UNAUTHORIZED_EXECUTION")
    if any(response[key] != [] for key in
           ("artifacts", "decisions", "approval_requests", "invalidates")):
        raise ValueError("UNSAFE_ADAPTER_RESULT")
    if response["error"] is not None:
        raise ValueError("INVALID_ADAPTER_RESULT")
    if response["verification"] != {"passed": True, "scope": "draft-shape-only"}:
        raise ValueError("INVALID_VERIFICATION")
    expected_outputs = {"route": request["inputs"]["plan"].get("route"),
                        "draft_status": "draft_requires_audit"}
    if response["outputs"] != expected_outputs:
        raise ValueError("OUTPUT_MISMATCH")
    if response["input_fingerprint"] != fingerprint(request["inputs"]):
        raise ValueError("INPUT_FINGERPRINT_MISMATCH")
    return True


def checkpoint_receipt(response, request=None):
    """Validate adapter result against its original invocation before checkpointing."""
    if request is None:
        raise ValueError("ORIGINAL_INVOCATION_REQUIRED")
    validate_response(request, response)
    return {"module_id": "intake", "status": "completed",
            "source_revision": response["source_revision"],
            "input_fingerprint": response["input_fingerprint"],
            "artifact_receipts": [], "verification": {"passed": True}}


def invocation(plan, run_id, revision):
    inputs = {"plan": copy.deepcopy(plan)}
    return {"run_id": run_id, "module_id": "intake", "module_contract_version": "0.1",
            "source_revision": revision, "attempt": 1, "input_fingerprint": fingerprint(inputs),
            "inputs": inputs, "dependencies": {}, "approvals": {}}
