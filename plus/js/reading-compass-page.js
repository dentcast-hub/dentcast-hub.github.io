// /plus/reading-compass.html — «قطب‌نمای مطالعه» (Phase 3, premium). Free/
// anonymous visitors see the same premium-upsell shape pathways.html/cards.html
// use; signed-in premium users get the real report (reading-compass.js).
import { el } from './util.js?v=25';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js?v=25';
import { currentUser, meStatus } from './api.js?v=25';
import { openLoginModal } from './login-modal.js?v=25';
import { renderReadingCompass } from './reading-compass.js?v=25';
import { registerSW } from './pwa.js?v=25';

function comingSoonGate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'قطب‌نمای مطالعه، ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' },
      'با پریمیوم می‌بینید چند درصد از هر پیلار را خوانده‌اید، بیشترین مطالعه‌تان کجا بوده، و چه چیزی هنوز از دیدتان دور مانده — با دو دسته پیشنهاد: ادامه‌ی همان حیطه، یا کاوش حوزه‌ای تازه.'),
    premiumCta('gate-compass'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ].filter(Boolean)));
}

async function main() {
  registerSW();
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
      const res = await openLoginModal({ returnTo: '/plus/reading-compass.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای دیدن قطب‌نمای مطالعه وارد شوید.'),
      btn,
      ...guestPremiumExtras('guest-compass'),
    ]));
    return;
  }

  if (user.tier !== 'premium') { comingSoonGate(root, user); return; }

  await renderReadingCompass(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
