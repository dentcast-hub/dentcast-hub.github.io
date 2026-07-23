// DentCast site tour (guided walkthrough) — mobile homepage, phase 1.
// A spotlight overlay walks the user through the homepage: everything dims
// except the current element (a "hole" cut with a huge box-shadow), with an
// explanation card placed above/below it (whichever side has room, so the card
// and the highlighted element overlap as little as possible). Stops that live
// on the archive panel switch panels via the real bottom-nav items.
//
// Triggers:
//  1. AUTO — first login ever, account-scoped: /me `settings.tour_seen` is
//     0/absent -> offer the tour once, and PATCH it to 1 the moment the offer
//     appears, so it never auto-shows again on ANY device (the flag lives in
//     the account, not localStorage).
//  2. MANUAL — «راهنمای سایت» in the header person menu (logged-in), any time.
//     On a non-home page it navigates to /?tour=1 and starts there.
import { el, faNum } from './util.js';
import { api } from './api.js';

const SS_PENDING = 'dcp:tour:pending'; // set before navigating home to start there

// ---------------------------------------------------------------- guards ----
function isHomePage() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  return p === '/' || p === '/index' || p === '/index.html';
}
// Phase 1 is the mobile shell only; the desktop 3-column app has different
// anchors and gets its own stop map later.
function isMobileUi() {
  return !document.body.classList.contains('dc-desktop-ui');
}
export function tourMenuAvailable() {
  return isMobileUi();
}

function visible(elm) {
  return !!elm && elm.getClientRects().length > 0;
}
// The homepage ships duplicate chrome (mobile + desktop topbars); pick the
// rendered one.
function visibleOne(selector) {
  return Array.from(document.querySelectorAll(selector)).find(visible) || null;
}
function byId(id) { return document.getElementById(id); }
function track(name, params) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (_) { /* ignore */ }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------- stops ----
// `targets` returns the element(s) to spotlight (multiple -> union rect).
// A stop whose anchors are missing/invisible is skipped silently (some are
// injected async by Plus itself). `panel` is the mobile panel that must be
// active first. The final stop has no target: full dim + centered card.
const STOPS = [
  {
    key: 'header', panel: 'panel-studio', title: 'هدر دنت‌کست',
    text: 'این نوار همیشه بالای صفحه در دسترس است: لوگو شما را به خانه برمی‌گرداند، دکمه‌ی ☰ جعبه‌ابزار را باز می‌کند (نصب اپلیکیشن، مشاوره، درباره، موسیقی و مقاله‌ها) و ذره‌بین، جستجوی سراسری در همه‌ی بخش‌های دنت‌کست است.',
    targets: () => [visibleOne('.dc-topbar')],
  },
  {
    key: 'account', panel: 'panel-studio', title: 'حساب شما',
    text: 'آدمک، حسابِ شماست: پیشخوان، پروفایل و خروج از همین‌جاست و همین تور هم با گزینه‌ی «راهنمای سایت» همیشه در دسترس است. شعله‌ی کنارش استریک یادگیری شماست؛ هر روزی که بخوانید یا مرور کنید روشن می‌ماند.',
    targets: () => [visibleOne('.dcp-flame-btn'), visibleOne('.dcp-person-btn')],
  },
  {
    key: 'plus_card', panel: 'panel-studio', title: 'میز کار شخصی',
    text: 'خلاصه‌ی یادگیری شما: استریک، برگشتن به آخرین مطلبی که می‌خواندید و دسترسی به هایلایت‌ها و یادداشت‌هایتان. روی هر مقاله می‌توانید با «میز کار» هایلایت بزنید و یادداشت بگذارید — همه به حسابتان سنجاق می‌شود و روی هر دستگاهی همراهتان است.',
    targets: () => [byId('dcPlusHomeCard')],
  },
  {
    key: 'episode_hero', panel: 'panel-studio', title: 'تازه‌ترین اپیزود',
    text: 'تازه‌ترین قسمت پادکست دنت‌کست همیشه این‌جاست؛ با دکمه‌ی پخش همین‌جا بشنوید، یا با لمس کارت به صفحه‌ی همان قسمت و آرشیو کامل اپیزودها بروید.',
    targets: () => [byId('card-episodes')],
  },
  {
    key: 'pulse', panel: 'panel-studio', title: 'پالس · آخرین اخبار',
    text: 'نبض سایت: هر مطلبی که در دنت‌کست منتشر می‌شود، همین‌جا با لینک مستقیم و تاریخ انتشار اعلام می‌شود. برای این‌که هیچ انتشار تازه‌ای را از دست ندهید، هر بار سری به پالس بزنید.',
    targets: () => [byId('dcPulseCard')],
  },
  {
    key: 'latest_rail', panel: 'panel-studio', title: 'تازه‌های دنت‌کست',
    text: 'جدیدترین مطلبِ هر بخش — Insight، NoteCast، MetaNote، Chairside و بقیه — این‌جا کنار هم ردیف شده. ریل را به دو طرف بکشید و با یک لمس وارد مطلب شوید.',
    targets: () => [byId('dcLatestRail')],
  },
  {
    key: 'quick_duo', panel: 'panel-studio', title: 'پیشنهاد سریع',
    text: 'دو پیشنهاد برای شروع: واژه‌ای از دانشنامه‌ی تخصصی دنت‌کست، و یک مطلب تصادفی برای مرور — هر بار چیز تازه‌ای.',
    targets: () => [byId('dcQuickGloss'), byId('dcQuickBrain')],
  },
  {
    key: 'stats', panel: 'panel-studio', title: 'آمار دنت‌کست',
    text: 'کارنامه‌ی دنت‌کست در یک نگاه: سال‌های فعالیت، ساعت‌های محتوای صوتی و تعداد مطلب‌ها و مدخل‌های آموزشی.',
    targets: () => [visibleOne('.hero-stats')],
  },
  {
    key: 'bottom_nav', panel: 'panel-studio', title: 'ناوبری اصلی',
    text: '«خانه» همین صفحه است، «آرشیو» درگاه همه‌ی بخش‌ها و مرجع‌های دنت‌کست است و «بیماران» صفحه‌ی ویژه‌ی مراجعان و غیردندانپزشکان (معرفی کلینیک و مطالب آموزشی ساده). حالا برویم سراغ آرشیو.',
    targets: () => [byId('dcBottomNav')],
  },
  {
    key: 'radar', panel: 'panel-sharehub', title: 'رادار دنت‌کست',
    text: 'موتور جستجوی تخصصی دندانپزشکی: به‌جای گوگل، فقط در سایت‌های معتبر دندانپزشکی جستجو می‌کند و نتیجه‌ی تمیزتر و تخصصی‌تری می‌دهد.',
    targets: () => [byId('btnOpenRadarMob')],
  },
  {
    key: 'episodes_card', panel: 'panel-sharehub', title: 'آرشیو پادکست',
    text: 'همه‌ی اپیزودهای اصلی و فرعی دنت‌کست، یک‌جا و مرتب — از قسمت یک تا امروز.',
    targets: () => [document.querySelector('#panel-sharehub .dc-list-card[onclick*="episodes"]')],
  },
  {
    key: 'references', panel: 'panel-sharehub', title: 'مرجع‌های دنت‌کست',
    text: '«فهرست موضوعی» نقشه‌ی موضوعی همه‌ی محتواست تا هر موضوع را از پایه تا پیشرفته یک‌جا دنبال کنید، و «دانشنامه» مفاهیم تصمیم‌سازِ دندانپزشکی را کوتاه و دقیق توضیح می‌دهد.',
    targets: () => [byId('card-pillar'), byId('card-glossary')],
  },
  {
    key: 'originals', panel: 'panel-sharehub', title: 'تولید اختصاصی دنت‌کست',
    text: 'محتوای اورجینال دنت‌کست: Clinical Insight (بینش‌های کلینیکی)، Chairside (نکته‌هایی از ویزیت‌های روزانه)، Meta Note (ایده‌ها و مدل‌های تحلیلی) و DentCast+ (آموزش ویدیویی).',
    targets: () => [
      document.querySelector('#panel-sharehub .dc-list-card--insight'),
      document.querySelector('#panel-sharehub .dc-list-card--chairside'),
      document.querySelector('#panel-sharehub .dc-list-card--meta'),
      document.querySelector('#panel-sharehub .dc-list-card--plus'),
    ],
  },
  {
    key: 'sources', panel: 'panel-sharehub', title: 'مرور منابع علمی',
    text: 'بخش‌های مبتنی بر مقالات علمی: NoteCast خلاصه‌نویسی اپیزودها از مقالات است، DentAI مرور مطالب با هوش مصنوعی و Share Hub مطالب منتخب با ذکر منبع.',
    targets: () => [
      document.querySelector('#panel-sharehub .dc-list-card[onclick*="notecast"]'),
      document.querySelector('#panel-sharehub .dc-grid'),
    ],
  },
  {
    key: 'monitor', panel: 'panel-sharehub', title: 'تازه‌ترین مطالب',
    text: 'فهرست زنده‌ی آخرین انتشارهای همه‌ی بخش‌ها؛ داخل همین باکس اسکرول کنید تا موارد بیشتری ببینید.',
    targets: () => [document.querySelector('#panel-sharehub .dc-monitor-secondary')],
  },
  {
    key: 'finale', panel: 'panel-studio', title: 'تمام شد!',
    text: 'حالا نقشه‌ی دنت‌کست دستتان است. هر وقت خواستید این تور را دوباره ببینید، روی آدمکِ هدر بزنید و «راهنمای سایت» را انتخاب کنید. یادگیری خوبی داشته باشید 🦷',
    targets: null,
  },
];

// ---------------------------------------------------------------- engine ----
let state = null; // { seq, idx, els, layer, hole, card, onKey, onResize }

function unionRect(els) {
  let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity;
  els.forEach((e) => {
    const x = e.getBoundingClientRect();
    t = Math.min(t, x.top); l = Math.min(l, x.left);
    r = Math.max(r, x.right); b = Math.max(b, x.bottom);
  });
  return { top: t, left: l, right: r, bottom: b, width: r - l, height: b - t };
}

// Scroll #mobile-body so the (in-flow) targets sit in the free band between
// the sticky header and the fixed bottom nav. Fixed/sticky targets (header,
// bottom nav) never need this. Returns the scrolled container (or null).
function scrollTargets(els) {
  const mb = byId('mobile-body');
  if (!mb) return null;
  const inBody = els.filter((e) => mb.contains(e));
  if (!inBody.length) return null;
  const u = unionRect(inBody);
  const bandTop = 82, bandBottom = window.innerHeight - 88;
  if (u.top >= bandTop && u.bottom <= bandBottom) return null;
  const slack = Math.max(0, (bandBottom - bandTop - u.height) / 3);
  const top = Math.max(0, mb.scrollTop + (u.top - bandTop - slack));
  mb.scrollTo({ top, behavior: 'smooth' });
  return mb;
}

// Real phones take an unpredictable time to finish a smooth scroll (a fixed
// delay measured mid-scroll and left the spotlight offset from its target).
// Resolve once scrollTop has been still for ~8 frames, capped at 1.5s.
function waitScrollSettle(container, timeout = 1500) {
  return new Promise((resolve) => {
    let last = container.scrollTop, still = 0;
    const t0 = (window.performance || Date).now();
    (function tick() {
      requestAnimationFrame(() => {
        const now = container.scrollTop;
        if (now === last) still += 1; else { still = 0; last = now; }
        if (still >= 8 || (window.performance || Date).now() - t0 > timeout) resolve();
        else tick();
      });
    })();
  });
}

function positionHole(hole, rect) {
  if (!rect) { // finale: zero-size hole in the center -> full dim
    hole.classList.add('is-empty');
    hole.style.top = (window.innerHeight / 2) + 'px';
    hole.style.left = (window.innerWidth / 2) + 'px';
    hole.style.width = '0px';
    hole.style.height = '0px';
    return;
  }
  hole.classList.remove('is-empty');
  const pad = 6;
  const top = Math.max(4, rect.top - pad);
  const left = Math.max(4, rect.left - pad);
  const right = Math.min(window.innerWidth - 4, rect.right + pad);
  const bottom = Math.min(window.innerHeight - 4, rect.bottom + pad);
  hole.style.top = top + 'px';
  hole.style.left = left + 'px';
  hole.style.width = Math.max(0, right - left) + 'px';
  hole.style.height = Math.max(0, bottom - top) + 'px';
}

// Below the hole when there is room (or more room than above), else above;
// centered horizontally and clamped to the viewport -> minimal overlap with
// the highlighted element.
function placeCard(card, rect) {
  const vw = window.innerWidth, vh = window.innerHeight;
  card.style.visibility = 'hidden';
  card.style.top = '0px';
  card.style.left = '0px';
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let top;
  if (!rect) {
    top = Math.max(12, (vh - ch) / 2);
  } else {
    const below = vh - rect.bottom - 16;
    const above = rect.top - 16;
    if (below >= ch + 8 || below >= above) top = Math.min(vh - ch - 12, rect.bottom + 14);
    else top = Math.max(12, rect.top - ch - 14);
  }
  const left = Math.min(Math.max(10, (vw - cw) / 2), Math.max(10, vw - cw - 10));
  card.style.top = top + 'px';
  card.style.left = left + 'px';
  card.style.visibility = '';
}

// Recompute the union rect and (re)place hole + card. Content is untouched, so
// this is safe to call repeatedly (resize, drift watcher).
function positionStop() {
  const st = state; if (!st) return;
  // Async widgets (e.g. the Plus home card) can re-render and replace a
  // spotlighted node after we grabbed it — refetch from the stop definition.
  if (st.els.some((e) => !e.isConnected)) {
    const stop = STOPS[st.idx];
    st.els = stop.targets ? stop.targets().filter(visible) : [];
  }
  const rect = st.els.length ? unionRect(st.els) : null;
  positionHole(st.hole, rect);
  placeCard(st.card, rect);
  st.lastRect = rect;
}

// Late layout shifts (async-injected cards, web fonts, viewport chrome) move
// the page under a displayed stop. Watch for drift and follow the target.
function driftCheck() {
  const st = state; if (!st || !st.els.length) return;
  if (st.els.some((e) => !e.isConnected)) { positionStop(); return; }
  const r = unionRect(st.els), o = st.lastRect;
  if (!o || Math.abs(r.top - o.top) > 2 || Math.abs(r.left - o.left) > 2
    || Math.abs(r.height - o.height) > 2 || Math.abs(r.width - o.width) > 2) {
    positionStop();
  }
}

function renderStop(stop, idx) {
  const st = state; if (!st) return;
  const last = idx === STOPS.length - 1;

  st.card.textContent = '';
  st.card.appendChild(el('p', { class: 'dcp-tour-kicker' }, 'راهنمای دنت‌کست'));
  st.card.appendChild(el('h3', { class: 'dcp-tour-title' }, stop.title));
  st.card.appendChild(el('p', { class: 'dcp-tour-text' }, stop.text));
  const next = el('button', { class: 'dcp-btn dcp-btn-primary dcp-tour-next', type: 'button' }, last ? 'تمام' : 'بعدی');
  next.addEventListener('click', () => showStop(idx + 1));
  const foot = [next];
  if (!last) {
    const quit = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'تمام');
    quit.addEventListener('click', () => endTour(false));
    foot.push(quit);
  }
  foot.push(el('span', { class: 'dcp-tour-progress' }, faNum(idx + 1) + ' از ' + faNum(STOPS.length)));
  st.card.appendChild(el('div', { class: 'dcp-tour-foot' }, foot));
  positionStop();
}

async function showStop(idx) {
  const st = state; if (!st) return;
  if (idx >= STOPS.length) { endTour(true); return; }
  const seq = ++st.seq;
  const stop = STOPS[idx];
  st.idx = idx;

  // Bring the right panel up via the real bottom-nav item (keeps nav state and
  // animation consistent), then wait out the panel transition.
  const active = document.querySelector('.dc-panel.active');
  if (stop.panel && (!active || active.id !== stop.panel)) {
    const bn = document.querySelector('.dc-bn-item[data-panel="' + stop.panel + '"]');
    if (bn) bn.click();
    await wait(430);
    if (!state || state.seq !== seq) return;
  }

  const els = stop.targets ? stop.targets().filter(visible) : [];
  if (stop.targets && !els.length) { showStop(idx + 1); return; } // anchor missing -> skip
  const scrolled = els.length ? scrollTargets(els) : null;
  if (scrolled) {
    await waitScrollSettle(scrolled);
    if (!state || state.seq !== seq) return;
  }
  st.els = els;
  renderStop(stop, idx);
  track('tour_step', { step: idx + 1, key: stop.key });
}

function endTour(completed) {
  const st = state; if (!st) return;
  state = null;
  clearInterval(st.watch);
  document.removeEventListener('keydown', st.onKey);
  window.removeEventListener('resize', st.onResize);
  document.documentElement.classList.remove('dcp-touring');
  st.layer.remove();
  track(completed ? 'tour_finish' : 'tour_skip', { step: st.idx + 1 });
  // Land the user back on the home panel.
  const active = document.querySelector('.dc-panel.active');
  if (active && active.id !== 'panel-studio') {
    const bn = document.querySelector('.dc-bn-item[data-panel="panel-studio"]');
    if (bn) bn.click();
  }
}

export function startTour({ manual = false } = {}) {
  if (state) endTour(false); // restart cleanly instead of silently ignoring
  if (!isHomePage()) {
    // The anchors only exist on the homepage: jump there and auto-start.
    try { sessionStorage.setItem(SS_PENDING, '1'); } catch (_) { /* ignore */ }
    location.href = '/?tour=1';
    return;
  }
  if (!isMobileUi()) return; // phase 1: mobile shell only

  // The guest welcome box and the tour must never stack (the welcome overlay
  // would sit dimmed in front of the spotlighted element).
  document.querySelectorAll('.dcp-welcome-overlay').forEach((n) => n.remove());
  document.querySelectorAll('.dcp-person-attention').forEach((n) => n.classList.remove('dcp-person-attention'));

  const hole = el('div', { class: 'dcp-tour-hole' });
  const card = el('div', { class: 'dcp-tour-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'راهنمای دنت‌کست' });
  const layer = el('div', { class: 'dcp-tour-layer' }, [hole, card]);
  const onKey = (e) => { if (e.key === 'Escape') endTour(false); };
  let resizeT = null;
  const onResize = () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(positionStop, 150);
  };
  state = { seq: 0, idx: 0, els: [], lastRect: null, layer, hole, card, onKey, onResize };
  state.watch = setInterval(driftCheck, 400);
  document.body.appendChild(layer);
  document.documentElement.classList.add('dcp-touring');
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  track('tour_start', { manual: manual ? 1 : 0 });
  showStop(0);
}

// ----------------------------------------------------- first-login offer ----
// Account-scoped once-ever: `settings.tour_seen` 0/absent -> show the invite
// and flip it to 1 IMMEDIATELY (whether they take the tour or tap «بعداً»),
// so it never auto-shows again on any device. The manual menu entry stays.
export function maybeOfferTour(user) {
  if (!isHomePage() || !isMobileUi()) return;
  const settings = (user && user.settings) || {};
  if (settings.tour_seen) return;
  api.updateMe({ settings: { tour_seen: 1 } }).catch(() => { /* retry next visit */ });

  let overlay = null;
  const cleanup = () => {
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };

  const go = el('button', { class: 'dcp-btn dcp-btn-primary dcp-welcome-cta', type: 'button' }, 'شروع تور');
  go.addEventListener('click', () => { cleanup(); startTour({ manual: false }); });
  const later = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-welcome-close', type: 'button' }, 'بعداً');
  later.addEventListener('click', cleanup);

  const box = el('div', {
    class: 'dcp-welcome-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'راهنمای دنت‌کست',
  }, [
    el('div', { class: 'dcp-welcome-ico', 'aria-hidden': 'true' }, '🧭'),
    el('h2', { class: 'dcp-welcome-title' }, 'با دنت‌کست آشنا شو'),
    el('p', { class: 'dcp-welcome-lead' },
      'خوش آمدید! یک تور کوتاه، قدم‌به‌قدم نشانتان می‌دهد هر بخش سایت کجاست و به چه دردی می‌خورد — از پالس و اپیزودها تا آرشیو و میز کار شخصی‌تان.'),
    el('p', { class: 'dcp-tour-offer-hint' },
      'هر وقت هم که بخواهید، از منوی آدمکِ هدر گزینه‌ی «راهنمای سایت» همین تور را دوباره اجرا می‌کند.'),
    go,
  ]);
  overlay = el('div', {
    class: 'dcp-welcome-overlay dcp-tour-offer',
    onclick: (e) => { if (e.target === overlay) cleanup(); },
  }, [el('div', { class: 'dcp-welcome-wrap' }, [box, later])]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onKey);
  track('tour_offer', {});
}

// ------------------------------------------------------------- autostart ----
// Handles the /?tour=1 handoff (manual start requested from a non-home page)
// on homepage load. Small delay so the Plus header/home card have a chance to
// render before the tour measures them. Idempotent (guarded by a module flag)
// because it is invoked from BOTH plus.js boot and initHeader — the header
// path guarantees the handoff works even when a cached plus.js entry predates
// this feature (its module graph still pulls the fresh header.js + tour.js).
let autostartDone = false;
export function initTourAutostart() {
  if (autostartDone) return;
  autostartDone = true;
  let pending = false;
  try {
    pending = sessionStorage.getItem(SS_PENDING) === '1';
    if (pending) sessionStorage.removeItem(SS_PENDING);
  } catch (_) { /* ignore */ }
  if (!pending) pending = /[?&]tour=1(&|$)/.test(location.search);
  if (!pending || !isHomePage() || !isMobileUi()) return;
  try { if (history.replaceState) history.replaceState(null, '', location.pathname); } catch (_) { /* ignore */ }
  setTimeout(() => startTour({ manual: true }), 700);
}
