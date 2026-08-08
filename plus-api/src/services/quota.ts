import type { FastifyReply, FastifyRequest } from 'fastify';
import { pool, type Queryable } from '../db.js';
import { config } from '../config.js';
import { dayInTz, nextDay, startOfDayInstant, jalaliMonthRange } from './time.js';
import {
  getQuotaRule, getPreviews, getQuotaCopy, QUOTA_KEYS,
  type QuotaKey, type QuotaPeriod,
} from '../quota.js';

/**
 * The quota engine — the ONE place a free reader's remaining allowance is
 * computed, and the one place a request is refused for running out of it.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * Every premium feature used to be a binary door: `requirePremium` on the whole
 * route group, and a full-page «ویژه‌ی پریمیوم» wall in front of the UI. That
 * reaches a reader only at the moment they can do nothing, tells them nothing
 * about what they are missing, and asks for money from someone who has never
 * seen the thing work. The taste layer replaces every one of those doors with a
 * real, working, bounded use of the feature.
 *
 * ---------------------------------------------------------------------------
 * NOTHING IS WRITTEN DOWN
 * ---------------------------------------------------------------------------
 * There is no counter table, no `quota_used` column and no migration behind any
 * of this. Each allowance is DERIVED, at read time, from a log the product
 * already keeps for its own reasons:
 *
 *   review_cards    <- user_activity, action = 'review_finished'
 *   assistant_runs  <- assistant_rounds, distinct desc_hash
 *   collections     <- collections, one row per board
 *
 * This is the same doctrine as the achievements wall (see badges.json), and it
 * buys the same things: a number that cannot drift from the log it came from,
 * nothing to backfill on the day it ships, and a limit that can be retuned
 * tomorrow without reconciling against counters written under today's.
 *
 * It also removes an entire class of bug. A stored counter has to be decremented
 * on exactly the paths that consume and never on the paths that fail — and the
 * day one of those paths throws after the decrement, a reader has silently paid
 * for something they did not get.
 *
 * ---------------------------------------------------------------------------
 * WHY THE SERVER, NOT THE CLIENT
 * ---------------------------------------------------------------------------
 * Every limit in this file is enforced where the data is produced, never where
 * it is drawn. A hidden button is not a quota: `curl` does not run the UI. So
 * the rule is that a route either refuses (a consumable quota, 402
 * `quota_exhausted`) or truncates its own payload before it leaves the process
 * (a preview). What the client renders is a courtesy — the CTA copy, the
 * remaining count — and never the boundary itself.
 *
 * The one deliberate exception is the paper cabinet, which is a fully static
 * page with a public catalogue and no server in its path at all; its allowance
 * is a device-local counter and is documented as such at its call site.
 */

// --- in-flight assistant runs -----------------------------------------------
//
// The assistant is the one allowance whose consuming write happens AFTER a slow
// external call (the model), and deliberately so: a generation that fails must
// not cost the reader a case. That gap is a race the advisory lock cannot close,
// because holding a database transaction open across a multi-second model call
// to protect a counter would trade a small hole for a much worse one.
//
// So a run that has been admitted but not yet filed is remembered here, in
// process, and counted as used. Combined with `withUserLock` below — which makes
// the read/decide/reserve strictly serial per user — the check is exact: twenty
// simultaneous requests with twenty different descriptions are admitted one at a
// time, and the third one sees the first two.
//
// Kept out of the DB for the same reason services/rate-limit.ts is: the schema
// is fixed to spec section 4, and this is ephemeral. Same caveat too — for a
// multi-instance deploy both move behind Redis. The durable count is still the
// DB's; this only covers the seconds a run is airborne, so a restart mid-flight
// loses a reservation rather than a record.

const inFlightRuns = new Map<string, Set<string>>();

function reserveRun(userId: string, descHash: string): void {
  const set = inFlightRuns.get(userId) ?? new Set<string>();
  set.add(descHash);
  inFlightRuns.set(userId, set);
}

function releaseRun(userId: string, descHash: string): void {
  const set = inFlightRuns.get(userId);
  if (!set) return;
  set.delete(descHash);
  if (set.size === 0) inFlightRuns.delete(userId);
}

function inFlightCount(userId: string): number {
  return inFlightRuns.get(userId)?.size ?? 0;
}

/** Test/maintenance helper: forget every airborne run. */
export function resetInFlightRuns(): void {
  inFlightRuns.clear();
}

/**
 * Run `fn` with nothing else holding `key`, in this process.
 *
 * A promise chain, not a semaphore: each caller awaits the previous one and
 * leaves its own tail behind for the next. `finally` rather than `then` so a
 * thrown body still hands the lock on — a rejected link that broke the chain
 * would wedge every later request for that user until restart.
 */
const userLocks = new Map<string, Promise<unknown>>();

export function withUserLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = userLocks.get(key) ?? Promise.resolve();
  const run = previous.catch(() => { /* a failed predecessor must not block us */ }).then(fn);
  // The tail is stored already-handled, so a rejection here is never an
  // unhandled one; the real rejection still reaches the caller through `run`.
  const tail = run.then(() => { /* settled */ }, () => { /* settled */ });
  userLocks.set(key, tail);
  void tail.finally(() => { if (userLocks.get(key) === tail) userLocks.delete(key); });
  return run;
}

/**
 * Admit one assistant call, consuming an allowance only if it starts a NEW case.
 *
 * Returns a `release` the caller must invoke when the request is done — in a
 * `finally`, so a failed generation gives the case back. A continuation
 * (`charged: false`) releases nothing because it reserved nothing.
 */
export async function admitAssistantRun(
  userId: string,
  descHash: string,
  isPremium: boolean,
  now: Date = new Date(),
): Promise<{ allowed: true; charged: boolean; release: () => void } | { allowed: false; state: QuotaState }> {
  if (isPremium) return { allowed: true, charged: false, release: () => {} };

  return withUserLock(`assistant:${userId}`, async () => {
    const { from } = windowFor('month', now);
    // Already filed under this hash in this period, or airborne right now:
    // either way it is the same case and costs nothing further.
    const existing = await pool.query<{ n: number }>(
      `select count(*)::int as n from assistant_rounds
        where user_id = $1 and desc_hash = $2 and created_at >= $3`,
      [userId, descHash, from!.toISOString()],
    );
    const seen = (existing.rows[0]?.n ?? 0) > 0 || (inFlightRuns.get(userId)?.has(descHash) ?? false);
    if (seen) return { allowed: true as const, charged: false, release: () => {} };

    const state = await quotaState(userId, 'assistant_runs', false, now);
    if (!state.allowed) return { allowed: false as const, state };

    reserveRun(userId, descHash);
    let released = false;
    return {
      allowed: true as const,
      charged: true,
      release: () => { if (!released) { released = true; releaseRun(userId, descHash); } },
    };
  });
}

/**
 * The 402 for a PREVIEW boundary rather than a spent allowance — the second
 * pathway, not the fourth card.
 *
 * Kept as `premium_required` on purpose. Nothing here refills: a free reader has
 * the first pathway open forever and the rest are simply premium, so telling
 * them to come back tomorrow would be false. The message still comes from
 * quota.json, so the two kinds of wall are worded in one place even though they
 * mean different things.
 */
export function previewLockedBody(message: string): { error: string; message: string } {
  return { error: 'premium_required', message };
}

/** A 402 carries this so the client can say WHICH wall and when it lifts. */
export interface QuotaState {
  key: QuotaKey;
  /** null means unlimited — the caller is premium. */
  limit: number | null;
  used: number;
  /** null alongside a null limit. Never negative. */
  remaining: number | null;
  allowed: boolean;
  period: QuotaPeriod;
  /** ISO instant the allowance refills, or null for a lifetime cap / premium. */
  resets_at: string | null;
  label_fa: string;
  /** Ready-to-render copy for the moment it runs out. */
  exhausted_fa: string;
  /** Ready-to-render copy for the moment before, with {n} already substituted. */
  remaining_fa: string;
}

/**
 * The window a period counts over, as a half-open instant range.
 * `total` has no lower bound: it counts what the reader currently owns.
 */
function windowFor(period: QuotaPeriod, now: Date): { from: Date | null; resetsAt: string | null } {
  const tz = config.streakTimezone;
  if (period === 'day') {
    const today = dayInTz(now, tz);
    return {
      from: startOfDayInstant(today, tz),
      resetsAt: startOfDayInstant(nextDay(today), tz).toISOString(),
    };
  }
  if (period === 'month') {
    const { start, nextStart } = jalaliMonthRange(now, tz);
    return {
      from: startOfDayInstant(start, tz),
      resetsAt: startOfDayInstant(nextStart, tz).toISOString(),
    };
  }
  return { from: null, resetsAt: null };
}

/**
 * How much of `key` this user has already used inside `from..now`.
 *
 * `review_cards` counts only rows stamped `premium = false`. The stamp is
 * written at insert time by services/activity.ts and records what the account
 * was THEN, which is exactly the question here: cards answered this morning on a
 * subscription that lapsed at noon were not spent out of the free allowance, and
 * counting them would greet a newly-lapsed reader with a wall on their first
 * free afternoon.
 *
 * `assistant_runs` counts DISTINCT `desc_hash`, which is what makes the limit
 * unforgeable. The assistant is stateless — the client resends the whole history
 * on every call — so anything keyed off the round number could be skipped by
 * sending a fabricated history. The hash is computed on the server from the
 * description the user actually sent, so a new case is always a new run and
 * continuing an existing one is always free, no matter what the client claims.
 */
async function usedFor(
  userId: string,
  key: QuotaKey,
  from: Date | null,
  client: Queryable = pool,
): Promise<number> {
  if (key === 'review_cards') {
    const res = await client.query<{ n: number }>(
      `select count(*)::int as n from user_activity
        where user_id = $1 and action = 'review_finished'
          and premium = false and created_at >= $2`,
      [userId, from!.toISOString()],
    );
    return res.rows[0]?.n ?? 0;
  }

  if (key === 'assistant_runs') {
    const res = await client.query<{ n: number }>(
      `select count(distinct desc_hash)::int as n from assistant_rounds
        where user_id = $1 and created_at >= $2`,
      [userId, from!.toISOString()],
    );
    // Plus anything admitted but not yet filed. Without this the number a
    // reader is shown mid-request disagrees with the number they are judged
    // against, and two simultaneous new cases both read the pre-flight count.
    return (res.rows[0]?.n ?? 0) + inFlightCount(userId);
  }

  const res = await client.query<{ n: number }>(
    'select count(*)::int as n from collections where user_id = $1',
    [userId],
  );
  return res.rows[0]?.n ?? 0;
}

/** Where this account stands on one allowance. Premium short-circuits to unlimited. */
export async function quotaState(
  userId: string,
  key: QuotaKey,
  isPremium: boolean,
  now: Date = new Date(),
  client: Queryable = pool,
): Promise<QuotaState> {
  const rule = getQuotaRule(key);
  const { period } = rule;

  if (isPremium) {
    return {
      key,
      limit: null,
      used: 0,
      remaining: null,
      allowed: true,
      period,
      resets_at: null,
      label_fa: rule.label_fa,
      exhausted_fa: rule.exhausted_fa,
      remaining_fa: '',
    };
  }

  const { from, resetsAt } = windowFor(period, now);
  const used = await usedFor(userId, key, from, client);
  const remaining = Math.max(0, rule.limit - used);

  return {
    key,
    limit: rule.limit,
    used,
    remaining,
    allowed: remaining > 0,
    period,
    resets_at: resetsAt,
    label_fa: rule.label_fa,
    exhausted_fa: rule.exhausted_fa,
    remaining_fa: (rule.remaining_fa || '').replace('{n}', String(remaining)),
  };
}

/** Every allowance at once — for GET /me, so no surface needs a second request. */
export async function allQuotaStates(
  userId: string,
  isPremium: boolean,
  now: Date = new Date(),
): Promise<Record<string, QuotaState>> {
  const out: Record<string, QuotaState> = {};
  // Sequential on purpose: three small indexed counts on one connection beats
  // three checkouts from the pool on the site's hottest authenticated route.
  for (const key of QUOTA_KEYS) {
    out[key] = await quotaState(userId, key, isPremium, now);
  }
  return out;
}

/** True when `request.user` is premium. The tier cache is the sanctioned answer. */
export function isPremiumRequest(request: FastifyRequest): boolean {
  return request.user?.tier === 'premium';
}

/**
 * Gate one consuming action. Returns the state when the call may proceed, or
 * null after it has already replied 402.
 *
 * The 402 is deliberately NOT the `premium_required` one. A reader who has spent
 * today's three cards and a reader who never had access are in completely
 * different situations, and telling the first one «این بخش نیازمند اشتراک
 * پریمیوم است» is a lie — they used the feature, on this plan, minutes ago. The
 * distinct code lets the client say what actually happened and when it lifts.
 */
export async function requireQuota(
  request: FastifyRequest,
  reply: FastifyReply,
  key: QuotaKey,
): Promise<QuotaState | null> {
  const state = await quotaState(request.user!.id, key, isPremiumRequest(request));
  if (state.allowed) return state;
  reply.code(402).send(quotaExhaustedBody(state));
  return null;
}

/**
 * The transactional half of `requireQuota`: take the user's lock for this
 * allowance, then measure. Call INSIDE the same transaction that writes the row
 * which will be counted, and only proceed when `allowed`.
 *
 * WHY A LOCK. Checking and then consuming in two steps is a time-of-check /
 * time-of-use race, and on a quota it is a real bypass rather than a theoretical
 * one: fifty concurrent `POST /review/answer` calls all read "used = 2, limit =
 * 3" before any of them has inserted, and all fifty pass. That is exactly the
 * kind of hole a script finds and a person never does, which is the kind worth
 * closing properly.
 *
 * A Postgres ADVISORY lock rather than a row lock, because there is no row: the
 * whole design counts a log instead of decrementing a counter, so there is
 * nothing to `select ... for update`. The lock is keyed on (quota key, user), so
 * two different allowances never queue behind each other and two different
 * users never contend at all. `_xact_` means it is released when the
 * transaction ends, including on a rollback or a crashed connection — there is
 * no unlock to forget and no way to leak one.
 *
 * Premium short-circuits before taking any lock.
 */
export async function consumeQuota(
  client: Queryable,
  userId: string,
  key: QuotaKey,
  isPremium: boolean,
  now: Date = new Date(),
): Promise<QuotaState> {
  if (isPremium) return quotaState(userId, key, true, now, client);
  await client.query('select pg_advisory_xact_lock(hashtext($1), hashtext($2))', [key, userId]);
  return quotaState(userId, key, false, now, client);
}

/** The 402 body for an exhausted allowance — one shape, whoever sends it. */
export function quotaExhaustedBody(state: QuotaState): {
  error: string; message: string; quota: QuotaState;
} {
  return { error: 'quota_exhausted', message: state.exhausted_fa, quota: state };
}

// --- previews: truncation, never refusal ------------------------------------
//
// Nothing below can return an error. A free reader always gets an answer here;
// it is simply a smaller one, and the route says so in the payload rather than
// leaving the client to notice.

/** How many library rows a free reader gets. `null` = the whole thing. */
export function highlightLibraryRows(isPremium: boolean): number | null {
  return isPremium ? null : getPreviews().highlight_library_rows;
}

/**
 * Whether `pathwayIndex` (its position in catalog order) is open to a free
 * reader. Position, not a stored flag: the free pathway must be the SAME one for
 * everybody — it is the intro, the thing people tell each other about — and a
 * per-user "you may pick one" would need a counter, an enrollment to spend it
 * on, and a way to change your mind.
 */
export function pathwayIsFree(pathwayIndex: number, isPremium: boolean): boolean {
  return isPremium || pathwayIndex < getPreviews().pathways_free_count;
}

/** Whether the compass hands over the blind-spot map or only the headline numbers. */
export function compassBlindSpots(isPremium: boolean): boolean {
  return isPremium || getPreviews().compass_blind_spots;
}

/** Cabinet searches per device per day — read by the page, not enforced here. */
export function librarySearchesPerDay(): number {
  return getPreviews().library_searches_per_day;
}

export { getQuotaCopy };
