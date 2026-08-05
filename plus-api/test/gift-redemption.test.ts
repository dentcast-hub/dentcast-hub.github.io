import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getSubscription } from '../src/services/subscription.js';
import { getCapacity } from '../src/services/payment-capacity.js';

/**
 * Paying from outside Iran with a US Apple gift card (infrastructure only —
 * shipped switched off).
 *
 * The property that matters most is the one that has nothing to do with gift
 * cards: a redemption must never consume the e-namad monthly ceiling. That
 * allowance governs rial through Zibal, and spending it on a payment that never
 * touched Zibal would stop Iranian customers buying so a foreign one could.
 */

let app: FastifyInstance;
const PHONE = '09121200001';
const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

const CODE = 'XJ4K-9PQR-7TVW';

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  config.giftCard.enabled = true;
});
afterAll(async () => { await app?.close(); await pool.end(); });

const submit = (cookie: string, code = CODE) =>
  app.inject({ method: 'POST', url: '/pay/gift', headers: { cookie }, payload: { code } });

const pending = () =>
  app.inject({ method: 'GET', url: '/admin/gift/pending', headers: { authorization: basic } });

const approve = (id: string) =>
  app.inject({ method: 'POST', url: '/admin/gift/approve', headers: { authorization: basic }, payload: { id } });

const reject = (id: string, reason: string) =>
  app.inject({ method: 'POST', url: '/admin/gift/reject', headers: { authorization: basic }, payload: { id, reason } });

async function userId(cookie: string): Promise<string> {
  return (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json().id;
}

describe('the switch', () => {
  it('is off by default, and says so rather than pretending to queue', async () => {
    config.giftCard.enabled = false;
    const cookie = await loginAs(app, PHONE);

    const res = await submit(cookie);

    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe('disabled');
    expect((await pool.query('select count(*)::int as n from gift_redemptions')).rows[0].n).toBe(0);
  });

  it('is advertised on the public plans call only while it is on', async () => {
    expect((await app.inject({ method: 'GET', url: '/pay/plans' })).json().gift_card)
      .toMatchObject({ months: 10, amount_usd: 100 });

    config.giftCard.enabled = false;
    expect((await app.inject({ method: 'GET', url: '/pay/plans' })).json().gift_card).toBeNull();
  });
});

describe('submitting a code', () => {
  it('queues it and grants nothing yet', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);

    const res = await submit(cookie);

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('pending');
    // Nothing is granted until a human has actually redeemed the card.
    expect(await getSubscription(uid)).toBeNull();
    expect((await pool.query('select tier from profiles where id = $1', [uid])).rows[0].tier).toBe('free');
  });

  it('needs a session', async () => {
    expect((await app.inject({ method: 'POST', url: '/pay/gift', payload: { code: CODE } })).statusCode)
      .toBe(401);
  });

  it('normalizes what a human types', async () => {
    const cookie = await loginAs(app, PHONE);
    await submit(cookie, '  xj4k-9pqr-7tvw  ');

    const row = await pool.query<{ code: string }>('select code from gift_redemptions');
    expect(row.rows[0].code).toBe(CODE);
  });

  it('rejects what is obviously not a code, without queueing it', async () => {
    const cookie = await loginAs(app, PHONE);

    for (const bad of ['short', 'has spaces in it!!', '@@@@@@@@@@']) {
      const res = await submit(cookie, bad);
      expect(res.statusCode).toBe(400);
    }
    expect((await pool.query('select count(*)::int as n from gift_redemptions')).rows[0].n).toBe(0);
  });

  it('allows one in the queue at a time', async () => {
    const cookie = await loginAs(app, PHONE);
    await submit(cookie);

    // An anxious customer pressing the button twice must not become two queue
    // entries for one card — approving both would grant twenty months for ten.
    const again = await submit(cookie, 'AAAA-BBBB-CCCC');
    expect(again.statusCode).toBe(409);
    expect(again.json().error).toBe('already_pending');
  });

  it('will not let the same code be claimed by somebody else', async () => {
    await submit(await loginAs(app, PHONE));
    const other = await loginAs(app, '09121200002');

    const res = await submit(other, CODE);

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('duplicate_code');
  });
});

describe('the admin queue', () => {
  it('lists submissions oldest first', async () => {
    await submit(await loginAs(app, PHONE), 'AAAA-1111-2222');
    await submit(await loginAs(app, '09121200002'), 'BBBB-3333-4444');

    const rows = pending as unknown;
    void rows;
    const res = await pending();
    expect(res.statusCode).toBe(200);
    expect(res.json().redemptions.map((r: { code: string }) => r.code))
      .toEqual(['AAAA-1111-2222', 'BBBB-3333-4444']);
  });

  it('is behind admin auth', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/gift/pending' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/admin/gift/approve', payload: { id: 'x' } })).statusCode).toBe(401);
  });

  it('grants the months on approval', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await submit(cookie);
    const id = (await pending()).json().redemptions[0].id;

    const res = await approve(id);

    expect(res.statusCode).toBe(200);
    expect(res.json().months).toBe(10);
    const sub = await getSubscription(uid);
    expect(sub!.expires_at).not.toBeNull();
    expect((await pool.query('select tier from profiles where id = $1', [uid])).rows[0].tier).toBe('premium');
  });

  it('cannot be approved twice', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await submit(cookie);
    const id = (await pending()).json().redemptions[0].id;

    await approve(id);
    const again = await approve(id);

    expect(again.statusCode).toBe(404);
    // And the second click bought nothing: still ten months, not twenty.
    const sub = await getSubscription(uid);
    const days = Math.round((sub!.expires_at!.getTime() - Date.now()) / 86_400_000);
    expect(days).toBeLessThan(320);
  });

  it('sends a rejection back with its reason, and never the code', async () => {
    const cookie = await loginAs(app, PHONE);
    await submit(cookie);
    const id = (await pending()).json().redemptions[0].id;

    expect((await reject(id, 'کد قبلاً استفاده شده بود')).statusCode).toBe(200);

    const mine = (await app.inject({ method: 'GET', url: '/pay/gift', headers: { cookie } })).json();
    expect(mine.redemption.status).toBe('rejected');
    expect(mine.redemption.note).toContain('استفاده شده');
    expect(JSON.stringify(mine)).not.toContain(CODE);
  });

  it('will not reject without a reason', async () => {
    const cookie = await loginAs(app, PHONE);
    await submit(cookie);
    const id = (await pending()).json().redemptions[0].id;

    const res = await app.inject({
      method: 'POST', url: '/admin/gift/reject', headers: { authorization: basic }, payload: { id },
    });
    expect(res.statusCode).toBe(400);
  });

  it('frees the queue slot after a rejection, so they can try another card', async () => {
    const cookie = await loginAs(app, PHONE);
    await submit(cookie);
    const id = (await pending()).json().redemptions[0].id;
    await reject(id, 'نامعتبر');

    expect((await submit(cookie, 'DDDD-5555-6666')).statusCode).toBe(200);
  });
});

describe('the monthly ceiling', () => {
  it('is untouched by a gift redemption', async () => {
    const before = await getCapacity();
    const cookie = await loginAs(app, PHONE);
    await submit(cookie);
    await approve((await pending()).json().redemptions[0].id);

    const after = await getCapacity();

    // Ten months of premium just changed hands, and not one rial of the e-namad
    // allowance was spent — because none of it went through Zibal.
    expect(after.used_rial).toBe(before.used_rial);
    expect(after.used_count).toBe(before.used_count);
    expect(after.any_plan_available).toBe(true);
    // And no row was written to the payments ledger either.
    expect((await pool.query('select count(*)::int as n from payments')).rows[0].n).toBe(0);
  });
});
