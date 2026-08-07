import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { dayInTz, nextDay } from '../services/time.js';
import { leagueWeek, getTiers } from '../services/league.js';
import { getLeagueConfig } from '../services/league-config.js';

/**
 * User-facing league view (spec 9). Backend contract, not design. Ranking is only
 * within the user's own weekly group; members are shown by pseudonym. A group
 * below min_valid_group_size returns neutral_mode so the frontend shows a plain
 * activity list, not a competitive table with promotion/demotion promises.
 */

// Iran is a fixed +03:30 offset (no DST), so the next week's 00:00 boundary is
// unambiguous. time_remaining counts down to that instant.
function secondsUntilWeekEnd(weekEnd: string, now: Date): number {
  const boundary = new Date(`${nextDay(weekEnd)}T00:00:00+03:30`).getTime();
  return Math.max(0, Math.round((boundary - now.getTime()) / 1000));
}

export async function leagueRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /league — the current week's group for the signed-in user.
  app.get('/league', async (request, reply) => {
    const userId = request.user!.id;
    const now = new Date();
    const cfg = await getLeagueConfig();
    const today = dayInTz(now, cfg.timezone);
    const { week_start, week_end } = leagueWeek(today);
    const tiers = await getTiers();
    const tierById = new Map(tiers.map((t) => [t.id, t]));

    const currentTierId = request.user!.id
      ? (await pool.query<{ current_tier_id: string | null }>(
          'select current_tier_id from profiles where id = $1', [userId],
        )).rows[0]?.current_tier_id ?? null
      : null;
    const currentTier = (currentTierId && tierById.get(currentTierId))
      || tiers.find((t) => t.slug === 'acrylic')!;
    const tierPublic = (t: { slug: string; name_fa: string; tier_order: number }) => ({
      slug: t.slug, name_fa: t.name_fa, tier_order: t.tier_order,
    });

    // The user's outcome from the last finalized week, if not yet acknowledged.
    const pend = (await pool.query<{ outcome: string; final_rank: number; week_start: string }>(
      `select lm.outcome, lm.final_rank, lm.week_start
         from league_members lm join leagues l on l.id = lm.league_id
        where lm.user_id = $1 and lm.outcome is not null and lm.outcome_seen = false
          and l.status = 'finalized'
        order by lm.week_start desc limit 1`,
      [userId],
    )).rows[0] ?? null;
    const pending_outcome = pend
      ? { outcome: pend.outcome, final_rank: pend.final_rank, week_start: pend.week_start, new_tier: tierPublic(currentTier) }
      : null;

    // This week's membership.
    const mem = (await pool.query<{ league_id: string; weekly_xp: number; tier_id: string }>(
      `select lm.league_id, lm.weekly_xp, l.tier_id
         from league_members lm join leagues l on l.id = lm.league_id
        where lm.user_id = $1 and lm.week_start = $2`,
      [userId, week_start],
    )).rows[0] ?? null;

    const base = {
      week_start,
      week_end,
      time_remaining_seconds: secondsUntilWeekEnd(week_end, now),
      tier: tierPublic(currentTier),
      pending_outcome,
      // The scoring table the "چطور امتیازِ لیگ می‌گیرم؟" box shows. Sent rather
      // than hardcoded in the client because these are league_config values a
      // founder can retune at any time (POST /admin/league/config) — a hardcoded
      // list would quietly start lying the moment one of them moved, and the
      // explainer users trust to be the rules is the worst place for that.
      // Sent on the not-joined branch too: the box is shown there as well.
      xp: {
        read: cfg.xp_read,
        listen: cfg.xp_listen,
        highlight: cfg.xp_highlight,
        highlight_cap: cfg.xp_highlight_cap,
        review: cfg.xp_review,
        active_bonus: cfg.xp_active_bonus,
        share: cfg.xp_share,
        share_cap: cfg.xp_share_weekly_cap,
      },
      // Same reason as `xp` above: the weekly top-of-group prize length is a
      // league_config value a founder can retune, so the "stayed" nudge (asking
      // the user to go for it next week) reads it from here instead of a
      // hardcoded number that would quietly start lying the moment it changed.
      prize_days: cfg.prize_days,
    };

    if (!mem) {
      // Not placed yet — the user earns their first XP of the week to join.
      return reply.send({ ...base, joined: false });
    }

    const rows = (await pool.query<{ display_name: string; user_id: string; weekly_xp: number; rnk: number }>(
      `select p.display_name, lm.user_id, lm.weekly_xp,
              rank() over (order by lm.weekly_xp desc,
                                    lm.first_reached_current_xp_at asc nulls last, lm.id asc) as rnk
         from league_members lm join profiles p on p.id = lm.user_id
        where lm.league_id = $1`,
      [mem.league_id],
    )).rows;

    const size = rows.length;
    const promotion_zone = Math.ceil((size * cfg.promotion_pct) / 100);
    const demotion_zone = Math.ceil((size * cfg.demotion_pct) / 100);
    const neutral_mode = size < cfg.min_valid_group_size;
    const groupTier = tierById.get(mem.tier_id) ?? currentTier;
    const isTop = groupTier.tier_order >= cfg.max_active_tier_order;
    const isBottom = groupTier.tier_order <= 1;
    const me = rows.find((r) => r.user_id === userId);

    return reply.send({
      ...base,
      joined: true,
      group_tier: tierPublic(groupTier),
      size,
      neutral_mode,
      promotion_zone: isTop ? 0 : promotion_zone, // no promotion out of the top tier
      demotion_zone: isBottom ? 0 : demotion_zone, // no demotion out of tier 1
      promotion_min_weekly_xp: cfg.promotion_min_weekly_xp,
      my_rank: me?.rnk ?? null,
      my_weekly_xp: mem.weekly_xp,
      members: rows.map((r) => ({
        display_name: r.display_name,
        weekly_xp: r.weekly_xp,
        rank: r.rnk,
        is_me: r.user_id === userId,
      })),
    });
  });

  // POST /league/outcome/seen — acknowledge finalized outcome(s) so the
  // announcement stops showing. The announcement is this phase's only "reward".
  app.post('/league/outcome/seen', async (request, reply) => {
    await pool.query(
      `update league_members set outcome_seen = true
        where user_id = $1 and outcome is not null and outcome_seen = false`,
      [request.user!.id],
    );
    return reply.send({ ok: true });
  });
}
