/**
 * Per-notice read state, additive to the watermark `profiles.notices_seen_at`.
 *
 * A support ticket (T-MCF-VN2, 2026-08-14) reported that opening one اطلاعیه
 * marks EVERY currently-unread notice as seen, because the inbox has always
 * used a single per-user watermark: unread means `created_at > notices_seen_at`,
 * and the panel moved that watermark to now() the instant it rendered. That is
 * correct behaviour for the watermark's own job (idempotent, no half-read
 * state) — it just cannot express "I read this one, not that one", because a
 * watermark is monotonic: raising it to cover a newer row necessarily covers
 * every older row too.
 *
 * `notice_reads` adds exactly that: one row per (user, notice) the reader has
 * individually acknowledged. It does not replace the watermark — a notice is
 * now unread only when it is BOTH newer than the watermark AND absent from
 * this table — which is what keeps every notice that predates this migration
 * exactly as read as it already was, with no backfill required.
 *
 * `notice_key` disambiguates the inbox's two sources (`notification_log` and
 * `notice_broadcasts`, unioned in services/notices.ts's VISIBLE_NOTICES) with a
 * `log:`/`bcast:` prefix, since their uuids are drawn from separate tables and
 * are not guaranteed distinct from each other.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table notice_reads (
  user_id    uuid not null references profiles(id) on delete cascade,
  notice_key text not null,
  seen_at    timestamptz not null default now(),
  primary key (user_id, notice_key)
);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists notice_reads;
`);
};
