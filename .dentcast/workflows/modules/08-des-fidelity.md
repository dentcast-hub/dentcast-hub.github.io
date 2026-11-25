<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages, the save point and the deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger step in this module: `C.4.13` (after C.4.6 and C.4.10, before C.4.7; it starts the text lock and never waits for the founder). The save point (`publish-checkpoints.md`) comes here: once Part 4 has stored the record, commit and push the scoped work, `plus/des-scores.json` and the handoff.

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

2. **Fidelity supplied** (by the founder, another agent or another client — Claude, Codex, Cursor, Cowork alike): This is a separate track, not a prerequisite to accepting valid DES JSON. The one test is «Acceptance is mechanical» below: `tools/des_fidelity_units.py <content_id> --texts texts.json --accept FILE` on the final page text, for all owed source/POOLED calls. **No run receipts, model ids, preflight record or proof of independent contexts are asked for**, and their absence is never a reason to refuse. When it exits 0, **DO NOT rerun Fidelity model calls**; preserve the JSON verbatim. Units it leaves `ALTERED`/`REVERSED` go to Part 3b as usual (the founder gate is unchanged); a unit the supplier's judge (or, under the earlier protocol, stronger review) already overruled is `MATCHES` in the JSON and is not asked again. If Fidelity is **not supplied** but is canonically owed, run **only the missing Fidelity calls** under Parts 2b/2c, not the already accepted DES. For COMMENTARY self-records and other lawful Fidelity exceptions, record the correct `null`/error/zero-unit outcome rather than fabricating model calls.

3. **No supplied results:** Execute the usual Parts 1–4, including all owed DES and Fidelity calls. If a supplied track's JSON is incomplete, stale, inconsistent, from another content ID, unverifiable against actual source text, or otherwise fails Part 3 (for Fidelity: `--accept` exits non-zero), **record 4.13 as blocked** with the exact failing rows and request corrected data. **Never silently rerun the founder's supplied result** to work around a bad/missing JSON; do not label the absence as a founder «بدون DES» exemption. Partial source sets are not a completed DES packet.

4. **All paths still require gates:** Perform the complete Part 3 checks, applicable Part 3b founder fixes/decisions, Part 4 storage in `plus/des-scores.json`, and Phase F. Reused results are **not a SKIP**. Record whether DES and Fidelity were reused or executed separately. Any subsequent change to the final page body, source identity/text/basis or scoring spec invalidates the affected supplied results until verified anew. Never commit private source text or approval transcripts.

<!-- fidelity-mechanical-acceptance:v1 -->
#### Acceptance is mechanical — one rule for every agent and client

DES and Fidelity exist so an article can be trusted, not to make a simple article
hard to publish. A result is trustworthy when what it says can be checked against
the page and the source; how it was produced cannot be checked from the file at all
(a receipt is only text an agent writes about itself). So:

1. **A FIDELITY result is accepted when, and only when,**
   `python3 tools/des_fidelity_units.py <content_id> --texts texts.json --accept FILE`
   exits 0. `FILE` is one F5 object, a list parallel to `sources`, `{"src<k>": object}`,
   a `voted-src<k>.json` or a whole `plus/des-scores.json` record. It checks exactly what
   makes the result this page's and true to the source: one result per call the tool
   owes; the claim ids are the tool's units for the final text; every `claim_quote` is
   its unit's text byte for byte; every `source_quote` is verbatim in `source_text`;
   verdicts and `change_kind` from the closed lists; silence verdicts match the basis;
   counts, score, level and `provisional` recompute (Phase F's own checks); and, on a
   multi-source page, no body sentence left outside every call without the sweep the
   block below owes (Part 2c). A DES
   SOURCE/COMMENTARY record is accepted by Part 3 and `des_record_guard.py check`, the
   same way.
2. **No agent refuses a result that passes, for any process reason** — which agent or
   client made it, which model, how many contexts, a missing receipt or preflight, a
   different report layout, «not standard». A refusal names the failing `--accept` (or
   Part 3) row; anything else is not a refusal, and the result is used as it is.
3. **Provenance is information, never a gate.** Write the models and runs in the publish
   report when they are known, `UNVERIFIED` when they are not.
4. **How you produce a result yourself** stays Part 2c (one sweeper run and one judge,
   each in its own context; the founder sees the units they differed on). That
   is the producer's method; the receiver checks the result, not the method.
5. **Nothing is added to DES/Fidelity on an agent's own initiative.** A new step, gate,
   receipt or validation rule enters only by founder decision, and only when it catches
   a real error seen in a published or queued article. A rule that makes the process
   heavier without making articles more reliable is removed, not kept. The bar is «the
   reader can trust it», not a NASA document.
6. **Handing the work to another agent — one file.** The founder tells one agent «DES و
   Fidelity رو اجرا کن», takes the file it gives, and hands that file to another agent
   (Codex, Cursor, Cowork…) without anything else. The producing agent, after its vote,
   writes the file with
   `python3 tools/des_fidelity_units.py <content_id> --texts texts.json --fidelity <vote dir or file> [--des des.json] --pack <.dentcast/relay/… or outside the repo>`;
   the packet carries the DES record, the FIDELITY result and the source texts they were
   judged on, and `--pack` refuses a result that would not pass `--accept`. The receiving
   agent runs `python3 tools/des_fidelity_units.py <content_id> --accept <file> --install`
   on the same final page text: exit 0 means accepted and written into
   `plus/des-scores.json`; then Part 3b for any unit still `ALTERED`/`REVERSED`, and Phase F
   (which repeats the DES arithmetic, band and schema checks) as always. It reruns no model
   call and asks for nothing else. The packet holds the papers' text: on the founder's request it is
   committed under `.dentcast/relay/`, never refused; otherwise it stays outside. If the receiver's page text differs from the
   producer's, `--accept` names the sentences; only those are re-checked (Part 3b's
   `--vote --base`), never the whole step.
<!-- /fidelity-mechanical-acceptance:v1 -->

<!-- des-scored-once:v1 -->
#### Scored once — the whole step in five rules

The goal is to publish, and to tell the reader honestly how strong the paper is and
whether the page says what it says. Everything below serves that and nothing else.
These five rules hold on every route (own isolated process, sub-agent, relay) and
override any older sentence that asks for more.

1. **DES is scored once per paper.** The SOURCE call is run again in exactly two
   cases: the answer is about another paper (`WRONG_PAPER`: its `citation.doi` is not
   the DOI of the call), or it is not a usable JSON object (`NOT_JSON`,
   `NOT_SCORABLE`). Every other defect is repaired by the tool, never by a new run and
   never by hand:
   `python3 tools/des_repair.py ANSWER.json --texts texts.json -o des.json`
   drops keys the spec's shape does not have, recomputes each penalty's `points`,
   `des_score` and `band` from the model's own ratings, sets `provisional` from
   `text_basis`, and replaces an `evidence_quote` that is not verbatim by the passage
   of the text it came from. A quote it cannot find is emptied when no rating rests on
   it, and otherwise left as written and listed `UNVERIFIED` in the publish report.
   The ratings are the model's and are never touched. Its output is what Part 3
   validates and Part 4 stores.
2. **No second opinion on the score.** There is no rating audit, no three-times
   reproducibility run and no comparison of reruns (there are no reruns). A stored
   record of the same paper is reused (Part 1); two stored records that disagree are
   reported to the founder, nothing more. The `ABSENCE_NOTE` finding of Part 3(7) is a
   warning in the report; `EMPTY_QUOTE` stays a failure (a rating with no evidence at
   all is not a rating).
3. **Fidelity is one call per source.** One sweeper run is the result:
   `--vote <dir>` settles a directory that holds only `out-src<k>-1.json`, recomputing
   counts, score and level. The judge is optional on every route: an agent that can
   start a second isolated process itself may run it (Part 2c), at no cost to the
   founder; it is never carried through the relay and never a reason to wait.
4. **Relay: one file per paper, one trip.**
   `python3 tools/relay_call.py pack-paper --system .dentcast/des-v3.7-knowledge.md --source-block BLOCK.json --fidelity-input <dir>/input-src<k>.json --des-to <dir>/des-src<k>.json --fidelity-to <dir>/out-src<k>-1.json --out .dentcast/relay/<name>.md`
   carries the SOURCE call and the Fidelity sweep of that paper together; `ingest`
   splits the reply and refuses only another paper's answer. A page with five papers
   is five trips. The two-context separation of SOURCE and FIDELITY is given up on this
   route only, knowingly: the rating follows the paper's own text and closed rules.
5. **Flagged sentences never hold the publication.** `ALTERED`/`REVERSED` units are
   listed in the agent's Push-2 report, each with the source's sentence and one
   proposed rewrite (Part 3b's block). The page ships with the author's text and the
   record says what was measured. The founder fixes them afterwards, when he wants,
   with «تطابق X رو کامل کن». There is no message M3b and no stop at C.4.13.
<!-- /des-scored-once:v1 -->

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
when module 03 added one), exactly as it will ship and without the presentation
layer (below, Part 2b): `python3 tools/presentation_diff.py --text-of-record
<page.html | 01-متن.md>` prints it. `text_basis` is `FULL_TEXT`. No DOI, no lookup, done.

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

- **A stored record with the same `text_basis`, stamped with the current spec (3.7, or 3.6: 3.7 moved no score), that
  passes Part 3 (including (7)) is reused verbatim** — no SOURCE call, no rerun. Copy the
  object byte for byte into this page's `sources`; record «reused from <content_id or
  queue item>, index <i>, sha256 <…>» in the run report (queue: `اجرا.md`). Part 2d's
  audit is not repeated for a reused record. Still resolve its `source_text` by the ladder
  below — the FIDELITY call needs it.
- **No stored record, or only one under another `text_basis` or an older stamp** (an
  abstract scored before the full text was in hand, a 3.2 record): score it once
  (Part 2). A stored record is never re-labelled or edited.
- Two stored records of one DOI that already disagree with each other (`lookup` shows
  both) are reported to the founder; the newer one is used meanwhile.
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
**An empty `source_conclusion` is never sent to a model.** The receipt of
`pdf_source_text.py` shows the conclusion the blocks will carry; when a layout
defeats the cut (a two-column page that glued «CONCLUSIONS REFERENCES» into one
line) it warns and exits 3, and
`des_fidelity_units.py --build` refuses. Pin the paper's own last conclusion
sentence **before the first run** — `pdf_source_text.py … --conclusion "…"`, or
`"source_conclusion"` in `texts.json` (verbatim, or the tool refuses) — never by
editing the echo in the run outputs afterwards.
<!-- /pdf-source-text:v1 -->

#### Part 2 — Run the prompt file

**Load `.dentcast/dentcast-evidence-score-v3.7.md` as the system prompt — the whole
file, verbatim, minus the appendix.** That cut already exists:
`.dentcast/des-v3.7-knowledge.md`, byte for byte. Pass that file; never cut the
appendix yourself (a hand cut keeps a trailing blank line, so its digest differs
from every other run's).

<!-- des-system-prompt-run:v1 -->
**How the SOURCE call is run: the spec file IS the system prompt.** One fresh,
tool-less process per input block, started in an empty directory, with
`.dentcast/des-v3.7-knowledge.md` as its system prompt and the Step 0 block (below)
as its only user turn. The model is the strongest reasoning model the environment exposes (Part 2c's table).
Claude Code (flags as in `claude --help`):

```bash
cd "$(mktemp -d)" && claude -p --system-prompt-file <repo>/.dentcast/des-v3.7-knowledge.md \
  --tools "" --model <stronger model, e.g. opus> --no-session-persistence --output-format json \
  < block.txt > out.json        # the object is out.json's "result"; the model actually used is in "modelUsage"
```

Another provider: the same contract (empty directory, the whole file as the system
instruction, no tools, the role's model; Codex: `agent-parity.md` «اجرای ایزوله»).
**Never** hand the spec to an agent as a file it reads with a file tool: an agent that
reads 1,400 lines in pieces does not hold the rules the way a system prompt does. When no such process can be started, the step stops under
the «توانمندی ندارم» protocol; it is never simulated. Record in the run report (queue:
`اجرا.md`) the command, the model the run reports, and the sha256 of the system-prompt file.

<!-- /des-system-prompt-run:v1 -->

<!-- des-version-history:v1 -->
**v3.7 is the current spec.** What each earlier version changed is in
`.dentcast/workflows/des-version-history.md`. Read it when you validate,
re-score or compare a record stamped below 3.6 (it also holds the binding rules for
older stamps); a new 3.7 run does not need it. These rules stay binding here:

- v3.7 only adds `source_kind: "manufacturer"` (a maker's own brochure,
  instructions for use or product guide that reports no study: `NOT_APPRAISABLE`,
  no score, FIDELITY as usual, text in hand required). No RESEARCH score moves,
  so a 3.6 record is the same measurement as a 3.7 one (Part 1 reuses it;
  `compare` reads it as comparable); `"manufacturer"` is legal only on a 3.7 stamp.
- Every record is validated under its own `des_version` stamp; an old record is
  regenerated, never re-labelled to a newer version.
- A penalty object carries both `base_points` (the row weight, 8/5/5/3) and
  `points` = `max(1, round_half_up(base_points × S_design ÷ 100))`; Phase F
  recomputes the pair and fails a mismatch.
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
worth more than a slightly better score nobody can.**

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
findings (e.g. «تجربه‌های بالینی **و** یافته‌های علمی») does not qualify. The appendix says so itself ("NOT part of the
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
stay inside their sentence. A record already judged
on the earlier cut keeps it (`split_for`), as it keeps its `source_conclusion`:
no stored id moves. Segmentation and attribution stay out
of the model's hands because they are the largest sources of run-to-run
disagreement.

<!-- presentation-layer:v1 -->
**The presentation layer is not page text.** An element that carries
`data-dc-presentation` (module 03, «Structure, chips and callout boxes»: an
added section heading, a bold sub-label, a status chip, a callout-box label,
the number added to an author's heading) is removed before the cut, in the
tool and in every reader of the page text (`article_region()`: Phase F's
quote haystacks, the COMMENTARY `source_text`, the queue's text check). It
takes no unit id, reaches no call, and is in no `claim_quote`,
`evidence_quote`, count or score. The «derivative text» of the spec's appendix
rule 7 is the page without this layer; that is the caller's half of the rule
and is stated here. Only a marked element is skipped: a heading or label
without the marker is a unit exactly as before, so no record made before the
layer existed moves. A malformed marker (on another tag, never closed, around a
link, image or list) is refused by the tool and fails Phase F.

So a change that touches only this layer (elements added, edited or removed; a
run of the author's sentences wrapped in place in a callout box) changes no
id, quote or verdict, and the stored record stays valid: no re-check, no
`--carry`, no model call. That it touched nothing else is proved, never
assumed: `python3 tools/presentation_diff.py` (module 03) compares the old
version with the new one and passes only when the units are the same under
both cuts, the text of record is identical codepoint for codepoint and, on a
page with two or more cited sources, the paragraphs are the same (a sentence
takes its source from its paragraph, so a box wraps whole paragraphs there and
the recomputed plan must come out unchanged). Otherwise it names the first
differing sentence, and that change is a text change: Part 3b's re-check for an
edited sentence, the full step for anything else.
<!-- /presentation-layer:v1 -->

**The output** is the spec's F5 object. Validate it in Part 3(5), then store it
in Part 4.

#### Part 2c — How the FIDELITY call is run: one sweeper run; the judge is optional

Records and work directories made under the earlier protocol (two checker runs, a
tie-break, a stronger review) keep their record; `--vote` still reads such a
directory (two run files and `review.json`/`adjudicate.json`, no
`judge-src<k>.json`). Every new run, re-check and caption check is **one sweeper run** (step 1), settled by
`--vote` (step 3). Steps 2 and 4 describe the optional judge («Scored once», rule 3):
run it only when you can start a second isolated process yourself. This changes the caller's protocol only:
the spec, its verdict rules, F4 and the bands are untouched, and where the spec's
appendix (rule 12) names «two checker runs, tie-break, stronger review» it means
this Part 2c, which now reads «sweeper, judge».

**Two roles, both the strongest reasoning model the environment exposes, each in
its own fresh context:**

| Environment | Sweeper and judge (the same model is fine; the contexts are separate) |
|---|---|
| Claude / Anthropic | Opus |
| ChatGPT / Codex / OpenAI | the strongest reasoning model exposed, e.g. `gpt-6-astra` |
| Grok / xAI | the strongest flagship reasoning model exposed |
| Any future provider | the strongest available reasoning model |

These are role examples, not fixed versions or quality equivalences; verify the
actual model ids before starting and write them in the publish report
(`UNVERIFIED` when the runtime does not show them). A lighter model is never used
for either role; no stronger model available ⇒ the available one takes both, and
that is not a reason to stop or to ask. **Price is never a gate. The one thing
that cannot be replaced is the separate context:** the judge must not be the
context that made the sweep. Two sequential tool-less processes (`agent-parity.md`
«اجرای ایزوله») are enough — no parallel agents, no multi-agent tool. If the
runtime gives no separate context at all (ChatGPT, a cloud agent with no CLI), use
the relay route (`agent-parity.md` «مسیر رله», `tools/relay_call.py pack-paper`): one
file per paper, sweeper only, no judge; only if the founder declines it,
«توانمندی ندارم». Never present one context's self-review as a judge.

1. **Sweeper — one full run per input block.** The spec file
   (`.dentcast/des-v3.7-knowledge.md`) as the system prompt, the block
   (`<dir>/input-src<k>.json` from `--build`) as the only user turn, saved as
   `<dir>/out-src<k>-1.json`. Exactly one run file per source; it answers every
   unit of the block.
2. **Judge — the tool builds its input, never the agent.**
   `python3 tools/des_fidelity_units.py <content_id> --judge <dir>` writes
   `<dir>/judge-system.md` (the judge instruction + the spec's FIDELITY track,
   verbatim) and `<dir>/judge-input-src<k>.json` (source text, basis, conclusion,
   every unit with the sweeper's verdict, kind, quote and note). Run it in a fresh
   tool-less process like the sweeper (the tool prints the command) and save the
   answer as `<dir>/judge-src<k>.json`: **one entry for every unit the sweeper
   judged** — `{"agree": true}`, or `{"agree": false, "reason", "verdict",
   "change_kind", "source_quote", "note"}`. The judge disagrees in both
   directions: a `MATCHES` that is in fact firmer, broader or reversed, and a flag
   that is in fact faithful.
3. **Settle**: `python3 tools/des_fidelity_units.py <content_id> --vote <dir>`.
   **The judge's word is final** (the judge exists to catch the sweep's misreading,
   so the sweep cannot outrank it).
   `agree: true` keeps the sweeper's answer. `agree: false` on an
   `ALTERED`/`REVERSED` unit with no verdict or `MATCHES` settles it as `MATCHES`
   (`change_kind` null, `source_quote` kept, both reasons in `note`); any other
   disagreement takes the judge's verdict, kind, quote and note, with the sweeper's
   answer kept in `note`. Counts, score, level and the Persian lines are
   recomputed; Part 3 validates the result (every quote verbatim) as always.
   With no `judge-src<k>.json` in the directory the sweeper's run is settled as it
   stands. With one, `--vote` exits non-zero while a unit the sweeper judged has no judge entry, or
   a disagreement carries an invalid verdict (unknown verdict, `ALTERED` without a
   kind, a kind without `ALTERED`) — then the judge runs again, never a hand patch.
4. **The doubtful units go to the founder — as information, never as a vote.**
   `--vote` prints every unit where the judge differed from the sweeper («موارد
   شک‌دار»). They are listed in the Push-2 report: the page's
   sentence, what the sweeper said, what the judge said and why. **The verdict
   stays the model's**: the founder decides whether to change the *text*, never
   which verdict the sentence gets — the reader-facing label is «ارزیابی خودکار»
   and must stay true. A doubtful unit the judge settled as `ALTERED`/`REVERSED`
   is also an ordinary Part 3b offer (fix / own wording / keep).

<!-- fidelity-single-source-tier:v1 -->
**DES is never tiered.** Every DES/SOURCE/COMMENTARY call above runs in full on
every page, whatever its length or source count. The FIDELITY protocol is the same
one call per source on every page; a single-source page is simply the case with no
sweep for orphans:

- **The orphan sweep (step 5) does not exist for a single-source page.** It only
  answers «which of the several sources does this sentence come from?»; with one
  source the sweeper already records an unmatched sentence as `NOT_IN_SOURCE`
  (reported as the author's own reasoning). Do not run `--orphans`/`--sweep` or
  spend a call on it. **One paper → no sweep; two or more → a sweep only when a
  sentence reaches no source (below).**

A multi-source page or a long article follows the same steps 1–4, once per source
call. A `POOLED` page runs one sweeper call per part and `--merge` (Part 2b); it is
not judged per part and not voted. The stored JSON (`voted-src<k>.json`, Part 4)
has the same shape on every path, so Phase F and `tools/queue_install_des.py` read
it unchanged.
<!-- /fidelity-single-source-tier:v1 -->

<!-- fidelity-sweep-first:v1 -->
**The orphan sweep is owed exactly when a sentence would escape the check — and the
tool decides, not the agent.** On a page with two or more sources
the assignment comes from the tool: the sources the prose names, the declared markers
(`.dentcast/des-source-markers.json`) or a recorded plan. A body sentence it gives to
no source would be judged by no call and would silently drop out of the grade. So:

- **Every body sentence reaches a source** (named, carried from its paragraph, or a
  recorded plan) → no sweep; build and run steps 1–4 directly.
- **At least one body sentence reaches none** → the sweep runs **before** the
  sweeper: `--orphans` → the strong model's `orphans.json` → `--sweep` →
  `--build`. `tools/des_fidelity_units.py` enforces it: the plain report and `--json`
  (`unswept`) list those sentences, and a full `--build`, `--pack` and `--accept`
  refuse until the sweep is recorded in `.dentcast/des-fidelity-plans/`.
  `tools/queue_fidelity_prep.py` starts the sweep by itself in that case
  (`--sweep-first` forces it on a page that does not owe it).
- Never owed: a one-source page, a `POOLED` page (every unit goes to every source),
  a recorded founder plan, records stamped before 3.5, a sentence that names a cited
  source with no text (it is about that source), and the Part 3b / caption re-checks
  (`--build --only`, `--carry`), which keep the base run's plan.

Records prepared under the earlier order keep their record.
<!-- /fidelity-sweep-first:v1 -->

**The model is part of the measurement:** freeze the same model/version and
reasoning settings for the sweeper of a record and for every re-check of it; the
judge is a separate role and a separate context. The sweeper never sees the
judge's output; the judge sees the sweeper's answers by design (it is reviewing
them). Record actual provider/model ids, reasoning settings and each call's role
in the publish report (outside the spec's score objects).

5. **Orphan sweep (spec v3.5 rule 12) — owed when a body sentence reaches no
   source, and then before step 1** (the block above).
   `python3 tools/des_fidelity_units.py <content_id> --orphans <dir> --texts texts.json`
   lists every body sentence (headings excepted) and
   writes `<dir>/orphans-input.json` with those sentences and the text of
   **every** source. The strong model, in a fresh context, reads it — all sources,
   whatever a marker assigned — and writes
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

`voted-src<k>.json` is what Part 3 validates and Part 4 stores — one object per
source, the spec's own shape. `--vote` is for SOURCE scope; a POOLED page is not
voted (it runs one call per part and `--merge`).

<!-- des-rating-audit:v1 -->
#### Part 2d — retired

The rating audit by a second reviewer is no longer a step («Scored once», rule 2).
`tools/des_record_guard.py audit-build` / `audit-apply` remain for the one case the
founder asks for an audit of a named record by himself; nothing in a publication
runs them and nothing waits for them.
<!-- /des-rating-audit:v1 -->

#### Part 3 — Validate the output mechanically (the appendix's contract)

The prompt returns a single raw JSON object. Before anything is stored, pass the answer through
`tools/des_repair.py` («Scored once», rule 1); these checks then hold on its output:

1. **Quote verification.** Every `evidence_quote` must be a **verbatim substring** of
   the `source_text` you supplied, after normalizing both sides (collapse whitespace
   runs, strip soft hyphens and line-break hyphenation, expand fi/fl ligatures,
   straighten curly quotes, nbsp → space, Unicode NFKC). `des_repair.py` makes them so; a quote it
   could not find under a rating is reported `UNVERIFIED`, and is not a reason to rerun.
   **One quote is checked against a different file:** a `chairside/`, `metanotes/`
   or `insight/` COMMENTARY item 4 earned from the section-level declaration quotes
   that section's `index.html`, not the article, and must carry a `note` saying so.
   Phase F knows both haystacks and refuses the note-less version.
2. **Arithmetic recomputation.** RESEARCH:
   `des_score == round(s_design.value × q_method.multiplier) − Σ penalty points`,
   floored at 0. COMMENTARY: `des_score == 5 + Σ checklist points`. `des_repair.py`
   recomputes the number from the model's ratings; it is never typed by hand.
3. **Band agreement.** `band` must be the one `des_score` actually falls into
   (A 80–100 · B 60–79 · C 40–59 · D 20–39 · E 0–19). For COMMENTARY the band is
   **always `E`** with a score in 5–19; `des_repair.py` sets it.
4. **Schema.** Exactly the spec's key set; `des_repair.py` drops extras. `question_type` is the literal
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
   - **ABSENCE_NOTE** (a warning, reported, never a stop) — under `FULL_TEXT`, a `some_concerns` domain whose `note`
     states that the safeguard is absent («no statement of losses», «not reported»,
     «never states», «ذکر نشده» …) **and** whose `evidence_quote` holds no word of that
     domain. Line 4 needs the text to *address* the domain; a quote about something
     else plus a note saying the rest is missing is silence, and silence under
     `FULL_TEXT` is line 1, `high`. A note naming one missing element of a domain
     the quote does address («sequence generation described; allocation concealment
     not mentioned») is line 4 and passes. The AMSTAR-2 excluded-studies domain is
     exempt from this half (its `some_concerns` is «no list, but…», 3b-iii).
   `EMPTY_QUOTE` fails here, in Phase F (rows `4.13 DES`) and at the queue's freeze
   (`P5`); it is the one finding of this check that sends a record back. `ABSENCE_NOTE`
   is a regex approximation of spec 3b-ii and is only reported.
<!-- /des-rating-rule:v1 -->

#### Part 3b — Report every differing sentence with a proposed fix (never a stop, never automatic)

**The fidelity grade exists to make the writing better, and the goal is
«کاملاً مطابق»**. So when a validated FIDELITY result
carries any `ALTERED` or `REVERSED` unit, **the publication goes on**: Part 4 stores
the result as measured, and the agent's Push-2 report carries one block per such
sentence («Scored once», rule 5). The founder answers when he wants; an answer that
changes the text is applied by the published-page route at the end of this Part.
Doubtful units of an optional judge run (Part 2c step 4) are listed in the same report.

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
5. the three named answers the founder may give afterwards: **«اصلاح کن»** (apply the
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
- **The founder's answer ends the loop.** An accepted edit is copied into the page and
  that is the text of record; no re-check is owed by default. When the founder asks for
  a new grade, or the page is to stay consistent with its record, measure only the edited units (`--build <dir2> --only u…`, the same
  `source_text` and basis, one sweeper run, then
  `--vote <dir2> --base <dir1>` against `<dir1>`'s `voted-src<k>.json`). Never patch a
  verdict by hand.
- **Figure captions added after the full run** — only the captions are checked;
  every other verdict stands. A `<figcaption>` is page text and its sentences are units, so
  inserting one renumbers every unit after it. Do not rerun the page:
  `python3 tools/des_fidelity_units.py <content_id> --carry <dir1> --texts
  texts.json --build <dir2>` matches every unit of the last full run to its new
  id by its exact text, carries its verdict, and builds blocks for the caption
  units alone; run those by Part 2c (the sweeper over them, then `--judge` and the
  judge), then `--vote <dir2> --base <dir1>`, which
  applies the same mapping. The language toggle's label («English», `<a
  class="lang-btn">` after the h1) is carried the same way: a result made on a
  preview without it (for example an outside client's draft) is one
  id off on the final page; `--carry` re-keys the result and writes the toggle
  as `NOT_A_CLAIM` itself (a link label is never a claim; no model call), and
  with `--build DIR` and no caption to judge writes `DIR/voted-src<k>.json`. Both refuse when anything else moved — a body sentence changed,
  split, joined or vanished, a new unit that is neither a caption nor the
  toggle, or a recorded plan in `.dentcast/des-fidelity-plans/` that names the
  old ids — and then the full step runs again.
- **A source text that grows** (spec v3.5 rule 14 — the founder adds pages to an
  excerpt): pass the new `texts.json` with `--vote <dir2> --base <dir1> --texts
  texts.json`. The tool compares it with `<dir1>/input-src<k>.json`; when the old
  text is contained in the new one, re-check every unit of that source that was
  not `MATCHES` (`NOT_IN_SOURCE` and `NOT_ASSESSABLE` included — the new pages may
  speak to them) and keep the `MATCHES` units; anything else changed in the text
  is refused, and then the full step runs again.
- Report the grade **before → after** («تطابق خیلی بالا → کاملاً مطابق»). Each flagged
  sentence is offered once.

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
run command, model and system-prompt sha256 (Part 2); and every repair and `UNVERIFIED` quote `des_repair.py` listed. Per FIDELITY slot: the
`level` and the word the reader will see for it («تطابق خیلی بالا», spec v2.8
appendix rule 5), the count line («۵۰ از ۵۲ ادعایی که منابع به آن پرداخته‌اند
مطابق است؛ ۴ جملهٔ دیگر در منابع نیامده»), every `ALTERED` and `REVERSED` unit
with its `change_kind`, every doubtful unit (Part 2c step 4: the sweeper's and the judge's answer and the
judge's reason, as information; records made under the earlier protocol: every unit
the stronger review overruled to `MATCHES`), or the reason for a `null` or `INSUFFICIENT_TEXT` slot. And Part 3b's outcome: each
offered sentence with the founder's answer («اصلاح کن» / «خودم می‌نویسم» /
«همین بماند»), and the grade before → after the re-run. For a skip, the documented
reason line. Explicitly confirm that no DOI, abstract, or quartile was guessed.
