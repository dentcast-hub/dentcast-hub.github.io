// Controller for the standalone /plus/profile.html page. Renders the same
// profile the header overlay uses. Requires login.
import { currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderProfile } from './profile.js';
import { el } from './util.js';
import { registerSW } from './pwa.js';

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;
  const user = await currentUser();
  if (!user) {
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo: '/plus/profile.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [el('p', {}, 'برای دیدن پروفایل وارد شوید.'), btn]));
    return;
  }
  await renderProfile(root, { me: user });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
