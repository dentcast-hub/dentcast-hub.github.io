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
  hashtag_ref.py --apply BATCH   run one reviewed campaign batch (see below)
  hashtag_ref.py --simulate Q    rank the real tags for a query, as the engine does

BATCH FILES
-----------
Each step of the review campaign is a JSON file under .dentcast/hashtag-batches/
so the decision is recorded, reviewable in the diff, and re-runnable:

  {"type": "photocast",
   "concepts": [ {"tag": "#...", "domain": "clinical",
                  "definition": "...", "use_when": "...",
                  "variants": [], "co_tags": []} ],
   "articles": {"photocast/episode-1": ["#...", "#..."]},
   "renames":  {"#old_form": "#canonical_form"}}

`renames` rewrites a tag everywhere in the brain (used to collapse duplicate
surface forms). `articles` replaces an entry's hashtag list outright, and every
tag it names must exist in the reference once `concepts` is merged in — that
check is the protocol: no tag reaches the brain without a canonical entry.
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


# Field order every concept is written with, so the file stays diffable.
CONCEPT_FIELDS = ("key", "tag", "domain", "words", "definition", "use_when",
                  "variants", "co_tags", "count", "content_ids")


def normalize_concept(c: dict) -> dict:
    """Fill in defaults/derived fields and fix key order."""
    c.setdefault("domain", "clinical")
    c.setdefault("definition", "")
    c.setdefault("use_when", "")
    # variants  = dead surface forms, merged away (share words with the canonical).
    # co_tags   = forms deliberately carried ALONGSIDE it. A lexical matcher scores
    #             a tag only on its own words, so "#کانتکت_باز" and "#تماس_باز"
    #             — no shared word — are two independent doors to one concept, and
    #             collapsing them would delete one of them. Applied together.
    c.setdefault("variants", [])
    c.setdefault("co_tags", [])
    c["key"] = normalize_fa(c["tag"]).replace(" ", "_")
    c["words"] = len(words(c["tag"]))
    c.setdefault("count", 0)
    c.setdefault("content_ids", [])
    return {k: c[k] for k in CONCEPT_FIELDS}


def cmd_apply(path: str) -> None:
    batch = json.loads(Path(path).read_text(encoding="utf-8"))
    ref, brain = load_ref(), load_brain()
    index = by_tag(ref)

    # 1. New canonical concepts.
    added = 0
    for c in batch.get("concepts") or []:
        if c["tag"] in index:
            index[c["tag"]].update({k: v for k, v in c.items() if k != "tag"})
            normalize_concept(index[c["tag"]])
        else:
            fresh = normalize_concept(dict(c))
            ref["concepts"].append(fresh)
            index[c["tag"]] = fresh
            added += 1

    # 2. Global renames (duplicate surface forms collapsing into the canonical).
    renames = batch.get("renames") or {}
    renamed = 0
    for e in brain:
        tags_ = e.get("hashtags")
        if not tags_:
            continue
        new, seen = [], set()
        for t in tags_:
            t2 = renames.get(t, t)
            if t2 != t:
                renamed += 1
            if t2 not in seen:  # a rename can collide with a tag already present
                seen.add(t2)
                new.append(t2)
        e["hashtags"] = new

    # 3. Per-article hashtag lists. Every tag must be canonical by now.
    articles = batch.get("articles") or {}
    unknown = sorted({t for tags_ in articles.values() for t in tags_
                      if t not in index})
    if unknown:
        sys.exit("refusing to apply — these tags have no reference entry:\n  "
                 + "\n  ".join(unknown))

    by_cid = {content_id(e): e for e in brain if content_id(e)}
    touched = 0
    for cid, tags_ in articles.items():
        if cid not in by_cid:
            sys.exit(f"refusing to apply — no brain entry for {cid}")
        by_cid[cid]["hashtags"] = list(tags_)
        touched += 1

    # 4. The batch's type is now fully reviewed, so start enforcing it.
    t = batch.get("type")
    if batch.get("enforce") and t and t not in ref["enforced_types"]:
        ref["enforced_types"].append(t)
        ref["enforced_types"].sort()

    # indent=2 is the brain's existing formatting and round-trips byte-for-byte;
    # anything else would bury a two-article change in a 12k-line diff.
    BRAIN.write_text(json.dumps(brain, ensure_ascii=False, indent=2) + "\n",
                     encoding="utf-8")
    synced = sync_episode_chips(brain)
    if synced:
        print(f"  chips rewritten on {synced} episode page(s).")
    ref["concepts"] = [normalize_concept(c) for c in ref["concepts"]]
    write_ref(ref)
    print(f"Applied {Path(path).name}: +{added} concept(s), "
          f"{renamed} tag rename(s), {touched} article(s) retagged.")
    cmd_sync()


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


# The chip row baked into every episodes/episode-N.html.
EP_TAGS_RE = re.compile(r'(<div class="ep-tags">)(.*?)(</div>)', re.S)


def sync_episode_chips(brain: list) -> int:
    """
    Rewrite the visible #hashtag chips on individual episode pages.

    tools/build_episodes.py regenerates only episodes.html (the listing); the
    per-episode pages carry their chips as literal markup and no builder owns
    them. Without this, retagging an episode leaves the brain and the page
    disagreeing in public - the one desync this campaign could actually ship.
    """
    changed = 0
    for e in brain:
        cid = content_id(e)
        if not cid.startswith("episodes/"):
            continue
        page = ROOT / (cid + ".html")
        if not page.exists():
            continue
        html = page.read_text(encoding="utf-8")
        chips = "".join(f'<span class="ep-hashtag">{t}</span>'
                        for t in e.get("hashtags") or [])
        new, n = EP_TAGS_RE.subn(lambda m: m.group(1) + chips + m.group(3),
                                 html, count=1)
        if n and new != html:
            page.write_text(new, encoding="utf-8")
            changed += 1
    return changed


def cmd_simulate(query: str) -> None:
    """
    Rank the site's real tags for a query exactly the way the engine does, so a
    retagging decision can be checked instead of trusted.

    Mirrors nextRootCatalog: score = fraction of the TAG's words present in the
    query, keep >= 0.5, sort by score then word-rarity (IDF over the tag corpus)
    then fewest articles, then drop any tag bringing no new content. The one
    thing it cannot reproduce is the model's own keyword extraction, so pass the
    phrases a dentist would actually type.
    """
    brain = load_brain()
    tags = brain_tag_map(brain)
    titles = {content_id(e): e.get("title", "") for e in brain}

    df = Counter()
    for t in tags:
        for w in set(words(t)):
            df[w] += 1
    n = len(tags)
    import math
    idf = {w: math.log((n + 1) / (c + 1)) + 1 for w, c in df.items()}

    qwords = set(words(query))
    scored = []
    for t, rec in tags.items():
        tw = words(t)
        if not tw:
            continue
        score = sum(w in qwords for w in tw) / len(tw)
        if score < 0.5:
            continue
        scored.append((score, sum(idf.get(w, 1) for w in tw),
                       -len(rec["content_ids"]), t, rec))
    scored.sort(key=lambda x: (-x[0], -x[1], x[2]))

    covered, rank = set(), 0
    print(f"query: {query}\nwords: {sorted(qwords)}\n")
    for score, spec, negn, t, rec in scored:
        if rank >= 10:
            break
        if not any(c not in covered for c in rec["content_ids"]):
            continue
        covered.update(rec["content_ids"])
        rank += 1
        head = rec["content_ids"][0]
        print(f"{rank:2d}. {t}   score={score:.2f} specificity={spec:.1f} "
              f"articles={-negn}")
        print(f"     -> {head}  {titles.get(head, '')[:60]}")
    if not rank:
        print("(nothing cleared the 0.5 threshold — falls back to the pillar tree)")


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
    g.add_argument("--apply", metavar="BATCH")
    g.add_argument("--simulate", metavar="QUERY")
    a = p.parse_args()

    if a.seed:
        cmd_seed()
    elif a.sync:
        cmd_sync()
    elif a.check:
        cmd_check()
    elif a.apply:
        cmd_apply(a.apply)
    elif a.simulate:
        cmd_simulate(a.simulate)
    elif a.words is not None:
        print(words(a.words))
    else:
        cmd_backlog(a.backlog or None)


if __name__ == "__main__":
    main()
