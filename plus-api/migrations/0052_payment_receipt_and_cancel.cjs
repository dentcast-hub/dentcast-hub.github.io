/**
 * Two gaps found by walking both purchase journeys end to end (1405/06/05).
 *
 * `payments.bank_ref` — the gateway's OWN reference number for the transaction
 * (Zibal's `refNumber`, the «شماره پیگیری» a bank prints on its receipt). It
 * was already being read from the verify response and written into the
 * subscription activation's audit meta, and then existed nowhere a person
 * could reach: not on the payment row, not in `GET /pay/status`, so the
 * result page could not print it. That is the one number a customer needs to
 * dispute a charge with their own bank and the one the founder needs to match
 * a line in the gateway panel against a subscription here — recoverable only
 * by digging through activation JSON.
 *
 * Deliberately NOT `ref_id`, which already holds our own trackId and is half
 * of the unique index that makes settling idempotent. Two different numbers
 * with two different owners; overloading one column to save the other is how
 * a dedup index quietly starts matching the wrong thing.
 *
 * `'canceled'` on gift_redemptions — a buyer may now withdraw their own open
 * claim. Until this there was no way out of one: the partial unique index
 * allows exactly one pending claim per rail, so somebody who pressed «دریافت
 * کد پیگیری» on a one-month plan and then decided on six months was handed
 * back the one-month claim, at the one-month price, forever — and the only
 * release was the founder rejecting it. A cancel is not a rejection: nobody
 * refused anything, and filing it as one would put the founder's name on the
 * buyer's own change of mind and count it in any refusal the queue reports.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table payments
  add column bank_ref text;

alter table gift_redemptions
  drop constraint if exists gift_redemptions_status_check;
alter table gift_redemptions
  add constraint gift_redemptions_status_check
  check (status in ('pending', 'approved', 'rejected', 'canceled'));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
update gift_redemptions set status = 'rejected' where status = 'canceled';
alter table gift_redemptions
  drop constraint if exists gift_redemptions_status_check;
alter table gift_redemptions
  add constraint gift_redemptions_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table payments drop column if exists bank_ref;
  `);
};
