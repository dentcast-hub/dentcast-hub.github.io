#!/usr/bin/env python3
"""Staging-only substep orchestrator and local CAS for all 15 modules.

This does NOT execute publication side effects, supply scientific judgments,
generate approvals, or write GitHub run memory. An external operator's result is
only structurally/domain-validated, never proof a real publish occurred.
"""
import argparse
import copy
import importlib.util
import json
import os
import re
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


routes = _load("s3_routes", "dentcast_stage3_route.py")
modules = _load("s3_modules", "dentcast_stage3_modules.py")
local_store = _load("s3_local_cas", "dentcast_checkpoint_store_draft.py")


def _need(ok, why):
    if not ok:
        raise ValueError(why)


def _digest(data):
    return modules.hash_public(data)


def begin(request, run_id, revision):
    _need(isinstance(request, dict), "REQUEST_NOT_OBJECT")
    _need(isinstance(run_id, str) and re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}", run_id),
          "INVALID_RUN_ID")
    _need(isinstance(revision, str) and re.fullmatch(r"[a-f0-9]{7,64}", revision),
          "INVALID_SOURCE_REVISION")
    compiled = routes.compile_steps(request)
    if compiled["status"] != "compiled_staging_requires_operator":
        return {"status": "blocked", "code": compiled.get("code", "PLAN_BLOCKED"),
                "plan": compiled, "execution_authorized": False}
    context = {
        "route": compiled["route"], "category": compiled["category"],
        "challenge": compiled["challenge"],
        "has_paper": request["has_paper"], "has_text": request["has_text"],
    }
    state = {
        "schema": "stage3-local-substeps-v1",
        "run_id": run_id, "source_revision": revision,
        "request_digest": _digest(request), "plan_digest": _digest(compiled),
        "plan": compiled, "context": context, "next_index": 0,
        "receipts": {}, "paused": False, "history": [],
        "execution_authorized": False,
        "real_publish_completed": False,
    }
    validate_state(state)
    return state


def validate_state(state):
    _need(isinstance(state, dict) and state.get("schema") == "stage3-local-substeps-v1",
          "BAD_STAGE3_STATE_SCHEMA")
    _need(state.get("execution_authorized") is False and
          state.get("real_publish_completed") is False, "UNSAFE_STAGE3_STATE")
    _need(isinstance(state.get("run_id"), str) and
          isinstance(state.get("source_revision"), str), "MISSING_RUN_ID")
    _need(all(isinstance(state.get(k), str) and re.fullmatch(r"[0-9a-f]{64}", state[k])
              for k in ("request_digest", "plan_digest")), "INVALID_PLAN_DIGEST")
    _need(isinstance(state.get("plan"), dict) and
          state["plan"].get("status") == "compiled_staging_requires_operator" and
          state["plan"].get("execution_authorized") is False and
          _digest(state["plan"]) == state["plan_digest"], "TAMPERED_PLAN")
    context = state.get("context")
    _need(isinstance(context, dict) and
          set(context) == {"route", "category", "challenge", "has_paper", "has_text"},
          "INVALID_CONTEXT")
    _need(context["route"] == state["plan"]["route"] and
          context["category"] == state["plan"]["category"] and
          context["challenge"] == state["plan"]["challenge"], "ROUTE_CONTEXT_CHANGED")
    _need(all(type(context[k]) is bool for k in ("challenge", "has_paper", "has_text")),
          "INVALID_CONTEXT_FLAGS")
    steps = state["plan"].get("ordered_steps")
    _need(isinstance(steps, list) and steps and steps[0]["step_id"] == "intake:route",
          "INVALID_STAGE3_SEQUENCE")
    ids = [s.get("step_id") for s in steps if isinstance(s, dict)]
    _need(len(ids) == len(steps) and len(ids) == len(set(ids)) and
          all(sid in routes.SOURCE_STEPS for sid in ids), "BAD_STEP_IDS")
    for index, step in enumerate(steps):
        sid = step["step_id"]
        _need(step["module_id"] == routes.SOURCE_STEPS[sid][0] and
              step.get("requires_step") == (ids[index-1] if index else None),
              "TAMPERED_STEP_DEPENDENCY")
    cursor = state.get("next_index")
    _need(type(cursor) is int and 0 <= cursor <= len(ids), "BAD_STAGE3_CURSOR")
    receipts = state.get("receipts")
    _need(isinstance(receipts, dict) and
          set(receipts) >= set(ids[:cursor]) and
          set(receipts) <= set(ids[:cursor+1]) and
          all(isinstance(v, dict) for v in receipts.values()), "STAGE3_RECEIPT_SEQUENCE_TAMPERED")
    for sid in ids[:cursor]:
        _need(receipts[sid].get("status") in
              {"contract_validated_staging_only", "canonical_skip_staging_only"} and
              receipts[sid].get("step_id") == sid, "BAD_COMPLETED_RECEIPT")
    paused = state.get("paused")
    _need(type(paused) is bool and
          paused == (cursor < len(ids) and ids[cursor] in receipts), "BAD_PAUSE_STATE")
    if paused:
        _need(receipts[ids[cursor]].get("status") == "paused_staging", "BAD_PAUSED_RECEIPT")
        _need(type(receipts[ids[cursor]].get("requires_human_approval")) is bool,
              "PAUSE_APPROVAL_PROVENANCE_MISSING")
    _need(isinstance(state.get("history"), list), "INVALID_HISTORY")
    return True


def next_invocation(state):
    validate_state(state)
    _need(not state["paused"], "PAUSED_REQUIRES_EXPLICIT_RECOVERY")
    position = state["next_index"]
    if position == len(state["plan"]["ordered_steps"]):
        return None
    step = copy.deepcopy(state["plan"]["ordered_steps"][position])
    prior = state["plan"]["ordered_steps"][position-1]["step_id"] if position else None
    predecessor_receipt = state["receipts"].get(prior)
    _need(position == 0 or (
        isinstance(predecessor_receipt, dict) and
        predecessor_receipt["status"] in {"contract_validated_staging_only",
                                          "canonical_skip_staging_only"}),
        "MISSING_PRIOR_RECEIPT")
    original = {
        "run_id": state["run_id"], "source_revision": state["source_revision"],
        "plan_digest": state["plan_digest"], "step_id": step["step_id"],
        "previous_receipt_digest": _digest(predecessor_receipt) if prior else None,
    }
    return {
        "step": step,
        "run_id": state["run_id"], "revision": state["source_revision"],
        "context": copy.deepcopy(state["context"]),
        "input_digest": _digest(original),
        "required_output_schema": copy.deepcopy(modules.SCHEMAS[step["step_id"]]),
        "execution_authorized": False,
        "requires_external_operator": True,
    }


def submit(state, report):
    """Accept independently prepared metadata report; never generate scientific data."""
    validate_state(state)
    invocation = next_invocation(state)
    _need(invocation is not None, "NO_PENDING_STEP")
    checked = modules.validate_report(invocation["step"], report,
                                      invocation["context"], invocation["input_digest"])
    result = copy.deepcopy(state)
    sid = invocation["step"]["step_id"]
    result["receipts"][sid] = checked
    if checked["status"] == "paused_staging":
        result["paused"] = True
    else:
        result["next_index"] += 1
    result["history"].append({"step_id": sid, "receipt_digest": _digest(checked),
                              "action": checked["status"]})
    validate_state(result)
    return result


def recover(state, expected_pause_receipt_digest):
    """Explicit retry of the pending substep, rejecting stale recovery requests."""
    validate_state(state)
    _need(state["paused"], "NOT_PAUSED")
    sid = state["plan"]["ordered_steps"][state["next_index"]]["step_id"]
    old = state["receipts"][sid]
    _need(_digest(old) == expected_pause_receipt_digest, "PAUSE_RECEIPT_CHANGED")
    # A hash identifies the pause; it is not the founder's decision.
    # No trusted approval adapter exists in staging, so this gate stays shut.
    _need(old.get("requires_human_approval") is False, "TRUSTED_HUMAN_APPROVAL_REQUIRED")
    result = copy.deepcopy(state)
    result["history"].append({"step_id": sid, "receipt_digest": _digest(old),
                              "action": "explicit_recovery"})
    del result["receipts"][sid]
    result["paused"] = False
    validate_state(result)
    return result


def stage3_status(state):
    validate_state(state)
    if state["paused"]:
        return "paused_staging"
    if state["next_index"] == len(state["plan"]["ordered_steps"]):
        return "all_contract_reports_validated_staging_only_not_published"
    return "awaiting_external_operator"


def storage_digest(state):
    validate_state(state)
    return _digest(state)


def save_checked(path, state, expected_digest=None):
    """Local POSIX CAS only; GitHub remote CAS is separate Stage 4 work."""
    validate_state(state)
    _need(expected_digest is None or (
        isinstance(expected_digest, str) and re.fullmatch(r"[0-9a-f]{64}", expected_digest)),
        "INVALID_EXPECTED_DIGEST")
    target = Path(path)
    _need(target.parent.is_dir() and not target.is_symlink(), "INVALID_CHECKPOINT_TARGET")
    with local_store._exclusive_lock(target):
        _need(not target.is_symlink(), "CHECKPOINT_SYMLINK_FORBIDDEN")
        if target.exists():
            _need(expected_digest is not None, "CHECKPOINT_ALREADY_EXISTS")
            old = json.loads(target.read_text(encoding="utf-8"))
            validate_state(old)
            _need(old["run_id"] == state["run_id"] and
                  old["source_revision"] == state["source_revision"] and
                  old["plan_digest"] == state["plan_digest"],
                  "CHECKPOINT_IDENTITY_CHANGED")
            _need(storage_digest(old) == expected_digest, "STALE_CHECKPOINT_WRITER")
        else:
            _need(expected_digest is None, "CHECKPOINT_MISSING")
        fd, tmp = tempfile.mkstemp(prefix=".dc-stage3-", dir=str(target.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as output:
                os.fchmod(output.fileno(), 0o600)
                json.dump(state, output, ensure_ascii=False, sort_keys=True, indent=2)
                output.flush()
                os.fsync(output.fileno())
            os.replace(tmp, target)
            fd_dir = os.open(str(target.parent), os.O_RDONLY)
            try:
                os.fsync(fd_dir)
            finally:
                os.close(fd_dir)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
    return storage_digest(state)


def load_checked(path, run_id, revision, plan_digest):
    target = Path(path)
    _need(not target.is_symlink(), "CHECKPOINT_SYMLINK_FORBIDDEN")
    state = json.loads(target.read_text(encoding="utf-8"))
    validate_state(state)
    _need(state["run_id"] == run_id and state["source_revision"] == revision
          and state["plan_digest"] == plan_digest, "CHECKPOINT_IDENTITY_MISMATCH")
    return state


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("command", choices=["compile", "begin", "next", "submit", "recover", "status"])
    ap.add_argument("--request", help="Local JSON request")
    ap.add_argument("--state", help="Local JSON state, NOT public Git")
    ap.add_argument("--report", help="Local external operator receipt for submit")
    ap.add_argument("--run-id")
    ap.add_argument("--revision")
    ap.add_argument("--pause-digest")
    ap.add_argument("--expected-digest")
    args = ap.parse_args()
    try:
        if args.command == "compile":
            result = routes.compile_steps(json.loads(Path(args.request).read_text(encoding="utf-8")))
        elif args.command == "begin":
            result = begin(json.loads(Path(args.request).read_text(encoding="utf-8")),
                           args.run_id, args.revision)
            if args.state and result.get("schema"):
                save_checked(args.state, result)
        else:
            if not args.state:
                raise ValueError("STATE_REQUIRED")
            state = json.loads(Path(args.state).read_text(encoding="utf-8"))
            validate_state(state)
            if args.command == "next":
                result = {"status": stage3_status(state), "invocation": next_invocation(state)}
            elif args.command == "status":
                result = {"status": stage3_status(state), "next_index": state["next_index"],
                          "total_steps": len(state["plan"]["ordered_steps"])}
            elif args.command == "submit":
                result = submit(state, json.loads(Path(args.report).read_text(encoding="utf-8")))
                save_checked(args.state, result, expected_digest=storage_digest(state))
            else:
                result = recover(state, args.pause_digest)
                save_checked(args.state, result, expected_digest=storage_digest(state))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 2 if result.get("status") == "blocked" else 0
    except (ValueError, KeyError, TypeError, OSError, AttributeError) as exc:
        print(json.dumps({"status": "blocked", "reason": str(exc),
                          "execution_authorized": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
