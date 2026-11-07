<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages, the save point and the deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `D`, `E`, `F`, `G` — the post-Push-2 runner's. The agent's part of Phase D (authoring the mirror and both toggles) happens **before C.6**, after the C.4.13 text lock so it mirrors locked text, and is recorded in the C.6 second-cut editorial lock (standing acceptance; never sent for confirmation). After Push 2, row `D` is the runner's technical check only; substantive drift blocks there and means invalidation, never a silent fix.

## Phase D — English mirror & language toggle (MANDATORY; Hard Rule 12)

**Not the «… رو انگلیسی کن» trigger — it is part of every `.org` publish** (Hard Rule 12). The en page and the toggle are produced together by reusing the English-version workflow.

**Two documented skips, and no others** (Hard Rule 12 gives the reasons): **LiteCast** — "Phase D: skipped — LiteCast (Hard Rule 10)"; **چالش** — "Phase D: skipped — چالش (Hard Rule 12, RULE 16)". Every other publish runs it.

**Steps:**

1. **Hand off to the English-version workflow.** With the fa page (`{type}/{file}.html`) as source, run **`.dentcast/workflows/en-version.md`**; it owns every detail — do not re-improvise here:
   - en page at `/{type}/en/{file}.html`; **English chrome cloned from `metanotes/en/meta-1.html`** (`<html lang="en" dir="ltr" data-dc-no-header>`, English topbar/toolbar labels, the `.lang-btn` CSS + markup), GA4 exactly once.
   - **Body, box/section CSS classes and JSON-LD `@type`/shape from THIS page's own type** (e.g. insight `.glass-box`), LTR and **translated** structure-faithfully (same headings, same number of `<li>`, nothing added or dropped), the module-03 lead included.
   - **Scripts/analytics follow this type's conventions, not meta-1's extras.**
   - No specialist «کاوش بیشتر» capsules, glossary back-links or brain links on the en page (en-version Hard Rule 8): no brain entry, no Pulse line, no 4.7/4.8/4.9 for it.
2. **Wire the toggle on BOTH sides (en-version step 4).** En page: `.lang-btn` → `../{file}.html` («فارسی»). Fa page: `.lang-btn` → `en/{file}.html` («English»), placed/styled per `metanotes/meta-1.html`, with the `.lang-btn` CSS in its inline `<style>` (a clone may lack it; a button without its CSS is no toggle). Exact inverses; neither points at meta-1.
3. **noindex + hreflang (en-version step 7).** Author the en page with `<meta name="robots" content="noindex, follow">` and no hreflang block; the fa page keeps its standard 3-line hreflang block with **no** `en` alternate. After Push 2 the runner's `D` runs `python3 .github/scripts/inject_hreflang.py`, `python3 tools/noindex_en_mirrors.py --check`, `python3 .github/scripts/gen_sitemap.py` (it drops noindexed pages) and the restamp (module 11, §7).
4. **Verify (en-version step 9).** `metanotes/en/meta-1.html` is untouched (`git diff --quiet -- metanotes/en/meta-1.html`). Phase F row `D en-mirror` checks the rest (lang/dir, self-canonical `.org`, `noindex, follow`, zero hreflang, `inLanguage`/`og:locale`, the type's `@type`, GA4 once, inverse toggles). Record the two paths (new en page, fa toggle edit) in the C.6 lock.

## Phase E — Mark the page for the new-article push

**The runner's row `E`, after D.** The notification itself is **automated** by the `notify-new-articles` GitHub Action on push to `main`; this phase only ensures the **publish marker** `<meta name="dc-notify" content="true">` is in the page `<head>` exactly once, so that push counts as an editorial publish. The Action then fires the API's `article_published` event: **premium immediately; free batched into the 21:00 Asia/Tehran digest** (published_at + 24h, effective delay «۱ تا ۲ روز»; `plus-api/src/services/article-notify.ts` Layer 1, the web-push provider Layer 2). `tools/notify_new_articles.py` counts a push as a new article ONLY when all three hold:

1. **Article content type** — the page's top folder (first segment of its canonical `content_id`); everything counts EXCEPT `glossary` and `litecast`.
2. **The publish marker** in `<head>`.
3. **Canonical `content_id` not notified before** — from `<link rel="canonical">` (the SEO-frozen slug), never the file path, so a move/rename that keeps the slug is not new. The API dedups on `content_id`.

**Skip cases (no marker; the skip line is reported):** paper-only (no page), **LiteCast** (`.ir`-only, outside the Plus push ecosystem), **glossary** (reference, not an article). Every other category gets the marker. Delivery reaches only users who enabled «نوتیف مطلب جدید» with a push subscription — expected, not an error.

**Go-live step (only when enabling the Action for the first time):** mark every existing page as already notified so editing an old article never fires premium:

```bash
curl -u "$ADMIN_USER:$ADMIN_PASSWORD" -X POST "$PLUS_API_BASE/admin/articles/backfill"
```

**Manual fallback (ops / outside CI)** — announce one page directly (idempotent). Pass the **full `https://dentcast.org/…` URL**:

```bash
ADMIN_USER=… ADMIN_PASSWORD=… PLUS_API_BASE=https://api.dentcast.org \
  python tools/notify_new_article.py --url https://dentcast.org/{type}/{file}.html \
    --title "<the page's Persian title>"
```

## Phase F — The mechanical gate (MANDATORY; the publish is not done until this is green)

**Run last by the runner (after E), and its exit code is the definition of "finished".** The runner passes the title and caption frozen in the C.6 approvals:

```bash
python3 tools/verify_publish.py <content_id> \
  --expect-title "<the title exactly as the founder wrote it>" \
  --expect-caption "<the caption exactly as the founder wrote it>"
```

`<content_id>` is the page path without the leading `/` and `.html` (`chairside/chairside-28`). Why it exists: a skipped obligation — an enrichment step that never ran, a builder in the wrong order, a surface a correction missed, an invisible character — raises no error anywhere; the gate turns the checklist into an exit code that names the file, the mismatch and the fix.

**What it verifies** (each row names its step): brain tail position and key-set parity · pillar/subtopic against the **live** `PILLARS` · GA4 exactly once · canonical domain · **title and caption identical across every surface and to the founder's own text** · dates · a prose paragraph before the first list · one «کاوش بیشتر» section, ≤5 links, correct pillar capsule, no self-link · FAQ deixis and binary verdicts · flashcards present, uniquely `@id`-ed, not re-pasted FAQ answers · the en mirror, its noindex/zero-hreflang state and both toggles · the fa page's hreflang block · the `dc-notify` marker · landing page, Pulse, homepage rail, sitemap, pillar page · `content-index` / `flashcards-index` / `quiz-index` / `pathways` / exam-bank membership and preservation · **every DES record's arithmetic, band, track shape, `ABSTRACT_ONLY` cap and verbatim quotes** (module 08 Part 3, mechanically) · the content version stamp matching the content it stamps.

<!-- des-fail-closed-policy:v1 -->
**DES/Fidelity fail closed.** The authoritative mechanical outcome is `tools/verify_publish.py`: a **missing DES record is `FAIL`**, not `WARN`, except for **LiteCast** and **Challenge** (canonical `SKIP`), or a valid, current, exact-page entry in `.dentcast/des-exemptions.json` for an explicit founder decision `founder_without_des` or a confirmed episode `unsourced_audio_caption`. The exemption's `page_sha256`, reason and scoped approval must match the final text; a missing result never implies an exemption.

A founder-supplied **complete DES score JSON** for this exact publication is **not** a missing record or `SKIP`: module 08's «Conditional path for founder-supplied results» validates and reuses it without rerunning DES (Fidelity as its own track). The final Phase F still validates record structure, source basis, quotes, DES arithmetic and Fidelity obligations; any missing Fidelity outside canonical exceptions fails the gate.
<!-- /des-fail-closed-policy:v1 -->

Rows that do not apply to a type (LiteCast, glossary, episode branches) report `--` with the reason, so a documented skip is visible.

**Rules for using it:**

1. **Green is the only acceptable end state.** A non-zero exit means the publish is incomplete; never explain a `FAIL` away in prose. After Push 2 a `FAIL` is handled by `publish-after-push2.md` (guarded recovery), not by local fixes.
2. **Every `FAIL` row prints its own fix** — it names the step to reopen.
3. **`warn` rows are not failures** — they mark places with more than one site convention (a deliberately different search snippet, an `<h1>` with a series prefix). Read each and confirm it is deliberate.
4. **The gate's summary line goes into the report** verbatim.
5. **It does not replace any step.** It cannot judge whether the 4.7/4.8/4.9 analysis was any good — only that the results exist.

**Regression sweep (not part of a publish):** `python3 tools/verify_publish.py --all` runs the same checks over every page and exits 0 by design; its `FAIL` rows are the backlog on older pages (Hard Rule 11).

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
the list of agent proposals accepted under standing acceptance, and a link to the
technical report. Summarize successful routine checks together.
Never hide failed gates or unresolved approvals; a local pass is not proof of
live deployment. Expand the technical details when the user asks.
<!-- /concise-publication-report:v1 -->

Each item is evidence, not a restatement of the rule (the rule lives in its module):

- Category, number (and any irregularity in the series), template page, media gathered.
- **Standing acceptance list** (Hard Rule 14): every agent proposal applied (title/caption if composed, lead paragraph, Q3.5 rewrites, Pulse line, hashtags and mints, keywords, pillar/subtopic with reason, links, flashcards/FAQ choices, catalog tags and Drive subfolder, pathway placements, bundle verdicts, English mirror) and every borderline candidate skipped, with its reason.
- **Founder messages:** M1 (each open fact and its answer), M3b (each Part 3b sentence with «اصلاح کن» / «خودم می‌نویسم» / «همین بماند») and M2 (the exam questions approved), plus any real decision asked (new subtopic, new Drive subfolder, basket 3, runtime capability, 4.5/4.6 structure, merge). This list and the standing-acceptance list are the **agent's Push-2 report** (`publish-checkpoints.md», «After Push 2»); the runner's report G is technical only.
- Q3.5: the rewrites applied (original → rewrite) or the "no changes needed" result.
- Step 2.4/2.5/2.6: pillar, subtopic, structured or not, capsule branch and `href`, landing page (generated by which builder, or the row added).
- Step 4.5 / 4.5-ب / 4.6 when they apply: the sibling or parent page edited.
- Step 4.10 (or "skipped — no attached paper"): the module 06 report — subfolder and `drive_view`, catalog `id`/`topic`/`tags`, paper total and round-hundred sweep, reachability keys or «library-only», DOI + first author + anchor (or the paper-only skip).
- Step 4.13 (or an explicit canonical skip: "skipped — LiteCast" / "skipped — چالش" / "skipped — کاربر انتخاب کرد بدون DES منتشر شود" with valid page-bound approval / verified "unsourced_audio_caption" episode exemption): the basket; per source DOI, `source_text` origin, `text_basis`, score/band/`question_type`/`provisional`, the Part 3 checks; per Fidelity slot level and count line; overruled units; the Fidelity tier; actual model IDs; that nothing was guessed.
- Steps 4.7 / 4.7-ب / 4.8 / 4.9 (Hard Rule 11 completion gate, REQUIRED): each step's candidates, applied, skipped (with reason), or its documented empty result; confirmation none was skipped because the clone lacked links.
- Steps 4.11 / 4.12: term count and `@id`s, `faq` vs `authored`, skipped pairs; binary vs open questions, rewrites/drops — or the documented skip.
- Step 4.14 (or "4.9: مطلب معمولی"): the markup, the paste box, the "not live until pasted" note, and the per-step skip verdicts.
- Step 5.0: the module 10 report (questions, reuse/mint, composition gate, resolving sentences, `--check` results, reachability per question).
- Step 5 / 5.6 / 5.6-ب: the brain entry as written; pathways joined (id, anchor, milestone), `--coverage` line, borderline candidates not placed; every candidate bundle's verdict or «باندل: بدون کاندید»; 4.12-ب rows or skip.
- Step 6: the Pulse line inserted and the line removed.
- Phase D: the two paths (or the skip line); Phase E: marker present (or the skip line).
- The runner: Push-2 SHA, run link, builder and stamp logs (artifact), Phase F command and summary line verbatim showing `0 failed`, each `warn` with a one-line note.
- All modified file paths.
