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
  // The «بالاترین» sentence is assembled from the board's own seed_weight —
  // see leadForTop(). It must never say «محبوب‌ترین» while an inherited head
  // start is still doing part of the ordering.
};

function leadForTop(board) {
  if (!board) return 'ترتیب بر اساس قلبِ خواننده‌ها.';
  // Below ~5% the seed moves nothing a reader could notice, so claiming it
  // would be as misleading as hiding it.
  if (board.seed_weight < 0.05) return 'ترتیب بر اساس قلبِ خواننده‌ها.';
  return 'ترتیب از قلبِ خواننده‌ها می‌آید، به‌علاوهٔ میزان تعاملی که تا امروز با هر مطلب شده. مطلبِ قدیمی هم می‌تواند صدرنشین باشد.';
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
  let board = null;     // { items, seed_weight, total_hearts } — may stay null
  let hearts = new Map();
  let rank = new Map(); // content_id → position on the board

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
    const n = hearts.get(item.id) || 0;
    if (n > 0) {
      const h = el('span', { class: 'ub-hearts', title: faNum(n) + ' نفر این را پسندیده‌اند' });
      h.appendChild(heartIcon());
      h.appendChild(el('span', {}, faNum(n)));
      li.appendChild(h);
    }
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
    leadEl.textContent = mode === 'top' ? leadForTop(board) : LEAD.new;
    countEl.textContent = filter === 'all'
      ? faNum(rows.length) + ' مطلب'
      : faNum(rows.length) + ' مطلب در این دسته';
    sortBtns.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.sort === mode)));
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

  api.voteBoard().then((b) => {
    board = b;
    hearts = new Map(b.items.map((i) => [i.content_id, i.hearts]));
    rank = new Map(b.items.map((i, idx) => [i.content_id, idx]));
    if (catalog) render();
  }).catch(() => {
    // The «بالاترین» tab is what breaks, so say that on the tab rather than
    // leaving it looking like an empty ranking.
    const top = sortBtns.find((b) => b.dataset.sort === 'top');
    if (top) top.disabled = true;
    if (mode === 'top') { mode = 'new'; if (catalog) render(); }
  });
}
