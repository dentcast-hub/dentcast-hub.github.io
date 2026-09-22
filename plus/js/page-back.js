// «بازگشت» — the one link at the top of a destination page, pointing at where
// the reader CAME FROM rather than at a fixed parent.
//
// Every /plus page ships a static «بازگشت به پیشخوان» (or «بازگشت به سایت»),
// and the three chrome pages the premium tab leads to (/challenges/,
// /up-board/, /des-board/) shipped with no way back at all — a reader who
// tapped a card on the پریمیوم tab and landed on the challenges page had only
// the browser's own back button (founder, 1405/06/31: «رفت و برگشت رو شکوند»).
// The static link is also wrong more often than right: from the premium tab,
// «بازگشت به پیشخوان» leads to a page the reader was never on.
//
// The rule: the referrer decides. Same-origin homepage → back to the tab the
// reader left (`dc:panel`, the same key the homepage restores on load, so the
// label and the landing agree); the dashboard → «پیشخوان»; any other page of
// ours → «صفحهٔ قبل». No referrer, another site, or the page itself → the
// static link stays exactly as it shipped, which is what makes this additive.
// The click goes through `history.back()` when there is history to go back
// to — it restores scroll and the tab where a fresh load would not — and the
// href stays a real URL for a middle-click or a reader with no history.

const PANEL_LABEL = {
  'panel-premium': 'بازگشت به تب پریمیوم',
  'panel-sharehub': 'بازگشت به آرشیو',
  'panel-patient': 'بازگشت به تب بیماران',
};

function readPanel() {
  try { return sessionStorage.getItem('dc:panel') || ''; } catch (_) { return ''; }
}

const isHome = (p) => p === '/' || p === '/index.html';
const isDashboard = (p) => p === '/plus/' || p === '/plus/index.html';

/**
 * Where «بازگشت» should lead, or null to leave the static link alone.
 * Pure — every input is a parameter so the test can drive it.
 */
export function backTarget({ referrer = document.referrer, here = location, panel = readPanel() } = {}) {
  if (!referrer) return null;
  let ref;
  try { ref = new URL(referrer); } catch (_) { return null; }
  if (ref.origin !== here.origin) return null;
  if (ref.pathname === here.pathname) return null; // a filter change, a reload of a self-link
  if (isHome(ref.pathname)) return { href: '/', label: PANEL_LABEL[panel] || 'بازگشت به صفحهٔ اصلی' };
  if (isDashboard(ref.pathname)) return { href: '/plus/', label: 'بازگشت به پیشخوان' };
  // The dashboard is a hub: its exit is the site, never the page that led here
  // (a reader who pressed «بازگشت به پیشخوان» must not be bounced back).
  if (isDashboard(here.pathname)) return null;
  return { href: ref.pathname + ref.search + ref.hash, label: 'بازگشت به صفحهٔ قبل' };
}

/** Rewrite every back link on the page. Idempotent; a no-op without one. */
export function wirePageBack(root = document) {
  // Hosted inside the desktop shell's column-C viewer (?view=content, marked
  // by dc-nav.js before any module runs): the reader is already on the
  // homepage and the shell's sidebar is the way back. dc-theme.css hides the
  // link there; nothing is wired so a hidden link can never step the iframe
  // back to about:blank, which is what emptied column C (2026-09-21).
  if (document.body && document.body.classList.contains('dc-content-only')) return;
  const links = root.querySelectorAll('.dcp-page-back, [data-dc-back]');
  if (!links.length) return;
  const target = backTarget();
  links.forEach((a) => {
    if (a.dataset.dcBackWired) return;
    a.dataset.dcBackWired = '1';
    if (!target) return;
    a.setAttribute('href', target.href);
    a.textContent = target.label;
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (history.length <= 1) return;
      e.preventDefault();
      history.back();
    });
  });
}
