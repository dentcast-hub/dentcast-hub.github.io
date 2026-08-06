import { el } from './util.js';

/**
 * The bottom sheet — one implementation, for every surface that needs to ask
 * something without leaving the page.
 *
 * It was written inside collections.js for the "save to board" chooser, and the
 * moment a second surface wanted the same thing (the achievements wall, where a
 * badge opens its levels and its copy) the choice was to copy twenty-five lines
 * or to move them here. hl-view.js exists for exactly this reason — two pages
 * drawing the same object two different ways — so this follows that rule rather
 * than re-learning it.
 *
 * Mobile-first: slides up from the bottom, and plus-desktop.css turns it into a
 * centered dialog from tablet width up. Styles live in plus.css (.dcp-sheet*);
 * this module owns only the behaviour: one sheet at a time, Escape closes,
 * clicking the backdrop closes, and the node is removed only after the exit
 * transition so it never disappears mid-slide.
 */

let sheetOverlay = null;

function onSheetKey(e) { if (e.key === 'Escape') closeSheet(); }

export function closeSheet() {
  if (!sheetOverlay) return;
  const { overlay, sheet } = sheetOverlay;
  overlay.classList.remove('is-open');
  sheet.classList.remove('is-open');
  document.removeEventListener('keydown', onSheetKey);
  setTimeout(() => overlay.remove(), 300);
  sheetOverlay = null;
}

/** Open `card` (any element) in a sheet. Opening one closes whatever was open. */
export function openSheet(card) {
  closeSheet();
  const sheet = el('div', { class: 'dcp-sheet', role: 'dialog', 'aria-modal': 'true' }, [
    el('div', { class: 'dcp-sheet-handle' }),
    card,
  ]);
  const overlay = el('div', {
    class: 'dcp-sheet-overlay',
    onclick: (e) => { if (e.target === overlay) closeSheet(); },
  }, [sheet]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onSheetKey);
  sheetOverlay = { overlay, sheet };
  requestAnimationFrame(() => { overlay.classList.add('is-open'); sheet.classList.add('is-open'); });
}
