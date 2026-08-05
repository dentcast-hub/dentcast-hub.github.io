import { config } from '../config.js';
import { one, query } from '../db.js';
import { sendCapped } from './notify-policy.js';
import { getCapacity, type Capacity } from './payment-capacity.js';

/**
 * Tell the founder when the month's gateway ceiling is running out — before the
 * gateway starts refusing customers rather than after.
 *
 * This is the one piece of the capacity system aimed at us rather than at a
 * buyer. The pricing page already handles the customer's side honestly (a plan
 * that no longer fits goes dark, with a sentence saying so); what it cannot do
 * is get the ceiling raised. Only a person can do that, and only if they know
 * in time — hence a warning at 80% rather than a discovery at 100%.
 *
 * TWO ALERTS, EACH ONCE PER MONTH.
 *   'warn' — usage crossed capWarnAt on either ceiling. Time to act.
 *   'full' — nothing is buyable at all. Sales have actually stopped.
 * Fired once per period each: a ceiling that stays at 90% for three weeks is
 * the same one fact, and a daily repeat of it is how a founder learns to
 * ignore the alert that matters.
 *
 * The "already sent" marker is a row in `user_activity`, not a new table. The
 * period string is in its meta, so idempotency is a lookup on the log that
 * already exists — and the log doubles as the record of when each month
 * actually filled up, which is the number that decides whether the ceiling
 * needs raising at all.
 */

export type CapAlertLevel = 'warn' | 'full';

const ACTION = 'payment_cap_alert';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number | string): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
/** Rial in, Persian toman out — the founder thinks in toman like everyone else. */
const toman = (rial: number): string =>
  toFa(Math.round(rial / 10).toLocaleString('en-US').replace(/,/g, '٬'));

/** Who to tell. Empty (the default) means nobody is subscribed to this. */
async function alertTarget(): Promise<string | null> {
  const phone = config.payments.capAlertPhone;
  if (!phone) return null;
  const row = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return row?.id ?? null;
}

async function alreadySent(level: CapAlertLevel, period: string): Promise<boolean> {
  const row = await one<{ id: number }>(
    `select id from user_activity
      where action = $1 and meta->>'period' = $2 and meta->>'level' = $3 limit 1`,
    [ACTION, period, level],
  );
  return row !== null;
}

function messageFor(level: CapAlertLevel, cap: Capacity): { title: string; body: string } {
  const pct = toFa(Math.min(100, Math.round(cap.used_fraction * 100)));
  const left = `${toman(cap.remaining_rial)} تومان و ${toFa(cap.remaining_count)} تراکنش`;

  if (level === 'full') {
    return {
      title: 'ظرفیت درگاه تکمیل شد',
      body: `ماه ${cap.period}: سقف پر شد و فروش متوقف است. `
        + `مصرف: ${toman(cap.used_rial)} تومان در ${toFa(cap.used_count)} تراکنش.`,
    };
  }
  return {
    title: 'ظرفیت درگاه رو به پایان است',
    body: `ماه ${cap.period}: ${pct}٪ مصرف شده. باقی‌مانده: ${left}.`,
  };
}

/**
 * Check the ceiling and alert if a threshold has just been crossed.
 *
 * Safe to call often and from anywhere: it is idempotent per (period, level),
 * it never throws, and it does nothing at all when no alert phone is
 * configured. Callers treat it as fire-and-forget — a failed notification must
 * never affect a payment that has already been taken.
 */
export async function checkCapacityAlert(now: Date = new Date()): Promise<{
  sent: CapAlertLevel | null; capacity: Capacity;
}> {
  const capacity = await getCapacity(now);

  // 'full' supersedes 'warn': once sales have stopped, a warning that they are
  // about to is no longer the news.
  const level: CapAlertLevel | null = !capacity.any_plan_available ? 'full'
    : capacity.near_limit ? 'warn'
      : null;
  if (!level) return { sent: null, capacity };
  if (await alreadySent(level, capacity.period)) return { sent: null, capacity };

  const userId = await alertTarget();
  const { title, body } = messageFor(level, capacity);

  // Logged before (and regardless of) delivery. The console line is the only
  // channel that always exists — an unconfigured alert phone, a blocked bot or
  // a dead device must not make a full ceiling silent.
  // eslint-disable-next-line no-console
  console.warn(`[payment-cap] ${level.toUpperCase()} ${capacity.period} — ${body}`);

  if (!userId) return { sent: null, capacity };

  // Claim first: the marker is what makes a second caller a no-op, so it has to
  // be written before the slow part, not after it.
  await query(
    `insert into user_activity (user_id, action, meta) values ($1, $2, $3)`,
    [userId, ACTION, JSON.stringify({
      level,
      period: capacity.period,
      used_rial: capacity.used_rial,
      used_count: capacity.used_count,
      used_fraction: capacity.used_fraction,
    })],
  );

  // 'system' is the founder-broadcast kind: exempt from the per-user daily cap,
  // which is right for the two messages a year that mean "the shop is closing".
  await sendCapped(userId, { title, body, url: '/admin', tag: 'payment_cap' }, 'system', now);

  return { sent: level, capacity };
}
