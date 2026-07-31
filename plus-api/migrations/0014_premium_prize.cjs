/**
 * Weekly league prize: the top 2 members of the CURRENT highest active tier that
 * actually had members that week (dynamic — not a fixed tier; right now that is
 * acrylic, the only populated tier) get `profiles.tier = 'premium'` for 7 days.
 * One row per (user, week) grant — the unique constraint IS the idempotency key
 * for grantWeeklyPrizes(), the same role league_members' PK plays for
 * finalizeWeek(). No new table for "premium" itself: this only ever flips the
 * existing profiles.tier column, so every premium gate on the site (dashboard,
 * cards.html, pathways.html, ...) honours the grant with zero extra plumbing.
 *
 *   granted_at   - when profiles.tier was actually flipped to 'premium' (instant,
 *                  at league finalization — not held for the awake window; only
 *                  the PUSH about it waits, same split finalizeWeek/notifyLeagueOutcomes
 *                  already makes for promotion/demotion).
 *   expires_at   - granted_at + 7 days. The daily expiry sweep reverts tier back
 *                  to 'free' at this instant UNLESS a newer, still-active grant
 *                  exists for the same user (a repeat winner's premium extends
 *                  rather than getting cut off mid-week) or they hold a real
 *                  subscription (never checked today — subscriptions is unused —
 *                  but the sweep checks it anyway so this never regresses a real
 *                  paying/founder account once payment ships).
 *   notified_at  - instant-push claim marker, same pattern as
 *                  league_members.outcome_notified_at (0013): set BEFORE
 *                  delivery so an overlapping sweep cannot double-send.
 *   seen         - the in-app "you won a week of premium" banner, acknowledged
 *                  once (mirrors league_members.outcome_seen).
 *   revoked_at   - when the expiry sweep actually reverted tier for this grant
 *                  (or would have, had a newer grant not superseded it); null
 *                  while still active. Kept even when superseded so the sweep's
 *                  query never re-inspects an already-decided row.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table premium_grants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  week_start  date not null,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  notified_at timestamptz,
  seen        boolean not null default false,
  revoked_at  timestamptz,
  unique (user_id, week_start)
);
create index on premium_grants (user_id) where revoked_at is null;
create index on premium_grants (expires_at) where revoked_at is null;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists premium_grants cascade;
`);
};
