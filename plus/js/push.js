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
  if (!sub) {
    const key = await getVapidKey();
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
