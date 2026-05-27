# DentCast Publishing Router

## Hard rules

1. **Brain is the source of truth.** Every content type's structure, required fields, schema, directory, URL pattern, image/audio/video requirements — all of it is inferable from `dentcast-brain.json`. Read it first.
2. **Categories are isolated.** Never use one category's entry as a template for another. Never borrow another type's schema shape.
3. **New entries go to the absolute END of the flat `dentcast-brain.json` array.** The latest-content widget reads the last 30 entries across all types, so physical tail position is what matters. The brain is a single flat array (no per-type sections) — the new entry becomes the last element of the whole file, regardless of type.
4. **Auto-discover first, ask second.** Only ask the user for things you cannot infer.
5. **Don't invent fields.** A new brain entry must have the same keys as previous same-category entries — no more, no less.

## Phase A — Discover

Before asking the user anything other than "what type is this":

1. Read `dentcast-brain.json` end-to-end.
2. Identify every distinct content category present (top-level arrays/sections, or a `type`/`category` field on entries — whatever the actual schema is). Build a list of categories.
3. For each category, find the most recent entry. That entry defines:
   - The directory + URL pattern for that type.
   - The schema shape (which fields exist, what they mean).
   - Which media fields the type uses: text body, image, audio, video link, external link, transcript, etc.
   - Whether previous entries link to a page file on disk (e.g., `/notecast/episode-33.html`) — if yes, that page is the structural HTML template.

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

### 5. Brain entry

`dentcast-brain.json` is a **single flat array of all entries — there are no per-type sections.** Read it. Find the most recent entry of the LOCKED category and use it as the **schema template**.

**Schema templating stays category-locked, even though physical placement does not.** Match the locked category by its `type` field — or, for the core podcast episodes, by the **absence of a `type` field** (the 202 episode entries have no `type` key at all). Don't confuse "where to put it" (end of the whole array) with "what shape to give it" (the most recent same-category entry).

Build the new entry with **identical keys, nesting, and ordering** as the previous same-category entry. Fill all fields based on new content + today's date + new URL.

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

Find the Python script in `tools/` that builds the main index. Run it from the project root. Capture stdout/stderr. If it errors, stop and report verbatim. Verify the Pulse changes appear in the generated output.

## Final output summary

- Category locked
- Auto-discovered next number (and whether user overrode it)
- Template page path + SHA-256 before/after (must match)
- Media sources gathered (and which were auto-fetched vs asked)
- Audit table after fixes (all OK)
- New brain entry (printed as it now exists at the end of the flat array) — confirmation that it's the last element, that its key set matches the previous same-category entry exactly, and (for episodes) that no `type` field was added
- Pulse: which line was removed (the bottom one), and where the new line was inserted (one above the new bottom), with before/after diff
- Python builder path + full run output
- Confirmation the new entry appears in the latest-content widget data
- List of all modified file paths
