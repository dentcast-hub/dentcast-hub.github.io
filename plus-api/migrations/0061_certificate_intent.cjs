/**
 * «گواهی‌نامهٔ این مسیر را می‌خواهی؟» — the reader's declared intent, on the
 * enrolment row.
 *
 * The near-the-end alert (services/pathway-standings.ts) was firing for
 * every premium reader close to a finish, and the founder writes an exam
 * for each one — but some readers walk a pathway with no interest in the
 * certificate at all, and a question written for somebody who never wanted
 * it is an evening spent for nobody. So the alert is now for readers who
 * SAID they want it, and this is where that is recorded: two nullable
 * columns on `user_pathways`, because intent is a fact about the
 * enrolment, not a table of its own. `wanted` / `declined` / null (never
 * asked, or answered nothing); `declined` is kept rather than deleted so
 * the founder's table can still show «تمام کرد، گواهی نمی‌خواهد» instead of
 * a gap. Reversible: the reader can change the answer.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table user_pathways
  add column certificate_intent    text check (certificate_intent in ('wanted', 'declined')),
  add column certificate_intent_at timestamptz;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table user_pathways
  drop column if exists certificate_intent_at,
  drop column if exists certificate_intent;
`);
};
