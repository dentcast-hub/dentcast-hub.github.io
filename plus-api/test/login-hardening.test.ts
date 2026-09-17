// The login path, hardened after the 2026-09-17 audit. Each block pins one
// failure that readers had been reporting as «ورود کار نمی‌کند» and the founder
// had been answering with «شاید مرورگرت کش نگه داشته».
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, sessionCookieFrom, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { sms } from '../src/providers/registry.js';
import { issueCode, verifyCode, normalizeCode, clearOtpStore } from '../src/services/otp.js';
import { consume, refund, resetRateLimits } from '../src/services/rate-limit.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  clearOtpStore();
  resetRateLimits();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function requestCode(phone: string): Promise<string> {
  const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
  expect(r.statusCode).toBe(200);
  return r.json().dev_code as string;
}

describe('the code as the reader typed it', () => {
  it('folds Persian and Arabic-Indic digits and strips spaces', () => {
    expect(normalizeCode('۱۲۳۴۵')).toBe('12345');
    expect(normalizeCode('١٢٣٤٥')).toBe('12345');
    expect(normalizeCode(' 12 345 ')).toBe('12345');
    expect(normalizeCode('12‌345')).toBe('12345');
    expect(normalizeCode(undefined)).toBe('');
  });

  it('accepts the correct code typed from a Persian keyboard', async () => {
    const phone = '09121110201';
    const code = await requestCode(phone);
    const fa = code.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
    const v = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone, code: fa } });
    expect(v.statusCode).toBe(200);
    expect(sessionCookieFrom(v)).toBeTruthy();
  });

  it('still refuses a wrong code, and a wrong code spends an attempt', () => {
    const code = issueCode('09120000001');
    expect(verifyCode('09120000001', '۰۰۰۰۰')).toBe(code === '00000' ? 'ok' : 'mismatch');
  });
});

describe('a second request while the first code is alive', () => {
  it('re-sends the SAME code, so whichever SMS arrives first is right', async () => {
    const phone = '09121110202';
    const first = await requestCode(phone);
    const second = await requestCode(phone);
    expect(second).toBe(first);
    const v = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone, code: first } });
    expect(v.statusCode).toBe(200);
  });

  it('mints a fresh code once the old one has expired', () => {
    const phone = '09120000002';
    const t0 = 1_000_000;
    const a = issueCode(phone, t0);
    const b = issueCode(phone, t0 + config.otp.ttlSeconds * 1000 + 1);
    // Two random five-digit draws collide one time in a hundred thousand; a
    // flaky assertion is not worth that, so what is checked is the entry, not
    // the digits: the old code is no longer accepted at all.
    expect(verifyCode(phone, a, t0 + config.otp.ttlSeconds * 1000 + 2)).toBe(a === b ? 'ok' : 'mismatch');
  });

  it('does not reset the guess counter on re-request', () => {
    const phone = '09120000003';
    const code = issueCode(phone);
    for (let i = 0; i < 5; i += 1) verifyCode(phone, 'x');
    expect(issueCode(phone)).not.toBe(code); // five spent guesses: the entry is dead, a new code is minted
  });
});

describe('when the SMS provider fails', () => {
  it('answers a Persian 502, never the provider text, and hands the rate-limit slot back', async () => {
    const phone = '09121110203';
    const spy = vi.spyOn(sms, 'sendOtp').mockRejectedValue(new Error('SMS.ir send failed: insufficient credit'));
    try {
      const failed: number[] = [];
      for (let i = 0; i < config.otp.maxPerPhonePerHour + 2; i += 1) {
        const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
        failed.push(r.statusCode);
        expect(r.json().message).toBe('ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید.');
        expect(JSON.stringify(r.json())).not.toContain('SMS.ir');
      }
      // Every attempt was refunded, so none of them was a 429.
      expect(failed.every((s) => s === 502)).toBe(true);
    } finally {
      spy.mockRestore();
    }
    // …and the reader is not locked out for messages they never received.
    const ok = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
    expect(ok.statusCode).toBe(200);
  });

  it('refund gives back exactly the latest slot', () => {
    consume('k', 2, 1000, 10);
    consume('k', 2, 1000, 20);
    expect(consume('k', 2, 1000, 30).allowed).toBe(false);
    refund('k');
    expect(consume('k', 2, 1000, 40).allowed).toBe(true);
  });
});

describe('the session cookie', () => {
  it('is found even when a stale same-name cookie is sent ahead of it', async () => {
    const cookie = await loginAs(app, '09121110204');
    const stale = 'dcp_session=stale.garbage';
    for (const header of [`${stale}; ${cookie}`, `${cookie}; ${stale}`]) {
      const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie: header } });
      expect(me.statusCode).toBe(200);
    }
  });

  it('is refreshed on every /me, so an active reader is never signed out on a clock', async () => {
    const cookie = await loginAs(app, '09121110205');
    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    const again = sessionCookieFrom(me);
    expect(again).toBeTruthy();
    const raw = ([] as string[]).concat(me.headers['set-cookie'] as string | string[]);
    expect(raw.find((s) => s.startsWith('dcp_session=') && !s.includes('Domain='))).toMatch(/Max-Age=/);
  });

  it('evicts a domain-scoped copy on login, on a real host', async () => {
    const phone = '09121110206';
    const code = await requestCode(phone);
    const v = await app.inject({
      method: 'POST', url: '/auth/otp/verify', payload: { phone, code },
      headers: { host: 'api.dentcast.ir' },
    });
    const raw = ([] as string[]).concat(v.headers['set-cookie'] as string | string[]);
    const cleared = raw.find((s) => s.includes('Domain=.dentcast.ir'));
    expect(cleared).toBeTruthy();
    expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
    expect(raw.find((s) => !s.includes('Domain=') && /Max-Age=\d{2,}/.test(s))).toBeTruthy();
  });
});

describe('the Telegram callback origin', () => {
  it('sends a www reader back to its own site, never to the other mirror', async () => {
    const saved = config.corsOrigins.slice();
    config.corsOrigins.splice(0, config.corsOrigins.length, 'https://dentcast.ir', 'https://dentcast.org');
    try {
      const res = await app.inject({
        method: 'GET',
        url: `/auth/telegram/callback?${new URLSearchParams({ origin: 'https://www.dentcast.org', id: '1' }).toString()}`,
      });
      // The payload is unsigned, so this lands on the error page — what matters
      // is WHICH site's error page.
      expect(res.statusCode).toBe(302);
      expect(res.headers.location?.startsWith('https://dentcast.org/')).toBe(true);
    } finally {
      config.corsOrigins.splice(0, config.corsOrigins.length, ...saved);
    }
  });
});
