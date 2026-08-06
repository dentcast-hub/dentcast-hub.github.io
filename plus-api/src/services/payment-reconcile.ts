import { config } from '../config.js';
import { query } from '../db.js';
import { zibalInquiry } from './zibal.js';
import { settlePayment } from './payment.js';

/**
 * The job that closes the loop on payments nobody came back from.
 *
 * WHY IT EXISTS. Until 2026-08-06 `settlePayment` had exactly two callers —
 * `/pay/callback` (the customer's browser returning from the gateway) and
 * `/pay/settle` (the customer asking) — so both depended on the customer coming
 * back. Anyone who paid and then closed the tab left a row reading `pending`
 * forever: money taken, no subscription, and nothing anywhere that would ever
 * notice. That was found by hand, by reading the table. A payment rail cannot
 * depend on someone thinking to look.
 *
 * WHAT IT DOES. For every pending row older than the grace window it asks the
 * gateway what actually happened — with `inquiry`, which reads, never `verify`,
 * which settles (see zibal.ts) — and then either finishes the job or closes the
 * row.
 *
 * THE RULE THE WHOLE FILE IS SHAPED AROUND: an inconclusive answer is not a no.
 * A gateway timeout, a `-2`, a body we could not parse — all leave the row
 * exactly as it was, to be asked again next pass. The only thing that closes a
 * row is the gateway positively saying no money moved. Getting this backwards
 * would take a real payment and mark it dead, which is the one outcome nobody
 * can undo from the admin panel.
 *
 * CLOSING A ROW IS NOT DESTRUCTIVE, which is what makes the grace window a
 * judgement call rather than a risk. `canceled` is not terminal to
 * `settlePayment`: it refuses to re-settle only `paid`, and its claim is
 * `where status <> 'paid'`. So a customer who wanders back and pays at minute
 * forty still activates normally through the ordinary callback.
 */

export interface ReconcileResult {
  /** Rows old enough to ask about this pass. */
  checked: number;
  /** Money was really there; the subscription is now active. */
  settled: number;
  /** The gateway confirmed no money moved; the row is closed. */
  closed: number;
  /** No usable answer — deliberately left pending for the next pass. */
  left: number;
  /** Settled but a human should look (amount mismatch, reconciled 201). */
  needsReview: number;
}

interface PendingRow {
  id: string;
  ref_id: string;
}

/**
 * Ask about, and resolve, every pending payment past the grace window.
 *
 * Idempotent and safe to run concurrently with the live callback: the work is
 * delegated to `settlePayment`, whose activation claim is a conditional UPDATE,
 * so a customer returning at the same moment as this job cannot double-activate
 * — one of them loses the race and reads `already_settled`.
 */
export async function reconcilePendingPayments(now: Date = new Date()): Promise<ReconcileResult> {
  const out: ReconcileResult = { checked: 0, settled: 0, closed: 0, left: 0, needsReview: 0 };

  const cutoff = new Date(now.getTime() - config.payments.reconcileAfterMinutes * 60_000);

  // ref_id is the gateway's trackId and is only written once the request
  // succeeded. A pending row without one never reached Zibal, so there is
  // nothing to ask about — startPayment already marked those 'failed'.
  const { rows } = await query<PendingRow>(
    `select id, ref_id
       from payments
      where status = 'pending'
        and gateway = 'zibal'
        and ref_id is not null
        and created_at < $1
      order by created_at
      limit $2`,
    [cutoff.toISOString(), config.payments.reconcileBatch],
  );

  for (const row of rows) {
    out.checked += 1;

    const q = await zibalInquiry(row.ref_id);

    // Could not ask, or the gateway would not say. Leave it exactly as it is.
    if (!q.ok || q.paid === null) {
      out.left += 1;
      continue;
    }

    if (q.paid) {
      // Hand it to the one function allowed to turn money into a subscription.
      // It re-verifies rather than trusting this inquiry, because verify is
      // what actually settles the transaction at the gateway — the inquiry only
      // told us it was worth doing.
      const result = await settlePayment(row.ref_id, now);
      if (result.outcome === 'activated' || result.outcome === 'already_settled') out.settled += 1;
      else out.left += 1;
      if (result.needsReview) out.needsReview += 1;
      continue;
    }

    // A definite no. Close the row so it stops looking like a live payment.
    // Guarded on `status = 'pending'` so a callback that landed while we were
    // talking to the gateway is never overwritten.
    const { rowCount } = await query(
      "update payments set status = 'canceled', updated_at = now() where id = $1 and status = 'pending'",
      [row.id],
    );
    if (rowCount) out.closed += 1;
    else out.left += 1;
  }

  return out;
}
