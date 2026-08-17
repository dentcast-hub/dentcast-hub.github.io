/**
 * ارزیاب DES — des_requests.paper_id stops being a UUID FK into des_papers.
 *
 * The «DES دارم» workflow (.dentcast/workflows/des-library-add.md) added a
 * SECOND shelf for scored papers: plus/des-library.json, served by the live
 * API through des-library-file.ts and merged into the same lookupExact/
 * nearDuplicates the reader-submission flow already used. A file-library
 * paper's id is a `lib:`-prefixed string (`lib:p_0001`), never a row in
 * des_papers — so the moment nearDuplicates can surface a file candidate,
 * POST /admin/des/:id/answer's `same_as` branch can be asked to point
 * paper_id at one, and a uuid column with a hard FK cannot hold that string
 * at all, let alone reference a table it does not name.
 *
 * paper_id was always closer to an audit trail than a join target — nothing
 * reads des_papers back through it outside a test assertion — so relaxing it
 * to free-form text (still populated with either a real des_papers uuid or a
 * `lib:…` id, just no longer DB-enforced) is a widening, not a redesign.
 * `on delete set null`'s cascade is not lost in practice: nothing in this
 * codebase deletes a des_papers row.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table des_requests drop constraint des_requests_paper_id_fkey;
alter table des_requests alter column paper_id type text using paper_id::text;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table des_requests alter column paper_id type uuid using paper_id::uuid;
alter table des_requests add constraint des_requests_paper_id_fkey
  foreign key (paper_id) references des_papers(id) on delete set null;
  `);
};
