<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision; this repeated reference never requires a reread. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: D, E, F, G. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
> **Fixed page deliveries:** after `C.4.9`, after `C.4.13` including lawful skips, and after all final work, Phase F and report G. Cuts 1/2 deliver work plus handoff; cut 3 delivers final work, completion receipt and handoff deletion together. All intermediate checkpoints stay local; no extra turn-end or cleanup push.

<!-- /dentcast-checkpoint-protocol:v1 -->

## Phase D — English mirror & language toggle (MANDATORY; Hard Rule 12)

**This phase is not optional and is not the «… رو انگلیسی کن» trigger — it runs automatically at the end of every `.org` publish.** A publish that produced a new fa page but no English counterpart + working toggle is **incomplete**. The recurring failure this prevents: shipping an insight/notecast/etc. page with **no language toggle** because the cloned template never had one. The toggle is meaningless without its target, so the en page and the toggle are produced together, here, by reusing the existing English-version machinery.

**Two documented skips, and no others:** if the locked category is **LiteCast**,
skip Phase D entirely and **say so in the report** ("Phase D: skipped — LiteCast
is `.ir`-only, no hreflang/en mirror per Hard Rule 10"). If Question 4.9 answered
**چالش**, skip Phase D too and say so ("Phase D: skipped — چالش ships with no
English mirror, RULE 16 of `.dentcast/challenge-handoff.md`: the mirror would be a
different `content_id` with no row in `challenges`, so the toggle would lead to a
page missing the only thing on it"). Every other publish runs it.

**Steps:**

1. **Hand off to the English-version workflow.** Treat the page you just published (`{type}/{file}.html`) as the source and run **`.dentcast/workflows/en-version.md`** against it. That workflow already owns every detail correctly — do not re-improvise them here:
   - en page at `/{type}/en/{file}.html`; **English chrome cloned from `metanotes/en/meta-1.html`** (`<html lang="en" dir="ltr" data-dc-no-header>`, English topbar/toolbar labels, the `.lang-btn` CSS + markup), GA4 present exactly once.
   - **Body, box/section CSS classes, and JSON-LD `@type`/shape inherited from THIS page's own type** (e.g. the insight `.glass-box` structure), rendered LTR and **translated** structure-faithfully (same headings, same number of `<li>` items, nothing added or dropped).
   - **Scripts/analytics follow this type's conventions, not meta-1's extras.**
   - en page carries **no** specialist «کاوش بیشتر» capsules / glossary back-links / brain links (en pages stay out of the brain ecosystem — en-version Hard Rule 8): no brain entry, no Pulse line, no 4.7/4.8/4.9 for the en page.
2. **Wire the toggle on BOTH sides (en-version step 4).** On the new en page: `.lang-btn` → `../{file}.html` (label «فارسی»). On the source fa page: add `.lang-btn` → `en/{file}.html` (label «English»), placed/styled per the fa-side precedent (`metanotes/meta-1.html`), and **ensure the `.lang-btn` CSS exists in the fa page's inline `<style>`** (current templates carry it, but older clones may not — adding the button without its CSS is the "missing toggle = CSS issue" failure; add both when missing). The two targets must be exact inverses and neither may point at meta-1.
3. **noindex + hreflang enforcement (en-version step 7).** The en mirrors are unreviewed AI translations and stay OUT of search (2026-08-11 SEO audit): the new en page must carry `<meta name="robots" content="noindex, follow">`, no hreflang block, and never enters the sitemap; the fa page keeps its standard 3-line hreflang block and gains **no** `en` alternate. Run `python3 .github/scripts/inject_hreflang.py` (strips/normalizes both sides, idempotent) and `python3 tools/noindex_en_mirrors.py --check` (fails if any en page is indexable — fix by running it without `--check`). Also run `python3 .github/scripts/gen_sitemap.py` (it drops noindexed pages itself) and re-run `python tools/stamp-version.py` **last**.
4. **Verify (en-version step 9).** Confirm: en page has `<html lang="en" dir="ltr" data-dc-no-header>`, self-canonical `.org`, robots meta `noindex, follow`, **zero** hreflang lines, `inLanguage`/`lang`/`og:locale` all `en`, the same JSON-LD `@type` as this type, GA4 exactly once; both toggles are exact inverses; the chrome standard `metanotes/en/meta-1.html` is **untouched** (hash unchanged). Report the two file paths created/modified (new en page + the toggle edit on the source fa page).

**Why Phase D and not a step inside Phase C:** it consumes the *finished* fa page (after all of Phase C's swaps, enrichment, and rebuild), and it deliberately reuses a **separate, already-correct workflow** rather than duplicating its logic. Keep it last so the English mirror reflects the final published state.

## Phase E — Mark the page for the new-article push

**Runs at the very end of every `.org` page publish, once, after Phase D.** The
actual notification is **automated** by the `notify-new-articles` GitHub Action on
push to `main` — this phase's only job is to add the explicit **publish marker** so
that push counts as a real editorial publish. The Action then fires the API's
`article_published` event: **premium is notified immediately; free is batched into
the 21:00 Asia/Tehran digest** (published_at + 24h, effective delay «۱ تا ۲ روز»).
The free/premium split and delivery model live in the API — see
`plus-api/src/services/article-notify.ts` (Layer 1) and the web-push provider
(Layer 2). A push counts as a new article ONLY when all three hold, enforced by
`tools/notify_new_articles.py` (not by the file diff):

1. **Article content type** — the type is the page's top folder (first segment of
   its canonical `content_id`). Everything counts EXCEPT `glossary` and `litecast`.
2. **The publish marker** — `<meta name="dc-notify" content="true">` in `<head>`.
3. **Canonical `content_id` not notified before** — taken from `<link rel="canonical">`
   (the SEO-frozen slug), never the file path, so a move/rename that keeps the slug is
   not a new article. The API dedups on `content_id` (idempotency = retry-safety only).

**Do in this phase:** ensure the just-published page's `<head>` contains exactly
`<meta name="dc-notify" content="true">` (add it if the clone didn't carry it; it is
idempotent — never add a second copy). That is all. The commit + push to `main` does
the rest.

**Skip cases (do NOT add the marker; report the skip line):**
- **Paper-only fast path** (no page was published) — nothing to announce.
- **LiteCast** — `.ir`-only, outside the Plus push ecosystem (a `/litecast/…` push
  would break for `.org` subscribers). Report "Phase E: skipped — LiteCast".
- **Glossary** — reference type, not an article. Report the skip.
- Every other category adds the marker.

**One-time go-live step (before the Action is enabled the first time):** record all
existing pages as already-notified so editing an old article never fires premium:

```bash
curl -u "$ADMIN_USER:$ADMIN_PASSWORD" -X POST "$PLUS_API_BASE/admin/articles/backfill"
```

**Manual fallback (ops / when running outside CI)** — announce a single page directly
(idempotent; safe to re-run). Pass the **full `https://dentcast.org/…` URL**:

```bash
ADMIN_USER=… ADMIN_PASSWORD=… PLUS_API_BASE=https://api.dentcast.org \
  python tools/notify_new_article.py --url https://dentcast.org/{type}/{file}.html \
    --title "<the page's Persian title>"
```

**Verify / report:** confirm the marker is present on the new page (or the documented
skip line for paper-only / LiteCast / glossary). Delivery reaches only users who
enabled «نوتیف مطلب جدید» and have a push subscription; everyone else is skipped
silently — expected, not an error.

## Phase F — The mechanical gate (MANDATORY; the publish is not done until this is green)

**Run last, after Phase E, and treat its exit code as the definition of "finished".**

```bash
python3 tools/verify_publish.py <content_id> \
  --expect-title "<the title exactly as the user wrote it>" \
  --expect-caption "<the caption exactly as the user wrote it>"
```

`<content_id>` is the page path without the leading `/` and without `.html` —
e.g. `chairside/chairside-28`. Drop the two `--expect-*` flags only when the
user genuinely supplied neither string in their own words (Hard Rule 16).

**Why this phase exists.** Everything it checks is already written above as
prose. Prose is not enforceable: this document is ~1300 lines and roughly
seventy separate obligations, and the recurring failure is not disagreement
with a rule but *silently not reaching it* — the enrichment step that never
ran, the builder that ran in the wrong order, the surface a correction missed,
the invisible character that changed. None of those raise an error anywhere;
each ships a live page that is quietly wrong. The gate turns that checklist
into an exit code, so "I think I did everything" is replaced by a command that
either passes or names the file, the exact mismatch, and the fix.

**What it verifies** (each row names the step it belongs to, so a failure points
straight back into this document): brain tail position and key-set parity with
the previous same-category entry · pillar/subtopic against the **live**
`PILLARS` · GA4 exactly once · canonical on the right domain · **title and
caption identical across every surface, and identical to the user's own text
when `--expect-*` is passed** · `datePublished == dateModified` · a prose
paragraph before the first list · one «کاوش بیشتر» section, ≤5 links, correct
pillar capsule, no self-link · FAQ questions free of article deixis and binary
answers opening with an explicit verdict · flashcards present, uniquely and
sequentially `@id`-ed, and **not re-pasted FAQ answers** · the en mirror,
its chrome, its noindex + zero-hreflang state, and both halves of the fa↔en
toggle as exact inverses · the fa page's 3-line hreflang block (no `en`
alternate) · the `dc-notify` marker · landing page, Pulse, homepage rail,
sitemap, pillar page · `content-index` / `flashcards-index` / `quiz-index` /
`pathways` membership · **every DES record's arithmetic, band agreement, track
shape, `ABSTRACT_ONLY` multiplier cap and verbatim quotes** (step 4.13 Part 3,
run mechanically) · and **the content version stamp actually matching the
content it stamps**, which is what catches `stamp-version.py` not having run
last.

<!-- des-fail-closed-policy:v1 -->
**DES/Fidelity fail closed.** The authoritative mechanical outcome is
`tools/verify_publish.py`: a **missing DES record is `FAIL`**, not `WARN`,
except for **LiteCast** and **Challenge** (canonical `SKIP`), or a valid,
current, exact-page entry in `.dentcast/des-exemptions.json` for an explicit
founder decision `founder_without_des` or a confirmed episode
`unsourced_audio_caption`. The exemption's `page_sha256`, reason and scoped
approval must match the final text; a missing result never implies an exemption.

A founder-supplied **complete DES score JSON** for this exact publication
is **not** a missing record or `SKIP`: validate and reuse it under module 08
**without rerunning DES**. Independently accept valid supplied Fidelity JSON
without a new Fidelity run; if only DES is supplied, run **only any owed
Fidelity**. If supplied JSON is missing, invalid or stale, block and ask for
corrected data; never silently rescore it. The final Phase F still validates
record structure, source basis, quotes, DES arithmetic and Fidelity obligations.
Any missing Fidelity outside canonical exceptions also fails the gate.
<!-- /des-fail-closed-policy:v1 -->

LiteCast, glossary and episode branches are handled: rows that do not apply to
a type report `--` with the reason, so a documented skip is visible rather than
silently absent.

**Rules for using it:**

1. **Green is the only acceptable end state.** A non-zero exit means the
   publish is incomplete. Fix what it names and re-run — do not report the
   publish as done, and do not explain a `FAIL` away in prose.
2. **Every `FAIL` row prints its own fix command.** Run that, then re-run the
   gate. Most are a builder that did not run, or did not run last.
3. **`warn` rows are not failures** — they mark places where the site
   measurably has more than one convention (a search snippet that deliberately
   differs from the caption; an `<h1>` that carries a series prefix). Read each
   one and confirm it is deliberate rather than leftover.
4. **Paste the gate's summary line into the final report** so the user can see
   the publish was verified mechanically, not just asserted.
5. **It does not replace any step.** It cannot tell whether your 4.7/4.8/4.9
   semantic analysis was any good — only that the structural results exist. The
   judgment steps still run in full; the gate catches what judgment forgets.

**Regression sweep (not part of a publish):**
`python3 tools/verify_publish.py --all` runs the same checks over every
published page. It exits 0 by design: its `FAIL` rows are the site's **backlog**
(flashcards, quiz, en mirrors and the notify marker were all rolled out
prospectively), and per **Hard Rule 11** a gap on an old page is something to
fix on its own, never a pattern to copy forward.

## Final output summary

<!-- concise-publication-report:v1 -->
The checklist below is the **technical evidence checklist**, not the required
length of the final chat response. Preserve every applicable check and explicit
skip in a public-safe `.dentcast/publication-reports/<category>-<id>.md` report.
Reference existing committed results and retrievable logs instead of repeating
full JSON, hashes and command output. Never copy private sources, approval
transcripts or secrets into public Git. Keep full logs retrievable where permitted.

The final user message normally includes only: actual status (branch, PR, merged
or live), page/PR link, exact Phase F summary, material warnings or pending work,
and a link to the technical report. Summarize successful routine checks together.
Never hide failed gates or unresolved approvals; a local pass is not proof of
live deployment. Expand the technical details when the user asks.
<!-- /concise-publication-report:v1 -->

- Category locked
- Writing-style check (Question 3.5): flagged AI-tell spots presented (or the explicit "no changes needed" result); which rewrites were approved/applied vs rejected; confirmation the text used from this point on is the post-decision text (edited if approved, original otherwise)
- Auto-discovered next number (and whether user overrode it)
- Template page path + SHA-256 before/after (must match)
- Media sources gathered (and which were auto-fetched vs asked)
- Audit table after fixes (all OK)
- Pillar & subtopic determination (step 2.4): the live pillar set read from `PILLARS`; the proposed-then-confirmed `pillar.primary` (or `null`); whether the pillar is structured; the proposed-then-confirmed `pillar.subtopic` (slug if structured, else `null`); whether a new subtopic was created (and user-confirmed)
- "کاوش بیشتر" capsule injection (step 2.5): which branch fired (typed-brain → 2 capsules / glossary → 1 capsule / core episode → `ep-related-link` pillar link in «محتوای مرتبط»); the exact block inserted (or the episode `ep-related-link`); the فهرست موضوعی capsule's `href` = `/pillar/<pillar.primary>/` (canonical format) or the `/pillar/` fallback; confirmation that `dc-related-*` classes were used for the section (and `ep-related-link` for the episode branch) and that no other diff was introduced beyond step 2's swaps
- Landing/index page (step 2.6): the type's landing page path (e.g. `/sharehub/index.html`); whether it's generated (regenerated by which builder) or hand-maintained (the exact link added and its position); confirmation it now links to the new entry exactly once
- **Hashtag standardization (step 5.0 — Hard Rule 15):** which proposed concepts **reused** an existing canonical `#tag` from `dentcast-hashtag-reference.json` (matched directly or through an alias), which were **newly minted** (their canonical tag + `definition`/`use_when`/`aliases`), confirmation that only canonical tags reached the brain `hashtags` and the page chips (no alias-as-tag, no tag-as-alias, no duplicate), and the `hashtag_ref.py --check` result (green) plus a `--simulate` confirming the article is reachable (with its rank)
- New brain entry (printed as it now exists at the end of the flat array) — confirmation that it's the last element, that its key set matches the previous same-category entry exactly, and (for episodes) that no `type` field was added
- Pulse: which line was removed (the bottom one), and where the new line was inserted (at the absolute top (first line; exactly 7 lines remain)), with before/after diff
- For NoteCast: parent episode page path; whether the related-content block existed already or was created; before/after hash of the parent episode page; diff of the inserted markup
- For Promptologist (step 4.6): the new part's `ep-nav` previous slot wired to `<prev-id>.html` (next slot left as the empty placeholder); the previous part's page path with before/after hash, confirming its empty «next» placeholder was converted into a link to `<new-id>.html` (only that slot changed)
- For any publish with an attached paper file (step 4.10 — triggered by the file, any type) — or the documented "skipped — no attached paper" line otherwise: **Part 1** — the Drive subfolder the paper was filed into (chosen semantically) and its `drive_view` URL; **Part 2** — the new `dentcast_cabinet_full_catalog.json` entry's `id`, `topic`/`topic_path`, `tags` (semantic + article-name), and the Drive link, with confirmation the key set matches the enriched-entry template and the paper surfaces in `dentcast_cabinet_search.html` (opened directly — the on-site route is premium-gated), plus the new `papers` total and whether it crossed a round hundred (if it did, the two paper-count strings in `index.html` were swept together; if not, say so explicitly); **Part 3** (only when a page was published) — the DOI and first author found on the web, the rendered first-author→DOI credit anchor (ShareHub `.author` style) and any `isBasedOn` update, with before/after page hash — or the "Part 3 skipped — paper-only (no page)" note on the paper-only fast path. Explicitly list anything you asked the user about and confirm nothing (subfolder/DOI/author/tags) was guessed
- **Flashcards (step 4.11)** — or the documented "skipped — LiteCast" line: the `DefinedTermSet` node written into `plus/faq-corpus.json` (term count and their `@id`s); how many came from `source: "faq"` vs `"authored"`; which FAQ entries (if any) were judged comparison/decision-shaped and skipped; confirmation no `name`/`description` is a verbatim FAQ copy; anything you asked the user about; confirmation `node tools/build_flashcards_index.mjs` was re-run in step 8 so `plus/flashcards-index.json` reflects the new page
- **Quiz (step 4.12)** — or the documented "skipped — LiteCast" line: confirmation every FAQ question `name` is standalone (no article deixis per 4.12(a)); how many of the content's FAQ questions are binary/scored vs open (and that any binary answer opens with an explicit «بله»/«خیر» verdict); confirmation `node tools/build_quiz_index.mjs` was re-run in step 8 and the new content's binary count appears in `plus/quiz-index.json`
- **DES (Question 4.8 + step 4.13)** — or an explicit canonical skip ("skipped — LiteCast" / "skipped — چالش" / "skipped — کاربر انتخاب کرد بدون DES منتشر شود" with valid page-bound approval / verified "unsourced_audio_caption" episode exemption): which **basket** Question 4.8 landed in (COMMENTARY / RESEARCH / INDETERMINATE-then-asked) and, when it was asked, which of the two options the user picked; then **per source**: the DOI (or «متنِ خودِ مطلب» for COMMENTARY), where `source_text` was resolved from (cabinet hit / MCP lookup / WebFetch / pasted by the user), the `text_basis` with its justification, and the resulting `des_score` + `band` + `question_type` + `provisional`; the outcome of all four Part-3 validation checks (quote verification, arithmetic recomputation, band agreement, schema) and the reproducibility run when one was required; confirmation the record was written to `plus/des-scores.json` under the correct `content_id` with the spec objects **verbatim** and **no** derivable wrapper fields, that nothing was added to the brain entry (Hard Rule 5), and that **no page markup or CSS was inlined** (Part 5); explicit confirmation that no DOI, abstract, or journal quartile was guessed, and that any unscorable source is recorded as `INSUFFICIENT_TEXT` rather than scored from the DentCast متن about it
- **چالش (Question 4.9 + step 4.14)** — or the documented "4.9: مطلب معمولی" line when it is not one: the question + image markup written on the page (and confirmation it carries no answer/key points anywhere); the paste-box JSON printed for `GET /admin` → «صندوق چالش», with an explicit note that the چالش is not live until the founder pastes it; confirmation `node tools/build_challenge_index.mjs` ran in step 8 and this `content_id` now appears in `plus/challenges.json`; and an explicit per-step verdict for 4.11/4.12/4.13/5.6/5.6-ب/Phase D (all skip, per the table in step 4.14) so none reads as a silent omission (Hard Rule 11)
- **Cross-linking completion gate (Hard Rule 11) — REQUIRED; the publish is incomplete if any of these is missing.** For **each** of steps 4.7, 4.8, 4.9, report its explicit outcome — never leave one unstated:
  - **4.7 (glossary → new content):** the candidate terms considered, which were linked (auto-applied vs. asked-and-confirmed, per Hard Rule 14, with the link text used), and which were skipped and why (at 5-cap / no section / judged unrelated / asked-and-declined). An empty result is acceptable **only** as a documented "analyzed, 0 qualifying terms".
  - **4.7-ب (the new TERM into existing bodies — glossary publishes only):** the scoped candidate count for the new slug, what was applied, every ASK with its verdict — or the documented "0 candidates" / "skipped — not a glossary publish".
  - **4.8 (in-body inline links on the new page):** confirmation that a **fresh** semantic analysis of *this* body was run (NOT inherited from the clone); which candidates were auto-applied at high confidence vs. presented to the user (Hard Rule 14); which of the presented ones were approved/inserted (first-occurrence) and which rejected. For episodes, confirm the «درباره این اپیزود» caption was the analyzed body. An empty result is acceptable **only** as a documented "analyzed body, 0 qualifying glossary/episode candidates".
  - **4.9 (related links on the new page):** for episodes, confirm this targeted the **«محتوای مرتبط»** block (not skipped due to the naming difference); the related brain entries considered (sibling series parts first), how many slots were free under the 5-cap, which links were auto-applied vs. presented to the user (Hard Rule 14) and which of those were approved/added, and the remaining-budget math. An empty result is acceptable **only** as a documented "at cap" / "0 qualifying entries".
  - Explicitly confirm that **none** of 4.7/4.8/4.9 was skipped on the grounds that the cloned/previous/sibling page lacked such links (a Hard-Rule-11 violation).
- Pillar/subtopic verification (step 5.5): confirmation that the recorded `pillar.primary` and `pillar.subtopic` are **identical** to what was confirmed in step 2.4 (untouched by steps 5/5.5); resulting `pillar.subtopic` (slug if structured, `null` if not); confirmation that no new keys were added to the `pillar` object or as siblings, that the `subtopic` key is present in every case, and that the step-2.5 capsule / episode pillar link is consistent with `pillar.primary`
- **Pathways & bundles (steps 5.6 + 5.6-ب)** — or the documented "skipped — LiteCast" line: every full pathway the item joined (pathway id + anchor + milestone flag), the `--coverage` line confirming membership in ≥1 pathway (or the explicit deliberate-orphan note); then, for **every candidate bundle** (each bundle whose `continues_pathway` is a pathway just joined — or «باندل: بدون کاندید»), exactly one verdict: «وارد شد (بعد از کدام قدم)» with confirmation the bundle's last step still carries the only `milestone: true` and that `plus/js/home-bundles.js`'s step count was updated in the same commit, «رد شد (گیت N)», or «سوال شد». A candidate bundle with no verdict = incomplete publish.
- Builder runs: each command + a retrievable stdout/stderr log reference (`python tools/update-homepage-counters.py`, `python tools/build_pillar.py all`, `python tools/build_episodes.py` for episode publishes, `node tools/build_flashcards_index.mjs` unless step 4.11 was skipped, `node tools/build_plus_index.mjs` for the میز کار nav-tree unless paper-only, and `python tools/stamp-version.py` LAST); confirmation that the new content appears in the regenerated pillar page when a structured pillar was assigned, **and (for episodes) that the new episode now appears in the regenerated `episodes.html`** with no feature regression.
- **Phase D (English mirror & toggle — Hard Rule 12; REQUIRED unless LiteCast):** the en page path created (`/{type}/en/{file}.html`); confirmation the body was translated structure-faithfully from THIS type (not rendered as a metanote) with GA4 once and `lang`/`inLanguage`/`og:locale` all `en`; confirmation the en page carries `noindex, follow` and zero hreflang lines and stays out of the sitemap (`inject_hreflang.py` + `noindex_en_mirrors.py --check` both run); both toggle targets (exact inverses, no meta-1 hardcode) and that the fa page got both the `.lang-btn` markup **and** its CSS; chrome standard `metanotes/en/meta-1.html` hash unchanged. For LiteCast, the documented skip line instead.
- **Phase E (new-article push marker — REQUIRED unless paper-only/LiteCast/glossary):**
  confirmation that `<meta name="dc-notify" content="true">` is present exactly once
  in the published page's `<head>` (so the `notify-new-articles` Action fires the
  `article_published` event on push); or the documented skip line ("paper-only" /
  "LiteCast" / "glossary").
- Confirmation the new entry appears in the latest-content widget data
- **Phase F (mechanical gate — REQUIRED):** the exact `verify_publish.py` command
  run (including the `--expect-title` / `--expect-caption` values when the user
  supplied them) and its summary line pasted verbatim, showing `0 failed`. Any
  `warn` rows listed with a one-line note confirming each is deliberate. A
  publish reported without a green gate is not reported as finished.
- List of all modified file paths
