import { config } from '../config.js';
import { pool, query, one, withTransaction } from '../db.js';
import { dayInTz } from './time.js';
import { getTiers } from './league.js';

/**
 * Weekly league prize: after finalizeWeek() has written final_rank for a week,
 * grant profiles.tier = 'premium' for 7 days to the top 2 members of the
 * CURRENT highest active tier that actually had members that week — dynamic,
 * walked down from the top, so it is meaningful today (everyone is in acrylic,
 * so this literally rewards the top of the whole league) and automatically
 * narrows to an ever-smaller, more exclusive pool as the platform grows and
 * higher tiers fill up, with no config change ever needed.
 *
 * Idempotent via premium_grants' (user_id, week_start) unique constraint —
 * grantWeeklyPrizes() re-scans a small trailing window every day (like
 * notifyLeagueOutcomes' FRESH_DAYS), so a missed run self-heals the next day.
 */

const GRANT_DAYS = 7;
const WINNERS_PER_WEEK = 2;
/** How far back a finalized week may be and still be worth granting/announcing. */
const FRESH_DAYS = 7;

export interface PendingPremiumGrant { granted_at: string; expires_at: string; }

async function grantPrizeForWeek(weekStart: string, now: Date): Promise<number> {
  return withTransaction(async (client) => {
    const tiers = await getTiers(client);
    const activeByOrderDesc = [...tiers].filter((t) => t.is_active).sort((a, b) => b.tier_order - a.tier_order);

    for (const tier of activeByOrderDesc) {
      const members = (await client.query<{ user_id: string }>(
        `select lm.user_id
           from league_members lm
           join leagues l on l.id = lm.league_id
          where l.tier_id = $1 and l.week_start = $2 and l.status = 'finalized'
          order by lm.weekly_xp desc, lm.first_reached_current_xp_at asc nulls last, lm.id asc
          limit $3`,
        [tier.id, weekStart, WINNERS_PER_WEEK],
      )).rows;

      if (!members.length) continue; // this tier had no finalized group this week — try the next one down

      const expiresAt = new Date(now.getTime() + GRANT_DAYS * 86_400_000).toISOString();
      let granted = 0;
      for (const m of members) {
        const profile = await client.query<{ tier: string }>('select tier from profiles where id = $1', [m.user_id]);
        if (profile.rows[0]?.tier === 'premium') {
          // Already premium: only worth a NEW grant (and a fresh "you won again"
          // banner) if it EXTENDS an existing grant of ours (a repeat winner).
          // Otherwise (a real subscriber/founder) skip — never claim credit for
          // premium status this system did not grant.
          const activeGrant = await client.query<{ n: number }>(
            `select count(*)::int as n from premium_grants
              where user_id = $1 and revoked_at is null and expires_at > $2`,
            [m.user_id, now.toISOString()],
          );
          if ((activeGrant.rows[0]?.n ?? 0) === 0) continue;
        }

        const ins = await client.query(
          `insert into premium_grants (user_id, week_start, expires_at)
           values ($1, $2, $3)
           on conflict (user_id, week_start) do nothing
           returning id`,
          [m.user_id, weekStart, expiresAt],
        );
        if (!ins.rowCount) continue; // already granted for this week (idempotent re-run)

        await client.query("update profiles set tier = 'premium' where id = $1", [m.user_id]);
        granted += 1;
      }
      return granted; // stop at the first (highest) tier that had a finalized group
    }
    return 0;
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
  return one<PendingPremiumGrant>(
    `select granted_at, expires_at from premium_grants
      where user_id = $1 and seen = false and revoked_at is null
      order by granted_at desc limit 1`,
    [userId],
    pool,
  );
}

/** Acknowledge the banner so it stops showing. */
export async function markPremiumGrantSeen(userId: string): Promise<void> {
  await query('update premium_grants set seen = true where user_id = $1 and seen = false', [userId]);
}
