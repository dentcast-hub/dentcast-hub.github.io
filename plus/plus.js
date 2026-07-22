// DentCast Plus bootstrap. Loaded on every page by dc-nav.js as progressive
// enhancement. It decides the page type and wires only what belongs there. For
// anonymous visitors the page must look exactly as before except the two
// invitation points (spec 2.3): the workbench button and the homepage card.
import { detectContentId, findProseRoot, PROSE_SELECTORS, INVITE_LINE, SS_MODE, SS_RETURN_STUDY, isOrgHost } from './js/config.js';
import { currentUser, api } from './js/api.js';
import { openLoginModal, openOrgNotice } from './js/login-modal.js';
import { el } from './js/util.js';
import { initHomeCard } from './js/home-card.js';
import { initHeader } from './js/header.js';
import { initReadingTracker } from './js/reading.js';
import { initListeningTracker } from './js/listening.js';

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

// Wire the میز کار button + study mode onto a prose root. Shared by standalone
// article pages (initArticle) and the desktop 3-column viewer (mountArticleWorkbench).
async function setupWorkbench({ proseRoot, contentId }) {
  const Workbench = await loadWorkbench();
  const wb = new Workbench({ contentId, proseRoot });
  const btn = injectWorkbenchButton(proseRoot, proseRoot);

  // Reading-completion signal: started only for a signed-in reader (the /activity
  // endpoint requires auth) and only once. Guarded so a mid-page login does not
  // start a second tracker.
  let readingStarted = false;
  const startReading = () => {
    if (readingStarted) return;
    readingStarted = true;
    initReadingTracker({ contentId, proseRoot });
  };
  const updateBtn = () => {
    const on = wb.isActive();
    btn.textContent = on ? 'خروج از میز کار' : 'میز کار';
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-active', on);
  };

  btn.addEventListener('click', async () => {
    // .org gate (temporary): Plus login cannot work cross-site on the .org hosts,
    // so instead of the OTP flow show the dentcast.ir notice.
    if (isOrgHost()) { openOrgNotice({ source: 'workbench', contentId }); return; }
    const user = await currentUser({ refresh: true });
    if (!user) {
      api.anonEvent('workbench_button_anon_click', contentId).catch(() => {});
      showInvitation(btn, async () => {
        sessionStorage.setItem(SS_RETURN_STUDY, location.pathname);
        const res = await openLoginModal({ returnTo: location.pathname + location.search });
        if (res && res.user) {
          sessionStorage.removeItem(SS_RETURN_STUDY);
          startReading();
          await wb.enter();
          updateBtn();
        }
      });
      return;
    }
    if (wb.isActive()) wb.exit(); else await wb.enter();
    updateBtn();
  });

  const user = await currentUser();
  if (user) startReading(); // count this read for an already-signed-in visitor
  return { wb, updateBtn };
}

async function initArticle() {
  const main = document.querySelector('main.article-content-wrap');
  const proseRoot = findProseRoot();
  if (!main || !proseRoot) return; // not a standalone article page

  const contentId = detectContentId();
  const { wb, updateBtn } = await setupWorkbench({ proseRoot, contentId });

  // Post-login return-to-study (the funnel) or a remembered choice this session.
  // Never auto-enters on a fresh visit: sessionStorage is empty then.
  const user = await currentUser();
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

// Desktop 3-column viewer: the homepage loads an article IN PLACE inside
// #dcd-content-area (openContent), stripping dc-nav/plus, so the workbench must
// be mounted explicitly. openContent calls this after injecting the article.
// content_id comes from the article URL (the address bar still shows the
// homepage). Re-mounting first tears down the previous in-place workbench.
let desktopWb = null;
async function mountArticleWorkbench(root, url) {
  if (desktopWb) { try { desktopWb.exit(); } catch (_) { /* ignore */ } desktopWb = null; }
  if (!root || !url) return;
  let proseRoot = null;
  for (const sel of PROSE_SELECTORS) { const found = root.querySelector(sel); if (found) { proseRoot = found; break; } }
  if (!proseRoot) return; // not an article (e.g. a viewer / patients panel)
  const contentId = url.replace(/^\/+/, '').replace(/\.html$/i, '') || detectContentId();
  markViewed(contentId); // record the open for the landing-page "seen" ticks
  const { wb } = await setupWorkbench({ proseRoot, contentId });
  desktopWb = wb;
}
if (typeof window !== 'undefined') window.dcpMountArticleWorkbench = mountArticleWorkbench;

// --- "seen" ticks (a Plus benefit; account-scoped → follows the user across
// devices). A logged-in reader opening an article records `article_viewed`; a
// landing page then greens the ticks next to content they've already seen.
// Anonymous visitors get nothing — kept purely a Plus feature.
//
// Content folders that get ticks: everything EXCEPT litecast & glossary (product
// choice). Path-based (not the taxonomy index), so it also covers content the
// brain doesn't pillar-map (sharehub, most notecast, ...) and nested content like
// dentai/promptologist/… (matched by its top folder 'dentai').
const SEEN_FOLDERS = new Set([
  'episodes', 'notecast', 'insight', 'dentai', 'chairside', 'metanotes', 'photocast', 'sharehub', 'dentcast-plus',
]);
function isSeenContent(contentId) {
  const parts = (contentId || '').split('/');
  return parts.length >= 2 && SEEN_FOLDERS.has(parts[0]); // a real article, in a ticked folder
}

async function markViewed(contentId) {
  if (!isSeenContent(contentId)) return;
  const key = 'dcp:viewed:' + contentId; // fire at most once per session per article
  if (sessionStorage.getItem(key)) return;
  const user = await currentUser();
  if (!user) return; // Plus-only
  sessionStorage.setItem(key, '1');
  api.activity('article_viewed', contentId).catch(() => {});
}

async function initSeenTicks() {
  const user = await currentUser();
  if (!user) return; // Plus-only: no ticks for anonymous visitors
  const here = detectContentId();
  const links = [];
  document.querySelectorAll('a[href]').forEach((a) => {
    let cid;
    try {
      const u = new URL(a.getAttribute('href'), location.href);
      if (u.origin !== location.origin) return;
      cid = u.pathname.replace(/^\/+/, '').replace(/\.html$/i, '');
    } catch (_) { return; }
    if (cid !== here && isSeenContent(cid)) links.push({ a, cid });
  });
  if (links.length < 2) return; // not a list/landing page → skip
  let seen;
  try { const r = await api.seen(); seen = new Set(r.seen || []); }
  catch (_) { return; }
  for (const { a, cid } of links) {
    if (a.querySelector('.dcp-seen-tick')) continue; // already decorated
    const on = seen.has(cid);
    a.insertBefore(el('span', {
      class: 'dcp-seen-tick' + (on ? ' is-seen' : ''), 'aria-hidden': 'true',
      title: on ? 'دیده‌اید' : 'هنوز ندیده‌اید',
    }, '✓'), a.firstChild);
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

// Listening signal (audio twin of the reading tracker). Two entry points:
//  1. Episode pages carry their own <audio id="ep-audio"> and their URL IS the
//     episode, so we attach here using the page's own content_id.
//  2. The shared player (player.html) plays many episodes over its lifetime from
//     one <audio> element, so it calls window.dcpTrackListening(contentId, audio)
//     on each episode switch; we tear down the previous tracker and start a fresh
//     one for the new content_id.
function initListening() {
  const audioEl = document.getElementById('ep-audio');
  if (!audioEl) return; // not an episode page (the shared player wires itself)
  initListeningTracker({ contentId: detectContentId(), audioEl });
}

let sharedListen = null;
function trackListening(contentId, audioEl) {
  if (sharedListen && sharedListen.stop) { try { sharedListen.stop(); } catch (_) { /* ignore */ } }
  sharedListen = initListeningTracker({ contentId, audioEl });
}
if (typeof window !== 'undefined') window.dcpTrackListening = trackListening;

function boot() {
  try {
    initHeader();
    initArticle();
    initListening(); // episode-page audio → episode_listened
    initHomeCard(); // homepage personal card on all viewports (desktop + mobile)
    markViewed(detectContentId()); // mark THIS content page seen on open (any folder, incl. episodes)
    initSeenTicks(); // landing pages: green ticks next to already-seen content
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
