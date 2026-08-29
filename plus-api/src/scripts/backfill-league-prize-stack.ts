/**
 * Retroactive compensation for league weeks where rank 1 held a paid
 * subscription and the old rule skipped them, passing the prize to rank 2+.
 *
 * Safe shape:
 *   - Only when pass-down is visible (someone else in the same league has a
 *     grant for that week, and rank 1 does not).
 *   - Rank 1 was NOT on cooldown that week (cooldown pass-down stays as-is).
 *   - Rank 1 has a non-founder `subscriptions` row (paid path). Founders and
 *     orphan `tier=premium` accounts are left alone.
 *   - Rank 2's existing grant is NEVER revoked — they keep what they got; this
 *     only adds the days rank 1 was owed.
 *   - Silent: grant is marked seen + notified so no weeks-old push fires.
 *   - Idempotent via (user_id, week_start) unique on premium_grants.
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

export interface BackfillResult {
  candidates: number;
  stacked: number;
  skipped: number;
  dryRun: boolean;
  sample: BackfillCandidate[];
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

export async function runBackfillLeaguePrizeStack(
  opts: { dryRun?: boolean; now?: Date } = {},
): Promise<BackfillResult> {
  const now = opts.now ?? new Date();
  const dryRun = !!opts.dryRun;
  const candidates = await findSkippedPaidWinners();
  const result: BackfillResult = {
    candidates: candidates.length,
    stacked: 0,
    skipped: 0,
    dryRun,
    sample: candidates.slice(0, 20),
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
  return result;
}

const isDirect = process.argv[1] && process.argv[1].includes('backfill-league-prize-stack');
if (isDirect) {
  const dryRun = process.argv.includes('--dry-run');
  runBackfillLeaguePrizeStack({ dryRun })
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      if (dryRun) {
        console.log(`[dry-run] ${r.candidates} candidate(s). Nothing written.`);
      } else {
        console.log(`Stacked ${r.stacked} of ${r.candidates}; skipped ${r.skipped}.`);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
