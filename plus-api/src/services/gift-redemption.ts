import { config } from '../config.js';
import { one, query, withTransaction } from '../db.js';
import { activateMonths, type Subscription } from './subscription.js';
import { grantBadge, type GrantResult } from './badge-grants.js';
import { sendCapped } from './notify-policy.js';
import { mintReference } from './reference.js';

/**
 * Two manual payment rails, one table.
 *
 * RAIL ONE — a US Apple gift card, for anyone outside Iran. Iranian gateways
 * cannot take a foreign card and a foreign card cannot reach an Iranian
 * gateway, so there is no automatic rail at all — only a value the buyer can
 * hand over and a human who turns it into months. Apple has no API that says
 * whether a code is good, and the only way to find out is to redeem it.
 *
 * THE CODE NEVER TOUCHES US. A gift-card code is a bearer instrument — whoever
 * reads it can spend it — so the flow is built so that it goes from the shop to
 * the founder's inbox without passing through our page, our API or our
 * database. What we mint instead is a REFERENCE: a short tag the buyer types
 * into the gift message when they have the card emailed over.
 *
 * US CARDS ONLY. An Apple gift card redeems only into an Apple ID of the same
 * country, so a card bought in any other region is unusable no matter how
 * genuine it is.
 *
 * RAIL TWO — a SHABA bank transfer, for anyone without an Iranian card
 * accepted by the gateway, anyone abroad who would rather send rial than buy a
 * gift card, and the student-discount path (the founder writes the discounted
 * amount onto the pending row after seeing a student card — the discount is
 * never computed by an engine; see `.dentcast/support-payment-handoff.md`
 * decision 2.3). Same shape as the gift-card rail: a claim, a reference the
 * buyer writes into the transfer's «بابت» field, manual approval.
 *
 * NOTHING HERE TOUCHES THE MONTHLY CEILING, on EITHER rail. Gift redemptions
 * live in their own table for exactly that reason: the e-namad allowance
 * counts rial through Zibal, and a manually-approved transfer never goes
 * through Zibal.
 */

export type RedemptionStatus = 'pending' | 'approved' | 'rejected';
export type RedemptionKind = 'apple_us' | 'bank_transfer';

export interface Redemption {
  id: string;
  user_id: string;
  reference: string;
  code: string | null;
  kind: string;
  months: number;
  amount_rial: number | null;
  /** The کد معرف this claim is spending, if any — migration 0045. */
  referral_id: string | null;
  status: RedemptionStatus;
  note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

const COLUMNS =
  'id, user_id, reference, code, kind, months, amount_rial, referral_id, status, note, reviewed_at, created_at';

/** The tag the buyer writes into the transfer/gift message — services/reference.ts owns the alphabet. */
const mintClaimReference = (): string => mintReference('DC');

export type StartOutcome = 'started' | 'disabled' | 'already_pending';

export interface StartResult {
  outcome: StartOutcome;
  redemption: Redemption | null;
  message: string;
}

/** Everything the buyer needs on screen for the gift-card rail. */
export function giftInstructions() {
  return {
    enabled: config.giftCard.enabled,
    months: config.giftCard.months,
    amount_usd: config.giftCard.amountUsd,
    kind: config.giftCard.kind,
    recipient_email: config.giftCard.recipientEmail,
  };
}

/**
 * Everything the buyer needs on screen for the bank-transfer rail.
 *
 * The student numbers ride along so the page can SAY what the discount is
 * without hardcoding it: retuning ٪۱۵ is then a commit to config, not an edit
 * to a Persian sentence in a frontend module. They are copy, not arithmetic —
 * nothing here computes a discounted amount, because on this rail the amount
 * is the one the founder writes onto the claim after talking to the buyer
 * (decision 2.3 of the handoff).
 */
export function bankTransferInstructions() {
  return {
    enabled: config.bankTransfer.enabled,
    iban: config.bankTransfer.iban,
    holder: config.bankTransfer.holder,
    bank_name: config.bankTransfer.bankName,
    telegram: config.supportTelegram,
    student_discount_percent: config.bankTransfer.studentDiscountPercent,
    student_months: config.bankTransfer.studentMonths,
  };
}

/**
 * Open a claim and hand back the reference. Nothing is granted yet.
 *
 * `kind` decides everything else: `apple_us` takes no further input (months
 * and the reviewer's rail come from giftCard config, same as before); a
 * `bank_transfer` claim carries the months bought and the rial amount the
 * SERVER computed for it (routes/pay.ts — never trust a client-sent amount).
 */
export async function startRedemption(
  userId: string,
  kind: RedemptionKind = 'apple_us',
  opts: { months?: number; amountRial?: number; referralId?: string | null } = {},
): Promise<StartResult> {
  if (kind === 'apple_us' && !config.giftCard.enabled) {
    return { outcome: 'disabled', redemption: null, message: 'این روش پرداخت فعلاً فعال نیست.' };
  }
  if (kind === 'bank_transfer' && !config.bankTransfer.enabled) {
    return { outcome: 'disabled', redemption: null, message: 'این روش پرداخت فعلاً فعال نیست.' };
  }

  const months = kind === 'apple_us' ? config.giftCard.months : opts.months!;
  const amountRial = kind === 'apple_us' ? null : opts.amountRial!;
  // Only the bank rail can carry a کد معرف: a gift card's price is in dollars
  // and set by Apple, so there is no figure here for a percentage to act on.
  const referralId = kind === 'apple_us' ? null : opts.referralId ?? null;

  // One open claim PER RAIL at a time — not globally: someone with a pending
  // gift-card claim must not be refused a bank-transfer claim by the same
  // guard, and vice versa (decision 2.1/5.2 of the handoff).
  const pending = await one<Redemption>(
    `select ${COLUMNS} from gift_redemptions where user_id = $1 and kind = $2 and status = 'pending'`,
    [userId, kind],
  );
  if (pending) {
    return {
      outcome: 'already_pending', redemption: pending,
      message: 'یک درخواست باز دارید؛ از همان کد پیگیری استفاده کنید.',
    };
  }

  // Retry on the astronomically unlikely collision rather than failing a
  // customer who is trying to pay.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const row = (await one<Redemption>(
        `insert into gift_redemptions (user_id, reference, kind, months, amount_rial, referral_id)
         values ($1, $2, $3, $4, $5, $6) returning ${COLUMNS}`,
        [userId, mintClaimReference(), kind, months, amountRial, referralId],
      ))!;
      await notifyFounder(row);
      return { outcome: 'started', redemption: row, message: '' };
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
    }
  }
  throw new Error('gift reference collision: exhausted retries');
}

/**
 * Tell the founder a claim is on its way, on either rail.
 *
 * Without this the claim sits in a queue nobody is watching, and the promise
 * made on the page — that this is answered within a day — becomes a matter of
 * luck.
 */
async function notifyFounder(row: Redemption): Promise<void> {
  const phone = row.kind === 'bank_transfer'
    ? config.bankTransfer.alertPhone
    : config.giftCard.alertPhone;
  if (!phone) {
    // eslint-disable-next-line no-console
    console.log(`[gift] claim ${row.reference} kind=${row.kind} (${row.months}mo) — no alert phone set`);
    return;
  }
  const target = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
  if (!target) return;
  const title = row.kind === 'bank_transfer' ? 'واریز بانکی در راه است' : 'گیفت‌کارت در راه است';
  const body = row.kind === 'bank_transfer'
    ? `کد پیگیری ${row.reference} — ${row.months} ماه. صورت‌حساب را بررسی کنید.`
    : `کد پیگیری ${row.reference} — ${row.months} ماه. ایمیل را بررسی کنید.`;
  await sendCapped(target.id, {
    title, body, url: '/admin', tag: 'gift_claim',
  }, 'system').catch(() => { /* alerting never blocks a customer */ });
}

export interface ReviewResult {
  ok: boolean;
  redemption: Redemption | null;
  subscription: Subscription | null;
  message: string;
}

/**
 * Approve: the card arrived, the founder redeemed it, and it was real.
 *
 * Keyed by REFERENCE rather than row id, because the reference is what the
 * founder is holding — it is in the email in front of them. Making them find a
 * uuid first would be a step invented purely for the database's benefit.
 *
 * The status change and the subscription extension commit together: a partial
 * approval would either grant months against a claim still sitting in the queue
 * (and grant them again on the next click) or consume the claim without giving
 * anything.
 */
export async function approveRedemption(reference: string, note?: string): Promise<ReviewResult> {
  return withTransaction(async (client) => {
    const row = await one<Redemption>(
      `update gift_redemptions
          set status = 'approved', reviewed_at = now(), note = coalesce($2, note)
        where reference = $1 and status = 'pending'
        returning ${COLUMNS}`,
      [reference.trim().toUpperCase(), note ?? null], client,
    );
    if (!row) {
      return { ok: false, redemption: null, subscription: null, message: 'این کد پیگیری در صف بررسی نیست.' };
    }
    const subscription = await activateMonths(row.user_id, row.months, {
      source: 'admin',
      meta: { gift_reference: row.reference, gift_kind: row.kind },
      client,
    });
    return { ok: true, redemption: row, subscription, message: 'تأیید شد و اشتراک فعال است.' };
  });
}

export interface ReviewAndGrantResult extends ReviewResult {
  badge: GrantResult | null;
}

/**
 * Approve a claim AND grant a badge in the SAME transaction — the admin panel's
 * «تأیید + اهدای نشان دانشجو» button (bank-transfer queue, decision 5.5 of the
 * handoff). Both effects share one client rather than each opening its own
 * transaction: if the badge grant fails, the approval and the subscription
 * extension must not have happened either, and vice versa.
 */
export async function approveRedemptionAndGrantBadge(
  reference: string,
  badgeKey: string,
  opts: { note?: string; discountPercent?: number } = {},
): Promise<ReviewAndGrantResult> {
  return withTransaction(async (client) => {
    const row = await one<Redemption>(
      `update gift_redemptions
          set status = 'approved', reviewed_at = now(), note = coalesce($2, note)
        where reference = $1 and status = 'pending'
        returning ${COLUMNS}`,
      [reference.trim().toUpperCase(), opts.note ?? null], client,
    );
    if (!row) {
      return {
        ok: false, redemption: null, subscription: null, badge: null,
        message: 'این کد پیگیری در صف بررسی نیست.',
      };
    }
    const subscription = await activateMonths(row.user_id, row.months, {
      source: 'admin',
      meta: { gift_reference: row.reference, gift_kind: row.kind },
      client,
    });
    const badge = await grantBadge(row.user_id, badgeKey, {
      discountPercent: opts.discountPercent,
      client,
    });
    return {
      ok: true, redemption: row, subscription, badge,
      message: 'تأیید شد، اشتراک فعال است و نشان اهدا شد.',
    };
  });
}

/**
 * Reject. A reason is required, not optional: the person is claiming they sent
 * something worth a hundred dollars, and "no" on its own is the worst answer a
 * paying customer can be given.
 */
export async function rejectRedemption(reference: string, reason: string): Promise<ReviewResult> {
  const row = await one<Redemption>(
    `update gift_redemptions
        set status = 'rejected', reviewed_at = now(), note = $2
      where reference = $1 and status = 'pending'
      returning ${COLUMNS}`,
    [reference.trim().toUpperCase(), reason],
  );
  return row
    ? { ok: true, redemption: row, subscription: null, message: 'رد شد.' }
    : { ok: false, redemption: null, subscription: null, message: 'این کد پیگیری در صف بررسی نیست.' };
}

export type PendingRedemption = Redemption & {
  phone: string | null;
  username: string | null;
  display_name: string | null;
};

/**
 * The admin queue, oldest first — the order they should be answered in.
 *
 * Carries username/display_name beside the phone because a Telegram-only buyer
 * has no phone: with phone alone their row arrives blank, and «approve» becomes
 * a decision about somebody the founder cannot identify. The LEFT JOIN on
 * auth_identities matters for the same reason the inner one on profiles is
 * safe — a profile always exists, an identity may not.
 */
export async function pendingRedemptions(limit = 50, kind?: RedemptionKind): Promise<PendingRedemption[]> {
  const res = await query<PendingRedemption>(
    `select ${COLUMNS.split(', ').map((c) => `g.${c}`).join(', ')},
            nullif(p.phone, '') as phone,
            max(ai.username)     as username,
            p.display_name
       from gift_redemptions g
       join profiles p on p.id = g.user_id
       left join auth_identities ai on ai.user_id = p.id
      where g.status = 'pending' ${kind ? 'and g.kind = $2' : ''}
      group by ${COLUMNS.split(', ').map((c) => `g.${c}`).join(', ')}, p.phone, p.display_name
      order by g.created_at asc limit $1`,
    kind ? [limit, kind] : [limit],
  );
  return res.rows;
}

/**
 * Write the amount onto a pending bank-transfer claim — how the founder types
 * in the student-discounted price after seeing the student's card. Only
 * touches a PENDING row: once approved, the amount is history.
 */
export async function setRedemptionAmount(reference: string, amountRial: number): Promise<Redemption | null> {
  return one<Redemption>(
    `update gift_redemptions set amount_rial = $2
      where reference = $1 and status = 'pending'
      returning ${COLUMNS}`,
    [reference.trim().toUpperCase(), amountRial],
  );
}

/**
 * What the buyer sees when they come back: their own latest claim, optionally
 * scoped to one rail — a returning bank-transfer buyer must see THAT claim,
 * not an older gift-card one that happens to be more recent.
 */
export async function latestRedemption(
  userId: string,
  kind?: RedemptionKind,
): Promise<Redemption | null> {
  return one<Redemption>(
    `select ${COLUMNS} from gift_redemptions where user_id = $1 ${kind ? 'and kind = $2' : ''}
      order by created_at desc limit 1`,
    kind ? [userId, kind] : [userId],
  );
}
