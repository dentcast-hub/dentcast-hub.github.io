/**
 * The dead-man's switch («کلید ایمنی»).
 *
 * The problem it solves is not a bug — it is succession. Every premium gate on
 * this site reads one column, profiles.tier, and only the founder can move it.
 * If the founder stops existing, that column freezes forever: the content stays
 * online (the site is static) but the premium half of it is locked behind a door
 * nobody is left to open. This table is the switch that opens the door.
 *
 * THREE DESIGN DECISIONS ARE ENCODED HERE, each deliberately not the obvious one:
 *
 * 1. The trigger is a HEARTBEAT, not silence-on-the-blog. "No new post for three
 *    months" was the first instinct and it is wrong: illness, travel, burnout and
 *    a heavy research season all produce three silent months from a very-much
 *    alive founder, and firing on one of those flips the whole site's economy
 *    over a holiday. So ANY founder action is proof of life — a publish, an
 *    /admin request, or an explicit "I'm here" tap — and each one resets the
 *    clock. Publishing becomes ONE heartbeat among several rather than the only
 *    one the system can see.
 *
 * 2. It ARMS A FLAG; it does not mass-rewrite profiles.tier. A sweep that set
 *    tier='premium' on every row would be irreversible in practice (once written,
 *    the real free/premium distinction is gone), would miss everyone who signs up
 *    afterwards — the readers who most need it, since they arrive when nobody is
 *    left to grant anything — and would corrupt the league prize's bookkeeping,
 *    which reads that same column to decide who already has premium. One armed_at
 *    timestamp on one row avoids all three: the column keeps telling the truth,
 *    the entitlement is computed on top of it at read time (middleware/auth.ts),
 *    future signups are covered for free, and disarming is one UPDATE.
 *
 * 3. Arming does NOT switch the ads off, even though premium normally means no
 *    ads. Ad revenue is what pays for the server that serves the premium features
 *    the switch just unlocked; a switch that cancels its own funding turns itself
 *    off within a billing cycle. So the failsafe unlocks FEATURES and leaves Spot
 *    running — see spot.js's classOf(), which reads base_tier for exactly this.
 *
 * Single row (id = 1), seeded here so the state always exists and no code path
 * has to handle "the switch has never been initialised".
 *
 *   last_heartbeat_at      - last proof of life. The silence clock counts from here.
 *   last_heartbeat_source  - 'publish' | 'admin' | 'manual' | 'bootstrap'. Display
 *                            only, but it is what tells the founder WHICH of their
 *                            habits is currently keeping the switch fed.
 *   warned_at              - last time the grace-period warning went out.
 *   warned_for_heartbeat_at- the heartbeat that warning was about. Comparing it to
 *                            last_heartbeat_at is how a warning is invalidated by a
 *                            return: a fresh heartbeat makes the stored value stale,
 *                            so the next silence starts its warnings from scratch
 *                            instead of inheriting the previous scare's timestamps.
 *   armed_at               - non-null = the switch has FIRED and everyone is premium.
 *                            Null while dormant, and null again after a disarm.
 *   armed_reason           - 'silence' (the sweep) or 'manual' (armed from /admin,
 *                            which is also the only way to TEST that it works).
 *
 * failsafe_log is the audit trail. Heartbeats are deliberately NOT logged (they
 * are frequent and uninteresting); only the three events that change what a
 * reader sees are — warned, armed, disarmed. Without it, "why is everyone
 * premium?" would be answerable only by guessing.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table failsafe_state (
  id                       smallint primary key default 1 check (id = 1),
  last_heartbeat_at        timestamptz not null default now(),
  last_heartbeat_source    text        not null default 'bootstrap',
  warned_at                timestamptz,
  warned_for_heartbeat_at  timestamptz,
  armed_at                 timestamptz,
  armed_reason             text,
  updated_at               timestamptz not null default now()
);
insert into failsafe_state (id) values (1);

create table failsafe_log (
  id      uuid primary key default gen_random_uuid(),
  at      timestamptz not null default now(),
  event   text not null,
  detail  text
);
create index on failsafe_log (at desc);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists failsafe_log cascade;
drop table if exists failsafe_state cascade;
`);
};
