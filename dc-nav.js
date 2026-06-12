/* =====================================================
   dc-nav.js — DentCast Shared Navigation Logic
   Toolbar Drawer · Search · Radar · PWA · Theme Toggle
   Used by all internal pages. index.html has its own.
===================================================== */

(function () {
  'use strict';

  function dcSvgIcon(name) {
    var icons = {
      menu: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
      radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7"/><path d="M12 12h.01"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
      phoneInstall: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      sparkle: '<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
      x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      moon: '<path d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.8 8.8 0 1 0 20.5 14.2z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>',
      home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
      message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
      back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
      volume: '<path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
      globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/>',
      pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
      phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9z"/>',
      camera: '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z"/><circle cx="12" cy="13" r="4"/>',
      send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
      flag: '<path d="M5 21V4"/><path d="M5 4h13l-2 4 2 4H5"/>',
      play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
      pause: '<circle cx="12" cy="12" r="10"/><path d="M10 8v8"/><path d="M14 8v8"/>',
      mic: '<path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4z"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 17v4"/><path d="M8 21h8"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
      bot: '<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V4"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M9 18v2"/><path d="M15 18v2"/>',
      link: '<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/>',
      headphones: '<path d="M3 14a9 9 0 0 1 18 0"/><path d="M5 14h3v7H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z"/><path d="M19 14h-3v7h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/>',
      musicNote: '<ellipse cx="8" cy="17.4" rx="3.3" ry="2.5" transform="rotate(-22 8 17.4)"/><path d="M10.7 16.2V6.2h1.7v10z"/><path d="M12.4 6.2c0-1.6 1.6-2.4 3.4-3.2 1.8-.8 2.2.2 2.2 1.6 0 1.8-2 2.8-3.6 3.6-1 .5-2 1-2 2.2z"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
      brain: '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5.2A3.5 3.5 0 0 0 8 19h1"/><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5.2A3.5 3.5 0 0 1 16 19h-1"/><path d="M12 4v17"/><path d="M8 9h2"/><path d="M14 9h2"/><path d="M8 14h2"/><path d="M14 14h2"/>',
      puzzle: '<path d="M8 3h4v4h3a2 2 0 1 1 0 4h-3v3h3a2 2 0 1 1 0 4h-3v3H8v-3H5a2 2 0 1 1 0-4h3v-3H5a2 2 0 1 1 0-4h3z"/>',
      tooth: '<path d="M8.5 3.5c1.2 0 2 .6 3.5.6s2.3-.6 3.5-.6c2 0 3.5 1.6 3.5 4 0 2.8-1.5 4.4-2.2 7.4-.7 3-1.4 5.6-3 5.6-1.2 0-1.1-3.5-1.8-3.5s-.6 3.5-1.8 3.5c-1.6 0-2.3-2.6-3-5.6C6.5 11.9 5 10.3 5 7.5c0-2.4 1.5-4 3.5-4z"/>',
      folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
      ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
      hourglass: '<path d="M6 2h12"/><path d="M6 22h12"/><path d="M7 2v6l5 4-5 4v6"/><path d="M17 2v6l-5 4 5 4v6"/>'
    };
    if (!icons[name]) return '';
    return '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + '</svg>';
  }

  function setDcIcon(el, name, label) {
    if (!el || !name) return;
    el.innerHTML = dcSvgIcon(name) + (label ? '<span>' + label + '</span>' : '');
  }

  function iconNameFromEmoji(txt) {
    txt = (txt || '').replace(/\ufe0f/g, '').trim();
    return {
      '☰': 'menu', '📡': 'radar', '🔍': 'search', '📱': 'phoneInstall',
      '📧': 'mail', '✨': 'sparkle', '✖': 'x', '✕': 'x', '×': 'x',
      '🌙': 'moon', '☀': 'sun', '🏠': 'home', '💬': 'message',
      '🔙': 'back', '🔊': 'volume', '🛈': 'info', '🌐': 'globe',
      '📍': 'pin', '☎': 'phone', '📞': 'phone', '📷': 'camera',
      '✈': 'send', '🇮🇷': 'flag', '▶': 'play', '⏸': 'pause',
      '🎙': 'mic', '👤': 'user', '📝': 'note', '🤖': 'bot',
      '🔗': 'link', '🎧': 'headphones', '📚': 'book', '🧠': 'brain',
      '🧩': 'puzzle', '🦷': 'tooth', '📸': 'camera', '📂': 'folder',
      '🚫': 'ban', '⏳': 'hourglass', '🎬': 'play', '🩺': 'brain',
      '⚡': 'sparkle', '📬': 'mail', '⌕': 'search'
    }[txt];
  }

  function escapeHTML(s) {
    return (s || '').replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function hydrateUiIcons(root) {
    root = root || document;
    var iconSelector = '.dc-topbar-btn,.dc-drawer-tool-ico,.about-contact-ico,.dc-info-btn,.dc-search-info-btn,.dc-close-results,.dc-radar-hero-ico,.ep-ico,.dc-grid-ico,.gls-ico,.pt-btn-ico,.dc-bn-ico,.dcd-group-hdr-ico,.dcd-subitem-ico,.dcd-a-footer-btn>span:first-child,.dcd-col-b-empty-ico,.logo,.searchIcon,#dc-theme-toggle';
    var iconNodes = Array.prototype.slice.call(root.querySelectorAll(iconSelector));
    if (root.nodeType === 1 && root.matches(iconSelector)) iconNodes.unshift(root);
    iconNodes.forEach(function (el) {
      var name = iconNameFromEmoji(el.textContent);
      if (name) setDcIcon(el, name);
    });
    var leadingSelector = '.btn-home,.btn-about,.btn-back,.dc-ui-link-icon,.acast-close,.ai-title,.header-sub,.capsule-btn,.wrap>header h1,.wrap>h2,#page-content .page-header h2,main>h2,button';
    var leadingNodes = Array.prototype.slice.call(root.querySelectorAll(leadingSelector));
    if (root.nodeType === 1 && root.matches(leadingSelector)) leadingNodes.unshift(root);
    leadingNodes.forEach(function (el) {
      var txt = el.textContent.trim();
      var m = txt.match(/^(\S+)\s*(.*)$/);
      if (!m) return;
      var name = iconNameFromEmoji(m[1]);
      if (name) {
        el.classList.add('dc-has-ui-icon');
        setDcIcon(el, name, escapeHTML(m[2]));
      }
    });
    var titleNodes = Array.prototype.slice.call(root.querySelectorAll('.dc-list-card-title'));
    if (root.nodeType === 1 && root.matches('.dc-list-card-title')) titleNodes.unshift(root);
    titleNodes.forEach(function (el) {
      var txt = el.textContent.trim();
      var m = txt.match(/^(.*)\s+(🧠|🦷|🧩)$/u);
      if (m) el.innerHTML = m[1] + ' ' + dcSvgIcon(iconNameFromEmoji(m[2]));
    });
  }

  window.dcSvgIcon = dcSvgIcon;
  window.dcHydrateUiIcons = hydrateUiIcons;

  /* ── CONTENT-ONLY MODE (?view=content) ────────────
     When loaded in the desktop iframe, hide all chrome
     so only the article content is displayed.
  ─────────────────────────────────────────────────── */
  if (new URLSearchParams(window.location.search).get('view') === 'content') {
    document.body.classList.add('dc-content-only');
  }

  /* ── SHARED HEADER — SINGLE SOURCE OF TRUTH ───────
     The dc-topbar header used to be copy-pasted into every
     page. It now lives here, once, and is injected at runtime
     so header changes (and the upcoming global music player,
     which lives in the header) reach every page without
     editing hundreds of files.

     Strategy — REPLACE-IN-PLACE, scoped to the header element:
       1. Replace ONLY the page's own <header.dc-topbar> with the
          canonical one, at its original position. Pages keep their
          static header as a no-JS/SEO fallback; we swap it at load.
       2. The toolbar drawer (#dcToolbarDrawer) and radar overlay
          (#dcRadarOverlay) are injected ONLY IF the page lacks them.
          We never replace existing ones, so page-owned logic that
          holds a reference to them (e.g. index.html's inline radar)
          keeps working untouched. The radar overlay MUST end up
          present either way: the radar block further below does an
          early `return` from this IIFE if its elements are missing,
          which would kill every binding defined after that point.

     Scope guarantees (header-contract):
       • We target ONLY the page's mobile header, never the desktop
         app-shell header (.dcd-col-c-topbar inside .dcd-app, in
         index.html) — that shell is owned elsewhere and untouched.
       • Pages whose header is a different localized variant opt out
         via <html data-dc-no-header> and keep their own markup.
       • Deliberately chrome-less pages (no header at all, e.g. the
         embedded player) have nothing to replace, so nothing is
         injected — they stay as-is.

     Timing: this runs synchronously during dc-nav.js's deferred
     execution, BEFORE DOMContentLoaded. Consumers that read header
     elements inside a DOMContentLoaded handler — notably
     global-search.js, which binds #dcSearch with no null guard —
     therefore always find the injected elements already present.
  ─────────────────────────────────────────────────── */
  var DC_TOPBAR_HTML =
'<header class="dc-topbar">' +
'  <div class="dc-topbar-actions">' +
'    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>' +
'    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>' +
/* Podcast player launcher — the icon itself is the toggle (tap to open, tap to
   close) for the global slide-down player drawer that hosts the /player.html
   iframe (see DC_PLAYER_OVERLAY_HTML + the podcast-drawer block below). The
   search trigger that used to sit here moved INTO the tool drawer
   (DC_DRAWER_SEARCH_BTN) to make room. Idle styling is accent-tinted to draw a
   little attention; the .is-playing state mirrors the music trigger exactly
   (same .dc-music-eq equalizer + dcGlow), driven by the iframe's audio and kept
   accurate even while the drawer is closed. */
'    <button class="dc-topbar-btn dc-podcast-trigger" id="btn-podcast-toggle" aria-label="پادکست دنت‌کست" aria-haspopup="true" aria-expanded="false">' + dcSvgIcon('headphones') + '<span class="dc-music-eq" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
/* Music player trigger. Base icon is a simple music note (always shown). When
   playing, the equalizer animation + a soft glow activate within the icon area
   (the note stays); idle shows just the note. Driven by the .is-playing class.
   The button ONLY toggles #dcMusicPanel via delegation — it never affects
   playback (play/pause is a separate control inside the panel). */
'    <button class="dc-topbar-btn dc-music-trigger" id="btn-music-toggle" aria-label="موسیقی" aria-expanded="false">' + dcSvgIcon('musicNote') + '<span class="dc-music-eq" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
'  </div>' +
'  <div class="dc-topbar-brand">' +
'    <div class="dc-topbar-brand-name">DentCast</div>' +
'    <a href="/about.html" class="dc-topbar-brand-sub">دکتر فواد شهابیان</a>' +
'  </div>' +
'</header>';

  var DC_DRAWER_HTML =
'<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">' +
'  <div class="dc-toolbar-drawer-inner">' +
'    <span class="dc-toolbar-drawer-label">ابزارها</span>' +
'    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>' +
'    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>' +
'    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>' +
'  </div>' +
'</div>';

  var DC_RADAR_HTML =
'<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">' +
'  <div class="radar-overlay-header">' +
'    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>' +
'    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>' +
'  </div>' +
'  <div class="radar-overlay-body">' +
'    <div class="radar-search-box">' +
'      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">' +
'    </div>' +
'    <div id="dcRadarResults" class="radar-results">' +
'      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>' +
'    </div>' +
'  </div>' +
'</div>';

  /* Radar trigger as a drawer tool button (Change A): the radar used to sit
     in the top bar; it now lives in the drawer alongside tool-pwa/consult/
     about. Same sacred id (#btn-radar-topbar) and same delegated wiring to
     openRadar(true) — only its location changed. Styled like the other
     drawer tools so it's native and RTL-correct. */
  var DC_DRAWER_RADAR_BTN =
'<button class="dc-drawer-tool-seg" type="button" id="btn-radar-topbar" aria-label="رادار"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7"/><path d="M12 12h.01"/></svg></span><span class="dc-drawer-tool-txt">رادار</span></button>';

  /* Search trigger as a drawer tool button: the search button used to live in
     the top bar; it now sits in the drawer to make room for the podcast
     headphone icon. It keeps the SAME .dcOpenSearch class, so the existing
     delegated handler (openGlobalSearch) opens the page's own #dcGlobalBox
     untouched — only its location changed. Injected idempotently into the
     existing drawer (same pattern as the radar button) so it appears on every
     page regardless of which page owns the drawer markup. */
  var DC_DRAWER_SEARCH_BTN =
'<button class="dc-drawer-tool-seg dcOpenSearch" type="button" id="btn-search-drawer" aria-label="جستجو"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><span class="dc-drawer-tool-txt">جستجو</span></button>';

  /* Theme toggle as a drawer tool button (Change 2): dark/light moved OFF the
     floating control (which is now a persistent Search trigger, see below) and
     INTO the hamburger drawer. Same .dc-drawer-tool-seg shape as the other
     tools. The icon is dual-state — applyTheme swaps the .dc-drawer-tool-ico
     between sun (dark) and moon (light); the initial glyph below is the
     light-mode moon and is corrected by the applyTheme call on load. Routed
     through the EXISTING delegated click handler → applyTheme (no 2nd listener).
     Injected idempotently, mirroring the radar/search pattern. */
  var DC_DRAWER_THEME_BTN =
'<button class="dc-drawer-tool-seg" type="button" id="btn-theme-drawer" aria-label="تغییر تم"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.8 8.8 0 1 0 20.5 14.2z"/></svg></span><span class="dc-drawer-tool-txt">تم</span></button>';

  /* Floating SEARCH control styling (Change 3). The fixed bottom-left control
     that used to be the theme toggle is now a persistent SEARCH trigger
     (#dc-float-search). Single source of styling, injected so it reaches every
     page — including index.html, which loads NEITHER dc-theme.css NOR
     dc-nav.css. Border + icon use var(--pr) verbatim — the SAME navy/سورمه‌ای
     the episodes hero card (#card-episodes / .dc-hero-card) fills with — so it
     stays theme-aware (navy #022360 in light, accent #5b9cf6 in dark). Border +
     icon color only; background stays --card-bg (subtle). Hidden on the desktop
     app-shell (body.dc-desktop-ui) and in content-only view, exactly as the old
     floating control was. */
  var DC_FLOAT_SEARCH_CSS =
'#dc-float-search{position:fixed;bottom:76px;left:14px;z-index:250;min-width:40px;height:40px;border-radius:var(--r-md);background:var(--card-bg);color:var(--pr);border:1.5px solid var(--pr);box-shadow:var(--card-sh);display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;padding:0 12px;-webkit-tap-highlight-color:transparent;transition:all var(--tr);}' +
'#dc-float-search:active{transform:scale(.86);background:var(--surface2);}' +
'#dc-float-search .dc-svg-icon{width:20px;height:20px;color:var(--pr);flex-shrink:0;}' +
'#dc-float-search .dc-fs-lbl{font-size:12.5px;font-weight:800;color:var(--pr);white-space:nowrap;max-width:64px;overflow:hidden;transition:max-width .22s ease,opacity .18s ease;}' +
'#dc-float-search.dc-fs-min{padding:0;gap:0;width:40px;}' +
'#dc-float-search.dc-fs-min .dc-fs-lbl{max-width:0;opacity:0;}' +
'body.dc-desktop-ui #dc-float-search,body.dc-content-only #dc-float-search{display:none!important;}';

  /* ── MUSIC PLAYER — panel markup ──────────────────
     A dropdown panel that mirrors #dcToolbarDrawer's open/close pattern.
     Compact: the play/pause control and the channel link sit UP on the title
     row, flanking the track info (no separate bottom band). Play/pause is the
     primary affordance (SEPARATE from the header trigger); قفلی‌ها is a subtle
     secondary link. The play/pause button starts disabled, enabled once tracks
     load. */
  var DC_MUSIC_PANEL_HTML =
'<div id="dcMusicPanel" class="dc-music-panel" aria-hidden="true">' +
'  <div class="dc-music-inner">' +
'    <div class="dc-music-head">' +
'      <div class="dc-music-controls">' +
'        <button class="dc-music-skip" id="dc-music-forward" type="button" aria-label="آهنگ بعدی (تصادفی)" disabled><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6v12l8.5-6zM16 6h2v12h-2z"/></svg></button>' +
'        <button class="dc-music-playpause" id="dc-music-playpause" type="button" aria-label="پخش" aria-pressed="false" disabled><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>' +
'      </div>' +
'      <div class="dc-music-text">' +
'        <div class="dc-music-title" id="dcMusicTitle">در حال بارگذاری…</div>' +
'        <div class="dc-music-artist" id="dcMusicArtist"></div>' +
'        <div class="dc-music-desc" id="dcMusicDesc"></div>' +
'      </div>' +
'      <a class="dc-music-channel" id="dcMusicChannel" href="#" target="_blank" rel="noopener" hidden><span>قفلی‌ها</span><svg class="dc-music-ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg></a>' +
'    </div>' +
'  </div>' +
'</div>';

  /* Panel CSS, injected once (so it travels with the header regardless of
     whether a page loads dc-nav.css). Reuses the theme's CSS variables and
     mirrors the tool-drawer dropdown look. */
  var DC_MUSIC_CSS =
/* Panel — mirrors the tool drawer's max-height/opacity dropdown; themed. It now
   also mirrors the tool drawer's POSITIONING: fixed + anchored 57px below the
   viewport top (right under the fixed header), same z-index tier (199, below the
   header's 200). Previously it had no position, so it sat in normal document
   flow at the top of <body> and scrolled away — opening it while scrolled down
   looked like nothing happened. Anchored like this it floats into view wherever
   you are, exactly like the hamburger drawer. */
'.dc-music-panel{position:fixed;top:57px;left:0;right:0;width:100%;z-index:199;box-sizing:border-box;overflow:hidden;max-height:0;opacity:0;background:var(--surface2);border-bottom:1px solid var(--border);transition:max-height .28s cubic-bezier(.4,0,.2,1),opacity .22s ease;}' +
'.dc-music-inner{padding:18px 14px 20px;}' +
/* Compact head row: play/pause (primary) + text block + channel (secondary),
   all pulled up together — no separate bottom band. */
'.dc-music-head{display:flex;align-items:center;gap:10px;}' +
'.dc-music-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}' +
/* Light hierarchy: title, accent artist, one-line concept description. */
'.dc-music-title{font-size:.9rem;font-weight:700;line-height:1.35;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
'.dc-music-artist{font-size:.7rem;font-weight:600;color:var(--ac);}' +
'.dc-music-artist:empty{display:none;}' +
'.dc-music-desc{font-size:.7rem;line-height:1.5;color:var(--txt3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
'.dc-music-desc:empty{display:none;}' +
/* Controls column: forward (top) stacked over play/pause (bottom), with a gap
   between them so each is a comfortable, distinct tap target. */
'.dc-music-controls{display:flex;flex-direction:column;align-items:center;gap:10px;width:52px;flex-shrink:0;}' +
/* Forward + play/pause: small refined accent icons, transparent, each a square
   touch target separated by the column gap. */
'.dc-music-skip,.dc-music-playpause{display:inline-flex;align-items:center;justify-content:center;width:100%;height:30px;border:0;border-radius:999px;background:transparent;color:var(--ac);cursor:pointer;padding:0;transition:transform .12s ease,background .15s ease;-webkit-tap-highlight-color:transparent;}' +
'.dc-music-skip .dc-svg-icon,.dc-music-playpause .dc-svg-icon{width:22px;height:22px;fill:currentColor;stroke:none;animation:dcMusicPop .18s ease;}' +
'.dc-music-skip[disabled],.dc-music-playpause[disabled]{opacity:.35;cursor:default;}' +
'.dc-music-skip:not([disabled]):hover,.dc-music-playpause:not([disabled]):hover{background:rgba(var(--ac-rgb),.10);}' +
'.dc-music-skip:not([disabled]):active,.dc-music-playpause:not([disabled]):active{transform:scale(.86);}' +
/* Channel: tiny, subtle secondary action with an external-link cue. */
'.dc-music-channel{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;font-size:.7rem;font-weight:600;color:#c49820;text-decoration:none;transition:color .15s ease;}' +
'.dc-music-channel:hover{color:#c49820;}' +
'.dc-music-channel .dc-music-ext{width:.78em;height:.78em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.7;}' +
/* Unavailable state: dim the (disabled) controls, leave the message clean. */
'.dc-music-panel.is-unavailable .dc-music-playpause,.dc-music-panel.is-unavailable .dc-music-skip{opacity:.3;}' +
/* Header trigger: a music note is the permanent base icon; the equalizer is an
   overlay that appears only while playing, beside the (centered) note. */
'.dc-music-trigger{position:relative;}' +
/* The note is filled (override the registry's default stroke styling). */
'.dc-music-trigger .dc-svg-icon{fill:currentColor;stroke:none;}' +
/* Equalizer overlay at the trailing edge of the icon. Hidden when idle (only
   the note shows); absolutely positioned so the note stays centered and there
   is no layout shift when it appears. */
'.dc-music-eq{position:absolute;right:3px;top:50%;transform:translateY(-50%);display:inline-flex;align-items:flex-end;gap:1.5px;width:8px;height:10px;opacity:0;transition:opacity .3s ease;pointer-events:none;}' +
'.dc-music-eq i{display:block;width:2px;height:100%;border-radius:1px;background:var(--ac);transform:scaleY(.35);transform-origin:bottom;transition:transform .3s ease;}' +
/* Playing: the equalizer fades in and runs the existing motion (unchanged). */
'.dc-music-trigger.is-playing .dc-music-eq{opacity:1;}' +
'.dc-music-trigger.is-playing .dc-music-eq i{animation:dcEq .9s ease-in-out infinite;}' +
'.dc-music-trigger.is-playing .dc-music-eq i:nth-child(2){animation-delay:.25s;}' +
'.dc-music-trigger.is-playing .dc-music-eq i:nth-child(3){animation-delay:.5s;}' +
/* Playing: a soft, slow pulsing accent glow that quietly breathes (not a hard
   blink). Fades in/out via the button's existing transition when is-playing
   toggles. Accent color → theme-correct in light + dark. */
'.dc-music-trigger.is-playing{animation:dcGlow 2.6s ease-in-out infinite;}' +
'@keyframes dcEq{0%,100%{transform:scaleY(.35);}50%{transform:scaleY(1);}}' +
'@keyframes dcGlow{0%,100%{box-shadow:0 0 0 0 rgba(var(--ac-rgb),0);}50%{box-shadow:0 0 9px 1px rgba(var(--ac-rgb),.45);}}' +
'@keyframes dcMusicPop{from{opacity:.4;transform:scale(.82);}to{opacity:1;transform:scale(1);}}' +
'@media (prefers-reduced-motion: reduce){.dc-music-trigger.is-playing .dc-music-eq i{animation:none;}.dc-music-trigger.is-playing{animation:none;}.dc-music-skip .dc-svg-icon,.dc-music-playpause .dc-svg-icon{animation:none;}.dc-music-panel{transition:none;}}';

  /* ── PODCAST PLAYER — global drawer markup ────────
     A hidden slide-down drawer (UNDER the fixed header) that hosts the
     /player.html iframe. The iframe is NOT in this markup — it lazy-mounts on
     first open (see dcPodMount) so the omnipresent header never loads audio
     just by existing, then it persists and keeps playing in the background
     while the drawer is hidden. Injected to the end of <body> once,
     idempotently (same approach as the radar overlay). */
  var DC_PLAYER_OVERLAY_HTML =
'<div id="dcPlayerOverlay" class="dc-player-overlay" aria-hidden="true" aria-label="پخش‌کنندهٔ پادکست دنت‌کست">' +
'  <div id="dcPlayerOverlayHolder" class="dc-player-overlay-body"></div>' +
'</div>';

  /* Overlay + headphone CSS, injected once via a <style> tag (same as the music
     panel) so it travels with the header regardless of whether a page loads
     dc-nav.css. Reuses theme CSS variables and the music trigger's dcEq/dcGlow
     keyframes (defined in DC_MUSIC_CSS, which is always injected too). */
  var DC_PLAYER_CSS =
/* Scroll lock applied to <html> and <body> while the overlay is open. */
'.dc-noscroll{overflow:hidden!important;}' +
/* Headphone launcher — accent-tinted idle so it stands out from the neutral
   header buttons, using only existing brand accent vars. */
'.dc-podcast-trigger{position:relative;color:var(--ac);background:rgba(var(--ac-rgb),.10);border-color:rgba(var(--ac-rgb),.22);}' +
'.dc-podcast-trigger .dc-svg-icon{stroke:currentColor;}' +
'.dc-podcast-trigger:active{background:rgba(var(--ac-rgb),.18);}' +
/* Open-state ring — ONE rule for every header opener. While an overlay/menu is
   open its trigger carries aria-expanded="true"; we surface that with a thin
   1px ring in the existing پالس/news brick color (rgba(245,162,8) — the exact
   color the pulse card's border uses), shown only while open and gone when
   closed. Static, no pulse/animation. It naturally covers exactly the three
   top-bar openers (hamburger #btn-toolbar-toggle, music, podcast — the only
   .dc-topbar-btn that toggle aria-expanded); momentary full-screen triggers
   (search/radar) live inside the drawer and are intentionally excluded. This
   changes border-color only, never box-shadow, so on the podcast/music buttons
   it can't collide with the .is-playing accent glow — open-not-playing reads as
   the brick ring, playing-not-open as the accent glow, both as ring + glow. */
'.dc-topbar-btn[aria-expanded="true"]{border-color:rgba(245,162,8,.9);}' +
/* Playing state — mirrors .dc-music-trigger exactly: the equalizer overlay
   fades in + animates and the button breathes the same accent glow. */
'.dc-podcast-trigger.is-playing .dc-music-eq{opacity:1;}' +
'.dc-podcast-trigger.is-playing .dc-music-eq i{animation:dcEq .9s ease-in-out infinite;}' +
'.dc-podcast-trigger.is-playing .dc-music-eq i:nth-child(2){animation-delay:.25s;}' +
'.dc-podcast-trigger.is-playing .dc-music-eq i:nth-child(3){animation-delay:.5s;}' +
'.dc-podcast-trigger.is-playing{animation:dcGlow 2.6s ease-in-out infinite;}' +
/* Slide-down drawer UNDER the fixed header — same anchor (top:57px) and tier
   (z-index:199, BELOW the header's 200) as the tool drawer / music panel, so the
   header stays visible on top. Reveal via max-height like those panels. Hidden
   via max-height:0 + visibility (NOT display:none) so the iframe keeps playing
   in the background while the drawer is closed. */
'.dc-player-overlay{position:fixed;top:57px;left:0;right:0;z-index:199;background:var(--bg,#f0f2f5);overflow:hidden;max-height:0;opacity:0;visibility:hidden;transition:max-height .32s cubic-bezier(.4,0,.2,1),opacity .22s ease,visibility .32s;border-bottom:1px solid var(--border,rgba(2,35,96,.10));box-shadow:0 12px 28px rgba(2,35,96,.16);}' +
'.dc-player-overlay.open{max-height:var(--dc-player-h,calc(100vh - 57px));opacity:1;visibility:visible;}' +
'.dc-player-overlay-body{height:var(--dc-player-h,calc(100vh - 57px));overflow-y:auto;-webkit-overflow-scrolling:touch;}' +
'.dc-player-overlay-body iframe{width:100%;height:100%;border:0;display:block;background:var(--surface2,#f4f6fb);}' +
'@media (prefers-reduced-motion: reduce){.dc-podcast-trigger.is-playing .dc-music-eq i{animation:none;}.dc-podcast-trigger.is-playing{animation:none;}.dc-player-overlay{transition:none;}}';

  (function injectSharedHeader() {
    /* Opt-out: localized/non-standard pages keep their own header. This
       is an opt-OUT, so a forgotten flag fails loud (a visible wrong
       header), never as a silent dead button. */
    if (document.documentElement.hasAttribute('data-dc-no-header')) return;
    if (!document.body) return;

    /* Find the page's OWN mobile header — never the desktop app-shell
       header (.dcd-col-c-topbar, inside .dcd-app in index.html). */
    var existing = null;
    var candidates = document.querySelectorAll('header.dc-topbar:not(.dcd-col-c-topbar)');
    for (var i = 0; i < candidates.length; i++) {
      if (!candidates[i].closest('.dcd-app')) { existing = candidates[i]; break; }
    }
    /* No header to replace → deliberately chrome-less page. Inject nothing. */
    if (!existing) return;

    /* 1) Replace ONLY the header element, in place. */
    var headerFrag = document.createRange().createContextualFragment(DC_TOPBAR_HTML);
    var newHeader  = headerFrag.firstElementChild;
    existing.parentNode.replaceChild(headerFrag, existing);

    /* 1b) The podcast launcher (and its overlay) belong ONLY to the top-level
           window. Inside any iframe — notably /player.html mounted in this very
           overlay, or the episodes inline player / desktop shell content frame —
           hide the launcher so it can never open a nested overlay or be a dead
           button. (Mirrors initMusicPlayer's top-window gate.) */
    var inFrame = (window.self !== window.top);
    if (inFrame) {
      var podBtn = newHeader.querySelector('#btn-podcast-toggle');
      if (podBtn) podBtn.style.display = 'none';
    }

    /* 2) Drawer + radar overlay: inject ONLY if the page lacks them, so we
          never disturb page-owned siblings (e.g. index.html's inline radar
          references). The overlay is required for the radar block below. */
    if (!document.getElementById('dcToolbarDrawer')) {
      newHeader.insertAdjacentHTML('afterend', DC_DRAWER_HTML);
    }
    if (!document.getElementById('dcRadarOverlay')) {
      document.body.insertAdjacentHTML('beforeend', DC_RADAR_HTML);
    }

    /* 3) Place the radar trigger INSIDE the drawer (Change A). We ONLY add the
          button to the existing drawer; we never rebuild it or touch the other
          tool buttons. Idempotent via the id check. The button's delegated
          handler (further below) is unchanged, so its wiring is preserved. */
    if (!document.getElementById('btn-radar-topbar')) {
      var drawerInner = document.querySelector('#dcToolbarDrawer .dc-toolbar-drawer-inner');
      if (drawerInner) drawerInner.insertAdjacentHTML('beforeend', DC_DRAWER_RADAR_BTN);
    }

    /* 3b) Place the search trigger INSIDE the drawer (it moved off the top bar
           to free a slot for the headphone). Same idempotent pattern as radar;
           keeps the .dcOpenSearch class so its delegated handler is unchanged. */
    if (!document.getElementById('btn-search-drawer')) {
      var drawerInnerS = document.querySelector('#dcToolbarDrawer .dc-toolbar-drawer-inner');
      if (drawerInnerS) drawerInnerS.insertAdjacentHTML('beforeend', DC_DRAWER_SEARCH_BTN);
    }

    /* 3c) Place the THEME toggle INSIDE the drawer (Change 2). Idempotent, same
           pattern as radar/search. Routed via the delegated handler → applyTheme.
           Honors data-no-theme-toggle="1" (player.html) → no theme item there. */
    if (document.body.dataset.noThemeToggle !== '1' &&
        !document.getElementById('btn-theme-drawer')) {
      var drawerInnerT = document.querySelector('#dcToolbarDrawer .dc-toolbar-drawer-inner');
      if (drawerInnerT) drawerInnerT.insertAdjacentHTML('beforeend', DC_DRAWER_THEME_BTN);
    }

    /* 3d) Inject the floating-search styling once (Change 3). Reaches every
           page, including index.html which loads no shared CSS. */
    if (!document.getElementById('dc-float-search-style')) {
      var fst = document.createElement('style');
      fst.id = 'dc-float-search-style';
      fst.textContent = DC_FLOAT_SEARCH_CSS;
      (document.head || document.documentElement).appendChild(fst);
    }

    /* 4) Music player: inject the panel (a sibling dropdown after the drawer)
          and its CSS once. Markup only — playback is wired separately and is
          gated to the top-level window (see initMusicPlayer). Idempotent. */
    if (!document.getElementById('dc-music-style')) {
      var st = document.createElement('style');
      st.id = 'dc-music-style';
      st.textContent = DC_MUSIC_CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    if (!document.getElementById('dcMusicPanel')) {
      var anchor = document.getElementById('dcToolbarDrawer') || newHeader;
      anchor.insertAdjacentHTML('afterend', DC_MUSIC_PANEL_HTML);
    }

    /* 5) Podcast player overlay: inject its CSS (<style>) and markup once, the
          same idempotent way as the music player so it reaches every page. The
          iframe lazy-mounts on first open (see the podcast-overlay block). */
    if (!document.getElementById('dc-player-style')) {
      var pst = document.createElement('style');
      pst.id = 'dc-player-style';
      pst.textContent = DC_PLAYER_CSS;
      (document.head || document.documentElement).appendChild(pst);
    }
    if (!inFrame && !document.getElementById('dcPlayerOverlay')) {
      document.body.insertAdjacentHTML('beforeend', DC_PLAYER_OVERLAY_HTML);
    }

    /* 6) a11y skip link: first focusable element on the page, lets keyboard
          users jump past the injected chrome straight to the content. The
          target is resolved at click time (mobile <main>, article body, or
          the desktop shell's content column — whichever is visible), so one
          link works across every shell. Styles injected here so it reaches
          index.html too, which loads no shared CSS. Idempotent; pointless
          inside iframes (no chrome to skip), so gated like the overlay. */
    if (!inFrame && !document.getElementById('dcSkipLink')) {
      if (!document.getElementById('dc-skip-link-style')) {
        var sst = document.createElement('style');
        sst.id = 'dc-skip-link-style';
        sst.textContent =
          '.dc-skip-link{position:fixed;top:-99px;right:14px;z-index:1000;' +
          'padding:10px 20px;border-radius:999px;background:var(--ac,#0b5fff);' +
          'color:#fff;font-weight:700;font-size:.9rem;text-decoration:none;' +
          'box-shadow:0 4px 14px rgba(0,0,0,.25);transition:top .15s ease;}' +
          '.dc-skip-link:focus{top:10px;}';
        (document.head || document.documentElement).appendChild(sst);
      }
      var skip = document.createElement('a');
      skip.id = 'dcSkipLink';
      skip.className = 'dc-skip-link';
      skip.href = '#';
      skip.textContent = 'پرش به محتوا';
      skip.addEventListener('click', function (e) {
        e.preventDefault();
        var sels = ['main', 'article', '.wrap', '.dcd-col-b'];
        for (var i = 0; i < sels.length; i++) {
          var els = document.querySelectorAll(sels[i]);
          for (var j = 0; j < els.length; j++) {
            if (els[j].offsetParent !== null) {
              els[j].setAttribute('tabindex', '-1');
              els[j].focus();
              els[j].scrollIntoView({ block: 'start' });
              return;
            }
          }
        }
      });
      document.body.insertBefore(skip, document.body.firstChild);
    }

    /* 7) Article UX widgets — only on pages built on the shared article
          layer (/dc-article.css): a reading-time + share chip row above
          the content, an auto table-of-contents for long articles, and a
          topbar EN switch that appears exactly when a translated
          counterpart exists (the hreflang en alternate is disk-discovered
          by inject_hreflang.py, so this lights up as translations land).
          All idempotent; styles live in dc-article.css. */
    if (document.querySelector('link[href^="/dc-article.css"]')) {

      /* 7a) Topbar language switch — real en counterpart only. */
      var enAlt = document.querySelector('link[rel="alternate"][hreflang="en"]');
      if (enAlt && !document.getElementById('dcTopbarLang')) {
        var langA = document.createElement('a');
        langA.id = 'dcTopbarLang';
        langA.className = 'dc-topbar-btn';
        langA.href = enAlt.getAttribute('href');
        langA.setAttribute('aria-label', 'English version');
        langA.style.cssText = 'text-decoration:none;font-size:11px;font-weight:800;width:auto;min-width:34px;padding:0 12px;';
        langA.textContent = 'EN';
        var langActs = newHeader.querySelector('.dc-topbar-actions');
        if (langActs) langActs.appendChild(langA);
      }

      var dcBoxes = document.querySelectorAll('.text-box, .glass-box, .content-box');
      var firstBox = dcBoxes.length ? dcBoxes[0] : null;

      /* 7b) Reading time + share row, right above the first content box. */
      if (firstBox && !document.getElementById('dcArticleMeta')) {
        var dcWords = 0;
        for (var bi = 0; bi < dcBoxes.length; bi++) {
          dcWords += (dcBoxes[bi].textContent || '').trim().split(/\s+/).length;
        }
        var dcMins = Math.max(1, Math.round(dcWords / 180));

        var metaRow = document.createElement('div');
        metaRow.id = 'dcArticleMeta';
        metaRow.className = 'dc-article-meta';

        var timeChip = document.createElement('span');
        timeChip.className = 'dc-meta-chip';
        timeChip.textContent = 'زمان مطالعه: حدود ' + dcMins + ' دقیقه';
        metaRow.appendChild(timeChip);

        var shareBtn = document.createElement('button');
        shareBtn.type = 'button';
        shareBtn.className = 'dc-meta-chip';
        shareBtn.textContent = 'اشتراک‌گذاری';
        shareBtn.addEventListener('click', function () {
          if (navigator.share) {
            navigator.share({ title: document.title, url: location.href }).catch(function () {});
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(location.href).then(function () {
              var prev = shareBtn.textContent;
              shareBtn.textContent = 'لینک کپی شد ✓';
              setTimeout(function () { shareBtn.textContent = prev; }, 1600);
            });
          }
        });
        metaRow.appendChild(shareBtn);

        firstBox.parentNode.insertBefore(metaRow, firstBox);
      }

      /* 7c) Auto table of contents — long articles only (4+ sections). */
      if (firstBox && !document.getElementById('dcToc')) {
        var tocHeads = [];
        for (var ti = 0; ti < dcBoxes.length; ti++) {
          var hs = dcBoxes[ti].querySelectorAll('h2:not(.dc-related-label), h3, h4');
          for (var hi = 0; hi < hs.length; hi++) tocHeads.push(hs[hi]);
        }
        if (tocHeads.length >= 4) {
          var toc = document.createElement('details');
          toc.id = 'dcToc';
          toc.className = 'dc-toc';
          var sum = document.createElement('summary');
          sum.textContent = 'فهرست مطالب';
          toc.appendChild(sum);
          var ol = document.createElement('ol');
          for (var li = 0; li < tocHeads.length; li++) {
            if (!tocHeads[li].id) tocHeads[li].id = 'dc-sec-' + (li + 1);
            var item = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + tocHeads[li].id;
            a.textContent = (tocHeads[li].textContent || '').trim();
            item.appendChild(a);
            ol.appendChild(item);
          }
          toc.appendChild(ol);
          firstBox.parentNode.insertBefore(toc, firstBox);
        }
      }
    }
  })();

  /* ── THEME (centralized) ──────────────────────────
     Single source of truth for theme behavior. The control lives in the
     hamburger drawer (#btn-theme-drawer, injected above) and — on the desktop
     app-shell — in the sidebar footer (#dcdThemeBtn). Both are routed through
     the delegated click handler → applyTheme; pages must NOT bind their own.
     There is no longer a floating theme button: that slot is now Search.
  ─────────────────────────────────────────────────── */
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('dc-theme', dark ? 'dark' : 'light');
    /* Desktop sidebar footer button (#dcdThemeBtn) — sun in dark, moon in light. */
    var drawerBtn = document.getElementById('dcdThemeBtn');
    if (drawerBtn) drawerBtn.innerHTML =
      '<span>' + dcSvgIcon(dark ? 'sun' : 'moon') + '</span><span>تم</span>';
    /* Mobile hamburger-drawer theme item (#btn-theme-drawer) — same dual-state
       convention: sun glyph while dark, moon glyph while light. */
    var mDraw = document.getElementById('btn-theme-drawer');
    if (mDraw) {
      var mIco = mDraw.querySelector('.dc-drawer-tool-ico');
      if (mIco) mIco.innerHTML = dcSvgIcon(dark ? 'sun' : 'moon');
    }
  }
  window.dcApplyTheme = applyTheme;

  /* First-visit resolution: write localStorage so cross-
     page navigation is deterministic (matches the old
     inline body-end behavior of the index page). */
  (function () {
    var stored = localStorage.getItem('dc-theme');
    var osDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    applyTheme(stored === 'dark' || (stored === null && osDark));
  })();

  /* ── FLOATING SEARCH (Change 3) ───────────────────
     The fixed bottom-left control that used to be the theme toggle is now a
     persistent one-click SEARCH trigger. We create it once if absent; the
     .dcOpenSearch class wires it to the existing delegated openGlobalSearch
     handler — no theme behavior remains on it. It shows the magnifier glyph
     (same SVG as the header/in-drawer search) and is styled by the injected
     #dc-float-search-style. Present on every page (incl. player.html); the
     style hides it on the desktop app-shell and in content-only view. */
  /* No-header (standalone English) pages get no floating search: the
     header IIFE that injects its CSS bails out there, and the global
     search UI is Persian anyway — an unstyled raw button was leaking
     into the page flow. */
  if (!document.documentElement.hasAttribute('data-dc-no-header') &&
      !document.getElementById('dc-float-search')) {
    var floatSearch = document.createElement('button');
    floatSearch.id = 'dc-float-search';
    floatSearch.className = 'dcOpenSearch';
    floatSearch.type = 'button';
    floatSearch.setAttribute('aria-label', 'جستجو');
    floatSearch.innerHTML = dcSvgIcon('search') + '<span class="dc-fs-lbl">جستجو</span>';
    document.body.appendChild(floatSearch);
    /* Extended at the top of the page (icon + «جستجو» label) so new users
       instantly read it as the site-wide search; collapses to icon-only
       once they scroll, expands again back at the top. Works for both the
       window scroller and the homepage's #mobile-body scroller. */
    var fsBody = document.getElementById('mobile-body');
    /* One source of truth: the DEEPEST of the two possible scrollers, so a
       0-report from the idle one can never re-extend the button mid-page.
       Hysteresis (collapse >90, re-extend <40) kills threshold jitter. */
    var fsUpd = function () {
      var y = Math.max(window.scrollY || document.documentElement.scrollTop || 0,
                       fsBody ? fsBody.scrollTop : 0);
      var min = floatSearch.classList.contains('dc-fs-min');
      if (!min && y > 90) floatSearch.classList.add('dc-fs-min');
      else if (min && y < 40) floatSearch.classList.remove('dc-fs-min');
    };
    if (fsBody) fsBody.addEventListener('scroll', fsUpd, { passive: true });
    window.addEventListener('scroll', fsUpd, { passive: true });

  }

  /* ── TIME-ON-SITE ENCOURAGEMENT ──────────────────────
     Privacy-friendly: active (visible-tab) minutes accumulate in
     localStorage across all pages. Daily ladder at 5/15/30/60 min (each
     once per day, midnight reset); a weekly recap fires on the FIRST
     visit of a new week (weeks start Saturday) against a 5-min/day
     benchmark. The message renders as a dismissible card in the site's
     own design language (token card + accent side-bar + close button).
     Top window only; sub-minute weeks stay silent. */
  (function () {
    if (window.self !== window.top) return;
    var KEY = 'dc-tos-v2';
    var fa = function (n) { return String(n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }); };
    function dayId(d) { return d.toISOString().slice(0, 10); }
    function weekId(d) {
      var x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 1) % 7));
      return dayId(x);
    }
    function load() {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
    }
    function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

    var box = null;
    function showCard(msg, ms) {
      if (!document.getElementById('dc-tos-style')) {
        var st = document.createElement('style');
        st.id = 'dc-tos-style';
        st.textContent =
          /* clinical-green card: clearly distinct from the white page, still
             calm and medical — same green family as the Insight chip. */
          '#dcTosCard{position:fixed;bottom:96px;left:14px;right:14px;margin:0 auto;max-width:420px;' +
          'z-index:400;display:flex;align-items:center;gap:10px;' +
          'background:#e6f7f1;color:#0a5847;' +
          'border:1px solid rgba(13,138,114,.35);border-right:4px solid #0d8a72;' +
          'border-radius:16px;box-shadow:0 10px 30px rgba(13,138,114,.30);padding:12px 16px;' +
          'font-size:.82rem;font-weight:700;line-height:1.9;' +
          'opacity:0;transform:translateY(12px);pointer-events:none;' +
          'transition:opacity .3s ease,transform .3s ease;}' +
          '#dcTosCard.on{opacity:1;transform:translateY(0);pointer-events:auto;}' +
          '#dcTosCard .dc-tos-msg{flex:1;min-width:0;}' +
          '#dcTosCard .dc-tos-close{flex-shrink:0;width:28px;height:28px;border:none;cursor:pointer;' +
          'background:rgba(13,138,114,.12);color:#0a5847;border-radius:999px;' +
          'display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;padding:0;}' +
          '[data-theme="dark"] #dcTosCard{background:#11352b;color:#7fe3c8;' +
          'border-color:rgba(95,208,184,.35);border-right-color:#5fd0b8;' +
          'box-shadow:0 10px 30px rgba(0,0,0,.45);}' +
          '[data-theme="dark"] #dcTosCard .dc-tos-close{background:rgba(95,208,184,.15);color:#7fe3c8;}';
        (document.head || document.documentElement).appendChild(st);
      }
      if (!box) {
        box = document.createElement('div');
        box.id = 'dcTosCard';
        box.setAttribute('role', 'status');
        box.setAttribute('aria-live', 'polite');
        var m = document.createElement('span');
        m.className = 'dc-tos-msg';
        var x = document.createElement('button');
        x.className = 'dc-tos-close';
        x.type = 'button';
        x.setAttribute('aria-label', 'بستن');
        x.textContent = '✕';
        x.addEventListener('click', function () {
          box.classList.remove('on');
          clearTimeout(box._t);
        });
        box.appendChild(m); box.appendChild(x);
        document.body.appendChild(box);
      }
      box.querySelector('.dc-tos-msg').textContent = msg;
      requestAnimationFrame(function () { box.classList.add('on'); });
      clearTimeout(box._t);
      box._t = setTimeout(function () { box.classList.remove('on'); }, ms || 10000);
    }

    var DAILY = [
      [300,  '☕ ۵ دقیقه مطالعه‌ی تخصصی — شروع خوبیه!'],
      [900,  '🎧 ۱۵ دقیقه یادگیری — به‌اندازه‌ی نصف یک اپیزود عمیق شدی'],
      [1800, '🏆 نیم ساعت یادگیری امروز — این دیگه عادتِ حرفه‌ای‌هاست'],
      [3600, '⭐ یک ساعت کامل با دنت‌کست — کم‌نظیری! فردا هم منتظرتیم']
    ];

    var now = new Date(), s = load();
    var d = dayId(now), w = weekId(now);
    if (s.day !== d) { s.day = d; s.daySec = 0; s.shown = {}; }
    if (s.week !== w) {
      if (s.week && (s.weekSec || 0) >= 60 && s.recapFor !== s.week) {
        var mins = Math.round(s.weekSec / 60);
        var msg;
        if (mins < 35)       msg = '🌱 هفته‌ی قبل ' + fa(mins) + ' دقیقه وقت گذاشتی؛ کاش این هفته بیشتر بهم سر بزنی';
        else if (mins <= 70) msg = '👏 هفته‌ی قبل ' + fa(mins) + ' دقیقه مطالعه داشتی — کارت درسته، ادامه بده';
        else                 msg = '⭐ هفته‌ی قبل خیلی خوب بودی! ' + fa(mins) + ' دقیقه مطالعه‌ی دنت‌کست — باعث افتخارمونی';
        s.recapFor = s.week;
        setTimeout(function () { showCard(msg, 15000); }, 2500);
      }
      s.week = w; s.weekSec = 0;
    }
    /* one-time activation card: instant visible proof the module is live
       on this device (also resets expectations after the v1→v2 key reset) */
    if (!s.hello2) {
      s.hello2 = 1;
      setTimeout(function () {
        showCard('✨ همراهی‌سنج فعال شد. از امروز حواسم هست چقدر دنت‌کست می‌خونی', 8000);
      }, 1500);
    }
    save(s);

    var TICK = 15;
    setInterval(function () {
      if (document.visibilityState !== 'visible') return;
      s.daySec = (s.daySec || 0) + TICK;
      s.weekSec = (s.weekSec || 0) + TICK;
      for (var i = 0; i < DAILY.length; i++) {
        var th = DAILY[i][0];
        if (s.daySec >= th && !(s.shown && s.shown[th])) {
          s.shown = s.shown || {}; s.shown[th] = 1;
          showCard(DAILY[i][1]);
          break;
        }
      }
      save(s);
    }, TICK * 1000);
  })();

  /* ── SEARCH DIM (Issue 3) ───────────────────────────
     A single translucent backdrop element, injected once (mirrors the
     float-search pattern), shared by all bottom-sheet pages (breeds B & C).
     It carries NO inline styles: all appearance + the show/hide toggle live in
     global-search.css under `#dc-search-dim` / `body.search-open #dc-search-dim`,
     so there is no inline-vs-stylesheet specificity fight. The homepage does not
     load global-search.css and never sets body.search-open, so this stays an
     invisible, zero-impact empty div there. Tapping it closes search (handled by
     the CLOSE RESULTS delegated listener above). */
  if (!document.getElementById('dc-search-dim')) {
    var searchDim = document.createElement('div');
    searchDim.id = 'dc-search-dim';
    document.body.appendChild(searchDim);
  }

  /* ── SHAKE → PLAYER DRAWER ──────────────────────────
     Shake-to-play. The shake gesture (formerly shake-search.js, which opened
     the search sheet on breed C only) now slides up a bottom drawer hosting
     player.html in an iframe — and it lives here in dc-nav.js, so it reaches
     ALL 488 pages with one shared file.

     TOP-LEVEL ONLY: guarded to the top window so the iframe'd player.html
     itself (and index.html's desktop content iframe) never inject a nested
     drawer or double-handle devicemotion.

     The drawer + dim + chrome styling are injected once (mirroring the
     float-search / search-dim pattern), so no per-page markup is needed. The
     iframe is created LAZILY on first open (not 488 hidden iframes at load) and
     is NEVER reset on close — we only hide the drawer via transform, so audio
     keeps playing / its position survives a re-open. */
  if (window.top === window.self) {
    /* NAMESPACE: this shake drawer uses the `dc-shake-*` namespace. dc-nav.js
       ALREADY ships a separate "podcast overlay" feature that owns DC_PLAYER_CSS,
       the <style id="dc-player-style">, and #dcPlayerOverlay. Reusing those names
       made our injection guard (getElementById('dc-player-style')) find the
       podcast style already present and SKIP injecting ours — so the drawer
       rendered unstyled. Distinct names keep the two features fully separate. */
    var DC_SHAKE_CSS =
'#dc-shake-dim{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.5);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .45s ease,visibility .45s ease;}' +
'body.dc-shake-open #dc-shake-dim{opacity:1;visibility:visible;pointer-events:auto;}' +
'body.dc-shake-open{overflow:hidden;}' +
/* While the player is open, hide the floating search toggle so it doesn't sit on top of the overlay. */
'body.dc-shake-open #dc-float-search{display:none!important;}' +
'#dc-shake-drawer{position:fixed;left:0;right:0;bottom:0;z-index:100001;height:88vh;height:88dvh;max-height:88vh;max-height:88dvh;background:#fff;border-radius:18px 18px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.35);transform:translateY(100%);transition:transform .55s cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column;overflow:hidden;}' +
'body.dc-shake-open #dc-shake-drawer{transform:translateY(0);}' +
'#dc-shake-drawer .dc-shake-grip{position:absolute;top:6px;left:50%;transform:translateX(-50%);width:42px;height:4px;border-radius:2px;background:#cdd3e6;pointer-events:none;}' +
'#dc-shake-drawer .dc-shake-bar{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;padding:7px 8px 2px;}' +
'#dc-shake-close{width:34px;height:34px;border:none;border-radius:50%;background:#f0f0f5;color:#333;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;transition:transform .15s ease,background .15s ease;}' +
'#dc-shake-close:active{transform:scale(.88);background:#e2e2ee;}' +
'#dc-shake-close .dc-svg-icon{width:20px;height:20px;}' +
'#dc-shake-iframe{flex:1 1 auto;width:100%;border:0;background:#f4f7ff;}' +
'[data-theme="dark"] #dc-shake-drawer{background:#1a2940;}' +
'[data-theme="dark"] #dc-shake-close{background:#2a3a55;color:#cfe2ff;}' +
'[data-theme="dark"] #dc-shake-iframe{background:#1a2940;}';

    if (!document.getElementById('dc-shake-style')) {
      var pst = document.createElement('style');
      pst.id = 'dc-shake-style';
      pst.textContent = DC_SHAKE_CSS;
      (document.head || document.documentElement).appendChild(pst);
    }

    var dcPlayerIframe = null;

    function dcEnsurePlayerEls() {
      if (!document.getElementById('dc-shake-dim')) {
        var pdim = document.createElement('div');
        pdim.id = 'dc-shake-dim';
        document.body.appendChild(pdim);
      }
      var drawer = document.getElementById('dc-shake-drawer');
      if (!drawer) {
        drawer = document.createElement('div');
        drawer.id = 'dc-shake-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-label', 'پخش‌کننده دنت‌کست');
        drawer.innerHTML =
          '<span class="dc-shake-grip"></span>' +
          '<div class="dc-shake-bar">' +
            '<button type="button" id="dc-shake-close" aria-label="بستن">' +
              dcSvgIcon('x') +
            '</button>' +
          '</div>';
        document.body.appendChild(drawer);
      }
      return drawer;
    }

    function dcOpenPlayer() {
      var drawer = dcEnsurePlayerEls();
      /* Mutually exclusive with search: never stack the player over an open
         search sheet/dim. */
      var sb = document.getElementById('dcGlobalBox');
      if (sb) sb.classList.remove('open');
      document.body.classList.remove('search-open');
      /* Lazy iframe — created on first open, kept forever after. Absolute
         /player.html so its own relative fetches resolve from any page depth. */
      if (!dcPlayerIframe) {
        dcPlayerIframe = document.createElement('iframe');
        dcPlayerIframe.id = 'dc-shake-iframe';
        dcPlayerIframe.title = 'DentCast Player';
        dcPlayerIframe.setAttribute('allow', 'autoplay; encrypted-media');
        dcPlayerIframe.src = '/player.html';
        drawer.appendChild(dcPlayerIframe);
      }
      document.body.classList.add('dc-shake-open');
    }

    /* Close = hide only. We NEVER clear/reset the iframe src, so playback (and
       the player's restored position) survives a re-open. */
    function dcClosePlayer() {
      document.body.classList.remove('dc-shake-open');
    }

    function dcTogglePlayer() {
      if (document.body.classList.contains('dc-shake-open')) dcClosePlayer();
      else dcOpenPlayer();
    }

    /* Close affordances: the × button or a tap on the dim. */
    document.addEventListener('click', function (e) {
      if (!e.target) return;
      if ((e.target.closest && e.target.closest('#dc-shake-close')) ||
          e.target.id === 'dc-shake-dim') {
        dcClosePlayer();
      }
    });

    /* Public API (parity with window.dcSearch). */
    window.dcPlayer = { open: dcOpenPlayer, close: dcClosePlayer, toggle: dcTogglePlayer };

    /* Shake detection — same threshold/debounce as the old shake-search.js, but
       the action is now dcPlayer.toggle() instead of dcSearch.open(). A short
       cooldown stops a single continuous shake from flapping open/closed. The
       listener body is wrapped so it can be attached either immediately
       (Android/desktop) or only after iOS grants motion permission (below). */
    var _shLast = 0, _shPrimed = false, _shHits = 0, _shTime = 0, _shCooldown = 0, _shAttached = false;
    function attachShakeListener() {
      if (_shAttached) return; /* never bind twice */
      _shAttached = true;
      window.addEventListener('devicemotion', function (e) {
        /* Prefer gravity-excluded acceleration when the device provides it;
           fall back to accelerationIncludingGravity (the only one some Androids
           expose). Null-safe per-axis: some devices deliver null components. */
        var a = e.acceleration && (e.acceleration.x != null) ? e.acceleration : e.accelerationIncludingGravity;
        if (!a) return;
        var x = a.x || 0, y = a.y || 0, z = a.z || 0;
        var mag = Math.sqrt(x * x + y * y + z * z);
        var delta = Math.abs(mag - _shLast);
        _shLast = mag;
        /* Skip the very first sample so the rest→first jump isn't counted. */
        if (!_shPrimed) { _shPrimed = true; return; }
        var now = Date.now();
        if (delta > 12) {
          _shHits = (now - _shTime < 600) ? _shHits + 1 : 1;
          _shTime = now;
          if (_shHits >= 2 && now - _shCooldown > 1000) {
            _shCooldown = now;
            _shHits = 0;
            window.dcPlayer.toggle();
          }
        }
      }, { passive: true });
    }

    /* iOS 13+ gates devicemotion behind DeviceMotionEvent.requestPermission(),
       which MUST be called from inside a user gesture or motion never fires. We
       add NO UI of our own — instead we piggy-back on the user's FIRST tap
       anywhere on the page (once + capture, so it fires no matter what was
       tapped and without disturbing that tap's normal action) to silently
       request it. The only thing the user sees is iOS's own native popup. On
       'granted' we attach the shake listener; on 'denied' — or a throw in odd
       embedded webviews — we stay silent and never re-prompt this page load.
       Android/desktop have no requestPermission, so they fall through and bind
       the listener normally at load (where present; harmless if it never fires). */
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      var _shReqDone = false;
      var dcRequestMotionOnce = function () {
        if (_shReqDone) return; /* request at most once per page load */
        _shReqDone = true;
        try {
          DeviceMotionEvent.requestPermission().then(function (state) {
            if (state === 'granted') attachShakeListener();
          }).catch(function () { /* denied / unsupported — stay silent */ });
        } catch (err) { /* embedded webview threw — skip silently */ }
      };
      document.addEventListener('pointerdown', dcRequestMotionOnce, { once: true, capture: true });
    } else if ('DeviceMotionEvent' in window) {
      attachShakeListener();
    }
  }

  /* Desktop drawer toggle (#dcdThemeBtn) — same handler */
  var themeDrawerBtn = document.getElementById('dcdThemeBtn');
  if (themeDrawerBtn) {
    themeDrawerBtn.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
    });
  }

  hydrateUiIcons(document);

  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.target && m.target.nodeType === 1) hydrateUiIcons(m.target);
      if (m.target && m.target.nodeType === 3 && m.target.parentElement) hydrateUiIcons(m.target.parentElement);
      m.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) hydrateUiIcons(node);
      });
    });
  }).observe(document.documentElement, { childList: true, characterData: true, subtree: true });

  /* ── TOOLBAR DRAWER ───────────────────────────────
     Toggling is delegated (see HEADER EVENT DELEGATION below) so it
     survives the header being injected/replaced. Here we only apply the
     drawer's defensive base styles once at load — preserving the original
     behavior of forcing the closed state regardless of conflicting page
     CSS. Runs against whatever #dcToolbarDrawer exists (injected or static). */
  (function normalizeToolbarDrawer() {
    var drawer = document.getElementById('dcToolbarDrawer');
    if (!drawer) return;
    drawer.style.overflow   = 'hidden';
    drawer.style.transition = 'max-height .28s cubic-bezier(.4,0,.2,1), opacity .22s ease';
    drawer.style.maxHeight  = '0';
    drawer.style.opacity    = '0';
  })();

  /* Toggle logic — invoked by the delegated click handler. Reads its
     elements fresh on each call, so injection/replacement is transparent. */
  function toggleToolbarDrawer() {
    var drawerBtn = document.getElementById('btn-toolbar-toggle');
    var drawer    = document.getElementById('dcToolbarDrawer');
    if (!drawerBtn || !drawer) return;
    var isOpen = drawer.classList.contains('open');
    if (!isOpen) {
      /* OPEN */
      drawer.classList.add('open');
      drawer.style.maxHeight = '80px';
      drawer.style.opacity   = '1';
      drawerBtn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
    } else {
      /* CLOSE */
      drawer.classList.remove('open');
      drawer.style.maxHeight = '0';
      drawer.style.opacity   = '0';
      drawerBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    }
  }

  /* ── TOOL BUTTONS ── */
  var isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  /* PWA install — invoked by the delegated click handler. */
  function handlePwaInstall() {
    if (isiOS) { alert('برای نصب در آیفون: Share → Add to Home Screen'); return; }
    if (!deferredPrompt) { alert('امکان نصب خودکار در حال حاضر موجود نیست.'); return; }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
  }

  /* ── SEARCH OPEN — invoked by the delegated click handler ── */
  function openGlobalSearch() {
    var box = document.getElementById('dcGlobalBox');
    if (!box) return;
    /* The trigger now lives in the tool drawer; collapse the drawer first so the
       search box isn't revealed behind an open drawer. */
    var drawer = document.getElementById('dcToolbarDrawer');
    if (drawer && drawer.classList.contains('open')) toggleToolbarDrawer();
    box.classList.add('open');
    /* Dim the page behind the bottom sheet (breeds B & C). The homepage runs
       its own full-screen overlay (body.dc-search-mode) and must NOT get the
       translucent dim — skip there. The dim visual + scroll-lock live in
       global-search.css under body.search-open (homepage doesn't load it). */
    if (!document.body.classList.contains('dc-search-mode')) {
      document.body.classList.add('search-open');
    }
    var inp = document.getElementById('dcSearch');
    /* iOS Safari only honors programmatic focus when it runs SYNCHRONOUSLY
       inside the user-gesture handler. The panel animates via transform/opacity
       (never display:none), so the input is focusable the instant .open is set —
       focus right away, no setTimeout/transitionend. */
    if (inp) inp.focus();
  }

  /* ── MUSIC PLAYER ──────────────────────────────────
     A header dropdown that plays atmospheric tracks from dentcast-music.json
     (Arvan-hosted mp3s). The panel mirrors the tool drawer's open/close.

     SEPARATION OF CONCERNS (same principle as radar/drawer): the trigger
     (#btn-music-toggle) ONLY opens/closes the panel and NEVER touches sound;
     play/pause (#dc-music-playpause) is a separate control. Both are bound via
     document delegation, so they survive header replace-in-place.

     CROSS-PAGE: this is an MPA — a full reload destroys the <audio>, so audio
     can't continuously survive navigation. We persist {id, currentTime} to
     localStorage and, on the next load, RESTORE the track+position but leave it
     PAUSED (resume-on-reload, not gapless). We never auto-resume.

     IFRAME SAFETY: playback is gated to the top-level window so the desktop
     shell's content iframe never spawns a second audio source. */

  /* Panel base styles (defensive, same as the drawer's normalize step). */
  (function normalizeMusicPanel() {
    var p = document.getElementById('dcMusicPanel');
    if (!p) return;
    p.style.overflow  = 'hidden';
    p.style.maxHeight = '0';
    p.style.opacity   = '0';
  })();

  /* Filled icons (the play button overrides .dc-svg-icon to fill, not stroke);
     sized by CSS, so no inline width that would beat the stylesheet. */
  var DC_ICON_PLAY  = '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var DC_ICON_PAUSE = '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>';

  /* Reflect the TRUE audio state on the play/pause control (icon + aria) AND
     on the header trigger's "now playing" equalizer. NEVER changes playback —
     called from the play/pause events, panel-open, and track changes. */
  function syncMusicPlayPauseIcon() {
    var playing = !!(dcAudio && !dcAudio.paused && !dcAudio.ended);
    var btn = document.getElementById('dc-music-playpause');
    if (btn) {
      btn.innerHTML = playing ? DC_ICON_PAUSE : DC_ICON_PLAY;
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      btn.setAttribute('aria-label', playing ? 'مکث' : 'پخش');
    }
    /* Equalizer indicator on the closed-state trigger icon. */
    var trigger = document.getElementById('btn-music-toggle');
    if (trigger) trigger.classList.toggle('is-playing', playing);
  }

  /* Trigger handler — ONLY opens/closes the panel. Mirrors toggleToolbarDrawer.
     On open we sync the play/pause icon to reality; we never start/stop sound. */
  function toggleMusicPanel() {
    var btn   = document.getElementById('btn-music-toggle');
    var panel = document.getElementById('dcMusicPanel');
    if (!btn || !panel) return;
    if (!panel.classList.contains('open')) {
      syncMusicPlayPauseIcon();
      panel.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.style.opacity   = '1';
      btn.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
    } else {
      panel.classList.remove('open');
      panel.style.maxHeight = '0';
      panel.style.opacity   = '0';
      btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  /* play() rejects when the browser blocks autoplay, and returns undefined in
     some engines — guard both so we never throw. */
  function dcSafePlay() {
    if (!dcAudio) return;
    try { var p = dcAudio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }

  /* ── playback state (top-level window only) ── */
  var dcAudio = null;        // single shared HTMLAudioElement (new Audio())
  var dcTracks = [];         // parsed from dentcast-music.json
  var dcTrackIndex = -1;     // current index into dcTracks
  var DC_MUSIC_KEY = 'dc-music-state';
  var dcLastSave = 0;

  function dcMusicSave() {
    /* Only persist once a track is actually loaded (never a non-played preview). */
    if (!dcAudio || !dcAudio.src || dcTrackIndex < 0 || !dcTracks[dcTrackIndex]) return;
    try {
      localStorage.setItem(DC_MUSIC_KEY, JSON.stringify({
        id: dcTracks[dcTrackIndex].id,
        t:  dcAudio.currentTime || 0
      }));
    } catch (e) {}
  }

  function dcSetTrackDisplay(track) {
    var t = document.getElementById('dcMusicTitle');
    var a = document.getElementById('dcMusicArtist');
    var d = document.getElementById('dcMusicDesc');
    if (t) t.textContent = track ? (track.title  || '') : 'موسیقی در دسترس نیست';
    if (a) a.textContent = track ? (track.artist || '') : '';
    if (d) d.textContent = track ? (track.description || '') : '';
    /* Flag the unavailable state so CSS can dim the (disabled) controls. */
    var panel = document.getElementById('dcMusicPanel');
    if (panel) panel.classList.toggle('is-unavailable', !track);
  }

  function dcRandomIndex() {
    if (dcTracks.length <= 1) return 0;
    var i; do { i = Math.floor(Math.random() * dcTracks.length); } while (i === dcTrackIndex);
    return i;
  }

  /* Load a track into the shared audio element. opts.seek restores a position
     (paused); opts.play starts playback. */
  function dcLoadTrack(index, opts) {
    opts = opts || {};
    if (!dcAudio || !dcTracks.length) return;
    dcTrackIndex = ((index % dcTracks.length) + dcTracks.length) % dcTracks.length;
    var track = dcTracks[dcTrackIndex];
    dcAudio.src = track.src || '';
    dcSetTrackDisplay(track);
    if (typeof opts.seek === 'number' && opts.seek > 0) {
      /* Need metadata before currentTime can be set; load it without playing. */
      dcAudio.preload = 'metadata';
      dcAudio.addEventListener('loadedmetadata', function once() {
        dcAudio.removeEventListener('loadedmetadata', once);
        try { dcAudio.currentTime = opts.seek; } catch (e) {}
      });
      try { dcAudio.load(); } catch (e) {}
    }
    if (opts.play) dcSafePlay();
    syncMusicPlayPauseIcon();
  }

  /* Play/pause handler — the ONLY thing that starts/stops sound. Fully
     independent of the panel toggle. */
  function toggleMusicPlayPause() {
    if (!dcAudio || !dcTracks.length) return;
    if (dcAudio.paused) {
      if (!dcAudio.src) dcLoadTrack(dcTrackIndex >= 0 ? dcTrackIndex : dcRandomIndex(), { play: true });
      else dcSafePlay();
    } else {
      dcAudio.pause();
    }
    syncMusicPlayPauseIcon();
  }

  /* Forward — skip to a RANDOM next track and play it. A deliberate user
     gesture, so starting playback is allowed (no autoplay policy concern).
     dcRandomIndex() never repeats the current track when more than one exists,
     so this stays useful as the library grows. */
  function dcMusicForward() {
    if (!dcAudio || !dcTracks.length) return;
    dcLoadTrack(dcRandomIndex(), { play: true });
  }

  function initMusicPlayer() {
    /* The player lives only in the top-level header. In the desktop iframe
       shell (or any iframe / content-only view) we must NOT create a second
       audio source. */
    if (window.self !== window.top) return;
    if (document.body && document.body.classList.contains('dc-content-only')) return;
    if (!document.getElementById('dcMusicPanel')) return;  // page has no header

    dcAudio = new Audio();
    dcAudio.preload = 'none';

    /* Continuous play: on end, auto-advance to the next RANDOM track. */
    dcAudio.addEventListener('ended', function () { dcLoadTrack(dcRandomIndex(), { play: true }); });
    /* Broken src → try another track, but don't loop forever. */
    var dcErrors = 0;
    dcAudio.addEventListener('error', function () {
      if (!dcTracks.length || !dcAudio.src) return;
      if (++dcErrors <= dcTracks.length) dcLoadTrack(dcRandomIndex(), { play: !dcAudio.paused });
      else dcSetTrackDisplay(null);
    });
    /* Persist position (throttled) and keep the icon honest. */
    dcAudio.addEventListener('timeupdate', function () {
      var now = Date.now();
      if (now - dcLastSave > 5000) { dcLastSave = now; dcMusicSave(); }
    });
    dcAudio.addEventListener('play',  function () {
      syncMusicPlayPauseIcon();
      /* Exclusivity: only one audio source plays. When the music starts, the
         podcast yields — stop it (unmount + close). Safe no-op if not mounted. */
      dcStopPodcast();
    });
    dcAudio.addEventListener('pause', syncMusicPlayPauseIcon);
    /* Final save on navigation away (resume-on-reload). */
    window.addEventListener('pagehide', dcMusicSave);

    /* Graceful failure: a missing/broken JSON leaves the panel usable with a
       clean "unavailable" state and no thrown errors. */
    fetch('/dentcast-music.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.tracks) || !data.tracks.length) { dcSetTrackDisplay(null); return; }
        dcTracks = data.tracks;

        var ch = document.getElementById('dcMusicChannel');
        if (ch && data.channel_url) { ch.href = data.channel_url; ch.hidden = false; }

        var pp = document.getElementById('dc-music-playpause');
        if (pp) pp.disabled = false;  // enable now that tracks exist
        var fw = document.getElementById('dc-music-forward');
        if (fw) fw.disabled = false;  // forward becomes usable too

        /* Resume-on-reload: restore saved track + position, but PAUSED. We
           never call play() here — the user resumes with one tap if they want. */
        var saved = null;
        try { saved = JSON.parse(localStorage.getItem(DC_MUSIC_KEY) || 'null'); } catch (e) {}
        if (saved && saved.id) {
          for (var i = 0; i < dcTracks.length; i++) {
            if (dcTracks[i].id === saved.id) { dcLoadTrack(i, { seek: saved.t || 0 }); break; }
          }
        }
        /* No saved state → preview a random track's info (not loaded/played);
           pressing play will start exactly that track. */
        if (dcTrackIndex < 0) { dcTrackIndex = dcRandomIndex(); dcSetTrackDisplay(dcTracks[dcTrackIndex]); }
        syncMusicPlayPauseIcon();
      })
      .catch(function () { dcSetTrackDisplay(null); });
  }
  initMusicPlayer();

  /* ── PODCAST PLAYER DRAWER ─────────────────────────
     A global slide-down drawer (under the fixed header) that hosts the
     /player.html iframe. The podcast is designed to behave EXACTLY like the
     header music button: it keeps playing on the same page even when the drawer
     is hidden, it stops on navigation (the MPA reload destroys the iframe), and
     it resumes from the last position on the next page via player.html's own
     localStorage('dc-resume-state') — the same resume-on-reload feel the music
     button gets from localStorage('dc-music-state'). player.html is reused
     completely untouched; we only control WHERE/WHEN it mounts and toggle the
     drawer's visibility:
       • lazy-mount on FIRST open only; afterwards the iframe persists and keeps
         playing in the background while the drawer is hidden;
       • the headphone icon is the toggle (open ↔ close); close only HIDES;
       • body-scroll lock only while the drawer is open;
       • exclusivity: only one audio source plays at a time and the podcast
         yields to whatever starts next. When the podcast plays it pauses the
         music and the episodes inline player; when the music or the episodes
         inline player starts, the podcast is stopped (its iframe goes away and
         the drawer closes) — resume position is kept for the next open.
     All functions are declarations (hoisted), so the delegated click handler
     and the music 'play' hook above can reference them regardless of order. */
  var dcPodFrame = null;

  /* Reflect the iframe's true audio state on the headphone trigger, reusing the
     exact .is-playing treatment the music trigger uses (equalizer + glow). This
     stays accurate even when the drawer is closed, because the iframe and its
     audio listeners persist — so the user can see audio is live and where to
     tap. */
  function dcSetPodcastPlaying(on) {
    var b = document.getElementById('btn-podcast-toggle');
    if (b) b.classList.toggle('is-playing', !!on);
  }

  /* The (same-origin) iframe audio element. */
  function dcPodAudio() {
    try {
      var doc = dcPodFrame && dcPodFrame.contentDocument;
      return doc ? doc.getElementById('dc-audio') : null;
    } catch (e) { return null; }
  }
  function dcPodSyncFromAudio() {
    var a = dcPodAudio();
    dcSetPodcastPlaying(!!(a && !a.paused && !a.ended));
  }
  /* Podcast just became the active audio → silence the others (mirrors the
     music button's play-event-driven exclusivity). */
  function dcPodOnPlay() {
    dcSetPodcastPlaying(true);
    if (dcAudio && !dcAudio.paused) dcAudio.pause();
    if (typeof window.dcEpisodesInlinePause === 'function') {
      try { window.dcEpisodesInlinePause(); } catch (e) {}
    }
  }

  /* Attach listeners to the iframe's <audio> once it has loaded — observing
     player.html, never changing its logic. */
  function dcPodAttachAudioHook() {
    var a = dcPodAudio();
    if (!a) return;
    a.addEventListener('play',  dcPodOnPlay);
    a.addEventListener('pause', dcPodSyncFromAudio);
    a.addEventListener('ended', dcPodSyncFromAudio);
  }

  /* Size the overlay to the player CARD, not the viewport. Read-only: we measure
     the same-origin iframe's existing .dc-wrapper card (the same contentDocument
     access dcPodAudio already relies on) and publish it as --dc-player-h, which
     the overlay/body CSS consume. We measure the CARD specifically (not
     document.body, which carries player.html's min-height:100vh + padding) so we
     never inherit its full-viewport floor — hence no need to touch player.html.
     A safety cap keeps it within the available space below the header; if the
     card is taller, the body's own overflow-y:auto scrolls. Falls back silently
     to the CSS default (calc(100vh - 57px)) if measurement isn't available. */
  function dcPodSizeToContent() {
    var ov = document.getElementById('dcPlayerOverlay');
    if (!ov || !dcPodFrame) return;
    try {
      var doc = dcPodFrame.contentDocument;
      var card = doc && doc.querySelector('.dc-wrapper');
      if (!card) return;
      /* +32 mirrors player.html's body padding (16px top/bottom) so the card
         keeps its intended breathing room inside the panel. */
      var want = Math.ceil(card.getBoundingClientRect().height) + 32;
      var cap  = window.innerHeight - 57;
      var h    = Math.max(0, Math.min(want, cap));
      if (h > 0) ov.style.setProperty('--dc-player-h', h + 'px');
    } catch (e) { /* cross-origin/not-ready → keep the CSS fallback height */ }
  }

  /* Keep the panel matched to the card as its content reflows (description
     toggles, search results, episode list). Reuses the same-origin access; the
     observer lives on the iframe's <body> and just re-measures the card. */
  function dcPodObserveSize() {
    if (!dcPodFrame || typeof ResizeObserver === 'undefined') return;
    try {
      var body = dcPodFrame.contentDocument && dcPodFrame.contentDocument.body;
      if (!body) return;
      if (dcPodFrame._dcSizeRO) dcPodFrame._dcSizeRO.disconnect();
      dcPodFrame._dcSizeRO = new ResizeObserver(dcPodSizeToContent);
      dcPodFrame._dcSizeRO.observe(body);
    } catch (e) { /* not available → static one-shot sizing still applied */ }
  }

  /* Lazy-mount on first open only; afterwards dcPodFrame persists. */
  function dcPodMount() {
    if (dcPodFrame) return;
    var holder = document.getElementById('dcPlayerOverlayHolder');
    if (!holder) return;
    dcPodFrame = document.createElement('iframe');
    dcPodFrame.src = '/player.html?v=4';   // identical src → identical resume/auto-advance
    dcPodFrame.title = 'پخش‌کنندهٔ پادکست دنت‌کست';
    dcPodFrame.loading = 'lazy';
    dcPodFrame.allow = 'autoplay';
    dcPodFrame.addEventListener('load', function () {
      dcPodAttachAudioHook();
      dcPodSizeToContent();   // initial fit once the card has rendered
      dcPodObserveSize();     // keep fitting as the card reflows
    });
    holder.appendChild(dcPodFrame);
  }

  function dcPodDrawerOpen() {
    /* Top-level only — never spawn a nested player inside an iframe. */
    if (window.self !== window.top) return;
    var ov = document.getElementById('dcPlayerOverlay');
    if (!ov) return;
    /* Don't stack header dropdowns: collapse the tool drawer / music panel. */
    var td = document.getElementById('dcToolbarDrawer');
    if (td && td.classList.contains('open')) toggleToolbarDrawer();
    var mp = document.getElementById('dcMusicPanel');
    if (mp && mp.classList.contains('open')) toggleMusicPanel();
    dcPodMount();
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    var b = document.getElementById('btn-podcast-toggle');
    if (b) b.setAttribute('aria-expanded', 'true');
    /* Re-measure on each open: the iframe persists between opens, so its card may
       have reflowed (or never been measured if the first open raced the load). */
    dcPodSizeToContent();
    /* No full-screen scroll lock: the panel now sizes to the player card and
       sits under the header like the music panel / tool drawer, so the rest of
       the page must stay visible and scrollable beneath it (this was the
       "covers the whole page" complaint). */
  }
  /* Close ONLY hides the drawer — the iframe stays mounted and keeps playing. */
  function dcPodDrawerClose() {
    var ov = document.getElementById('dcPlayerOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
    var b = document.getElementById('btn-podcast-toggle');
    if (b) b.setAttribute('aria-expanded', 'false');
  }
  /* The headphone icon is the toggle. */
  function dcPodToggle() {
    var ov = document.getElementById('dcPlayerOverlay');
    if (ov && ov.classList.contains('open')) dcPodDrawerClose();
    else dcPodDrawerOpen();
  }
  /* Exclusivity stop: another source started, so the podcast yields entirely —
     unmount the iframe (it "goes away") and close the drawer. Resume position is
     preserved in localStorage('dc-resume-state'); reopening re-mounts paused. */
  function dcStopPodcast() {
    if (dcPodFrame) { dcPodFrame.remove(); dcPodFrame = null; }
    dcSetPodcastPlaying(false);
    dcPodDrawerClose();
  }

  /* Exposed so the episodes-page inline player can silence the podcast when it
     starts playing (the symmetric half lives in episodes.html). */
  window.dcPodcastStop = dcStopPodcast;

  /* Escape just hides the drawer; it does NOT stop playback. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.keyCode !== 27) return;
    var ov = document.getElementById('dcPlayerOverlay');
    if (ov && ov.classList.contains('open')) dcPodDrawerClose();
  });

  /* ── HEADER OPENER EXCLUSIVITY ─────────────────────
     Only ONE header menu (tool drawer / music panel / podcast overlay) may be
     open at a time, and while one is open, tapping a DIFFERENT opener must just
     dismiss the open one — it must NOT open the tapped menu nor light up its
     aria-expanded ring. (The three menus share the same fixed anchor under the
     header and overlap, so without this an opened-but-hidden sibling would still
     flip aria-expanded="true" and colour its border — the reported bug.)
     Tapping the SAME opener that's open toggles it closed; tapping any opener
     while nothing is open opens it normally. */
  function dcOpenMenu() {
    var td = document.getElementById('dcToolbarDrawer');
    if (td && td.classList.contains('open')) return 'toolbar';
    var mp = document.getElementById('dcMusicPanel');
    if (mp && mp.classList.contains('open')) return 'music';
    var ov = document.getElementById('dcPlayerOverlay');
    if (ov && ov.classList.contains('open')) return 'podcast';
    return null;
  }
  function dcCloseMenu(which) {
    if (which === 'toolbar') toggleToolbarDrawer();
    else if (which === 'music') toggleMusicPanel();
    else if (which === 'podcast') dcPodDrawerClose();
  }
  function dcHeaderOpenerClick(which) {
    var open = dcOpenMenu();
    /* A different menu is open → just close it; do NOT open/colour the tapped one. */
    if (open && open !== which) { dcCloseMenu(open); return; }
    /* Same one open (toggle closed) or nothing open (open it). */
    if (which === 'toolbar') toggleToolbarDrawer();
    else if (which === 'music') toggleMusicPanel();
    else dcPodToggle();
  }

  /* ── HEADER EVENT DELEGATION ───────────────────────
     Header button handlers are bound ONCE on document, not on the buttons.
     Because document always exists, it doesn't matter WHEN a button enters
     the DOM — static markup, injected at load, or replaced later all behave
     identically. This eliminates the old bind-time `if (el) el.addEventListener`
     lookups that silently no-op'd when an element was missing or renamed (the
     dead-button failure mode), and lets the header be re-injected (e.g. for the
     music player) without rebinding. Handler LOGIC is unchanged — only the
     binding mechanism moved from per-element to delegation. (The radar button
     is delegated separately, inside the radar block, after openRadar exists.) */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    /* Mobile tool drawer. NOTE: #btn-toolbar-toggle is the mobile tool
       drawer — NOT #dcd-hdr-hamburger (desktop sidebar collapse in
       index.html). Never conflate the two. */
    if (t.closest('#btn-toolbar-toggle')) { dcHeaderOpenerClick('toolbar'); return; }
    /* Search trigger — a CLASS; the search button has no id. */
    if (t.closest('.dcOpenSearch'))       { openGlobalSearch();    return; }
    /* Music: trigger ONLY toggles the panel; play/pause is a SEPARATE control
       and never affected by the trigger. */
    if (t.closest('#btn-music-toggle'))   { dcHeaderOpenerClick('music');   return; }
    if (t.closest('#dc-music-forward'))   { dcMusicForward();      return; }
    if (t.closest('#dc-music-playpause')) { toggleMusicPlayPause(); return; }
    /* Podcast drawer: the headphone icon is the toggle (open ↔ close). */
    if (t.closest('#btn-podcast-toggle'))    { dcHeaderOpenerClick('podcast'); return; }
    /* Drawer tool buttons. */
    if (t.closest('#tool-pwa'))     { handlePwaInstall(); return; }
    if (t.closest('#tool-consult')) { window.location.href = 'mailto:info@dentcast.ir'; return; }
    if (t.closest('#tool-about'))   { window.location.href = '/about.html'; return; }
    /* Theme toggle moved into the drawer — reuse applyTheme, no 2nd listener. */
    if (t.closest('#btn-theme-drawer')) {
      applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
      return;
    }
  });

  /* ── CLOSE RESULTS ──
     Closes on the × button OR on a tap on the translucent dim (#dc-search-dim),
     mirroring the bottom-sheet close behavior for breeds B & C. */
  document.addEventListener('click', function (e) {
    if (e.target.closest('.dc-close-results') || (e.target.id === 'dc-search-dim')) {
      var g = document.getElementById('dcGlobalBox');
      var r = document.getElementById('dcResults');
      if (g) g.classList.remove('open');
      if (r) r.style.display = 'none';
      document.body.classList.remove('search-open');
    }
  }, true);

  /* ── RADAR OVERLAY ─────────────────────────────── */
  var radarOverlay  = document.getElementById('dcRadarOverlay');
  var radarCloseBtn = document.getElementById('dcCloseRadarOverlay');
  var radarInput    = document.getElementById('dcRadarInput');
  var radarResults  = document.getElementById('dcRadarResults');
  if (!radarOverlay || !radarInput) return;

  var radarData = [];
  var isRadarLoaded = false;

  function loadRadarData() {
    fetch('/radar.json?v=12', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        radarData = data;
        isRadarLoaded = true;
        handleRadarSearch();
      })
      .catch(function () {
        if (radarResults)
          radarResults.innerHTML = '<div class="radar-no-results">ارتباط با رادار برقرار نشد.</div>';
      });
  }

  function openRadar(push) {
    document.body.classList.add('dc-radar-mode');
    radarOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(function () { radarInput.focus(); }, 100);
    if (push !== false) history.pushState({ dcRadar: true }, '', '#radar');
    if (!isRadarLoaded) loadRadarData();
  }

  function closeRadar(fromPop) {
    document.body.classList.remove('dc-radar-mode');
    radarOverlay.setAttribute('aria-hidden', 'true');
    radarInput.value = '';
    if (radarResults)
      radarResults.innerHTML = '<div class="radar-initial-msg">برای جستجو تایپ کنید...</div>';
    if (!fromPop) {
      if (history.state && history.state.dcRadar) history.back();
      else if (window.location.hash === '#radar')
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function handleRadarSearch() {
    var q = radarInput.value.trim().toLowerCase();
    if (!q) {
      if (radarResults)
        radarResults.innerHTML =
          '<div class="radar-initial-msg">برای جستجو تایپ کنید...' +
          '<div style="font-size:.78rem;color:var(--txt3);margin-top:12px;text-align:center;border-top:1px dashed var(--border2);padding-top:10px;">' +
          'سایتی مدنظرته؟ <a href="https://survey.porsline.ir/s/TA5qoIDQ" target="_blank" rel="noopener" style="color:var(--ac);font-weight:500;">پیشنهادش کنید</a></div></div>';
      return;
    }
    if (!isRadarLoaded) return;
    var f = radarData.filter(function (item) {
      var kw = item.keywords || [];
      return item.name.toLowerCase().includes(q) ||
             item.desc.toLowerCase().includes(q) ||
             kw.some(function (k) { return k.toLowerCase().includes(q); });
    });
    for (var i = f.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = f[i]; f[i] = f[j]; f[j] = tmp;
    }
    f.sort(function (a, b) {
      return Number(a.priority != null ? a.priority : 10) -
             Number(b.priority != null ? b.priority : 10);
    });
    renderRadarResults(f);
  }

  function renderRadarResults(results) {
    if (!radarResults) return;
    if (!results.length) {
      radarResults.innerHTML =
        '<div class="radar-no-results">نتیجه‌ای یافت نشد. ' +
        '<a href="https://survey.porsline.ir/s/TA5qoIDQ" target="_blank" rel="noopener" ' +
        'style="display:block;margin-top:10px;color:var(--ac);">سایت مرتبطی پیشنهاد کنید</a></div>';
      return;
    }
    var h = '';
    results.forEach(function (item) {
      var isFeat = item.featured === true || String(item.featured).toLowerCase() === 'true';
      var isCred = item.credit  === true || String(item.credit).toLowerCase()   === 'true';
      var fb = isFeat && !isCred
        ? '<span style="background:rgba(245,162,8,.12);color:#b07d00;font-size:.62rem;padding:2px 5px;border-radius:4px;border:1px solid rgba(245,162,8,.22);margin-right:4px;">⭐ پیشنهاد</span>' : '';
      var cb = isCred
        ? '<span style="background:rgba(46,125,50,.10);color:#2e7d32;font-size:.62rem;padding:2px 5px;border-radius:4px;border:1px solid rgba(46,125,50,.18);margin-right:4px;font-weight:700;">🤝 حامی</span>' : '';
      h += '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" class="radar-result-item">' +
           '<div class="radar-item-title"><span>' + item.name + '</span>' + cb + fb + '</div>' +
           '<div class="radar-item-url">' + item.url + '</div>' +
           '<div class="radar-item-desc">' + item.desc + '</div></a>';
    });
    h += '<div style="font-size:.78rem;color:var(--txt3);margin-top:12px;text-align:center;' +
         'border-top:1px dashed var(--border2);padding-top:10px;">سایتی جا افتاده؟ ' +
         '<a href="https://survey.porsline.ir/s/TA5qoIDQ" target="_blank" rel="noopener" ' +
         'style="color:var(--ac);font-weight:500;">پیشنهادش کنید</a></div>';
    radarResults.innerHTML = h;
  }

  /* Radar open button — delegated so it survives header injection/replacement
     (the button lives in the injected header cluster). This runs only when the
     radar block was reached, i.e. the overlay is present; the overlay-internal
     binds below stay direct, as those elements are present by now. */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#btn-radar-topbar')) openRadar(true);
  });

  if (radarCloseBtn) {
    radarCloseBtn.addEventListener('click', function () { closeRadar(false); });
  }

  radarInput.addEventListener('input', handleRadarSearch);

  window.addEventListener('popstate', function () {
    if (document.body.classList.contains('dc-radar-mode')) closeRadar(true);
  });

  if (window.location.hash === '#radar') openRadar(false);
  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#radar') openRadar(false);
  });

})();

/* =====================================================
   dcDose — weekly 35-minute presence player
   Counts the visitor's REAL presence: tab visible AND an
   interaction within the last 60s. 5s heartbeat; a write
   lock (o.t) keeps multiple open tabs/frames at the
   single-tab rate. Stored per device in localStorage,
   week starts Saturday. UI: a progress ring in the topbar
   + a tap popover. The homepage runs its own copy of this
   core against the SAME storage key, so minutes add up
   across the whole site.
===================================================== */
(function () {
  'use strict';
  var KEY = 'dcDose', WEEK_SEC = 35 * 60, TICK = 5000;

  function weekIdOf(d) {
    var off = (d.getDay() + 1) % 7; /* days since Saturday */
    var sat = new Date(d.getFullYear(), d.getMonth(), d.getDate() - off);
    return sat.getFullYear() + '-' + (sat.getMonth() + 1) + '-' + sat.getDate();
  }
  function weekId() { return weekIdOf(new Date()); }
  function load() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!o || o.w !== weekId()) {
      /* new week: archive last week's seconds (only if it truly was LAST week)
         for the once-per-week greeting, then start fresh. pa = greeted flag. */
      var lw = weekIdOf(new Date(Date.now() - 7 * 864e5));
      o = { w: weekId(), s: 0, t: 0, p: (o && o.w === lw && o.s) ? o.s : 0, pa: 0 };
      save(o);
    }
    return o;
  }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function faNum(x) {
    return String(x).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
  }
  function fmt(sec) {
    sec = Math.floor(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return faNum(m) + ':' + faNum((s < 10 ? '0' : '') + s);
  }

  var lastAct = Date.now();
  function poke() { lastAct = Date.now(); }
  ['scroll', 'touchstart', 'pointerdown', 'keydown', 'mousemove', 'click'].forEach(function (ev) {
    window.addEventListener(ev, poke, { passive: true });
  });
  function isActive() {
    return document.visibilityState === 'visible' && (Date.now() - lastAct) < 60000;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ── ring in every topbar actions cluster ── */
    var R = 14, C = 2 * Math.PI * R;
    var ticksHtml = '';
    for (var m5 = 5; m5 <= 30; m5 += 5) {
      ticksHtml += '<span class="dc-dose-tick" style="right:' + (m5 / 35 * 100).toFixed(2) + '%"></span>';
    }
    var rings = [];
    Array.prototype.forEach.call(document.querySelectorAll('.dc-topbar-actions'), function (bar) {
      if (bar.querySelector('.dc-dose-ring')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dc-dose-ring';
      b.setAttribute('aria-label', 'یادگیری هفتگی شما در دنت‌کست');
      b.innerHTML =
        '<svg viewBox="0 0 34 34" aria-hidden="true">' +
        '<circle class="dc-dr-bg" cx="17" cy="17" r="' + R + '"/>' +
        '<circle class="dc-dr-fg" cx="17" cy="17" r="' + R + '" stroke-dasharray="' + C + ' ' + C + '" stroke-dashoffset="' + C + '"/>' +
        '</svg><span class="dc-dr-min">۰</span>';
      bar.appendChild(b);
      rings.push(b);
    });
    if (!rings.length) return;

    /* ── popover (one per page) ── */
    var pop = document.createElement('div');
    pop.className = 'dc-dose-pop';
    pop.innerHTML =
      '<div class="dc-dose-pop-title">یادگیری هفتگی شما با دنت‌کست</div>' +
      '<div class="dc-dose-pop-time">—</div>' +
      '<div class="dc-dose-bar"><div class="dc-dose-fill"></div>' + ticksHtml + '</div>' +
      '<div class="dc-dose-pop-status"><span class="dc-dose-live"></span><span class="dc-dose-pop-state">—</span></div>' +
      '<div class="dc-dose-pop-note">سعی کن هفته‌ای حداقل ۳۵ دقیقه با دنت‌کست باشی. شمارش: حضور فعال شما — خواندن یا شنیدن؛ ذخیره روی همین دستگاه · هفته از شنبه</div>';
    document.body.appendChild(pop);
    var popTime = pop.querySelector('.dc-dose-pop-time'),
        popFill = pop.querySelector('.dc-dose-fill'),
        popLive = pop.querySelector('.dc-dose-live'),
        popState = pop.querySelector('.dc-dose-pop-state'),
        popBar = pop.querySelector('.dc-dose-bar'),
        popTicks = pop.querySelectorAll('.dc-dose-tick');

    function openPop(ring) {
      var r = ring.getBoundingClientRect();
      var w = 232, vw = window.innerWidth;
      pop.style.top = Math.round(r.bottom + 8) + 'px';
      pop.style.left = Math.round(Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2))) + 'px';
      pop.classList.add('open');
      paint();
    }
    function closePop() { pop.classList.remove('open'); }
    rings.forEach(function (ring) {
      ring.addEventListener('click', function (e) {
        e.stopPropagation();
        pop.classList.contains('open') ? closePop() : openPop(ring);
      });
    });
    document.addEventListener('click', function (e) {
      if (pop.classList.contains('open') && !pop.contains(e.target)) closePop();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });

    /* once-per-week greeting — the first visit after the Saturday reset */
    (function greet() {
      var o = load();
      if (o.pa) return;
      o.pa = 1; save(o);
      if (!o.p || o.p < 60) return;
      var g = document.createElement('div');
      g.className = 'dc-dose-greet';
      g.setAttribute('role', 'status');
      g.innerHTML = 'هفته‌ی قبل <b>' + faNum(Math.round(o.p / 60)) + ' دقیقه</b> با دنت‌کست بودی — ببینیم این هفته چی‌کار می‌کنی!';
      document.body.appendChild(g);
      requestAnimationFrame(function () { requestAnimationFrame(function () { g.classList.add('show'); }); });
      function bye() {
        g.classList.remove('show');
        setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 400);
      }
      g.addEventListener('click', bye);
      setTimeout(bye, 8000);
    })();

    /* at 70 minutes — double the goal — the presence dot becomes a tiny heart */
    var HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.6-4.7-10.1-9.3C.5 8.4 2.6 4.9 6 4.9c2 0 3.4 1.1 4.2 2.4L12 9l1.8-1.7c.8-1.3 2.2-2.4 4.2-2.4 3.4 0 5.5 3.5 4.1 6.8C19.6 16.3 12 21 12 21z"/></svg>';
    function setLive(el, active, loved) {
      if (!el) return;
      if (loved && !el.dataset.h) { el.dataset.h = '1'; el.innerHTML = HEART_SVG; }
      else if (!loved && el.dataset.h) { el.dataset.h = ''; el.innerHTML = ''; }
      el.classList.toggle('dc-heart', loved);
      el.classList.toggle('on', active);
    }

    /* ── paint everything from storage ── */
    function paint() {
      var o = load();
      /* 35:00 is the GOAL, not a ceiling: the bar/ring saturate at 35 but the
         clock keeps counting and the player stays alive past the goal */
      var sec = Math.min(o.s, WEEK_SEC), frac = sec / WEEK_SEC, done = o.s >= WEEK_SEC;
      var active = isActive();
      var loved = o.s >= WEEK_SEC * 2;
      rings.forEach(function (ring) {
        ring.querySelector('.dc-dr-fg').style.strokeDashoffset = C * (1 - frac);
        ring.querySelector('.dc-dr-min').textContent = faNum(Math.floor(o.s / 60));
        ring.classList.toggle('dc-done', done);
      });
      if (pop.classList.contains('open')) {
        popTime.textContent = done ? fmt(o.s) + ' ✓' : fmt(o.s) + ' از ۳۵:۰۰';
        popFill.style.width = (frac * 100) + '%';
        popBar.classList.toggle('dc-done', done);
        setLive(popLive, active, loved);
        /* crossed 5-min milestones leave their tick lit */
        for (var ti = 0; ti < popTicks.length; ti++) {
          popTicks[ti].classList.toggle('on', sec >= (ti + 1) * 300);
        }
        popState.textContent = !active ? 'متوقف — با فعالیت ادامه می‌یابد'
          : done ? 'یادگیری این هفته کامل شد ✓'
          : 'در حال شمارش حضور شما';
      }
    }

    /* ── one-shot milestone effect — no text, peripheral only ── */
    function celebrate() {
      rings.forEach(function (ring) {
        ring.classList.remove('dc-pop');
        void ring.offsetWidth;
        ring.classList.add('dc-pop');
        setTimeout(function () { ring.classList.remove('dc-pop'); }, 1000);
      });
      if (pop.classList.contains('open')) {
        popBar.classList.remove('dc-cele');
        void popBar.offsetWidth;
        popBar.classList.add('dc-cele');
        setTimeout(function () { popBar.classList.remove('dc-cele'); }, 1100);
      }
    }

    /* ── heartbeat: count presence, multi-tab safe — keeps counting past 35 ── */
    setInterval(function () {
      if (isActive()) {
        var o = load(), now = Date.now();
        if (now - (o.t || 0) >= TICK - 700) {
          var prevMil = Math.floor(o.s / 300);
          o.s += TICK / 1000;
          o.t = now;
          save(o);
          if (Math.floor(o.s / 300) > prevMil) celebrate();
        }
      }
      paint();
    }, TICK);
    window.addEventListener('storage', function (e) { if (e.key === KEY) paint(); });
    document.addEventListener('visibilitychange', paint);
    paint();
  });
})();
