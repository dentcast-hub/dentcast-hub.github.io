import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, sessionCookieFrom, loginAs } from './helpers.js';
import { pool } from '../src/db.js';

// Must match TELEGRAM_BOT_TOKEN in vitest.config.ts.
const BOT_TOKEN = '123456:TEST-telegram-bot-token';

function sign(fields: Record<string, string>): string {
  const dcs = Object.keys(fields)
    .filter((k) => k !== 'hash').sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  return crypto.createHmac('sha256', secret).update(dcs).digest('hex');
}
function tgPayload(id: string): Record<string, string> {
  const base = { id, first_name: 'Tg', username: 'tg_' + id, auth_date: String(Math.floor(Date.now() / 1000)) };
  return { ...base, hash: sign(base) };
}
/** Log in via Telegram (creates a phone-less account) and return its session cookie. */
async function telegramLogin(app: FastifyInstance, id: string): Promise<string> {
  const qs = new URLSearchParams({ origin: 'http://localhost:5500', ...tgPayload(id) });
  const res = await app.inject({ method: 'GET', url: `/auth/telegram/callback?${qs.toString()}` });
  const cookie = sessionCookieFrom(res);
  if (!cookie) throw new Error('telegram login set no cookie');
  return cookie;
}
async function otpCode(app: FastifyInstance, phone: string): Promise<string> {
  const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
  return r.json().dev_code as string;
}

let app: FastifyInstance;
beforeEach(async () => { await resetDb(); if (!app) app = await makeApp(); });
afterAll(async () => { await app?.close(); await pool.end(); });

describe('POST /auth/phone/link', () => {
  it('merges a Telegram account into an existing phone account, preserving the streak', async () => {
    // An older phone account WITH a streak + history.
    await loginAs(app, '09121112222');
    const pa = await pool.query("select id from profiles where phone = '09121112222'");
    const paId = pa.rows[0].id;
    await pool.query(
      'update profiles set current_streak = 5, longest_streak = 5, last_active_day = current_date where id = $1',
      [paId],
    );

    // A separate Telegram-only account, with some work done on it.
    const tgCookie = await telegramLogin(app, '80808');
    const t = await pool.query('select id from profiles where telegram_id = 80808');
    const tId = t.rows[0].id;
    expect(tId).not.toBe(paId);
    await pool.query("insert into highlights (user_id, content_id, exact) values ($1, 'c/x', 'txt')", [tId]);

    // While logged in as Telegram, verify the phone -> merge into the phone account.
    const code = await otpCode(app, '09121112222');
    const res = await app.inject({
      method: 'POST', url: '/auth/phone/link',
      headers: { cookie: tgCookie }, payload: { phone: '09121112222', code },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().merged).toBe(true);
    expect(sessionCookieFrom(res)).toBeTruthy(); // session switched to the phone account

    // One account remains: the phone account, now with the Telegram id + streak.
    const rows = await pool.query('select id, phone, telegram_id, current_streak from profiles');
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].id).toBe(paId);
    expect(rows.rows[0].phone).toBe('09121112222');
    expect(Number(rows.rows[0].telegram_id)).toBe(80808);
    expect(rows.rows[0].current_streak).toBe(5); // streak preserved

    // Data + identity moved to the surviving account.
    const hl = await pool.query('select user_id from highlights');
    expect(hl.rows[0].user_id).toBe(paId);
    const idn = await pool.query("select user_id from auth_identities where provider_user_id = '80808'");
    expect(idn.rows[0].user_id).toBe(paId);
  });

  it('attaches a brand-new phone to the current account (no merge)', async () => {
    const tgCookie = await telegramLogin(app, '80809');
    const code = await otpCode(app, '09121113333');
    const res = await app.inject({
      method: 'POST', url: '/auth/phone/link',
      headers: { cookie: tgCookie }, payload: { phone: '09121113333', code },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().merged).toBe(false);

    const rows = await pool.query('select phone, telegram_id from profiles');
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].phone).toBe('09121113333');
    expect(Number(rows.rows[0].telegram_id)).toBe(80809);
  });

  it('rejects when the current account already has a phone (409)', async () => {
    const cookie = await loginAs(app, '09121114444');
    const code = await otpCode(app, '09121115555');
    const res = await app.inject({
      method: 'POST', url: '/auth/phone/link',
      headers: { cookie }, payload: { phone: '09121115555', code },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('already_has_phone');
  });

  it('rejects a wrong OTP code (400) and does not merge', async () => {
    const tgCookie = await telegramLogin(app, '80810');
    await otpCode(app, '09121116666');
    const res = await app.inject({
      method: 'POST', url: '/auth/phone/link',
      headers: { cookie: tgCookie }, payload: { phone: '09121116666', code: '00000' },
    });
    expect(res.statusCode).toBe(400);
    const count = await pool.query('select count(*)::int n from profiles');
    expect(count.rows[0].n).toBe(1); // still just the telegram account
  });

  it('requires a session (401 when logged out)', async () => {
    const code = await otpCode(app, '09121117777');
    const res = await app.inject({
      method: 'POST', url: '/auth/phone/link',
      payload: { phone: '09121117777', code },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /auth/telegram/unlink', () => {
  it('disconnects Telegram from an account that also has a phone', async () => {
    // Telegram account + attach a phone -> it now has both.
    const tgCookie = await telegramLogin(app, '90901');
    const code = await otpCode(app, '09121118888');
    const linked = await app.inject({
      method: 'POST', url: '/auth/phone/link',
      headers: { cookie: tgCookie }, payload: { phone: '09121118888', code },
    });
    const cookie = sessionCookieFrom(linked) || tgCookie;

    const res = await app.inject({ method: 'POST', url: '/auth/telegram/unlink', headers: { cookie } });
    expect(res.statusCode).toBe(200);

    const p = await pool.query("select telegram_id from profiles where phone = '09121118888'");
    expect(p.rows[0].telegram_id).toBeNull();
    const idn = await pool.query("select count(*)::int n from auth_identities where provider_user_id = '90901'");
    expect(idn.rows[0].n).toBe(0);
  });

  it('refuses to disconnect a Telegram-only account (409, no lock-out)', async () => {
    const tgCookie = await telegramLogin(app, '90902');
    const res = await app.inject({ method: 'POST', url: '/auth/telegram/unlink', headers: { cookie: tgCookie } });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('no_fallback');
    // still linked
    const idn = await pool.query("select count(*)::int n from auth_identities where provider_user_id = '90902'");
    expect(idn.rows[0].n).toBe(1);
  });

  it('requires a session (401)', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/telegram/unlink' });
    expect(res.statusCode).toBe(401);
  });
});
