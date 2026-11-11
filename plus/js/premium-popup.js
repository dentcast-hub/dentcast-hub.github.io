// The premium offer on an article page: one quiet card at the END of the
// article, in the page's own flow.
//
// WHAT THIS REPLACES (founder, 2026-11-11). Until then this module opened a
// modal two seconds after `load`: a card over ~85% of a phone screen, the
// article blurred behind it, closable by the × alone. Most visitors arrive from
// a search result straight onto one article, so that was the first thing they
// — and Google's renderer — met: a window over the whole page before a word of
// the content. The guest sign-up box on the homepage (welcome.js) went the same
// day. Neither exists any more; nothing on this site opens over the page on
// arrival.
//
// WHY THERE IS STILL AN OFFER AT ALL. Every other «پریمیوم» on the site is a
// gate — met only by walking into a feature you cannot use. Six to seven
// hundred people a day arrive on one article and leave; this card is the one
// place that tells them the thing exists, after they have read what they came
// for, without taking anything from them.
//
// RULES
//   1. NEVER TO SOMEONE WHO HAS ALREADY PAID — a founder or a live subscriber
//      gets no card.
//   2. ONLY ON A READING PAGE (`main.article-content-wrap`), at the END of that
//      main — below the prose, the sponsor card, the DES card, the thread and
//      the related links, above the page's own footer when main holds one.
//      Never the homepage, never the price page.
//   3. IN THE FLOW. No overlay, no backdrop, no focus trap, no scroll lock, no
//      close button — it is a section of the page, not something to dismiss.
//   4. ONE LINK, to the price page (a real <a>, so it can be opened in a tab).
//
// The exported name is kept so plus/js/header.js needs no change.
import { el } from './util.js?v=237';
import { premiumBenefits } from './premium-benefits.js?v=237';
import { premiumCta } from './premium-cta.js?v=237';

/** Where the buy link points from here, so pricing.html can report the source. */
const FROM = 'articleend';

function onHomePage() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  return p === '/' || p === '/index' || p === '/index.html';
}

/** Pages where a "buy premium" card would be arguing with the page itself. */
function onPurchaseSurface() {
  const p = location.pathname;
  return p.indexOf('/plus/pricing') === 0 || p.indexOf('/plus/pay-result') === 0;
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

function build() {
  // A LINK, not a handler: it navigates, so it must be middle-clickable and
  // long-pressable like any other link on the page.
  const cta = premiumCta(FROM, { label: 'اشتراک پریمیوم' });
  cta.classList.add('dcp-endcard-cta');
  cta.addEventListener('click', () => track('premium_endcard_click'));

  // The feature names only — the full pitch lives on the price page.
  const all = premiumBenefits().map((f) => f.title).filter(Boolean);
  const names = all.slice(0, 5).join('، ') + (all.length > 5 ? ' و چند امکان دیگر' : '');

  return el('aside', { class: 'dcp-endcard', 'aria-labelledby': 'dcp-endcard-title' }, [
    el('div', { class: 'dcp-endcard-body' }, [
      el('h2', { class: 'dcp-endcard-title', id: 'dcp-endcard-title' }, 'دنت‌کست پریمیوم'),
      el('p', { class: 'dcp-endcard-text' }, 'با اشتراک پریمیوم این‌ها هم باز می‌شود: ' + names + '.'),
    ]),
    cta,
  ]);
}

/**
 * Put the offer at the end of the article, if this page and this visitor
 * allow it. Safe to call on every page; idempotent.
 *
 * `user` is the resolved /me (null for a guest). Called from the header once
 * that has settled, so the premium check is never a guess.
 */
export function maybeShowPremiumPopup(user) {
  if (alreadyPremium(user)) return;
  if (onHomePage()) return;
  if (onPurchaseSurface()) return;
  const main = document.querySelector('main.article-content-wrap');
  if (!main || main.querySelector('.dcp-endcard')) return;

  const card = build();
  // Above the page's own footer (back button, copyright) when main carries one,
  // so the card closes the article instead of trailing after the page's end.
  // Directly before the footer, in the footer's OWN parent: on the glossary the
  // footer sits inside the article wrapper that is main's only child, and
  // climbing to "the child of main that holds it" put the card above the whole
  // term (CLS 0.29, the sponsor card pushed down — caught before it shipped).
  const feet = main.querySelectorAll('footer, .term-footer, .dc-site-footer');
  const foot = feet.length ? feet[feet.length - 1] : null;
  if (foot) foot.parentNode.insertBefore(card, foot);
  else main.appendChild(card);

  // Counted when it is actually reached, not when it is inserted.
  try {
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      seen.disconnect();
      track('premium_endcard_shown');
    }, { threshold: 0.5 });
    seen.observe(card);
  } catch (_) { /* no IntersectionObserver: the card still renders */ }
}
