/**
 * Publishing an article thread moves from the THREAD to the MESSAGE.
 *
 * 0042 made `is_public` a column on `support_tickets` — one switch for the
 * whole conversation. That was fine as long as "publish this thread" meant
 * "everything in it is fit to read," but a real conversation is not always
 * that: the founder answered a reader in two messages, only the second of
 * which was meant to go on the page, and the thread-level switch had no way
 * to say that — publishing the thread published both, publishing "since we
 * only meant to expose the fix" over-published a private aside in the same
 * motion (found in production, 2026-08-19).
 *
 * So `is_public`/`made_public_at` move to `ticket_messages`, one row per
 * message, and `support_tickets` loses its own copy — keeping both would
 * recreate the exact drift this migration exists to remove (two places that
 * can disagree about whether something is public is how the fail-open publish
 * bug shipped in the first place).
 *
 * BACKFILL PRESERVES CURRENT VISIBILITY, NOTHING MORE: every message that
 * belongs to an already-public ticket becomes public itself, at the ticket's
 * own `made_public_at` — nothing that a reader can see today goes dark, and
 * nothing that was private is exposed by this migration.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table ticket_messages
  add column is_public      boolean not null default false,
  add column made_public_at timestamptz;

update ticket_messages m
   set is_public = true,
       made_public_at = t.made_public_at
  from support_tickets t
 where t.id = m.ticket_id
   and t.is_public;

-- The public read path, now keyed on the message rather than the ticket.
create index ticket_messages_public_idx
  on ticket_messages (ticket_id) where is_public;

drop index if exists support_tickets_public_content_idx;
alter table support_tickets
  drop column is_public,
  drop column made_public_at;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table support_tickets
  add column is_public      boolean not null default false,
  add column made_public_at timestamptz;

-- Best-effort: a ticket is public again if it carries any public message, at
-- the earliest moment one of them was published. A rollback after messages
-- have been individually toggled cannot fully recover the pre-migration
-- state (that state could not express per-message publishing at all).
update support_tickets t
   set is_public = true,
       made_public_at = pub.first_public
  from (
    select ticket_id, min(made_public_at) as first_public
      from ticket_messages where is_public group by ticket_id
  ) pub
 where pub.ticket_id = t.id;

create index support_tickets_public_content_idx
  on support_tickets (content_id) where is_public;

drop index if exists ticket_messages_public_idx;
alter table ticket_messages
  drop column is_public,
  drop column made_public_at;
`);
};
