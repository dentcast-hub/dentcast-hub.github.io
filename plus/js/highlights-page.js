// /plus/highlights.html — the premium highlight library. Same gate shape as
// collections.html / cards.html / pathways.html: anonymous -> login, free ->
// premium upsell, premium -> the real view.
import { el } from './util.js';
import { currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderHighlightLibrary } from './highlights.js';
import { registerSW } from './pwa.js';

function upsellGate(root) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'دفترچه‌ی هایلایت‌ها ویژه‌ی دنت‌کست پریمیوم است.'),
    // A free user's highlights are NOT locked away — they are on the dashboard
    // and inside each article's workbench. What premium adds is seeing all of
    // them together. Saying that plainly is the honest version of the upsell.
    el('p', { class: 'dcp-muted' }, 'هایلایت‌های شما همین حالا هم ثبت می‌شود و در پیشخوان و داخلِ خودِ مقاله در دسترس است؛ با پریمیوم همه‌شان را یکجا، با یادداشت‌هایتان، می‌بینید و می‌توانید در بینشان جستجو کنید.'),
    el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان'),
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
      const res = await openLoginModal({ returnTo: '/plus/highlights.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [el('p', {}, 'برای دیدن هایلایت‌هایتان وارد شوید.'), btn]));
    return;
  }

  if (user.tier !== 'premium') { upsellGate(root); return; }

  await renderHighlightLibrary(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
