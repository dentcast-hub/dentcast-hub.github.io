import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getSubscription } from '../src/services/subscription.js';
import { pillarSeat, isPillarSeat } from '../src/services/pillar.js';

/**
 * Bank transfer (واریز به شبا) — the second manual rail on `gift_redemptions`,
 * beside the gift-card one. Two properties carry the design:
 *
 *  - THE AMOUNT IS COMPUTED SERVER-SIDE, from PLAN_PRICES_RIAL, and the client
 *    cannot send one at all (POST /pay/bank-transfer's schema only accepts
 *    `months`) — so there is no amount to trust or distrust from the browser.
 *  - IT SPENDS NONE OF THE ZIBAL CEILING AND MINTS NO SEAT: no `payments` row,
 *    same reasoning as the gift-card rail, and «ستون» seats are only ever
 *    minted by a `payments` row.
 */

let app: FastifyInstance;
const PHONE = '09121300001';
const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  config.bankTransfer.enabled = true;
  config.giftCard.enabled = true;
});
afterAll(async () => { await app?.close(); await pool.end(); });

const claim = (cookie: string, months = 6) =>
  app.inject({ method: 'POST', url: '/pay/bank-transfer', headers: { cookie }, payload: { months } });

const giftClaim = (cookie: string) =>
  app.inject({ method: 'POST', url: '/pay/gift', headers: { cookie } });

const mine = (cookie: string) =>
  app.inject({ method: 'GET', url: '/pay/bank-transfer', headers: { cookie } });

const pending = () =>
  app.inject({ method: 'GET', url: '/admin/bank-transfer/pending', headers: { authorization: basic } });

const approve = (reference: string) =>
  app.inject({ method: 'POST', url: '/admin/gift/approve', headers: { authorization: basic }, payload: { reference } });

const approveWithBadge = (reference: string) =>
  app.inject({
    method: 'POST', url: '/admin/bank-transfer/approve-with-badge',
    headers: { authorization: basic }, payload: { reference },
  });

const setAmount = (reference: string, amountRial: number) =>
  app.inject({
    method: 'POST', url: '/admin/bank-transfer/amount',
    headers: { authorization: basic }, payload: { reference, amount_rial: amountRial },
  });

async function userId(cookie: string): Promise<string> {
  return (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json().id;
}

describe('the switch', () => {
  it('is ON by default and publishes instructions on the public plans call', async () => {
    const bank = (await app.inject({ method: 'GET', url: '/pay/plans' })).json().bank_transfer;
    expect(bank).toMatchObject({ enabled: true });
    expect(bank.iban).toMatch(/^IR\d+$/);
    // The student terms are COPY the page prints, not arithmetic anything does:
    // retuning ٪۱۵ has to be a config change, not an edit to a Persian sentence
    // in a frontend module.
    expect(bank.student_discount_percent).toBe(config.bankTransfer.studentDiscountPercent);
    expect(bank.student_months).toBe(config.bankTransfer.studentMonths);
  });

  // The amount is announced by the founder, never computed here — so nothing on
  // this rail may quietly apply a discount the admin panel would then have to
  // undo. A claim opens at the list price and moves only when a human says so.
  it('opens a seat-holder\'s claim at the LIST price, discount engine untouched', async () => {
    const cookie = await loginAs(app, PHONE);
    const res = await claim(cookie, 6);
    expect(res.json().amount_rial).toBe(config.payments.planPricesRial[6]);
  });

  it('refuses to open a claim when switched off', async () => {
    config.bankTransfer.enabled = false;
    const cookie = await loginAs(app, PHONE);
    expect((await claim(cookie)).statusCode).toBe(503);
  });
});

describe('opening a claim', () => {
  it('computes the amount server-side from PLAN_PRICES_RIAL — the client sends only months', async () => {
    const cookie = await loginAs(app, PHONE);
    const res = await claim(cookie, 6);
    expect(res.statusCode).toBe(200);
    expect(res.json().months).toBe(6);
    expect(res.json().amount_rial).toBe(config.payments.planPricesRial[6]);
  });

  it('refuses a term with no price', async () => {
    const cookie = await loginAs(app, PHONE);
    const res = await claim(cookie, 5);
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('unknown_plan');
  });

  it('grants nothing yet', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await claim(cookie);
    expect(await getSubscription(uid)).toBeNull();
  });

  it('one open claim PER RAIL, not globally — a pending gift-card claim does not block a bank claim', async () => {
    const cookie = await loginAs(app, PHONE);
    const giftRef = (await giftClaim(cookie)).json().reference;
    const bankRes = await claim(cookie);

    expect(bankRes.statusCode).toBe(200);
    expect(bankRes.json().reference).not.toBe(giftRef);
    expect((await pool.query('select count(*)::int as n from gift_redemptions')).rows[0].n).toBe(2);

    // But a second bank claim while one is pending reuses the same reference.
    const again = await claim(cookie);
    expect(again.json().reused).toBe(true);
    expect(again.json().reference).toBe(bankRes.json().reference);
  });

  it('shows the buyer their own claim when they check back', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie, 3)).json().reference;
    const res = await mine(cookie);
    expect(res.json().redemption).toMatchObject({ reference: ref, status: 'pending', months: 3 });
  });
});

describe('the founder queue', () => {
  it('lists only bank-transfer claims, with the amount attached', async () => {
    const cookie = await loginAs(app, PHONE);
    await giftClaim(cookie);
    const bankRef = (await claim(cookie, 1)).json().reference;

    const rows = (await pending()).json().redemptions;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ reference: bankRef, kind: 'bank_transfer', amount_rial: config.payments.planPricesRial[1] });
  });

  it('approving activates the months the claim was opened for', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    const ref = (await claim(cookie, 3)).json().reference;

    expect((await approve(ref)).statusCode).toBe(200);
    expect((await getSubscription(uid))!.expires_at).not.toBeNull();
  });

  it('writes a founder-typed amount onto a still-pending claim (the student price)', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie, 6)).json().reference;
    const studentAmount = Math.round(config.payments.planPricesRial[6] * 0.85);

    const res = await setAmount(ref, studentAmount);
    expect(res.statusCode).toBe(200);
    expect(res.json().redemption.amount_rial).toBe(studentAmount);

    const row = (await pending()).json().redemptions[0];
    expect(row.amount_rial).toBe(studentAmount);
  });

  it('never spends the Zibal ceiling or mints a payments row', async () => {
    const cookie = await loginAs(app, PHONE);
    const ref = (await claim(cookie, 6)).json().reference;
    await approve(ref);
    expect((await pool.query('select count(*)::int as n from payments')).rows[0].n).toBe(0);
  });
});

/**
 * The student rate is a NUMBER THE FOUNDER TYPES, and these pin the two places
 * that make it findable — because the failure mode is silent on both sides: a
 * student who never learns the rate exists pays full price at the gateway, and
 * a founder doing 15% in their head types a figure somebody then transfers.
 */
describe('the student rate is announced, and the panel hands over the number', () => {
  it('offers the computed student amount on a six-month row, and only there', async () => {
    const page = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
    expect(page.statusCode).toBe(200);
    // The button exists and carries the terms from config, not a literal.
    expect(page.body).toContain('data-act="student-amount"');
    expect(page.body).toContain(`٪' + STUDENT.percent + '`);
    // …and the rule itself travels as data, so retuning it is a config change.
    expect(page.body).toContain(`"percent":${config.bankTransfer.studentDiscountPercent}`);
    expect(page.body).toContain(`"months":${config.bankTransfer.studentMonths}`);
  });

  it('never calls the badge button the thing that applies the discount', async () => {
    const page = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
    // The badge grants nothing — months come from «تأیید» either way — so the
    // label must not read as the button that gives the discount.
    expect(page.body).toContain('تأیید + یادگاریِ دانشجو');
    expect(page.body).not.toContain('تأیید + اهدای نشان دانشجو');
  });

  it('tells a student on the support form that the gateway is the wrong door', async () => {
    const cookie = await loginAs(app, PHONE);
    const r = await app.inject({ method: 'GET', url: '/support/kinds', headers: { cookie } });
    const student = r.json().kinds.find((k: { key: string }) => k.key === 'student');
    // The gateway has no student concept at all, so paying there costs them the
    // discount with no way back except a hand-gifted month.
    expect(student.hint_fa).toContain('واریز به حساب');
    expect(student.hint_fa).toContain('نه از درگاه');
  });
});

describe('«تأیید + یادگاریِ دانشجو» — approve and grant, atomically', () => {
  it('approves the claim, activates the subscription and grants the student badge together', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    const ref = (await claim(cookie, 6)).json().reference;

    const res = await approveWithBadge(ref);

    expect(res.statusCode).toBe(200);
    expect(res.json().months).toBe(6);
    expect(res.json().badge).toMatchObject({ ok: true, badge_key: 'student', already: false });
    expect((await getSubscription(uid))!.expires_at).not.toBeNull();
    const grant = await pool.query(
      "select badge_key from badge_grants where user_id = $1 and badge_key = 'student'", [uid],
    );
    expect(grant.rows).toHaveLength(1);
  });

  it('is idempotent per (user, badge) — a second grant mints nothing new', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    const first = (await claim(cookie, 6)).json().reference;
    await approveWithBadge(first);

    // A second claim for the same reader, approved with the badge again.
    const second = (await claim(cookie, 1)).json().reference;
    const res = await approveWithBadge(second);

    expect(res.json().badge).toMatchObject({ ok: true, already: true });
    const grants = await pool.query(
      "select id from badge_grants where user_id = $1 and badge_key = 'student'", [uid],
    );
    expect(grants.rows).toHaveLength(1);
  });

  it('does not act on a reference nobody claimed', async () => {
    expect((await approveWithBadge('DC-ZZZ-ZZZ')).statusCode).toBe(404);
  });

  it('mints no «ستون» seat — only a payments row does that', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    const ref = (await claim(cookie, 6)).json().reference;
    await approveWithBadge(ref);

    const seat = await pillarSeat(uid);
    expect(isPillarSeat(seat)).toBe(false);
  });
});
