#!/usr/bin/env python3
"""Pure-data DentCast publication-state compiler for GitHub-connected agents.

No shell, local checkout, network, Git credential, or file-system operation.
The canonical validators / 52-step plan / v3 wire renderer are IMPORTED, not
rewritten. Caller must obtain real source/content/approval evidence and use
GitHub Git-Data tools separately. This module NEVER executes publication steps.
"""
import copy
import hashlib
import json
import re
from pathlib import PurePosixPath

import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import dentcast_connected_cut_gates as gates

SCHEMA = "connected-publish-state-v1"
REPO = "dentcast-hub/dentcast-hub.github.io"
HEXL = re.compile(r"^[0-9a-f]{40}(?:[0-9a-f]{24})?$")
HEX256 = re.compile(r"^[0-9a-f]{64}$")
SAFE_BRANCH = re.compile(r"^(?:refactor|content|publish|fix|feature)/[A-Za-z0-9][A-Za-z0-9._/-]*$")


def canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("ascii")


def digest(value):
    return hashlib.sha256(value).hexdigest()


def valid_branch(value):
    return (isinstance(value, str) and SAFE_BRANCH.fullmatch(value)
            and ".." not in value and "//" not in value and not value.endswith("/")
            and not value.endswith(".lock") and not value.endswith(".")
            and not value.startswith("main"))


def validate_session(session):
    h.require(isinstance(session, dict) and set(session) == {
        "schema", "identity", "state", "operations"}, "CONNECTED_STATE_FIELDS")
    h.require(session["schema"] == SCHEMA, "CONNECTED_SCHEMA")
    identity = session["identity"]
    h.require(isinstance(identity, dict) and set(identity) == {
        "repository", "branch", "base_head", "workflow_sources",
        "inputs_fingerprint"}, "CONNECTED_IDENTITY_FIELDS")
    h.require(identity["repository"] == REPO and valid_branch(identity["branch"])
              and isinstance(identity["base_head"], str)
              and HEXL.fullmatch(identity["base_head"]), "CONNECTED_REPOSITORY_REF")
    sources = identity["workflow_sources"]
    h.require(isinstance(sources, dict)
              and set(sources) == set(h.WORKFLOW_PATHS)
              and all(isinstance(v, str) and HEX256.fullmatch(v)
                      for v in sources.values()), "CONNECTED_FULL_WORKFLOW_SOURCES_REQUIRED")
    h.require(isinstance(identity["inputs_fingerprint"], str)
              and HEX256.fullmatch(identity["inputs_fingerprint"]), "INPUT_FINGERPRINT")
    state = session["state"]
    h.require(isinstance(state, dict) and set(state) == {
        "schema", "publication", "reconciliation"}, "CONNECTED_WIRE_FIELDS")
    h.require(state["schema"] == h.SCHEMA and state["reconciliation"] is None,
              "CONNECTED_REQUIRES_V3_WIRE")
    p = state["publication"]
    lc.require_plan(p)
    h.require(lc.fixed_delivery(p) and p["category"] != "paper-only",
              "CONNECTED_FIRST_CUT_PAGES_ONLY")
    h.require(p["content_id"] != "unassigned" and p["category"] != "pending",
              "CONNECTED_INTAKE_IDENTITY_REQUIRED")
    h.require(identity["inputs_fingerprint"] == digest(canonical(p["context"]["inputs"])),
              "CONNECTED_INPUT_REFERENCES_CHANGED")
    h.require(isinstance(session["operations"], list)
              and all(isinstance(x, dict) for x in session["operations"]),
              "CONNECTED_OPERATIONS_REQUIRED")
    # Progress may be reviewed, but it is never proof of a semantic action.
    return session


def cas(session):
    validate_session(session)
    return digest(canonical(session))


def start(*, content_id, category, target_paths, repository, branch,
          base_head, workflow_sources, inputs=(), approvals=(), decisions=(),
          pending_questions=()):
    h.require(repository == REPO and valid_branch(branch)
              and isinstance(base_head, str) and HEXL.fullmatch(base_head),
              "CONNECTED_REPOSITORY_REF")
    h.require(isinstance(workflow_sources, dict) and
              set(workflow_sources) == set(h.WORKFLOW_PATHS), "CONNECTED_WORKFLOW_FINGERPRINTS")
    for path in target_paths:
        h.relative_path(path)
    h.require(bool(target_paths) and
              len(target_paths) == len(set(target_paths)),
              "CONNECTED_TARGET_REQUIRED")
    h.require(isinstance(content_id, str) and content_id.strip()
              and content_id not in ("unassigned",), "CONNECTED_ID_REQUIRED")
    p = {
        "content_id": content_id, "category": category,
        "target_paths": sorted(target_paths), "status": "in_progress",
        "blocker": None,
        "context": {"inputs": list(inputs),
                    "decisions": [{"kind": lc.DELIVERY_POLICY}] + list(decisions),
                    "approvals": list(approvals),
                    "pending_questions": list(pending_questions),
                    "validation": [], "delivery": [], "unrelated_changes": []},
        "steps": lc.plan(), "external_actions": []
    }
    obj = {
        "schema": SCHEMA,
        "identity": {"repository": repository, "branch": branch,
                     "base_head": base_head,
                     "workflow_sources": dict(workflow_sources),
                     "inputs_fingerprint": digest(canonical(p["context"]["inputs"]))},
        "state": {"schema": h.SCHEMA, "publication": p, "reconciliation": None},
        "operations": []}
    return validate_session(obj)


def update_step(session, expected_digest, sid, status, *, evidence=(), reason=None):
    validate_session(session)
    h.require(expected_digest == cas(session), "STALE_CONNECTED_STATE")
    before = session["state"]["publication"]
    h.require(lc.delivery_boundary(before) is None,
              "CUT_DELIVERY_REQUIRED_NO_AUTOMATIC_AGENT_STOP")
    h.require(sid == h.next_step(before), "NOT_NEXT_CANONICAL_STEP")
    h.require(status in ("started", "completed", "skipped", "blocked", "failed"),
              "CONNECTED_STATUS_INVALID")
    h.require(sid not in ("F", "G") and
              before["steps"].index(next(x for x in before["steps"] if x["id"] == sid))
              <= before["steps"].index(next(x for x in before["steps"] if x["id"] == "C.4.9")),
              "CONNECTED_ONLY_BEFORE_FIRST_CUT")
    h.require(isinstance(evidence, (tuple, list))
              and all(h.nonempty(x) for x in evidence), "CONNECTED_EVIDENCE_INVALID")
    row = next(x for x in before["steps"] if x["id"] == sid)
    if status == "started":
        h.require(row["status"] == "pending" and not evidence and reason is None,
                  "CONNECTED_START_REQUIRES_PENDING")
    elif status == "completed":
        h.require(row["status"] == "started" and bool(evidence) and reason is None,
                  "CONNECTED_COMPLETION_REQUIRES_STARTED_AND_EVIDENCE")
    elif status == "skipped":
        h.require(row["status"] == "pending" and sid not in ("rules", "0")
                  and h.nonempty(reason), "CONNECTED_SKIP_REQUIRES_CANONICAL_REASON")
    else:
        h.require(row["status"] in ("pending", "started") and h.nonempty(reason),
                  "CONNECTED_BLOCK_REQUIRES_REASON")
    h.require(not any(a["status"] in ("started", "outcome_unknown")
                      for a in before["external_actions"]),
              "EXTERNAL_ACTION_OUTCOME_UNKNOWN")
    updated = copy.deepcopy(session)
    p = updated["state"]["publication"]
    next(x for x in p["steps"] if x["id"] == sid).update(
        status=status, evidence=list(evidence), reason=reason)
    p["status"] = "blocked" if status in ("blocked", "failed") else "in_progress"
    p["blocker"] = f"{sid}: {reason}" if p["status"] == "blocked" else None
    lc.require_plan(p)
    # Same canonical transition rules as the local helper; no Git read is
    # needed before cut 1, which is guarded by the immutable identity.
    lc.guard_step_transition({"publication": before}, p)
    updated["operations"].append({"kind": "step", "id": sid, "status": status,
                                  "evidence": list(evidence), "reason": reason})
    validate_session(updated)
    return updated


def enroll_target(session, expected_digest, path, evidence_ref):
    h.require(cas(session) == expected_digest, "STALE_CONNECTED_STATE")
    h.relative_path(path)
    h.require(path != h.STATE_PATH and h.nonempty(evidence_ref),
              "CONNECTED_PATH_REVIEW_REQUIRED")
    h.require(lc.delivery_boundary(session["state"]["publication"]) is None,
              "CUT_DELIVERY_REQUIRED")
    new = copy.deepcopy(session)
    p = new["state"]["publication"]
    h.require(path not in p["target_paths"], "DUPLICATE_TARGET")
    p["target_paths"] = sorted(p["target_paths"] + [path])
    new["operations"].append({"kind": "reviewed_target", "path": path,
                              "evidence": evidence_ref})
    return validate_session(new)


def update_context(session, expected_digest, *, context, external_actions,
                   review_note):
    h.require(cas(session) == expected_digest, "STALE_CONNECTED_STATE")
    h.require(h.nonempty(review_note), "CONTEXT_CHANGE_REVIEW_REQUIRED")
    before = session["state"]["publication"]
    if lc.delivery_boundary(before) is not None:
        # Repair only external-action receipts at the cut; never advance it or
        # use reconciliation to change approvals, inputs or other decisions.
        def without_receipts(value):
            result = copy.deepcopy(value)
            result["decisions"] = [d for d in result["decisions"]
                                   if not isinstance(d, dict)
                                   or d.get("kind") != h.EXTERNAL_RECONCILIATION]
            return result
        resolved = h.reconciled_external_failures(before)
        retry_targets = {a["target"] for a in before["external_actions"]
                         if a["status"] == "failed" and a["id"] not in resolved}
        old_ids = {a["id"] for a in before["external_actions"]}
        h.require(all(a["id"] in old_ids or a["target"] in retry_targets
                      for a in external_actions), "CUT_EXTERNAL_RECOVERY_ONLY")
        h.require(without_receipts(context) == without_receipts(before["context"])
                  and any(a["status"] in ("failed", "started", "outcome_unknown")
                          for a in before["external_actions"]),
                  "CUT_DELIVERY_REQUIRED")
    new = copy.deepcopy(session)
    p = new["state"]["publication"]
    p["context"] = copy.deepcopy(context)
    p["external_actions"] = copy.deepcopy(external_actions)
    h.validate_publication(p)
    # Existing decisions, approvals, validated external actions and input
    # references cannot silently disappear or mutate.
    h.require(lc.fixed_delivery(p), "DELIVERY_POLICY_CANNOT_BE_DROPPED")
    h.require(before["context"]["inputs"] == p["context"]["inputs"],
              "INPUT_CHANGED_INVALIDATE_AND_REINITIALIZE")
    h.require(not h.preserve_actions(before, p) or h.nonempty(review_note),
              "EXTERNAL_OUTCOME_REVIEW_REQUIRED")
    old_approvals = {x["scope"]: x for x in before["context"]["approvals"]}
    new_approvals = {x["scope"]: x for x in p["context"]["approvals"]}
    h.require(set(old_approvals) <= set(new_approvals),
              "APPROVAL_HISTORY_CANNOT_BE_DROPPED")
    h.require(not any(o["status"] in ("confirmed", "rejected", "not_required")
                      and o != new_approvals[k] for k, o in old_approvals.items()),
              "APPROVAL_DECISION_REWRITTEN")
    h.require(all(x in p["context"]["decisions"] for x in before["context"]["decisions"]),
              "DECISION_HISTORY_CANNOT_BE_DROPPED")
    new["operations"].append({"kind": "context_reconciliation",
                              "review_note": review_note})
    return validate_session(new)


def validate_real_bytes(publication, targets):
    """Structural page/media guard; not evidence of semantic correctness."""
    page = publication["content_id"] + ".html"
    h.require(page in targets and b"<html" in targets[page].lower(),
              "ACTUAL_PAGE_HTML_REQUIRED")
    for path, data in targets.items():
        h.relative_path(path)
        h.require(bool(data), "EMPTY_TARGET_BYTES:" + path)
        if path.lower().endswith(".webp"):
            h.require(len(data) >= 20 and data[:4] == b"RIFF"
                      and data[8:12] == b"WEBP"
                      and int.from_bytes(data[4:8], "little") + 8 == len(data)
                      and data[12:16] in (b"VP8 ", b"VP8L", b"VP8X"),
                      "ACTUAL_WEBP_BYTES_REQUIRED:" + path)


def compile_cut1(session, expected_digest, *, observed_branch, observed_head,
                 observed_workflow_sources, actual_targets, baseline_verifier=None):
    """Materialize exact canonical v3 handoff only after observed source checks.

    actual_targets: repository-relative path => bytes from the real assets.
    This does not inspect Git or send any data to GitHub.
    """
    h.require(cas(session) == expected_digest, "STALE_CONNECTED_STATE")
    identity = session["identity"]
    h.require(observed_branch == identity["branch"]
              and observed_head == identity["base_head"]
              and observed_workflow_sources == identity["workflow_sources"],
              "CONNECTED_SOURCES_OR_HEAD_CHANGED")
    p = session["state"]["publication"]
    h.require(lc.delivery_boundary(p) == 1 and
              p["status"] == "in_progress" and not p["blocker"],
              "CANONICAL_FIRST_CUT_NOT_READY")
    h.require(not p["context"]["pending_questions"],
              "UNRESOLVED_QUESTIONS_BEFORE_CUT")
    h.require(all(a["status"] in ("confirmed", "not_required")
                  for a in p["context"]["approvals"]),
              "FIRST_CUT_UNRESOLVED_APPROVAL")
    h.require_external_outcomes(p, "EXTERNAL_OUTCOME_NOT_RESOLVED")
    gates.validate_declarations(p)
    h.require(isinstance(actual_targets, dict)
              and set(p["target_paths"]) <= set(actual_targets)
              and all(isinstance(b, bytes) for b in actual_targets.values()),
              "ALL_DECLARED_TARGET_BYTES_REQUIRED")
    h.require(set(actual_targets) == set(p["target_paths"]),
              "UNREVIEWED_FILE_SCOPE")
    validate_real_bytes(p, actual_targets)
    gates.validate_media(actual_targets, baseline_verifier)
    # The shared renderer encodes v3 exactly as the local CLI does.
    wire = h.render(session["state"]).encode("utf-8")
    projected, handoff_sha = h.parse_state(wire)
    h.require(projected["publication"] == p
              and handoff_sha == digest(wire), "CANONICAL_WIRE_ROUNDTRIP_FAILED")
    return {"handoff_bytes": wire, "sha256": handoff_sha,
            "next_step": h.next_step(p), "scope": sorted(p["target_paths"]),
            "target_sha256": {path: digest(value)
                              for path, value in actual_targets.items()},
            "base_head": identity["base_head"],
            "branch": identity["branch"], "repository": identity["repository"],
            "publication_completed": False}


def receive_cut1(raw_handoff, *, branch, sha_by_path, target_bytes,
                 baseline_verifier=None):
    """Fresh-agent pure byte validation. Remote HEAD and blob relationships
    must ALSO be independently confirmed by the connector delivery adapter.
    """
    state, handoff_sha = h.parse_state(raw_handoff)
    h.require(state["schema"] == h.SCHEMA, "RECEIVED_WIRE_NOT_V3")
    p = state["publication"]
    lc.require_plan(p)
    h.require(lc.delivery_boundary(p) == 1, "RECEIVED_WRONG_CUT")
    h.require(p["status"] == "in_progress" and p["blocker"] is None,
              "RECEIVED_PUBLICATION_BLOCKED")
    h.require_external_outcomes(p, "RECEIVED_EXTERNAL_OUTCOME_UNRESOLVED")
    h.require(not p["context"]["pending_questions"],
              "RECEIVED_PENDING_QUESTIONS")
    h.require(all(a["status"] in ("confirmed", "not_required")
                  for a in p["context"]["approvals"]),
              "RECEIVED_UNRESOLVED_APPROVAL")
    gates.validate_declarations(p)
    h.require(set(p["target_paths"]) == set(target_bytes),
              "RECEIVED_TARGETS_MISSING")
    h.require(all(isinstance(target_bytes[k], bytes)
                  and digest(target_bytes[k]) == sha_by_path.get(k)
                  for k in target_bytes), "RECEIVED_TARGET_BYTES_MISMATCH")
    validate_real_bytes(p, target_bytes)
    gates.validate_media(target_bytes, baseline_verifier)
    h.require(valid_branch(branch), "RECEIVED_FEATURE_BRANCH_REQUIRED")
    return {"status": "cut1_wire_and_bytes_verified", "handoff_sha256": handoff_sha,
            "next_step": h.next_step(p),
            "content_id": p["content_id"],
            "category": p["category"],
            "publication_completed": False}
