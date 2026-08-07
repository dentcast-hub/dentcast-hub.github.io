// @vitest-environment jsdom
// Drives the REAL shipped push module (/plus/js/push.js).
//
// The bug these pin down (found 2026-08-07): a push subscription is bound to the
// applicationServerKey it was created with, but the server signs with whatever
// VAPID key its environment holds today. When those disagree the push service
// answers 403 — which webpush.ts does NOT prune (it prunes only 404/410) — so the
// row survives every nightly batch and the account silently never receives another
// notification. ensurePushSubscription() re-saved such a subscription unchanged,
// which is why "turn the switch off and on again" was the only cure: OFF calls
// unsubscribe(), and so happened to rebuild it.
import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

const SERVER_KEY = 'BEk7rat6tkKwhux7PZaXOjbcwg7eLBo1mcOfmTahglMi6-58elwC6To0KmZm6GQ9Mc4b3_6-8Y7pbEGy82hUqCs';

const calls: Array<{ op: string; args: any[] }> = [];

vi.mock('/plus/js/api.js', () => ({
  api: {
    pushPublicKey: () => Promise.resolve({ key: SERVER_KEY }),
    savePushSubscription: (sub: any) => { calls.push({ op: 'save', args: [sub] }); return Promise.resolve({ ok: true }); },
    deletePushSubscription: (endpoint: string) => { calls.push({ op: 'delete', args: [endpoint] }); return Promise.resolve({ ok: true }); },
  },
}));

// config.js hardcodes no key in production (OVERRIDE.vapidPublicKey || ''), so
// the module fetches it from the API — mirror that here.
vi.mock('/plus/js/config.js', () => ({ VAPID_PUBLIC_KEY: '' }));

function b64ToBytes(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** A subscription whose applicationServerKey is `key` (null = key unreadable). */
function makeSub(endpoint: string, key: string | null) {
  return {
    endpoint,
    options: key === null ? undefined : { applicationServerKey: b64ToBytes(key).buffer },
    unsubscribe: () => { calls.push({ op: 'unsubscribe', args: [endpoint] }); return Promise.resolve(true); },
    toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }),
  };
}

let existing: any = null;
let subscribed: any = null;

function installEnv() {
  (globalThis as any).PushManager = function () {};
  (globalThis as any).Notification = { permission: 'granted', requestPermission: () => Promise.resolve('granted') };
  const pushManager = {
    getSubscription: () => Promise.resolve(existing),
    subscribe: (opts: any) => {
      calls.push({ op: 'subscribe', args: [new Uint8Array(opts.applicationServerKey)] });
      subscribed = makeSub('https://fcm.googleapis.com/fresh', SERVER_KEY);
      return Promise.resolve(subscribed);
    },
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: () => Promise.resolve({ active: true, pushManager }) },
  });
}

beforeEach(() => {
  calls.length = 0;
  existing = null;
  subscribed = null;
  try { sessionStorage.clear(); } catch (_) { /* noop */ }
  installEnv();
});

const { ensurePushSubscription, healPushSubscription } = await import('/plus/js/push.js');

describe('push subscription self-heal', () => {
  it('replaces a subscription bound to a superseded VAPID key', async () => {
    // Same length, different bytes: a key from a previous generation.
    const stale = SERVER_KEY.replace('BEk7', 'BZz9');
    existing = makeSub('https://fcm.googleapis.com/stale', stale);

    const res = await ensurePushSubscription();

    expect(res).toBe('ok');
    expect(calls.map((c) => c.op)).toContain('unsubscribe');
    // The server must forget the dead endpoint too, or the 403 row outlives the
    // browser subscription that justified it.
    expect(calls.find((c) => c.op === 'delete')?.args[0]).toBe('https://fcm.googleapis.com/stale');
    expect(calls.find((c) => c.op === 'subscribe')).toBeTruthy();
    expect(calls.find((c) => c.op === 'save')?.args[0].endpoint).toBe('https://fcm.googleapis.com/fresh');
  });

  it('leaves a subscription on the current key alone', async () => {
    existing = makeSub('https://fcm.googleapis.com/good', SERVER_KEY);

    const res = await ensurePushSubscription();

    expect(res).toBe('ok');
    expect(calls.map((c) => c.op)).not.toContain('unsubscribe');
    expect(calls.map((c) => c.op)).not.toContain('subscribe');
    // It is still re-saved: that is what repairs a row the browser rotated away from.
    expect(calls.find((c) => c.op === 'save')?.args[0].endpoint).toBe('https://fcm.googleapis.com/good');
  });

  it('never discards a subscription whose key it cannot read', async () => {
    // Older browsers expose no `options`. Unverifiable must mean "leave it".
    existing = makeSub('https://web.push.apple.com/opaque', null);

    const res = await ensurePushSubscription();

    expect(res).toBe('ok');
    expect(calls.map((c) => c.op)).not.toContain('unsubscribe');
    expect(calls.map((c) => c.op)).not.toContain('subscribe');
  });

  it('heal stands down when the browser has not granted permission', async () => {
    (globalThis as any).Notification.permission = 'default';
    existing = makeSub('https://fcm.googleapis.com/stale', SERVER_KEY.replace('BEk7', 'BZz9'));

    expect(await healPushSubscription()).toBe('skipped');
    // Crucially it did not prompt, and it touched nothing.
    expect(calls).toEqual([]);
  });

  it('heal runs once per tab session', async () => {
    existing = makeSub('https://fcm.googleapis.com/good', SERVER_KEY);

    expect(await healPushSubscription()).toBe('ok');
    const afterFirst = calls.length;
    expect(await healPushSubscription()).toBe('skipped');
    expect(calls.length).toBe(afterFirst);
  });
});
