import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/basic-auth.js';
import { dayInTz } from '../services/time.js';
import { leagueWeek, getTiers } from '../services/league.js';
import {
  getLeagueConfig, getLeagueConfigRows, getLeagueAudit, setLeagueConfigLock,
  setLeagueConfig, NUMERIC_KEYS,
} from '../services/league-config.js';

/**
 * League admin (spec 10): observability + the emergency lock + a manual tier
 * override + retuning any behavioural number (POST /admin/league/config). The
 * self-tuning logic runs automatically; the admin watches and only intervenes
 * for abnormal situations.
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

  /**
   * GET /admin/league/top?tier=&week=&limit= — the leaderboard, by name.
   *
   * /admin/league reports medians and fill; the members themselves were nowhere,
   * so "who is at the top of composite this week, and with what?" could only be
   * answered from the database by hand. That is the question every suspicion
   * starts with — on 2026-08-08 an account passed a thousand weekly XP and the
   * investigation stalled on not being able to name it.
   *
   * Sorted the way the league itself ranks: XP first, then who reached that
   * total earlier (`first_reached_current_xp_at`), which is the tie-break
   * league-finalize.ts uses. So row one here is the group's actual leader, not
   * an approximation of them.
   */
  app.get('/admin/league/top', async (request, reply) => {
    const q = request.query as { tier?: string; week?: string; limit?: string };
    const cfg = await getLeagueConfig();
    const week = q.week || leagueWeek(dayInTz(new Date(), cfg.timezone)).week_start;
    const limit = Math.min(Math.max(Number(q.limit ?? 20) || 20, 1), 200);

    const rows = await pool.query<{
      user_id: string; display_name: string | null; tier_slug: string;
      weekly_xp: number; group_size: number; league_id: string;
      joined_at: string; first_reached_current_xp_at: string | null;
    }>(
      `select lm.user_id, p.display_name, t.slug as tier_slug, lm.weekly_xp,
              lm.league_id, lm.joined_at, lm.first_reached_current_xp_at,
              count(*) over (partition by lm.league_id)::int as group_size
         from league_members lm
         join leagues l       on l.id = lm.league_id
         join league_tiers t  on t.id = l.tier_id
         join profiles p      on p.id = lm.user_id
        where l.week_start = $1
          and ($2::text is null or t.slug = $2)
        order by lm.weekly_xp desc, lm.first_reached_current_xp_at asc nulls last
        limit $3`,
      [week, q.tier ?? null, limit],
    );

    return reply.send({
      ok: true,
      week_start: week,
      tier: q.tier ?? 'all',
      count: rows.rowCount,
      members: rows.rows,
    });
  });

  // POST /admin/league/config { key, value, reason?, force? } — change a league
  // behavioural number (spec 11: none of them are hardcoded, they all live in
  // league_config). Goes through setLeagueConfig, so the change is audited and a
  // locked key is still respected.
  //
  // Exists because until now the ONLY way to retune the league — say, lowering
  // promotion_min_weekly_xp after seeing the median come in under it — was a
  // direct connection to the production database. That is a bad thing to need
  // for a routine decision.
  //
  // setLeagueConfig answers false for three very different reasons (unknown
  // key, locked key, value already set). They are separated here, because
  // "nothing happened" is useless when you cannot tell a frozen key from a
  // no-op.
  app.post('/admin/league/config', {
    schema: {
      body: {
        type: 'object', required: ['key', 'value'],
        properties: {
          key: { type: 'string' },
          value: {}, // number or string; normalised below
          reason: { type: 'string' },
          force: { type: 'boolean' }, // override the emergency lock
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { key: string; value: unknown; reason?: string; force?: boolean };
    const rows = await getLeagueConfigRows();
    const row = rows.find((r) => r.key === b.key);
    if (!row) {
      return reply.code(404).send({ error: 'unknown_key', valid_keys: rows.map((r) => r.key) });
    }

    const value = String(b.value ?? '').trim();
    // A behavioural number that silently becomes NaN would not fail here — it
    // would fail at finalize, a week later, on real users.
    if ((NUMERIC_KEYS as string[]).includes(b.key)) {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) {
        return reply.code(400).send({ error: 'invalid_value', message: 'این کلید باید یک عدد نامنفی باشد.' });
      }
    }

    if (row.locked && !b.force) {
      return reply.code(409).send({
        error: 'locked',
        message: 'این کلید قفل است. برای تغییر، force بفرست یا اول قفلش را بردار.',
        locked_at: row.locked_at,
      });
    }
    if (row.value === value) {
      return reply.send({ ok: true, changed: false, key: b.key, value, note: 'unchanged' });
    }

    const changed = await setLeagueConfig(
      b.key as Parameters<typeof setLeagueConfig>[0],
      value,
      { triggerMetric: b.reason ?? 'manual (admin)', force: b.force },
    );
    return reply.send({ ok: true, changed, key: b.key, old_value: row.value, value });
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
