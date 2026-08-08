// /plus/pathway.html?id=... — one pathway's detail view (Phase 3). Same
// premium gate shape as pathways.html/cards.html.
import { el } from './util.js';
import { lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js';
import { currentUser, meStatus } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderPathwayDetail } from './pathways.js';
import { registerSW } from './pwa.js';

/**
 * A lapsed subscriber's reassurance, kept as a BANNER above the working feature
 * rather than as the wall it used to be part of.
 *
 * The sentence exists because somebody whose subscription ended and somebody who
 * never had one are standing in the same doorway with different questions: the
 * second is asking what this is, the first is asking what happened to their
 * work. Now that the feature itself is open to both, the answer belongs over the
 * top of it — and it matters more here than it did on the wall, because a
 * reader looking at a truncated view of their own library is exactly the person
 * who might conclude something was taken away.
 */
function lapsedBanner(me) {
  const note = lapsedNote(me);
  return note ? el('p', { class: 'dcp-gate-lapsed' }, note) : null;
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    root.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'مسیری مشخص نشده.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/pathways.html' }, 'بازگشت به مسیرها'),
    ]));
    return;
  }

  const user = await currentUser();
  // The API answered nothing — which is NOT the same as "no subscription".
  // See unreachableGate: for the minutes an API is down, this gate used to
  // tell paying subscribers to go and buy a subscription.
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    const returnTo = '/plus/pathway.html?id=' + encodeURIComponent(id);
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای دیدن این مسیر وارد شوید.'),
      btn,
      ...guestPremiumExtras('guest-pathway'),
    ]));
    return;
  }

  const banner = lapsedBanner(user);
  const host = el('div', {});
  root.replaceChildren(...(banner ? [banner, host] : [host]));
  await renderPathwayDetail(host, id);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
