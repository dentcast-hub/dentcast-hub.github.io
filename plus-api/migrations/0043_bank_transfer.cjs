/**
 * Bank transfer (واریز به شبا) as a second payment rail, and the student badge
 * that rides along with it.
 *
 * `gift_redemptions` already does everything this needs: a `kind` column to
 * carry a second rail beside `apple_us`, a manual approval queue, a reference
 * the buyer types into the transfer's «بابت» field, and — critically — a
 * ledger that is NOT `payments` and therefore does not touch the e-namad
 * monthly ceiling (that allowance governs rial through Zibal; a bank transfer
 * approved by hand never goes through Zibal). Building a second table would
 * duplicate all of that for no reason.
 *
 * `has_photo` on `support_tickets`: a claim the reader makes, not something
 * derived from other rows — exactly the same kind of fact `status` already
 * is. It lets the ticket queue show a «📎 عکس در راه» flag instead of the
 * founder discovering a photo only when it lands in Telegram.
 *
 * `amount_rial` on `gift_redemptions`: what the founder writes on a bank
 * transfer, since the amount is decided outside the gateway (full price by
 * default, the student's ٪۱۵-off price when the founder sees a student card
 * and types it in). Nullable on purpose — the existing Apple gift-card rows
 * are priced in dollars, not rial, and must not be forced to carry a rial
 * figure they never had.
 *
 * The one-pending-claim unique index becomes PER KIND: without this, someone
 * with a pending Apple gift-card claim would be refused a bank-transfer claim
 * (and vice versa) by the same index that is supposed to stop one person
 * double-claiming the SAME rail.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table support_tickets
  add column has_photo boolean not null default false;

alter table gift_redemptions
  add column amount_rial bigint;

drop index if exists gift_redemptions_one_pending;
create unique index gift_redemptions_one_pending
  on gift_redemptions (user_id, kind) where status = 'pending';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists gift_redemptions_one_pending;
create unique index gift_redemptions_one_pending
  on gift_redemptions (user_id) where status = 'pending';

alter table gift_redemptions drop column if exists amount_rial;
alter table support_tickets drop column if exists has_photo;
  `);
};
