### 4.14. چالش — public half on the page, private half in the admin queue

**Runs only when Question 4.9 answered «چالش».** Full design in
`.dentcast/challenge-handoff.md`; this step is a summary of its §11.3, not a
second source of truth for it — read the handoff before touching this step.

Two halves, two homes, and mixing them up is the one mistake that cannot be
walked back once it is in git history (RULE 2):

1. **The public half — the question + image — goes ON THE PAGE**, inside the
   folder's normal prose box, the same place an ordinary post's body would go
   (a چالش clones the same page template; only the body differs). Mark up the
   question element with `data-dc-challenge-question` and the image with
   `data-dc-challenge-image` — `tools/build_challenge_index.mjs` reads exactly
   that markup. **Never** put the answer or the key points on the page, in the
   brain entry, or in any committed file.

   **Copy insight-68's markup exactly (RULE 18, handoff §11.3) — it is the
   reference implementation, not just the first example:**
   ```html
   <p data-dc-challenge-question data-dc-challenge-image="/insight/insight68.webp">
     …the question, verbatim…
   </p>
   ```
   Two things this is not allowed to drift on: **no separate `<img>` tag** —
   the image lives only as that data-attribute value, because insight-68's
   first draft had a real `<img>` *and* the live JS block redrawing the same
   image, so the question and the photo both rendered twice on the page
   before that was fixed. And the path is **site-absolute** (`/insight/
   insight68.webp`), never a bare filename — a bare filename happens to work
   on the standalone page but 404s on the desktop 3-column shell, which
   injects the article in place inside `index.html` rather than in an
   iframe. Both are enforced by `tools/build_challenge_index.mjs` (throws on
   a non-absolute path) and re-checked by `tools/verify_publish.py`'s چالش
   row — do not rely on memory for either.
2. Run `node tools/build_challenge_index.mjs` in step 8 (after the pillar
   builder, before `build_plus_index.mjs`) so this `content_id` lands in the
   generated `plus/challenges.json`.

Then **print the founder's paste box** into the publish report, for
`GET /admin` → «صندوق چالش»:

```json
{ "content_id": "chairside/chairside-31",
  "answer_fa": "…",
  "key_points": [ { "id": "kp1", "text": "…" }, … ] }
```

**Say explicitly, in the report, that the چالش is not live until that paste
happens** — until the founder posts this to `/admin/challenges/upsert`, the
page renders the question with no answer box at all (`GET /challenge/:id`
answers `{exists:false}` and the block removes itself), so a half-published
چالش is invisible rather than broken. This is expected, not a defect to fix
in this step.

**A چالش skips the article-shaped steps** that assume prose to work from —
give each its own explicit verdict in the report, never a silent skip
(Hard Rule 11):

| step | on a چالش |
|---|---|
| 4.11 flashcards | **skip** — no FAQ; a چالش has no prose to define terms from |
| 4.12 quiz-ready FAQ | **skip** — same reason (and see RULE 1: never confuse this with `quiz-index.json`) |
| 4.13 DES | **skip, reported** — a question cites nothing and appraises nothing; write **no key** in `des-scores.json` |
| 5.6 / 5.6-ب pathways & bundles | **skip** — a pathway step is something to read |
| Phase D en mirror | **skip — decided** (RULE 16, the second documented exception to Hard Rule 12 alongside LiteCast) |

Steps 2.4 (pillar), 2.5 (کاوش بیشتر), 2.6 (landing page), 5.0 (hashtags), 5
(brain entry, per RULE 15 — the folder's ordinary shape, never a new `type`),
6 (Pulse), and Phase E/F all **run** exactly as they would for an ordinary
post in that folder.

### 5.0. Hashtag standardization against the reference library (Hard Rule 15)

The entry's `hashtags` are a **standardized vocabulary** governed by `dentcast-hashtag-reference.json` — the canonical library the AI case-assistant search reads (mirrored into `plus/content-index.json`, which the live API loads with auto-reload). Settle the **final canonical hashtag list here**, before it is consumed by the brain write (step 5) and the page's visible chips. This runs on **every publish that writes a brain entry** — LiteCast included (its brain is `litecast/lite-glossary.json`; run the same discipline against the library). The `dentcast_cabinet_full_catalog.json` paper `tags` are a **separate** kebab-style system and are **out of scope here** (step 4.10 owns them).

**Step 1 — Draft the concepts.** From the confirmed text, draft the genuinely semantic concepts the article *resolves* (Rule: tag what it resolves, not what it merely mentions) — golden length **2–3 words**, no junk/generic tags, and include the article's own series/name tag where the type uses one. These are concepts to look up, not final tags yet. They remain proposals under Hard Rule 13 (shown to the user).

**Step 2 — Resolve each against the library. Reuse before you mint.**
```bash
python3 tools/hashtag_ref.py --simulate "<concept phrase a dentist would type>"
```
The phrase is tokenized through the alias layer, so a concept already in the library under **any** spelling surfaces as the top canonical `#tag`. If a real concept already covers it → use that **canonical `#tag`** verbatim on the article. **Never invent a second spelling; never write the alias form as the tag** (Hard Rule 15). (`--words "<tag>"` shows how the engine tokenizes something; `--backlog <type>` lists brain tags with no reference entry.)

**Step 3 — Mint only what's genuinely new.** For a concept the library truly lacks, add a canonical entry via a batch file, then apply it:
```jsonc
// .dentcast/hashtag-batches/NNN-<short-name>.json  (NNN = next number in that dir)
{ "type": "<locked-type>",
  "concepts": [{
    "tag": "#<canonical>",                 // 2–3 words, same Persian underscore style as neighbours
    "domain": "clinical | ai | brand",
    "definition": "<what the concept IS>",  // real; never fabricate to fill the field
    "use_when": "<when an article may carry it>",
    "aliases": ["<english equivalent>", "<spelling/script variant>", "<synonym a dentist types>"]
  }],
  "articles": { "<content_id>": ["#<canonical>", "…the article's full canonical tag list…"] } }
```
```bash
python3 tools/hashtag_ref.py --apply .dentcast/hashtag-batches/NNN-<short-name>.json
```
Rules for a new concept: **only non-canonical spellings go in `aliases`** — an existing canonical `#tag` is **never** filed as another concept's alias (Hard Rule 15); an alias must not equal another concept's word-set or an alias already in use (the compiler reports collisions — heed them). The guard **refuses** any tag lacking a library entry and any door-closing merge/rename — **fix what it flags, never force it** (`allow_lossy` is almost never right).

**Step 4 — Write canonical tags everywhere, then verify.** Only canonical `#tag`s reach the brain `hashtags` (step 5) and the page's visible chips. **For episodes**, `--apply` rewrites the on-page chips from the brain and `tools/build_episodes.py` (step 8) regenerates `episodes.html`; **for other types**, set the cloned page's chip markup to the canonical list by hand so page and brain agree. Then:
```bash
python3 tools/hashtag_ref.py --sync      # recompute counts + compile the alias table into the reference
node tools/build_plus_index.mjs          # mirror tags+aliases into plus/content-index.json (the live search reads this)
python3 tools/hashtag_ref.py --check     # every enforced type carries only canonical tags — MUST pass
python3 tools/hashtag_ref.py --simulate "<a real question a dentist would type at this article>"   # confirm it is reachable, ideally rank-1
```
**Report:** which proposed concepts **reused** an existing canonical tag, which were **newly minted** (and their aliases), plus the `--check` result and the `--simulate` rank. (`build_plus_index.mjs` also runs in step 8's rebuild list — running it here too is idempotent and keeps the live index current immediately.)

### 5. Brain entry

`dentcast-brain.json` is a **single flat array of all entries — there are no per-type sections.** Read it. Find the most recent entry of the LOCKED category and use it as the **schema template**.

**The `hashtags` field is the canonical list resolved in step 5.0 (Hard Rule 15) — do not re-invent or re-spell tags here.** Every tag written must already be a canonical concept in `dentcast-hashtag-reference.json`; if step 5.0 was skipped, go back and run it before writing this entry.

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

   **Three guards decide what the tool may call STRONG and where it may
   anchor — none of them is yours to relax** (added after the 2026-09-14
   re-curation, when the 64 items published since the July curation had
   averaged 2.64 pathways each against 1.38 for the curated set, `fixed-pros`
   had re-grown the post-and-core block it was deliberately split from, and
   eight series had a stranger between part 1 and part 2):
   - **STRONG is measured against the pathway's frozen CORE**
     (`.dentcast/pathway-core.json` — its steps as the founder last curated
     them), never its live list. The live list ranks and supplies the anchor,
     but cannot promote: scoring against the live list is how every placement
     raised the score of the next similar item until `evidence-literacy`
     ranked a post-and-core article first. A pathway with no frozen core is
     never STRONG. `--freeze-core` re-freezes every full pathway from the live
     file and is run **only after a founder curation pass** — never after a
     publish, which would re-admit exactly the drift the core measures against.
   - **A third pathway is always a question.** An item already in two full
     pathways gets ASK for every further candidate, and `--insert` refuses to
     make it a member of a third without `--confirmed` — pass that flag only
     after the founder said yes to *that* placement; it is the record of the
     answer, not a way around the question. Bundles are outside this count
     (they have their own gate, 5.6-ب).
   - **The anchor never splits a series.** Consecutive podcast episodes (an
     episode and its NoteCast are one unit), chapter-style ids
     (`prompt6-1 → prompt6-4`) and consecutive «قسمت/بخش N» titles with one
     stem are one run; the suggested anchor is the run's **last** step, and
     `--insert --after` a step inside a run is refused without `--confirmed`.
     The nearest neighbour of a new item is, in a series, part N — which is
     how Biological Width part 1 came to be followed by four chairside cases
     and then part 2.
   The scorer also ignores brand/series hashtags (`domain: brand|web` in the
   hashtag reference) and corpus-generic words (`دندان`, `ایمپلنت`, `روکش`… —
   measured, anything in >10% of entries): «Share_Hub» made every ShareHub
   item a neighbour of every other, and the title word «دندان» inside the
   keyword «اسپارتینا و دندانپزشکی» made a tirzepatide note STRONG for Goodacre's
   prep principles.
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
   `plus/pathways.json`; it refuses duplicates, refuses LiteCast, refuses a
   third full pathway and refuses an anchor inside a series — the last two
   only without `--confirmed`, which you pass after the founder's yes):
   ```bash
   python3 tools/pathway_place.py --insert <content_id> --pathway <id> --after <anchor_id> [--milestone] [--confirmed]
   # or --at-end instead of --after <anchor_id>
   # or --at-start, when the item is the new FIRST step (a foundation the rest builds on;
   #   تراز شواهد قسمت ۱ opening evidence-literacy is the precedent) — never on a bundle's finish
   ```
   **A تراز شواهد part (`taraz/`) is never a scoring question for
   `evidence-literacy`: it is a required step there** (founder, 1405/07/03),
   placed `--after` the part before it so the series keeps its order; other
   pathways it may join go through the ordinary judgment above. Phase F
   enforces both membership and order (`5.6 pathway`).
   Set `--milestone` only if the item becomes the new end of its conceptual
   block (rare; usually a new item is mid-block, milestone=false).
4. Verify coverage and report:
   ```bash
   python3 tools/pathway_place.py --coverage
   ```
   Confirm the new `content_id` is now in **≥1** pathway (or, if you and the
   user deliberately left it out — a meta/equipment/orphan piece — state that
   explicitly, never silently). Report every pathway it joined and where, and
   the `full pathways: … per item` line — the curated baseline is **1.38**;
   if it moves, say so in the report rather than letting it creep.

**Scope / non-effects.** This step edits **only** `plus/pathways.json` — no
builder, no rebuild, no version bump. It does **not** touch the brain, the page,
capsules, or links (those are steps 4.7–4.9 and 5). Do not add pathway data to
the brain entry (Hard Rule 6).

**Pathways are LIVE — this edit is user-visible, it is not staging.** (The
"pathways are inert, nothing reads them yet" note that used to sit here was
true only before the premium Phase 3 launch; it is not true now.) `/plus/pathways.html`,
`/plus/pathway.html?id=`, and the «مسیر یادگیری» block on the `/plus/` dashboard
all render this file, and `GET /me`'s `active_pathway` reads through it. It
still needs **no API redeploy** — `plus-api/src/content-refresh.ts` re-fetches
the published `plus/pathways.json` from the live site every few minutes
(validated, upgrade-only, last-good-copy on failure), so the baked copy is only
a boot value. Two practical consequences: a wrong placement is visible to real
subscribers rather than parked for later, so the **«اگر شک داشتی سوال کن»**
guard above is about live UI, not about data hygiene; and the file must be
valid JSON at commit time (`python3 -m json.tool plus/pathways.json > /dev/null`),
because a broken publish is what the API's last-good fallback would be holding.

### 5.6-ب. Bundle check (runs after every full-pathway placement)

Alongside the 15 full pathways, `plus/pathways.json` carries **starter
bundles** (`kind: "bundle"` entries — 5–8-step "just the core" subsets of a
pathway; catalog + doctrine in `.dentcast/bundles-handoff.md`). After the
item's full-pathway placements are done, run this check. It is written as a
**gate chain**: every gate is a yes/no question answerable from the item's
folder, title, and the bundle's current step list alone — no taste, no
"feels core". **The default is NO.** An item enters a bundle automatically
ONLY when every gate below passes with a confident yes; one uncertain answer
anywhere = ASK the founder («اگر شک داشتی سوال کن، عمل نکن») — asking is
never wrong, silently adding is.

**Candidates.** Check only bundles whose `continues_pathway` is one of the
full pathways the item just joined in 5.6 (nothing else can be relevant).
Zero candidates → write «باندل: بدون کاندید» in the report and stop.

**The gates — walk them in order, stop at the first NO:**

1. **GATE ۱ — Type (mechanical).** The item's folder is `episodes/`,
   `notecast/`, `sharehub/` or `dentai/`. Anything else — `insight/`,
   `chairside/`, `metanotes/`, `photocast/`, `dentcast-plus/`, `litecast/` —
   is **NO, always**: those types are by construction نکته/کیس/جستار, exactly
   what a bundle excludes. No judgment may override this gate.
2. **GATE ۲ — Shape (from the title alone).** The title names a whole
   concept a beginner must learn (اصول X، طبقه‌بندی X، راهنمای جامع X،
   مقدمه‌ای بر X، انتخاب X، «X — قسمت اول»). It is **NO** if the title
   describes one situation or patient («وقتی…», «چرا برای این بیمار…»,
   «بیمار با…»), a trick/pearl (راهکار، ترفند، نکته), an exception or
   complication, or a deep continuation («قسمت سوم» of a series whose قسمت
   اول is not in the bundle).
3. **GATE ۳ — Coverage (against the bundle's current steps).** Read the
   bundle's step titles. The item must cover a core sub-topic that **no
   existing step covers** — i.e. a beginner finishing the bundle today would
   have a hole where this item goes. If it adds depth/detail/an update to a
   concept already represented, it is **NO** — its home is the full pathway.
   (An item that looks like a **better replacement** for an existing step is
   never automatic — that is an ASK.)
4. **GATE ۴ — Twin (mechanical).** If the bundle already contains this
   item's twin — the episode of this notecast, the notecast of this episode,
   or any same-numbered sibling — it is **NO** (قانون «یک مفهوم = یک قدم»).
5. **GATE ۵ — Size (mechanical).** After insertion the bundle must have
   **≤ 8 steps**. 9 or more = ASK (something must leave first, and removal
   is founder-only).

**If all five gates pass — insert, with two hard mechanics:**

- Anchor semantically and insert **mid-list only**:
  ```bash
  python3 tools/pathway_place.py --insert <content_id> --pathway <bundle-id> --after <anchor_id>
  ```
  where `<anchor_id>` is the existing step the item most directly follows.
  **Never `--at-end` on a bundle and never place after the current final
  step**: the final step carries `milestone: true` (the finish flag 🏁), and
  appending would strand the flag mid-list. If the only right position seems
  to be at the very end, that is an ASK, not an insert.
- **Sweep the two hand-maintained mirrors in the same commit** (a bundle
  edit that skips these ships a lie): the bundle's step count in
  `plus/js/home-bundles.js`'s `BUNDLES` array, then
  `python3 tools/asset_version.py --bump`.

**Report — mandatory either way.** The publish report names every candidate
bundle with one of exactly three verdicts: «وارد شد (بعد از کدام قدم)»,
«رد شد (گیت N)», or «سوال شد». Silence about a candidate bundle is a
workflow violation — a NO must be as visible as a YES.

### 6. Pulse update

Use the sentence + hyperlink word from intake Question 5. **No spoilers (see Question 5): the line names the piece by its title and never narrates its decision/mechanism/finding/conclusion.** If the drafted sentence describes content beyond the title, rewrite it before inserting — never ship a Pulse line that summarizes the article.

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

**CI re-stamps on `main`, and that is a net — never a reason to skip this step.** `.github/workflows/sitemap_only.yml` runs `tools/stamp-version.py` on every push to `main` (step 2c, after the sitemap and plus-index generators) and commits the result. It exists for the one case a single branch cannot get right: **two publishes merged in sequence.** The hash covers `dentcast-brain.json`, both glossaries, `dentcast-music.json` and eight shared assets — so branch A stamps correctly at its own head, branch B (cut earlier) stamps correctly at *its* head, and whichever merges second carries A's `dc-nav.js` (or brain, or CSS) alongside B's older stamp. Nothing errors, because the version still *changed* and caches still bust; it is simply no longer derived from what the site serves, and the drift compounds on every later publish. Found in production 2026-09-15: PR #695 changed `dc-nav.js` after PR #696's branch had stamped `93d26c6b4f`, and the merge shipped that stamp against a tree whose true hash was `45759b6606`. **Your branch must still be self-consistent before you commit** — Phase F fails a publish whose stamped version does not equal its own content hash, and that check is what catches a forgotten step 7 *within* one branch, which CI cannot distinguish from a legitimate concurrent merge.

**Builder consistency:** if any builder template ever emits a `dentcast-brain.json?v=` URL or a `CACHE_NAME`, it must NOT hard-code a stale value — let `tools/stamp-version.py` own the version and run it **last** in the build so it overwrites whatever the other builders emitted. (Today the generated pillar/glossary pages don't fetch the brain with a version and don't define `CACHE_NAME`, so only `service-worker.js`, `index.html`, and `player.html` carry the version.)

### 8. Rebuild

**Per Hard Rule 8, run these builders only from a working state that reflects `main`** (run from `main`, or merge `main` into the working branch first) — a feature branch's builder scripts may be stale.

Run the builders from the project root, in this order. Capture stdout/stderr for each; on error, stop and report verbatim.

1. **Homepage / main-index builder.** Run `python tools/update-homepage-counters.py`. Besides the three COUNTER stats it now also refreshes the homepage's **static fallbacks** from the brain: the hero card (badge episode number, title, audio `data-src`) and each «تازه‌های دنت‌کست» rail card (`data-cat` → that category's newest entry). The homepage JS does the same at runtime; this keeps the no-JS/SEO text equally fresh. A url-less newest entry leaves its card untouched. It also refreshes the **«دسته‌های محتوا» grid's per-category counts** (one `COUNTER:CAT_*:START/END` marker per card) — every card counts its brain `type`, except episodes (`dentcast.json`) and **LiteCast**, which counts `litecast/lite-glossary.json` directly: LiteCast migrated off the brain, so its 19 old `type: "litecast"` brain rows are pre-migration leftovers kept for history only and are never counted or grown. Never hand-edit a number in that grid; it is overwritten on every run.
2. **Pillar builder — always run `all`.** Run `python tools/build_pillar.py all` (rebuilds every `/pillar/<slug>/index.html`, the pillar landing page, AND `/glossary/index.html`). **It also writes a `structure.json` next to each of those pages, and those files are part of the build — commit them with the HTML.** A pillar page is now two outputs, not one: the **page** is the flat, date-ordered list of every item in that pillar (newest first, undated items last), which is what every visitor and every crawler gets; the **sidecar** carries the subtopic foldering and the reading-chain order, which `/pillar/premium-index.js` layers onto the same URL after `/me` confirms a premium subscription. The split is deliberate — shipping both arrangements in one document would put the same links on the page twice and hand Google a duplicate of a page it already has — so **never** hand-add subtopic cards back into a pillar page's HTML, and never edit a `structure.json` by hand; both come out of this builder. `pillar/structure.json` (the hub's sidecar) is the same idea for the landing page's per-pillar subtopic breakdown. Run unconditionally, regardless of whether the new content's pillar is structured or not — the call is cheap, idempotent, and catches cross-pillar effects. The `glossary` target is part of `all`; if you ever touch `glossary/glossary.json` directly (adding/editing a term, fixing a URL, etc.) you MUST re-run at minimum `python tools/build_pillar.py glossary` — the page is no longer client-rendered, so a JSON edit alone will not surface on the live page until the build runs. Never hand-edit `/glossary/index.html`; it is generated. Other build targets: `python tools/build_pillar.py <pillar-slug>` (single pillar), `python tools/build_pillar.py index` (pillar landing only), `python tools/build_pillar.py glossary` (glossary only). **Asset-version guard:** this builder **hardcodes** the shared-asset cache-bust suffixes it emits into the page chrome (e.g. `dc-nav.js?v=NN`). Those hardcodes are NOT owned by `stamp-version.py`, so if the live pages' asset version is bumped directly without updating this builder, a routine `all` run **silently rolls the asset version back on every pillar page**. Before committing a rebuild, verify the regenerated pages did not regress a `?v=` (e.g. `git diff -G'\\?v=' pillar/`); if they did, bump the builder's hardcoded suffix to match the live pages and re-run — never ship the rollback.
3. **Episodes landing-page builder — MANDATORY whenever the publish touched `dentcast.json` (any episode publish).** Run `python tools/build_episodes.py`. `episodes.html` is **fully static** (episode list, stats and Jalali dates baked in — **not** client-rendered, so appending to `dentcast.json` alone does NOT surface the new episode under `/episodes/`; the builder must run). The builder injects the dynamic bits — the episode `<li>` list (newest-first → top of `<ol id="episodeList">`) and the `@@EP_COUNT@@`/`@@HOURS@@`/`@@YEARS@@` stats — into the verbatim page shell stored in **`tools/episodes_template.html`**. It reads only `dentcast.json` + `dentcast-brain.json` + the template, and writes only `episodes.html`; it never touches individual `/episodes/episode-*.html` pages, so hand-added cross-links (steps 4.8/4.9) are safe. Skip this step only for non-episode types that don't write to `dentcast.json`. (`episodes/index.html` is just a redirect — never hand-edit it.)

   **Never hand-edit `episodes.html`** (the builder overwrites it; hand-edits silently desync from the builder — the failure that motivated this template split). To change page **chrome** (CSS/JS/layout/nav/the sort-toggle/pagination/`dc-jump`/the search filter row/asset-version bumps), edit **`tools/episodes_template.html`**, then run the builder. The template carries those features verbatim, so a normal run preserves them; the only build-to-build deltas are the new episode, the stats, and any brain-driven hashtag/caption changes.
4. **Flashcards index builder — run whenever step 4.11 added a `DefinedTermSet` to the corpus.** Run `node tools/build_flashcards_index.mjs`. It reads `plus/faq-corpus.json` (never page HTML — pages carry no `DefinedTermSet` of their own, see step 4.11) for every content id's `DefinedTermSet`, skipping LiteCast and `/en/` entries, and regenerates `plus/flashcards-index.json` from scratch — **never hand-edit that file**, this builder is its only writer. Skip only on the documented "4.11: skipped — LiteCast" publishes.
4b. **Quiz index builder — run on every non-LiteCast publish that produced a page (step 4.12).** Run `node tools/build_quiz_index.mjs`. It reads `plus/faq-corpus.json` (never page HTML) for every content id's `FAQPage`, skipping LiteCast, `/en/` entries, and the homepage, keeps only the binary (yes/no) questions whose answer opens with an explicit «بله»/«خیر» verdict, and regenerates `plus/quiz-index.json` from scratch — **never hand-edit that file**, this builder is its only writer. It prints `<pages>, <questions> binary questions (of <N> FAQ items scanned)`; the "scanned − kept" gap is the open/hedged questions correctly left out of the scored bank. Skip only on the documented "4.12: skipped — LiteCast" publishes.
4c. **چالش index builder — run whenever step 4.14 fired (a چالش publish).** Run `node tools/build_challenge_index.mjs`. It walks the specialist content folders for the `data-dc-challenge-question`/`data-dc-challenge-image` markup step 4.14 wrote and regenerates `plus/challenges.json` from scratch — **never hand-edit that file**, this builder is its only writer, and it never carries `answer_fa`/`key_points` (it asserts so itself). Runs after the pillar builder (step 2) and before the plus content-index builder (step 5b). Skip on any publish that did not answer «چالش» at Question 4.9.
5. **Image attributes backfill.** Run `python3 .github/scripts/inject_img_attrs.py` (idempotent, cheap). New pages cloned in this publish may carry images without intrinsic `width`/`height` (CLS) or `alt`; this backfills them site-wide. `--check` mode exists for CI.
5b. **Plus content-index builder — run on every publish that wrote/changed a brain entry (i.e. every non-paper-only publish).** Run `node tools/build_plus_index.mjs`. It regenerates `plus/content-index.json` from `dentcast-brain.json` (+ `glossary/glossary.json`, the pillar hub page for the categories, and **each pillar's `structure.json` for the subtopics** — it used to scrape those out of the pillar pages' HTML, which no longer contains them). **That makes step 2 a hard prerequisite of this one:** run the pillar builder first, or a missing/stale sidecar silently costs the میز کار tree its subcategories. The builder warns on a missing one rather than failing, so read its output. It is the single taxonomy model the **DentCast Plus «میز کار» dashboard navigation tree** and the homepage "last read" resolver both read (`content_id` → `{cluster, subtopic, type, title, url}`). **It also mirrors the standardized hashtag vocabulary** — every real `#tag` and the compiled **alias table** from `dentcast-hashtag-reference.json` — into `content-index.json`, which is what the AI case-assistant search folds queries and hashtags through (Hard Rule 15 / step 5.0). If step 5.0 minted or re-aliased any concept, this run is what carries it to the live search, so it must run after that. **A stale content-index silently drops the new page from the میز کار tree**, so this builder must run whenever brain content changes. It is the only writer of `plus/content-index.json` — never hand-edit that file. (Note: the `notify-new-articles` Action's sibling CI job `sitemap_only.yml` also runs this builder — and `gen_sitemap.py` — on push to `main`, so the live site self-heals even if this local step is missed; running it here keeps the committed tree correct and the local step-8 verification honest. The **«seen» ticks and study-mode/میز کار activation are separate and path-based** — they need no builder, only that the page lives under a ticked folder and appears on its landing page.)
5c. **up-board catalog builder — run on every publish that wrote/changed a brain entry (same trigger as 5b).** Run `python3 tools/build_upboard_index.py`. It regenerates `up-board/index.json` — the id/title/type/url/date list that `/up-board/` draws BOTH of its arrangements from — and it is the only writer of that file; never hand-edit it. Two things it takes from the brain that nothing else can supply: the **global publication order** (the brain array is one flat, append-ordered list with the types interleaved, so its index is the only place on the site that knows how a NoteCast and a Chairside sort against each other — Hard Rule 4's append rule is what makes that true, and a per-type list cannot answer it), and each item's **date**, read from the page's own JSON-LD `datePublished` via `build_pillar.py`'s helpers, so the two builders can never disagree about what a date is. **A stale index silently leaves the new page off up-board entirely** — it will not appear under «تازه‌ترین» and cannot be ranked under «بالاترین», even once readers heart it, because the board returns ids and the catalog is what turns an id into a row. The builder reads both `page_url` and `url` (the brain carries two schemas) and derives the type from the URL folder, so a new content type needs no edit here. It does NOT carry heart counts: those live in the API (`GET /votes/board`) and change by the minute. `/up-board/` is `noindex, follow` and stays out of the sitemap by design (`gen_sitemap.py` drops it on its own), and `up-board/index.json` is disallowed in `robots.txt` — do not "fix" either.

6. **Version stamper — always run LAST.** Run `python tools/stamp-version.py` (step 7). It must run **after** the other builders so the content hash reflects the final state and so it overwrites any version strings they emitted. Report the old → new content version.

   **"Last" means last in wall-clock order, not last in this list.** The stamp is a hash *of the content*, so any write to `dentcast-brain.json`, either glossary, or a shared asset **after** the stamper silently invalidates it — and nothing reports an error, because the version still *changed* and caches still bust. The site is simply no longer carrying a version derived from what it serves, and the drift then compounds on every later publish. The usual culprits are steps that run "one more small write" afterwards: `hashtag_ref.py --apply` (it writes tags into the brain), a late caption/title correction, or a Hard-Rule-17 sweep. **If anything at all touched a hashed source after the stamper, run the stamper again.** Verify rather than remember:

   ```bash
   python tools/stamp-version.py     # re-running is idempotent and free when already current
   ```

   Phase F fails the publish when the stamped version does not equal the recomputed content hash, so this is checked, not trusted.

After the pillar builder finishes, verify **both** outputs — the page and its sidecar are written by one run, but only one of them is visible when you open the page, so a half-finished build looks fine on screen:
- **When the entry's pillar is structured:** the new content appears **twice**, once in each output. (a) In the regenerated `/pillar/<pillar.primary>/index.html`, in the flat list — and because the list is newest-first, a same-day publish should be **at or near the top**; if it is buried, its page is missing a `datePublished` in its JSON-LD (undated items sort to the very end) and that is the thing to fix, not the ordering. (b) In `/pillar/<pillar.primary>/structure.json`, under the confirmed subtopic. Report the position in the list and the subtopic it landed under. Phase F's gate checks both (`8 pillar` / `8 pillar-structure`).
- **When the entry's pillar is not structured:** confirm explicitly that the entry was **not** forced into any pillar page (it has no structured pillar to belong to, and `pillar.subtopic` is `null`). Note this in the report rather than skipping the check.

**For episode publishes, also verify the episodes builder took:** confirm the new episode now appears as a real `<a href="/episodes/episode-N.html">` in the regenerated `episodes.html` (e.g. `grep -c "episode-N.html" episodes.html` ≥ 1). If it's missing, `build_episodes.py` did not run — the publish is incomplete.
