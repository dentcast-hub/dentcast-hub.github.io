import type pg from 'pg';
import { pool } from '../db.js';
import { dayInTz, weekStartSaturday, nextDay } from './time.js';
import { SCORING_ACTIONS } from './score.js';
import { getLeagueConfig } from './league-config.js';

/**
 * League core: week boundaries, tier lookup, weekly-group placement, and the XP
 * hook wired into recordActivity. Ranking is always inside one small weekly group;
 * nothing here is global. weekly_xp lives on the membership row and is the ONLY
 * league-ranking quantity — it never touches the spendable points balance.
 *
 * Week = the Iranian week (Saturday start), matching the site's streak logic.
 */

type Db = pg.Pool | pg.PoolClient;

export interface Tier { id: string; slug: string; name_fa: string; tier_order: number; is_active: boolean; }

export interface LeagueWeek { week_start: string; week_end: string; }

/** The Saturday-anchored week containing `day` ('YYYY-MM-DD'). */
export function leagueWeek(day: string): LeagueWeek {
  const week_start = weekStartSaturday(day);
  let week_end = week_start;
  for (let i = 0; i < 6; i += 1) week_end = nextDay(week_end);
  return { week_start, week_end };
}

/** The league week for an instant, in the configured timezone. */
export async function leagueWeekForInstant(instant: Date, db: Db = pool): Promise<LeagueWeek> {
  const cfg = await getLeagueConfig(db);
  return leagueWeek(dayInTz(instant, cfg.timezone));
}

export async function getTiers(db: Db = pool): Promise<Tier[]> {
  const res = await db.query<Tier>(
    'select id, slug, name_fa, tier_order, is_active from league_tiers order by tier_order',
  );
  return res.rows;
}

/** Resolve the user's tier id, treating NULL as (and healing it to) acrylic. */
export async function effectiveTierId(client: pg.PoolClient, userId: string): Promise<string> {
  const r = await client.query<{ current_tier_id: string | null }>(
    'select current_tier_id from profiles where id = $1', [userId],
  );
  const tid = r.rows[0]?.current_tier_id ?? null;
  if (tid) return tid;
  const acr = await client.query<{ id: string }>("select id from league_tiers where slug = 'acrylic'");
  const acrId = acr.rows[0]!.id;
  await client.query('update profiles set current_tier_id = $2 where id = $1', [userId, acrId]);
  return acrId;
}

/**
 * Get the current open group for (tier, week), or create one. Capacity is frozen
 * at creation from group_size_current. A full group is closed and the next open
 * one is created — enforced single-open by the partial unique index, so this is
 * race-safe (a lost create just re-selects the winner).
 */
export async function getOrCreateOpenLeague(
  client: pg.PoolClient, tierId: string, weekStart: string, weekEnd: string, capacity: number,
): Promise<{ id: string; capacity_at_creation: number }> {
  // Bounded loop: at most a handful of "close full -> make next" hops.
  for (let i = 0; i < 50; i += 1) {
    const open = await client.query<{ id: string; capacity_at_creation: number }>(
      `select id, capacity_at_creation from leagues
        where tier_id = $1 and week_start = $2 and status = 'open'
        for update`,
      [tierId, weekStart],
    );
    if (open.rows[0]) {
      const lg = open.rows[0];
      const cnt = await client.query<{ n: number }>(
        'select count(*)::int as n from league_members where league_id = $1', [lg.id],
      );
      if ((cnt.rows[0]?.n ?? 0) < lg.capacity_at_creation) return lg;
      await client.query("update leagues set status = 'closed' where id = $1", [lg.id]);
      continue; // make/find the next open group
    }
    const created = await client.query<{ id: string; capacity_at_creation: number }>(
      `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
       values ($1, $2, $3, 'open', $4)
       on conflict (tier_id, week_start) where status = 'open' do nothing
       returning id, capacity_at_creation`,
      [tierId, weekStart, weekEnd, capacity],
    );
    if (created.rows[0]) return created.rows[0];
    // lost the create race -> loop and select the now-existing open group
  }
  throw new Error('getOrCreateOpenLeague: exceeded group-creation attempts');
}

/**
 * XP hook, called from recordActivity for every SCORING action in the SAME
 * transaction. Per-action weekly_xp (rewards depth, resists highlight-farming);
 * ALL weights live in league_config. Separate from the all-time score (score.ts),
 * which is unchanged. The user JOINS a weekly group on their first XP of the week.
 * first_reached_current_xp_at is set to the event time on every change (tie-break:
 * whoever reached a given total earlier ranks higher).
 *
 *   xp_active_bonus  — first scoring action of the Tehran day
 *   xp_read          — article_completed, ONCE per (content, week)
 *   xp_listen        — episode_listened, ONCE per (content, week)
 *   xp_highlight     — per highlight_created, capped xp_highlight_cap per (content, week)
 *   xp_review        — card_reviewed_manual / review_finished
 */
export async function awardLeagueXp(
  client: pg.PoolClient, userId: string, action: string, contentId: string | null, createdAt: Date,
): Promise<void> {
  if (!SCORING_ACTIONS.includes(action)) return;
  const cfg = await getLeagueConfig(client);
  const tz = cfg.timezone;
  const day = dayInTz(createdAt, tz);
  const { week_start, week_end } = leagueWeek(day);

  let xpDelta = 0;

  // Daily active bonus — first scoring action of this Tehran day (the current row
  // is already inserted in this tx, so a count of 1 means it's the first).
  const dayCount = await client.query<{ n: number }>(
    `select count(*)::int as n from user_activity
      where user_id = $1 and action = any($2)
        and (created_at at time zone $3)::date = $4::date`,
    [userId, SCORING_ACTIONS, tz, day],
  );
  if ((dayCount.rows[0]?.n ?? 0) <= 1) xpDelta += cfg.xp_active_bonus;

  // How many times this exact (action, content) already happened this week
  // (including the just-inserted row).
  const weekCount = async (act: string): Promise<number> => {
    const r = await client.query<{ n: number }>(
      `select count(*)::int as n from user_activity
        where user_id = $1 and action = $2 and content_id is not distinct from $3
          and (created_at at time zone $4)::date between $5::date and $6::date`,
      [userId, act, contentId, tz, week_start, week_end],
    );
    return r.rows[0]?.n ?? 0;
  };

  if (action === 'article_completed') {
    if (contentId && (await weekCount(action)) <= 1) xpDelta += cfg.xp_read;
  } else if (action === 'episode_listened') {
    if (contentId && (await weekCount(action)) <= 1) xpDelta += cfg.xp_listen;
  } else if (action === 'highlight_created') {
    if (contentId && (await weekCount(action)) <= cfg.xp_highlight_cap) xpDelta += cfg.xp_highlight;
  } else if (action === 'card_reviewed_manual' || action === 'review_finished') {
    xpDelta += cfg.xp_review;
  }

  if (xpDelta <= 0) return;

  // Already in a group this week? Just add XP (keep them in their original group).
  const existing = await client.query<{ id: string }>(
    'select id from league_members where user_id = $1 and week_start = $2', [userId, week_start],
  );
  if (existing.rows[0]) {
    await client.query(
      `update league_members
          set weekly_xp = weekly_xp + $2, first_reached_current_xp_at = $3
        where user_id = $1 and week_start = $4`,
      [userId, xpDelta, createdAt, week_start],
    );
    return;
  }

  // First XP of the week -> place into an open group of the user's current tier.
  const tierId = await effectiveTierId(client, userId);
  const league = await getOrCreateOpenLeague(client, tierId, week_start, week_end, cfg.group_size_current);
  await client.query(
    `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
     values ($1, $2, $3, $4, $5)
     on conflict (user_id, week_start) do update
       set weekly_xp = league_members.weekly_xp + excluded.weekly_xp,
           first_reached_current_xp_at = excluded.first_reached_current_xp_at`,
    [league.id, userId, week_start, xpDelta, createdAt],
  );
}
