/**
 * Bale (بله) as a NOTIFICATION channel — the domestic, cutoff-resilient twin of
 * the Telegram notification path.
 *
 * Bale is deliberately NOT a login provider: it has no login widget, so there is
 * no "Login with Bale". A user connects it from their profile purely to receive
 * the streak reminder and new-article pushes. To send those we need the user's
 * Bale chat_id, exactly as Telegram notifications read `profiles.telegram_id`.
 *
 *   `profiles.bale_id` — the Bale chat_id (bigint), mirroring `telegram_id`. The
 *   BaleNotificationSender reads it; a NULL simply means "not connected" and is
 *   skipped quietly (the same expected state as an un-linked Telegram / no push
 *   subscription).
 *
 * A partial UNIQUE index keeps one Bale chat bound to at most one profile, so the
 * webhook can safely reassign a chat_id (move it to the account that just
 * initiated the link) without two profiles ever sharing it.
 *
 * The identity linkage itself reuses the provider-agnostic `auth_identities`
 * table from 0004 (provider = 'bale'), so a future "Login with Bale" needs no
 * further migration — it just starts reading those rows.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table profiles add column bale_id bigint;
create unique index profiles_bale_id_uniq on profiles (bale_id) where bale_id is not null;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists profiles_bale_id_uniq;
alter table profiles drop column if exists bale_id;
  `);
};
