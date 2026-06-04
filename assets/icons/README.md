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

Added for migrating in-body emoji like <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.8.8 1 1.5 1 2.3h6c0-.8.2-1.5 1-2.3A7 7 0 0 0 12 2z"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m5 12 5 5L20 7"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v5"/><path d="M12 18h.01"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m12 2 3 7h7l-5.5 4.5L19 21l-7-4.5L5 21l2.5-7.5L2 9h7z"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M3 3v18h18"/><rect x="7" y="13" width="3" height="6"/><rect x="12" y="9" width="3" height="10"/><rect x="17" y="5" width="3" height="14"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/></svg> <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="2" y="9" width="20" height="6" rx="1"/><path d="M6 9v3"/><path d="M10 9v4"/><path d="M14 9v3"/><path d="M18 9v4"/></svg> (blue square section marker) used in Insight and Chairside articles — replaced by `icon-bookmark`.

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

### Interface — state & action (added in emoji-migration pass)

| Symbol id          | Visual                      | Intent                                      |
|--------------------|-----------------------------|---------------------------------------------|
| `icon-x-circle`    | X inside a circle           | Error state / dismiss / invalid             |
| `icon-help-circle` | ? inside a circle           | Help / FAQ / tooltip trigger                |
| `icon-refresh`     | CCW circular arrow          | Reload / repeat / update                    |
| `icon-download`    | Tray with down-arrow        | Save / download action                      |
| `icon-monitor`     | Screen + stand              | Display / screen / desktop context          |
| `icon-plus`        | Plus / cross                | Add / expand / new item                     |

### Concept icons (added in emoji-migration pass)

| Symbol id       | Visual                    | Intent                                          |
|-----------------|---------------------------|-------------------------------------------------|
| `icon-heart`    | Heart shape               | Favorite / liked / care                         |
| `icon-scale`    | Balance scale             | Evidence balance / judgment / comparison        |
| `icon-gear`     | Gear with spokes          | Settings / mechanism / technique                |
| `icon-key`      | Key                       | Access / authentication / concept key           |
| `icon-lock`     | Padlock                   | Security / restricted / protected               |
| `icon-diamond`  | Gem shape                 | Premium / featured / high-value                 |
| `icon-shield`   | Shield                    | Protection / safety / prevention                |
| `icon-sprout`   | Organic leaf + stem       | Growth / natural / regeneration                 |
| `icon-wrench`   | Wrench                    | Tools / repair / clinical technique             |
| `icon-bullet`   | Small filled circle       | Inline list bullet / separator                  |
| `icon-graduation-cap` | Mortarboard + tassel | Education / course / learning series (e.g. Promptologist) |

### Scientific & dental (added in emoji-migration pass)

| Symbol id         | Visual                            | Intent                                   |
|-------------------|-----------------------------------|------------------------------------------|
| `icon-microbe`    | Spiky circle (8 radial spikes)    | Microorganism / pathogen / infection     |
| `icon-microscope` | Microscope body + arm + lens      | Research / lab / evidence / science      |

### Editorial — direction

These are **physical-direction** glyphs. The library does not auto-mirror — pick the visual you want.

| Symbol id              | Visual                  | RTL note                           |
|------------------------|-------------------------|------------------------------------|
| `icon-chevron-up`      | Chevron pointing up     | Direction-neutral                  |
| `icon-chevron-down`    | Chevron pointing down   | Direction-neutral                  |
| `icon-chevron-left`    | Chevron pointing left   | "Next" in RTL · "Previous" in LTR  |
| `icon-chevron-right`   | Chevron pointing right  | "Previous" in RTL · "Next" in LTR  |
| `icon-arrow-right`     | Arrow pointing right    | Forward / next in LTR              |
| `icon-arrow-left`      | Arrow pointing left     | Back / previous in LTR             |

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
