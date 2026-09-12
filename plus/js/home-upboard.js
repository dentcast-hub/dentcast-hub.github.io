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
import { api, currentUser, meStatus } from './api.js?v=71';
import { el, faNum } from './util.js?v=71';
import { openSheet, closeSheet, gateCard } from './sheet.js?v=71';
import { premiumCta, guestPremiumExtras } from './premium-cta.js?v=71';
import { openLoginModal } from './login-modal.js?v=71';

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

// The slots index.html carries. Three of them since 2026-09-10: the phone's
// archive panel, the desktop welcome column, and the desktop ARCHIVE surface —
// which is the desktop home of that same phone panel, so the box belongs there
// for the same reason it belongs there on the phone. The module never counted
// them; every selector it runs is scoped to a slot's own .dc-monitor, so the
// list is the only thing that changes.
const SLOT_IDS = ['dcLast3Updates', 'dcdLast3Updates', 'dcdArchLast3Updates'];

export function initHomeUpboard() {
  // EVERY querySelectorAll here is scoped to the slot's OWN .dc-monitor.
  // Document-wide (what this file did while there was exactly one slot) is a
  // real bug the moment there are two: both copies would collect all four
  // tabs, so pressing «بالاترین» in one shell would flip aria-selected on the
  // other shell's tabs and each copy's click handler would fire twice.
  const slots = SLOT_IDS
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .map((list) => {
      const scope = list.closest('.dc-monitor');
      const tabs = scope ? Array.from(scope.querySelectorAll('[data-monitor-sort]')) : [];
      return { list, tabs, freshHtml: null };
    })
    .filter((s) => s.tabs.length >= 2);
  if (!slots.length) return;

  // SHARED across slots, deliberately: the ranking is one fetch and the tier is
  // one answer. Only `freshHtml` is per-slot, because the list each shell's own
  // inline renderer drew is that shell's.
  let topRows = null;     // built once per page view
  let loading = false;
  // Why this tab cannot be opened, once we know: 'guest' (signed out) or
  // 'gated' (signed in, not a subscriber). null means we do not know yet, or
  // we could not ask — and those two must never lock, for the same reason
  // premium-cta.js's unreachableGate exists.
  let denied = null;

  const topTabs = slots
    .map((s) => s.tabs.find((t) => t.dataset.monitorSort === 'top'))
    .filter(Boolean);
  const lockAll = () => topTabs.forEach((t) => t.classList.add('is-locked'));

  // ── THE LOCK IS DECIDED AT LOAD, NOT ON THE PRESS ──
  //
  // It used to be added inside the click handler's catch, which is the one
  // place in this file that ran after `api.voteBoard()` answered. So the tab
  // opened unlocked for EVERY free reader on every page view — not as a race
  // that a fast connection would win, but structurally — and the order a
  // reader experienced was backwards: press → the tab turns blue (selected) →
  // «this is premium» → only THEN does it turn amber and grow a lock. The
  // reader was told they could not open it, and afterwards the door changed
  // to look shut.
  //
  // Deferring `voteBoard()` to the press is still right — it is the ranking,
  // and the box does not show one until asked. But the LOCK never needed the
  // ranking; it needs the reader's tier, and that is already on the page:
  // currentUser() is a cached shared promise (one /me per page), and
  // plus.js's `header` step awaits it before this module's step runs. So this
  // costs ZERO additional requests.
  //
  // Three answers, not two — the distinction desboard-page.js and
  // upboard-page.js both make: signed out and free are both definite and both
  // lock; anything else means we could not ask, and must never reach a paying
  // subscriber as a lock on something they own.
  currentUser().then((user) => {
    if (!user) {
      if (meStatus() === 'error') return;   // could not ask — leave it alone
      denied = 'guest';
    } else if (user.tier !== 'premium') {
      denied = 'gated';
    } else {
      return;                               // a subscriber sees no lock
    }
    lockAll();
  });

  const select = (slot, mode) => slot.tabs.forEach((t) => {
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

  function renderTop(list, rows) {
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

  slots.forEach((slot) => slot.tabs.forEach((tab) => tab.addEventListener('click', async () => {
    const mode = tab.dataset.monitorSort;
    if (tab.getAttribute('aria-selected') === 'true') return;

    if (mode === 'new') {
      if (slot.freshHtml !== null) slot.list.innerHTML = slot.freshHtml;
      select(slot, 'new');
      return;
    }

    // Already known to be shut: open the gate and stop. No selection change and
    // no fetch — flipping the tab to «selected» first is what made it flash
    // blue on the way to telling the reader it is not theirs. Same shape as
    // upboard-page.js's own click handler.
    if (denied) { gateSheet(denied === 'guest'); return; }

    if (loading) return;
    if (slot.freshHtml === null) slot.freshHtml = slot.list.innerHTML;
    loading = true;
    select(slot, 'top');
    try {
      renderTop(slot.list, await buildTop());
    } catch (err) {
      // Put the reader back where they were rather than leaving an empty box —
      // and leave the link, which is the part that always works.
      if (slot.freshHtml !== null) slot.list.innerHTML = slot.freshHtml;
      select(slot, 'new');
      // 401 (signed out) and 402 (free) are both answers; anything else means
      // we could not ask, and must not become an upsell aimed at a subscriber.
      // Kept as the backstop the load-time check cannot cover: /me may have
      // said «premium» and the subscription lapsed during this same page view,
      // in which case the board is the thing that finds out. Recording it in
      // `denied` too means a second press goes straight to the gate instead of
      // flashing blue and asking again — in EVERY slot, which is why the lock
      // is applied through lockAll() rather than to the tab that was pressed.
      const st = err && err.status;
      if (st === 401 || st === 402) {
        denied = st === 401 ? 'guest' : 'gated';
        lockAll();
        gateSheet(st === 401);
      } else unreachableSheet();
    } finally {
      loading = false;
    }
  })));
}
