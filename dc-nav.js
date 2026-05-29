/* =====================================================
   dc-nav.js — DentCast Shared Navigation Logic
   Toolbar Drawer · Search · Radar · PWA · Theme Toggle
   Used by all internal pages. index.html has its own.
===================================================== */

(function () {
  'use strict';

  /* Our own <script> element, captured synchronously. Used as the header
     injection anchor: the cluster is inserted right before this script, i.e.
     exactly where the static header used to sit. Valid only while this script
     runs synchronously (a sync script positioned in-place on a real page);
     it is null for deferred scripts, which lines up with the no-inject path. */
  var dcCurrentScript = document.currentScript;

  /* True once we've injected the header on this page. Gates the deferred
     radar-overlay injection in dcInitRest so header-less pages never get one. */
  var dcHeaderInjected = false;

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
     The dc-topbar header (header + tool drawer + radar overlay) lives
     here, once, and is injected fresh at runtime. The static markup has
     been removed from the pages, so there is NOTHING for the browser to
     paint before injection — no old header, no jump, zero flash.

     Strategy — INJECT-FRESH at this script's position, before first paint:
       On a real page, dc-nav.js is loaded as a SYNCHRONOUS (non-defer)
       <script> placed exactly where the header belongs. While the parser
       is blocked on us, we insert the cluster immediately BEFORE this very
       <script> (its original position) — so the header is in the DOM before
       the browser paints anything below it, and at the right spot: no
       header-less frame and no layout shift. The parent differs (<body> on
       internal pages, #mobile-shell on index.html) — the script-anchor
       handles both automatically.

     Gating (which pages get a header) — no per-page marker needed:
       • document.readyState === 'loading'  ⇒ running synchronously mid-parse
         (a migrated, header-bearing page). INJECT.
       • readyState 'interactive'/'complete' ⇒ ran deferred at end of body
         (a deliberately header-less page, e.g. the embedded player, which
         still loads dc-nav for theme/search). Do NOT inject — it has no
         header by design and we must not add one.
       • <html data-dc-no-header>            ⇒ opt-out page (its own localized
         header). Skip.

     Scope guarantees (header-contract):
       • We never touch the desktop app-shell header (.dcd-col-c-topbar
         inside .dcd-app, in index.html) — only the page's own header slot.
       • All sacred elements (#dcRadarOverlay + children, #dcToolbarDrawer,
         header buttons, the relocated #btn-radar-topbar) exist from this
         instant — before any end-of-body script and before DOMContentLoaded.
         The radar block's early `return` (overlay missing) can never trip on
         a header page, because that block runs later, in dcInitRest @ DCL.
       • #dcSearch / #dcResults / #dcGlobalBox are NOT part of this cluster —
         they stay page-owned static markup, so global-search.js (which binds
         #dcSearch with no guard) is unaffected.
  ─────────────────────────────────────────────────── */
  var DC_TOPBAR_HTML =
'<header class="dc-topbar">' +
'  <div class="dc-topbar-actions">' +
'    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>' +
'    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>' +
'    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>' +
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
/* Radar trigger — relocated from the top bar into the drawer (Change 2). It
   keeps its sacred id (#btn-radar-topbar) and its delegated binding to
   openRadar(true); only its DOM location changed. Styled as a drawer tool. */
'    <button class="dc-drawer-tool-seg" type="button" id="btn-radar-topbar" aria-label="رادار"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7"/><path d="M12 12h.01"/></svg></span><span class="dc-drawer-tool-txt">رادار</span></button>' +
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

  (function injectSharedHeader() {
    /* Opt-out page keeps its own (localized) header. */
    if (document.documentElement.hasAttribute('data-dc-no-header')) return;
    /* Only inject when running synchronously mid-parse — i.e. loaded as a
       sync <script> at the header's slot on a header-bearing page. When
       dc-nav is loaded deferred (deliberately header-less pages), readyState
       is no longer 'loading' by the time we run, so we add no header. */
    if (document.readyState !== 'loading') return;
    /* Idempotent: never create a second header. (At this point only markup
       ABOVE this script is parsed, so a header here means we already ran.) */
    if (document.querySelector('header.dc-topbar:not(.dcd-col-c-topbar)')) return;
    /* Anchor = this very <script>. Insert the cluster immediately before it —
       exactly where the static header used to live — so it lands in the right
       place (works whether the parent is <body> or #mobile-shell) and before
       the browser paints anything below. */
    if (!dcCurrentScript || !dcCurrentScript.parentNode) return;
    /* Header + drawer are injected here (synchronously, before paint). The
       radar overlay is injected later in dcInitRest: it is hidden, so it
       needs no pre-paint, and deferring it lets us skip pages that already
       own a shared overlay (e.g. index.html, whose desktop shell uses it). */
    dcCurrentScript.insertAdjacentHTML('beforebegin', DC_TOPBAR_HTML + DC_DRAWER_HTML);
    dcHeaderInjected = true;
  })();

  /* ── EVERYTHING BELOW runs after the DOM is parsed ────────────────
     The header is already in the DOM (injected synchronously above). The
     setup here needs the full document, so it is deferred to DOMContentLoaded
     — which matches the prior (deferred) timing and avoids, e.g., creating a
     duplicate theme toggle on pages whose static #dc-theme-toggle parses
     after this script. Delegation is bound on `document`, so behavior is
     identical regardless of when this runs. */
  function dcInitRest() {

  /* Radar overlay: inject now (post-parse) only if we injected a header on
     this page AND the page doesn't already own one. Header-less pages never
     get it; pages with a shared static overlay (index.html, whose desktop
     shell uses it) keep theirs. It's present before the radar block below. */
  if (dcHeaderInjected && document.body && !document.getElementById('dcRadarOverlay')) {
    document.body.insertAdjacentHTML('beforeend', DC_RADAR_HTML);
  }

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

  } /* ── end dcInitRest ──────────────────────────── */

  /* If the DOM is already parsed (deferred / header-less pages), run now;
     otherwise wait for DOMContentLoaded (header pages, where this script ran
     synchronously mid-parse and the rest of the body isn't parsed yet). */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', dcInitRest);
  } else {
    dcInitRest();
  }

})();
