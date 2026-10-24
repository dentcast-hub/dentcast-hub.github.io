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
    current = h.current_snapshot(root, state, check_remote=True)
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


DELIVERY_POLICY = "fixed_three_deliveries_v1"  # legacy/in-flight source of truth
DELIVERY_POLICY_V2 = "fixed_three_deliveries_v2"  # authoring before second cut
DELIVERY_CUTS = ("C.4.9", "C.4.13")
DELIVERY_CUTS_V2 = ("C.4.9", "C.6")
EDITORIAL_SCOPES = frozenset((
    "scientific", "challenge", "taxonomy", "links", "hashtags",
    "content_record", "pathways", "pulse", "english", "author_approvals"
))
PHASE_F_EXPECTATION_SCOPES = frozenset(("title", "caption"))


def editorial_cut_v2(publication):
    return publication["category"] != "paper-only" and any(
        isinstance(d, dict) and d.get("kind") == DELIVERY_POLICY_V2
        for d in publication["context"]["decisions"])


def editorial_cut_receipt(publication, root=None):
    """Check the recorded pre-Push-2 scope inventory, not the truth of claims."""
    entries = [d for d in publication["context"]["decisions"]
               if isinstance(d, dict) and d.get("kind") == "second_cut_editorial_lock_v1"]
    h.require(len(entries) == 1, "SECOND_CUT_EDITORIAL_LOCK_REQUIRED")
    entry = entries[0]
    h.require(set(entry) == {"kind", "scopes", "english", "evidence"}
              and isinstance(entry["evidence"], list)
              and entry["evidence"] and all(h.nonempty(x) for x in entry["evidence"]),
              "SECOND_CUT_EDITORIAL_LOCK_FIELDS")
    scopes = entry["scopes"]
    h.require(isinstance(scopes, list) and len(scopes) == len(EDITORIAL_SCOPES),
              "SECOND_CUT_EDITORIAL_SCOPES_REQUIRED")
    seen = set()
    for row in scopes:
        h.require(isinstance(row, dict) and set(row) == {"scope", "status", "evidence"}
                  and row["scope"] in EDITORIAL_SCOPES and row["scope"] not in seen
                  and row["status"] in ("resolved", "not_applicable")
                  and isinstance(row["evidence"], list) and bool(row["evidence"])
                  and all(h.nonempty(x) for x in row["evidence"]),
                  "SECOND_CUT_EDITORIAL_SCOPE_INVALID")
        seen.add(row["scope"])
    h.require(seen == EDITORIAL_SCOPES, "SECOND_CUT_EDITORIAL_SCOPES_REQUIRED")
    eng = entry["english"]
    h.require(isinstance(eng, dict) and set(eng) == {"status", "path", "evidence"}
              and eng["status"] in ("ready", "exempt")
              and isinstance(eng["evidence"], list) and bool(eng["evidence"])
              and all(h.nonempty(x) for x in eng["evidence"]),
              "SECOND_CUT_ENGLISH_INVALID")
    challenge = next(x for x in publication["steps"] if x["id"] == "C.4.14")
    exempt = publication["category"] == "litecast" or challenge["status"] == "completed"
    if exempt:
        h.require(eng["status"] == "exempt" and eng["path"] is None,
                  "SECOND_CUT_ENGLISH_EXCEPTION_REQUIRED")
    else:
        parts = publication["content_id"].rsplit("/", 1)
        h.require(len(parts) == 2, "SECOND_CUT_ENGLISH_ID_INVALID")
        path = parts[0] + "/en/" + parts[1] + ".html"
        h.require(eng["status"] == "ready" and eng["path"] == path
                  and path in publication["target_paths"],
                  "SECOND_CUT_ENGLISH_MIRROR_MISSING")
        if root is not None:
            h.require(h.file_info(root, path)["kind"] == "file",
                      "SECOND_CUT_ENGLISH_FILE_NOT_ON_DISK")
    h.require(not publication["context"]["pending_questions"]
              and all(a["status"] in ("confirmed", "not_required")
                      for a in publication["context"]["approvals"]),
              "SECOND_CUT_JUDGMENTS_UNRESOLVED")
    approvals = {a["scope"]: a for a in publication["context"]["approvals"]}
    h.require(PHASE_F_EXPECTATION_SCOPES <= set(approvals)
              and all(approvals[s]["status"] in ("confirmed", "not_required")
                      for s in PHASE_F_EXPECTATION_SCOPES),
              "SECOND_CUT_PHASE_F_EXPECTATIONS_REQUIRED")
    h.require(any(approvals[s]["status"] == "confirmed"
                  for s in PHASE_F_EXPECTATION_SCOPES),
              "SECOND_CUT_PHASE_F_TEXT_REQUIRED")
    return entry



def fixed_delivery(publication):
    return publication["category"] != "paper-only" and any(
        isinstance(d, dict) and d.get("kind") in (DELIVERY_POLICY, DELIVERY_POLICY_V2)
        for d in publication["context"]["decisions"])


def delivery_boundary(publication):
    """Only resolved prefixes followed by pending steps are deliverable cuts."""
    rows = publication["steps"]
    cuts = DELIVERY_CUTS_V2 if editorial_cut_v2(publication) else DELIVERY_CUTS
    for number, sid in enumerate(cuts, 1):
        index = next((i for i, row in enumerate(rows) if row["id"] == sid), None)
        if index is not None and all(r["status"] in ("completed", "skipped") for r in rows[:index+1]) and all(
                r["status"] == "pending" for r in rows[index+1:]):
            return number
    return None


def require_fixed_cut_readiness(publication, root=None):
    """Fail closed at every fixed delivery, including local Git/CI without hooks.

    Existing human approval rules are not inferred from an empty approval list:
    first-cut lead provenance must be declared explicitly. The connected-only
    scope audit is deliberately not imposed on the canonical local workflow.
    """
    h.require(publication["status"] == "in_progress" and not publication["blocker"],
              "DELIVERY_PUBLICATION_BLOCKED")
    h.require(not publication["context"]["pending_questions"],
              "DELIVERY_PENDING_QUESTIONS")
    h.require(all(a["status"] in ("confirmed", "not_required")
                  for a in publication["context"]["approvals"]),
              "DELIVERY_UNRESOLVED_APPROVAL")
    # Optional adapter is imported only at the cut: standalone legacy checkout
    # fixtures that do not contain the connected adapter remain importable.
    from dentcast_connected_cut_gates import validate_lead_provenance
    validate_lead_provenance(publication)
    if editorial_cut_v2(publication):
        c6 = next(s for s in publication["steps"] if s["id"] == "C.6")
        if c6["status"] in ("completed", "skipped"):
            editorial_cut_receipt(publication, root)


def committed_boundary(root, revision):
    raw = h.git(root, "show", revision + ":" + h.STATE_PATH, optional=True)
    if raw is None:
        return None, None
    state, _ = h.parse_state(raw)
    require_plan(state["publication"])
    return delivery_boundary(state["publication"]), state["publication"]


def require_delivery_parent(root, publication, number, revision="HEAD"):
    boundary, previous = committed_boundary(root, revision)
    if number == 1:
        h.require(previous is None, "FIRST_DELIVERY_REQUIRES_NO_ACTIVE_REMOTE_HANDOFF")
    else:
        facts = {"boundary": boundary, "expected_boundary": number-1,
                 "parent_fixed": previous is not None and fixed_delivery(previous),
                 "parent_v2": previous is not None and editorial_cut_v2(previous),
                 "current_v2": editorial_cut_v2(publication),
                 "content_match": previous is not None and previous["content_id"] == publication["content_id"]}
        h.require(facts["boundary"] == facts["expected_boundary"] and facts["parent_fixed"]
                  and facts["parent_v2"] == facts["current_v2"] and facts["content_match"],
                  "FIXED_DELIVERY_ORDER_REQUIRED:" + json.dumps(facts, sort_keys=True))


def completion_path(publication):
    name = h.relative_path(publication["content_id"])
    return ".dentcast/publication-reports/" + name + ".completion.json"


def final_files_match(root, state):
    current = h.current_snapshot(root, state)
    h.require(all(current[k] == state["snapshot"][k] for k in ("repository", "branch")),
              "WRONG_CLEANUP_CHECKOUT")
    for name, info in state["snapshot"]["files"].items():
        actual = h.file_info(root, name)
        h.require(all(actual[k] == info[k] for k in actual), "WORK_CHANGED_AFTER_CLEANUP:" + name)
    h.require(current["workflow"] == state["snapshot"]["workflow"], "WORKFLOW_CHANGED_AFTER_CLEANUP")
    return current


def validate_final_receipt(root, data, commit=None):
    """Completed-only audit receipt, never an active recovery handoff."""
    h.require(data.get("schema") == "publish-completion-v1", "INVALID_FINAL_DELIVERY_RECEIPT")
    state = data["state"]
    publication = state["publication"]
    require_plan(publication)
    if fixed_delivery(publication):
        require_fixed_cut_readiness(publication, root)
    h.require(fixed_delivery(publication) and h.next_step(publication) is None
              and not publication["blocker"] and not publication["context"]["pending_questions"]
              and all(a["status"] in ("confirmed", "not_required") for a in publication["context"]["approvals"]),
              "INCOMPLETE_FINAL_DELIVERY_RECEIPT")
    h.require_external_outcomes(publication, "INCOMPLETE_FINAL_DELIVERY_RECEIPT")
    h.require(bool(publication["context"]["delivery"]) and all(
        isinstance(d, dict) and h.nonempty(d.get("scope")) and isinstance(d.get("evidence"), list)
        and d["evidence"] and all(h.nonempty(e) for e in d["evidence"])
        for d in publication["context"]["delivery"]), "DELIVERY_EVIDENCE_REQUIRED")
    h.require(set(publication["target_paths"]) <= set(state["snapshot"]["files"])
              and set(state["snapshot"]["workflow"]) == set(h.WORKFLOW_PATHS), "INCOMPLETE_FINAL_FINGERPRINTS")
    second = data["second_delivery_commit"]
    h.require(bool(re.fullmatch(r"[0-9a-f]{40}", second)), "INVALID_DELIVERY_COMMIT")
    require_delivery_parent(root, publication, 3, second)
    first = h.text_git(root, "rev-parse", second + "^")
    require_delivery_parent(root, publication, 2, first)
    require_delivery_parent(root, publication, 1, first + "^")
    if commit:
        raw = h.git(root, "show", commit + ":" + completion_path(publication), optional=True)
        h.require(raw is not None and h.decode_json(raw.decode("utf-8")) == data, "FINAL_RECEIPT_NOT_IN_DELIVERY_COMMIT")
        h.require(h.text_git(root, "rev-parse", commit + "^") == second, "EXTRA_DELIVERY_COMMIT_FORBIDDEN")
        h.require(h.git(root, "show", commit + ":" + h.STATE_PATH, optional=True) is None,
                  "FINAL_HANDOFF_MUST_NOT_BE_PUSHED")
        changed = set(h.text_git(root, "diff", "--name-only", second, commit).splitlines())
        h.require(changed <= set(state["snapshot"]["files"]) | {h.STATE_PATH, completion_path(publication)},
                  "UNRELATED_FINAL_DELIVERY_PATH")
    for name, info in state["snapshot"]["files"].items():
        actual = h.file_info(root, name)
        h.require(all(actual[k] == info[k] for k in actual), "FINAL_RECEIPT_FILE_MISMATCH:" + name)
    for name, sha in state["snapshot"]["workflow"].items():
        h.require(h.file_info(root, name)["sha256"] == sha, "FINAL_RECEIPT_WORKFLOW_MISMATCH:" + name)
    receipts = [r for r in publication["context"]["validation"] if isinstance(r, dict) and r.get("kind") == "phase_f"]
    h.require(bool(receipts) and receipts[-1].get("exit_code") == 0, "MECHANICAL_GATE_RECEIPT_REQUIRED")
    last = receipts[-1]
    result = gate(root, publication, last.get("expected_title"), last.get("expected_caption"))
    h.require(result["exit_code"] == 0, "FINAL_DELIVERY_VERIFICATION_FAILED")
    return publication["content_id"]


def guard_step_transition(state, publication, root=None):
    if fixed_delivery(state["publication"]):
        h.require(fixed_delivery(publication), "DELIVERY_POLICY_CANNOT_BE_DROPPED")
        h.require(editorial_cut_v2(state["publication"]) == editorial_cut_v2(publication),
                  "DELIVERY_POLICY_VERSION_CANNOT_CHANGE")
        if editorial_cut_v2(state["publication"]):
            old_c6 = next(s for s in state["publication"]["steps"] if s["id"] == "C.6")
            new_c6 = next(s for s in publication["steps"] if s["id"] == "C.6")
            if old_c6["status"] in ("completed", "skipped") and new_c6["status"] in ("completed", "skipped"):
                old_lock = [d for d in state["publication"]["context"]["decisions"]
                            if isinstance(d, dict) and d.get("kind") == "second_cut_editorial_lock_v1"]
                new_lock = [d for d in publication["context"]["decisions"]
                            if isinstance(d, dict) and d.get("kind") == "second_cut_editorial_lock_v1"]
                h.require(old_lock == new_lock, "SECOND_CUT_EDITORIAL_LOCK_CHANGED")
                h.require(state["publication"]["context"]["approvals"] ==
                          publication["context"]["approvals"],
                          "POST_CUT_EDITORIAL_APPROVAL_CHANGED")

    old = {s['id']: s for s in state['publication']['steps']}
    h.require(all(s['id'] in old or s['status'] == 'pending' for s in publication['steps']),
              'NEW_SUBSTEPS_MUST_START_PENDING')
    # Preserve one semantic checkpoint per step; delivery cuts are independent.
    entered = [s for s in publication['steps'] if s['id'] in old
               and old[s['id']]['status'] not in ('started', 'completed', 'skipped')
               and s['status'] in ('started', 'completed', 'skipped')]
    h.require(len(entered) <= 1, 'ONE_STEP_PER_CHECKPOINT_REQUIRED')
    for row in entered:
        h.require(not any(a['status'] in ('started', 'outcome_unknown') for a in publication['external_actions']),
                  'EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY')
        h.require(row['id'] == h.next_step(state['publication']),
                  'START_NEXT_STEP_IN_SEPARATE_CHECKPOINT')
        if fixed_delivery(state["publication"]) and delivery_boundary(state["publication"]):
            h.require(root is not None, "DELIVERY_CHECK_REQUIRES_CHECKOUT")
            require_step_delivery(root, state, h.digest(h.render(state).encode()))


@h.baseline_read_session
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
    h.require(row["status"] != status or row["evidence"] != evidence or row["reason"] != reason,
              "NO_STEP_STATE_CHANGE: do not repeat this transition; perform or diagnose the current action first")
    row.update(status=status, evidence=evidence, reason=reason)
    p["status"] = "blocked" if status in ("blocked", "failed") else "in_progress"
    p["blocker"] = f"{sid}: {reason}" if p["status"] == "blocked" else None
    require_plan(p)
    return h.save(root, p, expected=expected, note=note)


@h.baseline_read_session
def invalidate(root, expected, from_step, note):
    state = state_for_update(root, expected)
    p = h.invalidate_publication(state['publication'], from_step, note)
    h.refresh_local_inputs(root, p)
    require_plan(p)
    return h.save(root, p, expected=expected, note=note)


@h.baseline_read_session
def advance(root, expected, sid=None, evidence=None, skips=(), start_next=False, note=None):
    """Reduce CLI round trips while preserving a durable write per transition.

    This records operator-verified results, never performs semantic actions.
    Preflight the complete requested sequence before writing any checkpoint.
    """
    state = state_for_update(root, expected)
    p = copy.deepcopy(state["publication"])
    operations = []
    if sid is not None:
        h.require(sid == h.next_step(p), "NOT_NEXT_CANONICAL_STEP")
        row = next(s for s in p["steps"] if s["id"] == sid)
        h.require(sid != "F", "USE_REAL_VERIFY_FOR_PHASE_F")
        h.require(row["status"] == "started", "STEP_MUST_BE_STARTED_FIRST")
        row.update(status="completed", evidence=evidence or [], reason=None)
        operations.append((sid, "completed", evidence or [], None))
        require_plan(p)
    for skip_id, reason in skips:
        h.require(skip_id == h.next_step(p), "NOT_NEXT_CANONICAL_STEP")
        row = next(s for s in p["steps"] if s["id"] == skip_id)
        h.require(row["status"] == "pending", "ONLY_PENDING_STEPS_CAN_BE_BATCH_SKIPPED")
        row.update(status="skipped", evidence=[], reason=reason)
        operations.append((skip_id, "skipped", [], reason))
        require_plan(p)
    if start_next and h.next_step(p) is not None:
        next_id = h.next_step(p)
        row = next(s for s in p["steps"] if s["id"] == next_id)
        h.require(row["status"] == "pending", "NEXT_STEP_NOT_PENDING")
        row.update(status="started", evidence=[], reason=None)
        operations.append((next_id, "started", [], None))
        require_plan(p)
    h.require(bool(operations), "NO_CHECKPOINT_TRANSITIONS_REQUESTED")
    h.require(not any(a["status"] in ("started", "outcome_unknown") for a in p["external_actions"]),
              "EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY")
    for op_id, _, _, _ in operations:
        h.require(op_id in GROUPS[0]+GROUPS[1] or
                  (p["content_id"] != "unassigned" and p["category"] != "pending"),
                  "BIND_INTAKE_IDENTITY_BEFORE_AUTHORING")
    written = []
    result = {"sha256": expected, "publication_completed": False}
    # The full plan was preflighted above. Keep a transition-only prefix in
    # memory: every step() independently reloads the canonical state, checks
    # the expected digest and persists a fresh snapshot through h.save().
    # Reloading it *again* before every step adds no safety. Only a fixed
    # delivery boundary needs a fresh read for the remote/byte guard.
    live_prefix = copy.deepcopy(state["publication"])
    try:
        for op_id, status, refs, reason in operations:
            cut = delivery_boundary(live_prefix) if fixed_delivery(live_prefix) else None
            try:
                # save -> guard_step_transition verifies this boundary once,
                # under the writer lock, against freshly observed remote bytes.
                result = step(root, result["sha256"], op_id, status, refs, reason, note)
            except h.Blocked as exc:
                if cut and str(exc).startswith(('PREVIOUS_STEP_', 'DELIVERED_STEP_')):
                    return {**result, "status": "delivery_required", "delivery": cut,
                            "error": str(exc), "transitions_written": written,
                            "next_action": "Commit/push this fixed delivery before advancing"}
                raise
            # Update only AFTER the durable canonical step succeeded.
            next(row for row in live_prefix["steps"] if row["id"] == op_id)["status"] = status
            written.append({"id": op_id, "status": status})
    except (h.Blocked, OSError) as exc:
        # Never undo a saved checkpoint or replay an action. A concurrent write
        # may have superseded this digest; the normal CAS guard will reject it.
        return {**result, "status": "blocked", "error": str(exc),
                "transitions_written": written, "publication_completed": False}
    return {**result, "transitions_written": written, "publication_completed": False}


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
        h.require(not h.differences(root, state, h.current_snapshot(root, state)), "WORK_CHANGED_BEFORE_BIND")
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
    current = h.current_snapshot(root, state)
    h.require(not h.differences(root, state, current), "RECORD_CURRENT_WORK_BEFORE_VERIFICATION")
    view = h.inspect(root)
    allowed = {"UNFINISHED_STEP_NEEDS_RECONCILIATION", "RECORDED_BLOCKER"}
    h.require(not (set(view["issues"]) - allowed), "UNRESOLVED_PUBLICATION_GATES")
    receipt = gate(root, p, expect_title, expect_caption, catalog_id)
    after = h.current_snapshot(root, state)
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
        current = h.current_snapshot(root, state, check_remote=True)
        h.require(not h.differences(root, state, current), "CHECKPOINT_STALE:" + json.dumps(h.change_details(state, current), sort_keys=True) + "; review these changes in the current run, reconcile and rerun affected verification; no branch discovery")
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
        fixed = fixed_delivery(p)
        if fixed:
            require_delivery_parent(root, p, 3)
        else:
            remote_state = h.git(root, "show", remote["head"] + ":" + h.STATE_PATH, optional=True)
            h.require(remote_state is not None and h.digest(remote_state) == expected, "HANDOFF_MUST_BE_DELIVERED_FIRST")
        h.require(fixed or all(f["status"] is None and f["kind"] != "missing" and bool(f["index"])
                      and all(e["stage"] == 0 for e in f["index"]) for f in current["files"].values()),
                  "WORK_NOT_CLEAN_AND_AVAILABLE")
        receipts = [r for r in p["context"]["validation"] if isinstance(r, dict) and r.get("kind") in ("phase_f", "paper_catalog_gate")]
        h.require(bool(receipts) and receipts[-1].get("exit_code") == 0, "MECHANICAL_GATE_RECEIPT_REQUIRED")
        last = receipts[-1]
        receipt = gate(root, p, last.get("expected_title"), last.get("expected_caption"), last.get("catalog_id"))
        if receipt["exit_code"] != 0:
            return {"status": "blocked", "error": "FINAL_MECHANICAL_GATE_FAILED_HANDOFF_RETAINED",
                    "publication_completed": False, "verification": receipt}
        after = h.current_snapshot(root, state)
        h.require(not h.differences(root, {"snapshot": current}, after), "WORK_CHANGED_DURING_COMPLETION")
        h.require(h.load_state(root)[1] == expected, "HANDOFF_CHANGED_DURING_COMPLETION")
        data = {"schema": "publish-cleanup-v1", "state": state, "state_sha256": expected,
                "prepared_at": h.now(), "gate": receipt}
        if fixed:
            report = completion_path(p)
            h.require(not h.safe_path(root, report).exists(), "COMPLETION_RECEIPT_ALREADY_EXISTS")
            # Public audit evidence excludes the private mutable Git/index observation.
            audit = {"publication": p, "snapshot": {
                "files": {name: {k: info[k] for k in ("kind", "sha256", "executable")}
                          for name, info in state["snapshot"]["files"].items()},
                "workflow": state["snapshot"]["workflow"]}}
            final = {"schema": "publish-completion-v1", "state": audit,
                     "second_delivery_commit": current["head"],
                     "verification": {k: v for k, v in receipt.items() if k != "output"}}
            validate_final_receipt(root, final)
            data.update(completion_path=report, completion=final)
        store_cleanup(root, data)
        if fixed:
            report_path = h.safe_path(root, report)
            report_path.parent.mkdir(parents=True, exist_ok=True)
            from dentcast_text_io import write_text
            write_text(report_path, json.dumps(final, ensure_ascii=True, indent=2) + "\n")
        h.safe_path(root, h.STATE_PATH).unlink()
        if os.name != "nt":
            directory = os.open(h.safe_path(root, h.STATE_PATH).parent, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
        return {"status": "cleanup_pending_delivery", "publication_completed": False,
                "next_action": ("Commit/push final work, completion receipt and handoff deletion together as delivery 3; then confirm-cleanup"
                                if fixed else "Commit/push only the handoff deletion, then confirm-cleanup; restore-cleanup on failure"),
                "verification": receipt}


def confirm_cleanup(root):
    with h.locked(root):
        data = cleanup_record(root)
        h.require(not h.safe_path(root, h.STATE_PATH).exists(), "HANDOFF_STILL_EXISTS")
        state = data["state"]
        current = h.current_snapshot(root, state, check_remote=True)
        if fixed_delivery(state["publication"]):
            final_files_match(root, state)
            name = data["completion_path"]
            h.require(h.decode_json(h.safe_path(root, name).read_text()) == data["completion"], "COMPLETION_RECEIPT_CHANGED")
            h.require(not h.status_paths(root), "FINAL_DELIVERY_WORK_NOT_COMMITTED")
            validate_final_receipt(root, data["completion"], current["head"])
        else:
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
        if "completion" in data and h.text_git(root, "rev-parse", "HEAD") != data["completion"]["second_delivery_commit"]:
            validate_final_receipt(root, data["completion"], "HEAD")
            return {"status": "final_delivery_pending", "publication_completed": False,
                    "next_action": "Final commit already prepared; retry the same push and confirm-cleanup, without another commit"}
        if h.safe_path(root, h.STATE_PATH).exists():
            h.require(h.load_state(root)[1] == data["state_sha256"], "HANDOFF_CHANGED_DURING_INTERRUPTED_CLEANUP")
        state = data["state"]
        current = h.current_snapshot(root, state)
        h.require(all(state["snapshot"][k] == current[k] for k in ("repository", "branch")), "WRONG_CLEANUP_CHECKOUT")
        if "completion_path" in data:
            report = h.safe_path(root, data["completion_path"])
            if report.exists():
                h.require(h.decode_json(report.read_text()) == data["completion"], "COMPLETION_RECEIPT_CHANGED")
                report.unlink()
        state["publication"].update(status="cleanup_pending", blocker="Cleanup delivery failed or was interrupted; reconcile before retry")
        state.update(generation=state["generation"]+1, updated_at=h.now(), previous_sha256=data["state_sha256"],
                     reconciliation={"note": "Restored checkpoint after interrupted cleanup", "observed_changes": ["CLEANUP_INTERRUPTED"]})
        sha = h.write_atomic(root, state)
        metadata_path(root).unlink()
        return {"status": "checkpoint_restored", "sha256": sha, "publication_completed": False}


def guard(root, phase):
    if phase == "pre-commit":
        h.require(not h.fastlocal_active(root),
                  "WAL_MUST_BE_MATERIALIZED_BEFORE_COMMIT")
    path = h.safe_path(root, h.STATE_PATH)
    if not path.exists():
        if pending(root):
            data = cleanup_record(root)
            h.require(phase != "stop", "CLEANUP_DELIVERY_PENDING")
            if phase == "pre-commit":
                staged = h.git(root, "diff", "--cached", "--name-only", "-z").split(b"\0")
                if fixed_delivery(data["state"]["publication"]):
                    allowed = set(data["state"]["snapshot"]["files"]) | {h.STATE_PATH, data["completion_path"]}
                    h.require(all(not p or p.decode() in allowed for p in staged), "UNRELATED_FINAL_DELIVERY_PATH")
                    final_files_match(root, data["state"])
                    dirty = h.status_paths(root)
                    h.require(set(dirty) <= allowed and all(v != "??" for v in dirty.values())
                              and not h.git(root, "diff", "--name-only"), "FINAL_DELIVERY_MUST_BE_FULLY_STAGED")
                    index = h.index_entries(root)
                    h.require(all(info["kind"] == "missing" or bool(index.get(name))
                                  for name, info in data["state"]["snapshot"]["files"].items()),
                              "FINAL_DELIVERY_REQUIRED_FILE_NOT_TRACKED")
                    h.require(h.decode_json(h.safe_path(root, data["completion_path"]).read_text()) == data["completion"],
                              "COMPLETION_RECEIPT_CHANGED")
                    h.require(h.git(root, "show", ":" + data["completion_path"], optional=True)
                              == h.safe_path(root, data["completion_path"]).read_bytes(), "STAGE_COMPLETION_RECEIPT")
                    validate_final_receipt(root, data["completion"])
                    h.require(h.git(root, "show", ":" + h.STATE_PATH, optional=True) is None, "STAGE_HANDOFF_DELETION")
                    return {"status": "guard_passed", "publication_completed": False}
                h.require(all(not p or p.decode() == h.STATE_PATH for p in staged), "CLEANUP_COMMIT_MUST_ONLY_DELETE_HANDOFF")
                h.require(h.git(root, "show", ":" + h.STATE_PATH, optional=True) is None, "STAGE_HANDOFF_DELETION")
                current = h.current_snapshot(root, data["state"])
                h.require(not h.differences(root, data["state"], current), "WORK_CHANGED_DURING_CLEANUP")
        elif phase == "ci":
            previous = h.git(root, "show", "HEAD^:" + h.STATE_PATH, optional=True)
            if previous is not None:
                if h.digest(previous) == 'a5f39e12507ac810c24a5f316322ae42c59011487f3eb0c842e3666c8e034c43':
                    from check_publish_merge_gate import reconcile_share35
                    if reconcile_share35(root, previous):
                        return {"status": "guard_passed", "publication_completed": False,
                                "reconciliation": "founder-confirmed legacy share-35 cleanup"}
                state, checkpoint_sha = h.parse_state(previous)
                if state['schema'] == h.SCHEMA:
                    state = h.hydrate_v3(root, state, checkpoint_sha)
                require_plan(state["publication"])
                p = state["publication"]
                if fixed_delivery(p):
                    final = h.decode_json(h.safe_path(root, completion_path(p)).read_text())
                    validate_final_receipt(root, final, "HEAD")
                    return {"status": "guard_passed", "publication_completed": False}
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
    if fixed_delivery(state["publication"]) and phase in ("pre-commit", "ci"):
        number = delivery_boundary(state["publication"])
        h.require(number is not None, "ONLY_THREE_FIXED_DELIVERIES_ALLOWED")
        require_fixed_cut_readiness(state["publication"], root)
        parent_revision = "HEAD^" if phase == "ci" else "HEAD"
        parent_boundary, parent = committed_boundary(root, parent_revision)
        already_delivered_second_cut = (
            number == 2 and parent_boundary == 2 and parent is not None
            and fixed_delivery(parent)
            and editorial_cut_v2(parent) == editorial_cut_v2(state["publication"])
            and parent["content_id"] == state["publication"]["content_id"])
        if not already_delivered_second_cut:
            require_delivery_parent(root, state["publication"], number, parent_revision)
    if phase == "ci":
        # CI is detached and the recorded index/status may predate the checkpoint commit.
        for p, info in state["snapshot"]["files"].items():
            actual = h.file_info(root, p)
            h.require(all(actual[k] == info[k] for k in actual), "COMMITTED_CHECKPOINT_FILE_MISMATCH:" + p)
        for p, sha in state["snapshot"]["workflow"].items():
            h.require(h.file_info(root, p)["sha256"] == sha, "COMMITTED_WORKFLOW_MISMATCH:" + p)
    else:
        current = h.current_snapshot(root, state)
        h.require(not h.differences(root, state, current), "CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP")
        if phase == "pre-commit":
            h.require(h.git(root, "show", ":" + h.STATE_PATH, optional=True) == path.read_bytes(),
                      "LATEST_HANDOFF_MUST_BE_STAGED")
        elif phase == 'stop' and (not fixed_delivery(state['publication']) or delivery_boundary(state['publication'])):
            if fixed_delivery(state['publication']):
                require_fixed_cut_readiness(state['publication'], root)
            require_step_delivery(root, state, h.digest(path.read_bytes()))
    return {"status": "guard_passed", "publication_completed": False}


def delivery_plan(root, base_ref, max_blob_bytes):
    """Read-only changed-object inventory, without payloads or credential probes."""
    h.require(max_blob_bytes > 0, "POSITIVE_BLOB_LIMIT_REQUIRED")
    h.require(not h.status_paths(root), "COMMIT_SCOPED_WORK_BEFORE_DELIVERY_PLAN")
    h.require(h.git(root, 'diff', '--name-only', '--', h.STATE_PATH) == b''
              and h.git(root, 'diff', '--cached', '--name-only', '--', h.STATE_PATH) == b'',
              'COMMIT_CURRENT_HANDOFF_BEFORE_DELIVERY_PLAN')
    state_path = h.safe_path(root, h.STATE_PATH)
    if state_path.exists():
        committed = h.git(root, 'show', 'HEAD:' + h.STATE_PATH, optional=True)
        h.require(committed == state_path.read_bytes(), 'COMMIT_CURRENT_HANDOFF_BEFORE_DELIVERY_PLAN')
    h.require(not base_ref.startswith('-'), "INVALID_BASE_REF")
    base = h.text_git(root, 'rev-parse', '--verify', base_ref + '^{commit}')
    head = h.text_git(root, 'rev-parse', 'HEAD')
    h.require(h.git(root, 'merge-base', '--is-ancestor', base, head, optional=True) is not None,
              'DELIVERY_BASE_NOT_ANCESTOR')
    names = h.git(root, 'diff', '--name-only', '--no-renames', '-z', base, head).split(b'\0')
    entries = []
    for raw in names:
        if not raw:
            continue
        name = h.relative_path(raw.decode('utf-8', 'surrogateescape'))
        listing = h.git(root, 'ls-tree', '-z', head, '--', name)
        if not listing:
            entries.append({'path': name, 'sha': None, 'size': 0})
            continue
        meta, _ = listing.rstrip(b'\0').split(b'\t', 1)
        mode, kind, oid = meta.decode('ascii').split()
        h.require(kind == 'blob', 'DELIVERY_UNSUPPORTED_OBJECT:' + name)
        size = int(h.text_git(root, 'cat-file', '-s', oid))
        # Git already hashes mode/path/object identity into HEAD's tree.
        entries.append({'path': name, 'mode': mode, 'type': kind, 'sha': oid, 'size': size,
                        'over_tool_limit': size > max_blob_bytes})
    return {'status': 'delivery_plan', 'base_sha': base, 'head_sha': head,
            'tree_sha': h.text_git(root, 'rev-parse', 'HEAD^{tree}'), 'entries': entries,
            'changed_bytes': sum(e['size'] for e in entries), 'max_blob_bytes': max_blob_bytes,
            'oversized_paths': [e['path'] for e in entries if e.get('over_tool_limit')],
            'push_access': 'unproven; connector permissions do not establish terminal Git access',
            'publication_completed': False}


def check_pr(repository, number, expected_head, expected_base, expected_branch, read=None):
    """Fresh exact-PR and ref checks. Never scans branches or changes any ref."""
    import dentcast_publish_discovery as discovery
    from urllib.parse import quote
    repo = discovery.repository_name(repository)
    h.require(number > 0 and expected_head and expected_base and expected_branch, 'PR_EXPECTATIONS_REQUIRED')
    read = read or discovery.GitHubReader()
    api = f'{discovery.API}/repos/{repo}'
    pr = read(f'{api}/pulls/{number}')
    h.require(pr.get('state') == 'open' and not pr.get('merged') and not pr.get('merged_at'),
              'PR_CLOSED_OR_MERGED: preserve local work; compare against current main and prepare a separate authorized delivery')
    h.require(pr['head']['repo']['full_name'] == repo and pr['base']['repo']['full_name'] == repo,
              'PR_REPOSITORY_CHANGED')
    h.require(pr['head']['ref'] == expected_branch and pr['head']['sha'] == expected_head,
              'PR_HEAD_CHANGED: review new head; do not overwrite or retry the old lease')
    h.require(pr['base']['sha'] == expected_base, 'PR_BASE_CHANGED: reconcile with current destination before delivery')
    for side in ('head', 'base'):
        ref = read(f"{api}/git/ref/heads/{quote(pr[side]['ref'], safe='')}")
        h.require(ref['object']['sha'] == pr[side]['sha'], 'PR_REF_CHANGED_DURING_CHECK')
    # Catch a merge/close while reading refs as well.
    after = read(f'{api}/pulls/{number}')
    h.require(after.get('state') == 'open' and not after.get('merged') and not after.get('merged_at')
              and after['head']['sha'] == expected_head and after['base']['sha'] == expected_base,
              'PR_CHANGED_DURING_CHECK')
    return {'status': 'delivery_target_checked', 'observed_at': h.now(), 'head_sha': expected_head,
            'base_sha': expected_base, 'branch': expected_branch,
            'next_action': 'Use expected SHA / non-force fast-forward immediately; recheck after long uploads and before updating ref or merge',
            'publication_completed': False}
