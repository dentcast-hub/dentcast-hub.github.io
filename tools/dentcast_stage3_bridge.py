#!/usr/bin/env python3
"""Portable Stage-3 module task handoff with local artifact verification.

Agents can use this *staging* bridge to read authoritative instructions for
one canonical substep at a time, do authorized work only in an explicitly
marked disposable workspace, then submit a report plus an immutable receipt.
It is NOT an auto-publication engine, remote memory, or scientific checker.

The bridge never gives an agent implicit founder approval. External access
(GitHub/Drive/admin) is NOT provided or authorized by this implementation.
"""
import hashlib
import importlib.util
import json
import os
import re
import stat
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


orchestrator = _load("s3bridge_runner", "dentcast_stage3_orchestrator.py")
handlers = _load("s3bridge_handlers", "dentcast_stage3_modules.py")
routes = _load("s3bridge_routes", "dentcast_stage3_route.py")

SANDBOX_MARKER = ".dentcast-stage3-disposable-workspace.json"
ARTIFACT_REQUIRED = {
    "brain:glossary-register", "semantic-links:glossary",
    "page:draft", "page:litecast-register", "navigation:publish", "semantic-links:specialist",
    "semantic-links:litecast", "paper-cabinet:catalog",
    "paper-cabinet:credit", "learning-assets:flashcards",
    "learning-assets:quiz", "challenge:public", "brain:append",
    "pathways:place", "notification:pulse", "build:version",
    "build:rebuild", "build:version-final", "english:mirror", "notification:push-marker",
    "verify:phase-f", "verify:paper-only",
}


def _need(ok, code):
    if not ok:
        raise ValueError(code)


def _is_digest(x):
    return isinstance(x, str) and re.fullmatch(r"[0-9a-f]{64}", x) is not None


def _file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as stream:
        for block in iter(lambda: stream.read(262144), b""):
            h.update(block)
    return h.hexdigest()


def workspace_root(path):
    """Require disposable *marked* workspace, never default to live repository."""
    supplied = Path(path)
    _need(not supplied.is_symlink(), "INVALID_STAGE3_WORKSPACE")
    root = supplied.resolve(strict=True)
    _need(root.is_dir() and not root.is_symlink(), "INVALID_STAGE3_WORKSPACE")
    # A marker inside (or above) the active source checkout is not a sandbox.
    live = ROOT.resolve(strict=True)
    _need(not root.is_relative_to(live) and not live.is_relative_to(root),
          "LIVE_REPOSITORY_IS_NOT_DISPOSABLE")
    marker = root / SANDBOX_MARKER
    _need(marker.is_file() and not marker.is_symlink(), "UNMARKED_STAGE3_WORKSPACE")
    data = json.loads(marker.read_text(encoding="utf-8"))
    _need(isinstance(data, dict) and data.get("purpose") == "dentcast-stage3-disposable-test"
          and data.get("allow_real_publication") is False and
          data.get("allow_remote_mutation") is False,
          "WORKSPACE_NOT_DISPOSABLE")
    return root


def prepare_task(state, source_root=ROOT):
    """Read the exact source excerpt for the next step and package its digest."""
    inv = orchestrator.next_invocation(state)
    if inv is None:
        return None
    step = inv["step"]
    source_path = Path(source_root) / step["source"]
    _need(source_path.is_file() and not source_path.is_symlink(), "CANONICAL_SLICE_UNAVAILABLE")
    rules = source_path.read_text(encoding="utf-8")
    _need(bool(rules.strip()), "EMPTY_CANONICAL_MODULE_SOURCE")
    hard_path = Path(source_root) / ".dentcast/workflows/modules/01-hard-rules.md"
    hard = hard_path.read_text(encoding="utf-8")
    _need(bool(hard.strip()), "MISSING_GLOBAL_RULES")
    return {
        "status": "awaiting_external_operator",
        "step_id": step["step_id"], "module_id": step["module_id"],
        "canonical_step": step["canonical_step"],
        "source_path": step["source"],
        "source_sha256": hashlib.sha256(rules.encode("utf-8")).hexdigest(),
        "global_rules_sha256": hashlib.sha256(hard.encode("utf-8")).hexdigest(),
        "input_digest": inv["input_digest"],
        "required_output_schema": inv["required_output_schema"],
        "approval_gates": step["approval_gates"],
        "content_source": "Read canonical source_path + 01-hard-rules.md in full.",
        "task_safety": "Disposable workspace only; no remote Git/Drive/admin mutations; no real publish.",
        "execution_authorized": False,
    }


def verify_local_receipt(state, report, receipt_path, workspace):
    """Independently compare local artifact bytes with an operator receipt.

    This proves byte integrity and invocation binding, NOT semantic quality,
    founder authorization, remote side effects or a DES/Fidelity judgment.
    """
    root = workspace_root(workspace)
    inv = orchestrator.next_invocation(state)
    _need(inv is not None, "NO_PENDING_STEP")
    task = prepare_task(state)
    _need(isinstance(report, dict) and report.get("status") == "completed",
          "ONLY_COMPLETED_REPORTS_CAN_BE_ARTIFACT_CHECKED")
    path = Path(receipt_path)
    _need(path.is_file() and not path.is_symlink(), "INVALID_EXTERNAL_RECEIPT_PATH")
    receipt = json.loads(path.read_text(encoding="utf-8"))
    _need(isinstance(receipt, dict) and
          set(receipt) == {"schema", "run_id", "source_revision", "step_id", "input_digest",
                           "source_sha256", "global_rules_sha256", "artifacts"},
          "INVALID_EXTERNAL_RECEIPT_SCHEMA")
    _need(receipt["schema"] == "stage3-local-artifact-receipt-v1",
          "INVALID_RECEIPT_VERSION")
    _need(receipt["run_id"] == state["run_id"] and
          receipt["source_revision"] == state["source_revision"] and
          receipt["step_id"] == inv["step"]["step_id"] and
          receipt["input_digest"] == inv["input_digest"], "EXTERNAL_RECEIPT_IDENTITY_MISMATCH")
    _need(receipt["source_sha256"] == task["source_sha256"] and
          receipt["global_rules_sha256"] == task["global_rules_sha256"],
          "CANONICAL_SOURCE_CHANGED")
    _need(report["external_receipt_digest"] == handlers.hash_public(receipt),
          "RECEIPT_CONTENT_DIGEST_MISMATCH")
    artifacts = receipt["artifacts"]
    _need(isinstance(artifacts, list) and len(artifacts) <= 40,
          "INVALID_ARTIFACT_MANIFEST")
    if inv["step"]["step_id"] in ARTIFACT_REQUIRED:
        _need(bool(artifacts), "NO_ARTIFACT_EVIDENCE")
    seen = set()
    for item in artifacts:
        _need(isinstance(item, dict) and set(item) == {"path", "sha256"},
              "INVALID_ARTIFACT_ENTRY")
        name, sha = item["path"], item["sha256"]
        _need(isinstance(name, str) and bool(name) and "\x00" not in name
              and _is_digest(sha), "INVALID_ARTIFACT_IDENTITY")
        relative = Path(name)
        _need(not relative.is_absolute() and
              not any(part in (".", "..") for part in relative.parts),
              "ARTIFACT_PATH_TRAVERSAL")
        _need(name not in seen, "DUPLICATE_ARTIFACT")
        seen.add(name)
        target = root / relative
        _need(not target.is_symlink(), "ARTIFACT_SYMLINK_FORBIDDEN")
        actual = target.resolve(strict=True)
        _need(actual.is_relative_to(root) and actual.is_file(),
              "ARTIFACT_OUTSIDE_SANDBOX")
        st = actual.stat()
        _need(stat.S_ISREG(st.st_mode) and st.st_size <= 20_000_000,
              "UNSUPPORTED_ARTIFACT_FILE")
        _need(_file_hash(actual) == sha, "ARTIFACT_BYTES_CHANGED")
    checked = orchestrator.submit(state, report)
    # A local integrity check is NOT a trusted GitHub approval or a real publish.
    checked["history"][-1]["local_artifact_integrity_verified"] = True
    checked["history"][-1]["artifact_manifest_digest"] = handlers.hash_public(receipt)
    orchestrator.validate_state(checked)
    return checked


def attest_sample_receipt(state, workspace, relative_paths):
    """Create receipt *data* for inspection; caller saves it to a local JSON file.

    It does not sign anything, grant approval, or write GitHub memory.
    Only paths in the marked disposable workspace are accepted.
    """
    root = workspace_root(workspace)
    task = prepare_task(state)
    _need(task is not None, "NO_PENDING_STEP")
    artifacts = []
    for name in relative_paths:
        candidate = Path(name)
        _need(not candidate.is_absolute() and ".." not in candidate.parts,
              "ARTIFACT_PATH_TRAVERSAL")
        target = root / candidate
        _need(target.is_file() and not target.is_symlink()
              and target.resolve(strict=True).is_relative_to(root),
              "INVALID_ARTIFACT_PATH")
        artifacts.append({"path": name, "sha256": _file_hash(target)})
    return {
        "schema": "stage3-local-artifact-receipt-v1",
        "run_id": state["run_id"], "source_revision": state["source_revision"],
        "step_id": task["step_id"], "input_digest": task["input_digest"],
        "source_sha256": task["source_sha256"],
        "global_rules_sha256": task["global_rules_sha256"],
        "artifacts": artifacts,
    }

def main():
    """A single practical CLI for Claude Code, Cursor and Codex handoffs."""
    import argparse
    import sys
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["task", "attest", "confirm", "status"])
    parser.add_argument("--state", required=True)
    parser.add_argument("--workspace")
    parser.add_argument("--paths", nargs="*", default=[])
    parser.add_argument("--receipt")
    parser.add_argument("--report")
    args = parser.parse_args()
    try:
        state_path = Path(args.state)
        state = json.loads(state_path.read_text(encoding="utf-8"))
        orchestrator.validate_state(state)
        if args.command == "task":
            result = prepare_task(state)
        elif args.command == "status":
            result = {"status": orchestrator.stage3_status(state),
                      "completed_steps": state["next_index"],
                      "total_steps": len(state["plan"]["ordered_steps"]),
                      "execution_authorized": False}
        elif args.command == "attest":
            _need(args.workspace and args.receipt, "WORKSPACE_AND_RECEIPT_REQUIRED")
            receipt = attest_sample_receipt(state, args.workspace, args.paths)
            output = Path(args.receipt)
            _need(output.parent.is_dir() and not output.is_symlink(), "BAD_RECEIPT_OUTPUT_PATH")
            output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding="utf-8")
            result = {"status": "local_receipt_created",
                      "receipt_digest": handlers.hash_public(receipt),
                      "step_id": receipt["step_id"],
                      "execution_authorized": False}
        else:
            _need(args.workspace and args.receipt and args.report,
                  "WORKSPACE_RECEIPT_AND_REPORT_REQUIRED")
            report = json.loads(Path(args.report).read_text(encoding="utf-8"))
            validated = verify_local_receipt(state, report, args.receipt, args.workspace)
            orchestrator.save_checked(state_path, validated,
                                      expected_digest=orchestrator.storage_digest(state))
            result = {"status": orchestrator.stage3_status(validated),
                      "completed_steps": validated["next_index"],
                      "total_steps": len(validated["plan"]["ordered_steps"]),
                      "step_id": report["step_id"],
                      "artifact_integrity_verified": True,
                      "real_publish_completed": False,
                      "execution_authorized": False}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, OSError, KeyError, TypeError, AttributeError) as exc:
        print(json.dumps({"status": "blocked", "reason": str(exc),
                          "execution_authorized": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
