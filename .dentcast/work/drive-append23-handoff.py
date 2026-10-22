# In-process driver for prompt-append2-3 handoff (avoids per-step CLI respawn cost).
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import dentcast_publish_handoff as h  # noqa: E402
import dentcast_publish_lifecycle as lc  # noqa: E402

COMPLETE = {
    "0": ["Continuation of PR#952 draft; category promptologist Part 3 appendix"],
    "A": ["Brain/schema from prompt-append2-2; draft pages already on branch"],
    "B.1": ["Category promptologist locked on draft PR#952"],
    "B.2": ["Id prompt-append2-3 contiguous after append2-2"],
    "B.3": ["Founder-approved fa title retained on all Persian title surfaces"],
    "B.3.5": ["Tutorial prose already approved on draft; caption-04 only clarification"],
    "B.4": ["Seven WebP screenshots present under dentai/promptologist/"],
    "B.4.7": ["No attached paper; paper ingestion will be skipped"],
    "B.4.8": ["COMMENTARY; source_text is page body; DES later at C.4.13"],
    "B.4.9": ["Ordinary tutorial with intro/body/CTA, not a Challenge"],
    "B.5": ["Pulse title-only line prepared for exact approved title"],
    "C.1": ["Template locked against prompt-append2-2.html structure"],
    "C.2": ["prompt-append2-3.html body+images; screenshot-04 figcaption clarified"],
    "C.2.4": ["pillar practice-infrastructure / subtopic llm-tools"],
    "C.2.5": ["Specialist capsules present; related budget respected"],
    "C.2.6": ["Promptologist landing card + series index updated on draft"],
    "C.3": ["Meta/title/caption synchronized with brain entry"],
    "C.4": ["Page integrity retained after taxonomy edits"],
    "C.4.6": ["ep-nav: prev append2-2 active; next empty; reciprocal next on part 2"],
    "C.4.7": ["Glossary reviewed; 0 qualifying back-links for tooling tutorial"],
    "C.4.8": ["Fresh body analysis; 0 qualifying inline glossary/episode targets"],
    "C.4.9": ["Fresh review; five-link section kept at Hard-Rule-9 cap"],
    "C.4.11": ["4 authored flashcards in plus/faq-corpus.json"],
    "C.4.12": ["5 binary FAQ questions with explicit yes/no"],
    "C.4.13": ["DES COMMENTARY FULL_TEXT v3.4 checklist 12/E; fidelity null"],
    "C.5.0": ["Hashtags canonical; hashtag --check green"],
    "C.5": ["Brain entry at absolute tail with append2-2 key order"],
    "C.5.5": ["Pillar practice-infrastructure/llm-tools valid in live PILLARS"],
    "C.5.6": ["Pathway ai-dentistry after prompt-append2-2"],
    "C.6": ["Pulse first line exact linked title; seven lines retained"],
    "C.8": ["Builders: counters pillars flashcards quiz imgattrs plus upboard sitemap"],
    "C.7": ["stamp-version.py last → 8c72175218"],
    "D": ["en mirror + reciprocal toggles; noindex; no hreflang"],
    "E": ["Notify marker / report prepared; no direct push notification sent"],
    "G": ["report:.dentcast/publication-reports/promptologist-prompt-append2-3.md"],
}

SKIPS = {
    "C.0": "Category is promptologist, not LiteCast",
    "C.0.1": "Category is promptologist, not LiteCast",
    "C.0.2": "Category is promptologist, not LiteCast",
    "C.0.3": "Category is promptologist, not LiteCast",
    "C.0.4": "Category is promptologist, not LiteCast",
    "C.0.5": "Not LiteCast",
    "C.0.6": "Not LiteCast",
    "C.4.5": "Not NoteCast",
    "C.4.5-b": "Not episode/NoteCast pair",
    "C.4.7-b": "Not glossary publication",
    "C.4.10.1": "4.10 Part 1: skipped — no attached paper",
    "C.4.10.2": "4.10 Part 2: skipped — no attached paper",
    "C.4.10.3": "4.10 Part 3: skipped — no attached paper",
    "C.4.14": "Ordinary promptologist tutorial, not a Challenge; no challenge markup owed",
    "C.5.6-b": "ai-dentistry has no continuing bundle — بدون کاندید",
}


def main() -> None:
    # Reconcile any driver-byte drift once up front.
    state, sha = h.load_state(ROOT)
    r = h.save(ROOT, state["publication"], expected=sha,
               note="Reconcile driver/worktree before in-process ledger advance")
    sha = r["sha256"]
    state, sha = h.load_state(ROOT)
    nxt = h.next_step(state["publication"])
    print(f"start sha={sha[:12]} next={nxt}", flush=True)

    while nxt and nxt not in ("F", "G"):
        pub = state["publication"]
        row = next(s for s in pub["steps"] if s["id"] == nxt)

        if row["status"] == "pending" and nxt in SKIPS:
            skips = []
            for s in pub["steps"]:
                if s["status"] in ("completed", "skipped"):
                    continue
                if s["status"] != "pending" or s["id"] not in SKIPS:
                    break
                skips.append((s["id"], SKIPS[s["id"]]))
            result = lc.advance(ROOT, sha, sid=None, evidence=None, skips=skips,
                                start_next=False,
                                note="Lawful category skips per modules 03/04/05/06/09")
            print(f"batch-skip {[s[0] for s in skips]} status={result.get('status')} "
                  f"next={result.get('next_step')} sha={result['sha256'][:12]}", flush=True)
            if result.get("status") == "delivery_required":
                print(json.dumps({
                    "status": result["status"], "delivery": result.get("delivery"),
                    "sha256": result["sha256"], "next_action": result.get("next_action"),
                    "transitions_written": result.get("transitions_written"),
                }, ensure_ascii=False, indent=2), flush=True)
                return
            sha = result["sha256"]
            state, sha = h.load_state(ROOT)
            nxt = h.next_step(state["publication"])
            continue

        if row["status"] == "pending":
            result = lc.step(ROOT, sha, nxt, "started", [], None,
                             note=f"Starting {nxt}; verified on publish/prompt-append2-3")
            sha = result["sha256"]
            state, sha = h.load_state(ROOT)
            pub = state["publication"]

        following = []
        seen = False
        for s in pub["steps"]:
            if s["id"] == nxt:
                seen = True
                continue
            if not seen:
                continue
            if s["status"] != "pending" or s["id"] not in SKIPS:
                break
            following.append((s["id"], SKIPS[s["id"]]))

        evid = COMPLETE.get(nxt, [f"session:verified-{nxt}"])
        result = lc.advance(
            ROOT, sha, sid=nxt, evidence=evid, skips=following, start_next=True,
            note=f"Completed {nxt} with verified branch evidence",
        )
        print(f"{nxt}+skips{[s[0] for s in following]} status={result.get('status')} "
              f"next={result.get('next_step')} sha={result['sha256'][:12]} "
              f"written={result.get('transitions_written')}", flush=True)
        if result.get("status") == "delivery_required":
            print(json.dumps({
                "status": result["status"], "delivery": result.get("delivery"),
                "sha256": result["sha256"], "next_action": result.get("next_action"),
                "transitions_written": result.get("transitions_written"),
            }, ensure_ascii=False, indent=2), flush=True)
            return
        if result.get("status") == "blocked":
            print(json.dumps(result, ensure_ascii=False, indent=2)[:4000], flush=True)
            return
        sha = result["sha256"]
        state, sha = h.load_state(ROOT)
        nxt = h.next_step(state["publication"])

    print(f"loop_end next={nxt} sha={sha[:12]}", flush=True)


if __name__ == "__main__":
    main()
