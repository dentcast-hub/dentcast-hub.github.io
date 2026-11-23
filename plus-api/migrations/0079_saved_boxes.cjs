/**
 * کادرهای ذخیره‌شده — a callout box of an article, kept in the دفترچه.
 *
 * A box (module 03, «Structure, chips and callout boxes»: `.dc-box`) is the
 * author's own sentences framed on the page — a clinical tip, a bottom line.
 * A reader saves the WHOLE box with one tap and finds it in the دفترچه beside
 * the highlights and the audio clips, with its label and the article's name.
 *
 * Its own table, deliberately not a row in `highlights`: a highlight is a
 * span the reader chose, text-anchored (exact/prefix/suffix, a content_hash,
 * a Leitner card_state created with every row). A box is a block the AUTHOR
 * chose; nothing is anchored and nothing is quizzed. So the row keeps the
 * words as they were when saved (`text`, `label`) — the دفترچه shows them
 * without fetching the article, and a later edit of the page does not empty a
 * saved card.
 *
 * `text_hash` (sha-256 of the folded text, written by the route) is what makes
 * a second tap on the same box the same row: one box, one save, per reader.
 *
 * Founder decision (the approved mockup): saving a box is PREMIUM — the act is
 * gated, like an audio clip. Reading and deleting stay on any plan, because a
 * lapsed subscriber still owns what they saved.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table saved_boxes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  content_id  text not null,
  label       text,
  text        text not null check (length(text) > 0),
  text_hash   text not null,
  created_at  timestamptz not null default now()
);
create unique index saved_boxes_one_per_box on saved_boxes (user_id, content_id, text_hash);
create index on saved_boxes (user_id, created_at desc);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists saved_boxes;
`);
};
