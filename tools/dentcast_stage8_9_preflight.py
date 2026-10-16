#!/usr/bin/env python3
"""Stages 8-9: read-only staging integration and pre-activation boundary.

This is NOT the live DentCast publishing router. It NEVER grants approval,
starts agents, touches patient/scientific records, publishes, or merges.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENTRYPOINTS = (
    "CLAUDE.md", "AGENTS.md",
    ".cursor/rules/dentcast-router.mdc",
    ".cursor/rules/dentcast-publishing.mdc",
    ".dentcast/workflows/agent-parity.md",
)
SCIENTIFIC = (".dentcast/des-v3.4-knowledge.md",
              "tools/des_fidelity_units.py")
CANONICAL = ".dentcast/workflows/README.legacy.md"
ACTIVE_ROUTER = ".dentcast/workflows/README.md"
PRE_MIGRATION_SOURCE_COMMIT = "af318d4274c04ecb50697ea5a543bb9f24db8570"
LEGACY_ARCHIVE = {
    "CLAUDE.md": "CLAUDE.legacy.md",
    "AGENTS.md": "AGENTS.legacy.md",
    ".cursor/rules/dentcast-router.mdc": ".dentcast/workflows/legacy/cursor/dentcast-router.mdc",
    ".cursor/rules/dentcast-publishing.mdc": ".dentcast/workflows/legacy/cursor/dentcast-publishing.mdc",
    ".dentcast/workflows/agent-parity.md": ".dentcast/workflows/agent-parity.legacy.md",
    ACTIVE_ROUTER: CANONICAL,
}
STAGING_REPORT = ".dentcast/workflows/modules/STAGE-7-STAGING-ACCEPTANCE.md"
RELEASE_GATES = (
    "authenticated_founder_approval",
    "independent_real_model_scientific_checks",
    "private_sensitive_artifact_storage",
    "authorized_drive_admin_notification_integrations",
    "full_legacy_modular_end_to_end_parity",
    "real_client_context_and_token_measurement",
    "independent_review_and_explicit_activation_approval",
)
# Cases cover all available independent publication families, paper transitions
# and fail-closed branches, without fabricating a clinical judgment.
ROUTES = tuple(
    {"has_text": True, "has_paper": paper, "category": cat,
     "challenge": challenge}
    for cat, challenge in (
        ("clinical", False), ("chairside", False), ("sharehub", False),
        ("notecast", False), ("episode", False), ("glossary", False),
        ("litecast", False), ("sharehub", True)
    )
    for paper in (False, True)
) + ({"has_text": False, "has_paper": True},)


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def file_hash(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def baseline_check(paths, baseline):
    """Diff byte identity against a named Git ref, with no writes/network."""
    if not re.fullmatch(r"[A-Za-z0-9_./-]{1,128}", baseline) or baseline.startswith("-"):
        raise ValueError("UNSAFE_BASELINE_REF")
    mismatches = []
    for path in paths:
        proc = subprocess.run(
            ["git", "-C", str(ROOT), "show", baseline + ":" + path],
            check=False, capture_output=True, timeout=15,
        )
        if proc.returncode:
            raise ValueError("MISSING_BASELINE_FILE:" + path)
        if hashlib.sha256(proc.stdout).hexdigest() != file_hash(LEGACY_ARCHIVE.get(path, path)):
            mismatches.append(path)
    return mismatches


def analyze(baseline=None):
    route_module = _load("s89_route", "tools/dentcast_stage3_route.py")
    oracle = _load("s89_oracle", "tools/audit_dentcast_stage7_parity.py")
    issues = []
    cases = []
    for i, request in enumerate(ROUTES):
        plan = route_module.compile_steps(request)
        if plan.get("status") != "compiled_staging_requires_operator":
            issues.append("ROUTE_BLOCKED:" + str(i) + ":" + str(plan.get("code")))
            continue
        errs = oracle.inspect_route(plan)
        if errs:
            issues.extend("ROUTE_" + str(i) + ":" + e for e in errs)
        ids = [x["step_id"] for x in plan["ordered_steps"]]
        if plan.get("execution_authorized") is not False or plan.get("side_effects_permitted") != []:
            issues.append("ROUTE_EXECUTION_NOT_DISABLED:" + str(i))
        if len(ids) != len(set(ids)) or not ids or ids[0] != "intake:route":
            issues.append("ROUTE_ORDER_IDENTITY:" + str(i))
        for n, step in enumerate(plan["ordered_steps"]):
            if step["requires_step"] != (ids[n-1] if n else None):
                issues.append("ROUTE_BROKEN_PREDECESSOR:" + str(i))
            if not (ROOT / step["source"]).is_file():
                issues.append("ROUTE_MODULE_MISSING:" + step["source"])
        cases.append({"request": request, "route": plan["route"],
                      "step_count": len(ids), "digest": hashlib.sha256(
                          json.dumps(ids, separators=(",", ":")).encode()).hexdigest(),
                      "issues": errs})
    for path in ENTRYPOINTS + SCIENTIFIC + (CANONICAL, ACTIVE_ROUTER, STAGING_REPORT) + tuple(LEGACY_ARCHIVE.values()):
        if not (ROOT / path).is_file():
            issues.append("MISSING_REQUIRED_SOURCE:" + path)
    if (ROOT / STAGING_REPORT).is_file() and not (ROOT / STAGING_REPORT).read_text(
            encoding="utf-8").startswith("# Stage 7 — STAGING ACCEPTED"):
        issues.append("STAGE7_NOT_ACCEPTED")
    for path in ENTRYPOINTS + (ACTIVE_ROUTER,):
        candidate = ROOT / path
        if candidate.is_file():
            body = candidate.read_text(encoding="utf-8")
            if "STAGING_ONLY_NO_LIVE_PUBLISH" not in body:
                issues.append("ACTIVE_CONNECTOR_STAGING_GUARD_MISSING:" + path)
            if path != ACTIVE_ROUTER and ACTIVE_ROUTER not in body:
                issues.append("ACTIVE_CONNECTOR_ROUTE_MISSING:" + path)
    if baseline is None:
        issues.append("BASELINE_NOT_CHECKED")
        baseline_identity = "not_checked"
    else:
        try:
            # Original branch workflow predates one upstream main edit to the
            # glossary generation rule (README line 668). Prove the exact
            # archived branch source against its FROZEN pre-migration SHA,
            # and compare the unchanged agent instructions/science to main.
            diff = baseline_check(ENTRYPOINTS + SCIENTIFIC, baseline)
            source_diff = baseline_check((ACTIVE_ROUTER,), PRE_MIGRATION_SOURCE_COMMIT)
            issues.extend("LEGACY_OR_SCIENCE_DRIFT:" + path for path in diff)
            issues.extend("ARCHIVED_ORIGINAL_WORKFLOW_DRIFT:" + path for path in source_diff)
            baseline_identity = "identical" if not diff and not source_diff else "mismatch"
        except (ValueError, OSError, subprocess.SubprocessError) as exc:
            issues.append("BASELINE_CHECK_FAILED:" + str(exc))
            baseline_identity = "not_verified"
    # The *only* positive result is staging integration. Actual authorizations
    # are external provenance, never produced by this program or its fixtures.
    return {
        "schema": "dentcast-stage8-9-offline-preflight-v1",
        "stage8": "STAGING_INTEGRATION_PASS" if not issues else "STAGING_INTEGRATION_BLOCKED",
        "stage9": "PRE_ACTIVATION_PACKAGE_READY_ACTIVATION_BLOCKED" if not issues
                  else "PRE_ACTIVATION_PACKAGE_BLOCKED",
        "route_cases_checked": len(cases), "routes": cases,
        "baseline_entrypoints_and_science": baseline_identity,
        "entrypoint_migration": "STAGING_ONLY_ARCHIVED_LEGACY" if baseline_identity == "identical" else "NOT_VERIFIED",
        "blocked_external_gates": list(RELEASE_GATES),
        "issues": sorted(set(issues)),
        "execution_authorized": False, "publish_authorized": False,
        "merge_authorized": False, "activation_authorized": False,
        "founder_approval_verified": False,
        "full_behavioral_parity_proven": False,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--baseline-ref", required=True,
                    help="Local fetched main ref; e.g. origin/main")
    args = ap.parse_args()
    outcome = analyze(args.baseline_ref)
    print(json.dumps(outcome, ensure_ascii=False, indent=2))
    return 0 if not outcome["issues"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
