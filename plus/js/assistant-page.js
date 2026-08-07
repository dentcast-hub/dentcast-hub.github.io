// /plus/assistant.html — «دستیار هوشمند» (premium). Free/anonymous visitors see
// the same premium-upsell shape pathways.html/reading-compass.html use;
// signed-in premium users get the real wizard (case-assistant.js).
import { el } from './util.js';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js';
import { currentUser, meStatus } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderCaseAssistant } from './case-assistant.js';
import { registerSW } from './pwa.js';

function comingSoonGate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'دستیار هوشمند، ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' },
      'وضعیت بیمار را شرح می‌دهی و از بین چند گزینه انتخاب می‌کنی — نه گفتگوی آزاد، و نه تشخیص یا توصیه‌ی درمانی؛ فقط مسیر به مقاله‌ی مرتبطِ خودِ سایت.'),
    premiumCta('gate-assistant'),
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
      const res = await openLoginModal({ returnTo: '/plus/assistant.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای دیدن دستیار هوشمند وارد شوید.'),
      btn,
      ...guestPremiumExtras('guest-assistant'),
    ]));
    return;
  }

  if (user.tier !== 'premium') { comingSoonGate(root, user); return; }

  renderCaseAssistant(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
