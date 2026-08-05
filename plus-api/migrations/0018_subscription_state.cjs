/**
 * Turn `subscriptions` (provisioned unused in 0001, spec section 4) into the
 * actual premium state machine, ahead of the payment gateway.
 *
 * The division of labour between the two payment tables is the whole design and
 * it is worth stating once:
 *
 *   subscriptions - STATE. Exactly ONE row per user, extended in place. It
 *                   answers a single question, "is this account premium, and
 *                   until when", and `expires_at` is the only truth about it.
 *   payments      - LEDGER. Append-only, one row per transaction, with the
 *                   gateway's amount/ref_id. It answers "what was bought", which
 *                   is a different question and must never be reconstructed by
 *                   summing state.
 *
 * Without the unique index below the two collapse into each other: a second
 * purchase would insert a second active row and "until when" would suddenly
 * depend on which row you read. The prize sweep in premium-prize.ts already
 * COUNTS active subscription rows to decide whether a league grant may revert an
 * account, so duplicate rows there are not a cosmetic problem.
 *
 * Constraints:
 *
 *   subscriptions_lifetime_ck - lifetime <=> no expiry, in both directions. This
 *     is the invariant every later level rests on: the expiry sweep selects on
 *     `expires_at <= now`, so a founder row that carried a date would be swept
 *     back to free, and a paid row with a NULL date would be premium forever.
 *     A CHECK makes both unrepresentable rather than merely unintended.
 *   subscriptions_status_ck  - 'active' | 'expired'. `status` is deliberately
 *     NOT derived from the date: it records whether the sweep has already
 *     processed the row, which is what makes the sweep idempotent.
 *
 * The partial index on expires_at serves exactly the sweep's query shape
 * (active rows that are due), so a nightly scan stays an index range read rather
 * than a seq scan over every subscriber the site ever had.
 *
 * Additive and backfill-free by construction: `subscriptions` has never had a
 * row written to it (grep: the only reader is premium-prize.ts's count), so
 * there is nothing existing for the new constraints to reject.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create unique index subscriptions_user_uniq on subscriptions (user_id);

alter table subscriptions add constraint subscriptions_lifetime_ck
  check (is_founder = (expires_at is null));

alter table subscriptions add constraint subscriptions_status_ck
  check (status in ('active', 'expired'));

create index subscriptions_due_idx on subscriptions (expires_at)
  where status = 'active' and expires_at is not null;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists subscriptions_due_idx;
alter table subscriptions drop constraint if exists subscriptions_status_ck;
alter table subscriptions drop constraint if exists subscriptions_lifetime_ck;
drop index if exists subscriptions_user_uniq;
  `);
};
