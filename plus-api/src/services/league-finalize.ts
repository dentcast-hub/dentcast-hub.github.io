import type pg from 'pg';
import { pool, withTransaction } from '../db.js';
import { dayInTz, dayDiff } from './time.js';
import { getTiers } from './league.js';
import { getLeagueConfig, setLeagueConfig, type LeagueConfig } from './league-config.js';

/**
 * Weekly finalization + self-tuning. Runs once per closed week, transactional and
 * IDEMPOTENT: it only touches groups whose status is not yet 'finalized', so a
 * re-run of an already-finalized week changes nothing.
 *
 * Group-size self-tuning happens in selfTune() below and takes effect the
 * FOLLOWING week (see there). Tier ACTIVATION is different and lives inline in
 * the main loop: it takes effect IMMEDIATELY, in the same transaction, the
 * moment a real promotion needs a tier that is not yet active — see the
 * comment at `up` below for why.
 */

export interface FinalizeResult { finalized: number; promotions: number; demotions: number; }

// Stepped group size by smoothed weekly-active users. entry = threshold to reach
// the step going UP; going DOWN needs smoothed < 0.8 * the current step's entry.
const SIZE_STEPS = [
  { size: 8, entry: 0 },
  { size: 12, entry: 24 },
  { size: 15, entry: 60 },
  { size: 20, entry: 150 },
];

export async function finalizeWeek(weekStart: string, now: Date = new Date()): Promise<FinalizeResult> {
  return withTransaction(async (client) => {
    const cfg = await getLeagueConfig(client);

    // Lock every not-yet-finalized group of this week. None -> already done.
    const groupsRes = await client.query<{
      id: string; tier_id: string; capacity_at_creation: number;
    }>(
      `select id, tier_id, capacity_at_creation from leagues
        where week_start = $1 and status <> 'finalized'
        order by id for update`,
      [weekStart],
    );
    if (groupsRes.rows.length === 0) return { finalized: 0, promotions: 0, demotions: 0 };

    const tiers = await getTiers(client);
    const byOrder = new Map(tiers.map((t) => [t.tier_order, t]));
    const tierById = new Map(tiers.map((t) => [t.id, t]));
    // The highest tier currently is_active. Mutated in place below whenever a
    // promotion activates a new tier mid-run, so max_active_tier_order (read by
    // routes/league.ts, premium-prize.ts, premium-prize-notify.ts for "is this
    // the top of the ladder" copy) is never stale for longer than this transaction.
    let maxActiveOrder = Math.max(...tiers.filter((t) => t.is_active).map((t) => t.tier_order));

    let promotions = 0;
    let demotions = 0;
    let activeUsers = 0;
    let fillSum = 0;

    for (const g of groupsRes.rows) {
      const tier = tierById.get(g.tier_id)!;
      const members = (await client.query<{
        id: string; user_id: string; weekly_xp: number;
      }>(
        `select id, user_id, weekly_xp from league_members
          where league_id = $1
          order by weekly_xp desc, first_reached_current_xp_at asc nulls last, id asc`,
        [g.id],
      )).rows;

      const size = members.length;
      activeUsers += members.filter((m) => m.weekly_xp > 0).length;
      if (g.capacity_at_creation > 0) fillSum += size / g.capacity_at_creation;

      const filled = size >= g.capacity_at_creation;
      /**
       * Is this a real competition?
       *
       * An ABSOLUTE floor answers that correctly at the bottom of the pyramid
       * and is wrong at the top by construction. min_valid_group_size is 6;
       * composite — the highest active tier — held 5 people in total on
       * 2026-08-09, every one of them competing. Calling that "not a real
       * group" told the five most engaged readers on the site that their league
       * did not count, and left the tier everyone is climbing towards with no
       * demotion (invalid) and no medals (services/achievements.ts reads the
       * same rule) — and, at the time, no promotion either (see `up` below
       * for why that second part changed on 2026-08-25).
       *
       * So a group is also valid when it is FULL — when it holds everyone its
       * tier had to offer. Since 0033 capacity is the tier's own population
       * (tierCapacity in league.ts), so `filled` at the top means "the whole
       * level is in this group", which is not a thin group, it is a
       * championship. And `min_group_capacity` (3) is what keeps that honest:
       * a tier of one or two cannot reach its own capacity, so it stays
       * non-competitive instead of crowning someone for existing.
       *
       * capacity_at_creation is also why this needs no historical bookkeeping:
       * it is frozen on the row, so "was that group valid" has the same answer
       * a year later, whatever the tier's population has done since.
       */
      const valid = size >= cfg.min_valid_group_size || filled;
      const isBottom = tier.tier_order <= 1;
      const promotedCount = Math.ceil((size * cfg.promotion_pct) / 100);
      const demotedCount = Math.ceil((size * cfg.demotion_pct) / 100);

      /**
       * The tier above this one, or null only for the true ceiling (titanium,
       * tier_order 7 — the one tier with nothing above it to promote into).
       * `up.is_active` is deliberately NOT part of the promotion condition
       * below — promotion no longer waits on whether the next tier happens to
       * be switched on yet; activation is a CONSEQUENCE of promotion, not a
       * gate on it.
       *
       * Until 2026-08-25 promotion was blocked whenever this tier was the
       * highest ACTIVE one (`isTop`), and the next tier activated separately,
       * in selfTune, only once its own group reached a size threshold — a bar
       * the top tier, fed solely by promotions trickling up from the tier
       * below, could take a very long time to reach on its own. The result:
       * composite (2026-08-24) held its group full at 11-12 members for
       * weeks, its #1 and #2 ranked and won the weekly prize, and neither
       * ever promoted, because metal-ceramic had never crossed that bar.
       *
       * Founder's fix: as long as a real person qualifies to promote (ranks in
       * the promo zone AND clears promotion_min_weekly_xp, same as at every
       * other level of the ladder), the tier above opens for them — even if
       * that means it opens with as few as 1-3 members its first week. A
       * group that thin is still a real competition once it exists: it is
       * "filled" the moment tierCapacity clamps to its (small) population, so
       * `valid` already treats it as one — see that comment below.
       */
      const up = byOrder.get(tier.tier_order + 1) ?? null;

      for (let i = 0; i < size; i += 1) {
        const m = members[i];
        const rank = i + 1;
        const inPromoZone = rank <= promotedCount;
        const inDemoZone = rank > size - demotedCount;

        let outcome: 'promoted' | 'stayed' | 'demoted' = 'stayed';
        if (valid) {
          if (inPromoZone && up && m.weekly_xp >= cfg.promotion_min_weekly_xp) {
            outcome = 'promoted';
          } else if (inDemoZone && !inPromoZone && filled && !isBottom) {
            // Demotions apply ONLY when the group filled to capacity (spec 7).
            outcome = 'demoted';
          }
        }

        await client.query(
          'update league_members set final_rank = $2, outcome = $3 where id = $1',
          [m.id, rank, outcome],
        );
        if (outcome === 'promoted') {
          await client.query('update profiles set current_tier_id = $2 where id = $1', [m.user_id, up!.id]);
          promotions += 1;
          if (!up!.is_active) {
            await client.query(
              'update league_tiers set is_active = true, activated_at = now() where id = $1', [up!.id],
            );
            if (up!.tier_order > maxActiveOrder) {
              await setLeagueConfig(
                'max_active_tier_order', String(up!.tier_order),
                { triggerMetric: `promotion opened ${up!.slug} (from ${tier.slug}, week ${weekStart})` }, client,
              );
              maxActiveOrder = up!.tier_order;
            }
            up!.is_active = true; // in-memory, so a second promotion into `up` this same run is a no-op above
          }
        } else if (outcome === 'demoted') {
          const down = byOrder.get(tier.tier_order - 1);
          if (down) await client.query('update profiles set current_tier_id = $2 where id = $1', [m.user_id, down.id]);
          demotions += 1;
        }
      }

      await client.query("update leagues set status = 'finalized' where id = $1", [g.id]);
    }

    const groupsCount = groupsRes.rows.length;
    const avgFill = groupsCount > 0 ? Math.round((fillSum / groupsCount) * 1000) / 10 : 0; // percent, 1dp
    await client.query(
      `insert into league_weekly_stats (week_start, active_users, groups_count, avg_fill_pct, promotions, demotions)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (week_start) do update
         set active_users = excluded.active_users, groups_count = excluded.groups_count,
             avg_fill_pct = excluded.avg_fill_pct, promotions = excluded.promotions,
             demotions = excluded.demotions`,
      [weekStart, activeUsers, groupsCount, avgFill, promotions, demotions],
    );

    // --- self-tuning: group size only (effective next week) ------------------
    // Tier activation is no longer decided here — see `up` above, which opens
    // the next tier the moment a real promotion needs it, in this same
    // transaction.
    await selfTune(client, weekStart, cfg);

    return { finalized: groupsCount, promotions, demotions };
  });
}

async function selfTune(
  client: pg.PoolClient,
  weekStart: string,
  cfg: LeagueConfig,
): Promise<void> {
  // Smoothed input: mean weekly-active users over the last <=4 weeks (incl. now).
  const hist = await client.query<{ active_users: number }>(
    'select active_users from league_weekly_stats order by week_start desc limit 4',
  );
  const smoothed = hist.rows.length
    ? hist.rows.reduce((a, r) => a + r.active_users, 0) / hist.rows.length
    : 0;

  // --- group size: step function + hysteresis + cooldown ---
  const curIdx = Math.max(0, SIZE_STEPS.findIndex((s) => s.size === cfg.group_size_current));
  let targetIdx = curIdx;
  let highestUp = 0;
  for (let i = 0; i < SIZE_STEPS.length; i += 1) if (smoothed >= SIZE_STEPS[i].entry) highestUp = i;
  if (highestUp > curIdx) {
    targetIdx = highestUp; // move up (may jump steps)
  } else if (curIdx > 0 && smoothed < 0.8 * SIZE_STEPS[curIdx].entry) {
    targetIdx = curIdx - 1; // hysteresis drop, one step at a time
  }

  if (targetIdx !== curIdx) {
    const cooldownOk = !cfg.group_size_last_changed_week
      || dayDiff(weekStart, cfg.group_size_last_changed_week) / 7 >= cfg.cooldown_weeks;
    if (cooldownOk) {
      const changed = await setLeagueConfig(
        'group_size_current', String(SIZE_STEPS[targetIdx].size),
        { triggerMetric: `smoothed_active=${Math.round(smoothed * 10) / 10}` }, client,
      );
      if (changed) {
        await setLeagueConfig('group_size_last_changed_week', weekStart, {}, client);
      }
    }
  }
  // Tier activation used to live here too (a one-way flip gated on the top
  // tier's group hitting a size threshold). It is now decided inline in
  // finalizeWeek's main loop, the moment a real promotion needs the next
  // tier — see the `up` comment there for why.
}

/**
 * Finalize every week whose groups have not been finalized and whose week has
 * ended (week_end < today, Tehran). Called daily by the scheduler; self-healing
 * (a missed day is caught the next) and idempotent.
 */
export async function finalizeDueWeeks(now: Date = new Date()): Promise<{ weeks: number; promotions: number; demotions: number }> {
  const cfg = await getLeagueConfig();
  const today = dayInTz(now, cfg.timezone);
  const due = await pool.query<{ week_start: string }>(
    `select distinct week_start from leagues
      where status <> 'finalized' and week_end < $1::date order by week_start`,
    [today],
  );
  let weeks = 0;
  let promotions = 0;
  let demotions = 0;
  for (const r of due.rows) {
    const out = await finalizeWeek(r.week_start, now);
    if (out.finalized > 0) { weeks += 1; promotions += out.promotions; demotions += out.demotions; }
  }
  return { weeks, promotions, demotions };
}
