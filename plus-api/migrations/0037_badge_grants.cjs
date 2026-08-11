/**
 * Granted badges — the founder-given class of the badge wall («همراه» is the
 * first member).
 *
 * The wall's doctrine is that no badge is ever written down; every one is
 * derived from an independent fact the product already keeps. A granted badge
 * keeps that doctrine the same way «ستون» does with the payments ledger: what
 * is WRITTEN is the founder's decision — one row here — and the badge itself
 * stays derived (services/achievements.ts folds each row into a `grant:<key>`
 * metric worth 1, and the evaluator's one comparison does the rest).
 *
 * One row per (user, badge): granting is idempotent by the unique constraint,
 * so pressing the admin button twice cannot mint a second anything. Deleting
 * the row un-earns the badge; the announcement ledger's high-water mark means
 * a revoked-then-regranted badge is never re-celebrated, which is the right
 * side to err on.
 *
 * The MONEY of a granted badge deliberately does not live here: a one-time
 * discount that rides along with a grant is an ordinary discount_grants row
 * (0031), written by the same admin action — the wall and the till stay two
 * systems that each already work.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table badge_grants (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_key  text not null,
  note       text,
  created_at timestamptz not null default now(),
  unique (user_id, badge_key)
);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists badge_grants;
`);
};
