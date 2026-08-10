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

// A hanging host is worse than a dead one: an unreachable base that REFUSES the
// connection fails in milliseconds and we move on, but one that simply never
// answers used to hold the whole chain open for the browser's own timeout —
// tens of seconds. That is not theoretical here: .org probes api.dentcast.org
// (Cloudflare) first, which from an Iranian mobile network is exactly the leg
// that stalls rather than refusing. Everything downstream waits on this: /me,
// and therefore Spot's card, and therefore the sponsor's impression.
//
// So each probe gets its own short deadline. It only has to answer "are you
// there", so a base that cannot manage that in PROBE_TIMEOUT_MS is not the base
// we want to spend the visit on — fail over now, not in twenty seconds.
const PROBE_TIMEOUT_MS = 1500;

function probeSignal() {
  // AbortSignal.timeout is not in older WebViews (Telegram's in-app browser on
  // an old Android). Falling back to no signal keeps the old behaviour there
  // rather than throwing — slow beats broken.
  try {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(PROBE_TIMEOUT_MS);
    }
  } catch (_) { /* fall through */ }
  return undefined;
}

async function pickBase() {
  if (resolvedBase) return resolvedBase;
  const cached = ssGet(SS_BASE);
  if (cached && API_BASES.indexOf(cached) !== -1) { resolvedBase = cached; return cached; }
  // Probe every mirror CONCURRENTLY but honour them in ORDER. The distinction
  // matters in both directions:
  //
  //   - concurrent, because probing them one after another meant a slow first
  //     mirror was paid in full before the second was even contacted, and that
  //     wait sits directly in front of /me — which the ad card waits on.
  //   - in order, because the order is a correctness rule, not a preference:
  //     each site must talk to its OWN api host so the session cookie stays
  //     same-site (see defaultBases()). A plain race would hand .ir to
  //     api.dentcast.org whenever it merely answered first, and the login
  //     cookie would be dropped.
  //
  // So the second mirror is already in flight and warm by the time the first
  // one is given up on — the failover costs a timeout, not a round trip.
  const attempts = API_BASES.map((base) => fetch(base + '/health', {
    method: 'GET', credentials: 'include', cache: 'no-store', signal: probeSignal(),
  }));
  // A rejection nobody is awaiting yet is an unhandled rejection in some
  // browsers; neutralise each one now and read the outcome below.
  const settled = attempts.map((p) => p.then((res) => res, () => null));
  for (let i = 0; i < API_BASES.length; i++) {
    const res = await settled[i];
    if (res && res.ok) {
      resolvedBase = API_BASES[i];
      ssSet(SS_BASE, resolvedBase);
      return resolvedBase;
    }
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
  // premium: the whole library in one response, grouped by article (see
  // highlights.js / /plus/highlights.html).
  highlightLibrary: () => request('/highlights/library'),
  createHighlight: (h) => request('/highlights', { method: 'POST', body: h }),
  updateHighlight: (id, patch) => request('/highlights/' + id, { method: 'PATCH', body: patch }),
  deleteHighlight: (id) => request('/highlights/' + id, { method: 'DELETE' }),

  // per-article note (independent of highlights)
  getArticleNote: (content_id) => request('/article-note', { query: { content_id } }),
  saveArticleNote: (content_id, note) => request('/article-note', { method: 'PUT', body: { content_id, note } }),

  // premium: Leitner scheduled review
  reviewDue: (topic, limit) => request('/review/due', { query: { topic, limit } }),
  reviewAnswer: (highlight_id, result) => request('/review/answer', { method: 'POST', body: { highlight_id, result } }),
  reviewAnswerAi: (content_id, card_id, result) =>
    request('/review/answer-ai', { method: 'POST', body: { content_id, card_id, result } }),

  // premium: learning pathways (Phase 3)
  pathways: () => request('/pathways'),
  pathway: (id) => request('/pathways/' + encodeURIComponent(id)),
  enrollPathway: (id) => request('/pathways/' + encodeURIComponent(id) + '/enroll', { method: 'POST' }),

  // premium prize: acknowledge the "you won a week of premium" dashboard banner
  premiumGrantSeen: () => request('/premium/grant/seen', { method: 'POST' }),

  // --- payments -------------------------------------------------------------
  // payPlans is PUBLIC (no session): the pricing page renders the price before
  // it knows who is looking. payStart needs one, and asks for it at the moment
  // of purchase rather than at the door.
  payPlans: () => request('/pay/plans'),
  payStart: (months) => request('/pay/start', { method: 'POST', body: { months } }),
  payStatus: (order) => request('/pay/status', { query: { order } }),
  paySettle: (order) => request('/pay/settle', { method: 'POST', body: { order } }),
  // Gift card (outside Iran). No code is sent: this opens a claim and returns
  // the reference tag the buyer puts in the gift message.
  giftStart: () => request('/pay/gift', { method: 'POST' }),
  giftStatus: () => request('/pay/gift'),

  // premium: reading compass — coverage report over the user's own reading,
  // cross-referenced against the taxonomy and pathways (no interest guessing)
  readingCompass: () => request('/reading-compass'),

  // premium: «دستیار هوشمند» — stateless narrowing wizard, not a chat. The
  // caller resends the whole history every call; nothing is stored server-side.
  assistantNext: (description, history) => request('/assistant/next', { method: 'POST', body: { description, history } }),
  // Assistant telemetry: the explicit two-button verdict, and which suggested
  // article was opened. Fire-and-forget at every call site — it must never
  // delay the reader.
  assistantFeedback: (roundId, kind, optionKey) => request('/assistant/feedback', {
    method: 'POST',
    body: { round_id: roundId, kind, option_key: optionKey },
  }),

  // premium: collections (Phase 3) - user-made freeform folders of highlights/pages
  listCollections: () => request('/collections'),
  getCollection: (id) => request('/collections/' + encodeURIComponent(id)),
  createCollection: (title) => request('/collections', { method: 'POST', body: { title } }),
  renameCollection: (id, title) => request('/collections/' + encodeURIComponent(id), { method: 'PATCH', body: { title } }),
  // A board's own identity (any subset of title/description/emoji/color; null clears one).
  updateCollection: (id, patch) => request('/collections/' + encodeURIComponent(id), { method: 'PATCH', body: patch }),
  // The board's own arrangement: the WHOLE order, every time (empty = back to newest-first).
  orderCollectionItems: (id, itemIds) =>
    request('/collections/' + encodeURIComponent(id) + '/items/order', { method: 'PUT', body: { item_ids: itemIds } }),
  deleteCollection: (id) => request('/collections/' + encodeURIComponent(id), { method: 'DELETE' }),
  addToCollection: (id, item) => request('/collections/' + encodeURIComponent(id) + '/items', { method: 'POST', body: item }),
  removeCollectionItem: (id, itemId) =>
    request('/collections/' + encodeURIComponent(id) + '/items/' + encodeURIComponent(itemId), { method: 'DELETE' }),
  // Collection pins: «متن خودم» / «رفرنس». Creating one pins it to the board in
  // the same call; editing/deleting a snippet is by its own id (independent of
  // which board(s) it is pinned to).
  createSnippet: (collectionId, payload) =>
    request('/collections/' + encodeURIComponent(collectionId) + '/snippets', { method: 'POST', body: payload }),
  updateSnippet: (id, patch) => request('/snippets/' + encodeURIComponent(id), { method: 'PATCH', body: patch }),
  deleteSnippet: (id) => request('/snippets/' + encodeURIComponent(id), { method: 'DELETE' }),

  // dashboard (later milestones)
  tree: () => request('/tree'),
  progress: () => request('/progress'),
  // content_ids the user has seen (landing-page "seen" ticks; Plus, cross-device)
  seen: () => request('/seen'),
  exportHighlights: () => request('/export/highlights'),

  // weekly league (group view + acknowledge finalized outcome)
  // achievements — the profile's «افتخارات» shelf. Free on every plan; three of
  // the badges simply need premium tools to earn.
  achievements: () => request('/achievements'),
  // The celebration queue: badges announced but not yet acknowledged. Separate
  // from the wall above because it answers a different question — the wall is
  // "what is true", this is "what have we not told you yet" — and only the
  // second one can be spent. Mirrors leagueOutcomeSeen exactly.
  achievementsPending: () => request('/achievements/pending'),
  achievementsSeen: () => request('/achievements/seen', { method: 'POST' }),

  // اطلاعیه — the in-app inbox behind the dot on the account icon. Free on
  // every plan: these are the site's own messages to the reader, and the people
  // who cannot see them any other way are exactly the ones who never granted
  // push permission.
  notices: () => request('/notices'),
  noticesSeen: () => request('/notices/seen', { method: 'POST' }),

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
