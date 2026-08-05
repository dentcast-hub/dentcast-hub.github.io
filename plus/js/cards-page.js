// /plus/cards.html — premium Leitner review (Phase 2). Free/anonymous visitors
// see the same "coming soon" explainer the free-version pivot introduced;
// signed-in premium users get the real due-card queue (review.js).
import { el } from './util.js';
import { premiumCta } from './premium-cta.js';
import { currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderReview } from './review.js';
import { registerSW } from './pwa.js';

function comingSoonGate(root) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'مرور فلش‌کارت‌های زمان‌بندی‌شده، ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' }, 'هایلایت‌های شما حفظ می‌شوند و در همان مقاله و در «هایلایت‌های اخیر» پیشخوان دیده می‌شوند.'),
    premiumCta('gate-cards'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ]));
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const user = await currentUser();
  if (!user) {
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo: '/plus/cards.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [el('p', {}, 'برای دیدن کارت‌های مرور وارد شوید.'), btn]));
    return;
  }

  if (user.tier !== 'premium') { comingSoonGate(root); return; }

  const topic = new URLSearchParams(location.search).get('topic') || undefined;
  await renderReview(root, { topic });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
