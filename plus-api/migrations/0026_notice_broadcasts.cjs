/**
 * Broadcast notices: one row for everybody, instead of one row per reader.
 *
 * Two things needed a notice that is not addressed to a person — the founder's
 * own announcement, and "a new article was published", which every reader should
 * see in اطلاعیه the moment it happens rather than waiting for the push schedule
 * they may not even be subscribed to.
 *
 * Fanning those out into notification_log would have meant one row per user per
 * publish: a few thousand readers times a few publishes a week, forever, to say
 * the same sentence to everyone. A broadcast is one row, and the watermark model
 * the inbox already uses (profiles.notices_seen_at) gives it per-reader read
 * state for free — there is no per-user write path here at all, which is also
 * why sending one can never half-succeed.
 *
 * Two rules decide who sees a broadcast, and both are about not surprising
 * somebody with news that was never theirs:
 *
 *   · `audience` — all | free | premium, resolved against the reader's tier at
 *     READ time. A reader who upgrades tomorrow does not retroactively acquire
 *     last week's premium announcements as unread, because of the second rule:
 *   · `created_at > profiles.created_at` — you are never shown news from before
 *     you existed. This is also what stops a fresh signup from opening the inbox
 *     to sixty days of publishes.
 *
 * And the DEFAULT on notices_seen_at is the third guard of the same family as
 * migration 0025's: an account is created already caught up, so its first page
 * view never carries a dot for things that happened before it.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table notice_broadcasts (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,
  title      text not null,
  body       text,
  url        text,
  audience   text not null default 'all',
  created_at timestamptz not null default now()
);
create index on notice_broadcasts (created_at desc);

-- A new account starts caught up. Without this, notices_seen_at is null for a
-- fresh signup, every broadcast inside the window counts as unread, and the very
-- first page view carries a dot for news that predates the account.
alter table profiles alter column notices_seen_at set default now();
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table profiles alter column notices_seen_at drop default;
drop table if exists notice_broadcasts;
`);
};
