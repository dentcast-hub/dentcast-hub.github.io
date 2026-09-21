// The «پریمیوم» tab — the fourth bottom-nav destination on the homepage.
//
// ONE PANEL, TWO STATES, the same call `pillar` and `up-board` make with their
// two arrangements of one URL. For a guest or a free reader it is the catalog of
// everything a subscription buys, every card locked, ONE buy link for the whole
// page (six buy buttons is what makes a page look like an advert — the rail's
// rule, kept). For a subscriber the same cards go LIVE with their own state and
// the buy link is gone: their header link is the dashboard, because selling a
// subscription to its owner is worse than saying nothing.
//
// THE SUBSCRIBER'S STATE IS A HOME, NOT A CATALOG (approved mockup
// .dentcast/premium-tab-live-mockup.html, founder 1405/06/31). The locked
// page's grammar — seventeen equal amber cards with one repeated chip — is right
// for a shop window and wrong for its owner: amber means «what a subscription
// buys» and this reader has bought it, and seventeen cards of equal weight give
// the eye nowhere to stop. So a subscriber gets the app-home pattern instead:
// ONE primary «ادامه بده» card (the active pathway; failing that today's cards;
// failing that the دفترچه), three today numbers that are each a door, four
// quick actions, and the rest as inset grouped lists — one surface per group,
// hairlines between rows, tinted from the site's own palette (brand blue,
// certificate green, DES violet, teal). Amber survives in exactly one place,
// the «اشتراک فعال» pill. No «باز کردن» chip anywhere: a row with a state says
// it (blue when something waits), a row without one carries only a chevron.
//
// WHAT THE TAB IS NOT. It is not the dashboard: پیشخوان is the reader's OWN
// material (recent highlights, streak, league, notices); this is the list of
// tools with their state. And it is not a page: it is a `.dc-panel` inside
// index.html like the three tabs beside it, so switching is instant, swipe
// reaches it, and the desktop shell gets a column-C surface the way آرشیو did.
//
// THREE ANSWERS FROM /me, NEVER TWO. `currentUser()` flattens «signed out» and
// «could not ask» to null, and reading both as «not premium» is the bug
// `premium-cta.js`'s `unreachableCard` exists for: during a redeploy every
// paying reader would be shown a page of locks and a buy button. So the module
// reads `meStatus()` too — 'error' draws the catalog with NO locks and NO
// offer, and says why in one muted line.
//
// THE HOMEPAGE PAYS NOTHING FOR A TAB NOBODY OPENED. The mobile panel is
// display:none until tapped, so the two count requests a subscriber's live
// chips need (highlight total, collection count) wait behind an
// IntersectionObserver — the pattern article-threads.js uses. Everything /me already carries (active pathway, due
// cards, the report month) is painted at render for free.
import { el, faNum, streakIsActiveToday } from './util.js?v=125';
import { currentUser, meStatus, api } from './api.js?v=125';
import { pricingHref } from './premium-cta.js?v=125';
import { openLoginModal } from './login-modal.js?v=125';
import { currentMonthKey, shiftMonth, monthName } from './jalali-month.js?v=125';
import { PREMIUM_GROUPS, PREMIUM_ENTRIES } from './premium-catalog.js?v=125';

// The two slots index.html carries — one per homepage layout — same shape as
// home-features.js's SLOT_IDS. Both are filled; only the displayed one shows.
export const SLOT_IDS = ['dcPremiumPanel', 'dcdPremiumPanel'];

/** Where the buy link says it came from, so pricing.html can report it. */
export const FROM = 'premium-tab';

function icon(path) {
  const s = el('span', { class: 'dcp-hf-ico', 'aria-hidden': 'true' });
  s.innerHTML = '<svg viewBox="0 0 24 24">' + path + '</svg>'; // static, trusted markup
  return s;
}

function stateChip(text, live) {
  return el('span', { class: 'dcp-hf-state' + (live ? ' is-live' : '') }, text);
}

/**
 * The lead sentence under the title. It says what the tab IS before anything
 * about money (the up-board gate-card argument), and for a subscriber it
 * points at the one thing that is NOT here — their own material.
 */
const JALALI_DAY = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric', month: 'long', timeZone: 'Asia/Tehran',
});

function lead(state, me) {
  if (state === 'live') {
    // The subscription's end, when there is one to name: a league-prize week
    // and a founder account carry no expiry, and the sentence then simply
    // starts at the second clause (profile.js makes the same distinction).
    const sub = me && me.subscription;
    let until = '';
    if (sub && sub.expires_at) {
      try { until = 'اشتراک شما تا پایان روز ' + JALALI_DAY.format(new Date(sub.expires_at)) + ' فعال است.'; }
      catch (_) { until = ''; }
    }
    return until || 'همه‌ی امکانات اشتراک شما، یک‌جا.';
  }
  if (state === 'unknown') return 'ارتباط با سرور برقرار نشد؛ وضعیت حساب شما مشخص نیست.';
  return 'همه‌ی امکاناتی که با اشتراک باز می‌شود، یک‌جا.';
}

/** The ONE buy link on the page (locked state only). */
function offer() {
  return el('a', { class: 'dcp-pp-offer', href: pricingHref(FROM) }, [
    icon('<path d="M3 8l4.5 3L12 5l4.5 6L21 8l-1.8 9H4.8L3 8z"/><path d="M4.8 20h14.4"/>'),
    el('span', { class: 'dcp-pp-offer-main' }, [
      el('b', {}, 'اشتراک پریمیوم'),
      el('span', {}, 'یک‌ماهه، سه‌ماهه و شش‌ماهه'),
    ]),
    el('span', { class: 'dcp-pp-offer-go' }, 'دیدن پلان‌ها ›'),
  ]);
}

/**
 * The quieter line under the offer for a SIGNED-OUT visitor: they may already
 * be a subscriber logged out on this device (the 401/402 split every gate on
 * the site keeps), so sign-in is offered before anything is sold twice.
 */
function guestLine() {
  const a = el('a', { class: 'dcp-pp-signin', href: '#' }, 'وارد شوید');
  a.addEventListener('click', (e) => {
    e.preventDefault();
    openLoginModal({ returnTo: location.pathname + location.hash });
  });
  return el('p', { class: 'dcp-muted dcp-pp-guest' }, ['اگر اشتراک دارید، ', a, '.']);
}

function card(entry, state) {
  const tag = entry.href ? 'a' : 'div';
  const attrs = { class: 'dc-list-card dcp-hf-card' + (entry.href ? '' : ' is-static'), 'data-dcp-key': entry.key };
  if (entry.href) attrs.href = entry.href;
  const chip = state === 'locked' ? stateChip('🔒', false)
    : state === 'live' ? stateChip('باز کردن', true)
    : null;
  const node = el(tag, attrs, [
    icon(entry.ico),
    el('div', { class: 'dc-list-card-main' }, [
      el('div', { class: 'dc-list-card-title' }, entry.title),
      el('div', { class: 'dc-list-card-sub' }, entry.sub),
    ]),
    chip,
  ].filter(Boolean));
  // Kept for the rail's painter vocabulary: a feature is addressed by its
  // canonical title, so a test (or a future shared painter) finds it the same
  // way on both surfaces.
  if (entry.feature) node.dataset.dcpFeature = entry.feature.title;
  return node;
}

function group(g, state) {
  const h = el('h2', { class: 'dcp-hf-label' }, [g.title, el('small', {}, g.sub)]);
  return el('section', { class: 'dcp-pp-group', 'data-dcp-group': g.key }, [
    el('div', { class: 'dcp-hf-sec' }, [h]),
    ...g.entries.filter((e) => !(state === 'live' && e.hideWhenLive)).map((e) => card(e, state)),
  ]);
}

/** 'live' | 'locked' | 'unknown' — the three answers, never two. */
export function stateOf(me) {
  if (me && me.tier === 'premium') return 'live';
  if (!me && meStatus() === 'error') return 'unknown';
  return 'locked';
}

/* ----------------------------------------------------- the live state -- */

const TINT = { reading: 'blue', path: 'green', tools: 'violet', together: 'teal' };
const byKey = (key) => PREMIUM_ENTRIES.find((e) => e.key === key);

/** «اشتراک فعال · تا ۲۴ آبان» — the one amber mark on a subscriber's page. */
function statusLine(me) {
  const sub = me && me.subscription;
  let until = '';
  if (sub && sub.expires_at) {
    try { until = 'تا ' + JALALI_DAY.format(new Date(sub.expires_at)); } catch (_) { until = ''; }
  }
  return el('div', { class: 'dcp-pp-status' }, [
    el('span', { class: 'dcp-pp-pill' }, 'اشتراک فعال'),
    until ? el('span', {}, until) : null,
  ].filter(Boolean));
}

/**
 * The ONE primary card: what is half-done. The active pathway when there is
 * one in progress; failing that, today's due cards; failing that, the
 * دفترچه. A finished pathway is not «continue» — it falls through.
 */
function hero(me) {
  const p = me.active_pathway;
  const due = me.due_card_count || 0;
  let href; let kicker; let title; let meta; let cta; let pct = -1; let glyph;
  if (p && !p.is_complete && p.id) {
    href = '/plus/pathway.html?id=' + encodeURIComponent(p.id);
    title = p.title_fa || 'مسیر یادگیری';
    glyph = '🧭';
    if (!(p.current_step > 0)) {
      // Enrolled, nothing read yet: «continue from where you were» is a
      // sentence about a place that does not exist (founder's screenshot,
      // 1405/06/31 — «قدم ۰ از ۹۷ · از همان‌جایی که بودی»).
      kicker = 'شروع کن'; meta = 'هنوز شروع نشده'; cta = 'شروع مسیر ›'; pct = 0;
    } else {
      kicker = 'ادامه بده';
      meta = 'قدم ' + faNum(p.current_step) + ' از ' + faNum(p.total_steps);
      cta = 'ادامهٔ مسیر ›';
      pct = p.total_steps ? Math.max(3, Math.min(100, Math.round((p.current_step / p.total_steps) * 100))) : 0;
    }
  } else if (due > 0) {
    href = '/plus/cards.html'; kicker = 'برای امروز';
    title = faNum(due) + ' کارت برای مرور';
    meta = 'مرور فاصله‌دار هایلایت‌ها، پیش از فراموشی';
    cta = 'شروع مرور ›'; glyph = '🗂';
  } else {
    href = '/plus/highlights.html'; kicker = 'ادامه بده';
    title = 'دفترچه‌ی هایلایت‌ها';
    meta = 'آخرین هایلایت‌هایت را مرور کن';
    cta = 'باز کردن ›'; glyph = '📒';
  }
  // The big faint glyph in the corner is the mockup's emoji, not the row
  // icon: a 5rem outline stroke reads as a scribble, the emoji reads as a
  // compass (founder, 1405/06/31 — «اون قشنگ بود»).
  const g = el('span', { class: 'dcp-pp-hero-glyph', 'aria-hidden': 'true' }, glyph);
  return el('a', { class: 'dcp-pp-hero', href, 'data-dcp-hero': pct >= 0 ? 'pathway' : (due > 0 ? 'cards' : 'highlights') }, [
    g,
    el('div', { class: 'dcp-pp-hero-k' }, kicker),
    el('div', { class: 'dcp-pp-hero-t' }, title),
    el('div', { class: 'dcp-pp-hero-m' }, meta),
    pct >= 0 ? el('div', { class: 'dcp-pp-hero-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, [
      el('i', { style: 'width:' + pct + '%' }),
    ]) : null,
    el('div', { class: 'dcp-pp-hero-row' }, [
      el('span', { class: 'dcp-pp-hero-m' }, pct > 0 ? 'از همان‌جایی که بودی' : ''),
      el('span', { class: 'dcp-pp-hero-cta' }, cta),
    ]),
  ].filter(Boolean));
}

/**
 * The three today numbers, each a door: today's cards and the streak come
 * free with /me, the highlight total is painted when its request answers
 * (see fillLazily). `data-dcp-mine` keeps the painter's vocabulary.
 */
function today(me) {
  const tile = (key, href, value, label, go, quiet) => el('a', { class: 'dcp-pp-today-tile', href, 'data-dcp-mine': key }, [
    el('b', { class: 'num' }, value),
    el('span', {}, label),
    el('span', { class: 'dcp-pp-go' + (quiet ? ' is-quiet' : '') }, go),
  ]);
  const kept = streakIsActiveToday(me.last_active_day);
  return el('div', { class: 'dcp-pp-today' }, [
    tile('cards', '/plus/cards.html', faNum(me.due_card_count || 0), 'کارت امروز', 'مرور ›'),
    tile('streak', '/plus/profile.html', [faNum(me.current_streak || 0) + ' ', el('em', {}, 'روز')], '🔥 استریک',
      kept ? 'حفظ شده' : 'امروز هنوز نه', true),
    tile('highlights', '/plus/highlights.html', '–', 'هایلایت', 'دفترچه ›'),
  ]);
}

/** Four quick actions — the tools a subscriber opens most. */
function quick() {
  const tiles = [
    ['highlights', 'دفترچه', 'blue'], ['pathways', 'مسیرها', 'green'],
    ['assistant', 'دستیار کیس', 'violet'], ['collections', 'کالکشن‌ها', 'teal'],
  ];
  return el('div', { class: 'dcp-pp-quick' }, tiles.map(([key, label, tint]) => {
    const e = byKey(key);
    const d = el('span', { class: 'dcp-pp-quick-d is-' + tint, 'aria-hidden': 'true' });
    d.innerHTML = '<svg viewBox="0 0 24 24">' + e.ico + '</svg>'; // static, trusted markup
    return el('a', { class: 'dcp-pp-quick-a', href: e.href, 'data-dcp-quick': key }, [d, el('span', {}, label)]);
  }));
}

/** One row of an inset grouped list. */
function liveRow(entry, me) {
  const tag = entry.href ? 'a' : 'div';
  const attrs = { class: 'dcp-pp-row' + (entry.href ? '' : ' is-static'), 'data-dcp-key': entry.key };
  if (entry.href) attrs.href = entry.href;
  const ico = el('span', { class: 'dcp-pp-ico' + (entry.key === 'upboard' ? ' is-heart' : ''), 'aria-hidden': 'true' });
  ico.innerHTML = '<svg viewBox="0 0 24 24">' + entry.ico + '</svg>'; // static, trusted markup
  let text = ''; let cls = '';
  if (entry.key === 'no-ads') { text = '✓ فعال'; cls = ' is-ok'; }
  if (entry.key === 'sms') {
    const nc = me && me.settings && me.settings.notify_channels;
    text = nc && nc.sms && nc.sms.streak ? 'روشن' : 'خاموش';
  }
  const st = el('span', { class: 'dcp-pp-st' + cls }, [
    el('span', { class: 'dcp-pp-st-text' }, text),
    entry.href ? el('span', { class: 'dcp-pp-chev', 'aria-hidden': 'true' }, '›') : null,
  ].filter(Boolean));
  const node = el(tag, attrs, [
    ico,
    el('div', { class: 'dcp-pp-row-main' }, [
      el('div', { class: 'dcp-pp-row-t' }, entry.title),
      el('div', { class: 'dcp-pp-row-s' }, entry.sub),
    ]),
    st,
  ]);
  if (entry.feature) node.dataset.dcpFeature = entry.feature.title;
  return node;
}

function liveGroup(g, me) {
  const rows = g.entries.filter((e) => !e.hideWhenLive);
  return el('section', { class: 'dcp-pp-group is-live g-' + (TINT[g.key] || 'blue'), 'data-dcp-group': g.key }, [
    el('div', { class: 'dcp-pp-gh' }, [
      el('h2', {}, [el('i', { 'aria-hidden': 'true' }), g.title]),
      el('small', {}, faNum(rows.length) + ' ابزار'),
    ]),
    el('div', { class: 'dcp-pp-inset' }, rows.map((e) => liveRow(e, me))),
  ]);
}

/** The dashboard link, the header's own right-hand slot when the page has one. */
function dashboardLink() {
  return el('a', { class: 'dcp-hf-more dcp-pp-dash', href: '/plus/' }, 'پیشخوان ›');
}

function build(me, { hasHead = false } = {}) {
  const state = stateOf(me);
  const anon = !me && state === 'locked';
  const live = state === 'live';
  const top = el('div', { class: 'dcp-pp-top' }, [
    live ? statusLine(me) : el('p', { class: 'dcp-pp-lead' }, lead(state, me)),
    // Without a page head to sit in (a bare slot), the link keeps its old place.
    live && !hasHead ? dashboardLink() : null,
  ].filter(Boolean));
  const wrap = el('div', { class: 'dcp-hf dcp-pp', 'data-dcp-state': state }, [
    top,
    state === 'locked' ? offer() : null,
    anon ? guestLine() : null,
    live ? hero(me) : null,
    live ? today(me) : null,
    live ? quick() : null,
    ...PREMIUM_GROUPS.map((g) => (live ? liveGroup(g, me) : group(g, state))),
  ].filter(Boolean));
  return wrap;
}

/**
 * The panel's own title row (index.html's `.dc-exa-pagehead`, the archive's
 * shape), when the slot sits under one: «پیشخوان ›» goes beside the title, as
 * the approved mockup draws it. Idempotent — a re-render adds no second link.
 */
function pageHeadOf(slot) {
  const host = slot.closest('#panel-premium, #dcd-premium');
  return host ? host.querySelector('.dc-exa-pagehead') : null;
}
function placeDashboardLink(head, state) {
  const old = head.querySelector('.dcp-pp-dash');
  if (old) old.remove();
  if (state === 'live') head.appendChild(dashboardLink());
}

/* ------------------------------------------------------------ live state -- */

/** Write one card's chip into every rendered copy of the panel. */
function paint(key, text, { live = false } = {}) {
  document.querySelectorAll('.dcp-pp [data-dcp-key="' + key + '"] .dcp-pp-st')
    .forEach((n) => {
      const t = n.querySelector('.dcp-pp-st-text');
      if (t) t.textContent = text;
      n.classList.toggle('is-live', live);
    });
}

/** Everything /me already carries — free, painted at render. */
function fillFromMe(me) {
  const p = me.active_pathway;
  if (p) {
    paint('pathways', p.is_complete
      ? 'کامل شد'
      : 'قدم ' + faNum(p.current_step) + ' از ' + faNum(p.total_steps), { live: !p.is_complete });
  }
  if (me.due_card_count > 0) paint('cards', faNum(me.due_card_count) + ' کارت', { live: true });
  // The last completed month is a calendar fact from ICU, not a request.
  paint('report', monthName(shiftMonth(currentMonthKey(), -1)) + ' آماده', { live: true });
}

/** The two counts that cost a request each — fired once the panel is seen. */
function fillLazily() {
  api.recentHighlights(1)
    .then((d) => {
      if (!d || !d.total) return;
      paint('highlights', faNum(d.total));
      document.querySelectorAll('.dcp-pp [data-dcp-mine="highlights"] b')
        .forEach((n) => { n.textContent = faNum(d.total); });
    })
    .catch(() => { /* leave the chevron alone rather than guess */ });
  api.listCollections()
    .then((d) => {
      if (d && d.collections && d.collections.length) paint('collections', faNum(d.collections.length));
    })
    .catch(() => { /* leave the chevron alone */ });
  // Certificates held — any plan may ask; only a live one counts (the wall's rule).
  if (typeof api.certificates === 'function') {
    api.certificates()
      .then((d) => {
        const live = (d && d.certificates || []).filter((c) => !c.revoked_at).length;
        if (live) paint('certificate', faNum(live) + ' گواهی');
      })
      .catch(() => { /* leave the chevron alone */ });
  }
}

/* ------------------------------------------------------ cross-panel links -- */

/**
 * A card whose destination is an element on ANOTHER panel of this same page
 * (the DES scorer tab lives on خانه): a plain hash link would scroll nowhere
 * because that panel is display:none. Switch panels through the real bottom-nav
 * item — keeps nav state and animation consistent, the tour does the same —
 * then scroll to the target.
 */
function onHomePage() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  return p === '/' || p === '/index' || p === '/index.html';
}

function desktopShell() {
  return document.body.classList.contains('dc-desktop-ui');
}

function wireCrossPanelLinks(wrap) {
  wrap.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="/#"], a[href^="#"]');
    if (!a || !wrap.contains(a)) return;
    if (!onHomePage()) return;
    const id = a.getAttribute('href').split('#')[1];
    let target = id && document.getElementById(id);
    // The desktop shell carries its own copy of every homepage block under a
    // `dcd` id (dcDesToolTab → dcdDesToolTab) in the welcome column; the
    // phone's copy is display:none there and scrolling to it would do nothing.
    if (desktopShell() && id) {
      const alt = document.getElementById(id.replace(/^dc(?!d)/, 'dcd'));
      if (alt) target = alt;
    }
    if (!target) return;
    const panel = target.closest('.dc-panel');
    const colC = target.closest('.dcd-col-c-scroll');
    if (!panel && !colC) return;
    e.preventDefault();
    if (panel && !panel.classList.contains('active')) {
      const bn = document.querySelector('.dc-bn-item[data-panel="' + panel.id + '"]');
      if (bn) bn.click();
    }
    if (colC) {
      // Back to the welcome column: the four states of column C are exclusive,
      // and the welcome is the one with no class of its own.
      colC.classList.remove('is-premium', 'is-archive', 'has-content');
      const col = colC.closest('.dcd-col-c');
      if (col) col.classList.remove('is-viewer');
      const item = document.getElementById('dcd-premium-item');
      if (item) item.classList.remove('active');
    }
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof target.focus === 'function') target.focus({ preventScroll: true });
      // A collapsed disclosure (the DES scorer tab) is OPENED, not merely
      // reached: the card promised the tool, and landing on a closed tab that
      // needs a second tap is landing short (founder, 1405/06/31).
      if (target.getAttribute('aria-expanded') === 'false') target.click();
    }, 350);
  });
}

/* ------------------------------------------------------------------ mount -- */

function whenSeen(node, fn) {
  if (typeof IntersectionObserver !== 'function') { fn(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((x) => x.isIntersecting)) { io.disconnect(); fn(); }
  });
  io.observe(node);
}

export async function initPremiumPanel() {
  const slots = SLOT_IDS.map((id) => document.getElementById(id)).filter(Boolean);
  if (!slots.length) return;
  let me = null;
  try { me = await currentUser(); } catch (_) { me = null; }
  const state = stateOf(me);
  slots.forEach((slot) => {
    const head = pageHeadOf(slot);
    const wrap = build(me, { hasHead: !!head });
    wireCrossPanelLinks(wrap);
    slot.replaceChildren(wrap);
    slot.hidden = false;
    if (head) placeDashboardLink(head, state);
  });
  if (state === 'live') fillFromMe(me);
  // Lazy half: only when a copy of the panel is actually on screen.
  let armed = false;
  const lazy = () => {
    if (armed) return;
    armed = true;
    if (state === 'live') fillLazily();
  };
  slots.forEach((slot) => whenSeen(slot, lazy));
}
