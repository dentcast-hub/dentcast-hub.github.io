<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages and the three deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `C.0`, `C.0.1`, `C.0.2`, `C.0.3`, `C.0.4` (LiteCast 0.1–0.4), `C.1`, `C.2`, `C.0.5`, `C.0.6` (LiteCast links, after the page is built).

## Phase C — Execute

Run, in order:

### 0. LiteCast branch — isolated track (overrides the general steps)

**Check the locked category first.** If it is **LiteCast** (Hard Rule 10), this branch overrides the corresponding general steps; any other category ignores it and starts at step 1.

**0.1 — Source of truth is `litecast/lite-glossary.json`, not `dentcast-brain.json`.**
- A JSON **object** whose entries live under the top-level **`LightGlossary`** array (despite the filename, LiteCast *content*, not a glossary). Entry shape: `type` (`"litecast"`), `id` (`litecast-N`), `title`, `caption`, `hashtags`, `keywords`, `page_url` (`litecast/lite-CASTN.html`, e.g. `litecast/lite-CAST42.html`); **no** `pillar` field. Confirm the live shape from the file.
- Its **most recent** entry is both the schema and the structural template (as Phase A uses the brain).
- The new entry is **appended to `LightGlossary`** with identical keys/nesting/ordering.
- **No** LiteCast entry goes into `dentcast-brain.json`; this replaces step 5 (and step 2.4 — see 0.4).

**0.2 — Isolation: no cross-linking with specialist content.** For LiteCast **skip** step 2.5's specialist capsules (the «کاوش بیشتر» section itself stays and is filled by 0.6), step 4.7, step 4.8 (its LiteCast counterpart is 0.5) and step 4.9 (its counterpart is 0.6). Symmetric: the rest of the site never links **to** LiteCast, and LiteCast never links **out**.

**0.3 — LiteCast's own internal structure.** Clone the previous LiteCast page's structure exactly, including the LiteCast-to-LiteCast linking it already uses, and swap values. Never invent a new internal-linking scheme; if existing pages have none, leave it as the template has it and say so in the report.

**0.4 — What still runs (keyed to `litecast/lite-glossary.json` and the LiteCast directory).**
- Steps 1 and 4 (template lock) against the previous LiteCast page; step 2 per 0.3; step 3 (dates) normally.
- Step 2.4 is **skipped** and steps 5/5.5 are replaced by 0.1: no specialist pillar/subtopic and no `PILLARS`; a pillar-like field only if the LiteCast schema has one.
- Step 5.0 (hashtags) against the library; step 6 (Pulse) in LiteCast's own convention.
- 0.5 and 0.6 replace 4.8/4.9 and the specialist capsules.
- The runner's C.8/C.7 cover LiteCast's files after Push 2.

Rule of thumb: **anything about LiteCast's own files runs; anything that bridges LiteCast to the specialist ecosystem is skipped.**

**0.5 — In-body semantic linking within LiteCast (LiteCast-only; the counterpart of step 4.8).** Inline links from the new item's body to **other LiteCast** items only, drawn exclusively from `litecast/lite-glossary.json`. Runs after the page is built (0.3).

#### Step 1 — Semantic analysis of the new body against existing LiteCast entries

Compare the new body with every existing LiteCast entry semantically (Hard Rule 14): where the body discusses what an entry is about, that spot is a candidate.

**Hard rules for matching:** real conceptual relevance only; no junk/generic words; candidates only from `litecast/lite-glossary.json`; never the item itself; **first occurrence only**, one link per target.

#### Step 2 — Auto-apply high-confidence matches; ask only for the rest

Hard Rule 14: an unmistakable match is applied and recorded (phrase + context, target, one-line reason); a borderline one is skipped and recorded.

#### Step 3 — Insert links

Insert each applied match on the **first occurrence** of its phrase, with the **same inline link markup/classes the LiteCast body already uses**.

#### Step 4 — Hash & verify

`git diff` of the page shows only the inserted anchors; no link inside an existing link or heading.

**0.6 — LiteCast «کاوش بیشتر» internal links (LiteCast-only; the counterpart of step 4.9).** Fills the page's «کاوش بیشتر» with semantically related **other LiteCast** items only — **no** دانشنامه / فهرست موضوعی capsules, glossary terms or brain entries. Runs after 0.3 and 0.5.

#### Step 1 — Semantic comparison against other LiteCast items

Compare the new item with every other LiteCast entry semantically (Hard Rule 14); rank strongest first; never the item itself.

#### Step 2 — Cap

Hard Rule 9's cap of 5. With no specialist capsules all slots are LiteCast's, but keep the set tight (typically 2–4 strong matches); never pad.

#### Step 3 — Markup

The **same** `dc-related-section` / `dc-related-capsules` / `dc-related-capsule` markup the LiteCast template uses; only `href` (the target LiteCast page) and the label (a short Persian title of the target) differ. **Replace** the cloned specialist capsules with these.

#### Step 4 — Auto-apply high-confidence matches; ask only for the rest

Hard Rule 14: strong relatedness is inserted and recorded (target, URL, label, reason); borderline candidates are skipped and recorded.

#### Step 5 — Hash & verify

`git diff` shows only the capsule swap, and the section holds **only** LiteCast links.

### 1. Template lock & hash

Identify the previous same-category page on disk (if the type has on-disk pages): the structural template. It must stay byte-unchanged; step 4 checks it with `git diff --quiet -- <template>` (module 01, «Evidence of edits»).

### 2. Build the new page

Clone the previous same-category page exactly — identical HTML tree, CSS classes, component order, schema scaffolding. Replace only:
- Body text → the text of record (Question 3.5).
- Meta tags (`<title>`, description, OG, Twitter, canonical) → adapted to the new content.
- JSON-LD field VALUES → adapted; the schema shape stays identical.
- Media sources → from intake.
- All URLs/slugs → the new identifier.
- The hashtag chip row → tags for the new content, never the cloned part's own row. The **one** rule that binds it here is Hard Rule 15: each chip is an **existing** canonical concept of `dentcast-hashtag-reference.json`, found with `python3 tools/hashtag_ref.py --simulate "<phrase>"` and reused verbatim — no fresh spelling, no alias as a tag, and **no mint**. Which concepts, how many and any mint are settled later, by **step 5.0** (module 10), whose final list this row must equal before the brain write; it corrects the row there if it changed. `keywords` live only in the brain entry (step 5) — no page carries them.

**Identity invariant (domain follows the clone).** The clone swaps the **PATH only** and **keeps the domain** — never domain-swap during a clone. LiteCast stays on `https://dentcast.ir` with no hreflang and root-relative links; every other category on `https://dentcast.org` (Hard Rule 10). Confirm the cloned domain survived.

A data-only category (no on-disk page) skips this and goes to step 4. The clone governs **structure only** (Hard Rule 11).

**Google Analytics tag (every page).** The deferred GA4 snippet (measurement ID `G-GMM0WC8X3M`) rides in on the clone; Phase F checks it appears exactly once. If an older template lacks it, run `python3 .github/scripts/inject_ga.py` (idempotent). It is the lazy-loaded pattern (loads `gtag.js` only on `load`) — never swap in Google's default async snippet. The `.org`/`.ir` mirrors share it; no per-domain logic. A future Content-Security-Policy must allow `script-src https://www.googletagmanager.com` and `connect-src https://*.google-analytics.com https://*.analytics.google.com`.

**API preconnect (every page).** The `<head>` opens with `<link rel="preconnect" href="https://api.dentcast.ir" crossorigin>` and the same for `https://api.dentcast.org`, at the very top, once per host. It rides in on the clone; an older template is backfilled with `python3 .github/scripts/inject_preconnect.py` (idempotent; `--check` fails on a page missing it). Never "clean up": **`crossorigin` is required** (the API is called with credentials, and an anonymous connection is not reused for a credentialed CORS request); **both hosts on every page** (the codebases are mirrors, per-domain logic is forbidden); and this is a **paid-sponsor correctness** matter — the Spot card waits for `/me`, so without preconnect the cold DNS+TLS handshake sits in front of the sponsor's impression.

**E-NAMAD seal — never clone it onto a content page.** The trust seal (نماد اعتماد الکترونیکی) lives on exactly three surfaces (`index.html`'s footer, `index.html`'s col-A sidebar row, `about.html`'s contact box). If `.dc-trustseal` markup reaches a content page, remove it. It is **the one deliberate exception to "no per-domain logic"** (issued for `dentcast.ir`, invalid off the `.org` mirror — hence the `dc-no-seal` guard and the `dc-nav.js` removal block): never "fix" that guard, never rewrite the `referrerpolicy`/`id`/`Code`/`code` attributes enamad verifies. Details in `.dentcast/workflows/global/site-invariants.md`.

**Opening paragraph before any list (body-structure requirement).** The body must open with at least one real `<p>` of prose **before** the first `<ul>`/`<ol>`. This is load-bearing for ad placement: the in-article Spot card is positioned by counting **body blocks** (`p, ul, ol, blockquote, figure, table, pre` — headings and `.dc-disclaimer` never count; `spot/README.md`). A body that is a single `<ul>` has **no interior boundary**, so the card drops to the end of the text; an opening paragraph + the list put it in the upper half.

This bites the **Insight** template hardest (`h3` label + `h3` thesis + one `<ul>`), but applies to any page whose body would otherwise be list-only, NoteCast and DentAI included.

Write a genuine 2–4 sentence lead that **adds** something — the clinical situation, the decision at stake, what the reader will get — never a restatement of the `h3` thesis above it. Match the register of the founder's own writing (their vocabulary for the procedure, e.g. «سمان کردن» for cementing a crown) and keep it tight; shorter is safer than padded. It is part of the body: written before C.4.13, so DES and Fidelity score it, and the English mirror carries the same paragraph (module 12).

**This lead paragraph is authored text under standing acceptance (Hard Rule 14).** It is not sent for confirmation. Record its origin in the `first_cut_lead_provenance_v1` decision (`agent_authored`, with the `authored-intro` approval whose evidence is the standing-acceptance record; `author_original` when the founder's own first paragraph already opens the body) — recorded after C.4.13, before C.4.9 (`publish-checkpoints.md`, «Delivery cuts 1 and 2»). The agent's Push-2 report quotes it; the founder may change it afterwards (an approved-page edit, invalidation from C.2).

To check a page you just built:
`node -e` against `spot/spot.js`'s `bodyBlocks()`, or confirm by eye that a paragraph precedes the first list (Phase F checks it). Published pages that fail this are not a pattern to copy forward (Hard Rule 11).
