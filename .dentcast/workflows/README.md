# DentCast Publishing Router

## Hard rules

1. **Brain is the source of truth.** Every content type's structure, required fields, schema, directory, URL pattern, image/audio/video requirements — all of it is inferable from `dentcast-brain.json`. Read it first.
2. **Categories are isolated.** Never use one category's entry as a template for another. Never borrow another type's schema shape.
3. **New entries go to the absolute END of the flat `dentcast-brain.json` array.** The latest-content widget reads the last 30 entries across all types, so physical tail position is what matters. The brain is a single flat array (no per-type sections) — the new entry becomes the last element of the whole file, regardless of type.
4. **Auto-discover first, ask second.** Only ask the user for things you cannot infer.
5. **Don't invent fields.** A new brain entry must have the same keys as previous same-category entries — no more, no less.
6. **Taxonomy is live, never hardcoded.** Pillars and subtopics can grow over time. The workflow re-reads the current taxonomy at runtime from the authoritative source (`tools/build_pillar.py`'s `PILLARS` dict) plus the distinct `pillar.primary` values already present in `dentcast-brain.json`. Do NOT bake pillar slugs, subtopic slugs, or Persian titles into this workflow. New pillars and new subtopics are created ONLY on explicit user instruction — silent invention is forbidden.

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
5. Read the **live pillar/subtopic taxonomy** at runtime — never from memory and never from a list written into this workflow. Authoritative source: the `PILLARS` dict in `tools/build_pillar.py` (structured pillars with subtopic slugs) **plus** the union of distinct `pillar.primary` values present in `dentcast-brain.json` (loose pillars without a subtopic structure). Both must be re-derived on every run so that newly added pillars and subtopics are picked up automatically. A practical way to read the structured taxonomy live: `python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"`.

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

Build the new entry with **identical keys, nesting, and ordering** as the previous same-category entry. Fill all fields based on new content + today's date + new URL — **except `pillar.primary` and `pillar.subtopic`**, which are deliberately left for step 5.5 (those require live taxonomy lookup + user choice and must not be guessed here).

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

The brain entry is now complete except for `pillar.primary` and `pillar.subtopic`. Fill them in via the procedure below. **Re-derive the taxonomy at runtime every time — never use a list cached in memory or written into this workflow.**

#### Step 1 — Load current taxonomy fresh

At execution time, build the live taxonomy by combining two sources:

1. **Structured pillars** — the `PILLARS` dict in `tools/build_pillar.py`. Read it live, e.g.:
   ```bash
   python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"
   ```
   Each key is a pillar slug; each value is the live list of subtopic slugs for that pillar. The Persian title for a pillar slug is `PILLARS[slug]['title_fa']`; for a subtopic, `PILLARS[slug]['subtopics'][i]['title_fa']`.
2. **Loose pillars** — the set of distinct `pillar.primary` values present in `dentcast-brain.json` that are **not** keys of `PILLARS`. These are real pillars that have entries assigned to them but no structured subtopic taxonomy yet. They are valid choices for new content; their subtopic will be `null`.

The live taxonomy for this run is the **union** of (1) and (2). Never bake it into the workflow.

#### Step 2 — Determine the pillar

- Analyze the new content's topic/text.
- Compare against the live pillar list built in Step 1.
- If it fits exactly one pillar → propose that pillar and ask the user to confirm.
- If it plausibly fits more than one → present the candidate pillars (mix of structured and loose) and ask the user to pick.
- If it fits none → tell the user «با هیچ پیلار موجودی نمی‌خوره» and ask how to proceed: assign to closest existing pillar, leave unclassified (`pillar.primary: null`), or name a new pillar. **Never invent a new pillar silently.** If the user names a new pillar, ask whether it should be added to `PILLARS` (structured, with subtopics) or used loosely (no subtopic structure).

#### Step 3 — Present subtopic options for the chosen pillar

Once the pillar is settled, look up that pillar's current subtopics from the live taxonomy:

- **If the chosen pillar is structured** (a key of `PILLARS`): list its subtopics from `PILLARS[slug]['subtopics']` as a numbered choice menu, e.g.:

  > پیلار: [chosen pillar — `title_fa` from `PILLARS`]
  > ساب‌تاپیک‌های موجود این پیلار:
  > 1. [subtopic A — `title_fa`]
  > 2. [subtopic B — `title_fa`]
  > 3. [subtopic C — `title_fa`]
  > 4. پیشنهاد یه ساب‌تاپیک جدید (اگه هیچ‌کدوم نمی‌خوره)
  >
  > کدوم؟

  The user picks a number. If an existing subtopic → use its slug exactly as stored in `PILLARS`. If "new" → propose a new subtopic slug + `title_fa` written in the same style as that pillar's existing subtopics, flag it clearly as NEW, and ask the user to confirm or edit the wording before adding it.

- **If the chosen pillar is loose** (in the brain but not in `PILLARS`): there is no subtopic taxonomy. Set `pillar.subtopic` to `null` and tell the user: «این پیلار هنوز ساب‌تاپیک ساختاریافته نداره؛ subtopic = null می‌مونه. اگه می‌خوای، می‌تونیم همین الان به `PILLARS` اضافه‌اش کنیم با ساب‌تاپیک‌های دل‌خواه.»

#### Step 4 — Confirm before writing

Do NOT write `pillar.primary` or `pillar.subtopic` into the brain entry until the user has explicitly chosen/confirmed both. After confirmation, write them using the **exact existing field names and formatting** in the brain (`pillar.primary` string, `pillar.subtopic` string-or-null, `pillar.secondary` empty array unless previous same-category entries populate it). **Do not add any extra key to the `pillar` object or any sibling key like `pillar_reasoning`** — keep the entry's key set identical to the previous same-category entry's.

If the user agreed to create a new structured pillar or a new subtopic in Step 2/3, edit `tools/build_pillar.py` to add the new entry to `PILLARS` (and, for a new pillar, all the surrounding metadata that existing `PILLARS` entries have — copy a sibling entry and adapt, do not improvise the schema). Confirm the new slug is now visible in the live taxonomy before the brain write happens.

#### Verify after write

Re-read the brain entry and confirm:
- `pillar.primary` matches what the user chose (a key of the live taxonomy union).
- `pillar.subtopic` is either a valid subtopic slug for that pillar in the live taxonomy, or `null` if the pillar is loose.
- The entry's key set is **unchanged** from before this step — no new top-level keys, no new keys under `pillar`.

### 6. Pulse update

Use the sentence + hyperlink word from intake Question 5.

- Locate the Pulse section in `index.html` (or its data source if data-driven).
- Remove the **bottom-most** (lowest) line of the Pulse section entirely — no empty containers left behind. (This is the oldest announcement, currently the Radar one, but the rule is positional: always the lowest line.)
- Insert the new sentence **one position above the new bottom** — i.e., just above whatever line is now the lowest after the removal. The new line is NOT at the very top of Pulse; it sits one above the bottom.
- The chosen word is hyperlinked to the new content's page URL.
- Match exact HTML/classes of other Pulse items.

### 7. Cache-bust the latest-content widget

Find the «آخرین مطالب دنت‌کست» widget. Add cache-busting to its `dentcast-brain.json` fetch (`?v=<today's-date>` or `{ cache: 'no-store' }` — whichever fits the existing code). Confirm the new entry shows up in the widget's resolved data (it should, since it's now the newest of its category and one of the last entries overall).

### 8. Rebuild

Run both builders from the project root, in this order. Capture stdout/stderr for each. If either errors, stop and report the failing command's output verbatim.

1. **Main index builder.** Find the Python script in `tools/` that builds the main index (the one referenced by previous publishing runs). Run it. Verify the Pulse changes appear in the generated output.
2. **Pillar builder — always run `all`.** Run `python tools/build_pillar.py all` (this rebuilds every `/pillar/<slug>/index.html` plus the pillar landing page). Run unconditionally, regardless of whether the new content was assigned a structured or loose pillar — the call is cheap, idempotent, and catches cross-pillar effects.

If a single tool covers both, note that and run once. After the pillar builder finishes, confirm the new content appears under the correct pillar/subtopic in the regenerated `/pillar/<slug>/index.html` (only meaningful when a structured pillar was assigned; for loose pillars there is no per-pillar page to verify against — say so explicitly in the report).

## Final output summary

- Category locked
- Auto-discovered next number (and whether user overrode it)
- Template page path + SHA-256 before/after (must match)
- Media sources gathered (and which were auto-fetched vs asked)
- Audit table after fixes (all OK)
- New brain entry (printed as it now exists at the end of the flat array) — confirmation that it's the last element, that its key set matches the previous same-category entry exactly, and (for episodes) that no `type` field was added
- Pulse: which line was removed (the bottom one), and where the new line was inserted (one above the new bottom), with before/after diff
- For NoteCast: parent episode page path; whether the related-content block existed already or was created; before/after hash of the parent episode page; diff of the inserted markup
- Pillar/subtopic classification: live taxonomy snapshot used (structured pillars from `PILLARS` + loose pillars from brain), chosen pillar (and whether structured or loose), chosen subtopic (or `null`), whether any new pillar or subtopic was added on this run (and to which file), confirmation that no new keys were added to the `pillar` object or as siblings
- Builder runs: each command + full stdout/stderr (main index builder and `python tools/build_pillar.py all`); confirmation that the new content appears in the regenerated pillar page when a structured pillar was assigned
- Confirmation the new entry appears in the latest-content widget data
- List of all modified file paths
