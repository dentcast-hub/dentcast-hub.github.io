// Header rework (spec 2.5 + prototype feedback) as progressive enhancement over
// the dc-nav.js header. Keeps logo, podcast, hamburger. Adds:
//  - streak flame: two states (on today / off), logged-in only, links /plus.
//  - person icon (SVG): gray for guests -> login modal; blue for logged-in ->
//    a toggle that opens a small menu (پیشخوان / پروفایل), each of which opens as
//    an OVERLAY. Clicking the person again closes whatever is open.
import { el, streakIsActiveToday } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal } from './login-modal.js';
import { openOverlay, closeOverlay, overlayOpen } from './overlay.js';
import { renderDashboard } from './dashboard.js';
import { renderProfile } from './profile.js';

const PERSON_SVG = '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>';

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
  const svg = el('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', style: 'width:1.15em;height:1.15em' });
  svg.innerHTML = PERSON_SVG;
  btn.appendChild(svg);
  return btn;
}

function buildGuestPerson() {
  const btn = personSvg('is-guest');
  btn.setAttribute('aria-label', 'ورود');
  btn.addEventListener('click', async () => {
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

  // Move music + articles into the hamburger drawer.
  moveToDrawer(document.getElementById('btn-music-toggle'), 'موسیقی');
  moveToDrawer(document.getElementById('btn-cabinet'), 'مقاله‌ها');

  const user = await currentUser();
  if (user) actions.appendChild(buildFlame(user));
  actions.appendChild(user ? buildUserPerson(user) : buildGuestPerson());
}
