/**
 * The pathway exam, end to end: the FORM the founder writes once per pathway,
 * the ASSIGNMENT that opens it to one reader early, the ATTEMPTS readers make
 * against it, and the founder's RULINGS kept as worked examples for the
 * grader.
 *
 * Migration 0059 modelled only the assignment, with the questions pasted INTO
 * it, because the question format was still an open decision. It is decided
 * now (founder, 2026-09-12): whatever NotebookLM produced that he liked, in
 * whatever count — multiple-choice and/or free text — graded per answer, two
 * attempts a week apart, every threshold 70%. Three consequences reshape the
 * tables:
 *
 *   · The questions belong to the PATHWAY, not to one reader. A reader-scoped
 *     pool would have to be pasted again for every candidate, and — worse —
 *     the founder's rulings on one reader's answers could never teach the
 *     grader anything about the next reader's. `pathway_exam_forms` is one
 *     row per pathway; `pathway_exams` shrinks to a pure assignment (who was
 *     let in early) and drops its `questions`/`max_attempts` columns. Nothing
 *     is migrated out of them: no production row had been written.
 *
 *   · An attempt is a SNAPSHOT. `pathway_exam_attempts.questions` copies the
 *     drawn questions — answers and key points included — at start, so a
 *     founder editing the pool mid-attempt cannot change what a reader is
 *     being graded against, and grading never has to look the questions up
 *     again. It is opened at start (`status = 'open'`) rather than at submit
 *     because the draw must survive a reload and a second visit tomorrow: a
 *     reader who saw the questions and comes back sees the SAME questions.
 *
 *   · Nothing derivable is stored beside the verdict. `mcq_correct`,
 *     `free_covered` and the pass/fail are all computable from `verdict`, but
 *     the founder's queue lists hundreds of these and should not parse JSON
 *     to sort them — so the counts are written ONCE at settle, by the same
 *     function that writes the verdict, and never updated separately.
 *
 * `status` is the whole state machine:
 *   open      → drawn, unsubmitted (does not count as an attempt yet)
 *   queued    → submitted; the grader was unsure, or the form is still in
 *               its supervised period — the founder decides
 *   passed    → settled, threshold met; a certificate was issued
 *   failed    → settled, threshold missed
 *   void      → the founder struck it (counts toward nothing)
 *
 * `pathway_exam_examples` is `challenge_examples` one level up: a founder
 * ruling on ONE free-text answer, keyed by question id so the next attempt at
 * the same question is graded with it in view.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table pathway_exam_forms (
  id                uuid primary key default gen_random_uuid(),
  pathway_id        text not null unique,
  questions         jsonb not null default '[]'::jsonb,
  mcq_draw          int not null default 0,
  free_draw         int not null default 0,
  pass_percent      int not null default 70,
  max_attempts      int not null default 2,
  retry_days        int not null default 7,
  supervised_until  int not null default 5,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (pass_percent between 1 and 100),
  check (max_attempts between 1 and 10),
  check (retry_days between 0 and 365)
);

alter table pathway_exams
  drop column if exists questions,
  drop column if exists max_attempts;

create table pathway_exam_attempts (
  id            uuid primary key default gen_random_uuid(),
  form_id       uuid not null references pathway_exam_forms(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  pathway_id    text not null,
  attempt_no    int not null,
  holder_name   text,
  questions     jsonb not null,
  answers       jsonb,
  verdict       jsonb,
  status        text not null default 'open',
  settled_by    text,
  mcq_correct   int,
  mcq_total     int,
  free_covered  int,
  free_total    int,
  reference     text not null unique,
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  settled_at    timestamptz,
  unique (form_id, user_id, attempt_no),
  check (status in ('open','queued','passed','failed','void')),
  check (settled_by is null or settled_by in ('ai','founder'))
);
create index pathway_exam_attempts_user on pathway_exam_attempts (user_id, pathway_id, created_at desc);
create index pathway_exam_attempts_queue on pathway_exam_attempts (submitted_at) where status = 'queued';

create table pathway_exam_examples (
  id           uuid primary key default gen_random_uuid(),
  form_id      uuid not null references pathway_exam_forms(id) on delete cascade,
  question_id  text not null,
  answer_text  text not null,
  verdict      jsonb not null,
  created_at   timestamptz not null default now()
);
create index pathway_exam_examples_q on pathway_exam_examples (form_id, question_id, created_at desc);

alter table certificates
  add column attempt_id uuid references pathway_exam_attempts(id) on delete set null;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table certificates drop column if exists attempt_id;
drop table if exists pathway_exam_examples;
drop table if exists pathway_exam_attempts;
alter table pathway_exams
  add column questions jsonb not null default '[]'::jsonb,
  add column max_attempts int not null default 2;
drop table if exists pathway_exam_forms;
`);
};
