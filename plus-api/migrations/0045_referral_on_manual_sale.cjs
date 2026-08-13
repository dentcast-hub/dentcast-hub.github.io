/**
 * کد معرف on the manual rails (واریز به شبا / گیفت‌کارت).
 *
 * The referral discount was gateway-only: POST /pay/bank-transfer priced the
 * claim from PLAN_PRICES_RIAL and never looked at a code, so somebody who had
 * been given one and could not use the gateway simply did not get their ٪۱۰,
 * and the person who referred them earned nothing. Founder's call, 2026-08-13:
 * the amount the buyer is asked to transfer must already be the discounted
 * one, and the referrer collects their ٪۵ once the transfer is approved.
 *
 * ONE NULLABLE COLUMN, AND IT IS A LINK RATHER THAN A FLAG. The obvious shape
 * — «mark the referral consumed» — is the one to avoid: a boolean set when the
 * claim opens is wrong the moment the founder rejects it (the buyer has burned
 * their one-time ٪۱۰ on a sale that never happened), and a boolean set on
 * approval leaves a window where the same credit can also be spent at the
 * gateway. So this stores WHICH referral the claim is spending, and
 * spent-ness stays a JOIN on the claim's own status — pending or approved
 * means held, rejected releases it — which is exactly how
 * discount_redemptions ↔ payments already decides the same question, with no
 * cleanup path that can be forgotten.
 *
 * `on delete set null`: mergeProfiles deletes referral rows that a merge would
 * make self-referential or duplicate, and a historical claim must survive that
 * with its amount intact. It loses the link, not the money.
 *
 * Nullable by construction — every gift-card claim and every bank transfer
 * opened before today has no referral, and none of them should acquire one.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table gift_redemptions
  add column referral_id uuid references referrals(id) on delete set null;

-- Read from two directions: "is this referral's ٪۱۰ already held by a claim?"
-- (services/discount-credits.ts) and the founder's own queue joins.
create index gift_redemptions_referral_idx on gift_redemptions (referral_id)
  where referral_id is not null;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists gift_redemptions_referral_idx;
alter table gift_redemptions drop column if exists referral_id;
`);
};
