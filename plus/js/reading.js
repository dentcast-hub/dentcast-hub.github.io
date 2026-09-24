// Reading-completion tracker. Fires a single `article_completed` activity once a
// signed-in reader has BOTH (a) dwelled on the article for a length-scaled amount
// of *visible* time and (b) scrolled the end of the prose into view.
//
// Why this exists: until now the client never emitted `article_completed`, even
// though the server counts it as a qualifying streak + scoring action. So plain
// reading earned no score, no active day and no streak — only highlighting did.
// This closes that gap; the streak flame also lights live via signalStreakActivity.
import { api } from './api.js?v=145';
import { signalStreakActivity } from './util.js?v=145';
import { READ_WPM, READ_FRACTION, READ_MIN_MS, READ_MAX_MS, SS_READ_DONE } from './config.js?v=145';

// Dwell threshold for THIS article, scaled by its length. Persian words are
// space-separated; the ZWNJ (‌) that joins parts of one word is NOT
// whitespace, so it correctly does not inflate the count.
function completeMsFor(proseRoot) {
  const text = (proseRoot.textContent || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const estFullMs = (words / READ_WPM) * 60000;
  return Math.min(READ_MAX_MS, Math.max(READ_MIN_MS, estFullMs * READ_FRACTION));
}

// ── The outbox ─────────────────────────────────────────────────────────────
// A completion is written to localStorage BEFORE it is sent and removed only
// once the server has answered ok. Until 1405/07/02 the session flag was set
// first and the request fired after, fire-and-forget — so any request that did
// not land was lost for good, and the flag then stopped the SAME tab from ever
// trying again. The commonest way not to land is the one a series invites: the
// reader reaches the end, taps «قسمت بعدی» (it sits right under the prose on
// every پرامپتولوژیست part), and the navigation cancels the fetch — or the tap
// beats the one-second tick and nothing is sent at all. A pinned phone tab
// keeps one session alive for weeks, so re-reading the whole section did not
// fix it either (user report: ۲۰ از ۲۲ after reading all 22 twice).
const LS_PENDING = 'dcp:read:pending:'; // + contentId -> epoch ms it was earned
const PENDING_MAX_AGE_MS = 30 * 24 * 3600 * 1000;

function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (_) { /* ignore */ } }
function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* ignore */ } }
function ssGet(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } }

const inFlight = new Set();

// Send one completion. The outbox entry and the session flag change only on a
// 2xx; a failure leaves the entry for the next flush.
function send(contentId, { keepalive = false } = {}) {
  if (inFlight.has(contentId)) return Promise.resolve(false);
  inFlight.add(contentId);
  return api.activity('article_completed', contentId, undefined, { keepalive })
    .then(() => { lsDel(LS_PENDING + contentId); ssSet(SS_READ_DONE + contentId, '1'); return true; })
    .catch(() => false)
    .finally(() => { inFlight.delete(contentId); });
}

let flushing = null;
// Re-send every completion a previous page earned and could not deliver. Safe
// to call on every page (memoised per page): the server treats a repeat as a
// no-op for score and active day. Returns once every send has settled, so a
// caller about to READ progress (the section bar) can wait for it.
export function flushPendingReads() {
  if (flushing) return flushing;
  const ids = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PENDING)) ids.push(k);
    }
  } catch (_) { /* no storage → nothing queued */ }
  const now = Date.now();
  flushing = Promise.all(ids.map((k) => {
    const at = Number(lsGet(k)) || 0;
    if (now - at > PENDING_MAX_AGE_MS) { lsDel(k); return false; }
    return send(k.slice(LS_PENDING.length));
  })).then(() => undefined);
  return flushing;
}

export function initReadingTracker({ contentId, proseRoot }) {
  if (!contentId || !proseRoot) return;

  // Once per article per browser session — but only once it has actually
  // LANDED (send() sets the flag on success, never before). The backend log is
  // append-only and a repeat within the same Tehran day changes neither score
  // nor active-day, but there is no reason to send it twice.
  if (ssGet(SS_READ_DONE + contentId)) return;

  const completeMs = completeMsFor(proseRoot);
  let dwellMs = 0;
  let lastTick = null; // performance.now() when the visible timer last resumed
  let reachedEnd = false;
  let fired = false;

  // Accumulate only *visible* time: a backgrounded tab or a locked phone is not
  // reading. performance.now() is monotonic and immune to wall-clock changes.
  // resume() is a no-op while hidden so the tick cannot restart the clock on a
  // backgrounded tab (which would silently count background time).
  function resume() { if (lastTick === null && !document.hidden) lastTick = performance.now(); }
  function accumulate() {
    if (lastTick !== null) { dwellMs += performance.now() - lastTick; lastTick = null; }
  }

  // The end of the prose is "in view" once its bottom edge has risen to (or above)
  // the viewport bottom. This is LATCHED (reachedEnd never un-sets): staying
  // scrolled past keeps it true, and a single fast jump to the footer cannot skip
  // it — unlike an IntersectionObserver sentinel, which only reports the state at
  // observe time and would miss an element scrolled straight past in one jump.
  // A root no longer in the document (the desktop shell swapped the column) is
  // not "at its end" — its rect is all zeros, which would read as scrolled past.
  function endInView() {
    if (!proseRoot.isConnected) return false;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    return proseRoot.getBoundingClientRect().bottom <= vh + 4;
  }

  // `leaving`: the page is going away (pagehide / tab hidden), so this is the
  // last chance — the request is sent keepalive so the navigation cannot cancel
  // it, and the outbox entry covers a browser that refuses keepalive anyway.
  function tick(leaving = false) {
    if (fired) return;
    accumulate(); if (!leaving) resume(); // fold in the time since the last tick before checking
    if (!reachedEnd && endInView()) reachedEnd = true;
    if (!reachedEnd || dwellMs < completeMs) return;
    fired = true;
    cleanup();
    lsSet(LS_PENDING + contentId, String(Date.now())); // queued first, sent second
    // requireAuth rejects an anonymous caller quietly and we never surface an
    // error — this is a silent background signal. A failure stays queued.
    send(contentId, { keepalive: leaving });
    signalStreakActivity(); // light the header flame live, like a highlight does
  }

  // Tick once a second so firing is prompt once both conditions hold (the reader
  // may reach the end first and keep reading, or dwell first then scroll down).
  const timer = setInterval(() => tick(), 1000);

  function onVisibility() {
    if (document.hidden) tick(true); else resume();
  }
  const onPageHide = () => tick(true);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  function cleanup() {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
  }

  // Start the clock if the page is visible right now, and evaluate once up front
  // (a short article may already have its end in view without any scrolling).
  if (!document.hidden) resume();
  tick();
}
