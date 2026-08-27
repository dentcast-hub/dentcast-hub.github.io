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

export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'canceled';
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
  /**
   * When a human settled the figure with the buyer — migration 0050. Null
   * means the amount on this row is still only the list price nobody has
   * agreed to yet, which is the difference the buyer's page turns on.
   */
  amount_confirmed_at: Date | null;
  /**
   * The buyer asked for the student rate when they opened this — migration
   * 0051. THIS is what decides whether a claim waits for a human: an ordinary
   * transfer is the list price and nothing about it needs settling, so only a
   * student's claim holds until `amount_confirmed_at` is stamped.
   */
  student_request: boolean;
  status: RedemptionStatus;
  note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

const COLUMNS =
  'id, user_id, reference, code, kind, months, amount_rial, referral_id, '
  + 'amount_confirmed_at, student_request, status, note, reviewed_at, created_at';

/**
 * Persian digits and separators for anything a buyer reads. A notification is
 * a sentence in Persian, and `12,000,000` sitting inside one is a number in
 * somebody else's alphabet — the site writes every other figure this way.
 */
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const faNum = (n: number): string => n.toLocaleString('en-US')
  .replace(/\d/g, (d) => FA_DIGITS[Number(d)])
  .replace(/,/g, '٬');

/** The term as it is said out loud, since «اشتراک 1 ماهه» is nobody's Persian. */
const TERM_FA: Record<number, string> = {
  1: 'یک‌ماهه', 3: 'سه‌ماهه', 6: 'شش‌ماهه', 12: 'دوازده‌ماهه',
};
const termFa = (months: number): string => TERM_FA[months] || `${faNum(months)} ماهه`;

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
  opts: {
    months?: number; amountRial?: number; referralId?: string | null;
    studentRequest?: boolean;
  } = {},
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
  // A gift card has no student rate to ask for — that discount exists on one
  // rial plan on one rail, and routes/pay.ts has already refused the tick
  // anywhere else by the time this runs.
  const studentRequest = kind === 'bank_transfer' && opts.studentRequest === true;

  // One open claim PER RAIL at a time — not globally: someone with a pending
  // gift-card claim must not be refused a bank-transfer claim by the same
  // guard, and vice versa (decision 2.1/5.2 of the handoff).
  const pending = await one<Redemption>(
    `select ${COLUMNS} from gift_redemptions where user_id = $1 and kind = $2 and status = 'pending'`,
    [userId, kind],
  );
  if (pending) {
    // UPGRADE-ONLY: someone who opened an ordinary claim and then ticks
    // «دانشجو هستم» on the same term gets that claim put on hold, instead of
    // being handed back a page that tells them to transfer the list price
    // while they wait for a discount. Never the reverse — releasing a hold is
    // the founder's act (confirmRedemptionAmount), and un-ticking a box must
    // not be able to tell somebody to pay a figure nobody has settled.
    if (studentRequest && !pending.student_request && pending.months === months) {
      const held = await one<Redemption>(
        `update gift_redemptions set student_request = true
          where id = $1 and status = 'pending' returning ${COLUMNS}`,
        [pending.id],
      );
      if (held) {
        return {
          outcome: 'already_pending', redemption: held,
          message: 'یک درخواست باز دارید؛ از همان کد پیگیری استفاده کنید.',
        };
      }
    }
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
        `insert into gift_redemptions
           (user_id, reference, kind, months, amount_rial, referral_id, student_request)
         values ($1, $2, $3, $4, $5, $6, $7) returning ${COLUMNS}`,
        [userId, mintClaimReference(), kind, months, amountRial, referralId, studentRequest],
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
  // A student's claim is the one that needs the founder BEFORE any money
  // moves — they are holding, waiting for a figure. An ordinary transfer needs
  // nothing until it lands, so its alert must not read like a request.
  const title = row.kind !== 'bank_transfer'
    ? 'گیفت‌کارت در راه است'
    : (row.student_request ? 'درخواست تخفیف دانشجویی' : 'واریز بانکی در راه است');
  let body;
  if (row.kind !== 'bank_transfer') {
    body = `کد پیگیری ${row.reference} — ${termFa(row.months)}. ایمیل را بررسی کنید.`;
  } else if (row.student_request) {
    body = `کد پیگیری ${row.reference} — ${termFa(row.months)}. منتظر کارت دانشجویی است؛ `
      + 'بعد از دیدنش مبلغ را اعلام کن — تا آن موقع واریز نمی‌کند.';
  } else {
    body = `کد پیگیری ${row.reference} — ${termFa(row.months)}. صورت‌حساب را بررسی کنید.`;
  }
  await sendCapped(target.id, {
    title, body, url: '/admin', tag: 'gift_claim',
  }, 'system').catch(() => { /* alerting never blocks a customer */ });
}

/**
 * Tell the buyer how their claim was decided.
 *
 * The gateway hands its customer a result page; these rails hand theirs
 * nothing — the subscription simply began, silently, whenever the founder got
 * round to the queue — while the pricing page promised «بعد از دیدن واریز،
 * اشتراک فعال می‌شود و در «اطلاعیه» خبرش را می‌گیرید» with nothing on the
 * other end of it. A refusal matters more, not less: it is the one message
 * that has to carry a reason, since somebody has sent money and is not getting
 * a subscription for it.
 *
 * Called AFTER the transaction commits, never inside it: a notification for an
 * approval that then rolled back is worse than a late one.
 */
async function notifyDecision(
  row: Redemption,
  outcome: 'approved' | 'rejected',
  reason?: string,
): Promise<void> {
  const rail = row.kind === 'bank_transfer' ? 'واریز' : 'گیفت‌کارت';
  const message = outcome === 'approved'
    ? {
      title: `${rail} شما تأیید شد`,
      body: `اشتراک ${termFa(row.months)}‌ی شما فعال شد. (کد پیگیری ${row.reference})`,
      url: '/plus/',
      tag: `claim_${row.reference}`,
    }
    : {
      title: `${rail} شما تأیید نشد`,
      body: `${reason || 'برای پیگیری با پشتیبانی تماس بگیرید.'} (کد پیگیری ${row.reference})`,
      url: '/plus/support.html',
      tag: `claim_${row.reference}`,
    };
  await sendCapped(row.user_id, message, 'payment_result')
    .catch(() => { /* an unreachable buyer never fails the review */ });
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
  const result = await withTransaction(async (client) => {
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
  if (result.ok) await notifyDecision(result.redemption!, 'approved');
  return result;
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
  const result = await withTransaction(async (client) => {
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
  if (result.ok) await notifyDecision(result.redemption!, 'approved');
  return result;
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
  if (row) await notifyDecision(row, 'rejected', reason);
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
 * Settle the amount on a pending bank-transfer claim — the founder saying
 * «this is the figure, transfer it». Only touches a PENDING row: once
 * approved, the amount is history.
 *
 * `amountRial` is OPTIONAL, and that is the whole point of the rewrite. This
 * used to be «write the student's discounted price», which quietly assumed the
 * founder always has a new number to type; in the ordinary case they do not —
 * the list price the claim opened at is already right — and there was no way
 * to say so. So the buyer, told to agree the amount before transferring,
 * waited for a message that had nowhere to come from. Passing no amount keeps
 * the figure and confirms it; passing one overwrites and confirms in the same
 * write, because announcing a number and settling it are one act.
 *
 * The notification is what makes it an announcement rather than a database
 * change: the buyer is not sitting on this page waiting for a poll.
 */
export async function confirmRedemptionAmount(
  reference: string,
  amountRial?: number | null,
): Promise<Redemption | null> {
  const row = await one<Redemption>(
    `update gift_redemptions
        set amount_rial = coalesce($2, amount_rial), amount_confirmed_at = now()
      where reference = $1 and status = 'pending'
      returning ${COLUMNS}`,
    [reference.trim().toUpperCase(), amountRial ?? null],
  );
  if (row) await notifyAmountConfirmed(row);
  return row;
}

/**
 * Tell the buyer their figure is settled and they may transfer.
 *
 * UNCAPPED (notify-policy.ts) on the renewal warning's reasoning: the reader
 * asked what to transfer and is waiting to spend money, so a streak nudge that
 * arrived first must not be why they never hear back. It travels at any hour
 * for the same reason — this is the answer to their own question, not news we
 * decided to push at them.
 */
async function notifyAmountConfirmed(row: Redemption): Promise<void> {
  const toman = row.amount_rial === null ? null : faNum(Math.round(row.amount_rial / 10));
  await sendCapped(row.user_id, {
    title: 'مبلغ واریز شما تأیید شد',
    body: toman
      ? `کد پیگیری ${row.reference} — ${toman} تومان. حالا می‌توانید واریز کنید.`
      : `کد پیگیری ${row.reference} — مبلغ تأیید شد. حالا می‌توانید واریز کنید.`,
    url: '/plus/pricing.html?from=bank-amount',
    tag: `bank_amount_${row.reference}`,
  }, 'bank_amount').catch(() => { /* an unreachable buyer never fails the write */ });
}

/**
 * The buyer withdrawing their OWN open claim (migration 0052).
 *
 * Until this existed there was no way out of one. The partial unique index
 * allows a single pending claim per rail, so anyone who pressed «دریافت کد
 * پیگیری» on a one-month plan and then decided on six months was handed the
 * one-month claim back — at the one-month price, with the six-month plan
 * selected right above it — and the only release was the founder rejecting it.
 * Somebody who pressed the button once out of curiosity was locked to that
 * term.
 *
 * Scoped to the owner, and to a PENDING row: an approved claim has already
 * bought months, and a rejected one is the founder's answer, not the buyer's
 * to overwrite. Filed as `canceled` rather than `rejected` because nobody
 * refused anything — putting the founder's name on the buyer's change of mind
 * would also count it in whatever the queue reports as refusals.
 */
export async function cancelRedemption(
  userId: string,
  reference: string,
): Promise<Redemption | null> {
  return one<Redemption>(
    `update gift_redemptions
        set status = 'canceled', reviewed_at = now()
      where reference = $1 and user_id = $2 and status = 'pending'
      returning ${COLUMNS}`,
    [reference.trim().toUpperCase(), userId],
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
