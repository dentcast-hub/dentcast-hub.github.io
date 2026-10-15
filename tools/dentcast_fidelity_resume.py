#!/usr/bin/env python3
"""STAGING nested Fidelity checkpoint/recovery on the GitHub memory ledger.

Uses the EXISTING tools/des_fidelity_units.py vote_source and verify_publish
DES/Fidelity arithmetic. Does NOT change the scientific prompts, checker vote,
adjudication or founder correction policy. SOURCE and POOLED remain distinct.

Full input blocks and full per-claim outputs enter the PUBLIC repo ONLY with an
externally reviewed public-release approval reference. Caller must obtain that
permission; passing a SHA does not make an unsafe document safe. Otherwise STOP.
"""
import argparse
import copy
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import verify_publish as vp
import des_fidelity_units as engine
import dentcast_github_memory as mem

CHECKER_ROLES = ("checker1", "checker2", "checker3")
SCI_ROLES = CHECKER_ROLES + ("adjudication", "review")
F5 = {"des_version", "mode", "scope", "text_basis", "claims", "counts",
      "assessable", "fidelity_score", "level", "provisional",
      "source_conclusion", "fact_fa", "interpretation_fa"}


def need(ok, reason):
    if not ok:
        raise ValueError(reason)


def validate_block(block):
    need(isinstance(block, dict) and block.get("mode") == "FIDELITY" and
         block.get("scope") == "SOURCE" and
         isinstance(block.get("source_text"), str) and
         bool(block["source_text"].strip()) and
         isinstance(block.get("source_conclusion"), str) and
         block.get("text_basis") in ("FULL_TEXT", "SECONDARY_REPORT",
                                    "ABSTRACT_ONLY", "EXCERPT") and
         isinstance(block.get("units"), list) and bool(block["units"]),
         "INVALID_EXISTING_FIDELITY_BLOCK")
    need(all(isinstance(u, dict) and set(u) >= {"id", "text"} and
             isinstance(u["text"], str) and bool(u["text"].strip()) and
             isinstance(u["id"], str) and re.fullmatch(r"u[1-9][0-9]*", u["id"])
             for u in block["units"]), "INVALID_UNIT")
    ids = [u["id"] for u in block["units"]]
    need(len(ids) == len(set(ids)) and
         [int(i[1:]) for i in ids] == sorted(int(i[1:]) for i in ids),
         "UNITS_OUT_OF_ORDER")
    if "pooled_part" in block:
        need(re.fullmatch(r"S[1-9][0-9]*", block["pooled_part"]) is not None,
             "INVALID_POOLED_PART")
    need(len(mem.canonical(block)) < 280000, "PUBLIC_INPUT_TOO_LARGE")
    return True


def check_models(checker, reviewer):
    for obj in (checker, reviewer):
        need(isinstance(obj, dict) and set(obj) == {
            "provider", "model", "reasoning", "preflight_digest"},
            "MODEL_PREFLIGHT_FIELDS")
        need(all(mem.safe_atom(obj[x]) for x in ("provider", "model", "reasoning")) and
             mem.safe_digest(obj["preflight_digest"]),
             "UNVERIFIED_MODEL_PREFLIGHT")
    need(checker["model"] != reviewer["model"] or
         checker["provider"] != reviewer["provider"],
         "REVIEWER_MUST_BE_STRONGER_SEPARATE_ROLE")
    # A model being different doesn't itself prove it's stronger; the exact
    # externally verified preflight record must support that distinction.
    return True


def validate_f5(result, block, only=None):
    """Check full unit identity, exact original text, quotes and F4 arithmetic."""
    validate_block(block)
    need(isinstance(result, dict) and set(result) == F5,
         "FIDELITY_F5_OUTPUT_SCHEMA")
    need(result["des_version"] == "3.4" and result["mode"] == "FIDELITY" and
         result["scope"] == "SOURCE" and
         result["text_basis"] == block["text_basis"] and
         result["source_conclusion"] == block["source_conclusion"],
         "FIDELITY_INPUT_BASIS_OR_VERSION_CHANGED")
    expected_units = [u for u in block["units"]
                      if only is None or u["id"] in set(only)]
    need(isinstance(result["claims"], list) and
         len(result["claims"]) == len(expected_units),
         "INCOMPLETE_FULL_CHECKER_OR_WRONG_TIEBREAK")
    source_hay = vp.des_norm(block["source_text"])
    verdicts = []
    for u, claim in zip(expected_units, result["claims"]):
        need(isinstance(claim, dict) and
             set(claim) >= {"id", "claim_quote", "verdict",
                            "change_kind", "source_quote", "source_ref"} and
             set(claim) <= {"id", "claim_quote", "verdict",
                            "change_kind", "source_quote", "source_ref", "note"},
             "INVALID_FIDELITY_CLAIM_SHAPE")
        need(claim["id"] == u["id"] and
             claim["claim_quote"] == u["text"], "UNIT_TEXT_OR_ORDER_CHANGED")
        v = claim["verdict"]
        need(v in vp.DES_FID_VERDICTS, "UNKNOWN_FIDELITY_VERDICT")
        need((v == "ALTERED") == (claim["change_kind"] is not None),
             "CHANGE_KIND_SCOPE")
        if v == "ALTERED":
            need(claim["change_kind"] in vp.DES_FID_KINDS,
                 "INVALID_CHANGE_KIND")
        need(claim["source_ref"] is None, "SOURCE_SCOPE_REF_MUST_BE_NULL")
        quote = claim["source_quote"]
        need(isinstance(quote, str) and
             (not quote or vp.des_norm(quote) in source_hay),
             "SOURCE_QUOTE_NOT_VERBATIM")
        if v in {"MATCHES", "ALTERED", "REVERSED"}:
            need(bool(quote), "SUPPORTED_VERDICT_WITHOUT_SOURCE_QUOTE")
        if not quote:
            need(isinstance(claim.get("note"), str) and
                 bool(claim["note"].strip()), "EMPTY_QUOTE_REQUIRES_NOTE")
        verdicts.append(v)
    tally = {"matches": verdicts.count("MATCHES"),
             "altered": verdicts.count("ALTERED"),
             "reversed": verdicts.count("REVERSED"),
             "not_in_source": verdicts.count("NOT_IN_SOURCE"),
             "not_assessable": verdicts.count("NOT_ASSESSABLE"),
             "author_view": verdicts.count("AUTHOR_VIEW"),
             "not_a_claim": verdicts.count("NOT_A_CLAIM")}
    need(result["counts"] == tally, "FIDELITY_COUNTERS_CHANGED")
    asses, score, level = vp.des_fidelity_recompute(tally, result["des_version"])
    need(result["assessable"] == asses and result["fidelity_score"] == score
         and result["level"] == level, "FIDELITY_F4_SCORE_MISMATCH")
    complete = block["text_basis"] in ("FULL_TEXT", "SECONDARY_REPORT")
    need(result["provisional"] is (not complete), "FIDELITY_PROVISIONAL_MISMATCH")
    need(isinstance(result["fact_fa"], str) and
         isinstance(result["interpretation_fa"], str),
         "FIDELITY_NARRATIVE_SCHEMA")
    return True


def _receipts(source_revision, block_digest, output_digest):
    return {"schema": "dc-public-receipt-v1",
            "validation": {"contract_checked": True, "input_bound": True,
                           "source_verified": True},
            "input_digest": block_digest, "output_digest": output_digest,
            "source_revision": source_revision}


def _data(store, run_id, source_id):
    need(mem.safe_atom(source_id) and "/" not in source_id,
         "UNSAFE_SOURCE_ID")
    snap = store.snapshot(run_id)
    head, folder = snap["head"], mem.run_folder(run_id)
    relevant = []
    for event in snap["events"]:
        if (event["kind"] != "fidelity_checkpoint" or
                not event["step_id"].startswith("evidence:" + source_id + ":")):
            continue
        need(len(event["artifact_digests"]) == 1,
             "SCIENCE_EVENT_NEEDS_COMPLETE_ARTIFACT")
        h = event["artifact_digests"][0]
        obj = store.read_json(head, folder + "/artifacts/" + h + ".json")
        need(mem.digest(obj) == h and obj["schema"] == "dc-public-artifact-v1" and
             obj["public_release_approval_digest"] and
             obj["payload"].get("source_id") == source_id,
             "SCIENCE_ARTIFACT_INVALID")
        relevant.append((event, obj))
    need(bool(relevant) and relevant[0][1]["kind"] == "fidelity_input_manifest",
         "NO_PINNED_SOURCE_INPUT")
    manifest = relevant[0][1]["payload"]
    block = manifest["block"]
    validate_block(block)
    need(mem.digest(block) == manifest["input_digest"] and
         manifest["prompt_digest"] and
         manifest["engine_version"] == "3.4",
         "PINNED_INPUT_OR_ENGINE_DRIFT")
    return snap, manifest, relevant


def begin_source(store, run_id, source_id, block, checker, reviewer, actor,
                 *, prompt_digest, public_release_approval_digest):
    validate_block(block)
    check_models(checker, reviewer)
    need(mem.safe_digest(prompt_digest) and
         mem.safe_digest(public_release_approval_digest), "PUBLIC_RELEASE_OR_PROMPT_MISSING")
    snap = store.snapshot(run_id)
    folder = mem.run_folder(run_id)
    need(mem.safe_atom(source_id) and "/" not in source_id, "UNSAFE_SOURCE_ID")
    for ev in snap["events"]:
        need(ev["step_id"] != "evidence:" + source_id + ":manifest",
             "FIDELITY_SOURCE_ALREADY_STARTED")
    payload = {"source_id": source_id, "block": copy.deepcopy(block),
               "input_digest": mem.digest(block), "prompt_digest": prompt_digest,
               "checker": checker, "reviewer": reviewer, "engine_version": "3.4"}
    artifact = {"schema": "dc-public-artifact-v1",
                "kind": "fidelity_input_manifest",
                "public_release_approval_digest": public_release_approval_digest,
                "payload": payload}
    out = mem.digest(artifact)
    receipt = _receipts(snap["manifest"]["source_revision"], payload["input_digest"], out)
    return store.append(run_id, actor, "fidelity_checkpoint",
                        "evidence:" + source_id + ":manifest",
                        input_digest=payload["input_digest"],
                        output_digest=out, receipt_digest=mem.digest(receipt),
                        artifact_digests=[out], gate="engine_verified",
                        public_artifacts=[artifact], public_receipt=receipt)


def state_of(store, run_id, source_id):
    snap, manifest, records = _data(store, run_id, source_id)
    block = manifest["block"]
    checker = {}
    other = {}
    for ev, art in records[1:]:
        role = ev["step_id"].rsplit(":", 1)[-1]
        need(role not in checker and role not in other,
             "DUPLICATED_SCIENTIFIC_ROLE")
        payload = art["payload"]
        if role in CHECKER_ROLES:
            need(art["kind"] == "fidelity_checker" and
                 payload["role"] == role and
                 payload["model"] == manifest["checker"] and
                 payload["session"] == ev["actor"]["session"],
                 "CHECKER_IDENTITY_DRIFT")
            units = None if role != "checker3" else [
                u["id"] for u in block["units"] if u["id"] in
                set(payload["only_units"])]
            validate_f5(payload["result"], block, only=units)
            checker[role] = (payload["result"], payload["session"])
        else:
            need(role in {"adjudication", "review"} and
                 art["kind"] == ("fidelity_adjudication" if role == "adjudication"
                                else "fidelity_review"), "UNKNOWN_SCIENCE_ROLE")
            other[role] = payload["result"]
    return snap, manifest, checker, other


def next_task(store, run_id, source_id):
    """Returns the next domain call with input, NEVER earlier checker verdicts."""
    snap, spec, checks, others = state_of(store, run_id, source_id)
    block = spec["block"]
    pooled = "pooled_part" in block
    first = checks.get("checker1")
    second = checks.get("checker2")
    if not first:
        return {"role": "checker1", "status": "pending",
                "block": block, "model": spec["checker"], "blind": True}
    if pooled:
        return {"role": "merge_pooled", "status": "awaiting_existing_engine_merge",
                "source_id": source_id, "command": "des_fidelity_units.py --merge DIR",
                "no_checker_vote_on_pooled": True}
    if not second:
        # Crucially do NOT include first checker verdicts/results here.
        return {"role": "checker2", "status": "pending", "block": block,
                "model": spec["checker"], "blind": True}
    runs = [first[0], second[0]]
    _, tie, _, _ = engine.vote_source(runs)
    if tie and "checker3" not in checks:
        return {"role": "checker3", "status": "pending", "model": spec["checker"],
                "blind": True,
                "block": {**block,
                          "units": [u for u in block["units"] if u["id"] in tie]},
                "only_units": tie}
    if "checker3" in checks:
        runs.append(checks["checker3"][0])
    adj = others.get("adjudication", {})
    rev = others.get("review", {})
    voted, pending_tie, unresolved, unreviewed = engine.vote_source(runs, adj, rev)
    if pending_tie:
        return {"role": "checker3", "status": "blocked",
                "reason": "INCOMPLETE_DISAGREEMENT_RUN", "units": pending_tie}
    if unresolved:
        return {"role": "adjudication", "status": "pending",
                "model": spec["reviewer"], "units": unresolved,
                "source_id": source_id}
    if unreviewed:
        return {"role": "review", "status": "pending",
                "model": spec["reviewer"], "units": unreviewed,
                "source_id": source_id}
    flagged = [c["id"] for c in voted["claims"]
               if c["verdict"] in {"ALTERED", "REVERSED"}]
    return {"role": "founder_review" if flagged else "validate_final_vote",
            "status": "awaiting_explicit_founder_decision" if flagged
                      else "ready_for_existing_vote_cli",
            "flagged_units": flagged, "voted_digest": mem.digest(voted),
            "only_existing_engine_may_finalize": True}


def submit_checker(store, run_id, source_id, role, actor, result, *,
                   public_release_approval_digest, only_units=None):
    need(role in CHECKER_ROLES, "INVALID_CHECKER_ROLE")
    snap, spec, checks, others = state_of(store, run_id, source_id)
    task = next_task(store, run_id, source_id)
    need(task["status"] == "pending" and task["role"] == role,
         "WRONG_SCIENTIFIC_SUBSTEP")
    need(mem.safe_digest(public_release_approval_digest),
         "PUBLIC_RELEASE_APPROVAL_REQUIRED")
    # A new *independent* checker session, with the same checker model/prompt.
    mem.actor_check(actor)
    need(actor["model"] == spec["checker"]["model"] and actor["session"] is not None,
         "CHECKER_MODEL_OR_SESSION_NOT_PINNED")
    previous_sessions = {s for _, s in checks.values()}
    need(actor["session"] not in previous_sessions,
         "CHECKERS_SHARE_CONTEXT_FORBIDDEN")
    if role == "checker3":
        need(set(only_units or []) == set(task["only_units"]),
             "TIEBREAK_MUST_COVER_EXACT_DISAGREEMENTS")
    else:
        need(only_units is None, "CHECKER1_2_MUST_BE_FULL")
    full = spec["block"]
    validate_f5(result, full, only=only_units)
    payload = {"source_id": source_id, "role": role, "model": spec["checker"],
               "session": actor["session"], "only_units": only_units,
               "input_digest": spec["input_digest"], "result": result}
    artifact = {"schema": "dc-public-artifact-v1",
                "kind": "fidelity_checker",
                "public_release_approval_digest": public_release_approval_digest,
                "payload": payload}
    art_hash = mem.digest(artifact)
    receipt = _receipts(snap["manifest"]["source_revision"],
                        spec["input_digest"], mem.digest(result))
    return store.append(run_id, actor, "fidelity_checkpoint",
                        "evidence:" + source_id + ":" + role,
                        input_digest=spec["input_digest"],
                        output_digest=mem.digest(result),
                        receipt_digest=mem.digest(receipt),
                        artifact_digests=[art_hash], gate="engine_verified",
                        public_artifacts=[artifact], public_receipt=receipt)


def submit_reviewer_result(store, run_id, source_id, role, actor, decisions, *,
                           public_release_approval_digest):
    need(role in {"adjudication", "review"}, "INVALID_STRONGER_REVIEW_ROLE")
    snap, spec, checks, others = state_of(store, run_id, source_id)
    task = next_task(store, run_id, source_id)
    need(task.get("role") == role and task.get("status") == "pending",
         "UNEXPECTED_STRONGER_REVIEW")
    mem.actor_check(actor)
    need(actor["model"] == spec["reviewer"]["model"] and actor["session"],
         "UNPINNED_STRONGER_REVIEWER")
    need(mem.safe_digest(public_release_approval_digest),
         "PUBLIC_RELEASE_APPROVAL_REQUIRED")
    need(isinstance(decisions, dict) and set(decisions) == set(task["units"]),
         "INCOMPLETE_REVIEW_OR_ADJUDICATION")
    if role == "review":
        need(all(isinstance(d, dict) and set(d) == {"agree", "reason"} and
                 type(d["agree"]) is bool and isinstance(d["reason"], str) and
                 bool(d["reason"].strip()) for d in decisions.values()),
             "INVALID_STRONGER_REVIEW")
    else:
        need(all(isinstance(d, dict) and
                 {"verdict", "change_kind", "source_quote", "note"} <= set(d)
                 and d["verdict"] in vp.DES_FID_VERDICTS
                 for d in decisions.values()),
             "INVALID_ADJUDICATION")
    payload = {"source_id": source_id, "role": role, "result": decisions,
               "model": spec["reviewer"], "session": actor["session"]}
    kind = "fidelity_review" if role == "review" else "fidelity_adjudication"
    artifact = {"schema": "dc-public-artifact-v1",
                "kind": kind,
                "public_release_approval_digest": public_release_approval_digest,
                "payload": payload}
    receipt = _receipts(snap["manifest"]["source_revision"],
                        spec["input_digest"], mem.digest(decisions))
    return store.append(run_id, actor, "fidelity_checkpoint",
                        "evidence:" + source_id + ":" + role,
                        input_digest=spec["input_digest"],
                        output_digest=mem.digest(decisions),
                        receipt_digest=mem.digest(receipt),
                        artifact_digests=[mem.digest(artifact)],
                        gate="engine_verified",
                        public_artifacts=[artifact], public_receipt=receipt)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("command", choices=["next", "begin", "checker", "reviewer"])
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--source-id", required=True)
    ap.add_argument("--block", help="Existing des_fidelity_units.py --build output")
    ap.add_argument("--checker-config", help="JSON model preflight")
    ap.add_argument("--reviewer-config", help="JSON stronger model preflight")
    ap.add_argument("--prompt-digest")
    ap.add_argument("--public-release-approval-digest")
    ap.add_argument("--role")
    ap.add_argument("--result", help="Existing scientific engine JSON output")
    ap.add_argument("--only", help="Comma separated mismatch unit IDs")
    ap.add_argument("--actor-family", choices=sorted(mem.FAMILIES), default="other")
    ap.add_argument("--actor-model")
    ap.add_argument("--actor-session")
    args = ap.parse_args()
    try:
        store = mem.RemoteMemory(mem.GithubAPI())
        actor = {"family": args.actor_family,
                 "model": args.actor_model, "session": args.actor_session}
        def file(path):
            return json.loads(Path(path).read_text(encoding="utf-8"))
        if args.command == "next":
            result = next_task(store, args.run_id, args.source_id)
        elif args.command == "begin":
            result = begin_source(store, args.run_id, args.source_id,
                                  file(args.block),
                                  file(args.checker_config),
                                  file(args.reviewer_config), actor,
                                  prompt_digest=args.prompt_digest,
                                  public_release_approval_digest=args.public_release_approval_digest)
        elif args.command == "checker":
            result = submit_checker(store, args.run_id, args.source_id,
                                    args.role, actor, file(args.result),
                                    public_release_approval_digest=args.public_release_approval_digest,
                                    only_units=args.only.split(",") if args.only else None)
        else:
            result = submit_reviewer_result(store, args.run_id, args.source_id,
                                            args.role, actor, file(args.result),
                                            public_release_approval_digest=args.public_release_approval_digest)
        # NOTE next may include original source_text; print only when explicitly
        # requested by the actor in an authorized terminal, never in public CI logs.
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print(json.dumps({"status": "blocked", "reason": str(exc),
                          "execution_authorized": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
