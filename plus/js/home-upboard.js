// The homepage's «بالاترین» tab — the doorway to /up-board/.
//
// The box itself is old: `.dc-monitor` has listed the newest thirty items on the
// homepage for a long time, filled by index.html's own inline script straight
// from the brain. What it never had was a destination — its hint said «برای دیدن
// همه اسکرول کنید», and scrolling was genuinely all there was.
//
// So this module adds the second arrangement and nothing else:
//
//   · the «همه ›» link and both tabs are STATIC markup in index.html, so the
//     doorway survives this file failing to load;
//   · «تازه‌ترین» is not re-rendered here. The list the inline script drew is
//     captured on the first switch away and put back verbatim on the way home,
//     which means one renderer owns that list and there is no second copy of it
//     to drift — and no race with a script that fills the same <ul> we do.
//
// It is only ever the top five. The box is a doorway, not the board.
import { api } from './api.js';
import { el, faNum } from './util.js';
import { openSheet, closeSheet, gateCard } from './sheet.js';
import { premiumCta, guestPremiumExtras } from './premium-cta.js';
import { openLoginModal } from './login-modal.js';

const FROM = 'home-upboard';

const TOP_N = 5;
const INDEX_URL = '/up-board/index.json';

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

/**
 * The same two cards the page's own tab shows, because the homepage tab is the
 * same door. Kept here rather than imported from upboard-page.js: that module is
 * loaded only by /up-board/ and pulling it in would drag the whole 443-row
 * renderer onto every homepage visit for two paragraphs of copy.
 */
function gateSheet(guest) {
  const card = gateCard({
    title: 'بالاترین — ویژه‌ی پریمیوم',
    sub: 'اینجا مطالبی بالاتر هستند که در سایت بیشترین بازخورد را داشته‌اند — خوانده شدن، لایک شدن، به اشتراک گذاشته شدن.',
    cta: guest
      ? el('button', {
        class: 'dcp-btn dcp-btn-primary', type: 'button',
        onclick: () => { closeSheet(); openLoginModal({ returnTo: location.pathname }); },
      }, 'ورود')
      : premiumCta(FROM),
  });
  card.insertBefore(el('p', { class: 'dcp-sheet-sub' }, 'ترتیبشان بر اساس تعاملِ همهٔ کاربرهاست.'), card.lastChild);
  if (guest) guestPremiumExtras(FROM).forEach((n) => card.appendChild(n));
  openSheet(card);
}

function unreachableSheet() {
  openSheet(el('div', { class: 'dcp-sheet-card' }, [
    el('h2', { class: 'dcp-sheet-title' }, 'ارتباط با سرور برقرار نشد'),
    el('p', { class: 'dcp-sheet-sub' },
      'این یعنی نتوانستیم حسابت را بخوانیم — نه اینکه اشتراک نداری. چند لحظه بعد دوباره تلاش کن.'),
    el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', onclick: closeSheet }, 'باشه'),
  ]));
}

export function initHomeUpboard() {
  const list = document.getElementById('dcLast3Updates');
  const tabs = Array.from(document.querySelectorAll('[data-monitor-sort]'));
  if (!list || tabs.length < 2) return;

  let freshHtml = null;   // the inline script's own list, captured once
  let topRows = null;     // built once per page view
  let loading = false;

  const select = (mode) => tabs.forEach((t) => {
    t.setAttribute('aria-selected', String(t.dataset.monitorSort === mode));
  });

  async function buildTop() {
    if (topRows) return topRows;
    const [board, catalogRes] = await Promise.all([
      api.voteBoard(),
      // `no-store` rather than a ?v= stamp, matching the homepage's own feed
      // fetch beside it: this module is a STATIC import of plus.js, so it does
      // not inherit plus.js's version query the way the dynamically-imported
      // workbench does, and there is no page-level stamp to read. The cost is
      // bounded — the fetch only happens when a reader presses «بالاترین» —
      // and the alternative is a stale catalog after every publish.
      fetch(INDEX_URL, { credentials: 'omit', cache: 'no-store' }),
    ]);
    if (!catalogRes.ok) throw new Error('index ' + catalogRes.status);
    const catalog = await catalogRes.json();
    const byId = new Map(catalog.items.map((i) => [i.id, i]));

    const rows = [];
    for (const entry of board.items) {
      const item = byId.get(entry.content_id);
      if (!item) continue; // ranked id with no page — an unpublish, skip it
      rows.push({ item, hearts: entry.hearts });
      if (rows.length === TOP_N) break;
    }
    topRows = rows;
    return rows;
  }

  function renderTop(rows) {
    list.innerHTML = '';
    rows.forEach((r, i) => {
      const a = el('a', { href: r.item.u }, [
        el('span', { class: 'dc-monitor-rank' + (i < 3 ? ' is-top' : ''), 'aria-hidden': 'true' }, faNum(i + 1)),
        el('span', { class: 'dc-mlist-title' }, r.item.ti),
      ]);
      // Zero is never printed — the same rule the article chip and the board
      // follow. A ranked row can legitimately have no hearts yet: its position
      // may be coming entirely from the derived seed.
      if (r.hearts > 0) {
        const h = el('span', { class: 'dc-monitor-hearts' });
        h.appendChild(heartIcon());
        h.appendChild(el('span', {}, faNum(r.hearts)));
        a.appendChild(h);
      }
      list.appendChild(el('li', {}, [a]));
    });
  }

  tabs.forEach((tab) => tab.addEventListener('click', async () => {
    const mode = tab.dataset.monitorSort;
    if (tab.getAttribute('aria-selected') === 'true') return;

    if (mode === 'new') {
      if (freshHtml !== null) list.innerHTML = freshHtml;
      select('new');
      return;
    }

    if (loading) return;
    if (freshHtml === null) freshHtml = list.innerHTML;
    loading = true;
    select('top');
    try {
      renderTop(await buildTop());
    } catch (err) {
      // Put the reader back where they were rather than leaving an empty box —
      // and leave the link, which is the part that always works.
      if (freshHtml !== null) list.innerHTML = freshHtml;
      select('new');
      // 402 is an answer, anything else is "we could not ask". Selling a
      // subscription to a subscriber whose API blinked is the one failure this
      // gate must not have.
      // 401 (signed out) and 402 (free) are both answers; anything else means
      // we could not ask, and must not become an upsell aimed at a subscriber.
      const st = err && err.status;
      if (st === 401 || st === 402) { tab.classList.add('is-locked'); gateSheet(st === 401); }
      else unreachableSheet();
    } finally {
      loading = false;
    }
  }));
}
