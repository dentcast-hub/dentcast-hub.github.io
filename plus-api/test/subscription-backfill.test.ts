import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { resetDb } from './helpers.js';
import { pool, closePool } from '../src/db.js';
import { getSubscription, activateMonths } from '../src/services/subscription.js';

/**
 * Migration 0019 — the one-time backfill that gives pre-payment premium
 * accounts a founder subscription, so the sweep in level 1.5 does not revoke
 * the founders' own accounts on its first run.
 *
 * The migration itself is executed here rather than reimplemented: the rule is
 * subtle enough (league winners must NOT be swept up in it) that a test written
 * against a paraphrase would happily pass while the shipped SQL was wrong. By
 * the time these tests run, global-setup has already applied 0019 to an empty
 * database, so re-running it against fixtures is also a direct check that it is
 * safely repeatable.
 */

const require_ = createRequire(import.meta.url);

/** Run migration 0019's up()/down() by capturing the SQL it hands to pgm. */
async function runMigration(direction: 'up' | 'down'): Promise<void> {
  const migration = require_('../migrations/0019_backfill_founder_subscriptions.cjs');
  const statements: string[] = [];
  migration[direction]({ sql: (s: string) => statements.push(s) });
  for (const sql of statements) await pool.query(sql);
}

let seq = 0;

async function makeUser(tier: 'free' | 'premium'): Promise<string> {
  seq += 1;
  const phone = `0912910${String(seq).padStart(4, '0')}`;
  const r = await pool.query<{ id: string }>(
    'insert into profiles (phone, display_name, tier) values ($1, $2, $3) returning id',
    [phone, `کاربر ${seq}`, tier],
  );
  return r.rows[0].id;
}

/** A league prize grant — the history that marks premium as temporary. */
async function giveLeagueGrant(userId: string, opts: { expired?: boolean } = {}): Promise<void> {
  await pool.query(
    `insert into premium_grants (user_id, week_start, granted_at, expires_at, revoked_at)
     values ($1, '2026-02-07', now() - interval '10 days', now() - interval '3 days', $2)`,
    [userId, opts.expired ? new Date().toISOString() : null],
  );
}

beforeEach(resetDb);
afterAll(closePool);

describe('migration 0019 — founder backfill', () => {
  it('gives a hand-flipped premium account a lifetime subscription', async () => {
    const founder = await makeUser('premium');
    await runMigration('up');

    const sub = await getSubscription(founder);
    expect(sub).not.toBeNull();
    expect(sub!.is_founder).toBe(true);
    expect(sub!.expires_at).toBeNull();
    expect(sub!.plan).toBe('founder');
    expect(sub!.status).toBe('active');
  });

  it('dates the subscription from when they joined, not from today', async () => {
    const founder = await makeUser('premium');
    await pool.query("update profiles set created_at = '2025-03-01T00:00:00Z' where id = $1", [founder]);
    await runMigration('up');

    const sub = await getSubscription(founder);
    expect(sub!.started_at.toISOString().slice(0, 10)).toBe('2025-03-01');
  });

  it('leaves free accounts alone', async () => {
    const free = await makeUser('free');
    await runMigration('up');
    expect(await getSubscription(free)).toBeNull();
  });

  it('does NOT turn a league winner into a founder', async () => {
    const winner = await makeUser('premium');
    await giveLeagueGrant(winner);
    await runMigration('up');

    // Their premium is the league's to take back; a founder row would make a
    // week-long prize permanent.
    expect(await getSubscription(winner)).toBeNull();
  });

  it('does NOT turn a PAST league winner into a founder either', async () => {
    // The hazard case: the grant already expired and was revoked, so the user is
    // free again — but if they were premium at backfill time with only stale
    // grant history, "no ACTIVE grant" would have read as "founder".
    const pastWinner = await makeUser('premium');
    await giveLeagueGrant(pastWinner, { expired: true });
    await runMigration('up');

    expect(await getSubscription(pastWinner)).toBeNull();
  });

  it('does not touch an account that already has a real subscription', async () => {
    const payer = await makeUser('free');
    const before = await activateMonths(payer, 6, {
      source: 'payment',
      now: new Date('2026-08-05T09:00:00Z'),
    });
    await runMigration('up');

    const after = await getSubscription(payer);
    expect(after!.is_founder).toBe(false);
    expect(after!.expires_at!.getTime()).toBe(before.expires_at!.getTime());
  });

  it('is safely repeatable — a second run changes nothing', async () => {
    const founder = await makeUser('premium');
    await runMigration('up');
    const first = await getSubscription(founder);
    await runMigration('up');

    const rows = await pool.query<{ n: number }>(
      'select count(*)::int as n from subscriptions where user_id = $1',
      [founder],
    );
    expect(rows.rows[0].n).toBe(1);
    expect((await getSubscription(founder))!.started_at.getTime()).toBe(first!.started_at.getTime());

    const events = await pool.query<{ n: number }>(
      "select count(*)::int as n from user_activity where user_id = $1 and action = 'subscription_activated'",
      [founder],
    );
    expect(events.rows[0].n).toBe(1);
  });

  it('leaves an audit trail marked as a backfill', async () => {
    const founder = await makeUser('premium');
    await runMigration('up');

    const ev = await pool.query<{ meta: Record<string, unknown> }>(
      "select meta from user_activity where user_id = $1 and action = 'subscription_activated'",
      [founder],
    );
    expect(ev.rows).toHaveLength(1);
    expect(ev.rows[0].meta.source).toBe('backfill');
    expect(ev.rows[0].meta.kind).toBe('lifetime');
  });

  it('rolls back exactly what it created, and nothing else', async () => {
    const founder = await makeUser('premium');
    const payer = await makeUser('free');
    await activateMonths(payer, 6, { source: 'payment' });
    await runMigration('up');

    await runMigration('down');

    expect(await getSubscription(founder)).toBeNull();
    // The paying subscriber is untouched by the rollback.
    expect(await getSubscription(payer)).not.toBeNull();
  });
});
