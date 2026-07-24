import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/basic-auth.js';
import { dayInTz } from '../services/time.js';
import { leagueWeek, getTiers } from '../services/league.js';
import {
  getLeagueConfig, getLeagueConfigRows, getLeagueAudit, setLeagueConfigLock,
} from '../services/league-config.js';

/**
 * League admin (spec 10): read-only observability + the emergency lock + a manual
 * tier override. The self-tuning logic runs automatically; the admin watches and
 * only intervenes for abnormal situations.
 */
export async function leagueAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  // GET /admin/league — the observability dashboard as JSON.
  app.get('/admin/league', async (_request, reply) => {
    const cfg = await getLeagueConfig();
    const { week_start } = leagueWeek(dayInTz(new Date(), cfg.timezone));
    const tiers = await getTiers();

    // Weekly-active trend + smoothed (last 4).
    const stats = (await pool.query<{
      week_start: string; active_users: number; groups_count: number;
      avg_fill_pct: string | null; promotions: number; demotions: number;
    }>(
      `select week_start, active_users, groups_count, avg_fill_pct, promotions, demotions
         from league_weekly_stats order by week_start desc limit 8`,
    )).rows;
    const last4 = stats.slice(0, 4);
    const smoothed_active = last4.length
      ? Math.round((last4.reduce((a, r) => a + r.active_users, 0) / last4.length) * 10) / 10
      : 0;

    // Config values + each key's last automatic change (value + trigger).
    const rows = await getLeagueConfigRows();
    const lastChange = new Map((await pool.query<{
      changed_key: string; new_value: string; trigger_metric: string | null; computed_at: string;
    }>(
      `select distinct on (changed_key) changed_key, new_value, trigger_metric, computed_at
         from league_audit_log order by changed_key, computed_at desc`,
    )).rows.map((r) => [r.changed_key, r]));
    const configView = rows.map((r) => ({
      key: r.key, value: r.value, updated_at: r.updated_at, locked: r.locked,
      last_change: lastChange.get(r.key) ?? null,
    }));

    // Current-week groups: size + capacity per group (for fill + validity).
    const groups = (await pool.query<{ id: string; tier_id: string; capacity_at_creation: number; size: number }>(
      `select l.id, l.tier_id, l.capacity_at_creation, count(lm.id)::int as size
         from leagues l left join league_members lm on lm.league_id = l.id
        where l.week_start = $1 group by l.id`,
      [week_start],
    )).rows;
    const medians = new Map((await pool.query<{ tier_id: string; med: number | null }>(
      `select l.tier_id, percentile_cont(0.5) within group (order by lm.weekly_xp) as med
         from leagues l join league_members lm on lm.league_id = l.id
        where l.week_start = $1 group by l.tier_id`,
      [week_start],
    )).rows.map((r) => [r.tier_id, r.med == null ? null : Number(r.med)]));

    const perTier = tiers.map((t) => {
      const gs = groups.filter((g) => g.tier_id === t.id);
      const fill = gs.length
        ? Math.round((gs.reduce((a, g) => a + (g.capacity_at_creation > 0 ? g.size / g.capacity_at_creation : 0), 0) / gs.length) * 1000) / 10
        : 0;
      return {
        slug: t.slug, name_fa: t.name_fa, tier_order: t.tier_order, is_active: t.is_active,
        groups: gs.length, fill_pct: fill, median_weekly_xp: medians.get(t.id) ?? null,
      };
    });

    const belowValidity = groups
      .filter((g) => g.size < cfg.min_valid_group_size)
      .map((g) => ({
        league_id: g.id, size: g.size, min_valid: cfg.min_valid_group_size,
        tier: tiers.find((t) => t.id === g.tier_id)?.slug ?? null,
      }));

    return reply.send({
      generated_at: new Date().toISOString(),
      current_week: week_start,
      smoothed_active,
      weekly_trend: stats,
      last_week: stats[0] ?? null,
      config: configView,
      per_tier: perTier,
      groups_below_validity: belowValidity,
      audit_log: await getLeagueAudit(50),
    });
  });

  // POST /admin/league/lock { key, locked } — emergency freeze of a config key
  // against the self-tuning logic.
  app.post('/admin/league/lock', {
    schema: {
      body: {
        type: 'object', required: ['key', 'locked'],
        properties: { key: { type: 'string' }, locked: { type: 'boolean' } },
      },
    },
  }, async (request, reply) => {
    const { key, locked } = request.body as { key: string; locked: boolean };
    const ok = await setLeagueConfigLock(key, locked);
    if (!ok) return reply.code(404).send({ error: 'unknown_key' });
    return reply.send({ ok: true, key, locked });
  });

  // POST /admin/league/set-tier { user_id, tier_slug } — manual override (support
  // + testing). Does not touch weekly_xp or the current week's placement.
  app.post('/admin/league/set-tier', {
    schema: {
      body: {
        type: 'object', required: ['user_id', 'tier_slug'],
        properties: { user_id: { type: 'string' }, tier_slug: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { user_id, tier_slug } = request.body as { user_id: string; tier_slug: string };
    const tiers = await getTiers();
    const tier = tiers.find((t) => t.slug === tier_slug);
    if (!tier) return reply.code(400).send({ error: 'unknown_tier' });
    const res = await pool.query(
      'update profiles set current_tier_id = $2 where id = $1', [user_id, tier.id],
    );
    if ((res.rowCount ?? 0) === 0) return reply.code(404).send({ error: 'no_profile' });
    return reply.send({ ok: true, user_id, tier: tier.slug });
  });
}
