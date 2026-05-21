# DentCast Hub — Blue Color Audit

Date: 2026-05-21
Scope: full repository (`dentcast-hub.github.io`), read-only.
Files scanned: 466 HTML, 4 CSS, 8 JS, 1 SVG (icon sprite), 1 PNG/webp logo.
Method: ripgrep + Perl with negative lookbehind to exclude HTML entities (`&#1234;`) from hex matches; manual context inspection for role tagging.

---

## 1. Current Color System

### Stack reality

No Tailwind, no SCSS, no LESS, no PostCSS, no Jekyll config, no `package.json`. This is a plain static HTML + vanilla CSS site. Color governance is done entirely through CSS custom properties (`--foo: #hex`).

### Source-of-truth files

There is a **partial** single source of truth (`dc-theme.css`) but it is undermined by inline `<style>` blocks in every section landing page and most article templates. The four CSS files at the repo root are:

| File | Purpose | Token defs | Hex usages |
|---|---|---|---|
| `dc-theme.css` | Canonical design tokens (light + dark) | 46 `--var:` defs | 43 hex literals (most are inside token defs) |
| `dc-nav.css` | Topbar + drawer + radar overlay | 0 | 16 (all as fallback `var(--x, #hex)`) |
| `global-search.css` | Bottom-sheet global search | 0 | 17 (all hardcoded, no tokens) |
| `Style.css` | Legacy global (RTL Vazirmatn page) — dark-bg | 7 `--var:` defs | 7 hex literals |

`dc-theme.css` is loaded on every page that has a `.dc-topbar`. It explicitly states in its header comment:

> `index.html has its own inline system (do not touch).`

So `index.html` (168 KB, 2200+ lines) is intentionally **not** governed by `dc-theme.css` — it redefines the entire token set inline at line 57.

### Tokens defined in `dc-theme.css`

Light mode (`:root`, lines 44–82):

```
--pr     #022360   (rgb 2,35,96)   — brand dark
--ac     #0b5fff   (rgb 11,95,255) — brand accent
--bg     #f0f2f5
--surface  #ffffff
--surface2 #f4f6fb
--surface3 #eaecf5
--border   rgba(2,35,96,.10)
--border2  rgba(2,35,96,.06)
--txt      #0a1a33
--txt2     #4a5f85
--txt3     #8a9cbe
--txt-inv  #ffffff
--card-bg     #ffffff
--card-border rgba(2,35,96,.09)
--card-sh, --card-sh2 (shadows over rgba(2,35,96,*))
--chip-bg  rgba(11,95,255,.08)
--chip-bd  rgba(11,95,255,.20)
--chip-txt #022360
--text     #0a1a33   (alias of --txt for legacy dark pages)
--muted    #4a5f85   (alias of --txt2 for legacy)
--blue2    #022360   (DEAD: 0 references in codebase)
```

Dark mode (`[data-theme="dark"]`, lines 87–115):

```
--pr / --ac  #5b9cf6
--bg         #0e1621
--surface    #17212b
--surface2   #1e2c3a
--surface3   #232e3c
--txt        #e8f0ff
--txt2       #8aaac8
--txt3       #4a6a88
--chip-txt   #8ab4f8
```

### Tokens defined in `Style.css` (`/Style.css` lines 27–34)

```
--blue   #0b5fff   (same as --ac, different name)
--bg     #0b1220   (dark navy — different from --bg in dc-theme.css)
--bg2    #121a2b
--text   #e7eaf1
--muted  #9aa1b3
```

### Tokens defined inline in `index.html` (lines 57–106)

Adds these extras on top of the dc-theme.css set:

```
--sb         #17212b
--sb2        #1e2c3a
--sb-active  #2b5278   (mid blue, used only in side drawer)
--sb-txt     #e8f0ff
--bn-bg      #ffffff
--bn-border  rgba(2,35,96,.10)
--bn-txt     #8a9cbe
--bn-active  #022360   (light) / #5b9cf6 (dark)
--pulse-bg   #17212b
```

### Verdict

There is no single source of truth. There is a **canonical set** in `dc-theme.css` and **four parallel systems** that drift from it:

1. `dc-theme.css` (canonical, loaded sitewide)
2. `index.html` inline `:root` (deliberately separate by author intent)
3. `Style.css` (legacy dark-bg root with `--blue`)
4. 11 section landing pages (`chairside/index.html`, `dentai/index.html`, `dentcast-plus/index.html`, `notecast/index.html`, `metanotes/index.html`, `litecast/index.html`, `insight/index.html`, `sharehub/index.html`, `episodes.html`, `glossary/index.html` etc.) each **redefine the entire token block inline**, duplicating `--pr:#022360; --ac:#0b5fff;` etc.
5. ~218 article templates (chairside, dentai, glossary, insight, litecast, metanote, notecast, sharehub) redefine `--blue:#0b5fff` and/or `--accent:#0b5fff` inline (139 + 79 files).

---

## 2. Blue Color Inventory

All values are normalised to lowercase. Counts are raw occurrence counts across all HTML + CSS + JS (HTML numeric entities excluded). "Source" = whether the value also appears inside a `--var:` definition.

### Brand pair — the "real" canonical blues

| Value | Count | Source | Notes |
|---|---:|---|---|
| `#0b5fff` | 447 | Token (`--ac`, `--blue`, `--accent`) + heavy hardcode | DentCast brand accent. Defined in `dc-theme.css:46`, `Style.css:28`, `manifest.json:theme_color`, plus inline in 139+ `--blue:#0b5fff` files and 79 `--accent:#0b5fff` files and 11 `--ac:#0b5fff` files and 103 `<meta name="theme-color" content="#0b5fff">`. |
| `#022360` | 145 | Token (`--pr`, `--chip-txt`, `--blue2`, `--bn-active`) + heavy hardcode | DentCast brand navy. Defined in `dc-theme.css:45`. Hardcoded inline in 11 section landings, every glossary `.btn`, `global-search.css`, and most litecast `.btn-home` (light mode). |

### Navy-ish / dark blues (lightness < 25%)

| Value | Count | Source | Notes |
|---|---:|---|---|
| `#0a1a33` | 40 | Token (`--txt`) | Default light-mode body text |
| `#0e1621` | 13 | Token (`--bg` dark) | Dark-mode background |
| `#17212b` | 26 | Token (`--surface`, `--sb`, `--pulse-bg` dark) | Dark surface |
| `#1e2c3a` | 26 | Token (`--surface2`, `--sb2`, `--card-bg` dark) | Dark surface 2 |
| `#232e3c` | 12 | Token (`--surface3` dark) | Dark surface 3 |
| `#1b2640` | 52 | Hardcoded | Used in `Style.css` radial gradient; no token |
| `#0b1220` | 87 | Hardcoded (token `--bg` in `Style.css` only) | Dark page bg in `Style.css` and in 56 article files via inline `--bg:#0b1220` |
| `#121a2b` | 86 | Hardcoded (token `--bg2` in `Style.css`) | Dark page bg2; 50+ files use inline `--bg2:#121a2b` |
| `#101522` | 7 | Hardcoded (alias `--bg2`) | `join.html:15`, `dentcast-plus/video-6.html:25` |
| `#0a0d14` | 7 | Hardcoded (alias `--bg`) | `join.html:14`, `dentcast-plus/video-6.html:24` |
| `#161a26` | 1 | Hardcoded | One-off |
| `#0a1638` | 13 | Hardcoded | Inline `color:#0a1638` on author-byline `<p style="">` in 11 dentai articles |
| `#0a1628` | 1 | Hardcoded | `index.html:729` dark-mode radar hero button text |
| `#0b1420` | 1 | Hardcoded | `index.html:2202` dark-mode bottom-nav background |
| `#0b1d40` | 4 | Hardcoded | `global-search.css` filter-button text + result-item text; `search.html:56` |
| `#08327a` | 17 | Hardcoded | H2 + H3 headings color in all 17 dentai articles (comment: "سورمه‌ای خوش‌رنگ") |
| `#1c1c2e` | 25 | Hardcoded | Unrelated to dc-theme (see Patients section) |
| `#1f2937` | 79 | Hardcoded (Tailwind gray-800) | Used in episode templates only |

### Mid blues (lightness 30–55%)

| Value | Count | Source | Notes |
|---|---:|---|---|
| `#003bb5` | 14 | Hardcoded | Capsule-button gradient end-stop, `dentcast-plus/video-*.html` (5 files) |
| `#003bd1` | 8 | Hardcoded | Link `a:hover` color in 8 `litecast/lite-CAST*.html` files |
| `#004ecb` | 1 | Hardcoded | One-off |
| `#075985` | 1 | Hardcoded | `global-search.css:141` "More" button text |
| `#2b5278` | 12 | Token (`--sb-active`) + hardcoded | Inline `[data-theme="dark"] .btn-home{background:#2b5278;}` in 11 section index files |
| `#256eff` | 1 | Hardcoded | `join.html:121` |
| `#4a78c4` | 1 | Hardcoded | `index.html:487` shimmer-text gradient mid-stop (light) |
| `#4a5f85` | 17 | Token (`--txt2`, `--muted`) | Secondary text |
| `#4a6a88` | 12 | Token (`--txt3` dark) | Tertiary text in dark mode |

### Light/mid blues (lightness 55–70%)

| Value | Count | Source | Notes |
|---|---:|---|---|
| `#3a84ff` | 140 | Hardcoded | Inline `color:#3a84ff` in the bottom "back to index" button across **all** 105 article templates that ship a footer link (chairside, dentai, sharehub, notecast x N) — see Usage Map |
| `#4a8dff` | 6 | Hardcoded | `dentcast-plus/video-6.html:110` (and 5 cousins) — sub-titles |
| `#5b9cf6` | 67 | Token (dark-mode `--pr`/`--ac`/`--bn-active`) + hardcoded | Dark-mode brand accent; also hardcoded in `index.html:1043,1208` `[data-theme="dark"]` overrides |
| `#6fa3ff` | 3 | Hardcoded | `litecast/lite-CAST6/7/8.html:171` link color |
| `#7aacff` | 1 | Hardcoded | `index.html:1680` `.dcd-pulse-list a` link color |
| `#7ab4ff` | 1 | Hardcoded | `index.html:502` shimmer gradient (dark) |
| `#4a78c4` | 1 | Hardcoded | `index.html:487` shimmer gradient (light) |
| `#8eb1e6` | 1 | Hardcoded | `index.html:488` shimmer gradient (light) |
| `#8ab4f8` | 23 | Token (`--chip-txt` dark) + hardcoded | Inline `[data-theme="dark"] li a:hover{color:#8ab4f8}` in 11 section indexes; `index.html:972` `.dc-cta-btn` |

### Pale/dusty blues — text & muted

| Value | Count | Source | Notes |
|---|---:|---|---|
| `#8a9cbe` | 15 | Token (`--txt3`, `--bn-txt`) | Tertiary muted text in light mode |
| `#8aaac8` | 13 | Token (`--txt2` dark, `--muted` dark) | Muted text in dark mode |
| `#93c5fd` | 1 | Hardcoded | `join.html:147` "light sky-blue" link |
| `#9aa1b3` | 180 | Token (`Style.css --muted`) | Muted text on dark-bg legacy pages; `global-search.css:62` |
| `#9ca3af` | 1 | Hardcoded (Tailwind gray-400) | Episode template |
| `#6b7280` | 79 | Hardcoded (Tailwind gray-500) | Episode template |

### Pale blues (lightness 85–95%) — backgrounds & borders

| Value | Count | Source | Notes |
|---|---:|---|---|
| `#b6d5ff` | 1 | Hardcoded | `episodes-drawer.js:76` |
| `#c0d9ff` | 1 | Hardcoded | `index.html:503` shimmer (dark) |
| `#cbd2e6` | 9 | Token (legacy dark-page comment in dc-theme.css) | Light blue-gray, mostly inside dark-page CSS overrides |
| `#cbd5e1` | 1 | Hardcoded (Tailwind slate-300) | One-off |
| `#d3daf1` | 2 | Hardcoded | `global-search.css:78`, `search.html:54` filter-btn border |
| `#d5d9ea` | 2 | Hardcoded | `global-search.css:54`, `search.html:37` input border |
| `#dde3f0` | 1 | Hardcoded | `index.html:2199` bottom-nav background (light) |
| `#e2e6f3` | 3 | Hardcoded | `global-search.css:11,98`, results container border |
| `#e2e8f0` | 1 | Hardcoded (Tailwind slate-200) | One-off |
| `#e3e6f2` | 1 | Hardcoded | `global-search.css:108` result-item bottom border |
| `#e5e7eb` | 80 | Hardcoded (Tailwind gray-200) | Episode template borders |
| `#e7eaf1` | 139 | Token (`Style.css --text`) | Text on dark-bg legacy pages; H2 color on 16+ chairside/metanote articles |
| `#dbeafe` | 1 | Hardcoded | `join.html:55` gradient end |

### Near-white / off-white-with-blue-tint (lightness > 95%)

| Value | Count | Source | Notes |
|---|---:|---|---|
| `#e0f2fe` | 1 | Hardcoded | `global-search.css:135` "More" button bg |
| `#e8f0ff` | 25 | Token (`--txt` dark, `--sb-txt`) + hardcoded | Inline `background:#17212b; color:#e8f0ff;` in 11 section indexes |
| `#eaecf5` | 33 | Token (`--surface3`) | Heavy use via `var(--surface3)` |
| `#eaf1ff` | 47 | Hardcoded (alias `--bg1` in insight templates) | All 42 insight articles redefine `--bg1:#eaf1ff` inline |
| `#eef3ff` | 4 | Hardcoded | `global-search.css:79,119`, filter-btn bg |
| `#f0f2f5` | 13 | Token (`--bg` light) | Light-mode body bg |
| `#f2f2f7` | 1 | Hardcoded | Patients section unrelated |
| `#f4f6fb` | 54 | Token (`--surface2`) | Heavy use via `var(--surface2)` |
| `#f5f5f7` | 1 | Hardcoded | One-off |
| `#f5f7fb` | 79 | Hardcoded (alias `--bg` in glossary) | All 79 glossary articles redefine `--bg:#f5f7fb` |
| `#f5f8ff` | 47 | Hardcoded (alias `--bg2` in insight) | All 42 insight articles redefine `--bg2:#f5f8ff` |
| `#f7f8fc` | 2 | Hardcoded | `global-search.css:55`, `search.html:38` input bg |
| `#f7f9ff` | 2 | Hardcoded | `global-search.css:97`, `search.html:71` results bg |
| `#fafafc` | 1 | Hardcoded | One-off |

### rgba() blues

| Value | Count | Source | Notes |
|---|---:|---|---|
| `rgba(11,95,255,*)` family | 660+ | Mostly hardcoded; `rgba(var(--ac-rgb), α)` (108×) is the tokenized form | The single most common drift pattern: most files write the raw triple `rgba(11,95,255, …)` instead of `rgba(var(--ac-rgb), …)`. Used at α = 0.08, .10, .12, .15, .18, .20, .25, .28, .3, .35, .4, .45, .5, .85, 1 — 15 distinct alpha values for the same hue. |
| `rgba(2,35,96,*)` family | 250+ | Token-defined inside `dc-theme.css` for borders/shadows; hardcoded elsewhere | Used at α = .04, .05, .06, .07, .09, .10, .12, .13, .28, .40 |
| `rgba(91,156,246,*)` family | ~50 | Dark-mode brand accent | Used at α = .08, .12, .15, .20, .24, .25, .30, .35, .70, .88 |

### Named blues

Zero. No `color: blue`, no `fill="blue"`, no Tailwind `bg-blue-*` / `text-blue-*` / `indigo-*` / `sky-*` classes anywhere in the codebase. The single literal "blue" word in code is a comment in `dc-theme.css:479`.

---

## 3. Usage Map

Format: `Color | Role | File:Line` (representative lines — counts in inventory above).

| Color | Role | Representative location |
|---|---|---|
| `#0b5fff` | Brand accent (logo? **PNG, no CSS hook**) | Logo is `/logo-v2.png` — color baked in raster |
| `#0b5fff` | Primary CTA / "join" button bg | `join.html:41` `.btn{background:#0b5fff}` |
| `#0b5fff` | Inline link color (about page social links) | `about.html` 6× `style="color:#0b5fff"` |
| `#0b5fff` | Article h1 color (via `--blue`/`--accent`) | `dentai/dentai-1.html:62` `h1{color:var(--blue)}` (139 article files) |
| `#0b5fff` | Article h2 accent border + h2 color (glossary) | `glossary/activator.html:102` `h2{color:var(--accent)}` (79 glossary files) |
| `#0b5fff` | Capsule button gradient start | `dentcast-plus/video-*.html`, `index.html:1628` `background:linear-gradient(135deg,#0b5fff,#003bb5)` |
| `#0b5fff` | PWA theme color | `manifest.json`, 103× `<meta name="theme-color" content="#0b5fff">` |
| `#0b5fff` | Filter-button active border | `global-search.css:88` |
| `#022360` | Brand dark / primary token (`--pr`) — h1 in `dc-theme.css` | `dc-theme.css:140` `body:has(.dc-topbar) h1 { color: var(--pr); }` |
| `#022360` | Glossary inline `.btn` text | 79× `glossary/*.html` `.btn{color:#022360}` |
| `#022360` | Bottom-nav active label (light mode) | `index.html:87` `--bn-active:#022360` → `.dc-bn-item.active .dc-bn-lbl` |
| `#022360` | Chip text token | `dc-theme.css:67` `--chip-txt:#022360` |
| `#022360` | Litecast `.btn-home` background | `litecast/lite-CAST6/7/8/9/10/...html` `.btn-home{background:#022360}` |
| `#022360` | Global search filter-button active bg | `global-search.css:86` |
| `#022360` | Global search title color | `global-search.css:44` |
| `#3a84ff` | "Back to section index" footer button text (inline) | Every chairside / dentai / sharehub / notecast / metanote article footer: `<a style="...color:#3a84ff;border:1.8px solid rgba(11,95,255,0.45)...">` — 140 occurrences |
| `#003bb5` | Capsule-button gradient end-stop | `index.html:1628`, `dentcast-plus/video-*.html` |
| `#003bd1` | Article link hover (litecast) | `litecast/lite-CAST*.html:113` `a:hover{color:#003bd1}` (8 files) |
| `#08327a` | Article H2 + H3 heading color (dentai only) | `dentai/dentai-1.html:89` `h2{color:#08327a}` (17 files) |
| `#2b5278` | Dark-mode `.btn-home` background | 11× section index files: `[data-theme="dark"] .btn-home{background:#2b5278}` |
| `#2b5278` | Sidebar drawer active item (`--sb-active`) | `index.html:1397` `background:var(--sb-active)` |
| `#4a78c4`, `#8eb1e6` | Light-mode shimmer-headline gradient mid-stops | `index.html:487,488` |
| `#7ab4ff`, `#c0d9ff` | Dark-mode shimmer-headline gradient mid-stops | `index.html:502,503` |
| `#5b9cf6` | Dark-mode brand accent (`--pr`/`--ac`) | `dc-theme.css:90,91` |
| `#5b9cf6` | Dark-mode close-button color | `index.html:1043` `[data-theme="dark"] .dc-close-results{color:#5b9cf6}` |
| `#5b9cf6` | Dark-mode radar-item title | `index.html:1208` |
| `#8ab4f8` | Dark-mode `.dc-cta-btn` color | `index.html:972` |
| `#8ab4f8` | Dark-mode `li a:hover` color | 11× section index files: `[data-theme="dark"] li a:hover{color:#8ab4f8}` |
| `#8ab4f8` | Dark-mode `.footer-copy strong` | 11× section indexes |
| `#7aacff` | `.dcd-pulse-list a` link color | `index.html:1680` |
| `#6fa3ff` | Article link color (litecast 6/7/8 only) | `litecast/lite-CAST6.html:171` `color:#6fa3ff` |
| `#93c5fd` | Sky-blue link on dark bg | `join.html:147` |
| `#256eff` | Button background (one-off) | `join.html:121` |
| `#dde3f0` | Bottom-nav background (light mode) | `index.html:2199` |
| `#0b1420` | Bottom-nav background (dark mode) | `index.html:2202` |
| `#0a1638` | Author-byline `<p>` color | Inline in 11 dentai articles |
| `#e8f0ff` | Dark-bg drawer text (`--sb-txt`); also inline | `dc-theme.css:118`; inline `background:#17212b;color:#e8f0ff` in 11 section indexes |
| `#eaf1ff` / `#f5f8ff` | Insight article `--bg1` / `--bg2` (page bg gradient) | 42× `insight/insight-*.html:21-22` |
| `#f5f7fb` | Glossary article body bg (inline `--bg`) | 79× `glossary/*.html:13-22` |
| `#0b1220` / `#121a2b` | Dark-bg legacy `--bg`/`--bg2` (chairside, metanote, etc.) | `Style.css:28-29`; inline in 56 articles |
| `#0a0d14` / `#101522` | Even-darker `--bg`/`--bg2` (join + video-6) | `join.html:14-15`, `dentcast-plus/video-6.html:24-25` |
| `#0b1d40` | Search filter-button text | `global-search.css:80,110`; `search.html:56` |
| `#075985` | Search "More" button text | `global-search.css:141` |
| `#eef3ff` | Search filter-button bg + result hover bg | `global-search.css:79,119` |
| `#e0f2fe` | Search "More" button bg | `global-search.css:135` |
| `#f7f8fc` | Search input bg | `global-search.css:55`, `search.html:38` |
| `#f7f9ff` | Search results bg | `global-search.css:97`, `search.html:71` |
| `#d5d9ea` | Search input border | `global-search.css:54`, `search.html:37` |
| `#d3daf1` | Search filter-button border | `global-search.css:78`, `search.html:54` |
| `#e2e6f3` | Search container border | `global-search.css:11,98` |
| `#e3e6f2` | Search result-item bottom border | `global-search.css:108` |
| `#1b2640` | Page radial-gradient mid-stop | `Style.css` |
| Icons | Use `currentColor` (SVG sprite `assets/icons/icons.svg`) — inherit from CSS | Refactor-safe |
| `#1f2937`, `#6b7280`, `#e5e7eb` | Episode-page text/border (Tailwind-derived grays) | All 205 `episodes/episode-*.html` |
| `#9aa1b3` | Muted text on legacy dark pages (`Style.css --muted`) | `global-search.css:62`, dark pages |
| `#e7eaf1` | Dark-page H2 (`Style.css --text`) | 16+ chairside/metanote articles |

---

## 4. Hardcoded vs Tokenized

Counting only "blue-family" colors (the 70 distinct hex values listed above, plus `rgba()` for the same hues) versus references to the blue-bearing tokens (`--ac`, `--pr`, `--blue`, `--blue2`, `--accent`, `--bn-active`, `--sb-active`, `--chip-bg/bd/txt`, plus `rgba(var(--ac-rgb)/--pr-rgb/--accent)`).

- **Hardcoded blue hex occurrences: 2,239**
- **Tokenized core-blue references: 4,843** (`var(--ac)` 2,888 + `var(--pr)` 172 + `var(--blue)` 321 + `var(--accent)` 325 + `var(--chip-*)` 1,239 + `var(--bn-active)` 2 + `var(--sb-active)` 2 + `rgba(var(--ac-rgb))` ~85 + `rgba(var(--pr-rgb))` ~23)

**Ratio (core blues only): 31.6 % hardcoded, 68.4 % tokenized.**

If you widen the denominator to include all surface/background/text tokens that resolve to blue-tinted values (`--surface*`, `--txt*`, `--bg*`, `--text`, `--muted`, `--border*`, `--card-*`, `--bn-*`, `--sb-*` → 11,971 refs), the ratio becomes:

**Ratio (broad): 15.8 % hardcoded, 84.2 % tokenized.**

The token-defining files themselves (`dc-theme.css`, the 11 inline section roots) account for ~150 of the "hardcoded" hits structurally — they are token definitions, not violations. Excluding those leaves ~2,090 genuine hardcoded blues to refactor.

### Top 10 files by hardcoded blue count

| # | File | Hardcoded blues | Note |
|---:|---|---:|---|
| 1 | `index.html` | 46 | Largely token defs (lines 57–130) — only ~15 truly hardcoded outside the `:root` block |
| 2 | `dc-theme.css` | 36 | All inside the `:root` token block — these are definitions, not violations |
| 3 | `episodes.html` | 25 | Redefines full token block inline (mirror of dc-theme.css) |
| 4 | `litecast/index.html` | 24 | Inline token block + 4 extra hardcoded (`#8ab4f8`, `#2b5278`, `#17212b`, `#e8f0ff`) |
| 5 | `sharehub/index.html` | 23 | Same pattern |
| 6 | `notecast/index.html` | 23 | Same pattern |
| 7 | `metanotes/index.html` | 23 | Same pattern |
| 8 | `insight/index.html` | 23 | Same pattern |
| 9 | `dentcast-plus/index.html` | 23 | Same pattern |
| 10 | `dentai/index.html` | 23 | Same pattern |

After the section landings, the next tier is:

| File | Hardcoded blues |
|---|---:|
| `glossary/index.html` | 20 |
| `global-search.css` | 17 |
| `dc-nav.css` | 16 (all are `var(--x, #hex)` fallbacks — defensive, not drift) |
| `dentcast-plus/video-6.html` | 15 |
| `search.html` | 14 |
| `dentai/dentai-2…16.html` | 11–13 each (17 files) |
| `metanotes/meta-1…13.html` | 9–10 each |
| `notecast/episode-1…33.html` | 8–11 each |
| `litecast/lite-CAST1…26.html` | 6–9 each |
| `chairside/chairside-1…16.html` | 5–7 each |
| `sharehub/share-1…6.html` | 5–6 each |

So the **realistic refactor surface is ≈ 470 files**, but the **structural refactor surface is much smaller**: ~12 templates (the section roots + the article templates) generate almost all of this.

---

## 5. Inconsistencies & Red Flags

### Same role, different blue

| Role | Variants in use | Where |
|---|---|---|
| **Article H1 color** | `var(--blue)` → `#0b5fff` on dentai/insight/litecast; `var(--text-main)` → `#0a1a33` on glossary; `#ffffff` on chairside/metanote (dark-bg pages) | Each article family wrote its own H1 rule independently |
| **Article H2 color** | `#08327a` (dentai); `var(--accent)` → `#0b5fff` (glossary); `var(--text)` → `#e7eaf1` (chairside, metanote); `var(--text)` (litecast) | 4 distinct H2 colors for the same semantic role |
| **Article link hover** | `#003bd1` (litecast), `#8ab4f8` (section-index dark mode), `#6fa3ff` (litecast 6/7/8 only) | 3 different "link hover" blues |
| **"Back to index" footer button text** | `#3a84ff` (inline, 140 files) — but the same component uses `rgba(11,95,255,0.18)` bg and `rgba(11,95,255,0.45)` border. The text colour `#3a84ff` is not a token at all. | All article footers |
| **Primary CTA button bg** | `var(--ac)` (about.html), `var(--pr)` (8 places in index/section indexes), `#0b5fff` (join.html), `#256eff` (join.html one-off), `#022360` (litecast 5 files, global-search.css) | At least 5 different colours acting as "primary button" |
| **Page background `--bg`** | `#f0f2f5`, `#f5f7fb`, `#0b1220`, `#0e1621`, `#0a0d14` defined as `--bg` across different templates | Same token, 5 different values |
| **`--bg2`** | `#121a2b`, `#101522`, `#f5f8ff` — across different files all called `--bg2` | Same token, 3 unrelated colours |
| **`--accent`** | `#0b5fff` (79 glossary files) **and** `#a334d4` (one Apple-Podcasts-style purple) | The token name has been hijacked for a non-blue elsewhere |

### Visually similar blues defined as separate tokens / values

- **`--pr`, `--blue2`, `--bn-active`, `--chip-txt`** are all `#022360`. Four token names for one colour.
- **`--ac`, `--blue`, `--accent`** are all `#0b5fff`. Three token names for one colour, and `--blue` / `--accent` are redefined inline in 218 files instead of using `--ac`.
- `#3a84ff` (140×) and `#5b9cf6` (67×) and `#4a8dff` (6×) and `#6fa3ff` (3×) and `#7aacff` (1×) and `#7ab4ff` (1×) and `#8ab4f8` (23×) and `#8eb1e6` (1×) and `#93c5fd` (1×) — **nine distinct "light-mid blue" shades** in use, none of them tokens, all serving as "blue on dark bg" or "link on dark bg". Most likely unintentional drift from a single design intent.
- `#003bb5`, `#003bd1`, `#004ecb`, `#075985`, `#08327a` — **five distinct "deep blue" shades** for heading/link/gradient-end roles, none tokens.
- `#0a1a33`, `#0a1638`, `#0a1628`, `#0b1420`, `#0b1d40`, `#0b1220`, `#0a0d14`, `#0e1621`, `#101522`, `#121a2b`, `#161a26`, `#17212b`, `#1b2640`, `#1c1c2e`, `#1e2c3a`, `#232e3c` — **sixteen distinct near-black-navy** values across the codebase. Many serve identical roles (page bg, surface, text).
- `#e5e7eb`, `#e7eaf1`, `#e8f0ff`, `#eaecf5`, `#eaf1ff`, `#eef3ff`, `#e0f2fe`, `#e2e6f3`, `#e2e8f0`, `#e3e6f2`, `#dde3f0`, `#d3daf1`, `#d5d9ea`, `#cbd2e6`, `#cbd5e1` — **fifteen pale blue-grays** serving as borders / faint surfaces.
- `#f0f2f5`, `#f2f2f7`, `#f4f6fb`, `#f5f5f7`, `#f5f7fb`, `#f5f8ff`, `#f7f8fc`, `#f7f9ff`, `#fafafc` — **nine near-white blue-tinted backgrounds**.

### Token overridden inline

- `--ac:#0b5fff` is defined in `dc-theme.css` but re-declared inline in **11** HTML files (section landings + `episodes.html`) and `--blue:#0b5fff` is redefined in **139** article files (chairside, dentai, litecast, sharehub, metanote, notecast templates).
- `--pr:#022360` re-declared inline in **11** files.
- `--accent:#0b5fff` declared inline in **79** glossary files (no global definition exists — `--accent` is **only** an inline token).
- `--bg`, `--bg2`, `--text`, `--muted`, `--surface*` all redefined inline in dozens of files, each time to either the same canonical value (= harmless duplication) or a different value (= drift).

### Dead / orphan tokens

- **`--blue2:#022360`** in `dc-theme.css:81` — **zero `var(--blue2)` references** anywhere in the codebase. Pure dead token; safe to delete.
- **`--lightblue:rgba(11,95,255,0.15)`** in ~47 insight article roots — alive but local (46 `var(--lightblue)` references, all inside the same files that define it, used for `h2{border-bottom:2px solid var(--lightblue)}`). Not dead, but **redundant with `--chip-bd`** in `dc-theme.css` which is the identical value. Candidate for consolidation.
- `--sb-active`, `--bn-active` — used only in `index.html` (2 refs each). Defined in 11 inline blocks across section landings (so 9 of the 11 inline definitions are dead duplicates).

### Structural blockers for a clean global refactor

- **PNG/raster logo.** `/logo-v2.png`, `/favicon*.png`, `/dentcast-cover.png|webp`, `/header.webp` all bake the brand blue into raster pixels. CSS variables can't reach them. Replacing the brand blue means regenerating these images.
- **`theme-color` meta tag (212 files at `#F3F5F7`, 103 files at `#0b5fff`, 8 at `#FFD95E`, plus `manifest.json:theme_color`).** Not CSS-driven — has to be edited per-file.
- **`index.html` is intentionally walled off** from `dc-theme.css` per the comment "do not touch". Any change to `--ac`/`--pr` in dc-theme.css will silently diverge from index.html unless the inline block is edited in lockstep.
- **218 article templates** each redefine `--blue` or `--accent` inline. Removing those redefinitions is mechanical but cannot be done with one CSS edit — it requires touching every file (or regenerating from a template).
- **Inline `style="…color:#3a84ff;border:1.8px solid rgba(11,95,255,0.45)…"`** on the footer-button in ~140 files. Inline styles defeat `var()` cascading unless the values are themselves replaced; the literal `#3a84ff` and `rgba(11,95,255,0.45)` strings need a find-and-replace across all article files.
- **`Style.css` is a binary file** in the working tree (mixed-encoding Persian comments cause `file` to detect it as `data`). It loads cleanly in browsers but tooling that filters by content-type may skip it.
- **No SVG fill blockers.** Every icon SVG (`assets/icons/icons.svg`) uses `stroke="currentColor"` — these inherit cleanly and pose no refactor risk.

---

## 6. Refactor Readiness Assessment

**Centralisation score: 4 / 10.**

The intent is centralised: `dc-theme.css` is well-structured, the token names are semantic (`--pr`, `--ac`, `--txt`, `--surface*`), and dark mode is consistent. The execution is decentralised: at least four parallel token sets exist (`dc-theme.css`, `index.html` inline, `Style.css`, and the per-page inline blocks in 230+ HTML files). The brand blue `#0b5fff` lives under three different token names (`--ac`, `--blue`, `--accent`) and the brand navy `#022360` under four (`--pr`, `--blue2`, `--bn-active`, `--chip-txt`). 31 % of blue colour decisions are still hardcoded hex literals.

**Changing the brand blue + link blue globally — files to touch.**

If `--ac` in `dc-theme.css` were changed in isolation:

- It would propagate to ~4,843 usages of the core blue tokens (via the cascade) — those need no edits.
- It would **not** affect `index.html` (walled off), so `index.html` lines 59 (light) and 111 (dark) must be edited in lockstep — **+1 file**.
- It would not affect the 11 section landing pages that redefine `--ac` and `--pr` inline — **+11 files**.
- It would not affect `Style.css` `--blue:#0b5fff` (line 28) — **+1 file**.
- The 139 article files that redefine `--blue:#0b5fff` inline (chairside, dentai, litecast, etc.) — **+139 files** (or one templated regeneration pass).
- The 79 glossary files that redefine `--accent:#0b5fff` inline — **+79 files**.
- Hardcoded `#0b5fff` occurrences outside `:root` blocks (about page social-link inline styles, `global-search.css:88`, `manifest.json`, `dentcast-plus/video-*.html` gradients, `join.html`, `dc-nav.css` fallbacks): roughly **20–30 files**.
- The 9 "drift" near-blues (`#3a84ff`, `#5b9cf6`, `#4a8dff`, `#6fa3ff`, `#7aacff`, `#7ab4ff`, `#8ab4f8`, `#8eb1e6`, `#93c5fd`) — if you want the new brand blue to drive these too, **another ~160 files** (mostly the footer "back" button inline style).
- 103 `<meta name="theme-color" content="#0b5fff">` tags — **103 files**, plus `manifest.json`.

For the link blue specifically: there is no `--link` token. Links inherit colour role-by-role (`color:var(--ac)` in some files, `color:var(--blue)` in others, `color:#3a84ff` inline in 140 files, `color:#0b5fff` inline in 6 files, `color:#003bd1` on litecast hover, `color:#6fa3ff` on three litecast files, `color:#7aacff` on `index.html:1680`). Changing "link blue" globally means **introducing a `--link` token first** and then editing roughly the same ~250-file surface.

**Realistic estimate: 350–450 files for a fully consistent brand-blue + link-blue swap.** The structural template-and-edit count is far smaller (~12 templates), so the work is bounded if you regenerate templates rather than edit instances.

**Structural blockers that prevent a 100 % clean CSS-only refactor:** the PNG/webp logo + favicon + header artwork, the 323 `<meta theme-color>` tags, the 140 inline-style "back to index" buttons, `manifest.json`, and the deliberate isolation of `index.html` from `dc-theme.css`. None of these are CSS-reachable.
