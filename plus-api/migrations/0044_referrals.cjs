/**
 * کد معرف — referral codes and the credits they mint. Design ledger:
 * .dentcast/referral-handoff.md. No new discount engine: this is a third
 * SOURCE for services/discount-credits.ts, beside 'badge:' and 'grant:'.
 *
 * `referral_codes` — one code per account, minted once and never changed
 * (decision 2.7: the code is shared in a WhatsApp group / story, and a
 * mutable code either breaks those links or lets someone hijack a code that
 * just went out). `code` is the alias plus the last two digits of the
 * owner's mobile (or two random digits for a phone-less, Telegram-first
 * account — decision 2.8); uniqueness is enforced on the WHOLE code, never
 * on the digits alone.
 *
 * `referrals` — the fact that X referred Y, written once. Both discounts are
 * DERIVED from this one row (the repo's own doctrine: pillar.ts, badge_grants,
 * achievements.ts — what is written is the decision, the entitlement stays
 * derived). `referred_user_id` is UNIQUE: a lifetime-once database constraint
 * instead of a forgettable application check (decision 2.6). The percentages
 * are stamped onto the row rather than read from a constant (decision 2.3):
 * retuning REFERRED_DISCOUNT_PERCENT/REFERRER_DISCOUNT_PERCENT tomorrow must
 * not rewrite the value of a referral already earned.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table referral_codes (
  user_id    uuid primary key references profiles(id) on delete cascade,
  alias      text not null,
  code       text not null unique,
  created_at timestamptz not null default now(),
  check (alias ~ '^[a-z]{4,16}$'),
  check (code  ~ '^[a-z]{4,16}[0-9]{2}$')
);

create table referrals (
  id               uuid primary key default gen_random_uuid(),
  -- یکتا: هر حساب در تمام عمرش فقط یک بار معرفی می‌شود (تصمیم ۲.۶)
  referred_user_id uuid not null unique references profiles(id) on delete cascade,
  referrer_user_id uuid not null references profiles(id) on delete cascade,
  -- کد همان‌طور که مصرف شد، برای سابقه؛ منبع حقیقتِ مالکیت referrer_user_id است
  code             text not null,
  -- درصدها اینجا مهر می‌شوند تا تغییر ثابت‌ها اعتبارِ کسب‌شده را عقب نبرد (تصمیم ۲.۳)
  referred_percent int not null check (referred_percent between 1 and 100),
  referrer_percent int not null check (referrer_percent between 1 and 100),
  created_at       timestamptz not null default now(),
  check (referrer_user_id <> referred_user_id)
);
-- «چند نفر با کد من آمدند» و مشتق‌کردن اعتبارِ معرف
create index on referrals (referrer_user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists referrals;
drop table if exists referral_codes;
  `);
};
