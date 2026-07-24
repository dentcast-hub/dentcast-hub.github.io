/**
 * Weekly league system — structure phase (schema + seed). No rewards, no
 * frontend design here; the data model is shaped so a rewards layer can attach to
 * `league_members.final_rank` + `outcome` later without a breaking migration.
 *
 * Three quantities are kept strictly separate (never mixed):
 *   - weekly_xp        (league_members.weekly_xp) — XP earned THIS week; the ONLY
 *                       basis for league rank; reset by starting a fresh weekly row.
 *   - spendable points  (existing score/points system) — untouched here.
 *   - current_tier      (profiles.current_tier_id)  — persists across weeks; only
 *                       weekly finalization changes it.
 *
 * Ranking is NEVER global: a user is ranked only inside their own weekly group
 * (`leagues` row). Behavioural numbers live in `league_config`, never hardcoded.
 *
 * Week boundary = the Iranian week (Saturday 00:00 Asia/Tehran), to stay aligned
 * with the site's existing streak/week logic (week_start_dow = saturday).
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
-- Seven fixed tiers, dental restorative materials low -> high. Seed ALL seven;
-- only 1-3 start active. Never rename or reorder after launch.
create table league_tiers (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_fa      text not null,
  tier_order   int  not null unique,
  is_active    boolean not null default false,
  activated_at timestamptz
);

insert into league_tiers (slug, name_fa, tier_order, is_active, activated_at) values
  ('acrylic',            'آکریل',              1, true,  now()),
  ('amalgam',            'آمالگام',            2, true,  now()),
  ('composite',          'کامپوزیت',           3, true,  now()),
  ('metal-ceramic',      'متال-سرامیک',        4, false, null),
  ('lithium-disilicate', 'لیتیوم دی‌سیلیکات',  5, false, null),
  ('zirconia',           'زیرکونیا',           6, false, null),
  ('titanium',           'تیتانیوم',           7, false, null);

-- All behavioural values. Strings; the accessor parses. A locked key is frozen
-- against the self-tuning logic (emergency use).
create table league_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  locked     boolean not null default false,
  locked_at  timestamptz
);

insert into league_config (key, value) values
  ('group_size_current',            '8'),          -- auto-computed
  ('promotion_pct',                 '20'),
  ('demotion_pct',                  '20'),
  ('min_valid_group_size',          '6'),
  ('promotion_min_weekly_xp',       '30'),         -- provisional: ~3 active days
  ('cooldown_weeks',                '4'),
  ('max_active_tier_order',         '3'),          -- auto-computed
  ('week_start_dow',                'saturday'),
  ('timezone',                      'Asia/Tehran'),
  -- Provisional XP weights (mirror the existing score: active_day*10 + highlights).
  -- The weighting decision is pending; these live here so it is a one-line change.
  ('xp_per_active_day',             '10'),
  ('xp_per_highlight',              '1'),
  -- Bookkeeping for the group-size cooldown (empty = never changed yet).
  ('group_size_last_changed_week',  '');

-- One row = one weekly group inside one tier.
create table leagues (
  id                    uuid primary key default gen_random_uuid(),
  tier_id               uuid not null references league_tiers(id),
  week_start            date not null,
  week_end              date not null,
  status                text not null default 'open',   -- open | closed | finalized
  capacity_at_creation  int  not null,
  created_at            timestamptz not null default now()
);
create index on leagues (tier_id, week_start, status);
-- At most ONE open group per (tier, week): the placement logic relies on this.
create unique index leagues_one_open_per_tier_week
  on leagues (tier_id, week_start) where status = 'open';

create table league_members (
  id                          uuid primary key default gen_random_uuid(),
  league_id                   uuid not null references leagues(id) on delete cascade,
  user_id                     uuid not null references profiles(id) on delete cascade,
  week_start                  date not null,          -- denormalized for the per-week unique
  joined_at                   timestamptz not null default now(),
  weekly_xp                   int not null default 0,
  first_reached_current_xp_at timestamptz,            -- tie-breaker; set on every XP change
  final_rank                  int,
  outcome                     text,                   -- promoted | stayed | demoted
  outcome_seen                boolean not null default false,  -- cleared once the user sees it
  unique (league_id, user_id),
  unique (user_id, week_start)                        -- one group per user per week
);
create index on league_members (league_id);
create index on league_members (user_id);

-- Input for smoothing + the admin dashboard. One row per finalized week.
create table league_weekly_stats (
  week_start   date primary key,
  active_users int not null,
  groups_count int not null,
  avg_fill_pct numeric,
  promotions   int not null default 0,
  demotions    int not null default 0,
  created_at   timestamptz not null default now()
);

-- Every automatic config change the self-tuning logic makes.
create table league_audit_log (
  id             uuid primary key default gen_random_uuid(),
  changed_key    text not null,
  old_value      text,
  new_value      text not null,
  trigger_metric text,
  computed_at    timestamptz not null default now()
);

-- A user's league tier. NULL is treated as the lowest tier (acrylic) by the code,
-- but we backfill existing rows so the column is meaningful from day one.
alter table profiles add column current_tier_id uuid references league_tiers(id);
update profiles set current_tier_id = (select id from league_tiers where slug = 'acrylic');
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table profiles drop column if exists current_tier_id;
drop table if exists league_audit_log;
drop table if exists league_weekly_stats;
drop table if exists league_members;
drop table if exists leagues;
drop table if exists league_config;
drop table if exists league_tiers;
  `);
};
