# DentCast Header Audit Report
**Date**: 2026-05-20  
**Scope**: dentcast.ir / dentcast.org — all page types  
**Type**: Read-only analysis — no code was modified

---

## SECTION 1 — Homepage Header (Reference Standard)

**File**: `index.html` (root)  
**CSS**: Inline, within `index.html` itself (does NOT load `dc-nav.css`)  
**JS**: Inline, within `index.html` + `global-search.js?v=3` (does NOT load `dc-nav.js`)

### Structure

The header uses `.dc-topbar` class. In RTL layout, it is split into two groups displayed on opposite sides:

**Actions group (visually RIGHT side)** — source-order left-to-right in RTL = right-to-left visually:

| Position (RTL visual order) | Element | Details |
|---|---|---|
| 1 (rightmost) | Logo | `<a href="/">` → `<img src="/logo-v2.png" width="38" height="38">`. Click navigates to `/`. |
| 2 | Hamburger | `<button id="btn-toolbar-toggle">`. Inline SVG: 3 horizontal lines. Click opens/closes `#dcToolbarDrawer` toolbar drawer below the header. Handler defined in inline JS of `index.html`. |
| 3 | Search | `<button class="dcOpenSearch">`. Inline SVG: circle + diagonal line (magnifier). Click opens `#dcGlobalBox` floating search panel. Handler defined in inline JS of `index.html`. |

**Brand group (visually LEFT side)**:
- `"DentCast"` — `.dc-topbar-brand-name` (plain text, no link)
- `"دکتر فواد شهابیان"` — `.dc-topbar-brand-sub` linked to `about.html` (**relative path, no leading slash** — minor inconsistency vs all other pages which use `/about.html`)

### Styling
- Position: `fixed`, top: 0, full width, z-index: 200
- Height: 57px (page body has `padding-top: 57px` to compensate)
- Background: `var(--surface)` (white in light mode)
- Border-bottom: 1px solid `var(--border)` + subtle box-shadow
- Icon buttons: 34×34px, fully circular (`border-radius: 999px`), background `var(--surface2)`
- Icon SVG size: 18×18px, `stroke` style (no fill), `currentColor`
- Gap between buttons: 8px

### What is NOT in this header
The DentCast Radar feature is **not in the header** on the homepage. It is a hero card in the page body, triggered by `#btnOpenRadar` and `#btnOpenRadarMob`. All other page types show a `btn-radar-topbar` button in the header instead.

---

## SECTION 2 — Header Variants Across the Site

### Variant A — Homepage
**Pages**: `index.html` only  
Already documented in Section 1. The canonical reference.

---

### Variant B — Section / Index pages (3 icons: logo + hamburger + search, no radar)

**Pages**:
- `glossary/index.html`
- `notecast/index.html`
- `metanotes/index.html`
- `insight/index.html`
- `chairside/index.html`
- `sharehub/index.html`
- `dentai/index.html`
- `dentcast-plus/index.html`
- `litecast/index.html`
- `photocast/index.html`
- `episodes.html` (root-level episode listing)

**Note**: `episodes/index.html` has no header at all — it is a pure redirect (`<meta http-equiv="refresh">`) to `/episodes.html`.

**Differences from homepage**:
- Uses external `dc-nav.css` + `dc-nav.js`
- Brand subtitle href is `/about.html` (absolute — correct)
- Icons are inline SVG directly in HTML (no emoji fallback)
- **No radar button** — consistent with the homepage
- All 3 elements are functional: logo ✓, hamburger ✓, search ✓

**Button status**: All functional.

---

### Variant C — Standard content/detail pages (4 icons: logo + hamburger + **radar** + search)

These pages share the same header class and structure but differ by how they load scripts. The key split is dc-nav.js presence.

#### Variant C-1 — Full script stack (dc-nav.js + global-search.js)

**Pages**:
- All episode pages: `episodes/episode-1.html` through `episode-157.html` (including sub-parts: `episode-106-1.html`, etc.)
- All glossary entries: `glossary/immediate-dentin-sealing.html`, `glossary/zirconia.html`, etc.
- All NoteCast episodes: `notecast/episode-2.html` through `episode-33.html`
- All DentCast+ videos: `dentcast-plus/video-1.html` through `video-6.html`
- `404.html`

**Differences from homepage**:
- Adds `btn-radar-topbar` button (between hamburger and search)
- Radar icon: inline SVG — circle-within-circle + pointer line (target/radar symbol)
- Brand subtitle: `/about.html` (absolute)
- **Radar button is dead** — see Section 3 for root cause
- Hamburger ✓, Search ✓ (dcGlobalBox + dcSearch present, dc-nav.js loaded)

**Icon format — episode pages specifically**:  
All files in `episodes/` use HTML entity emoji for icon button content: `&#9776;` (☰), `&#128225;` (📡), `&#128269;` (🔍). `dc-nav.js`'s `hydrateUiIcons()` function converts these to inline SVG at runtime. This conversion runs in the non-truncated section of dc-nav.js, so it executes correctly — the icons render identically to other pages.

**Button status**: Hamburger ✓, Search ✓, **Radar ✗ (dead — dc-nav.js truncated, no click handler)**.

---

#### Variant C-2 — dc-nav.js loaded, global-search.js absent

**Pages**:
- `about.html`
- `search.html`

**Differences from Variant C-1**:
- `global-search.js` is NOT loaded
- `dcGlobalBox` and `#dcSearch` input ARE present in page body
- Search button opens the overlay, but results do not populate (no global-search.js to handle input)
- `search.html` has its own dedicated search system in addition; this only affects the header search button

**Button status**: Hamburger ✓, **Radar ✗ (dead)**, Search ⚠️ (opens overlay, no results populate).

---

#### Variant C-3 — dc-nav.js MISSING, dcGlobalBox present but no input handler

**Pages**:
- All MetaNote entries: `metanotes/meta-1.html` through `meta-12.html`
- All Insight entries: `insight/insight-1.html` through `insight-41.html`
- All ShareHub entries: `sharehub/share-1.html` through `share-5.html`
- All DentAI entries: `dentai/dentai-1.html` through `dentai-16.html`
- All LiteCast entries: `litecast/lite-CAST1.html` through `lite-CAST25.html`
- `join.html`

**Differences from homepage / Variant C-1**:
- **NO `dc-nav.js` loaded** — no `<script src="/dc-nav.js">` in page
- **NO `global-search.js` loaded**
- `dcToolbarDrawer` DOM element IS present in page body
- `dcRadarOverlay` DOM element IS present in page body
- `dcGlobalBox` DOM element IS present in page body (except noted below)
- `#dcSearch` input: present in ShareHub, DentAI, LiteCast, join.html; **absent** in MetaNote and Insight entries
- Result: no click handlers are registered for any header button

**Button status**: **Hamburger ✗ (dead)**, **Radar ✗ (dead)**, **Search ✗ (dead)**.  
*(All three buttons are completely non-functional — the supporting DOM elements exist but no script is loaded to wire them up.)*

---

#### Variant C-4 — dc-nav.js MISSING, dcGlobalBox ALSO missing

**Pages**:
- All Chairside entries: `chairside/chairside-1.html` through `chairside-16.html`

**Differences from Variant C-3**:
- **No `dc-nav.js` loaded**
- **No `global-search.js` loaded**
- `dcToolbarDrawer` present (not wired)
- `dcRadarOverlay` present (not wired)
- **`dcGlobalBox` completely absent from page body** — the search overlay element doesn't exist at all
- Icons are inline SVG (same visually as C-1 non-episode pages)

**Button status**: **Hamburger ✗ (dead)**, **Radar ✗ (dead)**, **Search ✗ (dead)**.

---

### Variant D — player.html (SVG sprite icons, all buttons dead, file truncated)

**Pages**: `player.html` only

**Differences from all other variants**:
- Icons use **external SVG sprite**: `<svg class="dc-icon"><use href="/assets/icons/icons.svg#icon-menu"/></svg>` — class is `dc-icon` (not `dc-svg-icon`), referencing `/assets/icons/icons.svg`
- This is the only page using `<use href>` sprite pattern vs inline SVG / emoji
- **No `dc-nav.js` loaded**
- **No `global-search.js` loaded**
- **`dcGlobalBox` absent**
- **File is truncated** — the HTML ends mid-script (`const desc = document`), with no `</body>` or `</html>` closing tags. The inline script is incomplete.
- `dcToolbarDrawer` present (not wired)
- `dcRadarOverlay` present (not wired)

**Button status**: **Hamburger ✗ (dead)**, **Radar ✗ (dead)**, **Search ✗ (dead)**.

---

## SECTION 3 — Broken / Missing Actions

### 3.1 — dc-nav.js is truncated (root cause for radar everywhere)

**File**: `dc-nav.js`  
**Problem**: The file is **truncated at line 311**, ending mid-expression inside `handleRadarSearch()`:
```
return item.name.toLowerCase().includes(q) ||
    [blank]
```
The file has no closing braces, no closing IIFE, no further event registrations.

**Missing code** (everything after line 311 is absent):
- `btn-radar-topbar` click → `openRadar()` binding
- `dcCloseRadarOverlay` click → `closeRadar()` binding
- `dcRadarInput` input event → `handleRadarSearch()` binding
- `popstate` listener (browser back button from radar state)
- Hash-change listener for `#radar`
- Whatever additional logic followed

**Impact**: The radar button (`btn-radar-topbar`) is present and visible on every page that uses `dc-nav.js`, but clicking it does nothing. The radar overlay exists in the DOM but is permanently hidden (`aria-hidden="true"`, `visibility: hidden`).

**Affected pages**: All Variant C-1, C-2 pages (episode pages, glossary entries, notecast, dentcast-plus videos, about, search, 404).

---

### 3.2 — Button-by-button breakdown across all page types

| Page type | Hamburger | Radar | Search | Notes |
|---|---|---|---|---|
| Homepage | ✓ works | — absent | ✓ works | Radar is body hero, not header |
| Section index pages (B) | ✓ works | — absent | ✓ works | |
| Episode pages (C-1) | ✓ works | **✗ dead** | ✓ works | dc-nav.js truncated → no radar handler |
| Glossary entries (C-1) | ✓ works | **✗ dead** | ✓ works | Same |
| NoteCast episodes (C-1) | ✓ works | **✗ dead** | ✓ works | Same |
| DentCast+ videos (C-1) | ✓ works | **✗ dead** | ✓ works | Same |
| 404.html (C-1) | ✓ works | **✗ dead** | ✓ works | Same |
| about.html (C-2) | ✓ works | **✗ dead** | ⚠️ opens, no results | dc-nav.js loaded; global-search.js missing |
| search.html (C-2) | ✓ works | **✗ dead** | ⚠️ opens, no results | Same; page has its own search system |
| MetaNote entries (C-3) | **✗ dead** | **✗ dead** | **✗ dead** | dc-nav.js absent entirely |
| Insight entries (C-3) | **✗ dead** | **✗ dead** | **✗ dead** | dc-nav.js absent; dcSearch input also missing |
| ShareHub entries (C-3) | **✗ dead** | **✗ dead** | **✗ dead** | dc-nav.js absent |
| DentAI entries (C-3) | **✗ dead** | **✗ dead** | **✗ dead** | dc-nav.js absent |
| LiteCast entries (C-3) | **✗ dead** | **✗ dead** | **✗ dead** | dc-nav.js absent |
| join.html (C-3) | **✗ dead** | **✗ dead** | **✗ dead** | dc-nav.js absent |
| Chairside entries (C-4) | **✗ dead** | **✗ dead** | **✗ dead** | dc-nav.js absent; dcGlobalBox also missing |
| player.html (D) | **✗ dead** | **✗ dead** | **✗ dead** | File truncated; dc-nav.js absent; dcGlobalBox missing |

---

### 3.3 — Specific dead-button inventory

1. **Radar button — ALL content pages**  
   Icon: radar/target SVG (visible, renders correctly)  
   Should do: open `#dcRadarOverlay` full-screen panel, load radar.json, enable site search  
   Currently does: **nothing** — no click handler (dc-nav.js truncated before binding)  
   Affected pages: episodes, glossary entries, notecast, metanotes, insight, chairside, sharehub, dentai, dentcast-plus, litecast, about, search, join, player, 404

2. **Hamburger button — MetaNote, Insight, ShareHub, DentAI, LiteCast, Chairside entries, join.html, player.html**  
   Icon: 3-line menu (renders correctly)  
   Should do: toggle `#dcToolbarDrawer` (install / consult / about shortcuts)  
   Currently does: **nothing** — dc-nav.js not loaded on these pages

3. **Search button — MetaNote, Insight, Chairside, ShareHub, DentAI, LiteCast entries, join.html, player.html**  
   Icon: magnifier SVG (renders correctly)  
   Should do: open `#dcGlobalBox` search panel  
   Currently does: **nothing** — dc-nav.js not loaded (so no `.dcOpenSearch` click handler)  
   Additional issue for Chairside entries and player.html: `#dcGlobalBox` is absent from the DOM entirely

4. **Search results — about.html, search.html**  
   Search button opens the overlay (dc-nav.js IS loaded), but `global-search.js` is absent, so typing produces no results

5. **Radar close button + input — ALL pages with btn-radar-topbar**  
   `#dcCloseRadarOverlay` and `#dcRadarInput` exist in the DOM but the click/input handlers are in the truncated part of dc-nav.js, so even if the overlay were opened by some other means, closing it and searching would not work

---

## SECTION 4 — Back-Button Status

### Pages with a back button in the header
**None.** No page anywhere on the site currently has a back button in the `<header class="dc-topbar">`.

(Note: `chairside/chairside-1.html` and other chairside entries have a back-arrow link in the **footer** pointing to `chairside/index.html`, but this is a footer element, not a header button.)

### Pages missing a back button that probably should have one

Any page that is not the homepage or a top-level section index is a "detail" page a user navigates INTO. These should have a back button:

| Page type | Count | Logical back target |
|---|---|---|
| Episode pages | 157+ files | `/episodes.html` |
| Glossary entries | ~70 files | `/glossary/index.html` |
| NoteCast episodes | 33 files | `/notecast/index.html` |
| MetaNote entries | 12 files | `/metanotes/index.html` |
| Insight articles | 41 files | `/insight/index.html` |
| Chairside entries | 16 files | `/chairside/index.html` |
| ShareHub entries | 5 files | `/sharehub/index.html` |
| DentAI entries | 16 files | `/dentai/index.html` |
| DentCast+ videos | 6 files | `/dentcast-plus/index.html` |
| LiteCast entries | 25 files | `/litecast/index.html` |
| player.html | 1 file | `/episodes.html` |

**Pages that do NOT need a back button** (top-level destinations):
- `index.html` (homepage)
- All section index pages (glossary/index, notecast/index, etc.)
- `episodes.html`, `about.html`, `search.html`, `join.html`
- `404.html` (edge case — back button could be useful here but not critical)

---

## SECTION 5 — Summary of Changes Needed to Unify All Headers

Listed by priority / severity:

### Critical (site-wide breakage)

1. **Repair dc-nav.js** — the file is truncated at line 311 mid-function. The missing section needs to be restored. At minimum it must include:
   - `btn-radar-topbar` click → `openRadar()` binding
   - `dcCloseRadarOverlay` click → `closeRadar()` binding
   - `dcRadarInput` input event → `handleRadarSearch()` binding
   - `popstate` / hash-change listeners for radar state

2. **Repair player.html** — the file is truncated (no `</body>`, no `</html>`). The incomplete inline script needs to be finished and the file properly closed. `dc-nav.js` must be added.

### High (many pages fully broken)

3. **Add `dc-nav.js` to all pages currently missing it** — MetaNote entries, Insight entries, Chairside entries, ShareHub entries, DentAI entries, LiteCast entries, `join.html`. Without it, hamburger, radar, and search buttons are all non-functional on these pages.

4. **Add `dcGlobalBox` + `#dcSearch` to Chairside entries** — these pages are missing the search overlay DOM element entirely. Adding dc-nav.js alone won't make search work without the overlay markup.

### Medium (inconsistencies and partial breakage)

5. **Add `global-search.js` to `about.html`** — search button opens the overlay but produces no results. Either add `global-search.js` or remove the dcGlobalBox overlay from the page.

6. **Add back buttons to all detail/content page types** — approximately 380+ pages currently have no way to navigate back to their parent section from the header. The back icon SVG path is already defined in dc-nav.js's icon library (`back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>'`). A `.btn-back` element in the header would be wired automatically by `hydrateUiIcons`.

### Low (cleanup / consistency)

7. **Fix homepage brand subtitle href** — `index.html` links to `about.html` (relative), all other pages link to `/about.html` (absolute). Should be unified to `/about.html`.

8. **Standardize icon format in episode pages** — `episodes/episode-*.html` use HTML entity emoji (`&#9776;`, `&#128225;`, `&#128269;`) that get converted to SVG at runtime by dc-nav.js. All other pages embed inline SVG directly. The emoji approach depends on `hydrateUiIcons()` running, which it currently does, but the discrepancy is fragile and inconsistent.

9. **Normalize player.html icon approach** — player.html uses `<use href="/assets/icons/icons.svg#icon-X">` (SVG sprite) with class `dc-icon`, while every other page uses inline SVG with class `dc-svg-icon`. These produce different rendering behavior and the `dc-icon` class has no styles in `dc-nav.css`.

10. **Add `global-search.js` to `search.html`** — or confirm the page's own search system fully replaces the need for it. Currently the header search button opens an unpopulated overlay.

---

*End of audit. No files were modified.*
