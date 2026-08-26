// مسیر بازگشت — a small, ADDITIVE "return to where you were" affordance for
// article pages. Distinct from the static «برگشت به صفحه‌ی قبل» footer link
// (which always points at the section's own index.html): this one points at
// the SPECIFIC place the reader actually came from — a learning pathway, a
// bundle, قطب‌نمای مطالعه, آپ‌بورد, a pillar page, a collection, or پیشخوان —
// and only appears when one of those actually sent the reader here.
//
// Design: a source (pathways.js, reading-compass.js, …) calls markReturnTrail()
// right before its link navigates. The article side calls mountReturnTrail() —
// from the SAME place plus.js already mounts the میز کار row, so this works
// identically on a standalone article page and on the desktop shell's injected
// column-C fragment, with no HTML added to any article page.
import { el, icon } from './util.js?v=30';

const SS_KEY = 'dcp:return-trail';
// A reasonable reading session — long enough that a reader who spends a while
// on the article still finds it, short enough that a link revisited weeks
// later (bookmarked, reshared) never shows a stale, misleading breadcrumb.
const TTL_MS = 45 * 60 * 1000;

/** Called by a source page, right before its own <a href> navigates the
 * reader into an article. Fire-and-forget: sessionStorage can throw in
 * private-browsing edge cases, and a return trail is a convenience, never
 * something worth taking a click down for. */
export function markReturnTrail({ url, eyebrow, title, iconId }) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify({ url, eyebrow, title, iconId, ts: Date.now() }));
  } catch (_) { /* ignore */ }
}

function readTrail() {
  let raw;
  try { raw = sessionStorage.getItem(SS_KEY); } catch (_) { return null; }
  if (!raw) return null;
  let rec;
  try { rec = JSON.parse(raw); } catch (_) { return null; }
  if (!rec || !rec.url || Date.now() - rec.ts > TTL_MS) {
    try { sessionStorage.removeItem(SS_KEY); } catch (_) { /* ignore */ }
    return null;
  }
  return rec;
}

function clearTrail() {
  try { sessionStorage.removeItem(SS_KEY); } catch (_) { /* ignore */ }
}

// Only the real, fixed site header competes for the same viewport row — the
// desktop shell overrides its OWN copy (.dcd-col-c-topbar.dc-topbar) back to
// `position:relative`, in flow above the column's scroll area, so it needs no
// offset there. document.querySelector('.dc-topbar') finds that real, fixed
// header first on a standalone page (the only one in the document).
function stickyTopOffset() {
  const bar = document.querySelector('.dc-topbar');
  if (bar && getComputedStyle(bar).position === 'fixed') {
    return Math.round(bar.getBoundingClientRect().height);
  }
  return 0;
}

/**
 * Mount the return-trail chip as the FIRST child of `container` — above the
 * title, above the action row, above everything. `container` is the same
 * element ensureActionRow() hangs the action row off of (findProseBox()'s
 * parent): main.article-content-wrap on a standalone page, the injected
 * fragment root on the desktop shell.
 *
 * No-ops silently when there is no fresh record — an organic visit (search,
 * a shared link, typing the URL) must look exactly like it does today.
 */
export function mountReturnTrail(container) {
  if (!container || document.getElementById('dcpReturnTrail')) return;
  const rec = readTrail();
  if (!rec) return;

  const goBack = () => clearTrail(); // one-shot: the record is spent once followed

  const dismissBtn = el('button', {
    class: 'dcp-trail-dismiss', type: 'button', 'aria-label': 'پنهان‌کردنِ این راهنما',
    title: 'پنهان‌کردن',
  }, icon('icon-x', { class: 'dc-icon' }));

  const chip = el('a', { class: 'dcp-trail', href: rec.url, onclick: goBack }, [
    el('span', { class: 'dcp-trail-caret' }, icon('icon-back', { class: 'dc-icon' })),
    el('span', { class: 'dcp-trail-ico' }, icon(rec.iconId || 'icon-link', { class: 'dc-icon' })),
    el('span', { class: 'dcp-trail-text' }, [
      el('span', { class: 'dcp-trail-eyebrow' }, rec.eyebrow || ''),
      el('span', { class: 'dcp-trail-title' }, rec.title || rec.eyebrow || ''),
    ]),
  ]);

  dismissBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTrail();
    anchor.remove();
    stickyWrap.remove();
    io.disconnect();
  });

  const anchor = el('div', { class: 'dcp-trail-anchor', id: 'dcpReturnTrail' }, [chip, dismissBtn]);

  const pill = el('a', { class: 'dcp-trail-pill', href: rec.url, onclick: goBack, 'aria-hidden': 'true', tabindex: '-1' }, [
    icon(rec.iconId || 'icon-link', { class: 'dc-icon' }),
    el('span', {}, rec.title || rec.eyebrow || ''),
  ]);
  const stickyWrap = el('div', { class: 'dcp-trail-sticky', style: 'top:' + stickyTopOffset() + 'px' }, pill);

  container.insertBefore(stickyWrap, container.firstChild);
  container.insertBefore(anchor, container.firstChild);

  const io = new IntersectionObserver((entries) => {
    stickyWrap.classList.toggle('is-shown', !entries[0].isIntersecting);
  }, { threshold: 0 });
  io.observe(chip);
}
