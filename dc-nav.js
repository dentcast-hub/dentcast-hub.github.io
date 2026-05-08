/* =====================================================
   dc-nav.js — DentCast Shared Navigation Logic
   Toolbar Drawer · Search · Radar · PWA · Theme Toggle
   Used by all internal pages. index.html has its own.
===================================================== */

(function () {
  'use strict';

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
    if (btn) btn.textContent = dark ? '☀️' : '🌙';
  }

  var existingToggle = document.getElementById('dc-theme-toggle');

  if (!existingToggle) {
    /* Create and append the toggle button */
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'dc-theme-toggle';
    toggleBtn.setAttribute('aria-label', 'تغییر تم');
    var _isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggleBtn.textContent = _isDark ? '☀️' : '🌙';
    document.body.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
    });
  } else {
    /* Button exists — sync icon only, do not add another click handler */
    existingToggle.textContent =
      document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  }

  /* ── TOOLBAR DRAWER TOGGLE ── */
  var drawerBtn = document.getElementById('btn-toolbar-toggle');
  var drawer    = document.getElementById('dcToolbarDrawer');
  if (drawerBtn && drawer) {
    drawerBtn.addEventListener('click', function () {
      var isOpen = drawer.classList.contains('open');
      drawer.classList.toggle('open', !isOpen);
      drawerBtn.setAttribute('aria-expanded', String(!isOpen));
      drawer.setAttribute('aria-hidden', String(isOpen));
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
