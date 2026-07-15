import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, sessionCookieFrom } from './helpers.js';
import { pool } from '../src/db.js';

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
