/**
 * Supports the admin "هرگز پریمیوم را تجربه نکرده‌اند" count and the bulk gift
 * that targets that exact segment (services/subscription.ts's
 * NEVER_PREMIUM_WHERE, used by both subscriptionReport() and
 * neverPremiumUserIds()).
 *
 * "Ever had premium" is answered by two existing tables, never a new column —
 * see the doctrine atop services/subscription.ts ("tier is a derived cache")
 * and the "any grant history at all, even revoked" test premium-prize.ts
 * already applies:
 *
 *   user_activity  - action = 'subscription_activated', written once by every
 *                    activateMonths()/activateDays()/grantLifetime() call
 *                    (payment, admin gift, backfill, or a league prize that
 *                    stacked onto an existing subscription).
 *   premium_grants - ANY row, even revoked/expired, for a league prize that
 *                    landed on a free account (already indexed by its own
 *                    (user_id, week_start) unique constraint).
 *
 * user_activity has no per-action index, so a NOT EXISTS across the whole
 * table (millions of rows, growing daily) would cost a full scan per profile.
 * This partial index makes the anti-join an index-only lookup, and it stays
 * tiny forever — one row per user per activation, never per ordinary event.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create index user_activity_sub_activated_idx on user_activity (user_id)
  where action = 'subscription_activated';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists user_activity_sub_activated_idx;
  `);
};
