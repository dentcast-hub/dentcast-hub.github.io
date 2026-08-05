import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from './helpers.js';
import { pool, closePool } from '../src/db.js';
import { config } from '../src/config.js';
import {
  getCapacity, canSellPlan, planAmountRial, currentPeriod, periodStamps, capacityMessage,
} from '../src/services/payment-capacity.js';
import { jalaliMonth, gregorianMonth } from '../src/services/time.js';

/**
 * The monthly gateway ceiling (level 2.1): 100,000,000 toman and 100
 * transactions, reset on the first of a Persian month. What matters is that the
 * question asked is "does THIS plan fit in what is left", not "is there room" —
 * with 1/3/6-month plans a single boolean is wrong in both directions.
 */

const MONTH_RIAL = 10_000_000;     // 1,000,000 toman
const CAP_RIAL = 1_000_000_000;    // 100,000,000 toman

let seq = 0;

async function makeUser(): Promise<string> {
  seq += 1;
  const r = await pool.query<{ id: string }>(
    'insert into profiles (phone, display_name) values ($1, $2) returning id',
    [`0912920${String(seq).padStart(4, '0')}`, `کاربر ${seq}`],
  );
  return r.rows[0].id;
}

/** Insert a payment into the CURRENT period, as the payment routes will. */
async function addPayment(opts: {
  months: number; status?: string; period?: { period_jalali: string; period_gregorian: string };
}): Promise<void> {
  const user = await makeUser();
  const stamps = opts.period ?? periodStamps();
  seq += 1;
  await pool.query(
    `insert into payments
       (user_id, amount_rial, months, gateway, order_id, status, period_jalali, period_gregorian)
     values ($1, $2, $3, 'zibal', $4, $5, $6, $7)`,
    [user, planAmountRial(opts.months), opts.months, `order_${seq}`,
      opts.status ?? 'paid', stamps.period_jalali, stamps.period_gregorian],
  );
}

beforeEach(resetDb);
afterAll(closePool);

describe('capacity accounting', () => {
  it('starts the month empty, with every plan on offer', async () => {
    const cap = await getCapacity();
    expect(cap.used_rial).toBe(0);
    expect(cap.used_count).toBe(0);
    expect(cap.remaining_rial).toBe(CAP_RIAL);
    expect(cap.any_plan_available).toBe(true);
    expect(cap.plans.every((p) => p.available)).toBe(true);
    expect(cap.plans.map((p) => p.months)).toEqual([1, 3, 6]);
  });

  it('prices a plan as months x the monthly rial price', () => {
    expect(planAmountRial(1)).toBe(MONTH_RIAL);
    expect(planAmountRial(6)).toBe(6 * MONTH_RIAL);
  });

  it('counts what has been sold this month', async () => {
    await addPayment({ months: 6 });
    await addPayment({ months: 1 });

    const cap = await getCapacity();
    expect(cap.used_count).toBe(2);
    expect(cap.used_rial).toBe(7 * MONTH_RIAL);
    expect(cap.remaining_rial).toBe(CAP_RIAL - 7 * MONTH_RIAL);
  });

  it('ignores a payment from a previous month', async () => {
    await addPayment({ months: 6, period: { period_jalali: '1404-01', period_gregorian: '2025-04' } });

    const cap = await getCapacity();
    expect(cap.used_count).toBe(0);
    expect(cap.remaining_rial).toBe(CAP_RIAL);
  });

  it('offers the plans that still fit and withdraws only the ones that do not', async () => {
    // 96 of 100 million toman consumed: 1 and 3 months still fit, 6 does not.
    for (let i = 0; i < 16; i += 1) await addPayment({ months: 6 });

    const cap = await getCapacity();
    expect(cap.used_rial).toBe(96 * MONTH_RIAL);
    expect(cap.plans.find((p) => p.months === 1)!.available).toBe(true);
    expect(cap.plans.find((p) => p.months === 3)!.available).toBe(true);
    const six = cap.plans.find((p) => p.months === 6)!;
    expect(six.available).toBe(false);
    expect(six.blocked_by).toBe('amount');
    // The shop is still open — a single boolean would have closed it.
    expect(cap.any_plan_available).toBe(true);
  });

  it('closes entirely once even one month would overshoot', async () => {
    for (let i = 0; i < 100; i += 1) await addPayment({ months: 1 });

    const cap = await getCapacity();
    expect(cap.remaining_rial).toBe(0);
    expect(cap.any_plan_available).toBe(false);
    expect(capacityMessage(cap)).toContain('تکمیل شده');
  });

  it('blocks on the transaction count even when rials are left over', async () => {
    // 100 one-month sales is only 100M rial of a 1,000M ceiling — but it is
    // exactly 100 transactions, and that ceiling binds first.
    for (let i = 0; i < 100; i += 1) {
      await pool.query(
        `insert into payments (user_id, amount_rial, months, gateway, order_id, status,
                               period_jalali, period_gregorian)
         values ($1, $2, 1, 'zibal', $3, 'paid', $4, $5)`,
        [await makeUser(), 1_000_000, `tiny_${i}`,
          periodStamps().period_jalali, periodStamps().period_gregorian],
      );
    }

    const cap = await getCapacity();
    expect(cap.remaining_count).toBe(0);
    expect(cap.remaining_rial).toBeGreaterThan(0);
    expect(cap.plans.every((p) => !p.available)).toBe(true);
    expect(cap.plans[0].blocked_by).toBe('count');
  });

  it('counts abandoned attempts too, because we do not yet know that Zibal forgives them', async () => {
    expect(config.payments.capCountsAttempts).toBe(true);
    await addPayment({ months: 6, status: 'pending' });
    await addPayment({ months: 6, status: 'failed' });
    await addPayment({ months: 6, status: 'paid' });

    const cap = await getCapacity();
    expect(cap.used_count).toBe(3);
    // ...while still reporting what it actually cost, so the setting can be
    // decided on evidence rather than argued about.
    expect(cap.used_count_verified).toBe(1);
    expect(cap.used_rial_verified).toBe(6 * MONTH_RIAL);
  });

  it('raises near_limit once either ceiling crosses the warning threshold', async () => {
    for (let i = 0; i < 13; i += 1) await addPayment({ months: 6 });
    expect((await getCapacity()).near_limit).toBe(false); // 78%

    await addPayment({ months: 6 }); // 84%
    const cap = await getCapacity();
    expect(cap.near_limit).toBe(true);
    expect(cap.used_fraction).toBeGreaterThan(config.payments.capWarnAt);
  });

  it('never reports negative headroom if the ceiling is somehow overshot', async () => {
    for (let i = 0; i < 20; i += 1) await addPayment({ months: 6 }); // 120M toman

    const cap = await getCapacity();
    expect(cap.remaining_rial).toBe(0);
    expect(cap.remaining_count).toBeGreaterThanOrEqual(0);
  });
});

describe('canSellPlan', () => {
  it('permits a plan that fits', async () => {
    expect((await canSellPlan(6)).ok).toBe(true);
  });

  it('refuses the plan that no longer fits while permitting a smaller one', async () => {
    for (let i = 0; i < 16; i += 1) await addPayment({ months: 6 }); // 96M

    expect((await canSellPlan(6)).ok).toBe(false);
    expect((await canSellPlan(6)).blocked_by).toBe('amount');
    expect((await canSellPlan(1)).ok).toBe(true);
  });

  it('refuses a plan we do not sell', async () => {
    const r = await canSellPlan(12);
    expect(r.ok).toBe(false);
    expect(r.blocked_by).toBe('unknown_plan');
  });
});

describe('the period window', () => {
  it('uses the Persian month by default, not the Gregorian one', () => {
    expect(config.payments.capCalendar).toBe('jalali');
    // 21 March 2026 is 1 Farvardin 1405 — a new ceiling month, while the
    // Gregorian month has ten days still to run.
    expect(jalaliMonth(new Date('2026-03-21T12:00:00Z'))).toBe('1405-01');
    expect(jalaliMonth(new Date('2026-03-20T12:00:00Z'))).toBe('1404-12');
    expect(gregorianMonth(new Date('2026-03-20T12:00:00Z'))).toBe('2026-03');
    expect(gregorianMonth(new Date('2026-03-21T12:00:00Z'))).toBe('2026-03');
  });

  it('stamps both calendars on every row, so the setting can change later', () => {
    const stamps = periodStamps(new Date('2026-08-05T12:00:00Z'));
    expect(stamps.period_jalali).toBe('1405-05');
    expect(stamps.period_gregorian).toBe('2026-08');
    expect(currentPeriod(new Date('2026-08-05T12:00:00Z'))).toBe('1405-05');
  });

  it('reads the Tehran day boundary, not UTC', () => {
    // 01:00 Tehran on 22 March is still 21 March in UTC; both are Farvardin.
    expect(jalaliMonth(new Date('2026-03-21T21:30:00Z'))).toBe('1405-01');
  });
});
