# Ad placement audit — dentcast.org

*Generated 2026-06-23. Read-only analysis. No files modified, no ad code added or removed.*

**Scope note:** this is an inventory and structural assessment only. **No pricing of any kind is included or implied anywhere in this report.** Pricing is explicitly out of scope and will be addressed in a separate, later exercise.

---

## Method

- Searched all 642 HTML files in the repo for ad-styled classes (`*-ad`, `ad-*`) and manually inspected every hit.
- Read `dc-nav.js` (the shared-header/shared-chrome script, injected on effectively every page) end-to-end to map every mount point of the shared `/player.html`.
- Read `player.html`, `index.html`, and `episodes.html` in full to confirm exact markup, CSS, and page position of each placement.
- Checked `dentcast-brain.json` for any structured sponsor/ad schema — none exists; both known placements are hand-coded directly into their host pages.
- Used page-count-per-content-type as a structural (not traffic-based) proxy for how much of the site's surface area a given page/section represents:

  ```
  episodes: 208   glossary: 96   insight: 51   notecast: 35   litecast: 34
  dentai: 30      chairside: 20  metanotes: 14  pillar: 11    sharehub: 10
  dentcast-plus: 7  photocast: 4  card: 1  patient: 1  patients: 1
  ```

No traffic, click, or revenue figures are used or estimated anywhere below — all visibility judgments are reasoned from page structure, navigation depth, and render conditions only.

---

## 1. Existing placement — Homepage Pulse ad (occupied, reciprocal swap)

- **File / component:** `index.html`, `.dc-pulse-ad` inside `#dcPulseCard` (the "Pulse · latest news" widget).
- **Partner:** **دیونت (Devent)** — `https://deventapp.ir`, described in-page as "پلتفرم آگهی تجهیزات کار کرده و خدمات دندانپزشکی" (a marketplace for used dental equipment/services). The same partner also appears, separately, as an unpaid directory listing in `radar.json` (`com-018`) — that listing is part of the site's "radar" directory feature, not part of this ad slot, but it's worth knowing the relationship with this partner exists in two independent places in the codebase.
- **Slot markup:**
  ```html
  <div class="dc-pulse-ad">
    <a href="https://deventapp.ir" target="_blank" rel="sponsored noopener">
      <div class="dc-pulse-ad-txt"><strong>دیونت</strong> : پلتفرم آگهی تجهیزات کار کرده و خدمات دندانپزشکی</div>
      <span class="dc-pulse-ad-btn">بازدید</span>
    </a>
  </div>
  ```
- **Dimensions:** no fixed pixel box — it's a fluid, full-width row inside the Pulse card (`padding: .5rem .625rem`, rounded corners, tinted background/border). It scales with the card's width on both mobile and desktop; there is no separate "ad unit" size to quote, it's a styled text+button row.
- **Pages/contexts:** homepage only (`index.html`). Rendered identically on **both** the mobile single-column layout (`#mobile-shell`) and the desktop 3-column app-shell (`.dcd-app`), because `syncDesktopPulse()` clones the entire Pulse card — ad included — from the mobile DOM (`#dcPulseCard`) into the desktop DOM (`#dcdPulse`) at runtime. So this is the one ad in the codebase confirmed to render the same on both homepage "breeds."
- **Global vs page-specific:** page-specific — homepage only. Not site-wide.
- **Status:** **occupied** (active reciprocal swap with دیونت).
- **Visibility reasoning:** the homepage is the site's single entry point and the Pulse card sits inside the default-active panel (`#panel-studio`) — i.e., visible without any further navigation or interaction. This is a passive, page-load-visible slot, not gated behind any tap/toggle. Structurally, it's the strongest single ad position in the site we found: zero-click visibility on the page every other page links back to.

---

## 2. Existing placement — Episodes-page ad card (empty, self-pitch)

- **File / component:** `episodes.html`, `<article class="ad-card" id="card-ad-contact">` (SECTION 2 of the page). Mirrored in the build template `tools/episodes_template.html`, confirming it's a maintained, intentional part of the page rather than a one-off edit.
- **Slot markup:**
  ```html
  <section class="section">
    <article class="ad-card" id="card-ad-contact">
      <a href="mailto:info@dentcast.ir?subject=درخواست معرفی برند در دنت‌کست" class="ad-link">
        <div class="dc-card-main">
          <div class="dc-card-title">اینجا محل معرفی برند شما به جامعه دندانپزشکیست.</div>
        </div>
        <strong class="ad-strong">تماس بگیرید</strong>
      </a>
    </article>
  </section>
  ```
- **Dimensions:** fluid single-row card, same general sizing pattern as the Pulse card (`border-radius: 1.125rem`, padding `.875rem 1rem`) — no fixed pixel ad unit.
- **Pages/contexts:** `episodes.html` only — the hub/listing page. Confirmed **absent** from all 208 individual `episodes/episode-N.html` detail pages (repo-wide grep found ad-styled classes only in `index.html`, `episodes.html`, and the template — nowhere in the per-episode pages).
- **Global vs page-specific:** page-specific.
- **Status:** **empty / unsold** — currently just a self-referential "advertise with us" mailto link, not an actual advertiser's ad.
- **Page position:** appears second in document order (Hero → Featured/Recommended → **Ad card** → Listen/player → Archive → SEO → Footer), i.e. above the fold or just below it on most viewports, before the user reaches the actual episode list/player.
- **Visibility reasoning:** episodes.html is the largest single content hub on the site (208 underlying episodes) and is directly linked from the homepage in two places — a dedicated list-card (`onclick="window.location.href='episodes.html?v=1'"`) and the desktop sidebar's "اپیزودها" nav item — plus indirectly via the homepage hero card, which actually points to the latest *individual* episode page rather than the hub itself. So the hub is one navigation step deep from the homepage, not the landing page itself, but it's the canonical destination for anyone browsing the full catalog rather than reading the single latest item. It's a passive, page-load-visible slot (no click/tap needed once the page loads), positioned early in the page.

---

## 3. Confirmation — no other existing ad placements found

A repo-wide search for ad-styled classes across all 642 HTML files returned matches in exactly three files: `index.html`, `episodes.html`, and `tools/episodes_template.html` (the template, not a live page). No other page — including all 208 episode pages, all glossary/insight/notecast/litecast/dentai/etc. content types, and the EN-mirror pages — currently has any ad markup. `dentcast-brain.json` has no sponsor/ad/partner schema field on any content type, confirming both existing placements are hand-coded directly into their host pages rather than driven by a shared data layer.

---

## 4. Proposed placement — ad bound to the shared player (`player.html`)

This is the placement the user asked to be evaluated, not one that currently exists. `/player.html` is a single shared file embedded at **three independent mount points**, all controlled by `dc-nav.js`:

1. **Header headphone-icon drawer** — `#dcPlayerOverlay` / `#dcPlayerOverlayHolder`, opened by tapping the podcast icon in the standard injected header. Available everywhere the standard header is injected.
2. **Shake-gesture bottom drawer** — `#dc-shake-drawer` / `#dc-shake-iframe`, opened by a shake gesture. In practice mobile-only (shake-detection has no meaningful desktop equivalent).
3. **`episodes.html`'s own "Internal player" toggle** — `#internalFrameHolder`, page-local to the Episodes hub.

Because all three load the exact same `/player.html`, **any ad coded directly into `player.html` would automatically appear in all three mount points** — that part is genuinely global by construction. However, "site-wide" needs qualification on two axes:

### a) Reach is broad but not universal

- The standard header (and therefore the headphone-icon drawer that hosts mount #1) is injected by `dc-nav.js` on effectively every page **except**:
  - The homepage's **desktop 3-column app-shell** (`.dcd-app`) — it has its own bespoke header (`.dcd-col-c-topbar`) that `dc-nav.js` explicitly excludes from injection, and that header has **no podcast trigger at all**. So on desktop-width/desktop-pointer visits to the homepage, there is no headphone icon to open the drawer in the first place.
  - **EN-mirror pages** (`/{type}/en/...`, marked `data-dc-no-header`) — these keep separate localized chrome and are excluded from header injection, so they also have no podcast trigger.
  - Any page rendered **inside an iframe** (`window.self !== window.top`) — `dc-nav.js` explicitly hides the podcast trigger/overlay in that context, by design, e.g. so the desktop shell's own content-viewer iframe never spawns a nested player.
- The shake-gesture drawer (mount #2) is global in code but mobile-only in practice.
- The episodes.html internal player (mount #3) is page-local to one page.

So the honest reach statement: **broad technical distribution across most of the site's pages, with the homepage's desktop shell and EN-mirror pages as explicit, structural exceptions** — not a literal 100%-of-pages placement.

### b) Visibility is interaction-gated, not passive

This is the more consequential nuance. Across all three mount points, the player iframe is **lazily created only on user interaction** — tapping the headphone icon, shaking the device, or tapping the episodes-page toggle. It is never mounted on page load. Concretely:

- An ad living inside `player.html` would **not** render simply because a visitor loaded a page — it would only render after the visitor *deliberately opens the player*. This is structurally different from the homepage Pulse ad or the episodes ad-card, both of which are visible passively as soon as the host page loads.
- Closing a drawer only hides it via CSS — the iframe is not unmounted — so once opened, the ad would persist across open/close cycles within that single page view. But a full page navigation destroys the iframe entirely (only the playback *position*, not the iframe/session, persists via `localStorage`), so the ad would need to be re-triggered by another open action on every new page load.

### Other technical constraints (as requested)

- **Drawer state:** header drawer, shake drawer, and the episodes-page internal player are mutually exclusive with each other and with background music — only one can be "live" at a time, enforced by `dcPodOnPlay`, `window.dcEpisodesInlinePause`, and `window.dcPodcastStop`. An ad inside the player would be subject to the same single-active-surface rule — it can't be "live" in two mount points simultaneously for the same visitor.
- **Autoplay/resume flow:** resuming playback position is automatic (`localStorage`-backed `dc-resume-state`), but the player never auto-plays on mount — it only restores position, waiting for an explicit tap. Any ad logic timed around "on play" vs "on open" needs to account for this gap (a visitor can open the player and see it sitting paused for an arbitrary amount of time before pressing play, if they press it at all).
- **Mobile vs desktop layout:** `player.html` is a single responsive component reused across all three mounts, so an ad inside it would inherit whatever responsive behavior is built into that file — no separate desktop/mobile ad variant would be needed for layout reasons. The bigger desktop constraint is the *absence of the trigger itself* on the homepage's desktop shell, described above, not the player's internal layout.

### Summary for this placement

| | |
|---|---|
| **File / component** | `player.html` (would live in its existing `.dc-wrapper` card markup) |
| **Pages/contexts** | All pages with the standard header (drawer + shake mounts) + `episodes.html` (internal player mount) |
| **Global vs page-specific** | Broadly global by file-sharing, **with explicit exceptions** (homepage desktop shell, EN-mirror pages, iframe contexts) |
| **Status** | **proposed** — no ad code exists in `player.html` today |
| **Visibility reasoning** | Wide technical distribution, but render is **interaction-gated** (post-tap/shake), not passive page-load visibility like the other two placements. Actual exposure depends on how often visitors choose to open the player, which is a behavioral question this audit cannot quantify without traffic data — and is explicitly out of scope here. |

---

## 5. Ranked list — placements worth offering to advertisers

Ranked purely by reach and structural prominence, reasoning from page structure and navigation flow only — no pricing, no traffic estimates.

1. **Homepage Pulse ad slot (`index.html`)** — strongest position. It's on the site's single entry point, visible passively on page load with no interaction required, and (uniquely among the three) confirmed to render identically across both the mobile and desktop homepage layouts via `syncDesktopPulse()`. Currently occupied by the Devent swap, but this is the benchmark slot any other placement should be measured against.

2. **Episodes-page ad card (`episodes.html`)** — second strongest. It sits on the largest single content hub in the site (208 episodes' worth of listing/catalog traffic funnels through this one page) and is passively visible early in the page on load, no interaction needed. It's one navigation step removed from the homepage rather than being the landing page itself, and unlike the homepage slot, the homepage's hero CTA bypasses it (linking straight to the latest single episode rather than the hub) — so it doesn't fully inherit the homepage's "default first view" status. Currently empty/unsold, structurally the most direct second slot to offer.

3. **Player-bound ad (proposed, `player.html`)** — most structurally interesting due to its single-file/three-mount-point reuse, but ranks third because its visibility depends on a visitor actively opening the player rather than rendering passively — a fundamentally different (and currently unquantifiable, since traffic data is out of scope here) exposure model than the other two. It also carries explicit reach exceptions (no podcast trigger on the homepage's desktop shell; none on EN-mirror pages). If pursued, it should be evaluated/positioned as a "high-intent, lower-frequency" surface — seen only by visitors who deliberately engage with audio — rather than a passive-impression surface like the other two.
