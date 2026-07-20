// Overlay host for the dashboard and profile, opened from the header person menu
// (prototype feedback: پیشخوان and پروفایل open as overlays on any page, not as
// separate navigations). One overlay at a time.
//
// Placement is layout-aware:
//  - Mobile: full-width sheet just below the site topbar, so the person icon
//    stays visible/clickable to toggle it closed.
//  - Desktop (.dcd-app 3-column UI): docked over the THIRD column (.dcd-col-c,
//    the article viewer) BELOW its own header — same sheet behaviour as mobile
//    but scoped to that column instead of covering the whole desktop UI, so the
//    sidebar and list columns stay usable.
import { el } from './util.js';

let current = null; // { type, node, reposition }

export function overlayType() { return current ? current.type : null; }
export function overlayOpen() { return !!current; }

// Constrain the fixed overlay to the right region for the current layout. Uses
// live geometry (getBoundingClientRect) so it tracks the grid's actual columns,
// and is re-run on resize. Setting left/right/bottom back to '' restores the CSS
// `inset:0` values for the mobile branch.
function positionOverlay(node) {
  const desktop = document.body.classList.contains('dc-desktop-ui');
  const colc = desktop ? document.querySelector('.dcd-col-c') : null;
  if (colc) {
    const r = colc.getBoundingClientRect();
    const hdr = colc.querySelector('.dcd-col-c-topbar');
    const top = hdr ? Math.round(hdr.getBoundingClientRect().bottom) : Math.round(r.top);
    node.style.top = top + 'px';
    node.style.left = Math.round(r.left) + 'px';
    node.style.right = Math.round(window.innerWidth - r.right) + 'px';
    node.style.bottom = Math.round(window.innerHeight - r.bottom) + 'px';
  } else {
    // Mobile (or desktop fallback): sit below the visible site header.
    const topbar = document.querySelector('.dc-topbar');
    const top = topbar ? Math.max(0, Math.round(topbar.getBoundingClientRect().bottom)) : 0;
    node.style.top = top + 'px';
    node.style.left = '';
    node.style.right = '';
    node.style.bottom = '';
  }
}

export function closeOverlay() {
  if (!current) return;
  current.node.remove();
  if (current.reposition) window.removeEventListener('resize', current.reposition);
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
  positionOverlay(node);
  const reposition = () => positionOverlay(node);
  window.addEventListener('resize', reposition);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKey);
  current = { type, node, reposition };
  renderFn(body);
  return node;
}
