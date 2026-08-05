import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from './helpers.js';
import { pool, closePool } from '../src/db.js';
import {
  activateMonths, grantLifetime, revokeSubscription, getSubscription, isPremiumNow,
  PLAN_PAID, PLAN_FOUNDER,
} from '../src/services/subscription.js';

/**
 * The subscription engine (level 1.1): one row per user extended in place,
 * `max(now, current expiry) + N months` so an early renewal never burns paid
 * days, Tehran-anchored month arithmetic, and `profiles.tier` written only as a
 * projection of it.
 */

let seq = 0;

async function makeUser(): Promise<string> {
  seq += 1;
  const phone = `0912900${String(seq).padStart(4, '0')}`;
  const r = await pool.query<{ id: string }>(
    "insert into profiles (phone, display_name) values ($1, $2) returning id",
    [phone, `کاربر ${seq}`],
  );
  return r.rows[0].id;
}

async function tierOf(userId: string): Promise<string> {
  const r = await pool.query<{ tier: string }>('select tier from profiles where id = $1', [userId]);
  return r.rows[0].tier;
}

/** Whole days between two instants, rounded — enough to assert "about a month". */
function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

beforeEach(resetDb);
afterAll(closePool);

describe('activateMonths', () => {
  it('creates the first subscription and flips the tier to premium', async () => {
    const user = await makeUser();
    const now = new Date('2026-08-05T09:00:00Z');

    const sub = await activateMonths(user, 6, { source: 'payment', now });

    expect(sub.status).toBe('active');
    expect(sub.plan).toBe(PLAN_PAID);
    expect(sub.is_founder).toBe(false);
    expect(sub.expires_at).not.toBeNull();
    // Six months out — 181..184 days depending on which months were crossed.
    expect(daysBetween(sub.expires_at!, now)).toBeGreaterThanOrEqual(181);
    expect(daysBetween(sub.expires_at!, now)).toBeLessThanOrEqual(184);
    expect(await tierOf(user)).toBe('premium');
  });

  it('keeps exactly one row per user across repeated purchases', async () => {
    const user = await makeUser();
    await activateMonths(user, 1, { source: 'payment', now: new Date('2026-08-05T09:00:00Z') });
    await activateMonths(user, 1, { source: 'payment', now: new Date('2026-08-06T09:00:00Z') });
    await activateMonths(user, 1, { source: 'payment', now: new Date('2026-08-07T09:00:00Z') });

    const n = await pool.query<{ n: number }>(
      'select count(*)::int as n from subscriptions where user_id = $1',
      [user],
    );
    expect(n.rows[0].n).toBe(1);
  });

  it('extends from the current expiry, so renewing early does not burn paid days', async () => {
    const user = await makeUser();
    const bought = new Date('2026-08-05T09:00:00Z');
    const first = await activateMonths(user, 6, { source: 'payment', now: bought });

    // Renew with roughly five months still on the clock.
    const early = new Date('2026-09-05T09:00:00Z');
    const second = await activateMonths(user, 6, { source: 'payment', now: early });

    // The new expiry is six months past the OLD expiry, not six months past today.
    expect(daysBetween(second.expires_at!, first.expires_at!)).toBeGreaterThanOrEqual(181);
    expect(daysBetween(second.expires_at!, first.expires_at!)).toBeLessThanOrEqual(184);
    // Sanity: anchoring to `now` would have LOST a month here.
    expect(second.expires_at!.getTime()).toBeGreaterThan(
      new Date('2027-02-05T09:00:00Z').getTime(),
    );
  });

  it('restarts from today when the previous subscription already lapsed', async () => {
    const user = await makeUser();
    await activateMonths(user, 1, { source: 'payment', now: new Date('2026-01-05T09:00:00Z') });

    const comeback = new Date('2026-08-05T09:00:00Z');
    const renewed = await activateMonths(user, 1, { source: 'payment', now: comeback });

    // ~1 month from the comeback, not from the long-dead expiry.
    expect(daysBetween(renewed.expires_at!, comeback)).toBeGreaterThanOrEqual(28);
    expect(daysBetween(renewed.expires_at!, comeback)).toBeLessThanOrEqual(31);
  });

  it('does not reset started_at on renewal — it means "subscriber since"', async () => {
    const user = await makeUser();
    const first = await activateMonths(user, 1, { source: 'payment', now: new Date('2026-08-05T09:00:00Z') });
    const second = await activateMonths(user, 1, { source: 'payment', now: new Date('2026-09-05T09:00:00Z') });

    expect(second.started_at.getTime()).toBe(first.started_at.getTime());
  });

  it('lands on the last day of a short month rather than overflowing into the next', async () => {
    const user = await makeUser();
    // 31 Jan + 1 month must be 28/29 Feb, not 2/3 March.
    const sub = await activateMonths(user, 1, {
      source: 'payment',
      now: new Date('2026-01-31T09:00:00Z'),
    });
    expect(sub.expires_at!.toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('logs an audit event that pays no XP', async () => {
    const user = await makeUser();
    await activateMonths(user, 6, { source: 'admin', now: new Date('2026-08-05T09:00:00Z') });

    const ev = await pool.query<{ action: string; meta: Record<string, unknown> }>(
      'select action, meta from user_activity where user_id = $1',
      [user],
    );
    expect(ev.rows).toHaveLength(1);
    expect(ev.rows[0].action).toBe('subscription_activated');
    expect(ev.rows[0].meta.months).toBe(6);
    expect(ev.rows[0].meta.source).toBe('admin');

    // The action must sit outside every scoring allowlist, or buying a
    // subscription would quietly hand out league XP.
    const { QUALIFYING_ACTIONS } = await import('../src/services/streak.js');
    expect(QUALIFYING_ACTIONS.has('subscription_activated')).toBe(false);
  });

  it('rejects a month count that is not a sane whole number', async () => {
    const user = await makeUser();
    await expect(activateMonths(user, 0, { source: 'admin' })).rejects.toThrow(/months/);
    await expect(activateMonths(user, -3, { source: 'admin' })).rejects.toThrow(/months/);
    await expect(activateMonths(user, 1.5, { source: 'admin' })).rejects.toThrow(/months/);
    await expect(activateMonths(user, 999, { source: 'admin' })).rejects.toThrow(/months/);
    expect(await getSubscription(user)).toBeNull();
  });
});

describe('grantLifetime', () => {
  it('grants premium with no end date at all', async () => {
    const user = await makeUser();
    const sub = await grantLifetime(user, { source: 'admin' });

    expect(sub.is_founder).toBe(true);
    expect(sub.expires_at).toBeNull();
    expect(sub.plan).toBe(PLAN_FOUNDER);
    expect(sub.status).toBe('active');
    expect(await tierOf(user)).toBe('premium');
  });

  it('is still premium a century out — there is no date to run out', async () => {
    const user = await makeUser();
    const sub = await grantLifetime(user, { source: 'admin' });
    expect(isPremiumNow(sub, new Date('2126-01-01T00:00:00Z'))).toBe(true);
  });

  it('is invisible to a due-date scan, which is how the sweep will never see it', async () => {
    const user = await makeUser();
    await grantLifetime(user, { source: 'admin' });
    // The shape of the expiry sweep's query (level 1.5).
    const due = await pool.query(
      "select 1 from subscriptions where status = 'active' and expires_at <= now()",
    );
    expect(due.rowCount).toBe(0);
  });

  it('is idempotent — granting twice leaves one row and one founder', async () => {
    const user = await makeUser();
    const first = await grantLifetime(user, { source: 'admin', now: new Date('2026-08-05T09:00:00Z') });
    const again = await grantLifetime(user, { source: 'admin', now: new Date('2026-09-05T09:00:00Z') });

    expect(again.is_founder).toBe(true);
    expect(again.started_at.getTime()).toBe(first.started_at.getTime());
    const n = await pool.query<{ n: number }>(
      'select count(*)::int as n from subscriptions where user_id = $1',
      [user],
    );
    expect(n.rows[0].n).toBe(1);
  });

  it('upgrades a paying subscriber, dropping the date rather than keeping it as a fallback', async () => {
    const user = await makeUser();
    await activateMonths(user, 6, { source: 'payment', now: new Date('2026-08-05T09:00:00Z') });
    const sub = await grantLifetime(user, { source: 'admin' });

    expect(sub.is_founder).toBe(true);
    expect(sub.expires_at).toBeNull();
    // The days given up are recorded, since the row itself no longer carries them.
    const ev = await pool.query<{ meta: Record<string, unknown> }>(
      "select meta from user_activity where user_id = $1 and meta->>'kind' = 'lifetime'",
      [user],
    );
    expect(ev.rows[0].meta.replaced_expires_at).not.toBeNull();
  });

  it('is never downgraded to a finite date by a later purchase', async () => {
    const user = await makeUser();
    await grantLifetime(user, { source: 'admin' });

    // A founder who pays anyway — the money is still recorded elsewhere, but the
    // act of paying must not turn a lifetime account into an expiring one.
    const after = await activateMonths(user, 12, { source: 'payment' });

    expect(after.is_founder).toBe(true);
    expect(after.expires_at).toBeNull();
    expect((await getSubscription(user))!.expires_at).toBeNull();
  });

  it('cannot be written as a founder row carrying a date, or a dated row claiming to be one', async () => {
    const user = await makeUser();
    // Both halves of the lifetime invariant, straight at the database.
    await expect(pool.query(
      `insert into subscriptions (user_id, status, plan, expires_at, is_founder)
       values ($1, 'active', 'founder', now() + interval '1 year', true)`,
      [user],
    )).rejects.toThrow(/subscriptions_lifetime_ck/);
    await expect(pool.query(
      `insert into subscriptions (user_id, status, plan, expires_at, is_founder)
       values ($1, 'active', 'paid', null, false)`,
      [user],
    )).rejects.toThrow(/subscriptions_lifetime_ck/);
  });
});

describe('revokeSubscription', () => {
  it('removes the subscription and records what was taken back', async () => {
    const user = await makeUser();
    await grantLifetime(user, { source: 'admin' });

    expect(await revokeSubscription(user, { source: 'admin' })).toBe(true);
    expect(await getSubscription(user)).toBeNull();

    const ev = await pool.query<{ meta: Record<string, unknown> }>(
      "select meta from user_activity where user_id = $1 and meta->>'kind' = 'revoked'",
      [user],
    );
    expect(ev.rows[0].meta.was_founder).toBe(true);
  });

  it('leaves the tier alone — only the sweep may take premium away', async () => {
    const user = await makeUser();
    await grantLifetime(user, { source: 'admin' });
    await revokeSubscription(user, { source: 'admin' });
    // Still premium here on purpose: a league prize may be holding this account
    // up, and revoke has no way to know. The sweep decides.
    expect(await tierOf(user)).toBe('premium');
  });

  it('is a no-op for a user who never had one', async () => {
    const user = await makeUser();
    expect(await revokeSubscription(user, { source: 'admin' })).toBe(false);
  });

  it('lets a re-grant start clean rather than inheriting the old start date', async () => {
    const user = await makeUser();
    await activateMonths(user, 6, { source: 'payment', now: new Date('2026-01-05T09:00:00Z') });
    await revokeSubscription(user, { source: 'admin' });

    const fresh = await activateMonths(user, 1, { source: 'payment', now: new Date('2026-08-05T09:00:00Z') });
    expect(fresh.started_at.toISOString().slice(0, 10)).toBe('2026-08-05');
    // And no paid days survived the revoke to be extended from.
    expect(daysBetween(fresh.expires_at!, new Date('2026-08-05T09:00:00Z'))).toBeLessThanOrEqual(31);
  });
});

describe('isPremiumNow', () => {
  it('reads the calendar, not the sweep', async () => {
    const user = await makeUser();
    const sub = await activateMonths(user, 1, { source: 'payment', now: new Date('2026-08-05T09:00:00Z') });

    expect(isPremiumNow(sub, new Date('2026-08-20T09:00:00Z'))).toBe(true);
    // Due but not yet swept: the row still says status='active', and the answer
    // must still be "no".
    expect(sub.status).toBe('active');
    expect(isPremiumNow(sub, new Date('2026-10-01T09:00:00Z'))).toBe(false);
  });

  it('is false for a user who never subscribed', () => {
    expect(isPremiumNow(null)).toBe(false);
  });
});
