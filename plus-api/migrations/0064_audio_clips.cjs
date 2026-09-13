/**
 * قطعه‌های صوتی — a highlight in TIME instead of in text.
 *
 * A listener marks a start and an end on an episode («شروع قطعه» / «پایان
 * قطعه» under the player), and the segment plays back — on the episode page,
 * and inside the دفترچه without opening the episode. Nothing is cut and nothing
 * is uploaded: what is written is two numbers on the episode's own audio file.
 *
 * Its own table, deliberately not a row in `highlights`: that table is
 * text-anchored (exact/prefix/suffix, a content_hash, a Leitner card_state
 * created with every row) and none of that has a meaning for a span of audio.
 * A clip has no card either — there is no text to be quizzed on.
 *
 * Founder decision, 2026-09-13: creating a clip is PREMIUM from day one (the
 * first act on the site gated at creation rather than at arrangement — see
 * routes/clips.ts for why). Reading, editing and deleting a clip stay on any
 * plan, because a lapsed subscriber still owns what they marked.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table audio_clips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  content_id  text not null,
  start_s     real not null check (start_s >= 0),
  end_s       real not null,
  note        text,
  label       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint audio_clips_span check (end_s > start_s)
);
create index on audio_clips (user_id, content_id);
create index on audio_clips (user_id, created_at desc);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists audio_clips;
`);
};
