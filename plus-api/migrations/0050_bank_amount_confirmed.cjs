/**
 * `amount_confirmed_at` on gift_redemptions — the founder saying «this is the
 * figure, now transfer it».
 *
 * The bank rail already had a place to write the amount (0043's `amount_rial`)
 * and no place at all to write that a HUMAN had settled it. That gap was not
 * cosmetic, it was a deadlock: the buyer's page tells them to agree the amount
 * with support before transferring, and its fine print («تا وقتی پشتیبانی مبلغ
 * را تأیید نکرده، این عدد قیمت لیست است») was keyed on nothing, so it stood
 * there forever — including in the ordinary case where the founder had nothing
 * to change and the list price was already right. Both sides then waited for
 * the other, and the queue filled with claims that had no deposit behind them
 * and never would (found in production, 1405/06/05, two claims deep).
 *
 * A timestamp rather than a boolean, and separate from `amount_rial` rather
 * than inferred from it: "the amount was set" and "the amount was settled with
 * a person" are two different facts, and only the second one is what the buyer
 * is waiting to hear. Inferring it from a non-null `amount_rial` was never
 * available anyway — every claim opens with the list price already written
 * (routes/pay.ts computes it server-side), so that column is never null on
 * this rail and could never have told the two states apart.
 *
 * Nullable, no backfill: the claims already in the queue genuinely have not
 * been confirmed, and stamping them now would tell two waiting buyers that a
 * conversation happened that did not.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table gift_redemptions
  add column amount_confirmed_at timestamptz;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table gift_redemptions drop column if exists amount_confirmed_at;
  `);
};
