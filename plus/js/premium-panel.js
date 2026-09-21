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
import { el, faNum, streakIsActiveToday } from './util.js?v=133';
import { currentUser, meStatus, api } from './api.js?v=133';
import { pricingHref, premiumCta } from './premium-cta.js?v=133';
import { openSheet, gateCard } from './sheet.js?v=133';
import { openLoginModal } from './login-modal.js?v=133';
import { currentMonthKey, shiftMonth, monthName } from './jalali-month.js?v=133';
import { PREMIUM_GROUPS, PREMIUM_ENTRIES } from './premium-catalog.js?v=133';
import { bundleRail, installTapGate, fillBundlesLive, BUNDLES_HREF } from './home-bundles.js?v=133';
import { armDesTool } from './des-scorer.js?v=133';

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

/**
 * «کدام‌ها را خوانده‌ای» — the seen-ticks' gate, word for word plus.js's
 * openSeenGate (a test keeps the two in step): the feature has no page, so the
 * card's tap says what it is and what it costs, exactly as a section list does.
 */
export const SEEN_GATE = {
  title: 'کدام‌ها را خوانده‌ای',
  sub: 'کنارِ هر مطلب یک نشان می‌گذارد: بازش کرده‌ای، یا تا آخر خوانده‌ای. '
    + 'روی هر دستگاهی، و حتی بعد از پاک‌کردنِ تاریخچه‌ی مرورگر — این حافظه به حسابِ توست، نه به مرورگر.',
};
function openSeenGate() {
  openSheet(gateCard({ title: SEEN_GATE.title, sub: SEEN_GATE.sub, cta: premiumCta('gate-seen') }));
}

/** One tick in the tab's own vocabulary — the same three states the list draws. */
function seenTick(state) {
  return el('span', { class: 'dcp-pp-tick' + (state ? ' is-' + state : ''), 'aria-hidden': 'true' }, '✓');
}

/**
 * The locked card's demo: three rows, one per tick state, and the filter chip —
 * so a reader who never opens a section list still sees what the feature IS.
 * The number line under it is painted later from GET /seen for a signed-in
 * free reader (fillSeen); a guest, whom /seen refuses, gets the demo alone.
 */
function seenDemo() {
  const row = (state, title, note) => el('div', { class: 'dcp-pp-seen-row' }, [
    seenTick(state), el('span', { class: 'dcp-pp-seen-t' }, title), el('small', {}, note),
  ]);
  return el('div', { class: 'dcp-pp-seen-demo', 'aria-hidden': 'true' }, [
    el('span', { class: 'dcp-pp-seen-chip' }, '◔ فقط نخوانده‌ها'),
    row('read', 'ادهزیو یونیورسال و اچینگ سلکتیو', 'تا آخر خوانده‌ای'),
    row('seen', 'لایه‌گذاری کامپوزیت خلفی', 'بازش کرده‌ای'),
    row('', 'کنترل خونریزی در جراحی پریو', 'هنوز ندیده‌ای'),
  ]);
}

function card(entry, state) {
  // The seen card leads nowhere while locked: its destination is a sheet.
  const seen = entry.key === 'seen';
  const href = seen ? null : entry.href;
  const tag = href ? 'a' : 'div';
  const attrs = { class: 'dc-list-card dcp-hf-card' + (href ? '' : ' is-static') + (seen ? ' is-seen-card' : ''), 'data-dcp-key': entry.key };
  if (href) attrs.href = href;
  if (seen && state === 'locked') { attrs.role = 'button'; attrs.tabindex = '0'; }
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
    seen ? seenDemo() : null,
    seen && state === 'locked' ? el('p', { class: 'dcp-pp-seen-num', hidden: true }) : null,
  ].filter(Boolean));
  if (seen && state === 'locked') {
    node.addEventListener('click', openSeenGate);
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSeenGate(); } });
  }
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
      el('div', { class: 'dcp-pp-row-t' }, entry.key === 'seen'
        ? [entry.title, el('span', { class: 'dcp-pp-seen-ticks', 'aria-hidden': 'true' }, [seenTick('read'), seenTick('seen'), seenTick('')])]
        : entry.title),
      el('div', { class: 'dcp-pp-row-s' }, entry.subLive || entry.sub),
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

/**
 * «از کجا شروع کنم؟» — the starter bundles, at the top of the tab in BOTH
 * states (founder, 1405/06/31): a subscriber gets the live rail under the quick
 * actions, everyone else gets the same rail right under the offer, every card
 * wearing «🔒 پریمیوم» and the tap gate answering the tap. The «همه‌ی باندل‌ها ›»
 * link goes to the catalog's own band (#bundles) in every state — the tab keeps
 * exactly one buy link, the offer card, and the catalog gates itself.
 */
function bundlesBand(state) {
  const locked = state === 'locked';
  if (locked) installTapGate();
  return el('section', { class: 'dcb-band dcp-pp-bundles', 'data-dcp-bundles': state }, [
    bundleRail({ isPremium: state === 'live', lock: locked, moreHref: BUNDLES_HREF }),
  ]);
}

/* ── ارزیاب DES, at the very end of the tab (founder, 1405/06/31 — «عین همونو
   می‌خوام توی صفحه پریمیوم ولی آخر آخر») ──
   The SAME box the home panel carries (index.html's .dc-destool-wrap: the amber
   tab, the drawer, the flask), built here because this panel is built here.
   Three things differ from the static copy, each because of where it sits.
   The toggle is this module's (the static copy's is inline so it works with no
   module at all; a box that a module drew has no such state to protect). The
   «پریمیوم» pill is left off for a subscriber — amber on this tab means «what a
   subscription buys», and the live state keeps it for the «اشتراک فعال» pill
   alone. And the TOOL inside is not a second instance: des-scorer.js keeps one
   built subtree and moves it into whichever drawer opens (armDesTool), so a
   reader who typed half a paper on خانه finds it here, with the same quota. */
let desToolSeq = 0;
function desToolBand(state) {
  desToolSeq += 1;
  const suffix = desToolSeq > 1 ? '-' + desToolSeq : '';
  const panelId = 'dcpDesToolPanel' + suffix;
  const ico = el('span', { class: 'dc-destool-ico', 'aria-hidden': 'true' });
  ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M9.5 3v5.2L4.8 17.4A2.4 2.4 0 0 0 6.9 21h10.2a2.4 2.4 0 0 0 2.1-3.6L14.5 8.2V3"/>'
    + '<path d="M8.2 3h7.6"/><path d="M7.4 14.2h9.2"/></svg>'; // static, trusted markup
  const tab = el('button', {
    type: 'button', class: 'dc-destool-tab', id: 'dcpDesToolTab' + suffix,
    'aria-expanded': 'false', 'aria-controls': panelId,
  }, [
    ico,
    el('span', { class: 'dc-destool-body' }, [
      el('span', { class: 'dc-destool-ttl' }, [el('b', {}, 'مقاله‌ی خودت'), ' را بگذار، امتیاز DES بگیر']),
      el('span', { class: 'dc-destool-sub' }, 'متن یا چکیده را بفرست تا ببینی چقدر شواهد پشتش هست — با همان DentCast Evidence Score.'),
    ]),
    state === 'live' ? null : el('span', { class: 'dc-destool-pill' }, 'پریمیوم'),
    el('span', { class: 'dc-destool-chev', 'aria-hidden': 'true' }, '›'),
  ].filter(Boolean));
  const panel = el('div', { id: panelId });
  const drawer = el('div', { class: 'dc-destool-drawer' }, [el('div', {}, [panel])]);
  const wrap = el('section', { class: 'dc-destool-wrap dcp-pp-destool', 'data-dcp-destool': state }, [tab, drawer]);
  const setOpen = (open) => {
    drawer.classList.toggle('is-open', open);
    tab.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  // The toggle is registered BEFORE armDesTool's listener, so the module reads
  // the state this click produced — the same order the inline copy relies on.
  tab.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
  });
  armDesTool(wrap);
  return wrap;
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
    live ? null : bundlesBand(state),
    live ? hero(me) : null,
    live ? today(me) : null,
    live ? quick() : null,
    live ? bundlesBand(state) : null,
    ...PREMIUM_GROUPS.map((g) => (live ? liveGroup(g, me) : group(g, state))),
    desToolBand(state), // last, in every state
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
/** «۵۱ از ۴۴۴» — the reader's site-wide pair from GET /seen; the same numbers
 * the section list's lock bar prints, summed over the folders it names. */
function seenPair(d) {
  const folders = (d && d.folders) || [];
  const read = typeof d.read === 'number' ? d.read : folders.reduce((a, f) => a + (f.read || 0), 0);
  const total = typeof d.total === 'number' ? d.total : folders.reduce((a, f) => a + (f.total || 0), 0);
  return { read, total };
}
function fillSeen(state) {
  if (typeof api.seen !== 'function') return;
  api.seen()
    .then((d) => {
      if (!d) return;
      const { read, total } = seenPair(d);
      if (!total) return;
      if (state === 'live') { paint('seen', faNum(read) + ' از ' + faNum(total), { live: true }); return; }
      // A signed-in free reader: the lock bar's own sentence, with their number —
      // the number is what makes the lock legible (plus.js seenLockBar).
      document.querySelectorAll('.dcp-pp .is-seen-card .dcp-pp-seen-num').forEach((n) => {
        n.replaceChildren(el('b', {}, faNum(read) + ' از ' + faNum(total)), ' مطلب را خوانده‌ای — دیدنِ اینکه کدام‌ها، با پریمیوم');
        n.hidden = false;
      });
    })
    .catch(() => { /* the demo stands on its own */ });
}

function fillLazily() {
  fillBundlesLive();
  fillSeen('live');
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
    // The DES scorer's drawer is on THIS tab, at the end — never a panel
    // switch. Resolved inside the panel rather than by id because both slots
    // build one (the desktop shell keeps the phone's copy, hidden).
    if (id === 'dcpDesToolTab') {
      const t = wrap.querySelector('.dc-destool-tab');
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof t.focus === 'function') t.focus({ preventScroll: true });
      // Opened, not merely reached (the same rule the home copy had).
      if (t.getAttribute('aria-expanded') === 'false') t.click();
      return;
    }
    let target = id && document.getElementById(id);
    // The desktop shell carries its own copy of every homepage block under a
    // `dcd` id (dcDesToolTab → dcdDesToolTab) in the welcome column; the
    // phone's copy is display:none there and scrolling to it would do nothing.
    if (desktopShell() && id) {
      const alt = document.getElementById(id.replace(/^dc(?!d)/, 'dcd'));
      if (alt) target = alt;
      // The archive is a column-C state on the desktop shell, opened by its own
      // sidebar item; the phone panel it names is display:none there.
      if (id === 'panel-sharehub') {
        const item = document.getElementById('dcd-archive-item');
        if (item) { e.preventDefault(); item.click(); return; }
      }
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
      // The shell remembers its column under the phone's `dc:panel` key; the
      // welcome column is the one state with no name, so forget it here.
      try { sessionStorage.removeItem('dc:panel'); } catch (_) { /* ignore */ }
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

/**
 * The desktop shell's own buy row (index.html `.dcd-a-subscribe`, «خرید اشتراک
 * پریمیوم» in the col-A sidebar) is static HTML that no script read the tier
 * for, so it stood beside a subscriber's tab — the one surface whose rule is
 * zero buy links for its owner (2026-09-21). Hidden for 'live' ONLY: a free
 * reader keeps it, and 'unknown' (we could not ask) keeps what shipped rather
 * than deciding anything.
 */
function syncShellOffer(state) {
  document.querySelectorAll('.dcd-a-subscribe').forEach((n) => { n.hidden = state === 'live'; });
}

export async function initPremiumPanel() {
  const slots = SLOT_IDS.map((id) => document.getElementById(id)).filter(Boolean);
  if (!slots.length) return;
  let me = null;
  try { me = await currentUser(); } catch (_) { me = null; }
  const state = stateOf(me);
  syncShellOffer(state);
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
    // A signed-in FREE reader gets the seen card's own number (a guest is
    // refused by /seen and keeps the demo alone).
    else if (state === 'locked' && me) fillSeen('locked');
  };
  slots.forEach((slot) => whenSeen(slot, lazy));
}
