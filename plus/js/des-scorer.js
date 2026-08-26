// ارزیاب DES — the homepage tool tab. A reader submits a paper; the FOUNDER
// scores it (no AI provider anywhere in this path — see
// .dentcast/des-scorer-handoff.md §0/RULE 7). A paper already in the library
// answers on the spot, spending no open-request slot and saying nothing
// about why it was fast (RULE 5).
//
// Markup for the tab + drawer shell is STATIC in index.html (a formal twin of
// the DES explainer box right above it), so it paints before this module
// arrives. Everything inside #dcDesToolPanel is built here, lazily, the
// first time the tab opens.
import { el, faNum } from './util.js?v=35';
import { api, currentUser, meStatus } from './api.js?v=35';
import { openLoginModal } from './login-modal.js?v=35';
import { premiumCta, unreachableGate } from './premium-cta.js?v=35';
import { sourceBlock } from './des.js?v=35';

const FROM = 'des-tool';
const TG_URL = 'https://t.me/dentcast_support';
const LIMIT = 2;

/* ── the free gate, mirrored from plus-api/src/services/des-gate.ts. This
      copy exists ONLY to give the reader live feedback while typing; the
      server re-validates independently and is the one that actually decides.
      Keep the two in agreement if either changes. ── */
const RESEARCH_SIGNALS = [
  /randomi[sz]ed|controlled trial|clinical trial|cohort|case[-\s]?control|cross[-\s]?sectional|systematic review|meta[-\s]?analys|in vitro|in vivo|double[-\s]?blind|placebo|split[-\s]?mouth|کارآزمایی|مرور نظام|فراتحلیل|هم‌?گروهی|مورد[-\s]?شاهد|مقطعی|آزمایشگاهی|دوسوکور/i,
  /\bp\s*[<=>]\s*0?[.,]\d|\bp[-\s]?value|\bn\s*=\s*\d|95\s*%|confidence interval|standard deviation|\bSD\b|\bCI\b|statistically significan|معنادار|انحراف معیار|فاصله اطمینان|سطح معنی/i,
  /\d+\s*(patients?|subjects?|teeth|tooth|specimens?|samples?|participants?|cases|volunteers?)|[\d۰-۹]+\s*(بیمار|نمونه|دندان|شرکت‌کننده|مورد|داوطلب)/i,
  /\b(background|objectives?|aims?|materials?|methods?|results?|conclusions?|discussion)\s*[:：]|(زمینه|هدف|روش‌?ها|مواد و روش|نتایج|نتیجه‌?گیری|بحث|یافته‌?ها)\s*[:：]/i,
  /\b(mean|median|prevalence|incidence|odds ratio|risk ratio|hazard ratio|survival rate|follow[-\s]?up)\b|میانگین|میانه|شیوع|نسبت شانس|پیگیری/i,
];

function fold(t) {
  return String(t || '')
    .replace(/[‌‎‏]/g, '')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[.,;:!?()[\]{}"'«»،؛؟\-–—/\\]/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}
function words(t) { return fold(t).split(' ').filter(Boolean).length; }
function hasSignal(t) { return RESEARCH_SIGNALS.some((r) => r.test(String(t || ''))); }

function clientGate({ title, body, claim, hasPdf }) {
  const issues = [];
  if (!fold(title)) issues.push(['stop', 'عنوان مقاله را بنویس — بدون آن نمی‌توانم پیدایش کنم.']);
  if (!hasPdf) {
    const n = words(body);
    if (n < 80) {
      issues.push(['stop', `متن برای ارزیابی خیلی کوتاه است (${faNum(n)} واژه). یا چکیده‌ی کامل بگذار، یا تیکِ PDF را بزن.`]);
    } else if (!hasSignal(body)) {
      issues.push(n < 300
        ? ['stop', 'این متن نشانه‌ای از یک گزارش پژوهشی ندارد — نه طرح مطالعه، نه آمار، نه تعداد نمونه.']
        : ['warn', 'نشانه‌های روش‌شناختی در این متن پیدا نشد. اگر مقاله‌ی پژوهشی نباشد نمی‌توانم بسنجمش.']);
    }
    if (n >= 80 && fold(title)) {
      const tw = fold(title).split(' ').filter((w) => w.length >= 4);
      if (tw.length >= 3) {
        const ft = fold(body);
        const seen = tw.filter((w) => ft.indexOf(w) >= 0).length;
        if (seen / tw.length < 0.34) issues.push(['warn', 'عنوان با متن هم‌خوان نیست — مطمئنی هر دو مالِ یک مقاله‌اند؟']);
      }
    }
    if (claim === 'FULL_TEXT' && n >= 80 && n <= 600) {
      issues.push(['warn', `این متن ${faNum(n)} واژه است — اندازه‌ی یک چکیده. به‌عنوان چکیده می‌سنجمش.`]);
    }
  }
  return { issues, stop: issues.some((i) => i[0] === 'stop') };
}

/* ── the reference-code alphabet, matching services/reference.ts: no 0/O,
      1/I/L, 5/S, 8/B — a human reads it aloud into Telegram. Display only;
      the real code always comes from the server. ── */
function looksLikeReference(s) { return /^D-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(s || ''); }

/**
 * Fill the panel. OPENING IS NOT THIS MODULE'S JOB.
 *
 * The inline script in index.html owns the drawer's open/close, because the
 * tab's markup is static and its toggle has to be too — a tab that paints
 * from raw HTML and then does nothing on tap, for every reader whose module
 * graph is slow, blocked or broken, is worse than no tab at all. That is not
 * hypothetical: it is exactly how this shipped the first time.
 *
 * So this module never toggles anything. It listens for the click the inline
 * script has ALREADY handled (inline runs first — it is registered at parse
 * time), reads the resulting state, and builds or notifies. Toggling here too
 * would flip the class a second time and cancel the open outright.
 */
export function initDesTool() {
  const tab = document.getElementById('dcDesToolTab');
  const drawer = document.getElementById('dcDesToolDrawer');
  const panel = document.getElementById('dcDesToolPanel');
  if (!tab || !drawer || !panel) return;

  let built = false;
  let ctl = null; // the controller returned by buildPanel(), once built

  function fill() {
    if (!built) { built = true; ctl = buildPanel(panel); }
    else if (ctl && ctl.onReopen) ctl.onReopen();
  }

  // The reader may have opened it before this module arrived — the inline
  // toggle works without us, which is the entire point of it. Catch up.
  if (drawer.classList.contains('is-open')) fill();

  tab.addEventListener('click', () => {
    if (drawer.classList.contains('is-open')) fill();
    else if (ctl && ctl.onClose) ctl.onClose();
  });

  // Escape is closed by the inline script; we only need the side effect.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.classList.contains('is-open') && ctl && ctl.onClose) {
      ctl.onClose();
    }
  });
}

/**
 * Builds the panel's permanent shell (a view-switcher) and kicks off the
 * gate check. Returns a small controller the tab wires Escape/close into.
 */
function buildPanel(panel) {
  // Claim the panel synchronously, before the async gate resolves. The inline
  // script in index.html arms a watchdog that swaps in module-free fallback
  // links if nothing takes over; this is what stands it down. Set it FIRST —
  // if it were set after the gate resolved, a slow /me would race the
  // watchdog and the reader would see the fallback flash over a working panel.
  panel.setAttribute('data-filled', '1');
  const gateHost = el('div', {});
  panel.replaceChildren(gateHost);

  const ctl = { onClose: null, onReopen: null };

  currentUser().then((user) => {
    if (!user && meStatus() === 'error') { unreachableGate(gateHost); return; }
    if (!user) { renderSignedOut(gateHost); return; }
    if (user.tier !== 'premium') { renderLocked(gateHost); return; }
    renderTool(gateHost, ctl);
  });

  return ctl;
}

function renderSignedOut(host) {
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', async () => {
    const res = await openLoginModal({ returnTo: location.pathname });
    if (res && res.user) location.reload();
  });
  host.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'برای سنجیدن مقاله‌ات وارد شو.'),
    btn,
  ]));
}

function renderLocked(host) {
  host.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'مقاله‌ی خودت را بگذار، امتیاز DES بگیر — بخشی از پریمیوم.'),
    el('p', { class: 'dcp-muted' },
      'مقاله‌ی دلخواهت را بفرست؛ با همان چارچوبی که مطالب سایت را می‌سنجد برایت بررسی می‌کنم. نتیجه در اطلاعیه‌ات می‌آید.'),
    premiumCta(FROM),
  ]));
}

/* ── the real tool, for a confirmed premium reader ── */
function renderTool(host, ctl) {
  const byline = el('div', { class: 'dc-destool-byline' }, [
    el('span', { class: 'dc-destool-av', 'aria-hidden': 'true' }, '✍️'),
    el('span', {}, [
      'ارزیابی را ', el('b', {}, 'خودم'), ' انجام می‌دهم، نه یک ربات. نتیجه در ',
      el('b', {}, 'اطلاعیه‌ات'), ' می‌آید — معمولاً کمتر از یک روز.',
    ]),
  ]);

  const views = {};
  const viewHost = el('div', {});

  function show(name) {
    Object.entries(views).forEach(([k, v]) => v.classList.toggle('is-on', k === name));
  }
  function addView(name, node) {
    node.classList.add('dc-destool-view');
    node.dataset.view = name;
    views[name] = node;
    viewHost.appendChild(node);
    return node;
  }

  /* ── compose ── */
  const qOpenEl = el('b', {}, '۰');
  const qTicks = [el('i', { class: 'dc-destool-qt' }), el('i', { class: 'dc-destool-qt' })];
  const titleInput = el('input', { type: 'text', placeholder: 'عنوان مقاله', 'aria-label': 'عنوان مقاله' });
  const pdfTick = el('input', { type: 'checkbox' });
  const pdfRow = el('label', { class: 'dc-destool-pdfrow' }, [
    pdfTick, el('span', {}, ['PDF مقاله را دارم ', el('em', {}, '— در تلگرام می‌فرستم')]),
  ]);
  const textarea = el('textarea', { placeholder: 'متن چکیده یا متن کامل مقاله را اینجا بگذار…', 'aria-label': 'متن مقاله' });
  const countEl = el('span', { class: 'dc-destool-count' }, '۰ واژه');
  const field = el('div', { class: 'dc-destool-field' }, [textarea, countEl]);
  const chipAbs = el('button', { class: 'dc-destool-chip on', type: 'button' }, 'چکیده است');
  const chipFull = el('button', { class: 'dc-destool-chip', type: 'button' }, 'متن کامل است');
  const linkInput = el('input', { type: 'text', placeholder: 'لینک مقاله را هم داری؟ (اختیاری)', 'aria-label': 'لینک مقاله یا DOI' });
  const linkAuto = el('span', { class: 'dc-destool-auto' }, 'از متن پیدا شد');
  const issuesEl = el('div', { class: 'dc-destool-issues' });
  const goBtn = el('button', { class: 'dc-destool-go', type: 'button' }, 'بفرست');

  let claim = 'ABSTRACT_ONLY';
  function setClaim(c) {
    claim = c;
    chipAbs.classList.toggle('on', c === 'ABSTRACT_ONLY');
    chipFull.classList.toggle('on', c === 'FULL_TEXT');
    refreshIssues();
  }
  chipAbs.addEventListener('click', () => setClaim('ABSTRACT_ONLY'));
  chipFull.addEventListener('click', () => setClaim('FULL_TEXT'));

  function refreshIssues() {
    const blank = !fold(titleInput.value) && !fold(textarea.value) && !pdfTick.checked;
    if (blank) { issuesEl.replaceChildren(); return; }
    const { issues } = clientGate({ title: titleInput.value, body: textarea.value, claim, hasPdf: pdfTick.checked });
    issuesEl.replaceChildren(...issues.map(([sev, msg]) => el('div', { class: `dc-destool-issue dc-destool-issue-${sev}` }, [
      el('b', {}, sev === 'stop' ? '✕' : '!'), el('span', {}, msg),
    ])));
  }

  function syncPdf() {
    const on = pdfTick.checked;
    pdfRow.classList.toggle('on', on);
    field.classList.toggle('dim', on);
    textarea.placeholder = on ? 'اختیاری — اگر متن را هم داری بگذار' : 'متن چکیده یا متن کامل مقاله را اینجا بگذار…';
    refreshIssues();
  }
  pdfTick.addEventListener('change', syncPdf);

  function sniffLink() {
    const m = textarea.value.match(/10\.\d{4,9}\/[^\s"'<>,;)\]]+/);
    const mine = linkInput.dataset.auto === '1';
    if (m && (!linkInput.value || mine)) { linkInput.value = m[0]; linkInput.dataset.auto = '1'; }
    else if (!m && mine) { linkInput.value = ''; delete linkInput.dataset.auto; }
    linkAuto.classList.toggle('on', linkInput.dataset.auto === '1');
  }
  linkInput.addEventListener('input', () => { delete linkInput.dataset.auto; linkAuto.classList.remove('on'); });
  textarea.addEventListener('input', () => {
    countEl.textContent = `${faNum(words(textarea.value))} واژه`;
    sniffLink(); refreshIssues();
  });
  titleInput.addEventListener('input', refreshIssues);

  const whisper = el('details', { class: 'dc-destool-whisper' }, [
    el('summary', {}, 'چطور ارزیابی می‌شود؟'),
    el('p', {},
      'با همان چارچوب DES که روی مطالب سایت اجرا می‌شود — طراحی مطالعه، ابزار سنجش روش، و جریمه‌های شفافیت. '
      + 'اگر فقط چکیده بدهی امتیاز مقدماتی است؛ متن کامل امتیاز قطعی‌تری می‌دهد. نتیجه برای مطالعه‌ی شخصی توست.'),
  ]);

  const compose = addView('compose', el('div', {}, [
    el('div', { class: 'dc-destool-quota' }, [
      el('span', {}, ['الان ', qOpenEl, ` از ${faNum(LIMIT)} درخواستِ باز داری`]),
      el('span', { class: 'dc-destool-quota-ticks', 'aria-hidden': 'true' }, qTicks),
    ]),
    el('div', { class: 'dc-destool-titlerow' }, titleInput),
    pdfRow,
    field,
    el('div', { class: 'dc-destool-chips' }, [el('span', {}, 'این متن:'), chipAbs, chipFull]),
    el('div', { class: 'dc-destool-linkrow' }, [linkInput, linkAuto]),
    issuesEl,
    el('div', { class: 'dc-destool-row' }, [goBtn, el('span', {})]),
    whisper,
  ]));

  /* ── queued (a receipt, not a spinner) ── */
  const qIco = el('div', { class: 'dc-destool-receipt-ico' }, '📥');
  const qHead = el('h4', {}, 'در نوبت ارزیابی');
  const qLead = el('p', {}, 'خواندمش و در صف گذاشتمش. نتیجه در اطلاعیه‌ات می‌آید.');
  const refCodeEl = el('div', { class: 'dc-destool-refcode' }, '—');
  const refNote = el('p', { class: 'dc-destool-refnote' }, 'این کد را نگه دار.');
  const tgLink = el('a', { class: 'dc-destool-tgbtn', href: TG_URL, target: '_blank', rel: 'noopener' }, 'فرستادن PDF در تلگرام ↗');
  const tgBlock = el('div', { hidden: true }, [tgLink, el('p', { class: 'dc-destool-refnote' }, 'PDF را بفرست و همین کد را زیرش بنویس تا به درخواستت وصل شود.')]);
  const queued = addView('queued', el('div', {}, [
    el('div', { class: 'dc-destool-receipt' }, [qIco, qHead, qLead, refCodeEl, refNote, tgBlock]),
    afterRow(() => resetToCompose(), () => closePanel()),
  ]));

  /* ── instant answer ── */
  const answerHost = el('div', {});
  const answer = addView('answer', el('div', {}, [
    answerHost,
    afterRow(() => resetToCompose(), () => closePanel()),
  ]));

  /* ── in-flight requests ── */
  const flightHost = el('div', { class: 'dc-destool-flight' });
  const pending = addView('pending', el('div', {}, [
    flightHost,
    afterRow(() => resetToCompose(), () => closePanel()),
  ]));

  /* ── two open ── */
  const spent = addView('spent', el('div', {}, [
    el('div', { class: 'dc-destool-spent' }, [
      el('span', { 'aria-hidden': 'true' }, '⏳'),
      el('span', {}, [
        'همزمان تا ', el('b', {}, 'دو'), ' درخواست می‌توانی باز داشته باشی. تا جواب یکی‌شان بیاید صبر کن — '
        + 'مقاله‌هایی که قبلاً سنجیده‌ام همچنان فوری جواب می‌دهند.',
      ]),
    ]),
    el('div', { class: 'dc-destool-after-row' }, [
      linkBtn('درخواست‌های باز', () => { renderFlight(currentOpen); show('pending'); }),
      linkBtn('بستن', closePanel),
    ]),
  ]));

  function afterRow(onAgain, onCloseFn) {
    return el('div', { class: 'dc-destool-after-row' }, [
      el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', onclick: onAgain }, 'مقاله‌ی دیگر'),
      linkBtn('بستن', onCloseFn),
    ]);
  }
  function linkBtn(label, fn) {
    return el('button', { class: 'dc-destool-linkbtn', type: 'button', onclick: fn }, label);
  }

  function closePanel() {
    const tab = document.getElementById('dcDesToolTab');
    const drawer = document.getElementById('dcDesToolDrawer');
    if (drawer) drawer.classList.remove('is-open');
    if (tab) tab.setAttribute('aria-expanded', 'false');
  }

  function resetToCompose() {
    titleInput.value = ''; textarea.value = ''; linkInput.value = '';
    delete linkInput.dataset.auto; linkAuto.classList.remove('on');
    pdfTick.checked = false; syncPdf();
    setClaim('ABSTRACT_ONLY');
    issuesEl.replaceChildren();
    countEl.textContent = '۰ واژه';
    show('compose');
  }

  let currentOpen = [];
  function refreshQuota() {
    qOpenEl.textContent = faNum(currentOpen.length);
    qTicks.forEach((t, i) => t.classList.toggle('on', i < currentOpen.length));
  }
  function renderFlight(open) {
    flightHost.replaceChildren(...(open.length ? open.map((r) => el('div', { class: 'dc-destool-fitem' }, [
      el('span', { class: 'dc-destool-fdot' }),
      el('div', { class: 'dc-destool-fbody' }, [
        el('div', { class: 'dc-destool-ftitle' }, r.title),
        el('div', { class: 'dc-destool-fmeta' }, ['در نوبت · ', el('code', {}, r.reference), r.has_pdf ? ' · منتظر PDF در تلگرام' : '']),
      ]),
    ])) : [el('div', { class: 'dc-destool-fitem' }, el('div', { class: 'dc-destool-fbody' }, el('div', { class: 'dc-destool-fmeta' }, 'درخواست بازی نداری.')))]));
  }

  function renderAnswer(des, hashtags) {
    answerHost.replaceChildren(el('div', { class: 'dc-destool-answer' }, [
      el('div', { class: 'dc-destool-answer-h' }, 'ارزیابیِ DES — مقاله‌ی تو'),
      el('p', { class: 'dc-destool-answer-note' }, 'این نمره را با همان چارچوبی سنجیدم که مطالب سایت را می‌سنجد.'),
      sourceBlock(des, 0, 1),
      hashtags && hashtags.length
        ? el('div', { class: 'dc-destool-tags' }, hashtags.map((t) => el('span', { class: 'dc-destool-tag' }, t)))
        : null,
    ].filter(Boolean)));
  }

  async function submit() {
    const gate = clientGate({ title: titleInput.value, body: textarea.value, claim, hasPdf: pdfTick.checked });
    if (gate.stop) {
      issuesEl.replaceChildren(...gate.issues.map(([sev, msg]) => el('div', { class: `dc-destool-issue dc-destool-issue-${sev}` }, [
        el('b', {}, sev === 'stop' ? '✕' : '!'), el('span', {}, msg),
      ])));
      (fold(titleInput.value) ? textarea : titleInput).focus();
      return;
    }
    goBtn.disabled = true;
    try {
      const res = await api.desSubmit({
        title: titleInput.value.trim(),
        body: textarea.value,
        claim,
        link: linkInput.value.trim() || null,
        has_pdf: pdfTick.checked,
      });
      if (res.answered) {
        renderAnswer(res.des, res.hashtags);
        show('answer');
        return;
      }
      const pdf = !!res.has_pdf;
      qIco.textContent = pdf ? '📎' : '📥';
      qHead.textContent = pdf ? 'کد درخواستت آماده است' : 'در نوبت ارزیابی';
      qLead.textContent = pdf
        ? 'PDF را در تلگرام بفرست و این کد را زیرش بنویس. بعدش می‌خوانمش و نتیجه در اطلاعیه‌ات می‌آید.'
        : 'خواندمش و در صف گذاشتمش. نتیجه در اطلاعیه‌ات می‌آید.';
      refCodeEl.textContent = looksLikeReference(res.reference) ? res.reference : (res.reference || '—');
      refNote.textContent = pdf ? '' : 'این کد را نگه دار.';
      tgBlock.hidden = !pdf;
      currentOpen = currentOpen.concat([{ title: titleInput.value.trim().slice(0, 70), reference: res.reference, has_pdf: pdf }]);
      refreshQuota();
      show('queued');
    } catch (err) {
      const status = err && err.status;
      if (status === 400 && err.body && err.body.issues) {
        issuesEl.replaceChildren(...err.body.issues.map((i) => el('div', { class: `dc-destool-issue dc-destool-issue-${i.severity}` }, [
          el('b', {}, i.severity === 'stop' ? '✕' : '!'), el('span', {}, i.message),
        ])));
      } else if (status === 429) {
        show('spent');
      } else {
        issuesEl.replaceChildren(el('div', { class: 'dc-destool-issue dc-destool-issue-stop' }, [
          el('b', {}, '✕'), el('span', {}, 'ارسال نشد. دوباره تلاش کن.'),
        ]));
      }
    } finally {
      goBtn.disabled = false;
    }
  }
  goBtn.addEventListener('click', submit);

  host.replaceChildren(byline, viewHost);
  show('compose');

  // Load the reader's own open requests once — if any exist, opening the tab
  // should show what is already in flight, not a blank form.
  async function loadState() {
    try {
      const st = await api.desState();
      currentOpen = st.open || [];
      refreshQuota();
      if (currentOpen.length) { renderFlight(currentOpen); show('pending'); }
    } catch (_) { /* best-effort; the form still works without it */ }
  }
  loadState();

  ctl.onClose = resetToCompose;
  ctl.onReopen = () => { if (currentOpen.length) { renderFlight(currentOpen); show('pending'); } };
}
