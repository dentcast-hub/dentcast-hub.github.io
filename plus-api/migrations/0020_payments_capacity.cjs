/**
 * Make `payments` (provisioned unused in 0001) usable as both the purchase
 * ledger and the source of the monthly capacity count.
 *
 * WHY THE PERIOD IS STORED, NOT DERIVED. The e-namad کسب‌وکار خرد ceiling resets
 * on the first of a PERSIAN month, and Postgres has no Persian calendar — there
 * is no `date_trunc('month', ...)` that answers the question we actually need.
 * Node does (full ICU), so the month is computed once at insert and stored.
 *
 * WHY BOTH CALENDARS. We do not yet know for certain which month Zibal's own
 * counter resets on, so `payments.capCalendar` is configurable. If only the
 * active calendar's period were stored, flipping that setting would leave every
 * existing row labelled in the old calendar, the capacity query would match
 * none of them, and the counter would silently read zero — handing back a full
 * month of ceiling that the gateway has not actually forgiven. Storing both
 * makes the switch a change of which column is read, with no gap.
 *
 * `months` is on the row because the callback needs it: verification arrives
 * with nothing but the gateway's own reference, and "how much premium was this"
 * has to have been decided before the customer was sent away, not inferred from
 * the amount afterwards.
 *
 * The two uniqueness rules are the anti-double-activation guarantees:
 *   order_id            - ours, minted per attempt; makes an attempt addressable.
 *   (gateway, ref_id)   - theirs (Zibal's trackId). A verify callback that
 *                         arrives twice — a refresh, a retry, a duplicate
 *                         webhook — must not be able to buy two subscriptions
 *                         with one payment. Partial, because ref_id does not
 *                         exist until the gateway answers.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table payments
  add column order_id          text,
  add column months            int,
  add column period_jalali     text,
  add column period_gregorian  text,
  add column verified_at       timestamptz,
  add column updated_at        timestamptz not null default now();

alter table payments add constraint payments_status_ck
  check (status in ('pending', 'paid', 'failed', 'canceled'));

create unique index payments_order_id_uniq on payments (order_id)
  where order_id is not null;

create unique index payments_gateway_ref_uniq on payments (gateway, ref_id)
  where ref_id is not null;

-- Serves the capacity count directly, for either calendar setting.
create index payments_period_jalali_idx on payments (period_jalali);
create index payments_period_gregorian_idx on payments (period_gregorian);
create index payments_user_idx on payments (user_id, created_at desc);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists payments_user_idx;
drop index if exists payments_period_gregorian_idx;
drop index if exists payments_period_jalali_idx;
drop index if exists payments_gateway_ref_uniq;
drop index if exists payments_order_id_uniq;
alter table payments drop constraint if exists payments_status_ck;
alter table payments
  drop column if exists updated_at,
  drop column if exists verified_at,
  drop column if exists period_gregorian,
  drop column if exists period_jalali,
  drop column if exists months,
  drop column if exists order_id;
  `);
};
