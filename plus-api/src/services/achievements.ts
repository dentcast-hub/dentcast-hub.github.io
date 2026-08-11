import { pool } from '../db.js';
import { config } from '../config.js';
import { grantMetricOf } from '../badges.js';
import { getFolders, folderOf } from '../content-index.js';
import { getConsumedContentIds } from './consumption.js';
import { getLeagueConfig } from './league-config.js';
import { pillarSeat, isPillarSeat } from './pillar.js';
import { QUALIFYING_ACTIONS } from './streak.js';
import { dayDiff, nextDay } from './time.js';

/**
 * Every number the achievements section is built from, derived from data the
 * product already keeps. Nothing here writes; nothing here is stored.
 *
 * That is the whole design. A badge could have been a row written the moment it
 * was earned, and every gamified product reaches for that first — but it would
 * have meant this section opening EMPTY for every existing reader on launch day
 * and needing a backfill to fix, plus a second copy of the truth that can drift
 * from the activity log it came from. Deriving costs one page-load's worth of
 * queries and buys a section that is correct for a two-year-old account the
 * first time it is opened.
 *
 * One rule holds for every metric: it is a number, and a badge is earned when
 * that number is >= its threshold. Anything naturally inverted (signup ORDER,
 * where lower is better) is converted to a 0/1 here rather than teaching the
 * evaluator a second comparison — see `founder_seat`.
 */

/** How many of the earliest accounts carry «پیشگام». Never grows. */
const FOUNDER_SEATS = 500;

/** Two years, in days — the age that makes a page "archive" for «باستان‌شناس». */
const ARCHIVE_AGE_DAYS = 730;

export type Metrics = Record<string, number>;

export interface MedalState {
  /** Highest tier_order at which the user ever finished at this rank; 0 = never. */
  best_tier_order: number;
}

export interface AchievementFacts {
  metrics: Metrics;
  /** Keyed by rank (1, 2) — what the medals read. */
  medals: Record<number, MedalState>;
  /** Live totals for thresholds written as 'all'. */
  totals: Record<string, number>;
}

/**
 * Did this account ever break a streak and come back?
 *
 * Derived from the day sequence rather than from a flag, because no flag was
 * ever written — and because the activity log is append-only, the answer is the
 * same today as it will be in a year. A gap only counts as a break when the
 * missed days were NOT bridged by streak shields: a run the shields saved never
 * broke, so returning from it is not a comeback and must not claim to be.
 */
function detectComeback(activeDays: string[], frozenDays: Set<string>): boolean {
  for (let i = 1; i < activeDays.length; i += 1) {
    const gap = dayDiff(activeDays[i], activeDays[i - 1]);
    if (gap <= 1) continue;
    let bridged = true;
    for (let d = nextDay(activeDays[i - 1]); d !== activeDays[i]; d = nextDay(d)) {
      if (!frozenDays.has(d)) { bridged = false; break; }
    }
    if (!bridged) return true; // the run really ended here, and they came back
  }
  return false;
}

export async function computeAchievementFacts(
  userId: string,
  longestStreak: number,
): Promise<AchievementFacts> {
  const tz = config.streakTimezone;
  const qualifying = Array.from(QUALIFYING_ACTIONS);
  // What counts as "finishing a piece of content" — the same pair the score and
  // the folder-progress bars use, so «خواننده» and the dashboard never disagree.
  const consumption = ['article_completed', 'episode_listened'];
  const leagueCfg = await getLeagueConfig();

  const [counts, clock, weekend, publishing, busiest, league, medalRows, days, frozen, consumed,
    seat, granted] = await Promise.all([
      // ---- plain counters, one round trip -------------------------------------
      pool.query<{
        highlights: number; highlights_with_note: number;
        episodes_completed: number; articles_completed: number;
        shield_used: number; review_sessions: number;
        collections: number; collection_items: number;
        pathways_completed: number; signup_order: number;
        shares: number;
      }>(
        `select
           (select count(*)::int from highlights where user_id = $1) as highlights,
           (select count(*)::int from highlights
             where user_id = $1 and note is not null and btrim(note) <> '') as highlights_with_note,
           (select count(distinct content_id)::int from user_activity
             where user_id = $1 and action = 'episode_listened' and content_id is not null)
             as episodes_completed,
           (select count(distinct content_id)::int from user_activity
             where user_id = $1 and action = 'article_completed' and content_id is not null)
             as articles_completed,
           (select count(*)::int from user_activity
             where user_id = $1 and action = 'streak_freeze_used') as shield_used,
           -- «یادآور» counts DAYS on which the reader reviewed, not answers.
           --
           -- It counted rows, and a row is one card. That made the badge's own
           -- word — «جلسه» — false by about twenty to one for an honest studier,
           -- and it made the badge farmable for money: a card is born due
           -- (card_state is inserted with next_review_at = null), so creating
           -- highlights and answering them straight away produced hundreds of
           -- "sessions" in an afternoon, and silver/gold here mint real one-time
           -- purchase discounts (٪۱ / ٪۲, see discount-credits.ts). On
           -- 2026-08-08 one account logged 765 of them across 4 days.
           --
           -- A day is the unit that cannot be looped: answering six hundred
           -- cards between midnight and one is still one day of reviewing, which
           -- is also exactly what «جلسهٔ مرور» has always meant to a reader.
           (select count(distinct (created_at at time zone $2)::date)::int
              from user_activity
             where user_id = $1 and action = 'review_finished') as review_sessions,
           (select count(*)::int from collections where user_id = $1) as collections,
           (select count(*)::int from collection_items ci
              join collections c on c.id = ci.collection_id
             where c.user_id = $1) as collection_items,
           (select count(*)::int from user_pathways
             where user_id = $1 and completed_at is not null) as pathways_completed,
           (select count(*)::int from profiles p2
             where p2.created_at <= (select created_at from profiles where id = $1))
             as signup_order,
           -- «چراغ‌دار»: articles this reader passed on AFTER finishing them.
           -- The read gate is the same one the league pays by (league.ts's
           -- shareXp), and it is repeated here rather than relaxed: a badge that
           -- lit for a share the league had refused to pay for would be the wall
           -- and the ladder telling the reader two different things about the
           -- same tap. Distinct content and no week window — the ladder is
           -- weekly, a shelf is for life.
           (select count(distinct s.content_id)::int from user_activity s
             where s.user_id = $1 and s.action = 'content_shared' and s.content_id is not null
               and exists (select 1 from user_activity r
                            where r.user_id = $1 and r.action = 'article_completed'
                              and r.content_id = s.content_id
                              and r.created_at <= s.created_at)) as shares`,
        [userId, tz], // tz: «یادآور» counts review DAYS, in Tehran
      ),

      // ---- hour-of-day, in Tehran --------------------------------------------
      // Only qualifying actions: a reminder we sent at 3am is our activity, not
      // the reader's, and must never mint «جغدِ شب».
      pool.query<{ night: number; dawn: number }>(
        `select
           count(*) filter (where h >= 0 and h < 4)::int as night,
           count(*) filter (where h < 6)::int            as dawn
         from (
           select extract(hour from (created_at at time zone $2))::int as h
             from user_activity where user_id = $1 and action = any($3)
         ) t`,
        [userId, tz, qualifying],
      ),

      // ---- a Thursday whose Friday is also active ----------------------------
      // The Iranian weekend is always inside one Saturday-start week, so an
      // adjacent-day test is exact and needs no week grouping at all.
      pool.query<{ n: number }>(
        `with d as (
           select distinct (created_at at time zone $2)::date as day
             from user_activity where user_id = $1 and action = any($3)
         )
         select count(*)::int as n from d t
          where extract(dow from t.day) = 4
            and exists (select 1 from d f where f.day = t.day + 1)`,
        [userId, tz, qualifying],
      ),

      // ---- read relative to publication --------------------------------------
      // `articles` only knows pages registered through the notify pipeline, and
      // rows predating it carry their registration moment as published_at. That
      // makes `early_reads` forward-looking by nature (documented in the
      // catalog's own _caveat); `archive_read` is unaffected, since a wrong-but-
      // recent stamp can only make a page look NEWER, never two years old.
      pool.query<{ archive: number; early: number }>(
        `select
           count(distinct ua.content_id) filter (
             where ua.created_at - ar.published_at > ($3 || ' days')::interval)::int as archive,
           count(distinct ua.content_id) filter (
             where ua.created_at >= ar.published_at
               and ua.created_at - ar.published_at < interval '1 hour')::int as early
         from user_activity ua
         join articles ar on ar.content_id = ua.content_id
        where ua.user_id = $1 and ua.action = any($2)`,
        [userId, consumption, String(ARCHIVE_AGE_DAYS)],
      ),

      // ---- busiest Saturday-start week ---------------------------------------
      // Postgres weeks start Monday; shifting the day +2 puts Saturday on Monday,
      // so date_trunc groups the Iranian week without a calendar table.
      pool.query<{ n: number }>(
        `select coalesce(max(c), 0)::int as n from (
           select date_trunc('week', (created_at at time zone $2)::date + interval '2 days') as wk,
                  count(distinct content_id) as c
             from user_activity
            where user_id = $1 and action = any($3) and content_id is not null
            group by 1
         ) t`,
        [userId, tz, consumption],
      ),

      // ---- longest run of finalized weeks without a demotion -----------------
      // Consecutive PARTICIPATED weeks (gaps-and-islands on the row number), which
      // is what «هفتهٔ پیاپی در لیگ» means: a week the reader sat out is not a week
      // they were demoted in.
      pool.query<{ n: number }>(
        `with w as (
           select row_number() over (order by lm.week_start) as rn, lm.outcome
             from league_members lm
             join leagues l on l.id = lm.league_id
            where lm.user_id = $1 and l.status = 'finalized' and lm.outcome is not null
         )
         select coalesce(max(cnt), 0)::int as n from (
           select count(*) as cnt from (
             select rn - row_number() over (order by rn) as grp
               from w where outcome <> 'demoted'
           ) g group by grp
         ) x`,
        [userId],
      ),

      // ---- best tier per finishing rank, with the validity filter ------------
      // league-finalize.ts writes final_rank for EVERY member, including groups
      // the UI itself calls non-competitive and members who earned no XP at all.
      // Without both conditions the first medal of most accounts would be minted
      // for having done nothing, which is the one thing a medal must never mean.
      pool.query<{ final_rank: number; best: number; won: number }>(
        `with sized as (
           select lm.user_id, lm.final_rank, lm.weekly_xp, l.tier_id,
                  l.capacity_at_creation,
                  count(*) over (partition by lm.league_id) as group_size
             from league_members lm
             join leagues l on l.id = lm.league_id
            where l.status = 'finalized' and lm.final_rank is not null
         )
         -- "best" feeds the two medals (how HIGH you have ever finished);
         -- "won" feeds «جلودار»/«سلطان» (how MANY different tiers you have won).
         -- Both ride the same query on purpose: it already carries the validity
         -- filter every league-rank calculation must have, and a second copy of
         -- that filter is a second place for someone to forget it.
         select s.final_rank, max(t.tier_order)::int as best,
                count(distinct t.tier_order)::int as won
           from sized s join league_tiers t on t.id = s.tier_id
          where s.user_id = $1 and s.weekly_xp > 0
            -- The validity rule, and it must stay the same one league-finalize.ts
            -- decides outcomes by: at or above the floor, OR full — a group
            -- holding its whole tier (capacity is the tier's own population
            -- since 0033). Without the second half the top of the ladder was the
            -- one place a medal could never be minted, however hard it was won.
            and (s.group_size >= $2 or s.group_size >= s.capacity_at_creation)
            and s.final_rank in (1, 2)
          group by s.final_rank`,
        [userId, leagueCfg.min_valid_group_size],
      ),

      // ---- the day sequence, for the comeback test ---------------------------
      pool.query<{ day: string }>(
        `select distinct to_char((created_at at time zone $2)::date, 'YYYY-MM-DD') as day
           from user_activity where user_id = $1 and action = any($3)
          order by 1`,
        [userId, tz, qualifying],
      ),
      pool.query<{ day: string }>(
        `select distinct meta->>'frozen_day' as day
           from user_activity
          where user_id = $1 and action = 'streak_freeze_used'
            and meta ? 'frozen_day'`,
        [userId],
      ),

      getConsumedContentIds(userId),

      // ---- «ستون» — seat among the first paying subscribers -------------------
      // Asked through services/pillar.ts, the same module startPayment prices
      // the renewal discount from, so the wall and the till can never disagree
      // about who holds a seat.
      pillarSeat(userId),

      // ---- granted badges («همراه», …) ----------------------------------------
      // The founder-given class. What is written is the DECISION (one
      // badge_grants row, POST /admin/badges/grant), never the badge — the same
      // move «ستون» makes with the payments ledger — so the badge itself stays
      // derived: each row becomes a `grant:<badge_key>` metric worth 1 and the
      // evaluator's one comparison does the rest. A key nobody granted is
      // simply absent, which reads as 0.
      pool.query<{ badge_key: string }>(
        'select badge_key from badge_grants where user_id = $1',
        [userId],
      ),
    ]);

  // ---- folder breadth + folder completion ---------------------------------
  // Both sides of "complete" come from the same content index the dashboard's
  // progress bars use, so a folder can never read 100% in one place and 90% in
  // the other. Publishing a new item lowers a folder below complete again —
  // deliberate: «فاتح» claims a finished section, and that claim expires.
  const perFolder = new Map<string, number>();
  for (const contentId of consumed) {
    const f = folderOf(contentId);
    perFolder.set(f, (perFolder.get(f) || 0) + 1);
  }
  const folders = getFolders();
  const foldersCompleted = folders.filter(
    (f) => f.total > 0 && (perFolder.get(f.key) || 0) >= f.total,
  ).length;

  const c = counts.rows[0];
  const metrics: Metrics = {
    longest_streak: longestStreak,
    streak_comeback: detectComeback(
      days.rows.map((r) => r.day),
      new Set(frozen.rows.map((r) => r.day).filter(Boolean)),
    ) ? 1 : 0,
    shield_used: c.shield_used,
    episodes_completed: c.episodes_completed,
    articles_completed: c.articles_completed,
    max_content_in_week: busiest.rows[0]?.n ?? 0,
    highlights: c.highlights,
    highlights_with_note: c.highlights_with_note,
    distinct_folders: perFolder.size,
    folders_completed: foldersCompleted,
    archive_read: publishing.rows[0]?.archive ?? 0,
    night_activity: clock.rows[0]?.night ?? 0,
    dawn_activity: clock.rows[0]?.dawn ?? 0,
    weekend_pair: weekend.rows[0]?.n ?? 0,
    early_reads: publishing.rows[0]?.early ?? 0,
    weeks_no_demotion: league.rows[0]?.n ?? 0,
    // How many DIFFERENT tiers this reader has ever finished first in — rank 1
    // only, so the silver medal's row is not counted. Winning «آکریل» three
    // weeks running is one tier, not three: the number can only move by
    // climbing, which is what makes «جلودار» mean what its name says.
    tiers_won: medalRows.rows.find((r) => r.final_rank === 1)?.won ?? 0,
    pathways_completed: c.pathways_completed,
    review_sessions: c.review_sessions,
    collections: c.collections,
    collection_items: c.collection_items,
    shares: c.shares,
    // Inverted by nature (a LOWER signup order is better), so it is settled here
    // and handed on as a plain 0/1 — the evaluator only ever compares >=.
    founder_seat: c.signup_order > 0 && c.signup_order <= FOUNDER_SEATS ? 1 : 0,
    // Same normalisation as founder_seat: a seat NUMBER is inverted by nature,
    // so it becomes a 0/1 here rather than teaching the evaluator a second
    // direction.
    pillar_seat: isPillarSeat(seat) ? 1 : 0,
  };
  // Granted badges, folded in last: `grant:<key>` -> 1 per grant row. Namespaced
  // with the same convention the catalog registers them under (badges.ts,
  // grantMetricOf), so a granted key can never collide with a computed metric.
  for (const g of granted.rows) metrics[grantMetricOf(g.badge_key)] = 1;

  const medals: Record<number, MedalState> = { 1: { best_tier_order: 0 }, 2: { best_tier_order: 0 } };
  for (const row of medalRows.rows) medals[row.final_rank] = { best_tier_order: row.best };

  return { metrics, medals, totals: {} };
}
