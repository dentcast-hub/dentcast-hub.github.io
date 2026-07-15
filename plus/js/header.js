// Header rework (spec 2.5) as progressive enhancement over the dc-nav.js header.
// Keeps logo, podcast, streak flame (logged-in only), person/avatar, hamburger.
// Moves music + articles into the hamburger drawer. Login is a modal, never a
// page. dc-nav injects the header synchronously before DOMContentLoaded, so the
// elements are present by the time this module runs.
import { el, faNum, streakIsActive } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal } from './login-modal.js';

function moveToDrawer(btn, labelText) {
  const drawer = document.querySelector('.dc-toolbar-drawer-inner');
  if (!btn || !drawer || btn.dataset.dcpMoved) return;
  btn.dataset.dcpMoved = '1';
  btn.classList.add('dc-drawer-tool-seg');
  // Wrap the existing icon so it matches the drawer tool markup, then add a label.
  const ico = el('span', { class: 'dc-drawer-tool-ico' });
  while (btn.firstChild) ico.appendChild(btn.firstChild);
  btn.appendChild(ico);
  btn.appendChild(el('span', { class: 'dc-drawer-tool-txt' }, labelText));
  drawer.appendChild(btn);
}

function buildFlame(streak, active) {
  return el('a', {
    class: 'dc-topbar-btn dcp-flame-btn' + (active ? ' is-active' : ''),
    href: '/plus/', 'aria-label': 'استریک شما',
  }, [
    el('span', { class: 'dcp-flame-ico', 'aria-hidden': 'true' }, '🔥'),
    el('span', { class: 'dcp-flame-n' }, faNum(streak || 0)),
  ]);
}

function buildPerson(user) {
  if (!user) {
    const btn = el('button', { class: 'dc-topbar-btn dcp-person-btn', type: 'button', 'aria-label': 'ورود' },
      el('svg', { viewBox: '0 0 24 24', class: 'dc-svg-icon', 'aria-hidden': 'true', style: 'width:1em;height:1em' }));
    // simple person glyph
    btn.querySelector('svg').innerHTML = '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>';
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo: location.pathname + location.search });
      if (res && res.user) location.reload();
    });
    return btn;
  }

  const initial = (user.display_name || '؟').trim().charAt(0);
  const avatar = el('button', { class: 'dc-topbar-btn dcp-avatar-btn', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-label': 'حساب شما' },
    el('span', { class: 'dcp-avatar' }, initial));

  const menu = el('div', { class: 'dcp-avatar-menu', role: 'menu', hidden: 'hidden' }, [
    el('a', { class: 'dcp-avatar-item', href: '/plus/', role: 'menuitem' }, 'پیشخوان'),
    el('a', { class: 'dcp-avatar-item', href: '/plus/profile.html', role: 'menuitem' }, 'پروفایل'),
    el('button', { class: 'dcp-avatar-item', type: 'button', role: 'menuitem', onclick: async () => {
      await api.logout().catch(() => {});
      location.reload();
    } }, 'خروج'),
  ]);

  const toggle = (open) => {
    const show = open === undefined ? menu.hidden : open;
    menu.hidden = !show;
    avatar.setAttribute('aria-expanded', String(show));
  };
  avatar.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target) && e.target !== avatar) toggle(false); });

  const wrap = el('div', { class: 'dcp-avatar-wrap' }, [avatar, menu]);
  return wrap;
}

export async function initHeader() {
  const actions = document.querySelector('.dc-topbar .dc-topbar-actions');
  if (!actions || actions.dataset.dcpHeader) return;
  actions.dataset.dcpHeader = '1';

  // Move music + articles (cabinet) into the hamburger drawer.
  moveToDrawer(document.getElementById('btn-music-toggle'), 'موسیقی');
  moveToDrawer(document.getElementById('btn-cabinet'), 'مقاله‌ها');

  const user = await currentUser();

  // Streak flame: logged-in only, on every page, links to /plus.
  if (user) {
    const active = streakIsActive(user.last_active_day);
    actions.appendChild(buildFlame(user.current_streak, active));
  }
  // Person icon: guest -> login modal; logged-in -> avatar menu.
  actions.appendChild(buildPerson(user));
}
