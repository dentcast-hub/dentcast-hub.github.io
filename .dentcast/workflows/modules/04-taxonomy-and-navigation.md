<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages and the three deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `C.2.4`, `C.2.5`, `C.2.6`, `C.3`, `C.4`, `C.4.5`, `C.4.5-b`, `C.4.6`.

### 2.4. Semantic pillar & subtopic determination (propose + confirm)

Decide `pillar.primary` and — when that pillar is structured — `pillar.subtopic` **here, once**, before steps 2.5 and 5 consume them (Hard Rule 6). The match is semantic (Hard Rule 14). The decision is standing acceptance: applied, recorded with its reason, listed in report G; it is not sent for confirmation.

**LiteCast exception:** skip this step entirely (module 03, step 0).

#### Step 1 — Read the live taxonomy (from a state that reflects `main`)

Hard Rules 7–8: `PILLARS` in `tools/build_pillar.py`, read from a state reflecting `main`. The `/pillar/` page shows exactly `list(PILLARS.keys())`, each with `title_fa` and its live `subtopics` (`{"slug", "title_fa", …}`):

```bash
python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"
```

#### Step 2 — Semantically pick the pillar (auto-apply if clear, else propose options)

Compare the content's conceptual subject with each pillar:

- **One clear fit** → set `pillar.primary` to that slug, exactly as spelled in `PILLARS`.
- **Ambiguous** (two or more real candidates) → the closest semantic match, with the competing candidate and the reason recorded.
- **No pillar applies** → `pillar.primary` stays `null`; skip Step 3. The فهرست موضوعی capsule then falls back to `/pillar/`.

#### Step 3 — Semantically pick the subtopic (structured pillars only; auto-apply if clear, else propose options)

- **Pillar not structured** (`pillar.primary not in PILLARS`) → `pillar.subtopic` stays `null` (the key is still present).
- **Pillar structured** → compare against `PILLARS[primary]['subtopics']`: the clear fit, or for ambiguity the closest match with its reason; use the slug exactly as stored (no re-casing).
- **No existing subtopic fits even loosely** → a **new subtopic is a founder decision**, asked when it arises: propose slug + `title_fa` in the siblings' style (kebab-case English slug, short Persian noun phrase), flagged **NEW**; only after the founder's yes is it added to `PILLARS[primary]['subtopics']` in `tools/build_pillar.py` with a sibling's exact shape. **A new pillar is never created here.**

#### Step 4 — Hold the confirmed values

Step 2.5 uses `pillar.primary` for the capsule `href`; step 5 writes both into the brain entry. Nothing re-decides them (Hard Rule 6).

### 2.5. Inject the "کاوش بیشتر" capsule section (site-wide nav)

After the clone (step 2), add the «کاوش بیشتر» pillar-link block on the **new** page with the pillar from step 2.4. These capsules are placed first in Hard Rule 9's budget of 5.

**Conditional — based on the locked category:**

| Locked category source | What goes in the section |
|---|---|
| Typed brain entry (any `dentcast-brain.json` entry with a `type` field — NoteCast, Insight, Clinical, Chairside, MetaNote, ShareHub, DentCast+, …) | **Both** capsules: دانشنامه + فهرست موضوعی |
| Glossary term page (sourced from `glossary/glossary.json`) | **Only** the فهرست موضوعی capsule — the page IS the glossary |
| Core podcast episode (`/episodes/episode-XX.html`; `"type": "dentcast"` from episode 154 on, no `type` earlier) | **No `dc-related-section`** — the Episode branch below |
| **LiteCast** | No specialist capsules; the section is filled by module 03 step 0.6 |

**Capsule targets.** دانشنامه is fixed: `/glossary/`. فهرست موضوعی points to the entry's own pillar in the **canonical pillar-page format** — lowercase slug, trailing slash, no `index.html`, matching that page's own canonical (`https://dentcast.org/pillar/fixed-pros/` → `/pillar/fixed-pros/`); the pillar **root**, never a subtopic anchor. If `pillar.primary` is `null` or not a real slug, it falls back to `/pillar/`.

**Markup** (global classes, never the per-episode `ep-*`):

```html
<div class="dc-related-section">
  <h2 class="dc-related-label">کاوش بیشتر</h2>
  <div class="dc-related-capsules">
    <a href="/glossary/" class="dc-related-capsule">دانشنامه</a>
    <a href="/pillar/<pillar.primary>/" class="dc-related-capsule">فهرست موضوعی</a>
  </div>
</div>
```

**Episode branch (core podcast episodes — the «محتوای مرتبط» case).** Add the pillar link into the page's existing `ep-section` labelled `<h2 class="ep-section-label">محتوای مرتبط</h2>`, with the **same `ep-related-link` markup already in that block** (`<a href="…" class="ep-related-link">…</a>`), not `dc-related-capsule`:

- `href="/pillar/<pillar.primary>/"` in the canonical format; with `pillar.primary` `null`, **skip** the episode pillar link.
- Label in the register of the sibling links, e.g. «فهرست موضوعی: [PILLARS[primary]['title_fa']]».

Add it **once** (an existing link to that pillar stays). No «محتوای مرتبط» block → clone it from the previous episode first (as step 4.5 does).

**Placement on the new page:** bottom of the main content area — after the body, before any next/prev navigation or footer. If the template already has a «کاوش بیشتر» section, insert into it rather than creating a duplicate; never remove anything in it. It runs right after the clone so the date audit (step 3) sees the final page. Phase F row `2.5 related` verifies one section, the capsule count, the canonical pillar `href` and the classes.

### 2.6. Update the content type's landing/index page

Every type has a landing page listing its entries (`/sharehub/index.html`, `/notecast/index.html`, `/insight/index.html`, …), and it **must gain a link to the new entry** — separate from Pulse (step 6) and the homepage widget.

**Generated or hand-maintained?**
- **Generated by a builder** (an auto-generated marker, a client render from the brain, or a `tools/` script writing it): never hand-edit it. The new brain entry (step 5) plus the runner's C.8 regenerate it; name that builder in the report.
- **Hand-maintained static HTML:** add the link **manually**, matching sibling items **exactly** (markup, classes, wording pattern) in the existing order (typically newest first). Swap only URL and label; copy the siblings' label style (ShareHub: `<title> (مطلبی از <author>)`).

**A numbered series states the position in the row — the landing page is the only place a reader can see where the series starts and ends.** For an ordered series (پلاک صفر, پرامپتولوژیست, any «قسمت N» run) the row reads **«قسمت N — <title>»**: the number first, then the title **with the series name stripped** (the landing page IS that series).

- **N is the part's position, taken from the id** (`plak1-5` → ۵), in Persian digits, never invented for a series without numbering.
- **Chapters keep their own numbering:** پرامپتولوژیست rows sit under «فصل N — …» headings and restart at «قسمت ۱» per chapter, matching each page's badge («فصل ۷ · قسمت ۱»).
- **The brain title does not change.** It keeps the series prefix («پلاک صفر — بیمار چه تایپ می‌کند») because the homepage rail, pillar page, up-board and search render it without context. The landing row is a **second legitimate label** (as in `episodes.html`), and `tools/verify_publish.py` knows it (`numbered_series_label`): the row passes with a «قسمت N» marker **and** the brain title's own tail verbatim; a drifted title or a lost number still fails.

A series whose rows already carry their number in the title (`chairside/` → «Chairside 02 — …», `metanotes/` → «متانوت نوزده: …», `notecast/` → «نوت‌کست چهلم — …») is left alone. An **unnumbered** type (`insight/`, `sharehub/`) gets no number.

**Glossary note:** author the term page through steps 1–2 from the same-type template and register it in `glossary/glossary.json`, not the brain. `tools/build_pillar.py glossary` (part of `all`, run by the runner) generates **only** `/glossary/index.html`; never hand-edit it.

**Episodes note:** the episodes landing page is `/episodes.html` (`/episodes/index.html` is only a redirect), **fully static**, generated by `tools/build_episodes.py` from `dentcast.json` + `dentcast-brain.json` + the shell `tools/episodes_template.html`. Appending to `dentcast.json` is not enough on its own; the runner's C.8 runs the builder. Never hand-edit `/episodes.html`; chrome changes go into `tools/episodes_template.html`.

### 3. Date / meta double-check

Resolve today's date in every format the template uses and set every meta/OG/Twitter/JSON-LD date and visible body date to it, with `datePublished` = `dateModified` = today; fix any stale, divergent or missing field. Phase F row `3 dates` verifies.

### 4. Integrity check

`git diff --quiet -- <template>` for the step-1 template must succeed. If not, stop and report.

### 4.5. Update parent episode's related content (NoteCast only)

Only when the locked category is **NoteCast**; every other type skips it.

Open the parent episode page `/episodes/episode-XX.html` (same XX) and find its related-content block:
- It already links to `/notecast/episode-XX.html` → leave it.
- It exists without that link → add the link with the exact structure, classes and labels of the same block in `/episodes/episode-(XX-1).html`; swap only URL and number references.
- No block → copy the whole block from `/episodes/episode-(XX-1).html` to the same structural position; swap URL and numbers.
- The previous episode has none either → stop and ask the founder where it goes and what markup to use (a real decision; never improvise).

`git diff` of the parent page shows only that insertion.

### 4.5-ب. Shared evidence base — DES score and article credit mirror across the episode/NoteCast pair

**A NoteCast is the written version of its episode.** When either side cites a scientific source it is the **same** source, so a DES record (step 4.13) and a first-author→DOI/PubMed credit (step 4.10 Part 3) belong to the **paper** and appear on **both** pages whenever the paper is identified on either. Runs for a **NoteCast** or a core **episode** publish, in either direction:

- **NoteCast whose Question 4.8 basket-2 source is already scored on the parent episode** (`plus/des-scores.json` has `episodes/episode-XX`, or the episode carries a `.author`/«منابع» credit for it): copy the DES `sources[]` array **verbatim** into `notecast/episode-XX` (new `scored_at` = today) and add the same first-author→DOI/PubMed credit to the NoteCast in its own convention (`.author` block, «نویسنده:» label, right after the article body; add the `.author` CSS rule to the page's `<style>` if missing).
- **Episode whose source is already scored on its NoteCast** (the reverse): copy the NoteCast's record into `episodes/episode-XX` and add the credit block to the episode page (right before «محتوای مرتبط», as in `episodes/episode-12.html`).
- **Neither side has a record:** step 4.13 runs once, on the page being published, and its result is mirrored to the sibling right after — never score the same source twice (two runs need not agree token for token; mirroring keeps the numbers identical).
- **No DOI exists for the source:** never fabricate one. What the credit links to (PubMed record, publisher page, ResearchGate, or nothing) is an open fact for M1 — the same standard as step 4.10 Part 3 — and one answer serves both pages.

When touching an older pair for another reason, fix a gap in passing (Hard Rule 11). Evidence: `git diff` shows on the sibling only the `.author` block and its CSS rule; the mirrored `sources[]` is byte-identical to the original except `scored_at`; the credit target is the original's URL, never re-resolved.

### 4.6. Promptologist series prev/next navigation (Promptologist only)

Only when the locked category is **Promptologist**; every other type skips it.

Promptologist parts are an **ordered series** (id `prompt<season>-<part>`, page `/dentai/promptologist/<id>.html`). Each page ends with an **`ep-nav` block** — the last element inside `<main>`, after the `.ep-box`, like a core episode's bar:

```html
<div class="ep-nav">
  <span class="ep-nav-btn ep-nav-empty"></span>
  <span class="ep-nav-btn ep-nav-empty">قسمت بعدی &#8594;</span>
</div>
```

Two slots in DOM order: **first = previous part**, **second = next part**. An active slot is `<a href="/dentai/promptologist/<id>.html" class="ep-nav-btn">…</a>`; an empty one is `<span class="ep-nav-btn ep-nav-empty">…</span>` (greyed, no pointer). The clone arrives with both slots empty, so **two pages change**:

**A) On the NEW part's page — wire its «previous» slot** to the brain-order predecessor (usually `prompt<season>-<part − 1>`; across a season boundary or after an appendix part, e.g. `prompt2-1` → `prompt1-5`):
  `<a href="/dentai/promptologist/<prev-id>.html" class="ep-nav-btn">&#8592; قسمت قبلی</a>`
  The **next** slot stays the placeholder `<span class="ep-nav-btn ep-nav-empty">قسمت بعدی &#8594;</span>` until a later part is published.

**B) On the PREVIOUS part's page — wire its «next» slot to the new part**, in place, visible text identical:
  `<a href="/dentai/promptologist/<new-id>.html" class="ep-nav-btn">قسمت بعدی &#8594;</a>`
  Its own previous slot is untouched; `git diff` shows only that slot turning from the `<span … ep-nav-empty>` placeholder into the link.

Match the series' label register («قسمت قبلی» / «قسمت بعدی»). A previous part with **no** `ep-nav` block (older template) → stop and ask the founder before improvising one. Both pages keep exactly two slots; Phase F checks the wiring.
