import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { makeApp, resetDb } from './helpers.js';
import { pool, one } from '../src/db.js';
import { config } from '../src/config.js';
import { outboundFetch, probe, describeError, proxyConfigured } from '../src/providers/outbound.js';

// web-push is mocked so a delivery test never leaves the process. The sender
// under test is the REAL one; only the transport is swapped.
vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));
// eslint-disable-next-line import/first
import webpush from 'web-push';
// eslint-disable-next-line import/first
import { WebPushNotificationSender } from '../src/providers/notifications/webpush.js';

const sendNotification = vi.mocked(webpush.sendNotification);

let app: FastifyInstance;
const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  vi.restoreAllMocks();
  sendNotification.mockReset();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

/** A local server that accepts the connection and then never answers — the shape
 *  of a filtered host, which is what the timeout exists for. */
async function silentServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer(() => { /* deliberately no response */ });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }),
  };
}

async function echoServer(status = 204): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((_req, res) => { res.writeHead(status); res.end(); });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((r) => { server.close(() => r()); }),
  };
}

// --- outbound: the timeout -------------------------------------------------

describe('outboundFetch', () => {
  it('aborts a hanging request instead of waiting forever', async () => {
    const s = await silentServer();
    try {
      const started = Date.now();
      await expect(outboundFetch(s.url, {}, { timeoutMs: 200 })).rejects.toThrow();
      expect(Date.now() - started).toBeLessThan(3000);
    } finally {
      await s.close();
    }
  });

  it('describes a timeout as a timeout, not an anonymous fetch failure', async () => {
    const s = await silentServer();
    try {
      const err = await outboundFetch(s.url, {}, { timeoutMs: 150 }).catch((e: unknown) => e);
      expect(describeError(err, 150)).toBe('timeout after 150ms');
    } finally {
      await s.close();
    }
  });

  it('passes a normal request straight through', async () => {
    const s = await echoServer(204);
    try {
      const res = await outboundFetch(s.url, { method: 'GET' }, { timeoutMs: 5000 });
      expect(res.status).toBe(204);
    } finally {
      await s.close();
    }
  });
});

// --- outbound: the reachability probe --------------------------------------

describe('probe', () => {
  it('counts any HTTP answer as reachable (a 404 root is still a live route)', async () => {
    const s = await echoServer(404);
    try {
      const r = await probe(s.url);
      expect(r.ok).toBe(true);
      expect(r.status).toBe(404);
      expect(r.via).toBe(proxyConfigured() ? 'proxy' : 'direct');
    } finally {
      await s.close();
    }
  });

  it('reports an unreachable host as a result, never a throw', async () => {
    const s = await echoServer();
    const dead = s.url; // same port, but closed before we probe it
    await s.close();
    const r = await probe(dead, { timeoutMs: 500 });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

// --- web push: failures are now visible ------------------------------------

async function userWithSubs(endpoints: string[]): Promise<string> {
  const row = await one<{ id: string }>(
    "insert into profiles (phone, display_name) values ('09121110000', 'push') returning id",
  );
  for (const e of endpoints) {
    await pool.query(
      "insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, 'p256', 'authsecret')",
      [row!.id, e],
    );
  }
  return row!.id;
}
async function subCount(userId: string): Promise<number> {
  const r = await pool.query('select count(*)::int as n from push_subscriptions where user_id = $1', [userId]);
  return r.rows[0].n as number;
}

describe('WebPushNotificationSender failure reporting', () => {
  it('logs a delivery failure instead of swallowing it (the 2026-07-26 blind spot)', async () => {
    const userId = await userWithSubs(['https://fcm.googleapis.com/fcm/send/abc']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendNotification.mockRejectedValueOnce(Object.assign(new Error('fetch failed'), { statusCode: undefined }));

    await new WebPushNotificationSender().send(userId, 'hi', 'system');

    expect(warn).toHaveBeenCalledOnce();
    const line = warn.mock.calls[0][0] as string;
    expect(line).toContain('[notify:webpush:system]');
    expect(line).toContain('failed=1');
    expect(line).toContain('fcm.googleapis.com');
    // The endpoint path is a device secret: the host is logged, the URL is not.
    expect(line).not.toContain('/fcm/send/abc');
    // A network failure is NOT an expired subscription — the row must survive.
    expect(await subCount(userId)).toBe(1);
  });

  it('still prunes an expired subscription quietly', async () => {
    const userId = await userWithSubs(['https://fcm.googleapis.com/fcm/send/gone']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    sendNotification.mockRejectedValueOnce(Object.assign(new Error('gone'), { statusCode: 410 }));

    await new WebPushNotificationSender().send(userId, 'hi', 'system');

    expect(warn).not.toHaveBeenCalled();
    expect(await subCount(userId)).toBe(0);
  });

  it('one dead device never blocks the healthy ones', async () => {
    const userId = await userWithSubs([
      'https://fcm.googleapis.com/fcm/send/dead',
      'https://web.push.apple.com/live',
    ]);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendNotification
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { statusCode: 500 }))
      .mockResolvedValueOnce(undefined as never);

    await new WebPushNotificationSender().send(userId, 'hi', 'system');

    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(await subCount(userId)).toBe(2); // a 500 is not an expiry
  });
});

// --- the health endpoint ---------------------------------------------------

describe('GET /admin/notify/health', () => {
  it('requires admin credentials', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/notify/health?probe=0' });
    expect(res.statusCode).toBe(401);
  });

  it('reports each enabled channel and never sends anything', async () => {
    const provider = config.notify.provider;
    const vapidPrivate = config.push.vapidPrivateKey;
    config.notify.provider = 'webpush,telegram,bale';
    try {
      const res = await app.inject({
        method: 'GET', url: '/admin/notify/health?probe=0', headers: { authorization: basic },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.channels.telegram.enabled).toBe(true);
      expect(body.channels.webpush.enabled).toBe(true);
      expect(body.channels.bale.enabled).toBe(true);
      expect(body.probes).toEqual([]);          // probe=0 -> no network touched
      expect(sendNotification).not.toHaveBeenCalled(); // and no message to anyone
    } finally {
      config.notify.provider = provider;
      config.push.vapidPrivateKey = vapidPrivate;
    }
  });

  it('names the channel whose secret is missing from the environment', async () => {
    const provider = config.notify.provider;
    const token = config.notify.telegramBotToken;
    config.notify.provider = 'telegram';
    config.notify.telegramBotToken = '';
    try {
      const res = await app.inject({
        method: 'GET', url: '/admin/notify/health?probe=0', headers: { authorization: basic },
      });
      const body = res.json();
      expect(body.ok).toBe(false);
      expect(body.channels.telegram.configured).toBe(false);
      expect(body.problems.join(' ')).toContain('telegram');
    } finally {
      config.notify.provider = provider;
      config.notify.telegramBotToken = token;
    }
  });
});
