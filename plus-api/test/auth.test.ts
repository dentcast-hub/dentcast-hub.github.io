import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, sessionCookieFrom, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import {
  activateMonths, grantLifetime, sweepExpiredSubscriptions,
} from '../src/services/subscription.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('OTP flow', () => {
  it('requests a code, verifies it, creates a profile, and sets a session', async () => {
    const phone = '09121110001';

    const reqRes = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
    expect(reqRes.statusCode).toBe(200);
    const code = reqRes.json().dev_code as string;
    expect(code).toMatch(/^\d{5}$/);

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      payload: { phone, code },
    });
    expect(verifyRes.statusCode).toBe(200);
    const body = verifyRes.json();
    expect(body.user.tier).toBe('free');
    expect(body.user.display_name).toBeTruthy();
    expect(body.return_to).toBe('/plus/'); // default when none supplied

    const cookie = sessionCookieFrom(verifyRes);
    expect(cookie).toBeTruthy();

    // profile persisted exactly once
    const count = await pool.query('select count(*)::int as n from profiles where phone = $1', [phone]);
    expect(count.rows[0].n).toBe(1);

    // session works: /me returns the same user, no due_card_count for free
    const meRes = await app.inject({ method: 'GET', url: '/me', headers: { cookie: cookie! } });
    expect(meRes.statusCode).toBe(200);
    const me = meRes.json();
    expect(me.tier).toBe('free');
    expect('due_card_count' in me).toBe(false);
  });

  it('reports is_new on first login and not on subsequent logins (onboarding)', async () => {
    const phone = '09121110099';
    const r1 = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
    const v1 = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone, code: r1.json().dev_code } });
    expect(v1.json().is_new).toBe(true);

    const r2 = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
    const v2 = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone, code: r2.json().dev_code } });
    expect(v2.json().is_new).toBe(false);
  });

  it('does not create a second profile when the same phone logs in again', async () => {
    const phone = '09121110002';
    for (let i = 0; i < 2; i += 1) {
      const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
      const code = r.json().dev_code as string;
      await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone, code } });
    }
    const count = await pool.query('select count(*)::int as n from profiles where phone = $1', [phone]);
    expect(count.rows[0].n).toBe(1);
  });

  it('rejects an incorrect code', async () => {
    const phone = '09121110003';
    await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      payload: { phone, code: '00000' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('mismatch');
  });

  it('rejects an invalid phone number', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '12345' } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_phone');
  });

  it('honors a safe return_to and rejects an open-redirect return_to', async () => {
    const phone = '09121110004';
    const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
    const code = r.json().dev_code as string;

    const good = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      payload: { phone, code, return_to: '/chairside/chairside-25.html' },
    });
    expect(good.json().return_to).toBe('/chairside/chairside-25.html');

    // second login to test the malicious return_to (code was consumed)
    const r2 = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
    const code2 = r2.json().dev_code as string;
    const bad = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      payload: { phone, code: code2, return_to: 'https://evil.example/steal' },
    });
    expect(bad.json().return_to).toBe('/plus/');
  });
});

describe('OTP rate limiting', () => {
  it('blocks after the per-phone hourly limit (default 5)', async () => {
    const phone = '09121110010';
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
      statuses.push(r.statusCode);
    }
    // first 5 allowed, 6th blocked
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});

describe('/me without a session', () => {
  it('returns 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });
});

describe('/me subscription state', () => {
  const PHONE = '09121700001';

  const me = async (cookie: string) =>
    (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();

  it('is null for someone who has never subscribed', async () => {
    const cookie = await loginAs(app, PHONE);
    const body = await me(cookie);
    expect(body.tier).toBe('free');
    expect(body.subscription).toBeNull();
  });

  it('carries the expiry, the day of access left, and the founder flag', async () => {
    const cookie = await loginAs(app, PHONE);
    const { id } = await me(cookie);
    await activateMonths(id, 6, { source: 'payment' });

    const body = await me(cookie);
    expect(body.tier).toBe('premium');
    expect(body.subscription.is_founder).toBe(false);
    expect(body.subscription.is_premium).toBe(true);
    expect(body.subscription.expires_at).toBeTruthy();
    expect(body.subscription.expires_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.subscription.days_left).toBeGreaterThan(175);
  });

  it('says lifetime with no countdown for a founder', async () => {
    const cookie = await loginAs(app, PHONE);
    const { id } = await me(cookie);
    await grantLifetime(id, { source: 'admin' });

    const body = await me(cookie);
    expect(body.subscription.is_founder).toBe(true);
    expect(body.subscription.days_left).toBeNull();
    expect(body.subscription.expires_on).toBeNull();
  });

  it('still describes the subscription after it lapses, so the client can say so', async () => {
    const cookie = await loginAs(app, PHONE);
    const { id } = await me(cookie);
    await activateMonths(id, 1, { source: 'payment', now: new Date('2026-01-05T09:00:00Z') });
    await sweepExpiredSubscriptions(new Date('2026-08-05T00:00:00Z'));

    const body = await me(cookie);
    // Back to free — and the field survives, because "your subscription ended,
    // renew" is a message only a lapsed user needs to see.
    expect(body.tier).toBe('free');
    expect(body.subscription.is_premium).toBe(false);
    expect(body.subscription.status).toBe('expired');
    expect(body.subscription.days_left).toBe(0);
  });

  it('leaves a league-prize premium without a subscription of its own', async () => {
    const cookie = await loginAs(app, PHONE);
    const { id } = await me(cookie);
    await pool.query(
      `insert into premium_grants (user_id, week_start, granted_at, expires_at)
       values ($1, '2026-02-07', now(), now() + interval '2 days')`,
      [id],
    );
    await pool.query("update profiles set tier = 'premium' where id = $1", [id]);

    const body = await me(cookie);
    // Premium, but not a subscriber — pending_premium_grant is what speaks for
    // the prize, and a renewal prompt must not appear for it.
    expect(body.tier).toBe('premium');
    expect(body.subscription).toBeNull();
    expect(body.pending_premium_grant).not.toBeNull();
  });
});
