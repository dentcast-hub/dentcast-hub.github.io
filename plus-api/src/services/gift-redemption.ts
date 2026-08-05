import { config } from '../config.js';
import { one, query, withTransaction } from '../db.js';
import { activateMonths, type Subscription } from './subscription.js';

/**
 * Paying from outside Iran, with a US Apple gift card.
 *
 * Iranian gateways cannot take a foreign card and a foreign card cannot reach an
 * Iranian gateway, so for anyone abroad there is no payment rail at all — only a
 * value they can hand over and a human who can turn it into months. That human
 * step is not a shortcoming to be automated away later: Apple has no API that
 * tells us a code is good, and the only way to find out is to redeem it.
 *
 * SWITCHED OFF BY DEFAULT (`config.giftCard.enabled`). The whole path exists,
 * is tested, and ships dark — the same arrangement as the gateway itself. What
 * turns it on is a decision about supporting customers in another timezone with
 * a manual queue, not a deployment.
 *
 * NOTHING HERE TOUCHES THE MONTHLY CEILING. Gift redemptions live in their own
 * table for exactly that reason: the e-namad allowance counts rial through
 * Zibal, and spending it on a payment that never went through Zibal would stop
 * Iranian customers buying so that a foreign one could.
 */

export type RedemptionStatus = 'pending' | 'approved' | 'rejected';

export interface Redemption {
  id: string;
  user_id: string;
  code: string;
  kind: string;
  months: number;
  status: RedemptionStatus;
  note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

const COLUMNS = 'id, user_id, code, kind, months, status, note, reviewed_at, created_at';

export type SubmitOutcome =
  | 'submitted'
  | 'disabled'        // the whole path is off
  | 'already_pending' // they already have one in the queue
  | 'duplicate_code'  // that code has been claimed
  | 'invalid_code';

export interface SubmitResult {
  outcome: SubmitOutcome;
  redemption: Redemption | null;
  message: string;
}

/**
 * A gift card code is not a secret we must guess the format of — it is a string
 * a human will read into Apple. We only reject what is obviously not one, so a
 * customer is never told "invalid" by a regex that was wrong about a real card.
 */
function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (code.length < 8 || code.length > 64) return null;
  if (!/^[A-Z0-9-]+$/.test(code)) return null;
  return code;
}

export async function submitRedemption(userId: string, rawCode: string): Promise<SubmitResult> {
  if (!config.giftCard.enabled) {
    return { outcome: 'disabled', redemption: null, message: 'این روش پرداخت فعلاً فعال نیست.' };
  }

  const code = normalizeCode(rawCode);
  if (!code) {
    return { outcome: 'invalid_code', redemption: null, message: 'کد واردشده معتبر به نظر نمی‌رسد.' };
  }

  const pending = await one<Redemption>(
    `select ${COLUMNS} from gift_redemptions where user_id = $1 and status = 'pending'`,
    [userId],
  );
  if (pending) {
    return {
      outcome: 'already_pending', redemption: pending,
      message: 'یک کد از شما در حال بررسی است. نتیجه را همین‌جا اعلام می‌کنیم.',
    };
  }

  try {
    const row = (await one<Redemption>(
      `insert into gift_redemptions (user_id, code, kind, months)
       values ($1, $2, $3, $4) returning ${COLUMNS}`,
      [userId, code, config.giftCard.kind, config.giftCard.months],
    ))!;
    return {
      outcome: 'submitted', redemption: row,
      message: 'کد شما ثبت شد و پس از بررسی، اشتراکتان فعال می‌شود.',
    };
  } catch (err) {
    // The unique index is the real guard against a code being claimed twice —
    // a SELECT-then-INSERT would lose the race between two people submitting
    // the same stolen code at once.
    if ((err as { code?: string }).code === '23505') {
      return {
        outcome: 'duplicate_code', redemption: null,
        message: 'این کد قبلاً ثبت شده است.',
      };
    }
    throw err;
  }
}

export interface ReviewResult {
  ok: boolean;
  redemption: Redemption | null;
  subscription: Subscription | null;
  message: string;
}

/**
 * Approve a redemption: the card was real and has been redeemed on our side.
 *
 * The status change and the subscription extension commit together. A partial
 * approval would either grant months against a redemption still sitting in the
 * queue (and be granted again on the next click) or mark one used without
 * giving anything.
 */
export async function approveRedemption(id: string, note?: string): Promise<ReviewResult> {
  return withTransaction(async (client) => {
    const row = await one<Redemption>(
      `update gift_redemptions
          set status = 'approved', reviewed_at = now(), note = coalesce($2, note)
        where id = $1 and status = 'pending'
        returning ${COLUMNS}`,
      [id, note ?? null], client,
    );
    if (!row) {
      return { ok: false, redemption: null, subscription: null, message: 'این مورد در صف بررسی نیست.' };
    }
    const subscription = await activateMonths(row.user_id, row.months, {
      source: 'admin',
      meta: { gift_redemption_id: row.id, gift_kind: row.kind },
    });
    return { ok: true, redemption: row, subscription, message: 'تأیید شد و اشتراک فعال است.' };
  });
}

/**
 * Reject one. A reason is required, not optional: the person is claiming they
 * handed over something worth a hundred dollars, and "no" on its own is the
 * worst answer a paying customer can be given.
 */
export async function rejectRedemption(id: string, reason: string): Promise<ReviewResult> {
  const row = await one<Redemption>(
    `update gift_redemptions
        set status = 'rejected', reviewed_at = now(), note = $2
      where id = $1 and status = 'pending'
      returning ${COLUMNS}`,
    [id, reason],
  );
  return row
    ? { ok: true, redemption: row, subscription: null, message: 'رد شد.' }
    : { ok: false, redemption: null, subscription: null, message: 'این مورد در صف بررسی نیست.' };
}

/** The admin queue, oldest first — the order they should be answered in. */
export async function pendingRedemptions(limit = 50): Promise<Redemption[]> {
  const res = await query<Redemption>(
    `select ${COLUMNS} from gift_redemptions where status = 'pending'
      order by created_at asc limit $1`,
    [limit],
  );
  return res.rows;
}

/** What the submitter sees: their own latest redemption, whatever became of it. */
export async function latestRedemption(userId: string): Promise<Redemption | null> {
  return one<Redemption>(
    `select ${COLUMNS} from gift_redemptions where user_id = $1
      order by created_at desc limit 1`,
    [userId],
  );
}
