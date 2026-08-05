// /plus/pathways.html — the learning-pathways catalog (Phase 3). Free/anonymous
// visitors see the same premium upsell shape the review page (cards.html) uses;
// signed-in premium users get the real catalog (pathways.js).
import { el } from './util.js';
import { premiumCta, lapsedNote, guestPremiumExtras } from './premium-cta.js';
import { currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderPathwaysList } from './pathways.js';
import { registerSW } from './pwa.js';

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
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const user = await currentUser();
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

  if (user.tier !== 'premium') { comingSoonGate(root, user); return; }

  await renderPathwaysList(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
