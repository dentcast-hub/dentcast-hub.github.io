"""Staging-only central orchestrator. Never runs publishing side effects.

This is the single portable entrypoint for Claude Code, Cursor and Codex to
exercise the SAME read-only intake -> validate -> dispatch -> checkpoint flow.
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


planner = load("dc_planner", "dentcast_route_plan_draft.py")
validator = load("dc_validator", "validate_dentcast_route_plan_draft.py")
adapter = load("dc_adapter", "dentcast_module_dispatch_draft.py")
checkpoint = load("dc_checkpoint", "dentcast_checkpoint_draft.py")
store = load("dc_store", "dentcast_checkpoint_store_draft.py")
REGISTRY = set(planner.MODULES)


def dry_run(request, run_id, revision, checkpoint_path=None):
    """Return a validated in-memory checkpoint, optionally save to private path.

    A failed route is returned as blocked, without writing a checkpoint.
    The only dispatched adapter is the read-only intake draft shape checker.
    """
    if not isinstance(request, dict):
        raise ValueError("INVALID_REQUEST")
    plan = planner.plan(request)
    if plan.get("status") != "draft_requires_audit":
        return {"status": "blocked", "plan": plan, "execution_authorized": False}
    issues = validator.validate(plan, REGISTRY)
    if issues:
        return {"status": "blocked", "code": "PLAN_VALIDATION_FAILED",
                "issues": issues, "execution_authorized": False}
    state = checkpoint.begin(plan, run_id, revision)
    response = adapter.dispatch(adapter.invocation(plan, run_id, revision))
    if response["run_id"] != run_id or response["source_revision"] != revision:
        raise ValueError("ADAPTER_IDENTITY_MISMATCH")
    state = checkpoint.accept(state, adapter.checkpoint_receipt(response), revision)
    if checkpoint_path is not None:
        store.save(checkpoint_path, state)
    return {"status": "staging_checkpoint", "route": plan["route"],
            "next_module": state["sequence"][state["next_index"]] if state["next_index"] < len(state["sequence"]) else None,
            "checkpoint": state, "execution_authorized": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request", required=True, help="JSON request file")
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--checkpoint", help="private local staging checkpoint path")
    args = parser.parse_args()
    try:
        request = json.loads(Path(args.request).read_text(encoding="utf-8"))
        result = dry_run(request, args.run_id, args.revision, args.checkpoint)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["status"] == "staging_checkpoint" else 2
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print(json.dumps({"status": "blocked", "code": "STAGING_ORCHESTRATOR_ERROR",
                          "reason": str(exc), "execution_authorized": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
