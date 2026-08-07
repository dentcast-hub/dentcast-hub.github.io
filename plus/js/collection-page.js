// /plus/collection.html?id=... — one collection's detail view (Phase 3). Same
// premium gate shape as pathway.html/cards.html.
import { el } from './util.js';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js';
import { currentUser, meStatus } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderCollectionDetail } from './collections.js';
import { registerSW } from './pwa.js';

function comingSoonGate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'کالکشن‌ها ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' }, 'هایلایت‌ها و مطالعه‌ی شما همین حالا هم ثبت می‌شود؛ با پریمیوم، می‌توانید آن‌ها را در پوشه‌های دلخواهِ خودتان دسته‌بندی کنید.'),
    premiumCta('gate-collection'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ].filter(Boolean)));
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    root.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'کالکشنی مشخص نشده.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/collections.html' }, 'بازگشت به کالکشن‌ها'),
    ]));
    return;
  }

  const user = await currentUser();
  // The API answered nothing — which is NOT the same as "no subscription".
  // See unreachableGate: for the minutes an API is down, this gate used to
  // tell paying subscribers to go and buy a subscription.
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    const returnTo = '/plus/collection.html?id=' + encodeURIComponent(id);
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای دیدن این کالکشن وارد شوید.'),
      btn,
      ...guestPremiumExtras('guest-collection'),
    ]));
    return;
  }

  if (user.tier !== 'premium') { comingSoonGate(root, user); return; }

  await renderCollectionDetail(root, id);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
