<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision; this repeated reference never requires a reread. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: C.4.13. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
> **Fixed page deliveries:** after `C.4.9`, after `C.4.13` including lawful skips, and after all final work, Phase F and report G. Cuts 1/2 deliver work plus handoff; cut 3 delivers final work, completion receipt and handoff deletion together. All intermediate checkpoints stay local; no extra turn-end or cleanup push.

<!-- /dentcast-checkpoint-protocol:v1 -->

### 4.13. DES — DentCast Evidence Score (run or consume the record)

**Run step 4.13 on every ordinary page publish**, using the source basis
from Phase B Question 4.8, except where an explicit canonical skip applies:

- **LiteCast** — outside the specialist DES ecosystem (Hard Rule 10);
  record `C.4.13: skipped — LiteCast`.
- **چالش / Challenge** — when Phase B Question 4.9 identified the post as a
  چالش, record `C.4.13: skipped — چالش` with that reason, **without invoking
  any DES or Fidelity model**, and create **no entry for this content ID** in
  `plus/des-scores.json`. This is the rule in `modules/09-challenge.md` and
  `.dentcast/challenge-handoff.md` §11.3, **not** Question 4.8's
  `INDETERMINATE` research basket: never ask for a DOI or score the challenge's
  private answer. The challenge may live in an ordinary content folder; the
  folder itself never grants this skip. Step 4.14 must still place the real
  `data-dc-challenge-question` markup on the public page; Phase F detects
  that markup and validates the Challenge-specific skips. Missing/incorrect
  markup is not a license to skip DES on an otherwise ordinary article.
- **Founder explicitly chose «بدون DES»** at Question 4.8 — apply only the
  existing scoped, page-bound approval/exemption process in
  `.dentcast/workflows/publish-checkpoints.md`; do not infer consent.
  The separately documented confirmed `unsourced_audio_caption` exception
  is subject to the same page-bound verification.

**All other applicable pages must have a valid DES record.** A Challenge
skip is an explicit, evidenced step-ledger `skipped` result, not a missing
record accepted by accident; it does not skip Challenge publication's other
applicable steps or final Phase F.

#### Conditional path for founder-supplied results (independent DES and Fidelity tracks)

At intake and again before Part 1, check whether the founder supplied a DES score **together with its complete canonical JSON** for this publication, Fidelity JSON, or both. Explicitly associate the packet with the exact `content_id` and final page body; an older `plus/des-scores.json` entry, another article's result, a Project Knowledge instruction, or a bare number/band is not the supplied result.

**Validate the supplied DES and Fidelity tracks independently; reuse accepted results instead of rerunning them.**

1. **DES supplied:** Require the complete canonical SOURCE/COMMENTARY JSON object for every cited/scored source, with original `des_version`, identity/DOI, `text_basis`, evidence quotes, calculations, score and band. A `plus/des-scores.json`-shaped packet keyed by this exact `content_id`, or that structure plus explicit same-page identity, is acceptable. Obtain or reuse the actual matching `source_text` through Part 1, without executing any DES scoring, and check the correct page/source set, exact quote substrings, source basis, spec version, arithmetic and band using Part 3. When valid, **DO NOT rerun the DES/SOURCE/COMMENTARY model calls**: preserve the founder-supplied original JSON objects verbatim for Part 4. A separate model-run receipt is **not required for a valid DES JSON**; record its public-safe provenance and validation. A number without the canonical JSON is never sufficient.

2. **Fidelity supplied:** This is a separate track, not a prerequisite to accepting valid DES JSON. If complete canonical Fidelity JSON is provided for all owed source/POOLED calls, check that it matches the exact final page text or generated input blocks, identifiers, `source_text`, `text_basis`, applicable spec, scope and generated `tools/des_fidelity_units.py` assignments. Validate quotes, voting, required independent checker/tie-break/strong-reviewer receipts and founder decisions under Parts 2b/2c and Part 3. When valid, **DO NOT rerun Fidelity model calls**; preserve the JSON verbatim. If Fidelity is **not supplied** but is canonically owed, run **only the missing Fidelity calls** under Parts 2b/2c, not the already accepted DES. For COMMENTARY self-records and other lawful Fidelity exceptions, record the correct `null`/error/zero-unit outcome rather than fabricating model calls.

3. **No supplied results:** Execute the usual Parts 1–4, including all owed DES and Fidelity calls. If a supplied track's JSON is incomplete, stale, inconsistent, from another content ID, unverifiable against actual source text, or otherwise fails Part 3, **record 4.13 as blocked** with the exact mismatch and request corrected data. **Never silently rerun the founder's supplied result** to work around a bad/missing JSON; do not label the absence as a founder «بدون DES» exemption. Partial source sets are not a completed DES packet.

4. **All paths still require gates:** Perform the complete Part 3 checks, applicable Part 3b founder fixes/decisions, Part 4 storage in `plus/des-scores.json`, and Phase F. Reused results are **not a SKIP**. Record whether DES and Fidelity were reused or executed separately. Any subsequent change to the final page body, source identity/text/basis or scoring spec invalidates the affected supplied results until verified anew. Never commit private source text or approval transcripts.

**Order matters: this runs after 4.10 on purpose.** When a paper file was attached,
step 4.10 Part 3 has already found and cross-checked the DOI — reuse it rather than
looking it up a second time and risking a different answer.

**The one rule this entire step rests on: the model never fetches, so `source_text`
must exist before the prompt runs.** DES spec Core Rule 4 is absolute. A DOI whose
abstract you could not retrieve is **not scorable** and must end in
`INSUFFICIENT_TEXT` — never a score assembled from the DentCast متن about the paper,
from the paper's title, or from what you happen to know about the study.

#### Part 1 — Resolve `source_text` (never skipped, never improvised)

**COMMENTARY basket:** `source_text` is the page's **own body text** — the متن of
record from Question 3.5 (the post-decision text, edited if rewrites were approved),
exactly as it will ship. `text_basis` is `FULL_TEXT`. No DOI, no lookup, done.

**RESEARCH basket:** first confirm Question 4.8's **secondary-report** decision is
already made — if a cited source is a consensus statement/guideline that names its
primary studies, the DOIs you resolve here are **those studies', not the
wrapper's**. Then resolve **each** DOI through this ladder, stopping at the first
real hit:

1. **The local cabinet first** — `dentcast_cabinet_full_catalog.json` already holds
   abstracts for a large share of the library, and a local hit is free and cannot
   fail. Look the DOI up directly:
   ```bash
   python3 -c "
   import json,sys
   doi=sys.argv[1].strip().lower()
   d=json.load(open('dentcast_cabinet_full_catalog.json'))
   m=[p for p in d['papers'] if (p.get('doi') or '').strip().lower()==doi]
   print(json.dumps(m[0], ensure_ascii=False, indent=2) if m else 'NOT IN CABINET')
   " "10.1111/clr.13849"
   ```
   A hit hands you `abstract`, `real_title`, `journal`, `crossref_year` and
   `authors` in one read. **Compare DOIs case-insensitively** — the catalog stores
   them as found, so `episode-161`'s reference `10.1111/CLR.13672` lives there as
   `10.1111/clr.13672` and an exact-match lookup misses it.
2. **PubMed / article-lookup MCP** — `get_article_metadata`, `search_articles`,
   `lookup_article_by_citation`, `convert_article_ids`.
3. **The DOI/publisher page via `WebFetch`** — last resort, and only to read the
   abstract text.

**If none of the three yields a real abstract, that source is not scorable.** The
spec's own error output is the correct result, and it is what gets recorded:
```json
{"des_version":"2.5","error":"INSUFFICIENT_TEXT"}
```
Per the capability protocol (`agent-parity.md` §2), when the blocker is a **missing
tool** rather than a missing abstract, **ask the user to paste the abstract** —
never downgrade the result silently.

**A source with no method to appraise still needs its text** (spec v3.1). For a
textbook, a glossary or a standard in the «منابع» block the ladder is: the cabinet;
`WebFetch` for an open glossary or standard (the Glossary of Prosthodontic Terms
is open access, so the cited entry is retrievable); and then **the founder's own
copy** — show him the page's sentences that lean on that source and ask for the
chapter or page range they come from, as a gate question (`agent-parity.md`
§1), never from memory. The SOURCE call then runs on that text with
`text_basis: EXCERPT` (a part of the work — a chapter, a page range, one entry)
or `FULL_TEXT` (the whole cited work), returns `NOT_APPRAISABLE`, and the
FIDELITY call (Part 2b) reads the same text. «ندارم» is a legal answer: the
SOURCE call then runs on the reference line alone and records
`text_basis: CITATION_ONLY`, so the citation reaches the card, and the fidelity
slot is the spec's own `{"des_version":"3.1","error":"INSUFFICIENT_TEXT"}` —
reported, never silent. `EXCERPT` and `CITATION_ONLY` exist for this content
type only; a paper is scored from its abstract or its full text, never a chosen
part.

**`text_basis` is a fact, not a formality.** It is `ABSTRACT_ONLY` whenever what you
resolved is an abstract — the normal case for every cabinet and lookup hit — and
`FULL_TEXT` only when you genuinely hold the paper's body. Getting this wrong is not
cosmetic: `ABSTRACT_ONLY` caps the methodology multiplier at 0.75 and forces
`provisional: true`, so labelling an abstract as full text silently inflates every
score built on it.

#### Part 2 — Run the prompt file

**Load `.dentcast/dentcast-evidence-score-v3.4.md` as the system prompt — the whole
file, verbatim, minus the appendix.**

**v3.3 is the current spec, and its change from 3.2 is one FIDELITY rule** (F0, F2,
F6, appendix rule 8; founder 1405/07/20): a `SECONDARY_REPORT` source — a consensus
statement or a guideline, read whole — is a **complete text** for the FIDELITY
question. Its silence is `NOT_IN_SOURCE` (never `NOT_ASSESSABLE`), the F2-v grains
apply, and the result is **not provisional**. The basis belongs to the SOURCE
question, where it still caps the multiplier and marks the score provisional;
fidelity only asks whether the page says what the document says and nothing changed
on the way into Persian, and how strong the source is never enters that call.
`sharehub/share-33` is why: written from a national consensus statement, every claim
checked against its full text, and still «مقدماتی» only because the consensus is a
secondary report. Silence has been outside the denominator since v2.8, so no score
moves; records below 3.3 stay valid under their own stamp
(`tools/des_fidelity_units.py --merge` and `tools/verify_publish.py` are
version-gated).

**v3.2's change from 3.1 is one assignment rule** (F6,
founder 1405/07/20): on a page that names SOME of its sources, the units that
name none of them go to the cited source(s) no unit names — `sharehub/share-10`
names its glossary and textbooks in two sentences and writes the other
twenty-nine from a paper it never names, and under v3.1 that paper received
nothing. `tools/des_fidelity_units.py` applies it; markers are read from every
cited source, so a sentence naming a `CITATION_ONLY` book still reaches no call;
several unnamed sources are not pooled yet (the tool says so). No stored record
moves.

**v3.1's change from 3.0 cuts the FIDELITY track loose
from the score** (founder, 1405/07/19). A source recorded `NOT_APPRAISABLE` used
to get no FIDELITY call by rule, although nothing in the track reads a band: «how
strong is the source?» and «did we say what it says?» are two questions. Now
`source_kind` is `book`, `glossary` or `standard` (closed; a guideline stays on
`SECONDARY_REPORT`); a NOT_APPRAISABLE record states what text was in hand through
its own `text_basis` list — `FULL_TEXT`, `EXCERPT` (new) or `CITATION_ONLY` (new;
a reference line alone is admissible for this one content type); the FIDELITY call
runs on the same text under the same basis, with `EXCERPT`'s silence
`NOT_ASSESSABLE` and its result provisional; and a fidelity slot on such a source
holds the F5 object, or the spec's `INSUFFICIENT_TEXT` error object when the text
was not in hand, or `null` only when no call was owed. No SOURCE score moves and
no verdict changes; every 2.8–3.0 record stays valid under its own stamp, and
`sharehub/share-14`'s 1.9 book record gets a fidelity slot only by a re-run.

**v3.0's change from 2.9 is one FIDELITY rule:**
a study-scope formula (*under the conditions of this study*, *within the
limitations of this study* …) is not a hedge, so a claim that leaves it out is
not «قاطع‌تر از منبع» — every finding belongs to its study, the page cites the
study and the DES card grades it (founder, 1405/07/17). Real hedges (*may*,
*suggests*, *appears to* …) still count. No SOURCE score moves; a 2.9 record
stays valid under its own stamp.

**v2.9's change from 2.8 is four FIDELITY verdict
rules, plus the way the FIDELITY call is run (Part 2c).** No SOURCE score
moves. A ranking («قوی‌ترین», «مطمئن‌ترین», «بیشتر از») is one claim wherever
it appears; a relation between sources («تنها مطالعه‌ای که…», «هم X و هم
بقیه…», «تعارض ندارند») is silence in a one-source call; one governing
sentence decides the verdict, the `change_kind` and the quote, and a faithful
sentence must carry the claim's modifiers too; and an absolute word the source
does not use («فقط», «همیشه», «هرگز», «همه‌ی»…) is `HEDGE_REMOVED`, never
silence (founder, 1405/07/17). `sharehub/share-18` is why: two v2.8 runs over
the same five full texts agreed on 57 of 61 units, and three Sonnet rounds
under the v2.9 drafts took one source from 16/19 to 18/19 identical units with
the flagged sentences identical from round 2 on. A 2.8 record is re-run, never
re-labelled.

**v2.8's change from 2.7 is the FIDELITY arithmetic
only: F4 scores the claims the source ADDRESSES** (`MATCHES` + `ALTERED` +
`REVERSED`). A sentence the source is silent about (`NOT_IN_SOURCE`) is counted
and shown, never scored — under a full text it is almost always the author's own
background knowledge or clinical reasoning, and scoring it zero took
`sharehub/share-23` from 98 to 91 for explaining. No verdict changes and no
SOURCE score moves; a 2.7 record is re-scored by recomputing F4 from its stored
verdicts and re-stamped 2.8 (no model call). The card's headline is the
firmer/wider/reversed claims themselves, not the percentage (appendix rule 5).

**v2.7's change from 2.6 is that the FIDELITY call
reads the SAME text the SOURCE call scored, on the same basis** — a page written
from a full text is judged against the full text, never its abstract; the tool
refuses a mismatch (spec F0, appendix rule 11). Under `FULL_TEXT` the most
specific sentence governs (F2-v), and a sentence naming two conditions together
(«saliva or blood») is a general finding, not a statement about either (F2-iv
item 4). `sharehub/share-23` is why: judged against its abstracts, three of its
stage-by-stage blood claims read as `REVERSED`; the full texts support them. No
SOURCE score moves.

**v2.6's change from 2.5 is the FIDELITY track made
to work on DentCast's own prose and on pages that cite several sources** — F1/F2
rules for an author who explains rather than reports, F2-iii (instructions),
F2-iv (claims that tell conditions apart), F6 (several sources, `POOLED` when
none is named), and `tools/des_fidelity_units.py`, which is the caller's split
and assignment as code. No SOURCE score moves.

**v2.5's change from 2.4 was a SECOND call: the
FIDELITY track.** No SOURCE score moves — Steps 0-5 and the COMMENTARY track
are untouched except for a `mode` field whose absence means `SOURCE`. The new
call takes the page's own text and the source it cites and answers one
question: does each claim the page attributes to the source appear in the
source, unchanged in direction, hedge and scope? It is run **after** the SOURCE
call for that source, per source, and is described in **Part 2b** below. Its
release precision test is recorded in the spec's own Versioning entry (41
independent runs, three inputs, every verdict and score identical from the
second round on).

**v2.2's change from 2.1 is `text_basis:
SECONDARY_REPORT` (Step 0 + Step 1).** A document that reports work published
elsewhere — a consensus statement, a guideline, a conference synthesis — rates
silence about a method as `NR` rather than `high`, and caps the multiplier at
0.75, exactly as `ABSTRACT_ONLY` does: an abstract condenses by length, a
secondary report condenses by role, and in neither is a missing method evidence
that the study skipped it. It is the **fallback**, not the default — Question
4.8's chain rule scores the primary studies wherever they are retrievable, and
this basis is for the wrapper you could not get past. Only records scored
`FULL_TEXT` against a secondary report move under this bump; the four
consensus/guideline sources already on record were all `ABSTRACT_ONLY` and are
arithmetically unchanged.

**v2.1's change from 2.0 is that the AMSTAR-2
excluded-studies domain has THREE outcomes instead of two (Step 3b-iii).** A
review that published no per-study list of excluded full-text studies is now
`some_concerns` rather than `high` **when it reported both** a screening account
with counts (a PRISMA flow diagram, or records screened → full texts assessed →
included) **and** explicit inclusion/exclusion criteria; a review that documented
neither, or only one of the two, is still `high`, and that `high` still counts
toward AMSTAR-2 *critically low*. The reason is that the old rule failed **9 of
the 9** full-text reviews on record — a domain nothing can pass carries no
information, and it was rating a PROSPERO-registered five-database review with a
PRISMA flow identically to a narrative review with no Methods section at all.
Under `ABSTRACT_ONLY` nothing changes: silence there stays `NR`. Two scores moved
when this landed, both systematic reviews cited by `sharehub/share-9`, from 55/C
to 80/A; everything else on record is arithmetically identical.

**v2.0 remains in force for everything else, and its change from 1.x is that a transparency
penalty is a SHARE of the design anchor, not a flat deduction (Step 4a).** The
table's numbers are now `base_points`, and what gets subtracted is
`max(1, round_half_up(base_points × S_design ÷ 100))`. Every penalty object
therefore carries **both** `base_points` (the row's table weight, always 8/5/5/3)
and `points` (what was actually subtracted); Phase F recomputes the scaling from
the pair and fails a mismatch, so writing the old flat value is caught rather
than shipped. The reason is that `S_design` ceilings differ by almost seven times:
a flat −8 was 8% of an SR's achievable range and 53% of a narrative review's, and
below a certain anchor it exceeded the whole range, so weak-design papers piled
up on a floored 0 and stopped being distinguishable. **Version-gated:** records
stamped `1.x` keep validating against the flat table they were written under —
only `2.0` and later are checked for scaling. Across the 47 RESEARCH sources on
record only 5 carried a penalty at all and **no band moved**, so a page's
reader-facing band is unaffected either way.

**The determinism rules from v1.5/v1.6 are unchanged and still binding.** Two of
them exist because a blind reproducibility run found them missing, so do not
treat them as pedantry: **quality judgment is out of the domain rating**
(present-vs-absent, plus the closed threshold table in 3b-i — if you are arguing
that a described method is *bad enough* to count as absent, the answer is
`some_concerns`), and **an absence-based `high` must name the sections you
actually read** (3b-ii). Do not decide absence by keyword search alone: a paper
can appraise its studies without ever writing the word "quality", and a grep
that misses that produces a confidently wrong `high`. Phase F fails any
absence-based `high` that carries no note. Every place
v1.3 left a decision to the scorer is now decided: one tool per design, a fixed
domain list, an explicit rating rule (under `FULL_TEXT`, silence about a
safeguard is `high`, not `NR`), routing for the designs that matched no anchor,
a narrowed funding penalty, and round-half-up on exact decimals. Follow the
rules even where your own judgment differs — **a score everyone reproduces is
worth more than a slightly better score nobody can.** Any RESEARCH record still
stamped `des_version` below `1.5` predates this and must be regenerated before its
number is compared with a new one; v1.6 changed nothing on the RESEARCH side, so
`1.5` and `1.6` research scores are directly comparable.

**The COMMENTARY track's one carve-out is why a Chairside, MetaNote or Insight
page now scores 3 higher than it did.** Checklist item 4 («صریحاً تجربه/دیدگاه
نامیده شده») can be earned from the section's own published declaration rather
than a sentence inside the page — for `chairside/`, `metanotes/` and `insight/`
only, because those three landing pages carry such a declaration and the spec
quotes all three verbatim in a closed table. When you use it, the
`evidence_quote` is that declaration copied from the landing page and the item's
`note` is MANDATORY and names the file it came from.

**The list is closed and has exactly one entrance, which `insight/` is the
precedent for: the section's landing page gets an explicit declaration first,
and the spec version bumps after.** Never add a section because it resembles one
already listed. `insight/` did not qualify under v1.6, when its page said the
series covers «تجربه‌های بالینی **و** یافته‌های علمی» and therefore could not
tell a reader which of the two the page in front of them was; v1.7 added it
because that page was rewritten to declare the section. Any COMMENTARY record in
`chairside/` or `metanotes/` stamped `des_version` below `1.6`, or in `insight/`
below `1.7`, is scoring low by 3 and must be regenerated. The appendix says so itself ("NOT part of the
model instruction … Do not include this appendix if the file is loaded verbatim as a
system prompt"): those checks are yours to run in Part 3, not the model's.

The user turn is the spec's Step 0 input block, **one block per source**:

```
doi:               <the DOI, or empty for COMMENTARY>
source_text:       <the text resolved in Part 1>
text_basis:        FULL_TEXT | ABSTRACT_ONLY
metadata:          title / authors / year / journal (from the cabinet hit or the lookup)
clinical_question: <omit unless this publish explicitly answers one>
```

- **`journal_quartile` has no source anywhere in this repo.** Neither the cabinet nor
  any other file carries a Scopus/JCR quartile, so leave it out of `metadata` and
  expect `{"value":"NR","source":"NR"}` back. Never fill it from memory: it is
  barred from influencing any rating anyway, but a fabricated Q1 is still a false
  claim shipped on a page.
- **One run per source, never merged.** A page citing three papers produces three
  input blocks and three DES objects. Never concatenate sources into one block and
  never average their scores.

#### Part 2b — Run the FIDELITY call (spec v2.5, v2.7, v3.1, v3.2, v3.3), once per source whose text is in hand

**When.** For every source in basket 2 whose SOURCE call read a text — RESEARCH,
COMMENTARY, **or `NOT_APPRAISABLE` with `text_basis` `FULL_TEXT` or `EXCERPT`**
(spec v3.1: a textbook chapter or a glossary entry has sentences, and whether the
page says what they say is a separate question from whether the source is strong).
Skip it, and store `null` in its slot, when the SOURCE call returned an error
(`INSUFFICIENT_TEXT`, `DOI_TEXT_MISMATCH`) and for the page's own COMMENTARY
self-record (a text cannot be unfaithful to itself). A `NOT_APPRAISABLE` source
recorded `CITATION_ONLY` (its text was sought and not found, Part 1) gets no call
and its slot is the spec's own error object
`{"des_version":"3.1","error":"INSUFFICIENT_TEXT"}` — never a silent `null`; the
reader is told nothing about it (what is not there is not announced — founder,
1405/07/19), the record and the publish report are. Basket 1 pages never reach this call: fidelity needs a
cited source. No classifier decides whether the page «is a report of the paper»
— spec F1 decides per unit, and a page that merely lists the paper in its
references attributes fewer than three claims to it and lands on
`INSUFFICIENT_CLAIMS` by itself (spec appendix rule 9).

**The model must not have seen the page's text in the SOURCE call, and must not
see the SOURCE score here.** Two calls, two contexts. A model that read the
write-up before scoring the paper can be led by it; a model that knows the band
before judging the write-up confuses a weak paper with an unfaithful summary.

**Build the input blocks with the tool, never by hand** (spec F0, F6, appendix rules 7 and 10):

```bash
python3 tools/des_fidelity_units.py <content_id>                 # which calls, how many units each
python3 tools/des_fidelity_units.py <content_id> \
  --texts texts.json --build <dir>                                 # one input block per call
```

`texts.json` maps each source's DOI — or, for a DOI-less source, its position tag
`S<n>` — to the `source_text` and `text_basis` the SOURCE call scored — **the same
text, never a shorter one** (a book's `EXCERPT` included): a source scored
`FULL_TEXT` from the cabinet is judged here on that full text, because the
page was written from it. `--build` exits non-zero when a basis differs from
the stored SOURCE record (spec v2.7 appendix rule 11).
The tool decides the scope: one source → every unit to it;
several named in the prose → one call per named source with only its units,
and (v3.2) the units naming none of them to the one source no unit names;
several and none named → `POOLED`, which is one ordinary `SOURCE` call **per
source** (`input-pooled-S<n>.json`, every unit in each, `pooled_part` set) and
then `python3 tools/des_fidelity_units.py <content_id> --merge <dir>` over the
answers saved as `out-S<n>.json`, which writes the one pooled object by spec
F6's fold — the model never reads two papers in one call (v2.7). Each block it
writes has this shape:

```
mode:              FIDELITY
scope:             SOURCE (always; POOLED exists only as the merge's output)
pooled_part:       <«S<n>» on a POOLED page's per-source blocks, absent otherwise>
source_text:       <exactly the source_text the SOURCE call scored>
text_basis:        <exactly the SOURCE call's text_basis>
units:             <the page's body, split by the rule below, as [{id:"u1", text:"…"}, …]>
derivative_url:    <the page's canonical URL — provenance only>
source_conclusion: <the LAST sentence of source_text (FULL_TEXT: of its last Conclusion section), copied verbatim>
```

The split and the assignment are deterministic and are **the tool's, never the
model's**: it reads the rendered prose (title, headings and body, in order; the
region `verify_publish.py`'s `article_region()` reads), stops at the citation
block, splits on line breaks and sentence terminators, marks headings, and
numbers units `u1…uN` over the whole page — so a call that received only some
units sees ids with gaps, which is correct. Model segmentation and attribution
were the two largest sources of run-to-run disagreement in the release tests and
were taken out of the model's hands for exactly that reason.

**The output** is the spec's F5 object. Validate it in Part 3(5), then store it
in Part 4.

#### Part 2c — How the FIDELITY call is run: two independent checker runs, a tie-break, a stronger reviewer

The FIDELITY call is an independent agent per input block, reading
`.dentcast/des-v3.4-knowledge.md` (the spec minus its appendix) as its
instruction and the block as its user turn. **The roles are provider-neutral:**
choose a capable, lighter reasoning model as the **checker**, and a stronger
reasoning model as the **reviewer/adjudicator**. Sonnet and Opus name the original
Claude implementation, not a requirement to use Anthropic.

| Environment | Checker: both full runs + disagreement-only third run | Stronger reviewer/adjudicator |
|---|---|---|
| Claude / Anthropic | Sonnet | Opus |
| ChatGPT / Codex / OpenAI | e.g. `gpt-6-luna`, when exposed by the execution environment | e.g. `gpt-6-astra`, when exposed by the execution environment |
| Grok / xAI | an available lighter **reasoning** model, e.g. a Fast reasoning variant | the available stronger flagship reasoning model, e.g. Grok 4.7 |
| Any future provider | a capable lighter reasoning model available to the agent | an available stronger reasoning model |

These are role examples, not fixed versions, cross-provider quality equivalences,
or a claim that an app subscription exposes every model or multi-agent tools.
Verify actual model IDs and delegation capabilities before starting. For Grok,
consult the live official model list (`https://docs.x.ai/developers/models`);
if a Fast variant is not available, do not invent one. If separate agents or a
stronger reviewer are unavailable, report the missing stage; never label one
model's repeated self-review as the completed two-tier protocol.

**Mandatory model-routing preflight (before any FIDELITY checker call).** Inspect the execution environment's *actual* model/delegation controls, not the example model names above. Resolve and record (a) the exact provider/model ID and reasoning settings for the lighter checker, (b) the exact provider/model ID and reasoning settings for the stronger reviewer/adjudicator, and (c) whether independent checker contexts and per-role model selection are actually supported. When the runtime exposes separate-agent delegation and model selection (for example, `collaboration.spawn_agent` with a model override), use those controls: launch the first two checker runs as separate agents with identical inputs and isolated contexts, using the lightest capable reasoning model and its lowest suitable reasoning setting. Launch both full checker runs in parallel. Do not ask the founder to authorize this already-required routing again. Use the stronger model only for the stronger-reviewer duties below.

Check available provider pricing/usage information when it is readily available, but exact price verification is not a start gate. If exact cost cannot be verified, record it as UNVERIFIED and make no precise savings claim; still use the verified lighter-model role and reasoning setting. If the runtime does not expose independent contexts, per-role model selection, or a capable lighter model, do not simulate those capabilities: report the exact missing capability and the affected stage, then ask the founder how to proceed. Never silently run all roles on the default model, or present repeated calls to one model/context as independent agents. Record the preflight outcome and actual model IDs/settings in the publish report; if the runtime does not expose actual executed model IDs, mark them UNVERIFIED rather than claiming compliance. This routing protocol does not change DES/FIDELITY scoring rules, stored JSON, or historical records.

**The model is part of the measurement:** freeze the same checker model/version
and reasoning settings for runs 1, 2 and 3 of a record; the stronger reviewer is
a separate role, not a third checker vote. Give the first two agents identical
spec/source/unit inputs but separate contexts; neither sees the other's output.
The third checker sees only the disagreement units and their source/context,
not the earlier verdicts. Record actual provider/model IDs, reasoning settings
and each run's role in the publish report (outside the spec's score objects).
Keep historical records and their provenance unchanged.

1. **Two full runs per input block** — `<dir>/out-src<k>-1.json` and `-2.json`.
   Two, not one: a sentence one run calls `MATCHES` is otherwise never looked
   at again, and a missed firmer-than-the-source sentence is the error nobody
   sees (share-18: «لبه‌ی نازک» was caught by some runs and missed by others).
2. **Tie-break only where they differ.** `--vote <dir>` lists every unit the
   two runs answered differently (any verdict or kind, flagged or not); build
   blocks for those alone (`--build <dir2> --only u…`), run them once, save
   as `out-src<k>-3.json`. Units the two runs agree on are settled.
3. **Vote**: `python3 tools/des_fidelity_units.py <content_id> --vote <dir>`.
   Two agreeing votes win; with three, the `(verdict, change_kind)` pair two
   share wins, quote and note from the earliest run in it. Three different
   answers → the designated stronger reviewer/adjudicator decides that unit in
   `<dir>/adjudicate.json` (`{"src<k>": {"u…": {verdict, change_kind,
   source_quote, note}}}`).
4. **The stronger reviewer reviews every unit the vote leaves `ALTERED`/`REVERSED`** — not only
   the unresolved ones. More checker votes cure random disagreement but not a
   shared misreading (share-18: two of three runs read Saker's «internal», an
   average of the other areas, as a third surface). The reviewer reads the
   unit, its neighbours, the sentences the runs quoted and, where a term is
   defined there, the source's Methods, then writes
   `<dir>/review.json` (`{"src<k>": {"u…": {"agree": true|false, "reason":
   "…"}}}`). A dissent never flips the verdict: `--vote` appends it to the
   unit's `note`, and Part 3b shows the founder both reasons side by side.

`--vote` exits non-zero while any unit still needs a tie-break run, an
adjudication or a review. `voted-src<k>.json` is what Part 3 validates and
Part 4 stores — one object per source, the spec's own shape. `--vote` is for
SOURCE scope; a POOLED page is not voted yet (it runs one call per part and
`--merge`, as before).

#### Part 3 — Validate the output mechanically (the appendix's contract)

The prompt returns a single raw JSON object. Before anything is stored, run the
appendix's checks yourself — an output that fails these is not a score:

1. **Quote verification.** Every `evidence_quote` must be a **verbatim substring** of
   the `source_text` you supplied, after normalizing both sides (collapse whitespace
   runs, strip soft hyphens and line-break hyphenation, expand fi/fl ligatures,
   straighten curly quotes, nbsp → space, Unicode NFKC). A failure is **flagged for
   manual review, not silently dropped** — the appendix notes that recurrent failures
   usually mean bad PDF text extraction rather than model fabrication.
   **One quote is checked against a different file:** a `chairside/`, `metanotes/`
   or `insight/` COMMENTARY item 4 earned from the section-level declaration quotes
   that section's `index.html`, not the article, and must carry a `note` saying so.
   Phase F knows both haystacks and refuses the note-less version.
2. **Arithmetic recomputation.** RESEARCH:
   `des_score == round(s_design.value × q_method.multiplier) − Σ penalty points`,
   floored at 0. COMMENTARY: `des_score == 5 + Σ checklist points`. A mismatch
   invalidates the record — re-run it, never hand-patch the number.
3. **Band agreement.** `band` must be the one `des_score` actually falls into
   (A 80–100 · B 60–79 · C 40–59 · D 20–39 · E 0–19). For COMMENTARY the band is
   **always `E`** with a score in 5–19; anything else means the model took the wrong
   track and the run is void.
4. **Schema.** Exactly the spec's key set, no extras. `question_type` is the literal
   `null` (unquoted) for COMMENTARY; `s_design` / `q_method` / `penalties` are `null`
   for COMMENTARY; `commentary_checklist` is `null` for RESEARCH.
5. **FIDELITY (spec appendix rule 8).** One `claims` object per unit, in input
   order and with the input's ids, `claim_quote` byte-equal to the unit's text;
   `scope` copied from the input, and `source_ref` an «S<n>» tag on every quoted
   claim under `POOLED` and `null` otherwise; every non-empty
   `source_quote` a verbatim substring of `source_text` by the rule in (1), and
   ONE whole sentence; no `NOT_IN_SOURCE` under `ABSTRACT_ONLY`/`SECONDARY_REPORT`
   and no `NOT_ASSESSABLE` under `FULL_TEXT`; every `ALTERED` carries a
   `change_kind` from the closed F2-i list and no other verdict carries one;
   `counts` equal the tally of `claims`; `assessable` = matches + altered +
   reversed (from v2.8; + not_in_source on a 2.5–2.7 record); `fidelity_score` and `level` recompute by F4 (score
   `null` and level `INSUFFICIENT_CLAIMS` below three assessable claims; any
   `REVERSED` caps the level at `MEDIUM`); `provisional` is true exactly when
   `text_basis` is not `FULL_TEXT`; `source_conclusion` is echoed unchanged.

**These five are also enforced mechanically.** Phase F re-runs all of them over
every record in `plus/des-scores.json` (rows tagged `4.13 DES`), so a mistake
here fails the publish rather than shipping. Running them yourself first is
still the job — the gate tells you *that* something is wrong, not what the
right score was.

**Reproducibility check (appendix §6) on the first score of any new question type:**
score the same input three times. A one- or two-point drift in the number is
acceptable; **a band change is not** — it means the anchors were read loosely and the
run is unusable.

#### Part 3b — Offer the founder a fix for every differing sentence (founder gate, never automatic)

**The fidelity grade exists to make the writing better, and the goal is
«کاملاً مطابق»** (founder, 1405/07/17). So when a validated FIDELITY result
carries any `ALTERED` or `REVERSED` unit, the publish **stops here, before
Part 4 stores anything**, and the founder is shown each such sentence and asked
whether to fix it. This is a gate of `agent-parity.md` §1 (never batched into
the final report, never skipped because the grade is already high).

For **each** `ALTERED` / `REVERSED` unit, one block, in this order:

1. the page's own sentence, **verbatim** (copied from the page, never re-typed —
   Hard Rule 16);
2. what is different, in plain Persian («قاطع‌تر از منبع»، «گسترده‌تر از منبع»،
   «برعکسِ منبع»…), from `change_kind`;
3. the source's own sentence (`source_quote`), and which source it is;
4. **one proposed rewrite with the smallest change that makes it match** —
   add the source's own qualifier («ممکن است», «در برخی مطالعات»), narrow the
   scope back to what was tested («در یونیورسال‌ها» for «در همه‌ی سیستم‌ها»),
   or, for a `REVERSED`, state the source's direction or drop the claim. Keep
   the founder's wording, rhythm and terms everywhere else in the sentence;
   change nothing a `MATCHES` sentence says; a ZWNJ stays a ZWNJ;
5. the question, with exactly three named answers: **«اصلاح کن»** (apply the
   proposal as shown), **«خودم می‌نویسم»** (the founder types the sentence; it
   is copied verbatim), **«همین بماند»** (no change — the author's right; the
   sentence stays flagged in the record).

Sentences the sources do not address (`NOT_IN_SOURCE`) are **not** offered:
they are not faults and do not lower the grade (spec v2.8 F4). Never edit a
sentence without its own «اصلاح کن» / «خودم می‌نویسم»; a «بله» to one is
never a «بله» to the others.

**After any accepted edit:**

- Apply it to the page body exactly as approved, and to the **same sentence in
  the en mirror** (Phase D) — translated, nothing else touched. If the edited
  sentence also lives on another surface (the lead used for the description,
  the brain `summary`, the Pulse line), that is a **sweep** (Hard Rule 17): every
  surface in the same commit.
- **Re-check only the edited sentences** (founder, 1405/07/17) — the last
  full run already judged every other sentence, and judging them again buys
  nothing but fresh run-to-run noise on sentences nobody touched. Build blocks
  for the edited units alone (`--build <dir2> --only u…`, same `source_text`,
  same basis), run them by Part 2c (two runs, a tie-break where they differ, a stronger-model
  review of anything still flagged), then
  `python3 tools/des_fidelity_units.py <content_id> --vote <dir2> --base <dir1>`,
  where `<dir1>` holds the `voted-src<k>.json` of the last full run. The tool
  keeps the base verdict for every unit not re-checked, recomputes counts,
  score, level and the Persian lines, and **refuses** when the edit shifted the
  page's unit ids (a sentence split or joined), when a changed unit was not
  re-checked, or when a re-check judged old text — in those cases, and only
  those, run the full step again. Never patch a verdict by hand.
- Report the grade **before → after** («تطابق خیلی بالا → کاملاً مطابق»). If the
  new run still flags a sentence — including one just rewritten — offer it
  again; the loop ends when nothing is flagged or the founder says «همین بماند».

Only then go on to Part 4, which stores the **final** result.

**For a page already published** (trigger **«تطابق X رو کامل کن»**, «عدم
انطباق‌های X رو نشونم بده»): read its stored `fidelity` from
`plus/des-scores.json`, run this same Part 3b on it, then the re-run above,
then Part 4 (replace the record's `fidelity` and its `scored_at`), Phase F,
and `tools/stamp-version.py` last. Resolve `source_text` again by Part 1 (the
scratch copy does not survive a session) — and from the **same** basis the
SOURCE record was scored on, or the tool refuses it.

#### Part 4 — Store the record

**The score does NOT go in `dentcast-brain.json`.** Hard Rule 5 forbids adding a
field previous same-category entries do not have, and no brain entry has ever
carried one. It lives in its own versioned file, exactly as `plus/pathways.json` and
`plus/badges.json` do:

**`plus/des-scores.json`** — a JSON object keyed by `content_id` (the page path
without the leading `/` and without `.html` — the same id Phase F takes):

```json
{
  "episodes/episode-161": {
    "scored_at": "2026-08-14",
    "sources":  [ { "des_version": "2.5", "content_type": "RESEARCH", "...": "..." } ],
    "fidelity": [ { "des_version": "2.5", "mode": "FIDELITY", "...": "..." } ]
  }
}
```

**`fidelity` is an array PARALLEL to `sources` by index** — same length, slot
`i` is the FIDELITY object for `sources[i]`; the spec's own error object
`{"des_version":"3.1","error":"INSUFFICIENT_TEXT"}` where the source is
`NOT_APPRAISABLE` / `CITATION_ONLY` (its text was sought and not found — v3.1);
and `null` only where no FIDELITY call was owed (Part 2b's skip cases, plus a
source no unit of the page names). Phase F is version-gated: a fidelity object
on a `NOT_APPRAISABLE` source must be stamped ≥ 3.1 over a `FULL_TEXT`/`EXCERPT`
record, and a `null` on such a source in a record with no 3.1 slot is still what
the rule then said. **Under `POOLED` scope it is the one pooled object instead of an array**,
because that call judged the page against all its sources at once. It is omitted entirely on a record
written before v2.5 or on a basket-1 page; Phase F accepts both shapes and
rejects a `fidelity` whose length differs from `sources`. Parallel by index
rather than keyed by DOI because the spec's output object carries no
identifier of its own, and inventing one would be a second copy of
`citation.doi`.

Two invariants and nothing else. **`sources` and `fidelity` hold the spec's output objects
verbatim** — the spec owns both shapes, so never reshape, rename, reorder or trim them.
And **nothing derivable is stored beside them**: no wrapper-level `band`, no `track`,
no display strings. `content_type`, `band`, `question_type` and `provisional` already
live inside each object, and a second copy is a second source of truth that can drift
out of agreement with the first. `scored_at` is stored precisely because nothing else
can derive it.

For a skipped publish, write **no key at all** — an absent `content_id` is how the
display knows there is nothing to show. Never write an empty or placeholder entry.

#### Part 5 — The display is a shared module, never page markup

**No page carries DES markup.** This is the same rule the article action row already
runs on: zero article pages carry that markup either, which is exactly why changing
it costs no page edits. The renderer reads `plus/des-scores.json` by `content_id` and
draws the band chip above the prose and the evaluation card after the body — the full
display contract (placements, the five discrete band blocks, the «تجربهٔ بالینی»
commentary variant, the colour rule) lives in **.dentcast/workflows/global/plus-premium.md — DES display**.

**This step's obligation ends at the record.** It writes data; it does not edit the
page. Status as of 2026-08-14: the record format and this step are live, the shared
renderer is not built yet — which costs nothing, because every record written now
lights up the moment that module ships. **`fidelity` is drawn too, from spec 2.8 on
(1405/07/17):** `plus/js/des.js` adds a second chip («تطابق با منابع: …», one
word, never a number) beside the band chip and a «تطابق با منابع» tab in the
card, read from the record this step writes — so a 2.8 fidelity object goes
live the moment it is stored, and an older stamp is ignored (approved mockup
`.dentcast/des-fidelity-v28-mockup.html`; display rules in .dentcast/workflows/global/plus-premium.md — DES).
Several per-source fidelity objects are drawn as **one** box — one tally, one
word, each differing sentence naming its paper, a collapsed «به تفکیک منبع»
row — by `des.js` alone; this step still stores one object per source.
A publish therefore needs nothing on the page for it: the record is the whole
job. Do **not** compensate by inlining markup or CSS into the published page.

#### Verify & report

Per source: the DOI (or «متنِ خودِ مطلب» for COMMENTARY); where `source_text` came
from (cabinet hit / MCP lookup / WebFetch / pasted by the user); the `text_basis` and
why; the resulting `des_score`, `band`, `question_type` and whether `provisional` is
true; and the outcome of each of the five Part-3 checks. Per FIDELITY slot: the
`level` and the word the reader will see for it («تطابق خیلی بالا», spec v2.8
appendix rule 5), the count line («۵۰ از ۵۲ ادعایی که منابع به آن پرداخته‌اند
مطابق است؛ ۴ جملهٔ دیگر در منابع نیامده»), every `ALTERED` and `REVERSED` unit
with its `change_kind`, or the reason for a `null` or `INSUFFICIENT_TEXT` slot. And Part 3b's outcome: each
offered sentence with the founder's answer («اصلاح کن» / «خودم می‌نویسم» /
«همین بماند»), and the grade before → after the re-run. For a skip, the documented
reason line. Explicitly confirm that no DOI, abstract, or quartile was guessed.
