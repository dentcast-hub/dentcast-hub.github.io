// /plus/pathway.html?id=... — one pathway's detail view (Phase 3). Same
// premium gate shape as pathways.html/cards.html, drawn per pathway: a pathway
// open to everybody renders for a free reader too.
import { el } from './util.js?v=156';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js?v=156';
import { currentUser, meStatus } from './api.js?v=156';
import { openLoginModal } from './login-modal.js?v=156';
import { renderPathwayDetail } from './pathways.js?v=156';
import { registerSW } from './pwa.js?v=156';
import { wirePageBack } from './page-back.js?v=156';

function comingSoonGate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'مسیرهای یادگیری، ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' }, 'هایلایت‌ها و مطالعه‌ی شما همین حالا هم ثبت می‌شود؛ با پریمیوم، پیشرفتتان در یک مسیرِ منظم دیده می‌شود.'),
    // Founder, 1405/07/03: the exam is not behind this gate — only the road to it.
    el('p', { class: 'dcp-muted' }, 'اگر همهٔ مطالب یک مسیر را با حساب کاربری‌ات خوانده باشی، آزمون پایانی و گواهی‌نامه‌اش بدون اشتراک هم برایت باز است.'),
    premiumCta('gate-pathway'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ].filter(Boolean)));
}

async function main() {
  registerSW();
  wirePageBack();
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

  // Premium per PATHWAY (`premium: false` in pathways.json opens one to
  // everybody): a free reader asks like anyone else, and the server's 402 on
  // a premium pathway is what draws the gate.
  await renderPathwayDetail(root, id, user.tier !== 'premium' ? { onLocked: () => comingSoonGate(root, user) } : {});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
