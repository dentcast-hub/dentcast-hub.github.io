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
(key/tag/domain/definition/use_when/aliases/variants/co_tags) is a human decision.

USAGE
  hashtag_ref.py --seed          create the file from tags already used >= 2x
  hashtag_ref.py --sync          recompute content_ids/count from the brain
  hashtag_ref.py --check         validate (enforced types only); exit 1 on error
  hashtag_ref.py --backlog       tags in the brain that the reference lacks
  hashtag_ref.py --words TAG     show how the assistant tokenizes a tag
  hashtag_ref.py --apply BATCH   run one reviewed campaign batch (see below)
  hashtag_ref.py --simulate Q    rank the real tags for a query, as the engine does
  hashtag_ref.py --say TAG F...  record other ways dentists write/say one tag

SPELLINGS A DENTIST ACTUALLY USES
---------------------------------
The matcher compares words literally, so "بیومیمتیک", "بایومیمتیک" and
"بایو میمتیک" are three unrelated tokens and two of the three miss. Each concept
therefore carries an `aliases` list of every other form the same thing is
written or said in, kept ON the concept so whoever adds one has the definition
in front of them:

  hashtag_ref.py --say "#بیومیمتیک" "بایو میمتیک" "بایومیمتیک"

--sync compiles them all into the file's top-level `aliases` table, which is
what the tokenizer here and case-assistant.ts both read (via
plus/content-index.json). Adding a spelling is a data edit, never a code change.

An alias is a substitution over the whole normalized string, so a careless one
is destructive - aliasing "سیگار" to "دخانیات" would rewrite the unrelated tag
#بیمار_سیگاری into "بیمار دخانیات". compile_aliases() refuses any alias that is
a word of, or a substring of, a DIFFERENT concept, and reports it instead.

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


# Orthography that the same person writes two ways. These are NOT synonyms and
# NOT variants-to-merge: they are one word, spelled differently, and the
# tokenizer would otherwise treat them as unrelated. Applied to BOTH the tag and
# the query, so either spelling reaches the same tag without duplicating it on
# every article and without distorting IDF. Phrase-level, not word-level,
# because "بایو میمتیک" written with a space is two tokens that must collapse
# into the one token "بیومیمتیک". Longest pattern first so a prefix cannot win.
def _aliases():
    try:
        raw = json.loads(REF.read_text(encoding="utf-8")).get("aliases") or {}
    except Exception:
        return []
    return sorted(raw.items(), key=lambda kv: -len(kv[0]))


_alias_cache = None
_alias_index_cache = None


def _reset_index():
    global _alias_index_cache
    _alias_index_cache = None


def _alias_index():
    """
    Aliases bucketed by their FIRST token, longest pattern first inside each
    bucket. Scanning all ~250 patterns at every token position is O(tokens x
    patterns) and made the two benchmark harnesses take minutes; the bucket
    turns the inner loop into a handful of candidates.
    """
    global _alias_index_cache
    if _alias_index_cache is None:
        buckets = {}
        for bad, good in (_alias_cache or []):
            parts = bad.split(" ")
            if parts and parts[0]:
                buckets.setdefault(parts[0], []).append((parts, good.split(" ")))
        for v in buckets.values():
            v.sort(key=lambda pg: -len(pg[0]))
        _alias_index_cache = buckets
    return _alias_index_cache


def apply_aliases(s: str) -> str:
    """
    Substitute on WHOLE words only.

    Two things this must not do, both learned the hard way.

    It must not cut into a word: "سیگار" -> "دخانیات" applied blindly turns the
    unrelated "بیمار سیگاری" into "بیمار دخانیاتی", and "implant" -> "ایمپلنت"
    would maul "peri implantitis". Matching whole token runs prevents that.

    And it must not rescan its own output. Repeated replacement hangs forever on
    an alias whose replacement contains its own pattern - "پروگنوز" ->
    "پروگنوز دندان" rewrites itself without end. One left-to-right pass that
    emits past the cursor terminates by construction.
    """
    global _alias_cache
    if _alias_cache is None:
        _alias_cache = _aliases()
        _reset_index()
    if not _alias_cache:
        return s
    index = _alias_index()
    toks = s.split(" ")
    out, i = [], 0
    while i < len(toks):
        hit = None
        for parts, good in index.get(toks[i], ()):   # longest pattern first
            if toks[i:i + len(parts)] == parts:
                hit = (len(parts), good)
                break
        if hit:
            out.extend(hit[1])
            i += hit[0]
        else:
            out.append(toks[i])
            i += 1
    return " ".join(out)


def normalize_chars(s: str) -> str:
    """Character-level normalization only, WITHOUT the alias table.

    compile_aliases must use this: running an alias through the full pipeline
    folds it into its own canonical form ("implant" -> "ایمپلنت"), the result
    equals the target, and the entry is dropped as redundant — a table that
    quietly erases itself.
    """
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


def normalize_fa(s: str) -> str:
    return apply_aliases(normalize_chars(s))


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
            "key": normalize_chars(tag).replace(" ", "_"),
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
                  "aliases", "variants", "co_tags", "count", "content_ids")


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
    # Every other way a dentist writes or says THIS concept. Authored here, on
    # the concept itself, so the person adding them has the definition in front
    # of them; --sync compiles all of them into the file's top-level `aliases`
    # table, which is what the tokenizer and the API actually read.
    c.setdefault("aliases", [])
    c.setdefault("variants", [])
    c.setdefault("co_tags", [])
    # normalize_CHARS, not normalize_fa: the key is an IDENTITY, so it must not
    # be run through the alias table. It was, and a concept whose own alias
    # pointed back into its target grew a token per --sync until
    # #دکتر_شهابیان had a 36-word key. compile_aliases() derives each alias's
    # target from this key, so an alias-free key also lets the self-reference
    # guard see the real target and reject that alias outright.
    c["key"] = normalize_chars(c["tag"]).replace(" ", "_")
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

    # The reference has to follow the rename, not just the brain. Without this a
    # renamed form is left behind as a count=0 orphan while its replacement has
    # no entry at all - the reference would then be describing a vocabulary the
    # site no longer uses. Re-listing an already-applied rename is a harmless
    # no-op on the brain and repairs the reference.
    # The batch's own new concepts bring their own aliases, and those have to be
    # live BEFORE the door-check below runs - otherwise a rename the batch
    # deliberately covered with an alias is rejected for lacking one.
    global _alias_cache
    table, _ = compile_aliases(ref)
    for k, v in (ref.get("aliases") or {}).items():
        table.setdefault(k, v)
    _alias_cache = sorted(table.items(), key=lambda kv: -len(kv[0]))
    _reset_index()

    # A rename is only lossless when someone typing the OLD form still reaches
    # the canonical - i.e. it still clears the 0.5 threshold, either by sharing
    # words or through the alias table. Otherwise the merge deletes a door,
    # which is the mistake batches 015/016 made with #بایومیمتیک and #سیگار.
    # Registering the pair in `aliases` (or keeping both as co_tags) is the fix;
    # silently merging is not.
    closed = []
    for old, new in renames.items():
        nw = words(new)
        ow = set(words(old))
        if nw and sum(w in ow for w in nw) / len(nw) < 0.5 and not batch.get("allow_lossy"):
            closed.append(f"{old} -> {new}")
    if closed:
        sys.exit("refusing to apply — these renames close a door (the old form "
                 "would no longer reach the canonical). Add an entry to "
                 "`aliases` in the reference, keep both as co_tags, or set "
                 "\"allow_lossy\": true if the old form is genuinely unreachable "
                 "text nobody types:\n  " + "\n  ".join(closed))

    for old, new in renames.items():
        old_c = index.get(old)
        if not old_c:
            continue
        old_c.setdefault("variants", [])
        target = index.get(new)
        if target is None:                      # pure rename
            old_c["tag"] = new
            index[new] = index.pop(old)
            target = old_c
        else:                                   # merge into an existing concept
            for v in old_c["variants"]:
                if v not in target["variants"]:
                    target["variants"].append(v)
            ref["concepts"].remove(old_c)
            index.pop(old)
        if old not in target["variants"]:
            target["variants"].append(old)      # the dead form, recorded

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


def compile_aliases(ref: dict) -> list:
    """
    Fold every concept's `aliases` into the top-level table the tokenizer reads.

    An alias is a plain string substitution over the whole normalized query, so
    the destructive case is an alias landing INSIDE another word: aliasing
    "سیگار" to "دخانیات" turns the unrelated #بیمار_سیگاری into "بیمار دخانیاتی",
    a word that now matches nothing at all. Same for "کراون" inside #اندوکراون.

    Matching another concept on a WHOLE word is a different thing and is
    allowed: aliasing "implant" to "ایمپلنت" rewrites #Implant_Planning to
    "ایمپلنت planning", which is simply the same concept said consistently, and
    is how a Latin-script query reaches Persian tags at all.

    apply_aliases() substitutes on whole words only, so cutting into a word is
    already impossible and nothing needs rejecting for that. What is left worth
    saying out loud is when an alias will ALSO rewrite a different concept -
    usually right (a Latin-script tag becoming reachable in Persian), but it is
    the one thing a person adding a spelling should see rather than discover.
    Reported, not blocked.
    """
    table, problems = {}, []
    # Normalized text of every concept, computed WITHOUT aliases so the guard
    # sees the raw vocabulary rather than the one it is about to change.
    raw = {c["tag"]: " ".join(c["key"].split("_")) for c in ref["concepts"]}
    for c in ref["concepts"]:
        target = " ".join(c["key"].split("_"))
        for a in c.get("aliases") or []:
            a = normalize_chars(a)
            if not a or a == target:
                continue
            # Self-referential: the replacement contains the pattern, so the
            # alias grows its own output ("پروگنوز" -> "پروگنوز دندان" yields
            # "پروگنوز دندان دندان"). Always wrong, always rejected.
            ap, tp = a.split(" "), target.split(" ")
            if any(tp[k:k + len(ap)] == ap for k in range(len(tp))):
                problems.append(
                    f'{c["tag"]}: alias "{a}" is contained in its own target — dropped')
                continue
            for other_tag, other in raw.items():
                if other_tag == c["tag"]:
                    continue
                if f" {a} " in f" {other} ":
                    problems.append(
                        f'{c["tag"]}: alias "{a}" also rewrites {other_tag}')
                    break
            table[a] = target
    return [table, problems]


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
    # Rebuilt from scratch every time. Merging the previous table back in made
    # it append-only: an alias dropped by the guard stayed live forever because
    # the stale entry was preserved. `manual_aliases` is the escape hatch for
    # word-level entries no single concept owns.
    table, problems = compile_aliases(ref)
    for k, v in (ref.get("manual_aliases") or {}).items():
        kp, vp = k.split(" "), v.split(" ")
        if any(vp[i:i + len(kp)] == kp for i in range(len(vp))):
            problems.append(f'manual alias "{k}" is contained in its own target — dropped')
            continue
        table.setdefault(k, v)
    ref["aliases"] = dict(sorted(table.items(), key=lambda kv: -len(kv[0])))
    write_ref(ref)
    global _alias_cache
    _alias_cache = None
    _reset_index()
    print(f"Synced {len(ref['concepts'])} concepts from the brain "
          f"({changed} updated); {len(table)} aliases compiled.")
    for p_ in problems:
        print(f"  note: {p_}", file=sys.stderr)


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


def cmd_say(tag: str, forms: list) -> None:
    """Add spoken/written variants to one concept, then recompile."""
    ref = load_ref()
    c = by_tag(ref).get(tag)
    if not c:
        sys.exit(f"{tag} has no reference entry — add the concept first.")
    if not forms:
        print(f'{tag}: {c.get("aliases") or []}')
        return
    c.setdefault("aliases", [])
    for f in forms:
        if f not in c["aliases"]:
            c["aliases"].append(f)
    write_ref(ref)
    print(f'{tag} now also matches: {", ".join(c["aliases"])}')
    cmd_sync()


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
    g.add_argument("--say", nargs="+", metavar=("TAG", "FORM"),
                   help='record other ways a dentist writes/says a tag: '
                        '--say "#بیومیمتیک" "بایو میمتیک" "بایومیمتیک"')
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
    elif a.say:
        cmd_say(a.say[0], a.say[1:])
    elif a.words is not None:
        print(words(a.words))
    else:
        cmd_backlog(a.backlog or None)


if __name__ == "__main__":
    main()
