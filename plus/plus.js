// DentCast Plus bootstrap. Loaded on every page by dc-nav.js as progressive
// enhancement. It decides the page type and wires only what belongs there. For
// anonymous visitors the page must look exactly as before except the two
// invitation points (spec 2.3): the workbench button and the homepage card.
import { detectContentId, findProseRoot, INVITE_LINE, SS_MODE, SS_RETURN_STUDY, isOrgHost } from './js/config.js';
import { currentUser, api } from './js/api.js';
import { openLoginModal, openOrgNotice } from './js/login-modal.js';
import { el } from './js/util.js';
import { initHomeCard } from './js/home-card.js';
import { initHeader } from './js/header.js';
import { initReadingTracker } from './js/reading.js';

// Carry plus.js's own cache-busting version (?v=N, set by dc-nav.js) onto the
// workbench module import. Article pages are OUTSIDE the /plus/ service-worker
// scope, so their module requests hit the plain browser HTTP cache — an
// unversioned import would keep serving a stale workbench.js even after V is
// bumped. Versioning the URL forces the fresh module. Bump V in dc-nav.js when
// workbench.js (or a module it pulls in) changes.
const PLUS_V = new URL(import.meta.url).search; // e.g. '?v=12'
const loadWorkbench = () => import('./js/workbench.js' + PLUS_V).then((m) => m.Workbench);

function injectWorkbenchButton(main, proseRoot) {
  const btn = el('button', { class: 'dcp-wb-button', type: 'button', 'aria-pressed': 'false' }, 'میز کار');
  // Place it at the top of the article, just before the readable prose.
  const anchor = proseRoot;
  anchor.parentNode.insertBefore(el('div', { class: 'dcp-wb-bar' }, [btn]), anchor);
  return btn;
}

function showInvitation(anchorBtn, onProceed) {
  const existing = document.querySelector('.dcp-invite');
  if (existing) existing.remove();
  const proceed = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  const dismiss = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'بعدا');
  const box = el('div', { class: 'dcp-invite', role: 'dialog', 'aria-label': 'دعوت به میز کار' }, [
    el('p', { class: 'dcp-invite-line' }, INVITE_LINE),
    el('div', { class: 'dcp-invite-actions' }, [proceed, dismiss]),
  ]);
  anchorBtn.parentNode.insertBefore(box, anchorBtn.nextSibling);
  proceed.onclick = () => { box.remove(); onProceed(); };
  dismiss.onclick = () => box.remove();
}

async function initArticle() {
  const main = document.querySelector('main.article-content-wrap');
  const proseRoot = findProseRoot();
  if (!main || !proseRoot) return; // not an article page

  const contentId = detectContentId();
  const Workbench = await loadWorkbench();
  const wb = new Workbench({ contentId, proseRoot });
  const btn = injectWorkbenchButton(main, proseRoot);

  // Reading-completion signal: started only for a signed-in reader (the /activity
  // endpoint requires auth) and only once per page. Guarded so a mid-page login
  // does not start a second tracker.
  let readingStarted = false;
  function startReading() {
    if (readingStarted) return;
    readingStarted = true;
    initReadingTracker({ contentId, proseRoot });
  }

  function updateBtn() {
    const on = wb.isActive();
    btn.textContent = on ? 'خروج از میز کار' : 'میز کار';
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-active', on);
  }

  async function onClick() {
    // .org gate (temporary): Plus login cannot work cross-site on the .org
    // hosts, so instead of the OTP flow show the dentcast.ir notice. The anon
    // demand signal is still logged (inside openOrgNotice, marked org:workbench).
    if (isOrgHost()) { openOrgNotice({ source: 'workbench', contentId }); return; }
    const user = await currentUser({ refresh: true });
    if (!user) {
      // Anonymous invitation point: log the demand signal, show one sentence,
      // then OTP login carrying return_to. Never dump on the homepage after.
      api.anonEvent('workbench_button_anon_click', contentId).catch(() => {});
      showInvitation(btn, async () => {
        sessionStorage.setItem(SS_RETURN_STUDY, location.pathname);
        const res = await openLoginModal({ returnTo: location.pathname });
        if (res && res.user) {
          sessionStorage.removeItem(SS_RETURN_STUDY);
          startReading(); // now authenticated: begin counting this read
          await wb.enter();
          updateBtn();
        }
      });
      return;
    }
    if (wb.isActive()) wb.exit(); else await wb.enter();
    updateBtn();
  }
  btn.addEventListener('click', onClick);

  // Post-login return-to-study (the funnel) or a remembered choice this session.
  // Never auto-enters on a fresh visit: sessionStorage is empty then.
  const user = await currentUser();
  if (user) startReading(); // count this read for an already-signed-in visitor
  const returnStudy = sessionStorage.getItem(SS_RETURN_STUDY);
  if (user && returnStudy === location.pathname) {
    sessionStorage.removeItem(SS_RETURN_STUDY);
    await wb.enter();
    updateBtn();
  } else if (user && sessionStorage.getItem(SS_MODE + contentId) === 'study') {
    await wb.enter();
    updateBtn();
  }
}

// The per-folder flashcard section on landing pages was removed for the free
// version. Highlighting (میز کار) stays; the review/flashcard system moves to the
// premium scheduled-review layer later. No landing-page flashcard injection.

// The workbench (میز کار) and its login now run on ALL viewports — the old
// desktop-off gate is removed. The static reading layout is untouched: on an
// article page Plus only ADDS the میز کار button above the prose and the header
// person/streak icons (the login entry), exactly as on mobile. In study mode the
// desktop/mobile difference is purely CSS — the TOC/notes panels are
// viewport-fixed side rails in the empty article margins on desktop (see
// plus.css min-width 1100) and toggled bottom sheets on mobile — both respond to
// resize live, so no reload is needed when the viewport crosses the breakpoint.
//
// The homepage home card renders on every viewport. It was previously kept
// mobile-only, which left desktop showing the plain static homepage without the
// personal Plus card. The card slot (#dcPlusHomeCard) lives in the shared
// #mobile-body column that desktop shows too, so initializing it everywhere just
// fills that slot on desktop as well.

function boot() {
  try {
    initHeader();
    initArticle();
    initHomeCard(); // homepage personal card on all viewports (desktop + mobile)
  } catch (e) {
    // Progressive enhancement: never break the page.
    if (window.console) console.warn('[plus] init failed', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
