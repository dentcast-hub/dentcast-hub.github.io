<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision; this repeated reference never requires a reread. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: C.2.4, C.2.5, C.2.6, C.3, C.4, C.4.5, C.4.5-b, C.4.6. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
> **Fixed page deliveries:** after `C.4.9`, after `C.4.13` including lawful skips, and after all final work, Phase F and report G. Cuts 1/2 deliver work plus handoff; cut 3 delivers final work, completion receipt and handoff deletion together. All intermediate checkpoints stay local; no extra turn-end or cleanup push.

<!-- /dentcast-checkpoint-protocol:v1 -->

### 2.4. Semantic pillar & subtopic determination (propose + confirm)

Decide the entry's `pillar.primary` and — when that pillar is structured — its `pillar.subtopic` **here, once**, before any step consumes them (the pillar capsule in step 2.5, and the brain write in step 5). Per **Hard Rule 6**, this is the **only** place the decision is made; later steps (5, 5.5) record and verify it but never re-decide it. Matching is genuinely **semantic** (conceptual relevance of the new content), **never** keyword/string matching.

**LiteCast exception:** LiteCast lives outside the specialist pillar taxonomy — **skip this step entirely** for LiteCast (see Phase C step 0). It assigns no specialist pillar/subtopic.

#### Step 1 — Read the live taxonomy (from a state that reflects `main`)

Per **Hard Rules 7 & 8**, read the live structured-pillar set at runtime from `tools/build_pillar.py`'s `PILLARS` dict (never a baked copy), from a working state that reflects `main`. The pillar slugs shown on the `/pillar/` page are exactly `list(PILLARS.keys())`, each with its Persian title (`PILLARS[slug]['title_fa']`) and its live subtopic list (`PILLARS[slug]['subtopics']`, each `{"slug": ..., "title_fa": ..., ...}`). One-liner:

```bash
python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"
```

#### Step 2 — Semantically pick the pillar (auto-apply if clear, else propose options)

Compare the **conceptual subject** of the new content against each pillar in the live set. Per **Hard Rule 14**:

- **One pillar is clearly, unambiguously the best conceptual fit and no other pillar is plausibly competitive** → set `pillar.primary` to that slug directly and state the decision plainly (e.g. «با توجه به محتوا، پیلار: «[title_fa]» (`[slug]`)»). No need to wait for a yes — just report it.
- **Genuinely ambiguous** (two or more pillars are each a real plausible fit, or the content doesn't clearly belong to any one pillar) → stop and ask, presenting the competing candidates plus the option of none:
  > با توجه به محتوا، این پیلارها هر دو محتمل به نظر می‌رسن: «[A]» یا «[B]». پیلارهای موجود: [title_fa فهرست همه‌ی پیلارها]. کدوم درسته؟ (یا «هیچ‌کدوم»)

- **User confirms / picks another (when asked)** → use that slug **exactly** as it appears in `PILLARS` (same spelling/format, no normalization).
- **No pillar applies** (auto-detected or user says none) → `pillar.primary` stays `null`; **skip Step 3** (no subtopic). The فهرست موضوعی capsule in step 2.5 then falls back to the sitewide `/pillar/`.

Either way, report the pillar decision in the running commentary before it's written to the brain (step 5) — auto-applied is not silent.

#### Step 3 — Semantically pick the subtopic (structured pillars only; auto-apply if clear, else propose options)

- **Confirmed pillar is NOT structured** (`pillar.primary not in PILLARS`) → there is no subtopic. `pillar.subtopic` stays `null` (the key is still present). State it:
  > پیلار «[X]» فعلاً جزو پیلارهای ساختاریافته نیست — ساب‌تاپیک خالی می‌مونه، بعداً دستی اضافه‌ش کن.
- **Confirmed pillar IS structured** → semantically compare the content against `PILLARS[primary]['subtopics']`. Per **Hard Rule 14**:
  - **One subtopic is clearly the best fit** → set it directly and state the decision plainly (e.g. «ساب‌تاپیک: «[best['title_fa']]»»).
  - **Two or more subtopics are each plausible, or none of the existing ones fit well** → stop and ask, listing the live options plus a "propose new" option:
    > پیلار: «[PILLARS[primary]['title_fa']]». چند ساب‌تاپیک این پیلار به این محتوا نزدیکن؛ کدوم درسته؟
    > 1. [subtopics[0]['title_fa']]
    > 2. [subtopics[1]['title_fa']]
    > … N. پیشنهاد یه ساب‌تاپیک جدید
  - **User picks an existing subtopic (when asked)** → use its slug **exactly** as stored in `PILLARS[primary]['subtopics'][i]['slug']` (no re-casing, no normalization).
  - **A genuinely new subtopic is needed** (no existing one fits, even at high confidence) → this always goes through the ask-with-options path, never auto-applied — propose slug + `title_fa` in the same style as that pillar's existing subtopics (kebab-case English slug, short Persian noun phrase — match the siblings), flag it **NEW**, and get explicit confirmation before adding it to `PILLARS[primary]['subtopics']` in `tools/build_pillar.py` (copying the exact shape of an existing sibling subtopic). **A new pillar is never created here.**

#### Step 4 — Hold the confirmed values

Hold the confirmed `pillar.primary` and `pillar.subtopic` for the rest of the run. Step 2.5 uses `pillar.primary` for the capsule `href`; step 5 writes both into the brain entry; step 5.5 only verifies them. Do not re-decide them anywhere downstream.

### 2.5. Inject the "کاوش بیشتر" capsule section (site-wide nav)

After the new page is cloned and field values are swapped (step 2), add the "کاوش بیشتر" / pillar-link block on the **new** page, using the pillar confirmed in step 2.4. This is separate from step 4.5, which mutates a different page (the parent episode). For typed-brain and glossary pages this step uses the site-wide `dc-related-*` capsule classes defined in `dc-theme.css`; for the **Episode branch** it instead uses the page's existing `ep-related-link` markup inside «محتوای مرتبط» (see the Episode branch below).

**Conditional — based on the locked category from Phase B Question 1:**

| Locked category source | What goes in the section |
|---|---|
| Typed brain entry (any entry in `dentcast-brain.json` with a `type` field — NoteCast, Insight, Clinical, Chairside, DentAI, MetaNote, PhotoCast, ShareHub, DentCast+, DentCast, …) | **Both** capsules: دانشنامه + فهرست موضوعی (the فهرست موضوعی capsule points to the entry's own pillar — see below) |
| Glossary term page (sourced from `glossary/glossary.json`, not from the brain) | **Only** the فهرست موضوعی capsule (pointing to the term's own pillar) |
| Core podcast episode (no `type` field — `/episodes/episode-XX.html`) | **No `dc-related-section`.** Instead add the pillar link into the episode's existing «محتوای مرتبط» (`ep-section`) block using `ep-related-link` — see the **Episode branch** below. |
| **LiteCast** (isolated track — see Phase C step 0) | **Skip the specialist capsules** (دانشنامه / فهرست موضوعی point into the specialist ecosystem; LiteCast must not link into it). The «کاوش بیشتر» section itself is **kept** and filled with **LiteCast-internal** capsule links instead — see step 0.6. |

The conditional is decided by where the locked category came from. **Capsule link targets:** the دانشنامه capsule is **fixed sitewide** (`/glossary/`). The فهرست موضوعی capsule, by contrast, points to the entry's **own** pillar — `href="/pillar/<pillar.primary>/"` — using the **canonical pillar-page format**: lowercase slug, **trailing slash, no `index.html`**, matching that pillar page's own `<link rel="canonical">` (e.g. `https://dentcast.org/pillar/fixed-pros/` → internal link `/pillar/fixed-pros/`). `pillar.primary` is the value **confirmed in step 2.4**. The link targets the pillar **root**, not a subtopic anchor. **Fallback:** if `pillar.primary` is `null` (no pillar confirmed) or not a real pillar slug, the فهرست موضوعی capsule falls back to the sitewide `/pillar/` landing page. (This per-pillar target is the established site convention.)

**Markup to inject** (use the global classes — NOT `ep-*`, which are inlined per-episode and not styled on other page types):

```html
<div class="dc-related-section">
  <h2 class="dc-related-label">کاوش بیشتر</h2>
  <div class="dc-related-capsules">
    <a href="/glossary/" class="dc-related-capsule">دانشنامه</a>
    <a href="/pillar/<pillar.primary>/" class="dc-related-capsule">فهرست موضوعی</a>
  </div>
</div>
```

For glossary term pages, omit the first `<a>` (the دانشنامه capsule) — they ARE the glossary. The فهرست موضوعی capsule still points to the term's own pillar (`/pillar/<pillar.primary>/`), same canonical format and fallback as above.

**Episode branch (core podcast episodes — the «محتوای مرتبط» case).** Core episodes do **not** get a `dc-related-section`. Instead, add the pillar link into the episode page's existing **«محتوای مرتبط»** block — the `ep-section` whose label is `<h2 class="ep-section-label">محتوای مرتبط</h2>`. Use the **same `ep-related-link` markup/classes already used in that block** (the same style as the NoteCast link, e.g. `<a href="…" class="ep-related-link">…</a>`) — **not** `dc-related-capsule` — so it stays visually consistent with the rest of that section. Only the `href` and label differ:

- `href="/pillar/<pillar.primary>/"` — same canonical pillar-page format (trailing slash, no `index.html`) and same `null`/unknown fallback rule as above; here, if `pillar.primary` is `null`, **skip** the episode pillar link entirely (there is no specific pillar to point to).
- Label: a short pillar label in the register of the sibling links, e.g. «فهرست موضوعی: [PILLARS[primary]['title_fa']]».

Add it **once**; if the «محتوای مرتبط» block already links to that pillar, leave it and just confirm. If the episode has no «محتوای مرتبط» block at all, follow the same fallback the NoteCast flow uses (clone the block from the previous episode — see step 4.5) before adding the pillar link. Hash the episode page before/after; the only diff is the added pillar link.

**Placement on the new page:** at the bottom of the main content area — after the body content and before any next/prev navigation or footer. If the cloned template already has a "کاوش بیشتر" section (rare for non-episode types — most don't), insert the capsules **into that existing section** alongside whatever's already there, rather than creating a duplicate. Never remove anything pre-existing in that section.

**Why this is step 2.5 and not later:** the capsule injection mutates the new page itself, so it belongs adjacent to step 2 (the clone-and-swap) and before step 3 (the date audit then sees the final page state including the section).

**Cap note:** the capsules injected here count toward the global 5-link cap on the "کاوش بیشتر" section (Hard Rule 9). Because step 2.5 runs first, these capsules consume their slots first; step 4.9 later fills only whatever budget remains.

**Verify after injection:**
- The section appears once on the new page (no duplicate).
- The correct number of capsules is present for the locked category (2 for typed-brain, 1 for glossary, 0 specialist capsules for core episode and for LiteCast — but core episodes use the **Episode branch** (a single `ep-related-link` pillar link in «محتوای مرتبط») and LiteCast hits the skip branch for the *specialist* capsules, so neither reaches this `dc-related-section` verification; LiteCast's «کاوش بیشتر» is instead filled with LiteCast-internal links and verified in step 0.6).
- The فهرست موضوعی capsule's `href` is `/pillar/<pillar.primary>/` in the canonical format (trailing slash, no `index.html`), with `pillar.primary` exactly the slug confirmed in step 2.4 — or the `/pillar/` fallback when no pillar was confirmed.
- For the `dc-related-section` (typed-brain / glossary) the page uses `dc-related-*` classes only — never `ep-*`. For the **Episode branch** the opposite holds: the pillar link uses the existing `ep-related-link` markup of the «محتوای مرتبط» block, not `dc-related-capsule`.
- The injection is the only diff vs the cloned template, beyond the swaps already specified in step 2.

### 2.6. Update the content type's landing/index page

Every content type has its own landing page that lists its entries (e.g. `/sharehub/index.html`, `/notecast/index.html`, `/insight/index.html`, …). When new content of that type is published, **its own landing page must gain a link to the new entry** — otherwise the entry is reachable only via the brain widget and Pulse, never from its own section's index. This is separate from step 6 (the homepage Pulse) and from the homepage latest-content widget.

**Determine how the landing page is produced — generated vs hand-maintained:**
- **If it's generated by a builder** (look for an auto-generated marker, a `fetch('…brain.json…')` client render, or a `tools/` script that writes it): do NOT hand-edit it. Just ensure the new brain entry exists (step 5) and run the appropriate builder in step 8; the entry will appear on rebuild. Note in the report which builder regenerates it.
- **If it's hand-maintained static HTML** (no generator, an explicit list of entries): add the new entry's link **manually**, matching the existing list items **exactly** (same markup, classes, wording pattern) and placing it in the correct position (mirror the existing order — typically newest-first at the top of the list). Swap only the URL and the human-readable label; copy the label style of the sibling items (for ShareHub the convention is `<title> (مطلبی از <author>)`).

**A numbered series states the position in the row — the landing page is the only
place a reader can see where the series starts and ends.** When the type is an
ordered series (پلاک صفر, پرامپتولوژیست, any «قسمت N» run), the row reads
**«قسمت N — <title>»**: the number first, then the title **with the series name
stripped**. The series name is dropped on purpose — the landing page IS that
series, so repeating it on every row spends the width that the number needs and
tells the reader nothing. Founder decision, 2026-09-18, after four parts of
پلاک صفر shipped as bare «پلاک صفر — <title>» rows: every row looked alike, and
somebody arriving could not tell which part was the first, which was the newest,
or how many there were.

Three things this rule depends on:

- **N is the part's position in the series, taken from the id** (`plak1-5` → ۵),
  in Persian digits, and it is **not** invented for a series that has no
  numbering of its own.
- **Chapters keep their own numbering, they do not flatten.** پرامپتولوژیست is
  already correct and is not to be renumbered: its rows sit under «فصل N — …»
  headings and restart at «قسمت ۱» inside each chapter, matching each page's own
  badge («فصل ۷ · قسمت ۱»). The rule is that the row carries the position, not
  that every series counts from one to twenty.
- **The brain title does not change.** It keeps the series prefix
  («پلاک صفر — بیمار چه تایپ می‌کند») because that is what the homepage rail,
  the pillar page, up-board and search render, where there is no surrounding
  context to supply it. So the landing row is a **second legitimate label**, the
  same shape `episodes.html` already has — and `tools/verify_publish.py` knows
  it (`numbered_series_label`): the row passes when it carries a «قسمت N» marker
  **and** the brain title's own tail verbatim. A drifted title still fails, and a
  row that merely lost its number fails too, so the exception cannot be used to
  ship a truncated label.

A series whose landing rows already carry their number inside the title
(`chairside/` → «Chairside 02 — …», `metanotes/` → «متانوت نوزده: …»,
`notecast/` → «نوت‌کست چهلم — …») already satisfies this and is left alone.
An **unnumbered** type (`insight/`, `sharehub/`) is not a series and gets no
number — «قسمت N» on a standalone note would be a sequence that does not exist.

**Glossary note:** author the individual term page through steps 1–2 using the same-type template. Register its metadata in `glossary/glossary.json`, not `dentcast-brain.json`. `tools/build_pillar.py glossary` (part of `all`) generates **only** `/glossary/index.html` from that JSON; it does not create term pages. Never hand-edit `/glossary/index.html`; let step 8 regenerate it.

**Episodes note:** the episodes landing page is `/episodes.html` (not `/episodes/index.html`, which is only a redirect). It is a **fully static** page (NOT client-rendered) generated by `tools/build_episodes.py` from `dentcast.json` + `dentcast-brain.json` + the verbatim shell `tools/episodes_template.html`. Appending to `dentcast.json` in step 5 is **not enough** — the builder must run in **step 8** (builder #3). Never hand-edit `/episodes.html` (it's overwritten); to change page chrome, edit `tools/episodes_template.html` then rebuild.

**Verify after edit:** the landing page now links to the new entry exactly once, the only diff is that single added link (for hand-maintained pages), and the link target/label are correct.

### 3. Date / meta double-check

Resolve today's date in every format the template uses. Audit every meta/OG/Twitter/JSON-LD field and visible body dates. Flag STALE / DIVERGENT / MISSING. Print audit table before & after. Set `datePublished` and `dateModified` to today. Fix everything until all rows = OK.

### 4. Integrity check

Recompute SHA-256 of the template page. Must match step 1. If not, stop and report.

### 4.5. Update parent episode's related content (NoteCast only)

Only when the locked category is **NoteCast**. Skip entirely for every other type.

After the new NoteCast page is built and verified, locate the parent episode page at `/episodes/episode-XX.html` (same XX as the NoteCast). Open it and find the related-content block.

**If a related-content block exists in the parent episode:**
- If it already links to `/notecast/episode-XX.html` → leave it alone, just confirm.
- If it doesn't link to the new NoteCast yet → add the link, matching the exact HTML structure, classes, and labeling used by the same block in the **previous episode's page** (`/episodes/episode-(XX-1).html`). Use the previous episode's NoteCast-related-content markup as the template — only swap the URL and any episode number references.

**If no related-content block exists in the parent episode at all:**
- Pull the entire block from `/episodes/episode-(XX-1).html` and insert it at the same structural position in `/episodes/episode-XX.html`. Swap URL and number references.

**If the previous episode also has no related-content block:**
- Stop and ask the user where the block should go and what markup to use. Don't improvise.

Hash the parent episode page before editing and after. Report both. The only diff allowed is the related-content insertion.

### 4.5-ب. Shared evidence base — DES score and article credit mirror across the episode/NoteCast pair

**A NoteCast is the written version of its episode.** When either side of the
pair cites a scientific source, they are citing the **same** source — so a DES
record (step 4.13) and a first-author→DOI/PubMed credit (step 4.10 Part 3) are
not a property of the page they were written on, they are a property of the
**paper**, and belong on **both** pages of the pair whenever the paper is
identified on either one. Runs whenever the publish is a **NoteCast** or a
core **episode**, in either direction:

- **Publishing a NoteCast whose Question 4.8 basket 2 source is already scored
  on the parent episode** (`plus/des-scores.json` has a `episodes/episode-XX`
  record, or the parent episode page already carries a `.author`/«منابع»
  credit for that source): copy the DES `sources[]` array **verbatim** into
  `notecast/episode-XX` (new `scored_at` = today), and add the same
  first-author→DOI/PubMed credit link to the NoteCast page, in the NoteCast's
  own credit-block convention (`.author` block, «نویسنده:» label, placed
  right after the article body — add the `.author` CSS rule to the page's
  `<style>` if the template doesn't already carry it).
- **Publishing/editing a core episode whose cited source is already scored on
  its NoteCast** (the reverse case): copy the NoteCast's DES record into
  `episodes/episode-XX` and add the credit block to the episode page (right
  before «محتوای مرتبط», the precedent placement — see `episodes/episode-12.html`).
- **Neither side has a record yet:** run step 4.13 once, on whichever page is
  being published, then immediately mirror the result to the sibling per the
  rule above — never score the same source twice independently. Two
  independent scoring runs of the identical source are not guaranteed to
  agree token-for-token even when the arithmetic lands the same, and mirroring
  is what keeps the pair's numbers *identical*, not just close.
- **No DOI exists for the source:** never fabricate one. Ask the user what to
  link the credit to (a PubMed/PMID record, a publisher page, ResearchGate,
  or no link at all) — the same standard as step 4.10 Part 3 — and reuse that
  same answer on both pages rather than asking twice.

**Found on `episodes/episode-40` / `notecast/episode-40` (2026-09-01).** The
NoteCast was published first (basket 2, Fages & Bennasar 2013, no DOI — the
user supplied the paper and confirmed a PubMed credit link), and got a DES
record and credit. The parent episode, which discusses the exact same source,
was never touched — until the user pointed out that a NoteCast and its
episode are the same evidence claim told twice, so a reader landing on either
page should see the same score and the same source. Nothing in steps 4.5,
4.10, or 4.13 as originally written said to check the sibling page at all;
each treated its own publish as the entire scope. This step closes that gap
going forward. **This is a real gap on old pairs, not just a future rule**:
`episodes/episode-6`/`notecast/episode-6` and `episode-7`/`notecast/episode-7`
already had matching DES records but no credit link on the NoteCast side, and
`episode-12`/`-13`'s NoteCasts had neither — all four were backfilled by hand
when this rule was written and are not migrated automatically by anything.
When touching an older episode/NoteCast pair for an unrelated reason, check
this in passing per Hard Rule 11's spirit (a gap on an old page is something
to fix on its own, never a pattern to copy forward) rather than leaving it.

Verify & report: for the sibling page touched, its before/after hash (the only
diffs allowed are the DES record's `scored_at` in `plus/des-scores.json` plus,
on the page itself, the added `.author` block and its CSS rule); confirm the
mirrored `sources[]` array is byte-for-byte identical to the original record
except `scored_at`; confirm the credit link target matches the original
(same DOI/PubMed/other URL, never re-resolved independently).

### 4.6. Promptologist series prev/next navigation (Promptologist only)

Only when the locked category is **Promptologist**. Skip entirely for every other type.

Promptologist parts are an **ordered series** (id format `prompt<season>-<part>` — e.g. `prompt1-1`, `prompt1-2`; page at `/dentai/promptologist/<id>.html`). Each part's page ends with an **`ep-nav` block** — the very last element inside `<main>`, after the `.ep-box` — exactly like a core episode's prev/next bar:

```html
<div class="ep-nav">
  <span class="ep-nav-btn ep-nav-empty"></span>
  <span class="ep-nav-btn ep-nav-empty">قسمت بعدی &#8594;</span>
</div>
```

It has two slots, in DOM order: **first = previous part**, **second = next part**. An **active** slot is an anchor — `<a href="/dentai/promptologist/<id>.html" class="ep-nav-btn">…</a>`; an **empty/placeholder** slot is a `<span class="ep-nav-btn ep-nav-empty">…</span>` (the `ep-nav-empty` class greys it out and disables the pointer). This mirrors the core-episode nav, whose active form is e.g. `<a href="/episodes/episode-151.html" class="ep-nav-btn">اپیزود 151 &#8594;</a>`.

Because step 2 cloned the previous part **verbatim**, the new page arrives with **both** slots still empty (copied straight from the template). **Two pages must be fixed** — the new part's own nav, and the previous part's "next" slot:

**A) On the NEW part's page — wire its «previous» slot.**
- Convert the **first (previous)** slot from the empty placeholder into a real link to the immediately-preceding part (`prompt<season>-<part − 1>`):
  `<a href="/dentai/promptologist/<prev-id>.html" class="ep-nav-btn">&#8592; قسمت قبلی</a>`
- Leave the **second (next)** slot as the empty placeholder `<span class="ep-nav-btn ep-nav-empty">قسمت بعدی &#8594;</span>` — there is no next part yet. (When a later part is published, *that* publish converts this slot per (B).)

**B) On the PREVIOUS part's page — wire its «next» slot to the new part.**
- Open `/dentai/promptologist/<prev-id>.html` and find its `ep-nav` block. Its **second (next)** slot is currently the empty placeholder `<span class="ep-nav-btn ep-nav-empty">قسمت بعدی &#8594;</span>`.
- **Replace it in place** with a real link to the new part, keeping the **visible text identical**:
  `<a href="/dentai/promptologist/<new-id>.html" class="ep-nav-btn">قسمت بعدی &#8594;</a>`
- Leave the previous part's own **first (previous)** slot untouched.
- **Hash the previous part's page before and after.** The only allowed diff is that one slot turning from a `<span … ep-nav-empty>` placeholder into an `<a … class="ep-nav-btn">` link (tag swapped, `href` added, `ep-nav-empty` removed; visible text unchanged).

Match the label register to whatever the series already uses for these buttons (the placeholders read «قسمت قبلی» / «قسمت بعدی»). If the previous part has **no** `ep-nav` block at all (an older template), **stop and ask the user** before improvising one.

**Verify after write:**
- The new page's **previous** slot links to `<prev-id>.html`, and its **next** slot is still the empty placeholder.
- The previous page's **next** slot now links to `<new-id>.html` and no longer carries `ep-nav-empty`.
- Both pages' `ep-nav` blocks still have **exactly two** slots, and no other diff was introduced on either page.
