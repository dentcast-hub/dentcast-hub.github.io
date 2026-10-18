"""Live workflow checkpoint protocol and guarded cleanup, not a content authoring engine."""
import copy
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile

import dentcast_publish_handoff as h

# These are checkpoints into the original source, not rewritten publishing logic.
# C.8 builders precede C.7 stamping; LiteCast links run after page construction.
GROUPS = (
    ("rules",),
    ("0", "A", "B.1", "B.2", "B.3", "B.3.5", "B.4", "B.4.7", "B.4.8", "B.4.9", "B.5"),
    ("C.0", "C.0.1", "C.0.2", "C.0.3", "C.0.4", "C.1", "C.2", "C.0.5", "C.0.6"),
    ("C.2.4", "C.2.5", "C.2.6", "C.3", "C.4", "C.4.5", "C.4.5-b", "C.4.6"),
    ("C.4.7", "C.4.7-b", "C.4.8", "C.4.9"),
    ("C.4.10.1", "C.4.10.2", "C.4.10.3"),
    ("C.4.11", "C.4.12"), ("C.4.13",), ("C.4.14",),
    ("C.5.0", "C.5", "C.5.5", "C.5.6", "C.5.6-b"),
    ("C.6", "C.8", "C.7"), ("D", "E", "F", "G"),
)
REGISTRY = {sid: h.MODULES[i] for i, group in enumerate(GROUPS) for sid in group}
PAPER_IDS = ("rules", "0", "C.4.10.1", "C.4.10.2", "G")
CLEANUP_NAME = "dentcast-publish-cleanup.json"  # private Git metadata, never a second repo handoff


def plan(paper_only=False):
    ids = PAPER_IDS if paper_only else tuple(REGISTRY)
    return [{"id": sid, "module": REGISTRY[sid], "status": "pending", "evidence": [], "reason": None}
            for sid in ids]


def require_plan(publication):
    h.validate_publication(publication)
    required = PAPER_IDS if publication["category"] == "paper-only" else tuple(REGISTRY)
    steps = publication["steps"]
    ids = [s["id"] for s in steps]
    h.require([sid for sid in ids if sid in REGISTRY] == list(required), "CANONICAL_PLAN_REQUIRED")
    for s in steps:
        base = s["id"].split("/", 1)[0]
        h.require(base in required and s["module"] == REGISTRY[base], "UNKNOWN_CANONICAL_STEP")
        if s["id"] != base:
            # Dynamic scientific/other substeps precede their aggregate checkpoint.
            h.require(ids.index(s["id"]) < ids.index(base), "SUBSTEP_MUST_PRECEDE_AGGREGATE")
        if s["id"] in ("rules", "0", "F", "G"):
            h.require(s["status"] != "skipped", "REQUIRED_CHECKPOINT_CANNOT_BE_SKIPPED")


def metadata_path(root):
    path = Path(h.text_git(root, "rev-parse", "--git-path", CLEANUP_NAME))
    path = path if path.is_absolute() else root / path
    h.require(not path.is_symlink(), "UNSAFE_CLEANUP_METADATA")
    return path


def pending(root):
    return metadata_path(root).exists()


def state_for_update(root, expected):
    state, sha = h.load_state(root)
    h.require(sha == expected, "STALE_HANDOFF_WRITE")
    require_plan(state["publication"])
    h.require(not pending(root), "CLEANUP_DELIVERY_PENDING")
    return state


def require_step_delivery(root, state, expected):
    """Fresh read-only origin check; never commit/push or trust cached upstream."""
    current = h.snapshot(root, state['publication']['target_paths'], check_remote=True)
    remote = current['remote']
    h.require(remote['status'] == 'observed' and remote['head'] == current['head'],
              'PREVIOUS_STEP_PUSH_NOT_CONFIRMED')
    h.require(not h.status_paths(root), 'PREVIOUS_STEP_WORK_NOT_COMMITTED')
    delivered = h.git(root, 'show', current['head'] + ':' + h.STATE_PATH, optional=True)
    h.require(delivered is not None and h.digest(delivered) == expected,
              'PREVIOUS_STEP_HANDOFF_NOT_DELIVERED')
    h.require(current['repository'] == state['snapshot']['repository']
              and current['branch'] == state['snapshot']['branch'], 'REPOSITORY_OR_BRANCH_CHANGED')
    index = h.index_entries(root)
    for name, info in state['snapshot']['files'].items():
        actual = h.file_info(root, name)
        h.require(all(actual[k] == info[k] for k in actual), 'DELIVERED_STEP_WORK_MISMATCH:' + name)
        h.require(actual['kind'] == 'missing' or bool(index.get(name)),
                  'PREVIOUS_STEP_REQUIRED_FILE_NOT_TRACKED:' + name)
    h.require(current['workflow'] == state['snapshot']['workflow'], 'DELIVERED_STEP_WORKFLOW_MISMATCH')


def guard_step_transition(root, state, publication, expected):
    old = {s['id']: s for s in state['publication']['steps']}
    h.require(all(s['id'] in old or s['status'] == 'pending' for s in publication['steps']),
              'NEW_SUBSTEPS_MUST_START_PENDING')
    # Bulk record cannot bypass the per-step boundary. Metadata reconciliation
    # and invalidation remain possible without remote access.
    entered = [s for s in publication['steps'] if s['id'] in old
               and old[s['id']]['status'] not in ('started', 'completed', 'skipped')
               and s['status'] in ('started', 'completed', 'skipped')]
    h.require(len(entered) <= 1, 'ONE_STEP_PER_CHECKPOINT_REQUIRED')
    for row in entered:
        h.require(not any(a['status'] in ('started', 'outcome_unknown') for a in publication['external_actions']),
                  'EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY')
        h.require(row['id'] == h.next_step(state['publication']),
                  'START_NEXT_STEP_IN_SEPARATE_CHECKPOINT')
        before = state['publication']['steps']
        index = next(i for i, s in enumerate(before) if s['id'] == row['id'])
        if index and all(s['status'] in ('completed', 'skipped') for s in before[:index]):
            require_step_delivery(root, state, expected)


def step(root, expected, sid, status, evidence, reason, note=None):
    state = state_for_update(root, expected)
    p = copy.deepcopy(state["publication"])
    h.require(sid == h.next_step(p), "NOT_NEXT_CANONICAL_STEP")
    row = next(s for s in p["steps"] if s["id"] == sid)
    h.require(sid in GROUPS[0]+GROUPS[1] or (p["content_id"] != "unassigned" and p["category"] != "pending"),
              "BIND_INTAKE_IDENTITY_BEFORE_AUTHORING")
    h.require(not (sid == "F" and status == "completed"), "USE_REAL_VERIFY_FOR_PHASE_F")
    h.require(status != "completed" or row["status"] == "started", "STEP_MUST_BE_STARTED_FIRST")
    if status == 'started':
        h.require(not any(a['status'] in ('started', 'outcome_unknown') for a in p['external_actions']),
                  'EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY')
    row.update(status=status, evidence=evidence, reason=reason)
    p["status"] = "blocked" if status in ("blocked", "failed") else "in_progress"
    p["blocker"] = f"{sid}: {reason}" if p["status"] == "blocked" else None
    require_plan(p)
    return h.save(root, p, expected=expected, note=note)


def bind(root, expected, content_id, category, targets, evidence):
    """Resolve an intake placeholder once, before any authoring or side effect."""
    with h.locked(root):
        state = state_for_update(root, expected)
        old = state["publication"]
        h.require(old["content_id"] == "unassigned" and old["category"] == "pending", "IDENTITY_ALREADY_BOUND")
        h.require(h.nonempty(evidence) and category not in ("pending", "")
                  and content_id != "unassigned" and h.nonempty(content_id), "VERIFIED_INTAKE_IDENTITY_REQUIRED")
        h.require(not old["external_actions"] and all(s["status"] == "pending" or s["id"] in GROUPS[0]+GROUPS[1]
                  for s in old["steps"]), "BIND_ONLY_BEFORE_AUTHORING")
        h.require(not h.differences(root, state, h.snapshot(root, old["target_paths"])), "WORK_CHANGED_BEFORE_BIND")
        p = copy.deepcopy(old)
        p.update(content_id=content_id, category=category, target_paths=targets)
        if category == "paper-only":
            h.require(all(s["status"] == "pending" or s["id"] in ("rules", "0") for s in old["steps"]),
                      "PAPER_ONLY_ROUTE_MUST_BE_SELECTED_AT_PHASE_ZERO")
            p["steps"] = [next((s for s in old["steps"] if s["id"] == row["id"]), row)
                          for row in plan(paper_only=True)]
        p["context"]["decisions"].append({"kind": "intake_identity_bound", "evidence": evidence})
        require_plan(p)
        state.update(schema=h.SCHEMA, publication=p, snapshot=h.snapshot(root, targets), generation=state["generation"]+1,
                     updated_at=h.now(), previous_sha256=expected,
                     reconciliation={"note": "Resolved previously unassigned intake identity", "observed_changes": ["IDENTITY_BOUND_ONCE"]})
        sha = h.write_atomic(root, state)
        return {"status": "checkpoint_written", "sha256": sha, "publication_completed": False}


def gate(root, p, expect_title=None, expect_caption=None, catalog_id=None):
    """Execute the actual local Phase F, or the documented no-page catalog check."""
    if p["category"] == "paper-only":
        h.require(h.nonempty(catalog_id), "PAPER_CATALOG_ID_REQUIRED")
        path = "dentcast_cabinet_full_catalog.json"
        h.require(path in p["target_paths"], "PAPER_CATALOG_MUST_BE_WATCHED")
        catalog = h.decode_json(h.safe_path(root, path).read_text(encoding="utf-8"))
        matches = [e for e in catalog["papers"] if e.get("id") == catalog_id]
        h.require(len(matches) == 1 and h.nonempty(matches[0].get("drive_id")), "PAPER_CATALOG_ENTRY_INVALID")
        record = matches[0]
        did = record["drive_id"]
        h.require(record.get("drive_view") == f"https://drive.google.com/file/d/{did}/view"
                  and record.get("drive_download") == f"https://drive.google.com/uc?export=download&id={did}",
                  "PAPER_DRIVE_LINK_MISMATCH")
        h.require(any(a["status"] == "completed" and did in a["target"] and a["evidence"]
                      for a in p["external_actions"]), "PAPER_DRIVE_RECEIPT_REQUIRED")
        return {"kind": "paper_catalog_gate", "catalog_id": catalog_id, "exit_code": 0,
                "output_sha256": h.digest(json.dumps(record, sort_keys=True).encode()),
                "summary": "Catalog entry and Drive-link identities verified; operator verifies actual Drive filing."}
    cid = h.relative_path(p["content_id"])
    h.require(not cid.endswith(".html") and not cid.startswith("-"), "CANONICAL_CONTENT_ID_REQUIRED")
    h.require(cid + ".html" in p["target_paths"], "PUBLISHED_PAGE_MUST_BE_WATCHED")
    argv = [sys.executable, str(h.safe_path(root, "tools/verify_publish.py")), cid]
    if expect_title is not None:
        argv += ["--expect-title", expect_title]
    if expect_caption is not None:
        argv += ["--expect-caption", expect_caption]
    # No --all, --last, shell interpolation, or operator-supplied executable.
    try:
        result = subprocess.run(argv, cwd=root, capture_output=True, timeout=120,
                                env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1", "GIT_NO_LAZY_FETCH": "1"})
        output = result.stdout + result.stderr
        summary = next((l for l in result.stdout.decode("utf-8", "replace").splitlines()
                        if "passed," in l and "failed" in l), "Verifier did not produce its expected summary")
        code = result.returncode
        if code == 0 and not re.fullmatch(r"[1-9]\d* passed, \d+ warned, 0 failed\s+— publish is COMPLETE", summary):
            code = 2
    except (subprocess.TimeoutExpired, OSError):
        code, output, summary = 2, b"VERIFIER_UNAVAILABLE_OR_TIMEOUT", "Verifier unavailable or timed out"
    return {"kind": "phase_f", "content_id": cid, "expected_title": expect_title,
            "expected_caption": expect_caption, "exit_code": code,
            "output_sha256": h.digest(output), "summary": summary,
            "output": output.decode("utf-8", "replace")}


def verify(root, expected, expect_title=None, expect_caption=None, catalog_id=None):
    state = state_for_update(root, expected)
    p = copy.deepcopy(state["publication"])
    paper = p["category"] == "paper-only"
    h.require(h.next_step(p) in (("G", None) if paper else ("F", "G", None)), "VERIFICATION_NOT_AT_CANONICAL_BOUNDARY")
    boundary = next((s for s in p['steps'] if s['id'] == h.next_step(p)), None)
    if boundary and boundary['status'] == 'pending':
        require_step_delivery(root, state, expected)
    current = h.snapshot(root, p["target_paths"])
    h.require(not h.differences(root, state, current), "RECORD_CURRENT_WORK_BEFORE_VERIFICATION")
    view = h.inspect(root)
    allowed = {"UNFINISHED_STEP_NEEDS_RECONCILIATION", "RECORDED_BLOCKER"}
    h.require(not (set(view["issues"]) - allowed), "UNRESOLVED_PUBLICATION_GATES")
    receipt = gate(root, p, expect_title, expect_caption, catalog_id)
    after = h.snapshot(root, p["target_paths"])
    h.require(not h.differences(root, {"snapshot": current}, after), "VERIFIER_CHANGED_WORK")
    p["context"]["validation"].append({**{k: v for k, v in receipt.items() if k != "output"}, "recorded_at": h.now()})
    report = next(s for s in p["steps"] if s["id"] == "G")
    if report["status"] in ("completed", "skipped"):
        report.update(status="pending", evidence=[], reason=None)
    if not paper:
        row = next(s for s in p["steps"] if s["id"] == "F")
        row.update(status="completed" if receipt["exit_code"] == 0 else "failed",
                   evidence=["phase_f:" + receipt["output_sha256"]],
                   reason=None if receipt["exit_code"] == 0 else receipt["summary"])
    p["status"] = "in_progress" if receipt["exit_code"] == 0 else "blocked"
    p["blocker"] = None if receipt["exit_code"] == 0 else "Mechanical verification failed"
    result = h.save(root, p, expected=expected, note="Executed the applicable real mechanical gate")
    return {**result, "status": "checkpoint_written" if receipt["exit_code"] == 0 else "blocked", "verification": receipt}


def cleanup_record(root):
    path = metadata_path(root)
    h.require(path.is_file() and path.stat().st_size <= h.LIMIT * 2, "CLEANUP_RECORD_MISSING_OR_INVALID")
    data = h.decode_json(path.read_text(encoding="utf-8"))
    h.require(data.get("schema") == "publish-cleanup-v1" and h.digest(h.render(data["state"]).encode()) == data["state_sha256"],
              "CLEANUP_RECORD_INVALID")
    require_plan(data["state"]["publication"])
    return data


def store_cleanup(root, data):
    path = metadata_path(root)
    h.require(not path.exists(), "CLEANUP_DELIVERY_PENDING")
    encoded = json.dumps(data, ensure_ascii=True).encode("utf-8")
    h.require(len(encoded) <= h.LIMIT * 2, "CLEANUP_RECORD_TOO_LARGE")
    fd, name = tempfile.mkstemp(prefix=".publish-cleanup-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(encoded)
            f.flush()
            os.fsync(f.fileno())
        os.replace(name, path)
        if os.name != "nt":
            directory = os.open(path.parent, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def finish(root, expected):
    with h.locked(root):
        state = state_for_update(root, expected)
        p = state["publication"]
        h.require(h.next_step(p) is None, "PUBLICATION_STEPS_UNFINISHED")
        # inspect uses its own lock; validate equivalent facts under this existing lock.
        current = h.snapshot(root, p["target_paths"], check_remote=True)
        h.require(not h.differences(root, state, current), "CHECKPOINT_STALE")
        h.require(not p["blocker"] and not p["context"]["pending_questions"]
                  and all(a["status"] in ("confirmed", "not_required") for a in p["context"]["approvals"])
                  and all(a["status"] not in ("started", "outcome_unknown") for a in p["external_actions"]),
                  "UNRESOLVED_PUBLICATION_GATES")
        h.require(bool(p["context"]["delivery"]) and all(
            isinstance(d, dict) and h.nonempty(d.get("scope")) and isinstance(d.get("evidence"), list)
            and bool(d["evidence"]) and all(h.nonempty(e) for e in d["evidence"])
            for d in p["context"]["delivery"]), "DELIVERY_EVIDENCE_REQUIRED")
        remote = current["remote"]
        h.require(remote["status"] == "observed" and remote["ahead"] == 0 and remote["behind"] == 0,
                  "FRESH_SYNCHRONIZED_REMOTE_REQUIRED")
        remote_state = h.git(root, "show", remote["head"] + ":" + h.STATE_PATH, optional=True)
        h.require(remote_state is not None and h.digest(remote_state) == expected, "HANDOFF_MUST_BE_DELIVERED_FIRST")
        h.require(all(f["status"] is None and f["kind"] != "missing" and bool(f["index"])
                      and all(e["stage"] == 0 for e in f["index"]) for f in current["files"].values()),
                  "WORK_NOT_CLEAN_AND_AVAILABLE")
        receipts = [r for r in p["context"]["validation"] if isinstance(r, dict) and r.get("kind") in ("phase_f", "paper_catalog_gate")]
        h.require(bool(receipts) and receipts[-1].get("exit_code") == 0, "MECHANICAL_GATE_RECEIPT_REQUIRED")
        last = receipts[-1]
        receipt = gate(root, p, last.get("expected_title"), last.get("expected_caption"), last.get("catalog_id"))
        if receipt["exit_code"] != 0:
            return {"status": "blocked", "error": "FINAL_MECHANICAL_GATE_FAILED_HANDOFF_RETAINED",
                    "publication_completed": False, "verification": receipt}
        after = h.snapshot(root, p["target_paths"])
        h.require(not h.differences(root, {"snapshot": current}, after), "WORK_CHANGED_DURING_COMPLETION")
        h.require(h.load_state(root)[1] == expected, "HANDOFF_CHANGED_DURING_COMPLETION")
        store_cleanup(root, {"schema": "publish-cleanup-v1", "state": state, "state_sha256": expected,
                             "prepared_at": h.now(), "gate": receipt})
        h.safe_path(root, h.STATE_PATH).unlink()
        if os.name != "nt":
            directory = os.open(h.safe_path(root, h.STATE_PATH).parent, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
        return {"status": "cleanup_pending_delivery", "publication_completed": False,
                "next_action": "Commit/push only the handoff deletion, then confirm-cleanup; restore-cleanup on failure",
                "verification": receipt}


def confirm_cleanup(root):
    with h.locked(root):
        data = cleanup_record(root)
        h.require(not h.safe_path(root, h.STATE_PATH).exists(), "HANDOFF_STILL_EXISTS")
        state = data["state"]
        current = h.snapshot(root, state["publication"]["target_paths"], check_remote=True)
        h.require(not h.differences(root, state, current), "WORK_CHANGED_AFTER_CLEANUP")
        remote = current["remote"]
        h.require(remote["status"] == "observed" and remote["ahead"] == 0 and remote["behind"] == 0,
                  "CLEANUP_NOT_DELIVERED")
        listing = h.git(root, "ls-tree", remote["head"], "--", h.STATE_PATH, optional=True)
        h.require(listing == b"", "REMOTE_HANDOFF_NOT_REMOVED")
        observation = h.observation_path(root)
        if observation.exists():
            observation.unlink()
        metadata_path(root).unlink()
        return {"status": "publication_completed", "publication_completed": True,
                "cleanup_commit": current["head"], "content_id": state["publication"]["content_id"]}


def restore_cleanup(root):
    with h.locked(root):
        data = cleanup_record(root)
        if h.safe_path(root, h.STATE_PATH).exists():
            h.require(h.load_state(root)[1] == data["state_sha256"], "HANDOFF_CHANGED_DURING_INTERRUPTED_CLEANUP")
        state = data["state"]
        current = h.snapshot(root, state["publication"]["target_paths"])
        h.require(all(state["snapshot"][k] == current[k] for k in ("repository", "branch")), "WRONG_CLEANUP_CHECKOUT")
        state["publication"].update(status="cleanup_pending", blocker="Cleanup delivery failed or was interrupted; reconcile before retry")
        state.update(generation=state["generation"]+1, updated_at=h.now(), previous_sha256=data["state_sha256"],
                     reconciliation={"note": "Restored checkpoint after interrupted cleanup", "observed_changes": ["CLEANUP_INTERRUPTED"]})
        sha = h.write_atomic(root, state)
        metadata_path(root).unlink()
        return {"status": "checkpoint_restored", "sha256": sha, "publication_completed": False}


def guard(root, phase):
    path = h.safe_path(root, h.STATE_PATH)
    if not path.exists():
        if pending(root):
            data = cleanup_record(root)
            h.require(phase != "stop", "CLEANUP_DELIVERY_PENDING")
            if phase == "pre-commit":
                staged = h.git(root, "diff", "--cached", "--name-only", "-z").split(b"\0")
                h.require(all(not p or p.decode() == h.STATE_PATH for p in staged), "CLEANUP_COMMIT_MUST_ONLY_DELETE_HANDOFF")
                h.require(h.git(root, "show", ":" + h.STATE_PATH, optional=True) is None, "STAGE_HANDOFF_DELETION")
                current = h.snapshot(root, data["state"]["publication"]["target_paths"])
                h.require(not h.differences(root, data["state"], current), "WORK_CHANGED_DURING_CLEANUP")
        elif phase == "ci":
            previous = h.git(root, "show", "HEAD^:" + h.STATE_PATH, optional=True)
            if previous is not None:
                state, checkpoint_sha = h.parse_state(previous)
                if state['schema'] == h.SCHEMA:
                    state = h.hydrate_v3(root, state, checkpoint_sha)
                require_plan(state["publication"])
                p = state["publication"]
                h.require(h.next_step(p) is None and not p["blocker"]
                          and not p["context"]["pending_questions"]
                          and all(a["status"] in ("confirmed", "not_required") for a in p["context"]["approvals"])
                          and all(a["status"] not in ("started", "outcome_unknown") for a in p["external_actions"]),
                          "CI_UNFINISHED_HANDOFF_DELETION")
                for name, info in state["snapshot"]["files"].items():
                    actual = h.file_info(root, name)
                    h.require(all(actual[k] == info[k] for k in actual), "CI_CLEANUP_CHANGED_WORK")
                for name, sha in state["snapshot"]["workflow"].items():
                    h.require(h.file_info(root, name)["sha256"] == sha, "CI_CLEANUP_CHANGED_WORKFLOW")
                receipts = [r for r in p["context"]["validation"] if isinstance(r, dict) and r.get("kind") in ("phase_f", "paper_catalog_gate")]
                h.require(bool(receipts), "CI_CLEANUP_RECEIPT_REQUIRED")
                last = receipts[-1]
                h.require(gate(root, p, last.get("expected_title"), last.get("expected_caption"),
                               last.get("catalog_id"))["exit_code"] == 0, "CI_CLEANUP_VERIFICATION_FAILED")
        elif phase == "pre-commit":
            old = h.git(root, "show", "HEAD:" + h.STATE_PATH, optional=True)
            h.require(old is None, "UNGUARDED_HANDOFF_DELETION")
        return {"status": "guard_passed", "publication_completed": False}
    state, _ = h.load_state(root)
    require_plan(state["publication"])
    h.require(not pending(root), "CLEANUP_DELIVERY_PENDING")
    if phase == "ci":
        # CI is detached and the recorded index/status may predate the checkpoint commit.
        for p, info in state["snapshot"]["files"].items():
            actual = h.file_info(root, p)
            h.require(all(actual[k] == info[k] for k in actual), "COMMITTED_CHECKPOINT_FILE_MISMATCH:" + p)
        for p, sha in state["snapshot"]["workflow"].items():
            h.require(h.file_info(root, p)["sha256"] == sha, "COMMITTED_WORKFLOW_MISMATCH:" + p)
    else:
        current = h.snapshot(root, state["publication"]["target_paths"])
        h.require(not h.differences(root, state, current), "CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP")
        if phase == "pre-commit":
            h.require(h.git(root, "show", ":" + h.STATE_PATH, optional=True) == path.read_bytes(),
                      "LATEST_HANDOFF_MUST_BE_STAGED")
        elif phase == 'stop':
            require_step_delivery(root, state, h.digest(path.read_bytes()))
    return {"status": "guard_passed", "publication_completed": False}
