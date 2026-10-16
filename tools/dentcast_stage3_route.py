#!/usr/bin/env python3
"""Staging-only executable STEP compiler for the 15 DentCast module owners.

This compiles canonical conditional *substeps*, not just module names.
No publishing, GitHub writes, scientific calls, or founder approvals occur.
The active README remains authoritative. All outputs require external execution
and verification before a real publication could be considered complete.
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json"

def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

planner = _load("stage3_draft_planner", "dentcast_route_plan_draft.py")
validator = _load("stage3_draft_validator", "validate_dentcast_route_plan_draft.py")
dependency_audit = _load("stage3_dependency_audit", "audit_dentcast_route_dependencies.py")

# All 15 logical owners have explicit invocation contracts and handlers in
# dentcast_stage3_modules.py. A module can have multiple canonical invocations.
SOURCE_STEPS = {
    "intake:route": ("intake", "Phase 0, A and B", "02-routing-intake.md"),
    "page:draft": ("page", "C1-C2", "03-litecast-and-page.md"),
    "taxonomy:lock": ("taxonomy", "C2.4", "04-taxonomy-and-navigation.md"),
    "navigation:publish": ("navigation", "C2.5-C2.6, C4.5-C4.6", "04-taxonomy-and-navigation.md"),
    "semantic-links:specialist": ("semantic-links", "C4.7-C4.9", "05-semantic-linking.md"),
    "semantic-links:litecast": ("semantic-links", "C0.5-C0.6", "03-litecast-and-page.md"),
    "paper-cabinet:drive": ("paper-cabinet", "C4.10 Part 1", "06-paper-ingestion.md"),
    "paper-cabinet:catalog": ("paper-cabinet", "C4.10 Part 2", "06-paper-ingestion.md"),
    "paper-cabinet:credit": ("paper-cabinet", "C4.10 Part 3", "06-paper-ingestion.md"),
    "learning-assets:flashcards": ("learning-assets", "C4.11", "07-flashcards-and-quiz.md"),
    "learning-assets:quiz": ("learning-assets", "C4.12", "07-flashcards-and-quiz.md"),
    "evidence:des-fidelity": ("evidence", "C4.13", "08-des-fidelity.md"),
    "challenge:public": ("challenge", "C4.14", "09-challenge.md"),
    "brain:append": ("brain", "C5.0-C5.5", "10-brain-and-pathways.md"),
    "pathways:place": ("pathways", "C5.6-C5.6-b", "10-brain-and-pathways.md"),
    "notification:pulse": ("notification", "C6", "11-build-and-version.md"),
    "build:version": ("build", "C7", "11-build-and-version.md"),
    "build:rebuild": ("build", "C8", "11-build-and-version.md"),
    "build:version-final": ("build", "C8 final stamp; D restamp if applicable", "12-english-notify-verify.md"),
    "english:mirror": ("english", "D", "12-english-notify-verify.md"),
    "notification:push-marker": ("notification", "E", "12-english-notify-verify.md"),
    "verify:phase-f": ("verify", "F", "12-english-notify-verify.md"),
    "verify:paper-only": ("verify", "Phase 0 paper-only completion", "02-routing-intake.md"),
}
GATES = {
    "intake:route": ["user-string-provenance", "unverifiable-metadata", "approved-opening-when-generated"],
    "page:draft": ["opening-paragraph-founder-approval-when-generated", "exact-title-caption"],
    "taxonomy:lock": ["ambiguous-pillar", "new-subtopic"],
    "semantic-links:specialist": ["ambiguous-links"],
    "semantic-links:litecast": ["ambiguous-litecast-links"],
    "paper-cabinet:drive": ["external-upload-consent", "drive-folder-if-uncertain"],
    "paper-cabinet:catalog": ["source-metadata-if-unverifiable"],
    "paper-cabinet:credit": ["doi-author-if-unverifiable"],
    "learning-assets:flashcards": ["no-fabricated-facts"],
    "evidence:des-fidelity": ["des-basis", "model-routing-preflight", "per-differing-sentence-founder-gate"],
    "challenge:public": ["answer-never-in-public-git", "admin-paste-is-not-publishing-complete"],
    "pathways:place": ["third-pathway", "bundle-five-gates", "mid-series-insertion"],
    "notification:pulse": ["unprecedented-pulse-convention"],
    "verify:phase-f": ["all-publish-stage-receipts", "green-real-phase-f"],
    "verify:paper-only": ["two-cabinet-parts-and-commit-no-phase-f"],
}


def compile_steps(request, contract=None):
    """Return guarded module/substep execution plan, never perform effects."""
    if not isinstance(request, dict):
        return {"status": "blocked", "code": "REQUEST_NOT_OBJECT",
                "execution_authorized": False}
    contract = contract or json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    modules = {m["id"]: m for m in contract["modules"]}
    if len(modules) != 15 or len(contract["modules"]) != 15:
        return {"status": "blocked", "code": "MODULE_REGISTRY_INVALID",
                "execution_authorized": False}
    draft = planner.plan(request, contract)
    if draft["status"] != "draft_requires_audit":
        return {"status": "blocked", "code": draft.get("code", "DRAFT_BLOCKED"),
                "draft": draft, "execution_authorized": False}
    issues = validator.validate(draft, set(modules)) + [
        item["code"] + ":" + item["module"]
        for item in dependency_audit.audit(draft)
    ]
    if issues:
        return {"status": "blocked", "code": "DRAFT_CONTRACT_MISMATCH",
                "issues": issues, "execution_authorized": False}
    paper_only = draft["route"] == "paper-only"
    litecast = draft["route"].startswith("litecast")
    challenge = draft["route"].startswith("challenge")
    paper = bool(request["has_paper"])
    category = draft.get("category")
    steps = ["intake:route"]
    if not paper_only:
        steps += ["page:draft"]
        if not litecast:
            steps += ["taxonomy:lock", "navigation:publish", "semantic-links:specialist"]
        else:
            steps += ["semantic-links:litecast"]
    if paper:
        steps += ["paper-cabinet:drive", "paper-cabinet:catalog"]
        if not paper_only:
            steps += ["paper-cabinet:credit"]
    if paper_only:
        steps += ["verify:paper-only"]
    else:
        if challenge:
            steps += ["challenge:public"]
        elif not litecast:
            # The full source-basket/clinical facts can be determined only by
            # the responsible evidence module; no implicit source/no-source skip.
            steps += ["learning-assets:flashcards", "learning-assets:quiz",
                      "evidence:des-fidelity"]
        if not litecast:
            steps += ["brain:append"]
            if not challenge:
                steps += ["pathways:place"]
        steps += ["notification:pulse", "build:version", "build:rebuild"]
        if not litecast and not challenge:
            steps += ["english:mirror"]
        if not litecast and category != "glossary":
            steps += ["notification:push-marker"]
        # Canonical C8 requires a LAST stamp after builders; English D can
        # change content again, so the final idempotent restamp runs after D/E.
        steps += ["build:version-final", "verify:phase-f"]

    if len(steps) != len(set(steps)):
        raise AssertionError("duplicate step IDs")
    ordered = []
    for idx, step_id in enumerate(steps):
        module_id, canonical, source = SOURCE_STEPS[step_id]
        if module_id not in modules:
            raise ValueError("UNREGISTERED_MODULE:" + module_id)
        ordered.append({
            "step_id": step_id,
            "module_id": module_id,
            "source": ".dentcast/workflows/modules/" + source,
            "canonical_step": canonical,
            "requires_step": steps[idx-1] if idx else None,
            "requires_external_result": True,
            "approval_gates": GATES.get(step_id, []),
        })
    return {
        "status": "compiled_staging_requires_operator",
        "schema_version": "stage3-step-plan-v1",
        "route": draft["route"], "category": category, "challenge": challenge,
        "ordered_steps": ordered,
        "execution_authorized": False,
        "side_effects_permitted": [],
        "source_revision": request.get("source_revision"),
        "unresolved": ["Domain work, external approvals, and actual artifacts are not executed by this compiler.",
                       "Stage 3 requires validated external operator receipts for completion.",
                       "DES/Fidelity and remote GitHub execution remain independent gates."],
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--request", required=True)
    args = ap.parse_args()
    try:
        request = json.loads(Path(args.request).read_text(encoding="utf-8"))
        result = compile_steps(request)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["status"].startswith("compiled_") else 2
    except (OSError, ValueError, KeyError, AssertionError) as exc:
        print(json.dumps({"status": "blocked", "code": "COMPILATION_FAILED",
                          "reason": str(exc), "execution_authorized": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
