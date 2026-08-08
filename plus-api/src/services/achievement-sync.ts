import { config } from '../config.js';
import { pool, query, one, withTransaction } from '../db.js';
import { getBadgeCatalog, evaluateBadge } from '../badges.js';
import { getPathways } from '../pathways.js';
import { getTiers } from './league.js';
import { computeAchievementFacts, type AchievementFacts } from './achievements.js';
import { recordInAppNotice } from './notices.js';
import { dayInTz } from './time.js';

/**
 * Turning a DERIVED badge wall into something that can announce itself.
 *
 * The wall stores nothing — every one of the 21 metrics is computed at read time
 * from data the product already keeps, which is what makes it retroactive and
 * what stops an `earned_at` column from ever disagreeing with the log it came
 * from (services/achievements.ts says all of this at length). The cost of that
 * design is the thing this file exists to pay: because nothing is written, no
 * code anywhere can know a badge was *just* earned.
 *
 * So one thing is written, and it is carefully not the badge. What
 * `achievement_announcements` holds is a record of what we have already TOLD
 * this reader — a ledger of announcements, not of achievements. Three rules keep
 * it from becoming the second source of truth the original design ruled out:
 *
 *   · The wall never reads it. GET /achievements is untouched and still derives
 *     everything, so the two cannot drift because they answer different
 *     questions ("what is true" vs "what have we said").
 *   · It is a HIGH-WATER MARK. A badge can go dark again — «فاتح» un-earns
 *     itself the moment a publish drops a folder below complete — and the stored
 *     level only ever rises, so re-earning is silent. Without that, one publish
 *     would re-announce a badge to everyone who had it.
 *   · Nothing here is retroactive. See seedSilently below: that is the whole
 *     go-live story and it is the difference between shipping this and handing
 *     every existing reader a hundred notifications on the same afternoon.
 */

/**
 * How long a sync stays fresh. A reading session is twenty qualifying actions
 * and deriving 21 metrics twenty times over would be a load problem we gave
 * ourselves; a badge announced four minutes late is not a product problem at
 * all, since it is delivered to a surface the reader visits when they choose.
 */
const DEBOUNCE_MS = 5 * 60 * 1000;

/** A medal's ledger key. Namespaced so it can never collide with a badge key. */
const medalKey = (key: string): string => `medal:${key}`;

interface LedgerRow { badge_key: string; level: number }

/** What the wall currently says, flattened to (key -> level) for comparison. */
async function currentState(
  userId: string,
  facts: AchievementFacts,
): Promise<Map<string, { level: number; title: string; body: string }>> {
  const catalog = getBadgeCatalog();
  const totals: Record<string, number> = { pathways_completed: getPathways().length };
  const state = new Map<string, { level: number; title: string; body: string }>();

  for (const b of catalog.badges) {
    const e = evaluateBadge(b, facts.metrics[b.metric] ?? 0, totals);
    if (!e.earned) continue;
    // The reason line is the catalog's own words for the level actually reached —
    // «هفت روزِ پشتِ هم…» — never a sentence assembled here. A badge's copy lives
    // in badges.json so the founder can retune it with a commit, and an
    // announcement that paraphrased it would be the one surface that did not
    // follow.
    const reason = (b.leveled && b.levels ? b.levels[e.level]?.unlock_fa : b.unlock_fa) ?? '';
    state.set(b.key, { level: e.level, title: b.title_fa, body: reason });
  }

  const tiers = await getTiers();
  const tierByOrder = new Map(tiers.map((t) => [t.tier_order, t]));
  for (const m of catalog.medals.items) {
    const best = facts.medals[m.rank]?.best_tier_order ?? 0;
    if (best <= 0) continue;
    const tier = tierByOrder.get(best);
    if (!tier) continue;
    // The medal never says a bare «طلا» — two metal scales share this section
    // (the league's seven dental materials and the badges' bronze/silver/gold)
    // and the word alone is exactly what would collide.
    state.set(medalKey(m.key), {
      level: best,
      title: `${m.metal_fa} ${tier.name_fa}`,
      body: m.unlock_fa,
    });
  }
  return state;
}

/**
 * File everything this account already has, WITHOUT announcing any of it.
 *
 * This is the go-live guard, and it is the single most important behaviour in
 * the file. A two-year-old account opens the badge wall with fifteen badges lit
 * — correctly, that is the point of deriving them — and the first time anything
 * syncs it, every one of those would look brand new. Fifteen notifications for
 * things the reader did last spring is not a feature launch, it is a bug they
 * would report.
 *
 * `profiles.achievements_seeded` carries the rule rather than a date comparison:
 * migration 0025 sets it FALSE for every account that existed then and leaves
 * the column DEFAULT TRUE, so an account created afterwards starts with an empty
 * ledger and an announcement for its very first badge — the one that matters
 * most — while every older account gets exactly one silent catch-up.
 */
async function seedSilently(
  userId: string,
  state: Map<string, { level: number }>,
): Promise<void> {
  await withTransaction(async (client) => {
    for (const [key, v] of state) {
      await query(
        `insert into achievement_announcements (user_id, badge_key, level, seen_at)
         values ($1, $2, $3, now())
         on conflict (user_id, badge_key) do nothing`,
        [userId, key, v.level],
        client,
      );
    }
    await query(
      `update profiles
          set achievements_seeded = true, achievements_synced_at = now()
        where id = $1`,
      [userId],
      client,
    );
  });
}

export interface SyncResult {
  /** How many announcements were newly written. 0 for a seed, a skip, or no news. */
  announced: number;
  /** True when this call was the account's one-time silent catch-up. */
  seeded: boolean;
  /** True when the debounce window swallowed it. */
  skipped: boolean;
}

/**
 * Bring the ledger up to date with what the wall now says.
 *
 * Pass `facts` when the caller has already derived them (GET /achievements has),
 * so the profile page does not pay for the same ten queries twice. Pass
 * `force` to ignore the debounce — the route does, because a reader who just
 * opened the profile is entitled to an answer that is current to the second.
 */
export async function syncAchievements(
  userId: string,
  opts: { facts?: AchievementFacts; force?: boolean } = {},
): Promise<SyncResult> {
  const profile = await one<{
    longest_streak: number;
    achievements_seeded: boolean;
    stale: boolean;
  }>(
    `select longest_streak, achievements_seeded,
            (achievements_synced_at is null
              or achievements_synced_at < now() - ($2 || ' milliseconds')::interval) as stale
       from profiles where id = $1`,
    [userId, String(DEBOUNCE_MS)],
  );
  if (!profile) return { announced: 0, seeded: false, skipped: true };
  if (!opts.force && !profile.stale) return { announced: 0, seeded: false, skipped: true };

  const facts = opts.facts ?? await computeAchievementFacts(userId, profile.longest_streak);
  const state = await currentState(userId, facts);

  if (!profile.achievements_seeded) {
    await seedSilently(userId, state);
    return { announced: 0, seeded: true, skipped: false };
  }

  const prev = await query<LedgerRow>(
    'select badge_key, level from achievement_announcements where user_id = $1',
    [userId],
  );
  const known = new Map(prev.rows.map((r) => [r.badge_key, r.level]));
  const day = dayInTz(new Date(), config.streakTimezone);

  let announced = 0;
  for (const [key, v] of state) {
    const seen = known.get(key);
    if (seen !== undefined && seen >= v.level) continue; // high-water: never twice
    // Claim first, then write the notice. If the notice insert fails the ledger
    // still says "told them", which loses one announcement — the opposite order
    // would re-announce the same badge on every sync forever, which is worse:
    // one is a missed celebration, the other is a product that nags.
    await query(
      `insert into achievement_announcements (user_id, badge_key, level, announced_at)
       values ($1, $2, $3, now())
       on conflict (user_id, badge_key)
         do update set level = excluded.level, announced_at = now(), seen_at = null`,
      [userId, key, v.level],
    );
    await recordInAppNotice(
      userId,
      'achievement',
      { title: `نشانِ تازه: ${v.title}`, body: v.body, url: '/plus/profile.html', tag: 'achievement' },
      day,
    );
    announced += 1;
  }

  await query('update profiles set achievements_synced_at = now() where id = $1', [userId]);
  return { announced, seeded: false, skipped: false };
}

/**
 * In-flight background syncs, keyed by user.
 *
 * Two jobs. The first is CORRECTNESS: the debounce reads `achievements_synced_at`
 * and writes it later, so two calls that arrive together can both find the mark
 * stale, both see a badge as new, and both write the notice — the ledger's
 * `on conflict` protects the row but not the message. Coalescing per user
 * removes the race at its only realistic source, which is one reader clicking
 * twice, not two servers.
 *
 * The second is that a fire-and-forget promise outlives the request that started
 * it, and a test suite that truncates between cases would otherwise deadlock
 * against work still holding row locks — see drainAchievementSyncs.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Fire-and-forget from a write path.
 *
 * Deliberately off the response: the reader is waiting on their highlight being
 * saved, not on us deriving twenty-one metrics, and a failure here must never
 * turn a successful save into an error. Same shape as recordPageView in
 * routes/auth.ts, for the same reason.
 */
export function scheduleAchievementSync(userId: string): void {
  if (inFlight.has(userId)) return;
  const p = syncAchievements(userId)
    .catch(() => { /* bookkeeping never breaks a write */ })
    .finally(() => { inFlight.delete(userId); });
  inFlight.set(userId, p);
}

/** Wait for every scheduled sync to finish. For tests and for a clean shutdown. */
export async function drainAchievementSyncs(): Promise<void> {
  while (inFlight.size) await Promise.all(Array.from(inFlight.values()));
}

/** The celebration's queue: what has been announced but not yet acknowledged. */
export async function pendingAnnouncements(userId: string): Promise<
  {
    key: string; title_fa: string; body_fa: string; icon: string | null; metal: string | null;
    /** The one-time discount the announced level minted, for the card's chip. */
    discount_percent: number | null;
  }[]
> {
  const rows = await query<{ badge_key: string; level: number }>(
    `select badge_key, level from achievement_announcements
      where user_id = $1 and seen_at is null
      order by announced_at asc`,
    [userId],
  );
  if (!rows.rowCount) return [];

  const catalog = getBadgeCatalog();
  const byKey = new Map(catalog.badges.map((b) => [b.key, b]));
  const medals = new Map(catalog.medals.items.map((m) => [medalKey(m.key), m]));
  const tiers = await getTiers();
  const tierByOrder = new Map(tiers.map((t) => [t.tier_order, t]));

  const out = [];
  for (const r of rows.rows) {
    const medal = medals.get(r.badge_key);
    if (medal) {
      const tier = tierByOrder.get(r.level);
      out.push({
        key: r.badge_key,
        title_fa: tier ? `${medal.metal_fa} ${tier.name_fa}` : medal.title_fa,
        body_fa: medal.unlock_fa,
        // The medal has no monoline badge icon; the client draws its shield.
        icon: null,
        metal: null,
        discount_percent: null,
      });
      continue;
    }
    const badge = byKey.get(r.badge_key);
    // A badge that has since been removed from the catalog: skip rather than
    // render an empty card. The ledger row stays, so it can never come back as
    // news if the badge is restored.
    if (!badge) continue;
    const level = Math.max(0, Math.min(r.level, (badge.levels?.length ?? 1) - 1));
    out.push({
      key: badge.key,
      title_fa: badge.title_fa,
      body_fa: (badge.leveled && badge.levels ? badge.levels[level]?.unlock_fa : badge.unlock_fa) ?? '',
      icon: badge.icon,
      // A level is a RING COLOUR, never a word — the client paints the ring from
      // this and the wall never writes «طلا» as text.
      metal: badge.leveled && badge.levels ? badge.levels[level]?.tier ?? null : null,
      // The card's one extra line: what this level is worth. The money is the
      // companion of the badge, never its reason, so the client shows it AFTER
      // the catalog's own unlock copy.
      discount_percent:
        (badge.leveled && badge.levels ? badge.levels[level]?.discount_percent : null) ?? null,
    });
  }
  return out;
}

/** Acknowledge the celebration. Mirrors POST /league/outcome/seen. */
export async function markAnnouncementsSeen(userId: string): Promise<void> {
  await pool.query(
    'update achievement_announcements set seen_at = now() where user_id = $1 and seen_at is null',
    [userId],
  );
}

/** How many celebrations are queued. Cheap enough for /me (partial index). */
export async function pendingAnnouncementCount(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    'select count(*)::int as n from achievement_announcements where user_id = $1 and seen_at is null',
    [userId],
  );
  return row?.n ?? 0;
}
