// Post-tour notification nudge. After the first-login tour closes (and again on a
// later login), invite the user — in the tour's own card style — to open their
// profile and turn on notifications, so they get daily learning reminders AND
// new-article alerts. Account-scoped, shown at most twice, once per session, and
// skipped once the user has enabled any reminder.
import { el } from './util.js';
import { api, currentUser } from './api.js';
import { openOverlay } from './overlay.js';
import { renderProfile } from './profile.js';

const SS_SHOWN = 'dcp:notifprompt:shown'; // once per browser session
const MAX = 2;                            // account-scoped, total appearances

function isHomePage() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  return p === '/' || p === '/index' || p === '/index.html';
}
function shownThisSession() { try { return sessionStorage.getItem(SS_SHOWN) === '1'; } catch (_) { return true; } }
function markSession() { try { sessionStorage.setItem(SS_SHOWN, '1'); } catch (_) { /* ignore */ } }

// Already using notifications? No need to nudge.
function alreadyEnabled(user) {
  const r = (user && user.settings && user.settings.reminders) || {};
  return !!(r.new_content || r.streak);
}

/**
 * Show the notification nudge if within limits. Returns true if it showed.
 * `user` is the /me object (its settings carry the account-scoped count).
 */
export function maybeShowNotifPrompt(user) {
  if (!user || !isHomePage()) return false;
  // Never stack on the guided tour — its offer box or a running tour. When the
  // tour closes it calls us again (no offer present), so nothing is lost.
  if (document.querySelector('.dcp-tour-offer')
    || document.documentElement.classList.contains('dcp-touring')) return false;
  if (shownThisSession()) return false;
  if (alreadyEnabled(user)) return false;
  const count = Number((user.settings && user.settings.notif_prompt_count) || 0);
  if (count >= MAX) return false;

  markSession();
  // Account-scoped counter, so it stops after MAX across devices/sessions.
  api.updateMe({ settings: { notif_prompt_count: count + 1 } }).catch(() => { /* retry next time */ });
  currentUser({ refresh: true });

  let overlay = null;
  const cleanup = () => {
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };

  const go = el('button', { class: 'dcp-btn dcp-btn-primary dcp-welcome-cta', type: 'button' }, 'روشن‌کردن نوتیف‌ها');
  go.addEventListener('click', () => {
    cleanup();
    // Open the profile (where the reminder toggles live) and scroll to them.
    openOverlay('profile', 'پروفایل', (root) => renderProfile(root, { me: user }));
    setTimeout(() => {
      const h = Array.from(document.querySelectorAll('.dcp-overlay .dcp-dash-h2'))
        .find((n) => n.textContent && n.textContent.includes('یادآوری'));
      if (h) h.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 140);
  });
  const later = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-welcome-close', type: 'button' }, 'بعداً');
  later.addEventListener('click', cleanup);

  const box = el('div', {
    class: 'dcp-welcome-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'نوتیف‌ها',
  }, [
    el('div', { class: 'dcp-welcome-ico', 'aria-hidden': 'true' }, '🔔'),
    el('p', { class: 'dcp-tour-kicker' }, 'راهنمای دنت‌کست'),
    el('h2', { class: 'dcp-welcome-title' }, 'نوتیف‌ها را روشن کن'),
    el('p', { class: 'dcp-welcome-lead' },
      'در پروفایل، بخشِ «یادآوری‌ها» را روشن کن تا هم یادآوریِ روزانه‌ی یادگیری را بگیری و هم از انتشارِ مطالبِ جدید باخبر شوی — همین یک قدم، تداومت را نگه می‌دارد.'),
    go,
  ]);
  overlay = el('div', {
    class: 'dcp-welcome-overlay dcp-notif-prompt',
    onclick: (e) => { if (e.target === overlay) cleanup(); },
  }, [el('div', { class: 'dcp-welcome-wrap' }, [box, later])]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onKey);
  return true;
}
