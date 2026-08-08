import type pg from 'pg';
import { pool, query, one } from '../db.js';

/**
 * league_config accessor. Every behavioural number lives in the table (spec 11:
 * "no behavioral number hardcoded"). Values are stored as text and parsed here.
 * The self-tuning logic writes through setLeagueConfig, which records an audit row
 * and refuses to touch a `locked` key (the emergency freeze).
 */

export interface LeagueConfig {
  group_size_current: number;
  promotion_pct: number;
  demotion_pct: number;
  min_valid_group_size: number;
  promotion_min_weekly_xp: number;
  cooldown_weeks: number;
  max_active_tier_order: number;
  week_start_dow: string;
  timezone: string;
  // Per-action XP weights (0007). weekly_xp only; all-time score is separate.
  xp_active_bonus: number;   // first scoring action of the day
  xp_read: number;           // article read to completion (once per article/week)
  xp_listen: number;         // podcast past the threshold (once per episode/week)
  xp_highlight: number;      // per highlight...
  xp_highlight_cap: number;  // ...capped per article/week
  xp_review: number;         // manual card review
  xp_share: number;          // passing on an article you finished (once per article/week)
  xp_share_weekly_cap: number; // ...and at most this many articles a week
  // Premium earning paths (0029). Extra WAYS to earn, never a multiplier on an
  // existing weight — see that migration for why the league must stay plan-blind
  // in its per-action prices. Every one is capped per week.
  xp_pathway_step: number;              // consumed item that is a step of an enrolled pathway
  xp_pathway_step_weekly_cap: number;
  xp_pathway_enrolled: number;          // starting a pathway
  xp_pathway_enrolled_weekly_cap: number;
  xp_collection_created: number;        // opening a board
  xp_collection_created_weekly_cap: number;
  xp_collection_item: number;           // pinning to a board (once per page/week)
  xp_collection_item_weekly_cap: number;
  // Weekly premium prize (0016). Winners are the top of every VALID group.
  prize_days: number;             // how long a granted premium lasts
  prize_cooldown_weeks: number;   // a winner sits out this many weeks
  prize_winners_per_group: number;
  /** Floor for winning a PRIZE — lower than min_valid_group_size, which is the
   *  floor for PROMOTION. See migration 0017 for why the two are separate. */
  prize_min_group_size: number;
  // Legacy 0006 keys — kept for back-compat, no longer read by awardLeagueXp.
  xp_per_active_day: number;
  xp_per_highlight: number;
  group_size_last_changed_week: string | null;
}

type Db = pg.Pool | pg.PoolClient;

export const NUMERIC_KEYS: Array<keyof LeagueConfig> = [
  'group_size_current', 'promotion_pct', 'demotion_pct', 'min_valid_group_size',
  'promotion_min_weekly_xp', 'cooldown_weeks', 'max_active_tier_order',
  'xp_active_bonus', 'xp_read', 'xp_listen', 'xp_highlight', 'xp_highlight_cap', 'xp_review',
  'xp_share', 'xp_share_weekly_cap',
  'xp_pathway_step', 'xp_pathway_step_weekly_cap',
  'xp_pathway_enrolled', 'xp_pathway_enrolled_weekly_cap',
  'xp_collection_created', 'xp_collection_created_weekly_cap',
  'xp_collection_item', 'xp_collection_item_weekly_cap',
  'prize_days', 'prize_cooldown_weeks', 'prize_winners_per_group', 'prize_min_group_size',
  'xp_per_active_day', 'xp_per_highlight',
];

/** Read the whole config as a typed object (numbers parsed). */
export async function getLeagueConfig(db: Db = pool): Promise<LeagueConfig> {
  const res = await db.query<{ key: string; value: string }>('select key, value from league_config');
  const raw = new Map(res.rows.map((r) => [r.key, r.value]));
  const numeric = (k: keyof LeagueConfig, fallback: number): number => {
    const v = raw.get(k);
    const n = v == null || v === '' ? NaN : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const cfg = {} as LeagueConfig;
  const cfgAny = cfg as unknown as Record<string, number>;
  for (const k of NUMERIC_KEYS) cfgAny[k] = numeric(k, 0);
  cfg.week_start_dow = raw.get('week_start_dow') ?? 'saturday';
  cfg.timezone = raw.get('timezone') ?? 'Asia/Tehran';
  const lastChanged = raw.get('group_size_last_changed_week');
  cfg.group_size_last_changed_week = lastChanged ? lastChanged : null;
  return cfg;
}

/** Full rows for the admin view (value + updated_at + lock state). */
export async function getLeagueConfigRows(): Promise<Array<{
  key: string; value: string; updated_at: string; locked: boolean; locked_at: string | null;
}>> {
  const res = await query<{ key: string; value: string; updated_at: string; locked: boolean; locked_at: string | null }>(
    'select key, value, updated_at, locked, locked_at from league_config order by key',
  );
  return res.rows;
}

/**
 * Write a config value (self-tuning path). No-op + returns false when the key is
 * locked or the value is unchanged. On a real change it records a league_audit_log
 * row with the metric that triggered it.
 */
export async function setLeagueConfig(
  key: keyof LeagueConfig | 'group_size_last_changed_week',
  value: string,
  opts: { triggerMetric?: string; force?: boolean } = {},
  db: Db = pool,
): Promise<boolean> {
  const row = await one<{ value: string; locked: boolean }>(
    'select value, locked from league_config where key = $1', [key], db,
  );
  if (!row) return false;
  if (row.locked && !opts.force) return false;
  if (row.value === value) return false;

  await query('update league_config set value = $2, updated_at = now() where key = $1', [key, value], db);
  await query(
    `insert into league_audit_log (changed_key, old_value, new_value, trigger_metric)
     values ($1, $2, $3, $4)`,
    [key, row.value, value, opts.triggerMetric ?? null], db,
  );
  return true;
}

/** Emergency lock / unlock of a config key against the self-tuning logic. */
export async function setLeagueConfigLock(key: string, locked: boolean): Promise<boolean> {
  const res = await query(
    `update league_config set locked = $2, locked_at = case when $2 then now() else null end
      where key = $1`,
    [key, locked],
  );
  return (res.rowCount ?? 0) > 0;
}

/** Recent audit rows (admin view). */
export async function getLeagueAudit(limit = 50): Promise<Array<{
  changed_key: string; old_value: string | null; new_value: string; trigger_metric: string | null; computed_at: string;
}>> {
  const res = await query<{ changed_key: string; old_value: string | null; new_value: string; trigger_metric: string | null; computed_at: string }>(
    `select changed_key, old_value, new_value, trigger_metric, computed_at
       from league_audit_log order by computed_at desc limit $1`,
    [limit],
  );
  return res.rows;
}
