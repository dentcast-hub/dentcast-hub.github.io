import { pool, one, type Queryable } from '../db.js';

/**
 * «ستون» — the first PILLAR_SEATS accounts ever to complete a paid gateway
 * purchase, and the permanent renewal discount that comes with the seat.
 *
 * ONE DEFINITION, TWO READERS. The badge wall (services/achievements.ts) and
 * the till (services/payment.ts) both answer "does this account hold a seat?"
 * through this module, for the same reason «چراغ‌دار» and the league share one
 * share-gate: two copies of the definition would eventually be two definitions,
 * and here the second copy would be quoting somebody the wrong price.
 *
 * THE SEAT IS DERIVED, NEVER WRITTEN DOWN — same doctrine as every badge. It is
 * the rank of the account's FIRST CLAIM, and a claim is a row that already had
 * to exist for its own reasons: a paid row in `payments`, an append-only ledger
 * that is never deleted, or (see below) a founder's grant. Nothing stores a seat
 * NUMBER: no column to backfill, no rank to recompute, no way for the
 * entitlement to drift from the thing that earned it. Two consequences are
 * accepted as design rather than fixed as bugs:
 *
 *   · A first purchase is never discounted. The seat does not exist until the
 *     money has arrived, so the discount begins with the first RENEWAL — which
 *     is also what makes the campaign honest: nobody is promised a price before
 *     they have done the thing the seat is for. (A GRANTED seat is the one
 *     exception, and unavoidably so: it exists before any purchase, so the
 *     holder's first purchase is discounted too. That is the gift.)
 *
 *   · Money only ever arrives through the gateway. Gift-card redemptions and
 *     admin gifts call activateMonths() directly and write no `payments` row;
 *     their timing is a human answering an inbox, and ranking them against
 *     gateway timestamps would make the order of the first fifty depend on when
 *     someone was at their desk. Real money over the gift rail is honoured, but
 *     not seated.
 *
 * THE ONE SEAT THAT IS NOT BOUGHT is an explicit founder grant —
 * `pillar_grants` (migration 0038), written by POST /admin/pillar/grant for
 * somebody who helped build this and was never going to appear in a payments
 * ledger. It is deliberately its own table and not a forged payment: a fake
 * `payments` row would lie to revenue, to the gateway's monthly ceiling and to
 * the discount-credit join, and all three are harder to unpick later than they
 * look. Ranked by `granted_at` against the payments timestamps, in ONE query
 * below, so the badge wall and the till still read a single definition — and
 * because a grant is written today it always sorts after the seats already
 * taken, so no existing holder's number moves. A granted seat SPENDS one of
 * PILLAR_SEATS rather than growing the count: fifty readers hold seats either
 * way, which is the sentence the public copy has to keep being true.
 *
 * The count is fixed at FIFTY-ONE and the discount at twenty percent, both by
 * decision (2026-08-08): fifty seats for the readers the campaign promises
 * them to, plus one because the founder's own account also pays through the
 * gateway and would otherwise occupy a reader's seat. Every public word —
 * badge copy, the campaign, the docs — keeps saying «پنجاه», and stays true:
 * fifty readers hold seats. Like «پیشگام»'s five hundred, the number is a
 * promise to the people who already hold it and must never grow again.
 *
 * THE FILL STATE IS A SECRET (decision 2026-08-08). An unearned «ستون» is
 * `earned_only` — invisible — and no reader-facing surface ever says whether
 * seats remain, because either answer is a subscriber count: "still open"
 * announces fewer than fifty paying accounts, "closed" announces the day the
 * fiftieth arrived. It also removes the disappointment this would otherwise
 * manufacture — a wall inviting people toward a seat that the fifty-first
 * buyer discovers was already gone. The campaign lives in the founder's own
 * marketing, at the founder's own pacing; closure needs no announcement and no
 * commit because isPillarSeat() simply stops at fifty; and the ONE surface
 * that reports the roster is GET /admin/pillar, behind the founder's basic
 * auth, which is how they know when to stop advertising.
 */

/**
 * How many accounts can ever hold a «ستون» seat: fifty readers plus the
 * founder's own paid account (see the header note). Never grows.
 */
export const PILLAR_SEATS = 51;

/** Whole-percent discount a seat-holder gets on every renewal, at any price. */
export const PILLAR_DISCOUNT_PERCENT = 20;

/**
 * Every claim on a seat, from both sources, collapsed to one dated row per
 * account. Written once and shared by the two readers below, because the moment
 * this ranking exists twice a seat number means two different things depending
 * on who asked.
 *
 * A payment is dated by its `verified_at` (falling back to `created_at` for any
 * row settled before that column was stamped) and a grant by its `granted_at`;
 * an account holding both keeps the earlier one, so paying later never costs
 * somebody the seat they were given. Tie-broken by user id, so the order is
 * deterministic even for two claims landing in the same millisecond.
 */
const SEAT_CLAIMS = `
  with claims as (
    select user_id, min(coalesce(verified_at, created_at)) as at
      from payments
     where status = 'paid'
     group by user_id
    union all
    select user_id, granted_at as at
      from pillar_grants
  ), firsts as (
    select user_id, min(at) as first_paid from claims group by user_id
  ), ranked as (
    select user_id, first_paid,
           row_number() over (order by first_paid, user_id) as seat
      from firsts
  )
`;

/**
 * This account's seat number (1-based) among all accounts that have ever
 * claimed one, or null if it never has. A number LARGER than PILLAR_SEATS is
 * still returned — "you paid, but the seats were gone" is a different fact from
 * "you never paid", and the caller decides with isPillarSeat().
 */
export async function pillarSeat(
  userId: string,
  client: Queryable = pool,
): Promise<number | null> {
  const row = await one<{ seat: number }>(
    `${SEAT_CLAIMS} select seat::int from ranked where user_id = $1`,
    [userId],
    client,
  );
  return row?.seat ?? null;
}

/** Does this seat number actually sit among the first fifty? */
export function isPillarSeat(seat: number | null): boolean {
  return seat !== null && seat >= 1 && seat <= PILLAR_SEATS;
}

/**
 * What a seat-holder pays for a plan whose list price is `listRial`.
 *
 * Floored to a whole 10,000 rial (1,000 toman) so the gateway is never handed a
 * ragged figure and the pricing page never shows one — and floored rather than
 * rounded so the arithmetic can only ever err in the customer's favour. The
 * discount is a PERCENT on purpose: «در هر قیمتی» means that when the price
 * ladder moves, the seat-holder's advantage moves with it, with nothing here to
 * re-tune.
 */
export function pillarAmountRial(listRial: number): number {
  const discounted = (listRial * (100 - PILLAR_DISCOUNT_PERCENT)) / 100;
  return Math.max(10_000, Math.floor(discounted / 10_000) * 10_000);
}

export interface PillarSeatHolder {
  seat: number;
  user_id: string;
  display_name: string;
  /** When the seat was claimed: the first payment, or the grant that gave it. */
  first_paid: Date;
  /** True for a founder grant — the one holder no money is standing behind. */
  granted: boolean;
}

export interface PillarRoster {
  seats_total: number;
  seats_taken: number;
  open: boolean;
  holders: PillarSeatHolder[];
}

/**
 * The founder's private view, and the ONLY place the fill state is ever
 * reported (see the secrecy note above). Served by GET /admin/pillar; nothing
 * reader-facing may call this or repeat its numbers.
 */
export async function pillarRoster(client: Queryable = pool): Promise<PillarRoster> {
  const r = await client.query<PillarSeatHolder>(
    `${SEAT_CLAIMS}
     select ranked.seat::int as seat, ranked.user_id, p.display_name,
            ranked.first_paid, (g.user_id is not null) as granted
       from ranked
       join profiles p on p.id = ranked.user_id
       left join pillar_grants g on g.user_id = ranked.user_id
      where ranked.seat <= $1
      order by ranked.seat`,
    [PILLAR_SEATS],
  );
  return {
    seats_total: PILLAR_SEATS,
    seats_taken: r.rows.length,
    open: r.rows.length < PILLAR_SEATS,
    holders: r.rows,
  };
}

export interface PillarGrantResult {
  /** The seat this account holds now, counting both sources, or null. */
  seat: number | null;
  /** Whether that number is actually inside PILLAR_SEATS. */
  seated: boolean;
  /** False when the account already had a grant, or already held a paid seat. */
  created: boolean;
}

/**
 * Give one account a seat by decision instead of by purchase.
 *
 * Idempotent: user_id is the table's primary key, so pressing this twice is one
 * seat. It reports `seated` rather than assuming it — a grant written after the
 * seats are gone produces a real row with a rank past PILLAR_SEATS, and saying
 * so is the only way the founder finds out they just spent a seat that does not
 * exist. Nothing here is allowed to grow the count to make room.
 *
 * An account that already holds a PAID seat keeps its own, earlier claim (see
 * SEAT_CLAIMS): the grant row is inserted but changes nothing, and `created`
 * tells the caller which of the two happened.
 */
export async function grantPillarSeat(
  userId: string,
  note: string | null = null,
  client: Queryable = pool,
): Promise<PillarGrantResult> {
  const res = await client.query(
    `insert into pillar_grants (user_id, note) values ($1, $2)
     on conflict (user_id) do nothing`,
    [userId, note],
  );
  const seat = await pillarSeat(userId, client);
  return { seat, seated: isPillarSeat(seat), created: (res.rowCount ?? 0) > 0 };
}

/**
 * Take a granted seat back. Deletes the GRANT and nothing else — a seat that
 * money bought is not revocable here and must not be, which is why this touches
 * only the one table a founder decision wrote. The returned seat is what the
 * account holds afterwards: null for somebody who only ever had the gift, and
 * their own paid rank for somebody who has since bought one.
 */
export async function revokePillarSeat(
  userId: string,
  client: Queryable = pool,
): Promise<{ removed: boolean; seat: number | null; seated: boolean }> {
  const res = await client.query('delete from pillar_grants where user_id = $1', [userId]);
  const seat = await pillarSeat(userId, client);
  return { removed: (res.rowCount ?? 0) > 0, seat, seated: isPillarSeat(seat) };
}
