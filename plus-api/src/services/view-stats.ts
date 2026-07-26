import { query } from '../db.js';
import { dayInTz } from './time.js';
import { PERIOD_SQL, type GroupBy, type SpotStats, type SpotViewer } from './spot-stats.js';

/**
 * Page-view counters — the denominator for the Spot report.
 *
 * An ad impression count is only readable next to the number of page views that
 * could have produced it. This module counts page views the cheapest honest way
 * available: `GET /me` fires exactly once per page view for every visitor (see
 * migration 0010 for why that is true and why it is adblock-proof), so the /me
 * handler bumps a counter here and nothing else changes anywhere.
 *
 * Like `spot_stats`, this is a COUNTER, never a row per view, and it carries no
 * identity: a day and a viewer class is the whole record. It answers "how many
 * page views did guests generate today", never "who".
 */

export type ViewerClass = 'anon' | 'plus' | 'premium';

/**
 * Increment one counter. Single statement, no read-modify-write, same shape as
 * recordSpotEvent — concurrent page views for the same key serialize on the row
 * and all land.
 */
export async function recordPageView(
  viewer: ViewerClass,
  at: Date = new Date(),
): Promise<void> {
  await query(
    `insert into view_stats (day, viewer, count)
     values ($1::date, $2, 1)
     on conflict (day, viewer)
     do update set count = view_stats.count + 1, updated_at = now()`,
    [dayInTz(at), viewer],
  );
}

export interface ViewStatsRow { period: string; viewer: ViewerClass; views: number }

/**
 * Page views in [from, to] (inclusive Tehran days), bucketed the same way the
 * Spot report buckets its own periods so the two line up row for row.
 */
export async function getViewStats(opts: {
  from: string;
  to: string;
  groupBy: GroupBy;
}): Promise<ViewStatsRow[]> {
  const res = await query<{ period: string; viewer: ViewerClass; views: string }>(
    `select ${PERIOD_SQL[opts.groupBy]} as period, viewer, sum(count)::bigint as views
       from view_stats
      where day between $1::date and $2::date
      group by 1, 2
      order by 1 desc, 2`,
    [opts.from, opts.to],
  );
  return res.rows.map((r) => ({ period: r.period, viewer: r.viewer, views: Number(r.views) }));
}

// ── the joined readout ───────────────────────────────────────────────────────

export interface PageViewTotals { anon: number; plus: number; premium: number }

export interface SpotStatsWithViews extends SpotStats {
  page_views: {
    totals: PageViewTotals;
    by_period: Array<{ period: string } & PageViewTotals>;
    /** First Tehran day that has any page-view data at all (null before rollout). */
    since: string | null;
  };
  /**
   * Impressions per page view, per viewer class — the number the report is
   * actually about. `null` when the window has no page-view data for that class
   * (before the counter shipped), never 0, so a missing denominator can never be
   * mistaken for "nobody saw anything".
   */
  impressions_per_view: Record<SpotViewer, number | null>;
}

const EMPTY: PageViewTotals = { anon: 0, plus: 0, premium: 0 };

/**
 * Bolt the page-view denominator onto a Spot report. Kept as a wrapper rather
 * than folded into getSpotStats so the two counter tables stay independent: a
 * window that predates this counter still returns a complete ad report, with the
 * ratios reported as null instead of a fabricated denominator.
 */
export async function withPageViews(stats: SpotStats): Promise<SpotStatsWithViews> {
  const rows = await getViewStats({ from: stats.from, to: stats.to, groupBy: stats.group_by });

  const totals: PageViewTotals = { ...EMPTY };
  const periods = new Map<string, { period: string } & PageViewTotals>();
  for (const r of rows) {
    totals[r.viewer] += r.views;
    let e = periods.get(r.period);
    if (!e) { e = { period: r.period, ...EMPTY }; periods.set(r.period, e); }
    e[r.viewer] += r.views;
  }

  const since = await query<{ day: string }>(
    `select min(day)::text as day from view_stats where day between $1::date and $2::date`,
    [stats.from, stats.to],
  );

  const ratio = (impressions: number, views: number) =>
    (views > 0 ? Math.round((impressions / views) * 1000) / 1000 : null);
  const seen = (viewer: SpotViewer) =>
    stats.by_viewer.find((v) => v.viewer === viewer)?.impressions ?? 0;

  return {
    ...stats,
    page_views: {
      totals,
      by_period: [...periods.values()].sort((a, b) => (a.period < b.period ? 1 : -1)),
      since: since.rows[0]?.day ?? null,
    },
    impressions_per_view: {
      anon: ratio(seen('anon'), totals.anon),
      plus: ratio(seen('plus'), totals.plus),
    },
  };
}
