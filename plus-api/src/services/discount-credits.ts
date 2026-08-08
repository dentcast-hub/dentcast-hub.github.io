import { pool, one, query, type Queryable } from '../db.js';
import { getBadgeCatalog, evaluateBadge } from '../badges.js';
import { getPathways } from '../pathways.js';
import { computeAchievementFacts, type AchievementFacts } from './achievements.js';

/**
 * One-time discount credits — the generic machinery behind «ارزش مادی نشان‌ها».
 *
 * A credit is a small percentage off ONE purchase. Two sources exist today and
 * the engine deliberately cannot tell them apart past their source string:
 *
 *   · 'badge:<key>:<tier>' — a leveled badge that reached silver or gold. These
 *     are DERIVED here at read time from the same facts the badge wall shows,
 *     never stored — the wall's own doctrine, kept. The VALUE of each level
 *     lives in plus/badges.json (`discount_percent`), so retuning it is a
 *     commit to the site, not a deploy.
 *
 *   · 'grant:<uuid>' — a row in discount_grants: a birthday, an Eid campaign,
 *     an apology. Founder decisions cannot be derived, so they are written.
 *     POST /admin/discounts/grant inserts one; nothing else does.
 *
 * ONE RULE BOUNDS THE MONEY: the credits applied to a single purchase never
 * exceed CREDIT_CAP_PERCENT, and a credit that did not fit is NOT consumed —
 * it waits for the next purchase. The «ستون» renewal discount is a different
 * thing entirely (permanent, never consumed, defined in services/pillar.ts)
 * and stacks on top of this cap; only the one-time credits are capped.
 *
 * SPENT-NESS IS A JOIN, NOT A FLAG. A redemption row ties a credit to one
 * payments row, and the credit counts as spent only while that payment reads
 * 'pending' or 'paid'. A failed or canceled payment therefore releases its
 * credits with no cleanup path that could be forgotten. Two consequences are
 * accepted as design: two payments opened in the same instant could briefly
 * hold the same credit (both must settle for it to double-apply — bounded by
 * the cap, and one reader racing their own two tabs is the only source); and a
 * payment the reconciler closed as 'canceled' can still settle if the customer
 * wanders back (payment-reconcile.ts allows this on purpose) — its locked
 * amount stands, so a credit re-spent in between double-applies once. Both are
 * a few percent of one subscription, and both err in the customer's favour.
 */

/** Hard ceiling on the one-time credits applied to a single purchase. */
export const CREDIT_CAP_PERCENT = 10;

export interface DiscountCredit {
  /** 'badge:<key>:<tier>' or 'grant:<uuid>' — the credit's identity, and what redemption stores. */
  source: string;
  percent: number;
  /** What a human surface calls this credit — the badge's name, or the grant's own label. */
  label_fa: string;
  kind: 'badge' | 'grant';
}

/**
 * Every credit this account's badges have ever minted, spent or not.
 *
 * Derived from the catalog + the caller's facts: a level with a
 * `discount_percent` that the reader has reached is a credit. Levels the
 * catalog gives no value (every bronze, every one-shot badge — including the
 * mysteries, whose secrecy this also protects) simply produce nothing.
 */
export function badgeCredits(facts: AchievementFacts): DiscountCredit[] {
  const catalog = getBadgeCatalog();
  const totals: Record<string, number> = { pathways_completed: getPathways().length };
  const out: DiscountCredit[] = [];
  for (const b of catalog.badges) {
    if (!b.leveled || !b.levels?.length) continue;
    const e = evaluateBadge(b, facts.metrics[b.metric] ?? 0, totals);
    for (let i = 0; i <= e.level; i += 1) {
      const pct = b.levels[i]?.discount_percent;
      if (typeof pct === 'number' && pct > 0) {
        out.push({
          source: `badge:${b.key}:${b.levels[i].tier}`,
          percent: pct,
          label_fa: b.title_fa,
          kind: 'badge',
        });
      }
    }
  }
  return out;
}

/** Unexpired granted credits (birthday, Eid, …), spent or not. */
export async function grantCredits(
  userId: string,
  now: Date = new Date(),
  client: Queryable = pool,
): Promise<DiscountCredit[]> {
  const r = await client.query<{ id: string; percent: number; label_fa: string }>(
    `select id, percent, label_fa from discount_grants
      where user_id = $1 and (expires_at is null or expires_at > $2)
      order by created_at, id`,
    [userId, now.toISOString()],
  );
  return r.rows.map((g) => ({
    source: `grant:${g.id}`, percent: g.percent, label_fa: g.label_fa, kind: 'grant' as const,
  }));
}

/**
 * Which credit sources are currently spent — held by a pending payment or
 * consumed by a paid one. Failed/canceled payments drop out of this set by the
 * join alone, which is the whole release mechanism.
 */
export async function spentSources(
  userId: string,
  client: Queryable = pool,
): Promise<Set<string>> {
  const r = await client.query<{ source: string }>(
    `select distinct r.source
       from discount_redemptions r
       join payments p on p.id = r.payment_id
      where r.user_id = $1 and p.status in ('pending', 'paid')`,
    [userId],
  );
  return new Set(r.rows.map((row) => row.source));
}

/**
 * Every credit this account can still spend, largest first.
 *
 * Pass `facts` when the caller has already derived them (GET /achievements
 * has); otherwise they are computed here — ten queries once per purchase or
 * profile view, the same price the wall already pays.
 */
export async function availableCredits(
  userId: string,
  opts: { facts?: AchievementFacts; now?: Date } = {},
): Promise<DiscountCredit[]> {
  const facts = opts.facts ?? await computeAchievementFacts(
    userId,
    (await one<{ longest_streak: number }>(
      'select longest_streak from profiles where id = $1', [userId],
    ))?.longest_streak ?? 0,
  );
  const [grants, spent] = await Promise.all([
    grantCredits(userId, opts.now),
    spentSources(userId),
  ]);
  const all = [...badgeCredits(facts), ...grants].filter((c) => !spent.has(c.source));
  // Largest first so the cap is filled with the fewest credits — the reader
  // keeps the most future value. Source as tie-break keeps the pick
  // deterministic, which is what makes a retried purchase pick the same set.
  all.sort((a, b) => b.percent - a.percent || (a.source < b.source ? -1 : 1));
  return all;
}

/**
 * The subset of credits one purchase actually consumes: greedy under the cap,
 * in the order availableCredits() returns. A credit that does not fit is
 * skipped, not truncated — credits are atomic, and the skipped one stays
 * available for the next purchase.
 */
export function pickCredits(
  credits: DiscountCredit[],
  cap: number = CREDIT_CAP_PERCENT,
): DiscountCredit[] {
  const picked: DiscountCredit[] = [];
  let sum = 0;
  for (const c of credits) {
    if (sum + c.percent > cap) continue;
    picked.push(c);
    sum += c.percent;
  }
  return picked;
}

export const creditPercent = (credits: DiscountCredit[]): number =>
  credits.reduce((s, c) => s + c.percent, 0);

/**
 * What a buyer pays at `percent` off the list price — the same rounding
 * contract as pillarAmountRial: floored to a whole 10,000 rial so the gateway
 * is never handed a ragged figure, and floored rather than rounded so the
 * arithmetic only ever errs in the customer's favour.
 */
export function discountedRial(listRial: number, percent: number): number {
  if (percent <= 0) return listRial;
  const discounted = (listRial * (100 - Math.min(100, percent))) / 100;
  return Math.max(10_000, Math.floor(discounted / 10_000) * 10_000);
}

/** File the consumption, inside the same transaction that opens the payment. */
export async function recordRedemptions(
  client: Queryable,
  userId: string,
  paymentId: string,
  credits: DiscountCredit[],
): Promise<void> {
  for (const c of credits) {
    await query(
      `insert into discount_redemptions (user_id, source, percent, payment_id)
       values ($1, $2, $3, $4)
       on conflict (payment_id, source) do nothing`,
      [userId, c.source, c.percent, paymentId],
      client,
    );
  }
}

/** The credits a given payment holds — for the settle path's audit meta. */
export async function redemptionsForPayment(
  paymentId: string,
  client: Queryable = pool,
): Promise<{ source: string; percent: number }[]> {
  const r = await client.query<{ source: string; percent: number }>(
    'select source, percent from discount_redemptions where payment_id = $1 order by source',
    [paymentId],
  );
  return r.rows;
}
