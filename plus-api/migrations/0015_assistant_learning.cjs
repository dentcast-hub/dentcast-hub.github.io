/**
 * «دستیار هوشمند» learns from what actually happened.
 *
 *   assistant_rounds      - one row per round the assistant SHOWED. The raw
 *                           case description is never stored: only a sha256 of
 *                           its normalised form (desc_hash), so a repeat is
 *                           recognisable without keeping what a dentist wrote
 *                           about a patient. `words` holds the normalised
 *                           keyword tokens the tag match ran on — those are
 *                           specialist topic terms, not the user's prose.
 *                           `offered` keeps each option WITH its position, so a
 *                           click can be discounted for the position bias that
 *                           would otherwise make the top option self-confirming.
 *
 *   assistant_tag_scores  - the learned signal, aggregated per (word, tag).
 *                           This is what makes the assistant smarter over time:
 *                           when a future case suggests the same words, tags
 *                           that historically ended well are nudged up. Keyed on
 *                           WORD rather than desc_hash on purpose — keying on
 *                           the whole description would only ever help someone
 *                           who typed the exact same case.
 *
 * Weights live in code (services/assistant-learning.ts), not here, so they can
 * be retuned without a migration; `score` is their running sum and `events` the
 * number of signals behind it, so a big score from one lucky event can be told
 * apart from a big score from fifty.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table assistant_rounds (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  desc_hash     text not null,
  words         text[] not null default '{}',
  round_no      int  not null,
  offered       jsonb not null default '[]'::jsonb,
  chosen_key    text,
  was_custom    boolean not null default false,
  resolved_tag  text,
  feedback      text,
  clicked_at    timestamptz,
  attributed_at timestamptz,
  created_at    timestamptz not null default now()
);
create index on assistant_rounds (user_id, created_at desc);
create index on assistant_rounds (desc_hash);
-- The attribution sweep looks for resolved rounds not yet credited.
create index on assistant_rounds (attributed_at) where resolved_tag is not null;

create table assistant_tag_scores (
  word       text not null,
  tag_key    text not null,
  score      real not null default 0,
  events     int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (word, tag_key)
);
create index on assistant_tag_scores (word);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists assistant_tag_scores;
drop table if exists assistant_rounds;
`);
};
