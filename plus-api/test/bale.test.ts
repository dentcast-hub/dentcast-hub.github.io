import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { issueBaleLinkToken, consumeBaleLinkToken, clearBaleLinkStore, BALE_LINK_TTL_SECONDS } from '../src/services/bale-link.js';
import { BaleNotificationSender } from '../src/providers/notifications/bale.js';
import { runStreakReminders } from '../src/services/streak-reminder.js';
import { dayInTz, previousDay } from '../src/services/time.js';

const WEBHOOK = `/webhooks/bale/${config.notify.baleWebhookSecret}`;

function startUpdate(token: string, chatId = 555): unknown {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: chatId, type: 'private' },
      from: { id: chatId, first_name: 'Ba', username: 'ba_' + chatId },
      text: `/start ${token}`,
    },
  };
}

/** Mint a Bale connect token for a logged-in session. */
async function connectToken(app: FastifyInstance, cookie: string): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: '/auth/bale/connect', headers: { cookie },
  });
  expect(res.statusCode).toBe(200);
  return res.json().token as string;
}

// --- link-token store (unit) ------------------------------------------------

describe('bale-link token store', () => {
  beforeEach(() => clearBaleLinkStore());

  it('issues a single-use token that resolves to the user, then is consumed', () => {
    const t = issueBaleLinkToken('user-1');
    expect(consumeBaleLinkToken(t)).toBe('user-1');
    expect(consumeBaleLinkToken(t)).toBeNull(); // single use
  });

  it('rejects an expired token', () => {
    const now = 1_000_000;
    const t = issueBaleLinkToken('user-1', now);
    const later = now + (BALE_LINK_TTL_SECONDS + 1) * 1000;
    expect(consumeBaleLinkToken(t, later)).toBeNull();
  });

  it('replaces a user\'s previous token so only the latest is valid', () => {
    const t1 = issueBaleLinkToken('user-1');
    const t2 = issueBaleLinkToken('user-1');
    expect(consumeBaleLinkToken(t1)).toBeNull();
    expect(consumeBaleLinkToken(t2)).toBe('user-1');
  });
});

// --- notification sender ----------------------------------------------------

describe('BaleNotificationSender', () => {
  beforeEach(async () => { await resetDb(); });

  it('no-ops quietly for a user with no bale_id', async () => {
    const { rows } = await pool.query(
      "insert into profiles (phone, display_name) values ('09120000001', 'x') returning id",
    );
    const sender = new BaleNotificationSender();
    await expect(sender.send(rows[0].id, 'hi', 'streak')).resolves.toBeUndefined();
  });

  it('sends (stub, no token) for a user with a bale_id without throwing', async () => {
    const { rows } = await pool.query(
      "insert into profiles (phone, bale_id, display_name) values ('09120000002', 4242, 'y') returning id",
    );
    const sender = new BaleNotificationSender();
    await expect(sender.send(rows[0].id, 'hi', 'streak')).resolves.toBeUndefined();
  });
});

// --- webhook + connect/unlink round-trip ------------------------------------

describe('Bale connect/webhook/unlink', () => {
  let app: FastifyInstance;
  beforeEach(async () => { await resetDb(); app = await makeApp(); });

  it('connect requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/bale/connect' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects a webhook with the wrong secret', async () => {
    const res = await app.inject({
      method: 'POST', url: '/webhooks/bale/not-the-secret', payload: startUpdate('whatever'),
    });
    expect(res.statusCode).toBe(403);
  });

  it('links the Bale chat_id to the account that minted the token', async () => {
    const cookie = await loginAs(app, '09120000001');
    const token = await connectToken(app, cookie);

    const hook = await app.inject({ method: 'POST', url: WEBHOOK, payload: startUpdate(token, 777) });
    expect(hook.statusCode).toBe(200);

    // profiles.bale_id set
    const prof = await pool.query("select bale_id from profiles where phone = '09120000001'");
    expect(prof.rows[0].bale_id).toBe(777);

    // /me reflects bale_linked
    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.json().bale_linked).toBe(true);

    // auth_identities row recorded
    const ident = await pool.query("select provider_user_id from auth_identities where provider = 'bale'");
    expect(ident.rows[0].provider_user_id).toBe('777');
  });

  it('ignores an invalid/expired token (no link, still 200)', async () => {
    await loginAs(app, '09120000001');
    const hook = await app.inject({ method: 'POST', url: WEBHOOK, payload: startUpdate('bogus-token', 888) });
    expect(hook.statusCode).toBe(200);
    const prof = await pool.query('select count(*)::int n from profiles where bale_id = 888');
    expect(prof.rows[0].n).toBe(0);
  });

  it('reassigns a chat_id from an old account to the one that re-connects it', async () => {
    // Account A connects chat 999.
    const cookieA = await loginAs(app, '09120000001');
    const tokenA = await connectToken(app, cookieA);
    await app.inject({ method: 'POST', url: WEBHOOK, payload: startUpdate(tokenA, 999) });

    // Account B connects the SAME chat 999.
    const cookieB = await loginAs(app, '09120000002');
    const tokenB = await connectToken(app, cookieB);
    await app.inject({ method: 'POST', url: WEBHOOK, payload: startUpdate(tokenB, 999) });

    const a = await pool.query("select bale_id from profiles where phone = '09120000001'");
    const b = await pool.query("select bale_id from profiles where phone = '09120000002'");
    expect(a.rows[0].bale_id).toBeNull();      // freed from A
    expect(b.rows[0].bale_id).toBe(999);       // now B
    // Only one identity row for this chat, pointing at B.
    const ident = await pool.query("select count(*)::int n from auth_identities where provider = 'bale' and provider_user_id = '999'");
    expect(ident.rows[0].n).toBe(1);
  });

  it('unlinks Bale from the account', async () => {
    const cookie = await loginAs(app, '09120000001');
    const token = await connectToken(app, cookie);
    await app.inject({ method: 'POST', url: WEBHOOK, payload: startUpdate(token, 555) });

    const res = await app.inject({ method: 'POST', url: '/auth/bale/unlink', headers: { cookie } });
    expect(res.statusCode).toBe(200);

    const prof = await pool.query("select bale_id from profiles where phone = '09120000001'");
    expect(prof.rows[0].bale_id).toBeNull();
    const ident = await pool.query("select count(*)::int n from auth_identities where provider = 'bale'");
    expect(ident.rows[0].n).toBe(0);
  });
});

// --- streak reminder now reaches Bale-only users ----------------------------

describe('runStreakReminders reaches a Bale-linked user', () => {
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await pool.end(); });

  it('reminds a Bale-linked user with a savable streak (no push, no Telegram)', async () => {
    const now = new Date();
    const today = dayInTz(now, config.streakTimezone);
    const yesterday = previousDay(today);
    await pool.query(
      `insert into profiles
         (phone, bale_id, display_name, current_streak, longest_streak, last_active_day, settings)
       values (null, 314159, 'bale', 3, 3, $1::date, '{"reminders":{"streak":true}}'::jsonb)`,
      [yesterday],
    );

    const res = await runStreakReminders(now);
    expect(res.reminded).toBe(1);
  });
});
