// The first-visit premium offer: one card, the full list of what premium adds,
// a buy button, and an × to make it go away.
//
// WHY IT EXISTS AT ALL. Online purchase went live and every other place that
// says «پریمیوم» on this site is a gate — you only meet it by walking into a
// feature you cannot use. That reaches the people already deep in the product
// and nobody else. Six to seven hundred people a day arrive, most of them
// straight from a search result onto one article, and until now not one of them
// was ever told the thing exists.
//
// FOUR RULES, each of which is the reason a popup is tolerable rather than the
// thing that makes people leave:
//
//   1. NEVER TO SOMEONE WHO HAS ALREADY PAID. A founder and a live subscriber
//      see nothing, ever. Selling a subscription to its owner is worse than
//      saying nothing.
//   2. NEVER TWO MODALS IN ONE SESSION. A guest's first visit belongs to the
//      sign-up card (welcome.js); the tour and the notification nudge own their
//      own moments. This one waits for a session where nothing else is talking.
//      That is also why it does not fire on the price page — arguing for a
//      purchase on top of the purchase form is noise.
//   3. IT DOES NOT INTERRUPT THE ARRIVAL. Held until `load` and then a beat
//      longer, so it never competes with first paint, never lands on top of a
//      half-drawn article, and never taxes the numbers we measure the site by.
//   4. IT ENDS. Three appearances per device, two weeks apart, and then it is
//      done forever. A cap of one converts nobody — the first showing catches
//      people mid-errand — and no cap at all is how a site teaches people to
//      close things without reading them.
//
// CLOSING IS ONE BUTTON. The × in the corner, plus Escape for a keyboard. The
// backdrop deliberately does NOT close it: on a phone the first thing a thumb
// does to an unexpected card is try to scroll the page behind it, and dismissing
// on that gesture means the offer is never actually read once.
import { el, tehranDay } from './util.js';
import { premiumBenefits } from './premium-benefits.js';
import { premiumCta } from './premium-cta.js';

const LS_COUNT = 'dcp:prempopup:count'; // total appearances on this device
const LS_LAST = 'dcp:prempopup:last';   // Tehran day of the last appearance
const SS_SHOWN = 'dcp:prempopup:shown'; // once per browser session
const MAX_SHOWS = 3;
const MIN_GAP_DAYS = 14;
const DELAY_MS = 2000;                  // after `load`, not after DOM ready

/** Where the buy button points from here, so pricing.html can report the source. */
const FROM = 'firstvisit';

// Session keys owned by the other two first-run cards. Read, never written —
// this module's whole interaction with them is "if you spoke, I stay quiet".
const SS_WELCOME = 'dcp:welcome:shown';
const SS_NOTIF = 'dcp:notifprompt:shown';

/**
 * Pages where a "buy premium" card would be arguing with the page itself.
 *
 * The cabinet is here for a slightly different reason than the two purchase
 * pages: it makes its own, better-targeted offer inline (three free searches,
 * then «جستجو و مرتب‌سازی با پریمیوم»), and it is a page people arrive at to
 * DO something. Covering a search result with a general pitch would interrupt
 * the exact task that pitch depends on — and it only became reachable by free
 * readers at all when the tap gate came off, so this modal had never met them
 * here before.
 */
function onPurchaseSurface() {
  const p = location.pathname;
  return p.indexOf('/plus/pricing') === 0
    || p.indexOf('/plus/pay-result') === 0
    || p.indexOf('/dentcast_cabinet_search') === 0;
}

// Storage may be blocked (private mode, embedded webview). Every read below
// fails toward "already done", so a browser we cannot remember gets shown
// nothing rather than the same card on every single page load.
function getCount() {
  try { return parseInt(localStorage.getItem(LS_COUNT) || '0', 10) || 0; }
  catch (_) { return MAX_SHOWS; }
}
function lastDay() {
  try { return localStorage.getItem(LS_LAST) || ''; } catch (_) { return ''; }
}
function markShown() {
  try {
    localStorage.setItem(LS_COUNT, String(getCount() + 1));
    localStorage.setItem(LS_LAST, tehranDay());
  } catch (_) { /* ignore */ }
  try { sessionStorage.setItem(SS_SHOWN, '1'); } catch (_) { /* ignore */ }
}
function sessionBusy() {
  try {
    return sessionStorage.getItem(SS_SHOWN) === '1'
      || sessionStorage.getItem(SS_WELCOME) === '1'
      || sessionStorage.getItem(SS_NOTIF) === '1';
  } catch (_) { return true; }
}

function daysSince(day) {
  if (!day) return Infinity;
  const then = Date.parse(String(day) + 'T00:00:00Z');
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.parse(tehranDay() + 'T00:00:00Z') - then) / 86400000);
}

/** A live subscriber or a founder has nothing to buy here. */
function alreadyPremium(user) {
  if (!user) return false; // a guest may still be a subscriber elsewhere, but
                           // there is no way to know, and the card is honest
                           // either way: it sells, it does not lock anything.
  const sub = user.subscription;
  if (sub && sub.is_founder) return true;
  return user.tier === 'premium';
}

function track(event) {
  try { if (window.gtag) window.gtag('event', event, { from: FROM }); }
  catch (_) { /* analytics is never allowed to break the card */ }
}

function build(onClose) {
  const closeBtn = el('button', {
    class: 'dcp-pp-close', type: 'button', 'aria-label': 'بستن',
  }, '×');
  closeBtn.addEventListener('click', onClose);

  const list = el('ul', { class: 'dcp-pp-list' }, premiumBenefits().map((f) => el('li', {}, [
    el('strong', {}, f.title),
    el('span', {}, f.hint),
  ])));

  // A LINK, not a handler: it navigates, so it must be middle-clickable and
  // long-pressable like any other link on the page.
  const cta = premiumCta(FROM);
  cta.classList.add('dcp-pp-cta');
  cta.addEventListener('click', () => track('premium_popup_click'));

  // tabindex="-1" so the dialog itself can take focus on open. Focusing the ×
  // instead would announce the dialog too, but browsers treat a programmatic
  // focus on a freshly painted page as keyboard-driven and paint a focus ring
  // on the close button — which reads, to a visitor who touched nothing, as the
  // card telling them the only thing to do is dismiss it.
  const card = el('div', {
    class: 'dcp-pp-card', role: 'dialog', 'aria-modal': 'true',
    'aria-labelledby': 'dcp-pp-title', tabindex: '-1',
  }, [
    closeBtn,
    el('div', { class: 'dcp-pp-body' }, [
      el('h2', { class: 'dcp-pp-title', id: 'dcp-pp-title' },
        'امکان خرید آنلاین اشتراک پریمیوم دنت‌کست از طریق سایت فراهم شد'),
      el('h3', { class: 'dcp-pp-sub' }, 'با پریمیوم چه چیزی اضافه می‌شود؟'),
      list,
    ]),
    el('div', { class: 'dcp-pp-foot' }, [cta]),
  ]);

  return { card, closeBtn };
}

function show() {
  const prevFocus = document.activeElement;
  let overlay = null;

  const cleanup = () => {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKey);
    document.documentElement.classList.remove('dcp-pp-open');
    // Put the caret back where the reader left it, so a keyboard user is not
    // dropped at the top of the document by a card they did not ask for.
    try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (_) { /* ignore */ }
  };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); cleanup(); } };

  const { card } = build(cleanup);
  // No backdrop click handler on purpose — see the header comment.
  overlay = el('div', { class: 'dcp-pp-overlay' }, [card]);
  document.body.appendChild(overlay);
  document.documentElement.classList.add('dcp-pp-open');
  document.addEventListener('keydown', onKey);
  try { card.focus(); } catch (_) { /* ignore */ }

  markShown();
  track('premium_popup_shown');
}

/**
 * Show the offer if this device, this session and this visitor all allow it.
 * Safe to call on every page; it is a no-op far more often than not.
 *
 * `user` is the resolved /me (null for a guest). Called from the header once
 * that has settled, so the premium check is never a guess.
 */
export function maybeShowPremiumPopup(user) {
  if (alreadyPremium(user)) return;
  if (onPurchaseSurface()) return;
  if (getCount() >= MAX_SHOWS) return;
  if (daysSince(lastDay()) < MIN_GAP_DAYS) return;
  if (sessionBusy()) return;

  const fire = () => setTimeout(() => {
    // Re-checked at fire time, not at schedule time: the tour and the two other
    // cards can start during these two seconds, and the state that matters is
    // the one on screen when this would appear.
    if (sessionBusy()) return;
    if (document.documentElement.classList.contains('dcp-touring')) return;
    if (document.querySelector('.dcp-welcome-overlay, .dcp-modal-overlay, .dcp-overlay')) return;
    show();
  }, DELAY_MS);

  // `load` may already have fired — this module is imported from an async
  // header path, so the listener alone would silently never run.
  if (document.readyState === 'complete') fire();
  else window.addEventListener('load', fire, { once: true });
}
