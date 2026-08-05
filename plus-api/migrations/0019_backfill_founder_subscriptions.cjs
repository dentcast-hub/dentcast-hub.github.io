/**
 * One-time data fix: give every EXISTING premium account a subscription row,
 * before the nightly expiry sweep (level 1.5) exists to notice they have none.
 *
 * Until now the only way to make someone premium was POST /admin/users/set-tier,
 * which writes `profiles.tier = 'premium'` and nothing else. That was harmless
 * while `subscriptions` was unused — the league prize sweep only ever inspects
 * accounts that hold a `premium_grants` row, so a hand-flipped tier was simply
 * never looked at. The moment a general sweep ships, "premium with no
 * subscription and no grant" becomes exactly the shape it revokes, and the
 * founders' own accounts are the first rows it would find. This migration must
 * therefore precede that sweep, not accompany it.
 *
 * WHO IS A FOUNDER, precisely:
 *
 *   tier = 'premium'  AND  no subscriptions row  AND  no premium_grants row EVER
 *
 * The last clause is what keeps league winners out of it, and it is the same
 * test premium-prize.ts already applies when deciding whether a premium account
 * is "ours": any grant history at all — even fully expired and revoked — means
 * this premium came from the league and is meant to end. Backfilling those users
 * as founders would hand a permanent subscription to everyone who ever won a
 * week, which is both wrong and unrecoverable once the grant rows age out.
 *
 * `started_at` is taken from `profiles.created_at` rather than now(): for an
 * account that has been premium since before payments existed, "subscriber
 * since" is honestly the day they joined, and stamping today would tell every
 * future report the founders subscribed the day the gateway shipped.
 *
 * Idempotent by its own WHERE clause (a second run matches nothing), so a
 * re-run during a rollback/replay cannot double-write.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into subscriptions (user_id, status, plan, started_at, expires_at, is_founder)
select p.id, 'active', 'founder', p.created_at, null, true
  from profiles p
 where p.tier = 'premium'
   and not exists (select 1 from subscriptions s where s.user_id = p.id)
   and not exists (select 1 from premium_grants g where g.user_id = p.id);

-- Same audit event the service writes, so a backfilled founder is not a row
-- that appeared from nowhere when someone reads the log years from now.
insert into user_activity (user_id, action, meta)
select s.user_id, 'subscription_activated',
       jsonb_build_object('kind', 'lifetime', 'source', 'backfill', 'replaced_expires_at', null)
  from subscriptions s
 where s.is_founder
   and not exists (
     select 1 from user_activity a
      where a.user_id = s.user_id and a.action = 'subscription_activated'
   );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from subscriptions s
 using user_activity a
 where a.user_id = s.user_id
   and a.action = 'subscription_activated'
   and a.meta->>'source' = 'backfill'
   and s.is_founder;

delete from user_activity
 where action = 'subscription_activated' and meta->>'source' = 'backfill';
  `);
};
