/**
 * One-time discount credits — the generic engine behind «ارزش مادی نشان‌ها».
 *
 * A credit is a small one-time percentage off ONE future purchase. Badge
 * credits (a leveled badge reaching silver or gold) are DERIVED at purchase
 * time from the same facts the badge wall reads and are deliberately not
 * stored here — same doctrine as the wall itself. What IS stored is:
 *
 *   · discount_grants — credits that cannot be derived because they are
 *     founder decisions: a birthday, an Eid campaign, an apology. One row per
 *     credit, granted via POST /admin/discounts/grant, optionally expiring.
 *     The engine treats a grant and a badge credit identically past this
 *     point; that is what makes "later we discount other things too" a row
 *     insert instead of a feature.
 *
 *   · discount_redemptions — the CONSUMPTION, which is the one thing about a
 *     one-time credit that must be written down. A row ties one credit
 *     (identified by its source string, e.g. 'badge:quill:gold' or
 *     'grant:<uuid>') to one payments row. A credit counts as spent only
 *     while its payment reads 'pending' or 'paid' — so a failed or canceled
 *     payment releases its credits automatically, with no cleanup path to
 *     forget. The unique index is per (payment, source), NOT per (user,
 *     source): the same credit may legitimately appear under a later payment
 *     after an earlier one failed, and spent-ness is decided by the join.
 *
 * The cap (10% of one purchase, CREDIT_CAP_PERCENT) and the pick order live
 * in services/discount-credits.ts, not here — retuning them is a deploy of
 * code, but the VALUE of each badge level lives in plus/badges.json and is a
 * commit to the site.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table discount_grants (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  percent    int  not null check (percent between 1 and 100),
  kind       text not null default 'gift',
  label_fa   text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index on discount_grants (user_id);

create table discount_redemptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  source     text not null,
  percent    int  not null check (percent between 1 and 100),
  payment_id uuid not null references payments(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on discount_redemptions (user_id);
create unique index on discount_redemptions (payment_id, source);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists discount_redemptions;
drop table if exists discount_grants;
`);
};
