// THE CERTIFICATE DISCOUNT, WALKED AS FOUR PEOPLE (founder, 1405/07/03).
//
// «ارزیابی شواهد و استدلال بالینی» is the pathway open to free accounts, and its
// certificate mints ٪۲۰ (`certificate_discount_percent`). Everybody who earns it
// gets the whole ٪۲۰; what differs is WHEN:
//
//   · a first purchase takes it whole, outside the ٪۱۰ badge cap (with a
//     referral code: ٪۳۰);
//   · somebody who has paid before takes it as ٪۱۰ + ٪۱۰ over two purchases,
//     inside the cap — so a «ستون» seat-holder never passes ٪۲۰ + ٪۱۰.
//
// Every step goes through the surfaces a person uses (the pathway, the exam,
// /pay/plans, /achievements, the purchase and its settlement) and asserts what
// they would see at that moment.
import {
  describe, it, expect, beforeEach, afterEach, afterAll, vi,
} from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import {
  getPathways, getPathwayById, applyRemotePathways, resetRemotePathways, MIN_CERTIFICATE_STEPS,
} from '../src/pathways.js';
import { startPayment, settlePayment } from '../src/services/payment.js';
import { availableCredits, discountedRial } from '../src/services/discount-credits.js';
import { PILLAR_SEATS } from '../src/services/pillar.js';
import { resetRateLimits } from '../src/services/rate-limit.js';

const PATHWAY = 'evidence-literacy';
const LOCKED = 'digital';
const SIX_MONTH_RIAL = 60_000_000;
const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

let app: FastifyInstance;
let fetchMock: ReturnType<typeof vi.fn>;
let trk = 0;

/**
 * The shipped pathway is still `pending` and under the step floor (its series
 * is being written), so the walk releases it the way the founder will: the flag
 * comes off and the pathway has grown past MIN_CERTIFICATE_STEPS. Everything
 * else — `premium: false`, the ٪۲۰ — is read from the shipped file.
 */
function releasePathway(): string[] {
  const raw = JSON.parse(JSON.stringify(getPathways())) as Array<{
    id: string; certificate?: string; steps: { content_id: string }[];
  }>;
  const p = raw.find((x) => x.id === PATHWAY)!;
  delete p.certificate;
  const extra = raw.find((x) => x.id === LOCKED)!.steps
    .filter((s) => !p.steps.some((t) => t.content_id === s.content_id));
  while (p.steps.length < MIN_CERTIFICATE_STEPS) p.steps.push({ ...extra.shift()!, milestone: false } as never);
  expect(applyRemotePathways(raw)).toBe(true);
  return p.steps.map((s) => s.content_id);
}

let STEPS: string[] = [];

beforeEach(async () => {
  await resetDb();
  resetRateLimits();
  if (!app) app = await makeApp();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  config.payments.enabled = true;
  STEPS = releasePathway();
});
afterEach(() => { vi.unstubAllGlobals(); resetRemotePathways(); });
afterAll(async () => { await app?.close(); await pool.end(); });

const as = (cookie: string) => ({
  get: (url: string) => app.inject({ method: 'GET', url, headers: { cookie } }),
  post: (url: string, body: unknown = {}) => app.inject({ method: 'POST', url, headers: { cookie }, payload: body as object }),
});
const adminPost = (url: string, body: unknown) => app.inject({
  method: 'POST', url, headers: { authorization: basic }, payload: body as object,
});
async function uidOf(phone: string): Promise<string> {
  return (await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone])).rows[0].id;
}

/** The founder writes three questions and presses «اعلام آمادگی». */
async function openExam(): Promise<void> {
  for (const n of [1, 2, 3]) {
    const r = await adminPost('/admin/exam-forms/questions', {
      pathway_id: PATHWAY,
      question: { kind: 'mcq', prompt_fa: `سؤال ${n}؟`, options: ['الف', 'ب', 'ج', 'د'], correct: 1 },
    });
    expect(r.statusCode).toBe(200);
  }
  expect((await adminPost('/admin/exam-forms/publish', { pathway_id: PATHWAY })).statusCode).toBe(200);
}

/** A reader reads the whole pathway, enrols, asks for the certificate, sits and passes. */
async function earnCertificate(phone: string, cookie: string): Promise<string> {
  const me = as(cookie);
  const id = await uidOf(phone);
  expect((await me.post(`/pathways/${PATHWAY}/enroll`)).statusCode).toBe(200);
  for (const cid of STEPS) {
    await pool.query(`insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [id, cid]);
  }
  expect((await me.post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' })).statusCode).toBe(200);
  const ready = (await me.get(`/exams/${PATHWAY}`)).json();
  expect(ready.state).toBe('ready');
  const start = await me.post(`/exams/${PATHWAY}/start`, { holder_first_name: 'مهسا', holder_last_name: 'رضایی' });
  expect(start.statusCode).toBe(200);
  const answers = Object.fromEntries(start.json().open.questions.map((q: { id: string }) => [q.id, 1]));
  const done = await me.post(`/exams/${PATHWAY}/submit`, { answers });
  expect(done.statusCode).toBe(200);
  expect(done.json().state).toBe('passed');
  return done.json().certificate.verify_code as string;
}

/** What the reader's own screens say right now. */
async function screens(cookie: string) {
  const me = as(cookie);
  const plans = (await me.get('/pay/plans')).json();
  const six = plans.plans.find((p: { months: number }) => p.months === 6);
  const ach = (await me.get('/achievements')).json();
  return { plans, six, discount: ach.discount };
}

/** One purchase, opened and settled the way the gateway does it. */
async function buy(phone: string, referralCode?: string): Promise<number> {
  trk += 1;
  const track = { result: 100, trackId: `TRK-W-${trk}` };
  fetchMock.mockResolvedValueOnce({ status: 200, json: async () => track } as unknown as Response);
  const r = await startPayment({ userId: await uidOf(phone), months: 6, referralCode });
  expect(r.ok).toBe(true);
  const amount = r.payment!.amount_rial;
  fetchMock.mockResolvedValueOnce({
    status: 200, json: async () => ({ result: 100, status: 1, amount, refNumber: `REF-${trk}` }),
  } as unknown as Response);
  expect((await settlePayment(r.payment!.ref_id!)).outcome).toBe('activated');
  return amount;
}
const pctOff = (amount: number) => Math.round((1 - amount / SIX_MONTH_RIAL) * 100);

/** Fill every «ستون» seat with somebody else, so a later payer is an ordinary subscriber. */
async function fillPillarSeats(): Promise<void> {
  for (let i = 0; i < PILLAR_SEATS; i += 1) {
    const phone = `0912990${String(i).padStart(4, '0')}`;
    const r = await pool.query<{ id: string }>(
      `insert into profiles (phone, display_name, tier) values ($1, $2, 'premium') returning id`,
      [phone, `seat ${i}`],
    );
    await pool.query(
      `insert into payments (user_id, amount_rial, months, gateway, ref_id, order_id, status, verified_at, created_at)
       values ($1, 10000000, 1, 'zibal', $2, $3, 'paid', now() - interval '30 days', now() - interval '30 days')`,
      [r.rows[0].id, `TRK-SEAT-${i}`, `seat_${i}`],
    );
  }
}

/* ══════════════════════════════════════════════════════════════════════════ */

describe('1 · a free reader, first purchase', () => {
  it('opens the pathway for free, earns the certificate, and takes ٪۲۰ at once', async () => {
    await openExam();
    const phone = '09121300001';
    const cookie = await loginAs(app, phone);
    const me = as(cookie);

    // The catalog: this pathway open and marked, the rest locked but listed.
    const list = (await me.get('/pathways')).json().pathways;
    expect(list.find((p: { id: string }) => p.id === PATHWAY)).toMatchObject({ open: true, free: true, certifiable: true });
    expect(list.find((p: { id: string }) => p.id === LOCKED)).toMatchObject({ open: false });
    expect((await me.get(`/pathways/${LOCKED}`)).statusCode).toBe(402);
    expect((await me.get(`/exams/${LOCKED}`)).statusCode).toBe(402);
    expect((await me.get(`/pathways/${PATHWAY}`)).statusCode).toBe(200);

    // Before the certificate: list price, nothing to spend.
    let s = await screens(cookie);
    expect(s.six.amount_rial).toBe(SIX_MONTH_RIAL);
    expect(s.plans.onetime_discount).toBeNull();

    const code = await earnCertificate(phone, cookie);
    expect(code).toMatch(/^DC-/);
    const note = await pool.query(`select body from notification_log where user_id = $1 and title like '%قبول شدی%'`, [await uidOf(phone)]);
    expect(note.rows[0].body).toContain('۲۰٪');
    expect(note.rows[0].body).toContain('یک‌جا');

    // The pricing page and the profile box agree: ٪۲۰, all of it now, named as
    // the certificate's — never «٪۲۰ … سقف ٪۱۰».
    s = await screens(cookie);
    expect(s.six.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 20));
    expect(s.plans.onetime_discount).toMatchObject({ percent: 20, first_purchase_percent: 20, cap_percent: 10 });
    expect(s.discount).toMatchObject({ ready_percent: 20, first_purchase_percent: 20, next_purchase_percent: 20 });

    // The till charges exactly what the page quoted.
    expect(await buy(phone)).toBe(discountedRial(SIX_MONTH_RIAL, 20));
    expect((await pool.query('select tier from profiles where phone = $1', [phone])).rows[0].tier).toBe('premium');

    // Spent whole, once: no instalments appear afterwards. (Being among the
    // first paying accounts in this empty database, they now hold a «ستون»
    // seat — ٪۲۰ from the seat, nothing from the certificate.)
    expect(await availableCredits(await uidOf(phone))).toHaveLength(0);
    s = await screens(cookie);
    expect(s.plans.onetime_discount).toBeNull();
    expect(s.discount).toMatchObject({ ready_percent: 0, spent_percent: 20 });
    expect(pctOff(await buy(phone))).toBe(20);
    expect(pctOff(await buy(phone))).toBe(20);
  });

  it('with a referral code on the same first purchase: ٪۳۰', async () => {
    await openExam();
    const refCookie = await loginAs(app, '09121300009');
    const mint = await as(refCookie).post('/referral', { alias: 'evidence' });
    expect(mint.statusCode).toBe(200);
    const refCode = mint.json().code as string;

    const phone = '09121300002';
    const cookie = await loginAs(app, phone);
    await earnCertificate(phone, cookie);

    const preview = (await as(cookie).get(`/pay/plans?ref=${refCode}`)).json();
    expect(preview.plans.find((p: { months: number }) => p.months === 6).amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 30));
    expect(await buy(phone, refCode)).toBe(discountedRial(SIX_MONTH_RIAL, 30));
  });

  it('a refused first payment gives the ٪۲۰ back whole', async () => {
    await openExam();
    const phone = '09121300003';
    const cookie = await loginAs(app, phone);
    await earnCertificate(phone, cookie);

    fetchMock.mockResolvedValueOnce({ status: 200, json: async () => ({ result: 102, message: 'nope' }) } as unknown as Response);
    expect((await startPayment({ userId: await uidOf(phone), months: 6 })).ok).toBe(false);
    expect((await screens(cookie)).plans.onetime_discount).toMatchObject({ percent: 20, first_purchase_percent: 20 });
    expect(await buy(phone)).toBe(discountedRial(SIX_MONTH_RIAL, 20));
  });
});

describe('2 · somebody who has paid before (no «ستون» seat)', () => {
  it('gets the whole ٪۲۰ too, as ٪۱۰ + ٪۱۰ over two purchases, inside the cap', async () => {
    await fillPillarSeats();
    await openExam();
    const phone = '09121300004';
    const cookie = await loginAs(app, phone);
    // An earlier subscription, bought at list price after the seats were gone.
    expect(pctOff(await buy(phone))).toBe(0);

    await earnCertificate(phone, cookie);
    const note = await pool.query(`select body from notification_log where user_id = $1 and title like '%قبول شدی%'`, [await uidOf(phone)]);
    expect(note.rows[0].body).toContain('هر بار ۱۰٪');

    let s = await screens(cookie);
    expect(s.plans.onetime_discount).toMatchObject({ percent: 10, first_purchase_percent: 0 });
    expect(s.discount).toMatchObject({ ready_percent: 20, first_purchase_percent: 0, next_purchase_percent: 10 });
    const labels = (s.discount.items as { label_fa: string }[]).map((i) => i.label_fa);
    expect(labels.some((l) => l.includes('قسط ۱ از ۲'))).toBe(true);
    expect(labels.some((l) => l.includes('قسط ۲ از ۲'))).toBe(true);

    expect(pctOff(await buy(phone))).toBe(10);
    s = await screens(cookie);
    expect(s.discount).toMatchObject({ ready_percent: 10, spent_percent: 10, next_purchase_percent: 10 });
    expect(pctOff(await buy(phone))).toBe(10);
    s = await screens(cookie);
    expect(s.plans.onetime_discount).toBeNull();
    expect(s.discount).toMatchObject({ ready_percent: 0, spent_percent: 20 });
    expect(pctOff(await buy(phone))).toBe(0);
  });

  it('a badge credit beside it waits its turn; the cap still holds at ٪۱۰', async () => {
    await fillPillarSeats();
    await openExam();
    const phone = '09121300005';
    const cookie = await loginAs(app, phone);
    await buy(phone);
    await pool.query(`insert into discount_grants (user_id, percent, label_fa) values ($1, 5, 'تولد')`, [await uidOf(phone)]);
    await earnCertificate(phone, cookie);

    expect(pctOff(await buy(phone))).toBe(10); // one instalment; the ٪۵ waits
    expect(pctOff(await buy(phone))).toBe(10); // the second
    expect(pctOff(await buy(phone))).toBe(5);  // then the birthday
    expect(pctOff(await buy(phone))).toBe(0);
  });
});

describe('3 · a «ستون» seat-holder', () => {
  it('never passes ٪۳۰ on one purchase: ٪۲۰ seat + ٪۱۰ instalment, twice, then ٪۲۰', async () => {
    await openExam();
    const phone = '09121300006';
    const cookie = await loginAs(app, phone);
    expect(pctOff(await buy(phone))).toBe(0); // the purchase that mints the seat
    await earnCertificate(phone, cookie);

    const s = await screens(cookie);
    expect(s.plans.pillar_discount).toMatchObject({ percent: 20 });
    expect(s.six.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 30));
    expect(s.discount).toMatchObject({ pillar_percent: 20, next_purchase_percent: 30, first_purchase_percent: 0 });

    expect(pctOff(await buy(phone))).toBe(30);
    expect(pctOff(await buy(phone))).toBe(30);
    expect(pctOff(await buy(phone))).toBe(20);
  });
});

describe('4 · edges', () => {
  it('a subscription that began on the bank-transfer rail counts as «paid before»', async () => {
    await openExam();
    const phone = '09121300007';
    const cookie = await loginAs(app, phone);
    await pool.query(
      `insert into gift_redemptions (user_id, kind, code, reference, months, status, amount_rial)
       values ($1, 'bank_transfer', 'T-AAA-BBB', 'T-AAA-BBB', 6, 'approved', 60000000)`,
      [await uidOf(phone)],
    );
    await earnCertificate(phone, cookie);
    expect((await screens(cookie)).plans.onetime_discount).toMatchObject({ percent: 10, first_purchase_percent: 0 });
  });

  it('every other pathway still mints the ordinary ٪۱۰, and stays premium', () => {
    const others = getPathways().filter((p) => p.kind !== 'bundle' && p.id !== PATHWAY);
    for (const p of others) {
      expect(p.certificate_discount_percent).toBeUndefined();
      expect(p.premium).not.toBe(false);
    }
    expect(getPathwayById(PATHWAY)).toMatchObject({ premium: false, certificate_discount_percent: 20 });
  });
});
