import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getSubscription } from '../src/services/subscription.js';
import { getCapacity } from '../src/services/payment-capacity.js';

/**
 * Paying from outside Iran with a US Apple gift card.
 *
 * Two properties carry this whole design, and neither is about gift cards:
 *
 *  - THE CODE NEVER REACHES US. We hand out a reference tag; the card is emailed
 *    straight to the founder carrying that tag, so a bearer instrument never
 *    passes through the page, the API or the database. The tests assert on what
 *    is stored, because "we didn't collect it" is only true if nothing collects it.
 *
 *  - IT SPENDS NONE OF THE ZIBAL CEILING. That allowance counts rial through the
 *    Iranian gateway; charging a foreign gift card against it would stop Iranian
 *    customers buying so that a foreign one could.
 */

let app: FastifyInstance;
const PHONE = '09121200001';
const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  config.giftCard.enabled = true;
});
afterAll(async () => { await app?.close(); await pool.end(); });

/** Open a claim. Takes no code — that is the point. */
const claim = (cookie: string) =>
  app.inject({ method: 'POST', url: '/pay/gift', headers: { cookie } });

const mine = (cookie: string) =>
  app.inject({ method: 'GET', url: '/pay/gift', headers: { cookie } });

const pending = () =>
  app.inject({ method: 'GET', url: '/admin/gift/pending', headers: { authorization: basic } });

const approve = (reference: string) =>
  app.inject({ method: 'POST', url: '/admin/gift/approve', headers: { authorization: basic }, payload: { reference } });

const reject = (reference: string, reason: string) =>
  app.inject({ method: 'POST', url: '/admin/gift/reject', headers: { authorization: basic }, payload: { reference, reason } });

async function userId(cookie: string): Promise<string> {
  return (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json().id;
}

describe('the switch', () => {
  it('is ON by default — it does not wait on the Iranian gateway', async () => {
    // The two are unrelated rails. Zibal's merchant registration and its .ir-only
    // callback say nothing about somebody abroad sending a gift card.
    const { config: fresh } = await import('../src/config.js');
    expect(fresh.giftCard.enabled).toBe(true);
    expect(fresh.giftCard.kind).toBe('apple_us');
  });

  it('refuses to open a claim when switched off, rather than pretending to queue', async () => {
    config.giftCard.enabled = false;
    const cookie = await loginAs(app, PHONE);

    const res = await claim(cookie);

    expect(res.statusCode).toBe(503);
    expect((await pool.query('select count(*)::int as n from gift_redemptions')).rows[0].n).toBe(0);
  });

  it('publishes the instructions on the public plans call', async () => {
    const gift = (await app.inject({ method: 'GET', url: '/pay/plans' })).json().gift_card;
    expect(gift).toMatchObject({ months: 10, amount_usd: 100, kind: 'apple_us' });
    // The buyer needs somewhere to send it; a page that says "email us" without
    // an address is not instructions.
    expect(gift.recipient_email).toContain('@');
  });
});

describe('opening a claim', () => {
  it('hands back a reference and grants nothing', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);

    const res = await claim(cookie);

    expect(res.statusCode).toBe(200);
    expect(res.json().reference).toMatch(/^DC-[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    expect(res.json().months).toBe(10);
    // Nothing until a human has actually redeemed a card.
    expect(await getSubscription(uid)).toBeNull();
  });

  it('never stores a code, because it never asks for one', async () => {
    const cookie = await loginAs(app, PHONE);
    await claim(cookie);

    const row = await pool.query<{ code: string | null }>('select code from gift_redemptions');
    expect(row.rows[0].code).toBeNull();
  });

  it('mints a tag out of characters that survive being read aloud', async () => {
    const refs = new Set<string>();
    for (let i = 0; i < 12; i += 1) {
      const cookie = await loginAs(app, `0912120${String(1000 + i)}`);
      refs.add((await claim(cookie)).json().reference);
    }
    expect(refs.size).toBe(12);            // unique

    // The property is not "these characters are banned" — it is that no two
    // characters in the tag can be mistaken for each other. The tag is typed
    // into a shop's gift-message box and read back off an email by a human, and
    // a mistyped one means a card that arrives matching nobody. So for each
    // look-alike pair, at most ONE member may appear anywhere in the alphabet:
    // 8 is perfectly safe once B is gone.
    const CONFUSABLE = [['0', 'O'], ['1', 'I'], ['1', 'L'], ['I', 'L'], ['5', 'S'], ['8', 'B']];
    const used = new Set([...refs].flatMap((r) => r.slice(3).split('')).filter((c) => c !== '-'));
    for (const [a, b] of CONFUSABLE) {
      expect(used.has(a) && used.has(b)).toBe(false);
    }
  });

  it('needs a session', async () => {
    expect((await app.inject({ method: 'POST', url: '/pay/gift' })).statusCode).toBe(401);
  });

  it('hands back the SAME reference when they come back, instead of a second one', async () => {
    const cookie = await loginAs(app, PHONE);
    const first = (await claim(cookie)).json().reference;

    const again = await claim(cookie);

    // Not an error: they have a tag, and the useful answer is the same tag.
    // Two open claims for one person means two tags and one arriving card, with
    // the founder guessing which to approve.
    expect(again.statusCode).toBe(200);
    expect(again.json().reference).toBe(first);
    expect(again.json().reused).toBe(true);
    expect((await pool.query('select count(*)::int as n from gift_redemptions')).rows[0].n).toBe(1);
  });

  it('shows the buyer their own claim when they check back', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie)).json().reference;

    const res = await mine(cookie);
    expect(res.json().redemption).toMatchObject({ reference: ref, status: 'pending', months: 10 });
    expect(res.json().recipient_email).toContain('@');
  });
});

describe('the founder queue', () => {
  it('lists claims oldest first, with the phone to identify them by', async () => {
    const a = (await claim(await loginAs(app, PHONE))).json().reference;
    const b = (await claim(await loginAs(app, '09121200002'))).json().reference;

    const rows = (await pending()).json().redemptions;
    expect(rows.map((r: { reference: string }) => r.reference)).toEqual([a, b]);
    expect(rows[0].phone).toBe(PHONE);
  });

  it('is behind admin auth', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/gift/pending' })).statusCode).toBe(401);
    expect((await app.inject({
      method: 'POST', url: '/admin/gift/approve', payload: { reference: 'DC-AAA-BBB' },
    })).statusCode).toBe(401);
  });

  it('is approved by the reference, which is what the founder is holding', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    const ref = (await claim(cookie)).json().reference;

    // The tag is in the email in front of them; making them look up a uuid
    // first would be a step invented for the database's benefit.
    const res = await approve(ref);

    expect(res.statusCode).toBe(200);
    expect(res.json().months).toBe(10);
    expect((await getSubscription(uid))!.expires_at).not.toBeNull();
    expect((await pool.query('select tier from profiles where id = $1', [uid])).rows[0].tier).toBe('premium');
  });

  it('accepts the reference however it was retyped', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie)).json().reference;

    expect((await approve(`  ${ref.toLowerCase()}  `)).statusCode).toBe(200);
  });

  it('cannot be approved twice', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    const ref = (await claim(cookie)).json().reference;

    await approve(ref);
    expect((await approve(ref)).statusCode).toBe(404);

    // Ten months, not twenty.
    const days = Math.round(((await getSubscription(uid))!.expires_at!.getTime() - Date.now()) / 86_400_000);
    expect(days).toBeLessThan(320);
  });

  it('sends a rejection back with its reason', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie)).json().reference;

    expect((await reject(ref, 'کارت به دست ما نرسید')).statusCode).toBe(200);

    const res = await mine(cookie);
    expect(res.json().redemption.status).toBe('rejected');
    expect(res.json().redemption.note).toContain('نرسید');
  });

  it('will not reject without a reason', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie)).json().reference;

    const res = await app.inject({
      method: 'POST', url: '/admin/gift/reject', headers: { authorization: basic },
      payload: { reference: ref },
    });
    expect(res.statusCode).toBe(400);
  });

  it('frees the slot after a rejection, so they can try again', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie)).json().reference;
    await reject(ref, 'نرسید');

    const again = await claim(cookie);
    expect(again.statusCode).toBe(200);
    expect(again.json().reference).not.toBe(ref);
  });

  it('does not act on a reference nobody claimed', async () => {
    expect((await approve('DC-ZZZ-ZZZ')).statusCode).toBe(404);
  });
});

describe('the monthly ceiling', () => {
  it('is untouched by a gift redemption', async () => {
    const before = await getCapacity();
    const cookie = await loginAs(app, PHONE);
    await approve((await claim(cookie)).json().reference);

    const after = await getCapacity();

    // Ten months of premium just changed hands and not one rial of the e-namad
    // allowance was spent — because none of it went through Zibal.
    expect(after.used_rial).toBe(before.used_rial);
    expect(after.used_count).toBe(before.used_count);
    expect((await pool.query('select count(*)::int as n from payments')).rows[0].n).toBe(0);
  });
});
