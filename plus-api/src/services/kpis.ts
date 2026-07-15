import { pool } from '../db.js';
import { config } from '../config.js';
import { QUALIFYING_ACTIONS } from './streak.js';

/**
 * Founder KPIs 1-6 (spec section 7), computed from user_activity + anon_events.
 * Day boundaries are Asia/Tehran. Some measures are cohort-based (activation,
 * D1, D7) and some are last-7-day rates (depth, archive usage). Where a precise
 * link between an anonymous click and a signup is not possible (identity-free
 * anon_events), the conversion figure is an explicit approximation.
 */
export interface Kpis {
  generated_at: string;
  tz: string;
  anonymous_demand: { workbench_clicks: number; total_signups: number; conversion_pct_approx: number | null };
  activation_48h_pct: { pct: number | null; cohort: number };
  d1_return_pct: { pct: number | null; cohort: number };
  d7_survival_by_tier: Array<{ tier: string; cohort: number; kept: number; pct: number | null }>;
  depth_median_highlights_per_user_week: number | null;
  archive_usage: { sessions_last_7d: number; free_users: number; sessions_per_free_user_week: number | null };
}

const num = (v: unknown): number => (v == null ? 0 : Number(v));
const pct = (n: number, d: number): number | null => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);

export async function computeKpis(): Promise<Kpis> {
  const tz = config.streakTimezone;
  const qual = Array.from(QUALIFYING_ACTIONS);

  // KPI 1 - anonymous demand + (approx) conversion.
  const anon = await pool.query<{ clicks: number }>(
    `select count(*)::int as clicks from anon_events where event = 'workbench_button_anon_click'`,
  );
  const signups = await pool.query<{ n: number }>(`select count(*)::int as n from profiles`);
  const clicks = num(anon.rows[0]?.clicks);
  const totalSignups = num(signups.rows[0]?.n);

  // KPI 2 - activation: first highlight within 48h of signup.
  const activation = await pool.query<{ pct: number | null; cohort: number }>(
    `with firsts as (
       select p.id, p.created_at as signup,
         (select min(a.created_at) from user_activity a
           where a.user_id = p.id and a.action = 'highlight_created') as first_hl
       from profiles p
     )
     select count(*)::int as cohort,
            (count(*) filter (where first_hl is not null and first_hl <= signup + interval '48 hours'))::float
              as activated
       from firsts`,
  );
  const actCohort = num(activation.rows[0]?.cohort);
  const activated = num((activation.rows[0] as any)?.activated);

  // KPI 3 - D1 return: qualifying action on the Tehran day after signup.
  const d1 = await pool.query<{ cohort: number; returned: number }>(
    `with cohort as (
       select id, (created_at at time zone $1)::date as d0 from profiles
     ), acts as (
       select user_id, (created_at at time zone $1)::date as d
         from user_activity where action = any($2)
     )
     select count(*)::int as cohort,
            (count(*) filter (where exists (
               select 1 from acts a where a.user_id = c.id and a.d = c.d0 + 1)))::int as returned
       from cohort c
      where c.d0 < (now() at time zone $1)::date`,
    [tz, qual],
  );

  // KPI 4 - D7 streak survival split by tier: active on signup_day + 6.
  const d7 = await pool.query<{ tier: string; cohort: number; kept: number }>(
    `with cohort as (
       select id, tier, (created_at at time zone $1)::date as d0 from profiles
     ), acts as (
       select user_id, (created_at at time zone $1)::date as d
         from user_activity where action = any($2)
     )
     select c.tier,
            count(*)::int as cohort,
            (count(*) filter (where exists (
               select 1 from acts a where a.user_id = c.id and a.d = c.d0 + 6)))::int as kept
       from cohort c
      where c.d0 + 6 <= (now() at time zone $1)::date
      group by c.tier`,
    [tz, qual],
  );

  // KPI 5 - depth: median highlights per active user in the last 7 days.
  const depth = await pool.query<{ median: number | null }>(
    `select percentile_cont(0.5) within group (order by n) as median from (
       select user_id, count(*) as n from user_activity
        where action = 'highlight_created' and created_at >= now() - interval '7 days'
        group by user_id
     ) t`,
  );

  // KPI 6 - archive usage: distinct (free user, Tehran day) manual sessions / 7d.
  const sessions = await pool.query<{ sessions: number }>(
    `select count(*)::int as sessions from (
       select distinct a.user_id, (a.created_at at time zone $1)::date as d
         from user_activity a join profiles p on p.id = a.user_id
        where a.action = 'card_reviewed_manual' and p.tier = 'free'
          and a.created_at >= now() - interval '7 days'
     ) t`,
    [tz],
  );
  const freeUsers = await pool.query<{ n: number }>(`select count(*)::int as n from profiles where tier = 'free'`);
  const nSessions = num(sessions.rows[0]?.sessions);
  const nFree = num(freeUsers.rows[0]?.n);

  return {
    generated_at: new Date().toISOString(),
    tz,
    anonymous_demand: {
      workbench_clicks: clicks,
      total_signups: totalSignups,
      conversion_pct_approx: pct(totalSignups, clicks),
    },
    activation_48h_pct: { pct: pct(activated, actCohort), cohort: actCohort },
    d1_return_pct: { pct: pct(num(d1.rows[0]?.returned), num(d1.rows[0]?.cohort)), cohort: num(d1.rows[0]?.cohort) },
    d7_survival_by_tier: d7.rows.map((r) => ({
      tier: r.tier, cohort: num(r.cohort), kept: num(r.kept), pct: pct(num(r.kept), num(r.cohort)),
    })),
    depth_median_highlights_per_user_week: depth.rows[0]?.median == null ? null : Number(depth.rows[0].median),
    archive_usage: {
      sessions_last_7d: nSessions,
      free_users: nFree,
      sessions_per_free_user_week: nFree > 0 ? Math.round((nSessions / nFree) * 100) / 100 : null,
    },
  };
}
