# DentCast Publishing Router

## Hard rules

1. **Brain is the source of truth.** Every content type's structure, required fields, schema, directory, URL pattern, image/audio/video requirements — all of it is inferable from `dentcast-brain.json`. Read it first.
2. **Categories are isolated.** Never use one category's entry as a template for another. Never borrow another type's schema shape.
3. **New entries go to the absolute END of the flat `dentcast-brain.json` array.** The latest-content widget reads the last 30 entries across all types, so physical tail position is what matters. The brain is a single flat array (no per-type sections) — the new entry becomes the last element of the whole file, regardless of type.
4. **Auto-discover first, ask second.** Only ask the user for things you cannot infer.
5. **Don't invent fields.** A new brain entry must have the same keys as previous same-category entries — no more, no less.
6. **Pillar & subtopic are determined semantically, confirmed by the user, then never silently re-decided.** Both are decided **once, up front** in the semantic determination step (**step 2.4**), *before* any step consumes them — the «کاوش بیشتر»/«محتوای مرتبط» pillar capsule (step 2.5) and the brain write (step 5). `pillar.primary` is chosen by a genuinely **semantic** match between the new content and the **live pillar set** (the pillars listed on `/pillar/` = `list(PILLARS.keys())`); when that pillar is **structured**, `pillar.subtopic` is chosen by a semantic match against that pillar's **own** subtopics. Matching is conceptual — **never** keyword/string matching. Each pick is decided in step 2.4 per **Hard Rule 14**: a clear, unambiguous best match is stated and applied directly, while a genuinely ambiguous case is proposed to the user as named options and only written after their pick (the user may always override or choose none, either way). Once decided and written, the brain write (step 5) and the verify step (step 5.5) **record and verify** the decision — they do NOT re-classify, re-guess, or overwrite it under any circumstance.
7. **Structured-pillar list is live, never hardcoded.** Only some pillars are *structured* — meaning `tools/build_pillar.py` generates a topical-index page for them. The structured set grows over time and MUST be read live from `PILLARS` in `tools/build_pillar.py` on every run. Subtopics are meaningful only for structured pillars; non-structured pillars get no subtopic. Do NOT bake pillar slugs, subtopic slugs, or Persian titles into this workflow. A new subtopic is created only on explicit user confirmation; a new pillar is never created in the determination step (step 2.4).
8. **`main` is authoritative for taxonomy and builders.** The authoritative source for pillars/subtopics — and for the build scripts in general — is always the `main` branch. Before reading `PILLARS` or running any builder, ensure the working state reflects `main` (run from `main`, or merge `main` into the working branch first). Never trust a feature branch's `tools/build_pillar.py` as the taxonomy source of truth.
9. **Hard cap of 5 links per "کاوش بیشتر" section.** Any single "کاوش بیشتر" section may contain **at most 5 links total** — an absolute ceiling counting *every* link of *every* kind in that section together: the nav capsules (دانشنامه + فهرست موضوعی — the دانشنامه capsule is sitewide `/glossary/`, the فهرست موضوعی capsule now points to the entry's **own** pillar `/pillar/<pillar.primary>/`), glossary back-links, semantic brain-entry links — all share **one budget of 5**. There are **no** separate per-type quotas. Before any step adds a link, it must **count the links already present**; if the section already has 5 or more, that step adds nothing and skips; if fewer, it may add only up to `(5 − current count)`, choosing its highest-priority candidates first. Insertion order across steps matters because of the shared budget: the nav capsules (step 2.5) are placed first and consume their slots, and later steps (step 4.7 on glossary pages, step 4.9 on the new page) fill only whatever remains. **Only add within the remaining budget — never remove, reorder, or restyle existing links to make room.** If there's no room, skip. Every step that touches a "کاوش بیشتر" section (2.5, 4.7, 4.9) defers to this single rule.
10. **LiteCast is an isolated track.** LiteCast is non-specialist (general-audience) content governed by its **own** source of truth (`litecast/lite-glossary.json`, not `dentcast-brain.json`) and its **own** internal link structure. It is deliberately kept **separate** from the *specialist* ecosystem and must **not** be cross-linked with it in either direction — but it **does** link **among its own items**: a LiteCast page's **«کاوش بیشتر»** section is populated **only** with links to other LiteCast entries (never the site-wide دانشنامه / فهرست موضوعی capsules, never glossary terms, never brain entries). When the locked category is LiteCast, the Phase C **step 0 branch** overrides the corresponding general steps (it skips the site-wide *specialist* capsules and all specialist cross-linking, fills «کاوش بیشتر» with LiteCast-internal links per **step 0.6**, and writes the entry to `litecast/lite-glossary.json` only). See Phase C step 0. **LiteCast also has its own single-domain identity:** every LiteCast page lives on `https://dentcast.ir` — full `.ir` profile (canonical, `og:url`, JSON-LD `/litecast/` values), with **NO hreflang** and **root-relative** internal links — whereas every other category stays on `https://dentcast.org`. New pages inherit this by cloning the previous LiteCast page (domain kept, path swapped — see Phase C step 2's identity invariant), and `.github/scripts/inject_hreflang.py` enforces the hreflang-absence by skipping `.ir`-canonical pages.

11. **Enrichment steps (4.7, 4.8, 4.9) are MANDATORY and template-independent — they run on every publish, for every type, and "skip" is not a default.** These three semantic-linking steps are *not* optional, *not* conditional on the template, and *not* satisfied by the clone. Specifically:
    - **They run on EVERY publish, for EVERY type — core episodes included.** A publish is **incomplete** until each of 4.7, 4.8, and 4.9 has been **explicitly resolved** and reported. "I didn't get to it" is a protocol violation.
    - **The step-2 clone and any "same-category precedent" govern STRUCTURE ONLY — never enrichment.** What the previous same-category page (or a sibling in the same series) happened to contain has **zero** bearing on whether 4.7/4.8/4.9 run. *"The previous/cloned page had no inline links / only the pillar capsule, so I'll match it"* is an **explicitly forbidden** justification. If earlier pages lack these links, that is a **gap to fix on this publish**, never a pattern to copy forward. Any inline or related link that merely survived the clone does **not** count as having executed 4.8/4.9 — those steps require a fresh semantic analysis on this content.
    - **"Auto-apply or ask" ≠ "skip".** 4.8, 4.9, and 4.7 always require you to *run the semantic analysis*. Per **Hard Rule 14**, a high-confidence candidate (the matched concept is unmistakably the one being discussed) gets inserted directly and reported; a borderline or ambiguous candidate gets surfaced to the user as an explicit link/skip option. Either way, doing nothing without having run the analysis, or discarding a genuine candidate without reporting it, is never allowed.
    - **The only valid no-op is a documented empty result.** A step may add nothing **only** when you actually performed the analysis and there were **zero genuinely-qualifying candidates** (or the section is at the 5-link cap). You must then **say so explicitly** in the report ("4.8: analyzed body, 0 qualifying glossary/episode candidates" / "4.9: section at cap, skipped"). Silence is not an allowed state.
    - **Type mapping for core episodes (no on-disk `dc-related-section`).** Episodes use the **«محتوای مرتبط»** block (`ep-related-link`), not a `dc-related-section` «کاوش بیشتر». For episodes, **step 4.9 targets the «محتوای مرتبط» block** (fill its free slots, under the Hard-Rule-9 cap, with semantically related brain entries — e.g. sibling parts of a multi-part series first), and **step 4.8 targets the «درباره این اپیزود» caption body**. The naming difference is **not** an excuse to skip; the «محتوای مرتبط» block IS the episode's related-links section for 4.9 purposes.

12. **Every published page ships bilingual: the English mirror + fa↔en toggle is MANDATORY (Phase D), never an afterthought.** A `.org` publish is **incomplete** until the new page has a real English counterpart at `/{type}/en/{same-filename}.html` and a working **per-document fa↔en language toggle on both sides**. The toggle button (`.lang-btn`) is **never** added alone: a toggle whose English target does not exist on disk is a forbidden phantom pair (the `inject_hreflang.py` machinery drops it), so the en page MUST be created in the same publish. This is produced by running the **English-version workflow** (`.dentcast/workflows/en-version.md`) on the just-published page as the final phase — see **Phase D**. "The cloned template had no toggle, so I matched it" is an **explicitly forbidden** justification (same spirit as Hard Rule 11): if earlier same-type pages lack the toggle/en mirror, that is a gap, never a pattern to copy forward. **The single exception is LiteCast**, which is `.ir`-only, carries **no** hreflang, and gets **no** en mirror or toggle (Hard Rule 10) — for LiteCast, Phase D is a documented skip.

13. **Never guess — this generalizes every scattered "ask, don't guess" note elsewhere in this document into one binding rule that applies to the whole workflow, not just the paper branch.** If a fact is not (a) directly stated by the user, (b) verifiable by reading a file already in the repo, (c) verifiable by reading the live taxonomy at runtime, or (d) successfully fetched/probed from a real source (the audio file itself, a DOI lookup, a Drive listing) — **you do not know it, and you may not estimate, infer, round, or fabricate a stand-in value for it.** Stop and ask the user instead. Zero exceptions:
    - **Numeric/factual metadata — duration, file size, dates, counts, IDs — is never estimated.** If the audio host is unreachable (network policy block, missing tool, timeout, anything else) and the duration can't be probed, **ask the user for the exact duration.** Do not write a "reasonable-sounding" placeholder into the brain, `dentcast.json`, the page's visible time, or its JSON-LD `duration` — not even temporarily, not even flagged as an estimate in a later report. A wrong number silently shipped to a live page is exactly the failure this rule exists to prevent.
    - **Titles, hashtags, keywords, and short labels the user did not explicitly supply are proposals, not facts.** Present them and get confirmation before writing them anywhere (brain entry, page `<h1>`, meta tags, en-mirror title). Composing a title from a caption, or reusing another page's title/terminology as a stand-in, is a draft to show the user — not a decision to ship silently.
    - **Schema-shape choices that affect site behavior must be asked about, not resolved by picking whichever precedent seems closer.** When more than one precedent could plausibly govern a new entry's field set (e.g. an older sub-episode's shape vs. the parent series' current shape), ask which one applies — a wrong pick here can silently break downstream automation that keys off specific fields (e.g. the homepage hero/latest-content script keys off `type` and `audio_url`; an entry missing them never surfaces there, with no error raised anywhere).
    - **Steps 4.7/4.8/4.9 still MUST run their semantic analysis every time** — a standing instruction to proceed autonomously never authorizes skipping the analysis itself or fabricating a match. What changed under Hard Rule 14 is only whether a *high-confidence result* of that analysis needs a stop-and-ask round-trip before being applied — see Hard Rule 14 for exactly when that round-trip is required vs. waived.
    - **Disclosing an assumption after the fact, in a final report, is not a substitute for asking first.** By the time a report discloses a guess, the page is already live with unconfirmed data. Ask **before** writing, not after. (This is about genuinely unknown/unknowable facts — Hard Rule 14 governs the separate case of a confident judgment call, which is reported, not asked.)

14. **Confidence-gated confirmation — auto-apply what you're genuinely sure of; ask with concrete options for what you're not.** This rule narrows *when* a proposal needs a stop-and-ask round-trip; it never narrows Hard Rule 13's ban on fabricating unknowable facts. Two different situations recur throughout this workflow, and they are handled differently:
    - **Unknowable/unverifiable facts stay under Hard Rule 13, always ask, no exceptions.** Durations, file sizes, dates, counts, IDs, DOIs, first authors, and any title/hashtag/keyword/label the user did not explicitly supply are never auto-applied regardless of how "obvious" they seem — confidence is not the test there, derivability is. Nothing in this rule changes that.
    - **Judgment calls get auto-applied when confidence is genuinely high.** This covers: the auto-discovered next sequence number when there is no gap in the series; the pillar/subtopic pick when exactly one pillar/subtopic is a clear conceptual fit and no other pillar is plausibly competitive; a Pulse sentence that follows the same-type precedent's established phrasing pattern; a glossary-term or brain-entry link where the matched word/phrase unmistakably refers to that exact concept in context; and the writing-style pass finding no genuine AI-tell. In each of these, proceed directly — do not stop for a rubber-stamp — and state the decision plainly in the running commentary and the final summary so the user can see and override it after the fact if they disagree.
    - **Genuine uncertainty still stops and asks — but as a short menu, not an open question.** Multiple plausible pillars/subtopics, a borderline or tangential enrichment candidate, a gap or irregularity in the number sequence, two precedents that could each govern a schema shape, or any other spot where a wrong pick would need to be walked back — stop and ask. Phrase it as a small set of concrete, named options (the candidate pillars, "link it / skip it", the competing precedents) rather than a free-form question, so confirming is a single pick. Fall back to open-ended phrasing only when the options genuinely can't be enumerated (e.g. "what should the Pulse sentence say" when no usable convention exists yet).
    - **Reporting is not optional either way.** Whether a call was auto-applied or asked-and-confirmed, the final summary must say which happened and why, exactly as today — auto-applied items are not silent just because they skipped the question.

## Phase 0 — Routing: is there an attached paper file? is there text to publish?

Before anything else, classify what the user handed you along two independent axes:

- **Is there text/content to publish?** (a متن for a page)
- **Is there an attached research paper/article file?** (a PDF or similar)

The **attached-paper actions are triggered by the paper file itself — independent
of content type.** They are **not** tied to DentAI; whenever a paper file is
present, the paper branch (**Phase C step 4.10**) fires, whatever the locked
category is (or even when there is no category at all). Route as follows:

| Text to publish? | Paper file attached? | What runs |
|---|---|---|
| **Yes** | **No** | Normal publish only (Phases A–D). No paper branch. |
| **Yes** | **Yes** | Normal publish for that type (any type — **not just DentAI**) **plus** step 4.10's **all three parts** (Drive filing + catalog enrichment + first-author→DOI credit on the published page). |
| **No** | **Yes** | **Paper-only fast path** — do **NOT** run the publishing phases (no page clone, no brain entry, no pillar, no Pulse, no en mirror, no rebuild). Run **only step 4.10 Part 1 (Drive) and Part 2 (catalog)**. **Skip Part 3** — there is no published page to put a credit under. Then commit. |
| **No** | **No** | Nothing to do — ask the user what they want. |

**Paper-only fast path (text-less) detail.** When the user gives you just a paper
file with no متن: jump straight to **step 4.10**, run **Parts 1 & 2 only**, and
stop. The cabinet catalog (`dentcast_cabinet_full_catalog.json`) is read
client-side by `dentcast_cabinet_search.html` via `fetch`, and it is **not** part
of the site version hash (step 7), so a paper-only addition needs **no** builder
run and **no** version bump — Drive upload + catalog edit + commit is the whole job.

When there **is** text, proceed through Phases A–D as usual; the paper branch (if a
file is attached) runs as step 4.10 inside Phase C.

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
5. Read the **live structured-pillar set** at runtime — never from memory and never from a list written into this workflow. Authoritative source: the `PILLARS` dict in `tools/build_pillar.py`. Its keys are the slugs of the pillars that get a built topical-index page, and `PILLARS[slug]['subtopics']` is the live subtopic list for each. Re-derive on every run so newly structured pillars are picked up automatically. A practical one-liner: `python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"`. The entry's pillar (`pillar.primary`) and — when that pillar is structured — its `subtopic` are decided up front in the semantic determination step (**step 2.4**), *before* the page capsules (step 2.5) and the brain write (step 5) consume them.

## Phase B — Intake

### Question 1 — Type

Ask:

> این مطلب کدوم نوعه؟ (لیست نوع‌هایی که از brain پیدا کردی رو نشون بده)

Wait. Lock the chosen category for the rest of the run.

### Question 2 — Number / identifier

Try to determine the next number automatically (max existing number in this category + 1). Per **Hard Rule 14**: if the series has no gaps and the next number is unambiguous, state it directly (e.g. «شماره‌اش meta-16 است») and move on — no need to wait for a yes. Only ask when the numbering is irregular or ambiguous (a gap in the sequence, a sub-numbered entry, two plausible next values), and phrase it as the specific candidates to pick from:

> شماره‌اش [N] درسته یا [alternative]؟

If user disagrees, accept their number.

### Question 3 — Text

Ask:

> متن کامل رو بفرست.

Wait for it.

### Question 3.5 — Writing-style check (de-AI pass)

**Runs for EVERY type, on EVERY publish, on whatever متن was just received in Question 3 — before any other step.** This gate happens before Phase C (and before Question 4 onward) consumes the text, because if changes are approved, the **edited** text — not the raw submission — is what every downstream step (page build, glossary linking, Pulse, etc.) works from.

**Goal:** read the submitted متن the way an editor would, and flag the spots that read as AI-generated rather than human-written — phrasing/rhythm/word-choice only, **never** facts, claims, numbers, or meaning.

#### Step 1 — Scan for AI tells

Look for patterns like (non-exhaustive — judge by ear, not by a checklist):
- **Formulaic throat-clearing openers/closers** — generic preambles or wrap-up sentences that restate what was just said («در نتیجه می‌توان گفت که...», «به طور کلی...»).
- **Overused AI clichés** — stock phrases such as «بدون شک», «نکته قابل توجه این است که», «در دنیای امروز», «نقش بسزایی دارد», «از اهمیت ویژه‌ای برخوردار است».
- **False-balance hedge stacking** — reflexive «نه‌تنها... بلکه...», «از یک سو... از سوی دیگر...» used as filler rather than because a real contrast exists.
- **Mechanical parallelism / listy prose** — three-item lists or rule-of-three constructions inserted by reflex, or prose chopped into bullet-like sentence fragments where a human would just write a sentence.
- **Uniform sentence rhythm** — every sentence near-identical in length/structure, lacking the natural variation a human writer has.
- **Generic filler with no concrete content** — sentences that sound authoritative but say nothing specific to this topic.
- **Over-punctuated emphasis** — excessive em-dashes, bolding, or exclamation used as a substitute for a real point.

#### Step 2 — Identify and announce, don't edit yet

For each genuine instance found, prepare: the exact original phrase/sentence, a proposed rewrite that keeps the **same meaning, facts, and register** but reads naturally, and a one-line reason it tripped the check. Present the full list to the user as a numbered review **before touching the text** — this is a proposal, not an edit.

If the متن has **no** genuine AI tells, say so explicitly («متن طبیعی به نظر می‌رسه، تغییری لازم نیست») and proceed straight to Question 4 with the text unchanged.

#### Step 3 — Confirm, then branch

Ask the user to confirm. The user may approve all, a subset, or none.

- **Approved (all or a subset):** apply only the approved rewrites to the متن. The resulting edited text becomes the text of record for the rest of this publish (Phase C step 2 and everything downstream uses it).
- **Not approved / rejected:** make no changes — continue with the original متن exactly as submitted. Proceed to Question 4.

#### Constraints

- **Style and phrasing only.** Never alter clinical claims, data, numbers, names, citations, or meaning. If a flagged sentence can't be rewritten without touching its substance, drop it from the list rather than risk changing meaning.
- **No new content.** Rewrites tighten or naturalize existing sentences — they don't add claims, examples, or sections that weren't in the original.
- **One pass.** This runs once, here, on the as-submitted متن — it is not repeated later in the same publish.

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

### Question 4.7 — Any type: is there an accompanying article (paper) file?

**Runs for EVERY type, not just DentAI** (Phase 0 routing). The attached-paper
actions key off the **paper file**, not the content category — so check this on
every publish regardless of the locked category.

When the user supplies the content **together with a research paper/article file**
(a PDF or similar attachment), the publish gains **three extra, additive actions**
beyond the normal flow — Drive filing, cabinet-catalog enrichment, and a
first-author→DOI credit on the published page. These are specified in **Phase C
step 4.10**.

- If the user attached a paper file → set the **attached-paper branch (step 4.10)
  ACTIVE** and keep the file (and its real filename) for that step.
- If no paper file accompanies this publish → the branch is a documented **skip**;
  the page publishes normally with no Drive/catalog/DOI actions.
- If you're unsure whether a file was provided, **ask** — don't assume either way.

This branch is **additive**: it never replaces or overrides any general step. The
normal publish for the locked type (clone, pillar, brain entry, enrichment, Pulse,
en mirror) runs in full; step 4.10 only adds the three paper-specific actions.
(For a paper file with **no** متن at all, see the **paper-only fast path** in
Phase 0 — Parts 1 & 2 only, no publish.)

### Question 5 — Pulse sentence

Per **Hard Rule 14**: if this category has an established Pulse phrasing convention (previous entries of this type follow a consistent pattern), draft the sentence yourself in that pattern — including which word gets hyperlinked — and state it directly rather than asking an open question; the hyperlink target is the new content's page URL in its own category's directory. Report the drafted line plainly so the user can correct it if they want something different.

Only ask when there is genuine ambiguity — no established convention to follow, or the category's Pulse phrasing varies enough that a pick isn't obvious:

> جمله‌ی پالس چی باشه و کدوم کلمه‌ش لینک بشه؟

If for some category Pulse announcements aren't customary (you can tell by checking if previous Pulse entries reference that category), draft a line anyway but flag it: «این نوع معمولاً تو پالس اعلان نمی‌شه — همین‌طوری درج کنم یا رد شم؟» (a yes/no option, not an open question).

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

### 4.10. Attached-paper branch (ANY type — triggered by the paper file, not the category)

**Runs whenever the user supplied an accompanying research paper/article file —
for EVERY type, not just DentAI** (the branch armed in Phase B Question 4.7; the
trigger keys off the **file**, not the locked category). For publishes with **no**
paper file, skip this entire section and **say so in the report** ("4.10: skipped
— no attached paper"). This branch is **additive** — it adds the paper actions on
top of whatever normal publish is running and overrides nothing.

**Which parts run depends on whether a page is being published (Phase 0 routing):**
- **Paper file + text/content (any type):** run **all three parts** — Parts 1 & 2
  (Drive + catalog) and Part 3 (first-author→DOI credit on the published page).
- **Paper file only, no text (paper-only fast path):** run **Parts 1 & 2 only**.
  **Skip Part 3** — there is no published page to put a credit under — and skip the
  rest of the normal publish flow entirely (see Phase 0). Report "Part 3: skipped —
  no published page (paper-only)".

**Overarching rule for this whole branch — ASK, don't guess (the user's
explicit instruction «اگر جایی شک داشتی سوال کن عمل نکن»).** Anywhere in the
parts below where you are not confident — the right Drive subfolder, the correct
topic/tags, the paper's real title, its DOI, or its first author — **stop and ask
the user before acting.** Never invent a subfolder, a DOI, an author, or a tag. A
wrong guess here mis-files a paper and publishes a false citation; a question
costs nothing.

Parts 1 and 2 are data operations (Drive + catalog) and **always** run when a
paper file is present. Part 3 mutates the published page and runs **only when
there is a page** (text-bearing publish). Run them in order; when a page exists,
all three run before the rebuild (step 8).

#### Part 1 — File the paper into Google Drive (correct topical subfolder)

The DentCast paper cabinet lives in this Drive folder:
`https://drive.google.com/drive/folders/1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f`
(folder id `1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f`). It is organised into **topical
subfolders** whose names mirror the `topic_path` values already in
`dentcast_cabinet_full_catalog.json` (e.g. `abutment`, `zirconia`, `fresh
socket`, `GBR`, `periimplantitis`, `biomimetic`, with nested paths like
`biomimetic/Bonding`, `zirconia/flexural strength`, …).

1. **Read the live subfolder set.** Use the Google Drive MCP tools to list the
   subfolders actually present under the parent folder (don't trust this list —
   it's illustrative). Cross-reference with the distinct `topic_path` values in
   the catalog so you know the canonical filing taxonomy.
2. **Determine the paper's subject semantically** — conceptual relevance of the
   paper's actual topic, **never** keyword/string matching on the filename — and
   choose the single best-matching existing subfolder.
3. **Upload the file into that subfolder.** Keep the paper's real filename.
   Capture the resulting Drive identifiers for Part 2:
   - `drive_id` = the uploaded file's id
   - `drive_view` = `https://drive.google.com/file/d/<drive_id>/view`
   - `drive_download` = `https://drive.google.com/uc?export=download&id=<drive_id>`
4. **Ambiguity → ASK.** If no existing subfolder clearly fits, or two fit
   equally, **ask the user** which subfolder to use (or whether to create a new
   one). **Never create a new subfolder without explicit confirmation.**

#### Part 2 — Enrich `dentcast_cabinet_full_catalog.json` (root)

`dentcast_cabinet_full_catalog.json` at the repo root is a JSON **object** whose
`papers` key holds a flat array of paper entries. Add the new paper here.

1. **Next id.** `P` + the zero-padded successor of the current max `P####`
   (e.g. after `P2876` → `P2877`). Confirm the max by scanning `papers`.
2. **Match the ENRICHED entry shape exactly.** Use a recent
   `semantic_tagged: true` entry as the schema template — same keys, nesting,
   and order, no extras, no omissions. Its key set is: `id`, `title`,
   `file_name`, `topic`, `topic_path`, `type`, `local_path`, `file_size`,
   `key_finding`, `clinical_bottom_line`, `linked_episodes`, `drive_link`,
   `status`, `drive_download`, `drive_view`, `drive_id`, `tags`, `name_bucket`,
   `semantic_tagged`, `real_title`, `doi`, `journal`, `crossref_year`,
   `subjects`, `abstract`, `display_title`. **Confirm the live shape from the
   file rather than trusting this list**, and never add a field that isn't on
   the template entry.
3. **Fill from the paper + the DOI lookup (Part 3 finds the DOI/metadata):**
   - `real_title` / `title` / `display_title` → the paper's real title (the
     search page `dentcast_cabinet_search.html` shows
     `display_title || real_title || title`).
   - `topic` and `topic_path` → the subfolder chosen in Part 1 (the search
     page's topic filter reads `topic`).
   - `doi`, `journal`, `crossref_year`, `abstract` → from the metadata lookup.
   - `file_name` → the real filename; `file_size` → the file's byte size.
   - **`drive_link` / `drive_view` / `drive_download` / `drive_id` → the Drive
     URLs/id captured in Part 1.** (Putting the paper's Drive link into the JSON
     is the whole point of this part.)
   - `status` → match the template (e.g. `"linked"`); `semantic_tagged` → `true`.
   - `linked_episodes` → the page being published, if any (follow the template's
     value shape); on the **paper-only fast path** there is no page, so leave it
     as the template's empty shape (e.g. `[]`). `key_finding` /
     `clinical_bottom_line` may stay `""` as on most entries unless the content
     gives them clearly.
4. **Hashtags (`tags`) — the user's rule: semantic + the article's own name.**
   Generate genuinely **semantic** tags describing the paper's concepts, in the
   **same lowercase-kebab style as existing `tags`** (e.g. `marginal-bone-loss`,
   `rct`, `clinical-trial`), **include the `topic:<subfolder>` tag** that the
   catalog convention uses, **and include a tag derived from the article's own
   title/name.** No junk/generic tags. If the right topic or any tag is unclear
   → **ask, don't guess.**
5. **Top-level counters.** If the catalog's roll-up integers are meant to track
   the array (`unique_papers`, `total_files_scanned`, the relevant drive-match
   count), keep them consistent with the added entry. Do **not** rewrite the
   derived analytics blocks (`tag_index`, `semantic_pass`, `enrichment`,
   `drive_match_breakdown`) by hand — if you're unsure whether a counter should
   move, **ask** rather than guess.
6. **Verify:** the new entry is appended to `papers`, the JSON is well-formed,
   its key set matches the template enriched entry exactly, the Drive link is
   present, and the paper now appears/filters correctly in
   `dentcast_cabinet_search.html` (title, topic, tags, View/Download links).

#### Part 3 — Find the DOI on the web and add a first-author → DOI credit on the page (ShareHub style)

**Runs only when a page is being published** (text-bearing publish, any type). On
the **paper-only fast path** there is no page — skip this part entirely and report
the skip. This is the on-page action and mirrors how **ShareHub** credits its
source: a `.author` block reading «نویسنده:» followed by a single hyperlinked
name. Here the linked name is the **paper's first author** and the link target is
the **DOI**.

1. **Find the DOI + first author on the web.** Search the net for the paper's
   **DOI** and its **first author** — use `WebSearch` and/or the article-lookup
   MCP tools (`search_articles`, `lookup_article_by_citation`,
   `get_article_metadata`, `convert_article_ids`). Cross-check the DOI resolves
   to the correct paper (matching title/journal/year). **If you cannot confidently
   determine the DOI or the first author, ASK the user — never fabricate either.**
   The DOI/journal/year found here also feed Part 2's catalog fields.
2. **Add the credit under the article body.** On the published page (whatever its
   type), **below the article body**, add a source-credit block crediting the
   paper's first author, where the **first author's name is an anchor to the DOI**:
   ```html
   <div class="author">
     نویسنده:
     <a href="https://doi.org/<doi>" target="_blank" rel="noopener noreferrer">First Author</a>
   </div>
   ```
   - Use the **same markup/style precedent the page's own type already uses** for
     a source credit. DentAI, for instance, has a source-citation precedent (e.g.
     `dentai/dentai-3.html`: a citation card with the paper title, authors,
     journal, and DOI, plus a JSON-LD `isBasedOn` → `doi.org` reference). If such a
     citation card is present on the page, **enhance it** by making the **first
     author** a real `<a href="https://doi.org/<doi>">` link (ShareHub style)
     rather than adding a visually duplicate block; if no such block exists, add
     the ShareHub-style `.author` credit above, and ensure its `.author` CSS exists
     in the page (it does on ShareHub-derived pages; add it if the type's template
     lacks it).
   - **This is the SOURCE paper's author** — do **not** confuse it with, or
     overwrite, any existing site author credit (e.g. DentCast's `.author-note`,
     دکتر فواد شهابیان, the narrator/site author). The two coexist.
3. **Keep JSON-LD consistent.** If the page's template carries an `isBasedOn`
   (CreativeWork) reference, set its `url` to `https://doi.org/<doi>` and its
   `name` to the paper title — matching the `dentai-3` precedent.
4. **Hash the new page before and after Part 3.** The only allowed diffs are the
   first-author→DOI credit (and any `isBasedOn` value update). Report before/after
   hashes. Don't break HTML (no link inside an existing link or heading).

**Verify after the branch:** report the Drive subfolder the paper landed in (and
its `drive_view` URL); the new catalog entry's `id`, `topic`/`topic_path`,
`tags`, and Drive link; and — when a page was published — the DOI + first author
used for the on-page credit (with the rendered anchor), or the "Part 3 skipped —
paper-only" note otherwise. Explicitly flag anything you had to ask the user
about, and confirm nothing was guessed.

### 4.11. Flashcards (Leitner) — semantic `DefinedTermSet` on the page itself

**Runs for EVERY type, on EVERY publish that produces a page — LiteCast is the
sole exception** (LiteCast stays outside the specialist ecosystem, same as the
glossary/pillar linking it skips in step 0). A flashcard is **a concept, not a
question** — so it lives in schema.org's real vocabulary for exactly that:
`DefinedTermSet` → `hasDefinedTerm[]` of `DefinedTerm { name, description }`.
This block is added to the **new page's own JSON-LD**, the same way the FAQPage
block already lives on the page — **not** a separate hand-maintained file.
`plus/flashcards-index.json` (the premium app's Leitner-seed catalog) is
**generated**, never edited directly: run
`node tools/build_flashcards_index.mjs` (added to step 8's rebuild list) to
scan every page's `DefinedTermSet` and regenerate it. **This step never
touches `dentcast-brain.json`** — Hard Rule 6 (brain schema is sacred; never
add a field absent from the previous same-category entry) makes the brain the
wrong home for a feature being rolled out prospectively while older entries
wait for a later, separate backfill pass.

**Card content must be semantic, never a mechanical FAQ dump.** Each
`DefinedTerm` tests recall of **one concept**: `name` is a tight recall
prompt, `description` is the complete, precise answer to that one concept —
never a verbatim copy of a FAQ question/answer pair.

**FAQ → flashcard compression, but judged, not mechanical.** Where this page
already carries a FAQPage entry, walk its `mainEntity` and classify each
Q/A pair:
- **Genuinely "define/explain X" shaped** (the question names one concept,
  the answer explains it) → compress it into one `DefinedTerm`: rewrite the
  question into a `name` recall prompt, rewrite the answer into a complete
  `description` for that one concept. If the answer bundles more than one
  concept, split it into multiple atomic terms instead of one crowded one.
- **Comparison/decision/procedural shaped** (e.g. "ایمپلنت کوتاه یا سینوس
  لیفت؟", "کدوم بهتره؟") — these have no single concept to define. **Skip
  them** rather than forcing a card; note the skip in the report.
- **Ambiguous cases** — ask the user rather than guessing which bucket a Q/A
  pair falls into.

Where no FAQ exists yet, author `DefinedTerm`s directly from the published
body using the same atomicity rule.

**Ask, don't guess — same standard as step 4.10's paper branch.** Anywhere
you're not confident a candidate concept is genuinely atomic, clinically
accurate, or worth a card at all, stop and present it to the user rather than
forcing a term into existence. A thin or fabricated card is worse than no
card.

Markup (placed alongside the page's existing JSON-LD block(s), same pattern
as the FAQPage `@id` convention already in use, e.g.
`https://dentcast.org/insight/insight-12.html#faq`):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "@id": "https://dentcast.org/insight/insight-12.html#flashcards",
  "hasDefinedTerm": [
    {
      "@type": "DefinedTerm",
      "@id": "https://dentcast.org/insight/insight-12.html#flashcards-c1",
      "name": "single-concept recall prompt",
      "description": "complete, precise answer to that one concept",
      "source": "faq",
      "sourceFaqIndex": 2
    }
  ]
}
</script>
```

- `@id` on each `DefinedTerm` ends in `#flashcards-c<n>`, 1-indexed per page,
  stable once published — a later wording fix must not renumber existing ids
  (the backend's `card_state` rows key off the fragment).
- `source` and `sourceFaqIndex` are non-standard but harmless extra
  properties (ignored by anything reading strict schema.org): `source` is
  `"faq"` or `"authored"`; `sourceFaqIndex` is present **only** when `source`
  is `"faq"`, pointing at the FAQPage `mainEntity` index the term was derived
  from, for traceability if that FAQ entry changes later.
- No other properties beyond real `DefinedTerm`/`DefinedTermSet` fields plus
  these two. Match this shape exactly on every future publish — this is now
  the schema template.

**Verify:** confirm the `DefinedTermSet` block is present and valid JSON-LD;
that every `DefinedTerm` has a unique `@id`; that no `name`/`description` is a
verbatim copy of a FAQ Q/A pair; and report the count of terms written, how
many came from `faq` vs `authored`, and which FAQ entries (if any) were
judged comparison/decision-shaped and skipped.

### 4.12. Quiz-ready FAQ + scored binary bank

**Runs for EVERY type, on EVERY publish that produces a page — LiteCast is the
sole exception** (same scope as flashcards: LiteCast is patient-facing and
stays out of the specialist quiz/flashcard ecosystem). The FAQPage block that
rides on the page (from the clone + this content's own Q/A) feeds two premium
surfaces — the Leitner flashcards (step 4.11) **and** a scored yes/no quiz
(`plus/quiz-index.json`, awarding premium XP). Both consume the page's FAQ, so
FAQ questions must be authored to a **standalone-quiz standard**, not written
as page-bound reading aids. Two hard requirements on every FAQ Question:

**(a) Self-contained — no article deixis.** Each question must be
understandable and answerable by a dentist who read the article a month ago and
remembers only the concept, not which article it was. **Forbidden in a
question `name`:** «این کیس», «این بیمار», «این مطالعه», «این متن», «این
ویدیو», «این تکنیک/روش/وضعیت/تصمیم/خطا», or any other reference that only
resolves by seeing this specific page. Case-based content (chairside, insight
case-studies, dentcast-plus videos) must embed the case's key conditions **into
the question itself** — turn «چرا MTA برای این کیس انتخاب شد؟» into «در تحلیلِ
خارجیِ سرویکالِ (ECR) پیشرفته، چرا MTA ماده‌ی مناسبی برای ترمیم است؟». A
question that is pure narrative recall of one unnamed patient («تصمیمِ نهایی
برای این بیمار چه بود؟») with no concept to generalize does not belong in the
FAQ at all — don't author it. The answer stays 100% grounded in the body;
never add a clinical claim the article doesn't make.

**(b) Binary answers open with an explicit verdict.** `tools/build_quiz_index.mjs`
selects the yes/no subset mechanically: a question qualifies only when it is
phrased as a yes/no question (opens with «آیا»/«مگر», or ends «… درست است؟» /
«… امکان دارد؟» etc.) **and** its answer's **first clause** states «بله» or
«خیر»/«نه». So whenever a FAQ question is yes/no-shaped, **write the answer to
open with the verdict** — «خیر؛ …», «بله، …», or a short concession then the
verdict («برخلافِ باورِ قدیمی، خیر؛ …»). That one word becomes the graded
answer key. If the honest answer is genuinely "it depends" (no clean yes/no),
that's fine — write it hedged and it is correctly **excluded** from the scored
bank (it still serves as a flashcard / SEO FAQ). Never contort a real "it
depends" into a false yes/no just to get it scored: accuracy over coverage,
the bank must never grade against a guessed key.

The builder is generated-only, run in step 8 (never hand-edit
`plus/quiz-index.json`); its `content_id` is the page path without `.html`, and
each question keeps its `source_faq_index` so a later FAQ edit is traceable to
its quiz entry — the same identifier convention as flashcards, so the premium
app maps "reader finished article X" → X's quiz questions and flashcards alike.

**When to run — and fix, not just flag.** This is an authoring gate, not a
report-only check: it runs on the FAQ **before** the page is finalized (right
after the step-2 clone swaps the FAQ values in, alongside the step-4.11
flashcard pass which reads the same FAQ). Walk every `mainEntity` question and
**bring it into compliance in place** — a cloned/adapted question that still
carries deixis (per (a)) gets **rewritten standalone or removed here**, and a
yes/no-shaped question whose answer buries or omits the verdict gets its answer
**reopened with «بله»/«خیر» (per (b))** — so the published page is already
correct and never needs a later correction pass. Editing is confined to the
FAQPage JSON-LD block; the answer stays grounded in the body.

**Ask, don't guess — same standard as steps 4.10/4.11.** Where a call is
genuinely borderline, stop and ask the user rather than deciding silently:
whether a case-bound question can be rewritten into a self-contained vignette
**or** should be dropped entirely; whether an answer is truly a clean yes/no
**or** an honest "it depends" (so it should stay hedged and fall out of the
scored bank); or whether embedding the case conditions would smuggle in a claim
the body doesn't actually make. A wrong auto-decision here ships a
misleading quiz key or an unanswerable question — exactly the outcomes worth a
one-line question to prevent. Phrase it as a concrete rewrite-vs-drop choice,
not an open question.

**Verify:** after step 8's quiz build, report how many binary questions this
page contributed (and, if zero, confirm its FAQ is intentionally all
open/comparison-shaped); confirm no question `name` on the page contains a
deictic reference per (a); and list any question you rewrote/dropped for
compliance and anything you asked the user about.

### 5. Brain entry

`dentcast-brain.json` is a **single flat array of all entries — there are no per-type sections.** Read it. Find the most recent entry of the LOCKED category and use it as the **schema template**.

**Schema templating stays category-locked, even though physical placement does not.** Match the locked category by its `type` field — or, for the core podcast episodes, by the **absence of a `type` field** (the 202 episode entries have no `type` key at all). Don't confuse "where to put it" (end of the whole array) with "what shape to give it" (the most recent same-category entry).

Build the new entry with **identical keys, nesting, and ordering** as the previous same-category entry. Fill all fields based on new content + today's date + new URL — including the entire `pillar` object, using the values **confirmed in step 2.4**: `pillar.primary` (the confirmed pillar slug, or `null` if the user chose no pillar), `pillar.secondary` (matches previous entries' shape — usually `[]`), and `pillar.subtopic` (the confirmed subtopic slug for a structured pillar, otherwise `null`). The `subtopic` key is **always present** under `pillar` (that is the brain's convention — never omit it). Do **not** re-decide the pillar or subtopic here — just record exactly what step 2.4 confirmed; step 5.5 then verifies it.

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

### 5.5. Verify the recorded pillar & subtopic

The pillar and subtopic were **decided and confirmed in step 2.4** and **written into the brain entry in step 5**. This step only **verifies** them — it does **not** re-classify, re-guess, or overwrite anything (Hard Rule 6). Read the live `PILLARS` taxonomy (from a state that reflects `main`, per Hard Rule 8) to check the invariants:

```bash
python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"
```

Re-read the brain entry and confirm:
- `pillar.primary` is **identical** to the slug the user confirmed in step 2.4 (or `null` if they chose no pillar) — exact spelling/format, no normalization.
- `pillar.subtopic` is either a valid subtopic slug for `pillar.primary` in the live `PILLARS` taxonomy (when the pillar is structured) or `null` (when the pillar is not structured, or no pillar was assigned) — and the `subtopic` key is **present** in every case.
- The `pillar` object has **no extra keys** beyond the previous same-category entry's shape (no `pillar_reasoning`, no `subtopic_reasoning`, no notes), and the entry's overall key set is unchanged from end-of-step-5.
- If a **new** subtopic was confirmed in step 2.4, confirm it was added to `PILLARS[primary]['subtopics']` in `tools/build_pillar.py` (sibling shape copied exactly) and that the brain entry uses that exact new slug.
- The فهرست موضوعی capsule injected in step 2.5 (or the episode pillar link) points to `/pillar/<pillar.primary>/` consistent with this confirmed `pillar.primary` (or to the `/pillar/` fallback when it is `null`).

### 5.6. Learning-pathway placement (all specialist types)

**MANDATORY on every publish that wrote a specialist brain entry** (i.e. every
type **except LiteCast** — LiteCast is patient-facing and excluded from
professional pathways, so for LiteCast this step is a documented skip, same
spirit as Phase D). It runs **after** step 5 (the `content_id` now exists in
the brain) and step 5.5 (pillar/subtopic confirmed), because placement consumes
both.

**Principle — pathways are INDEPENDENT of pillars; do not conflate them.**
- A **pillar** is where the item *lives*: exactly **one** home per item, decided
  in step 2.4. That decision is done and is **not** revisited here.
- A **pathway** is a curated **learning journey** defined by *"what must a
  person know to learn topic X, and in what order?"* The **same item can and
  often should belong to several pathways**, placed at the right position in
  each.
- **An item's pillar neither determines nor limits its pathways.** Placement is
  decided purely on **conceptual relevance to each pathway's own content / the
  learner's need** — never by matching the item's pillar or subtopic to a
  pathway. A `bonding` item can belong to esthetics, ceramics, fixed-pros and
  biomimetic pathways at once; an `occlusion` item can belong to the implant and
  prosthetics pathways. Pillar is irrelevant to this step (the tool prints it as
  FYI only).

The catalog and governing doctrine live in `plus/pathways.json` and
`reports/pathways-catalog-2026-07-22.md`; **read the catalog before placing.**
`plus/pathways.json` is the single source of truth (spec §5 schema: each pathway
is `{id, title_fa, description_fa, premium, steps:[{content_id, milestone}],
reserved}`; `content_id` = page path without leading `/` and `.html`).

**This is a genuinely semantic decision — never keyword/string matching** (same
standard as the pillar decision in 2.4 and the link steps 4.7–4.9). Judge the
new content's actual subject against what a learner of each pathway needs.

**Procedure.**

1. Generate ranked candidates (an aid, not the decision):
   ```bash
   python3 tools/pathway_place.py <content_id>
   ```
   It prints, per pathway, a score, a **confidence flag**, and a **suggested
   anchor** (`after <existing content_id>`) so the item lands *inside the right
   conceptual block*, in prerequisite→advanced order — not just appended. It
   scores each pathway purely on **conceptual overlap with that pathway's own
   content** (it ignores pillar). It marks a pathway **STRONG** only when a real
   conceptual **cluster** exists there (several related steps + a close
   neighbour); everything thinner is **ASK**.
2. Decide membership **semantically**, per **Hard Rule 14** — judged on the
   content's actual subject vs. what each pathway's learner needs, **never** on
   the item's pillar:
   - **STRONG / unmistakable homes** (the item clearly belongs — e.g. a new
     adhesion/bonding piece into every bonded-restoration pathway, a new
     screw-loosening piece into the implant-prosthetic and failure pathways):
     **place them directly** and report each placement (pathway + anchor +
     milestone flag).
   - **Borderline / cross-cutting judgment calls** (a plausible but not obvious
     fit, a brand-new theme with no clear home, or genuine uncertainty about the
     exact position): **ASK the user first**, presenting concrete named options
     (which pathway(s), after which step) — never guess, never silently drop a
     real candidate. This is the explicit **«اگر شک داشتی سوال کن، عمل نکن»**
     guard for pathways.
   - A single item routinely belongs to **several** pathways — place it in each
     one whose learner needs it, at the right position in each. The reach is
     conceptual, not pillar-bound (bonding basics reach esthetics/ceramics;
     occlusion reaches the implant and prosthetics pathways).
3. Apply each confirmed placement mechanically (this is the only writer of
   `plus/pathways.json`; it refuses duplicates and refuses LiteCast):
   ```bash
   python3 tools/pathway_place.py --insert <content_id> --pathway <id> --after <anchor_id> [--milestone]
   # or --at-end instead of --after <anchor_id>
   ```
   Set `--milestone` only if the item becomes the new end of its conceptual
   block (rare; usually a new item is mid-block, milestone=false).
4. Verify coverage and report:
   ```bash
   python3 tools/pathway_place.py --coverage
   ```
   Confirm the new `content_id` is now in **≥1** pathway (or, if you and the
   user deliberately left it out — a meta/equipment/orphan piece — state that
   explicitly, never silently). Report every pathway it joined and where.

**Scope / non-effects.** This step edits **only** `plus/pathways.json`. Pathways
are still **inert** (no page or builder reads them yet), so there is **no**
rebuild, no version bump, and no user-visible change from this step — it purely
keeps the pathway data correct as content grows, ready for activation. It does
**not** touch the brain, the page, capsules, or links (those are steps 4.7–4.9
and 5). Do not add pathway data to the brain entry (Hard Rule 6).

### 6. Pulse update

Use the sentence + hyperlink word from intake Question 5.

- Locate the Pulse section in `index.html` (or its data source if data-driven).
- Insert the new sentence at the **absolute top** of the Pulse section — it becomes the first (highest) line, above every existing line.
- Remove the **bottom-most** (lowest) line of the Pulse section entirely — no empty containers left behind. (This is the oldest announcement; the rule is positional: always the lowest line.)
- The chosen word is hyperlinked to the new content's page URL.
- Match exact HTML/classes of other Pulse items.

### 7. Bump the site content version (cache-bust)

Every publish must change a **site-wide version** so browsers (and the PWA service worker) are forced to pick up the new content instead of serving stale caches. The version is **derived from a hash of the content sources of truth** (`dentcast-brain.json` + `glossary/glossary.json` + `litecast/lite-glossary.json`) **plus the shared cached assets** (`dc-theme.css`, `dc-article.css`, `dc-nav.css`, `dc-nav.js`, `global-search.css`, `global-search.js`, `global-search-ui.js`, `episodes-drawer.js`), so it changes automatically whenever any content **or** any of those assets changes — never hand-pick or manually increment a number. (`service-worker.js` itself is deliberately excluded from the hash because the stamper rewrites its `CACHE_NAME`; hashing it would make the version unstable.)

This is done by a builder, not by hand:

```bash
python tools/stamp-version.py
```

It computes `ver = sha256(content sources)[:10]` and stamps it into **two** places, keeping them consistent:
- **`service-worker.js`** → `CACHE_NAME = 'dentcast-assets-<ver>'`. The worker is now **no-cache** (network-only; it deletes every cache on activate and never stores anything). The stamp's only job here is changing the worker's bytes so browsers fetch and activate the new worker promptly. Freshness of CSS/JS rides on the `?v=` asset URLs and normal HTTP caching.
- Every **`dentcast-brain.json?v=<ver>`** fetch URL in the HTML (currently `index.html` ×2 and `player.html`) → so any intermediary/CDN cache that ignores `no-store` is still defeated.

This step is part of the rebuild (step 8) and must run from a state that reflects `main` (same as the other builders). Report the old → new version.

**Builder consistency:** if any builder template ever emits a `dentcast-brain.json?v=` URL or a `CACHE_NAME`, it must NOT hard-code a stale value — let `tools/stamp-version.py` own the version and run it **last** in the build so it overwrites whatever the other builders emitted. (Today the generated pillar/glossary pages don't fetch the brain with a version and don't define `CACHE_NAME`, so only `service-worker.js`, `index.html`, and `player.html` carry the version.)

### 8. Rebuild

**Per Hard Rule 8, run these builders only from a working state that reflects `main`** (run from `main`, or merge `main` into the working branch first) — a feature branch's builder scripts may be stale.

Run the builders from the project root, in this order. Capture stdout/stderr for each; on error, stop and report verbatim.

1. **Homepage / main-index builder.** Run `python tools/update-homepage-counters.py`. Besides the three COUNTER stats it now also refreshes the homepage's **static fallbacks** from the brain: the hero card (badge episode number, title, audio `data-src`) and each «تازه‌های دنت‌کست» rail card (`data-cat` → that category's newest entry). The homepage JS does the same at runtime; this keeps the no-JS/SEO text equally fresh. A url-less newest entry leaves its card untouched.
2. **Pillar builder — always run `all`.** Run `python tools/build_pillar.py all` (rebuilds every `/pillar/<slug>/index.html`, the pillar landing page, AND `/glossary/index.html`). Run unconditionally, regardless of whether the new content's pillar is structured or not — the call is cheap, idempotent, and catches cross-pillar effects. The `glossary` target is part of `all`; if you ever touch `glossary/glossary.json` directly (adding/editing a term, fixing a URL, etc.) you MUST re-run at minimum `python tools/build_pillar.py glossary` — the page is no longer client-rendered, so a JSON edit alone will not surface on the live page until the build runs. Never hand-edit `/glossary/index.html`; it is generated. Other build targets: `python tools/build_pillar.py <pillar-slug>` (single pillar), `python tools/build_pillar.py index` (pillar landing only), `python tools/build_pillar.py glossary` (glossary only).
3. **Episodes landing-page builder — MANDATORY whenever the publish touched `dentcast.json` (any episode publish).** Run `python tools/build_episodes.py`. `episodes.html` is **fully static** (episode list, stats and Jalali dates baked in — **not** client-rendered, so appending to `dentcast.json` alone does NOT surface the new episode under `/episodes/`; the builder must run). The builder injects the dynamic bits — the episode `<li>` list (newest-first → top of `<ol id="episodeList">`) and the `@@EP_COUNT@@`/`@@HOURS@@`/`@@YEARS@@` stats — into the verbatim page shell stored in **`tools/episodes_template.html`**. It reads only `dentcast.json` + `dentcast-brain.json` + the template, and writes only `episodes.html`; it never touches individual `/episodes/episode-*.html` pages, so hand-added cross-links (steps 4.8/4.9) are safe. Skip this step only for non-episode types that don't write to `dentcast.json`. (`episodes/index.html` is just a redirect — never hand-edit it.)

   **Never hand-edit `episodes.html`** (the builder overwrites it; hand-edits silently desync from the builder — the failure that motivated this template split). To change page **chrome** (CSS/JS/layout/nav/the sort-toggle/pagination/`dc-jump`/the search filter row/asset-version bumps), edit **`tools/episodes_template.html`**, then run the builder. The template carries those features verbatim, so a normal run preserves them; the only build-to-build deltas are the new episode, the stats, and any brain-driven hashtag/caption changes.
4. **Flashcards index builder — run whenever step 4.11 added a `DefinedTermSet` to the new page.** Run `node tools/build_flashcards_index.mjs`. It scans every page site-wide for `DefinedTermSet` JSON-LD (skipping LiteCast and `/en/` mirrors) and regenerates `plus/flashcards-index.json` from scratch — **never hand-edit that file**, this builder is its only writer. Skip only on the documented "4.11: skipped — LiteCast" publishes.
4b. **Quiz index builder — run on every non-LiteCast publish that produced a page (step 4.12).** Run `node tools/build_quiz_index.mjs`. It scans every page's `FAQPage` JSON-LD site-wide (skipping LiteCast, `/en/` mirrors, and homepage), keeps only the binary (yes/no) questions whose answer opens with an explicit «بله»/«خیر» verdict, and regenerates `plus/quiz-index.json` from scratch — **never hand-edit that file**, this builder is its only writer. It prints `<pages>, <questions> binary questions (of <N> FAQ items scanned)`; the "scanned − kept" gap is the open/hedged questions correctly left out of the scored bank. Skip only on the documented "4.12: skipped — LiteCast" publishes.
5. **Image attributes backfill.** Run `python3 .github/scripts/inject_img_attrs.py` (idempotent, cheap). New pages cloned in this publish may carry images without intrinsic `width`/`height` (CLS) or `alt`; this backfills them site-wide. `--check` mode exists for CI.
6. **Version stamper — always run LAST.** Run `python tools/stamp-version.py` (step 7). It must run **after** the other builders so the content hash reflects the final state and so it overwrites any version strings they emitted. Report the old → new content version.

After the pillar builder finishes, verify:
- **When the entry's pillar is structured:** the new content appears under the correct pillar + subtopic in the regenerated `/pillar/<pillar.primary>/index.html`. Report the section it landed in.
- **When the entry's pillar is not structured:** confirm explicitly that the entry was **not** forced into any pillar page (it has no structured pillar to belong to, and `pillar.subtopic` is `null`). Note this in the report rather than skipping the check.

**For episode publishes, also verify the episodes builder took:** confirm the new episode now appears as a real `<a href="/episodes/episode-N.html">` in the regenerated `episodes.html` (e.g. `grep -c "episode-N.html" episodes.html` ≥ 1). If it's missing, `build_episodes.py` did not run — the publish is incomplete.

## Phase D — English mirror & language toggle (MANDATORY; Hard Rule 12)

**This phase is not optional and is not the «… رو انگلیسی کن» trigger — it runs automatically at the end of every `.org` publish.** A publish that produced a new fa page but no English counterpart + working toggle is **incomplete**. The recurring failure this prevents: shipping an insight/notecast/etc. page with **no language toggle** because the cloned template never had one. The toggle is meaningless without its target, so the en page and the toggle are produced together, here, by reusing the existing English-version machinery.

**LiteCast exception (the only skip):** if the locked category is **LiteCast**, skip Phase D entirely and **say so in the report** ("Phase D: skipped — LiteCast is `.ir`-only, no hreflang/en mirror per Hard Rule 10"). Every other category runs it.

**Steps:**

1. **Hand off to the English-version workflow.** Treat the page you just published (`{type}/{file}.html`) as the source and run **`.dentcast/workflows/en-version.md`** against it. That workflow already owns every detail correctly — do not re-improvise them here:
   - en page at `/{type}/en/{file}.html`; **English chrome cloned from `metanotes/en/meta-1.html`** (`<html lang="en" dir="ltr" data-dc-no-header>`, English topbar/toolbar labels, the `.lang-btn` CSS + markup), GA4 present exactly once.
   - **Body, box/section CSS classes, and JSON-LD `@type`/shape inherited from THIS page's own type** (e.g. the insight `.glass-box` structure), rendered LTR and **translated** structure-faithfully (same headings, same number of `<li>` items, nothing added or dropped).
   - **Scripts/analytics follow this type's conventions, not meta-1's extras.**
   - en page carries **no** specialist «کاوش بیشتر» capsules / glossary back-links / brain links (en pages stay out of the brain ecosystem — en-version Hard Rule 8): no brain entry, no Pulse line, no 4.7/4.8/4.9 for the en page.
2. **Wire the toggle on BOTH sides (en-version step 4).** On the new en page: `.lang-btn` → `../{file}.html` (label «فارسی»). On the source fa page: add `.lang-btn` → `en/{file}.html` (label «English»), placed/styled per the fa-side precedent (`metanotes/meta-1.html`), and **ensure the `.lang-btn` CSS exists in the fa page's inline `<style>`** (current templates carry it, but older clones may not — adding the button without its CSS is the "missing toggle = CSS issue" failure; add both when missing). The two targets must be exact inverses and neither may point at meta-1.
3. **Pair via disk-discovery (en-version step 7).** Run `python3 .github/scripts/inject_hreflang.py`. Because the en file now exists, both pages gain the 4-line hreflang mirror and the fa page gains its `en` alternate automatically — never hand-maintain a parallel copy. Also run `python3 .github/scripts/gen_sitemap.py` (the new `.org` en page enters the sitemap) and re-run `python tools/stamp-version.py` **last**.
4. **Verify (en-version step 9).** Confirm: en page has `<html lang="en" dir="ltr" data-dc-no-header>`, self-canonical `.org`, the 4-line hreflang mirror, `inLanguage`/`lang`/`og:locale` all `en`, the same JSON-LD `@type` as this type, GA4 exactly once; both toggles are exact inverses; the chrome standard `metanotes/en/meta-1.html` is **untouched** (hash unchanged). Report the two file paths created/modified (new en page + the toggle/hreflang edit on the source fa page).

**Why Phase D and not a step inside Phase C:** it consumes the *finished* fa page (after all of Phase C's swaps, enrichment, and rebuild), and it deliberately reuses a **separate, already-correct workflow** rather than duplicating its logic. Keep it last so the English mirror reflects the final published state.

## Phase E — Mark the page for the new-article push

**Runs at the very end of every `.org` page publish, once, after Phase D.** The
actual notification is **automated** by the `notify-new-articles` GitHub Action on
push to `main` — this phase's only job is to add the explicit **publish marker** so
that push counts as a real editorial publish. The Action then fires the API's
`article_published` event: **premium is notified immediately; free is batched into
the 21:00 Asia/Tehran digest** (published_at + 24h, effective delay «۱ تا ۲ روز»).
The free/premium split and delivery model live in the API — see
`plus-api/src/services/article-notify.ts` (Layer 1) and the web-push provider
(Layer 2). A push counts as a new article ONLY when all three hold, enforced by
`tools/notify_new_articles.py` (not by the file diff):

1. **Article content type** — the type is the page's top folder (first segment of
   its canonical `content_id`). Everything counts EXCEPT `glossary` and `litecast`.
2. **The publish marker** — `<meta name="dc-notify" content="true">` in `<head>`.
3. **Canonical `content_id` not notified before** — taken from `<link rel="canonical">`
   (the SEO-frozen slug), never the file path, so a move/rename that keeps the slug is
   not a new article. The API dedups on `content_id` (idempotency = retry-safety only).

**Do in this phase:** ensure the just-published page's `<head>` contains exactly
`<meta name="dc-notify" content="true">` (add it if the clone didn't carry it; it is
idempotent — never add a second copy). That is all. The commit + push to `main` does
the rest.

**Skip cases (do NOT add the marker; report the skip line):**
- **Paper-only fast path** (no page was published) — nothing to announce.
- **LiteCast** — `.ir`-only, outside the Plus push ecosystem (a `/litecast/…` push
  would break for `.org` subscribers). Report "Phase E: skipped — LiteCast".
- **Glossary** — reference type, not an article. Report the skip.
- Every other category adds the marker.

**One-time go-live step (before the Action is enabled the first time):** record all
existing pages as already-notified so editing an old article never fires premium:

```bash
curl -u "$ADMIN_USER:$ADMIN_PASSWORD" -X POST "$PLUS_API_BASE/admin/articles/backfill"
```

**Manual fallback (ops / when running outside CI)** — announce a single page directly
(idempotent; safe to re-run). Pass the **full `https://dentcast.org/…` URL**:

```bash
ADMIN_USER=… ADMIN_PASSWORD=… PLUS_API_BASE=https://api.dentcast.org \
  python tools/notify_new_article.py --url https://dentcast.org/{type}/{file}.html \
    --title "<the page's Persian title>"
```

**Verify / report:** confirm the marker is present on the new page (or the documented
skip line for paper-only / LiteCast / glossary). Delivery reaches only users who
enabled «نوتیف مطلب جدید» and have a push subscription; everyone else is skipped
silently — expected, not an error.

## Final output summary

- Category locked
- Writing-style check (Question 3.5): flagged AI-tell spots presented (or the explicit "no changes needed" result); which rewrites were approved/applied vs rejected; confirmation the text used from this point on is the post-decision text (edited if approved, original otherwise)
- Auto-discovered next number (and whether user overrode it)
- Template page path + SHA-256 before/after (must match)
- Media sources gathered (and which were auto-fetched vs asked)
- Audit table after fixes (all OK)
- Pillar & subtopic determination (step 2.4): the live pillar set read from `PILLARS`; the proposed-then-confirmed `pillar.primary` (or `null`); whether the pillar is structured; the proposed-then-confirmed `pillar.subtopic` (slug if structured, else `null`); whether a new subtopic was created (and user-confirmed)
- "کاوش بیشتر" capsule injection (step 2.5): which branch fired (typed-brain → 2 capsules / glossary → 1 capsule / core episode → `ep-related-link` pillar link in «محتوای مرتبط»); the exact block inserted (or the episode `ep-related-link`); the فهرست موضوعی capsule's `href` = `/pillar/<pillar.primary>/` (canonical format) or the `/pillar/` fallback; confirmation that `dc-related-*` classes were used for the section (and `ep-related-link` for the episode branch) and that no other diff was introduced beyond step 2's swaps
- Landing/index page (step 2.6): the type's landing page path (e.g. `/sharehub/index.html`); whether it's generated (regenerated by which builder) or hand-maintained (the exact link added and its position); confirmation it now links to the new entry exactly once
- New brain entry (printed as it now exists at the end of the flat array) — confirmation that it's the last element, that its key set matches the previous same-category entry exactly, and (for episodes) that no `type` field was added
- Pulse: which line was removed (the bottom one), and where the new line was inserted (one above the new bottom), with before/after diff
- For NoteCast: parent episode page path; whether the related-content block existed already or was created; before/after hash of the parent episode page; diff of the inserted markup
- For Promptologist (step 4.6): the new part's `ep-nav` previous slot wired to `<prev-id>.html` (next slot left as the empty placeholder); the previous part's page path with before/after hash, confirming its empty «next» placeholder was converted into a link to `<new-id>.html` (only that slot changed)
- For any publish with an attached paper file (step 4.10 — triggered by the file, any type) — or the documented "skipped — no attached paper" line otherwise: **Part 1** — the Drive subfolder the paper was filed into (chosen semantically) and its `drive_view` URL; **Part 2** — the new `dentcast_cabinet_full_catalog.json` entry's `id`, `topic`/`topic_path`, `tags` (semantic + article-name), and the Drive link, with confirmation the key set matches the enriched-entry template and the paper surfaces in `dentcast_cabinet_search.html`; **Part 3** (only when a page was published) — the DOI and first author found on the web, the rendered first-author→DOI credit anchor (ShareHub `.author` style) and any `isBasedOn` update, with before/after page hash — or the "Part 3 skipped — paper-only (no page)" note on the paper-only fast path. Explicitly list anything you asked the user about and confirm nothing (subfolder/DOI/author/tags) was guessed
- **Flashcards (step 4.11)** — or the documented "skipped — LiteCast" line: the `DefinedTermSet` block added to the page (term count and their `@id`s); how many came from `source: "faq"` vs `"authored"`; which FAQ entries (if any) were judged comparison/decision-shaped and skipped; confirmation no `name`/`description` is a verbatim FAQ copy; anything you asked the user about; confirmation `node tools/build_flashcards_index.mjs` was re-run in step 8 so `plus/flashcards-index.json` reflects the new page
- **Quiz (step 4.12)** — or the documented "skipped — LiteCast" line: confirmation every FAQ question `name` is standalone (no article deixis per 4.12(a)); how many of the page's FAQ questions are binary/scored vs open (and that any binary answer opens with an explicit «بله»/«خیر» verdict); confirmation `node tools/build_quiz_index.mjs` was re-run in step 8 and the new page's binary count appears in `plus/quiz-index.json`
- **Cross-linking completion gate (Hard Rule 11) — REQUIRED; the publish is incomplete if any of these is missing.** For **each** of steps 4.7, 4.8, 4.9, report its explicit outcome — never leave one unstated:
  - **4.7 (glossary → new content):** the candidate terms considered, which were linked (auto-applied vs. asked-and-confirmed, per Hard Rule 14, with the link text used), and which were skipped and why (at 5-cap / no section / judged unrelated / asked-and-declined). An empty result is acceptable **only** as a documented "analyzed, 0 qualifying terms".
  - **4.8 (in-body inline links on the new page):** confirmation that a **fresh** semantic analysis of *this* body was run (NOT inherited from the clone); which candidates were auto-applied at high confidence vs. presented to the user (Hard Rule 14); which of the presented ones were approved/inserted (first-occurrence) and which rejected. For episodes, confirm the «درباره این اپیزود» caption was the analyzed body. An empty result is acceptable **only** as a documented "analyzed body, 0 qualifying glossary/episode candidates".
  - **4.9 (related links on the new page):** for episodes, confirm this targeted the **«محتوای مرتبط»** block (not skipped due to the naming difference); the related brain entries considered (sibling series parts first), how many slots were free under the 5-cap, which links were auto-applied vs. presented to the user (Hard Rule 14) and which of those were approved/added, and the remaining-budget math. An empty result is acceptable **only** as a documented "at cap" / "0 qualifying entries".
  - Explicitly confirm that **none** of 4.7/4.8/4.9 was skipped on the grounds that the cloned/previous/sibling page lacked such links (a Hard-Rule-11 violation).
- Pillar/subtopic verification (step 5.5): confirmation that the recorded `pillar.primary` and `pillar.subtopic` are **identical** to what was confirmed in step 2.4 (untouched by steps 5/5.5); resulting `pillar.subtopic` (slug if structured, `null` if not); confirmation that no new keys were added to the `pillar` object or as siblings, that the `subtopic` key is present in every case, and that the step-2.5 capsule / episode pillar link is consistent with `pillar.primary`
- Builder runs: each command + full stdout/stderr (`python tools/update-homepage-counters.py`, `python tools/build_pillar.py all`, `python tools/build_episodes.py` for episode publishes, `node tools/build_flashcards_index.mjs` unless step 4.11 was skipped, and `python tools/stamp-version.py` LAST); confirmation that the new content appears in the regenerated pillar page when a structured pillar was assigned, **and (for episodes) that the new episode now appears in the regenerated `episodes.html`** with no feature regression.
- **Phase D (English mirror & toggle — Hard Rule 12; REQUIRED unless LiteCast):** the en page path created (`/{type}/en/{file}.html`); confirmation the body was translated structure-faithfully from THIS type (not rendered as a metanote) with GA4 once and `lang`/`inLanguage`/`og:locale` all `en`; both toggle targets (exact inverses, no meta-1 hardcode) and that the fa page got both the `.lang-btn` markup **and** its CSS; `inject_hreflang.py` pairing confirmation (fa page gained its `en` alternate); chrome standard `metanotes/en/meta-1.html` hash unchanged. For LiteCast, the documented skip line instead.
- **Phase E (new-article push marker — REQUIRED unless paper-only/LiteCast/glossary):**
  confirmation that `<meta name="dc-notify" content="true">` is present exactly once
  in the published page's `<head>` (so the `notify-new-articles` Action fires the
  `article_published` event on push); or the documented skip line ("paper-only" /
  "LiteCast" / "glossary").
- Confirmation the new entry appears in the latest-content widget data
- List of all modified file paths
