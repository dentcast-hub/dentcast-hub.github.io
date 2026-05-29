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
'    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>' +
/* Music player trigger (headphones icon). ONLY toggles #dcMusicPanel open/
   closed via delegation — it never affects playback (play/pause is a separate
   control inside the panel). */
'    <button class="dc-topbar-btn" id="btn-music-toggle" aria-label="موسیقی" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M3 14a9 9 0 0 1 18 0"/><path d="M5 14h3v7H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z"/><path d="M19 14h-3v7h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/></svg></button>' +
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

  /* ── MUSIC PLAYER — panel markup ──────────────────
     A dropdown panel that mirrors #dcToolbarDrawer's open/close pattern.
     Shows the current track's title/artist/description, a play/pause control
     at the bottom (SEPARATE from the trigger), and a link to the channel.
     The play/pause button starts disabled and is enabled once tracks load. */
  var DC_MUSIC_PANEL_HTML =
'<div id="dcMusicPanel" class="dc-music-panel" aria-hidden="true">' +
'  <div class="dc-music-inner">' +
'    <div class="dc-music-meta">' +
'      <div class="dc-music-title" id="dcMusicTitle">در حال بارگذاری…</div>' +
'      <div class="dc-music-artist" id="dcMusicArtist"></div>' +
'      <div class="dc-music-desc" id="dcMusicDesc"></div>' +
'    </div>' +
'    <div class="dc-music-controls">' +
'      <button class="dc-music-playpause" id="dc-music-playpause" type="button" aria-label="پخش / مکث" disabled><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/></svg></button>' +
'      <a class="dc-music-channel" id="dcMusicChannel" href="#" target="_blank" rel="noopener" hidden><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/></svg><span>کانال موسیقی</span></a>' +
'    </div>' +
'  </div>' +
'</div>';

  /* Panel CSS, injected once (so it travels with the header regardless of
     whether a page loads dc-nav.css). Reuses the theme's CSS variables and
     mirrors the tool-drawer dropdown look. */
  var DC_MUSIC_CSS =
'.dc-music-panel{overflow:hidden;max-height:0;opacity:0;background:var(--surface2,#f4f6fb);border-bottom:1px solid var(--border,rgba(2,35,96,.10));transition:max-height .28s cubic-bezier(.4,0,.2,1),opacity .22s ease;}' +
'.dc-music-inner{padding:12px 14px;display:flex;flex-direction:column;gap:8px;}' +
'.dc-music-title{font-size:.92rem;font-weight:800;color:var(--txt1,#16213a);}' +
'.dc-music-artist{font-size:.74rem;font-weight:700;color:var(--ac,#a334d4);}' +
'.dc-music-desc{font-size:.74rem;line-height:1.7;color:var(--txt2,#5a6b8c);}' +
'.dc-music-controls{display:flex;align-items:center;gap:12px;margin-top:4px;}' +
'.dc-music-playpause{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:0;border-radius:999px;background:var(--ac,#a334d4);color:#fff;cursor:pointer;font-size:22px;flex-shrink:0;}' +
'.dc-music-playpause[disabled]{opacity:.45;cursor:default;}' +
'.dc-music-playpause:active{transform:scale(.92);}' +
'.dc-music-channel{display:inline-flex;align-items:center;gap:6px;font-size:.78rem;font-weight:700;color:var(--ac,#a334d4);text-decoration:none;}' +
'.dc-music-channel .dc-svg-icon{width:1em;height:1em;}';

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
  })();

  /* ── THEME TOGGLE ─────────────────────────────────
     Single source of truth for theme behavior.
     Pages should include <button id="dc-theme-toggle">
     in markup (no popping in). If absent, we create it.
     The click handler is ALWAYS bound here; pages must
     NOT bind their own.
  ─────────────────────────────────────────────────── */
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('dc-theme', dark ? 'dark' : 'light');
    var btn = document.getElementById('dc-theme-toggle');
    if (btn) setDcIcon(btn, dark ? 'sun' : 'moon');
    var drawerBtn = document.getElementById('dcdThemeBtn');
    if (drawerBtn) drawerBtn.innerHTML =
      '<span>' + dcSvgIcon(dark ? 'sun' : 'moon') + '</span><span>تم</span>';
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

  var existingToggle = document.getElementById('dc-theme-toggle');
  var noToggle = document.body.dataset.noThemeToggle === '1';

  if (!existingToggle && !noToggle) {
    /* Legacy fallback: page has no inline button, create one */
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'dc-theme-toggle';
    toggleBtn.setAttribute('aria-label', 'تغییر تم');
    document.body.appendChild(toggleBtn);
    existingToggle = toggleBtn;
  }

  if (existingToggle) {
    setDcIcon(existingToggle,
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon');
    existingToggle.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
    });
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
    box.classList.add('open');
    var inp = document.getElementById('dcSearch');
    if (inp) setTimeout(function () { inp.focus(); }, 0);
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

  var DC_ICON_PLAY  = '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/></svg>';
  var DC_ICON_PAUSE = '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="10"/><path d="M10 8v8"/><path d="M14 8v8"/></svg>';

  /* Make the play/pause icon reflect the TRUE audio state (never changes it). */
  function syncMusicPlayPauseIcon() {
    var btn = document.getElementById('dc-music-playpause');
    if (!btn) return;
    var playing = dcAudio && !dcAudio.paused && !dcAudio.ended;
    btn.innerHTML = playing ? DC_ICON_PAUSE : DC_ICON_PLAY;
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
    dcAudio.addEventListener('play',  syncMusicPlayPauseIcon);
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
    if (t.closest('#btn-toolbar-toggle')) { toggleToolbarDrawer(); return; }
    /* Search trigger — a CLASS; the search button has no id. */
    if (t.closest('.dcOpenSearch'))       { openGlobalSearch();    return; }
    /* Music: trigger ONLY toggles the panel; play/pause is a SEPARATE control
       and never affected by the trigger. */
    if (t.closest('#btn-music-toggle'))   { toggleMusicPanel();    return; }
    if (t.closest('#dc-music-playpause')) { toggleMusicPlayPause(); return; }
    /* Drawer tool buttons. */
    if (t.closest('#tool-pwa'))     { handlePwaInstall(); return; }
    if (t.closest('#tool-consult')) { window.location.href = 'mailto:info@dentcast.ir'; return; }
    if (t.closest('#tool-about'))   { window.location.href = '/about.html'; return; }
  });

  /* ── CLOSE RESULTS ── */
  document.addEventListener('click', function (e) {
    if (e.target.closest('.dc-close-results')) {
      var g = document.getElementById('dcGlobalBox');
      var r = document.getElementById('dcResults');
      if (g) g.classList.remove('open');
      if (r) r.style.display = 'none';
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
