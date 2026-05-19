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
      radar: '<path d="M12 19v-6"/><path d="M8 13a4 4 0 0 1 8 0"/><path d="M5 10a8 8 0 0 1 14 0"/><path d="M2 7a12 12 0 0 1 20 0"/><circle cx="12" cy="19" r="2"/>',
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
      pause: '<circle cx="12" cy="12" r="10"/><path d="M10 8v8"/><path d="M14 8v8"/>'
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
      '✈': 'send', '🇮🇷': 'flag', '▶': 'play', '⏸': 'pause'
    }[txt];
  }

  function hydrateUiIcons(root) {
    root = root || document;
    var iconSelector = '.dc-topbar-btn,.dc-drawer-tool-ico,.about-contact-ico,.dc-info-btn,.dc-search-info-btn,.dc-close-results,#dc-theme-toggle';
    var iconNodes = Array.prototype.slice.call(root.querySelectorAll(iconSelector));
    if (root.nodeType === 1 && root.matches(iconSelector)) iconNodes.unshift(root);
    iconNodes.forEach(function (el) {
      var name = iconNameFromEmoji(el.textContent);
      if (name) setDcIcon(el, name);
    });
    var leadingSelector = '.btn-home,.btn-about,.btn-back,.acast-close,button';
    var leadingNodes = Array.prototype.slice.call(root.querySelectorAll(leadingSelector));
    if (root.nodeType === 1 && root.matches(leadingSelector)) leadingNodes.unshift(root);
    leadingNodes.forEach(function (el) {
      var txt = el.textContent.trim();
      var m = txt.match(/^(\S+)\s*(.*)$/);
      if (!m) return;
      var name = iconNameFromEmoji(m[1]);
      if (name) setDcIcon(el, name, m[2]);
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

  /* ── THEME TOGGLE ─────────────────────────────────
     If the page already has #dc-theme-toggle in HTML
     (section index pages with inline JS), we only sync
     the icon and leave the existing click handler alone.
     If the button is absent, we create it dynamically
     so every page gets a consistent toggle.
  ─────────────────────────────────────────────────── */
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('dc-theme', dark ? 'dark' : 'light');
    var btn = document.getElementById('dc-theme-toggle');
    if (btn) setDcIcon(btn, dark ? 'sun' : 'moon');
  }

  var existingToggle = document.getElementById('dc-theme-toggle');
  var noToggle = document.body.dataset.noThemeToggle === '1';

  if (!existingToggle && !noToggle) {
    /* Create and append the toggle button */
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'dc-theme-toggle';
    toggleBtn.setAttribute('aria-label', 'تغییر تم');
    var _isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setDcIcon(toggleBtn, _isDark ? 'sun' : 'moon');
    document.body.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
    });
  } else if (existingToggle) {
    /* Button exists — sync icon only, do not add another click handler */
    setDcIcon(existingToggle, document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon');
  }

  hydrateUiIcons(document);

  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.target && m.target.nodeType === 1) hydrateUiIcons(m.target);
      m.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) hydrateUiIcons(node);
      });
    });
  }).observe(document.documentElement, { childList: true, characterData: true, subtree: true });

  /* ── TOOLBAR DRAWER TOGGLE ── */
  var drawerBtn = document.getElementById('btn-toolbar-toggle');
  var drawer    = document.getElementById('dcToolbarDrawer');
  if (drawerBtn && drawer) {
    /* Ensure drawer has base styles so the animation works
       regardless of any conflicting page CSS */
    drawer.style.overflow   = 'hidden';
    drawer.style.transition = 'max-height .28s cubic-bezier(.4,0,.2,1), opacity .22s ease';
    drawer.style.maxHeight  = '0';
    drawer.style.opacity    = '0';

    drawerBtn.addEventListener('click', function () {
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
    });
  }

  /* ── TOOL BUTTONS ── */
  var isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  var pwaBtn = document.getElementById('tool-pwa');
  if (pwaBtn) {
    pwaBtn.addEventListener('click', function () {
      if (isiOS) { alert('برای نصب در آیفون: Share → Add to Home Screen'); return; }
      if (!deferredPrompt) { alert('امکان نصب خودکار در حال حاضر موجود نیست.'); return; }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
    });
  }

  var consultBtn = document.getElementById('tool-consult');
  if (consultBtn) {
    consultBtn.addEventListener('click', function () {
      window.location.href = 'mailto:info@dentcast.ir';
    });
  }

  var aboutBtn = document.getElementById('tool-about');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', function () {
      window.location.href = '/about.html';
    });
  }

  /* ── SEARCH BUTTON → OPEN dcGlobalBox ── */
  document.querySelectorAll('.dcOpenSearch').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = document.getElementById('dcGlobalBox');
      if (!box) return;
      box.classList.add('open');
      var inp = document.getElementById('dcSearch');
      if (inp) setTimeout(function () { inp.focus(); }, 0);
    });
  });

  /* ── CLOSE RESULTS ── */
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('dc-close-results')) {
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

  var radarTopbarBtn = document.getElementById('btn-radar-topbar');
  if (radarTopbarBtn) {
    radarTopbarBtn.addEventListener('click', function () { openRadar(true); });
  }

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
