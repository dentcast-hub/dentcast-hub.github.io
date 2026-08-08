/**
 * A broadcast remembers whether its push still owes delivery.
 *
 * The awake window HOLDS a broadcast's push outside 09:00-22:00 — the row lands
 * in اطلاعیه immediately, the phones wait. The comment on that branch said
 * nothing was lost because the founder could "press it again in the morning",
 * and on 2026-08-07 at 22:56 we found out that is not true: pressing again
 * writes a SECOND broadcast row, so every reader gets the same announcement
 * twice in their inbox. Holding was therefore the same as dropping, and the only
 * way to get the push was to accept a duplicate.
 *
 * Two columns close that:
 *   push_requested - the founder asked for a push on this broadcast.
 *   pushed_at      - it has since gone out. NULL with push_requested = true is
 *                    the whole queue: exactly the broadcasts that still owe one.
 *
 * `pushed_at` is what makes both release paths idempotent — the morning sweep
 * (scheduler) and the manual POST /admin/notices/:id/push claim the same way, so
 * a retry, an overlapping run, or a founder pressing the button twice can never
 * send the same broadcast to the same people twice.
 *
 * Existing rows get push_requested = false: everything already sent either went
 * out or was never asked to, and a backfill that guessed otherwise would push
 * old announcements to everyone at the next sweep.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table notice_broadcasts
  add column push_requested boolean not null default false,
  add column pushed_at      timestamptz;

-- The queue is "asked for, not yet delivered". Partial, because that set is
-- tiny and permanently so, while the table grows with every announcement.
create index notice_broadcasts_push_pending
    on notice_broadcasts (created_at)
 where push_requested and pushed_at is null;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop index if exists notice_broadcasts_push_pending;
alter table notice_broadcasts
  drop column if exists pushed_at,
  drop column if exists push_requested;
`);
};
