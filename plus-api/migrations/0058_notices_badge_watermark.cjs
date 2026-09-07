/**
 * A second, independent read watermark for اطلاعیه — the header dot, split
 * off from `notices_seen_at`.
 *
 * `notices_seen_at` used to do two jobs at once: it was the cutoff that keeps
 * pre-launch history from resurfacing (migration 0025), and — until the
 * 2026-08-14 support ticket (T-MCF-VN2, see migration 0046) — it was also
 * what the panel moved to now() on render, which is what made opening ONE
 * card mark every other unread card seen too. 0046 fixed the panel's own
 * per-card colouring with `notice_reads`, but left the header dot reading the
 * exact same combined expression — so the dot inherited the opposite
 * complaint: it now stays lit until every single card has been individually
 * opened, when the ordinary expectation (LinkedIn, and every messaging app)
 * is that just looking at the list is enough to clear it.
 *
 * The fix is not to pick one behaviour over the other — both are wanted, on
 * two different surfaces. `notices_badge_seen_at` is the watermark for the
 * header dot and the account-menu pill ONLY: it moves to now() the moment
 * the reader opens the panel, full stop, independent of which cards inside
 * it they click. `notices_seen_at` keeps its original job — the frozen
 * pre-launch floor `notice_reads`-based per-card colouring is measured
 * against — and is never written to again after this migration.
 *
 * Backfilled from `notices_seen_at` rather than left null: every existing
 * account already has that column at whatever value the old "mark everything"
 * write last left it, and that is exactly the "already seen" state the badge
 * should inherit on deploy — the alternative (defaulting to null, i.e. the
 * epoch) would light every reader's dot the moment this ships.
 *
 * `default now()` mirrors migration 0026's guard on `notices_seen_at` for
 * exactly the same reason: without it a fresh signup has notices_badge_seen_at
 * null, coalesces to the epoch, and the account's very first page view carries
 * a lit dot for every broadcast that predates it.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table profiles add column notices_badge_seen_at timestamptz default now();
update profiles set notices_badge_seen_at = notices_seen_at;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table profiles drop column if exists notices_badge_seen_at;
`);
};
