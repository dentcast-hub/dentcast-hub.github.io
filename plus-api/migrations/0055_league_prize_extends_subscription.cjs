/**
 * League prize for an already-paying subscriber: the days are stacked onto
 * their `subscriptions` row via activateDays(), and the premium_grants row is
 * kept for cooldown / banner / idempotency. `extends_subscription` records that
 * path so the banner and push can say "days were added" instead of "you became
 * premium" — claiming the latter to someone who already paid is the whole
 * reason the old code skipped them and passed the prize down.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table premium_grants
  add column extends_subscription boolean not null default false;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table premium_grants drop column if exists extends_subscription;
`);
};
