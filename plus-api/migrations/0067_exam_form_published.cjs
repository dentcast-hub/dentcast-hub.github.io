/**
 * انتشار آزمون — a form is a DRAFT until the founder says otherwise
 * (founder, 2026-09-20).
 *
 * Until now a pathway's exam went live the instant its FIRST question was
 * written: `examState` asked only «does a form row exist, with a non-empty
 * pool», so a pathway whose second question was still being typed was, for
 * every reader who had finished it, a valid one-question exam that issued a
 * real certificate at 70%. Nothing anywhere expressed «I am still writing
 * this», because the only two states the data had were "no row" and "a row".
 *
 * `published_at` is that third state, and it is the founder's DECISION
 * written down — the same move `badge_grants`, `pillar_grants` and
 * `certificates` all make. Null = draft: the pool can grow for weeks and the
 * reader sees precisely what they saw before any question existed. A
 * timestamp = open, and the act of setting it is also what tells everybody
 * who asked for that certificate (services/pathway-exams.ts
 * announceOpenExams) — so there is now exactly ONE road from «questions
 * exist» to «readers know», instead of the four roads of which three were
 * silent.
 *
 * EXISTING ROWS ARE BACKFILLED TO `created_at`, deliberately. Every form in
 * service today is, by definition, already open to its readers — some with
 * attempts in flight and certificates issued from it. A migration that left
 * them null would close every live exam at deploy time and hand the reader a
 * page saying the questions are not ready, which is both false and
 * unrecoverable from their side. The backfill is what makes this change
 * invisible to everyone except the next form written.
 *
 * Deliberately a TIMESTAMP and not a boolean: «since when» is the one thing
 * the panel needs to print beside a live exam, and a re-opened form saying
 * the date it re-opened is more honest than a flag that cannot tell the
 * difference. Un-publishing sets it back to null — the row keeps its
 * questions, its settings and every attempt ever taken on it.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table pathway_exam_forms add column published_at timestamptz;
update pathway_exam_forms set published_at = created_at;
`);
};

exports.down = (pgm) => {
  pgm.sql('alter table pathway_exam_forms drop column published_at;');
};
