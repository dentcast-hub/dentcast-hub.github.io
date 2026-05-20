# DentCast Icon Library

Single source of truth for every SVG icon used across the site. The sprite lives at:

```
/assets/icons/icons.svg
```

Every icon is defined as a `<symbol>` inside that file. Pages reference symbols by id via the `<use>` element. There is no other canonical icon source — anything new joins this file.

This document is the index. If an icon is not listed here, it is not in the library.

---

## How to use

### Basic reference

```html
<svg class="dc-icon" aria-hidden="true">
  <use href="/assets/icons/icons.svg#icon-headphones"/>
</svg>
```

The icon inherits its **color** from `currentColor` (so the parent element's text color, or any explicit `color:` rule, becomes the stroke color).

The icon inherits its **size** from the host element — set `width` and `height` (or `font-size` if the host CSS uses `em`) on the `.dc-icon` wrapper.

### Suggested host class

The site already has `.dc-svg-icon` defined in CSS for the legacy JS-hydrated icons. The same shape works for sprite references. A minimal helper, if you want a fresh class:

```css
.dc-icon{
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: -.125em;
  color: currentColor;        /* feeds stroke via currentColor inheritance */
  flex-shrink: 0;
}
```

The symbols in the sprite already specify `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, and round line caps/joins, so this class doesn't need to repeat them.

### Sizing recipe

| Context              | Recommended size |
|----------------------|------------------|
| Body / inline glyph  | `1em` (auto)     |
| Card eyebrow row     | `18–22px`        |
| Header / topbar btn  | `22–24px`        |
| Bottom tab bar       | `22–24px`        |
| Hero / display icon  | `32–48px`        |

### Coloring

```html
<!-- inherits surrounding text color -->
<svg class="dc-icon"><use href="/assets/icons/icons.svg#icon-warning"/></svg>

<!-- explicit color on the wrapper -->
<svg class="dc-icon" style="color:#c49820"><use href="..."/></svg>
```

Do **not** put a `fill` or `stroke` attribute on the `<svg>` wrapper — let `currentColor` flow through.

---

## Canonical category mapping

These are the icons that represent the four content domains of the site. **Always use the mapping below** when tagging content by category — do not mix headphones with Studio content or microphone with Episodes.

| Domain      | Icon              | Symbol id           | Used for                                                  |
|-------------|-------------------|---------------------|-----------------------------------------------------------|
| Episodes    | Headphones        | `icon-headphones`   | The main podcast (`/episodes/`)                           |
| Studio      | Microphone        | `icon-microphone`   | NoteCast, LiteCast, PhotoCast, DentAI, +DentCast          |
| Meta Base   | Node-graph        | `icon-node-graph`   | Clinical Insight, Chairside, Meta Note                    |
| Glossary    | Open book         | `icon-book`         | The dictionary (`/glossary/`)                             |

---

## Full inventory

### Interface — controls & navigation

| Symbol id          | Visual              | Intent                                       |
|--------------------|---------------------|----------------------------------------------|
| `icon-menu`        | Three lines         | Open menu / drawer                           |
| `icon-search`      | Magnifier           | Search                                       |
| `icon-x`           | Two diagonals       | Close / dismiss                              |
| `icon-back`        | Left-pointing arrow | "Back" — see RTL note below                  |
| `icon-info`        | i in a circle       | More information                             |
| `icon-ban`         | Circle with slash   | Disabled / not available                     |
| `icon-hourglass`   | Sand timer          | Pending / waiting                            |

### Interface — theme & decoration

| Symbol id       | Visual         | Intent                                |
|-----------------|----------------|---------------------------------------|
| `icon-moon`     | Crescent       | Dark theme indicator                  |
| `icon-sun`      | Sun with rays  | Light theme indicator                 |
| `icon-sparkle`  | Two stars      | Decorative accent / "new" / "magic"   |

### Interface — device & install

| Symbol id            | Visual                        | Intent                  |
|----------------------|-------------------------------|-------------------------|
| `icon-phone-install` | Phone with download arrow     | PWA install prompt      |

### Navigation — place & file

| Symbol id      | Visual          | Intent                          |
|----------------|-----------------|---------------------------------|
| `icon-home`    | House silhouette| Return to homepage              |
| `icon-globe`   | Globe with grid | Internet / external / language  |
| `icon-pin`     | Map pin         | Location                        |
| `icon-folder`  | Folder          | Group / directory               |

### Communication

| Symbol id        | Visual            | Intent                         |
|------------------|-------------------|--------------------------------|
| `icon-mail`      | Envelope          | Email                          |
| `icon-phone`     | Receiver          | Telephone                      |
| `icon-message`   | Chat bubble       | Direct message / chat          |
| `icon-send`      | Paper plane       | Send action                    |
| `icon-flag`      | Flag              | Flag / national / report       |
| `icon-volume`    | Speaker waves     | Audio volume                   |

### Media — actions

| Symbol id          | Visual                    | Intent             |
|--------------------|---------------------------|--------------------|
| `icon-play`        | Triangle in circle        | Play media         |
| `icon-pause`       | Two bars in circle        | Pause media        |
| `icon-microphone`  | Mic capsule + base + stand| Studio / recording |
| `icon-camera`      | Camera body + lens        | Photo / capture    |

### Brand — content categories

| Symbol id           | Visual                              | Intent                          |
|---------------------|-------------------------------------|---------------------------------|
| `icon-headphones`   | Over-ear headphones                 | **Episodes** (canonical)        |
| `icon-microphone`   | Microphone                          | **Studio** (canonical)          |
| `icon-node-graph`   | Three nodes + connecting lines      | **Meta Base** (canonical)       |
| `icon-book`         | Open book                           | **Glossary** (canonical)        |
| `icon-bot`          | Robot head                          | DentAI                          |
| `icon-radar`        | Concentric rings + sweep line       | Radar tool                      |

### Brand — concept icons

| Symbol id     | Visual                    | Intent                            |
|---------------|---------------------------|-----------------------------------|
| `icon-tooth`  | Molar silhouette          | Dental concept / dental content   |
| `icon-brain`  | Brain halves              | Clinical reasoning / Insight      |
| `icon-puzzle` | Single puzzle piece       | Analytical models / Meta Note     |
| `icon-user`   | Head + shoulders          | Patient / person                  |
| `icon-note`   | Document with text lines  | NoteCast / written note           |
| `icon-link`   | Chain link                | Share Hub / external link         |

### Editorial — callouts & emphasis

Added for migrating in-body emoji like 💡 ✔ ⚠ ⚡ 🎯 ⭐ 📊 📈 📏 🟦 used in Insight and Chairside articles.

| Symbol id            | Visual                      | Intent                                |
|----------------------|-----------------------------|---------------------------------------|
| `icon-lightbulb`     | Bulb + base                 | Tip / key insight                     |
| `icon-check`         | Checkmark                   | Confirmation / done                   |
| `icon-check-circle`  | Checkmark in circle         | Success state                         |
| `icon-warning`       | Triangle with bang          | Warning / caution                     |
| `icon-alert-circle`  | Circle with bang            | Alert / attention                     |
| `icon-lightning`     | Lightning bolt              | Urgent / critical / high-impact       |
| `icon-target`        | Three concentric circles    | Goal / objective                      |
| `icon-star`          | Five-point star             | Featured / highlighted                |
| `icon-chart-bar`     | Bar chart                   | Statistics / data                     |
| `icon-chart-line`    | Trend line                  | Growth / trend                        |
| `icon-ruler`         | Ruler                       | Measurement / dimension               |
| `icon-bookmark`      | Bookmark                    | Section marker (replaces 🟦)           |

### Editorial — direction

These are **physical-direction** glyphs. The library does not auto-mirror — pick the visual you want.

| Symbol id              | Visual                  | RTL note                           |
|------------------------|-------------------------|------------------------------------|
| `icon-chevron-up`      | Chevron pointing up     | Direction-neutral                  |
| `icon-chevron-down`    | Chevron pointing down   | Direction-neutral                  |
| `icon-chevron-left`    | Chevron pointing left   | "Next" in RTL · "Previous" in LTR  |
| `icon-chevron-right`   | Chevron pointing right  | "Previous" in RTL · "Next" in LTR  |

For `icon-back`: the glyph points left. In RTL contexts, "back" usually means moving forward visually-right, so prefer `icon-chevron-right` for the back button on RTL pages instead of `icon-back`.

---

## Adding a new icon

1. Decide on a semantic name: lowercase, hyphenated, prefixed with `icon-`. Examples: `icon-syringe`, `icon-x-ray`, `icon-implant`.
2. Add a new `<symbol>` block inside the matching section in `icons.svg`. Copy an existing symbol's attribute set to keep the spec uniform.
3. Keep the artwork on the `0 0 24 24` viewBox, using strokes only (no fills) so `currentColor` inheritance works.
4. Add a row to the inventory table in this README under the right section.
5. If the icon represents a content category, update the **Canonical category mapping** table.

## What this library does not do

- Color theming inside the sprite. Color comes from the host element.
- Auto-mirroring of directional icons in RTL. Choose `chevron-left` vs `chevron-right` by intent.
- Sizing. The host element controls width/height.
- Animation. Animations live in the consuming CSS, not the sprite.

---

## Migration status (for Chunks B & C)

The site currently has two parallel JS-based icon systems that pre-date this sprite:

- `index.html` — `paths` dictionary in the bottom IIFE (~line 2946)
- `dc-nav.js` — `icons` table (~line 11)

Both will be migrated to consume the sprite in a later chunk. This file is the destination; nothing in the HTML has been changed yet.
