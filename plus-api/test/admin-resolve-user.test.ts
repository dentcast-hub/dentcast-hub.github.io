import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool, one, query } from '../src/db.js';
import { config } from '../src/config.js';

/**
 * Reaching a user from the admin panel when they have no phone.
 *
 * Login with Telegram creates a real, paying-capable account with
 * `profiles.phone` empty. Every subscription endpoint here used to look people
 * up by phone alone, so those accounts answered `no_profile` and there was no
 * admin path to them at all — on 2026-08-06 one had to be granted lifetime
 * premium by running the service function by hand.
 *
 * The risk in fixing it is the opposite one: a handle is not unique the way a
 * phone is, so a lookup that guesses could hand a permanent account to the
 * wrong person, silently, with the person who lost out never knowing to
 * complain. Hence the 409 test below — it is the important one in this file.
 */

let app: FastifyInstance;
const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});
afterAll(async () => { await app?.close(); await pool.end(); });

const post = (url: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url, headers: { authorization: basic }, payload });
const get = (qs: string) =>
  app.inject({ method: 'GET', url: `/admin/subscriptions?${qs}`, headers: { authorization: basic } });

/** A Telegram-only account: a profile with no phone plus an auth identity. */
async function makeTelegramUser(username: string, displayName = username): Promise<string> {
  const row = (await one<{ id: string }>(
    `insert into profiles (display_name, tier) values ($1, 'free') returning id`,
    [displayName],
  ))!;
  await query(
    `insert into auth_identities (user_id, provider, provider_user_id, username, display_name)
     values ($1, 'telegram', $2, $3, $4)`,
    [row.id, `tg_${username}`, username, displayName],
  );
  return row.id;
}

describe('admin can reach a Telegram-only account', () => {
  it('grants lifetime premium by username, with no phone anywhere', async () => {
    const id = await makeTelegramUser('Sarasjd', 'Sonia');

    const res = await post('/admin/subscriptions/grant-lifetime', { user: 'Sarasjd' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user_id).toBe(id);
    expect(body.phone).toBeNull();
    expect(body.username).toBe('Sarasjd');   // the answer still names them
    expect(body.is_premium).toBe(true);
    expect(body.subscription.days_left).toBeNull(); // lifetime has no end
  });

  it('matches a handle case-insensitively and ignores a pasted @', async () => {
    await makeTelegramUser('Sarasjd', 'Sonia');
    expect((await post('/admin/subscriptions/grant-lifetime', { user: 'sarasjd' })).statusCode).toBe(200);
    expect((await get('user=@SARASJD')).statusCode).toBe(200);
  });

  it('finds them by user id too', async () => {
    const id = await makeTelegramUser('Handle1');
    const res = await get(`user=${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.json().user_id).toBe(id);
  });

  it('revokes by username as well', async () => {
    await makeTelegramUser('Handle2');
    await post('/admin/subscriptions/grant-lifetime', { user: 'Handle2' });
    const res = await post('/admin/subscriptions/revoke', { user: 'Handle2' });
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toBe(true);
  });
});

describe('ambiguity is refused, never guessed', () => {
  it('replies 409 with the candidates when a name matches two accounts', async () => {
    // One account's username is another account's display name — which is
    // exactly how a real collision looks.
    await makeTelegramUser('twin', 'Somebody');
    await makeTelegramUser('other', 'twin');

    const res = await post('/admin/subscriptions/grant-lifetime', { user: 'twin' });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('ambiguous_user');
    expect(res.json().candidates).toHaveLength(2);

    // ...and nothing was granted to either of them.
    const premium = await query("select count(*)::int as n from subscriptions where is_founder = true");
    expect(premium.rows[0].n).toBe(0);
  });

  it('is not confused by one account holding several auth identities', async () => {
    const id = await makeTelegramUser('multi');
    await query(
      `insert into auth_identities (user_id, provider, provider_user_id, username)
       values ($1, 'bale', 'bale_multi', 'multi')`,
      [id],
    );
    // Two identity rows, one profile — that is not ambiguity.
    const res = await post('/admin/subscriptions/grant-lifetime', { user: 'multi' });
    expect(res.statusCode).toBe(200);
    expect(res.json().user_id).toBe(id);
  });
});

describe('the phone path still works exactly as before', () => {
  const PHONE = '09121800055';

  it('accepts the old `phone` field', async () => {
    await loginAs(app, PHONE);
    const res = await post('/admin/subscriptions/grant', { phone: PHONE, months: 3 });
    expect(res.statusCode).toBe(200);
    expect(res.json().phone).toBe(PHONE);
    expect(res.json().is_premium).toBe(true);
  });

  it('accepts a phone in the new `user` field too', async () => {
    await loginAs(app, PHONE);
    const res = await post('/admin/subscriptions/grant-lifetime', { user: PHONE });
    expect(res.statusCode).toBe(200);
    expect(res.json().phone).toBe(PHONE);
  });

  it('404s an unknown identifier and 400s an empty one', async () => {
    expect((await post('/admin/subscriptions/grant-lifetime', { user: 'nobody-at-all' })).statusCode).toBe(404);
    expect((await post('/admin/subscriptions/grant-lifetime', { phone: '09129999999' })).statusCode).toBe(404);

    const empty = await post('/admin/subscriptions/grant-lifetime', {});
    expect(empty.statusCode).toBe(400);
    expect(empty.json().error).toBe('missing_user');
  });
});

describe('the gift queue names a buyer who has no phone', () => {
  it('carries username and display_name beside the phone', async () => {
    const id = await makeTelegramUser('GiftBuyer', 'Gift Buyer');
    await query(
      `insert into gift_redemptions (user_id, reference, kind, months)
       values ($1, 'REF-TG-1', $2, $3)`,
      [id, config.giftCard.kind, config.giftCard.months],
    );

    const res = await app.inject({
      method: 'GET', url: '/admin/gift/pending', headers: { authorization: basic },
    });

    expect(res.statusCode).toBe(200);
    const row = res.json().redemptions.find((r: { reference: string }) => r.reference === 'REF-TG-1');
    // Without this the founder is asked to approve money for a blank row.
    expect(row.phone).toBeNull();
    expect(row.username).toBe('GiftBuyer');
    expect(row.display_name).toBe('Gift Buyer');
  });
});
