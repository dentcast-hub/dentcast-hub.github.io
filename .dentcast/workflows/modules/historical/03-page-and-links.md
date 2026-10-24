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
`AGENTS.md` §۸.

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

**Glossary note:** glossary term pages and `/glossary/index.html` are **generated** from `glossary/glossary.json` by `tools/build_pillar.py glossary` (part of `all`). Never hand-edit `/glossary/index.html`; edit the JSON (if applicable) and let step 8's build regenerate it.

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

### 4.7. Semantic glossary back-linking (all content types)

Runs whenever new content is published, regardless of category. The goal is to surface the new content from the glossary terms it genuinely relates to — by adding a single back-link on each truly-related term's page.

**This step is narrower than its name suggests, and the gap is a separate workflow, not something to widen it into.** Its candidate pool is `glossary/glossary.json` only — an insight, a chairside or an episode is never a candidate here — and it writes only into a «کاوش بیشتر» section, never into prose. So the direction *"an already-published article's BODY should link a term published later"* is **not** covered by this step, by 4.8 (which only ever runs on the page in flight, pointing outward), or by 4.9. That direction has one owner: **`.dentcast/workflows/cross-link.md`**, reached two ways — automatically and **scoped to the new slug** by **step 4.7-ب** on a glossary publish, and as an unscoped backlog sweep on its own trigger. The unscoped sweep is what must never run from inside a publish: it opens every page in the corpus, which this publish's gate cannot verify.

#### Step 1 — Semantic review of glossary terms

Read `glossary/glossary.json`. Perform a genuinely **semantic** review of its terms — **not** keyword/string matching. Compare the *conceptual subject* of the new content against each glossary term's meaning and scope, and identify the terms whose topic is genuinely conceptually related to the new content.

Be **conservative**: link only where the relationship is real and would genuinely help a reader, not tangential. Per **Hard Rule 14**: when a term's relatedness is genuinely unmistakable (the new content is clearly, substantively about that exact concept), proceed to Step 2 directly for that term — no need to ask. When you are uncertain whether a term is related enough (real but borderline/tangential relevance), **list that candidate and ask the user to confirm** (a simple link-it/skip-it choice) before editing — do not guess, and do not silently drop a genuine-but-uncertain candidate without asking.

#### Step 2 — Per-term back-link (independent, per page)

For each glossary term judged semantically related (auto-applied or user-confirmed), treat it **independently** — one related term may get the link (under the cap) while another is skipped (at the cap):

- Open that glossary term's page on disk.
- Find its **"کاوش بیشتر"** section.
- Apply the **global 5-link cap (Hard Rule 9)**: count every link already present in that section. If it is already at 5, skip that glossary page entirely — add nothing, remove/reorder nothing. If there is room, add a link to the **new** content at the **bottom** of that section's link list, matching the exact form, classes, and styling of the other links already there. Use link text that fits naturally and descriptively for the new content, written in the same style/register as the sibling links — meaningful and specific, never a generic label.

#### Step 3 — Constraints

- **Add only** — never remove, reorder, or restyle existing links in any glossary "کاوش بیشتر" section.
- The added link's markup must match the sibling links **exactly** (same classes, same structure); only the URL and the descriptive text differ.
- The link text must be meaningful and specific to the new content, in the same style/register as the existing links in that section — not generic.
- If a glossary page has **no** "کاوش بیشتر" section, skip it — do not invent one — unless this document's conventions elsewhere already define how that section is created, in which case follow that.
- **Hash each glossary page before and after editing.** The only allowed diff is the single appended link. Report before/after hashes for every edited page.

#### Verify after write

- Each edited page differs from its pre-edit state by exactly one appended link, nothing else (confirmed by the before/after hashes and a diff).
- No page that was at the 5-link cap was touched.
- Report the full candidate list, which terms were linked, which were skipped (and why: cap reached / no section / judged unrelated), and the link text used on each edited page.

### 4.7-ب. Cross-link the new TERM into existing bodies (glossary publishes only)

**Runs only when the locked category is `glossary`.** Every other type reports it
as a documented skip ("4.7-ب: skipped — not a glossary publish") and moves on:
this step is about a newly published *term*, and a NoteCast or an Insight
publishes no term.

A glossary term is born with **zero** inbound in-body links, and nothing in this
workflow would ever give it one: 4.7 links only *from glossary pages* and only
into a «کاوش بیشتر» section, and 4.8 runs on the page in flight pointing
outward. So a term's inbound link count is a function of how much content is
published *after* it — which for a term published today is nothing, forever.
This step closes that at the moment it opens.

**Run `.dentcast/workflows/cross-link.md` scoped to the slug just published**, the
same way Phase D hands the finished page to `en-version.md`:

```bash
python3 tools/cross_link_candidates.py --slug <the new slug> --json /tmp/cross-link.json > /tmp/cross-link.md
```

Then follow that workflow's Phases B → E. Everything it says applies unchanged —
anchors only with the mechanical text gate, the ZWNJ word-boundary rule, the
AUTO/ASK split, the density ceiling, `episodes/`+LiteCast+en out of scope. It
writes **no** brain entry, runs **no** builder, and needs **no** version bump, so
it does not disturb the ordering of steps 5–8; run it here, before the brain
write, so its page edits are in the same commit as the publish.

**Do not run the unscoped sweep from inside a publish.** `--slug` is what keeps
this bounded (today's `dental-implant` produced 32 candidates; the full sweep
opens 71 pages, which this publish's gate cannot verify).

**Report:** the candidate count for the new slug, what was applied, and every ASK
with its verdict — or the explicit "0 candidates: every tagged page already links
it or does not say the term in its body", which is a real and common outcome.

### 4.8. Suggest in-article internal links (all content types)

**MANDATORY on every publish, for every type (core episodes included) — see Hard Rule 11.** This is the **inverse** of step 4.7: where 4.7 links existing pages *to* the new content, this step enriches the new article's **own body** with internal links pointing **out** to existing glossary terms and episodes. It operates on the new content's page, so it belongs with the page-mutation steps.

**This step is NOT governed by the template/clone or by what the previous same-category page contained (Hard Rule 11).** You **must** run a fresh semantic analysis of *this* body regardless of whether the cloned page had inline links. Any link that merely came across in the clone does **not** count as executing this step. **For core episodes, the "body" is the «درباره این اپیزود» (`ep-caption`) text.** Skipping is allowed **only** when, after the analysis below, there are **zero genuinely-qualifying candidates** — and you must then report that explicit empty result (never silence, never "matched the previous page").

#### Step 1 — Build the candidate target list

Read **both** `glossary/glossary.json` **and** `dentcast-brain.json`. Build one candidate target list:
- Every glossary term, with its page URL.
- Every episode, with its page URL, from `dentcast-brain.json`.

#### Step 2 — Semantic analysis of the article body

Perform a genuinely **semantic** analysis of the new article's body — **not** surface keyword/string matching. For each candidate target the question is conceptual: does this exact place in the article actually refer to the concept that the glossary term or episode is about? A term qualifies **only** when the word/phrase, in its real context, carries the meaning of the target concept — not merely because the same letters appear.

**Hard rules for matching:**
- **No junk/generic words.** Do not propose links on common, generic, or filler words that merely coincide with a term string (ordinary verbs, common adjectives, everyday nouns not used as the technical concept). If a reader wouldn't gain anything from the link, it's junk — discard it.
- **Sense-disambiguation required.** If a word has both an everyday meaning and a technical/glossary meaning, link it **only** where it is clearly used in the technical sense. Skip everyday-sense occurrences entirely.
- **Conceptual relevance over lexical coincidence.** A match is valid only when the linked concept is genuinely the thing being discussed at that point, and the link would genuinely help the reader go deeper.
- **When in doubt, DON'T propose it.** Precision beats coverage. A short list of strong, meaningful links is the goal — never a flood of weak matches.

#### Step 3 — First-occurrence only

For each term that survives the semantic filter, the link targets **only the FIRST occurrence** of that word/phrase in the article body (the first place it appears in the qualifying technical sense). Do not link later occurrences of the same term. **One link per term, on its first qualifying appearance, in reading order.**

#### Step 4 — Auto-apply high-confidence matches; ask only for the rest

Per **Hard Rule 14**, split the surviving candidates by confidence:

- **Unmistakable matches** (the word is clearly being used in its technical sense to discuss exactly that concept, per Step 2's sense-disambiguation rule) → proceed straight to Step 5 for these; no confirmation round-trip needed. State them plainly in the running commentary (matched phrase, target, one-line reason) so the user can see and override afterward.
- **Borderline or judgment-call matches** (plausible but not unmistakable — a looser conceptual connection, a term that could be read either technically or generically here) → **do not** insert yet. Present these as a numbered review list — matched phrase with context, target type, target URL, one-line reason — and ask the user which (if any) to apply. The user may approve all, a subset, or reject.

#### Step 5 — Insert links

Insert the auto-applied matches and any user-approved matches, each on the **first qualifying occurrence** of its term in the body, using the **same anchor markup/classes the article body already uses for inline links** (match the existing in-body link style exactly — do not introduce a new link style).

#### Step 6 — Constraints

- **First occurrence only, one link per term** — never link the same term twice.
- **Semantic, not lexical** — never link a word purely because its characters match a term; the concept must actually be present at that spot.
- **No self-links** — if the new content IS the glossary page for "X", don't link "X" in its own body to itself.
- **Don't break structure** — never create a link inside an existing link, inside a heading, or anywhere it would break the HTML.
- **Hash the new page before and after this step.** The only allowed diffs are the approved anchor insertions. Report before/after hashes.

### 4.9. Semantic "کاوش بیشتر" links on the new page (all content types)

**MANDATORY on every publish, for every type (core episodes included) — see Hard Rule 11.** Enriches the **new content's own** "کاوش بیشتر" section with links pointing **out** to semantically related existing brain entries.

**Episode mapping (Hard Rule 11):** core episodes have **no** `dc-related-section` "کاوش بیشتر" — for an episode this step targets the **«محتوای مرتبط»** (`ep-related-link`) block instead, filling its free slots (under the Hard-Rule-9 cap) with related brain entries; **the sibling parts of a multi-part series are the highest-priority candidates** and must be proposed first. The «محتوای مرتبط» / «کاوش بیشتر» naming difference is **not** grounds to skip. As with 4.8, this step is **template-independent**: that the cloned/previous page held only the pillar capsule is **not** a reason to leave it at one link. Skipping a slot is allowed **only** when the section is at the 5-link cap or there are **zero qualifying candidates**, and that empty result must be **reported explicitly**.

Direction matters — don't confuse this with the neighbouring steps:
- Step 4.7 adds a link **to** the new content **from** related glossary pages' "کاوش بیشتر" sections.
- Step 4.8 adds inline in-body links **from** the new article's text to glossary terms / episodes.
- **This step (4.9)** adds links **into** the new content's **own** "کاوش بیشتر" section, pointing to semantically related entries from `dentcast-brain.json`.

It mutates the new page, so it sits with the page-mutation steps. It runs **after** step 2.5 has already injected the site-wide capsule block, so the "کاوش بیشتر" section already exists on the new page.

#### Step 1 — Semantic comparison against the whole brain

Read `dentcast-brain.json` end-to-end and perform a genuinely **semantic** comparison of the new content against **all** existing entries (every type, plus core episodes) — **not** keyword/string matching. For each entry the question is conceptual: is this entry's subject genuinely, substantively related to the new content, such that a reader would want to go there next?

**Hard rules for matching:**
- **Real conceptual relatedness only.** No tangential or coincidental matches — discard weak/adjacent ones.
- **Rank** candidates by strength of semantic relationship; strongest first.
- **When in doubt, DON'T propose it.** A few strong links beat a pile of weak ones.
- **Never link the new content to itself.**

#### Step 2 — Apply the global cap

Locate the new page's "کاوش بیشتر" section (injected in step 2.5) and apply the **global 5-link cap (Hard Rule 9)**: count the links already present (the site-wide capsules count). If already at 5, skip entirely. If fewer, you may add only up to the remaining slots, filling them with the **highest-ranked** semantic matches from Step 1, strongest first.

#### Step 3 — Markup for each added link

- Use the **same** button/capsule markup, classes, and styling as the links already in that section — only `href` and label differ.
- The label is a **short, semantically meaningful Persian title** derived from the target entry — a concise descriptive phrase, not the raw long title and not a generic word.
- The `href` is the target entry's page URL.

#### Step 4 — Auto-apply high-confidence matches; ask only for the rest

Per **Hard Rule 14**, split the ranked candidates within the available slots by confidence:

- **Strong, unmistakable relatedness** (a reader would obviously want to go there next) → insert directly, filling the available slots strongest-first; no confirmation round-trip needed. State the additions plainly (target, URL, label, one-line reason) so the user can see and override afterward.
- **Real but borderline relatedness** (worth surfacing, but not obviously a must-include) → present these as a numbered list — target, URL, proposed label, one-line reason — and ask which (if any) to add. The user may approve all, a subset, or none; respect the global cap on whatever subset they approve.

#### Step 5 — Constraints

- **Defer to the global 5-link cap (Hard Rule 9)** — never exceed it.
- **Only add** — never remove, reorder, or restyle existing links.
- Added links must match the existing capsule markup/classes **exactly** — only `href` and label differ.
- Labels must be **short, semantic, Persian, and specific** to the target — never generic.
- **Hash the new page before and after this step.** The only allowed diffs are the approved capsule additions. Report before/after hashes.
