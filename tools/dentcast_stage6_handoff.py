#!/usr/bin/env python3
"""Stage 6: conservative read-only GitHub-to-agent handoff (NO publication).

Any agent/client may resume with only a run ID and a locally compiled staging
plan. Verify the complete remote event chain and plan SHA before choosing the
first unfinished canonical substep. This does not launch Claude/Cursor/Codex,
authorize founder gates, run Fidelity, or edit/publish site content.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import dentcast_github_memory as remote
import dentcast_stage3_route as routes


def handoff(store, run_id, plan):
    remote.require(isinstance(plan, dict) and
                   plan.get("schema_version") == "stage3-step-plan-v1" and
                   plan.get("status") == "compiled_staging_requires_operator" and
                   plan.get("execution_authorized") is False and
                   plan.get("side_effects_permitted") == [],
                   "UNSAFE_OR_UNKNOWN_ROUTE_PLAN")
    snapshot = store.snapshot(run_id)
    state, manifest = snapshot["state"], snapshot["manifest"]
    remote.require(remote.digest(plan) == manifest["plan_digest"],
                   "PLAN_FINGERPRINT_CHANGED")
    remote.require(plan.get("source_revision") == manifest["source_revision"],
                   "SOURCE_REVISION_NOT_PINNED")
    steps = plan["ordered_steps"]
    remote.require(isinstance(steps, list) and bool(steps), "ROUTE_STEPS_MISSING")
    ids = [step.get("step_id") for step in steps]
    remote.require(len(ids) == len(set(ids)) and
                   all(isinstance(s, str) and s in routes.SOURCE_STEPS for s in ids),
                   "ROUTE_STEP_TAMPERED")
    for i, step in enumerate(steps):
        sid = step["step_id"]
        remote.require(step["module_id"] == routes.SOURCE_STEPS[sid][0] and
                       step["requires_step"] == (ids[i-1] if i else None),
                       "ROUTE_STEP_DEPENDENCY_TAMPERED")
    done = state["completed_steps"]
    remote.require(done == ids[:len(done)], "GAP_OR_OUT_OF_ORDER_REMOTE_COMPLETION")
    remote.require(state["pending_step"] is None or
                   state["pending_step"] == ids[len(done)],
                   "PAUSE_NOT_AT_NEXT_UNFINISHED_STEP")
    remote.require(state["status"] != "finished_staging" or
                   len(done) == len(ids),
                   "PREMATURE_STAGING_FINISH")
    base = {"run_id": run_id, "source_revision": manifest["source_revision"],
            "branch_head": snapshot["head"], "completed_count": len(done),
            "total_steps": len(ids), "real_publish_completed": False,
            "execution_authorized": False}
    if state["status"] == "paused":
        return {**base, "status": "blocked_awaiting_explicit_recovery",
                "paused_step_id": state["pending_step"],
                "next_step": None}
    if len(done) == len(ids):
        return {**base, "status": "all_contract_steps_staged_not_published",
                "next_step": None}
    step = steps[len(done)]
    return {**base, "status": "awaiting_external_operator",
            "next_step": {
                "step_id": step["step_id"], "module_id": step["module_id"],
                "canonical_step": step["canonical_step"],
                "source": step["source"],
                "approval_gates": step["approval_gates"],
                "requires_external_result": True,
                "blind_scientific_checks": "Use dentcast_fidelity_resume.py for isolated contexts; no checker judgments are disclosed here",
            }}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--plan", required=True, help="Pinned staging plan JSON")
    args = ap.parse_args()
    try:
        plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
        result = handoff(remote.RemoteMemory(remote.GithubAPI()),
                         args.run_id, plan)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, KeyError, TypeError, FileNotFoundError, OSError) as exc:
        print(json.dumps({"status": "blocked", "error": str(exc),
                          "execution_authorized": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
