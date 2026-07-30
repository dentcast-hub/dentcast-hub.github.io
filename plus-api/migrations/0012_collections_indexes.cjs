/**
 * Collections (user-made, freeform folders of saved highlights/pages — spec
 * §4's `collections`/`collection_items`, provisioned since migration 0001 but
 * never used until now). Add the indexes/constraints the feature actually
 * needs now that it has real read/write paths:
 *
 * - `collections (user_id, created_at desc)` — GET /collections lists a
 *   user's own collections, newest first.
 * - `collection_items (collection_id)` — GET /collections/:id reads one
 *   collection's items.
 * - Two PARTIAL unique indexes (not one, because the two item shapes are
 *   mutually exclusive: a highlight-item has `highlight_id`, a whole-page item
 *   has NULL `highlight_id` + a bare `content_id`) so adding the same
 *   highlight — or the same page — to a collection twice is a no-op at the DB
 *   level, not just an app-level check.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create index collections_user_idx on collections (user_id, created_at desc);
create index collection_items_collection_idx on collection_items (collection_id);
create unique index collection_items_highlight_uniq
  on collection_items (collection_id, highlight_id) where highlight_id is not null;
create unique index collection_items_page_uniq
  on collection_items (collection_id, content_id) where highlight_id is null;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists collection_items_page_uniq;
drop index if exists collection_items_highlight_uniq;
drop index if exists collection_items_collection_idx;
drop index if exists collections_user_idx;
  `);
};
