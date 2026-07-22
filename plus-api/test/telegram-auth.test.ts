import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, sessionCookieFrom, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { verifyTelegramAuth } from '../src/services/telegram-auth.js';

// Must match TELEGRAM_BOT_TOKEN in vitest.config.ts.
const BOT_TOKEN = '123456:TEST-telegram-bot-token';
// One of the CORS origins loaded from .env, so the callback accepts it.
const ORIGIN = 'http://localhost:5500';

function sign(fields: Record<string, string>, token = BOT_TOKEN): string {
  const dcs = Object.keys(fields)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = crypto.createHash('sha256').update(token).digest();
  return crypto.createHmac('sha256', secret).update(dcs).digest('hex');
}

function payload(overrides: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = {
    id: '77777',
    first_name: 'Sara',
    username: 'sara_t',
    auth_date: String(Math.floor(Date.now() / 1000)),
    ...overrides,
  };
  return { ...base, hash: sign(base) };
}

function callbackUrl(fields: Record<string, string>, extra: Record<string, string> = {}): string {
  const qs = new URLSearchParams({ origin: ORIGIN, ...extra, ...fields });
  return `/auth/telegram/callback?${qs.toString()}`;
}

// --- pure verifier ----------------------------------------------------------

describe('verifyTelegramAuth', () => {
  it('accepts a correctly-signed, fresh payload', () => {
    expect(verifyTelegramAuth(payload(), BOT_TOKEN, 86400).ok).toBe(true);
  });

  it('rejects a tampered field (signature no longer matches)', () => {
    const p = payload();
    p.id = '99999'; // changed after signing
    expect(verifyTelegramAuth(p, BOT_TOKEN, 86400)).toMatchObject({ ok: false, reason: 'bad_signature' });
  });

  it('rejects the wrong bot token', () => {
    expect(verifyTelegramAuth(payload(), 'other:token', 86400)).toMatchObject({ ok: false, reason: 'bad_signature' });
  });

  it('rejects a stale auth_date', () => {
    const old = String(Math.floor(Date.now() / 1000) - 86400 - 60);
    expect(verifyTelegramAuth(payload({ auth_date: old }), BOT_TOKEN, 86400)).toMatchObject({ ok: false, reason: 'expired' });
  });

  it('rejects a missing hash', () => {
    const p = payload();
    delete p.hash;
    expect(verifyTelegramAuth(p, BOT_TOKEN, 86400)).toMatchObject({ ok: false, reason: 'missing_hash' });
  });

  it('is order-independent (signs the same set regardless of key order)', () => {
    const p = payload({ last_name: 'K', photo_url: 'https://t.me/x.jpg' });
    expect(verifyTelegramAuth(p, BOT_TOKEN, 86400).ok).toBe(true);
  });
});

// --- callback route ---------------------------------------------------------

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('GET /auth/telegram/callback', () => {
  it('creates a phone-less account with an empty name and sets a session', async () => {
    const res = await app.inject({
      method: 'GET',
      url: callbackUrl(payload(), { return_to: '/chairside/chairside-25.html' }),
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`${ORIGIN}/chairside/chairside-25.html`);
    expect(sessionCookieFrom(res)).toBeTruthy();

    const prof = await pool.query('select phone, telegram_id, display_name from profiles');
    expect(prof.rowCount).toBe(1);
    expect(prof.rows[0].phone).toBeNull();
    expect(Number(prof.rows[0].telegram_id)).toBe(77777);
    expect(prof.rows[0].display_name).toBe(''); // empty -> mandatory name gate fires client-side

    const idn = await pool.query(
      "select provider, provider_user_id, username from auth_identities where provider = 'telegram'",
    );
    expect(idn.rowCount).toBe(1);
    expect(idn.rows[0].provider_user_id).toBe('77777');
    expect(idn.rows[0].username).toBe('sara_t');
  });

  it('does not duplicate the account on a returning login', async () => {
    await app.inject({ method: 'GET', url: callbackUrl(payload()) });
    // fresh timestamp so it is a distinct valid payload for the same id
    await app.inject({ method: 'GET', url: callbackUrl(payload({ auth_date: String(Math.floor(Date.now() / 1000)) })) });

    const prof = await pool.query('select count(*)::int n from profiles');
    const idn = await pool.query('select count(*)::int n from auth_identities');
    expect(prof.rows[0].n).toBe(1);
    expect(idn.rows[0].n).toBe(1);
  });

  it('adopts an existing profile already linked by telegram_id (notifications), not a new one', async () => {
    // Simulate a phone user who linked Telegram for notifications earlier.
    const created = await pool.query(
      "insert into profiles (phone, telegram_id, display_name) values ('09121110001', 88888, 'کاربر') returning id",
    );
    const existingId = created.rows[0].id;

    const res = await app.inject({ method: 'GET', url: callbackUrl(payload({ id: '88888' })) });
    expect(res.statusCode).toBe(302);

    const prof = await pool.query('select count(*)::int n from profiles');
    expect(prof.rows[0].n).toBe(1); // adopted, not duplicated

    const idn = await pool.query(
      "select user_id from auth_identities where provider = 'telegram' and provider_user_id = '88888'",
    );
    expect(idn.rowCount).toBe(1);
    expect(idn.rows[0].user_id).toBe(existingId);
  });

  it('links Telegram to the logged-in phone account (both then identify one user)', async () => {
    // A phone/OTP user is already signed in.
    const cookie = await loginAs(app, '09121110055');
    const before = await pool.query('select id, telegram_id from profiles');
    const phoneUserId = before.rows[0].id;
    expect(before.rows[0].telegram_id).toBeNull();

    // They click "Login with Telegram" -> the session cookie rides the redirect.
    const res = await app.inject({
      method: 'GET',
      url: callbackUrl(payload({ id: '55555' })),
      headers: { cookie },
    });
    expect(res.statusCode).toBe(302);

    // No new account: Telegram was linked to the SAME profile.
    const count = await pool.query('select count(*)::int n from profiles');
    expect(count.rows[0].n).toBe(1);

    const prof = await pool.query('select id, telegram_id from profiles');
    expect(prof.rows[0].id).toBe(phoneUserId);
    expect(Number(prof.rows[0].telegram_id)).toBe(55555);

    const idn = await pool.query(
      "select user_id from auth_identities where provider_user_id = '55555'",
    );
    expect(idn.rows[0].user_id).toBe(phoneUserId);

    // Next time: a bare Telegram login (no session) resolves to the same user.
    const res2 = await app.inject({
      method: 'GET',
      url: callbackUrl(payload({ id: '55555', auth_date: String(Math.floor(Date.now() / 1000)) })),
    });
    expect(res2.statusCode).toBe(302);
    const count2 = await pool.query('select count(*)::int n from profiles');
    expect(count2.rows[0].n).toBe(1);
  });

  it('merges a phone account into the pre-existing Telegram account (no duplicate)', async () => {
    // 1) The person first signs in with Telegram -> account A (phone-less).
    await app.inject({ method: 'GET', url: callbackUrl(payload({ id: '66666' })) });
    const a = await pool.query("select user_id from auth_identities where provider_user_id = '66666'");
    const accountA = a.rows[0].user_id;

    // 2) Later they sign in with phone/OTP -> a SEPARATE account B, and do some
    //    work on it (a highlight + an article note).
    const cookieB = await loginAs(app, '09121110066');
    const b = await pool.query("select id from profiles where phone = '09121110066'");
    const accountB = b.rows[0].id;
    expect(accountB).not.toBe(accountA);
    await pool.query(
      "insert into highlights (user_id, content_id, exact) values ($1, 'chairside/x', 'text')",
      [accountB],
    );
    await pool.query(
      "insert into article_notes (user_id, content_id, note) values ($1, 'chairside/x', 'note')",
      [accountB],
    );

    // 3) While logged in as B they connect Telegram -> id 66666 already owned by
    //    A, so B is merged INTO A and removed.
    const res = await app.inject({
      method: 'GET',
      url: callbackUrl(payload({ id: '66666', auth_date: String(Math.floor(Date.now() / 1000)) })),
      headers: { cookie: cookieB },
    });
    expect(res.statusCode).toBe(302);

    // Exactly one account remains (A); B is gone.
    const remaining = await pool.query('select id, phone from profiles');
    expect(remaining.rowCount).toBe(1);
    expect(remaining.rows[0].id).toBe(accountA);
    expect(remaining.rows[0].phone).toBe('09121110066'); // phone moved onto A

    // B's data was repointed to A, not lost.
    const hl = await pool.query('select user_id from highlights');
    expect(hl.rows[0].user_id).toBe(accountA);
    const note = await pool.query('select user_id from article_notes');
    expect(note.rows[0].user_id).toBe(accountA);

    // Still exactly one Telegram identity.
    const idn = await pool.query("select count(*)::int n from auth_identities where provider = 'telegram'");
    expect(idn.rows[0].n).toBe(1);
  });

  it('redirects to the error page on a bad signature', async () => {
    const p = payload();
    p.hash = 'deadbeef';
    const res = await app.inject({ method: 'GET', url: callbackUrl(p) });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`${ORIGIN}/plus/auth-error.html?reason=bad_signature`);
    expect(sessionCookieFrom(res)).toBeFalsy();
  });

  it('rejects an unlisted origin by falling back to a configured one', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/auth/telegram/callback?${new URLSearchParams({ origin: 'https://evil.example', ...payload() }).toString()}`,
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location?.startsWith('https://evil.example')).toBe(false);
  });
});
