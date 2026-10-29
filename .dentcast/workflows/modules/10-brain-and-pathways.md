<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision; this repeated reference never requires a reread. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: C.5.0, C.5, C.5.5, C.5.6, C.5.6-b. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
> **Fixed page deliveries:** after `C.4.9`, then after `C.6` for new v2 editorial-locked publications (legacy v1-only publications keep `C.4.13`), then after actual Phase F + report G. Cuts 1/2 deliver work plus handoff; cut 3 delivers final work, completion receipt and handoff deletion together. All intermediate checkpoints stay local; no extra turn-end or cleanup push.

> **v2 cut-2 readiness:** Complete canonical tag, metadata, pathway and bundle decisions here before the C.6 editorial lock and second Push. No judgment work moves behind Push 2.

<!-- /dentcast-checkpoint-protocol:v1 -->

<!-- hashtag-step-5-0:v2 -->
### 5.0. Hashtag standardization against the reference library (Hard Rule 15)

The entry's `hashtags` are a **standardized vocabulary** governed by `dentcast-hashtag-reference.json` — the canonical library the AI case-assistant reads (mirrored into `plus/content-index.json` and `plus/assistant-tags.json` by `tools/build_plus_index.mjs`; the live API reloads them). Settle the **final canonical hashtag list here**, before it is consumed by the brain write (step 5) and the page's visible chips. This runs on **every publish that writes a brain entry** — LiteCast included (its brain is `litecast/lite-glossary.json`; run the same discipline against the library). The `dentcast_cabinet_full_catalog.json` paper `tags` are a **separate** kebab-style system owned by step 4.10; what *this* step owns on the paper side is the **bridge** from a site tag to that system (`plus/cabinet-bridge.json`, Step 4 below).

**Step 0 — Know what a tag does on the live site before choosing one.** The assistant does not search article text. The model is shown the catalog of real tag **labels** with page counts (`plus/assistant-tags.json`) and picks at most 8 labels for the dentist's question; it is told to skip a one-page "(1)" label unless it names the case exactly, to prefer the specific label over the umbrella, and to take one of a Persian/English twin. The API then drops a one-page tag whose page is not corroborated, shows at most 4 chips, each bringing pages the others did not, and ranks each chip's first 4 pages (`ARTICLES_PER_MATCH`). Papers appear under a chip **only** through `plus/cabinet-bridge.json` (`tools/build_cabinet_papers.py`). Three consequences this step is built around: a page tagged with what it merely *mentions* is offered as an answer it does not give; a page whose only tags are umbrellas (`#روکش`, `#ایمپلنت`, `#اکلوژن`) sits at rank 5+ and is invisible in practice; a freshly minted one-page tag is invisible until a second page carries it. Full description: `.dentcast/hashtag-campaign-handoff.md` §1.

**Step 1 — Start from the questions, not from the article.** From the confirmed text, write **3–5 questions a dentist would type into the assistant that this article answers** — colloquial and formal, Persian and the Finglish/English terms dentists mix in («روکش زیرکونیا رو با چی بچسبونم؟», «abutment کاستوم یا استوک؟»). For each, name the **decision or indication** it asks about. Only then derive the concepts the article **resolves** (Rule: tag what it resolves, not what it merely mentions). A چالش page (Question 4.9) resolves nothing on the page — it carries only its series tag. Golden length **2–3 words**, no junk/generic tags, and include the type's series/name tag where the type uses one. These are concepts to look up, not final tags yet, and they remain proposals under Hard Rule 13 (shown to the user with the questions).

**Step 2 — Resolve each against the library. Reuse before you mint.**
```bash
python3 tools/hashtag_ref.py --simulate "<concept phrase a dentist would type>"   # alias layer: finds the concept under any spelling
grep -n "<word>" dentcast-hashtag-reference.json | head                           # key / definition / aliases of neighbours
```
`--simulate` reproduces the **lexical** path (aliases, spellings); the label the model will see is in `plus/assistant-tags.json` — look there too. If a real concept already covers it → use that **canonical `#tag`** verbatim on the article. **Never invent a second spelling; never write the alias form as the tag; never mint an English twin of an existing Persian concept** (Hard Rule 15). (`--words "<tag>"` shows how the engine tokenizes something; `--backlog <type>` lists brain tags with no reference entry.)

**Step 3 — Composition gate (the list must be able to surface the page).** The final list contains, in this order of priority: the series/brand tag where the type uses one; **at least one decision tag** — a canonical concept that names the question the page answers (`#اندیکاسیون_روکش`, `#جایگزینی_دندان`, `#اکلوژن_ایمپلنت`, `#زمان_لود_ایمپلنت` are the shape); **at least one specific concept tag with ≤ 10 pages** at the time of publish (its `count` in the reference, or the "(n)" in `plus/assistant-tags.json`); umbrella tags (> 20 pages) are allowed **in addition**, never alone. **A list made of the series tag plus only umbrellas is rejected — go back to Step 1.** The type's density precedent is 5–8 tags; a 3-tag list is the historical failure mode of episodes, not a target.

**Step 4 — Mint only what is genuinely new, and only what will recur.** A concept the library truly lacks is minted only when **both** hold: (a) no existing concept covers it under any spelling (Step 2), and (b) it is a decision-level concept, or at least one **other existing page truly resolves it** — then that page is retagged in the same batch (`articles`), so the concept is born with two pages and the engine can show it. An article-specific singleton (a brand name, a one-off finding, a case detail) goes to the entry's `keywords`, not to `hashtags`. **Script:** Persian canonical by default; a Latin-script canonical only for a concept dentists have no Persian form for (acronyms such as `#RBFDP`, `#BOPT`, `#MDP`), and never as the twin of a Persian concept — English goes in `aliases`. **Alias checklist, every new concept, four slots:** the English term · the Finglish transliteration dentists type (`سایلن`, `شید`, `تیپر`) · one common misspelling · one colloquial phrase — each slot filled, or `"none"` stated in the batch `note`. An alias that is a whole word of another concept rewrites that concept: read every `note:` line `--sync` prints and either accept it in the batch `note` or avoid the alias.
**Bridge decision, same batch:** for every minted concept decide its paper bridge now — a `map` row in `plus/cabinet-bridge.json` (key = the label lowercased with spaces, i.e. the tag without `#`, `_` → space; 1–4 **existing** library tags from `dentcast_cabinet_full_catalog.json`, closest first, after `tag_aliases`; add the key to `tooth_topics` when the concept is about natural teeth so implant papers rank below), **or** the sentence «no library equivalent» in the batch `note` after actually searching catalog tags, titles and key findings. Never invent a library tag here (step 4.10 Part 2 owns the catalog); if a catalog paper is plainly about the concept but lacks the library tag the row names, that is a 4.10 Part 2 step 8 edit — do it there, in the same commit. Then `python3 tools/build_cabinet_papers.py && python3 tools/build_cabinet_papers.py --check`.

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
**The article being published has no brain entry yet** — step 5.0 runs before step 5, and `--apply` refuses an `articles` key whose `content_id` the brain lacks. So for the new article itself the batch carries **no** `articles` row (only the other, existing page that corroborates the concept). Its canonical tag list lands in **step 5**, written with the brain entry (and the page chips); run Step 6's `--sync`, `node tools/build_plus_index.mjs` and `--check` **after** that brain write.

Rules for a new concept: **only non-canonical spellings go in `aliases`** — an existing canonical `#tag` is **never** filed as another concept's alias (Hard Rule 15); an alias must not equal another concept's word-set or an alias already in use (the compiler reports collisions — heed them). The guard **refuses** any tag lacking a library entry and any door-closing merge/rename — **fix what it flags, never force it** (`allow_lossy` is almost never right).

**Step 5 — Evidence per tag.** For **every** tag except the series/brand tag, quote in the report the one sentence of the article that **resolves** that concept (the decision it takes, the cause it establishes, the option it rules in or out). If no sentence resolves it, the tag is a mention — drop it. This is the check that catches the three failures the QA found: a page tagged for the complication it ruled out, for the technique it only named as context, and a question page tagged as if it answered.

**Step 6 — Write canonical tags everywhere, then verify from the question side.** Only canonical `#tag`s reach the brain `hashtags` (step 5) and the page's visible chips. **For episodes**, `--apply` rewrites the on-page chips from the brain and `tools/build_episodes.py` (step 8) regenerates `episodes.html`; **for other types**, set the cloned page's chip markup to the canonical list by hand so page and brain agree. Then:
```bash
python3 tools/hashtag_ref.py --sync      # recompute counts + compile the alias table into the reference
node tools/build_plus_index.mjs          # mirror tags+aliases into plus/content-index.json + plus/assistant-tags.json (the live API reads these)
python3 tools/hashtag_ref.py --check     # every enforced type carries only canonical tags — MUST pass
python3 tools/build_cabinet_papers.py --check   # bridge rows name real tags and the paper index is current
```
**Reachability test — question first, as the model would.** For **each** Step-1 question: read `plus/assistant-tags.json`, choose the ≤ 8 labels the assistant prompt's own rules would pick for that question (no echo of the case's words, specific over umbrella, a "(1)" label only when exact, one of a Persian/English twin), resolve them to pages through `plus/content-index.json` (`tags[].contentIds`, `byContent`), and confirm **this page is among the first 4 pages of one of the first 4 chips**. Record the labels chosen per question in the report. If the page does not surface for any question, the fix is the tag list (Steps 1–4 again), never the question. `--simulate` stays for one thing only — confirming that a spelling or alias a dentist types reaches the right concept — it is not a test of what the live model picks.

**Report:** the 3–5 questions; which proposed concepts **reused** an existing canonical tag (directly or through an alias), which were **newly minted** (tag, definition, use_when, the four alias slots, the corroborating page retagged, the bridge row or «no library equivalent»); the composition gate (series · decision tag · specific tag ≤ 10 pages · umbrellas); the resolving sentence per tag; the `--check` and `build_cabinet_papers.py --check` results; and per question the labels chosen and the chip/rank at which the page appeared. (`build_plus_index.mjs` also runs in step 8's rebuild list — running it here too is idempotent and keeps the live index current immediately.)
<!-- /hashtag-step-5-0:v2 -->

### 5. Brain entry

`dentcast-brain.json` is a **single flat array of all entries — there are no per-type sections.** Read it. Find the most recent entry of the LOCKED category and use it as the **schema template**.

**The `hashtags` field is the canonical list resolved in step 5.0 (Hard Rule 15) — do not re-invent or re-spell tags here.** Every tag written must already be a canonical concept in `dentcast-hashtag-reference.json`; if step 5.0 was skipped, go back and run it before writing this entry.

**Schema templating stays category-locked, even though physical placement does not.** Match the locked category by its `type` field — or, for the core podcast episodes, by **`"type": "dentcast"`**, the shape every episode has carried since 154 (latest, 159.1–162: `type`, `episode`, `title`, `caption`, `hashtags`, `keywords`, `audio_url`, `page_url`, `pillar`). The 202 older episode entries have no `type` key; never use one as the template. Don't confuse "where to put it" (end of the whole array) with "what shape to give it" (the most recent same-category entry).

Build the new entry with **identical keys, nesting, and ordering** as the previous same-category entry. Fill all fields based on new content + today's date + new URL — including the entire `pillar` object, using the values **confirmed in step 2.4**: `pillar.primary` (the confirmed pillar slug, or `null` if the user chose no pillar), `pillar.secondary` (matches previous entries' shape — usually `[]`), and `pillar.subtopic` (the confirmed subtopic slug for a structured pillar, otherwise `null`). The `subtopic` key is **always present** under `pillar` (that is the brain's convention — never omit it). Do **not** re-decide the pillar or subtopic here — just record exactly what step 2.4 confirmed; step 5.5 then verifies it.

**Critical constraints:**
- Do NOT add any field that doesn't exist on the previous same-category entry.
- Do NOT remove any field that exists on the previous entry — every key must be present.
- **Episode entries carry `"type": "dentcast"` and a filled `audio_url`** (the episode's ArvanCloud URL — `tools/update-homepage-counters.py` and the `index.html` hero take the newest entry with `audio_url`). When the user picks "Episode", copy the latest `dentcast` entry's key set. Do NOT invent a `type: "episode"` field.
- If the category's schema has a `pillar` field, fill it with the assigned pillar value only. Do NOT add reasoning, notes, justifications, or any extra commentary field. The JSON shape must remain identical to the previous entry.

<!-- insight-keywords:v1 -->
**Insight `keywords` (founder, 1405/08/07).** For an insight entry (brain `type`
`clinical`) propose 5 to 8 keywords, each a short phrase taken from the article's
own text, mostly Persian; an English term only where dentists write it that way.
A keyword does not repeat a hashtag. They are proposals until the founder
confirms them (Hard Rule 1).
<!-- /insight-keywords:v1 -->

**Append the new entry at the absolute END of the flat `dentcast-brain.json` array** — it becomes the last element of the whole file, regardless of type. This is non-negotiable — the latest-content widget reads the last 30 entries globally, so physical tail position is what makes the new entry visible.

Re-read the file and confirm:
- Entry is the **last element of the array**.
- It has exactly the same set of keys as the previous same-category entry — no extras, no missing.
- For episode entries: confirm **`type` is `"dentcast"` and `audio_url` is filled**.
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

**Then run step 4.12-ب** (`modules/07-flashcards-and-quiz.md`) now that this
page's full-pathway membership is known: write its exam questions if it landed
in at least one full pathway, otherwise record the skip — either way in the
evidence of **C.5.6**.

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
