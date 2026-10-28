/**
 * Keyboard focus for every modal surface (sheet, welcome card, premium popup,
 * login modal). Each declared role=dialog + aria-modal=true, and none kept the
 * promise: focus stayed on the page behind, Tab walked the skip link and the
 * sidebar under the backdrop, and closing dropped focus on <body>. One helper,
 * so the four surfaces can't drift apart again.
 *
 * trapFocus(dialog, { onEscape }) moves focus into `dialog`, keeps Tab and
 * Shift+Tab inside it, calls onEscape on Escape, and returns release(), which
 * removes the listener and hands focus back to whatever had it at open time
 * (if that element is still in the document). `opener` overrides that
 * element — a surface replacing another passes the first one's opener on.
 */

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', 'iframe',
  '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
].join(',');

function focusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((n) =>
    !n.hasAttribute('hidden') && !n.closest('[hidden]') && n.getAttribute('aria-hidden') !== 'true');
}

export function trapFocus(dialog, { onEscape, initial, opener: given } = {}) {
  const opener = given || document.activeElement;
  const onKey = (e) => {
    if (e.key === 'Escape') {
      if (onEscape) { e.preventDefault(); onEscape(e); }
      return;
    }
    if (e.key !== 'Tab') return;
    const list = focusables(dialog);
    if (!list.length) { e.preventDefault(); dialog.focus(); return; }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (!dialog.contains(active)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
    if (e.shiftKey && (active === first || active === dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  const target = initial || focusables(dialog)[0] || dialog;
  try { target.focus({ preventScroll: true }); } catch (_) { /* detached */ }
  let released = false;
  return function release({ restore = true } = {}) {
    if (released) return opener;
    released = true;
    document.removeEventListener('keydown', onKey, true);
    if (restore && opener && opener !== document.body && typeof opener.focus === 'function' && document.contains(opener)) {
      try { opener.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
    }
    return opener;
  };
}
