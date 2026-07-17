// Reading-completion tracker. Fires a single `article_completed` activity once a
// signed-in reader has BOTH (a) dwelled on the article for a length-scaled amount
// of *visible* time and (b) scrolled the end of the prose into view.
//
// Why this exists: until now the client never emitted `article_completed`, even
// though the server counts it as a qualifying streak + scoring action. So plain
// reading earned no score, no active day and no streak — only highlighting did.
// This closes that gap; the streak flame also lights live via signalStreakActivity.
import { api } from './api.js';
import { signalStreakActivity } from './util.js';
import { READ_WPM, READ_FRACTION, READ_MIN_MS, READ_MAX_MS, SS_READ_DONE } from './config.js';

// Dwell threshold for THIS article, scaled by its length. Persian words are
// space-separated; the ZWNJ (‌) that joins parts of one word is NOT
// whitespace, so it correctly does not inflate the count.
function completeMsFor(proseRoot) {
  const text = (proseRoot.textContent || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const estFullMs = (words / READ_WPM) * 60000;
  return Math.min(READ_MAX_MS, Math.max(READ_MIN_MS, estFullMs * READ_FRACTION));
}

export function initReadingTracker({ contentId, proseRoot }) {
  if (!contentId || !proseRoot) return;

  // Once per article per browser session. The backend log is append-only and a
  // repeat within the same Tehran day changes neither score nor active-day, but
  // there is no reason to send it twice.
  const doneKey = SS_READ_DONE + contentId;
  if (sessionStorage.getItem(doneKey)) return;

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
  function endInView() {
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    return proseRoot.getBoundingClientRect().bottom <= vh + 4;
  }

  function tick() {
    accumulate(); resume(); // fold in the time since the last tick before checking
    if (!reachedEnd && endInView()) reachedEnd = true;
    if (fired || !reachedEnd || dwellMs < completeMs) return;
    fired = true;
    cleanup();
    sessionStorage.setItem(doneKey, '1');
    // Fire-and-forget: requireAuth rejects an anonymous caller quietly and we
    // never surface an error — this is a silent background signal.
    api.activity('article_completed', contentId).catch(() => {});
    signalStreakActivity(); // light the header flame live, like a highlight does
  }

  // Tick once a second so firing is prompt once both conditions hold (the reader
  // may reach the end first and keep reading, or dwell first then scroll down).
  const timer = setInterval(tick, 1000);

  function onVisibility() {
    if (document.hidden) accumulate(); else resume();
  }
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', accumulate);

  function cleanup() {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', accumulate);
  }

  // Start the clock if the page is visible right now, and evaluate once up front
  // (a short article may already have its end in view without any scrolling).
  if (!document.hidden) resume();
  tick();
}
