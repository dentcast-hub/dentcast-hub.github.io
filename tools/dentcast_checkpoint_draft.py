"""Read-only checkpoint state transitions for staging; never runs modules."""
import copy
import hashlib
import json
import re


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def begin(plan, run_id, revision):
    if plan.get("status") != "draft_requires_audit" or plan.get("no_side_effects") is not True:
        raise ValueError("UNSAFE_PLAN")
    ids = [m["id"] for m in plan["ordered_modules"]]
    if not ids or ids[0] != "intake" or len(ids) != len(set(ids)):
        raise ValueError("INVALID_ORDER")
    if not isinstance(run_id, str) or not run_id.strip() or not isinstance(revision, str) or not revision.strip():
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
        if state["paused"]:
            raise ValueError("PAUSED_REQUIRES_EXPLICIT_RECOVERY")
        raise ValueError("CONFLICTING_REPLAY")
    if state["paused"]:
        raise ValueError("PAUSED_REQUIRES_EXPLICIT_RECOVERY")
    if state["next_index"] >= len(state["sequence"]) or state["sequence"][state["next_index"]] != mid:
        raise ValueError("OUT_OF_ORDER")
    if receipt["source_revision"] != revision:
        raise ValueError("STALE_RECEIPT")
    if receipt["status"] not in {"completed", "blocked", "failed", "awaiting_approval"}:
        raise ValueError("INVALID_STATUS")
    if not isinstance(receipt["input_fingerprint"], str) or not re.fullmatch(r"[0-9a-f]{64}", receipt["input_fingerprint"]):
        raise ValueError("INVALID_FINGERPRINT")
    if not isinstance(receipt["artifact_receipts"], list) or receipt["artifact_receipts"] or not isinstance(receipt["verification"], dict):
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


def recover(state, expected_revision, module_id, prior_digest):
    """Explicit pause reset; keep an audit trail and never authorize execution."""
    if state.get('execution_authorized') is not False or state.get('revision') != expected_revision:
        raise ValueError('STALE_OR_UNSAFE')
    if not state.get('paused') or state['next_index'] >= len(state['sequence']):
        raise ValueError('NOT_PAUSED')
    if state['sequence'][state['next_index']] != module_id:
        raise ValueError('WRONG_RECOVERY_TARGET')
    previous = state['receipts'].get(module_id)
    if not previous or previous['status'] not in ('blocked', 'failed', 'awaiting_approval'):
        raise ValueError('NO_PAUSE_RECEIPT')
    if digest(previous) != prior_digest:
        raise ValueError('PAUSE_RECEIPT_CHANGED')
    new = copy.deepcopy(state)
    new.setdefault('history', []).append({'event': 'explicit_recovery', 'module': module_id, 'prior_receipt_digest': prior_digest})
    del new['receipts'][module_id]
    new['paused'] = False
    return new
