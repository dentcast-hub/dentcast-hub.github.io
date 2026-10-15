"""Read-only audit of proposed route ordering against draft registry dependencies.

A reported mismatch is a CONTRACT REVIEW ITEM, not permission to change live rules.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / ".dentcast/workflows/modules/MODULE-REGISTRY.draft.json"


def audit(plan, registry=None):
    if registry is None:
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    definitions = {m["id"]: m for m in registry["module_definitions"]}
    ordered = [m["id"] for m in plan.get("ordered_modules", [])]
    seen = set()
    issues = []
    for mid in ordered:
        if mid not in definitions:
            issues.append({"module": mid, "code": "UNKNOWN_CONTRACT"})
            continue
        for required in definitions[mid]["depends_on"]:
            if required not in seen:
                issues.append({"module": mid, "requires": required,
                               "code": "MISSING_OR_LATE_DEPENDENCY",
                               "review_required": True})
        seen.add(mid)
    return issues


if __name__ == "__main__":
    import importlib.util
    import sys
    spec = importlib.util.spec_from_file_location("planner", ROOT / "tools/dentcast_route_plan_draft.py")
    planner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(planner)
    for request in ({"has_text": True, "has_paper": False, "category": "clinical", "challenge": False},
                    {"has_text": True, "has_paper": False, "category": "litecast", "challenge": False},
                    {"has_text": False, "has_paper": True}):
        plan = planner.plan(request)
        print(json.dumps({"route": plan["route"], "issues": audit(plan)}, ensure_ascii=False))
