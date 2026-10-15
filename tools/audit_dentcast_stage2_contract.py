#!/usr/bin/env python3
"""Stage-2 static contract audit. Read-only; NOT a publishing parity certificate.

Verifies exact canonical textual coverage, hard-rule and entrypoint traceability,
the registry/contract graph, and critical conditional substep documentation.
Running this cannot execute, authorize, or activate publishing.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = ROOT / ".dentcast/workflows/README.md"
BASE = ROOT / ".dentcast/workflows/modules"
SLICES = {
    "01-hard-rules.md": ("intake", "verify"),
    "02-routing-intake.md": ("intake", "paper-cabinet", "evidence"),
    "03-litecast-and-page.md": ("page", "semantic-links"),
    "04-taxonomy-and-navigation.md": ("taxonomy", "navigation", "page"),
    "05-semantic-linking.md": ("semantic-links",),
    "06-paper-ingestion.md": ("paper-cabinet",),
    "07-flashcards-and-quiz.md": ("learning-assets",),
    "08-des-fidelity.md": ("evidence",),
    "09-challenge.md": ("challenge",),
    "10-brain-and-pathways.md": ("brain", "pathways"),
    "11-build-and-version.md": ("notification", "build"),
    "12-english-notify-verify.md": ("english", "notification", "verify"),
}
ENTRYPOINTS = (
    "CLAUDE.md", "AGENTS.md",
    ".cursor/rules/dentcast-router.mdc",
    ".cursor/rules/dentcast-publishing.mdc",
    ".dentcast/workflows/agent-parity.md",
)
CRITICAL_ANCHORS = (
    "## Phase 0 — Routing:",
    "## Phase A — Discover",
    "## Phase B — Intake",
    "### Question 3.5 — Writing-style check",
    "### Question 4.8 — DES evidence basis",
    "### Question 4.9 — چالش؟",
    "### 0. LiteCast branch",
    "### 2. Build the new page",
    "### 2.4. Semantic pillar",
    "### 2.5. Inject",
    "### 4.7. Semantic glossary",
    "### 4.7-ب. Cross-link",
    "### 4.8. Suggest",
    "### 4.9. Semantic",
    "### 4.10. Attached-paper",
    "### 4.11. Flashcards",
    "### 4.12. Quiz-ready",
    "### 4.13. DES",
    "#### Part 2c — How the FIDELITY call is run",
    "#### Part 3b — Offer the founder a fix",
    "### 4.14. چالش",
    "### 5.0. Hashtag",
    "### 5. Brain entry",
    "### 5.6. Learning-pathway",
    "### 5.6-ب. Bundle check",
    "### 6. Pulse update",
    "### 7. Bump",
    "### 8. Rebuild",
    "## Phase D — English",
    "## Phase E — Mark",
    "## Phase F — The mechanical gate",
)
RULE_OWNERS = {
    1: ("intake", "page", "brain"), 2: ("intake", "page"),
    3: ("brain", "verify"), 4: ("intake",), 5: ("brain", "verify"),
    6: ("taxonomy", "navigation", "brain"), 7: ("taxonomy",),
    8: ("taxonomy", "build"), 9: ("navigation", "semantic-links", "verify"),
    10: ("page", "semantic-links", "build"), 11: ("semantic-links", "verify"),
    12: ("english", "verify"), 13: ("intake", "paper-cabinet"),
    14: ("intake", "taxonomy", "semantic-links"),
    15: ("brain", "verify"), 16: ("intake", "page", "verify"),
    17: ("page", "brain", "build", "verify"),
}


def audit(root=ROOT):
    issues = []
    canonical = (root / ".dentcast/workflows/README.md").read_text(encoding="utf-8")
    covered = bytearray(len(canonical))
    ranges = {}
    for name, owners in SLICES.items():
        piece = (root / ".dentcast/workflows/modules" / name).read_text(encoding="utf-8").strip()
        count = canonical.count(piece)
        if count != 1:
            issues.append("CANONICAL_SLICE_MISMATCH:" + name + ":matches=" + str(count))
            continue
        start = canonical.index(piece)
        covered[start:start+len(piece)] = b"\x01" * len(piece)
        ranges[name] = (canonical.count("\n", 0, start) + 1,
                        canonical.count("\n", 0, start+len(piece)) + 1)
    uncovered = [i for i, char in enumerate(canonical) if not char.isspace() and not covered[i]]
    if uncovered:
        issues.append("CANONICAL_UNCOVERED_NONWHITESPACE:" +
                      str(canonical.count("\n", 0, uncovered[0]) + 1))
    found_rules = [int(m) for m in re.findall(r"(?m)^(\d{1,2})\. \*\*", canonical)]
    if found_rules != list(range(1, 18)):
        issues.append("HARD_RULES_NOT_EXACT_1_TO_17:" + repr(found_rules))
    for anchor in CRITICAL_ANCHORS:
        if anchor not in canonical:
            issues.append("CANONICAL_ANCHOR_MISSING:" + anchor)

    contracts = json.loads((root / ".dentcast/workflows/modules/MODULE-CONTRACTS.v1.json").read_text(encoding="utf-8"))
    registry = json.loads((root / ".dentcast/workflows/modules/MODULE-REGISTRY.draft.json").read_text(encoding="utf-8"))
    cm = contracts["modules"]
    rm = registry["module_definitions"]
    ids = [m["id"] for m in cm]
    rid = [m["id"] for m in rm]
    if len(ids) != len(set(ids)) or len(ids) != 15 or set(ids) != set(rid) or len(rid) != len(set(rid)):
        issues.append("MODULE_ID_SET_MISMATCH_OR_DUPLICATES")
    cm_by_id = {m["id"]: m for m in cm}
    rm_by_id = {m["id"]: m for m in rm}
    if set().union(*(set(owners) for owners in SLICES.values())) != set(ids):
        issues.append("UNOWNED_MODULE_OR_UNKNOWN_OWNER")
    if set().union(*(set(owners) for owners in RULE_OWNERS.values())) - set(ids):
        issues.append("UNKNOWN_HARD_RULE_OWNER")
    if set(RULE_OWNERS) != set(range(1, 18)):
        issues.append("HARD_RULE_OWNER_GAP")
    for mid in ids:
        if mid not in rm_by_id:
            continue
        a, d = set(cm_by_id[mid]["requires"]), set(rm_by_id[mid]["depends_on"])
        if a != d:
            issues.append("UNCONDITIONAL_DEPENDENCY_MISMATCH:" + mid)
        if mid in a or a - set(ids):
            issues.append("INVALID_DEPENDENCY:" + mid)
        if not (root / cm_by_id[mid]["source_of_truth"]).is_file():
            issues.append("MISSING_MODULE_SOURCE:" + mid)
    def visit(mid, active, done):
        if mid in active:
            issues.append("UNCONDITIONAL_DEPENDENCY_CYCLE:" + mid)
            return
        if mid in done or mid not in cm_by_id:
            return
        for dep in cm_by_id[mid]["requires"]:
            visit(dep, active | {mid}, done)
        done.add(mid)
    done = set()
    for mid in ids:
        visit(mid, set(), done)

    ops = cm_by_id.get("notification", {}).get("phase_invocations", [])
    if [op.get("canonical_step") for op in ops] != ["C6", "E"]:
        issues.append("NOTIFICATION_PULSE_AND_PUSH_PHASES_NOT_SPLIT")
    if not any(op.get("canonical_step") == "D" and "build:C8" in op.get("requires", [])
               for op in cm_by_id.get("english", {}).get("phase_invocations", [])):
        issues.append("ENGLISH_MUST_FOLLOW_BUILD")
    if "navigation" in cm_by_id.get("semantic-links", {}).get("requires", []):
        issues.append("LITECAST_INTERNAL_SEMANTIC_LINKS_BLOCKED_BY_NAVIGATION")
    if "brain" in cm_by_id.get("build", {}).get("requires", []):
        issues.append("LITECAST_BUILD_WRONGLY_REQUIRES_BRAIN")
    if "page" not in cm_by_id.get("taxonomy", {}).get("requires", []):
        issues.append("TAXONOMY_BEFORE_PAGE_DRAFT")
    versions = contracts.get("interface_versions", {})
    if versions.get("current_intake_staging") != "0.1" or versions.get("future_target") != "1.0-draft":
        issues.append("STAGING_VS_TARGET_SCHEMA_VERSION_NOT_EXPLICIT")

    for path in ENTRYPOINTS:
        entry = (root / path).read_text(encoding="utf-8")
        if ".dentcast/workflows/README.md" not in entry:
            issues.append("ENTRYPOINT_NO_CANONICAL_ROUTER:" + path)
        if path != ".dentcast/workflows/agent-parity.md" and "agent-parity.md" not in entry:
            issues.append("ENTRYPOINT_NO_PARITY_ROUTER:" + path)
        if "dentcast_orchestrator_draft.py" in entry:
            issues.append("LIVE_ENTRYPOINT_PREMATURE_STAGING_ACTIVATION:" + path)

    return {"status": "PASS" if not issues else "FAIL",
            "scope": "static-source-and-contract-audit-only",
            "not_execution_or_behavioral_parity": True,
            "canonical_lines": len(canonical.splitlines()),
            "canonical_slice_ranges": ranges,
            "hard_rules_mapped": len(RULE_OWNERS),
            "contract_modules_mapped": len(ids),
            "canonical_anchors_checked": len(CRITICAL_ANCHORS),
            "live_entrypoints_checked": len(ENTRYPOINTS),
            "issues": issues}


if __name__ == "__main__":
    report = audit()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0 if report["status"] == "PASS" else 1)
