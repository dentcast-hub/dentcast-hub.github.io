// /plus/report.html — «گزارش ماهانه» (premium). Same gate shape as
// reading-compass-page.js: a stranger is asked to sign in, a free reader sees
// the upsell, an unreachable API is NOT a missing subscription, and a premium
// reader gets the report (report.js).
import { el } from './util.js?v=93';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js?v=93';
import { currentUser, meStatus } from './api.js?v=93';
import { openLoginModal } from './login-modal.js?v=93';
import { renderReportPage, monthFromUrl } from './report.js?v=93';
import { registerSW } from './pwa.js?v=93';

function premiumGate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'گزارش ماهانه، ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' },
      'اول هر ماه یک گزارش شخصی می‌گیرید: چند مقاله و اپیزود، پوشش هر پیلار قبل و بعد، کدام حوزه یک ماه است دست‌نخورده مانده، مسیرها، لیگ و نشان‌ها — از همان رویدادهایی که امتیاز می‌گیرند.'),
    premiumCta('gate-report'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ].filter(Boolean)));
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const user = await currentUser();
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo: '/plus/report.html' + location.search });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای دیدن گزارش ماهانه وارد شوید.'),
      btn,
      ...guestPremiumExtras('guest-report'),
    ]));
    return;
  }

  if (user.tier !== 'premium') { premiumGate(root, user); return; }

  await renderReportPage(root, monthFromUrl());
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
