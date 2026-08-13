import { one, query, type Queryable, pool } from '../db.js';
import { toLatinDigits } from './phone.js';

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

  const purchased = await one<{ x: number }>(
    "select 1 as x from payments where user_id = $1 and status = 'paid' limit 1", [userId],
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
  /** Total ٪ earned across every settled referral. No accumulation cap (decision 2.14 — never expires). */
  earned_percent: number;
  /** What a purchase started right now would actually apply from this source alone — availableCredits()/pickCredits() decide the real, cap-combined figure at purchase time; this is this source's own contribution. */
  next_purchase_percent: number;
}

const CREDIT_CAP_PERCENT = 10; // mirrors discount-credits.ts's own constant — informational only, see the field's doc above

/** This account's code + how it has paid off — count only, never names (decision 2.13). */
export async function referralStats(userId: string): Promise<ReferralStats> {
  const [codeRow, counts] = await Promise.all([
    myCode(userId),
    one<{ used: number; purchased: number; earned: number }>(
      `select
         count(*)::int as used,
         count(*) filter (
           where exists (
             select 1 from payments p
              where p.user_id = r.referred_user_id and p.status = 'paid'
           )
         )::int as purchased,
         coalesce(sum(r.referrer_percent) filter (
           where exists (
             select 1 from payments p
              where p.user_id = r.referred_user_id and p.status = 'paid'
           )
         ), 0)::int as earned
         from referrals r
        where r.referrer_user_id = $1`,
      [userId],
    ),
  ]);
  const earned = counts?.earned ?? 0;
  return {
    code: codeRow?.code ?? null,
    used_count: counts?.used ?? 0,
    purchased_count: counts?.purchased ?? 0,
    earned_percent: earned,
    next_purchase_percent: Math.min(earned, CREDIT_CAP_PERCENT),
  };
}
