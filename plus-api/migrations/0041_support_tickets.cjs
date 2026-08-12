/**
 * Support tickets — the first channel that carries a reader's words INTO the
 * site.
 *
 * Everything the notification system does today points one way: اطلاعیه, push,
 * the founder broadcast. A reader with a question had the site's own contact
 * page and nothing else, which means the answer happened in a messenger where
 * it belonged to nobody and could not be found again.
 *
 * TWO TABLES, BECAUSE A TICKET IS A CONVERSATION. The ticket is the subject and
 * the state; every line either side writes is a row in ticket_messages. Storing
 * the latest reply on the ticket would make the thread a thing to reconstruct
 * rather than a thing to read, and would give the same fact two homes.
 *
 * NOTHING DERIVABLE IS STORED — the same doctrine as the badge wall and as
 * collections' `last_item_at`. There is no `updated_at`, no `message_count`, no
 * "awaiting" column: the last activity is max(created_at) over the thread, the
 * count is count(*), and WHO the ticket is waiting on is the author of its last
 * message. A column for any of those is a column that can disagree with the
 * messages it was summarising. `status` IS stored, because open/closed is a
 * decision somebody made rather than a fact about the rows.
 *
 * THE REFERENCE IS THE POINT, not decoration. It is what lets the conversation
 * leave the site and come back: a student card cannot be uploaded (there is no
 * object storage, and an identity document is a liability to hold anyway), so
 * the photo goes to a messenger carrying this tag, and the tag is what matches
 * it to the account waiting. Exactly the move gift_redemptions makes with a
 * card code — the valuable thing never enters our system, only a reference to
 * the person expecting it does.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  reference  text not null unique,
  kind       text not null,
  subject    text not null,
  status     text not null default 'open' check (status in ('open', 'closed')),
  closed_at  timestamptz,
  created_at timestamptz not null default now()
);
create index on support_tickets (user_id, created_at desc);
-- The founder's queue reads status-first; the thread order comes from the
-- messages, so there is nothing else worth indexing here.
create index on support_tickets (status);

create table ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references support_tickets(id) on delete cascade,
  author     text not null check (author in ('user', 'founder')),
  body       text not null,
  created_at timestamptz not null default now()
);
create index on ticket_messages (ticket_id, created_at);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists ticket_messages;
drop table if exists support_tickets;
`);
};
