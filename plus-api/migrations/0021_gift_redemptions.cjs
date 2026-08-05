/**
 * Gift-card redemptions — how someone outside Iran pays.
 *
 * A US Apple gift card is handed over as a code, redeemed by hand on our side,
 * and converted into months of premium. There is no gateway, no verify call and
 * no automatic anything: a human reads the code into Apple, sees whether it is
 * real, and approves or rejects. That is the whole design, and it is why this
 * needs a table rather than a column — a redemption has a life of its own
 * between "submitted" and "answered".
 *
 * ITS OWN TABLE, NOT `payments`, and this is the part that matters. The monthly
 * capacity counter reads `payments` to decide how much of the e-namad ceiling is
 * left, and that ceiling governs Zibal transactions in rial. A gift card is
 * neither: putting one in `payments` would consume a regulatory allowance it has
 * nothing to do with, and would quietly stop Iranian customers from buying so
 * that a foreign one could. Separate table, separate ledger, ceiling untouched.
 *
 * The code is stored because a rejected submission has to be arguable — the
 * person is claiming they gave us something worth $100 and we are saying it was
 * not. It is not a credential and confers nothing: by the time we have decided,
 * the card is either already redeemed into our account or was never valid.
 *
 * `status` starts 'pending'. 'approved' is written in the same transaction that
 * extends the subscription, so an approval that fails halfway grants nothing;
 * 'rejected' carries a reason, because "no" without one is the worst answer a
 * paying customer can receive.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table gift_redemptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  code        text not null,
  kind        text not null default 'apple_us',
  months      int  not null,
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  note        text,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- One pending submission per person at a time. Without it, an anxious customer
-- who presses the button twice becomes two queue entries for one card, and
-- approving both would grant twenty months for ten.
create unique index gift_redemptions_one_pending
  on gift_redemptions (user_id) where status = 'pending';

-- The same code cannot be claimed twice, by the same person or a different one.
create unique index gift_redemptions_code_uniq
  on gift_redemptions (kind, code) where status <> 'rejected';

-- Serves the admin queue directly (oldest first).
create index gift_redemptions_pending_idx
  on gift_redemptions (created_at) where status = 'pending';
  `);
};

exports.down = (pgm) => {
  pgm.sql('drop table if exists gift_redemptions cascade;');
};
