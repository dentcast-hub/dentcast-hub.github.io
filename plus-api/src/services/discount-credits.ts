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
 *     POST /admin/discounts/grant inserts them; nothing else does. A gift
 *     larger than the cap becomes SEVERAL rows — see splitGrantPercent().
 *
 *   · 'referral:<id>' / 'referral_bonus:<id>' — کد معرف (services/referrals.ts).
 *     DERIVED here, at read time, from the `referrals` row a claim wrote: the
 *     referred side always (their ٪۱۰ from the moment they claim a code), the
 *     referrer side only once the referred account has a REAL paid row (their
 *     ٪۵ — the only anti-farming rule the design needs). Design ledger:
 *     .dentcast/referral-handoff.md decisions 2.1-2.4.
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
  /** 'badge:<key>:<tier>', 'grant:<uuid>', 'referral:<id>' or 'referral_bonus:<id>' — the credit's identity, and what redemption stores. */
  source: string;
  percent: number;
  /** What a human surface calls this credit — the badge's name, or the grant's own label. */
  label_fa: string;
  kind: 'badge' | 'grant' | 'referral';
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
 * Every credit کد معرف has minted this account, spent or not — both sides of
 * every `referrals` row this account is party to, in ONE query:
 *
 *   · as the REFERRED account: always, from the moment the row exists
 *     (claimReferral() only ever writes it once, on a first purchase).
 *   · as the REFERRER: only for rows whose referred account has a real
 *     'paid' payment (decision 2.4 — the sole anti-farming rule).
 *
 * The two prefixes ('referral:' / 'referral_bonus:') on the same row `id`
 * are deliberate: two entirely separate credits with two separate
 * spent-nesses, with no extra column needed to tell them apart.
 */
/**
 * When a referral has earned its referrer the ٪۵: the referred account has
 * actually paid, on EITHER rail.
 *
 * `payments` alone was the first cut and it is the one table a manual sale
 * never writes — activateMonths() is called straight from the gift-card and
 * bank-transfer approvals. Since those rails now carry the referral discount
 * too (migration 0045), a referrer whose friend paid by واریز به شبا would
 * otherwise watch a real, approved, discounted sale earn them nothing.
 *
 * Exported because services/referrals.ts's own stats must answer this exact
 * question and two copies of it would eventually be two answers. It lives
 * HERE rather than there only to keep the import one-way: referrals.ts already
 * imports this module.
 */
export const REFERRAL_QUALIFIED_SQL = `(
  exists (select 1 from payments p
           where p.user_id = r.referred_user_id and p.status = 'paid')
  or exists (select 1 from gift_redemptions g
              where g.user_id = r.referred_user_id and g.status = 'approved')
)`;

/**
 * A referral's own ٪۱۰ is held while a manual claim is spending it.
 *
 * The gateway side of this is discount_redemptions ↔ payments; the manual side
 * is gift_redemptions.referral_id, and both decide the same way — by the
 * status of the row that is spending it. Pending or approved holds the credit;
 * rejected releases it with nothing to clean up. Without this the ٪۱۰ would
 * come off the transfer AND still be sitting there, unspent, for the buyer's
 * next gateway purchase.
 */
const REFERRAL_HELD_BY_CLAIM_SQL = `exists (
  select 1 from gift_redemptions g
   where g.referral_id = r.id and g.status in ('pending', 'approved')
)`;

export async function referralCredits(
  userId: string,
  client: Queryable = pool,
): Promise<DiscountCredit[]> {
  const r = await client.query<{ source: string; percent: number; label_fa: string }>(
    `select 'referral:' || r.id as source, r.referred_percent as percent,
            'تخفیف معرفی' as label_fa
       from referrals r
      where r.referred_user_id = $1
        and not ${REFERRAL_HELD_BY_CLAIM_SQL}
     union all
     select 'referral_bonus:' || r.id, r.referrer_percent, 'پاداش معرفی'
       from referrals r
      where r.referrer_user_id = $1
        and ${REFERRAL_QUALIFIED_SQL}`,
    [userId],
  );
  return r.rows.map((row) => ({ ...row, kind: 'referral' as const }));
}

/**
 * Split a granted percentage into parts, none larger than the per-purchase cap.
 *
 * A grant ABOVE the cap is not a bigger discount — it is a dead one. pickCredits()
 * treats a credit as atomic and skips whole anything that does not fit, so a
 * single 20% row is passed over on every purchase, forever, while the endpoint
 * that wrote it answered `ok: true`. Nothing about that failure is visible: the
 * row exists, the admin listing shows it, the buyer is charged list price.
 *
 * Grant time is the only place to fix it without touching the atomicity rule the
 * engine rests on. The founder types the total they mean; what gets written is n
 * ordinary credits of at most `cap` each, which the reader then spends one per
 * purchase — «۲۰٪» is two 10% credits across two purchases, exactly as it reads.
 *
 * Full parts first, remainder last (25 → 10, 10, 5), so the reader always spends
 * the largest usable credit first and the odd leftover survives to the end.
 */
export function splitGrantPercent(percent: number, cap: number = CREDIT_CAP_PERCENT): number[] {
  const parts: number[] = [];
  let left = Math.trunc(percent);
  if (!Number.isFinite(left) || left <= 0 || cap <= 0) return parts;
  while (left > 0) {
    const take = Math.min(cap, left);
    parts.push(take);
    left -= take;
  }
  return parts;
}

/** One written grant row — what the founder's surfaces read back. */
export interface GrantRow {
  id: string;
  percent: number;
  label_fa: string;
  expires_at: Date | null;
}

/**
 * Write a granted credit as one row per part (see splitGrantPercent).
 *
 * ONE statement — an insert-select over unnest() — so the parts of a gift can
 * never half-exist without an explicit transaction. That is what lets this be
 * called both inside a caller's transaction (grantBadge) and on its own (the
 * admin route), which is the whole reason the two writers can share it.
 *
 * Every part carries the gift's own label and expiry: they are one decision, and
 * `label_fa` is what a reader surface would name the credit, so «۱ از ۲»
 * bookkeeping has no business being in it. The founder sees the split in the
 * grant response and in GET /admin/discounts, where it belongs.
 */
export async function insertGrant(
  userId: string,
  input: { percent: number; label_fa: string; kind?: string; days?: number | null },
  client: Queryable = pool,
): Promise<GrantRow[]> {
  const parts = splitGrantPercent(input.percent);
  if (!parts.length) return [];
  const r = await client.query<GrantRow>(
    `insert into discount_grants (user_id, percent, kind, label_fa, expires_at)
     select $1, p, $3, $4,
            case when $5::int is null then null else now() + ($5 || ' days')::interval end
       from unnest($2::int[]) as p
     returning id, percent, label_fa, expires_at`,
    [userId, parts, input.kind || 'gift', input.label_fa, input.days ?? null],
  );
  // RETURNING order is not promised by the standard; sort so the largest part is
  // always first and a single-part gift reads back exactly as it always did.
  return r.rows.sort((a, b) => b.percent - a.percent);
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
  const [grants, referral, spent] = await Promise.all([
    grantCredits(userId, opts.now),
    referralCredits(userId),
    spentSources(userId),
  ]);
  const all = [...badgeCredits(facts), ...grants, ...referral].filter((c) => !spent.has(c.source));
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
