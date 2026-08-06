import type pg from 'pg';
import { config } from '../config.js';

/**
 * Score + streak-shield ("سپر استریک") math, shared by GET /progress (display)
 * and the streak engine (auto-consume on a missed day). Kept in one place so the
 * number the user sees and the number the engine spends never drift apart.
 *
 * Score = active_days * 10 + content_completed * 5 + total_highlights
 * (activity-log derived, monotonic), with everything earned while the account
 * was premium weighted by PREMIUM_SCORE_MULTIPLIER.
 *
 * `content_completed` counts each (action, content) pair ONCE FOR ALL TIME, so
 * every new episode heard or article finished pays, while replaying the same
 * file does not — otherwise leaving one episode on loop would beat working
 * through twenty. Reading and listening are counted separately for the same
 * page (a NoteCast that is both read and heard pays twice), which is exactly
 * how the league already treats xp_read vs xp_listen.
 *
 * Before this component existed, consumption only ever bought the day's first
 * +10: a second podcast on the same day moved the number by nothing, and since
 * podcast pages are excluded from the workbench they could not earn highlight
 * points either. Listeners were told «با خواندن، گوش‌دادن، هایلایت و مرور
 * امتیاز می‌گیری» and then watched the score sit still.
 *
 * Shields get PROGRESSIVELY MORE EXPENSIVE: the first costs SHIELD_BASE, and
 * every next one costs SHIELD_STEP more than the one before (200, 250, 300 …).
 * There is deliberately no holding cap — the rising price is the limiter, and it
 * buys two properties a flat price + cap could not have at the same time:
 *
 *   1. Score never stops mattering. Under a flat price with a cap, every point
 *      earned while at the cap did nothing at all; here each point always moves
 *      the user toward the next (dearer) shield.
 *   2. Keeping a shield beats re-earning one. Spending drops the balance, and
 *      the replacement is the NEXT price up the ladder, never the one just paid.
 *
 * Score is never deducted — a threshold is a milestone, not a purchase — so the
 * balance stays a plain subtraction: granted so far minus spent so far.
 */

export const SHIELD_BASE = 200; // score needed for the first shield
export const SHIELD_STEP = 50;  // each further shield costs this much more

// Actions that count toward an "active day" for the score. Kept local (not the
// streak module's QUALIFYING_ACTIONS) to avoid a circular import; the two sets
// are intentionally the same today.
export const SCORING_ACTIONS = ['article_completed', 'episode_listened', 'highlight_created', 'card_reviewed_manual', 'review_finished'];

/**
 * The consumption actions that additionally pay PER PIECE OF CONTENT. A strict
 * subset of SCORING_ACTIONS: a highlight already pays per highlight, and a card
 * review is not a piece of content.
 */
export const CONSUMPTION_ACTIONS = ['article_completed', 'episode_listened'];

export const POINTS_PER_ACTIVE_DAY = 10;
export const POINTS_PER_CONTENT = 5; // half a day: visible, but the daily habit still leads

/**
 * What a premium subscriber's points are worth — the subscription perk.
 *
 * Applied PER EARNING, not to the total: `user_activity.premium` and
 * `highlights.premium` record the tier at the moment each thing happened
 * (migration 0023) and are never re-read afterwards. That is what keeps the
 * "score is never deducted" rule true across an expiry — see the migration for
 * why multiplying the live total instead would take points back from anyone
 * whose subscription ran out.
 *
 * It buys exactly one thing: streak shields arrive a fifth sooner, because
 * shields are the only place score is ever spent. It is deliberately NOT a
 * league advantage — league ranking reads `weekly_xp` on the membership row and
 * never touches this number (league.ts).
 */
export const PREMIUM_SCORE_MULTIPLIER = 1.2;

type Db = pg.Pool | pg.PoolClient;

export interface ScoreBreakdown {
  score: number;
  active_days: number; content_completed: number; total_highlights: number;
  /** The premium-earned subset of each count above (already inside the totals). */
  premium_days: number; premium_content: number; premium_highlights: number;
  /** Points this account owes purely to the multiplier. Zero on a free plan. */
  premium_bonus: number;
}

/** The three raw counts plus how much of each was earned while premium. */
export interface ScoreParts {
  active_days: number; content_completed: number; total_highlights: number;
  premium_days: number; premium_content: number; premium_highlights: number;
}

/**
 * The arithmetic, in ONE place, for the TS path and (mirrored) the SQL one.
 *
 * The premium counts are SUBSETS of the totals, never additions to them: a day
 * on which a subscriber read something appears in `active_days` once and in
 * `premium_days` once, and is paid at the premium rate exactly once. So the
 * free portion is always `total - premium`, which cannot go negative and needs
 * no clamp.
 *
 * Floored, not rounded: score is compared against integer shield thresholds and
 * against other users' scores, and flooring is the direction that never hands
 * out a shield the points have not actually reached.
 */
export function combineScore(p: ScoreParts): { score: number; premium_bonus: number } {
  const base = p.active_days * POINTS_PER_ACTIVE_DAY
    + p.content_completed * POINTS_PER_CONTENT
    + p.total_highlights;
  const premiumBase = p.premium_days * POINTS_PER_ACTIVE_DAY
    + p.premium_content * POINTS_PER_CONTENT
    + p.premium_highlights;
  const score = Math.floor(base + premiumBase * (PREMIUM_SCORE_MULTIPLIER - 1));
  return { score, premium_bonus: score - base };
}

/**
 * The whole formula as one SQL select over `profiles p`, producing (id, score).
 * The per-user number (computeScore), the rank query in /progress and the KPI
 * count all read from this, because they used to be three hand-copied copies of
 * the arithmetic — and a formula change had to find all three or the score a
 * user saw would silently disagree with the rank they were given for it.
 * Callers pass their own placeholder numbers since each query binds differently.
 */
export function scoreSelectSql(p: { tz: string; scoring: string; consumption: string }): string {
  // `count(distinct …) filter (where premium)` is the SQL mirror of combineScore's
  // subset rule. A day (or a content pair) touched even once while premium counts
  // as premium in full — it is one indivisible unit, and paying the whole of it at
  // the subscriber's rate is both simpler and the direction that favours the
  // person who paid.
  const bonus = PREMIUM_SCORE_MULTIPLIER - 1;
  return `select p.id,
                 floor(
                     coalesce(ad.n, 0) * ${POINTS_PER_ACTIVE_DAY}
                   + coalesce(cc.n, 0) * ${POINTS_PER_CONTENT}
                   + coalesce(hl.n, 0)
                   + ( coalesce(ad.pr, 0) * ${POINTS_PER_ACTIVE_DAY}
                     + coalesce(cc.pr, 0) * ${POINTS_PER_CONTENT}
                     + coalesce(hl.pr, 0) ) * ${bonus}
                 )::bigint as score
            from profiles p
            left join (
              select user_id,
                     count(distinct (created_at at time zone ${p.tz})::date) as n,
                     count(distinct (created_at at time zone ${p.tz})::date)
                       filter (where premium) as pr
                from user_activity where action = any(${p.scoring}) group by user_id
            ) ad on ad.user_id = p.id
            left join (
              select user_id,
                     count(distinct (action, content_id)) as n,
                     count(distinct (action, content_id)) filter (where premium) as pr
                from user_activity
               where action = any(${p.consumption}) and content_id is not null
               group by user_id
            ) cc on cc.user_id = p.id
            left join (
              select user_id, count(*) as n, count(*) filter (where premium) as pr
                from highlights group by user_id
            ) hl on hl.user_id = p.id`;
}

/** Compute a user's score and its parts from the activity log + highlights. */
export async function computeScore(db: Db, userId: string): Promise<ScoreBreakdown> {
  const ad = await db.query<{ n: number; p: number }>(
    `select count(distinct (created_at at time zone $2)::date)::int as n,
            count(distinct (created_at at time zone $2)::date)
              filter (where premium)::int as p
       from user_activity where user_id = $1 and action = any($3)`,
    [userId, config.streakTimezone, SCORING_ACTIONS],
  );
  // count(distinct (action, content_id)): the row constructor keeps reading and
  // listening to the SAME page as two engagements, and collapses replays of one.
  const cc = await db.query<{ n: number; p: number }>(
    `select count(distinct (action, content_id))::int as n,
            count(distinct (action, content_id)) filter (where premium)::int as p
       from user_activity
      where user_id = $1 and action = any($2) and content_id is not null`,
    [userId, CONSUMPTION_ACTIONS],
  );
  const hl = await db.query<{ n: number; p: number }>(
    `select count(*)::int as n, count(*) filter (where premium)::int as p
       from highlights where user_id = $1`,
    [userId],
  );
  const parts: ScoreParts = {
    active_days: ad.rows[0]?.n ?? 0,
    content_completed: cc.rows[0]?.n ?? 0,
    total_highlights: hl.rows[0]?.n ?? 0,
    premium_days: ad.rows[0]?.p ?? 0,
    premium_content: cc.rows[0]?.p ?? 0,
    premium_highlights: hl.rows[0]?.p ?? 0,
  };
  return { ...parts, ...combineScore(parts) };
}

/** How many shields the user has already spent (append-only log is the source). */
export async function freezesUsedCount(db: Db, userId: string): Promise<number> {
  const r = await db.query<{ n: number }>(
    `select count(*)::int as n from user_activity
       where user_id = $1 and action = 'streak_freeze_used'`,
    [userId],
  );
  return r.rows[0]?.n ?? 0;
}

/** What the n-th shield (1-based) costs on its own: 200, 250, 300 … */
export function shieldCost(n: number): number {
  return n < 1 ? 0 : SHIELD_BASE + SHIELD_STEP * (n - 1);
}

/** Total score needed to have been granted n shields (the sum of their costs). */
export function shieldThreshold(n: number): number {
  return n < 1 ? 0 : n * SHIELD_BASE + (SHIELD_STEP * n * (n - 1)) / 2;
}

/** How many shields a score has unlocked over all time. */
export function shieldsGranted(score: number): number {
  let n = 0;
  while (shieldThreshold(n + 1) <= score) n += 1; // ~sqrt(score) steps, tiny
  return n;
}

/** Shields currently available to hold/spend: granted minus spent. */
export function freezesAvailable(score: number, used: number): number {
  return Math.max(0, shieldsGranted(score) - used);
}

/** Points still needed to unlock the next shield (there is always a next one). */
export function pointsToNextFreeze(score: number): number {
  return shieldThreshold(shieldsGranted(score) + 1) - score;
}
