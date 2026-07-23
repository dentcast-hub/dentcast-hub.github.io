// DentCast Plus API client. Health-checked base with failover, cookie sessions.
import { API_BASES } from './config.js';

let resolvedBase = null;

async function pickBase() {
  if (resolvedBase) return resolvedBase;
  for (const base of API_BASES) {
    try {
      const res = await fetch(base + '/health', { method: 'GET', credentials: 'include', cache: 'no-store' });
      if (res.ok) { resolvedBase = base; return base; }
    } catch (_) { /* try next */ }
  }
  // Fall back to the first configured base so callers still get a real error.
  resolvedBase = API_BASES[0];
  return resolvedBase;
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
    const qs = new URLSearchParams(query).toString();
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
  const res = await fetch(url, opts);
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

  // dashboard (later milestones)
  tree: () => request('/tree'),
  progress: () => request('/progress'),
  // content_ids the user has seen (landing-page "seen" ticks; Plus, cross-device)
  seen: () => request('/seen'),
  exportHighlights: () => request('/export/highlights'),

  // web push (reminder delivery channel for free users)
  pushPublicKey: () => request('/push/public-key'),
  savePushSubscription: (subscription) => request('/push/subscribe', { method: 'POST', body: { subscription } }),
  deletePushSubscription: (endpoint) => request('/push/unsubscribe', { method: 'POST', body: { endpoint } }),
};

// A cached /me lookup so multiple widgets on one page share one request.
let mePromise;
export function currentUser({ refresh = false } = {}) {
  if (refresh) mePromise = undefined;
  if (!mePromise) {
    // Any failure (401, or the API being unreachable) means "treat as anonymous"
    // so the static site stays pristine as pure progressive enhancement.
    mePromise = api.me().catch(() => null);
  }
  return mePromise;
}
