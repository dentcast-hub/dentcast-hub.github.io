/**
 * New-article notifications + web push (Phase "Plus" public release).
 *
 * This migration is additive and does not touch the section-4 schema in 0001.
 *
 *   push_subscriptions - one row per browser/PWA push endpoint a user has granted.
 *                        The web-push delivery provider reads these; a user may
 *                        have several (multiple devices) or none (expected: web
 *                        push is unavailable pre-auth and, on iOS, only after the
 *                        PWA is installed to the home screen).
 *
 *   articles           - the notification ledger for published content. The
 *                        article itself stays public and indexed at publish time;
 *                        this table only tracks the ACTIVE-PUSH schedule/state.
 *                        premium_notified_at: the immediate premium push fired.
 *                        notify_free_after:   published_at + free delay (24h).
 *                        free_notified_at:    the 21:00 Tehran digest included it
 *                                             (set once, so it is never re-sent).
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index on push_subscriptions (user_id);


create table articles (
  content_id          text primary key,
  title               text not null,
  url                 text not null,
  published_at        timestamptz not null default now(),
  notify_free_after   timestamptz not null,
  premium_notified_at timestamptz,
  free_notified_at    timestamptz,
  created_at          timestamptz not null default now()
);
-- the free-digest cron scans by (unsent, due) -> this index serves it directly
create index on articles (free_notified_at, notify_free_after);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists articles cascade;
drop table if exists push_subscriptions cascade;
  `);
};
