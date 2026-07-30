// /plus/collections.html — the collections catalog (Phase 3). Same premium
// gate shape as pathways.html/cards.html.
import { el } from './util.js';
import { currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderCollectionsList } from './collections.js';
import { registerSW } from './pwa.js';

function comingSoonGate(root) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'کالکشن‌ها ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' }, 'هایلایت‌ها و مطالعه‌ی شما همین حالا هم ثبت می‌شود؛ با پریمیوم، می‌توانید آن‌ها را در پوشه‌های دلخواهِ خودتان دسته‌بندی کنید.'),
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
      const res = await openLoginModal({ returnTo: '/plus/collections.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [el('p', {}, 'برای دیدن کالکشن‌ها وارد شوید.'), btn]));
    return;
  }

  if (user.tier !== 'premium') { comingSoonGate(root); return; }

  await renderCollectionsList(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
