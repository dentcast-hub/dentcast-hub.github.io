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
import { api } from './api.js?v=152';

const PREFIX = 'dcp:outbox:'; // + action + '|' + contentId -> epoch ms it was earned
const MAX_AGE_MS = 30 * 24 * 3600 * 1000;

function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (_) { /* ignore */ } }

const inFlight = new Map(); // key -> Promise<boolean>

function deliver(key, action, contentId, keepalive) {
  if (inFlight.has(key)) return inFlight.get(key);
  const p = api.activity(action, contentId, undefined, { keepalive })
    .then(() => { lsDel(key); return true; })
    .catch(() => false)
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
  lsSet(key, String(Date.now()));
  return deliver(key, action, contentId, keepalive);
}

let flushing = null;
/** Re-send every queued completion (memoised per page). Never rejects. */
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
  flushing = Promise.all(keys.map((k) => {
    const at = Number(lsGet(k)) || 0;
    const rest = k.slice(PREFIX.length);
    const bar = rest.indexOf('|');
    if (now - at > MAX_AGE_MS || bar < 1) { lsDel(k); return false; }
    return deliver(k, rest.slice(0, bar), rest.slice(bar + 1), false);
  })).then(() => undefined);
  return flushing;
}
