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
  // Placeholders until the api subdomains are finalized at deploy.
  return ['https://api.dentcast.org', 'https://api.dentcast.ir'];
}

export const API_BASES = OVERRIDE.apiBases || defaultBases();

// --- .org gate (TEMPORARY) --------------------------------------------------
// api.dentcast.org is not wired yet, so on the .org hosts the Plus API is only
// reachable cross-site and the SameSite=Lax session cookie is dropped -> OTP
// login can never complete. Until api.dentcast.org resolves, the three .org
// Plus entry points (workbench button, header person, home card) show a notice
// and deep-link the SAME page on dentcast.ir instead of opening the OTP modal.
// The failover list above is intentionally left untouched. To retire this once
// .org has its own API: delete ORG_HOSTS / isOrgHost / irMirrorUrl and their
// call sites (grep isOrgHost, openOrgNotice).
export const ORG_HOSTS = ['dentcast.org', 'www.dentcast.org'];

export function isOrgHost() {
  return typeof location !== 'undefined' && ORG_HOSTS.indexOf(location.hostname) !== -1;
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
export const PROSE_SELECTORS = ['.text-box', '.glass-box', '.content-box'];

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
];

export const LABELS = [
  { key: 'important', fa: 'مهم' },
  { key: 'unclear', fa: 'مبهم' },
  { key: 'clinical_pearl', fa: 'نکته بالینی' },
];

// --- storage keys -----------------------------------------------------------
// Mode choice is remembered per session only (never auto-enter across sessions).
export const SS_MODE = 'dcp:mode:'; // + contentId -> 'study'
export const SS_RETURN_STUDY = 'dcp:return-study'; // path to auto-enter after login

// One-sentence invitation shown to anonymous users at the workbench button.
export const INVITE_LINE =
  'هایلایت، یادداشت و پیگیری پیشرفت، رایگان. برای شروع وارد شوید.';
