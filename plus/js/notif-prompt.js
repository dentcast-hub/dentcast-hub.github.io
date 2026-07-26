// Post-tour notification nudge. After the first-login tour closes (and again on a
// later login), invite the user — in the tour's own card style — to turn on
// notifications, so they get daily learning reminders AND new-article alerts.
// Account-scoped, shown at most twice with a gap between the two, once per
// session, and skipped once the user has enabled any reminder.
//
// The CTA does the whole job in ONE click: it calls ensurePushSubscription()
// (which raises the browser permission prompt from the live click gesture) and
// then saves the reminder preferences — so the profile toggles come back already
// ticked. We deliberately do NOT pre-tick anything and never raise the browser
// prompt on page load: a "Block" is permanent, and a drive-by prompt on the very
// first login would burn the channel for good (Safari refuses it without a
// gesture, Chrome demotes it to quiet UI).
import { el, tehranDay } from './util.js';
import { api, currentUser } from './api.js';
import { openOverlay } from './overlay.js';
import { renderProfile } from './profile.js';
import { ensurePushSubscription, pushSupported } from './push.js';

const SS_SHOWN = 'dcp:notifprompt:shown'; // once per browser session
const MAX = 2;                            // account-scoped, total appearances
const MIN_GAP_DAYS = 5;                   // breathing room between the two

// The counter keys are ROUND-scoped. Bump ROUND when the nudge changes enough to
// be worth asking again: every account that still has notifications off starts a
// fresh pair of appearances, including the ones that spent their two on an older
// version of the card. Accounts with a reminder already on never see it either
// way (alreadyEnabled below), so a new round only reaches people we never
// converted. Round 2 = the one-click card; round 1 was the three-step
// "open the profile and find the toggle" card, whose keys are left orphaned.
const ROUND = 2;
const COUNT_KEY = `notif_prompt_count_r${ROUND}`;
const LAST_KEY = `notif_prompt_last_r${ROUND}`;

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

function daysSince(day) {
  if (!day) return Infinity;
  const then = Date.parse(String(day) + 'T00:00:00Z');
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.parse(tehranDay() + 'T00:00:00Z') - then) / 86400000);
}

// iPadOS 13+ reports itself as a Mac, hence the touch-point probe.
function isIOS() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  } catch (_) { return navigator.standalone === true; }
}

/**
 * Which card to show, or null to stay silent.
 *  'push'    — the browser can subscribe: one-click enable.
 *  'install' — iOS Safari outside the installed PWA: web push is impossible
 *              until the site is on the home screen, so we teach that instead
 *              and point at the messengers as the channel that works today.
 *  'connect' — no push support at all: Telegram/Bale is the only route.
 * Permission already 'denied' returns null — the browser block is ours to fix
 * nowhere in this card, and re-asking someone who said no is pure noise.
 */
function pickMode() {
  if (pushSupported()) return Notification.permission === 'denied' ? null : 'push';
  if (isIOS() && !isStandalone()) return 'install';
  return 'connect';
}

function guidanceText(res) {
  if (res === 'denied') {
    return 'اعلان‌ها در مرورگر بلاک شده. ترجیح شما ذخیره شد؛ برای دریافت نوتیف، از تنظیماتِ سایتِ مرورگر آن را Allow کنید.';
  }
  if (res === 'unsupported') {
    return 'مرورگر شما از اعلان پشتیبانی نمی‌کند. ترجیح شما ذخیره شد؛ برای دریافت نوتیف، تلگرام یا بله را وصل کنید.';
  }
  return 'ترجیح شما ذخیره شد؛ فعال‌سازی اعلان فعلاً ناموفق بود و بعداً دوباره تلاش می‌شود.';
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

  const settings = user.settings || {};
  const count = Number(settings[COUNT_KEY] || 0);
  if (count >= MAX) return false;
  // Second appearance waits a few days — back-to-back sessions read as pestering.
  if (count > 0 && daysSince(settings[LAST_KEY]) < MIN_GAP_DAYS) return false;

  const mode = pickMode();
  if (!mode) return false;

  markSession();
  // Account-scoped counter + date, so it stops after MAX across devices/sessions
  // and keeps its distance. Both are top-level keys, and PATCH /me shallow-merges
  // settings, so `reminders` survives untouched.
  api.updateMe({ settings: { [COUNT_KEY]: count + 1, [LAST_KEY]: tehranDay() } })
    .catch(() => { /* retry next time */ });
  currentUser({ refresh: true });

  let overlay = null;
  const cleanup = () => {
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };

  const msg = el('span', { class: 'dcp-inline-msg dcp-notif-msg' });
  const later = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-welcome-close', type: 'button' }, 'بعداً');
  later.addEventListener('click', cleanup);

  // Open the profile at the section that matters for this mode.
  const openProfileAt = (anchor) => {
    cleanup();
    openOverlay('profile', 'پروفایل', (root) => renderProfile(root, { me: user }));
    setTimeout(() => {
      const target = anchor === 'connect'
        ? document.querySelector('.dcp-overlay #connect')
        : Array.from(document.querySelectorAll('.dcp-overlay .dcp-dash-h2'))
          .find((n) => n.textContent && n.textContent.includes('یادآوری'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 140);
  };

  let title;
  let lead;
  let hint = null;
  const go = el('button', { class: 'dcp-btn dcp-btn-primary dcp-welcome-cta', type: 'button' });

  if (mode === 'push') {
    title = 'نوتیف‌ها را روشن کن';
    lead = 'با یک کلیک، هم یادآوریِ روزانه‌ی یادگیری را می‌گیری و هم از انتشارِ مطالبِ جدید باخبر می‌شوی — همین یک قدم، تداومت را نگه می‌دارد.';
    go.textContent = 'روشن‌کردن نوتیف‌ها';
    let closeOnNextClick = false; // after a failed attempt the CTA becomes «باشه»
    go.addEventListener('click', async () => {
      if (closeOnNextClick) { cleanup(); return; }
      go.disabled = true;
      msg.textContent = 'در حال فعال‌سازی…';
      // ensurePushSubscription FIRST: any earlier await would consume the click
      // gesture the permission prompt needs. The preference is saved either way
      // (same doctrine as the profile toggles) — the user's click IS the consent,
      // and a saved preference still delivers over Telegram/Bale.
      let res = 'error';
      try { res = await ensurePushSubscription(); } catch (_) { /* keep the pref */ }
      // Send the WHOLE reminders object: PATCH /me shallow-merges settings, so a
      // partial patch would replace `reminders` wholesale.
      await api.updateMe({ settings: { reminders: { new_content: true, streak: true } } }).catch(() => {});
      currentUser({ refresh: true });
      if (res === 'ok') {
        // The toggles are genuinely ticked now — confirm it, then get out of the way.
        box.replaceChildren(
          el('div', { class: 'dcp-welcome-ico', 'aria-hidden': 'true' }, '✅'),
          el('h2', { class: 'dcp-welcome-title' }, 'نوتیف‌ها روشن شد'),
          el('p', { class: 'dcp-welcome-lead' },
            'هر دو یادآوری در پروفایلت تیک خورد: مطلبِ جدید و استریکِ روزانه. هر وقت خواستی از «پروفایل ← یادآوری‌ها» خاموششان کن.'),
        );
        later.remove();
        setTimeout(cleanup, 2200);
        return;
      }
      msg.textContent = guidanceText(res);
      go.textContent = 'باشه';
      go.disabled = false;
      closeOnNextClick = true;
      later.remove();
    });
  } else if (mode === 'install') {
    title = 'نوتیف روی آیفون';
    lead = 'سافاری فقط وقتی نوتیف می‌فرستد که دنت‌کست روی صفحه‌ی اصلی نصب شده باشد: دکمه‌ی «اشتراک‌گذاری» ← «Add to Home Screen»، بعد از همان‌جا وارد شو و نوتیف را روشن کن.';
    hint = 'تا آن موقع، تلگرام یا بله همین حالا همان یادآوری‌ها را برایت می‌فرستد.';
    go.textContent = 'اتصال تلگرام / بله';
    go.addEventListener('click', () => openProfileAt('connect'));
  } else {
    title = 'یادآوری‌ها را روشن کن';
    lead = 'این مرورگر نوتیف نمی‌فرستد، اما تلگرام و بله می‌فرستند: وصلشان کن تا هم یادآوریِ روزانه‌ی یادگیری را بگیری و هم از مطالبِ جدید باخبر شوی.';
    go.textContent = 'اتصال تلگرام / بله';
    go.addEventListener('click', () => openProfileAt('connect'));
  }

  const box = el('div', {
    class: 'dcp-welcome-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'نوتیف‌ها',
  }, [
    el('div', { class: 'dcp-welcome-ico', 'aria-hidden': 'true' }, '🔔'),
    el('p', { class: 'dcp-tour-kicker' }, 'راهنمای دنت‌کست'),
    el('h2', { class: 'dcp-welcome-title' }, title),
    el('p', { class: 'dcp-welcome-lead' }, lead),
    hint ? el('p', { class: 'dcp-notif-hint' }, hint) : null,
    msg,
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
