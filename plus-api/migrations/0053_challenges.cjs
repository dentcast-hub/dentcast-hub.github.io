/**
 * چالش — a founder-authored question published into an existing folder
 * (chairside/, insight/, whichever), with model-assisted grading against key
 * points the founder writes at publish time. Design ledger:
 * .dentcast/challenge-handoff.md.
 *
 * `challenges` — the founder's half, one row per page that HAS a چالش.
 * `key_points` is [{ id: 'kp1', text: '…' }, …], 3 to 5 of them. Never
 * published anywhere (handoff RULE 2): a sidecar beside des-scores.json would
 * be readable at a URL by anyone with devtools, which defeats the premium
 * gate and the feature in one tab, and it is also the wrong home because a
 * wrong key point should be fixable in thirty seconds with no deploy.
 *
 * `challenge_attempts` — a reader's single attempt (RULE 3: one attempt per
 * reader per page, enforced by the unique index below, never by a count —
 * submitting reveals the founder's answer, so a second attempt is not a
 * retry). `verdict` is [{ id, state, by }], state in covered|missing, by in
 * 'ai'|'founder' — NULL while queued.
 *
 * `challenge_examples` — a founder ruling kept as a worked example for the
 * SAME challenge, which is what makes the queue shrink as a چالش ages: the
 * first readers teach it how people phrase this particular answer.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table challenges (
  content_id  text primary key,
  answer_fa   text not null,
  key_points  jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table challenge_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  content_id  text not null references challenges(content_id) on delete cascade,
  answer_text text not null,
  reference   text not null unique,
  status      text not null default 'queued',
  verdict     jsonb,
  created_at  timestamptz not null default now(),
  settled_at  timestamptz,
  check (status in ('queued','settled'))
);
create unique index challenge_attempts_one_per_page
  on challenge_attempts (user_id, content_id);
create index challenge_attempts_queue
  on challenge_attempts (created_at) where status = 'queued';

create table challenge_examples (
  id          uuid primary key default gen_random_uuid(),
  content_id  text not null references challenges(content_id) on delete cascade,
  answer_text text not null,
  verdict     jsonb not null,
  created_at  timestamptz not null default now()
);
create index challenge_examples_content
  on challenge_examples (content_id, created_at desc);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists challenge_examples;
drop table if exists challenge_attempts;
drop table if exists challenges;
  `);
};
