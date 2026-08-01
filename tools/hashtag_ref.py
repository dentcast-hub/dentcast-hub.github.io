#!/usr/bin/env python3
"""
Maintain dentcast-hashtag-reference.json — the canonical vocabulary of the
site's #hashtags.

WHY THIS FILE EXISTS
--------------------
The case-assistant does not do semantic search. It asks the model for at most
4 short Persian phrases (1-3 words each), then matches those AGAINST THE REAL
SITE TAGS purely lexically: a tag scores the fraction of ITS OWN words that
appear among the suggestions, must clear 0.5, and ties break toward rarer
words (IDF over the tag corpus). See plus-api/src/services/case-assistant.ts.

That means a concept is only reachable through the exact WORDS of some tag.
Until now the publishing workflow invented tags per article with nothing to
check them against, so ~75% of site tags are used exactly once and the same
concept fragments across near-identical forms (#روکش_افتاده / #افتادن_روکش /
#شل_شدن_روکش — three tags, three articles, one concept). This file is the
single canonical vocabulary those forms collapse into, and the publishing
protocol reads it before proposing any tag.

DIVISION OF TRUTH
-----------------
  reference  owns the VOCABULARY  — which forms are legal, what each means.
  brain      owns the ASSIGNMENT  — which article carries which tag.

`content_ids`/`count` on each concept are therefore DERIVED: --sync recomputes
them from the brain and they must never be hand-edited. Everything else
(key/tag/domain/definition/use_when/variants) is a human decision.

USAGE
  hashtag_ref.py --seed          create the file from tags already used >= 2x
  hashtag_ref.py --sync          recompute content_ids/count from the brain
  hashtag_ref.py --check         validate (enforced types only); exit 1 on error
  hashtag_ref.py --backlog       tags in the brain that the reference lacks
  hashtag_ref.py --words TAG     show how the assistant tokenizes a tag
"""

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAIN = ROOT / "dentcast-brain.json"
REF = ROOT / "dentcast-hashtag-reference.json"

# --- tokenizer: a faithful port of case-assistant.ts's normalizeFa()/words() --
# Any drift here makes the reference lie about what the engine will actually
# match, so keep these two in lockstep.

ZERO_WIDTH = re.compile("[‌‎‏]")
NON_WORD = re.compile(r"[^\w\s]", re.UNICODE)

# Same list as STOPWORDS in case-assistant.ts.
STOPWORDS = {
    "و", "یا", "با", "بی", "در", "به", "از", "که", "را", "تا",
    "برای", "روی", "یک", "این", "آن",
}


def normalize_fa(s: str) -> str:
    s = ZERO_WIDTH.sub(" ", s)
    s = s.replace("ك", "ک").replace("ي", "ی")
    s = s.replace("#", " ").replace("_", " ")
    s = s.lower()
    # JS uses \p{L}\p{N}; Python's \w is close but also keeps "_", already gone.
    s = "".join(
        ch if (unicodedata.category(ch)[0] in ("L", "N") or ch.isspace()) else " "
        for ch in s
    )
    return re.sub(r"\s+", " ", s).strip()


def words(s: str) -> list:
    return [w for w in normalize_fa(s).split(" ") if w and w not in STOPWORDS]


# --- brain access ------------------------------------------------------------

def load_brain() -> list:
    return json.loads(BRAIN.read_text(encoding="utf-8"))


def entry_type(e: dict) -> str:
    """The campaign unit. Episodes are the one type with no `type` field."""
    return e.get("type") or "episodes"


def content_id(e: dict) -> str:
    url = e.get("page_url") or e.get("url") or ""
    return url.strip("/").removesuffix(".html")


def brain_tag_map(brain: list):
    """tag -> {content_ids, types} across the whole brain."""
    out = defaultdict(lambda: {"content_ids": [], "types": Counter()})
    for e in brain:
        cid = content_id(e)
        if not cid:
            continue
        for t in e.get("hashtags") or []:
            rec = out[t]
            if cid not in rec["content_ids"]:
                rec["content_ids"].append(cid)
            rec["types"][entry_type(e)] += 1
    return out


# --- reference access --------------------------------------------------------

def load_ref() -> dict:
    if not REF.exists():
        sys.exit(f"{REF.name} not found — run --seed first.")
    return json.loads(REF.read_text(encoding="utf-8"))


def write_ref(ref: dict) -> None:
    # Concepts stay sorted by count then key so diffs stay readable as the
    # campaign walks folder by folder.
    ref["concepts"].sort(key=lambda c: (-c.get("count", 0), c["key"]))
    REF.write_text(
        json.dumps(ref, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )


def by_tag(ref: dict) -> dict:
    return {c["tag"]: c for c in ref["concepts"]}


# --- commands ----------------------------------------------------------------

SEED_MIN_USES = 2  # two articles independently choosing a form IS the consensus


def cmd_seed() -> None:
    if REF.exists():
        sys.exit(f"{REF.name} already exists — refusing to overwrite. Use --sync.")

    brain = load_brain()
    tags = brain_tag_map(brain)
    type_totals = Counter(entry_type(e) for e in brain)

    concepts = []
    for tag, rec in tags.items():
        n = len(rec["content_ids"])
        if n < SEED_MIN_USES:
            continue  # singletons are the campaign's work, not settled vocabulary
        concepts.append({
            "key": normalize_fa(tag).replace(" ", "_"),
            "tag": tag,
            "domain": "brand" if tag in BRAND_TAGS
                      else guess_domain(rec, type_totals),
            "words": len(words(tag)),
            # Written by the campaign when the concept's folder is reached. A
            # seeded form is canonical because 2+ articles already chose it;
            # its written meaning accrues later. Never invent one.
            "definition": "",
            "use_when": "",
            "variants": [],
            "count": n,
            "content_ids": rec["content_ids"],
        })

    ref = {
        "version": 1,
        "about": (
            "Canonical hashtag vocabulary for DentCast. The reference owns the "
            "vocabulary; dentcast-brain.json owns the assignment. `count` and "
            "`content_ids` are derived — run tools/hashtag_ref.py --sync."
        ),
        # Types whose hashtags must already be fully covered by this file.
        # A type joins this list when the campaign finishes its folder; --check
        # only enforces what is listed here, so pending folders never block a
        # commit.
        "enforced_types": [],
        "concepts": concepts,
    }
    write_ref(ref)
    print(f"Seeded {REF.name}: {len(concepts)} canonical concepts "
          f"(tags used >= {SEED_MIN_USES}x), "
          f"{len(tags) - len(concepts)} singleton tags left as backlog.")


# The site's own series/format names. These label the CONTAINER, not a clinical
# concept, so they must never be offered as the answer to a clinical question.
# Enumerated by hand rather than inferred: a coverage heuristic cannot tell
# "#پرامپتولوژیست" (a series) from "#مدل_زبانی" (a real concept that happens to
# appear only inside that series), and it mislabelled exactly those.
BRAND_TAGS = {
    "#دنتکست", "#دنتکست_پلاس", "#متانوت", "#فوتوکست", "#اینسایت", "#چیرساید",
    "#Share_Hub", "#DentAI", "#پرامپتولوژیست", "#دنتوپدیا", "#اسلایدکست",
}


def guess_domain(rec: dict, type_totals: Counter) -> str:
    """
    Coarse first pass, corrected per folder as the campaign reaches it.
    Anything confined to the promptologist series is AI vocabulary; the rest is
    clinical until a folder pass says otherwise.
    """
    del type_totals  # kept for signature stability; brand is an explicit list
    types = rec["types"]
    top, top_n = types.most_common(1)[0]
    if top == "promptologist" and top_n == sum(types.values()):
        return "ai"
    return "clinical"


def cmd_sync() -> None:
    ref = load_ref()
    tags = brain_tag_map(load_brain())
    changed = 0
    for c in ref["concepts"]:
        rec = tags.get(c["tag"])
        cids = rec["content_ids"] if rec else []
        if c.get("content_ids") != cids or c.get("count") != len(cids):
            c["content_ids"] = cids
            c["count"] = len(cids)
            changed += 1
        c["words"] = len(words(c["tag"]))
    write_ref(ref)
    print(f"Synced {len(ref['concepts'])} concepts from the brain "
          f"({changed} updated).")


def cmd_backlog(only_type: str | None) -> None:
    ref, brain = load_ref(), load_brain()
    known = set(by_tag(ref))
    missing = Counter()
    where = defaultdict(set)
    for e in brain:
        t = entry_type(e)
        if only_type and t != only_type:
            continue
        for tag in e.get("hashtags") or []:
            if tag not in known:
                missing[tag] += 1
                where[tag].add(t)
    scope = only_type or "all types"
    print(f"Backlog for {scope}: {len(missing)} tags not yet in the reference.")
    for tag, n in missing.most_common():
        print(f"  {n:3d}  {tag}   [{', '.join(sorted(where[tag]))}]")


def cmd_check() -> None:
    ref, brain = load_ref(), load_brain()
    enforced = set(ref.get("enforced_types") or [])
    if not enforced:
        print("check: no enforced types yet — nothing to validate.")
        return

    known = by_tag(ref)
    errors = []
    for e in brain:
        t = entry_type(e)
        if t not in enforced:
            continue
        for tag in e.get("hashtags") or []:
            if tag not in known:
                errors.append(f"{content_id(e)}: {tag} is not in the reference")

    # A variant must not also be live in the brain: that is the fragmentation
    # the reference exists to prevent, reappearing.
    live = {tag for e in brain for tag in (e.get("hashtags") or [])}
    for c in ref["concepts"]:
        for v in c.get("variants") or []:
            if v in live:
                errors.append(f"{v} is a recorded variant of {c['tag']} "
                              f"but is still used in the brain")

    if errors:
        print(f"check FAILED ({len(errors)} problem(s)) "
              f"in enforced types: {', '.join(sorted(enforced))}", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)
    print(f"check OK — enforced types ({', '.join(sorted(enforced))}) "
          f"carry only canonical tags.")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--seed", action="store_true")
    g.add_argument("--sync", action="store_true")
    g.add_argument("--check", action="store_true")
    g.add_argument("--backlog", nargs="?", const="", metavar="TYPE")
    g.add_argument("--words", metavar="TAG")
    a = p.parse_args()

    if a.seed:
        cmd_seed()
    elif a.sync:
        cmd_sync()
    elif a.check:
        cmd_check()
    elif a.words is not None:
        print(words(a.words))
    else:
        cmd_backlog(a.backlog or None)


if __name__ == "__main__":
    main()
