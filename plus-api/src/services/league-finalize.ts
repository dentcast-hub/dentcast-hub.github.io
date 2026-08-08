import type pg from 'pg';
import { pool, withTransaction } from '../db.js';
import { dayInTz, dayDiff } from './time.js';
import { getTiers } from './league.js';
import { getLeagueConfig, setLeagueConfig, type LeagueConfig } from './league-config.js';

/**
 * Weekly finalization + self-tuning. Runs once per closed week, transactional and
 * IDEMPOTENT: it only touches groups whose status is not yet 'finalized', so a
 * re-run of an already-finalized week changes nothing. Self-tuning (group size +
 * tier activation) happens ONLY here, takes effect the following week, and every
 * automatic change is written to league_audit_log.
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
    const maxActiveOrder = Math.max(...tiers.filter((t) => t.is_active).map((t) => t.tier_order));

    let promotions = 0;
    let demotions = 0;
    let activeUsers = 0;
    let fillSum = 0;
    const sizeByGroup = new Map<string, number>();

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
      sizeByGroup.set(g.id, size);
      activeUsers += members.filter((m) => m.weekly_xp > 0).length;
      if (g.capacity_at_creation > 0) fillSum += size / g.capacity_at_creation;

      const valid = size >= cfg.min_valid_group_size;
      const filled = size >= g.capacity_at_creation;
      const isTop = tier.tier_order >= maxActiveOrder;
      const isBottom = tier.tier_order <= 1;
      const promotedCount = Math.ceil((size * cfg.promotion_pct) / 100);
      const demotedCount = Math.ceil((size * cfg.demotion_pct) / 100);

      for (let i = 0; i < size; i += 1) {
        const m = members[i];
        const rank = i + 1;
        const inPromoZone = rank <= promotedCount;
        const inDemoZone = rank > size - demotedCount;

        let outcome: 'promoted' | 'stayed' | 'demoted' = 'stayed';
        if (valid) {
          if (inPromoZone && !isTop && m.weekly_xp >= cfg.promotion_min_weekly_xp) {
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
          const up = byOrder.get(tier.tier_order + 1);
          if (up) await client.query('update profiles set current_tier_id = $2 where id = $1', [m.user_id, up.id]);
          promotions += 1;
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

    // --- self-tuning (only here; effective next week) ------------------------
    await selfTune(client, weekStart, cfg, {
      maxActiveOrder,
      // Measured against group_size_current, NOT the group's own
      // capacity_at_creation. Since 0033 capacity is per-tier and the top tier's
      // capacity is its own population (tierCapacity in league.ts), so the top
      // group is full the moment everyone in it has earned a point — and reading
      // that as "the ladder is crowded, open the next rung" would unroll all
      // seven tiers onto a handful of readers, one person per tier, which is the
      // opposite of what activation is for. The question here has always been
      // "did the top tier fill a STANDARD group", and that is what it now asks.
      hadFullTopGroup: groupsRes.rows.some(
        (g) => tierById.get(g.tier_id)!.tier_order === maxActiveOrder
          && (sizeByGroup.get(g.id) ?? 0) >= cfg.group_size_current,
      ),
      nextTierId: byOrder.get(maxActiveOrder + 1)?.id ?? null,
    });

    return { finalized: groupsCount, promotions, demotions };
  });
}

async function selfTune(
  client: pg.PoolClient,
  weekStart: string,
  cfg: LeagueConfig,
  ctx: { maxActiveOrder: number; hadFullTopGroup: boolean; nextTierId: string | null },
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

  // --- tier activation: one-way, floor 3 (seed), ceiling 7 ---
  if (ctx.hadFullTopGroup && ctx.maxActiveOrder < 7 && ctx.nextTierId) {
    await client.query(
      'update league_tiers set is_active = true, activated_at = now() where id = $1',
      [ctx.nextTierId],
    );
    await setLeagueConfig(
      'max_active_tier_order', String(ctx.maxActiveOrder + 1),
      { triggerMetric: `full top-tier group at order ${ctx.maxActiveOrder}` }, client,
    );
  }
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
