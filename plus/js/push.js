// Web Push for DentCast Plus reminders. This is the delivery channel that works
// for FREE users (no Telegram needed): browser / installed-PWA notifications
// handled by the /plus service worker. The user's reminder preferences live in
// settings.reminders.*; this module only manages the browser subscription that
// lets the backend actually deliver them.
import { api } from './api.js';
import { VAPID_PUBLIC_KEY } from './config.js';

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// VAPID application-server keys are URL-safe base64; PushManager wants a Uint8Array.
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Does this live subscription still belong to the key the server signs with? A
// subscription is bound forever to the applicationServerKey it was created with,
// while the server signs with whatever VAPID key its environment holds today.
// When the two disagree the push service rejects every send with 403 — and 403 is
// NOT one of the statuses the backend prunes (it prunes 404/410, the genuinely
// gone ones), so the dead row survives every nightly batch and that user simply
// never hears from us again.
//
// An unverifiable subscription (no `options`, unreadable key) counts as MATCHING
// on purpose: we never destroy a subscription we merely failed to check.
function keyMatches(sub, base64) {
  const have = sub && sub.options && sub.options.applicationServerKey;
  if (!have || !base64) return true;
  let want;
  try { want = urlBase64ToUint8Array(base64); } catch (_) { return true; }
  const got = new Uint8Array(have);
  if (got.length !== want.length) return false;
  for (let i = 0; i < got.length; i++) { if (got[i] !== want[i]) return false; }
  return true;
}

let vapidKeyPromise;
async function getVapidKey() {
  if (VAPID_PUBLIC_KEY) return VAPID_PUBLIC_KEY;
  if (!vapidKeyPromise) {
    vapidKeyPromise = api.pushPublicKey().then((r) => (r && r.key) || null).catch(() => null);
  }
  return vapidKeyPromise;
}

// The /plus-scoped registration. Works even when the profile overlay is opened
// from an article page OUTSIDE /plus/ (where no SW controls the page): we fetch
// the /plus/ registration by scope, registering it on demand, and wait until it
// has an active worker so pushManager.subscribe() can run.
async function pushRegistration() {
  let reg = await navigator.serviceWorker.getRegistration('/plus/');
  if (!reg) reg = await navigator.serviceWorker.register('/plus/sw.js', { scope: '/plus/' });
  if (!reg.active) {
    const worker = reg.installing || reg.waiting;
    if (worker) {
      await new Promise((resolve) => {
        worker.addEventListener('statechange', () => { if (worker.state === 'activated') resolve(); });
      });
    }
  }
  return reg;
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await pushRegistration();
  return reg.pushManager.getSubscription();
}

// Make sure a saved push subscription exists (requesting permission if needed).
// Returns one of: 'ok' | 'denied' | 'unsupported' | 'error'. Callers use this to
// gate a reminder toggle: only flip it on when this returns 'ok'.
export async function ensurePushSubscription() {
  if (!pushSupported()) return 'unsupported';
  let perm = Notification.permission;
  if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch (_) { return 'error'; } }
  if (perm !== 'granted') return 'denied';

  let reg;
  try { reg = await pushRegistration(); } catch (_) { return 'error'; }
  let sub = await reg.pushManager.getSubscription();
  const key = await getVapidKey();

  // A subscription bound to a superseded VAPID key is worse than no subscription
  // at all: it looks healthy here AND in the database, and fails 403 forever at
  // send time. Drop it on both sides so the subscribe below mints a valid one.
  // This is precisely what made "turn the switch off and then on again" the only
  // cure anyone had found — off calls unsubscribe(), and so happened to rebuild it.
  if (sub && !keyMatches(sub, key)) {
    const dead = sub.endpoint;
    try { await sub.unsubscribe(); } catch (_) { /* ignore */ }
    try { await api.deletePushSubscription(dead); } catch (_) { /* ignore */ }
    sub = null;
  }

  if (!sub) {
    if (!key) return 'error';
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    } catch (_) { return 'error'; }
  }
  try { await api.savePushSubscription(sub.toJSON()); } catch (_) { return 'error'; }
  return 'ok';
}

// Silent repair pass, safe to call on any page load for a signed-in reader who
// has notifications switched on. Returns the same codes as ensurePushSubscription,
// plus 'skipped' when it deliberately stood down.
//
// WHY IT EXISTS: a push subscription can go stale with nobody doing anything
// wrong — the browser rotates its endpoint, the site's VAPID key is regenerated,
// the user clears site data. Nothing in the product ever noticed. The stored
// preference stayed on, the database still held its row, `push_subscribed` still
// counted the user, and the only known cure was flipping the switch off and on by
// hand. Nobody is going to do that on 89 accounts, so the repair has to be ours.
//
// Two deliberate limits. It NEVER raises the permission prompt: without a click
// gesture Safari refuses it and Chrome demotes it to quiet UI, and a "Block" is
// permanent — so it stands down unless permission is already granted. And it runs
// once per tab session, so a reader who opens ten articles writes one row, not ten.
const SS_HEALED = 'dcp:push:healed';

export async function healPushSubscription() {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission !== 'granted') return 'skipped';
  try {
    if (sessionStorage.getItem(SS_HEALED) === '1') return 'skipped';
    sessionStorage.setItem(SS_HEALED, '1');
  } catch (_) { /* no sessionStorage (private mode): repair anyway, just unthrottled */ }
  return ensurePushSubscription();
}

// Drop the browser subscription and tell the backend to forget it. Called when
// the user turns every reminder off, so we never hold a dead subscription.
export async function removePushSubscription() {
  if (!pushSupported()) return;
  let reg;
  try { reg = await pushRegistration(); } catch (_) { return; }
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  try { await sub.unsubscribe(); } catch (_) { /* ignore */ }
  try { await api.deletePushSubscription(endpoint); } catch (_) { /* ignore */ }
}
