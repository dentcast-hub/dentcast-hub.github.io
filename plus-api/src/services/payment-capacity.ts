import { config } from '../config.js';
import { one } from '../db.js';
import { jalaliMonth, gregorianMonth } from './time.js';

/**
 * How much of this month's gateway ceiling is left.
 *
 * The e-namad کسب‌وکار خرد registration caps us at 100,000,000 toman AND 100
 * transactions per month. Both are enforced by the gateway, not by us, and the
 * gateway's enforcement is a refusal — which reaches the customer as a payment
 * page that simply does not work, at the exact moment they had decided to pay.
 * This module exists so that never happens: we stop selling one step before the
 * ceiling and say so honestly, instead of letting the ceiling say it for us.
 *
 * THE QUESTION IS "DOES THIS PURCHASE FIT", NOT "IS THERE ROOM". With plans of
 * 1, 3 and 6 months the amounts differ six-fold, so a single boolean would be
 * wrong in both directions: at 96M consumed a one-month purchase still fits
 * perfectly while a six-month one would overshoot by 2M. Asking per-plan keeps
 * the shop open for exactly as long as it can honestly stay open, and lets the
 * pricing page grey out one plan rather than close the whole page.
 *
 * WHY WE COUNT ATTEMPTS, NOT SALES (config.payments.capCountsAttempts). We do
 * not yet know whether Zibal's counter forgives a payment the customer
 * abandoned. Counting only completed sales is the optimistic reading, and if it
 * is wrong the failure mode is the worst one this system has: the customer is
 * charged, the gateway then refuses, and the subscription never activates. So
 * until Zibal answers, every attempt that reached the gateway counts. Being
 * early costs a little revenue and is visible; being late costs someone's money
 * and is not.
 *
 * The counter reads `payments` rather than a running total in its own table.
 * A stored total is a second source of truth that drifts the first time a
 * transaction is inserted by anything but the one code path that increments it;
 * the ledger cannot drift from itself.
 */

export interface PlanOffer {
  months: number;
  amount_rial: number;
  /** False when this plan alone would push us past a ceiling this month. */
  available: boolean;
  /** Which ceiling blocks it — for the message shown, not for branching. */
  blocked_by: 'amount' | 'count' | null;
}

export interface Capacity {
  /** The month window being counted, e.g. '1405-05'. */
  period: string;
  calendar: 'jalali' | 'gregorian';
  used_rial: number;
  used_count: number;
  cap_rial: number;
  cap_count: number;
  remaining_rial: number;
  remaining_count: number;
  /** The larger of the two usage fractions — what "how full are we" means. */
  used_fraction: number;
  /** True once usage crosses config.payments.capWarnAt on either ceiling. */
  near_limit: boolean;
  /** False when even the cheapest plan no longer fits. */
  any_plan_available: boolean;
  plans: PlanOffer[];
  /**
   * Sales only, for the founder's eye. If Zibal turns out to forgive abandoned
   * payments, this is what our usage really was — the gap between the two is
   * the cost of counting conservatively, and it should be visible rather than
   * argued about.
   */
  used_count_verified: number;
  used_rial_verified: number;
}

/** The month window the ceiling resets on, in the configured calendar. */
export function currentPeriod(now: Date = new Date()): string {
  return config.payments.capCalendar === 'gregorian' ? gregorianMonth(now) : jalaliMonth(now);
}

/**
 * Both calendars' month labels, stamped onto every payment row at creation.
 * Storing both is what lets `capCalendar` be changed later without the counter
 * losing sight of the rows written under the previous setting.
 */
export function periodStamps(now: Date = new Date()): {
  period_jalali: string; period_gregorian: string;
} {
  return { period_jalali: jalaliMonth(now), period_gregorian: gregorianMonth(now) };
}

/**
 * Rial price of an N-month subscription, or null for a term we do not sell.
 *
 * A LOOKUP, NOT A CALCULATION. The ladder is non-linear on purpose (a longer
 * term is cheaper per month), so there is no rate to multiply by; and an unknown
 * term now has to answer "no" rather than invent a price for itself, which is
 * what a multiplication would have done for any number a caller passed in.
 */
export function planAmountRial(months: number): number | null {
  const amount = config.payments.planPricesRial[months];
  return amount === undefined ? null : amount;
}

/**
 * Statuses that consume capacity. 'pending' is included when we count attempts:
 * a payment we started and never heard back about is precisely the case Zibal
 * may or may not have counted, and the conservative reading is that it did.
 */
function consumingStatuses(): string[] {
  return config.payments.capCountsAttempts ? ['pending', 'paid', 'failed'] : ['paid'];
}

export async function getCapacity(now: Date = new Date()): Promise<Capacity> {
  const period = currentPeriod(now);
  const { capRial, capCount, capWarnAt } = config.payments;

  // Both readings in one pass: the conservative total that gates sales, and the
  // verified-only total that says what it cost us.
  // The period column is chosen by a CASE on the config value rather than by
  // interpolating a column name — same effect, no string-built SQL.
  const row = (await one<{
    used_rial: string | number; used_count: number;
    verified_rial: string | number; verified_count: number;
  }>(
    `select
       coalesce(sum(amount_rial) filter (where status = any($2)), 0) as used_rial,
       count(*) filter (where status = any($2))::int                 as used_count,
       coalesce(sum(amount_rial) filter (where status = 'paid'), 0)  as verified_rial,
       count(*) filter (where status = 'paid')::int                  as verified_count
      from payments
      where (case when $3 = 'gregorian' then period_gregorian else period_jalali end) = $1`,
    [period, consumingStatuses(), config.payments.capCalendar],
  ))!;

  const usedRial = Number(row.used_rial);
  const usedCount = row.used_count;
  const remainingRial = Math.max(0, capRial - usedRial);
  const remainingCount = Math.max(0, capCount - usedCount);
  const usedFraction = Math.max(
    capRial > 0 ? usedRial / capRial : 0,
    capCount > 0 ? usedCount / capCount : 0,
  );

  const plans: PlanOffer[] = config.payments.planMonths.map((months) => {
    const amount = planAmountRial(months)!; // planMonths ARE the priced terms
    // Order matters only for the message: when both ceilings block, naming the
    // amount is the more useful thing to say, since it is the one a smaller plan
    // can still get under.
    const blocked: PlanOffer['blocked_by'] = amount > remainingRial ? 'amount'
      : remainingCount < 1 ? 'count'
        : null;
    return { months, amount_rial: amount, available: blocked === null, blocked_by: blocked };
  });

  return {
    period,
    calendar: config.payments.capCalendar === 'gregorian' ? 'gregorian' : 'jalali',
    used_rial: usedRial,
    used_count: usedCount,
    cap_rial: capRial,
    cap_count: capCount,
    remaining_rial: remainingRial,
    remaining_count: remainingCount,
    used_fraction: usedFraction,
    near_limit: usedFraction >= capWarnAt,
    any_plan_available: plans.some((p) => p.available),
    plans,
    used_rial_verified: Number(row.verified_rial),
    used_count_verified: row.verified_count,
  };
}

export interface FitResult {
  ok: boolean;
  blocked_by: 'amount' | 'count' | 'unknown_plan' | null;
  capacity: Capacity;
}

/**
 * The gate every purchase passes through: may we sell N months right now?
 *
 * Checked immediately before handing the customer to the gateway rather than
 * only when the pricing page renders — the page may have been open for an hour,
 * and the last seat can only be sold once.
 */
export async function canSellPlan(months: number, now: Date = new Date()): Promise<FitResult> {
  const capacity = await getCapacity(now);
  const plan = capacity.plans.find((p) => p.months === months);
  if (!plan) return { ok: false, blocked_by: 'unknown_plan', capacity };
  return { ok: plan.available, blocked_by: plan.blocked_by, capacity };
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/**
 * What to tell a customer who could not be sold to. Never a bare error, and
 * never a dead end while anything is still buyable: naming the largest plan
 * that DOES fit turns "no" into a choice.
 */
export function capacityMessage(capacity: Capacity): string {
  const stillAvailable = capacity.plans.filter((p) => p.available).map((p) => p.months);
  if (!stillAvailable.length) {
    return 'ظرفیت فروش این ماه تکمیل شده است. به‌محض باز شدن ظرفیت به شما خبر می‌دهیم.';
  }
  const best = Math.max(...stillAvailable);
  return 'ظرفیت فروش این ماه رو به پایان است و این طرح دیگر جا نمی‌شود. '
    + `طرح ${toFa(best)} ماهه هنوز در دسترس است.`;
}
