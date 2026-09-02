# DentCast Cross-Link Router — glossary back-links into published bodies

Fourth router, alongside `README.md` (publishing), `en-version.md` and `ads.md`.
Those three all act on **one page in flight**. This one acts on the opposite
direction: **N pages that already exist, pointed at a term published later.**

**Trigger:** «کراس‌لینک بزن» · «بک‌لینک دانشنامه» · «واژه‌های جدید رو به متن‌های
قدیمی وصل کن» — and, in practice, after publishing a batch of glossary terms.
It is **never** a tail of an ordinary publish (see Hard rule 11).

---

## Why this exists

The publishing workflow links forward only. Its three link steps all take the
page being published as their subject:

| step | from | to | writes into |
|---|---|---|---|
| 4.7 | existing **glossary** pages | the new content | the «کاوش بیشتر» section |
| 4.8 | the **new page's** body | existing terms/episodes | in-body anchors |
| 4.9 | the **new page's** «کاوش بیشتر» | related brain entries | capsule links |

Nothing points an existing **article body** at a **newly published term**. 4.7 is
the only inbound step and it is narrow twice over: its candidate pool is
`glossary/glossary.json` (so an insight or a chairside is never a candidate) and
it writes only into the related-links section, never into prose.

The consequence is structural, not a missed item: a term's inbound in-body link
count is a function of how much content was published **after** it. `zirconia`
has twenty because twenty articles came later. A foundational term published
today starts at zero and stays there, and the terms most likely to be hubs are
the most penalised, because every page that would naturally mention them already
exists. Measured on 2026-09-01: 278 published pages used the word «ایمپلنت» in
their body and none linked the term published that morning.

---

## Hard rules

1. **This pass ADDS anchors. It never edits text.** Every change is an `<a>`
   opened around a run of characters that is already on the page. No word is
   added, removed, reordered or respelled — the founder wrote those paragraphs
   (publishing Hard Rule 16 governs them). This is **mechanically gated** in
   Phase D: strip every tag from each touched file, before and after, and the
   two strings must be byte-identical. A run whose gate is not green is
   reverted whole, never patched.

2. **The signal is the page's own metadata, never a string scan of the site.**
   A candidate exists only where the brain entry for that page carries a
   `hashtag` that resolves to the glossary term (through
   `dentcast-hashtag-reference.json`'s alias layer, so a concept filed under any
   spelling is found) **or** a `keywords` entry that matches it. The tag is the
   author saying *this page is about X*; only then do we look for X in the
   prose. Scanning 447 bodies for 107 term strings without that gate is how you
   get a link farm. (Founder decision 1405/06/10: hashtags **and** keywords
   **and** aliases. On the first run, keywords alone contributed 5 of 85 — small,
   but they reach eleven terms the hashtag vocabulary has no concept for.)

3. **The body is the type's own boxes and nothing else** — `ep-caption`,
   `glass-box`, `text-box`, `content-box`. This is not a detail. The first draft
   of this analysis scanned whole documents and produced **74 false positives**:
   matches sitting in the `<title>`, in the hashtag chip row, and inside the
   JSON-LD. A page can be tagged for a topic and never say the word in its prose
   — 107 candidates died on exactly that check and correctly produced nothing.

4. **A match must sit on a real word boundary, and in Persian a ZWNJ is not
   one.** «ایمپلنتی», «ایمپلنت‌ها», «ایمپلنت‌محور», «قدرت باندی» all contain
   «ایمپلنت»/«قدرت باند» as a prefix. Wrapping the prefix renders as a link
   glued to a dangling suffix. Punctuation, spaces and quotation marks are
   boundaries; letters, digits and **U+200C** are not. 15 of the first run's 85
   candidates failed this and every one of them looked fine in a plain diff.

5. **Wrap what the PAGE has, not what the glossary has.** The two spellings
   legitimately differ by a ZWNJ or by case — glossary «گروپ فانکشن» vs page
   «گروپ‌فانکشن», glossary «Self-Etch» vs page «self-etch». The anchor takes the
   page's own characters; substituting the glossary's spelling would be a text
   edit, which rule 1 forbids.

6. **First occurrence, one link per term per page.** Never a second anchor for
   the same target, never inside a heading, never inside an existing `<a>`.
   Same rule as publishing step 4.8, and for the same reason: only the first
   link to a URL on a page is believed to carry anchor text, so a repeat is pure
   noise. (The notecast 5–8 cleanup on 1405/06/10 removed 33 such repeats.)

7. **Out of scope, and each for its own reason.** `episodes/` — the body is the
   «درباره این اپیزود» caption, median **13 words**, where one link is ~77 per
   1000 (founder decision 1405/06/10; episodes get their links through 4.9's
   «محتوای مرتبط» block instead). `litecast/` — isolated track, never
   cross-linked with specialist content (publishing Hard Rule 10). `glossary/`
   — no self-links, and glossary→glossary is already the densest corner of the
   site. Any `/en/` path — en mirrors stay out of the brain ecosystem
   (en-version Hard rule 8).

8. **The density ceiling is a measured site statistic, not a number somebody
   liked.** A page whose post-sweep density would exceed the site's own **p90 of
   12 in-body content links per 1000 words** does not get an automatic link; it
   goes to ASK. Recompute the p90 when the corpus has moved materially rather
   than trusting the constant — `DENSITY_P90` in the script is one edit. The
   point of a ceiling is that a link nobody clicks is a link that dilutes the
   ones beside it; it is not that a number was exceeded.

9. **ADD only.** Never remove, reorder or restyle a link that is already on a
   page to make room for a new one — the same constraint publishing step 4.7
   works under. If a page is at the ceiling, it gets nothing.

10. **Auto-apply the unambiguous, ask on the named classes.** Publishing Hard
    Rule 14's split, applied here. The script assigns the verdict; Phase B says
    what each ASK class means and how to decide it. An ASK is never resolved by
    guessing and never silently dropped.

11. **This never runs as part of a publish.** It opens an unbounded set of files
    that have nothing to do with the page being published, and the publish gate
    cannot verify them. It is a periodic, curated pass with its own trigger and
    its own commit.

12. **Nothing outside the touched pages changes.** No brain write, no
    `glossary.json` write, no builder, **no version bump** — `stamp-version.py`
    hashes the brain, the two glossaries and the shared assets, and an article
    page is in none of them. Confirm rather than assume: re-run the stamper and
    it must report *unchanged*.

---

## Phase A — Generate the candidates (read-only)

```bash
python3 tools/cross_link_candidates.py --json /tmp/cross-link.json > /tmp/cross-link.md
```

The script owns every mechanical rule above (2–8). Do **not** re-derive the
matcher in prose — that is what produced the 74 false positives. Read its report.

Baseline from the first run (2026-09-01, 107 glossary terms, 472 brain entries):

| | |
|---|---:|
| raw (term, page) pairs from the signal index | 622 |
| skipped — episodes / litecast / en / glossary | 298 |
| skipped — the page already links that term | 191 |
| skipped — tagged for the topic, term not in the body | 107 |
| **candidates** | **85 across 71 pages** |
| · AUTO | 45 |
| · ASK | 40 |

Per page: 60 pages gain one link, 8 gain two, 3 gain three. The over-linking
risk this pass is often assumed to carry does not materialise at this scale —
but rule 8 is what keeps that true as the glossary grows.

## Phase B — Resolve every ASK

Three classes, and each has a real answer rather than a coin flip:

- **`glued`** — the first occurrence is inside a longer word. Do **not** wrap a
  fragment. Look for a later occurrence that stands alone and use that one; if
  the term only ever appears suffixed on this page, **skip the page** and say so.
  Never "fix" the text to make the anchor fit.
- **`inside a quotation`** — the first occurrence sits inside «…». If it is
  reported speech (a patient's question, a colleague's line), prefer a later
  occurrence in the author's own prose; if the quotes are scare-quotes around
  the concept itself (`insight/insight-39`'s «پست و کور»), the match is fine and
  the flag is a false positive — say which it was.
- **`density`** — the page would clear the site p90. Ask the founder, with the
  page's before/after numbers in the question. Do not decide it alone: on a
  terminology digest a high count is the content, and on ordinary prose it is
  clutter, and the script cannot tell those apart.

Present the ASK list as a numbered menu, grouped by class, with the context line
the script printed. The founder may approve all, a subset, or none.

## Phase C — Apply

For each approved candidate, on its page:

1. Locate the exact character run the report names (`surface`), at the first
   qualifying occurrence, outside every existing `<a>` and every heading.
2. Wrap it: `<a href="/glossary/<slug>.html">…</a>`, matching the in-body link
   markup that page already uses. Introduce no new class, no new style.
3. If the run sits inside a `<strong>`/`<em>`, put the anchor **inside** the
   emphasis, not around it, unless the surrounding page does the opposite.

Never touch a page the founder did not approve, and never add a second link to a
page beyond what the report listed for it.

## Phase D — The gate (mandatory; the run is not done until it is green)

```bash
# every touched file must render EXACTLY the same text as before
for f in $(git diff --name-only); do
  a=$(git show "HEAD:$f" | python3 -c "import sys,re;print(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',sys.stdin.read())).strip())" | sha256sum)
  b=$(python3 -c "import sys,re,io;print(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',io.open('$f',encoding='utf-8').read())).strip())" | sha256sum)
  [ "$a" = "$b" ] && echo "OK   $f" || echo "FAIL $f — text changed, revert this file"
done

python3 tools/stamp-version.py     # must report "unchanged" (Hard rule 12)
git diff -G'^\s*[^<]' --stat       # should be empty: only tag lines moved
```

A `FAIL` row is not negotiable and is not patched — `git checkout` that file and
redo it. Then re-run `tools/cross_link_candidates.py`: every applied candidate
must have moved into the *already links that term* bucket, and the candidate
count must have dropped by exactly the number applied.

## Phase E — Report

- The candidate table (raw → skipped by reason → AUTO/ASK), pasted from the run.
- Every AUTO applied: page, term, the wrapped surface string.
- Every ASK: which class, what was decided, and by whom (auto-resolved per
  Phase B, or asked and confirmed). An ASK with no verdict = incomplete run.
- Pages skipped at the ceiling, with their density.
- The Phase D gate output, verbatim, including the stamper's "unchanged".
- Per-term inbound gain (`dental-implant +32` on the first run) — this is the
  number the whole pass exists to move.

---

## What this workflow never does

- It never writes to `dentcast-brain.json`, `glossary/glossary.json`, or any
  index/builder output.
- It never adds a link to the «کاوش بیشتر» section — that section belongs to
  publishing steps 2.5/4.7/4.9 and its own 5-link cap.
- It never creates a glossary term, and it never edits one's page.
- It never runs unattended on a schedule. A new term is published by a human;
  this pass is invoked by one.
