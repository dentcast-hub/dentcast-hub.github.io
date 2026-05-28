# DentCast Publishing Router

## Hard rules

1. **Brain is the source of truth.** Every content type's structure, required fields, schema, directory, URL pattern, image/audio/video requirements — all of it is inferable from `dentcast-brain.json`. Read it first.
2. **Categories are isolated.** Never use one category's entry as a template for another. Never borrow another type's schema shape.
3. **New entries go to the absolute END of the flat `dentcast-brain.json` array.** The latest-content widget reads the last 30 entries across all types, so physical tail position is what matters. The brain is a single flat array (no per-type sections) — the new entry becomes the last element of the whole file, regardless of type.
4. **Auto-discover first, ask second.** Only ask the user for things you cannot infer.
5. **Don't invent fields.** A new brain entry must have the same keys as previous same-category entries — no more, no less.
6. **Pillar is set at entry creation; never re-decided later.** Every entry's `pillar` object is populated when the brain entry is built (step 5). The classification phase (step 5.5) reads that pillar — it does NOT re-classify, re-guess, or overwrite it under any circumstance.
7. **Structured-pillar list is live, never hardcoded.** Only some pillars are *structured* — meaning `tools/build_pillar.py` generates a topical-index page for them. The structured set grows over time and MUST be read live from `PILLARS` in `tools/build_pillar.py` on every run. Subtopics are meaningful only for structured pillars; non-structured pillars get no subtopic. Do NOT bake pillar slugs, subtopic slugs, or Persian titles into this workflow. A new subtopic is created only on explicit user confirmation; a new pillar is never created in step 5.5.
8. **`main` is authoritative for taxonomy and builders.** The authoritative source for pillars/subtopics — and for the build scripts in general — is always the `main` branch. Before reading `PILLARS` or running any builder, ensure the working state reflects `main` (run from `main`, or merge `main` into the working branch first). Never trust a feature branch's `tools/build_pillar.py` as the taxonomy source of truth.

## Phase A — Discover

Before asking the user anything other than "what type is this":

1. Read `dentcast-brain.json` end-to-end.
2. Identify every distinct content category present (top-level arrays/sections, or a `type`/`category` field on entries — whatever the actual schema is). Build a list of categories.
3. For each category, find the most recent entry. That entry defines:
   - The directory + URL pattern for that type.
   - The schema shape (which fields exist, what they mean).
   - Which media fields the type uses: text body, image, audio, video link, external link, transcript, etc.
   - Whether previous entries link to a page file on disk (e.g., `/notecast/episode-33.html`) — if yes, that page is the structural HTML template.
4. For NoteCast type specifically, the workflow must also touch the matching parent episode page in `/episodes/` to add a related-content link back to the new NoteCast.
5. Read the **live structured-pillar set** at runtime — never from memory and never from a list written into this workflow. Authoritative source: the `PILLARS` dict in `tools/build_pillar.py`. Its keys are the slugs of the pillars that get a built topical-index page, and `PILLARS[slug]['subtopics']` is the live subtopic list for each. Re-derive on every run so newly structured pillars are picked up automatically. A practical one-liner: `python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"`. The entry's pillar itself (`pillar.primary`) is set during brain-entry creation, not in the classification phase.

## Phase B — Intake

### Question 1 — Type

Ask:

> این مطلب کدوم نوعه؟ (لیست نوع‌هایی که از brain پیدا کردی رو نشون بده)

Wait. Lock the chosen category for the rest of the run.

### Question 2 — Number / identifier

Try to determine the next number automatically (max existing number in this category + 1). Ask:

> شماره‌اش [N] درسته؟

If user disagrees, accept their number.

### Question 3 — Text

Ask:

> متن کامل رو بفرست.

Wait for it.

### Question 4 — Required media (dynamic, based on category)

Look at the latest entry in the locked category and identify which media fields are populated. For each one, ask the user — but phrase the question based on what's actually needed:

- If previous entries have an **image field** populated → ask: «عکس داره؟ اگه آره فایل یا اسمش رو بده.»
- If previous entries have an **audio field** populated:
  - For types where audio lives in a sibling directory (e.g., NoteCast pulls audio from `/episodes/episode-XX`): **don't ask**. Try to fetch automatically from the matching sibling path. If sibling path can't be resolved or has no audio, then ask the user.
  - Otherwise ask the user directly.
- If previous entries have a **video / external link field** populated → ask: «لینک ویدیو/منبع چیه؟»
- If previous entries have a **transcript or attachment field** populated → ask for it.
- For any other populated field that the user clearly needs to supply (not derivable from text), ask.
- For fields that are derivable (slug, date, schema URL, etc.) — don't ask, generate them.

If a field exists in previous entries but you genuinely don't know whether the user wants it this time, ask: «این بار [field] داری یا نه؟»

### Question 5 — Pulse sentence

Ask:

> جمله‌ی پالس چی باشه و کدوم کلمه‌ش لینک بشه؟

Get the full sentence + the exact word to hyperlink. The hyperlink target is the new content's page URL in its own category's directory.

If for some category Pulse announcements aren't customary (you can tell by checking if previous Pulse entries reference that category), still ask, but also note: «این نوع معمولاً تو پالس اعلان نمی‌شه — مطمئنی می‌خوای؟»

## Phase C — Execute

Run, in order:

### 1. Template lock & hash

Identify the previous same-category page on disk (if the type has on-disk pages). Compute SHA-256, store it. This is the structural template and must remain untouched at the end.

### 2. Build the new page

Clone the previous same-category page exactly — identical HTML tree, CSS classes, component order, schema scaffolding. Replace only:
- Body text → new text from intake.
- Meta tags (`<title>`, description, OG, Twitter, canonical) → adapted to new content.
- JSON-LD field VALUES → adapted; schema shape stays identical.
- Media sources (image, audio, video, etc.) → from intake.
- All URLs/slugs → new identifier.

If the category has no on-disk page (data-only), skip this and go to step 4.

### 2.5. Inject the "کاوش بیشتر" capsule section (site-wide nav)

After the new page is cloned and field values are swapped (step 2), inject the site-wide "کاوش بیشتر" block on the **new** page. This is separate from step 4.5, which mutates a different page (the parent episode) and uses the per-episode `ep-*` classes; this step always uses the site-wide `dc-related-*` classes defined in `dc-theme.css`.

**Conditional — based on the locked category from Phase B Question 1:**

| Locked category source | What goes in the section |
|---|---|
| Typed brain entry (any entry in `dentcast-brain.json` with a `type` field — NoteCast, Insight, Clinical, Chairside, LiteCast, DentAI, MetaNote, PhotoCast, ShareHub, DentCast+, DentCast, …) | **Both** capsules: دانشنامه + فهرست موضوعی |
| Glossary term page (sourced from `glossary/glossary.json`, not from the brain) | **Only** the فهرست موضوعی capsule |
| Core podcast episode (no `type` field — `/episodes/episode-XX.html`) | **Skip** entirely. Do NOT add this section to core episode pages. |

The conditional is binary skip-or-include, decided by where the locked category came from. The capsule link targets are **fixed sitewide** (`/glossary/` and `/pillar/`) — never per-pillar, never per-subtopic, no dependency on `pillar.primary` or `pillar.subtopic`.

**Markup to inject** (use the global classes — NOT `ep-*`, which are inlined per-episode and not styled on other page types):

```html
<div class="dc-related-section">
  <h2 class="dc-related-label">کاوش بیشتر</h2>
  <div class="dc-related-capsules">
    <a href="/glossary/" class="dc-related-capsule">دانشنامه</a>
    <a href="/pillar/" class="dc-related-capsule">فهرست موضوعی</a>
  </div>
</div>
```

For glossary term pages, omit the first `<a>` (the دانشنامه capsule) — they ARE the glossary.

**Placement on the new page:** at the bottom of the main content area — after the body content and before any next/prev navigation or footer. If the cloned template already has a "کاوش بیشتر" section (rare for non-episode types — most don't), insert the capsules **into that existing section** alongside whatever's already there, rather than creating a duplicate. Never remove anything pre-existing in that section.

**Why this is step 2.5 and not later:** the capsule injection mutates the new page itself, so it belongs adjacent to step 2 (the clone-and-swap) and before step 3 (the date audit then sees the final page state including the section).

**Verify after injection:**
- The section appears once on the new page (no duplicate).
- The correct number of capsules is present for the locked category (2 for typed-brain, 1 for glossary, 0 for core episode — but core episodes hit the skip branch, so this case never reaches verification).
- The page uses `dc-related-*` classes only — never `ep-*` — to avoid relying on episode-only inline styles.
- The injection is the only diff vs the cloned template, beyond the swaps already specified in step 2.

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

### 5. Brain entry

`dentcast-brain.json` is a **single flat array of all entries — there are no per-type sections.** Read it. Find the most recent entry of the LOCKED category and use it as the **schema template**.

**Schema templating stays category-locked, even though physical placement does not.** Match the locked category by its `type` field — or, for the core podcast episodes, by the **absence of a `type` field** (the 202 episode entries have no `type` key at all). Don't confuse "where to put it" (end of the whole array) with "what shape to give it" (the most recent same-category entry).

Build the new entry with **identical keys, nesting, and ordering** as the previous same-category entry. Fill all fields based on new content + today's date + new URL — including the entire `pillar` object: `pillar.primary` (the assigned pillar slug), `pillar.secondary` (matches previous entries' shape — usually `[]`), and `pillar.subtopic` initialized to `null`. The `subtopic` key is **always present** under `pillar` (that is the brain's convention — never omit it). If the entry's pillar turns out to be structured, step 5.5 may overwrite `pillar.subtopic` with a real slug; if not, it stays `null`.

**Critical constraints:**
- Do NOT add any field that doesn't exist on the previous same-category entry.
- Do NOT remove any field that exists on the previous entry — every key must be present.
- **Episode entries have NO `type` field.** When the user picks "Episode", treat absence of `type` as the category marker. Do NOT invent a `type: "episode"` field — that would break schema parity with the previous 202 episode entries.
- If the category's schema has a `pillar` field, fill it with the assigned pillar value only. Do NOT add reasoning, notes, justifications, or any extra commentary field. The JSON shape must remain identical to the previous entry.

**Append the new entry at the absolute END of the flat `dentcast-brain.json` array** — it becomes the last element of the whole file, regardless of type. This is non-negotiable — the latest-content widget reads the last 30 entries globally, so physical tail position is what makes the new entry visible.

Re-read the file and confirm:
- Entry is the **last element of the array**.
- It has exactly the same set of keys as the previous same-category entry — no extras, no missing.
- For episode entries: confirm **no `type` field was added**.
- It's well-formed and contains no stale data from previous entries.

### 5.5. Pillar & subtopic classification (dynamic)

The brain entry's `pillar` object is already written (step 5). The pillar is **not** re-decided here. The only thing this phase may change is `pillar.subtopic`, and only when the pillar is structured.

#### Step 1 — Read the existing pillar (do not change it)

Read `pillar.primary` from the new brain entry as it was just written in step 5. Treat it as authoritative. **Do NOT re-classify, re-guess, or overwrite it under any circumstance**, including if it looks wrong — that is a separate concern handled outside this workflow.

#### Step 2 — Determine if that pillar is structured

At runtime, read the live structured-pillar set from `tools/build_pillar.py`'s `PILLARS` dict (and any data file it reads). The structured set is exactly `list(PILLARS.keys())`. Read it live every time — never bake a copy into this workflow — so newly structured pillars are picked up automatically. **Per Hard Rule 8, read `PILLARS` only from a working state that reflects `main`** (run from `main`, or merge `main` into the working branch first). A feature branch's `tools/build_pillar.py` may be stale and must not be trusted as the taxonomy source. One-liner:

```bash
python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"
```

Compare the entry's `pillar.primary` against this live structured list:

- **Pillar IS structured** (`pillar.primary in PILLARS`) → go to Step 3.
- **Pillar is NOT structured** → skip subtopic entirely. The brain convention is: the `subtopic` key remains present under `pillar` with value `null` (which is already how step 5 initialized it). Do NOT remove the key, do NOT invent a value, do NOT add a new key. Tell the user:
  > پیلار «[X]» فعلاً جزو پیلارهای ساختاریافته نیست — ساب‌تاپیک خالی موند، بعداً دستی اضافه‌ش کن.
  Then proceed to the rebuild step. Classification is done.

#### Step 3 — Present subtopic options (structured pillars only)

Look up the chosen pillar's current subtopics from the live taxonomy: `PILLARS[pillar.primary]['subtopics']`. Each is `{"slug": ..., "title_fa": ..., ...}`. Present them as a numbered choice list, using the live `title_fa` values (never hardcoded):

> پیلار: «[PILLARS[primary]['title_fa']]»
> ساب‌تاپیک‌های موجود این پیلار:
> 1. [subtopics[0]['title_fa']]
> 2. [subtopics[1]['title_fa']]
> 3. [subtopics[2]['title_fa']]
> …
> N. پیشنهاد یه ساب‌تاپیک جدید
>
> کدوم؟

#### Step 4 — Resolve the choice

- **User picks an existing subtopic** → use its slug **exactly** as stored in `PILLARS[primary]['subtopics'][i]['slug']`. Same spelling, spacing, format — no normalization, no re-casing.
- **User picks "new"** → propose a new subtopic name (slug + `title_fa`) written in the same style and convention as that pillar's existing subtopics (look at the slugs already there — kebab-case English, short noun phrases — and match). Clearly flag it as **NEW**. Ask the user to confirm the wording or edit it. **Do not finalize a new subtopic without explicit confirmation.** Once confirmed, add it to `PILLARS[primary]['subtopics']` in `tools/build_pillar.py` (copy the shape of an existing sibling subtopic exactly — do not improvise the schema) before writing the brain entry.

#### Step 5 — Write

Write the confirmed subtopic slug into the brain entry's `pillar.subtopic` field, overwriting the `null` placeholder set in step 5. Use the **exact existing field name** — `pillar.subtopic` — and the **exact slug** chosen, with no extra keys added to the `pillar` object and no sibling keys (no `pillar_reasoning`, no `subtopic_reasoning`, no notes). The rest of the entry stays untouched.

#### Verify after write

Re-read the brain entry and confirm:
- `pillar.primary` is **identical** to its value before this phase (untouched).
- `pillar.subtopic` is either a valid subtopic slug for `pillar.primary` in the live `PILLARS` taxonomy (when the pillar is structured), or `null` (when the pillar is not structured) — and the `subtopic` key is present in both cases.
- The entry's key set is **unchanged** from end-of-step-5 — no new top-level keys, no new keys under `pillar`.

### 6. Pulse update

Use the sentence + hyperlink word from intake Question 5.

- Locate the Pulse section in `index.html` (or its data source if data-driven).
- Remove the **bottom-most** (lowest) line of the Pulse section entirely — no empty containers left behind. (This is the oldest announcement, currently the Radar one, but the rule is positional: always the lowest line.)
- Insert the new sentence **one position above the new bottom** — i.e., just above whatever line is now the lowest after the removal. The new line is NOT at the very top of Pulse; it sits one above the bottom.
- The chosen word is hyperlinked to the new content's page URL.
- Match exact HTML/classes of other Pulse items.

### 7. Cache-bust the latest-content widget

The latest-content widget automatically displays the last 30 entries of `dentcast-brain.json`; no logic changes needed. Only do this: find where `dentcast-brain.json` is fetched with a version query string (`?v=<N>`) and increment it (e.g. `?v=5` → `?v=6`) so the cache serves the fresh file. If there's no version param, leave it. Nothing else in this step.

### 8. Rebuild

**Per Hard Rule 8, run these builders only from a working state that reflects `main`** (run from `main`, or merge `main` into the working branch first) — a feature branch's builder scripts may be stale.

Run both builders from the project root, in this order. Capture stdout/stderr for both; on error, stop and report verbatim.

1. **Homepage / main-index builder.** Run `python tools/update-homepage-counters.py`.
2. **Pillar builder — always run `all`.** Run `python tools/build_pillar.py all` (rebuilds every `/pillar/<slug>/index.html`, the pillar landing page, AND `/glossary/index.html`). Run unconditionally, regardless of whether the new content's pillar is structured or not — the call is cheap, idempotent, and catches cross-pillar effects. The `glossary` target is part of `all`; if you ever touch `glossary/glossary.json` directly (adding/editing a term, fixing a URL, etc.) you MUST re-run at minimum `python tools/build_pillar.py glossary` — the page is no longer client-rendered, so a JSON edit alone will not surface on the live page until the build runs. Never hand-edit `/glossary/index.html`; it is generated. Other build targets: `python tools/build_pillar.py <pillar-slug>` (single pillar), `python tools/build_pillar.py index` (pillar landing only), `python tools/build_pillar.py glossary` (glossary only).

After the pillar builder finishes, verify:
- **When the entry's pillar is structured:** the new content appears under the correct pillar + subtopic in the regenerated `/pillar/<pillar.primary>/index.html`. Report the section it landed in.
- **When the entry's pillar is not structured:** confirm explicitly that the entry was **not** forced into any pillar page (it has no structured pillar to belong to, and `pillar.subtopic` is `null`). Note this in the report rather than skipping the check.

## Final output summary

- Category locked
- Auto-discovered next number (and whether user overrode it)
- Template page path + SHA-256 before/after (must match)
- Media sources gathered (and which were auto-fetched vs asked)
- Audit table after fixes (all OK)
- "کاوش بیشتر" capsule injection (step 2.5): which branch fired (typed-brain → 2 capsules / glossary → 1 capsule / core episode → skipped); the exact `<div class="dc-related-section">…</div>` block inserted (or "skipped"); confirmation that `dc-related-*` classes were used (not `ep-*`) and that no other diff was introduced beyond step 2's swaps
- New brain entry (printed as it now exists at the end of the flat array) — confirmation that it's the last element, that its key set matches the previous same-category entry exactly, and (for episodes) that no `type` field was added
- Pulse: which line was removed (the bottom one), and where the new line was inserted (one above the new bottom), with before/after diff
- For NoteCast: parent episode page path; whether the related-content block existed already or was created; before/after hash of the parent episode page; diff of the inserted markup
- Pillar/subtopic classification: the entry's `pillar.primary` (set in step 5, untouched in step 5.5); live structured-pillar set read from `PILLARS` at runtime; whether the pillar is structured or not; resulting `pillar.subtopic` (slug if structured, `null` if not); whether a new subtopic was added to `PILLARS` on this run (and confirmed by the user); confirmation that no new keys were added to the `pillar` object or as siblings, and that the `subtopic` key is present in both cases
- Builder runs: each command + full stdout/stderr (`python tools/update-homepage-counters.py` and `python tools/build_pillar.py all`); confirmation that the new content appears in the regenerated pillar page when a structured pillar was assigned
- Confirmation the new entry appears in the latest-content widget data
- List of all modified file paths
