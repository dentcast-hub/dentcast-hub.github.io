/**
 * ارزیاب DES — a premium tool where a reader submits a paper and the FOUNDER
 * scores it (there is no AI provider in this feature; see
 * .dentcast/des-scorer-handoff.md §0/§13). A paper already scored answers a
 * future submission instantly, with no queue at all, which is what makes the
 * founder's manual work scale.
 *
 * THREE TABLES, and the split mirrors support_tickets/ticket_messages: the
 * corpus (des_papers) is permanent and shared across every reader; a
 * submission (des_requests) belongs to one reader and is transient — it is
 * answered and its only lasting trace is the paper it resolved to.
 *
 * WHAT IS STORED IS IDENTITY, NOT THE PAPER. No abstract, no full text — just
 * the fields a citation is made of, plus the DES spec's own output object
 * verbatim in `des`. This is deliberately NOT plus/des-scores.json: that file
 * is fetched by plus/js/des.js on every article page load (keyed by page path,
 * written by the publishing workflow and gated by verify_publish.py), and a
 * reader's paper has no page. See the handoff RULE 3.
 *
 * ONE PAPER, MANY KEYS. des_paper_keys maps every identifier or title hash
 * ever seen onto a paper id — DOI, PMID, or a folded-title hash — so an
 * abstract and a full text of the same study land on one record, and a typo'd
 * resubmission can be attached to an existing paper rather than forking it
 * (handoff RULE 1: ambiguity declines, a wrong key returns another paper's
 * evaluation).
 *
 * des_requests has NO `answer` column: the answer IS the paper it resolved to
 * (`paper_id`), read through the same des_papers row every future lookup
 * reads. Two sources of truth for one score is exactly the drift this schema
 * exists to avoid.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table des_papers (
  id            uuid primary key default gen_random_uuid(),
  doi           text,
  pmid          text,
  title         text not null,
  first_author  text,
  year          smallint,
  hashtags      text[] not null default '{}',
  -- the DES spec's own output object, verbatim — band/score/question_type/
  -- text_basis/provisional all live inside it; never duplicated as columns
  -- (handoff RULE 4: nothing derivable is stored beside the spec output)
  des           jsonb  not null,
  spec_version  text   not null,
  scored_at     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create unique index des_papers_doi_uq  on des_papers (lower(doi)) where doi  is not null;
create unique index des_papers_pmid_uq on des_papers (pmid)       where pmid is not null;

-- every key ever seen for a paper: 'doi:…' | 'pmid:…' | 'ttl:<hash>'
create table des_paper_keys (
  key      text primary key,
  paper_id uuid not null references des_papers(id) on delete cascade
);
create index on des_paper_keys (paper_id);

-- a reader's submission. body is nullable: a PDF-only submission carries no
-- text at all, and the founder reads the PDF itself in Telegram.
create table des_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  reference   text not null unique,
  title       text not null,
  body        text,
  claim       text not null check (claim in ('ABSTRACT_ONLY', 'FULL_TEXT')),
  link        text,
  has_pdf     boolean not null default false,
  status      text not null default 'pending' check (status in ('pending', 'answered', 'rejected')),
  paper_id    uuid references des_papers(id) on delete set null,
  created_at  timestamptz not null default now(),
  answered_at timestamptz
);
-- the founder's queue: oldest pending first
create index des_requests_queue on des_requests (created_at) where status = 'pending';
-- "how many OPEN requests does this reader already have" — the per-user cap
create index des_requests_open on des_requests (user_id) where status = 'pending';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists des_requests;
drop table if exists des_paper_keys;
drop table if exists des_papers;
  `);
};
