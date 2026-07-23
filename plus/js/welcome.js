// First-visit welcome / sign-up promo for GUESTS. Invites them to log in (phone
// or Telegram) and get a personal workbench (highlight / note / save / progress
// + the Duolingo-style learning streak: consistency over volume). It dims the
// whole page EXCEPT the header, and pulses the header person icon so the login
// entry point is the obvious next step. Shown at most MAX_SHOWS times per device
// (and once per session), never to a logged-in user.
import { el } from './util.js';
import { openLoginModal } from './login-modal.js';
import { telegramLoginEnabled } from './config.js';

const LS_COUNT = 'dcp:welcome:count';   // total appearances on this device
const SS_SHOWN = 'dcp:welcome:shown';   // once per browser session
const MAX_SHOWS = 5;

// Only on the site homepage — never on article/reading pages (it's intrusive
// mid-read). A guest who lands on an article first sees nothing until they reach
// the homepage; landing on a non-home page doesn't consume a session or a count.
function isHomePage() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  return p === '/' || p === '/index' || p === '/index.html';
}

function getCount() {
  try { return parseInt(localStorage.getItem(LS_COUNT) || '0', 10) || 0; }
  catch (_) { return MAX_SHOWS; } // storage blocked -> behave as "already done"
}
function bumpCount() {
  try { localStorage.setItem(LS_COUNT, String(getCount() + 1)); } catch (_) { /* ignore */ }
}
function shownThisSession() {
  try { return sessionStorage.getItem(SS_SHOWN) === '1'; } catch (_) { return true; }
}
function markSession() {
  try { sessionStorage.setItem(SS_SHOWN, '1'); } catch (_) { /* ignore */ }
}

/**
 * Show the welcome box to a guest if within limits. `personBtn` is the header
 * person icon (pulsed for attention while the box is up). No-op when the cap is
 * reached, already shown this session, or storage is unavailable.
 */
export function maybeShowWelcome({ personBtn } = {}) {
  if (!isHomePage()) return;              // homepage only
  if (getCount() >= MAX_SHOWS) return;
  if (shownThisSession()) return;

  markSession();
  bumpCount();

  const loginLine = telegramLoginEnabled()
    ? 'با موبایل یا تلگرام وارد شو'
    : 'با شماره موبایل وارد شو';

  let overlay = null;
  const cleanup = () => {
    if (personBtn) personBtn.classList.remove('dcp-person-attention');
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };

  const cta = el('button', { class: 'dcp-btn dcp-btn-primary dcp-welcome-cta', type: 'button' }, 'شروع رایگان');
  cta.addEventListener('click', async () => {
    cleanup(); // drop the promo first; the login modal brings its own backdrop
    try {
      const res = await openLoginModal({ returnTo: location.pathname + location.search });
      if (res && res.user) location.reload();
    } catch (_) { /* login cancelled / failed -> stay as guest */ }
  });

  const closeBtn = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-welcome-close', type: 'button' }, 'بعداً');
  closeBtn.addEventListener('click', cleanup);

  const card = el('div', {
    class: 'dcp-welcome-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'دنت‌کست پلاس',
  }, [
    el('div', { class: 'dcp-welcome-ico', 'aria-hidden': 'true' }, '🔥'),
    el('h2', { class: 'dcp-welcome-title' }, 'میز کارِ شخصیِ رایگانت'),
    el('p', { class: 'dcp-welcome-lead' },
      loginLine + ' و روی مقاله‌ها هایلایت بزن، یادداشت بگذار، ذخیره کن و پیشرفتت ثبت شود.'),
    el('p', { class: 'dcp-welcome-streak' },
      'شعله‌ی یادگیری‌ات را روشن نگه دار: هر روز که برگردی و بخوانی روشن می‌ماند و اگر فاصله بیفتد خاموش می‌شود؛ چون در یادگیری، تداوم مهم‌تر از حجم است.'),
    cta,
  ]);

  // Card + a close button BELOW it (per spec), stacked and centered.
  const wrap = el('div', { class: 'dcp-welcome-wrap' }, [card, closeBtn]);
  overlay = el('div', {
    class: 'dcp-welcome-overlay',
    onclick: (e) => { if (e.target === overlay) cleanup(); },
  }, [wrap]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onKey);

  // Draw the eye to the login entry point while the box is up.
  if (personBtn) personBtn.classList.add('dcp-person-attention');
}
