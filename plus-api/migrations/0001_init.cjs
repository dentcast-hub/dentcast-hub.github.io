/**
 * Initial schema for DentCast Plus (Phase 1).
 *
 * This migration is the SQL from section 4 of
 * `dentcast-plus-technical-spec-final.md`, verbatim. Do not edit the shape of
 * these tables without changing the spec first; `card_state` in particular is
 * created for every highlight on every plan so a later premium upgrade needs no
 * migration and no backfill. No energy fields exist anywhere.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create extension if not exists "pgcrypto";


-- users
create table profiles (
  id              uuid primary key default gen_random_uuid(),
  phone           text unique not null,
  telegram_id     bigint unique,
  display_name    text not null,
  tier            text not null default 'free',
  current_streak  int  not null default 0,
  longest_streak  int  not null default 0,
  last_active_day date,
  settings        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);


-- append-only event log: source of truth for everything
create table user_activity (
  id          bigserial primary key,
  user_id     uuid not null references profiles(id) on delete cascade,
  action      text not null,
  content_id  text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on user_activity (user_id, created_at desc);
create index on user_activity (action, created_at desc);
create index on user_activity (content_id);


-- highlights (a "card" is a highlight; there is no separate card entity)
create table highlights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  content_id    text not null,
  exact         text not null,
  prefix        text,
  suffix        text,
  color         text,
  underline     boolean not null default false,
  cloze_markers jsonb not null default '[]'::jsonb,
  note          text,
  label         text,
  content_hash  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on highlights (user_id, content_id);
create index on highlights (user_id, created_at desc);


-- leitner state: created with every highlight, written only by the premium engine
create table card_state (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  highlight_id   uuid not null references highlights(id) on delete cascade,
  box            int  not null default 1,
  next_review_at timestamptz,
  last_result    text,
  reviewed_count int  not null default 0,
  updated_at     timestamptz not null default now(),
  unique (user_id, highlight_id)
);
create index on card_state (user_id, next_review_at);


-- premium: user-made collections
create table collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);


create table collection_items (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  highlight_id  uuid references highlights(id) on delete cascade,
  content_id    text,
  created_at    timestamptz not null default now()
);


-- premium: pathway enrollment (definitions live in static JSON, not here)
create table user_pathways (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  pathway_id   text not null,
  current_step int  not null default 0,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, pathway_id)
);


-- created empty from day one so payment can be switched on without migration
create table subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  status     text not null,
  plan       text not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  is_founder boolean not null default false
);


create table payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  amount_rial bigint not null,
  gateway     text,
  ref_id      text,
  status      text not null,
  created_at  timestamptz not null default now()
);


create table certificates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  pathway_id  text not null,
  verify_code text unique not null,
  issued_at   timestamptz not null default now()
);


-- identity-free demand signal
create table anon_events (
  id         bigserial primary key,
  event      text not null,
  content_id text,
  created_at timestamptz not null default now()
);
create index on anon_events (event, created_at desc);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists anon_events cascade;
drop table if exists certificates cascade;
drop table if exists payments cascade;
drop table if exists subscriptions cascade;
drop table if exists user_pathways cascade;
drop table if exists collection_items cascade;
drop table if exists collections cascade;
drop table if exists card_state cascade;
drop table if exists highlights cascade;
drop table if exists user_activity cascade;
drop table if exists profiles cascade;
  `);
};
