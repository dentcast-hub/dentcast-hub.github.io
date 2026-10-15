#!/usr/bin/env python3
"""Validate staging route plans without executing any publishing module."""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json"
PUBLISH_ONLY = {"taxonomy", "page", "navigation", "semantic-links", "learning-assets",
                "evidence", "challenge", "brain", "pathways", "english",
                "notification", "build", "verify"}


def validate(plan, registry):
    problems = []
    if not isinstance(plan, dict):
        return ["PLAN_NOT_OBJECT"]
    if plan.get("no_side_effects") is not True:
        problems.append("SIDE_EFFECTS_NOT_DISABLED")
    if plan.get("status") != "draft_requires_audit":
        problems.append("NOT_A_DRAFT_PLAN")
    if not plan.get("unresolved"):
        problems.append("UNRESOLVED_AUDIT_GATES_MISSING")
    modules = plan.get("ordered_modules")
    if not isinstance(modules, list):
        return problems + ["MODULE_LIST_MISSING"]
    ids = [m.get("id") for m in modules if isinstance(m, dict)]
    if len(ids) != len(modules):
        problems.append("INVALID_MODULE_ENTRY")
    if len(ids) != len(set(ids)):
        problems.append("DUPLICATE_MODULE")
    if not ids or ids[0] != "intake":
        problems.append("INTAKE_NOT_FIRST")
    for module_id in ids:
        if module_id not in registry:
            problems.append("UNKNOWN_MODULE:" + str(module_id))
    if plan.get("route") == "paper-only":
        if ids != ["intake", "paper-cabinet"]:
            problems.append("PAPER_ONLY_MUST_NOT_PUBLISH")
        if not any("NO Part 3 credit" in item for item in plan.get("unresolved", [])):
            problems.append("PAPER_ONLY_PART3_RULE_MISSING")
    if plan.get("route", "").startswith("litecast") and "english" in ids:
        problems.append("LITECAST_ENGLISH_FORBIDDEN")
    if plan.get("route", "").startswith("challenge") and "english" in ids:
        problems.append("CHALLENGE_ENGLISH_FORBIDDEN")
    if plan.get("route", "").startswith("publication") and "english" not in ids:
        problems.append("ENGLISH_MISSING")
    if plan.get("route") != "paper-only" and "verify" not in ids:
        problems.append("VERIFY_MISSING")
    if "paper-cabinet" in ids and plan.get("route") != "paper-only":
        if not plan.get("route", "").endswith("+paper"):
            problems.append("UNJUSTIFIED_PAPER_BRANCH")
    return problems


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("plan", help="JSON plan file")
    args = parser.parse_args()
    registry = json.loads(CONTRACT.read_text(encoding="utf-8"))
    modules = {m["id"] for m in registry["modules"]}
    issues = validate(json.loads(Path(args.plan).read_text(encoding="utf-8")), modules)
    print(json.dumps({"valid_staging_plan": not issues, "issues": issues,
                      "not_authorized_for_execution": True}, indent=2))
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
