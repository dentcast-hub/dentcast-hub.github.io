// The completion outbox — shared by reading.js (article_completed) and
// listening.js (episode_listened), the two signals behind «خوانده‌شده».
//
// A completion is written to localStorage BEFORE it is sent and removed only
// once the server has answered ok. Until 1405/07/02 both trackers marked the
// completion done first and sent it fire-and-forget, so any request that did
// not land was lost for good, and the local mark then stopped the same tab
// (reading) or the next 20 hours (listening) from trying again. The commonest
// way not to land is navigation: a reader reaches the end, taps «قسمت بعدی»,
// and the page change cancels the fetch mid-flight (user report: پرامپتولوژیست
// stuck at «۲۰ از ۲۲» after every part was read twice).
//
// flushOutbox() re-sends whatever a previous page could not deliver. It runs on
// every page (plus.js boot) and is awaited by any surface about to READ
// progress, so «بازگشت به فهرست» never shows a count one short of the truth.
// A repeat is harmless: the server's log is append-only and prices repeats.
//
// It also re-sends on the SAME page. A completion the server refused for a
// reason that clears by itself — a network drop, a 409 for an article published
// after the API's last index refresh (the API pulls the index forward on that
// very 409), a 429 pace ceiling — used to wait for the next page boot. A reader
// who finished an article and then closed the browser until evening had a read
// that counted only once they happened to open the site again, which for the
// streak means: not on the day it was earned unless something brought them back
// before midnight (user report: two articles read in the afternoon, the 20:00
// streak reminder still said nothing was recorded). So a failure arms a backoff
// timer, and coming back online or back to the tab flushes at once.
import { api } from './api.js?v=265';

const PREFIX = 'dcp:outbox:'; // + action + '|' + contentId -> epoch ms it was earned
const MAX_AGE_MS = 30 * 24 * 3600 * 1000;
// How long a waiting entry's earned time is worth keeping over a fresh one —
// the server's own window for dating a late delivery (EARNED_AT_MAX_AGE_MS).
const EARNED_KEEP_MS = 72 * 3600 * 1000;

function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (_) { /* ignore */ } }

const inFlight = new Map(); // key -> Promise<boolean>

// Re-send backoff for the page that earned (or inherited) a failed completion.
// The last delay repeats for as long as the page stays open and something is
// still queued; each success resets it.
const RETRY_DELAYS_MS = [20000, 60000, 180000, 600000];
let retryTimer = null;
let retryStep = 0;
let leaving = false;
// A 401 is the one refusal that will not clear by waiting: the reader is signed
// out on this device. The entry stays queued for the page after a sign-in.
let signedOut = false;

function scheduleRetry() {
  if (retryTimer !== null || leaving || signedOut) return;
  const ms = RETRY_DELAYS_MS[Math.min(retryStep, RETRY_DELAYS_MS.length - 1)];
  retryStep += 1;
  retryTimer = setTimeout(() => { retryTimer = null; flushOutbox(); }, ms);
}

// `at` is when the completion was EARNED, and it travels with every send: the
// server dates a late delivery on that day (within its own bounds — see
// plus-api services/activity.ts honouredEarnedAt). Until 1405/09 it was stored
// here and never sent, so a read that landed the next morning was counted the
// next morning, and the day it was actually earned took a shield.
function deliver(key, action, contentId, keepalive, at) {
  if (inFlight.has(key)) return inFlight.get(key);
  const p = api.activity(action, contentId, undefined, { keepalive, earned_at: at || undefined })
    .then(() => { lsDel(key); retryStep = 0; signedOut = false; return true; })
    .catch((e) => {
      const st = e && e.status;
      if (st === 401) signedOut = true;
      // 400 / 404 are final answers (a malformed id, an English-only page with
      // no Persian twin): re-sending them for thirty days changes nothing.
      else if (st === 400 || st === 404) lsDel(key);
      else scheduleRetry();
      return false;
    })
    .finally(() => { inFlight.delete(key); });
  inFlight.set(key, p);
  return p;
}

/**
 * Queue one completion and send it. Resolves true once the server accepted
 * it; false leaves it queued for the next flushOutbox(). `keepalive` is for a
 * send made while the page is going away, so the navigation cannot cancel it.
 */
export function sendCompletion(action, contentId, { keepalive = false } = {}) {
  const key = PREFIX + action + '|' + contentId;
  // An entry still waiting from an earlier, undelivered completion keeps ITS
  // time: that earlier day is the one with nothing on it yet.
  const prev = Number(lsGet(key)) || 0;
  const at = prev && Date.now() - prev < EARNED_KEEP_MS ? prev : Date.now();
  lsSet(key, String(at));
  return deliver(key, action, contentId, keepalive, at);
}

let flushing = null;
/** Re-send every queued completion. Concurrent callers share one pass; a call
 *  after that pass settled runs a fresh one. Never rejects. */
export function flushOutbox() {
  if (flushing) return flushing;
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
  } catch (_) { /* no storage → nothing queued */ }
  const now = Date.now();
  const queued = [];
  for (const k of keys) {
    const at = Number(lsGet(k)) || 0;
    const rest = k.slice(PREFIX.length);
    const bar = rest.indexOf('|');
    if (now - at > MAX_AGE_MS || bar < 1) { lsDel(k); continue; }
    queued.push({ k, at, action: rest.slice(0, bar), contentId: rest.slice(bar + 1) });
  }
  // Oldest first, one at a time. The server dates a late completion on its own
  // day only when that day is not before the last day already counted, so a
  // newer completion landing first would push an older one onto today.
  queued.sort((a, b) => a.at - b.at);
  flushing = queued.reduce(
    (chain, q) => chain.then(() => deliver(q.k, q.action, q.contentId, false, q.at)),
    Promise.resolve(),
  ).then(() => undefined).finally(() => { flushing = null; });
  return flushing;
}

function hasQueued() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) return true;
    }
  } catch (_) { /* no storage */ }
  return false;
}

// Back online, or back on the tab: try now instead of waiting out the timer.
function flushIfQueued() {
  if (leaving || !hasQueued()) return;
  if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
  flushOutbox();
}

try {
  window.addEventListener('online', flushIfQueued);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) flushIfQueued(); });
  window.addEventListener('pagehide', () => {
    leaving = true;
    if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
  });
  // Restored from the back/forward cache: the page is live again.
  window.addEventListener('pageshow', (e) => { if (e.persisted) { leaving = false; flushIfQueued(); } });
} catch (_) { /* no window */ }
