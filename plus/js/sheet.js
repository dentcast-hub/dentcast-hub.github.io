import { el } from './util.js?v=215';
import * as apiMod from './api.js?v=215';
import { PRICING_URL, guestPremiumExtras } from './premium-cta.js?v=215';
import { trapFocus } from './focus-trap.js?v=215';

/**
 * The bottom sheet — one implementation, for every surface that needs to ask
 * something without leaving the page.
 *
 * It was written inside collections.js for the "save to board" chooser, and the
 * moment a second surface wanted the same thing (the achievements wall, where a
 * badge opens its levels and its copy) the choice was to copy twenty-five lines
 * or to move them here. hl-view.js exists for exactly this reason — two pages
 * drawing the same object two different ways — so this follows that rule rather
 * than re-learning it.
 *
 * Mobile-first: slides up from the bottom, and plus-desktop.css turns it into a
 * centered dialog from tablet width up. Styles live in plus.css (.dcp-sheet*);
 * this module owns only the behaviour: one sheet at a time, focus moves in and
 * stays in (focus-trap.js), Escape closes, clicking the backdrop closes, focus
 * goes back to the opener, and the node is removed only after the exit
 * transition so it never disappears mid-slide.
 */

let sheetOverlay = null;

export function closeSheet({ restoreFocus = true } = {}) {
  if (!sheetOverlay) return null;
  const { overlay, sheet, release } = sheetOverlay;
  overlay.classList.remove('is-open');
  sheet.classList.remove('is-open');
  const opener = release({ restore: restoreFocus });
  setTimeout(() => overlay.remove(), 300);
  sheetOverlay = null;
  return opener;
}

/** Open `card` (any element) in a sheet. Opening one closes whatever was open. */
export function openSheet(card) {
  // A sheet that replaces another keeps the FIRST opener as the place focus
  // returns to, not the sheet that is going away.
  const prevOpener = closeSheet({ restoreFocus: false });
  const sheet = el('div', { class: 'dcp-sheet', role: 'dialog', 'aria-modal': 'true' }, [
    el('div', { class: 'dcp-sheet-handle' }),
    card,
  ]);
  // Exactly one dialog: cards (gateCard, the clip sheet) name themselves with
  // role=dialog + aria-label, which inside this wrapper made a dialog within a
  // dialog. The wrapper is the dialog; it takes the card's name.
  if (card && card.getAttribute && card.getAttribute('role') === 'dialog') {
    const name = card.getAttribute('aria-label');
    if (name && !sheet.hasAttribute('aria-label')) sheet.setAttribute('aria-label', name);
    card.removeAttribute('role');
    card.removeAttribute('aria-modal');
  }
  const overlay = el('div', {
    class: 'dcp-sheet-overlay',
    onclick: (e) => { if (e.target === overlay) closeSheet(); },
  }, [sheet]);
  document.body.appendChild(overlay);
  const release = trapFocus(sheet, { onEscape: () => closeSheet(), opener: prevOpener || undefined });
  sheetOverlay = { overlay, sheet, release };
  requestAnimationFrame(() => { overlay.classList.add('is-open'); sheet.classList.add('is-open'); });
}

/**
 * The "this is premium" card, for any surface that gates on a tap rather than
 * on a locked page: a title, one sentence on what premium adds, and the one
 * canonical CTA (premium-cta.js) so the wording and the ?from= tracking stay in
 * one place.
 *
 * It lived inside collections.js until the archive page's library card wanted
 * the same object — same rule as the sheet itself, and as hl-view.js: the
 * second caller moves the component here rather than drawing it twice.
 */
export function gateCard({ title, sub, cta, guest, from }) {
  // A SIGNED-OUT visitor gets a different bottom half, and the split is the
  // up-board gate's (upboard-page.js gateSheet): they may already be a
  // subscriber who is logged out on this device, and selling a subscription to
  // somebody who owns one is worse than saying nothing — so «ورود» leads and
  // the purchase link follows, quieter (premium-cta.js guestPremiumExtras).
  // Decided HERE, once, from what /me last answered: every caller already
  // probes before it opens the sheet, and a card built from the answer means
  // no call site has to branch (library-gate.js, home-bundles.js and the two
  // seen-gates shipped with only «خرید اشتراک» for a guest because each had
  // to remember the split on its own). It only ever rewrites a cta that IS the
  // pricing link; a caller that already drew its own guest button (upboard,
  // home-upboard) is left exactly as it was.
  const signedOut = typeof guest === 'boolean' ? guest : lastMeStatus() === 'anon';
  const buyLink = cta && cta.tagName === 'A' && isPricingHref(cta.getAttribute('href'));
  if (signedOut && buyLink) {
    const tag = from || fromOf(cta.getAttribute('href'));
    const login = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    login.addEventListener('click', () => {
      closeSheet();
      import('./login-modal.js?v=215')
        .then((m) => m.openLoginModal({ returnTo: location.pathname + location.search + location.hash }))
        // Reload on success: the gated surface and the header both read /me at
        // boot, so a sign-in that only closed the modal looked like a failed one.
        .then((res) => { if (res && res.user) location.reload(); })
        .catch(() => {});
    });
    return el('div', { class: 'dcp-sheet-card', role: 'dialog', 'aria-label': title }, [
      el('h2', { class: 'dcp-sheet-title' }, title),
      el('p', { class: 'dcp-sheet-sub' }, sub),
      login,
      ...guestPremiumExtras(tag),
    ]);
  }
  return el('div', { class: 'dcp-sheet-card', role: 'dialog', 'aria-label': title }, [
    el('h2', { class: 'dcp-sheet-title' }, title),
    el('p', { class: 'dcp-sheet-sub' }, sub),
    cta,
  ]);
}

/** What /me last answered — read defensively, because a sheet must open even
 *  where the API module is a stand-in with no `meStatus` (tests, an old copy). */
function lastMeStatus() {
  try { return typeof apiMod.meStatus === 'function' ? apiMod.meStatus() : 'unknown'; } catch (_) { return 'unknown'; }
}

function isPricingHref(href) {
  if (!href) return false;
  try { return new URL(href, location.origin).pathname === PRICING_URL; } catch (_) { return false; }
}

function fromOf(href) {
  try { return new URL(href, location.origin).searchParams.get('from') || ''; } catch (_) { return ''; }
}
