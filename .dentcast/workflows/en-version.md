# DentCast English-Version Router

Sibling to `README.md` (the «متن جدید دارم» publishing router). That router
**creates new Persian content**; this one **mirrors an EXISTING page into
English**. It never invents source content — it only translates what is
already published.

**Trigger (registered in `CLAUDE.md`):** **«… رو انگلیسی کن»** — e.g.
«پرامپتولوژیست ۱ رو انگلیسی کن» or «نسخه‌ی انگلیسیِ متانوت ۳». Any input of
the form *«<صفحه> رو انگلیسی کن»* / *«نسخه‌ی انگلیسیِ <صفحه>»* enters THIS
workflow, not the publishing router. (Rename freely — it is a single string
in `CLAUDE.md`.)

---

## Hard rules

1. **Source must already exist.** This workflow takes a *published* page of
   any type and produces its English counterpart. If the named source page
   does not exist on disk, stop and ask — never fabricate the source.
2. **One source → one en page.** Each run mirrors exactly one document. No
   batch translation, no series walking (that is a separate, future
   per-page invocation).
3. **Location is mechanical:** the en page is always
   `/{type}/en/{same-filename}.html` — the source filename mirrored verbatim
   under an `en/` subfolder of the source's own type directory (the A1
   pattern already used by `/metanotes/en/`). Never rename, never flatten.
4. **Chrome vs. content separation is absolute (see Phase C step 2).** The
   English header chrome + language toggle come from the **universal en
   chrome standard** (`metanotes/en/meta-1.html`). *Everything else* — body,
   box/section structure, CSS classes, JSON-LD `@type` — comes from the
   **source page's own type**, translated. The en page must look like its
   own type rendered in English, NOT like a metanote.
5. **The toggle is a real per-document language switch, never a link to
   meta-1.** Its target is computed from the *current* document's own
   filename (Phase C step 4). Hardcoding meta-1's target into another page
   is a defect.
6. **Translation is structure-faithful.** Scientific, fluent, technically
   correct English; clinical/technical terminology preserved precisely;
   nothing added, nothing dropped, same number of sections/list-items as the
   source (Phase C step 5).
7. **Pairing is disk-discovered, never hardcoded.** hreflang/toggle pairing
   exists **iff** the en file is actually on disk
   (`{type}/en/{file}` ↔ `{type}/{file}`). Enforced by
   `.github/scripts/inject_hreflang.py` (Phase C step 7). A phantom pair —
   an hreflang `en` alternate whose target file does not exist — is a bug,
   and this machinery makes it self-resolve.
8. **en pages stay OUT of the brain ecosystem.** This workflow does **not**
   append a `dentcast-brain.json` entry, does **not** add a Pulse line, and
   does **not** run the specialist cross-linking steps (README 4.7/4.8/4.9)
   for the en page. en pages are standalone translations, exactly as
   `/metanotes/en/meta-1..5` are today. (The en page therefore carries no
   دانشنامه/فهرست موضوعی capsules and no brain «کاوش بیشتر» links — matching
   the `en/meta-1` reference, which has none.) The **only** brain-adjacent
   effect is that the source fa page gains a toggle + an `en` hreflang.
9. **Two pages are mutated, both verified by before/after hash:** the **new
   en page** (created) and the **source fa page** (toggle added, `inLanguage`
   asymmetry fixed, en hreflang gained on the next injector run). No third
   page is touched.
10. **All existing injector skip rules are preserved.** LiteCast `.ir`-only
    pages (canonical on `dentcast.ir`) still get **no** hreflang; root
    pages, section hubs, and the `about.html ↔ metanotes/en/about.html`
    special case behave exactly as before. This workflow only generalizes
    *pairing*, it does not relax any skip.

---

## Phase A — Discover

Before asking anything beyond "which page":

1. **Resolve the source page.** From the trigger, identify the exact source
   file `{type}/{file}.html` on disk (e.g. «پرامپتولوژیست ۱» →
   `dentai/promptologist/prompt1-1.html`). Confirm it exists. Derive:
   - `{type}` = the source's directory (the path segment(s) before the
     filename; for nested types like `dentai/promptologist`, that whole
     prefix).
   - `{file}` = the source filename, mirrored verbatim.
   - The en target path: `{type}/en/{file}.html`.
2. **Read the source page end-to-end.** Capture its body structure, its box/
   section CSS classes, its JSON-LD `@type`(s) and shape, and its
   analytics/script set — these are inherited (translated), not replaced.
3. **Read the universal en chrome standard** (`metanotes/en/meta-1.html`):
   the `<html lang="en" dir="ltr" data-dc-no-header>` root, the header/topbar
   region, the toolbar/radar/global-search chrome, and the `.lang-btn`
   markup + CSS. This is the *only* thing cloned from meta-1.
4. **Read the source's fa-side toggle precedent** (`metanotes/meta-1.html`)
   for how `.lang-btn` sits inside the fa body, so the toggle added to the
   source fa page matches the established placement/markup.
5. **Idempotency check.** If `{type}/en/{file}.html` already exists, stop and
   report — do not overwrite a completed translation (the metanotes
   `en/meta-1..5` are reference pages and must never be regenerated).

## Phase B — Intake

### Question 1 — Confirm the source
> این صفحه درسته؟ `{type}/{file}.html` → خروجی: `{type}/en/{file}.html`

Wait for confirmation. Lock the source for the rest of the run.

### Question 2 — Cross-ecosystem sections (only if the source has them)
If the source body contains a «کاوش بیشتر» / related-links / glossary
back-link region (specialist ecosystem links that have **no** en
equivalent), ask once:
> این صفحه بخش «کاوش بیشتر»/لینک‌های مرتبط داره. تو نسخه‌ی انگلیسی حذفش کنم
> (پیش‌فرض، مثل en/meta-1) یا همون لینک‌های فعلی فارسی/سراسری رو نگه دارم؟

**Default = omit** on the en page (Hard rule 8 — en pages carry no
specialist capsules, matching `en/meta-1`). Keep only on explicit request.

No other intake questions: type, filename, location, canonical, hreflang,
and the translation are all derivable — do not ask for them.

## Phase C — Execute

Run, in order:

### 1. Template lock & hash
Compute and store SHA-256 of (a) the **source fa page** and (b) the
**en chrome standard** `metanotes/en/meta-1.html`. The chrome standard must
remain **untouched** at the end of the run (verify in step 9). Also hash any
**reference en page of the same type** if one exists, to reuse its exact
type-specific en rendering decisions.

### 2. Build the new en page — chrome from meta-1, content from the source type
Create `{type}/en/{file}.html` by composing two strictly-separated regions:

**A) Chrome region — cloned verbatim from `metanotes/en/meta-1.html`:**
- `<!DOCTYPE html>` + the opt-out comment + `<html lang="en" dir="ltr"
  data-dc-no-header>`.
- The deferred GA4 snippet (measurement ID `G-GMM0WC8X3M`) — present exactly
  once (per `CLAUDE.md` site-wide invariant).
- The English topbar/header, toolbar drawer, radar overlay, and global-search
  chrome.
- The `.lang-btn` CSS + button markup (its `href` is set in step 4).

**B) Content region — inherited from the SOURCE page's own type, translated:**
- Body, box/section structure, and **CSS classes copied from the source
  type** (`.text-box`, `.ep-box`, `ep-caption`, etc. — whatever that type
  uses), rendered LTR (`direction: ltr` where the source set RTL).
- JSON-LD with the **same `@type` and shape as the source** (e.g. an episode
  stays an episode schema, a Promptologist part keeps its schema) — only
  language/locale and translated text fields change (step 6).
- If a reference en page of this type already exists (from step 1), match its
  type-specific en decisions exactly; otherwise derive the LTR rendering from
  the source's structure.
- Per Hard rule 8 / Phase B Q2: the specialist «کاوش بیشتر» block is omitted
  by default.

The en page must read as *its own type in English*, never as a metanote.

### 3. Date / meta audit
Resolve today's date in every format the **source type's** template uses.
Audit every meta/OG/Twitter/JSON-LD/visible date on the new en page. Set
`datePublished`/`dateModified` consistently (a translation's publish date is
the day it is produced unless the source convention says otherwise — match
the source type's convention). Print the audit table; all rows must be OK.

### 4. Language toggle — real per-document switch, BOTH sides
The toggle's *visual template* is meta-1's `.lang-btn`; its *target* is
computed from the current document's own filename — never hardcoded:

- **On the new en page:** target `../{file}.html` (the fa original), label
  «فارسی». (Same relative form as `metanotes/en/meta-1.html` → `../meta-1.html`.)
- **On the source fa page:** add the toggle (if absent) pointing to
  `en/{file}.html` (the en version), label «English». Match the fa-side
  `.lang-btn` placement/markup precedent from `metanotes/meta-1.html`.

Each toggle must land on **this** document's true counterpart. Verify the two
targets are exact inverses of each other and that neither references meta-1
unless meta-1 *is* the document being processed.

### 5. Translation
Render the source body into English: scientific, fluent, technically
correct; clinical/technical terms preserved precisely; **structure-faithful**
(same headings, same number of list items, nothing added or dropped). Do not
translate proper nouns/brand names that are conventionally left as-is. The
translation is the only source of the en body text.

### 6. SEO head — consistent language signals
On the new en page:
- `<link rel="canonical" href="https://dentcast.org/{type}/en/{file}.html">`
  — self-canonical, always `.org`.
- hreflang block (the injector will normalize it in step 7, but write it
  correctly now):
  - `fa-IR` → `https://dentcast.ir/{type}/{file}.html`
  - `fa` → `https://dentcast.org/{type}/{file}.html`
  - `en` → `https://dentcast.org/{type}/en/{file}.html`
  - `x-default` → `https://dentcast.org/{type}/{file}.html`
- JSON-LD `inLanguage: "en"`; OG `og:locale: "en_US"` (and drop/replace any
  `fa_IR` locale carried over); `<html lang="en">`. All three language
  signals must agree.
- **Analytics/scripts follow the SOURCE type's conventions**, not meta-1's
  (e.g. if the source type loads `global-search-ui.js` / a particular
  analytics tag, mirror that; if it does not, do not add meta-1's extras).

On the **source fa page**, fix the language-signal asymmetry: ensure the fa
JSON-LD carries `inLanguage: "fa"` (the metanote fa side currently lacks it).
The `en` hreflang line itself is emitted by the injector (step 7) once the en
file exists — do not also hand-maintain a parallel copy that could drift.

### 7. Pairing / hreflang machinery — disk-discovery (generalized)
Pairing is driven by `.github/scripts/inject_hreflang.py`, which now pairs a
page **iff its en counterpart exists on disk**
(`{type}/en/{file}` ↔ `{type}/{file}`), generalized to every type — the old
hardcoded `METANOTES_PAIRED_NS` is gone. Run the injector as part of the
publish:

```bash
python3 .github/scripts/inject_hreflang.py
```

It is idempotent. Because the new en file now exists on disk, both the en
page and the source fa page receive the 4-line mirror block; the source fa
page gains its `en` alternate automatically. All existing skips
(LiteCast `.ir`-only, root pages, hubs, the about special-case) are intact.

### 8. Sitemap + cache-bust + rebuild (real runs only)
On a real invocation, finish like any publish:

```bash
python3 .github/scripts/gen_sitemap.py     # en page is .org-canonical → enters sitemap.xml
python3 tools/stamp-version.py             # cache-bust, run LAST
```

(No brain write, no Pulse, no `build_pillar`/`build_episodes` content
regeneration is required for an en page, since en pages are not brain-backed
— Hard rule 8. Run brain-driven builders only if the source fa edit in step 6
touched brain-derived output, which it normally does not.)

### 9. Integrity check & verify
- Recompute SHA-256 of `metanotes/en/meta-1.html` (the chrome standard) — it
  **must equal** step 1; the chrome standard is read-only.
- Report before/after hash of the **source fa page**; the only allowed diff
  is the added toggle, the `inLanguage` fix, and the injector's `en`
  hreflang line.
- Confirm the new en page: `<html lang="en" dir="ltr" data-dc-no-header>`,
  GA4 present exactly once, canonical self-`.org`, 4-line hreflang mirror,
  `inLanguage`/`lang`/`og:locale` all `en`, schema `@type` identical to the
  source type, toggle → `../{file}.html`, body structure-faithful to source.
- Confirm both toggles are exact inverses and neither points at meta-1
  (unless meta-1 is the document).

## Final output summary
- Source page + computed en target path
- Chrome standard hash (unchanged) + source fa page before/after hash
- Date audit table (all OK)
- Toggle targets on both sides (exact inverses, no meta-1 hardcode)
- SEO head confirmation (canonical, 4-line hreflang, language-signal trio)
- Injector run output (pairing now present for this file; skips intact)
- Explicit confirmation: no brain entry, no Pulse, no specialist
  cross-linking was added for the en page (Hard rule 8)
- List of modified/created file paths (exactly two: new en page + source fa
  page)

---

## Appendix — Dry-run (illustrative; NOT executed)

### (a) A normal source page — «پرامپتولوژیست ۱ رو انگلیسی کن»
- **Phase A:** resolve source `dentai/promptologist/prompt1-1.html`
  (`{type}=dentai/promptologist`, `{file}=prompt1-1.html`); en target
  `dentai/promptologist/en/prompt1-1.html`. Read the source (its episode-/
  prompt-style body, `.ep-box`/schema `@type`, its own analytics set); read
  meta-1 chrome; confirm en target does not already exist.
- **Phase C:** create the en page with **meta-1's English chrome** wrapping a
  **Promptologist-shaped, LTR, translated body** (same JSON-LD `@type` as the
  source, `inLanguage: "en"`, canonical
  `https://dentcast.org/dentai/promptologist/en/prompt1-1.html`, 4-line
  hreflang mirror, scripts/analytics copied from the *source* not meta-1).
  Add the toggle on the en page → `../prompt1-1.html` («فارسی») and on the
  source fa page → `en/prompt1-1.html` («English»); add `inLanguage:"fa"` to
  the fa JSON-LD. Run `inject_hreflang.py`: since
  `dentai/promptologist/en/prompt1-1.html` now exists on disk, the new
  general logic pairs both pages and writes the 4-line block to each — no
  code change, no hardcoded set needed. Two files touched: the new en page +
  `prompt1-1.html`.
- **Not done:** no brain entry, no Pulse, no series prev/next rewrite, no
  glossary back-links.

### (b) meta-6 — the phantom pair (proper death)
- meta-6 is **not** invoked here (the constraints forbid editing it). This
  entry only states what the generalized injector **will** do on its next
  real run, with no per-page action:
- Today `metanotes/meta-6.html` carries an `en` hreflang to
  `https://dentcast.org/metanotes/en/meta-6.html`, but **`metanotes/en/meta-6.html`
  does not exist on disk**, and meta-6 has no fa-side toggle button.
- With pairing now disk-discovered, `en_counterpart_path('metanotes/meta-6.html')`
  → `metanotes/en/meta-6.html`, and `disk_exists(...)` → **False**. So
  `desired_block` falls through to the **default 3-line block** (fa-IR, fa,
  x-default) — **the `en` alternate is dropped**. No fa-side toggle is
  emitted because none exists and this workflow only adds a toggle when it
  actually produces the en counterpart.
- **Result:** on the injector's first real run, the meta-6 ghost
  self-resolves — the dangling `en`→404 alternate disappears with zero
  bespoke handling. If meta-6 is later genuinely translated via this
  workflow, creating `metanotes/en/meta-6.html` re-pairs it automatically by
  the same rule.
