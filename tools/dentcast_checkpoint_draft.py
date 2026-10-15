"""Read-only checkpoint state transitions for staging; never runs modules."""
import copy
import hashlib
import json


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def begin(plan, run_id, revision):
    if plan.get("status") != "draft_requires_audit" or plan.get("no_side_effects") is not True:
        raise ValueError("UNSAFE_PLAN")
    ids = [m["id"] for m in plan["ordered_modules"]]
    if not ids or ids[0] != "intake" or len(ids) != len(set(ids)):
        raise ValueError("INVALID_ORDER")
    if not run_id or not revision:
        raise ValueError("MISSING_IDENTITY")
    return {"run_id": run_id, "revision": revision, "plan_digest": digest(plan),
            "execution_authorized": False, "sequence": ids, "next_index": 0,
            "receipts": {}, "paused": False}


def accept(state, receipt, revision):
    if state["execution_authorized"] is not False or revision != state["revision"]:
        raise ValueError("STALE_OR_UNSAFE")
    required = {"module_id", "status", "source_revision", "input_fingerprint",
                "artifact_receipts", "verification"}
    if not isinstance(receipt, dict) or not required <= receipt.keys():
        raise ValueError("INVALID_RECEIPT")
    mid = receipt["module_id"]
    if mid in state["receipts"]:
        if state["receipts"][mid] == receipt:
            return copy.deepcopy(state)
        raise ValueError("CONFLICTING_REPLAY")
    if state["next_index"] >= len(state["sequence"]) or state["sequence"][state["next_index"]] != mid:
        raise ValueError("OUT_OF_ORDER")
    if receipt["source_revision"] != revision:
        raise ValueError("STALE_RECEIPT")
    if receipt["status"] not in {"completed", "blocked", "failed", "awaiting_approval"}:
        raise ValueError("INVALID_STATUS")
    if not isinstance(receipt["input_fingerprint"], str) or len(receipt["input_fingerprint"]) != 64:
        raise ValueError("INVALID_FINGERPRINT")
    if receipt["artifact_receipts"] or not isinstance(receipt["verification"], dict):
        raise ValueError("SIDE_EFFECTS_NOT_RECONCILED")
    if receipt["status"] == "completed" and receipt["verification"].get("passed") is not True:
        raise ValueError("NOT_VERIFIED")
    new = copy.deepcopy(state)
    new["receipts"][mid] = copy.deepcopy(receipt)
    if receipt["status"] == "completed":
        new["next_index"] += 1
    else:
        new["paused"] = True
    return new
