import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, sessionCookieFrom, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import {
  verifyGoogleIdToken, setGoogleKeyFetcher, clearGoogleKeyCache, maskEmail, maxAgeFrom,
  jwksUrls, mergeKeySets,
  type GoogleJwk,
} from '../src/services/google-auth.js';

// Must match vitest.config.ts.
const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
const BOT_TOKEN = '123456:TEST-telegram-bot-token';
const ORIGIN = 'http://localhost:5500';

// --- a Google of our own ----------------------------------------------------
// One RSA pair stands in for Google's signing key; its public half is served to
// the verifier through the injected fetcher exactly as Google's JWK set would be.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const { publicKey: strangerPublic, privateKey: strangerPrivate } =
  crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

function jwkOf(key: crypto.KeyObject, kid: string): GoogleJwk {
  const j = key.export({ format: 'jwk' }) as { n: string; e: string };
  return { kid, kty: 'RSA', n: j.n, e: j.e, alg: 'RS256', use: 'sig' };
}
const KID = 'google-key-1';

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

interface TokenOpts {
  key?: crypto.KeyObject;
  kid?: string;
  alg?: string;
  nowSec?: number;
}

function makeToken(claims: Record<string, unknown>, opts: TokenOpts = {}): string {
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  const header = { alg: opts.alg ?? 'RS256', kid: opts.kid ?? KID, typ: 'JWT' };
  const payload = {
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    sub: '1234567890',
    email: 'reader@example.com',
    email_verified: true,
    name: 'Reader Example',
    picture: 'https://lh3.googleusercontent.com/a/x',
    iat: now,
    exp: now + 3600,
    ...claims,
  };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), opts.key ?? privateKey);
  return `${h}.${p}.${b64url(sig)}`;
}

function serveKeys(keys: GoogleJwk[], maxAgeMs = 3_600_000) {
  let calls = 0;
  const alls: boolean[] = [];
  setGoogleKeyFetcher(async (all) => { calls += 1; alls.push(all === true); return { keys, maxAgeMs }; });
  return { calls: () => calls, alls: () => alls };
}

async function telegramLogin(app: FastifyInstance, id: string): Promise<string> {
  const fields: Record<string, string> = {
    id, first_name: 'T', auth_date: String(Math.floor(Date.now() / 1000)),
  };
  const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  fields.hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  const qs = new URLSearchParams({ origin: ORIGIN, ...fields });
  const res = await app.inject({ method: 'GET', url: `/auth/telegram/callback?${qs.toString()}` });
  const cookie = sessionCookieFrom(res);
  if (!cookie) throw new Error('telegram login set no cookie');
  return cookie;
}

// --- the verifier ----------------------------------------------------------

describe('verifyGoogleIdToken', () => {
  beforeEach(() => { serveKeys([jwkOf(publicKey, KID)]); });

  it('accepts a token signed by the served key, for our audience, from Google', async () => {
    const r = await verifyGoogleIdToken(makeToken({}));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.identity).toEqual({
        sub: '1234567890',
        email: 'reader@example.com',
        name: 'Reader Example',
        picture: 'https://lh3.googleusercontent.com/a/x',
      });
    }
  });

  it('accepts the issuer without the scheme too', async () => {
    const r = await verifyGoogleIdToken(makeToken({ iss: 'accounts.google.com' }));
    expect(r.ok).toBe(true);
  });

  it('keeps the email only when Google says it is verified', async () => {
    const r = await verifyGoogleIdToken(makeToken({ email_verified: false }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.identity.email).toBeNull();
  });

  it('refuses a token minted for another site (aud)', async () => {
    const r = await verifyGoogleIdToken(makeToken({ aud: 'someone-else.apps.googleusercontent.com' }));
    expect(r).toEqual({ ok: false, reason: 'wrong_audience' });
  });

  it('refuses an issuer that is not Google', async () => {
    const r = await verifyGoogleIdToken(makeToken({ iss: 'https://accounts.example.com' }));
    expect(r).toEqual({ ok: false, reason: 'wrong_issuer' });
  });

  it('refuses an expired token, with a minute of grace', async () => {
    const now = Math.floor(Date.now() / 1000);
    expect(await verifyGoogleIdToken(makeToken({ exp: now - 120 }))).toEqual({ ok: false, reason: 'expired' });
    expect((await verifyGoogleIdToken(makeToken({ exp: now - 30 }))).ok).toBe(true);
  });

  it('refuses a token signed by a key Google did not publish', async () => {
    const r = await verifyGoogleIdToken(makeToken({}, { key: strangerPrivate }));
    expect(r).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('refuses a tampered payload', async () => {
    const t = makeToken({});
    const [h, , s] = t.split('.');
    const forged = b64url(JSON.stringify({ iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: '999', exp: 4102444800 }));
    const r = await verifyGoogleIdToken(`${h}.${forged}.${s}`);
    expect(r).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('refuses alg=none and anything that is not RS256 before touching a key', async () => {
    const h = b64url(JSON.stringify({ alg: 'none', kid: KID }));
    const p = b64url(JSON.stringify({ iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: '1' }));
    expect(await verifyGoogleIdToken(`${h}.${p}.`)).toEqual({ ok: false, reason: 'unsupported_alg' });
    expect(await verifyGoogleIdToken(makeToken({}, { alg: 'HS256' }))).toEqual({ ok: false, reason: 'unsupported_alg' });
  });

  it('refuses garbage without throwing', async () => {
    expect(await verifyGoogleIdToken('not-a-jwt')).toEqual({ ok: false, reason: 'malformed' });
    expect(await verifyGoogleIdToken('a.b.c')).toEqual({ ok: false, reason: 'malformed' });
    expect(await verifyGoogleIdToken(makeToken({ sub: '' }))).toEqual({ ok: false, reason: 'missing_sub' });
  });

  it('answers not_configured with no client id, before any fetch', async () => {
    const served = serveKeys([jwkOf(publicKey, KID)]);
    const r = await verifyGoogleIdToken(makeToken({}), { clientId: '' });
    expect(r).toEqual({ ok: false, reason: 'not_configured' });
    expect(served.calls()).toBe(0);
  });

  it('refetches ONCE for an unknown kid (a rotated key), asking EVERY source, then gives up', async () => {
    const served = serveKeys([jwkOf(strangerPublic, 'other')]);
    const r = await verifyGoogleIdToken(makeToken({}));
    expect(r).toEqual({ ok: false, reason: 'unknown_key' });
    // initial fetch (first source wins) + one miss-driven refetch (union of all)
    expect(served.calls()).toBe(2);
    expect(served.alls()).toEqual([false, true]);
    // A second bad token inside the cooldown costs no further fetch.
    await verifyGoogleIdToken(makeToken({}));
    expect(served.calls()).toBe(2);
  });

  it('picks up a rotated key on that refetch', async () => {
    let round = 0;
    setGoogleKeyFetcher(async () => {
      round += 1;
      return { keys: round === 1 ? [jwkOf(strangerPublic, 'old')] : [jwkOf(publicKey, KID)], maxAgeMs: 3_600_000 };
    });
    expect((await verifyGoogleIdToken(makeToken({}))).ok).toBe(true);
  });

  it('serves from cache within max-age', async () => {
    const served = serveKeys([jwkOf(publicKey, KID)]);
    await verifyGoogleIdToken(makeToken({}));
    await verifyGoogleIdToken(makeToken({ sub: '2' }));
    await verifyGoogleIdToken(makeToken({ sub: '3' }));
    expect(served.calls()).toBe(1);
  });

  it('keeps the last good key set when a refresh fails (a filtered route must not sign everyone out)', async () => {
    let fail = false;
    setGoogleKeyFetcher(async () => {
      if (fail) throw new Error('route filtered');
      return { keys: [jwkOf(publicKey, KID)], maxAgeMs: 1 }; // expires at once
    });
    expect((await verifyGoogleIdToken(makeToken({}))).ok).toBe(true);
    fail = true;
    await new Promise((r) => setTimeout(r, 5));
    expect((await verifyGoogleIdToken(makeToken({ sub: '2' }))).ok).toBe(true);
  });

  it('answers keys_unavailable when nothing was ever fetched and the route is down', async () => {
    setGoogleKeyFetcher(async () => { throw new Error('route filtered'); });
    expect(await verifyGoogleIdToken(makeToken({}))).toEqual({ ok: false, reason: 'keys_unavailable' });
  });

  it('reads GOOGLE_JWKS_URL as a list, mirrors first', () => {
    expect(jwksUrls(' https://dentcast.ir/plus/google-certs.json, https://dentcast.org/plus/google-certs.json ,, https://www.googleapis.com/oauth2/v3/certs'))
      .toEqual(['https://dentcast.ir/plus/google-certs.json', 'https://dentcast.org/plus/google-certs.json', 'https://www.googleapis.com/oauth2/v3/certs']);
    // the shipped default puts the site's own mirrors before Google
    const d = jwksUrls();
    expect(d[0]).toMatch(/^https:\/\/dentcast\.ir\/plus\/google-certs\.json$/);
    expect(d[d.length - 1]).toBe('https://www.googleapis.com/oauth2/v3/certs');
  });

  it('unions key sets by kid under the shortest max-age', () => {
    const a = { keys: [jwkOf(publicKey, 'k1'), jwkOf(strangerPublic, 'k2')], maxAgeMs: 3_600_000 };
    const b = { keys: [jwkOf(strangerPublic, 'k2'), jwkOf(publicKey, 'k3')], maxAgeMs: 600_000 };
    const m = mergeKeySets([a, b]);
    expect(m.keys.map((k) => k.kid)).toEqual(['k1', 'k2', 'k3']);
    expect(m.maxAgeMs).toBe(600_000);
    expect(mergeKeySets([]).keys).toEqual([]);
  });

  it('reads max-age out of Cache-Control and clamps it', () => {
    expect(maxAgeFrom('public, max-age=22000, must-revalidate')).toBe(22_000_000);
    expect(maxAgeFrom(null)).toBe(3_600_000);
    expect(maxAgeFrom('max-age=10')).toBe(300_000);
    expect(maxAgeFrom('max-age=999999999')).toBe(86_400_000);
  });

  it('masks an email to its first and last character', () => {
    expect(maskEmail('foad.shahabian@gmail.com')).toBe('f••••••••••••n@gmail.com');
    expect(maskEmail('ab@x.io')).toBe('ab@x.io');
    expect(maskEmail('abc@x.io')).toBe('a•••c@x.io');
    expect(maskEmail(null)).toBeNull();
  });
});

// --- the routes --------------------------------------------------------------

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  clearGoogleKeyCache();
  serveKeys([jwkOf(publicKey, KID)]);
  if (!app) app = await makeApp();
});

afterAll(async () => {
  setGoogleKeyFetcher(null);
  await app?.close();
  await pool.end();
});

async function googlePost(credential: string, cookie?: string, extra: Record<string, unknown> = {}) {
  return app.inject({
    method: 'POST',
    url: '/auth/google',
    headers: cookie ? { cookie } : {},
    payload: { credential, ...extra },
  });
}

describe('POST /auth/google', () => {
  it('(C) creates a phone-less account with an empty name, stores the identity, sets a session', async () => {
    const res = await googlePost(makeToken({}), undefined, { return_to: '/insight/insight-1.html' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.is_new).toBe(true);
    expect(body.linked).toBe(false);
    expect(body.return_to).toBe('/insight/insight-1.html');
    expect(body.user.display_name).toBe(''); // the nickname step must fire
    const cookie = sessionCookieFrom(res);
    expect(cookie).toBeTruthy();

    const p = await pool.query('select phone, display_name, telegram_id from profiles');
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0].phone).toBeNull();
    expect(p.rows[0].telegram_id).toBeNull();
    const idn = await pool.query(
      "select provider_user_id, username, display_name, photo_url from auth_identities where provider = 'google'",
    );
    expect(idn.rows).toEqual([{
      provider_user_id: '1234567890',
      username: 'reader@example.com',
      display_name: 'Reader Example',
      photo_url: 'https://lh3.googleusercontent.com/a/x',
    }]);

    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie: cookie! } });
    expect(me.statusCode).toBe(200);
    expect(me.json().google_linked).toBe(true);
    expect(me.json().google_email).toBe('r••••r@example.com');
    expect(me.json().telegram_linked).toBe(false);
  });

  it('(A) a returning Google login lands on the same account and refreshes the cached name', async () => {
    const first = await googlePost(makeToken({}));
    const second = await googlePost(makeToken({ name: 'Reader Renamed' }));
    expect(second.statusCode).toBe(200);
    expect(second.json().is_new).toBe(false);
    expect(second.json().user.id).toBe(first.json().user.id);
    const n = await pool.query('select count(*)::int as n from profiles');
    expect(n.rows[0].n).toBe(1);
    const idn = await pool.query("select display_name from auth_identities where provider = 'google'");
    expect(idn.rows[0].display_name).toBe('Reader Renamed');
  });

  it('(B) a signed-in phone reader connects Google to THEIR account, not a new one', async () => {
    const cookie = await loginAs(app, '09121110077');
    const res = await googlePost(makeToken({ sub: 'g-77' }), cookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().linked).toBe(true);
    expect(res.json().is_new).toBe(false);
    const rows = await pool.query(
      `select p.phone from auth_identities i join profiles p on p.id = i.user_id
        where i.provider = 'google' and i.provider_user_id = 'g-77'`,
    );
    expect(rows.rows).toEqual([{ phone: '09121110077' }]);
    expect((await pool.query('select count(*)::int as n from profiles')).rows[0].n).toBe(1);

    // From now on the Google button alone signs this phone account in.
    const again = await googlePost(makeToken({ sub: 'g-77' }));
    expect(again.json().user.id).toBe(res.json().user.id);
  });

  it('refuses to connect a Google account that already belongs to someone else (409, no merge)', async () => {
    await googlePost(makeToken({ sub: 'g-taken' })); // account 1 (Google-only)
    const cookie = await loginAs(app, '09121110088'); // account 2 (phone)
    const res = await googlePost(makeToken({ sub: 'g-taken' }), cookie);
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('google_taken');
    // Both accounts still exist, the identity still points at the first.
    expect((await pool.query('select count(*)::int as n from profiles')).rows[0].n).toBe(2);
    const idn = await pool.query(
      `select p.phone from auth_identities i join profiles p on p.id = i.user_id
        where i.provider_user_id = 'g-taken'`,
    );
    expect(idn.rows[0].phone).toBeNull();
  });

  it('a Google account can also be connected to a Telegram-only account', async () => {
    const tgCookie = await telegramLogin(app, '70701');
    const res = await googlePost(makeToken({ sub: 'g-tg' }), tgCookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().linked).toBe(true);
    const rows = await pool.query(
      `select p.telegram_id from auth_identities i join profiles p on p.id = i.user_id
        where i.provider_user_id = 'g-tg'`,
    );
    expect(Number(rows.rows[0].telegram_id)).toBe(70701);
  });

  it('stores no email when Google did not verify it', async () => {
    const res = await googlePost(makeToken({ sub: 'g-unverified', email_verified: false }));
    expect(res.statusCode).toBe(200);
    const idn = await pool.query("select username from auth_identities where provider_user_id = 'g-unverified'");
    expect(idn.rows[0].username).toBeNull();
    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie: sessionCookieFrom(res)! } });
    expect(me.json().google_linked).toBe(true);
    expect(me.json().google_email).toBeNull();
  });

  it('rejects a token for another audience with 400 and creates nothing', async () => {
    const res = await googlePost(makeToken({ aud: 'other.apps.googleusercontent.com' }));
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('wrong_audience');
    expect(sessionCookieFrom(res)).toBeFalsy();
    expect((await pool.query('select count(*)::int as n from profiles')).rows[0].n).toBe(0);
  });

  it('rejects a forged signature with 400', async () => {
    const res = await googlePost(makeToken({}, { key: strangerPrivate }));
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('bad_signature');
  });

  it('answers 503 when the key set cannot be fetched, never a silent 400', async () => {
    setGoogleKeyFetcher(async () => { throw new Error('filtered'); });
    const res = await googlePost(makeToken({}));
    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe('keys_unavailable');
  });

  it('validates the body (a missing credential is a 400 before any verification)', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/google', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('rate-limits one IP after the configured number of tries', async () => {
    let last = 200;
    for (let i = 0; i < 61; i += 1) {
      const res = await googlePost(makeToken({ aud: 'other' }));
      last = res.statusCode;
    }
    expect(last).toBe(429);
  });
});

describe('POST /auth/google/unlink', () => {
  it('disconnects Google from an account that also has a phone', async () => {
    const cookie = await loginAs(app, '09121110099');
    await googlePost(makeToken({ sub: 'g-unlink' }), cookie);
    const res = await app.inject({ method: 'POST', url: '/auth/google/unlink', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const n = await pool.query("select count(*)::int as n from auth_identities where provider = 'google'");
    expect(n.rows[0].n).toBe(0);
    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.json().google_linked).toBe(false);
    // Afterwards the Google account is free to become its own account again.
    const fresh = await googlePost(makeToken({ sub: 'g-unlink' }));
    expect(fresh.json().is_new).toBe(true);
  });

  it('disconnects Google from an account that keeps Telegram', async () => {
    const tgCookie = await telegramLogin(app, '70702');
    await googlePost(makeToken({ sub: 'g-tg2' }), tgCookie);
    const res = await app.inject({ method: 'POST', url: '/auth/google/unlink', headers: { cookie: tgCookie } });
    expect(res.statusCode).toBe(200);
  });

  it('refuses to disconnect a Google-only account (409, no lock-out)', async () => {
    const res0 = await googlePost(makeToken({ sub: 'g-only' }));
    const cookie = sessionCookieFrom(res0)!;
    const res = await app.inject({ method: 'POST', url: '/auth/google/unlink', headers: { cookie } });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('no_fallback');
    const n = await pool.query("select count(*)::int as n from auth_identities where provider = 'google'");
    expect(n.rows[0].n).toBe(1);
  });

  it('requires a session (401)', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/google/unlink' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /auth/telegram/unlink with a Google fallback', () => {
  it('lets a Telegram + Google account drop Telegram (Google is a way in)', async () => {
    const tgCookie = await telegramLogin(app, '70703');
    await googlePost(makeToken({ sub: 'g-tg3' }), tgCookie);
    const res = await app.inject({ method: 'POST', url: '/auth/telegram/unlink', headers: { cookie: tgCookie } });
    expect(res.statusCode).toBe(200);
    const p = await pool.query('select telegram_id from profiles');
    expect(p.rows[0].telegram_id).toBeNull();
  });

  it('still refuses a Telegram-only account', async () => {
    const tgCookie = await telegramLogin(app, '70704');
    const res = await app.inject({ method: 'POST', url: '/auth/telegram/unlink', headers: { cookie: tgCookie } });
    expect(res.statusCode).toBe(409);
  });
});

describe('merging', () => {
  it('a Google-only account that proves an existing phone is folded into the phone account, Google included', async () => {
    // The phone account exists first.
    const phoneCookie = await loginAs(app, '09121110111');
    const phoneId = (await app.inject({ method: 'GET', url: '/me', headers: { cookie: phoneCookie } })).json().id;
    // A Google-only account is created, then proves that phone.
    const g = await googlePost(makeToken({ sub: 'g-merge' }));
    const gCookie = sessionCookieFrom(g)!;
    const req = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '09121110111' } });
    const link = await app.inject({
      method: 'POST', url: '/auth/phone/link', headers: { cookie: gCookie },
      payload: { phone: '09121110111', code: req.json().dev_code },
    });
    expect(link.statusCode).toBe(200);
    expect(link.json().merged).toBe(true);
    const idn = await pool.query("select user_id from auth_identities where provider_user_id = 'g-merge'");
    expect(idn.rows[0].user_id).toBe(phoneId);
    expect((await pool.query('select count(*)::int as n from profiles')).rows[0].n).toBe(1);
  });
});
