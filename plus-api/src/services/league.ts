import type pg from 'pg';
import { pool } from '../db.js';
import { dayInTz, weekStartSaturday, nextDay } from './time.js';
import { SCORING_ACTIONS, SHARE_ACTION, CONSUMPTION_ACTIONS } from './score.js';
import { getLeagueConfig, type LeagueConfig } from './league-config.js';
import { getPathways } from '../pathways.js';

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
 *   3. A WEEKLY CAP on how many distinct articles pay at all — available, and
 *      currently OFF (`xp_share_weekly_cap = 0`, migration 0028). It shipped at
 *      five, which against xp_read = 5 made a whole week of sharing worth one
 *      article read: too small to be an incentive for the one action here that
 *      brings somebody new to the site. Zero means no cap and the guard below
 *      reads it that way, so the knob survives for the day this needs reining
 *      in. What still bounds it is rules 1 and 2: the ceiling is articles you
 *      have actually finished, counted once each.
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
 * The premium-only actions that pay league XP (migration 0030). None of them is
 * a scoring action — they touch neither the streak nor the all-time score, and
 * that separation is the point: these buy a place in a WEEKLY ranking, not a
 * claim about having studied.
 *
 * Each is a real act performed on a `requirePremium` route, so the gate is
 * structural. `compass_viewed` and `assistant_step` are deliberately absent —
 * see migration 0030 for why (a page load, and our own inference bill).
 */
export const PREMIUM_XP_ACTIONS = ['pathway_enrolled', 'collection_created', 'collection_item_added'];

/**
 * Does this account have premium ACCESS right now — the same question
 * `requirePremium` asks, answered from the same column.
 *
 * Deliberately NOT `user_activity.premium`, the stamp activity.ts writes beside
 * every row, even though that is the newer and more precise-looking signal. The
 * stamp reads `subscriptions`, so it means "was this earned on a PAID plan",
 * which is exactly right for the all-time score (score.ts calls its multiplier
 * "the subscription perk") and exactly wrong here. A league prize winner holds
 * premium through `premium_grants`, with no subscription row at all: gating on
 * the stamp would hand them the pathways and the boards for two days — the
 * routes read `profiles.tier` — and then pay nothing for using either. A perk
 * that silently earns zero is worse than a perk that is not offered.
 *
 * `profiles.tier` is the projection of every way to hold premium (subscription,
 * prize, founder override; the three sanctioned writers are listed atop
 * services/subscription.ts) and the daily sweep reconciles it against the
 * calendar, so a lapsed subscriber stops earning here within the day.
 */
async function hasPremiumAccess(client: pg.PoolClient, userId: string): Promise<boolean> {
  const r = await client.query<{ tier: string }>('select tier from profiles where id = $1', [userId]);
  return r.rows[0]?.tier === 'premium';
}

/**
 * Is this consumed page a step of a pathway the reader is ENROLLED in, and if
 * so is there room under the weekly ceiling? Returns the bonus, or nothing.
 *
 * Paid ON TOP of xp_read/xp_listen and only from inside their once-per-(content,
 * week) guard, so the bonus inherits that rule for free — re-reading a step
 * pays neither the read nor the bonus a second time.
 *
 * Enrolment is required even though `computeProgress` gives browsing credit for
 * items consumed before enrolling (routes/pathways.ts). Progress is a generous
 * display; XP is a claim against other people's ranking, and "an article that
 * happens to sit in some pathway" is most of the library. What is being paid
 * for here is following a curriculum you chose.
 *
 * The ceiling counts distinct (action, content) pairs, NOT distinct contents:
 * a NoteCast that is both read and heard pays xp_read and xp_listen separately,
 * so it earns the bonus twice, and a ceiling that collapsed the pair would let
 * the reader take a third payment it had already counted as one.
 */
async function pathwayStepXp(
  client: pg.PoolClient, cfg: LeagueConfig,
  userId: string, contentId: string, tz: string, weekStart: string, weekEnd: string,
): Promise<number> {
  if (cfg.xp_pathway_step <= 0) return 0;

  const enrolled = await client.query<{ pathway_id: string }>(
    'select pathway_id from user_pathways where user_id = $1', [userId],
  );
  if (enrolled.rows.length === 0) return 0;

  const ids = new Set(enrolled.rows.map((r) => r.pathway_id));
  const steps = new Set<string>();
  for (const p of getPathways()) {
    if (ids.has(p.id)) for (const s of p.steps) steps.add(s.content_id);
  }
  if (!steps.has(contentId)) return 0;
  // Checked last of the cheap-to-narrow conditions: most readers are enrolled in
  // nothing and never reach it, and it is one query where the two above are a
  // query and a set lookup.
  if (!(await hasPremiumAccess(client, userId))) return 0;

  if (cfg.xp_pathway_step_weekly_cap > 0) {
    // Every consumption this week, deduplicated the same way it was paid. The
    // just-inserted row is in here, so `paid` counts this bonus too.
    const r = await client.query<{ action: string; content_id: string }>(
      `select distinct action, content_id from user_activity
        where user_id = $1 and action = any($2) and content_id is not null
          and (created_at at time zone $3)::date between $4::date and $5::date`,
      [userId, CONSUMPTION_ACTIONS, tz, weekStart, weekEnd],
    );
    const paid = r.rows.filter((x) => steps.has(x.content_id)).length;
    if (paid > cfg.xp_pathway_step_weekly_cap) return 0;
  }
  return cfg.xp_pathway_step;
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
 * and the premium earning paths (migration 0030), each capped per week:
 *
 *   xp_pathway_step       — a consumed page that is a step of an ENROLLED pathway,
 *                           added on top of xp_read/xp_listen (pathwayStepXp above)
 *   xp_pathway_enrolled   — starting a pathway
 *   xp_collection_created — opening a board
 *   xp_collection_item    — pinning to a board, ONCE per (page, week)
 *
 * `content_shared` and the three PREMIUM_XP_ACTIONS are the actions that reach
 * here without being scoring actions (see SHARE_ACTION in score.ts for why the
 * share must never join that set; the premium three stay out for the same
 * reason — none of them is an act of study). So every step below that speaks
 * for "a study action happened" is guarded on `isScoring`. In particular the
 * daily active bonus: it counts SCORING rows for the day, so an unguarded share
 * on an otherwise-idle day would find a count of zero, read that as "first
 * action of the day", and hand out xp_active_bonus for a tap — buying with one
 * second what the bonus exists to pay for showing up.
 *
 * Every 0030 payment is gated on hasPremiumAccess (see it for which notion of
 * "premium" that is, and why it is not the row stamp). For the three premium
 * actions the check is near-redundant — their routes are `requirePremium` — but
 * recordActivity is a public function and the gate belongs where the payment
 * is. What it really decides is the pathway bonus, which rides on
 * `article_completed`, an action free readers perform constantly.
 */
export async function awardLeagueXp(
  client: pg.PoolClient, userId: string, action: string, contentId: string | null, createdAt: Date,
): Promise<void> {
  const isScoring = SCORING_ACTIONS.includes(action);
  const isPremiumPath = PREMIUM_XP_ACTIONS.includes(action);
  if (!isScoring && action !== SHARE_ACTION && !isPremiumPath) return;
  if (isPremiumPath && !(await hasPremiumAccess(client, userId))) return;
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

  /**
   * How many times this action happened this week REGARDLESS of content — the
   * unit the 0030 ceilings are counted in. Separate from weekCount() because
   * the two ask different questions of the same log: `collection_item_added`
   * needs both ("once for this page" AND "at most five pages a week"), and
   * `collection_created` carries no content at all, so weekCount's
   * `is not distinct from null` would answer the per-week question by accident
   * rather than by intent.
   */
  const weekActionCount = async (act: string, distinctContent = false): Promise<number> => {
    const r = await client.query<{ n: number }>(
      `select ${distinctContent ? 'count(distinct content_id)' : 'count(*)'}::int as n
         from user_activity
        where user_id = $1 and action = $2
          and (created_at at time zone $3)::date between $4::date and $5::date`,
      [userId, act, tz, week_start, week_end],
    );
    return r.rows[0]?.n ?? 0;
  };

  /**
   * The same weekly count across SEVERAL actions at once.
   *
   * Review needs it: `card_reviewed_manual` (free) and `review_finished`
   * (premium) are the same act on two plans, so they must share one ceiling —
   * counting them apart would just hand anyone holding both a doubled lane.
   * The current row is already inserted when this runs, so the comparison is
   * `<= cap` and the Nth review of the week is the last one that pays.
   */
  const weekActionCountAny = async (acts: string[]): Promise<number> => {
    const r = await client.query<{ n: number }>(
      `select count(*)::int as n from user_activity
        where user_id = $1 and action = any($2)
          and (created_at at time zone $3)::date between $4::date and $5::date`,
      [userId, acts, tz, week_start, week_end],
    );
    return r.rows[0]?.n ?? 0;
  };

  /**
   * A 0030 weight, if its weekly ceiling still has room. Zero cap = no cap.
   *
   * `distinctContent` has to match how the action is PAID, or the ceiling
   * counts rows that earned nothing. `collection_item_added` is the case: it is
   * written on the idempotent re-pin too, so ten rows for one page is one
   * payment — counted flat, a reader who re-pinned a single article would
   * exhaust their week without having been given a thing.
   */
  const capped = async (act: string, weight: number, cap: number, distinctContent = false): Promise<number> => {
    if (weight <= 0) return 0;
    if (cap > 0 && (await weekActionCount(act, distinctContent)) > cap) return 0;
    return weight;
  };

  if (action === 'article_completed') {
    if (contentId && (await weekCount(action)) <= 1) {
      xpDelta += cfg.xp_read;
      xpDelta += await pathwayStepXp(client, cfg, userId, contentId, tz, week_start, week_end);
    }
  } else if (action === 'episode_listened') {
    if (contentId && (await weekCount(action)) <= 1) {
      xpDelta += cfg.xp_listen;
      xpDelta += await pathwayStepXp(client, cfg, userId, contentId, tz, week_start, week_end);
    }
  } else if (action === 'pathway_enrolled') {
    xpDelta += await capped(action, cfg.xp_pathway_enrolled, cfg.xp_pathway_enrolled_weekly_cap);
  } else if (action === 'collection_created') {
    xpDelta += await capped(action, cfg.xp_collection_created, cfg.xp_collection_created_weekly_cap);
  } else if (action === 'collection_item_added') {
    // Two guards, and both are load-bearing. POST /collections/:id/items records
    // an activity row on the idempotent-replay path too (it upserts so RETURNING
    // still yields a row), and the same highlight can be pinned to many boards —
    // so without the per-content check, re-pinning would print XP. The ceiling
    // then bounds the honest version of the same act: pinning is one tap.
    if (contentId && (await weekCount(action)) <= 1) {
      xpDelta += await capped(action, cfg.xp_collection_item, cfg.xp_collection_item_weekly_cap, true);
    }
  } else if (action === 'highlight_created') {
    if (contentId && (await weekCount(action)) <= cfg.xp_highlight_cap) xpDelta += cfg.xp_highlight;
  } else if (action === 'card_reviewed_manual' || action === 'review_finished') {
    // Capped since 2026-08-08, and it is the ONLY path that ever ran without a
    // bound. `card_reviewed_manual` reaches this from POST /activity, which by
    // design only appends a log row — no card, no highlight, no state of any
    // kind is required — so an unbounded weight here was league XP (and
    // all-time score, which buys streak shields) available in a loop.
    //
    // The two actions share one ceiling on purpose: they are the same act on
    // two plans, and counting them separately would just double the lane for
    // anyone holding both.
    if (cfg.xp_review > 0) {
      const reviewsThisWeek = await weekActionCountAny(['card_reviewed_manual', 'review_finished']);
      const cap = cfg.xp_review_weekly_cap;
      if (cap <= 0 || reviewsThisWeek <= cap) xpDelta += cfg.xp_review;
    }
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
