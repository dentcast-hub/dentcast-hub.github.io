/**
 * Collections, phase 3b: give a board an identity and let the user choose the
 * order of what is in it.
 *
 * `collections.emoji` / `.color` / `.description` — a board is the user's own
 * shelf, and until now every shelf looked identical: same generated cover,
 * same grey title, nothing to tell "امتحان بورد" from "کیس خانم ر." at a
 * glance. All three are optional; a board with none of them renders exactly as
 * it does today.
 *
 * `collection_items.position` — a curated board has an order the user means
 * (prerequisite → advanced, or the sequence they will revise in), which
 * created_at cannot express. NULL means "not manually placed": those keep
 * falling back to newest-first, so every existing board is untouched until its
 * owner drags something. The API writes positions for the WHOLE board at once
 * (PUT /collections/:id/items/order), so the column is only ever fully set or
 * fully null and there is no half-ordered state to reason about.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table collections add column description text;
alter table collections add column emoji text;
alter table collections add column color text;
alter table collection_items add column position integer;
-- GET /collections/:id reads one board in display order: manual placement
-- first, then newest-first for anything never placed.
create index collection_items_order_idx
  on collection_items (collection_id, position, created_at desc);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists collection_items_order_idx;
alter table collection_items drop column if exists position;
alter table collections drop column if exists color;
alter table collections drop column if exists emoji;
alter table collections drop column if exists description;
  `);
};
