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
    required = PAPER_IDS if h.publication_category(publication) == "paper-only" else tuple(REGISTRY)
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


PULL_ADVICE = ("run `git pull --ff-only` (fast-forward only; never reset, force-push, "
               "confirm-cleanup or restore-cleanup for this), then rerun the guard")


def remote_delivery_ahead(root, state, current, expected):
    """Advice when origin moved past this checkout, e.g. post-cut2 Actions delivery 3.

    The Actions run pushes delivery 3 (receipt + handoff deletion) to the branch
    while the agent's checkout still holds the Push-2 handoff and no local
    cleanup record, so "push not confirmed"/confirm-cleanup advice is wrong.
    Read-only: inspects only objects already in this checkout; never fetches.
    """
    remote = current["remote"]
    if remote["status"] != "observed" or remote["head"] == current["head"]:
        return None
    head = remote["head"]
    if remote["ahead"] is None:
        return ("REMOTE_BRANCH_ADVANCED_NOT_FETCHED: origin/" + str(current["branch"]) + " is at " + head[:12]
                + ", not in this checkout (GitHub Actions delivery 3 after Push 2?); " + PULL_ADVICE)
    if remote["ahead"] != 0:
        return None
    publication = state["publication"]
    if h.git(root, "ls-tree", head, "--", h.STATE_PATH, optional=True) != b"":
        return None
    raw = h.git(root, "show", head + ":" + completion_path(publication), optional=True)
    try:
        data = h.decode_json(raw.decode("utf-8")) if raw is not None else {}
        receipt = data["state"]["publication"]
        second = data["second_delivery_commit"]
        valid = (data.get("schema") == "publish-completion-v1"
                 and receipt["content_id"] == publication["content_id"]
                 and h.next_step(receipt) is None
                 and re.fullmatch(r"[0-9a-f]{40}", second) is not None
                 and h.git(root, "merge-base", "--is-ancestor", current["head"], second, optional=True) is not None
                 and h.git(root, "merge-base", "--is-ancestor", second, head, optional=True) is not None)
        delivered = h.git(root, "show", second + ":" + h.STATE_PATH, optional=True) if valid else None
    except (ValueError, KeyError, TypeError, AttributeError):
        return None
    if delivered is None or h.digest(delivered) != expected:
        return None
    return ("DELIVERY_3_ON_REMOTE_PULL_REQUIRED: origin/" + str(current["branch"]) + " at " + head[:12]
            + " fast-forwards this checkout with the completion receipt and handoff deletion for "
            + publication["content_id"] + "; no local cleanup is pending; " + PULL_ADVICE)


def require_step_delivery(root, state, expected):
    """Fresh read-only origin check; never commit/push or trust cached upstream."""
    current = h.current_snapshot(root, state, check_remote=True)
    pull = remote_delivery_ahead(root, state, current, expected)
    h.require(pull is None, pull)
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
    local_only = h.local_only_inputs(root, state['publication'])
    for name, info in state['snapshot']['files'].items():
        actual = h.delivered_file_info(root, name, local_only)
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
    return h.publication_category(publication) != "paper-only" and any(
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
    exempt = h.publication_category(publication) == "litecast" or challenge["status"] == "completed"
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
    return h.publication_category(publication) != "paper-only" and any(
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


def invalidation_count(publication):
    return sum(1 for d in publication["context"]["decisions"]
               if isinstance(d, dict) and d.get("kind") == h.INVALIDATION)


def redelivers_first_cut(previous, publication, boundary):
    # The previous commit may sit at cut 1, or at cut 2 when a failed post-Push-2
    # continuation needed a workflow fix (e.g. a tool defect fixed on main), whose
    # mandatory invalidation from `rules` reopens the ledger before cut 1.
    return (boundary in (1, 2) and fixed_delivery(previous)
            and previous["content_id"] == publication["content_id"]
            and h.publication_category(previous) == h.publication_category(publication)
            and editorial_cut_v2(previous) == editorial_cut_v2(publication)
            and invalidation_count(publication) > invalidation_count(previous))


def require_delivery_parent(root, publication, number, revision="HEAD"):
    boundary, previous = committed_boundary(root, revision)
    if number == 1:
        # An audited dependency invalidation after a delivered first (or
        # second) cut may re-deliver the first cut once per invalidation: same
        # run, previous commit at boundary 1 or 2, and strictly more
        # invalidation receipts now.
        h.require(previous is None or redelivers_first_cut(previous, publication, boundary),
                  "FIRST_DELIVERY_REQUIRES_NO_ACTIVE_REMOTE_HANDOFF")
    else:
        h.require(boundary == number-1 and previous is not None
                  and fixed_delivery(previous)
                  and editorial_cut_v2(previous) == editorial_cut_v2(publication)
                  and previous["content_id"] == publication["content_id"],
                  "FIXED_DELIVERY_ORDER_REQUIRED")


def completion_path(publication):
    name = h.relative_path(publication["content_id"])
    return ".dentcast/publication-reports/" + name + ".completion.json"


def technical_report_path(publication):
    """Public-safe Phase G technical report delivered with the third commit."""
    h.relative_path(publication["content_id"])
    name = publication["category"] + "-" + publication["content_id"].rsplit("/", 1)[-1]
    return h.relative_path(".dentcast/publication-reports/" + name + ".md")


def des_summary(root, publication):
    """One line per stored DES source and Fidelity slot, or the recorded exception."""
    try:
        record = h.decode_json(h.safe_path(root, "plus/des-scores.json").read_text(encoding="utf-8")).get(
            publication["content_id"])
    except (OSError, ValueError):
        record = None
    if not record:
        c413 = next((s for s in publication["steps"] if s["id"] == "C.4.13"), {})
        return [f"- No DES record; C.4.13 {c413.get('status')}: {c413.get('reason') or 'see receipt'}"]
    lines = []
    for i, src in enumerate(record.get("sources") or [], 1):
        lines.append(f"- Source {i}: DES {src.get('des_score')}/100, band {src.get('band')}, "
                     f"{src.get('content_type')}, provisional {src.get('provisional')}")
    for i, fid in enumerate(record.get("fidelity") or [], 1):
        if not isinstance(fid, dict):
            lines.append(f"- Fidelity {i}: no result slot")
            continue
        counts = ", ".join(f"{k} {v}" for k, v in sorted((fid.get("counts") or {}).items()))
        lines.append(f"- Fidelity {i}: {fid.get('fidelity_score')} {fid.get('level')}, "
                     f"provisional {fid.get('provisional')}" + (f" ({counts})" if counts else ""))
    return lines or ["- DES record present without sources"]


def technical_report(root, final, files):
    """Public-safe report G from the completed ledger and real Phase F receipt only.

    Approvals, decisions and inputs are deliberately omitted: no private text.
    """
    p = final["state"]["publication"]
    phase_f = final.get("verification") or {}
    lines = [f"# {p['content_id']} — publication technical report", "",
             "Generated by `finish` from the completed ledger and the real Phase F receipt.", "",
             f"- Second-delivery SHA: `{final['second_delivery_commit']}`"]
    for d in p["context"]["delivery"]:
        lines.append(f"- {d['scope']}: " + ", ".join(d["evidence"]))
    lines += ["", "## Steps", ""]
    for row in p["steps"]:
        reason = f" — {row['reason']}" if row["status"] == "skipped" and row.get("reason") else ""
        lines.append(f"- `{row['id']}` {row['status']}{reason}")
    lines += ["", "## DES/Fidelity", "", *des_summary(root, p), "",
              "## Phase F", "", f"**{phase_f.get('summary', 'no verifier summary')}**", "",
              f"Output SHA-256 `{phase_f.get('output_sha256')}`.", "",
              "## Files in delivery 3", "", *[f"- `{name}`" for name in sorted(files)]]
    return "\n".join(lines) + "\n"


def final_files_match(root, state):
    current = h.current_snapshot(root, state)
    h.require(all(current[k] == state["snapshot"][k] for k in ("repository", "branch")),
              "WRONG_CLEANUP_CHECKOUT")
    local_only = h.local_only_inputs(root, state["publication"])
    for name, info in state["snapshot"]["files"].items():
        actual = h.delivered_file_info(root, name, local_only)
        h.require(all(actual[k] == info[k] for k in actual), "WORK_CHANGED_AFTER_CLEANUP:" + name)
    h.require(current["workflow"] == state["snapshot"]["workflow"], "WORKFLOW_CHANGED_AFTER_CLEANUP")
    return current


def workflow_paths_at(root, commit):
    """WORKFLOW_PATHS as the delivery commit's own handoff tool declared them.

    Evaluates only the literal tuple/concatenation/generator forms the tool
    uses (never executes code); None when they cannot be read.
    """
    import ast
    raw = h.git(root, "show", commit + ":tools/dentcast_publish_handoff.py", optional=True)
    if raw is None:
        return None
    try:
        tree = ast.parse(raw.decode("utf-8"))
    except (SyntaxError, ValueError):
        return None
    env = {}

    def value(node, scope):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value
        if isinstance(node, ast.Name) and node.id in scope:
            return scope[node.id]
        if isinstance(node, (ast.Tuple, ast.List)):
            return tuple(value(e, scope) for e in node.elts)
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            left, right = value(node.left, scope), value(node.right, scope)
            if type(left) is not type(right):
                raise ValueError
            return left + right
        if (isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "tuple"
                and len(node.args) == 1 and isinstance(node.args[0], ast.GeneratorExp)):
            gen = node.args[0]
            (comp,) = gen.generators
            if comp.ifs or not isinstance(comp.target, ast.Name):
                raise ValueError
            return tuple(value(gen.elt, {**scope, comp.target.id: item}) for item in value(comp.iter, scope))
        raise ValueError
    try:
        for node in tree.body:
            if (isinstance(node, ast.Assign) and len(node.targets) == 1
                    and isinstance(node.targets[0], ast.Name)
                    and node.targets[0].id in ("MODULES", "WORKFLOW_PATHS")):
                env[node.targets[0].id] = value(node.value, env)
    except (ValueError, TypeError):
        return None
    paths = env.get("WORKFLOW_PATHS")
    return set(paths) if isinstance(paths, tuple) and all(isinstance(x, str) for x in paths) else None


def validate_final_receipt(root, data, commit=None, own_paths=None):
    """Completed-only audit receipt, never an active recovery handoff.

    With a delivery commit, its delivered facts (files, workflow and the
    workflow inventory) are checked in that commit's tree, so later main-side
    changes cannot fail an older publication. own_paths, when given, are paths
    the PR itself changed after that commit; those stay checked in the working
    tree. Without own_paths every file is checked in the working tree.
    """
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
    inventory = (workflow_paths_at(root, commit) if commit else None) or set(h.WORKFLOW_PATHS)
    h.require(set(publication["target_paths"]) <= set(state["snapshot"]["files"])
              and set(state["snapshot"]["workflow"]) == inventory, "INCOMPLETE_FINAL_FINGERPRINTS")
    second = data["second_delivery_commit"]
    h.require(bool(re.fullmatch(r"[0-9a-f]{40}", second)), "INVALID_DELIVERY_COMMIT")
    require_delivery_parent(root, publication, 3, second)
    # A failed post-cut continuation may leave audited reconciliation commits
    # between the delivered second cut and this final delivery. Locate the
    # original second-cut boundary on first-parent history, then validate every
    # intervening path against the frozen publication/workflow inventory.
    first = None
    history = h.text_git(root, "rev-list", "--first-parent", second).splitlines()
    for candidate in history:
        try:
            require_delivery_parent(root, publication, 3, candidate)
            candidate_first = h.text_git(root, "rev-parse", candidate + "^")
            require_delivery_parent(root, publication, 2, candidate_first)
            require_delivery_parent(root, publication, 1, candidate_first + "^")
        except h.Blocked:
            continue
        first = candidate_first
        allowed = set(state["snapshot"]["files"]) | set(state["snapshot"]["workflow"]) | {h.STATE_PATH, ".github/scripts/inject_img_attrs.py"}
        intervening = set(h.text_git(root, "diff", "--name-only", candidate, second).splitlines())
        h.require(intervening <= allowed, "UNRECONCILED_POST_CUT_PATH")
        break
    h.require(first is not None, "FIXED_DELIVERY_ORDER_REQUIRED")
    if commit:
        raw = h.git(root, "show", commit + ":" + completion_path(publication), optional=True)
        h.require(raw is not None and h.decode_json(raw.decode("utf-8")) == data, "FINAL_RECEIPT_NOT_IN_DELIVERY_COMMIT")
        h.require(h.text_git(root, "rev-parse", commit + "^") == second, "EXTRA_DELIVERY_COMMIT_FORBIDDEN")
        h.require(h.git(root, "show", commit + ":" + h.STATE_PATH, optional=True) is None,
                  "FINAL_HANDOFF_MUST_NOT_BE_PUSHED")
        changed = set(h.text_git(root, "diff", "--name-only", second, commit).splitlines())
        h.require(changed <= set(state["snapshot"]["files"]) | {
            h.STATE_PATH, completion_path(publication), technical_report_path(publication)},
                  "UNRELATED_FINAL_DELIVERY_PATH")
    local_only = h.local_only_inputs(root, publication)
    for name, info in state["snapshot"]["files"].items():
        if commit and own_paths is not None and name not in own_paths:
            actual = committed_file_info(root, commit, name, local_only)
        else:
            actual = h.delivered_file_info(root, name, local_only)
        h.require(all(actual[k] == info[k] for k in actual), "FINAL_RECEIPT_FILE_MISMATCH:" + name)
    # The workflow snapshot is a fact of the delivered tree. Once delivered, main
    # may legitimately change the rules before merge, so check that commit.
    for name, sha in state["snapshot"]["workflow"].items():
        if commit:
            raw = h.git(root, "show", commit + ":" + name, optional=True)
            actual = None if raw is None else h.digest(raw)
        else:
            actual = h.file_info(root, name)["sha256"]
        h.require(actual == sha, "FINAL_RECEIPT_WORKFLOW_MISMATCH:" + name)
    receipts = [r for r in publication["context"]["validation"] if isinstance(r, dict) and r.get("kind") == "phase_f"]
    h.require(bool(receipts) and receipts[-1].get("exit_code") == 0, "MECHANICAL_GATE_RECEIPT_REQUIRED")
    last = receipts[-1]
    result = gate(root, publication, last.get("expected_title"), last.get("expected_caption"))
    h.require(result["exit_code"] == 0, "FINAL_DELIVERY_VERIFICATION_FAILED")
    return publication["content_id"]


def challenge_markup(root, publication):
    """Same signal as Phase F: a real element attribute outside script/style."""
    page = h.safe_path(root, h.relative_path(publication["content_id"] + ".html"))
    if not page.is_file():
        return False
    text = page.read_text(encoding="utf-8", errors="replace")
    text = re.sub(r"<!--.*?-->|<(script|style)\b.*?</\1\s*>", "", text, flags=re.S | re.I)
    return re.search(r"<[A-Za-z][^>]*\sdata-dc-challenge-question\b", text) is not None


def guard_step_transition(state, publication, root=None):
    if fixed_delivery(state["publication"]):
        h.require(fixed_delivery(publication), "DELIVERY_POLICY_CANNOT_BE_DROPPED")
        old_c49 = next((s for s in state["publication"]["steps"] if s["id"] == "C.4.9"), None)
        new_c49 = next((s for s in publication["steps"] if s["id"] == "C.4.9"), None)
        if (old_c49 and new_c49 and old_c49["status"] not in ("completed", "skipped")
                and new_c49["status"] in ("completed", "skipped")):
            # Fail at C.4.9 itself, not first at the cut-1 stop/commit guard.
            require_fixed_cut_readiness(publication, root)
        h.require(editorial_cut_v2(state["publication"]) == editorial_cut_v2(publication),
                  "DELIVERY_POLICY_VERSION_CANNOT_CHANGE")
        if editorial_cut_v2(state["publication"]):
            old_c6 = next(s for s in state["publication"]["steps"] if s["id"] == "C.6")
            new_c6 = next(s for s in publication["steps"] if s["id"] == "C.6")
            if old_c6["status"] not in ("completed", "skipped") and new_c6["status"] in ("completed", "skipped"):
                # Fail at C.6 itself, not first at the cut-2 commit guard.
                editorial_cut_receipt(publication, root)
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
    challenge = next((s for s in publication['steps'] if s['id'] == 'C.4.14'), None)
    if challenge and challenge['status'] == 'completed' and old.get('C.4.14', {}).get('status') != 'completed':
        h.require(root is not None and challenge_markup(root, publication),
                  'C.4.14 completed means Challenge; record skipped for an ordinary post')
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
    h.require(sid in GROUPS[0]+GROUPS[1] or (p["content_id"] != "unassigned" and h.publication_category(p) != "pending"),
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


def action_step(publication, action):
    """Step an external action belongs to, from its id convention "<step>:<name>".

    None when the prefix is not a step of this ledger (older, unattributed ids).
    """
    head, sep, _ = action["id"].partition(":")
    return head if sep and head in {s["id"] for s in publication["steps"]} else None


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
        # A row an earlier --start-next opened may be skipped while it is still
        # bare: no evidence or reason, no external action attributed to it (an
        # unattributed one might be, so it also blocks), no external outcome in
        # flight (checked below for every transition) and no work or rule drift.
        owners = [action_step(p, a) for a in p["external_actions"]]
        bare_start = (row["status"] == "started" and not row["evidence"] and row["reason"] is None
                      and skip_id not in owners and None not in owners
                      and not h.differences(root, state, h.current_snapshot(root, state)))
        h.require(row["status"] == "pending" or bare_start, "ONLY_PENDING_STEPS_CAN_BE_BATCH_SKIPPED")
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
                  (p["content_id"] != "unassigned" and h.publication_category(p) != "pending"),
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


def stage_delivery(root, expected, paths):
    """Stage reviewed fixed-cut work and refresh the checkpoint for that index only.

    Bytes must already match the latest checkpoint; only the index may change.
    The unchanged pre-commit guard is run on the result; nothing is committed.
    """
    state = state_for_update(root, expected)
    p = state["publication"]
    # Paper-only keeps its single delivery: the exact completed final handoff
    # (with its catalog work), followed later by the deletion-only cleanup.
    paper_final = h.publication_category(p) == "paper-only" and h.next_step(p) is None
    h.require(paper_final or (fixed_delivery(p) and delivery_boundary(p) in (1, 2)),
              "STAGE_DELIVERY_ONLY_AT_FIXED_CUT")
    h.require(bool(paths), "STAGE_DELIVERY_PATHS_REQUIRED")
    scope = set(p["target_paths"]) | set(state["snapshot"]["files"])
    local_only = h.local_only_inputs(root, p)
    for path in paths:
        h.require(h.relative_path(path) in scope and path != h.STATE_PATH, "STAGE_PATH_OUTSIDE_PUBLICATION:" + path)
        h.require(path not in local_only, "LOCAL_ONLY_INPUT_IS_NEVER_DELIVERED:" + path)
    current = h.current_snapshot(root, state)
    recorded = state["snapshot"]
    bytes_of = lambda files: {name: {k: info[k] for k in ("kind", "sha256", "executable")}
                              for name, info in files.items()}
    h.require(all(recorded[k] == current[k] for k in ("repository", "branch", "head", "workflow"))
              and bytes_of(recorded["files"]) == bytes_of(current["files"]),
              "RECORD_WORK_CHANGES_BEFORE_STAGING")
    h.git(root, "add", "--", *paths)
    result = h.save(root, copy.deepcopy(p), expected=expected,
                    note="Index-only refresh after staging delivery paths: " + ", ".join(paths))
    h.git(root, "add", "--", h.STATE_PATH)
    guard(root, "pre-commit")
    return {"status": "delivery_staged", "sha256": result["sha256"], "staged": list(paths),
            "next_action": ("Commit and push this paper-only final handoff once, then finish" if paper_final
                            else "Commit and push this fixed delivery once"), "publication_completed": False}


def bind(root, expected, content_id, category, targets, evidence):
    """Resolve an intake placeholder once, before any authoring or side effect."""
    with h.locked(root):
        state = state_for_update(root, expected)
        old = state["publication"]
        h.require(old["content_id"] == "unassigned" and h.canonical_category(old["category"]) == "pending",
                  "IDENTITY_ALREADY_BOUND")
        category = h.canonical_category(category)
        h.require(h.nonempty(evidence) and category not in ("pending", "")
                  and content_id != "unassigned" and h.nonempty(content_id), "VERIFIED_INTAKE_IDENTITY_REQUIRED")
        # A founder-requested external action during intake (e.g. a Drive
        # rename/move) may precede binding only when its outcome is settled and
        # evidenced; its receipt is carried over unchanged.
        h.require(all(a["status"] == "completed" and a["evidence"] for a in old["external_actions"])
                  and all(s["status"] == "pending" or s["id"] in GROUPS[0]+GROUPS[1]
                          for s in old["steps"]), "BIND_ONLY_BEFORE_AUTHORING")
        h.require(not h.differences(root, state, h.current_snapshot(root, state)), "WORK_CHANGED_BEFORE_BIND")
        p = copy.deepcopy(old)
        p.update(content_id=content_id, category=category, target_paths=targets)
        h.require_content_id(p)
        if h.publication_category(p) == "paper-only":
            h.require(all(s["status"] == "pending" or s["id"] in ("rules", "0") for s in old["steps"]),
                      "PAPER_ONLY_ROUTE_MUST_BE_SELECTED_AT_PHASE_ZERO")
            p["steps"] = [next((s for s in old["steps"] if s["id"] == row["id"]), row)
                          for row in plan(paper_only=True)]
        p["context"]["decisions"].append({"kind": "intake_identity_bound", "evidence": evidence})
        require_plan(p)
        state.update(schema=h.SCHEMA, publication=p, snapshot=h.snapshot(root, targets, local_only=h.local_only_inputs(root, p)), generation=state["generation"]+1,
                     updated_at=h.now(), previous_sha256=expected,
                     reconciliation={"note": "Resolved previously unassigned intake identity", "observed_changes": ["IDENTITY_BOUND_ONCE"]})
        sha = h.write_atomic(root, state)
        return {"status": "checkpoint_written", "sha256": sha, "publication_completed": False}


def gate(root, p, expect_title=None, expect_caption=None, catalog_id=None):
    """Execute the actual local Phase F, or the documented no-page catalog check."""
    if h.publication_category(p) == "paper-only":
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
    paper = h.publication_category(p) == "paper-only"
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


def committed_file_info(root, commit, name, local_only=()):
    """File fingerprint as recorded in a commit's tree (same shape as file_info)."""
    if name in local_only:
        return dict(h.LOCAL_ONLY)
    rows = h.git(root, "ls-tree", "-z", commit, "--", name, optional=True) or b""
    for row in rows.split(b"\0"):
        if row:
            meta, path = row.split(b"\t", 1)
            if path.decode("utf-8", "surrogateescape") == name:
                mode, kind, _ = meta.decode("ascii").split()
                h.require(kind == "blob", "UNSUPPORTED_DELIVERED_FILE")
                return {"kind": "symlink" if mode == "120000" else "file",
                        "sha256": h.digest(h.git(root, "show", commit + ":" + name)),
                        "executable": mode == "100755"}
    return {"kind": "missing", "sha256": None, "executable": False}


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
        local_only = h.local_only_inputs(root, p)
        h.require(fixed or all(f["status"] is None and f["kind"] != "missing" and bool(f["index"])
                      and all(e["stage"] == 0 for e in f["index"])
                      for name, f in current["files"].items() if name not in local_only),
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
            tech = technical_report_path(p)
            tech_text = None
            if not h.safe_path(root, tech).exists():  # never overwrite an authored report
                files = set(h.status_paths(root)) | {h.STATE_PATH, report, tech}
                tech_text = technical_report(root, final, files)
                data["technical_report"] = {"path": tech, "sha256": h.digest(tech_text.encode("utf-8"))}
        store_cleanup(root, data)
        if fixed:
            from dentcast_text_io import write_text
            report_path = h.safe_path(root, report)
            report_path.parent.mkdir(parents=True, exist_ok=True)
            write_text(report_path, json.dumps(final, ensure_ascii=True, indent=2) + "\n")
            if tech_text is not None:
                tech_path = h.safe_path(root, tech)
                tech_path.parent.mkdir(parents=True, exist_ok=True)
                write_text(tech_path, tech_text)
        h.safe_path(root, h.STATE_PATH).unlink()
        if os.name != "nt":
            directory = os.open(h.safe_path(root, h.STATE_PATH).parent, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
        return {"status": "cleanup_pending_delivery", "publication_completed": False,
                "next_action": ("Commit/push final work, completion receipt, technical report and handoff deletion together as delivery 3; then confirm-cleanup"
                                if fixed else "Commit/push only the handoff deletion, then confirm-cleanup; restore-cleanup on failure"),
                "verification": receipt}


def confirm_remote_final_delivery(root):
    """Read-only check of a delivery 3 pushed by the post-Push-2 Actions run.

    After `git pull --ff-only` this checkout holds that commit but no local
    cleanup record (the runner confirmed cleanup in its own checkout). Verify
    the same facts CI does: HEAD deletes the parent's fixed-delivery handoff,
    its completion receipt validates, the work is committed and HEAD is the
    freshly observed origin branch head.
    """
    previous = h.git(root, "show", "HEAD^:" + h.STATE_PATH, optional=True)
    h.require(previous is not None and h.git(root, "ls-tree", "HEAD", "--", h.STATE_PATH) == b"",
              "CLEANUP_RECORD_MISSING_OR_INVALID")
    state, checkpoint_sha = h.parse_state(previous)
    if state["schema"] == h.SCHEMA:
        state = h.hydrate_v3(root, state, checkpoint_sha)
    p = state["publication"]
    h.require(fixed_delivery(p), "CLEANUP_RECORD_MISSING_OR_INVALID")
    receipt = h.git(root, "show", "HEAD:" + completion_path(p), optional=True)
    h.require(receipt is not None, "FINAL_RECEIPT_NOT_IN_DELIVERY_COMMIT")
    validate_final_receipt(root, h.decode_json(receipt.decode("utf-8")), "HEAD")
    h.require(not h.status_paths(root), "FINAL_DELIVERY_WORK_NOT_COMMITTED")
    head = h.text_git(root, "rev-parse", "HEAD")
    remote = h.remote_observation(root, head, h.branch(root), True)
    h.require(remote["status"] == "observed" and remote["head"] == head, "CLEANUP_NOT_DELIVERED")
    observation = h.observation_path(root)
    if observation.exists():
        observation.unlink()  # stale Push-2 observation of this checkout
    return {"status": "publication_completed", "publication_completed": True,
            "cleanup_commit": head, "content_id": p["content_id"], "delivered_by": "remote_final_delivery"}


def confirm_cleanup(root):
    with h.locked(root):
        if not pending(root) and h.safe_path(root, h.STATE_PATH).exists():
            state, sha = h.load_state(root)
            pull = remote_delivery_ahead(root, state, h.current_snapshot(root, state, check_remote=True), sha)
            h.require(pull is None, pull)
        if not pending(root) and not h.safe_path(root, h.STATE_PATH).exists():
            return confirm_remote_final_delivery(root)
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
        if "technical_report" in data:
            tech = h.safe_path(root, data["technical_report"]["path"])
            if tech.exists():
                h.require(h.digest(tech.read_bytes()) == data["technical_report"]["sha256"],
                          "TECHNICAL_REPORT_CHANGED")
                tech.unlink()
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
                    allowed = set(data["state"]["snapshot"]["files"]) | {
                        h.STATE_PATH, data["completion_path"],
                        technical_report_path(data["state"]["publication"])}
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
                local_only = h.local_only_inputs(root, p)
                for name, info in state["snapshot"]["files"].items():
                    actual = h.delivered_file_info(root, name, local_only)
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
        local_only = h.local_only_inputs(root, state["publication"])
        for p, info in state["snapshot"]["files"].items():
            actual = h.delivered_file_info(root, p, local_only)
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
