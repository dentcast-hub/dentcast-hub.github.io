// DentCast Plus - client config and shared constants.
// Progressive enhancement only: nothing here runs for anonymous visitors until
// they choose the workbench or the homepage card. No em dashes in Persian copy.

// --- API base with failover -------------------------------------------------
// Final hostnames are set at deploy. The client tries the primary, falls back
// to the secondary (health-checked). Override in a page via window.DENTCAST_PLUS.
const OVERRIDE = (typeof window !== 'undefined' && window.DENTCAST_PLUS) || {};

function defaultBases() {
  const h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '') {
    return ['http://localhost:8787'];
  }
  // Each site talks to its OWN api host FIRST, so the session cookie stays
  // same-site (SameSite=Lax). Order is critical: if .ir picked api.dentcast.org
  // first (once that host exists behind a Cloudflare Worker), it would be
  // cross-site and the cookie would be dropped — breaking .ir login. The other
  // host is only a fallback for read-only resilience (same container behind both).
  if (h.indexOf('dentcast.org') !== -1) return ['https://api.dentcast.org', 'https://api.dentcast.ir'];
  return ['https://api.dentcast.ir', 'https://api.dentcast.org'];
}

export const API_BASES = OVERRIDE.apiBases || defaultBases();

// --- .org gate (RETIRED) ----------------------------------------------------
// api.dentcast.org is now wired: a Cloudflare Worker on api.dentcast.org proxies
// to the same container, so .org has a same-site API and the SameSite=Lax session
// cookie works (the API sets a host-only cookie). .org therefore runs the NATIVE
// OTP flow exactly like .ir. isOrgHost() returns false so every .org gate below
// becomes a no-op in one place; the now-dead openOrgNotice / irMirrorUrl paths and
// their call sites can be deleted later. Flip this back to the ORG_HOSTS check
// only if api.dentcast.org is ever down.
export const ORG_HOSTS = ['dentcast.org', 'www.dentcast.org'];

export function isOrgHost() {
  return false;
}

// The same path on the .ir host, so the reader is not thrown out of their
// article (only the hostname changes; path + query + hash are preserved).
export function irMirrorUrl() {
  return 'https://dentcast.ir' + location.pathname + location.search + location.hash;
}

// --- Web Push (VAPID) -------------------------------------------------------
// Public application-server key for browser push. Safe to embed (it is public).
// Override via window.DENTCAST_PLUS.vapidPublicKey; if left empty, the client
// fetches it from the API (/push/public-key) at subscribe time.
export const VAPID_PUBLIC_KEY = OVERRIDE.vapidPublicKey || '';

// --- Telegram Login (dentcast.org sign-in) ----------------------------------
// The bot USERNAME is public — it is what renders the official Login Widget.
// The bot's /setdomain is dentcast.org, so the widget only renders (and only
// makes sense) on the .org hosts; .ir will use "Login with Bale" later. The
// widget redirects the browser to the API's /auth/telegram/callback, which
// verifies the signed payload server-side with the SECRET token.
export const TELEGRAM_BOT_USERNAME = OVERRIDE.telegramBotUsername || 'Dentcast_bot';

// Show "Login with Telegram" only where the bot domain matches (the .org hosts).
// Set window.DENTCAST_PLUS.forceTelegramLogin = true to preview it elsewhere
// (the widget itself will still report "Bot domain invalid" off dentcast.org).
export function telegramLoginEnabled() {
  if (!TELEGRAM_BOT_USERNAME) return false;
  if (OVERRIDE.forceTelegramLogin) return true;
  return location.hostname.indexOf('dentcast.org') !== -1;
}

// The absolute auth-url the widget redirects to. It is a top-level navigation
// (not a fetch), so we target the primary same-site API base directly rather
// than the health-checked failover list. `origin` + `return_to` tell the
// callback where to send the browser back after it sets the session cookie.
export function telegramCallbackUrl(returnTo) {
  const qs = new URLSearchParams({
    origin: location.origin,
    return_to: returnTo || '/plus/',
  });
  return API_BASES[0] + '/auth/telegram/callback?' + qs.toString();
}

// --- content_id from the canonical URL --------------------------------------
// content_id = page path without leading slash and without ".html".
// e.g. /chairside/chairside-25.html -> "chairside/chairside-25". Unique across
// content types and reversible to the canonical URL for the tree/archive map.
export function detectContentId() {
  let path;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && canonical.href) {
    try { path = new URL(canonical.href).pathname; } catch (_) { path = location.pathname; }
  } else {
    path = location.pathname;
  }
  return path.replace(/^\/+/, '').replace(/\.html$/i, '') || 'index';
}

// The prose container a user highlights inside. First match wins.
// .ep-box is the episode/promptologist shell. It's included so the workbench can
// mount on text promptologist pages; audio episode pages (which also use .ep-box)
// are excluded separately by the #ep-audio gate in plus.js (podcasts get the
// "seen" tick, not the workbench).
export const PROSE_SELECTORS = ['.text-box', '.glass-box', '.content-box', '.ep-box'];

export function findProseRoot() {
  for (const sel of PROSE_SELECTORS) {
    const el = document.querySelector('main ' + sel + ', ' + sel);
    if (el) return el;
  }
  return null;
}

// --- Highlighter palette + labels (Persian) ---------------------------------
export const PALETTE = [
  { key: 'yellow', fa: 'زرد', css: '#ffe08a' },
  { key: 'green', fa: 'سبز', css: '#b7e4b0' },
  { key: 'blue', fa: 'آبی', css: '#a9d3f5' },
  { key: 'pink', fa: 'صورتی', css: '#f6b8cf' },
  { key: 'red', fa: 'قرمز', css: '#ff8080' },
];

export const LABELS = [
  { key: 'important', fa: 'مهم' },
  { key: 'unclear', fa: 'مبهم' },
  { key: 'clinical_pearl', fa: 'نکته بالینی' },
];

// --- reading completion -----------------------------------------------------
// The client emits `article_completed` (a qualifying streak + scoring action)
// only when BOTH hold: the reader reached the end of the prose AND spent enough
// *visible* time on the page. This is what makes plain reading — not just
// highlighting — earn a score, an active day and the streak.
//
// The dwell threshold scales with ARTICLE LENGTH: estimated full reading time =
// words / READ_WPM, and the reader must stay for READ_FRACTION of it, clamped
// between READ_MIN_MS and READ_MAX_MS. So a short note needs the floor while a
// long article needs proportionally more. Visible time only — a backgrounded tab
// or a locked phone does not count.
export const READ_WPM = 200;         // Persian words/minute (technical prose reads slower than casual)
export const READ_FRACTION = 0.5;    // must dwell at least half the estimated read time
export const READ_MIN_MS = 30000;    // floor: even a tiny stub needs 30s
export const READ_MAX_MS = 240000;   // cap: a very long article never demands > 4 min

// The LISTEN threshold is the audio analogue of READ: the listener must hear
// LISTEN_FRACTION of the episode's real duration, clamped between LISTEN_MIN_S
// and LISTEN_MAX_S. Only ACTUAL played seconds count (seeking to the end does
// not) — measured from real playback progress, so it is the audio twin of the
// visible-dwell rule for reading.
export const LISTEN_FRACTION = 0.6;  // must hear at least 60% of the episode
export const LISTEN_MIN_S = 60;      // floor: even a short clip needs 60s of real play
export const LISTEN_MAX_S = 1200;    // cap: a very long episode never demands > 20 min

// --- storage keys -----------------------------------------------------------
// Mode choice is remembered per session only (never auto-enter across sessions).
export const SS_MODE = 'dcp:mode:'; // + contentId -> 'study'
export const SS_RETURN_STUDY = 'dcp:return-study'; // path to auto-enter after login
export const SS_READ_DONE = 'dcp:read:'; // + contentId -> '1' once article_completed fired this session
export const SS_LISTEN_DONE = 'dcp:listen:'; // + contentId -> '1' once episode_listened fired this session

// One-sentence invitation shown to anonymous users at the workbench button.
export const INVITE_LINE =
  'هایلایت، یادداشت و پیگیری پیشرفت، رایگان. برای شروع وارد شوید.';
