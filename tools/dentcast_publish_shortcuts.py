"""Bookkeeping the handoff tool does itself, so the agent does not hand-write it.

`start`  the handoff from four facts (no input JSON to compose);
`note`   one decision, approval or pending question (no whole-publication JSON);
`close`  everything C.6 needs, read from the ledger and the files: the title and caption
         approvals (the brain entry), the lead provenance and the ten-scope editorial lock,
         then completes C.6. Nothing here invents a judgment: every scope's evidence is the
         evidence already recorded on the steps that settled it.
Steps a category never runs (LiteCast-only, NoteCast-only, Promptologist-only, the
glossary-publish back-link) are skipped by `advance` itself with their canonical reason.
"""
import copy
import json
import re
from pathlib import Path

import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lifecycle

# step id -> (categories that run it, canonical skip reason for every other category)
CATEGORY_ONLY = {
    **{s: (("litecast",), "LiteCast-only step") for s in ("C.0.1", "C.0.2", "C.0.3", "C.0.4", "C.0.5", "C.0.6")},
    "C.4.5": (("notecast",), "NoteCast-only step"),
    "C.4.5-b": (("notecast",), "NoteCast-only credit step"),
    "C.4.6": (("promptologist",), "Promptologist-only step"),
    "C.4.7-b": (("glossary",), "glossary-publish-only back-link step"),
}

SCOPE_STEPS = {
    "scientific": ("C.4.13",), "challenge": ("C.4.14",), "taxonomy": ("C.2.4",),
    "links": ("C.4.7", "C.4.8", "C.4.9"), "hashtags": ("C.5.0",), "content_record": ("C.5",),
    "pathways": ("C.5.6", "C.5.6-b"),
}


FACTS = "intake_facts_v1"
FACT_ROWS = {"C.4.10.1": ("attached_paper", "no attached paper (Question 4.7)"),
             "C.4.10.2": ("attached_paper", "no attached paper (Question 4.7)"),
             "C.4.10.3": ("attached_paper", "no attached paper (Question 4.7)"),
             "C.4.14": ("challenge", "ordinary post, not a Challenge (Question 4.9)")}


def auto_skip(publication):
    """(step id, reason) for the next step when this publication never runs it, else None:
    a row of another category, or a paper/Challenge row the intake facts answered «no»."""
    sid = h.next_step(publication)
    if sid is None:
        return None
    row = next(s for s in publication["steps"] if s["id"] == sid)
    if row["status"] != "pending":
        return None
    if sid in CATEGORY_ONLY:
        cats, reason = CATEGORY_ONLY[sid]
        return None if h.publication_category(publication) in cats else (sid, reason)
    if sid in FACT_ROWS:
        facts = next((d for d in publication["context"]["decisions"]
                      if isinstance(d, dict) and d.get("kind") == FACTS), {})
        key, reason = FACT_ROWS[sid]
        return (sid, reason) if facts.get(key) == "no" else None
    return None


def start_input(content_id, category, target_paths, attached_paper=None, challenge=None):
    facts = {k: v for k, v in (("attached_paper", attached_paper), ("challenge", challenge)) if v in ("yes", "no")}
    return {"content_id": content_id, "category": category, "target_paths": sorted(set(target_paths)),
            "status": "in_progress", "blocker": None,
            "context": {"inputs": [], "decisions": [{"kind": FACTS, **facts}] if facts else [],
                        "approvals": [], "pending_questions": [],
                        "validation": [], "delivery": [], "unrelated_changes": []},
            "steps": lifecycle.plan(), "external_actions": []}


def note(root, expected, decision=None, approval=None, pending=None, clear_pending=False, add_paths=(), text=None):
    state, digest = h.load_state(root)
    p = copy.deepcopy(state["publication"])
    c = p["context"]
    if decision:
        c["decisions"].append(decision)
    if approval:
        c["approvals"] = [a for a in c["approvals"] if a.get("scope") != approval.get("scope")] + [approval]
    if pending:
        c["pending_questions"].append(pending)
    if clear_pending:
        c["pending_questions"] = []
    if add_paths:
        p["target_paths"] = sorted(set(p["target_paths"]) | set(add_paths))
    return h.save(root, p, expected=expected or digest, note=text or "note recorded with the handoff tool")


def brain_entry(root, content_id):
    url = "/" + content_id + ".html"
    for e in json.loads((root / "dentcast-brain.json").read_text(encoding="utf-8")):
        if (e.get("url") or e.get("page_url")) == url:
            return e
    raise h.Blocked("CLOSE_NEEDS_THE_BRAIN_ENTRY: no dentcast-brain.json entry with url " + url + " (step 5)")


def fidelity_gate(decisions, fidelity):
    """Founder, 2026-11-27: below a full Fidelity match the publication waits (M3b) until
    every sentence founder_report() lists has his answer, recorded as a decision
    {"kind": "fidelity_founder_decision_v1", "units": [...], "answer": "..."}."""
    import des_fidelity_units as fu  # noqa: PLC0415
    flagged = fu.founder_report(fidelity)
    answered = {u for d in decisions if d.get("kind") == "fidelity_founder_decision_v1"
                for u in d.get("units") or []}
    missing = [f"{u} «{q[:60]}» ({w})" for u, q, w in flagged if u not in answered]
    h.require(not missing, "FIDELITY_FOUNDER_DECISION_REQUIRED: send message M3b and record his answer as "
              'note --decision \'{"kind":"fidelity_founder_decision_v1","units":[…],"answer":"…"}\' for: '
              + "; ".join(missing))
    return flagged


def close(root, expected, lead, lead_ref=None, title_from="founder", caption_from="agent"):
    state, digest = h.load_state(root)
    p = copy.deepcopy(state["publication"])
    rows = {s["id"]: s for s in p["steps"]}
    h.require(h.next_step(p) == "C.6", "CLOSE_ONLY_AT_C6: finish the steps before C.6 first (next: " + str(h.next_step(p)) + ")")
    h.require(not p["context"]["pending_questions"], "DELIVERY_PENDING_QUESTIONS")
    cid = p["content_id"]
    import des_fidelity_units as fu  # noqa: PLC0415
    flagged = fidelity_gate(p["context"]["decisions"], fu.stored_fidelity(cid))
    entry = brain_entry(root, cid)
    litecast = h.publication_category(p) == "litecast"
    challenge = rows.get("C.4.14", {}).get("status") == "completed"
    # Hard Rule 12 (founder, 2026-11-27): a new publication ships Persian-only.
    # An English page exists only when one was authored on purpose; then it is locked as before.
    en_path = None if (litecast or challenge) else cid.rsplit("/", 1)[0] + "/en/" + cid.rsplit("/", 1)[1] + ".html"
    if en_path and not (root / en_path).is_file():
        en_path = None
    fa_file = root / (cid + ".html")
    if en_path is None and fa_file.is_file():
        h.require(not re.search(r'class="[^"]*\blang-btn\b', fa_file.read_text(encoding="utf-8")),
                  "CLOSE_LANG_TOGGLE_WITHOUT_ENGLISH: " + cid + ".html carries a .lang-btn toggle but no English "
                  "page exists; replace the toggle with <!-- dc-lang-toggle:off --> (Hard Rule 12)")
    des_row = rows.get("C.4.13") or {}
    if des_row.get("status") == "skipped" and not (litecast or challenge):
        # A skipped DES passes only with the founder's recorded, page-bound exemption
        # (module 08; verify_publish row «4.13 DES»): refuse here, before Push 2.
        ex = root / ".dentcast/des-exemptions.json"
        reg = json.loads(ex.read_text(encoding="utf-8")) if ex.is_file() else {}
        h.require(isinstance(reg, dict) and isinstance(reg.get(cid), dict),
                  "CLOSE_DES_SKIPPED_WITHOUT_EXEMPTION: C.4.13 is skipped but .dentcast/des-exemptions.json has no "
                  "entry for " + cid + "; run step 4.13 or record the founder's scoped exemption (module 08)")
    if en_path:
        p["target_paths"] = sorted(set(p["target_paths"]) | {en_path})
    index = (root / "index.html").read_text(encoding="utf-8")
    a = index.find('<ul class="dc-pulse-list">')
    first = index[a:index.find("</li>", a)] if a >= 0 else ""
    pulse_ok = ("/" + cid + ".html") in first

    def scope(name):
        if name == "pulse":
            if h.publication_category(p) == "glossary":
                return {"scope": name, "status": "not_applicable", "evidence": ["glossary terms are not announced in Pulse"]}
            h.require(pulse_ok or litecast, "CLOSE_PULSE_LINE_MISSING: the first Pulse line of index.html does not link "
                      "/" + cid + ".html (module 11, step 6)")
            return {"scope": name, "status": "resolved" if pulse_ok else "not_applicable",
                    "evidence": ["first Pulse line of index.html links /" + cid + ".html" if pulse_ok
                                 else "LiteCast follows its own Pulse convention"]}
        if name == "english":
            return {"scope": name, "status": "resolved" if en_path else "not_applicable",
                    "evidence": [en_path + " on disk" if en_path else "no English page (Hard Rule 12)"]}
        if name == "author_approvals":
            return {"scope": name, "status": "resolved", "evidence": ["pending_questions empty; founder answers recorded as decisions"]}
        ev, skipped = [], []
        for sid in SCOPE_STEPS[name]:
            r = rows.get(sid)
            if not r:
                continue
            h.require(r["status"] in ("completed", "skipped"), "CLOSE_STEP_NOT_RESOLVED: " + sid)
            if r["status"] == "completed":
                ev += [sid + ": " + x for x in r["evidence"]]
            else:
                skipped.append(sid + " skipped: " + str(r["reason"]))
        return {"scope": name, "status": "resolved" if ev else "not_applicable", "evidence": ev or skipped}

    c = p["context"]
    c["decisions"] = [d for d in c["decisions"] if not (isinstance(d, dict) and d.get("kind") in (
        "second_cut_editorial_lock_v1", "first_cut_lead_provenance_v1"))]
    c["decisions"].append({"kind": "first_cut_lead_provenance_v1", "origin": lead,
                           "source_ref": lead_ref or {"author_original": "the founder's own first paragraph (intake text)",
                                                      "agent_authored": "lead paragraph written by the agent (module 03)",
                                                      "not_applicable": "no lead paragraph on this page type"}[lead],
                           "evidence": ["first paragraph of " + cid + ".html"]})
    src = {"founder": "founder-supplied, copied verbatim (Hard Rule 16)",
           "agent": "agent proposal under standing acceptance (Hard Rule 14)"}
    keep = [x for x in c["approvals"] if x.get("scope") not in ("title", "caption")]
    c["approvals"] = keep + [
        {"scope": "title", "decision": entry.get("title", ""), "status": "confirmed", "evidence": [src[title_from]]},
        {"scope": "caption", "decision": entry.get("caption", ""), "status": "confirmed", "evidence": [src[caption_from]]}]
    if lead == "agent_authored" and not any(x.get("scope") == "authored-intro" for x in c["approvals"]):
        c["approvals"].append({"scope": "authored-intro", "decision": "agent-authored lead kept", "status": "confirmed",
                               "evidence": [src["agent"]]})
    order = ("scientific", "challenge", "taxonomy", "links", "hashtags", "content_record", "pathways", "pulse",
             "english", "author_approvals")
    c["decisions"].append({"kind": "second_cut_editorial_lock_v1", "scopes": [scope(n) for n in order],
                           "english": {"status": "ready" if en_path else "exempt", "path": en_path,
                                       "evidence": [en_path + " on disk, toggles wired" if en_path else "no English page (Hard Rule 12)"]},
                           "evidence": ["built by `close` from the ledger evidence of the steps through C.5.6-b"]})
    saved = h.save(root, p, expected=expected or digest, note="C.6 close: approvals, lead provenance and editorial lock built from the ledger")
    c6 = rows["C.6"]
    if c6["status"] == "pending":
        saved = lifecycle.step(root, saved["sha256"], "C.6", "started", [], None, "C.6 opened by close")
    done = lifecycle.advance(root, saved["sha256"], "C.6", ["C.6: Pulse line and the ten-scope lock (built by close)"],
                             (), False, "C.6 closed by the tool")
    done["next_action"] = "stage-delivery --path <each scoped path>, then one commit and one push (Push 2); then stop"
    done["fidelity_report"] = [f"{u}: «{q}» — {w}" for u, q, w in flagged]
    if flagged:
        done["next_action"] += "; the Push-2 report repeats each fidelity_report line with the founder's answer"
    return done
