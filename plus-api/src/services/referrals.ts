import { one, query, type Queryable, pool } from '../db.js';
import { toLatinDigits } from './phone.js';
import {
  spentSources, pickCredits, creditPercent, CREDIT_CAP_PERCENT,
  REFERRAL_QUALIFIED_SQL, type DiscountCredit,
} from './discount-credits.js';

/**
 * کد معرف — referral codes. Design ledger: .dentcast/referral-handoff.md.
 *
 * WHAT IS WRITTEN is a `referrals` row — the fact that X referred Y — and
 * BOTH discounts (the referred's ٪۱۰, the referrer's ٪۵) are DERIVED from it
 * in services/discount-credits.ts (referralCredits()), never minted here.
 * Same doctrine as pillar.ts / badge_grants / achievements.ts: this module
 * only ever writes the decision.
 *
 * The referrer's ٪۵ exists only once the referred account has a REAL paid
 * row (decision 2.4 — the only anti-farming rule this needs: a code alone
 * mints nothing, an account has to actually buy). The referred account may
 * claim a code only on its FIRST purchase (decision 2.5): once any payment
 * of theirs has settled, checkClaim() refuses every code, including their
 * own unused one.
 *
 * A code is minted ONCE and is permanent (decision 2.7) — it goes out on
 * WhatsApp/stories, and a code that can change either breaks those links or
 * lets someone steal a freshly-shared code's referrals by renaming into it.
 */

export const REFERRED_DISCOUNT_PERCENT = 10;
export const REFERRER_DISCOUNT_PERCENT = 5;

/** Lowercase ASCII only — no digits, no Persian. A digit in the alias would
 * make `dens6`+`1` and `dens`+`61` collide on the same final code `dens61`. */
export const ALIAS_RE = /^[a-z]{4,16}$/;

export interface ReferralCode {
  user_id: string;
  alias: string;
  code: string;
  created_at: Date;
}

export interface Referral {
  id: string;
  referred_user_id: string;
  referrer_user_id: string;
  code: string;
  referred_percent: number;
  referrer_percent: number;
  created_at: Date;
}

/**
 * Normalize a code as typed by a human: copied from Telegram, typed with a
 * Persian keyboard, padded with a stray space. Store and compare only in
 * this form.
 */
export function normalizeCode(raw: string): string {
  return toLatinDigits(raw ?? '')
    // whitespace + ZWNJ (U+200C) — a code is never typed with either, but a
    // phone keyboard or a copy-paste from Telegram routinely adds them.
    .replace(/[\s‌]+/g, '')
    .toLowerCase();
}

function randomTwoDigits(): string {
  return String(Math.floor(Math.random() * 100)).padStart(2, '0');
}

/** This account's code, or null if it has not minted one yet. */
export async function myCode(userId: string, client: Queryable = pool): Promise<ReferralCode | null> {
  return one<ReferralCode>(
    'select user_id, alias, code, created_at from referral_codes where user_id = $1',
    [userId],
    client,
  );
}

export type MintRefusal = 'bad_alias' | 'already_has_code' | 'code_taken';

export type MintResult =
  | { ok: true; code: string }
  | { ok: false; reason: MintRefusal };

/**
 * Mint this account's one-and-only code. The last two digits come from the
 * account's own mobile when it has one; a phone-less, Telegram-first account
 * (profiles.phone is nullable since migration 0004) gets two RANDOM digits
 * instead — these accounts can and do buy (pay.ts hands Zibal an optional
 * mobile), so leaving them out of the program would be a real customer lost.
 * The two digits are cosmetic only: uniqueness is enforced on the WHOLE code
 * (referral_codes.code), never on the digits alone, and the buyer only ever
 * sees their own final code either way.
 */
export async function mintCode(userId: string, alias: string): Promise<MintResult> {
  if (!ALIAS_RE.test(alias)) return { ok: false, reason: 'bad_alias' };

  const existing = await myCode(userId);
  if (existing) return { ok: false, reason: 'already_has_code' };

  const profile = await one<{ phone: string | null }>(
    'select phone from profiles where id = $1', [userId],
  );
  const digits = profile?.phone ? profile.phone.slice(-2) : randomTwoDigits();
  const code = `${alias}${digits}`;

  try {
    await query(
      'insert into referral_codes (user_id, alias, code) values ($1, $2, $3)',
      [userId, alias, code],
    );
    return { ok: true, code };
  } catch (err) {
    // Race between the myCode() check above and this insert. A collision on
    // the primary key (user_id) means someone else's concurrent request for
    // THIS account won; a collision on the code's own unique index means the
    // alias+digits combination is already somebody else's. Not retried — the
    // name was the user's own choice, and there is no "next best" to pick
    // for them (compare gift-redemption.ts's reference retry, which loops
    // because ITS collision is meaningless to the caller).
    if ((err as { code?: string }).code === '23505') {
      const constraint = (err as { constraint?: string }).constraint ?? '';
      return { ok: false, reason: constraint.includes('pkey') ? 'already_has_code' : 'code_taken' };
    }
    throw err;
  }
}

export type ClaimRefusal =
  | 'unknown_code'       // چنین کدی نیست
  | 'own_code'           // کد خودش
  | 'already_referred'   // قبلاً از یک کد استفاده کرده
  | 'already_purchased'; // قبلاً خرید موفق داشته (تصمیم ۲.۵)

/** The sentence a rejected claim shows — same convention as payment-capacity.ts's capacityMessage(). */
export function claimRefusalMessage(reason: ClaimRefusal): string {
  switch (reason) {
    case 'unknown_code': return 'این کد معرف معتبر نیست.';
    case 'own_code': return 'نمی‌توانید کد معرفِ خودتان را وارد کنید.';
    case 'already_referred': return 'قبلاً از یک کد معرف استفاده کرده‌اید.';
    case 'already_purchased': return 'کد معرف فقط برای اولین خرید قابل استفاده است.';
    default: return 'این کد معرف قابل استفاده نیست.';
  }
}

export type CheckResult =
  | { ok: true; referrerId: string; code: string }
  | { ok: false; reason: ClaimRefusal };

/** Validate a code for this account — no write. Used to preview /pay/plans. */
export async function checkClaim(userId: string, code: string): Promise<CheckResult> {
  const normalized = normalizeCode(code);
  const codeRow = await one<{ user_id: string }>(
    'select user_id from referral_codes where code = $1', [normalized],
  );
  if (!codeRow) return { ok: false, reason: 'unknown_code' };
  if (codeRow.user_id === userId) return { ok: false, reason: 'own_code' };

  const already = await one<{ x: number }>(
    'select 1 as x from referrals where referred_user_id = $1', [userId],
  );
  if (already) return { ok: false, reason: 'already_referred' };

  // "First purchase" means MONEY, from either rail — not "first gateway row".
  // The first cut asked `payments` alone, which is the one table a manual sale
  // never writes: somebody who had already bought six months by واریز به شبا or
  // by gift card looked like a brand-new account, so their SECOND subscription
  // took the newcomer's ٪۱۰ and minted their referrer a ٪۵ (founder review,
  // 2026-08-13). gift_redemptions is where both of those rails settle.
  //
  // Free premium is deliberately NOT counted — a league prize or an admin gift
  // writes a `subscriptions` row and nothing else, and testing that table
  // instead would spend the referral eligibility of somebody who has never paid
  // us anything, which is the exact reader this program exists to convert.
  const purchased = await one<{ x: number }>(
    `select 1 as x from payments
      where user_id = $1 and status = 'paid'
      union all
     select 1 from gift_redemptions
      where user_id = $1 and status = 'approved'
      limit 1`,
    [userId],
  );
  if (purchased) return { ok: false, reason: 'already_purchased' };

  return { ok: true, referrerId: codeRow.user_id, code: normalized };
}

export type ClaimResult =
  | { ok: true; referral: Referral; created: boolean }
  | { ok: false; reason: ClaimRefusal };

/**
 * Validate + write. Idempotent on referred_user_id (unique — decision 2.6):
 * a resubmit of the SAME code returns the existing row with created:false; a
 * DIFFERENT code, once one is already on file, is refused as already_referred
 * rather than silently swapping the referrer.
 */
export async function claimReferral(userId: string, code: string): Promise<ClaimResult> {
  const check = await checkClaim(userId, code);
  if (!check.ok) return check;

  const inserted = await one<Referral>(
    `insert into referrals
       (referred_user_id, referrer_user_id, code, referred_percent, referrer_percent)
     values ($1, $2, $3, $4, $5)
     on conflict (referred_user_id) do nothing
     returning id, referred_user_id, referrer_user_id, code,
               referred_percent, referrer_percent, created_at`,
    [userId, check.referrerId, check.code, REFERRED_DISCOUNT_PERCENT, REFERRER_DISCOUNT_PERCENT],
  );
  if (inserted) return { ok: true, referral: inserted, created: true };

  // Lost the race between checkClaim() and the insert above — another
  // request claimed this account's one referral slot in between.
  const existing = await one<Referral>(
    `select id, referred_user_id, referrer_user_id, code,
            referred_percent, referrer_percent, created_at
       from referrals where referred_user_id = $1`,
    [userId],
  );
  if (!existing) throw new Error('claimReferral: conflict but no row found');
  if (existing.referrer_user_id !== check.referrerId) return { ok: false, reason: 'already_referred' };
  return { ok: true, referral: existing, created: false };
}

export interface ReferralStats {
  code: string | null;
  /** How many accounts have ever claimed this code (paid or not). */
  used_count: number;
  /** How many of those actually completed a paid purchase — decision 2.13: only the count is shown, never who. */
  purchased_count: number;
  /** Total ٪ this code has ever earned. No accumulation cap (decision 2.14 — never expires). */
  earned_percent: number;
  /** The part of `earned_percent` already consumed by a purchase. */
  spent_percent: number;
  /** The part still to spend. Always `earned_percent - spent_percent`. */
  available_percent: number;
  /** What a purchase started right now would apply from this source alone — availableCredits()/pickCredits() decide the real, cap-combined figure at purchase time; this is this source's own contribution. */
  next_purchase_percent: number;
}

/**
 * This account's code + how it has paid off — counts only, never names
 * (decision 2.13).
 *
 * SPENT-NESS COMES FROM discount-credits.ts, NOT FROM A SECOND QUERY HERE.
 * The first cut summed every qualified `referrer_percent` and reported
 * `min(that, cap)` as the next purchase's discount — which is the total ever
 * EARNED, not what is left. A referrer who had already spent their ٪۱۰ was
 * still promised ٪۱۰ on the profile while /pay/plans, reading through
 * availableCredits()' `spentSources` filter, quoted the true figure. Two
 * screens, two numbers, for the same account — exactly what pay.ts:52-54
 * swears must never happen. So the one definition of "spent" is imported and
 * the arithmetic is closed here: earned = spent + available, always.
 *
 * `next_purchase_percent` runs the REAL pick rather than `min(available, cap)`
 * because a credit is atomic: three ٪۷ credits are ٪۲۱ available but only ٪۷
 * spendable, and min() would say ٪۱۰. Today every referral credit is ٪۵ and
 * the two agree; they stop agreeing the day REFERRER_DISCOUNT_PERCENT is
 * re-tuned, which is precisely when nobody will remember to look.
 */
export async function referralStats(userId: string): Promise<ReferralStats> {
  const [codeRow, rows, spent] = await Promise.all([
    myCode(userId),
    query<{ id: string; percent: number; qualified: boolean }>(
      // Same definition of "has actually paid" the credit engine uses, imported
      // rather than restated — a referrer's profile and their price at the till
      // must not be able to disagree about which referrals have paid off.
      `select r.id, r.referrer_percent as percent,
              ${REFERRAL_QUALIFIED_SQL} as qualified
         from referrals r
        where r.referrer_user_id = $1`,
      [userId],
    ),
    spentSources(userId),
  ]);

  // Only a settled referral has earned anything (decision 2.4).
  const qualified = rows.rows.filter((r) => r.qualified);
  const earned = qualified.reduce((sum, r) => sum + r.percent, 0);

  const available: DiscountCredit[] = qualified
    .filter((r) => !spent.has(`referral_bonus:${r.id}`))
    .map((r) => ({
      source: `referral_bonus:${r.id}`, percent: r.percent,
      label_fa: 'پاداش معرفی', kind: 'referral' as const,
    }))
    // pickCredits() does not sort — availableCredits() is what normally hands
    // it an ordered list, so the order has to be reproduced here.
    .sort((a, b) => b.percent - a.percent || (a.source < b.source ? -1 : 1));
  const availablePercent = creditPercent(available);

  return {
    code: codeRow?.code ?? null,
    used_count: rows.rows.length,
    purchased_count: qualified.length,
    earned_percent: earned,
    spent_percent: earned - availablePercent,
    available_percent: availablePercent,
    next_purchase_percent: creditPercent(pickCredits(available)),
  };
}
