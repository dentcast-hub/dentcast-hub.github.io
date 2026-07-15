// Full-screen overlay host for the dashboard and profile, opened from the header
// person menu (prototype feedback: پیشخوان and پروفایل open as overlays on any
// page, not as separate navigations). One overlay at a time.
import { el } from './util.js';

let current = null; // { type, node }

export function overlayType() { return current ? current.type : null; }
export function overlayOpen() { return !!current; }

export function closeOverlay() {
  if (!current) return;
  current.node.remove();
  current = null;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKey);
}

function onKey(e) { if (e.key === 'Escape') closeOverlay(); }

export function openOverlay(type, title, renderFn) {
  closeOverlay();
  const body = el('div', { class: 'dcp-overlay-body' });
  const node = el('div', { class: 'dcp-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
    el('div', { class: 'dcp-overlay-bar' }, [
      el('div', { class: 'dcp-overlay-title' }, title),
      el('button', { class: 'dcp-overlay-close', type: 'button', 'aria-label': 'بستن', onclick: closeOverlay }, '×'),
    ]),
    body,
  ]);
  document.body.appendChild(node);
  // Sit below the site header so its person icon stays visible and clickable to
  // toggle the overlay closed (the header is not covered).
  const topbar = document.querySelector('.dc-topbar');
  const top = topbar ? Math.max(0, Math.round(topbar.getBoundingClientRect().bottom)) : 0;
  node.style.top = top + 'px';
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKey);
  current = { type, node };
  renderFn(body);
  return node;
}
