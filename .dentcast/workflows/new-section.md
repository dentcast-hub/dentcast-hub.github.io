# Adding a new content SECTION (and, if it needs one, a new PILLAR)

> **Why this file exists.** Until 2026-09-07 the list of generators that must
> learn about a new section was written down **nowhere**. It had to be
> rediscovered by reading the tree. The cost of that gap is measurable and was
> paid by **پرامپتولوژیست**, published under `/dentai/promptologist/` without
> ever being registered as a section in the places that decide what a section
> *is*:
>
> * it had **no pillar**, so all 19 parts were filed `digital`/`ai` — where they
>   made up **half of the entire digital pillar** and **19 of the 23 items** in
>   its هوشِ مصنوعی subtopic, burying the four genuine clinical-AI items;
> * `tools/build_pillar.py` had no `promptologist` key in either type map, so
>   `detect_type()` fell through to the `/dentai/` URL prefix and every row on
>   the topical index rendered as **«دنت‌AI»** with the robot icon;
> * `tools/build_plus_index.mjs`'s `countArticles()` assumed key == top folder,
>   so the 19 pages were counted nowhere and the section was **absent from the
>   Plus dashboard tree entirely**;
> * `.github/scripts/gen_sitemap.py`'s 0.9 rule anchors on one path segment, so
>   the series landing page scored **0.7** — alone among every section landing
>   page on the site;
> * `.github/scripts/inject_hub_og.py`'s `HUBS` list never named it, so the
>   landing page carried **zero Open Graph tags** and sharing it produced no
>   card at all.
>
> None of that was visible from the section's own folder. All of it is one
> checklist away. **Work this file top to bottom; do not improvise the order.**

Scope: a new top-level content section (`/{slug}/`), with or without a new
pillar. **Publishing a part** into an existing section is
`.dentcast/workflows/README.md`, not this file.

---

## Phase 0 — decide before editing anything

Six values. Write them down; they are typed into ~12 files and any drift
between them is a silent bug.

| Value | Shape | Example |
|---|---|---|
| folder slug | kebab, root-level | `plak-sefr` |
| brain `type` | snake | `plak_sefr` |
| part id format | `<series><chapter>-<part>` | `plak1-1` → `/plak-sefr/plak1-1.html` |
| Persian label | ONE string, byte-identical everywhere | `پلاک صفر` |
| icons | three of them, see below | |
| pillar | existing slug, or a new one (Phase 2) | `practice-infrastructure` |

**Three different icons, three different registries** — this trips people:

* a **sprite symbol id** from `assets/icons/icons.svg` for `build_pillar.py`'s
  `TYPE_META` (`svg_icon()` raises `KeyError` if absent — it never guesses);
* a **`dcSvgIcon` key** from the inline set at the top of `dc-nav.js` for the
  hamburger drawer;
* an **emoji** for `plus/js/collections.js`'s `TYPE_ICON`.

Pick a sprite icon that agrees with what `global-search.js` already draws for
the type, if anything does. (پرامپتولوژیست got `icon-sparkle` because
`global-search.js` had been drawing it with `_iSpark` all along.)

**The slug/type hyphen-vs-underscore split is the house convention**, not an
accident: `dentcast-plus` (folder) ↔ `dentcast_plus` (brain type).

---

## Phase 1 — data

1. **`dentcast-brain.json`** — entries carry `type` and a `pillar` object.
   Append at the **end of the array** (Hard Rule 4; the homepage widget reads
   the tail). Never add or drop a field relative to same-category entries
   (Hard Rule 6).
2. **`plus/pathways.json`** — only if the section joins a learning pathway
   (publishing-workflow step 5.6). A pathway is not a pillar view: the same
   item may sit in several.

Edit both **in place and byte-identical** — no `json.dump` round-trip, which
reflows the whole file and loses the ZWNJ/escape style. Verify each with
`python3 -c "import json; json.load(open('<file>'))"` immediately after.

---

## Phase 2 — a new pillar (skip if reusing one)

All five edits are in **`tools/build_pillar.py`**, and all five are required —
the first alone builds a page with no colour anywhere.

1. **`PILLARS`** — an entry with the same 8 keys every other pillar has
   (`title_fa`, `icon`, `subtitle_fa_short`, `page_title`, `meta_description`,
   `h1_fa`, `subtitle_fa`, `intro_paragraphs`, `subtopics`). Everything
   downstream — the `/pillar/` hub card, `pillar/structure.json`, the JSON-LD,
   the new directory — is generated from this. **Never hand-write a pillar
   page or hand-edit a `structure.json`.**
2. **`PILLAR_ACCENT_RGB`** — an `(light, dark)` rgb-triple pair.
3. **hub-card CSS** — 12 rules (6 light, 6 dark), cloned from the `digital`
   block: `border-color`, `:hover`, `.pillar-card-icon`, `.pillar-card-name`,
   `.subtopic-chip`, `.pillar-card-arrow`.
4. **`.pillar-subtopic-intro`** — one light + one dark rule.
5. **`.pillar-header-icon`** — one light + one dark rule.

**Colour constraints, in order of hardness.** Amber is **forbidden** — it means
«this is what a subscription buys» site-wide. Brand blue is forbidden — it
would not read as an accent at all. Beyond those, the eleven existing accents
already cover most of the wheel at this saturation, so check the new hue's
angle against its two nearest neighbours before committing.

**Declare only subtopics that have content.** An empty subtopic is invisible on
the public page (that page is one flat date-ordered list; the foldering ships
beside it in `structure.json`) but renders a **«(۰)» card in the premium
arrangement**, and a zero card on a paid surface is worse than a missing one.
Add the rest when their content lands — and update the pillar's third intro
paragraph in the same edit, since it names how many layers the page has.

---

## Phase 3 — generators and maps

The list that was not written down. Every one of these is keyed by hand.

| # | File | Symbol | Notes |
|---|---|---|---|
| 1 | `tools/build_pillar.py` | `TYPE_META` **and** `JSON_TYPE_TO_KEY` | **Change both or the build crashes** — `render_item()` does `TYPE_META[tkey]` with no `.get()`. Leave `URL_TO_TYPE` alone: it is the fallback for entries the brain does not type, and adding a path there would be a second source of one fact. |
| 2 | `tools/build_plus_index.mjs` | `FOLDER_META` | 4th element = disk path, **only** if the folder is not the key. A section with zero pages drops out on its own (`.filter(f => f.total > 0)`), so this is safe to add before the first part. |
| 3 | `tools/build_upboard_index.py` | `TYPE_FA` | `FOLDER_TYPE`/`folder_of()` only if nested — and nothing new should be. |
| 4 | `tools/cross_link_candidates.py` | the `href="…"` alternation | line ~63. |
| 5 | `.github/scripts/gen_sitemap.py` | `get_priority()` — **TWO clauses** | 0.9 for `/{slug}/index.html`, 0.7 for `/{slug}/…`. Adding only the first silently leaves article pages at 0.6. |
| 6 | `.github/scripts/inject_hub_og.py` | `HUBS` | Or the landing page ships with no OG tags and no share card. |
| 7 | `plus/js/collections.js` | `TYPE_COVER_COLOR`, `TYPE_ICON` | Keyed by **top path folder**. |
| 8 | `plus/js/content-index.js` | `FOLDER_EN` | |
| 9 | `plus/plus.js` | `SEEN_FOLDERS` | Keyed by **top path folder** (`isSeenContent()` tests `parts[0]`). |
| 10 | `global-search.js` | `activeFilters`, `TYPE_MAP`, `labelMap` | **This one file is the whole functional registration.** The `.dc-filter-btn` chips are only toggles bound at `:11`; a type in `activeFilters` with no chip simply cannot be switched off, which is harmless. |
| 11 | `dc-nav.js` | `DC_DRAWER_MENU_ITEMS` | The hamburger. Ship this **only once the landing page exists**, or it links to a 404. |

**Rows 7 and 9 are keyed by the top path folder**, so a section that is not at
the root cannot have its own entry there — it inherits its parent's. Do not add
a dead key to "document" that; the exception belongs in exactly one place
(`build_upboard_index.py`'s `folder_of()`), with a comment.

---

## Phase 4 — surfaces that advertise emptiness: FIRST PUBLISH, not creation

Register at section creation; **surface at first publish.** These four render
the section's *content*, and with none they announce that there is none:

* `index.html` — the `.dc-exa-cat` cell + its `COUNTER:CAT_…` marker, plus
  `CAT_COUNTERS` in `tools/update-homepage-counters.py`. With no parts it reads
  «۰ مطلب». *(The `.dc-exa-cats` grid anchors `spot.js`'s mobile sponsor ad —
  adding a cell is safe, moving or removing the grid is not.)*
* `index.html` — the `.dc-rail-card`, plus `RAIL_CATS`. A rail card with no
  article is a dead link. (`refresh_rail()` degrades safely either way: it logs
  "card not found (skipped)".)
* `index.html` — the Pulse `<li>`. It announces a publish; write it when there
  is one.
* `index.html` — the desktop col-A `dcd-subitem`. `data-src="brain"` renders
  that type's entries; zero entries renders an empty column B.

Also at first publish: the `.dc-filter-btn` chip. **Known drift, do not try to
fix it in passing:** that chip block is duplicated as *static markup* across
**852 HTML files** (210 episodes, 110 glossary, 172 `en/` mirrors, …), most of
them hand-published rather than generated, and `tools/episodes_template.html`
carries it too — so a chip change there forces regenerating 210 episode pages.
Add the chip only to the copies that are generated or that you are already
editing (`build_pillar.py`'s four literals → 11 pillar pages; `index.html`; the
new landing page). The rest will drift. The chip list should not be static
markup at all; fixing that is its own task.

---

## Phase 5 — the landing page

`{slug}/index.html`, cloned from the smallest current flat-section landing
(`sharehub/index.html`, 417 lines). It must carry: both `preconnect` links
first, the deferred GA4 snippet, `<link rel="canonical">`, the three `hreflang`
lines, an OG block, and JSON-LD with `CollectionPage` + a `BreadcrumbList`.

**The breadcrumb must match the section's own part pages.** پرامپتولوژیست ran
for months with a 4-level breadcrumb on its landing page (inserting DentAI) and
a 3-level one on all 19 parts — the page and its own contents disagreeing about
what their parent was.

---

## Phase 6 — build, in this order

```bash
python3 tools/build_pillar.py all          # pillar pages + structure.json sidecars
node    tools/build_plus_index.mjs         # AFTER the pillar builder — it reads the sidecars
python3 tools/build_upboard_index.py
python3 tools/update-homepage-counters.py  # first publish onward
python3 .github/scripts/inject_hub_og.py   # + inject_ga / inject_preconnect / inject_hreflang as needed
python3 tools/asset_version.py --bump      # LAST of the asset steps
python3 tools/asset_version.py --check     # what CI runs
python3 tools/stamp-version.py             # service-worker CACHE_NAME
python3 .github/scripts/gen_sitemap.py     # CI regenerates this too
```

**Why `--bump` runs last, and never before the builders:** `build_pillar.py`'s
`asset_v()` reads `.dentcast/asset-versions.json` and **raises** rather than
guessing a stamp, and the bump's own HTML pass rewrites every page's `?v=`
anyway — so bumping after the builds converges, and bumping before them leaves
the freshly-built pages carrying whatever the manifest said at build time.
Confirm `--check` is clean before committing; it is the CI gate.

Any shared asset touched here (`dc-nav.js`, `global-search.js`, `plus/plus.js`,
`plus/js/*.js`) makes the bump **mandatory**, including modules that are only
*imported* by a stamped entry.

---

## Phase 7 — verify

1. **Canonical diff.** Capture every `<link rel="canonical">` in the tree before
   and after; the sets must be identical except for the new section's own pages.
   `content_id` is derived from the canonical (`plus/js/config.js`
   `detectContentId()`) and is the join key for `content_votes`, `highlights`,
   `article_notes`, `support_tickets`, `collection_items` and `user_activity`.
   **A changed canonical on an existing page silently rewrites that page's
   identity across nine tables.** If one moved, stop.
2. `python3 -c "import json; json.load(open('<f>'))"` on every JSON touched —
   truncation on the large files is a known failure here.
3. Pillar counts: the new pillar's item total and each subtopic's, and the
   *drop* in whatever pillar the content was filed under before.
4. `python3 tools/asset_version.py --check` clean.
5. Spot-check one built pillar row: it must carry the new section's own label
   and icon, not an inherited one.

---

## Traps, each one paid for once already

* `TYPE_META` and `JSON_TYPE_TO_KEY` change **together** — `KeyError` otherwise.
* `countArticles()` assumed key == top folder; that is why 19 pages counted zero.
* `get_priority()` has **two** clauses, not one.
* An empty subtopic renders a **«(۰)»** card in the premium arrangement.
* The global-search chip is static markup in **852** files.
* Amber is reserved for premium; never a pillar accent.
* `.dc-exa-cats` anchors paid sponsor inventory — add a cell, never move the grid.
* **No new section is ever nested.** `/dentai/promptologist/` is the site's one
  two-level content path and is kept only because its canonicals are load-bearing.
