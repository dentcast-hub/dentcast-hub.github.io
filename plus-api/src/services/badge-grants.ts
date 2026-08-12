import type pg from 'pg';
import { pool, one, query, withTransaction, type Queryable } from '../db.js';
import { grantMetricOf, grantableBadges } from '../badges.js';
import { scheduleAchievementSync } from './achievement-sync.js';
import { insertGrant } from './discount-credits.js';

/**
 * Granted badges — the founder-given class of the wall. «همراه» is the first
 * member: somebody saw a bug, or otherwise lent the site a hand, and the
 * founder says thank you with a badge no metric could ever count.
 *
 * THE DOCTRINE SURVIVES BY ONE MOVE: what is written is the DECISION, never
 * the badge. A `badge_grants` row is the same kind of independent fact as a
 * `payments` row is for «ستون» — the wall still derives, through the same
 * `value >= threshold` comparison as every other badge: each grant becomes a
 * `grant:<badge_key>` metric worth 1 (folded in by computeAchievementFacts),
 * and a catalog entry whose metric is `grant:<its own key>` lights from it.
 * Because the sync machinery only diffs derived state, the celebration card
 * and the اطلاعیه row come free, exactly as they do for every other badge.
 *
 * WHICH BADGES ARE GRANTABLE IS THE CATALOG'S CALL, NOT THIS FILE'S: a badge
 * is grantable iff its metric is `grant:` + its own key. That rule is what
 * stops the admin endpoint from ever "granting" «شعله» — the insert would be
 * harmless (nothing reads `grant:flame`), but a button that silently does
 * nothing is worse than one that refuses.
 *
 * A GRANT IS ONCE PER (USER, BADGE), enforced by the table's unique
 * constraint: granting twice is a no-op that also must not double-mint the
 * money. The optional discount that rides along is an ordinary
 * discount_grants row (the generic credit engine, services/discount-credits.ts)
 * written in the same transaction — the wall and the till stay two systems.
 * One-shot badges deliberately carry no `discount_percent` of their own
 * (badges.json's rule), so the grant row is the ONLY money path here.
 */

/**
 * This account's granted metrics, ready to fold into the facts:
 * `grant:<badge_key>` -> 1 for every grant row. Keys nobody granted are simply
 * absent, which the evaluator reads as 0 — a badge that never lights.
 */
export async function grantedMetrics(
  userId: string,
  client: Queryable = pool,
): Promise<Record<string, number>> {
  const r = await client.query<{ badge_key: string }>(
    'select badge_key from badge_grants where user_id = $1',
    [userId],
  );
  const out: Record<string, number> = {};
  for (const row of r.rows) out[grantMetricOf(row.badge_key)] = 1;
  return out;
}

export interface GrantResult {
  ok: boolean;
  /** True when the row already existed — nothing was written, no money minted. */
  already: boolean;
  badge_key: string;
  title_fa: string | null;
  /** The FIRST discount_grants row minted alongside a NEW grant, if any was asked for. */
  discount_grant_id: string | null;
  /** Every row of that credit — more than one only when it split across the cap. */
  discount_grant_ids: string[];
}

/**
 * Grant one badge to one account, once.
 *
 * Idempotent at the row level: a repeat grant is `already: true` and writes
 * NOTHING — including the discount, because "pressed the button twice" must
 * never pay twice. The badge and its money commit in one transaction; the
 * sync poke afterwards is fire-and-forget (like pillar-notify's), so the
 * celebration and the inbox row land now rather than on the reader's next
 * unrelated write.
 *
 * Throws 'not_grantable' for a key outside the catalog's granted class — the
 * route turns that into a 400 that names the legal keys.
 */
export async function grantBadge(
  userId: string,
  badgeKey: string,
  opts: {
    note?: string; discountPercent?: number; discountDays?: number;
    /**
     * Join an ALREADY-OPEN transaction instead of starting a new one — used
     * where a grant has to commit atomically with something else (the admin
     * "تأیید + اهدای نشان" action, which must not extend a subscription and
     * then fail to grant the badge). Omit for every ordinary caller.
     */
    client?: pg.PoolClient;
  } = {},
): Promise<GrantResult> {
  const badge = grantableBadges().find((b) => b.key === badgeKey);
  if (!badge) throw new Error('not_grantable');

  const run = async (client: pg.PoolClient) => {
    const inserted = await one<{ id: string }>(
      `insert into badge_grants (user_id, badge_key, note)
       values ($1, $2, $3)
       on conflict (user_id, badge_key) do nothing
       returning id`,
      [userId, badgeKey, opts.note ?? null],
      client,
    );
    if (!inserted) return { already: true, discountIds: [] as string[] };

    let discountIds: string[] = [];
    if (typeof opts.discountPercent === 'number' && opts.discountPercent > 0) {
      // The same rows POST /admin/discounts/grant writes, under the same cap
      // and the same spent-by-join rules. `label_fa` is the badge's own name,
      // so the credit and the badge read as one gift on every reader surface.
      // Above the cap it splits into one credit per purchase, exactly as the
      // admin endpoint does — the thank-you is conventionally ٪۵, so in
      // practice this is a single row.
      const rows = await insertGrant(userId, {
        percent: opts.discountPercent,
        kind: `badge:${badgeKey}`,
        label_fa: badge.title_fa,
        days: opts.discountDays ?? null,
      }, client);
      discountIds = rows.map((g) => g.id);
    }
    return { already: false, discountIds };
  };

  const result = opts.client ? await run(opts.client) : await withTransaction(run);

  if (!result.already) scheduleAchievementSync(userId);
  return {
    ok: true,
    already: result.already,
    badge_key: badgeKey,
    title_fa: badge.title_fa,
    discount_grant_id: result.discountIds[0] ?? null,
    discount_grant_ids: result.discountIds,
  };
}

/**
 * Take a grant back. The badge goes dark on the next derive; the announcement
 * ledger's high-water mark means a later re-grant is silent, which is the
 * right way round — a celebration must never arrive twice for one decision.
 * The discount that rode along is NOT clawed back here: money already
 * promised (possibly already spent on a purchase) is an accounting question,
 * and `delete from discount_grants` by hand is the founder saying so
 * explicitly.
 */
export async function revokeBadgeGrant(userId: string, badgeKey: string): Promise<boolean> {
  const r = await query(
    'delete from badge_grants where user_id = $1 and badge_key = $2',
    [userId, badgeKey],
  );
  return (r.rowCount ?? 0) > 0;
}

/** The grant list for one account — the admin's read side. */
export async function listBadgeGrants(userId: string): Promise<
  { badge_key: string; note: string | null; created_at: Date }[]
> {
  const r = await query<{ badge_key: string; note: string | null; created_at: Date }>(
    'select badge_key, note, created_at from badge_grants where user_id = $1 order by created_at',
    [userId],
  );
  return r.rows;
}
