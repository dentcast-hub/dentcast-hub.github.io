// Header rework (spec 2.5 + prototype feedback) as progressive enhancement over
// the dc-nav.js header. Keeps logo, podcast, hamburger. Adds:
//  - streak flame: two states (on today / off), logged-in only, links /plus.
//  - person icon (SVG): gray for guests -> login modal; blue for logged-in ->
//    a toggle that opens a small menu (پیشخوان / پروفایل), each of which opens as
//    an OVERLAY. Clicking the person again closes whatever is open.
import { el, streakIsActiveToday, STREAK_ACTIVITY_EVENT } from './util.js';
import { currentUser, api } from './api.js';
import { isOrgHost, detectContentId } from './config.js';
import { openLoginModal, openOrgNotice, openNameGate, nameIsChosen } from './login-modal.js';
import { openOverlay, closeOverlay, overlayOpen } from './overlay.js';
import { renderDashboard } from './dashboard.js';
import { renderProfile } from './profile.js';

// Inlined so it can never 404. Built via innerHTML on an HTML button (not
// createElement('svg')) so the parser creates properly namespaced SVG nodes;
// createElement('svg') would produce an unrenderable HTML element (empty icon).
const PERSON_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" ' +
  'style="width:1.3em;height:1.3em;display:block">' +
  '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';

function moveToDrawer(btn, labelText) {
  const drawer = document.querySelector('.dc-toolbar-drawer-inner');
  if (!btn || !drawer || btn.dataset.dcpMoved) return;
  btn.dataset.dcpMoved = '1';
  btn.classList.add('dc-drawer-tool-seg');
  const ico = el('span', { class: 'dc-drawer-tool-ico' });
  while (btn.firstChild) ico.appendChild(btn.firstChild);
  btn.appendChild(ico);
  btn.appendChild(el('span', { class: 'dc-drawer-tool-txt' }, labelText));
  drawer.appendChild(btn);
}

function buildFlame(user) {
  // Two states only, no number/chain: lit = a qualifying action was completed
  // today (Asia/Tehran), unlit = not yet today. The streak count lives on the
  // homepage card and the dashboard, never in the header.
  const active = streakIsActiveToday(user.last_active_day);
  return el('a', {
    class: 'dc-topbar-btn dcp-flame-btn' + (active ? ' is-active' : ''),
    href: '/plus/', 'aria-label': active ? 'امروز فعال بوده‌اید' : 'امروز هنوز فعالیتی ثبت نشده',
    title: active ? 'امروز فعال بوده‌اید' : 'امروز هنوز فعالیتی ثبت نشده',
  }, [
    el('span', { class: 'dcp-flame-ico', 'aria-hidden': 'true' }, '🔥'),
  ]);
}

function personSvg(colorClass) {
  const btn = el('button', { class: 'dc-topbar-btn dcp-person-btn ' + colorClass, type: 'button' });
  // Setting innerHTML with an <svg> string on an HTML element yields real,
  // namespaced SVG nodes that render (and give the button a clickable size).
  btn.innerHTML = PERSON_SVG;
  return btn;
}

function buildGuestPerson() {
  const btn = personSvg('is-guest');
  btn.setAttribute('aria-label', 'ورود');
  btn.addEventListener('click', async () => {
    // .org gate (temporary): show the dentcast.ir notice instead of OTP; the
    // anon demand signal is logged inside openOrgNotice (marked org:header).
    if (isOrgHost()) { openOrgNotice({ source: 'header', contentId: detectContentId() }); return; }
    const res = await openLoginModal({ returnTo: location.pathname + location.search });
    if (res && res.user) location.reload();
  });
  return btn;
}

function buildUserPerson(user) {
  const btn = personSvg('is-user');
  btn.setAttribute('aria-label', 'حساب شما');
  btn.setAttribute('aria-haspopup', 'true');

  let menu = null;
  const closeMenu = () => { if (menu) { menu.remove(); menu = null; document.removeEventListener('click', onDoc); } };
  const onDoc = (e) => { if (menu && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closeMenu(); };

  const openMenu = () => {
    menu = el('div', { class: 'dcp-person-menu', role: 'menu' }, [
      el('button', { class: 'dcp-person-item', type: 'button', role: 'menuitem',
        onclick: () => { closeMenu(); openOverlay('dashboard', 'پیشخوان', (root) => renderDashboard(root, { me: user })); } }, 'پیشخوان'),
      el('button', { class: 'dcp-person-item', type: 'button', role: 'menuitem',
        onclick: () => { closeMenu(); openOverlay('profile', 'پروفایل', (root) => renderProfile(root, { me: user })); } }, 'پروفایل'),
      el('button', { class: 'dcp-person-item', type: 'button', role: 'menuitem',
        onclick: async () => { closeMenu(); await api.logout().catch(() => {}); location.reload(); } }, 'خروج'),
    ]);
    const wrap = btn.closest('.dcp-person-wrap') || btn.parentNode;
    wrap.appendChild(menu);
    setTimeout(() => document.addEventListener('click', onDoc), 0);
  };

  // Toggle cycle: closed -> menu -> (select) -> overlay -> person closes it.
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu) { closeMenu(); return; }
    if (overlayOpen()) { closeOverlay(); return; }
    openMenu();
  });

  const wrap = el('div', { class: 'dcp-person-wrap' }, [btn]);
  return wrap;
}

export async function initHeader() {
  const actions = document.querySelector('.dc-topbar .dc-topbar-actions');
  if (!actions || actions.dataset.dcpHeader) return;
  actions.dataset.dcpHeader = '1';

  // Move music + articles into the hamburger drawer (independent of the API).
  try {
    moveToDrawer(document.getElementById('btn-music-toggle'), 'موسیقی');
    moveToDrawer(document.getElementById('btn-cabinet'), 'مقاله‌ها');
  } catch (_) { /* non-fatal */ }

  // A failed /me (e.g. API down) must never break icon rendering or the toggle:
  // currentUser already swallows errors, but guard anyway and default to guest.
  let user = null;
  try { user = await currentUser(); } catch (_) { user = null; }

  // Plus requires a chosen pseudonym (leaderboard identity). If a logged-in user
  // somehow has none yet, gate the whole experience behind a mandatory,
  // non-dismissable name prompt. (Fires only when the backend leaves the name
  // unchosen; it never misfires while the backend auto-generates one.)
  if (user && !nameIsChosen(user)) {
    try { user = await openNameGate({ user }); currentUser({ refresh: true }); }
    catch (_) { /* non-fatal: fall through to normal rendering */ }
  }

  try {
    if (user) {
      const flame = buildFlame(user);
      actions.appendChild(flame);
      // A qualifying action just happened today -> light the flame live, so the
      // user does not have to reload to see today's streak reflected.
      document.addEventListener(STREAK_ACTIVITY_EVENT, () => {
        flame.classList.add('is-active');
        flame.setAttribute('aria-label', 'امروز فعال بوده‌اید');
        flame.setAttribute('title', 'امروز فعال بوده‌اید');
      });
    }
    actions.appendChild(user ? buildUserPerson(user) : buildGuestPerson());
  } catch (e) {
    if (window.console) console.warn('[plus header] wiring failed', e);
    // Last resort: at least a working guest login icon.
    if (!actions.querySelector('.dcp-person-btn')) {
      try { actions.appendChild(buildGuestPerson()); } catch (_) { /* give up quietly */ }
    }
  }
}
