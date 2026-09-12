/**
 * The pathway completion certificate, and the exam that stands in front of it.
 *
 * `certificates` has existed since migration 0001 — the spec provisioned it
 * ("pathway-completion certificates (verification code, shareable)") and
 * nothing ever wrote a row. It keeps its shape and its `verify_code` unique
 * index, and grows the three things a certificate that is actually issued
 * turns out to need:
 *
 *   · `holder_name` — the name PRINTED on it. Not `display_name`: that
 *     defaults to a generated Persian pseudonym, which is exactly right for a
 *     public comment thread and exactly wrong on a document somebody hands to
 *     a third party. The founder types it at issue time from what the reader
 *     sent them, and it is frozen there — a certificate whose name follows
 *     the profile is a certificate whose verify page can disagree with the
 *     paper in the reader's hand.
 *   · `exam_id` — which exam earned it, when one did. Nullable on purpose:
 *     the founder may issue by hand (a founding reader, a pilot), and the
 *     decision is the founder's, not the exam's.
 *   · `revoked_at` — a certificate is never deleted, because its code may
 *     already be on a LinkedIn profile. Revoking keeps the row and makes the
 *     verify page say so, which is the honest answer to somebody checking.
 *   · `discount_grant_id` — the ٪۱۰ that rides along, so the panel can show
 *     the two as one act. The credit itself is an ordinary `discount_grants`
 *     row (WRITTEN, never derived: pathway progress goes backwards every time
 *     step 5.6 files new content into a pathway, and a derived credit would
 *     vanish with it — see services/pathway-standings.ts).
 *
 * `pathway_exams` is the founder ASSIGNING an exam to one reader for one
 * pathway. It exists so the assignment can be made from the admin panel
 * before the exam format is decided: `questions` is JSONB with no schema
 * enforced here, because what a question IS (binary, free-text graded like a
 * چالش, a mix) is the open decision, and a column per shape would decide it
 * by accident. `max_attempts` is the one decision already made (two).
 *
 * One exam per (reader, pathway): a second assignment is a founder decision
 * to replace the first, done by deleting it. Attempts are NOT modelled yet —
 * they need the format, and a table with no writer is a promise the code
 * cannot keep.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table pathway_exams (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  pathway_id    text not null,
  questions     jsonb not null default '[]'::jsonb,
  max_attempts  int not null default 2,
  note          text,
  created_at    timestamptz not null default now(),
  unique (user_id, pathway_id)
);

alter table certificates
  add column holder_name        text,
  add column exam_id            uuid references pathway_exams(id) on delete set null,
  add column revoked_at         timestamptz,
  add column discount_grant_id  uuid;

create index certificates_user_idx on certificates (user_id, issued_at desc);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists certificates_user_idx;
alter table certificates
  drop column if exists discount_grant_id,
  drop column if exists revoked_at,
  drop column if exists exam_id,
  drop column if exists holder_name;
drop table if exists pathway_exams;
`);
};
