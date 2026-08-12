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
7. **en pages are noindexed and OUT of the hreflang cluster.** The en
   mirrors are AI-generated translations without editorial review — at
   ~170 pages that is the "scaled, unreviewed content" pattern Google's
   2026 spam updates target (2026-08-11 SEO audit) — so every en page
   carries `<meta name="robots" content="noindex, follow">`, carries **no**
   hreflang block, and stays out of `sitemap.xml`. fa pages emit **no**
   `en` alternate. Enforced by `tools/noindex_en_mirrors.py` (`--check` in
   CI/verify) and `.github/scripts/inject_hreflang.py`, which strips any
   leftover hreflang from en pages and emits the 3-line fa block. Only the
   fa↔en **toggle** remains disk-discovered (a toggle whose en target does
   not exist is still a forbidden phantom), because the toggle is a reader
   feature, not a search feature.
8. **en pages stay OUT of the brain ecosystem.** This workflow does **not**
   append a `dentcast-brain.json` entry, does **not** add a Pulse line, and
   does **not** run the specialist cross-linking steps (README 4.7/4.8/4.9)
   for the en page. en pages are standalone translations, exactly as
   `/metanotes/en/meta-1..5` are today. (The en page therefore carries no
   دانشنامه/فهرست موضوعی capsules and no brain «کاوش بیشتر» links — matching
   the `en/meta-1` reference, which has none.) The **only** brain-adjacent
   effect is that the source fa page gains a toggle.
   Same rule for FAQ/flashcards: an en page never carries a `FAQPage` or
   `DefinedTermSet` block, on the page or anywhere else — `plus/quiz-index.json`
   and `plus/flashcards-index.json` both skip `/en/` content ids by
   construction. Any pre-existing en-page entries left over in
   `plus/faq-corpus.json` from before FAQ/flashcards were removed from page
   markup (`.dentcast/faq-schema-removal-handoff.md`) are archive only —
   never re-authored, never re-added to an en page.
9. **Two pages are mutated, both verified by before/after hash:** the **new
   en page** (created) and the **source fa page** (toggle added, `inLanguage`
   asymmetry fixed). No third page is touched.
10. **All existing injector skip rules are preserved.** LiteCast `.ir`-only
    pages (canonical on `dentcast.ir`) still get **no** hreflang; root
    pages, section hubs, and the `about.html ↔ metanotes/en/about.html`
    special case behave exactly as before. This workflow does not relax
    any skip.

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
Per README Hard Rule 14: if the trigger phrase resolves to exactly one file on disk with no ambiguity, state the resolved path directly and proceed — no need to wait for a yes:
> منبع: `{type}/{file}.html` → خروجی: `{type}/en/{file}.html`

Only ask when the trigger is genuinely ambiguous (it could match more than one file, or the resolved path doesn't obviously exist):
> این صفحه درسته؟ `{type}/{file}.html` → خروجی: `{type}/en/{file}.html`

Lock the source for the rest of the run.

### Question 2 — Cross-ecosystem sections (only if the source has them)
The default (omit on the en page, matching en/meta-1) is well-established — per Hard Rule 14, apply it directly and note it in the report rather than asking every time:
> این صفحه بخش «کاوش بیشتر»/لینک‌های مرتبط داره؛ طبق قرارداد en/meta-1 تو نسخه‌ی انگلیسی حذف می‌شه.

Only ask when there's a real reason to deviate from the default (the user has previously asked to keep such links on an en page, or the section's content isn't clearly specialist-only):
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
- **Styling source (dc-article era):** fa article pages now take their body
  styles from the shared **RTL** layer `/dc-article.css` and keep only
  page-specific rules inline. The en page must **NOT** link
  `/dc-article.css` (it is RTL-tuned). Instead give the en page its own
  inline `<style>` carrying an **LTR-adapted equivalent** of that look:
  760px column, centered near-black h1, section headings with the accent
  bar on the **left** (`border-left:4px solid #0b5fff`), white token
  cards, plus the source type's own specific rules. If a reference en page
  of the same type exists, copy its decisions; otherwise use
  `insight/en/insight-46.html` as the canonical precedent for box-article
  types.
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

### 4.5. Series prev/next navigation (series types only)
For ordered-series types whose pages carry a bottom `ep-nav` prev/next bar
(e.g. Promptologist `prompt<season>-<part>.html`), the en page **keeps** that
bar — it is part of the type's own structure (Hard rule 4), so it must not be
dropped even under the Phase B Q2 "clean translation" default (that default
governs the specialist «کاوش بیشتر» capsules, not the series nav). The bar
operates **entirely within the en tier**, mirroring the fa series mechanism
(README 4.6):

- **Targets are en counterparts.** The previous/next slots point to the en
  pages of the adjacent parts (`{type}/en/{prev-or-next-file}.html`), never to
  the fa pages and never cross-language.
- **Absent sibling → disabled placeholder.** If an adjacent part has no en
  page yet, that slot stays the empty/disabled placeholder
  `<span class="ep-nav-btn ep-nav-empty">…</span>` (keep the directional label
  on the "next" placeholder, e.g. `Next Part →`; leave the "previous"
  placeholder empty for a first part). Do **not** emit a link to a
  non-existent en file (no 404) and do **not** fall back to the fa part.
- **Wiring is reciprocal, on the sibling's publish.** When a later part is
  translated via this workflow, that run converts this page's "next"
  placeholder into a real link to the new en part, and wires the new part's
  "previous" slot back here — exactly the README 4.6 prev/next dance, applied
  to the en tier. Carry the `.ep-nav*` CSS over from the source type so the
  bar renders.

### 5. Translation
Render the source body into English: scientific, fluent, technically
correct; clinical/technical terms preserved precisely; **structure-faithful**
(same headings, same number of list items, nothing added or dropped). Do not
translate proper nouns/brand names that are conventionally left as-is. The
translation is the only source of the en body text.

**Drop fa-side English glosses — never carry the parenthetical over
literally.** fa source text routinely glosses a Persian term with its English
equivalent in parentheses right after it — «محافظه‌کارانه بودن (Conservative)»,
«اسکن‌بادی (Scanbody)» — because that parenthetical helps a Persian reader map
the term to its English original. That purpose evaporates once the sentence
itself is already in English: translating the phrase verbatim produces a
same-word duplicate like *"conservative (Conservative)"* or *"scanbody
(Scanbody)"*, which reads as a mistake, not a gloss. When the parenthetical's
content is just the English form of the word already used (or about to be
used) in the English sentence, **drop the parenthetical entirely** — the
English word standing alone already carries the meaning. Only keep a
parenthetical on the en page when it adds real information beyond the term
itself (a translated explanatory aside, a different word, a defined
abbreviation on first use, etc.) — never when it is the same word repeated
back at itself. **Before finishing step 9's verification, grep the new en
page for this exact pattern** (a word or short phrase immediately followed by
itself in parentheses, case-insensitively) and confirm zero matches; this
class of bug is exactly what step 9's fresh eyes should catch, not something
to notice only when a source page's precedent happens to be clean.

### 6. SEO head — consistent language signals
On the new en page:
- `<link rel="canonical" href="https://dentcast.org/{type}/en/{file}.html">`
  — self-canonical, always `.org`.
- `<meta name="robots" content="noindex, follow">` — REQUIRED (Hard rule
  7; en mirrors stay out of search). **No hreflang block** — the injector
  (step 7) strips any that leaks in from a clone.
- JSON-LD `inLanguage: "en"`; OG `og:locale: "en_US"` (and drop/replace any
  `fa_IR` locale carried over); `<html lang="en">`. All three language
  signals must agree.
- **Analytics/scripts follow the SOURCE type's conventions**, not meta-1's
  (e.g. if the source type loads `global-search-ui.js` / a particular
  analytics tag, mirror that; if it does not, do not add meta-1's extras).

On the **source fa page**, fix the language-signal asymmetry: ensure the fa
JSON-LD carries `inLanguage: "fa"` (the metanote fa side currently lacks it).
The fa page keeps its standard 3-line hreflang block (fa-IR/fa/x-default)
— it gains **no** `en` alternate (Hard rule 7); the injector (step 7)
normalizes this.

### 7. hreflang / noindex machinery
Run both enforcement scripts as part of the publish:

```bash
python3 .github/scripts/inject_hreflang.py    # en page: hreflang stripped; fa page: 3-line block, no en alternate
python3 tools/noindex_en_mirrors.py --check   # every en page carries noindex (fix: run without --check)
```

Both are idempotent. The injector emits **no** hreflang on en pages and
never emits an `en` alternate on fa pages (Hard rule 7); all existing skips
(LiteCast `.ir`-only, root pages, hubs) are intact.

### 8. Sitemap + cache-bust + rebuild (real runs only)
On a real invocation, finish like any publish:

```bash
python3 .github/scripts/gen_sitemap.py     # no-op for the en page: gen_sitemap drops noindexed pages itself
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
  is the added toggle and the `inLanguage` fix.
- Confirm the new en page: `<html lang="en" dir="ltr" data-dc-no-header>`,
  GA4 present exactly once, canonical self-`.org`, robots meta
  `noindex, follow`, **no** hreflang lines, `inLanguage`/`lang`/`og:locale`
  all `en`, schema `@type` identical to the source type, toggle →
  `../{file}.html`, body structure-faithful to source.
- Confirm both toggles are exact inverses and neither points at meta-1
  (unless meta-1 is the document).
- **No same-word gloss duplicates (step 5):** confirm the en body has no
  `word (Word)` / `word (word)` leftover from a source-side English gloss —
  e.g. `python3 -c "import re; t=open('{type}/en/{file}.html',encoding='utf-8').read(); print([m.group(0) for m in re.finditer(r'\b([A-Za-z][A-Za-z-]{2,30})\s*\(\s*\1\s*\)', t, re.I)])"`
  must print `[]`.

## Final output summary
- Source page + computed en target path
- Chrome standard hash (unchanged) + source fa page before/after hash
- Date audit table (all OK)
- Toggle targets on both sides (exact inverses, no meta-1 hardcode)
- SEO head confirmation (canonical, noindex, zero hreflang lines,
  language-signal trio)
- Injector + noindex-check run output (skips intact)
- Explicit confirmation: no brain entry, no Pulse, no specialist
  cross-linking was added for the en page (Hard rule 8)
- Explicit confirmation: no `word (Word)` same-word gloss duplicates left
  over from the fa source's parenthetical English glosses (step 5 / step 9)
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
  `https://dentcast.org/dentai/promptologist/en/prompt1-1.html`, robots
  `noindex, follow`, no hreflang, scripts/analytics copied from the *source*
  not meta-1).
  Add the toggle on the en page → `../prompt1-1.html` («فارسی») and on the
  source fa page → `en/prompt1-1.html` («English»); add `inLanguage:"fa"` to
  the fa JSON-LD. Run `inject_hreflang.py` (fa page keeps its 3-line block,
  en page gets none) and `noindex_en_mirrors.py --check`. Two files touched:
  the new en page + `prompt1-1.html`.
- **Series nav (step 4.5):** the bottom `ep-nav` prev/next bar is kept (it is
  type structure). Part 1 has no previous; "next" stays a disabled placeholder
  until `en/prompt1-2.html` exists, at which point translating part 2 wires
  both slots within the en tier.
- **Not done:** no brain entry, no Pulse, no glossary back-links.

### (b) meta-6 — the phantom pair (historical)
- This entry documented how disk-discovered *hreflang pairing* once made a
  dangling `en`→404 alternate on `metanotes/meta-6.html` self-resolve. It
  is now moot: since the en mirrors went noindex (Hard rule 7), **no** fa
  page carries an `en` alternate at all — the injector's default 3-line
  block covers meta-6 and every other fa page identically, en file on disk
  or not. The disk-discovery rule survives only for the **toggle**: a
  toggle is added exactly when this workflow actually produces the en
  counterpart, never speculatively.
