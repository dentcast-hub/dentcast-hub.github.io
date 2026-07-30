// DentCast Plus API client. Health-checked base with failover, cookie sessions.
import { API_BASES } from './config.js';

// The health-check round trip only needs to happen ONCE per browser tab, not
// once per page load — this is a static multi-page site, so every navigation
// re-imports this module and `resolvedBase` (module-scope) resets to null. On
// a slow connection that extra /health RTT is exactly what delays the /me
// answer that gates Spot's card render (see spot.js's TIER_TIMEOUT_MS race),
// and it repeats on every single page a visitor opens. sessionStorage survives
// the navigation, so page 2+ of a visit skips straight to /me.
//
// Self-healing: a cached base that goes down mid-session must not stick for
// the rest of the tab — forgetBase() is called on any network-level failure
// (not an HTTP error status, which is a real API answer) so the very next
// request re-probes and can fail over to the other mirror.
const SS_BASE = 'dcp:api-base';

function ssGet(key) {
  try { return sessionStorage.getItem(key) || ''; } catch (_) { return ''; }
}
function ssSet(key, v) {
  try { sessionStorage.setItem(key, v); } catch (_) { /* private mode */ }
}
function ssClear(key) {
  try { sessionStorage.removeItem(key); } catch (_) { /* private mode */ }
}

let resolvedBase = null;

async function pickBase() {
  if (resolvedBase) return resolvedBase;
  const cached = ssGet(SS_BASE);
  if (cached && API_BASES.indexOf(cached) !== -1) { resolvedBase = cached; return cached; }
  for (const base of API_BASES) {
    try {
      const res = await fetch(base + '/health', { method: 'GET', credentials: 'include', cache: 'no-store' });
      if (res.ok) { resolvedBase = base; ssSet(SS_BASE, base); return base; }
    } catch (_) { /* try next */ }
  }
  // Fall back to the first configured base so callers still get a real error.
  resolvedBase = API_BASES[0];
  return resolvedBase;
}

// Exported so callers that build their own fetch (spot.js's telemetry, which
// bypasses request() for keepalive) can self-heal too on a network failure.
export function forgetBase() {
  resolvedBase = null;
  ssClear(SS_BASE);
}

// The resolved (health-checked, failed-over) base, for callers that must build
// their own request instead of going through request() — currently only the
// Spot telemetry emitter, which needs keepalive:true so a click still reports
// while the browser is already navigating away. Everything else should use the
// `api` object below rather than hand-rolling a fetch.
export function apiBase() {
  return pickBase();
}

export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.message) || (body && body.error) || 'API error');
    this.status = status;
    this.body = body || {};
  }
}

async function request(path, { method = 'GET', body, query } = {}) {
  const base = await pickBase();
  let url = base + path;
  if (query) {
    // `new URLSearchParams({a: undefined})` stringifies to the literal text
    // "a=undefined" (a real bug hit by reviewDue's optional `topic`) — drop
    // null/undefined entries first so an omitted optional param is really omitted.
    const clean = {};
    for (const [k, v] of Object.entries(query)) if (v != null) clean[k] = v;
    const qs = new URLSearchParams(clean).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }
  // `cache: 'no-store'` so the browser never serves a STALE API response. During
  // the pre-no-store window some GETs (/me, /profile/stats) were cached with no
  // cache headers; a stale /me then read as "still logged in" after logout, and a
  // stale /profile/stats showed empty week/records. Always hitting the network
  // fixes both and keeps auth state truthful.
  const opts = { method, credentials: 'include', cache: 'no-store', headers: {} };
  if (body !== undefined) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    forgetBase(); // network-level failure (not an HTTP error) — the cached base may be dead
    throw e;
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  // auth
  me: () => request('/me'),
  updateMe: (patch) => request('/me', { method: 'PATCH', body: patch }),
  profileStats: () => request('/profile/stats'),
  requestOtp: (phone) => request('/auth/otp/request', { method: 'POST', body: { phone } }),
  verifyOtp: (phone, code, return_to) =>
    request('/auth/otp/verify', { method: 'POST', body: { phone, code, return_to } }),
  // Prove a phone via OTP while logged in (e.g. a Telegram-only account), to
  // recover/merge an older phone account. Call requestOtp(phone) first.
  linkPhone: (phone, code) =>
    request('/auth/phone/link', { method: 'POST', body: { phone, code } }),
  // Disconnect Telegram from the current account (needs a phone fallback).
  unlinkTelegram: () => request('/auth/telegram/unlink', { method: 'POST' }),
  // Bale (بله) notification channel (no login flow): mint a one-time connect
  // token (the client builds the deep link from it) / disconnect.
  connectBale: () => request('/auth/bale/connect', { method: 'POST' }),
  unlinkBale: () => request('/auth/bale/unlink', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // activity + anon
  activity: (action, content_id, meta) =>
    request('/activity', { method: 'POST', body: { action, content_id, meta } }),
  anonEvent: (event, content_id) =>
    request('/anon/event', { method: 'POST', body: { event, content_id } }),

  // highlights
  listHighlights: (content_id) => request('/highlights', { query: { content_id } }),
  listTopic: (topic) => request('/highlights', { query: { topic } }),
  recentHighlights: (limit = 8) => request('/highlights/recent', { query: { limit } }),
  createHighlight: (h) => request('/highlights', { method: 'POST', body: h }),
  updateHighlight: (id, patch) => request('/highlights/' + id, { method: 'PATCH', body: patch }),
  deleteHighlight: (id) => request('/highlights/' + id, { method: 'DELETE' }),

  // per-article note (independent of highlights)
  getArticleNote: (content_id) => request('/article-note', { query: { content_id } }),
  saveArticleNote: (content_id, note) => request('/article-note', { method: 'PUT', body: { content_id, note } }),

  // premium: Leitner scheduled review
  reviewDue: (topic, limit) => request('/review/due', { query: { topic, limit } }),
  reviewAnswer: (highlight_id, result) => request('/review/answer', { method: 'POST', body: { highlight_id, result } }),

  // dashboard (later milestones)
  tree: () => request('/tree'),
  progress: () => request('/progress'),
  // content_ids the user has seen (landing-page "seen" ticks; Plus, cross-device)
  seen: () => request('/seen'),
  exportHighlights: () => request('/export/highlights'),

  // weekly league (group view + acknowledge finalized outcome)
  league: () => request('/league'),
  leagueOutcomeSeen: () => request('/league/outcome/seen', { method: 'POST' }),

  // web push (reminder delivery channel for free users)
  pushPublicKey: () => request('/push/public-key'),
  savePushSubscription: (subscription) => request('/push/subscribe', { method: 'POST', body: { subscription } }),
  deletePushSubscription: (endpoint) => request('/push/unsubscribe', { method: 'POST', body: { endpoint } }),
};

// A cached /me lookup so multiple widgets on one page share one request.
let mePromise;

// WHY the last /me resolved the way it did: 'user' (a real profile came back),
// 'anon' (the API answered 401 — genuinely signed out), 'error' (we never got an
// answer: offline, DNS, CORS, 5xx), or 'unknown' (not asked yet).
// currentUser() deliberately flattens all of these to profile-or-null, which is
// right for progressive enhancement but wrong for Spot: "we could not ask" must
// NOT be read as "not premium", or a premium visitor gets an ad they paid to
// never see. Only the ad system needs this distinction.
let lastMeStatus = 'unknown';
export function meStatus() { return lastMeStatus; }

export function currentUser({ refresh = false } = {}) {
  if (refresh) mePromise = undefined;
  if (!mePromise) {
    // Any failure (401, or the API being unreachable) means "treat as anonymous"
    // so the static site stays pristine as pure progressive enhancement.
    mePromise = api.me()
      .then((u) => { lastMeStatus = u ? 'user' : 'anon'; return u; })
      .catch((e) => { lastMeStatus = (e && e.status === 401) ? 'anon' : 'error'; return null; });
  }
  return mePromise;
}
