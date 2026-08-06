/**
 * The premium score multiplier (×1.2 on the daily streak point), as a STAMP ON
 * EACH ACTIVITY ROW rather than a condition on the reader.
 *
 * The obvious implementation — multiply the score by 1.2 while the account is
 * premium — is wrong here, and the reason is `subscriptions`: it holds exactly
 * ONE row per user, extended in place (migration 0018), so it can say "premium
 * until the 12th" and nothing whatsoever about last spring. A multiplier applied
 * at read time therefore has no way to mean "the part earned while premium"; it
 * can only mean "all of it, for as long as the row is alive". The day a
 * subscription lapsed, the user's total would drop by a fifth and their streak
 * shields could evaporate with it — score is spent on shields, and
 * `freezesAvailable` is `granted(score) - used`.
 *
 * That directly contradicts the rule the score is built on (score.ts: "Score is
 * never deducted — a threshold is a milestone, not a purchase"), and it would
 * reach the user as a bug: nobody reads a number falling to mean "your
 * subscription ended", they read it to mean their work was taken away. Which is
 * the very thing the lapsed-subscriber copy elsewhere promises did NOT happen.
 *
 * So the tier is recorded when the day is earned, and never re-evaluated:
 *
 *   user_activity.premium — was this account premium at the moment the event was
 *                           appended. The log is append-only, so this is written
 *                           once and never updated.
 *
 * ONLY `user_activity`, and only the active-day component reads it. The
 * multiplier deliberately does not touch the per-content or per-highlight parts
 * of the score: 10 × 1.2 is 12 and 5 × 1.2 is 6, but 1 × 1.2 is 1.2, so
 * multiplying highlights would put a fraction into a number that is compared
 * against integer shield thresholds — and rounding it away would silently eat a
 * point the user had earned. Keeping the multiplier on the daily point makes
 * every score an exact integer with no rounding step at all, and aims the perk
 * at the daily habit, which is the same thing the shields it buys are about.
 * `highlights` therefore needs no column.
 *
 * Consequences, all of them deliberate:
 *   · An expiring subscription removes nothing. Days earned while premium keep
 *     their weight for good; new days simply stop being worth 12.
 *   · NO BACKFILL. Every existing row is `false`, so today's subscribers do not
 *     wake up with a retroactive bonus and nobody's rank moves overnight. The
 *     perk begins the day it ships, which is also the only claim the price page
 *     can honestly make about it.
 *   · Renewing does not re-price old activity, and lapsing then returning leaves
 *     a correct mixed history.
 *
 * `not null default false` makes this additive: every existing row is already
 * correct under the default, and no writer that has not been taught about the
 * column can break.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table user_activity add column premium boolean not null default false;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table user_activity drop column if exists premium;
  `);
};
