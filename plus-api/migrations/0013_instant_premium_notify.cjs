/**
 * Instant premium notifications: the two event-driven kinds that had no channel
 * at all (league promotion/demotion, review cards due) plus the daily volume cap
 * that makes "instant" safe to switch on.
 *
 *   notification_log            - one row per notification actually handed to the
 *                                 senders. Two jobs, both of which need to survive
 *                                 a container restart (the in-process rate limiter
 *                                 in services/rate-limit.ts does not):
 *                                   1. the per-user DAILY CAP (Tehran day), so a
 *                                      busy day can never turn into a push storm
 *                                      that gets the bot blocked / push disabled;
 *                                   2. per-kind daily DEDUP for the review
 *                                      reminder (the league outcome dedups on its
 *                                      own claim column below).
 *                                 `day` is the Tehran calendar day, precomputed on
 *                                 write so the cap query stays a plain index scan.
 *
 *   league_members
 *     .outcome_notified_at      - claim marker: the promotion/demotion push for
 *                                 this membership row went out. Set BEFORE
 *                                 delivery so an overlapping sweep cannot double
 *                                 send, and never cleared — a finalized week is
 *                                 announced exactly once. Distinct from the
 *                                 existing `outcome_seen` flag, which tracks the
 *                                 IN-APP banner, not the push.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table notification_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null,
  day        date not null,
  created_at timestamptz not null default now()
);
create index on notification_log (user_id, day);
create index on notification_log (day, kind);

alter table league_members add column outcome_notified_at timestamptz;

-- Go-live safety, the same idea as backfillExistingContent() for articles: every
-- ALREADY-finalized membership counts as announced, so switching this on does not
-- push every historical promotion/demotion at once.
update league_members set outcome_notified_at = now() where outcome is not null;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table league_members drop column if exists outcome_notified_at;
drop table if exists notification_log;
`);
};
