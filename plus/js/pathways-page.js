// /plus/pathways.html — the learning-pathways catalog (Phase 3). Free/anonymous
// visitors are asked to sign in; every signed-in reader gets the real catalog
// (pathways.js), where a free reader finds the pathway that is open to
// everybody live and the rest locked.
import { el } from './util.js?v=149';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js?v=149';
import { currentUser, meStatus } from './api.js?v=149';
import { openLoginModal } from './login-modal.js?v=149';
import { renderPathwaysList } from './pathways.js?v=149';
import { registerSW } from './pwa.js?v=149';
import { wirePageBack } from './page-back.js?v=149';

function comingSoonGate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'مسیرهای یادگیری، ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' }, 'هایلایت‌ها و مطالعه‌ی شما همین حالا هم ثبت می‌شود؛ با پریمیوم، پیشرفتتان در یک مسیرِ منظم دیده می‌شود.'),
    premiumCta('gate-pathways'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ].filter(Boolean)));
}

async function main() {
  registerSW();
  wirePageBack();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const user = await currentUser();
  // The API answered nothing — which is NOT the same as "no subscription".
  // See unreachableGate: for the minutes an API is down, this gate used to
  // tell paying subscribers to go and buy a subscription.
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo: '/plus/pathways.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای دیدن مسیرهای یادگیری وارد شوید.'),
      btn,
      ...guestPremiumExtras('guest-pathways'),
    ]));
    return;
  }

  // A free reader gets the real catalog too: the pathway open to everybody is
  // live and first, every other one wears its lock (pathways.js). An older API
  // that still gates the whole route answers 402, and that draws the old gate.
  if (user.tier !== 'premium') {
    await renderPathwaysList(root, { onLocked: () => comingSoonGate(root, user) });
    return;
  }

  await renderPathwaysList(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
