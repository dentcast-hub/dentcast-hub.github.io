# Hashtag review campaign — handoff

Read this before touching hashtags. It is the whole context of the campaign in
one file.

---

## 1. Why this exists

The site's «دستیار هوشمند» does **not** do semantic search. Read
`plus-api/src/services/case-assistant.ts` before anything else. The pipeline is:

1. The user's free text goes to `suggestKeywords`. Its prompt
   (`plus-api/src/providers/ai/openai-compatible.ts:25`) asks for **at most 4
   short Persian phrases, 1–3 words each**.
2. The model then has **no further say in which content is found**. Plain code
   matches those phrases against every real site hashtag.
3. A tag scores **the fraction of ITS OWN words** present among the suggested
   words. Threshold `0.5`.
4. Ties break by `specificityWeight` — the **sum** of the tag's words' IDF over
   the tag corpus — then by fewest articles.
5. `dedupeByContentCoverage` keeps only tags bringing a **new** content_id, up
   to a pool of 10. `narrowCase` then picks 4 of those to show the user.

**Consequence that drives every decision here:** a concept is reachable only
through the literal WORDS of some tag. "Semantic" in the embedding sense does
nothing. If the words don't overlap, the article is invisible.

Root cause of the mess: nothing in `.dentcast/workflows/README.md` ever checked
a proposed tag against the vocabulary already in use, so every publish invented
tags from scratch. 985 of 1304 tags were used exactly once.

---

## 2. What was built

**`dentcast-hashtag-reference.json`** (repo root) — the canonical vocabulary.
The reference owns the **vocabulary** (which forms are legal, what each means);
`dentcast-brain.json` keeps owning the **assignment** (which article carries
which tag). `count`/`content_ids` are derived — never hand-edit them.

Each concept:

```json
{
 "tag": "#بیومیمتیک",
 "domain": "clinical",           // clinical | ai | brand
 "definition": "...",            // what the concept IS
 "use_when": "...",              // when an article may carry it
 "aliases": ["بایو میمتیک", "بایومیمتیک"],
 "variants": ["#دead_form"],     // merged-away forms, recorded
 "co_tags": ["#Biomimetic"],     // forms deliberately carried TOGETHER
 "count": 51, "content_ids": [...]
}
```

**`tools/hashtag_ref.py`** — carries a faithful port of the engine's
`normalizeFa()`/`words()`, so the tooling never lies about what will match.

```
--seed                 build the file (already done)
--sync                 recompute counts/backlinks + compile the alias table
--check                fail if an enforced type carries a non-canonical tag
--backlog TYPE         tags in the brain with no reference entry
--words TAG            show how the engine tokenizes something
--simulate QUERY       rank the real tags for a query, as the engine does
--say TAG FORM...      record other spellings for one concept
--apply BATCH          run one reviewed batch file
```

**Two measurement harnesses — run BOTH, either alone misleads:**

- `tools/rank_experiment.py` — phrases every query with a tag's own words. Sees
  only the **cost** of folding vocabulary together.
- `tools/alias_benefit.py` — phrases every query with an **alternative
  spelling**. Sees only the **benefit**.

**`.dentcast/hashtag-batches/*.json`** — 49 batch files, one per campaign step,
each re-runnable. This is the audit trail.

---

## 3. The three mechanisms (do not confuse them)

| | when | effect |
|---|---|---|
| `variants` | old form **shares words** with the canonical | merged away; no door lost |
| `co_tags` | two forms **share no words**, both real | both carried on the same articles |
| `aliases` | same word, different spelling/script | folded before tokenizing; ONE tag serves all spellings, IDF untouched |

The alias table is compiled from concept-level `aliases` by `--sync` into the
file's top-level `aliases`, mirrored into `plus/content-index.json` by
`tools/build_plus_index.mjs`, and read by `case-assistant.ts`. **Adding a
spelling is a data edit, never a code change.**

Substitution is whole-token and single-pass. Both properties are load-bearing:
partial matching would maul "بیمار سیگاری" into "بیمار دخانیاتی", and repeated
replacement hangs forever on a self-referential alias
("پروگنوز" → "پروگنوز دندان"). Self-referential aliases are rejected in the
compiler and again at point of use.

---

## 4. Rules — these were all learned the hard way

1. **Two articles per step.** Read both in full. This was violated for
   chairside/dentai/notecast and the author called it: «حجم کامل برداری
   خرابکاری میشه».
2. **Tag what the article RESOLVES, not what it mentions.** photocast-1 names
   furcation only to rule it out — tagging it would surface the article for
   every furcation question it cannot answer.
3. **Never close a door.** `--apply` refuses any rename where the old form
   would no longer reach the canonical. Fix by adding an alias, not by forcing
   the merge. `allow_lossy: true` exists but is almost never right.
4. **Golden length is 2–3 words.** The query side emits ≤4 phrases of 1–3 words,
   so a 5-word tag effectively never fires. Confirmed empirically: no tag used
   twice on the site is longer than 3 words.
5. **Every tag must have a reference entry before it reaches the brain.**
   `--apply` enforces this. It has rejected the author's own batches repeatedly.
6. **Verify with `--simulate`, don't trust judgement.** Then run both harnesses.
7. **Never invent a form when the site already has one.** Search first.
8. Definitions must be real. Do not fabricate one to fill the field — leave it
   empty and let the folder's turn fill it.

---

## 5. Failure modes already found (watch for them again)

- **Glued tokens.** `#دندان۶` → one token `دندان۶`; "دندان ۶" → two. Zero
  overlap, tag unreachable. Same for 88 CamelCase tags (`#EmergenceProfile`).
- **Same word, different order.** `#پروفایل_امرجنس` / `#امرجنس_پروفایل` are
  identical to the matcher yet were two entries burning two of ten pool slots.
- **Spelling families as separate tokens.** بایومیمتیک/بیومیمتیک,
  براکسیسم/بروکسیسم, لامینیت/لمینیت, پارسیل/پارشیال, مرجین/مارژین/مارجین.
- **English-only tag sets on a Persian site.** Both VDO episodes carried no
  Persian door at all.
- **Copy-pasted tags.** `#بیومیمتیک_غیرمستقیم` sat on a drug-interaction note.
- **Identical tag lists on different articles.** episodes 157/158 shared all 28.
- **Series tags missing.** notecast had none; chairside had them on 5 of 27;
  insight had none.
- **Episode page chips desync.** `build_episodes.py` regenerates only
  `episodes.html`; per-episode pages carry chips as literal markup.
  `--apply` rewrites them — do not hand-edit.

---

## 6. Where things stand

**Locked (`enforced_types`), 209 articles:** photocast 3 · dentcast_plus 6 ·
dentcast 8 · promptologist 10 · sharehub 11 · meta 19 · chairside 27 ·
dentai 28 · notecast 37 · clinical(insight) 60

**Skipped by the author:** litecast 19 — «تو سایت تخصصی مهم نیستن، بعداً
مستقل استانداردشون میکنم».

**Remaining: `episodes` — 202 articles**, files `episodes/episode-*.html`, brain
entries have **no `type` field** (that is how they are identified). This folder
has the site's **lowest tag density, ~3.0 per article against ~7 elsewhere**, so
it holds the largest remaining gain. Note episodes 154–160 carry
`type: "dentcast"` and are already done.

| metric | start | now |
|---|---|---|
| unique tags | 1304 | 905 |
| single-use tags | 985 | 531 |
| canonical concepts | 0 | 775 |
| aliases | 0 | 1241 |
| reachable via alternative spelling | — | 381/381 (256 without the layer) |
| rank-1 | 94.9% | 92.6% |
| articles offered per query | 62.3 | 81.7 |

rank-1 dipped because aliases fold vocabulary together; `alias_benefit.py` is
what weighs against it. Articles-offered rising 31% is the headline.

---

## 7. Two open items

1. **The TypeScript is unbuilt.** `plus-api` has no `node_modules` in the work
   container, so `tsc` never ran. The alias layer in `case-assistant.ts`
   (`getAliases()` + the fold inside `normalizeFa`) plus `getAliases()` in
   `content-index.ts` need a typecheck and an API redeploy. **Until then the
   alias layer works only in the simulator, not on the live site.**
2. **chairside, dentai and notecast were done in bulk**, not two at a time.
   They deserve a re-review at the agreed pace before the campaign is called
   finished.

---

## 8. How to continue

```bash
python3 tools/hashtag_ref.py --backlog episodes | head        # what is left
```

Per step, for episodes N and N+1:

1. Read both pages in full — body text, not just the caption.
2. Ask what each article **resolves**. Search the reference for an existing
   form before inventing one.
3. Write `.dentcast/hashtag-batches/0NN-episodes-N-N1.json` with `concepts`
   (each with `aliases` from the start), `articles`, and `renames` if needed.
4. `python3 tools/hashtag_ref.py --apply .dentcast/hashtag-batches/0NN-...json`
5. Fix whatever the guard rejects — it is usually right.
6. `--simulate` a question a dentist would actually type at those articles.
7. `node tools/build_plus_index.mjs` and `python3 tools/build_episodes.py`
   (episodes only), then commit.

Add `"enforce": true` to the final batch of the type. Run both harnesses at the
end and compare against the table in §6.
