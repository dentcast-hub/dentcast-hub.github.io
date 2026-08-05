import { config } from '../config.js';
import { one, query, withTransaction } from '../db.js';
import { activateMonths, type Subscription } from './subscription.js';
import { sendCapped } from './notify-policy.js';

/**
 * Paying from outside Iran, with a US Apple gift card.
 *
 * Iranian gateways cannot take a foreign card and a foreign card cannot reach an
 * Iranian gateway, so for anyone abroad there is no payment rail at all — only a
 * value they can hand over and a human who can turn it into months. That human
 * step is not a shortcoming waiting to be automated: Apple has no API that says
 * whether a code is good, and the only way to find out is to redeem it.
 *
 * THE CODE NEVER TOUCHES US. A gift-card code is a bearer instrument — whoever
 * reads it can spend it — so the flow is built so that it goes from the shop to
 * the founder's inbox without passing through our page, our API or our database.
 * What we mint instead is a REFERENCE: a short tag the buyer types into the gift
 * message when they have the card emailed over. The email arrives carrying the
 * tag, and the tag is what matches it to the person waiting.
 *
 * That inverts the usual trust problem in our favour. We are not storing
 * something valuable and hoping nobody reads it; there is nothing valuable here
 * to read. A leaked reference buys an attacker the ability to claim they sent a
 * card they did not send — which the founder discovers the moment they look for
 * an email that never arrived.
 *
 * US CARDS ONLY. An Apple gift card redeems only into an Apple ID of the same
 * country, so a card bought in any other region is unusable no matter how
 * genuine it is. That is stated wherever the flow is described, because it is
 * the one mistake that costs the buyer real money and cannot be undone.
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
  reference: string;
  code: string | null;
  kind: string;
  months: number;
  status: RedemptionStatus;
  note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

const COLUMNS =
  'id, user_id, reference, code, kind, months, status, note, reviewed_at, created_at';

/**
 * The tag the buyer writes into the gift message.
 *
 * Read aloud, typed by hand into a shop's message box, and then read back off an
 * email by a human — so the alphabet excludes every pair that looks alike in a
 * sans-serif face (0/O, 1/I/L, 5/S, 8/B). Short enough to retype without
 * resentment; a mistyped tag means an arrived card nobody can match.
 */
const TAG_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY2346789';

function mintReference(): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += TAG_ALPHABET[Math.floor(Math.random() * TAG_ALPHABET.length)];
  }
  return `DC-${out.slice(0, 3)}-${out.slice(3)}`;
}

export type StartOutcome = 'started' | 'disabled' | 'already_pending';

export interface StartResult {
  outcome: StartOutcome;
  redemption: Redemption | null;
  message: string;
}

/** Everything the buyer needs on screen. One source, so nothing drifts. */
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
 * Open a claim and hand back the reference. Nothing is granted, and no code is
 * asked for: the buyer now goes and has a card emailed over carrying this tag.
 */
export async function startRedemption(userId: string): Promise<StartResult> {
  if (!config.giftCard.enabled) {
    return { outcome: 'disabled', redemption: null, message: 'این روش پرداخت فعلاً فعال نیست.' };
  }

  // One open claim at a time. Two claims for one person means two references
  // and one arriving card, and the founder guessing which to approve.
  const pending = await one<Redemption>(
    `select ${COLUMNS} from gift_redemptions where user_id = $1 and status = 'pending'`,
    [userId],
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
        `insert into gift_redemptions (user_id, reference, kind, months)
         values ($1, $2, $3, $4) returning ${COLUMNS}`,
        [userId, mintReference(), config.giftCard.kind, config.giftCard.months],
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
 * Tell the founder a card is on its way.
 *
 * Without this the claim sits in a queue nobody is watching, and the promise
 * made on the page — that this is answered within a day — becomes a matter of
 * luck. The buyer is in another timezone and has already spent the money.
 */
async function notifyFounder(row: Redemption): Promise<void> {
  const phone = config.giftCard.alertPhone;
  if (!phone) {
    // eslint-disable-next-line no-console
    console.log(`[gift] claim ${row.reference} (${row.months}mo) — no GIFTCARD_ALERT_PHONE set`);
    return;
  }
  const target = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
  if (!target) return;
  await sendCapped(target.id, {
    title: 'گیفت‌کارت در راه است',
    body: `کد پیگیری ${row.reference} — ${row.months} ماه. ایمیل را بررسی کنید.`,
    url: '/admin',
    tag: 'gift_claim',
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
    });
    return { ok: true, redemption: row, subscription, message: 'تأیید شد و اشتراک فعال است.' };
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

/** The admin queue, oldest first — the order they should be answered in. */
export async function pendingRedemptions(limit = 50): Promise<Array<Redemption & { phone: string }>> {
  const res = await query<Redemption & { phone: string }>(
    `select ${COLUMNS.split(', ').map((c) => `g.${c}`).join(', ')}, p.phone
       from gift_redemptions g join profiles p on p.id = g.user_id
      where g.status = 'pending' order by g.created_at asc limit $1`,
    [limit],
  );
  return res.rows;
}

/** What the buyer sees when they come back: their own latest claim. */
export async function latestRedemption(userId: string): Promise<Redemption | null> {
  return one<Redemption>(
    `select ${COLUMNS} from gift_redemptions where user_id = $1
      order by created_at desc limit 1`,
    [userId],
  );
}
