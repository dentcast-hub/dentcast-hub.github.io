/**
 * Collections, phase 4: two new pin kinds — a text pin («متن خودم», any text
 * the user writes/pastes) and a reference pin («رفرنس», a cited paper,
 * DOI-fetched client-side or entered manually). See
 * `.dentcast/collections-pins-export-handoff.md` for the full design.
 *
 * `snippets` is a NEW table, deliberately not named "notes" — `article_notes`
 * (migration 0003) already owns that word for the workbench یادداشت feature,
 * and a second table sharing the name would be a collision waiting to happen.
 *
 * The snippet body lives in its own table and `collection_items` only
 * references it (like `highlight_id`) rather than embedding the text on the
 * pin row — same philosophy as highlights and pathway items: one item, many
 * homes. A snippet can be pinned to several boards, and «انتقال» (move)
 * becomes add-then-remove instead of a copy+delete that would fork the text.
 *
 * `collection_items_snippet_uniq` is a third partial unique index, symmetric
 * with migration 0012's two (`..._highlight_uniq` / `..._page_uniq`):
 * pinning the same snippet to the same board twice is a DB-level no-op.
 *
 * `collection_items_one_kind`: a pin is exactly one shape — highlight XOR
 * snippet XOR bare page. `content_id` was already nullable (migration 0001),
 * so a snippet pin simply leaves it NULL.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table snippets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null check (kind in ('text','reference')),
  -- kind='text':      title optional, body required (the text itself)
  -- kind='reference': title required (article title), body optional (the
  --                   user's own annotation, rendered like a highlight note)
  title      text,
  body       text,
  -- reference-only columns (null for kind='text'):
  authors    text,
  venue      text,          -- journal + anything the user wrote, freeform
  year       integer,
  doi        text,          -- bare DOI, no URL prefix, e.g. 10.1016/j.dental.2017.11.005
  url        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index snippets_user_idx on snippets (user_id, created_at desc);

alter table collection_items add column snippet_id uuid references snippets(id) on delete cascade;
create unique index collection_items_snippet_uniq
  on collection_items (collection_id, snippet_id) where snippet_id is not null;
alter table collection_items add constraint collection_items_one_kind
  check (not (highlight_id is not null and snippet_id is not null));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table collection_items drop constraint if exists collection_items_one_kind;
drop index if exists collection_items_snippet_uniq;
alter table collection_items drop column if exists snippet_id;
drop index if exists snippets_user_idx;
drop table if exists snippets;
  `);
};
