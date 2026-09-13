import { config } from '../config.js';
import { pool, query, type Queryable } from '../db.js';
import { getClusters, getContentInfo } from '../content-index.js';
import { getPathways, computeProgress } from '../pathways.js';
import { getBadgeCatalog } from '../badges.js';
import { getConsumedContentTimes } from './consumption.js';
import { dayInTz, jalaliMonth, startOfDayInstant, previousDay, dayDiff } from './time.js';
import { dayToJalali, jalaliToDay, faDigits, formatJalaliShort } from './jalali.js';
import { sendCapped } from './notify-policy.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * «گزارش ماهانه» (premium) — the spec's "monthly review report" (§1, Premium),
 * the one item on that list that never got code.
 *
 * It is a DERIVATION and nothing else. Every number here is recomputed from
 * tables that already exist — `user_activity`, `highlights`, `league_members`,
 * `achievement_announcements` — and nothing is written down, the same doctrine
 * `reading-compass.ts`, `achievements.ts` and `pathway-standings.ts` follow:
 * no `monthly_reports` table, no cached totals that could disagree with the
 * log they came from. The one row this feature ever writes is the اطلاعیه
 * announcing that a month's report exists (`runMonthlyReports`), and that
 * row is the announcement, not the report.
 *
 * The month is a JALALI month of Tehran days. A reader's month is شهریور, not
 * September, and the two are never less than three weeks apart — the same
 * reason payment capacity resets on the Persian first (services/time.ts
 * `jalaliMonth`). Boundaries are computed by `jalaliToDay` (ICU round-trip,
 * no leap table of our own) and turned into instants by `startOfDayInstant`,
 * so an action at 23:59 Tehran on the last day of the month belongs to that
 * month whatever the host clock's zone is.
 *
 * Time-on-page appears NOWHERE in it. The spec allows it "as an informational
 * stat" in this report, but no per-user reading time exists anywhere in this
 * API (`view_stats` is per day+viewer, `spot_stats` per ad slot), and a report
 * must not print a number it does not have. Everything here counts completion
 * events — read, listened, highlighted, reviewed, a day kept — which is also
 * the spec's non-negotiable principle 3.
 */

// ---------------------------------------------------------------------------
// The month window
// ---------------------------------------------------------------------------

export interface MonthWindow {
  /** 'YYYY-MM' in the Jalali calendar, e.g. '1405-06' — the API's month key. */
  key: string;
  jy: number;
  jm: number;
  /** «شهریور ۱۴۰۵» */
  title_fa: string;
  /** «شهریور» */
  month_fa: string;
  /** Gregorian 'YYYY-MM-DD' Tehran days, both inclusive. */
  from_day: string;
  to_day: string;
  /** Instants: [start, end). `end` is midnight Tehran that begins the next month. */
  start: Date;
  end: Date;
  days: number;
}

const FA_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** The 'YYYY-MM' key of the Jalali month n months after `key` (n may be negative). */
export function shiftMonthKey(key: string, n: number): string {
  const [jy, jm] = key.split('-').map(Number);
  const idx = jy * 12 + (jm - 1) + n;
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Resolve a 'YYYY-MM' Jalali month key into its Tehran-day window, or null
 * when the key is not a real month. Both ends come from ICU: the first day by
 * `jalaliToDay(jy, jm, 1)`, the last by stepping back one day from the NEXT
 * month's first — so Esfand's length in a leap year is never our decision.
 */
export function monthWindow(key: string): MonthWindow | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  if (jm < 1 || jm > 12) return null;
  const fromDay = jalaliToDay(jy, jm, 1);
  if (!fromDay) return null;
  const next = shiftMonthKey(key, 1);
  const [ny, nm] = next.split('-').map(Number);
  const nextFirst = jalaliToDay(ny, nm, 1);
  if (!nextFirst) return null;
  const toDay = previousDay(nextFirst);
  return {
    key,
    jy,
    jm,
    title_fa: `${FA_MONTHS[jm - 1]} ${faDigits(jy)}`,
    month_fa: FA_MONTHS[jm - 1],
    from_day: fromDay,
    to_day: toDay,
    start: startOfDayInstant(fromDay, config.streakTimezone),
    end: startOfDayInstant(nextFirst, config.streakTimezone),
    days: dayDiff(toDay, fromDay) + 1,
  };
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

export interface ReportCounts {
  /** Distinct articles finished (article_completed) in the month. */
  articles: number;
  /** Distinct episodes listened through (episode_listened) in the month. */
  episodes: number;
  /** Highlights created in the month (deleted ones are gone with their row). */
  highlights: number;
  /** Highlights created in the month that carry a note. */
  notes: number;
  /** Leitner answers on DUE cards (review_finished) in the month. */
  cards_reviewed: number;
  /** Tehran days on which the streak counted (streak_kept) in the month. */
  active_days: number;
}

export interface ReportPillar {
  key: string;
  fa: string;
  total: number;
  /** Items of this pillar first consumed inside the month. */
  read_this_month: number;
  /** Coverage of this pillar (read ÷ total, %) at the START of the month… */
  coverage_before_pct: number;
  /** …and at its END. The delta is what the month did. */
  coverage_after_pct: number;
}

export interface ReportPathway {
  id: string;
  title_fa: string;
  short_fa: string | null;
  total_steps: number;
  completed_steps: number;
  /** Steps whose content was first consumed inside the month. */
  steps_this_month: number;
  is_complete: boolean;
  /** Crossed the finish line inside this month. */
  completed_this_month: boolean;
}

export interface ReportLeagueWeek {
  week_start: string;
  /** «۷ شهریور» — the Saturday, said the way the page says it. */
  week_start_fa: string;
  tier_fa: string;
  weekly_xp: number;
  final_rank: number | null;
  group_size: number;
  outcome: 'promoted' | 'stayed' | 'demoted' | null;
}

export interface ReportBadge {
  key: string;
  title_fa: string;
  icon: string;
  level: number;
  /** The metal of that level for a leveled badge; null for a one-shot. */
  metal: 'bronze' | 'silver' | 'gold' | null;
  announced_at: string;
}

export interface ReportContentItem {
  content_id: string;
  title: string;
  url: string;
  type: string;
}

export interface ReportCalendar {
  /** Weekday of the 1st, Saturday = 0 … Friday = 6 (the Iranian week). */
  first_weekday: number;
  /** Jalali day-of-month numbers on which the streak counted. */
  active: number[];
  /** Days a shield bridged (streak_freeze_used → meta.frozen_day), as day numbers. */
  shielded: number[];
  /** Today's day-of-month while the month is in progress; equals `days` otherwise. */
  today: number;
}

export interface MonthlyReport {
  month: Omit<MonthWindow, 'start' | 'end'>;
  /** True while the month is the current one — the numbers are still moving. */
  in_progress: boolean;
  calendar: ReportCalendar;
  counts: ReportCounts;
  /** The same six numbers for the month before, for the deltas. */
  previous: ReportCounts;
  /** Pillars touched this month, most-read first. */
  pillars: ReportPillar[];
  /**
   * Pillars the reader HAD read before this month and did not open once in it,
   * most-read-before first — «یک ماه است دست‌نخورده مانده». Deliberately not
   * pillars never touched at all: those belong to the compass's «کاوش», and a
   * report of what you did is not the place to list everything you did not.
   */
  dormant: { key: string; fa: string; read_before: number; total: number }[];
  /** The longest run of consecutive active days inside the month. */
  longest_run: number;
  /** Shields spent inside the month (streak_freeze_used). */
  shields_used: number;
  pathways: ReportPathway[];
  league: { weeks: ReportLeagueWeek[]; best_rank: number | null; promotions: number; total_xp: number };
  badges: ReportBadge[];
  /** Items first consumed this month, newest first, capped — «این ماه خواندید». */
  read_items: ReportContentItem[];
  /** How many `read_items` there were before the cap. */
  read_items_total: number;
  /** The month the reader's account was created in, so the client can bound a month picker. */
  first_month: string;
}

const READ_ITEMS_LIMIT = 12;

const EMPTY_COUNTS: ReportCounts = {
  articles: 0, episodes: 0, highlights: 0, notes: 0, cards_reviewed: 0, active_days: 0,
};

/** The six counters for one window — the shape both `counts` and `previous` take. */
async function countsFor(userId: string, w: MonthWindow, db: Queryable): Promise<ReportCounts> {
  const row = await query<{
    articles: number; episodes: number; cards_reviewed: number; active_days: number;
  }>(
    `select
       count(distinct content_id) filter (where action = 'article_completed')::int as articles,
       count(distinct content_id) filter (where action = 'episode_listened')::int  as episodes,
       count(*) filter (where action = 'review_finished')::int                    as cards_reviewed,
       count(*) filter (where action = 'streak_kept')::int                         as active_days
     from user_activity
     where user_id = $1 and created_at >= $2 and created_at < $3`,
    [userId, w.start, w.end],
    db,
  );
  const hl = await query<{ highlights: number; notes: number }>(
    `select count(*)::int as highlights,
            count(*) filter (where note is not null and note <> '')::int as notes
       from highlights
      where user_id = $1 and created_at >= $2 and created_at < $3`,
    [userId, w.start, w.end],
    db,
  );
  return {
    articles: row.rows[0]?.articles ?? 0,
    episodes: row.rows[0]?.episodes ?? 0,
    highlights: hl.rows[0]?.highlights ?? 0,
    notes: hl.rows[0]?.notes ?? 0,
    cards_reviewed: row.rows[0]?.cards_reviewed ?? 0,
    active_days: row.rows[0]?.active_days ?? 0,
  };
}

/**
 * Consecutive-day runs inside the month. `streak_kept` rows carry the counted
 * day in `meta.day`, and they are written exactly once per counted day, so a
 * run is simply adjacent days in that list — no shields involved: a bridged
 * gap is still a day the reader did nothing, and this report says what
 * happened, not what the streak engine forgave.
 */
async function activeDaysIn(userId: string, w: MonthWindow, db: Queryable): Promise<string[]> {
  const res = await query<{ day: string }>(
    `select meta->>'day' as day
       from user_activity
      where user_id = $1 and action = 'streak_kept'
        and created_at >= $2 and created_at < $3
      order by 1`,
    [userId, w.start, w.end],
    db,
  );
  return res.rows.map((r) => r.day).filter((d): d is string => typeof d === 'string' && d >= w.from_day && d <= w.to_day);
}

export function longestRun(days: string[]): number {
  const sorted = Array.from(new Set(days)).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && dayDiff(d, prev) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/**
 * The days a shield bridged, as 'YYYY-MM-DD'. A shield spent inside the month
 * may bridge the last day of the previous one; the day list is filtered to the
 * window and the COUNT is not, because «۱ سپر خرج شد» is about the spend.
 */
async function shieldsIn(userId: string, w: MonthWindow, db: Queryable): Promise<{ used: number; days: string[] }> {
  const res = await query<{ day: string | null }>(
    `select meta->>'frozen_day' as day from user_activity
      where user_id = $1 and action = 'streak_freeze_used'
        and created_at >= $2 and created_at < $3`,
    [userId, w.start, w.end],
    db,
  );
  return {
    used: res.rows.length,
    days: res.rows.map((r) => r.day).filter((d): d is string => typeof d === 'string' && d >= w.from_day && d <= w.to_day),
  };
}

/** Saturday = 0 … Friday = 6. getUTCDay(): 0 = Sunday … 6 = Saturday. */
function iranWeekday(day: string): number {
  return (new Date(`${day}T12:00:00Z`).getUTCDay() + 1) % 7;
}

async function leagueWeeksIn(userId: string, w: MonthWindow, db: Queryable): Promise<ReportLeagueWeek[]> {
  // A week belongs to the month its Saturday falls in — one home per week, so
  // a week straddling the boundary is never counted twice.
  const res = await query<{
    week_start: string; tier_fa: string; weekly_xp: number; final_rank: number | null;
    group_size: number; outcome: ReportLeagueWeek['outcome'];
  }>(
    `select to_char(m.week_start, 'YYYY-MM-DD') as week_start,
            '' as week_start_fa,
            t.name_fa as tier_fa,
            m.weekly_xp, m.final_rank, m.outcome,
            (select count(*)::int from league_members x where x.league_id = m.league_id) as group_size
       from league_members m
       join leagues l on l.id = m.league_id
       join league_tiers t on t.id = l.tier_id
      where m.user_id = $1
        and m.week_start >= $2::date and m.week_start <= $3::date
      order by m.week_start`,
    [userId, w.from_day, w.to_day],
    db,
  );
  return res.rows.map((r) => ({ ...r, week_start_fa: formatJalaliShort(r.week_start) }));
}

async function badgesIn(userId: string, w: MonthWindow, db: Queryable): Promise<ReportBadge[]> {
  const res = await query<{ badge_key: string; level: number; announced_at: Date }>(
    `select badge_key, level, announced_at
       from achievement_announcements
      where user_id = $1 and announced_at >= $2 and announced_at < $3
      order by announced_at`,
    [userId, w.start, w.end],
    db,
  );
  const catalog = getBadgeCatalog();
  const out: ReportBadge[] = [];
  for (const r of res.rows) {
    const badge = catalog.badges.find((b) => b.key === r.badge_key);
    if (!badge) continue; // a badge retired from the catalog is not news any more
    // The announcement is a high-water mark (achievement-sync.ts): `level` is
    // the highest level reached, and for a leveled badge that is the metal to
    // name. A one-shot badge has no metal — the wall never writes «طلا» for it
    // and neither does this.
    const metal = badge.leveled && badge.levels && r.level >= 1
      ? (badge.levels[Math.min(r.level, badge.levels.length) - 1]?.tier ?? null)
      : null;
    out.push({
      key: badge.key,
      title_fa: badge.title_fa,
      icon: badge.icon,
      level: r.level,
      metal,
      announced_at: new Date(r.announced_at).toISOString(),
    });
  }
  return out;
}

function toItem(contentId: string): ReportContentItem | null {
  const info = getContentInfo(contentId);
  if (!info) return null;
  return { content_id: contentId, title: info.title, url: info.url, type: info.type };
}

/**
 * The report for one reader and one month. `now` decides `in_progress` and is
 * injectable for tests; nothing else about the report depends on it.
 */
export async function computeMonthlyReport(
  userId: string,
  w: MonthWindow,
  now: Date = new Date(),
  db: Queryable = pool,
): Promise<MonthlyReport> {
  const prevKey = shiftMonthKey(w.key, -1);
  const prevWindow = monthWindow(prevKey);

  const [counts, previous, activeDays, shields, leagueWeeks, badges, times, profile] = await Promise.all([
    countsFor(userId, w, db),
    prevWindow ? countsFor(userId, prevWindow, db) : Promise.resolve(EMPTY_COUNTS),
    activeDaysIn(userId, w, db),
    shieldsIn(userId, w, db),
    leagueWeeksIn(userId, w, db),
    badgesIn(userId, w, db),
    getConsumedContentTimes(userId, db),
    query<{ created_at: Date }>('select created_at from profiles where id = $1', [userId], db),
  ]);

  // Three sets, all from the one first-consumed map: what the reader had at the
  // start of the month, what they had at its end, and the difference.
  const before = new Set<string>();
  const after = new Set<string>();
  const thisMonth: { id: string; at: Date }[] = [];
  for (const [id, at] of times) {
    if (at < w.start) { before.add(id); after.add(id); continue; }
    if (at < w.end) { after.add(id); thisMonth.push({ id, at }); }
  }

  const rawClusters = getClusters().filter((c) => c.contentCount > 0);
  const pillars: ReportPillar[] = [];
  const dormant: MonthlyReport['dormant'] = [];
  for (const c of rawClusters) {
    let readBefore = 0;
    let readAfter = 0;
    for (const id of c.contentIds) {
      if (before.has(id)) readBefore += 1;
      if (after.has(id)) readAfter += 1;
    }
    const readThisMonth = readAfter - readBefore;
    if (readThisMonth > 0) {
      pillars.push({
        key: c.key,
        fa: c.fa,
        total: c.contentCount,
        read_this_month: readThisMonth,
        coverage_before_pct: Math.round((readBefore / c.contentCount) * 100),
        coverage_after_pct: Math.round((readAfter / c.contentCount) * 100),
      });
    } else if (readBefore > 0) {
      dormant.push({ key: c.key, fa: c.fa, read_before: readBefore, total: c.contentCount });
    }
  }
  pillars.sort((a, b) => b.read_this_month - a.read_this_month);
  dormant.sort((a, b) => b.read_before - a.read_before);

  const pathways: ReportPathway[] = [];
  for (const p of getPathways()) {
    if (p.kind === 'bundle') continue; // 5–8 steps is not a month's story
    const progressAfter = computeProgress(p, after);
    if (progressAfter.completed_steps === 0) continue;
    const progressBefore = computeProgress(p, before);
    const stepsThisMonth = progressAfter.completed_steps - progressBefore.completed_steps;
    if (stepsThisMonth === 0) continue;
    pathways.push({
      id: p.id,
      title_fa: p.title_fa,
      short_fa: p.short_fa ?? null,
      total_steps: progressAfter.total_steps,
      completed_steps: progressAfter.completed_steps,
      steps_this_month: stepsThisMonth,
      is_complete: progressAfter.is_complete,
      completed_this_month: progressAfter.is_complete && !progressBefore.is_complete,
    });
  }
  pathways.sort((a, b) => b.steps_this_month - a.steps_this_month);

  thisMonth.sort((a, b) => b.at.getTime() - a.at.getTime());
  const readItems: ReportContentItem[] = [];
  for (const { id } of thisMonth) {
    const item = toItem(id);
    if (item) readItems.push(item);
    if (readItems.length >= READ_ITEMS_LIMIT) break;
  }

  const ranked = leagueWeeks.filter((x) => x.final_rank !== null) as (ReportLeagueWeek & { final_rank: number })[];
  const bestRank = ranked.length ? Math.min(...ranked.map((x) => x.final_rank)) : null;

  const createdAt = profile.rows[0]?.created_at ?? now;
  const { start, end, ...month } = w;
  void start; void end;
  const inProgress = now >= w.start && now < w.end;
  const dayNo = (day: string): number => dayDiff(day, w.from_day) + 1;
  return {
    month,
    in_progress: inProgress,
    calendar: {
      first_weekday: iranWeekday(w.from_day),
      active: Array.from(new Set(activeDays)).sort().map(dayNo),
      shielded: Array.from(new Set(shields.days)).sort().map(dayNo),
      today: inProgress ? dayNo(dayInTz(now, config.streakTimezone)) : w.days,
    },
    counts,
    previous,
    pillars,
    dormant,
    longest_run: longestRun(activeDays),
    shields_used: shields.used,
    pathways,
    league: {
      weeks: leagueWeeks,
      best_rank: bestRank,
      promotions: leagueWeeks.filter((x) => x.outcome === 'promoted').length,
      total_xp: leagueWeeks.reduce((n, x) => n + x.weekly_xp, 0),
    },
    badges,
    read_items: readItems,
    read_items_total: thisMonth.length,
    first_month: jalaliMonth(createdAt, config.streakTimezone),
  };
}

/**
 * Which months a reader may ask for: from the month their account was created
 * to the current one, newest first. A month before the account is not "empty",
 * it is nonexistent, and the route refuses it the same way it refuses next
 * month — an account created on the 28th still owns that month, since a
 * report of three days is still a report.
 */
export async function availableMonths(userId: string, now: Date = new Date(), db: Queryable = pool): Promise<string[]> {
  const res = await query<{ created_at: Date }>('select created_at from profiles where id = $1', [userId], db);
  const createdAt = res.rows[0]?.created_at;
  if (!createdAt) return [];
  const first = jalaliMonth(createdAt, config.streakTimezone);
  const current = jalaliMonth(now, config.streakTimezone);
  const out: string[] = [];
  let k = current;
  // Bounded: a 40-year-old account would still stop at 480 keys.
  for (let i = 0; i < 600 && k >= first; i += 1) {
    out.push(k);
    k = shiftMonthKey(k, -1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The announcement — one اطلاعیه row per reader per month
// ---------------------------------------------------------------------------

const toFa = (n: number): string => faDigits(n);

/**
 * The one line the notice carries. Whatever the reader did most is what it
 * names; a month with nothing in it sends nothing at all (see the sweep) —
 * «شما در مرداد هیچ کاری نکردید» is not news anybody asked for.
 */
export function reportHeadline(c: ReportCounts): string {
  const parts: string[] = [];
  if (c.articles) parts.push(`${toFa(c.articles)} مقاله`);
  if (c.episodes) parts.push(`${toFa(c.episodes)} اپیزود`);
  if (c.highlights) parts.push(`${toFa(c.highlights)} هایلایت`);
  if (c.cards_reviewed) parts.push(`${toFa(c.cards_reviewed)} کارت مرور`);
  const what = parts.slice(0, 3).join('، ');
  const days = c.active_days ? ` در ${toFa(c.active_days)} روزِ فعال` : '';
  return what ? `${what}${days}.` : `${toFa(c.active_days)} روزِ فعال.`;
}

export function reportUrl(monthKey: string): string {
  return `/plus/report.html?month=${monthKey}`;
}

function hasAnything(c: ReportCounts): boolean {
  return c.articles + c.episodes + c.highlights + c.cards_reviewed + c.active_days > 0;
}

/**
 * The monthly sweep. Runs DAILY (scheduler.ts) and announces the PREVIOUS
 * month's report to every premium reader who did anything in it — but only in
 * the first `graceDays` days of a month, and only once per reader per month.
 *
 * Daily rather than "on the first" for the reason every other sweep here is
 * daily: a container down on the 1st would otherwise skip the month, and a
 * month's report is the one notification a reader may actually be expecting.
 * The grace window is what stops a sweep on the 20th from announcing a report
 * three weeks stale as if it were fresh; past it the report is still there on
 * the page and in the dashboard card, it just does not knock.
 *
 * Dedup is the `notification_log` row itself, keyed by kind + day — the same
 * row the daily cap counts — so a second run the same morning, or the next
 * morning inside the window, finds the row and moves on. Which also means a
 * reader who was capped that day still gets it: sendCapped writes the row
 * (undelivered) and the inbox shows it, only the push is lost, and the row
 * is what dedups. Premium is read at SEND time from the same `tier` column
 * the route gates on, so a lapsed reader is not knocked on about a page they
 * can no longer open.
 */
export async function runMonthlyReports(now: Date = new Date()): Promise<{ announced: number; skipped: number }> {
  const today = dayInTz(now, config.streakTimezone);
  const { jd } = dayToJalali(today);
  if (jd > config.monthlyReport.graceDays) return { announced: 0, skipped: 0 };

  const currentKey = jalaliMonth(now, config.streakTimezone);
  const w = monthWindow(shiftMonthKey(currentKey, -1));
  if (!w) return { announced: 0, skipped: 0 };
  const current = monthWindow(currentKey)!;

  // Premium readers with at least one activity row or highlight in the month,
  // minus those already told this month. The activity test is deliberately
  // coarse (any row at all): the precise "did anything" answer comes from the
  // counts below, and this only keeps the loop from computing a report for
  // every dormant account.
  const eligible = await query<{ id: string }>(
    `select p.id
       from profiles p
      where p.tier = 'premium'
        and p.created_at < $2
        and (
          exists (select 1 from user_activity a
                   where a.user_id = p.id and a.created_at >= $1 and a.created_at < $2)
          or exists (select 1 from highlights h
                   where h.user_id = p.id and h.created_at >= $1 and h.created_at < $2)
        )
        and not exists (
          select 1 from notification_log l
           where l.user_id = p.id and l.kind = 'monthly_report'
             and l.day >= $3::date
        )`,
    [w.start, w.end, current.from_day],
  );

  let announced = 0;
  let skipped = 0;
  for (const u of eligible.rows) {
    const counts = await countsFor(u.id, w, pool);
    if (!hasAnything(counts)) { skipped += 1; continue; }
    const message: NotificationMessage = {
      title: `گزارش ${w.month_fa} آماده است`,
      body: reportHeadline(counts),
      url: reportUrl(w.key),
      tag: `monthly_report:${w.key}`,
    };
    // Capped on purpose: this is a report we chose to send, not a reply the
    // reader is owed. On a crowded morning the push is lost and the row still
    // lands in اطلاعیه, which is the surface this was built for anyway.
    await sendCapped(u.id, message, 'monthly_report', now);
    announced += 1;
  }
  return { announced, skipped };
}
