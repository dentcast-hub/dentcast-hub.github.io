// DentCast Plus bootstrap. Loaded on every page by dc-nav.js as progressive
// enhancement. It decides the page type and wires only what belongs there. For
// anonymous visitors the page must look exactly as before except the two
// invitation points (spec 2.3): the workbench button and the homepage card.
import { detectContentId, findProseRoot, findProseBox, INVITE_LINE, SS_MODE, SS_RETURN_STUDY, isOrgHost } from './js/config.js';
import { currentUser, api } from './js/api.js';
import { openLoginModal, openOrgNotice } from './js/login-modal.js';
import { openCollectionPicker } from './js/collections.js';
import { el } from './js/util.js';
import { initHomeCard } from './js/home-card.js';
import { initHomeFeatures } from './js/home-features.js';
import { initHomeBundles } from './js/home-bundles.js';
import { initHomeUpboard } from './js/home-upboard.js';
import { initHeader } from './js/header.js';
import { initTourAutostart } from './js/tour.js';
import { initReadingTracker } from './js/reading.js';
import { initListeningTracker } from './js/listening.js';
import { initShareScoring, buildShareButton } from './js/share.js';
import { initHeart, buildHeartChip } from './js/votes.js';
import { mountArticleThreads } from './js/article-threads.js';

// Carry plus.js's own cache-busting version (?v=N, set by dc-nav.js) onto the
// workbench module import. Article pages are OUTSIDE the /plus/ service-worker
// scope, so their module requests hit the plain browser HTTP cache — an
// unversioned import would keep serving a stale workbench.js even after V is
// bumped. Versioning the URL forces the fresh module. Bump V in dc-nav.js when
// workbench.js (or a module it pulls in) changes.
const PLUS_V = new URL(import.meta.url).search; // e.g. '?v=12'
const loadWorkbench = () => import('./js/workbench.js' + PLUS_V).then((m) => m.Workbench);

// Beside میزکار (always visible - no need to enter study mode) sits a second,
// single-purpose button that saves the WHOLE page to a collection. This is
// deliberately a separate control from the workbench toolbar's own
// "افزودنِ هایلایت به کالکشن" button (see workbench.js's _collectionButton) -
// one control per action, never a mode that guesses which one you meant.
// openCollectionPicker already handles anon (-> login) and free (-> premium
// upsell) on its own, so no gating logic is needed here.
function injectCollectionButton(contentId) {
  const cap = el('p', { class: 'dcp-wb-cap' }, 'با این دکمه، کلِ همین صفحه (نه یک هایلایتِ خاص) به یکی از کالکشن‌های خودت اضافه می‌شود.');
  cap.hidden = true;
  const info = el('button', {
    class: 'dcp-wb-info', type: 'button', 'aria-label': 'کالکشن یعنی چی؟', title: 'کالکشن یعنی چی؟',
    onclick: () => { cap.hidden = !cap.hidden; },
  }, '؟');
  const btn = el('button', {
    class: 'dc-act dc-act-outline', type: 'button',
    onclick: () => openCollectionPicker({ contentId }),
  }, 'افزودن به کالکشن');
  return { btn, info, cap };
}

/**
 * Find the article's action row, or build one.
 *
 * dc-nav.js builds it on a standalone article page (phase 7b) and fills the
 * quiet group; here we fill the main one. On the desktop shell that script is
 * stripped out of the fetched article, so there is nothing to find and this
 * module builds the whole row instead — the same two-surface split
 * buildShareButton() already makes, expressed once for the container rather
 * than once per button.
 *
 * `anchorEl` is the article's opening prose box, NOT its body root: on the
 * legacy NoteCast template those differ (the root is the container holding the
 * section boxes), and hanging the row off the root would put it outside <main>,
 * above the article's own title.
 */
function ensureActionRow(anchorEl) {
  const found = document.getElementById('dcActionRow');
  if (found) {
    return {
      row: found,
      main: found.querySelector('.dc-actions-main'),
      aux: found.querySelector('.dc-actions-aux'),
      built: false,
    };
  }
  const main = el('div', { class: 'dc-actions-main' });
  const aux = el('div', { class: 'dc-actions-aux' });
  const row = el('div', { class: 'dc-actions', id: 'dcActionRow' }, [main, aux]);
  anchorEl.parentNode.insertBefore(row, anchorEl);
  return { row, main, aux, built: true };
}

// The article's action row: میز کار / افزودن به کالکشن / پسندیدم together in
// the main group, in that order — the thing this page is FOR, the thing you do
// with it, the thing you say about it.
function injectActionRow(anchorEl, contentId, shareTarget) {
  const btn = el('button', { class: 'dc-act dc-act-primary', type: 'button', 'aria-pressed': 'false' }, 'میز کار');
  const { btn: collectBtn, info: collectInfo, cap: collectCap } = injectCollectionButton(contentId);
  const { row, main, aux, built } = ensureActionRow(anchorEl);

  // Share belongs to whoever built the row. On a standalone page dc-nav.js has
  // already put its own chip in the quiet group (`#dcShareBtn`); only when we
  // built the row ourselves — the desktop shell — is there none to find.
  if (built && shareTarget && !document.getElementById('dcShareBtn')) {
    aux.appendChild(buildShareButton(shareTarget));
  }
  // The heart is mounted at boot by initHeart() wherever a row already exists,
  // which on a standalone page is before this async path gets here. So build one
  // only if none arrived — on the shell, that is always.
  const heart = document.querySelector('.dcp-like')
    ? null
    : buildHeartChip(contentId, 'dc-act dc-act-heart');

  // prepend, not append: initHeart() may already have put the قلب in here, and
  // the order this row reads in is میز کار › کالکشن › پسندیدم. Prepending the
  // three of them in one call puts them ahead of it without caring whether it
  // is there.
  main.prepend(btn, collectBtn, collectInfo);
  if (heart) main.appendChild(heart);
  row.appendChild(collectCap); // full-width, below both groups
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
async function setupWorkbench({ proseRoot, proseAnchor, contentId, shareTarget }) {
  const Workbench = await loadWorkbench();
  // onChange keeps the button below in sync with the mode no matter WHO changed
  // it. The toolbar's own ✕ خروج calls wb.exit() directly, so without this the
  // article button kept saying «خروج از میز کار» after the workbench had closed.
  const wb = new Workbench({ contentId, proseRoot, onChange: () => updateBtn() });
  const btn = injectActionRow(proseAnchor || proseRoot, contentId, shareTarget);

  // Reading-completion signal: started only for a signed-in reader (the /activity
  // endpoint requires auth) and only once. Guarded so a mid-page login does not
  // start a second tracker.
  //
  // LiteCast is the ONE readable type excluded from the streak (product rule).
  // Today it happens to carry no prose container so it never reaches here, but we
  // guard EXPLICITLY too, so even if a LiteCast page later gains a .text-box it
  // still never fires article_completed. Every other readable type lights the
  // streak; audio episodes light it via episode_listened instead.
  const streakExcluded = /^litecast\//.test(contentId);
  let readingStarted = false;
  const startReading = () => {
    if (readingStarted || streakExcluded) return;
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

// ?dcphl=<highlight_id> — "take me to THIS highlight". Every link out of the
// highlight library (/plus/highlights.html), the dashboard's recent list and a
// collection carries it, because the article page draws none of the reader's
// highlights until study mode is on: without this, following your own note
// dropped you at the top of an article that looked untouched and you had to
// press «میز کار» yourself to see anything (user report, 2026-08-05).
function deepLinkHighlightId() {
  try { return new URLSearchParams(location.search).get('dcphl') || null; }
  catch (_) { return null; }
}

async function openDeepLinkedHighlight(wb, updateBtn, id) {
  if (!id) return false;
  if (!wb.isActive()) { await wb.enter(); if (updateBtn) updateBtn(); }
  // enter() has already loaded and drawn the marks, so the id resolves now.
  // A highlight whose anchor no longer matches an edited article simply does
  // not scroll — the page itself is still the right destination.
  wb.focusHighlight(id);
  return true;
}

// An audio episode gets an action row too — but a SHORTER one: قلب and
// اشتراک‌گذاری, and nothing else. It bows out of initArticle() below (there is
// no workbench for a podcast, because highlighting one makes no sense), and the
// consequence nobody had noticed was that the 209 episode pages had no قلب at
// all: initHeart() mounts into a row, and on these pages no script built one.
// So they were the only content on the site a reader could not press پسندیدم on,
// while sitting in up-board's catalog like everything else — 210 of its 444
// entries, rankable by an engagement they earn (`episode_listened` is one of the
// four actions the score counts) and by hearts they could not receive.
//
// Nothing is added to the page markup here, on purpose: the episode pages are
// built from tools/episodes_template.html, and a row in the template would mean
// rebuilding 209 files for something the shared module can put there for free —
// the same reason no article page carries this markup either.
function initEpisodeActions() {
  if (!document.getElementById('ep-audio')) return; // not an audio episode
  if (document.getElementById('dcActionRow')) return;
  const box = findProseBox();
  if (!box) return;
  const { aux } = ensureActionRow(box);
  aux.appendChild(buildShareButton(() => ({ title: document.title, url: location.href })));
  // The قلب itself is left to initHeart(), which boot() calls a line later and
  // which is the single mounting point for every surface that has this row.
}

async function initArticle() {
  const main = document.querySelector('main.article-content-wrap');
  const proseRoot = findProseRoot();
  if (!main || !proseRoot) return; // not a standalone article page
  // Audio content (episodes) shares the .ep-box shell but gets NO workbench —
  // highlighting a podcast makes no sense; it only gets the "seen" tick (fired
  // from boot) and the short row initEpisodeActions() builds. The audio player
  // element is the reliable tell.
  if (document.getElementById('ep-audio')) return;

  const contentId = detectContentId();
  // A share target for the pages dc-nav.js's phase 7 never reaches — the 12
  // پرامپتولوژیست chapters, whose shell is `.ep-box` and which load no
  // dc-article.css, so nothing built them a share chip and they simply had none.
  // injectActionRow uses it ONLY when it had to build the row itself, so on the
  // 197 pages dc-nav.js does cover, the chip stays that script's and there is no
  // second button for the same act.
  const shareTarget = () => ({ title: document.title, url: location.href });
  const { wb, updateBtn } = await setupWorkbench({
    proseRoot, proseAnchor: findProseBox(), contentId, shareTarget,
  });
  // گفت‌وگوی زیر مطلب, under the prose. Draws itself lazily and removes itself
  // when there is nothing published and this reader cannot write.
  mountArticleThreads(findProseBox() || proseRoot, contentId);

  // Post-login return-to-study (the funnel) or a remembered choice this session.
  // Never auto-enters on a fresh visit: sessionStorage is empty then.
  const user = await currentUser();
  // A ?dcphl= link is an explicit "open my highlight" request and outranks both
  // of those — it is the only case where a FIRST visit to a page opens study
  // mode, and it is one the reader asked for by clicking.
  if (user && await openDeepLinkedHighlight(wb, updateBtn, deepLinkHighlightId())) {
    sessionStorage.removeItem(SS_RETURN_STUDY);
    return;
  }
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
  // Scoped to the injected article: the homepage around it has boxes of its own,
  // so a document-wide lookup would find one of those first.
  const proseRoot = findProseRoot(root);
  if (!proseRoot) return; // not an article (e.g. a viewer / patients panel)
  // The url may carry ?dcphl=<id> (a highlight deep link) and/or a hash; neither
  // is part of the content_id.
  const [path, query] = url.split('#')[0].split('?');
  const contentId = path.replace(/^\/+/, '').replace(/\.html$/i, '') || detectContentId();
  markViewed(contentId); // record the open for the landing-page "seen" ticks
  // Re-aim share crediting at the article now on screen. Done BEFORE the
  // episode early-return, because a podcast can be shared too — it just gets no
  // workbench, and therefore no button of its own on this surface.
  initShareScoring(contentId);
  // The address bar still shows the homepage here, so the article's own URL has
  // to be carried in — and stripped of ?dcphl / #hash, which are this reader's
  // private position in the page, not part of what they mean to send anyone.
  const shareUrl = new URL(path, location.origin).href;
  const shellShare = () => ({
    title: (root.querySelector('h1')?.textContent || document.title).trim(),
    url: shareUrl,
  });
  if (contentId.startsWith('episodes/')) {
    // Audio: seen tick and the short row, never a workbench. Without this the
    // قلب would exist for a phone reader opening an episode and not for a
    // desktop one opening the same episode in column C — the exact split
    // buildShareButton() was written to close, and one this feature would make
    // again for its own 210 pages.
    const box = findProseBox(root);
    if (box && !root.querySelector('#dcActionRow')) {
      const { main, aux } = ensureActionRow(box);
      main.appendChild(buildHeartChip(contentId, 'dc-act dc-act-heart'));
      aux.appendChild(buildShareButton(shellShare));
    }
    return;
  }
  const { wb, updateBtn } = await setupWorkbench({
    proseRoot,
    proseAnchor: findProseBox(root),
    contentId,
    shareTarget: shellShare,
  });
  desktopWb = wb;
  mountArticleThreads(findProseBox(root) || proseRoot, contentId);
  const hlId = query ? new URLSearchParams(query).get('dcphl') : null;
  if (hlId && await currentUser()) await openDeepLinkedHighlight(wb, updateBtn, hlId);
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
  // litecast joined 2026-08-11: the homepage category grid shows a seen-tick
  // slot on EVERY cell, so every cell must be earnable — a permanently grey
  // tick reads as broken, not as "out of scope".
  'litecast',
]);
function isSeenContent(contentId) {
  const parts = (contentId || '').split('/');
  if (!SEEN_FOLDERS.has(parts[0])) return false;
  // a real article (folder/slug), a section index (trailing slash → ['x','']),
  // or an archive page whose id IS the bare folder name (episodes.html →
  // 'episodes') — that last one is what lets the اپیزودها grid cell earn its
  // tick like every other cell.
  return parts.length >= 2 || contentId === parts[0];
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
//  1. An audio content page carries its own <audio> and its URL IS the episode,
//     so we attach here using the page's own content_id. Podcast episode pages
//     tag it #ep-audio because their custom transport needs the handle; NoteCast
//     pages ship a bare native <audio controls> with NO id, so the id lookup
//     alone found nothing there and listening earned nothing on 40 pages. Hence
//     the fallback to the first <audio> inside <main>.
//     Scoped to <main> deliberately: player.html's shared <audio id="dc-audio">
//     sits OUTSIDE <main> (.dc-wrapper > .dc-main-player), so the fallback can
//     never grab it and mislog every episode under the content_id "player" — it
//     wires itself through entry point 2 instead.
//     #ep-audio stays first so episode pages resolve exactly as before, and the
//     separate #ep-audio gate in initArticle is deliberately NOT relaxed:
//     NoteCast keeps its میز کار (it is a text page that also has audio) and
//     merely gains the listening signal it was missing.
//  2. The shared player (player.html) plays many episodes over its lifetime from
//     one <audio> element, so it calls window.dcpTrackListening(contentId, audio)
//     on each episode switch; we tear down the previous tracker and start a fresh
//     one for the new content_id.
function initListening() {
  const audioEl = document.getElementById('ep-audio') || document.querySelector('main audio');
  if (!audioEl) return; // no page-owned audio here (the shared player wires itself)
  initListeningTracker({ contentId: detectContentId(), audioEl });
}

let sharedListen = null;
function trackListening(contentId, audioEl) {
  if (sharedListen && sharedListen.stop) { try { sharedListen.stop(); } catch (_) { /* ignore */ } }
  sharedListen = initListeningTracker({ contentId, audioEl });
}
if (typeof window !== 'undefined') {
  window.dcpTrackListening = trackListening;
  // Drain the episode the shared player loaded BEFORE this module finished
  // evaluating. dc-nav.js injects plus.js as an async module while player.html's
  // inline script runs during parse, so loadEpisode routinely wins that race and
  // used to find no hook at all — leaving the restored/default episode (the one
  // the user usually just presses play on) untracked until they picked another
  // from the list. Draining in the same statement that defines the hook closes
  // the window in both orders: whichever side runs first, the tracker attaches.
  const pending = window.dcpPendingListen;
  if (pending && pending.contentId && pending.audioEl) {
    window.dcpPendingListen = null; // consumed; the player calls the hook directly from now on
    trackListening(pending.contentId, pending.audioEl);
  }
}

function boot() {
  try {
    initHeader();
    initArticle();
    initListening(); // episode-page audio → episode_listened
    initHomeCard(); // homepage personal card on all viewports (desktop + mobile)
    initHomeFeatures(); // homepage premium section, under the ad card (both layouts)
    initHomeBundles(); // homepage "از کجا شروع کنم؟" starter-bundle rail (both layouts)
    initHomeUpboard(); // homepage مطالب box: the «بالاترین» tab + /up-board/ door
    markViewed(detectContentId()); // mark THIS content page seen on open (any folder, incl. episodes)
    // Credit shares of THIS page. Wired at boot rather than inside the article
    // path on purpose: dc-nav.js puts its share chip on every page built on the
    // shared article layer, including the episode pages initArticle() bows out
    // of, and a chip whose taps nobody listens for is worse than no chip.
    initShareScoring(detectContentId());
    initEpisodeActions(); // audio episodes: the short row (قلب + اشتراک‌گذاری)
    // The قلب, in the article's action row above the prose. Wired at boot for
    // the same reason share is: the row exists on every page built on the shared
    // article layer, including the audio episodes initArticle() bows out of —
    // and an episode is as votable as an article. Called AFTER the line above,
    // which is what puts a row on those pages for it to mount into.
    // initHeart() no-ops wherever the row is absent (the homepage, /plus/, the
    // desktop shell), so this is safe on every page.
    initHeart(detectContentId());
    initSeenTicks(); // landing pages: green ticks next to already-seen content
    initTourAutostart(); // /?tour=1 handoff: start the guided tour on the homepage
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
