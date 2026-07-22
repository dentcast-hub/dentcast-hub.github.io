/**
 * Provider-agnostic external auth identities (Telegram Login now, Bale later).
 *
 * Until this migration the only login was phone OTP, so `profiles.phone` was
 * NOT NULL and `profiles.telegram_id` existed purely as the notification
 * chat_id. Telegram *login* introduces two new needs:
 *
 *   1) Accounts with NO phone (a user who only ever "Login with Telegram").
 *      -> `profiles.phone` is relaxed to NULL.
 *
 *   2) A general "this account is the same person on provider X" linkage that a
 *      SECOND provider (Bale, on the .ir deployment) can reuse with no further
 *      migration. -> `auth_identities`, keyed uniquely on (provider,
 *      provider_user_id). A returning login is exactly the row that already
 *      exists for that pair; a first login is the pair not seen before.
 *
 * `provider_user_id` is TEXT so Telegram's numeric id and any future provider's
 * opaque id share one column. The existing `profiles.telegram_id` (bigint) is
 * KEPT and mirrored on every Telegram login: it is the chat_id the notification
 * sender already reads, so notifications + the future streak/new-post pushes
 * keep working with zero extra wiring.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
-- A Telegram-only account has no phone.
alter table profiles alter column phone drop not null;

create table auth_identities (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  provider         text not null,               -- 'telegram' | 'bale' | ...
  provider_user_id text not null,               -- telegram id as text (future-proof)
  username         text,
  display_name     text,
  photo_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (provider, provider_user_id)           -- the login-lookup key
);
create index on auth_identities (user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists auth_identities cascade;
-- Deliberately NOT re-adding NOT NULL on profiles.phone: phone-less (Telegram)
-- rows may already exist and would make that constraint fail.
  `);
};
