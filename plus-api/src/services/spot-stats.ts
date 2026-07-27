import { query } from '../db.js';
import { dayInTz, previousDay } from './time.js';
import { config } from '../config.js';

/**
 * Spot (ad system) telemetry. Two client events — `spot_impression` and
 * `spot_click` — arrive on the SAME endpoints as everything else
 * (`POST /anon/event` for guests, `POST /activity` for signed-in users), but they
 * are NOT logged as rows. Each one bumps a counter in `spot_stats` keyed by
 * (day, slot, creative, viewer, kind); see migration 0009 for why.
 *
 * `viewer` is decided by the server from the presence of a valid session cookie,
 * never from the request body — a client cannot mislabel its own traffic.
 */

/** The two Spot events, as sent in `event` (anon) / `action` (signed-in). */
export const SPOT_EVENTS: Record<string, SpotKind> = {
  spot_impression: 'impression',
  spot_click: 'click',
};

export type SpotKind = 'impression' | 'click';
export type SpotViewer = 'anon' | 'plus';

/**
 * The slot vocabulary is CLOSED (mirrors `spot/spot-config.json` → `slots`). A
 * typo or a forged slot would otherwise mint a permanent junk key in the counter
 * table, so unknown slots are rejected rather than counted.
 */
export const SPOT_SLOTS = new Set([
  'article', 'home', 'player', 'episodes', 'dashboard', 'profile', 'search', 'archive',
]);

// Creative ids come from spot-config.json (`premium`, sponsor ids). Open-ended by
// design — a new sponsor must not need an API deploy — but bounded in shape and
// length so the key space cannot be inflated.
const CREATIVE_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

/**
 * The two mirrors, plus 'unknown' for a request whose origin we cannot read
 * (and for every row written before the dimension existed). CLOSED, like the
 * slot vocabulary: an unrecognised host is recorded as 'unknown' rather than
 * minting a permanent key, so a stray Origin can never pollute the report.
 */
export const SPOT_HOSTS = new Set(['dentcast.ir', 'dentcast.org', 'unknown']);

/**
 * Which mirror did this event come from? Derived from Origin, falling back to
 * Referer — NEVER from the request body, for the same reason `viewer` is not:
 * traffic must not be able to label itself. `www.` is folded into the bare
 * domain (one site, one number), and anything else becomes 'unknown'.
 */
export function hostFromHeaders(headers: {
  origin?: string | string[];
  referer?: string | string[];
}): string {
  const first = (v: string | string[] | undefined): string =>
    (Array.isArray(v) ? v[0] : v) || '';
  for (const raw of [first(headers.origin), first(headers.referer)]) {
    if (!raw) continue;
    try {
      const host = new URL(raw).hostname.replace(/^www\./, '');
      if (SPOT_HOSTS.has(host)) return host;
    } catch { /* malformed header → try the next, then 'unknown' */ }
  }
  return 'unknown';
}

export interface SpotTarget { slot: string; creative: string }

/**
 * Parse the wire format `content_id: "<slot>:<creative>"` (e.g. `home:sponsor-x`).
 * Returns null when the slot is unknown or the creative id is malformed.
 */
export function parseSpotContentId(contentId: unknown): SpotTarget | null {
  if (typeof contentId !== 'string') return null;
  const idx = contentId.indexOf(':');
  if (idx <= 0) return null;
  const slot = contentId.slice(0, idx).trim();
  const creative = contentId.slice(idx + 1).trim();
  if (!SPOT_SLOTS.has(slot)) return null;
  if (!CREATIVE_RE.test(creative)) return null;
  return { slot, creative };
}

/**
 * Increment one counter. Single statement, no read-modify-write: concurrent
 * requests for the same key serialize on the row and both land.
 */
export async function recordSpotEvent(
  target: SpotTarget,
  viewer: SpotViewer,
  kind: SpotKind,
  host: string = 'unknown',
  at: Date = new Date(),
): Promise<void> {
  await query(
    `insert into spot_stats (day, slot, creative, viewer, kind, host, count)
     values ($1::date, $2, $3, $4, $5, $6, 1)
     on conflict (day, slot, creative, viewer, kind, host)
     do update set count = spot_stats.count + 1, updated_at = now()`,
    [dayInTz(at), target.slot, target.creative, viewer, kind, SPOT_HOSTS.has(host) ? host : 'unknown'],
  );
}

// ── read path ────────────────────────────────────────────────────────────────

export type GroupBy = 'day' | 'week' | 'month';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validate a 'YYYY-MM-DD' string and reject impossible dates (2026-02-31). */
export function isCalendarDay(v: unknown): v is string {
  if (typeof v !== 'string' || !DAY_RE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// The bucket a day belongs to. `week` is the IRANIAN week (Saturday start), to
// match the league/streak week used everywhere else — not date_trunc('week'),
// which is Monday-based.
export const PERIOD_SQL: Record<GroupBy, string> = {
  day: 'day',
  week: "(day - (((extract(dow from day)::int) + 1) % 7) * interval '1 day')::date",
  month: "date_trunc('month', day)::date",
};

export interface SpotRow {
  period: string;
  slot: string;
  creative: string;
  viewer: SpotViewer;
  host: string;
  impressions: number;
  clicks: number;
  ctr_pct: number | null;
}

export interface SpotStats {
  from: string;
  to: string;
  group_by: GroupBy;
  tz: string;
  totals: { impressions: number; clicks: number; ctr_pct: number | null };
  by_period: Array<{ period: string; impressions: number; clicks: number; ctr_pct: number | null }>;
  by_slot: Array<{ slot: string; impressions: number; clicks: number; ctr_pct: number | null }>;
  by_creative: Array<{ creative: string; impressions: number; clicks: number; ctr_pct: number | null }>;
  by_viewer: Array<{ viewer: SpotViewer; impressions: number; clicks: number; ctr_pct: number | null }>;
  /** Which mirror delivered the inventory. 'unknown' = written before the
   *  dimension shipped (2026-07-27), never a guess. */
  by_host: Array<{ host: string; impressions: number; clicks: number; ctr_pct: number | null }>;
  rows: SpotRow[];
}

function ctr(impressions: number, clicks: number): number | null {
  return impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : null;
}

/** Default window: the last 30 Tehran days, ending today. */
export function defaultRange(now: Date = new Date()): { from: string; to: string } {
  const to = dayInTz(now);
  let from = to;
  for (let i = 0; i < 29; i += 1) from = previousDay(from);
  return { from, to };
}

/**
 * Sum the counters in [from, to] (inclusive) and roll them up. One query: the
 * grouped set is small (days × slots × creatives × 2 viewers × 2 kinds), so the
 * cross-cuts are folded in memory instead of costing four more round trips.
 */
export async function getSpotStats(opts: {
  from: string;
  to: string;
  groupBy: GroupBy;
  /** Optional: report only one mirror ('dentcast.ir' | 'dentcast.org' | 'unknown'). */
  host?: string;
}): Promise<SpotStats> {
  const period = PERIOD_SQL[opts.groupBy];
  const res = await query<{
    period: string; slot: string; creative: string; viewer: SpotViewer; host: string;
    impressions: number; clicks: number;
  }>(
    `select ${period} as period, slot, creative, viewer, host,
            coalesce(sum(count) filter (where kind = 'impression'), 0)::bigint as impressions,
            coalesce(sum(count) filter (where kind = 'click'), 0)::bigint as clicks
       from spot_stats
      where day between $1::date and $2::date
        and ($3::text is null or host = $3::text)
      group by 1, 2, 3, 4, 5
      order by 1 desc, impressions desc, 2, 3`,
    [opts.from, opts.to, opts.host ?? null],
  );

  const totals = { impressions: 0, clicks: 0 };
  const bucket = <K extends string>(m: Map<string, { key: K; impressions: number; clicks: number }>, key: K) => {
    let e = m.get(key);
    if (!e) { e = { key, impressions: 0, clicks: 0 }; m.set(key, e); }
    return e;
  };
  const periods = new Map<string, { key: string; impressions: number; clicks: number }>();
  const slots = new Map<string, { key: string; impressions: number; clicks: number }>();
  const creatives = new Map<string, { key: string; impressions: number; clicks: number }>();
  const viewers = new Map<string, { key: SpotViewer; impressions: number; clicks: number }>();
  const hosts = new Map<string, { key: string; impressions: number; clicks: number }>();

  const rows: SpotRow[] = res.rows.map((r) => {
    const impressions = Number(r.impressions);
    const clicks = Number(r.clicks);
    totals.impressions += impressions;
    totals.clicks += clicks;
    for (const e of [
      bucket(periods, r.period), bucket(slots, r.slot),
      bucket(creatives, r.creative), bucket(viewers, r.viewer),
      bucket(hosts, r.host),
    ]) {
      e.impressions += impressions;
      e.clicks += clicks;
    }
    return {
      period: r.period, slot: r.slot, creative: r.creative, viewer: r.viewer, host: r.host,
      impressions, clicks, ctr_pct: ctr(impressions, clicks),
    };
  });

  const list = <T extends string>(m: Map<string, { key: T; impressions: number; clicks: number }>) =>
    [...m.values()]
      .sort((a, b) => b.impressions - a.impressions || a.key.localeCompare(b.key))
      .map((e) => ({ ...e, ctr_pct: ctr(e.impressions, e.clicks) }));

  return {
    from: opts.from,
    to: opts.to,
    group_by: opts.groupBy,
    tz: config.streakTimezone,
    totals: { ...totals, ctr_pct: ctr(totals.impressions, totals.clicks) },
    by_period: list(periods)
      .map(({ key, ...rest }) => ({ period: key, ...rest }))
      .sort((a, b) => (a.period < b.period ? 1 : -1)),
    by_slot: list(slots).map(({ key, ...rest }) => ({ slot: key, ...rest })),
    by_creative: list(creatives).map(({ key, ...rest }) => ({ creative: key, ...rest })),
    by_viewer: list(viewers).map(({ key, ...rest }) => ({ viewer: key, ...rest })),
    by_host: list(hosts).map(({ key, ...rest }) => ({ host: key, ...rest })),
    rows,
  };
}
