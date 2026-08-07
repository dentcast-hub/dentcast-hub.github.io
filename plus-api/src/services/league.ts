import type pg from 'pg';
import { pool } from '../db.js';
import { dayInTz, weekStartSaturday, nextDay } from './time.js';
import { SCORING_ACTIONS, SHARE_ACTION } from './score.js';
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
 * How much a share of `contentId` is worth right now: `xp_share`, or nothing.
 *
 * Three conditions, all derived from the activity log itself — no "was this one
 * paid" column exists, and none is needed, because each condition is a question
 * the log can answer the same way today and on a rebuild a year from now.
 *
 *   1. THE READ GATE. The share only counts if the reader already finished this
 *      article. Nothing outside can verify a share — navigator.share() resolves
 *      on a dismissed sheet on some platforms and the clipboard fallback reports
 *      nothing — so what we are really paying for is a button press: one tap,
 *      no dwell, endlessly repeatable. Requiring the finish first makes the
 *      cheap act inherit the expensive one's cost (30s–4min of measured visible
 *      time, see plus/js/reading.js) and it is also the only version of this
 *      rule that means something true: you can pass on what you have read.
 *
 *      Which is why eligibility is judged by TIME, not by mere existence: a
 *      share only counts if it happened at or after the finish. Otherwise
 *      sharing an article mid-read would burn that article's one slot for the
 *      week, and finishing it ten minutes later would pay nothing — a rule
 *      nobody could be told with a straight face.
 *
 *   2. ONCE PER (content, week), exactly like xp_read. Sending the same page to
 *      a second messenger is the same act, not a second one.
 *
 *   3. A WEEKLY CAP on how many distinct articles pay at all. Even at 1 XP an
 *      uncapped tap is a lane; capped, a whole week of sharing is worth about
 *      one article read, which is the size this deserves to be.
 */
async function shareXp(
  client: pg.PoolClient, cfg: { xp_share: number; xp_share_weekly_cap: number },
  userId: string, contentId: string | null, tz: string, weekStart: string, weekEnd: string,
): Promise<number> {
  if (!contentId || cfg.xp_share <= 0) return 0;

  // One round trip answers both counts. `eligible` is every share this reader
  // made this week that came after finishing its article — the just-inserted row
  // included, so `this_content` is 1 exactly when the current share is the first
  // eligible one for this page.
  const r = await client.query<{ this_content: number; contents_paid: number }>(
    `with eligible as (
       select s.content_id
         from user_activity s
         join lateral (
           select min(r.created_at) as read_at from user_activity r
            where r.user_id = s.user_id and r.action = 'article_completed'
              and r.content_id = s.content_id
         ) rd on true
        where s.user_id = $1 and s.action = $2 and s.content_id is not null
          and rd.read_at is not null and s.created_at >= rd.read_at
          and (s.created_at at time zone $3)::date between $4::date and $5::date
     )
     select (select count(*)::int from eligible where content_id = $6)  as this_content,
            (select count(distinct content_id)::int from eligible)      as contents_paid`,
    [userId, SHARE_ACTION, tz, weekStart, weekEnd, contentId],
  );
  const { this_content: thisContent, contents_paid: contentsPaid } = r.rows[0]
    ?? { this_content: 0, contents_paid: 0 };

  if (thisContent === 0) return 0;      // not read yet — the gate
  if (thisContent > 1) return 0;        // already paid for this page this week
  if (cfg.xp_share_weekly_cap > 0 && contentsPaid > cfg.xp_share_weekly_cap) return 0;
  return cfg.xp_share;
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
 *   xp_share         — content_shared, gated + capped (shareXp above)
 *
 * `content_shared` is the ONE action that reaches here without being a scoring
 * action (see SHARE_ACTION in score.ts for why it must never join that set), so
 * every step below that speaks for "a study action happened" is guarded on
 * `isScoring`. In particular the daily active bonus: it counts SCORING rows for
 * the day, so an unguarded share on an otherwise-idle day would find a count of
 * zero, read that as "first action of the day", and hand out xp_active_bonus for
 * a tap — buying with one second what the bonus exists to pay for showing up.
 */
export async function awardLeagueXp(
  client: pg.PoolClient, userId: string, action: string, contentId: string | null, createdAt: Date,
): Promise<void> {
  const isScoring = SCORING_ACTIONS.includes(action);
  if (!isScoring && action !== SHARE_ACTION) return;
  const cfg = await getLeagueConfig(client);
  const tz = cfg.timezone;
  const day = dayInTz(createdAt, tz);
  const { week_start, week_end } = leagueWeek(day);

  let xpDelta = 0;

  // Daily active bonus — first scoring action of this Tehran day (the current row
  // is already inserted in this tx, so a count of 1 means it's the first).
  if (isScoring) {
    const dayCount = await client.query<{ n: number }>(
      `select count(*)::int as n from user_activity
        where user_id = $1 and action = any($2)
          and (created_at at time zone $3)::date = $4::date`,
      [userId, SCORING_ACTIONS, tz, day],
    );
    if ((dayCount.rows[0]?.n ?? 0) <= 1) xpDelta += cfg.xp_active_bonus;
  }

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
  } else if (action === SHARE_ACTION) {
    xpDelta += await shareXp(client, cfg, userId, contentId, tz, week_start, week_end);
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
