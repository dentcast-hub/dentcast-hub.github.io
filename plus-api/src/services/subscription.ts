import { config } from '../config.js';
import { pool, one, withTransaction, type Queryable } from '../db.js';

/**
 * The subscription engine — the ONE place a premium subscription is created or
 * extended. The payment gateway, the admin gift tool and (later) card-to-card
 * approval all call in here; none of them writes `subscriptions` or
 * `profiles.tier` itself. Two payment paths, one outcome, no parallel logic.
 *
 * `subscriptions` holds one row per user and is extended in place (see migration
 * 0018): it is STATE, not a purchase history. What was bought lives in
 * `payments`, and the audit trail of every activation lives in `user_activity`.
 *
 * The extension rule is `max(now, current expiry) + N months`, and the `max` is
 * the point. Renewing early must not burn the days already paid for — a user who
 * tops up with three weeks left should end up three weeks further out, not three
 * weeks poorer. Anchoring to `now` instead is the single most common way a
 * subscription system quietly steals time, and it is invisible until someone
 * complains.
 */

/** Where an activation came from. Recorded for audit; never branched on. */
export type ActivationSource = 'payment' | 'admin';

/** `plan` for a bought/gifted subscription with a finite end date. */
export const PLAN_PAID = 'paid';

export interface Subscription {
  user_id: string;
  status: 'active' | 'expired';
  plan: string;
  started_at: Date;
  /** NULL means lifetime — see the lifetime invariant in migration 0018. */
  expires_at: Date | null;
  is_founder: boolean;
}

const SUB_COLUMNS = 'user_id, status, plan, started_at, expires_at, is_founder';

/** A subscription may be bought this many months at a time, at most. */
const MAX_MONTHS = 60;

export async function getSubscription(
  userId: string,
  client: Queryable = pool,
): Promise<Subscription | null> {
  return one<Subscription>(
    `select ${SUB_COLUMNS} from subscriptions where user_id = $1`,
    [userId],
    client,
  );
}

/**
 * Is this subscription premium at `now`? Reads the DATE, not `status` — status
 * only records whether the nightly sweep has caught up yet, so between a row
 * falling due and the sweep running it still says 'active'. Every gate must
 * agree with the calendar, not with the cron.
 */
export function isPremiumNow(sub: Subscription | null, now: Date = new Date()): boolean {
  if (!sub || sub.status !== 'active') return false;
  return sub.expires_at === null || sub.expires_at.getTime() > now.getTime();
}

/**
 * Add `months` to a user's subscription, creating it if absent.
 *
 * Month arithmetic is done by Postgres in the Tehran wall clock, not in JS.
 * Two reasons: `+ interval 'N months'` already handles the month-end cases a
 * naive `setMonth` gets wrong (31 Farvardin + 1 month lands on the last day of
 * the next month, not the 1st of the one after), and anchoring the addition to
 * Asia/Tehran keeps the expiry on the same wall-clock time-of-day the user
 * bought at — the same timezone the streak engine and every scheduler already
 * live in.
 */
export async function activateMonths(
  userId: string,
  months: number,
  opts: { source: ActivationSource; now?: Date; meta?: Record<string, unknown> },
): Promise<Subscription> {
  if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) {
    throw new Error(`activateMonths: months must be an integer in 1..${MAX_MONTHS}, got ${months}`);
  }
  const now = opts.now ?? new Date();

  return withTransaction(async (client) => {
    // Lock the row for the whole decision. Without this, two verify callbacks
    // for the same user landing together would both read the same base expiry
    // and the second would overwrite rather than extend the first — one of the
    // two months silently lost, on the one code path where money changed hands.
    const existing = await one<Subscription>(
      `select ${SUB_COLUMNS} from subscriptions where user_id = $1 for update`,
      [userId],
      client,
    );

    // A founder is already premium forever. Adding months would mean writing a
    // finite `expires_at`, i.e. turning a lifetime account into an expiring one
    // — a downgrade, performed by the act of paying. Take the money's word for
    // it elsewhere (the `payments` row is still written by the caller) and leave
    // the subscription alone.
    if (existing?.is_founder) return existing;

    // max(now, current expiry): an early renewal extends, a lapsed one restarts
    // from today. An expired row's date is in the past, so this is the same
    // expression for both.
    const base = existing?.expires_at && existing.expires_at.getTime() > now.getTime()
      ? existing.expires_at
      : now;

    const nextExpiry = (await one<{ expires_at: Date }>(
      `select ((($1::timestamptz at time zone $3) + make_interval(months => $2::int))
                 at time zone $3) as expires_at`,
      [base.toISOString(), months, config.streakTimezone],
      client,
    ))!.expires_at;

    const row = (await one<Subscription>(
      `insert into subscriptions (user_id, status, plan, started_at, expires_at, is_founder)
       values ($1, 'active', $2, $3, $4, false)
       on conflict (user_id) do update
          set status     = 'active',
              plan       = excluded.plan,
              expires_at = excluded.expires_at
        returning ${SUB_COLUMNS}`,
      [userId, PLAN_PAID, now.toISOString(), nextExpiry.toISOString()],
      client,
    ))!;
    // started_at is deliberately NOT updated on conflict: it means "subscriber
    // since", which a renewal does not reset.

    await applyTier(userId, client);
    await recordActivation(userId, {
      kind: 'months',
      months,
      source: opts.source,
      expires_at: row.expires_at,
      ...opts.meta,
    }, client);

    return row;
  });
}

/**
 * Write `profiles.tier` from the subscription that was just committed in this
 * transaction. tier is a derived cache, never an input (level 1.6): the truth is
 * `subscriptions` + `premium_grants`, and this only projects it.
 *
 * Only ever flips free -> premium here. Taking premium AWAY is the expiry
 * sweep's job alone, because it is the only caller that also knows whether a
 * league prize is still holding the account up.
 */
async function applyTier(userId: string, client: Queryable): Promise<void> {
  await client.query(
    "update profiles set tier = 'premium' where id = $1 and tier <> 'premium'",
    [userId],
  );
}

/**
 * Append the activation to `user_activity` — the repo's append-only event log.
 *
 * Written directly rather than through services/activity.ts on purpose: that
 * path runs the streak engine, and buying a subscription is not a day of
 * studying. The action name is outside every scoring allowlist (score.ts,
 * streak.ts's QUALIFYING_ACTIONS, kpis.ts), so this logs without paying XP.
 */
async function recordActivation(
  userId: string,
  meta: Record<string, unknown>,
  client: Queryable,
): Promise<void> {
  await client.query(
    "insert into user_activity (user_id, action, meta) values ($1, 'subscription_activated', $2)",
    [userId, JSON.stringify(meta)],
  );
}
