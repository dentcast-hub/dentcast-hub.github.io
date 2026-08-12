/**
 * Article threads — a premium reader talking to the founder UNDER the page they
 * are reading, and the founder's own decision about which of those the rest of
 * the site gets to see.
 *
 * They are support tickets with an anchor, not a second system. A thread here is
 * the same object 0041 already defines — one reader, the founder, a list of
 * messages, a status, one derived "whose turn is it" — so it reuses the table
 * rather than cloning it. `content_id` IS the discriminator: null means somebody
 * wrote from the support page, non-null means they wrote under an article. One
 * queue, one reply path, one notification kind, one set of primitives to keep
 * correct.
 *
 * PRIVATE IS THE DEFAULT AND PUBLISHING IS A DECISION. Every thread starts
 * visible only to its author and the founder; `is_public` is flipped by the
 * founder alone. That is not timidity about comments — it is what makes the
 * feature work at this size. 444 articles against a premium readership means an
 * ordinary comment box would sit empty under almost every page forever, which
 * reads as a dead site rather than a quiet one. Publishing only the threads
 * worth reading inverts that: what the public sees is never empty, because it is
 * never automatic. It also happens to solve moderation (nothing a stranger wrote
 * is published by default) and the medical-liability problem (a clinical
 * question and its answer are read before they are public) with the same switch
 * — the same move badge_grants and pillar_grants make, where what is WRITTEN is
 * the founder's decision and everything else derives from it.
 *
 * ONE THREAD PER READER PER PAGE, enforced by the partial unique index below.
 * A second comment continues the conversation the reader already started there
 * instead of opening a parallel one nobody would ever tie together — the same
 * reason gift-redemption allows one open claim at a time.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table support_tickets
  add column content_id     text,
  add column is_public      boolean not null default false,
  add column made_public_at timestamptz;

-- A reader's comments under one page are ONE conversation.
create unique index support_tickets_user_content_uniq
  on support_tickets (user_id, content_id) where content_id is not null;

-- The public read path: everything published under one page.
create index support_tickets_public_content_idx
  on support_tickets (content_id) where is_public;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists support_tickets_public_content_idx;
drop index if exists support_tickets_user_content_uniq;
alter table support_tickets
  drop column if exists made_public_at,
  drop column if exists is_public,
  drop column if exists content_id;
`);
};
