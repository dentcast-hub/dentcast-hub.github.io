// Controller for /plus/cards.html. With ?topic= it shows that topic's card
// archive; without it, the navigation tree (browse your topics). Requires login.
import { currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderTree } from './tree.js';
import { renderArchive } from './archive.js';
import { el } from './util.js';

function showLogin(root) {
  root.innerHTML = '';
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', async () => {
    const res = await openLoginModal({ returnTo: location.pathname + location.search });
    if (res && res.user) location.reload();
  });
  root.appendChild(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'برای دیدن کارت‌های خودتان وارد شوید.'),
    btn,
  ]));
}

async function main() {
  const root = document.getElementById('dcp-root');
  if (!root) return;
  const user = await currentUser();
  if (!user) { showLogin(root); return; }
  const topic = new URLSearchParams(location.search).get('topic');
  if (topic) await renderArchive(root, topic);
  else await renderTree(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
