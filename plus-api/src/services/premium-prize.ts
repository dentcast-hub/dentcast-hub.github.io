import { config } from '../config.js';
import { pool, query, one, withTransaction } from '../db.js';
import { dayInTz, addDays, startOfDayInstant } from './time.js';
import { getLeagueConfig } from './league-config.js';

/**
 * Weekly league prize: after finalizeWeek() has written final_rank for a week,
 * grant premium for a few days to the TOP OF EVERY VALID GROUP — up to
 * prize_winners_per_group of them, scaled down in groups too small to carry that
 * many (see winnersTarget below).
 *
 * Group-level, not tier-level, and that is the whole point. The rule used to
 * stop at the highest tier that had a finalized group, which meant the week any
 * single user reached amalgam, every remaining acrylic player — the large
 * majority — became permanently ineligible. A reward nobody in the bottom tier
 * can reach is worst precisely for the cohort that churns. The league UI also
 * only ever shows a user their own group of 8, so "first in your group" is a
 * target they can actually see, while "first in your whole tier" is not.
 *
 * A winner then sits out prize_cooldown_weeks. That is deliberately a COOLDOWN
 * and not a lifetime cap: a cap ("you may win twice, ever") punishes success by
 * permanently stripping the reward from the most engaged users, whereas a
 * cooldown never says "never again" — and because the prize passes DOWN to the
 * next eligible member while the winner sits out, it rotates through roughly
 * three different people per group instead of one, at no extra cost.
 *
 * Idempotent via premium_grants' (user_id, week_start) unique constraint —
 * grantWeeklyPrizes() re-scans a small trailing window every day (like
 * notifyLeagueOutcomes' FRESH_DAYS), so a missed run self-heals the next day.
 */

/** How far back a finalized week may be and still be worth granting/announcing. */
const FRESH_DAYS = 7;

export interface PendingPremiumGrant {
  granted_at: string;
  expires_at: string;
  /** So the banner can say when they may win again, instead of leaving a winner
   *  who earns nothing next week to conclude the league is broken. */
  cooldown_weeks: number;
}

async function grantPrizeForWeek(weekStart: string, now: Date): Promise<number> {
  return withTransaction(async (client) => {
    const cfg = await getLeagueConfig(client);

    // Both ends of a grant are anchored to Tehran midnight, not to the instant
    // this sweep happened to reach them.
    //
    // Wall-clock arithmetic (`now + prize_days × 86_400_000`) made the prize
    // length a race between two scheduler runs. The granting run does the heavy
    // week finalization first, so its `now` lands a few seconds INTO 00:00; the
    // expiring run prize_days later has no week to finalize and reaches its own
    // `now` sooner. `expires_at <= now` then missed by those seconds and, since
    // nothing expires lazily on read, the winner kept premium until the NEXT
    // midnight — a whole extra day, decided by which job was quicker.
    //
    // Midnight-to-midnight is exact, and it is also the honest reading of the
    // promise: the winner banner and the push both say «N روز», which a reader
    // understands as N calendar days ending at midnight, not as N × 24 hours
    // from whenever a cron woke up.
    const grantDay = dayInTz(now, config.streakTimezone);
    const grantedAt = startOfDayInstant(grantDay).toISOString();
    const expiresAt = startOfDayInstant(addDays(grantDay, cfg.prize_days)).toISOString();
    // A winner is ineligible for this many LEAGUE WEEKS. Measured against
    // week_start, not the grant's wall-clock timestamp: the unit of the league
    // is the week, so "two weeks off" should mean two league weeks regardless of
    // when in the day the sweep happened to run, or how long the grant lasted.

    // Every finalized group big enough for "first place" to mean something.
    //
    // This floor is prize_min_group_size (3), NOT the min_valid_group_size (6)
    // that gates promotion — deliberately different questions. Six is right for
    // deciding who changes tier; but gating the prize on it created a dead end,
    // because finalizeWeek also refuses to promote out of an undersized group.
    // A user who climbed into a thin upper tier could then neither win nor
    // advance, while the group they left kept winning every week — climbing made
    // them worse off. Three, not zero: a group of one would auto-win for nothing.
    const groups = (await client.query<{ id: string; size: number }>(
      `select l.id, count(lm.id)::int as size
         from leagues l
         join league_members lm on lm.league_id = l.id
        where l.week_start = $1 and l.status = 'finalized'
        group by l.id
       having count(lm.id) >= $2
        order by l.id`,
      [weekStart, cfg.prize_min_group_size],
    )).rows;

    let granted = 0;
    for (const g of groups) {
      // How many winners THIS group may have. prize_winners_per_group is a
      // ceiling, not a quota: it is scaled down by how many whole
      // prize_min_group_size blocks the group actually contains.
      //
      // A flat count breaks in exactly the place the prize matters most. Upper
      // tiers hold few people, so their groups never reach capacity — with a
      // flat 2, a composite group of 3 would crown 2 of its 3 members, and
      // "first in your group" would mean less the higher you climbed. Scaling
      // keeps the ratio roughly constant instead: 3-5 members award 1, 6+ award
      // 2, and a full 15-member group is still held to the configured ceiling.
      //
      // The HAVING above already guarantees size >= prize_min_group_size, so
      // the floor division is always >= 1 and no group that qualified for the
      // prize can end up with zero winners.
      const winnersTarget = Math.min(
        cfg.prize_winners_per_group,
        Math.floor(g.size / cfg.prize_min_group_size),
      );

      // Ranked members of this group. We walk down rather than taking the top N
      // outright: a member on cooldown passes the prize DOWN to the next one,
      // instead of the group silently awarding nothing that week.
      const members = (await client.query<{ user_id: string }>(
        `select lm.user_id
           from league_members lm
          where lm.league_id = $1
          order by lm.weekly_xp desc, lm.first_reached_current_xp_at asc nulls last, lm.id asc`,
        [g.id],
      )).rows;

      // Winners this group ALREADY has for the week. Without this the sweep is
      // not idempotent: the per-user unique constraint stops one person being
      // granted twice, but the pass-down would hand the prize to the next member
      // on every re-run, walking premium through the whole group in a week.
      const existing = (await client.query<{ n: number }>(
        `select count(*)::int as n
           from premium_grants g
           join league_members lm on lm.user_id = g.user_id and lm.week_start = g.week_start
          where lm.league_id = $1 and g.week_start = $2`,
        [g.id, weekStart],
      )).rows[0]?.n ?? 0;

      let winnersHere = existing;
      for (const m of members) {
        if (winnersHere >= winnersTarget) break;

        // Cooldown: won recently enough that it is somebody else's turn.
        if (cfg.prize_cooldown_weeks > 0) {
          const recent = await client.query<{ n: number }>(
            `select count(*)::int as n from premium_grants
              where user_id = $1
                and week_start > ($2::date - ($3::int * 7))
                and week_start < $2::date`,
            [m.user_id, weekStart, cfg.prize_cooldown_weeks],
          );
          if ((recent.rows[0]?.n ?? 0) > 0) continue;
        }

        const profile = await client.query<{ tier: string }>('select tier from profiles where id = $1', [m.user_id]);
        if (profile.rows[0]?.tier === 'premium') {
          // Already premium. Skip ONLY if that premium is not ours to extend —
          // a real subscriber or a manual founder override — because claiming
          // credit for it would show a "you won premium!" banner to someone who
          // already had it, and burn the group's prize on a no-op.
          //
          // Any grant history at all (even an expired one) means this IS our
          // premium: the daily sweep grants before it expires, so a past
          // winner can still be sitting on a grant that has run out but not yet
          // been reverted. Reading that as "a real subscriber" would lock them
          // out of ever winning again.
          const ours = await client.query<{ n: number }>(
            'select count(*)::int as n from premium_grants where user_id = $1',
            [m.user_id],
          );
          if ((ours.rows[0]?.n ?? 0) === 0) continue;
        }

        // granted_at comes from the SAME day boundary expires_at was derived
        // from, rather than from the database clock or the sweep's own instant.
        // The winner banner shows the prize length as the difference between the
        // two, so the pair has to be internally consistent — and anchored, their
        // difference is exactly prize_days whole days instead of that minus
        // however long the finalization ahead of it took.
        const ins = await client.query(
          `insert into premium_grants (user_id, week_start, granted_at, expires_at)
           values ($1, $2, $3, $4)
           on conflict (user_id, week_start) do nothing
           returning id`,
          [m.user_id, weekStart, grantedAt, expiresAt],
        );
        if (!ins.rowCount) continue; // already granted for this week (idempotent re-run)

        // Writer 2 of the three sanctioned `profiles.tier` writers (the contract
        // is stated in full atop services/subscription.ts). Upward only: the
        // grant row is the authority, this just projects it.
        await client.query("update profiles set tier = 'premium' where id = $1", [m.user_id]);
        granted += 1;
        winnersHere += 1;
      }
    }
    return granted;
  });
}

/** Daily driver: grant the prize for every recently-finalized week not yet processed. */
export async function grantWeeklyPrizes(now: Date = new Date()): Promise<{ granted: number }> {
  const today = dayInTz(now, config.streakTimezone);
  const weeks = await query<{ week_start: string }>(
    `select distinct week_start from leagues
      where status = 'finalized' and week_end >= ($1::date - $2::int)
      order by week_start`,
    [today, FRESH_DAYS],
  );
  let granted = 0;
  for (const w of weeks.rows) granted += await grantPrizeForWeek(w.week_start, now);
  return { granted };
}

/**
 * Daily driver: revert an expired grant's tier back to 'free', UNLESS the same
 * user holds a newer, still-active grant (a repeat winner's premium just
 * extends) or an active real subscription (never true today, but checked so
 * this never regresses a real paying/founder account once payment ships).
 */
export async function expirePremiumPrizes(now: Date = new Date()): Promise<{ expired: number }> {
  const nowIso = now.toISOString();
  const rows = await query<{ id: string; user_id: string }>(
    `select g.id, g.user_id from premium_grants g
      where g.revoked_at is null and g.expires_at <= $1
        and not exists (
          select 1 from premium_grants g2
           where g2.user_id = g.user_id and g2.revoked_at is null and g2.expires_at > $1
        )`,
    [nowIso],
  );

  let expired = 0;
  for (const r of rows.rows) {
    await withTransaction(async (client) => {
      await client.query('update premium_grants set revoked_at = $2 where id = $1', [r.id, nowIso]);
      const sub = await client.query<{ n: number }>(
        `select count(*)::int as n from subscriptions
          where user_id = $1 and status = 'active' and (expires_at is null or expires_at > $2)`,
        [r.user_id, nowIso],
      );
      if ((sub.rows[0]?.n ?? 0) === 0) {
        await client.query("update profiles set tier = 'free' where id = $1 and tier = 'premium'", [r.user_id]);
      }
    });
    expired += 1;
  }
  return { expired };
}

/** The caller's own unseen, still-active grant (for GET /me), or null. */
export async function getPendingPremiumGrant(userId: string): Promise<PendingPremiumGrant | null> {
  const row = await one<{ granted_at: string; expires_at: string }>(
    `select granted_at, expires_at from premium_grants
      where user_id = $1 and seen = false and revoked_at is null
      order by granted_at desc limit 1`,
    [userId],
    pool,
  );
  if (!row) return null;
  const cfg = await getLeagueConfig();
  return { ...row, cooldown_weeks: cfg.prize_cooldown_weeks };
}

/** Acknowledge the banner so it stops showing. */
export async function markPremiumGrantSeen(userId: string): Promise<void> {
  await query('update premium_grants set seen = true where user_id = $1 and seen = false', [userId]);
}
