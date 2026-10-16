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
