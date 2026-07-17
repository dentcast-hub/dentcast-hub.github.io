/**
 * Per-article note (independent of highlights).
 *
 * A note belongs to the whole article, one per (user, content_id) — not to any
 * highlight. Opened/edited from the workbench's یادداشت button.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table article_notes (
  user_id    uuid not null references profiles(id) on delete cascade,
  content_id text not null,
  note       text,
  updated_at timestamptz not null default now(),
  primary key (user_id, content_id)
);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`drop table if exists article_notes cascade;`);
};
