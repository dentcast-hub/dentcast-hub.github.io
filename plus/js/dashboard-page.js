// Controller for the standalone /plus/ page (PWA start URL). Renders the same
// dashboard the header overlay uses. Requires login.
import { currentUser, meStatus } from './api.js';
import { unreachableGate } from './premium-cta.js';
import { openLoginModal } from './login-modal.js';
import { renderDashboard } from './dashboard.js';
import { el } from './util.js';
import { registerSW } from './pwa.js';

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
      const res = await openLoginModal({ returnTo: '/plus/' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [el('p', {}, 'پیشخوان شخصی شما.'), btn]));
    return;
  }
  await renderDashboard(root, { me: user });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
