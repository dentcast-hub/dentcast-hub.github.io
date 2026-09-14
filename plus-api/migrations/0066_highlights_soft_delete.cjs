/**
 * Soft-deleted highlights — «حذف» becomes reversible, so میز کار can offer
 * undo/redo (founder request, 2026-09-14).
 *
 * The undo stack the workbench keeps is a list of INVERSE server calls: the
 * inverse of «create» is a delete, of «recolour» the previous colour, of
 * «note» the previous text. The one inverse that did not exist was the
 * inverse of «delete». `DELETE /highlights/:id` was a hard delete, and two
 * tables hang off a highlight with `on delete cascade` — `card_state` (its
 * Leitner card, with the box it has climbed to) and `collection_items` (every
 * board it is pinned on). Re-creating the row on undo mints a NEW id, so the
 * card starts over at box 1, the pins are gone for good, and every
 * `?dcphl=<id>` link already pasted somewhere breaks. "Undo" would restore
 * something that LOOKS like the highlight and is not it.
 *
 * So the row stays and gets a `deleted_at` — the same move certificates make
 * («revoked, never deleted», migration 0059). The cascades never fire, the id
 * survives, and restore is one UPDATE.
 *
 * WHY A VIEW, AND NOT A COLUMN PLUS A FILTER. Twenty-seven queries read this
 * table today — routes, the score, the badge wall, the monthly report,
 * pathway standings, the concept view, consumption — and every one of them
 * must exclude a deleted highlight or it silently counts toward something
 * (a badge threshold, a league total, «۱۲۳ هایلایت» on the dashboard). A
 * filter added at each site is a filter the twenty-eighth site forgets. So
 * the base table is renamed to `highlights_all` and `highlights` becomes a
 * VIEW over it filtered on `deleted_at is null`: every existing read is
 * correct unchanged, every future read is correct by default, and the two
 * writes that MUST see deleted rows (the delete itself and the restore) say
 * `highlights_all` out loud. It is the same "one predicate every door reads"
 * shape as `isCertifiable()` and `SUMMARY_SELECT`, one level down.
 *
 * The view is auto-updatable (one table, no aggregates), so `insert into
 * highlights … returning` and `update highlights … where id = $1` keep
 * working exactly as before, and an UPDATE through the view can only ever
 * reach a live row — a PATCH cannot resurrect a deleted highlight by
 * accident. Foreign keys are bound by OID and follow the rename; nothing
 * that references `highlights(id)` changes.
 *
 * Two readers COUNT cards without joining the highlight (`GET /me`'s
 * `due_card_count` and the review reminder sweep); those are joined to the
 * view in the same commit, or a deleted highlight's card would still ring
 * the bell for a card the review page then cannot show.
 *
 * NOT decided here: when — if ever — a deleted row is purged for real. The
 * undo stack lives one session and there is no trash surface, so after that
 * a deleted row is unreachable and only costs a row. Left as a founder
 * decision rather than a number nobody chose.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table highlights rename to highlights_all;
alter table highlights_all add column deleted_at timestamptz;
create index on highlights_all (user_id, deleted_at) where deleted_at is not null;

create view highlights as
  select id, user_id, content_id, exact, prefix, suffix, color, underline,
         cloze_markers, note, label, content_hash, created_at, updated_at
    from highlights_all
   where deleted_at is null;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop view if exists highlights;
delete from highlights_all where deleted_at is not null;
alter table highlights_all drop column deleted_at;
alter table highlights_all rename to highlights;
`);
};
