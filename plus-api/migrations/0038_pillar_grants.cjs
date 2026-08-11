/**
 * «ستون» seats the founder gives rather than the gateway mints.
 *
 * The seat has always been DERIVED from `payments` (services/pillar.ts): the
 * rank of an account's first paid row, never written down, so the entitlement
 * cannot drift from the money that earned it. That is still true for every seat
 * money buys, and this table does not touch it.
 *
 * What it adds is the one case the derivation cannot express: a person who
 * helped build the thing and was never going to appear in a payments ledger.
 * Before this, the only ways to seat them were to forge a `payments` row —
 * which would lie to revenue, to the gateway's monthly ceiling and to the
 * discount-credit join — or to teach the badge wall a second definition of a
 * seat, which is exactly what pillar.ts was written to prevent. So the grant is
 * stored as what it is, beside the ledger rather than inside it, and
 * services/pillar.ts ranks the union: one definition, still, with two sources.
 *
 * Three properties the rest of the system relies on:
 *
 *   · `granted_at` is a claim timestamp, ranked against a payment's own. Since
 *     a grant is written today it sorts AFTER every seat already taken, so
 *     nobody's seat number ever moves under them.
 *
 *   · user_id is the primary key, so granting twice is one seat and an account
 *     that later pays does not hold two — pillar.ts takes the earlier of its
 *     claims.
 *
 *   · A granted seat consumes one of PILLAR_SEATS. The capacity does not grow
 *     to accommodate a gift; the founder is spending a seat, and the public
 *     promise of «پنجاه» readers stays exactly as true as it was.
 *
 * Deleting a row un-seats the account: legitimate here, unlike a paid seat,
 * because a gift the founder made is a gift the founder can take back, and
 * nothing about it is a receipt.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table pillar_grants (
  user_id    uuid primary key references profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  note       text
);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists pillar_grants;
`);
};
