/**
 * Full-text search inside the cabinet's PDFs («کتابخانه‌ی دنت‌کست»).
 *
 * The cabinet page searches the catalogue (titles, tags, abstracts, the
 * founder's summaries); a sentence in a paper's Results was unreachable. The
 * text extracted from each PDF (tools/cabinet_fulltext.py, run where the PDFs
 * are) lives HERE and nowhere else: never in the public repository, never in
 * a published file. A reader gets a short fragment around the match, and the
 * PDF itself through the cabinet's own Drive link, as before.
 *
 * One row per catalogue paper, keyed by its catalogue id (P0001…). The id is
 * not a foreign key: the catalogue is a file in the site repository, not a
 * table. `text_sha256` is what the upload tool compares to send only what
 * changed. `tsv` is generated, so it can never disagree with `body`.
 *
 * English stemming: the library is English-language papers; a Persian
 * paper's text is still indexed, word for word, through the same config.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table cabinet_fulltext (
  paper_id    text primary key check (paper_id ~ '^P[0-9]{4,6}$'),
  body        text not null,
  pages       integer,
  text_sha256 text not null,
  tsv         tsvector generated always as (to_tsvector('english', body)) stored,
  updated_at  timestamptz not null default now()
);
create index cabinet_fulltext_tsv_idx on cabinet_fulltext using gin (tsv);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists cabinet_fulltext_tsv_idx;
drop table if exists cabinet_fulltext;
  `);
};
