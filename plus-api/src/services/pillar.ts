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
 * the rank of the account's FIRST paid row in `payments`, a ledger that is
 * append-only and never deleted, so a seat, once real, is real forever: no
 * column to backfill, no grant to revoke by accident, no way for the entitlement
 * to drift from the money that earned it. Two consequences are accepted as
 * design rather than fixed as bugs:
 *
 *   · A first purchase is never discounted. The seat does not exist until the
 *     money has arrived, so the discount begins with the first RENEWAL — which
 *     is also what makes the campaign honest: nobody is promised a price before
 *     they have done the thing the seat is for.
 *
 *   · Only the gateway mints seats. Gift-card redemptions and admin gifts call
 *     activateMonths() directly and write no `payments` row; their timing is a
 *     human answering an inbox, and ranking them against gateway timestamps
 *     would make the order of the first fifty depend on when someone was at
 *     their desk. Real money over the gift rail is honoured, but not seated.
 *
 * The count is fixed at fifty and the discount at twenty percent, both by
 * decision (2026-08-08): like «پیشگام»'s five hundred, the number is a promise
 * to the people who already hold it and must never grow.
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

/** How many accounts can ever hold a «ستون» seat. Never grows. */
export const PILLAR_SEATS = 50;

/** Whole-percent discount a seat-holder gets on every renewal, at any price. */
export const PILLAR_DISCOUNT_PERCENT = 20;

/**
 * This account's seat number (1-based) among all accounts that have ever
 * completed a paid gateway purchase, or null if it has never paid. A number
 * LARGER than PILLAR_SEATS is still returned — "you paid, but the seats were
 * gone" is a different fact from "you never paid", and the caller decides with
 * isPillarSeat().
 *
 * Ranked by each account's first `verified_at` (falling back to `created_at`
 * for any row settled before that column was stamped), tie-broken by user id so
 * the order is deterministic even for two payments verified in the same
 * millisecond.
 */
export async function pillarSeat(
  userId: string,
  client: Queryable = pool,
): Promise<number | null> {
  const row = await one<{ seat: number }>(
    `with firsts as (
       select user_id, min(coalesce(verified_at, created_at)) as first_paid
         from payments
        where status = 'paid'
        group by user_id
     )
     select seat::int from (
       select user_id, row_number() over (order by first_paid, user_id) as seat
         from firsts
     ) ranked
     where user_id = $1`,
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
  first_paid: Date;
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
    `with firsts as (
       select user_id, min(coalesce(verified_at, created_at)) as first_paid
         from payments
        where status = 'paid'
        group by user_id
     )
     select ranked.seat::int as seat, ranked.user_id, p.display_name, ranked.first_paid
       from (
         select user_id, first_paid,
                row_number() over (order by first_paid, user_id) as seat
           from firsts
       ) ranked
       join profiles p on p.id = ranked.user_id
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
