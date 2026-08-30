/**
 * Retroactive compensation for league weeks the old rule got wrong for a paid
 * subscriber, in TWO distinct shapes — a winner can be missing a grant row
 * entirely, or can be holding one that never actually added any time. They
 * need different queries because the second shape has no visible "someone
 * else got it instead" signal to detect it by: the row that should have
 * stacked days IS the winner's own row, just written with no effect.
 *
 * Shape 1 — findSkippedPaidWinners(): rank 1 held a paid subscription and the
 * old rule skipped them outright, passing the prize to rank 2+.
 * Safe shape:
 *   - Only when pass-down is visible (someone else in the same league has a
 *     grant for that week, and rank 1 does not).
 *   - Rank 1 was NOT on cooldown that week (cooldown pass-down stays as-is).
 *   - Rank 1 has a non-founder `subscriptions` row (paid path). Founders and
 *     orphan `tier=premium` accounts are left alone.
 *   - Rank 2's existing grant is NEVER revoked — they keep what they got; this
 *     only adds the days rank 1 was owed.
 *
 * Shape 2 — findGrantedButNotStackedWinners(): the old rule did NOT skip the
 * winner (their `premium_grants` row exists — this happens when they had won
 * the league before, while still free, so the "already premium, but is that
 * premium ours to extend?" check let a fresh grant through) but they already
 * held a paid subscription at the time, so the grant was a no-op: the banner
 * said "you won", `profiles.tier` was already 'premium' from the subscription,
 * and no day was ever added. `extends_subscription = false` alone can't tell
 * these apart from a legitimate free-tier flip — most historical rows are
 * exactly that, correctly false — so the discriminator is reconstructed from
 * `user_activity`'s append-only `subscription_activated` log: a real
 * (non-league) activation recorded before the grant whose own remembered
 * `expires_at` still covered the grant instant means this user was a paying
 * subscriber the moment they won.
 *   - The row is UPDATED in place (extends_subscription flips to true) rather
 *     than inserted — a grant already exists for (user_id, week_start) — which
 *     doubles as the idempotency key: a fixed row no longer matches
 *     `extends_subscription = false` on a second run.
 *   - Days owed are read off the row itself (`expires_at - granted_at`), not
 *     recomputed from today's `prize_days` — config can retune after the win,
 *     and compensation must match what the winner was actually promised.
 *   - Founders are excluded (nothing to add); a user with no current
 *     subscription row still qualifies — activateDays() starts a fresh one.
 *
 * Both shapes share the same guarantees:
 *   - Silent: grant is marked seen + notified so no weeks-old push fires.
 *   - Idempotent, safe to run repeatedly.
 *
 *   npm run backfill-league-prize-stack -- --dry-run
 *   npm run backfill-league-prize-stack
 */
import { pool, withTransaction } from '../db.js';
import { getLeagueConfig } from '../services/league-config.js';
import { activateDays } from '../services/subscription.js';
import { dayInTz, addDays, startOfDayInstant } from '../services/time.js';
import { config } from '../config.js';

export interface BackfillCandidate {
  user_id: string;
  week_start: string;
  league_id: string;
  tier_order: number;
  days: number;
}

/** Shape 2 candidate: an existing grant row to fix in place, not insert. */
export interface StackFixCandidate {
  user_id: string;
  week_start: string;
  days: number;
}

export interface BackfillResult {
  candidates: number;
  stacked: number;
  skipped: number;
  dryRun: boolean;
  sample: BackfillCandidate[];
  /** Shape 2: grants fixed in place. Reported separately — different query,
   *  different write (UPDATE vs INSERT), same underlying compensation. */
  fixCandidates: number;
  fixed: number;
  fixSample: StackFixCandidate[];
}

function prizeDaysFor(
  tierOrder: number,
  cfg: { prize_days: number; top_tier_prize_days: number; max_active_tier_order: number },
): number {
  return tierOrder >= cfg.max_active_tier_order && cfg.top_tier_prize_days > 0
    ? cfg.top_tier_prize_days
    : cfg.prize_days;
}

/** Find rank-1 paid winners who were skipped in favour of a lower-ranked member. */
export async function findSkippedPaidWinners(): Promise<BackfillCandidate[]> {
  const cfg = await getLeagueConfig();
  const rows = await pool.query<{
    user_id: string; week_start: string; league_id: string; tier_order: number;
  }>(
    `with ranked as (
       select lm.league_id, lm.user_id, lm.week_start, t.tier_order,
              row_number() over (
                partition by lm.league_id
                order by lm.weekly_xp desc,
                         lm.first_reached_current_xp_at asc nulls last,
                         lm.id asc
              ) as rnk
         from league_members lm
         join leagues l on l.id = lm.league_id
         join league_tiers t on t.id = l.tier_id
        where l.status = 'finalized'
     ),
     rank1 as (
       select * from ranked where rnk = 1
     )
     select r1.user_id, r1.week_start::text as week_start, r1.league_id, r1.tier_order
       from rank1 r1
       join subscriptions s on s.user_id = r1.user_id
      where s.is_founder = false
        and not exists (
          select 1 from premium_grants g
           where g.user_id = r1.user_id and g.week_start = r1.week_start
        )
        and exists (
          select 1 from premium_grants g
          join league_members lm
            on lm.user_id = g.user_id and lm.week_start = g.week_start
           where lm.league_id = r1.league_id
             and g.week_start = r1.week_start
             and g.user_id <> r1.user_id
        )
        and not exists (
          -- Was on cooldown that week → legitimate pass-down, not a paid skip.
          select 1 from premium_grants g
           where g.user_id = r1.user_id
             and g.week_start > (r1.week_start - ($1::int * 7))
             and g.week_start < r1.week_start
        )
      order by r1.week_start, r1.league_id`,
    [cfg.prize_cooldown_weeks],
  );

  return rows.rows.map((r) => ({
    ...r,
    days: prizeDaysFor(r.tier_order, cfg),
  }));
}

/**
 * Find winners whose `premium_grants` row exists (they were NOT skipped) but
 * whose prize never added a day, because they already held an active paid
 * subscription the moment they won — the old rule only special-cased
 * `profiles.tier`, never `subscriptions`. See the shape-2 doc atop this file.
 */
export async function findGrantedButNotStackedWinners(): Promise<StackFixCandidate[]> {
  const rows = await pool.query<{ user_id: string; week_start: string; days: number }>(
    `select g.user_id, g.week_start::text as week_start,
            round(extract(epoch from (g.expires_at - g.granted_at)) / 86400)::int as days
       from premium_grants g
       left join subscriptions cur on cur.user_id = g.user_id
      where g.extends_subscription = false
        and coalesce(cur.is_founder, false) = false
        and exists (
          select 1 from user_activity ua
           where ua.user_id = g.user_id
             and ua.action = 'subscription_activated'
             and ua.meta ->> 'source' <> 'league_prize'
             and ua.created_at <= g.granted_at
             and (ua.meta ->> 'expires_at')::timestamptz > g.granted_at
        )
      order by g.week_start, g.user_id`,
  );
  return rows.rows;
}

export async function runBackfillLeaguePrizeStack(
  opts: { dryRun?: boolean; now?: Date } = {},
): Promise<BackfillResult> {
  const now = opts.now ?? new Date();
  const dryRun = !!opts.dryRun;
  const candidates = await findSkippedPaidWinners();
  const fixCandidates = await findGrantedButNotStackedWinners();
  const result: BackfillResult = {
    candidates: candidates.length,
    stacked: 0,
    skipped: 0,
    dryRun,
    sample: candidates.slice(0, 20),
    fixCandidates: fixCandidates.length,
    fixed: 0,
    fixSample: fixCandidates.slice(0, 20),
  };
  if (dryRun) return result;

  const grantDay = dayInTz(now, config.streakTimezone);
  const grantedAt = startOfDayInstant(grantDay).toISOString();

  for (const c of candidates) {
    const expiresAt = startOfDayInstant(addDays(grantDay, c.days)).toISOString();
    let wrote = false;
    await withTransaction(async (client) => {
      const ins = await client.query(
        `insert into premium_grants
           (user_id, week_start, granted_at, expires_at, extends_subscription, seen, notified_at)
         values ($1, $2, $3, $4, true, true, $5)
         on conflict (user_id, week_start) do nothing
         returning id`,
        [c.user_id, c.week_start, grantedAt, expiresAt, now.toISOString()],
      );
      if (!ins.rowCount) return;
      await activateDays(c.user_id, c.days, {
        source: 'league_prize',
        now,
        client,
        meta: { week_start: c.week_start, backfill: true },
      });
      wrote = true;
    });
    if (wrote) result.stacked += 1;
    else result.skipped += 1;
  }

  for (const c of fixCandidates) {
    let wrote = false;
    await withTransaction(async (client) => {
      const upd = await client.query(
        `update premium_grants
            set extends_subscription = true, seen = true, notified_at = coalesce(notified_at, $3)
          where user_id = $1 and week_start = $2 and extends_subscription = false
          returning id`,
        [c.user_id, c.week_start, now.toISOString()],
      );
      if (!upd.rowCount) return;
      await activateDays(c.user_id, c.days, {
        source: 'league_prize',
        now,
        client,
        meta: { week_start: c.week_start, backfill: true, backfill_shape: 'granted_not_stacked' },
      });
      wrote = true;
    });
    if (wrote) result.fixed += 1;
  }
  return result;
}

const isDirect = process.argv[1] && process.argv[1].includes('backfill-league-prize-stack');
if (isDirect) {
  const dryRun = process.argv.includes('--dry-run');
  runBackfillLeaguePrizeStack({ dryRun })
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      if (dryRun) {
        console.log(
          `[dry-run] ${r.candidates} skipped-winner candidate(s), `
          + `${r.fixCandidates} granted-but-not-stacked candidate(s). Nothing written.`,
        );
      } else {
        console.log(`Stacked ${r.stacked} of ${r.candidates}; skipped ${r.skipped}.`);
        console.log(`Fixed ${r.fixed} of ${r.fixCandidates} granted-but-not-stacked grant(s).`);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
