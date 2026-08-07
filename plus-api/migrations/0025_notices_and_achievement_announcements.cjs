/**
 * اطلاعیه — the in-app notification inbox — and the achievement announcement
 * ledger behind it.
 *
 * Two problems, one shape. Both are about the same missing thing: the product
 * had no way to TELL a reader something inside the site.
 *
 *   1. Every notification the API sends (article, digest, streak, league,
 *      review, prize, subscription) travels only by push/Telegram/Bale. A
 *      reader who never granted push permission and linked no messenger gets
 *      none of them, and `notify-policy.ts` DROPS anything over the daily cap
 *      rather than queueing it — so a busy day silently loses news. Giving
 *      notification_log the message itself turns "one door out" into "one door
 *      out plus a place it always lands".
 *
 *   2. Achievements are DERIVED and never written down (services/achievements.ts),
 *      which is what makes the badge wall retroactive — and also why nothing can
 *      know a badge was *just* earned. What is stored here is therefore NOT a
 *      record of earning; it is a record of ANNOUNCING. The wall keeps reading
 *      derived data only, this table is never a source for it, and the two can
 *      never disagree because they answer different questions.
 *
 * ── The go-live guard, which is the whole point of the defaults below ───────
 *
 * Switching this on must not hand anybody a hundred notifications for things
 * that happened last spring. Three independent guards, all in this file:
 *
 *   · `notification_log.title` is NULL on every pre-existing row, and the inbox
 *     reads `where title is not null`. Historical rows carry no message text —
 *     we genuinely do not have it — so they are absent rather than invented.
 *   · every existing profile gets `notices_seen_at = now()`: nothing that
 *     predates this migration can ever count as unread.
 *   · `profiles.achievements_seeded` defaults to TRUE but is set to FALSE for
 *     every row that exists today. False means "this account's badges have
 *     never been written down" -> the first sync files all of them SILENTLY
 *     (already seen, no notice) and flips the flag. Accounts created after this
 *     migration take the default, true, with an empty ledger — so their very
 *     first badge is announced, which is the one that matters most.
 *
 * The default is what carries that rule forward: no code branches on a date,
 * and a writer that has not been taught about the column cannot get it wrong.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
-- ── the message itself, alongside the counter it already was ────────────────
-- The delivered column separates the table's two jobs. It was ONE job (a row
-- meant "we handed this to the senders") and the daily-cap query counts rows;
-- writing an inbox row for a capped message would therefore make the cap feed
-- itself and silently starve a user's push budget. Only delivered rows count.
alter table notification_log
  add column title     text,
  add column body      text,
  add column url       text,
  add column delivered boolean not null default true;

create index on notification_log (user_id, created_at desc);

-- ── the read watermark: one column, not a per-row read flag ─────────────────
-- Unread means created_at > notices_seen_at. Opening the panel moves the
-- watermark once; there is no per-row write path that could get out of step,
-- and no half-read state to reconcile.
alter table profiles add column notices_seen_at timestamptz;
update profiles set notices_seen_at = now();

-- ── the announcement ledger (NOT an earned_at) ──────────────────────────────
-- One row per (user, badge) at the HIGHEST level ever announced. High-water on
-- purpose: a badge can go dark again — «فاتح» un-earns itself the moment new
-- content drops a folder below complete — and re-earning it must not re-announce
-- it. The seen_at column is the celebration's own acknowledgement, mirroring
-- league_members.outcome_seen; it is deliberately independent of
-- notices_seen_at, so reading the inbox does not silently spend a celebration.
create table achievement_announcements (
  user_id      uuid not null references profiles(id) on delete cascade,
  badge_key    text not null,
  level        int  not null,
  announced_at timestamptz not null default now(),
  seen_at      timestamptz,
  primary key (user_id, badge_key)
);
create index on achievement_announcements (user_id) where seen_at is null;

-- Debounce marker: a reading session is twenty qualifying actions, and deriving
-- 21 metrics twenty times over would be a self-inflicted load problem.
alter table profiles add column achievements_synced_at timestamptz;

alter table profiles add column achievements_seeded boolean not null default true;
update profiles set achievements_seeded = false;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists achievement_announcements;
alter table profiles
  drop column if exists notices_seen_at,
  drop column if exists achievements_synced_at,
  drop column if exists achievements_seeded;
alter table notification_log
  drop column if exists title,
  drop column if exists body,
  drop column if exists url,
  drop column if exists delivered;
`);
};
