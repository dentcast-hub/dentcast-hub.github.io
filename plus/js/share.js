// Sharing — and the one point in the product where a reader is credited for
// pointing somebody else at DentCast.
//
// The share BUTTON is not owned here. On a standalone article page it is built
// by dc-nav.js (the reading-time / share chip row above the prose), which is a
// classic script outside this module graph and cannot reach the API — the
// session lives behind api.js. So dc-nav.js only announces the act on
// `document`, and this module is the only listener. Same one-way bridge as
// util.js's signalStreakActivity, pointing the other way.
//
// The desktop shell is the exception: index.html strips dc-nav.js out of the
// article it fetches (`script[src*="dc-nav"]`), so no chip exists there at all
// and buildShareButton() below supplies one. That is a real gap being closed,
// not a nicety — without it, scoring shares would have paid mobile readers and
// silently paid desktop readers nothing.
import { api } from './api.js';
import { el } from './util.js';

/** Dispatched on `document` after a share actually went through. */
export const SHARE_EVENT = 'dcp:content-shared';

// Which article the page is showing RIGHT NOW. On the desktop shell one
// document shows many articles over its lifetime, so this is re-pointed on
// every mount instead of being captured in a closure — a listener that closed
// over the first article would go on crediting that one for every later share.
let activeContentId = null;
// Already reported in this page view. The server is the real authority (once
// per article per week, and only if it was read first); this just spares a
// double-tap a second request.
const reported = new Set();
let wired = false;

function report() {
  const id = activeContentId;
  if (!id || reported.has(id)) return;
  reported.add(id);
  // Fire-and-forget, exactly like the reading tracker: /activity rejects an
  // anonymous caller and nobody may ever see an error for pressing share. On a
  // real failure the id is released so the next tap can retry.
  api.activity('content_shared', id).catch(() => { reported.delete(id); });
}

/**
 * Start crediting shares for `contentId`. Safe to call on every page and on
 * every desktop re-mount; the listener is attached once and re-aimed after.
 */
export function initShareScoring(contentId) {
  activeContentId = contentId || null;
  if (wired) return;
  wired = true;
  document.addEventListener(SHARE_EVENT, report);
}

export function signalShared() {
  try { document.dispatchEvent(new CustomEvent(SHARE_EVENT)); } catch (_) { /* ignore */ }
}

/**
 * The share chip for surfaces dc-nav.js never reaches. `target()` is called at
 * click time, not at build time, because on the desktop shell the address bar
 * still shows the homepage — the article's own URL is only known to whoever
 * mounted it.
 *
 * Two paths, and only one of them can tell us anything. navigator.share()
 * rejects when the reader backs out of the sheet, so its rejection is the
 * single honest "no" the platform offers and it is honoured: no event, no
 * credit. A resolved promise still does not prove anything was sent (some
 * platforms resolve on dismiss) — which is exactly why the server refuses to
 * pay for a page the reader has not finished, rather than trusting this.
 */
export function buildShareButton(target) {
  const btn = el('button', { class: 'dc-act dc-act-quiet', type: 'button' }, 'اشتراک‌گذاری');
  btn.addEventListener('click', () => {
    const { title, url } = target() || {};
    if (!url) return;
    if (navigator.share) {
      navigator.share({ title: title || document.title, url }).then(signalShared, () => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        const prev = btn.textContent;
        btn.textContent = 'لینک کپی شد ✓';
        setTimeout(() => { btn.textContent = prev; }, 1600);
        signalShared();
      }, () => {});
    }
  });
  return btn;
}
