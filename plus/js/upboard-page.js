// /up-board/ — one page, two arrangements.
//
// The same 443 links, ordered either by when they were published or by what
// readers made of them. This is deliberately ONE document with a switch rather
// than two pages, which is the same call `pillar` made and for the same reason:
// two orderings of one link set, each on its own URL, is a duplicate-content
// problem we would then have to spend a canonical tag apologising for.
//
// The split of responsibilities is the point of the whole design:
//
//   · up-board/index.json is the CATALOG — id, title, type, url, date — built
//     from the brain by tools/build_upboard_index.py, and already in
//     newest-first order. A publish rebuilds it; the API never sees it, so a
//     title can change without an API deploy.
//   · GET /votes/board is the ORDERING — ids and numbers, nothing else. It
//     changes by the minute and carries no catalog, so it never has to be
//     redeployed when a title changes.
//
// Neither half can render the page alone, and that is what keeps each of them
// simple.
//
// Two rules the rest of this file follows:
//
//   1. Never blank the page waiting for the API. The catalog alone is a
//      complete, useful "تازه‌ترین" list, so it renders as soon as it arrives.
//      A dead or slow API costs the reader the second arrangement, never the
//      first one — and the tab says so rather than spinning forever.
//   2. Every filter lives in the URL (?sort=&type=), written with replaceState.
//      Same rule as the highlight library: a filtered view survives a refresh
//      and the back button, and is a link somebody can send.
import { api } from '/plus/js/api.js';
import { el, faNum } from '/plus/js/util.js';
import { openSheet, closeSheet, gateCard } from '/plus/js/sheet.js';
import { premiumCta, guestPremiumExtras } from '/plus/js/premium-cta.js';
import { openLoginModal } from '/plus/js/login-modal.js';

/** Which gate sent a buyer, for the pricing page's ?from= report. */
const FROM = 'upboard';

const INDEX_URL = '/up-board/index.json';
const ASSET_V = new URL(import.meta.url).search; // carry ?v= onto the fetch

// How many rows are built per pass. 443 rows built at once is roughly 3,000
// nodes on a phone before first paint; the library page solved this already and
// this is the same shape (plus/js/highlights.js's PAGE_CARDS).
const PAGE = 24;

const LEAD = {
  // Stated rather than implied, and it changes with the arrangement, because
  // the two lists are made of different things and a reader deciding whether to
  // trust an order deserves to know which one they are looking at.
  new: 'همهٔ مطالب دنت‌کست، از تازه‌ترین به قدیمی‌ترین.',
  top: 'ترتیب از قلبِ خواننده‌ها می‌آید، و شاخصِ تعامل جابه‌جایش می‌کند — ولی هیچ‌وقت از قلب جلو نمی‌زند.',
};

/** «۳» / «۷٫۵» — one decimal only when it earns one. */
function faNumber(x) {
  const rounded = Math.round(x * 10) / 10;
  return faNum(Number.isInteger(rounded) ? rounded : rounded.toFixed(1)).replace('.', '٫');
}

/**
 * What the engagement number means, on tap.
 *
 * It exists because the number is otherwise unreadable: «۶۲» beside a heart
 * invites exactly one wrong guess — that it is a percentage of the people who
 * opened the page. It is not; we have no per-article view count anywhere on the
 * site. Saying what it IS costs one sheet and removes the only interpretation
 * that would be a lie.
 *
 * The ranking sentence quotes the LIVE cap rather than a number written into
 * this file, because the cap moves with the site's own heart economy — a
 * hard-coded «۳ قلب» would be wrong within a year and nobody would notice.
 */
function explainEngagement(pct, cap) {
  const card = el('div', { class: 'dcp-sheet-card' }, [
    el('h3', {}, 'شاخصِ تعامل'),
    el('p', {}, faNum(pct) + ' یعنی این مطلب از ' + faNum(pct)
      + '٪ مطالبِ دنت‌کست تعاملِ بیشتری گرفته — خوانده‌شدن تا آخر، هایلایت، اشتراک‌گذاری و افزودن به کالکشن.'),
    el('p', {}, 'این «درصدِ خواننده‌ها» نیست؛ جایگاهِ این مطلب بین بقیهٔ مطالبِ سایت است.'),
    el('p', {}, 'در رتبه‌بندی، شاخصِ ۱۰۰ حداکثر به اندازهٔ ' + faNumber(cap)
      + ' قلب می‌ارزد — و همین سقف با بالا رفتنِ قلب‌های سایت بالا می‌رود، تا اثرش معنادار بماند. قلب همیشه حرفِ اول را می‌زند.'),
    el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', onclick: closeSheet }, 'باشه'),
  ]);
  openSheet(card);
}

/**
 * What «بالاترین» is, and why it costs something — shown on the tap, not as a
 * locked page.
 *
 * Two sentences, and that is the whole card on purpose. A gate is read standing
 * up, by somebody who tapped a tab and wants to know in one breath whether it is
 * for them; a paragraph about the scoring rule belongs where the numbers are
 * (the شاخص chip explains itself on tap), not in the doorway.
 *
 * «خوانده شدن» rather than «دیده شدن», and the difference is not pedantry: there
 * is no per-article view count anywhere on this site — `view_stats` is per day
 * and viewer class, `spot_stats` per ad slot — and what the ranking actually
 * counts is `article_completed`, a page held to the end. Promising views would
 * be promising a number we do not have.
 *
 * A SIGNED-OUT reader gets a different bottom half, and that distinction is not
 * cosmetic: they may already be a subscriber who is simply logged out on this
 * device, and selling a subscription to somebody who owns one is worse than
 * saying nothing. So sign-in leads and the purchase link follows, quieter —
 * the shape premium-cta.js's guestPremiumExtras() exists to keep consistent.
 */
function gateSheet(guest) {
  const card = gateCard({
    title: 'بالاترین — ویژه‌ی پریمیوم',
    sub: 'اینجا مطالبی بالاتر هستند که در سایت بیشترین بازخورد را داشته‌اند — خوانده شدن، لایک شدن، به اشتراک گذاشته شدن.',
    cta: guest
      ? el('button', {
        class: 'dcp-btn dcp-btn-primary', type: 'button',
        onclick: () => { closeSheet(); openLoginModal({ returnTo: location.pathname + location.search }); },
      }, 'ورود')
      : premiumCta(FROM),
  });
  card.insertBefore(el('p', { class: 'dcp-sheet-sub' }, 'ترتیبشان بر اساس تعاملِ همهٔ کاربرهاست.'), card.lastChild);
  if (guest) guestPremiumExtras(FROM).forEach((n) => card.appendChild(n));
  openSheet(card);
}

/**
 * «We could not ask» is NOT «you are not a subscriber».
 *
 * The same distinction premium-cta.js's unreachableGate exists for: while the
 * API is down — a redeploy is minutes of exactly that — a gate that guesses
 * tells paying readers to go and buy what they already own. So a network
 * failure gets its own message and no upsell.
 */
function unreachableSheet() {
  const card = el('div', { class: 'dcp-sheet-card' }, [
    el('h2', { class: 'dcp-sheet-title' }, 'ارتباط با سرور برقرار نشد'),
    el('p', { class: 'dcp-sheet-sub' },
      'این یعنی نتوانستیم حسابت را بخوانیم — نه اینکه اشتراک نداری. چند لحظه بعد دوباره تلاش کن.'),
    el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', onclick: closeSheet }, 'باشه'),
  ]);
  openSheet(card);
}

function heartIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', 'M12 20.5s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.3-7.5 10-7.5 10z');
  p.setAttribute('fill', 'currentColor');
  svg.appendChild(p);
  return svg;
}

export function initUpBoard(root) {
  const listEl = root.querySelector('#ubList');
  const leadEl = root.querySelector('#ubLead');
  const countEl = root.querySelector('#ubCount');
  const filtersEl = root.querySelector('#ubFilters');
  const sentinel = root.querySelector('#ubSentinel');
  const sortBtns = Array.from(root.querySelectorAll('[data-sort]'));
  if (!listEl) return;

  let catalog = null;   // { items, types, count }
  let board = null;     // { items, engagement_cap, total_hearts } — may stay null
  // Why the board is not here, when it is not: 'gated' (a free reader — the
  // arrangement is what premium buys) or 'unreachable' (we could not ask). The
  // two must never share a message; see unreachableSheet().
  let denied = null;
  let hearts = new Map();
  let engagement = new Map(); // content_id → percentile, only where there is one
  let rank = new Map();       // content_id → position on the board

  const params = new URLSearchParams(location.search);
  let mode = params.get('sort') === 'top' ? 'top' : 'new';
  let filter = params.get('type') || 'all';

  let rows = [];
  let drawn = 0;
  let observer = null;

  function writeUrl() {
    const q = new URLSearchParams();
    if (mode !== 'new') q.set('sort', mode);
    if (filter !== 'all') q.set('type', filter);
    const qs = q.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  /**
   * The ordered, filtered row list for the current state.
   *
   * In «بالاترین», items the board has never heard of — no hearts and no
   * engagement behind them — are appended AFTER the ranked ones, in their own
   * recency order. They are not dropped: a board that quietly hid four hundred
   * pages would be a worse catalog than the one it replaced, and a reader who
   * filtered to a small type could otherwise land on an empty page.
   */
  function compute() {
    const items = catalog.items.filter((i) => filter === 'all' || i.t === filter);
    if (mode === 'new') return items;
    const ranked = [];
    const rest = [];
    for (const i of items) (rank.has(i.id) ? ranked : rest).push(i);
    ranked.sort((a, b) => rank.get(a.id) - rank.get(b.id));
    return ranked.concat(rest);
  }

  function row(item, index) {
    const li = el('li', { class: 'ub-row' });

    if (mode === 'top') {
      // The number is only information in this arrangement. In «تازه‌ترین» it
      // would say nothing except "how far down the page you are".
      li.appendChild(el('span', {
        class: 'ub-rank' + (index < 3 ? ' is-top' : ''),
        'aria-hidden': 'true',
      }, faNum(index + 1)));
    }

    const main = el('div', { class: 'ub-main' }, [
      el('a', { class: 'ub-row-title', href: item.u }, item.ti),
      el('div', { class: 'ub-meta' }, [
        el('span', { class: 'ub-type' }, item.tf),
        item.d ? el('span', { class: 'ub-date' }, item.d) : null,
      ]),
    ]);
    li.appendChild(main);

    // Zero is never printed — the same rule the article chip follows, for the
    // same reason. On a list it matters more: four hundred «۰»s would read as a
    // site nobody has ever voted on.
    const signals = el('div', { class: 'ub-signals' });

    // The engagement index sits UNDER the heart rather than beside it: the two
    // are different kinds of number — one is a count of people, the other a
    // position among articles — and a row that puts them shoulder to shoulder
    // invites them to be read as a pair (9 of 62?). Stacked, with only the
    // heart in the heart's colour, they stay two facts.
    const pct = engagement.get(item.id);
    if (pct !== undefined && mode === 'top') {
      signals.appendChild(el('button', {
        class: 'ub-engagement',
        type: 'button',
        'aria-label': 'شاخص تعامل: ' + faNum(pct) + ' از ۱۰۰ — توضیح',
        onclick: () => explainEngagement(pct, board ? board.engagement_cap : 0),
      }, faNum(pct)));
    }

    // Zero is never printed — the same rule the article chip follows, for the
    // same reason. On a list it matters more: four hundred «۰»s would read as a
    // site nobody has ever voted on.
    const n = hearts.get(item.id) || 0;
    if (n > 0) {
      const h = el('span', { class: 'ub-hearts', title: faNum(n) + ' نفر این را پسندیده‌اند' });
      h.appendChild(heartIcon());
      h.appendChild(el('span', {}, faNum(n)));
      signals.insertBefore(h, signals.firstChild);
    }
    if (signals.children.length) li.appendChild(signals);
    return li;
  }

  function drawMore() {
    const slice = rows.slice(drawn, drawn + PAGE);
    if (!slice.length) {
      sentinel.textContent = '';
      if (observer) observer.disconnect();
      return;
    }
    const frag = document.createDocumentFragment();
    slice.forEach((item, i) => frag.appendChild(row(item, drawn + i)));
    listEl.appendChild(frag);
    drawn += slice.length;
    const left = rows.length - drawn;
    sentinel.textContent = left > 0 ? faNum(left) + ' مطلب دیگر' : '';
  }

  function render() {
    rows = compute();
    drawn = 0;
    listEl.innerHTML = '';
    leadEl.textContent = LEAD[mode];
    countEl.textContent = filter === 'all'
      ? faNum(rows.length) + ' مطلب'
      : faNum(rows.length) + ' مطلب در این دسته';
    sortBtns.forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.sort === mode));
      // The lock rides on the TAB rather than replacing it: a reader who cannot
      // open it should still see that the second arrangement exists, otherwise
      // there is nothing to want. Only a real 402 locks it — an unreachable API
      // leaves the tab looking normal, because it may well open next time.
      if (b.dataset.sort === 'top') {
        b.classList.toggle('is-locked', denied === 'guest' || denied === 'gated');
      }
    });
    Array.from(filtersEl.children).forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.type === filter));
    });
    drawMore();
    if (observer) observer.observe(sentinel);
    writeUrl();
  }

  function buildFilters() {
    const mk = (key, label) => {
      const b = el('button', { class: 'ub-filter', type: 'button', 'aria-pressed': 'false' }, label);
      b.dataset.type = key;
      b.addEventListener('click', () => { filter = key; render(); });
      return b;
    };
    filtersEl.appendChild(mk('all', 'همه'));
    // Built from the catalog, never hardcoded — a new content type appears here
    // the day it first publishes, with no edit to this file.
    catalog.types.forEach((t) => filtersEl.appendChild(mk(t.key, t.fa)));
    if (!catalog.types.some((t) => t.key === filter)) filter = 'all';
  }

  sortBtns.forEach((b) => b.addEventListener('click', () => {
    // «تازه‌ترین» is never gated — it is the list this page has always been.
    if (b.dataset.sort === 'top' && denied) {
      if (denied === 'unreachable') unreachableSheet();
      else gateSheet(denied === 'guest');
      return;
    }
    mode = b.dataset.sort;
    render();
  }));

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) drawMore();
    }, { rootMargin: '600px' });
  }

  // The catalog is required; the board is not. Fetched together, but the page
  // is drawn the moment the catalog lands rather than waiting on the API — a
  // reader on a bad connection gets the whole site in date order instead of a
  // spinner, and the ranked tab fills in when (or if) it arrives.
  fetch(INDEX_URL + ASSET_V, { credentials: 'omit' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('index ' + r.status))))
    .then((data) => {
      catalog = data;
      buildFilters();
      render();
    })
    .catch(() => {
      countEl.textContent = 'فهرست مطالب بارگذاری نشد. صفحه را دوباره باز کن.';
    });

  // PUBLIC, and fetched separately from the board on purpose: a heart count
  // belongs to the article, not to the arrangement. Reading it here is what lets
  // the FREE «تازه‌ترین» list carry the same number the article page shows —
  // when this rode on the (premium) board, gating the arrangement silently took
  // the counts off every row for everybody who was not a subscriber.
  api.voteCounts().then((c) => {
    hearts = new Map(Object.entries(c.hearts || {}));
    if (catalog) render();
  }).catch(() => { /* rows simply carry no count */ });

  api.voteBoard().then((b) => {
    board = b;
    // The board's own counts are the same numbers, a minute fresher — take them
    // when we have them so a subscriber never sees two different totals.
    b.items.forEach((i) => hearts.set(i.content_id, i.hearts));
    engagement = new Map(b.items
      .filter((i) => typeof i.engagement === 'number')
      .map((i) => [i.content_id, i.engagement]));
    rank = new Map(b.items.map((i, idx) => [i.content_id, idx]));
    if (catalog) render();
  }).catch((err) => {
    // 402 is an ANSWER — this reader is not a subscriber. Anything else means we
    // could not ask, and a gate that cannot tell those apart sells a
    // subscription to the people who already bought one, every time the API
    // blinks (premium-cta.js's unreachableGate exists for the same reason).
    // THREE answers, not two. 401 is "you are signed out" and 402 is "you are
    // signed in and not a subscriber" — both are definite, and both belong
    // behind the gate. Everything else means we could not ask, which must never
    // reach a paying reader as an upsell.
    const st = err && err.status;
    denied = st === 401 ? 'guest' : st === 402 ? 'gated' : 'unreachable';
    // A ?sort=top deep link from a subscriber's shared page lands a free reader
    // here. Fall back to the list rather than an empty ranking — and do NOT pop
    // the sheet unasked; the locked tab is the invitation, and a paywall that
    // opens itself on arrival is the thing everybody hates.
    if (mode === 'top') mode = 'new';
    if (catalog) render();
  });
}
