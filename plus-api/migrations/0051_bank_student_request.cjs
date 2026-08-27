/**
 * `student_request` on gift_redemptions — which bank claims are actually
 * waiting on a human, and which are just waiting on a bank.
 *
 * 0050 gave the rail a way to say «the figure is settled, transfer it», and
 * then made EVERY claim wait for it. That was wrong, and the founder said so
 * the same day: an ordinary subscription has nothing to negotiate. Its price
 * is the list price, computed server-side, identical to what the gateway
 * charges — asking somebody to message support before paying for a one-month
 * plan is a step invented for no one's benefit, and it is a step that loses
 * sales, since a buyer who has to open Telegram first mostly does not.
 *
 * There is exactly ONE amount on this rail a human decides: the student rate,
 * which is ٪۱۵ off, exists only on the six-month plan, and is earned by
 * sending a student card. So the wait belongs to the claims that ask for it
 * and to no others, and the buyer is the one who knows which theirs is — they
 * tick «دانشجو هستم» when they open it (routes/pay.ts refuses the tick on any
 * other term rather than quietly opening a full-price claim).
 *
 * Recorded rather than inferred: neither the months nor the amount can stand
 * in for it. A six-month claim is usually not a student's, and every claim
 * opens at the list price, so «amount differs from the list» is false for a
 * student's claim precisely while they are waiting for it to become true.
 *
 * `not null default false` and no backfill: the two claims in the queue when
 * this shipped were ordinary ones, and telling their buyers to wait for a card
 * they never mentioned would be the same deadlock 0050 was written to end.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table gift_redemptions
  add column student_request boolean not null default false;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table gift_redemptions drop column if exists student_request;
  `);
};
