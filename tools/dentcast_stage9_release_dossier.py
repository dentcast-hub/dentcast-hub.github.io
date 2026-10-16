#!/usr/bin/env python3
"""Stage 9 FINAL offline release dossier: reproducible Git-bound scope check.

Never changes repository files, touches external services, grants approval,
activates the modular workflow, or merges. A staging pass is NOT a release pass.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

import dentcast_stage8_9_preflight as integration

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_STAGING_PREFIXES = (
    ".dentcast/workflows/modules/",
    "tests/test_dentcast_",
    "tools/dentcast_",
    "tools/audit_dentcast_",
    "tools/validate_dentcast_",
)
EXPECTED_STAGING_EXACT = {
    ".dentcast/workflows/README.md",
    ".github/workflows/publishing-route-staging-tests.yml",
}
SYNTHETIC_RUN = re.compile(
    r"^\.dentcast/execution-memory/runs/stage(?:4|6)-smoke-[0-9]{8}/"
)


def git(*args):
    result = subprocess.run(["git", "-C", str(ROOT), *args],
                            check=False, capture_output=True, timeout=30)
    if result.returncode:
        raise ValueError("GIT_INSPECTION_FAILED:" + " ".join(args))
    return result.stdout


def stage9_changed_files(base):
    raw = git("diff", "--name-only", "-z", "--diff-filter=ACDMRT",
              base + "...HEAD")
    paths = [p.decode("utf-8") for p in raw.split(b"\0") if p]
    if len(set(paths)) != len(paths):
        raise ValueError("DUPLICATE_DIFF_PATH")
    return sorted(paths)


def in_staging_scope(path):
    if not isinstance(path, str) or not path or path.startswith("/"):
        return False
    parts = Path(path).parts
    if any(p in {".", ".."} for p in parts):
        return False
    if path in EXPECTED_STAGING_EXACT:
        return True
    if any(path.startswith(p) for p in EXPECTED_STAGING_PREFIXES):
        return True
    return bool(SYNTHETIC_RUN.match(path))


def evaluate(base="origin/main"):
    """Separate ready-to-review *offline* status from forbidden real activation."""
    issues = []
    integration_result = integration.analyze(base)
    issues.extend("INTEGRATION:" + issue for issue in integration_result["issues"])
    result = {
        "schema": "dentcast-stage9-final-offline-v1",
        "stage7": "STAGING_FINAL_ACCEPTED_RECORDED",
        "stage8": integration_result["stage8"],
        "final_activation": "BLOCKED",
        "permission_to_merge": False,
        "permission_to_publish": False,
        "permission_to_activate_router": False,
        "founder_consent_verified": False,
        "scientific_independence_verified": False,
        "verified_live_end_to_end_parity": False,
        "closed_external_gates": list(integration.RELEASE_GATES),
    }
    try:
        revision = git("rev-parse", "HEAD").decode("ascii").strip()
        baseline = git("rev-parse", "--verify", base + "^{commit}").decode("ascii").strip()
        parent = git("merge-base", revision, baseline).decode("ascii").strip()
        changed = stage9_changed_files(base)
        unexpected = [p for p in changed if not in_staging_scope(p)]
        if unexpected:
            issues.extend("OUT_OF_SCOPE_FILE:" + p for p in unexpected)
        if not changed:
            issues.append("NO_STAGING_CHANGESET")
        if not (ROOT / ".dentcast/workflows/modules/STAGING-THREE-CYCLE-AUDIT-2026-10-16.md").is_file():
            issues.append("THREE_CYCLE_AUDIT_MISSING")
        if not (ROOT / ".dentcast/workflows/modules/STAGE-9-PRE-ACTIVATION.md").is_file():
            issues.append("STAGE9_BOUNDARY_MISSING")
        if not re.fullmatch(r"[0-9a-f]{40}", revision + ""):
            issues.append("INVALID_REVISION")
        result.update({
            "candidate_sha": revision, "main_baseline_sha": baseline,
            "merge_base_sha": parent,
            "changed_file_count": len(changed),
            "out_of_scope_files": unexpected,
            "main_new_commits_not_in_candidate": int(
                git("rev-list", "--count", revision + ".." + baseline).decode("ascii")),
            "feature_commits_not_in_main": int(
                git("rev-list", "--count", baseline + ".." + revision).decode("ascii")),
            "legacy_README_touched": ".dentcast/workflows/README.md" in changed,
            "live_entrypoints_identical_to_main":
                integration_result["baseline_entrypoints_and_science"] == "identical",
        })
    except (ValueError, OSError, UnicodeDecodeError) as e:
        issues.append("GIT_RELEASE_INSPECTION_BLOCKED:" + str(e))
    result["issues"] = sorted(set(issues))
    result["stage9_offline"] = (
        "FINAL_STAGING_HANDOFF_PASS" if not issues
        else "FINAL_STAGING_HANDOFF_BLOCKED"
    )
    # Main may be one or more commits ahead: this is normal for a long-running
    # feature branch, but it MUST be reconciled before any later cutover.
    result["production_readiness"] = "NOT_EVALUATED_EXTERNAL_GATES_CLOSED"
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-ref", default="origin/main")
    args = parser.parse_args()
    out = evaluate(args.baseline_ref)
    print(json.dumps(out, ensure_ascii=False, sort_keys=True, indent=2))
    return 0 if not out["issues"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
