/* DentCast Fidelity — self-contained embed for an article on ANOTHER site.
   Built by tools/des_external_embed.py from one FIDELITY result; never edit a
   built copy by hand. Everything it draws is inside this one file — data,
   wording, styles and fonts — so it makes NO request to dentcast at runtime and
   keeps working when dentcast is down (founder, 1405/07/18). The only link out
   is «راستی‌آزمایی در دنت‌کست», which a reader follows by hand.
   The host page adds ONE element, <dentcast-fidelity-chip>, where the chip
   belongs (beside the date); the explanation opens as a sheet over the page on
   tap, so it never takes room in the host's layout. Spec:
   .dentcast/workflows/external-fidelity.md */
(function () {
  var B = __BUNDLE__;
  var FONT_R = '__FONT_R__', FONT_B = '__FONT_B__';
  var fa = function (n) { return String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); };

  if (!document.getElementById('dcfid-fonts')) {
    var st = document.createElement('style');
    st.id = 'dcfid-fonts';
    st.textContent =
      "@font-face{font-family:'DCFid';font-weight:400;font-display:swap;src:url(data:font/woff2;base64," + FONT_R + ") format('woff2')}" +
      "@font-face{font-family:'DCFid';font-weight:700;font-display:swap;src:url(data:font/woff2;base64," + FONT_B + ") format('woff2')}";
    document.head.appendChild(st);
  }

  var CSS = [
    ':host{all:initial;display:block;font-family:DCFid,Tahoma,sans-serif;direction:rtl;',
    '--c:#6455a6;--rgb:100,85,166;--ink:#1d2330;--mute:#5d6577;--bg:#fff;--line:rgba(100,85,166,.28)}',
    ':host([data-theme=dark]){--c:#a99ce0;--rgb:169,156,224;--ink:#e6e8ee;--mute:#a3aaba;--bg:#171b24;--line:rgba(169,156,224,.3)}',
    '@media (prefers-color-scheme:dark){:host([data-theme=auto]){--c:#a99ce0;--rgb:169,156,224;--ink:#e6e8ee;--mute:#a3aaba;--bg:#171b24;--line:rgba(169,156,224,.3)}}',
    '*{box-sizing:border-box}',
    '.chip{display:inline-flex;align-items:center;gap:6px;cursor:pointer;border:1px solid var(--line);',
    'background:rgba(var(--rgb),.08);color:var(--c);font:700 12.5px/1 DCFid,Tahoma,sans-serif;padding:7px 12px;border-radius:999px}',
    '.chip:hover{background:rgba(var(--rgb),.14)}.chip i{font-style:normal;font-weight:400;color:var(--mute)}',
    '.card{background:linear-gradient(rgba(var(--rgb),.05),rgba(var(--rgb),.05)),var(--bg);color:var(--ink);',
    'border:1px solid var(--line);border-inline-start:4px solid var(--c);border-radius:14px;padding:18px 18px 12px;font-size:14px;line-height:1.9}',
    'h3{margin:0 0 2px;font-size:15.5px;color:var(--c)}',
    '.prov{font-size:12px;color:var(--mute);margin-bottom:12px}',
    '.word{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 6px}',
    '.word b{font-size:20px;color:var(--c)}',
    '.tag{font-size:11.5px;border:1px dashed var(--c);color:var(--c);border-radius:6px;padding:1px 7px}',
    'p{margin:6px 0}',
    '.diffs{list-style:none;padding:0;margin:4px 0 10px}.diffs li{border:1px solid var(--line);border-radius:10px;padding:8px 10px}',
    '.kind{display:inline-block;font-size:11.5px;font-weight:700;color:var(--c);border:1px solid var(--line);border-radius:6px;padding:0 6px;margin-inline-end:6px}',
    '.kind.rev{color:#b4472e;border-color:rgba(180,71,46,.4)}',
    '.say{border:0;padding:2px 0 0}.say summary{font-size:12.5px;font-weight:400;color:var(--c)}','.basis{margin:-2px 0 8px;font-size:12.5px;color:var(--mute)}',
    'details{border-top:1px solid var(--line);padding:6px 0}',
    'summary{cursor:pointer;font-weight:700;font-size:13.5px;list-style:none;padding:4px 0}',
    'summary::-webkit-details-marker{display:none}',
    "summary::before{content:'›';display:inline-block;margin-inline-end:8px;transition:transform .15s;color:var(--c)}",
    'details[open]>summary::before{transform:rotate(-90deg)}',
    'ul{margin:4px 0 6px;padding-inline-start:18px}li{margin:6px 0}',
    '.src{display:block;direction:ltr;text-align:left;font-size:12.5px;color:var(--mute);border-inline-end:2px solid var(--line);padding:2px 8px;margin-top:3px}',
    '.foot{border-top:1px solid var(--line);margin-top:6px;padding-top:10px;font-size:12px;color:var(--mute);display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}',
    '.foot code{direction:ltr;unicode-bidi:isolate;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--ink)}',
    '.foot a{color:var(--c);font-weight:700;text-decoration:none;margin-inline-start:auto}',
    '.foot a:hover{text-decoration:underline}',
    '.veil{position:fixed;inset:0;z-index:2147483646;background:rgba(10,12,20,.45);display:none;align-items:flex-end;justify-content:center}',
    '.veil.on{display:flex}',
    '.sheet{position:relative;width:100%;max-width:560px;max-height:82vh;overflow:auto;overscroll-behavior:contain;border-radius:18px 18px 0 0;animation:up .2s ease-out}',
    '.sheet .card{border-radius:18px 18px 0 0;border-inline-start-width:1px;border-top:4px solid var(--c);padding-top:22px}',
    '.x{position:absolute;top:10px;left:10px;width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:var(--bg);color:var(--mute);font:20px/1 sans-serif;cursor:pointer;z-index:1}',
    '.grab{position:absolute;top:8px;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:4px;background:var(--line)}',
    '@media (min-width:700px){.veil{align-items:center}.sheet,.sheet .card{border-radius:18px}.grab{display:none}}',
    '@keyframes up{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}'
  ].join('');

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function root(host) { var r = host.attachShadow({ mode: 'open' }); r.appendChild(el('style', null, CSS)); return r; }

  function buildCard() {
    var c = B.counts, n = B.matches.length;
    var card = el('section', { class: 'card', id: 'card' });
    card.innerHTML =
      '<h3>ارزیابی خودکار تطابق با منبع</h3>' +
      '<div class="prov">این بخش را دنت‌کست به‌صورت خودکار محاسبه کرده و بخشی از متنِ نویسنده نیست.</div>' +
      '<div class="word"><span>تطابق با منبع:</span><b>' + esc(B.word) + '</b></div>' +
      '<p class="basis">مبنای سنجش: ' + (B.provisional ? 'چکیده‌ی مقاله' : 'متن کامل مقاله') + '</p>' +
      '<p>' + (B.diffs.length
        ? fa(B.diffs.length) + ' جمله با منبع فرق دارد؛ ' + fa(n) + ' جمله همان را می‌گوید که منبع گفته.'
        : fa(n) + ' جمله همان را می‌گوید که منبع گفته؛ هیچ جمله‌ای فرق ندارد.') + '</p>' +
      (B.diffs.length ? '<ul class="diffs">' + B.diffs.map(function (d) {
        return '<li><span class="kind' + (d.rev ? ' rev' : '') + '">' + esc(d.kind) + '</span>' + esc(d.t) +
          '<details class="say"><summary>منبع چه می‌گوید</summary><span class="src">' + esc(d.s) + '</span></details></li>';
      }).join('') + '</ul>' : '') +
      '<p style="font-size:12.5px;color:var(--mute)">این ارزیابی فقط می‌پرسد جمله‌های متن همان را می‌گویند که منبع گفته یا نه؛ درباره‌ی قوت خودِ منبع چیزی نمی‌گوید.</p>' +
      (n ? '<details><summary>همه‌ی جمله‌های مطابق (' + fa(n) + ')</summary><ul>' +
        B.matches.map(function (m) { return '<li>' + esc(m.t) + '<span class="src">' + esc(m.s) + '</span></li>'; }).join('') + '</ul></details>' : '') +
      (B.silent.length ? '<details><summary>جمله‌هایی که منبع درباره‌شان چیزی نمی‌گوید (' + fa(B.silent.length) + ')</summary>' +
        '<p style="font-size:12.5px;color:var(--mute)">خطا حساب نمی‌شوند و در ارزیابی نیستند.</p><ul>' +
        B.silent.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></details>' : '') +
      (B.author.length ? '<details><summary>دیدگاه خود نویسنده (' + fa(B.author.length) + ')</summary><ul>' +
        B.author.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></details>' : '') +
      '<details><summary>نتیجه‌گیری خود منبع</summary><span class="src">' + esc(B.conclusion) + '</span>' +
        '<p style="font-size:12.5px;color:var(--mute)">' + esc(B.source.cite) + ' · <bdi>doi:' + esc(B.source.doi) + '</bdi></p></details>' +
      '<details><summary>محاسبه</summary><p>' + fa(B.assessable) + ' ادعای قابل سنجش؛ ' + fa(c.matches) + ' مطابق، ' + fa(c.altered) +
        ' متفاوت، ' + fa(c.reversed) + ' برعکس ← امتیاز ' + fa(B.score) + ' از ۱۰۰. تیترها و جمله‌های راهنما (' + fa(c.not_a_claim) + ') ادعا نیستند.</p></details>' +
      '<div class="foot"><span>کد ارزیابی <code>' + esc(B.code) + '</code></span>' +
        '<span>' + esc(B.evaluated) + ' · نسخه‌ی ' + fa(B.spec) + '</span>' +
        '<span>اثر انگشت متن <code>' + esc(B.fingerprint.slice(0, 12)) + '</code></span>' +
        '<a href="' + esc(B.verify) + '" target="_blank" rel="noopener">راستی‌آزمایی در دنت‌کست ↗</a></div>';
    return card;
  }

  function buildChip(host) {
    var r = root(host);
    host.style.display = 'inline-block';
    var b = el('button', { class: 'chip', type: 'button' },
      'تطابق با منبع: ' + esc(B.word) + ' <i>›</i>');
    var veil = null, last = null;
    function close() { veil.classList.remove('on'); document.documentElement.style.overflow = ''; if (last) last.focus(); }
    b.addEventListener('click', function () {
      if (!veil) {
        veil = el('div', { class: 'veil' });
        var sheet = el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'ارزیابی تطابق با منبع' });
        var x = el('button', { class: 'x', type: 'button', 'aria-label': 'بستن' }, '×');
        sheet.appendChild(el('span', { class: 'grab' }));
        sheet.appendChild(x); sheet.appendChild(buildCard());
        veil.appendChild(sheet); r.appendChild(veil);
        x.addEventListener('click', close);
        veil.addEventListener('click', function (e) { if (e.target === veil) close(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && veil.classList.contains('on')) close(); });
      }
      last = b;
      veil.classList.add('on');
      document.documentElement.style.overflow = 'hidden';
      veil.querySelector('.x').focus();
    });
    r.appendChild(b);
  }

  function define(name, fn) {
    if (customElements.get(name)) return;
    customElements.define(name, class extends HTMLElement { connectedCallback() { if (!this.shadowRoot) fn(this); } });
  }
  define('dentcast-fidelity-chip', buildChip);
})();
