import { config } from '../config.js';
import { pool, one, query, withTransaction, type Queryable } from '../db.js';

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
 *
 * A lifetime account is the same row with `expires_at = NULL` and `is_founder`
 * set — not a distant date — so it is invisible to the expiry sweep by
 * construction rather than by remembering to exclude it.
 *
 * ---------------------------------------------------------------------------
 * THE `profiles.tier` CONTRACT
 * ---------------------------------------------------------------------------
 * `profiles.tier` is a DERIVED CACHE, never an input. It exists because every
 * premium gate in the site and the API reads it (middleware/require-premium.ts,
 * GET /me, the dashboard, the Spot ad system), and asking two tables on every
 * request to answer "is this person premium" would be absurd. But it is only
 * ever a projection of two authorities:
 *
 *   subscriptions   - bought, gifted, or founder. This file owns it.
 *   premium_grants  - the weekly league prize. services/premium-prize.ts owns it.
 *
 * Exactly THREE places may write it, and each writes only in one direction:
 *
 *   1. activateMonths()/grantLifetime() here, via applyTier() - free -> premium,
 *      the instant a subscription starts. Never the other way.
 *   2. grantWeeklyPrizes() in premium-prize.ts               - free -> premium,
 *      when a league week finalizes. Never the other way.
 *   3. sweepExpiredSubscriptions() here, and its narrower sibling
 *      expirePremiumPrizes()                                 - BOTH directions.
 *      Only a sweep may take premium away, because only a sweep looks at every
 *      authority at once and can therefore know that nothing else is still
 *      holding the account up.
 *
 * The rule that keeps this honest: NOTHING sets tier as a way of granting
 * access. Access is granted by writing a date; tier follows. A fourth writer
 * that skips the date is not a shortcut, it is an account that the sweep will
 * eventually and correctly revoke — which is exactly what POST
 * /admin/users/set-tier used to manufacture, and why migration 0019 had to exist
 * and that route is now a 410.
 *
 * Drift is not merely forbidden, it is repaired: the sweep's third phase
 * promotes any account whose valid subscription the cache has fallen behind, so
 * a cache that goes wrong for a reason nobody anticipated heals on its own
 * within a day.
 */

/**
 * Where an activation came from. Recorded for audit; never branched on.
 * 'backfill' is written only by migration 0019, for accounts that were premium
 * before subscriptions existed.
 */
export type ActivationSource = 'payment' | 'admin' | 'backfill';

/** `plan` for a bought/gifted subscription with a finite end date. */
export const PLAN_PAID = 'paid';

/** `plan` for a lifetime account — founders, and anyone gifted one. */
export const PLAN_FOUNDER = 'founder';

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
 * Grant a lifetime subscription: premium with no end date, ever.
 *
 * Lifetime is expressed as `expires_at = NULL` rather than a date far in the
 * future, and the difference is not stylistic. The expiry sweep selects rows by
 * `expires_at <= now`, so a NULL is invisible to it by construction — there is
 * no year in which a founder can be swept, no "2099" fixture quietly counting
 * down, and nothing to remember to extend. Migration 0018's CHECK ties the two
 * halves together in both directions, so a founder row can never carry a date
 * and a dated row can never claim to be a founder.
 *
 * Idempotent: granting twice leaves one row and changes nothing the second time.
 * Upgrading a paying subscriber DISCARDS their remaining paid days on purpose —
 * lifetime strictly contains them, and keeping the old date around as a
 * "fallback" is exactly how a founder ends up reverted by a sweep years later.
 */
export async function grantLifetime(
  userId: string,
  opts: { source: ActivationSource; now?: Date; meta?: Record<string, unknown> },
): Promise<Subscription> {
  const now = opts.now ?? new Date();

  return withTransaction(async (client) => {
    const existing = await one<Subscription>(
      `select ${SUB_COLUMNS} from subscriptions where user_id = $1 for update`,
      [userId],
      client,
    );
    if (existing?.is_founder) return existing;

    const row = (await one<Subscription>(
      `insert into subscriptions (user_id, status, plan, started_at, expires_at, is_founder)
       values ($1, 'active', $2, $3, null, true)
       on conflict (user_id) do update
          set status     = 'active',
              plan       = excluded.plan,
              expires_at = null,
              is_founder = true
        returning ${SUB_COLUMNS}`,
      [userId, PLAN_FOUNDER, now.toISOString()],
      client,
    ))!;

    await applyTier(userId, client);
    await recordActivation(userId, {
      kind: 'lifetime',
      source: opts.source,
      // What was given up, if anything — the only record that this account once
      // had paid days on it, since the row itself no longer carries a date.
      replaced_expires_at: existing?.expires_at ?? null,
      ...opts.meta,
    }, client);

    return row;
  });
}

/**
 * Revoke a subscription outright — the undo for a mistaken gift, and (level 4)
 * for a card-to-card payment that turns out not to have arrived.
 *
 * Deletes the row rather than marking it expired. An expired row and no row at
 * all are the same thing to every reader, but only the delete makes a
 * re-grant's `started_at` honest, and it keeps a revoked founder from lingering
 * as an active-looking row. The audit event in `user_activity` is what survives.
 *
 * Does NOT touch `profiles.tier`: a league prize may still be holding this
 * account up, and the expiry sweep is the only code that knows. Returns whether
 * a row was actually removed.
 */
export async function revokeSubscription(
  userId: string,
  opts: { source: ActivationSource; meta?: Record<string, unknown> },
): Promise<boolean> {
  return withTransaction(async (client) => {
    const gone = await one<Subscription>(
      `delete from subscriptions where user_id = $1 returning ${SUB_COLUMNS}`,
      [userId],
      client,
    );
    if (!gone) return false;
    await recordActivation(userId, {
      kind: 'revoked',
      source: opts.source,
      was_founder: gone.is_founder,
      replaced_expires_at: gone.expires_at,
      ...opts.meta,
    }, client);
    return true;
  });
}

export interface SweepResult {
  /** Active subscriptions whose date passed, marked 'expired'. */
  expired: number;
  /** Accounts that lost premium because nothing valid was holding them up. */
  demoted: number;
  /** Accounts whose tier had fallen out of step with a valid subscription. */
  promoted: number;
}

/**
 * The daily reconciliation between what people have paid for and what
 * `profiles.tier` says. Everything premium in this system is expressed as a
 * date; this is the one job that turns those dates back into access.
 *
 * WHY A DAY BOUNDARY IS THE RIGHT GRANULARITY. `activateMonths` sets the expiry
 * to the same time of day the subscription was bought, so subscriptions fall due
 * at every hour of the clock. Running once a day at 00:00 Tehran therefore means
 * an account that ran out at 14:00 keeps premium until that night — up to a day
 * of grace, always in the user's favour, never against. That is a deliberate
 * trade and it buys something real: one honest sentence for the whole product,
 * "اشتراکت تا پایان روز X فعال است", instead of an expiry that lands mid-session
 * and takes the workbench away between one click and the next. Precision here
 * would be a worse product, not a better one.
 *
 * THREE PHASES, and the second is not implied by the first. Marking due rows
 * 'expired' is not enough, because an account can also lose its footing by
 * having its row deleted outright (revokeSubscription) — so the demotion phase
 * scans PROFILES, asking of each premium account "is anything still holding this
 * up?", rather than walking the rows that happened to expire tonight. Any
 * account that drifts out of step for any reason, including one nobody has
 * thought of yet, is picked up on the next run.
 *
 * The third phase is the same question inverted: a free account WITH a valid
 * subscription is repaired rather than left broken. Together the two make
 * `profiles.tier` genuinely derived — a cache that heals — instead of a value
 * that merely happens to be right most of the time.
 *
 * INTERACTION WITH THE LEAGUE PRIZE. `premium_grants` is a second, independent
 * source of premium, so the demotion phase requires BOTH to be absent before it
 * takes anything away. It reads a grant as live only while `expires_at` is still
 * in the future, which makes this sweep slightly more eager than
 * expirePremiumPrizes() — a grant that fell due tonight but has not been marked
 * revoked yet is already dead here. The two agree on the outcome; this one just
 * does not need the bookkeeping to have caught up first, and the ordering of the
 * two jobs is therefore not something anyone has to get right.
 */
export async function sweepExpiredSubscriptions(now: Date = new Date()): Promise<SweepResult> {
  const nowIso = now.toISOString();

  // Phase 1 — settle the rows themselves. Founder rows carry a NULL date and
  // are excluded by the comparison, not by a special case.
  const expired = await query(
    `update subscriptions set status = 'expired'
      where status = 'active' and expires_at is not null and expires_at <= $1`,
    [nowIso],
  );

  // Phase 2 — take premium away from anyone nothing is holding up any more.
  const demoted = await query(
    `update profiles p set tier = 'free'
      where p.tier = 'premium'
        and not exists (
          select 1 from subscriptions s
           where s.user_id = p.id and s.status = 'active'
             and (s.expires_at is null or s.expires_at > $1)
        )
        and not exists (
          select 1 from premium_grants g
           where g.user_id = p.id and g.revoked_at is null and g.expires_at > $1
        )`,
    [nowIso],
  );

  // Phase 3 — and give it back to anyone a valid subscription covers. Repairs
  // drift in the harmless direction rather than waiting for a support message.
  const promoted = await query(
    `update profiles p set tier = 'premium'
      where p.tier <> 'premium'
        and exists (
          select 1 from subscriptions s
           where s.user_id = p.id and s.status = 'active'
             and (s.expires_at is null or s.expires_at > $1)
        )`,
    [nowIso],
  );

  return {
    expired: expired.rowCount ?? 0,
    demoted: demoted.rowCount ?? 0,
    promoted: promoted.rowCount ?? 0,
  };
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
