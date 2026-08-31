/**
 * تعطیلی مطب — the days the clinic is shut beyond its ordinary Sat-Wed week.
 *
 * The contact card's open/closed pill is computed from the working hours, so
 * through a holiday it promised visitors an opening time nobody would keep.
 * These rows are what the card asks about (GET /clinic/status), written from
 * the admin panel: a break the founder needs to announce from a phone must not
 * be a deploy.
 *
 * One row per announced break, inclusive on both ends. Overlapping rows are
 * legal and deliberate — extending a break is one more row, never an edit, and
 * the latest end wins. `note` is an optional founder-written sentence that the
 * pill prints verbatim; left empty, the sentence is built from the dates.
 *
 * NO ROW MEANS NOTHING CHANGES: an empty table leaves the card computing the
 * pill exactly as it did before this table existed.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table clinic_closures (
  id         uuid primary key default gen_random_uuid(),
  starts_on  date not null,
  ends_on    date not null,
  note       text,
  created_at timestamptz not null default now(),
  constraint clinic_closures_range check (ends_on >= starts_on)
);

create index clinic_closures_window on clinic_closures (starts_on, ends_on);
  `);

  // The break that is live on the site right now, carried over from the date
  // constant this table replaces in /card/index.html — so the announcement the
  // card is already making survives the deploy instead of blinking off until
  // somebody retypes it. Ordinary data: delete it from the panel like any other.
  pgm.sql(`
insert into clinic_closures (starts_on, ends_on, note)
values (date '2026-08-31', date '2026-09-04', 'مطب تا ۱۴ شهریور تعطیل است');
  `);
};

exports.down = (pgm) => {
  pgm.sql('drop table clinic_closures;');
};
