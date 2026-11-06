<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages and the three deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `C.5.0`, `C.5`, `C.5.5`, `C.5.6`, `C.5.6-b`. Every tag, metadata, pathway and bundle decision closes here, before the C.6 editorial lock and Push 2; no judgment work moves behind Push 2.

<!-- hashtag-step-5-0:v2 -->
### 5.0. Hashtag standardization against the reference library (Hard Rule 15)

The entry's `hashtags` are a **standardized vocabulary** governed by `dentcast-hashtag-reference.json`, the library the AI case-assistant reads (mirrored into `plus/content-index.json` and `plus/assistant-tags.json` by `tools/build_plus_index.mjs`; the live API reloads them). Settle the **final canonical list here**, before the brain write (step 5) and the page chips consume it. It runs on **every publish that writes a brain entry** — LiteCast included, against the same library (its brain is `litecast/lite-glossary.json`). The catalog paper `tags` are a **separate** kebab-style system owned by step 4.10; this step owns the **bridge** from a site tag to it (`plus/cabinet-bridge.json`, Step 4). The tags are agent proposals under standing acceptance (Hard Rule 14): built by these gates, recorded with their evidence, never sent for confirmation.

**Step 0 — Know what a tag does on the live site before choosing one.** The assistant does not search article text. The model sees the catalog of tag **labels** with page counts (`plus/assistant-tags.json`) and picks at most 8 for the dentist's question; it is told to skip a one-page "(1)" label unless it names the case exactly, to prefer the specific label over the umbrella, and to take one of a Persian/English twin. The API then drops a one-page tag whose page is not corroborated, shows at most 4 chips, each bringing pages the others did not, and ranks each chip's first 4 pages (`ARTICLES_PER_MATCH`). Papers appear under a chip **only** through `plus/cabinet-bridge.json` (`tools/build_cabinet_papers.py`). Three consequences: a page tagged with what it merely *mentions* is offered as an answer it does not give; a page whose only tags are umbrellas (`#روکش`, `#ایمپلنت`, `#اکلوژن`) sits at rank 5+ and is invisible in practice; a freshly minted one-page tag is invisible until a second page carries it. Full description: `.dentcast/hashtag-campaign-handoff.md` §1.

**Step 1 — Start from the questions, not from the article.** From the locked text, write **3–5 questions a dentist would type into the assistant that this article answers** — colloquial and formal, Persian and the Finglish/English terms dentists mix in («روکش زیرکونیا رو با چی بچسبونم؟», «abutment کاستوم یا استوک؟»). For each, name the **decision or indication** it asks about. Only then derive the concepts the article **resolves** (tag what it resolves, not what it merely mentions). A چالش page resolves nothing on the page — it carries only its series tag. Golden length **2–3 words**, no junk/generic tags, and the type's series/name tag where the type uses one.

**Step 2 — Resolve each against the library. Reuse before you mint.**
```bash
python3 tools/hashtag_ref.py --simulate "<concept phrase a dentist would type>"   # alias layer: finds the concept under any spelling
grep -n "<word>" dentcast-hashtag-reference.json | head                           # key / definition / aliases of neighbours
```
`--simulate` reproduces the **lexical** path (aliases, spellings); the label the model will see is in `plus/assistant-tags.json` — look there too. If a real concept already covers it → use its **canonical `#tag`** verbatim. **Never invent a second spelling; never write the alias form as the tag; never mint an English twin of an existing Persian concept.** (`--words "<tag>"` shows how the engine tokenizes something; `--backlog <type>` lists brain tags with no reference entry.)

**Step 3 — Composition gate (the list must be able to surface the page).** In priority order: the series/brand tag where the type uses one; **at least one decision tag** — a canonical concept naming the question the page answers (`#اندیکاسیون_روکش`, `#جایگزینی_دندان`, `#اکلوژن_ایمپلنت`, `#زمان_لود_ایمپلنت` are the shape); **at least one specific concept tag with ≤ 10 pages** at publish time (its `count` in the reference, or the "(n)" in `plus/assistant-tags.json`); umbrella tags (> 20 pages) **in addition**, never alone. **The series tag plus only umbrellas is rejected — back to Step 1.** Target density 5–8 tags; a 3-tag list is too thin.

**Step 4 — Mint only what is genuinely new, and only what will recur.** A concept is minted only when **both** hold: (a) no existing concept covers it under any spelling (Step 2), and (b) it is a decision-level concept, or at least one **other existing page truly resolves it** — that page is retagged in the same batch (`articles`), so the concept is born with two pages. An article-specific singleton (a brand name, a one-off finding, a case detail) goes to `keywords`, not `hashtags`. **Script:** Persian canonical by default; a Latin-script canonical only for a concept with no Persian form (acronyms such as `#RBFDP`, `#BOPT`, `#MDP`), never as the twin of a Persian concept — English goes in `aliases`. **Alias checklist, every new concept, four slots:** the English term · the Finglish transliteration dentists type (`سایلن`, `شید`, `تیپر`) · one common misspelling · one colloquial phrase — each filled, or `"none"` stated in the batch `note`. An alias that is a whole word of another concept rewrites that concept: read every `note:` line `--sync` prints and accept it in the batch `note` or avoid the alias.
**Bridge decision, same batch:** for every minted concept decide its paper bridge now — a `map` row in `plus/cabinet-bridge.json` (key = the label lowercased with spaces, i.e. the tag without `#`, `_` → space; 1–4 **existing** library tags from `dentcast_cabinet_full_catalog.json`, closest first, after `tag_aliases`; add the key to `tooth_topics` when the concept is about natural teeth so implant papers rank below), **or** the sentence «no library equivalent» in the batch `note` after actually searching catalog tags, titles and key findings. **A paper attached to this publish is made reachable here** from the page's canonical tags, by module 06 Part 2 step 8's rules (a)/(b)/(c) — the only place its bridge row or library tag is written on a page publish (step 4.10 only recorded its id and DOI). Then `python3 tools/build_cabinet_papers.py && python3 tools/build_cabinet_papers.py --check`.

```jsonc
// .dentcast/hashtag-batches/NNN-<short-name>.json  (NNN = next number in that dir)
{ "type": "<locked-type>",
  "note": "<the 3–5 questions; per tag the resolving sentence (Step 5); alias checklist; bridge decision; --sync notes accepted>",
  "concepts": [{
    "tag": "#<canonical>",                 // 2–3 words, same Persian underscore style as neighbours
    "domain": "clinical | ai | brand",
    "definition": "<what the concept IS>",  // real; never fabricate to fill the field
    "use_when": "<when an article may carry it>",
    "aliases": ["<english term>", "<finglish>", "<misspelling>", "<colloquial phrase>"]
  }],
  "articles": { "<existing content_id that also resolves it>": ["…its full canonical tag list…"] } }
```
```bash
python3 tools/hashtag_ref.py --apply .dentcast/hashtag-batches/NNN-<short-name>.json
```
**The article being published has no brain entry yet** — `--apply` refuses an `articles` key whose `content_id` the brain lacks, so the batch carries **no** row for the new article (only the existing page that corroborates the concept). Its canonical list lands in **step 5** with the brain entry (and the page chips); run Step 6's `--sync`, `node tools/build_plus_index.mjs` and `--check` **after** that brain write.

Rules for a new concept: **only non-canonical spellings go in `aliases`** — an existing canonical `#tag` is **never** filed as another concept's alias; an alias must not equal another concept's word-set or an alias already in use (the compiler reports collisions — heed them). The guard **refuses** any tag lacking a library entry and any door-closing merge/rename — **fix what it flags, never force it** (`allow_lossy` is almost never right).

**Step 5 — Evidence per tag.** For **every** tag except the series/brand tag, quote the one sentence of the article that **resolves** that concept (the decision it takes, the cause it establishes, the option it rules in or out). No resolving sentence → the tag is a mention: drop it. This catches a page tagged for the complication it ruled out, the technique it only named as context, and a question page tagged as if it answered.

**Step 6 — Write canonical tags everywhere, then verify from the question side.** Only canonical `#tag`s reach the brain `hashtags` (step 5) and the visible chips. **Episodes:** `--apply` rewrites the on-page chips from the brain and the runner's `tools/build_episodes.py` regenerates `episodes.html`; **other types:** set the cloned page's chip markup to the canonical list by hand. Then:
```bash
python3 tools/hashtag_ref.py --sync      # recompute counts + compile the alias table into the reference
node tools/build_plus_index.mjs          # mirror tags+aliases into plus/content-index.json + plus/assistant-tags.json (the live API reads these)
python3 tools/hashtag_ref.py --check     # every enforced type carries only canonical tags — MUST pass
python3 tools/build_cabinet_papers.py --check   # bridge rows name real tags and the paper index is current
```
**`build_plus_index.mjs` here is a verification read that happens to write.** Its two outputs — `plus/content-index.json` and `plus/assistant-tags.json` — are the **runner's** C.8 builder outputs (module 11 §8, item 8) and belong to delivery 3; it has no non-writing mode, so run it, finish the reachability test, then **revert both files** (`git checkout -- plus/content-index.json plus/assistant-tags.json`) and stage neither. The runner regenerates them from the committed brain. `--sync`'s edit to `dentcast-hashtag-reference.json` is the agent's own and stays.
**Reachability test — question first, as the model would.** For **each** Step-1 question: read `plus/assistant-tags.json`, choose the ≤ 8 labels the assistant prompt's own rules would pick (no echo of the case's words, specific over umbrella, a "(1)" label only when exact, one of a Persian/English twin), resolve them to pages through `plus/content-index.json` (`tags[].contentIds`, `byContent`), and confirm whether **this page is among the first 4 pages of one of the first 4 chips**. **The gate is «at least one»:** the test passes when the page surfaces for one or more of the questions and fails only when it surfaces for none — then fix the tag list (Steps 1–4 again), never the question. Every question it does not surface for is recorded with its reason, and wanting to pass one more is no licence to mint: Step 4's two conditions still decide (Hard Rule 15). `--simulate` only confirms that a spelling a dentist types reaches the right concept; it is not a test of what the model picks.

**Report:** the 3–5 questions; which concepts **reused** a canonical tag (directly or through an alias) and which were **minted** (tag, definition, use_when, the four alias slots, the corroborating page, the bridge row or «no library equivalent»); the composition gate; the resolving sentence per tag; the two `--check` results; per question the labels chosen and the chip/rank where the page appeared.
<!-- /hashtag-step-5-0:v2 -->

### 5. Brain entry

Use the brain loaded at Phase A (Hard Rule 1). The most recent entry of the LOCKED category is the **schema template**, matched by its `type` field — or, for core podcast episodes, **`"type": "dentcast"`** (keys: `type`, `episode`, `title`, `caption`, `hashtags`, `keywords`, `audio_url`, `page_url`, `pillar`); episode entries without a `type` key are never the template. Where it goes (the end of the whole array, Hard Rule 3) is not what shape it has (the latest same-category entry).

Build the entry with **identical keys, nesting and ordering** (Hard Rule 5), filled from the new content, today's date and the new URL:
- `hashtags` = the canonical list from step 5.0, unchanged (step 5.0 not run → go back and run it).
- `pillar` = the step-2.4 decision, recorded, never re-decided (Hard Rule 6): `primary` (slug or `null`), `secondary` (the previous entries' shape, usually `[]`), `subtopic` (slug for a structured pillar, otherwise `null` — the key is **always present**). No reasoning, notes or extra fields.
- **Episode entries carry `"type": "dentcast"` and a filled `audio_url`** (the ArvanCloud URL — `tools/update-homepage-counters.py` and the `index.html` hero take the newest entry with `audio_url`). Copy the latest `dentcast` entry's key set; never a `type: "episode"`.

<!-- insight-keywords:v1 -->
**Insight `keywords`.** For an insight entry (brain `type` `clinical`) write 5 to 8 keywords, each a short phrase taken from the article's own text, mostly Persian; an English term only where dentists write it that way. A keyword does not repeat a hashtag. They are agent proposals under standing acceptance (Hard Rule 14), recorded and listed in the agent's Push-2 report.
<!-- /insight-keywords:v1 -->

Append the entry at the end of the array (Hard Rule 3). Phase F row `5 brain` verifies the tail position, the key-set parity, the episode `type`/`audio_url` and stale data.

### 5.5. Verify the recorded pillar & subtopic

Nothing is decided here (Hard Rule 6). Phase F row `2.4 pillar` verifies `pillar.primary`/`subtopic` against the live `PILLARS`, the `subtopic` key and no extra keys; this step records only a NEW subtopic's addition to `tools/build_pillar.py` (if step 2.4 had one) and that the step-2.5 capsule matches `pillar.primary`.

### 5.6. Learning-pathway placement (all specialist types)

**MANDATORY on every publish that wrote a specialist brain entry** — every type except LiteCast (patient-facing, a documented skip) and a چالش (module 09). It runs after steps 5 and 5.5 because placement consumes the `content_id` and the pillar.

**Principle — pathways are INDEPENDENT of pillars.** A **pillar** is where the item *lives* (one home, step 2.4, not revisited). A **pathway** is a curated **learning journey** — *"what must a person know to learn topic X, and in what order?"* — and the **same item often belongs to several**, at the right position in each. Placement is decided purely on **conceptual relevance to each pathway's own content / the learner's need** (semantic, Hard Rule 14), never by the item's pillar or subtopic: a `bonding` item can join esthetics, ceramics, fixed-pros and biomimetic at once; an `occlusion` item the implant and prosthetics pathways. The tool prints the pillar as FYI only.

The catalog and doctrine live in `plus/pathways.json` and `reports/pathways-catalog-2026-07-22.md`; **read the catalog before placing.** `plus/pathways.json` is the single source of truth (spec §5: each pathway is `{id, title_fa, description_fa, premium, steps:[{content_id, milestone}], reserved}`; `content_id` = page path without leading `/` and `.html`).

**Procedure.**

1. Generate ranked candidates (an aid, not the decision):
   ```bash
   python3 tools/pathway_place.py <content_id>
   ```
   Per pathway it prints a score, a **confidence flag** and a **suggested anchor** (`after <existing content_id>`) so the item lands *inside the right conceptual block*, prerequisite → advanced. It scores only **conceptual overlap with that pathway's own content** and marks **STRONG** only for a real conceptual **cluster** (several related steps + a close neighbour); everything thinner is **ASK**.

   **Three guards decide what the tool may call STRONG and where it may anchor — none of them is yours to relax:**
   - **STRONG is measured against the pathway's frozen CORE** (`.dentcast/pathway-core.json`, its steps as the founder last curated them), never its live list — otherwise each placement would raise the next similar item's score. A pathway with no frozen core is never STRONG. `--freeze-core` re-freezes every full pathway and is run **only after a founder curation pass**, never after a publish.
   - **A third pathway is never the agent's.** An item already in two full pathways is never placed in a third by the agent (standing default: not placed, reported); `--insert` refuses a third without `--confirmed`, which records the founder's own yes to *that* placement. Bundles are outside this count (5.6-ب).
   - **The anchor never splits a series.** Consecutive podcast episodes (an episode and its NoteCast are one unit), chapter-style ids (`prompt6-1 → prompt6-4`) and consecutive «قسمت/بخش N» titles with one stem are one run; the suggested anchor is the run's **last** step, and `--insert --after` a step inside a run is refused without `--confirmed`.
   The scorer also ignores brand/series hashtags (`domain: brand|web`) and corpus-generic words (`دندان`, `ایمپلنت`, `روکش`… — anything in >10% of entries).
2. Decide membership semantically, by standing acceptance (Hard Rule 14):
   - **STRONG / unmistakable homes** (a new adhesion/bonding piece into every bonded-restoration pathway, a new screw-loosening piece into the implant-prosthetic and failure pathways): **place them** and record pathway + anchor + milestone flag.
   - **Borderline / cross-cutting** (a plausible but not obvious fit, a theme with no clear home, uncertainty about the position) and **any third full pathway**: **not placed** — the default is conservative, because pathways are live UI for real subscribers. Record each candidate with its reason in the agent's Push-2 report; the founder may ask for the placement afterwards. Use the tool's suggested anchor; never `--confirmed` on your own.
   - An item routinely belongs to **several** pathways; place it in each strong one.
3. Apply each placement mechanically (the only writer of `plus/pathways.json`; it refuses duplicates, LiteCast, a third full pathway and an anchor inside a series — the last two only without `--confirmed`):
   ```bash
   python3 tools/pathway_place.py --insert <content_id> --pathway <id> --after <anchor_id> [--milestone] [--confirmed]
   # or --at-end instead of --after <anchor_id>
   # or --at-start, when the item is the new FIRST step (a foundation the rest builds on;
   #   تراز شواهد قسمت ۱ opening evidence-literacy is the precedent) — never on a bundle's finish
   ```
   **A تراز شواهد part (`taraz/`) is never a scoring question for `evidence-literacy`: it is a required step there**, placed `--after` the part before it so the series keeps its order; other pathways go through the ordinary judgment. Phase F enforces both membership and order (`5.6 pathway`). `--milestone` only when the item becomes the new end of its conceptual block (rare).
4. Coverage:
   ```bash
   python3 tools/pathway_place.py --coverage
   ```
   The new `content_id` is in **≥1** pathway, or the report says explicitly why not (a meta/equipment/orphan piece, or only borderline candidates). Report every pathway joined and where, and the `full pathways: … per item` line — the curated baseline is **1.38**; say so if it moves.

**Scope.** This step edits **only** `plus/pathways.json` — no builder, no version stamp, no brain field (Hard Rule 5), no page or link change.

**Pathways are LIVE — this edit is user-visible, it is not staging.** `/plus/pathways.html`, `/plus/pathway.html?id=` and the «مسیر یادگیری» block of `/plus/` render this file, and `GET /me`'s `active_pathway` reads through it. It needs **no API redeploy**: `plus-api/src/content-refresh.ts` re-fetches the published `plus/pathways.json` every few minutes (validated, upgrade-only, last-good copy on failure). So a wrong placement is visible to real subscribers, and the file must be valid JSON at commit time (`python3 -m json.tool plus/pathways.json > /dev/null`).

**Then run step 4.12-ب** (`modules/07-flashcards-and-quiz.md`, message M2) now that full-pathway membership is known: write its exam questions if the page landed in at least one full pathway, otherwise record the skip — either way in the evidence of **C.5.6**.

### 5.6-ب. Bundle check (runs after every full-pathway placement)

Beside the 15 full pathways, `plus/pathways.json` carries **starter bundles** (`kind: "bundle"`, 5–8-step "just the core" subsets of a pathway; catalog + doctrine in `.dentcast/bundles-handoff.md`). After the full-pathway placements, run this **gate chain**: every gate is a yes/no question answerable from the item's folder, title and the bundle's current step list alone — no taste. **The default is NO.** An item enters a bundle ONLY when every gate passes with a confident yes; any uncertain answer is **«رد شد»** with the uncertainty named, reported (the founder may add it later). Silently adding is never right.

**Candidates.** Only bundles whose `continues_pathway` is a full pathway the item just joined in 5.6. Zero candidates → «باندل: بدون کاندید» in the report.

**The gates — walk them in order, stop at the first NO:**

1. **GATE ۱ — Type (mechanical).** The item's folder is `episodes/`, `notecast/`, `sharehub/` or `dentai/`. Anything else — `insight/`, `chairside/`, `metanotes/`, `photocast/`, `dentcast-plus/`, `litecast/` — is **NO, always** (by construction نکته/کیس/جستار, exactly what a bundle excludes).
2. **GATE ۲ — Shape (from the title alone).** The title names a whole concept a beginner must learn (اصول X، طبقه‌بندی X، راهنمای جامع X، مقدمه‌ای بر X، انتخاب X، «X — قسمت اول»). **NO** if it describes one situation or patient («وقتی…», «چرا برای این بیمار…», «بیمار با…»), a trick/pearl (راهکار، ترفند، نکته), an exception or complication, or a deep continuation («قسمت سوم» of a series whose قسمت اول is not in the bundle).
3. **GATE ۳ — Coverage (against the bundle's current steps).** The item covers a core sub-topic that **no existing step covers** (a beginner finishing the bundle today would have a hole there). Depth, detail or an update to a represented concept is **NO** — its home is the full pathway. A likely **better replacement** for an existing step is never automatic: «رد شد», reported as a replacement candidate.
4. **GATE ۴ — Twin (mechanical).** The bundle already holds this item's twin — the episode of this notecast, the notecast of this episode, any same-numbered sibling — **NO** (قانون «یک مفهوم = یک قدم»).
5. **GATE ۵ — Size (mechanical).** After insertion the bundle has **≤ 8 steps**. 9 or more → «رد شد» (something would have to leave first, and removal is founder-only).

**If all five gates pass — insert, with two hard mechanics:**

- Anchor semantically and insert **mid-list only**:
  ```bash
  python3 tools/pathway_place.py --insert <content_id> --pathway <bundle-id> --after <anchor_id>
  ```
  `<anchor_id>` is the step the item most directly follows. **Never `--at-end` on a bundle, never after the current final step**: the final step carries `milestone: true` (the finish flag 🏁) and appending would strand it mid-list. If the only right position is the very end → «رد شد», reported.
- **Sweep the hand-maintained mirror in the same commit** (a bundle edit that skips it ships a lie): the bundle's step count in `plus/js/home-bundles.js`'s `BUNDLES` array, then `python3 tools/asset_version.py --bump`.

**Report — mandatory either way.** Every candidate bundle gets exactly one verdict: «وارد شد (بعد از کدام قدم)» or «رد شد (گیت N)» / «رد شد (نامطمئن: …)». Silence about a candidate is a workflow violation — a NO is as visible as a YES.
