<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages, the save point and the deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger step in this module: `C.4.13` (after C.4.6 and C.4.10, before C.4.7; it closes with message M3b when a sentence is still flagged, and starts the text lock). The save point (`publish-checkpoints.md`) comes here: just before sending M3b (Part 3b, «Save point») or, with no M3b, once Part 4 has stored the record, commit and push the scoped work, `plus/des-scores.json` and the handoff.

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
record from Question 3.5 (with its recorded rewrites, and the lead paragraph
when module 03 added one), exactly as it will ship. `text_basis` is `FULL_TEXT`. No DOI, no lookup, done.

<!-- des-record-guard:v1 -->
**RESEARCH basket, first: one DES record per paper — look the DOI up before scoring.**
A paper's DES belongs to the paper, not to the page (Part 2b), so the same DOI is
never scored twice by accident. Before Part 1's ladder, for **each** DOI:

```bash
python3 tools/des_record_guard.py lookup <doi>      # plus/des-scores.json + every queue item on branch `queue`
```

It compares DOIs case-insensitively (a `https://doi.org/` prefix is ignored), reads the
queue with `git show origin/queue:…` (or `--queue-dir <queue/>` on disk) and writes
nothing. Then:

- **A stored record with the same `text_basis`, stamped with the current spec (3.6), that
  passes Part 3 (including (7)) is reused verbatim** — no SOURCE call, no rerun. Copy the
  object byte for byte into this page's `sources`; record «reused from <content_id or
  queue item>, index <i>, sha256 <…>» in the run report (queue: `اجرا.md`). Part 2d's
  audit is not repeated for a reused record. Still resolve its `source_text` by the ladder
  below — the FIDELITY call needs it.
- **No stored record, or only one under another `text_basis` or an older stamp** (an
  abstract scored before the full text was in hand, a 3.2 record): score it (Part 2).
  After Part 3, `python3 tools/des_record_guard.py compare <new des.json>` lists what
  differs from the older records as information (`not_comparable`); it is reported, not a
  stop. A stored record is never re-labelled or edited.
- **A rerun of a paper that already has a comparable record** (for any reason) must come
  out identical: `compare` exits 1 on any difference in `s_design`, `question_type`,
  tool, a domain rating, multiplier, penalties, `des_score` or `band`. A difference
  **stops the step**: both records go to Part 2d's audit and adjudication, the
  difference is reported, and nothing is stored until it is settled — never the newer
  record silently. When the audit shows the **stored** record is the wrong one, that is
  reported to the founder as a defect of a published (or queued) record; its fix is the
  published-page route (Part 3b «For a page already published»), never an edit here.
- Two stored records of one DOI that already disagree with each other (`lookup` shows
  both) are reported the same way; neither is reused until settled.
<!-- /des-record-guard:v1 -->

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
tool** rather than a missing abstract, the abstract is an open fact asked where it arises (message M1)
(the founder pastes it) — never downgrade the result silently.

**A source with no method to appraise still needs its text** (spec v3.1). For a
textbook, a glossary or a standard in the «منابع» block the ladder is: the cabinet;
`WebFetch` for an open glossary or standard (the Glossary of Prosthodontic Terms
is open access, so the cited entry is retrievable); and then **the founder's own
copy** — show him the page's sentences that lean on that source and ask for the
chapter or page range they come from, as an open fact (message M1), never from memory. The SOURCE call then runs on that text with
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

<!-- pdf-source-text:v1 -->
**A paper PDF becomes `source_text` with the tool, never by copy-paste.**
`python3 tools/pdf_source_text.py <paper.pdf> --doi <doi> --basis FULL_TEXT -o texts.json`
reads a two-column layout column by column (full-width lines keep their place),
drops the publisher's page furniture (the Wiley «Downloaded from … Terms and
Conditions … Creative Commons License» footer and side banner, running heads,
bare page numbers) and writes `texts.json` in the shape Part 2b reads; the same
text is what the SOURCE call scores. `tools/des_fidelity_units.py` takes
`source_conclusion` from the last Conclusion section (or the last sentence) and
passes over such footer sentences; a stored record keeps the conclusion it
echoed. The PDF and its text stay outside the repository and the queue branch.
**An empty `source_conclusion` is never sent to a checker.** The receipt of
`pdf_source_text.py` shows the conclusion the blocks will carry; when a layout
defeats the cut (a two-column page that glued «CONCLUSIONS REFERENCES» into one
line, J Prosthet Dent, publish-queue item 24) it warns and exits 3, and
`des_fidelity_units.py --build` refuses. Pin the paper's own last conclusion
sentence **before the first run** — `pdf_source_text.py … --conclusion "…"`, or
`"source_conclusion"` in `texts.json` (verbatim, or the tool refuses) — never by
editing the echo in the run outputs afterwards.
<!-- /pdf-source-text:v1 -->

#### Part 2 — Run the prompt file

**Load `.dentcast/dentcast-evidence-score-v3.6.md` as the system prompt — the whole
file, verbatim, minus the appendix.** That cut already exists:
`.dentcast/des-v3.6-knowledge.md`, byte for byte. Pass that file; never cut the
appendix yourself (a hand cut keeps a trailing blank line, so its digest differs
from every other run's).

<!-- des-system-prompt-run:v1 -->
**How the SOURCE call is run: the spec file IS the system prompt.** One fresh,
tool-less process per input block, started in an empty directory, with
`.dentcast/des-v3.6-knowledge.md` as its system prompt and the Step 0 block (below)
as its only user turn. The model is the **stronger reviewer role** of Part 2c's table.
Claude Code (flags verified with `claude --help`, CLI 2.1.319, 2026-11-07):

```bash
cd "$(mktemp -d)" && claude -p --system-prompt-file <repo>/.dentcast/des-v3.6-knowledge.md \
  --tools "" --model <stronger model, e.g. opus> --no-session-persistence --output-format json \
  < block.txt > out.json        # the object is out.json's "result"; the model actually used is in "modelUsage"
```

Another provider: the same contract (empty directory, the whole file as the system
instruction, no tools, the role's model; Codex: `agent-parity.md` «اجرای ایزوله»).
**Never** hand the spec to an agent as a file it reads with a file tool: an agent that
reads 1,400 lines in pieces does not hold the rules the way a system prompt does, and the
publish-queue record that started this rule (Elgamal 2025, three in-session subagent
runs) came from exactly that. When no such process can be started, the step stops under
the «توانمندی ندارم» protocol; it is never simulated. Record in the run report (queue:
`اجرا.md`) the command, the model the run reports, and the sha256 of the system-prompt file.

The delivery alone does not make the rating right: in the controlled run that
introduced it (Elgamal 2025, FULL_TEXT, three runs, 2026-11-07) one run rated `missing
data` `high` (36/D) and two rated it `some_concerns` (52/C). That is why Part 3(7) and
Part 2d follow every new record. Spec v3.6 then closed the reading the split came from
(3b-ii, «What addresses a domain»: results, tables, counts and design statements never
address a domain whose safeguard they do not state): the same input under the v3.6 file,
five runs, rated `missing data` `high` and landed on 36/D in all five.
<!-- /des-system-prompt-run:v1 -->

<!-- des-version-history:v1 -->
**v3.6 is the current spec.** What each earlier version changed is in
`.dentcast/workflows/des-version-history.md`. Read it when you validate,
re-score or compare a record stamped below 3.6; a new 3.6 run does not need it.
These rules stay binding here:

- A record stamped 3.5 stays valid under 3.5 and is never re-labelled 3.6; a
  paper is scored under 3.6 only by a new run (Part 1: an older stamp is not
  reused, and `compare` reports it as `not_comparable`).
- Every record is validated under its own `des_version` stamp;
  `tools/verify_publish.py` and `tools/des_fidelity_units.py` are version-gated.
  An old record is regenerated, never re-labelled to a newer version.
- The v3.5 source markers (`.dentcast/des-source-markers.json`) and recorded
  plans (`.dentcast/des-fidelity-plans/<content_id>.json`) apply only to a
  source record stamped 3.5 or later (Part 2b, Part 2c step 5).
- A 2.7 record is re-scored by recomputing F4 from its stored verdicts and
  re-stamped 2.8, with no model call. A 2.8 record is re-run under 2.9, never
  re-labelled.
- From 2.0 a penalty object carries both `base_points` (the row weight, 8/5/5/3)
  and `points` = `max(1, round_half_up(base_points × S_design ÷ 100))`; Phase F
  recomputes the pair and fails a mismatch. Records stamped 1.x keep validating
  against the flat table they were written under.
- `text_basis: SECONDARY_REPORT` is the fallback for a wrapper whose primary
  studies cannot be retrieved, never the default: Question 4.8's chain rule
  scores the primary studies wherever they are retrievable.
<!-- /des-version-history:v1 -->

**The determinism rules are binding.** Two of them are easy to treat as
pedantry and must not be: **quality judgment is out of the domain rating**
(present-vs-absent, plus the closed threshold table in 3b-i — if you are arguing
that a described method is *bad enough* to count as absent, the answer is
`some_concerns`), and **an absence-based `high` must name the sections you
actually read** (3b-ii). Do not decide absence by keyword search alone: a paper
can appraise its studies without ever writing the word "quality", and a grep
that misses that produces a confidently wrong `high`. Phase F fails any
absence-based `high` that carries no note. The spec leaves no decision to the
scorer: one tool per design, a fixed
domain list, an explicit rating rule (under `FULL_TEXT`, silence about a
safeguard is `high`, not `NR`), routing for the designs that matched no anchor,
a narrowed funding penalty, and round-half-up on exact decimals. Follow the
rules even where your own judgment differs — **a score everyone reproduces is
worth more than a slightly better score nobody can.** Any RESEARCH record
stamped `des_version` below `1.5` must be regenerated before its number is
compared with a new one; `1.5` and `1.6` research scores are directly comparable.

**The COMMENTARY track has one carve-out.** Checklist item 4 («صریحاً تجربه/دیدگاه
نامیده شده») can be earned from the section's own published declaration rather
than a sentence inside the page — for `chairside/`, `metanotes/` and `insight/`
only, because those three landing pages carry such a declaration and the spec
quotes all three verbatim in a closed table. When you use it, the
`evidence_quote` is that declaration copied from the landing page and the item's
`note` is MANDATORY and names the file it came from.

**The list is closed and has exactly one entrance: the section's landing page
gets an explicit declaration first, and the spec version bumps after.** Never add
a section because it resembles one already listed. A landing page that does not
tell a reader whether the page in front of them is experience or research
findings (e.g. «تجربه‌های بالینی **و** یافته‌های علمی») does not qualify. Any COMMENTARY record in
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

#### Part 2b — Run the FIDELITY call (spec v2.5, v2.7, v3.1, v3.2, v3.3, v3.5), once per source whose text is in hand

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
reader is told nothing about it (what is not there is not announced), the record and the publish report are. Basket 1 pages never reach this call: fidelity needs a
cited source. **A core audio episode (`episodes/…`) never reaches it either —
DES only, no FIDELITY**: its page is a caption, a player
and labels, not a write-up of the paper, so the record is `scored_at` +
`sources` with no `fidelity` key; `tools/des_fidelity_units.py` builds nothing
for it and Phase F fails a `fidelity` slot on one. Its NoteCast is a written
page and keeps the call. **DES belongs to the paper: one DES record per paper.** An episode and its NoteCast built on the same paper
share that single record (no second record, no second scoring) and both pages carry its score; **FIDELITY goes only to
the written page, and only when its paper accompanies it**; the audio episode never gets one. No classifier decides whether the page «is a report of the paper»
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
F6's fold — the model never reads two papers in one call (v2.7).

**v3.5 (appendix rule 10).** When the prose names a source in Persian, or two
sources share an author, declare it before the first run — never fix the plan
afterwards by hand:

```json
// .dentcast/des-source-markers.json
{"<content_id>": {"S1": {"markers": ["اوکیسون"], "disambiguators": ["1988"]},
                  "S2": {"markers": ["اوکیسون"], "disambiguators": ["2020", "کتاب"]}}}
```

A marker matches as a whole word in either script (Persian digits read as Latin);
when a sentence names several sources, those whose disambiguator it also names
keep it. When the founder decides the plan outright, record it in
`.dentcast/des-fidelity-plans/<content_id>.json`
(`{"content_id", "origin": "founder", "decision": {"status": "confirmed", …},
"plan": {"<source index>": ["u…", …]}}`); the tool refuses an unconfirmed
decision, an unknown unit or a source without a text, and Phase F reads the same
file. Each block it
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
block, splits on line breaks and sentence terminators, marks headings and
figure captions, and numbers units `u1…uN` over the whole page — so a call
that received only some units sees ids with gaps, which is correct. A full stop
that ends no sentence is not a cut: a caption label opening its line
(«تصویر ۱.», «شکل 2.», «جدول ۳.», «Figure 4.», «Table 1.») stays with the
caption sentence after it, a reference abbreviation stays with its number
(«Fig. 1», «Tab. 3», «Eq. 4», «No. 5», «Ref. 6») and «e.g.», «i.e.», «vs.»
stay inside their sentence (publish-queue item 24: «تصویر ۱. … منبع: … Fig. 1»
used to fall apart into «تصویر ۱.», «… Fig.» and «1»). A record already judged
on the earlier cut keeps it (`split_for`), as it keeps its `source_conclusion`:
no stored id moves. Segmentation and attribution stay out
of the model's hands because they are the largest sources of run-to-run
disagreement.

**The output** is the spec's F5 object. Validate it in Part 3(5), then store it
in Part 4.

#### Part 2c — How the FIDELITY call is run: two independent checker runs, a tie-break, a stronger reviewer

The FIDELITY call is an independent agent per input block, reading
`.dentcast/des-v3.6-knowledge.md` (the spec minus its appendix) as its
instruction and the block as its user turn. **The roles are provider-neutral:**
choose a capable, lighter reasoning model as the **checker**, and a stronger
reasoning model as the **reviewer/adjudicator**. Sonnet and Opus are the
Claude examples, not a requirement to use Anthropic.

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

<!-- fidelity-single-source-tier:v1 -->
**DES is never tiered.** Every DES/SOURCE/COMMENTARY call above runs in full on
every page, whatever its length or source count. Only the FIDELITY protocol
below has one lighter tier, and only for a **single-source page**:
`tools/des_fidelity_units.py` reports one source with a text, scope `SOURCE`, no
recorded multi-source plan, and the body is a short founder-written or derived
summary of that one paper. On such a page:

- **Step 1 is unchanged: two full checker runs, always** (its reason is in step
  1 below). `--vote` refuses fewer than two full runs.
- **Step 2 (tie-break)** runs only when `--vote` lists a unit the two runs
  answered differently; when they agree everywhere there is no third run.
- **Step 4 (stronger reviewer)** runs only when the vote leaves a unit
  `ALTERED`/`REVERSED`; with none, no reviewer call is made.
- **Step 5 (orphan sweep) does not exist for a single-source page.** The sweep
  only answers «which of the several sources does this sentence come from?»;
  with one source the vote already records an unmatched sentence as
  `NOT_IN_SOURCE` (reported as the author's own reasoning). Do not run
  `--orphans`/`--sweep` or spend a reviewer call on it. **One paper → no sweep;
  two or more → the sweep-first order below.**

A multi-source page, a `POOLED` page or a long article keeps every step above
exactly as written. Record the tier and the reason in the publish report. The
stored JSON (`voted-src<k>.json`, Part 4) has the same shape on either path, so
Phase F and `tools/queue_install_des.py` read it unchanged.
<!-- /fidelity-single-source-tier:v1 -->

<!-- fidelity-sweep-first:v1 -->
**Sweep first, then measure (founder 1405/08/15).** On a page with two or more
sources whose text is in hand, the orphan sweep (step 5) runs **before any
checker run**, not after the vote. This is the only statement of the order:
the assignment (markers or a recorded founder plan) → `--orphans`, which hands
**every body sentence** to the stronger reviewer with the text of every source →
the reviewer's `orphans.json` → `--sweep` → `--build` of the full blocks → steps
1–4 **once**. No sentence is judged before its source is settled, and there is
no second sweep after the vote: a sentence the vote leaves `NOT_IN_SOURCE` was
already looked for in every source. `tools/queue_fidelity_prep.py` follows the
same order (it builds no checker block until the sweep is recorded). Records prepared under the earlier order keep their
record; a later re-check of such a page uses the rule-13 `--vote --base`
growth as before.
<!-- /fidelity-sweep-first:v1 -->

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
   sees.
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
   shared misreading. The reviewer reads the
   unit, its neighbours, the sentences the runs quoted and, where a term is
   defined there, the source's Methods, then writes
   `<dir>/review.json` (`{"src<k>": {"u…": {"agree": true|false, "reason":
   "…"}}}`). **A dissent settles the unit as `MATCHES`** (founder ruling
   2026-11-06 / 1405/08/15, queue item 22, u45): the reviewer exists because
   the lighter checkers can share a misreading, so their majority cannot
   outrank it. On `agree: false`, `--vote` sets the verdict to `MATCHES` and
   `change_kind` to `null`, keeps `source_quote`, and writes the majority's
   verdict, kind and note with the reviewer's reason into `note`
   («Checker majority: ALTERED/HEDGE_ADDED — …; overruled by the stronger
   review: …»); counts, score, level and the Persian lines are recomputed.
   `agree: true` keeps the flagged verdict for Part 3b. A flagged unit with
   no review entry stays open. `--vote` prints the overruled ids; list them
   to the founder in the report as information, never as a question.

5. **Orphan sweep (spec v3.5 rule 12) — on a multi-source page it runs FIRST,
   before step 1** (the sweep-first block above).
   `python3 tools/des_fidelity_units.py <content_id> --orphans <dir> --texts texts.json`
   lists every body sentence (headings excepted) and
   writes `<dir>/orphans-input.json` with those sentences and the text of
   **every** source. The stronger reviewer reads it — all sources, whatever a
   marker assigned — and writes
   `<dir>/orphans.json`: `{"u…": {"found": "S<n>", "source_quote": "…", "note":
   "…"}}` or `{"u…": {"found": null, "note": "…"}}`. **It finds; it never
   judges:** no verdict, no `change_kind`. Then
   `python3 tools/des_fidelity_units.py <content_id> --sweep <dir>` refuses an
   unanswered sentence or a `source_quote` that is not verbatim in that source,
   adds every found sentence to its source in the recorded plan (origin
   `orphan_sweep`, with the receipt). The sentences found nowhere are listed
   for the founder as information (the agent's Push-2 report, and M3b when M3b is sent), never as
   faults: they are the author's own reasoning or background unless the founder
   points to a source the run did not have.

`--vote` exits non-zero while any unit still needs a tie-break run, an
adjudication or a review. `voted-src<k>.json` is what Part 3 validates and
Part 4 stores — one object per source, the spec's own shape. `--vote` is for
SOURCE scope; a POOLED page is not voted (it runs one call per part and
`--merge`).

<!-- des-rating-audit:v1 -->
#### Part 2d — The DES rating audit by the stronger reviewer (every new RESEARCH record)

**When.** For every RESEARCH SOURCE record scored in this run (any `text_basis`), after
it passes Part 3 (1)–(4) and (7) and before Part 4 stores it — and for both records when
Part 1's `compare` found a difference. A record reused verbatim under Part 1 is not
audited again; COMMENTARY and `NOT_APPRAISABLE` records have no domains and no audit.
**Why every new record and not only a flagged one:** Part 3(7) sees a wrong rating only
when the record's own note says so; a scorer that writes a neutral note passes it. The
audit costs one stronger-model call per paper, and Part 1 makes it once per paper ever.

**What the reviewer does: it finds the line, it never scores.** The stronger reviewer
role of Part 2c's table, in a fresh tool-less context (Part 2's run method), receives the
record and the `source_text` it was scored on, and for each domain answers only **which
line of 3b (1–5) is the first that matches**, with the sentence(s) of the text that prove
it (an absence names the sections read instead). It never rescales, rescores, computes a
multiplier or edits the record.

```bash
python3 tools/des_record_guard.py audit-build <des.json> --texts texts.json --out <dir>
#   <dir>/audit-system.md        the audit instruction + the spec's Step 3 rules (3a–3b-ii), verbatim from
#                                .dentcast/des-v3.6-knowledge.md — the system prompt
#   <dir>/audit-input-src<k>.json one block per RESEARCH source (record + source_text)
cd "$(mktemp -d)" && claude -p --system-prompt-file <dir>/audit-system.md --tools "" \
  --model <stronger model> < <dir>/audit-input-src<k>.json > <dir>/audit-src<k>.json
python3 tools/des_record_guard.py audit-apply <dir> --record <des.json> --texts texts.json
```

`audit-src<k>.json` is `{"domains": [{"domain", "line": 1–5, "quotes": […], "note"}]}`,
the record's domains in order (a ```` ```json ```` fence is stripped). For the AMSTAR-2
excluded-studies domain the reviewer applies 3b-iii and answers the 3b line of the same
rating (low → 3, some_concerns → 4, high → 1). `audit-apply` refuses (exit 2) a missing
domain, a line outside 1–5, line 5 under `FULL_TEXT`, a line 2–4 without a quote, a
silent line 1 without a note, or a quote that is not verbatim in `source_text` (Part 3(1)'s
normalisation); it maps the line to a rating (1, 2 → `high`; 3 → `low`; 4 →
`some_concerns`; 5 → `NR`), compares it with the record and writes
`<dir>/audit-receipt.json`.

- **Exit 0 — every line agrees.** Record the receipt (record sha256, system-prompt sha256,
  the model the run reports) in the run report (queue: `اجرا.md`); Part 4 stores the
  record unchanged.
- **Exit 1 — a line disagrees: the record is invalid.** Never hand-patch the rating.
  Rerun the SOURCE call by Part 2 (a new context), run Part 3 and this audit on the
  rerun. A rerun that passes Part 3 and that the audit agrees with is stored verbatim; the
  invalid record and each audit are kept in the run report. When two reruns still
  disagree with the audit, or the audit and a rerun disagree on the same domain in
  opposite directions, it is **adjudicated**: a second stronger-reviewer audit in a fresh
  context decides which reading of 3b the text supports, and only a model run whose
  ratings match that decision is stored. If none does, nothing is stored for that source
  and the step stops: the founder is shown the record, the audits and the reruns as a
  real decision; a record the audit contradicts is never published.
- **Exit 2** — the audit itself is malformed: run it again; nothing is decided by it.
<!-- /des-rating-audit:v1 -->

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

6. **Persian text of the record (the DES Persian text is independent of the
   founder) — an agent check, not a score check and
   not a founder gate.** For a record that already passes (1)–(5), run
   `python3 tools/verify_publish.py --des-text <des.json>` on every SOURCE and
   COMMENTARY object before it is stored. The replaced-word check is automatic:
   it fails on a word the founder replaced («ادبیات» → «منابع علمی»;
   `fact_fa` and `interpretation_fa` of v3.5+ records only — records stamped
   below 3.5 keep their text) and lists the `interpretation_fa` sentences (when non-null) one
   by one. Then check each sentence against the scored text yourself: **a
   sentence that says anything the text does not say, or is unclear, is fixed
   by the agent itself** — delete it, or rewrite it to a smaller claim the text
   supports (and repair any pronoun or reference the deletion leaves dangling).
   The founder is not asked and is not shown the sentence. The score, band and
   quotes never change, and the model is never re-run for wording. Record
   before/after in the run notes. FIDELITY `fact_fa` / `interpretation_fa`
   lines are composed by `tools/des_fidelity_units.py` and recomputed by every
   `--vote`: check them after the last Part 3b re-vote, just before Part 4, and
   fix a flagged one the same way. This does not touch Part 3b: the founder
   gate on `ALTERED` / `REVERSED` page sentences stays. Phase F enforces only
   the word list; the claim check is yours.

<!-- des-rating-rule:v1 -->
7. **Rating rule (spec 3b) — a score check, never fixed by editing.** On every
   RESEARCH record before it is stored, `python3 tools/des_record_guard.py check
   <des.json>` (the same check runs inside `verify_publish.py --des-text`) fails:
   - **EMPTY_QUOTE** — a `low` or `some_concerns` domain with an empty
     `evidence_quote` (Core Rule 2: only an absence-based `high` omits it), any basis;
   - **ABSENCE_NOTE** — under `FULL_TEXT`, a `some_concerns` domain whose `note`
     states that the safeguard is absent («no statement of losses», «not reported»,
     «never states», «ذکر نشده» …) **and** whose `evidence_quote` holds no word of that
     domain. Line 4 needs the text to *address* the domain; a quote about something
     else plus a note saying the rest is missing is silence, and silence under
     `FULL_TEXT` is line 1, `high`. A note naming one missing element of a domain
     the quote does address («sequence generation described; allocation concealment
     not mentioned») is line 4 and passes. The AMSTAR-2 excluded-studies domain is
     exempt from this half (its `some_concerns` is «no list, but…», 3b-iii).
   From spec v3.6 the rule this check approximates is stated in the spec itself (3b-ii,
   «What addresses a domain»: a `low`/`some_concerns` quote is a sentence about that
   domain's safeguard); the check stays a mechanical backstop, and Part 2d's audit, which
   reads the same 3b-ii, is the full test.
   A finding makes the record invalid: rerun the SOURCE call (Part 2) and audit it
   (Part 2d); never change a rating, quote or note by hand. **Phase F runs it too**
   (rows `4.13 DES`): a finding is `FAIL` on a source stamped 3.5 or later in a record
   scored on or after 2026-11-07, and a warning on older records, which are not
   re-labelled. The queue's freeze check runs it as `P5` (`queue_stamp.py`; `W6` on an
   item prepared before that day), and `tools/des_library.py` holds reader submissions
   to it. A frozen queue record's Phase F rows are warnings on publish day
   (`queue-maintainer.md`), so for a queue item the binding gate is the freeze.
<!-- /des-rating-rule:v1 -->

**Reproducibility check (appendix §6) on the first score of any new question type:**
score the same input three times. A one- or two-point drift in the number is
acceptable; **a band change is not** — it means the anchors were read loosely and the
run is unusable.

#### Part 3b — Offer the founder a fix for every differing sentence (founder gate, never automatic)

**The fidelity grade exists to make the writing better, and the goal is
«کاملاً مطابق»**. So when a validated FIDELITY result
carries any `ALTERED` or `REVERSED` unit, the publish **stops here, before
Part 4 stores the final result**, and the founder is shown each such sentence and asked
whether to fix it. These blocks are **message M3b at C.4.13**
(`publish-checkpoints.md`): never deferred to the final report, never skipped
because the grade is already high. Only units
still flagged after the Part 2c step 4 review reach this gate; a unit the
stronger review overruled is already `MATCHES` and is listed in the report as
information, never asked.

**Save point.** Before M3b goes out, write the validated result into
`plus/des-scores.json` exactly as Part 4 would, commit and push it with the page
and the handoff (C.4.13 stays `started`, M3b stays in `pending_questions`). It is
provisional, not the gate's outcome: the re-run below replaces its `fidelity`
and `scored_at`, as for a page already published. If the session is lost while
M3b waits, the next session rebuilds `<dir1>/voted-src<k>.json` from the stored
`fidelity` slots (the same shape), resolves `source_text` again by Part 1, and
continues from the founder's answers; no checker run is repeated. A `POOLED`
slot folds several parts and cannot be split back: on such a page the DES
`sources` survive, the Fidelity step runs again.

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

- Apply it to the page body exactly as approved. If the edited sentence also
  lives on a surface **already written** — the lead used for the description;
  and, only when they exist already, the en mirror (translated, nothing else
  touched), the brain `summary`, the Pulse line — that is a **sweep** (Hard Rule
  17): every such surface in the same commit. In a direct run the mirror, brain
  entry and Pulse line are written after C.4.13 from the locked text, so they
  start from the fixed sentence.
- **Re-check only the edited sentences** — the last
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
- **Figure captions added after the full run** (founder ruling 2026-11-07,
  publish-queue item 24: «وقتی فقط کپشن اضافه شده فقط کپشن باید چک بشه، بقیه همه
  تأییدشده»). A `<figcaption>` is page text and its sentences are units, so
  inserting one renumbers every unit after it. Do not rerun the page:
  `python3 tools/des_fidelity_units.py <content_id> --carry <dir1> --texts
  texts.json --build <dir2>` matches every unit of the last full run to its new
  id by its exact text, carries its verdict, and builds blocks for the caption
  units alone; run those by Part 2c (two runs, a tie-break where they differ, a
  stronger review of anything flagged), then `--vote <dir2> --base <dir1>`, which
  applies the same mapping. Both refuse when anything but a caption moved — a
  body sentence changed, split, joined or vanished, a new unit that is not a
  caption, or a recorded plan in `.dentcast/des-fidelity-plans/` that names the
  old ids — and then the full step runs again.
- **A source text that grows** (spec v3.5 rule 14 — the founder adds pages to an
  excerpt): pass the new `texts.json` with `--vote <dir2> --base <dir1> --texts
  texts.json`. The tool compares it with `<dir1>/input-src<k>.json`; when the old
  text is contained in the new one, re-check every unit of that source that was
  not `MATCHES` (`NOT_IN_SOURCE` and `NOT_ASSESSABLE` included — the new pages may
  speak to them) and keep the `MATCHES` units; anything else changed in the text
  is refused, and then the full step runs again.
- Report the grade **before → after** («تطابق خیلی بالا → کاملاً مطابق»). If the
  new run still flags a sentence — including one just rewritten — offer it
  again; the loop ends when nothing is flagged or the founder says «همین بماند».

Only then go on to Part 4, which stores the **final** result.

**For a page already published** (trigger **«تطابق X رو کامل کن»**, «عدم
انطباق‌های X رو نشونم بده»): read its stored `fidelity` from
`plus/des-scores.json`, run this same Part 3b on it, then the re-run above,
then Part 4 (replace the record's `fidelity` and its `scored_at`), Phase F,
and the version stamp last (module 11, §7). Resolve `source_text` again by Part 1 (the
scratch copy does not survive a session) — and from the **same** basis the
SOURCE record was scored on, or the tool refuses it.

#### Part 4 — Store the record

**The score does NOT go in `dentcast-brain.json`.** Hard Rule 5 forbids adding a
field previous same-category entries do not have, and no brain entry carries
one. It lives in its own versioned file, exactly as `plus/pathways.json` and
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
record, and a `null` on such a source stays valid in a record with no 3.1
slot. **Under `POOLED` scope it is the one pooled object instead of an array**,
because that call judged the page against all its sources at once. It is omitted entirely on a record
stamped below 2.5, on a basket-1 page, or on a core audio episode (Part 2b); Phase F accepts both shapes and
rejects a `fidelity` whose length differs from `sources`. Parallel by index
rather than keyed by DOI because the spec's output object carries no
identifier of its own, and inventing one would be a second copy of
`citation.doi`.

Two invariants and nothing else. **`sources` and `fidelity` hold the spec's output objects
verbatim** — the spec owns both shapes, so never reshape, rename, reorder or trim them.
The COMMENTARY `commentary_checklist` `item` labels are part of that: the spec's
Transparency Checklist names them in **English**, so they are stored as the model emitted
them and are never translated to the Persian wording older records carry — `plus/js/des.js`
maps both forms to the Persian the card shows (`CHECKLIST_FA`; an unknown label is shown as
stored), and no point, band or sum depends on the label's language.
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
page. The shared renderer draws every stored record. **`fidelity` is drawn too,
from spec 2.8 on:** `plus/js/des.js` adds a second chip («تطابق با منابع: …», one
word, never a number) beside the band chip and a «تطابق با منابع» tab in the
card, read from the record this step writes — so a fidelity object stamped 2.8 or
later goes live the moment it is stored, and an older stamp is ignored (approved mockup
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
true; and the outcome of each of the five Part-3 checks and of Part 3(7). The Part 1
`lookup` result (reused from where, or newly scored) and any `compare` difference; the
run command, model and system-prompt sha256 (Part 2); the Part 2d audit receipt, or why
none was owed. Per FIDELITY slot: the
`level` and the word the reader will see for it («تطابق خیلی بالا», spec v2.8
appendix rule 5), the count line («۵۰ از ۵۲ ادعایی که منابع به آن پرداخته‌اند
مطابق است؛ ۴ جملهٔ دیگر در منابع نیامده»), every `ALTERED` and `REVERSED` unit
with its `change_kind`, every unit the stronger review overruled to `MATCHES` (Part 2c step 4: the
majority's verdict and the reviewer's reason, as information), or the reason for a `null` or `INSUFFICIENT_TEXT` slot. And Part 3b's outcome: each
offered sentence with the founder's answer («اصلاح کن» / «خودم می‌نویسم» /
«همین بماند»), and the grade before → after the re-run. For a skip, the documented
reason line. Explicitly confirm that no DOI, abstract, or quartile was guessed.
