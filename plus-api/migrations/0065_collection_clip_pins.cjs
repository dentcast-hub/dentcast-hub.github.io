/**
 * A قطعه‌ی صوتی (audio_clips, migration 0064) can be pinned to a collection.
 *
 * Fourth pin kind, same shape as the third (migration 0036's snippet_id): the
 * pin row only REFERENCES the clip — one clip, many boards, «انتقال» stays
 * add-then-remove — and `collection_items_clip_uniq` makes a repeat pin a
 * DB-level no-op like the other three partial unique indexes.
 *
 * `content_id` stays NULL on a clip pin on purpose: migration 0012's page
 * index is (collection_id, content_id) WHERE highlight_id IS NULL, so writing
 * the episode's id here would make a clip pin collide with a page pin of the
 * same episode — and two clips of one episode with each other. The episode is
 * read through the join (audio_clips.content_id), never stored twice.
 *
 * The one-kind check is rewritten as a count, because «not (A and B)» does not
 * generalise past two.
 *
 * No orphan rule: a clip lives in the دفترچه whether or not it is pinned
 * anywhere (unlike a snippet, which has no home outside its boards).
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table collection_items add column clip_id uuid references audio_clips(id) on delete cascade;
create unique index collection_items_clip_uniq
  on collection_items (collection_id, clip_id) where clip_id is not null;
create index collection_items_clip_idx on collection_items (clip_id) where clip_id is not null;
alter table collection_items drop constraint if exists collection_items_one_kind;
alter table collection_items add constraint collection_items_one_kind
  check (
    (highlight_id is not null)::int + (snippet_id is not null)::int + (clip_id is not null)::int <= 1
  );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table collection_items drop constraint if exists collection_items_one_kind;
alter table collection_items add constraint collection_items_one_kind
  check (not (highlight_id is not null and snippet_id is not null));
drop index if exists collection_items_clip_idx;
drop index if exists collection_items_clip_uniq;
alter table collection_items drop column if exists clip_id;
  `);
};
