## Phase C — Execute

Run, in order:

### 0. LiteCast branch — isolated track (overrides the general steps)

**Check the locked category first (from Phase B Question 1).** If it is **LiteCast**, this branch's rules **override** the corresponding general steps below. LiteCast is **non-specialist (general-audience)** content, deliberately kept **separate** from the rest of the site's specialist ecosystem: it has its own source of truth, its own internal link structure, and must **not** be cross-linked with specialist content. If the locked category is anything other than LiteCast, ignore this section and proceed normally from step 1.

**0.1 — Source of truth is `litecast/lite-glossary.json`, not `dentcast-brain.json`.**
- The file is a JSON **object** whose entries live under the top-level **`LightGlossary`** key — an array of LiteCast entries (despite the filename, this is LiteCast *content*, not a glossary of terms). The current entry shape is `type` (`"litecast"`), `id` (`litecast-N`), `title`, `caption`, `hashtags`, `keywords`, `page_url` (a path like `litecast/lite-CAST-N.html`). There is **no** `pillar` field — confirm the live shape from the file rather than trusting this list.
- Infer **all** LiteCast structure from `litecast/lite-glossary.json`: required fields, schema shape, directory/URL pattern, and media requirements. Read it the way Phase A reads the brain — find the **most recent** entry in `LightGlossary` and use it as both the **schema** and **structural** template.
- The new LiteCast entry is **appended to the `LightGlossary` array** in `litecast/lite-glossary.json`, matching its format **exactly** (identical keys/nesting/ordering to the previous entry — no extra fields, no missing fields).
- Do **NOT** add a LiteCast entry to `dentcast-brain.json`. This replaces the normal step 5 brain-entry write (and the step 2.4 pillar/subtopic determination — see 0.4).

**0.2 — Isolation: no cross-linking with specialist content.** This is the core of LiteCast's separateness. For a LiteCast publish, **skip these steps entirely**:
- **Step 2.5** (site-wide capsule block) — do **NOT** inject the دانشنامه / فهرست موضوعی capsules on LiteCast pages; those point into the specialist ecosystem. LiteCast is a **SKIP** case for the *specialist* capsules in the step 2.5 conditional. **The «کاوش بیشتر» section itself is NOT skipped or left empty, though** — it is filled with **LiteCast-internal** capsule links instead, per **step 0.6**.
- **Step 4.7** (glossary back-link to the new content) — do **NOT** add LiteCast links into any glossary "کاوش بیشتر" section.
- **Step 4.8** (in-body links from the article to glossary terms / episodes) — LiteCast bodies do **NOT** get inline links to specialist content. (The LiteCast-internal in-body equivalent — inline links to *other LiteCast* items only — is **step 0.5** below.)
- **Step 4.9** (semantic "کاوش بیشتر" links from the new page to brain entries) — do **NOT** link a LiteCast page out to specialist brain entries.

The rule is symmetric: the rest of the site must not link **to** LiteCast, and LiteCast must not link **out** to specialist content.

**0.3 — LiteCast's own internal structure.** LiteCast items link **only among themselves**. When building the new page, **clone the previous LiteCast page's structure exactly**, including whatever internal LiteCast-to-LiteCast linking it already uses, and swap values. Do **NOT** invent a new internal-linking scheme — derive it from how existing LiteCast pages already link to each other. If existing LiteCast pages have **no** internal-link mechanism, do not fabricate one; leave it as the template has it and note that to the user.

**0.4 — What still runs (keyed to `litecast/lite-glossary.json` and the LiteCast directory, not the brain).** Everything that is **not** cross-linking still applies in LiteCast-appropriate form:
- **Step 1 & Step 4** (template lock + integrity hash) — against the previous LiteCast page.
- **Step 2** (build the new page) — clone the previous LiteCast page; per 0.3.
- **Step 3** (date / meta audit) — runs normally.
- **Step 2.4 (determination) and Step 5 / 5.5** — replaced by 0.1: the entry goes to `litecast/lite-glossary.json` only, and step 2.4 is **skipped**. LiteCast lives **outside** the specialist pillar taxonomy, so do **not** assign a specialist pillar/subtopic and do **not** pull from the `PILLARS` taxonomy; fill a pillar-like field only if `litecast/lite-glossary.json`'s own schema has one, per its own convention.
- **Step 6** (Pulse) — follow the existing Pulse convention for this type (including the «این نوع معمولاً تو پالس اعلان نمی‌شه — مطمئنی می‌خوای؟» check from Phase B Question 5 if LiteCast isn't customarily announced).
- **Step 0.6** (LiteCast «کاوش بیشتر» internal links) — the LiteCast counterpart of step 4.9: populate the new page's «کاوش بیشتر» section with capsule links to other LiteCast items only. Replaces the skipped step 2.5 specialist capsules.
- **Step 7** (cache-bust) and **Step 8** (rebuild) — run, keyed to LiteCast's own files.

Rule of thumb: **anything about LiteCast's own files runs (including LiteCast-to-LiteCast linking); anything that bridges LiteCast to the specialist ecosystem is skipped.**

**0.5 — In-body semantic linking within LiteCast (LiteCast-only; the LiteCast counterpart of step 4.8).** This is the *only* in-body linking LiteCast gets: inline links from the new item's body text out to **other LiteCast** items, drawn **exclusively** from `litecast/lite-glossary.json`. It is exclusive to LiteCast — it runs only when the locked category is LiteCast, never applies to any other type, and no other type's linking steps (4.7/4.8/4.9) apply to LiteCast. Run it after the new LiteCast page is built (0.3) and before the rebuild (step 8).

#### Step 1 — Semantic analysis of the new body against existing LiteCast entries

Read `litecast/lite-glossary.json` end-to-end. Perform a genuinely **semantic** analysis of the new LiteCast item's body text against the **existing LiteCast entries** — **not** keyword/string matching. For each existing entry the question is conceptual: where the new body text discusses something an existing LiteCast entry is about, that spot is a linking candidate.

**Hard rules for matching:**
- **Real conceptual relevance only** — link only where the word/phrase in context actually refers to the existing entry's concept.
- **No junk/generic words** — never link common filler words that merely coincide with a term.
- **When in doubt, DON'T propose it.**
- **Candidates come ONLY from `litecast/lite-glossary.json`** — never a specialist glossary term or episode.
- **Never link the item to itself.**
- **First occurrence only** — link only the **first** place each matched concept appears in the body; never link the same target twice.

#### Step 2 — Auto-apply high-confidence matches; ask only for the rest

Per **Hard Rule 14**: for a match where the word/phrase unmistakably refers to the existing entry's concept, proceed to Step 3 directly — state it plainly (matched phrase + context, target, one-line reason) rather than waiting for a yes. For a real-but-borderline match, present it in a numbered list — matched word/phrase with context, target LiteCast entry, its URL, one-line reason — and ask for confirmation before inserting. The user may approve all, a subset, or none of the presented ones.

#### Step 3 — Insert links

Insert the auto-applied matches and any user-approved matches into the new item's body, each on the **first occurrence** of its matched phrase, using the **same inline link markup/classes the LiteCast body already uses** (derive the style from how existing LiteCast bodies link — do not introduce a new link style).

#### Step 4 — Hash & verify

**Hash the new LiteCast page before and after this step.** The only allowed diff is the approved inline link insertions. Report before/after hashes. Do not break HTML structure (no link inside an existing link or heading).

**0.6 — LiteCast «کاوش بیشتر» internal links (LiteCast-only; the LiteCast counterpart of step 4.9).** This is the LiteCast equivalent of step 4.9. Where the general step 4.9 fills the new page's «کاوش بیشتر» section with links to semantically related **brain** entries, this step fills the **LiteCast** page's «کاوش بیشتر» section with links to semantically related **other LiteCast** items only — drawn **exclusively** from `litecast/lite-glossary.json`. It runs only when the locked category is LiteCast. **No specialist capsules (دانشنامه / فهرست موضوعی), no glossary terms, and no brain entries ever appear in a LiteCast «کاوش بیشتر» section** — it is LiteCast-to-LiteCast only. Run it after the new page is built (0.3) and the in-body pass (0.5), and before the rebuild (step 8).

#### Step 1 — Semantic comparison against other LiteCast items

Read `litecast/lite-glossary.json` end-to-end. Perform a genuinely **semantic** comparison of the new LiteCast item against **every other LiteCast entry** — **not** keyword/string matching. Rank candidates by strength of semantic relationship; strongest first. **Never link the item to itself.** **When in doubt, DON'T propose it** — a few strong links beat a pile of weak ones.

#### Step 2 — Cap

The «کاوش بیشتر» section holds **at most 5** links total (consistent with Hard Rule 9's ceiling). Because LiteCast carries **no** specialist capsules, all slots are available for LiteCast-internal links — but keep the set tight (typically 2–4 strong matches); do not pad with weak ones.

#### Step 3 — Markup

Use the **same** `dc-related-section` / `dc-related-capsules` / `dc-related-capsule` markup the LiteCast template already uses for «کاوش بیشتر»; only the `href` (the target LiteCast page URL) and the capsule label (a short Persian title of the target LiteCast item) differ. **Replace** the cloned template's specialist capsules (دانشنامه / فهرست موضوعی) with these LiteCast-internal capsules — the section ends up containing LiteCast links only.

#### Step 4 — Auto-apply high-confidence matches; ask only for the rest

Per **Hard Rule 14**: strong, unmistakable relatedness gets inserted directly (state it plainly — target, URL, label, one-line reason). Real-but-borderline candidates get presented as a numbered list — target LiteCast item, its URL, proposed short label, one-line reason — with the user asked to confirm before inserting. The user may approve all, a subset, or none of the presented ones.

#### Step 5 — Hash & verify

**Hash the new LiteCast page before and after this step.** The only allowed diff is the «کاوش بیشتر» capsule swap (specialist capsules removed, LiteCast capsules added). Report before/after hashes. Verify the section contains **only** LiteCast links — no دانشنامه / فهرست موضوعی / glossary / brain links remain.

### 1. Template lock & hash

Identify the previous same-category page on disk (if the type has on-disk pages). Compute SHA-256, store it. This is the structural template and must remain untouched at the end.

### 2. Build the new page

Clone the previous same-category page exactly — identical HTML tree, CSS classes, component order, schema scaffolding. Replace only:
- Body text → new text from intake.
- Meta tags (`<title>`, description, OG, Twitter, canonical) → adapted to new content.
- JSON-LD field VALUES → adapted; schema shape stays identical.
- Media sources (image, audio, video, etc.) → from intake.
- All URLs/slugs → new identifier.

**Identity invariant (domain follows the clone).** The page's identity **is** the cloned predecessor's domain: the clone swaps the **PATH only** and **keeps the domain** — never domain-swap during a clone. For the **LiteCast** category that domain is `https://dentcast.ir` — the full `.ir` profile (`<link rel="canonical">`, `og:url`, and every JSON-LD `/litecast/` value on `.ir`), with **NO hreflang** tags and **root-relative** internal links (`/litecast/…`). **Every other category stays on `https://dentcast.org`.** Because you clone the previous same-category page, this propagates automatically — just verify the cloned domain survived and was not rewritten. (LiteCast's hreflang-absence is additionally enforced by `.github/scripts/inject_hreflang.py`, which skips any page whose canonical is on `dentcast.ir`.)

If the category has no on-disk page (data-only), skip this and go to step 4.

**Scope of the clone (Hard Rule 11):** this clone fidelity governs **structure only**. It does **not** satisfy, replace, or pre-empt the semantic-enrichment steps (4.7, 4.8, 4.9). Whatever inline or related links the previous page did or didn't have is irrelevant to those steps — they run independently and mandatorily later. Do **not** treat "matched the cloned page" as having done 4.8/4.9.

**Google Analytics tag (every page).** The deferred GA4 snippet (measurement ID `G-GMM0WC8X3M`) must be present in the new page's `<head>`. Because you cloned the previous same-category page — which already carries it — it should come across automatically; **verify it survived the clone and appears exactly once**. If it's missing (e.g. an older template), run `python3 .github/scripts/inject_ga.py` to backfill it (idempotent — it skips pages that already have it). It is the lazy-loaded pattern (loads `gtag.js` only on the `load` event) — never swap in Google's default async snippet. The `.org`/`.ir` mirrors share this tag; no per-domain logic. If you ever introduce a Content-Security-Policy, it must allow `script-src https://www.googletagmanager.com` and `connect-src https://*.google-analytics.com https://*.analytics.google.com`.

**API preconnect (every page).** The new page's `<head>` must open with the two
preconnect links — `<link rel="preconnect" href="https://api.dentcast.ir" crossorigin>`
and the same for `https://api.dentcast.org` — at the very top, before anything
else. Like GA4 this rides in on the clone, so **verify it survived and appears
exactly once per host**; if it's missing (older template), backfill with
`python3 .github/scripts/inject_preconnect.py` (idempotent; `--check` fails on
any page missing it). Three things that are not optional and are easy to
"clean up" by mistake: **`crossorigin` is required** — the API is called with
credentials and a connection opened anonymously is not reused for a
credentialed CORS request, so dropping the attribute silently undoes the whole
thing; **both hosts are listed on every page on purpose** (the `.org`/`.ir`
codebases are mirrors and per-domain logic is forbidden — the unused socket is
idle and the browser drops it); and this is a **paid-sponsor correctness**
matter, not a micro-optimisation — the Spot card cannot render until `/me`
answers, so without preconnect the cold DNS+TLS handshake sits directly in
front of the sponsor's impression (measured 2.7–3.0s to first card vs.
70–170ms warm).

**E-NAMAD seal — never clone it onto a content page.** The trust seal
(نماد اعتماد الکترونیکی) lives on exactly three surfaces (`index.html`'s footer,
`index.html`'s col-A sidebar row, `about.html`'s contact box) and is **not** a
per-page element. If a template or an edit ever drags `.dc-trustseal` markup
onto a content page, remove it — every copy is a request to enamad's server for
zero trust value on an article page. It is also **the one deliberate exception
to "no per-domain logic"** (the seal is issued for `dentcast.ir` and renders as
*invalid* off the `.org` mirror, which is why the `dc-no-seal` guard and the
`dc-nav.js` removal block exist): never "fix" that guard, and never rewrite the
`referrerpolicy`/`id`/`Code`/`code` attributes enamad verifies. Details in
`.dentcast/workflows/global/site-invariants.md`.

**Opening paragraph before any list (body-structure requirement).** The body must
open with at least one real `<p>` of prose **before** the first `<ul>`/`<ol>`. This is
not a style preference — it is load-bearing for ad placement. The in-article Spot card
is positioned by counting **body blocks** (`p, ul, ol, blockquote, figure, table, pre`
— headings are labels and never count, `.dc-disclaimer` never counts; see
`spot/README.md`). A body that is a single `<ul>` has **one** block and therefore **no
interior boundary**, so the engine has nowhere to put the card and drops it to the end
of the text — the position least likely to ever be seen. Two blocks (an opening
paragraph + the list) are enough: the card lands between them, in the upper half.

This bites the **Insight** template hardest — its house style is `h3` label + `h3`
thesis + one `<ul>` of sections — but the requirement is type-agnostic and applies to
any page whose body would otherwise be list-only. NoteCast and DentAI pages have
drifted into the same shape and are equally affected.

Write a genuine 2–4 sentence lead that **adds** something — the clinical situation, the
decision at stake, what the reader will get — never a restatement of the `h3` thesis
directly above it. Then mirror the same paragraph into the en version in Phase D (the
en page is placed by the identical rule and has the identical problem).

**This lead paragraph is authored text, not derived from the user's own words —
it MUST be shown to the user for approval before it's written to the page,
every time, no exceptions.** Draft it, present it plainly (fa, and the en
mirror once translated), and wait for a yes/edit before proceeding to write
the file. Do not fold this into a larger batched confirmation and do not
skip it because the rest of the publish was auto-applied per Hard Rule 14 —
unlike a title/hashtag proposal (which draws its words from the user's own
text), this paragraph is fully self-composed prose sitting under the user's
byline, so it gets its own explicit sign-off. Match the register of the
user's own writing (their vocabulary for the procedure — e.g. «سمان کردن»
for cementing a crown — not a generic paraphrase), and keep it tight; when in
doubt, shorter is safer than padded.

To check a page you just built:
`node -e` against `spot/spot.js`'s `bodyBlocks()`, or simply confirm by eye that a
paragraph precedes the first list. Pages already published that fail this are a known
backlog, not a pattern to copy forward (**Hard Rule 11**).
