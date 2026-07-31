import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { finalizeWeek } from '../src/services/league-finalize.js';
import { grantWeeklyPrizes, expirePremiumPrizes } from '../src/services/premium-prize.js';
import { notifyPremiumPrizes } from '../src/services/premium-prize-notify.js';

/**
 * Weekly league prize: top 2 of the current highest active tier that had
 * members, 7 days of premium, dynamic (walks down from the top), idempotent,
 * never misleads an already-premium winner, and auto-reverts unless the user
 * wins again or holds a real subscription.
 */

const WEEK = '2026-02-07';
// Fixed instant near WEEK — grantWeeklyPrizes only scans a trailing FRESH_DAYS
// window, so a real new Date() (today, in whatever year this runs) would miss
// the 2026-02 fixtures entirely.
const NEAR_WEEK = new Date('2026-02-08T00:00:00Z');
const AWAKE = new Date('2026-02-10T11:00:00+03:30');
const ASLEEP = new Date('2026-02-10T02:00:00+03:30');
const NEXT_MORNING = new Date('2026-02-10T09:00:00+03:30');

let seq = 0;

async function tierId(slug: string): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from league_tiers where slug = $1', [slug]);
  return r.rows[0].id;
}

async function tierOfUser(userId: string): Promise<string> {
  const r = await pool.query<{ tier: string }>('select tier from profiles where id = $1', [userId]);
  return r.rows[0].tier;
}

async function grantRow(userId: string, week = WEEK): Promise<{
  expires_at: string; revoked_at: string | null; notified_at: string | null; seen: boolean;
} | null> {
  const r = await pool.query(
    'select expires_at, revoked_at, notified_at, seen from premium_grants where user_id = $1 and week_start = $2',
    [userId, week],
  );
  return r.rows[0] ?? null;
}

/** A closed group in `tierSlug` with the given weekly_xp values (descending order recommended). */
async function seedGroup(tierSlug: string, xps: number[], week = WEEK): Promise<string[]> {
  const tid = await tierId(tierSlug);
  const lg = await pool.query<{ id: string }>(
    `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
     values ($1, $2, $2, 'closed', $3) returning id`,
    [tid, week, Math.max(xps.length, 8)],
  );
  const userIds: string[] = [];
  for (let i = 0; i < xps.length; i += 1) {
    seq += 1;
    const u = await pool.query<{ id: string }>(
      'insert into profiles (display_name, current_tier_id) values ($1, $2) returning id',
      [`u${seq}`, tid],
    );
    userIds.push(u.rows[0].id);
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
       values ($1, $2, $3, $4, $5)`,
      [lg.rows[0].id, u.rows[0].id, week, xps[i], `2026-02-0${i + 1}T00:00:00Z`],
    );
  }
  return userIds;
}

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await pool.end(); });

describe('grantWeeklyPrizes — dynamic tier + top 2', () => {
  it('grants only the top 2 of the CURRENT highest active tier that had members, not a lower tier', async () => {
    // amalgam (order 2) has a group; composite (order 3, top active) also does —
    // the prize must go to composite's top 2 only.
    const amalgamIds = await seedGroup('amalgam', [90, 80, 70]);
    const compositeIds = await seedGroup('composite', [60, 50, 40, 30]);
    await finalizeWeek(WEEK);

    const res = await grantWeeklyPrizes(NEAR_WEEK);
    expect(res.granted).toBe(2);

    expect(await tierOfUser(compositeIds[0])).toBe('premium');
    expect(await tierOfUser(compositeIds[1])).toBe('premium');
    expect(await tierOfUser(compositeIds[2])).toBe('free');
    expect(await tierOfUser(compositeIds[3])).toBe('free');
    for (const id of amalgamIds) expect(await tierOfUser(id)).toBe('free');
  });

  it('falls through to a lower tier when the top active tier had no finalized group that week', async () => {
    // Only amalgam has members this week; composite (top active) is empty.
    const amalgamIds = await seedGroup('amalgam', [90, 80, 70]);
    await finalizeWeek(WEEK);

    const res = await grantWeeklyPrizes(NEAR_WEEK);
    expect(res.granted).toBe(2);
    expect(await tierOfUser(amalgamIds[0])).toBe('premium');
    expect(await tierOfUser(amalgamIds[1])).toBe('premium');
    expect(await tierOfUser(amalgamIds[2])).toBe('free');
  });

  it('sets a 7-day expiry and marks the winners in premium_grants', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    const now = new Date('2026-02-08T00:00:00Z');
    await grantWeeklyPrizes(now);

    const g = await grantRow(ids[0]);
    expect(g).not.toBeNull();
    expect(g!.revoked_at).toBeNull();
    expect(g!.seen).toBe(false);
    const days = (new Date(g!.expires_at).getTime() - now.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(7);
  });

  it('is idempotent: running it twice does not double-grant or duplicate rows', async () => {
    const ids = await seedGroup('composite', [90, 80, 70]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(NEAR_WEEK);
    const second = await grantWeeklyPrizes(NEAR_WEEK);
    expect(second.granted).toBe(0);

    const count = await pool.query<{ n: number }>(
      'select count(*)::int as n from premium_grants where user_id = $1', [ids[0]],
    );
    expect(count.rows[0].n).toBe(1);
  });

  it('skips a winner who is already premium — no grant row, no misleading banner', async () => {
    const ids = await seedGroup('composite', [90, 80, 70]);
    await pool.query("update profiles set tier = 'premium' where id = $1", [ids[0]]);
    await finalizeWeek(WEEK);

    const res = await grantWeeklyPrizes(NEAR_WEEK);
    expect(res.granted).toBe(1); // only rank 2 was actually granted something new
    expect(await grantRow(ids[0])).toBeNull();
    expect(await grantRow(ids[1])).not.toBeNull();
  });
});

describe('expirePremiumPrizes', () => {
  it('reverts tier to free once expires_at has passed', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    const past = new Date('2026-02-08T00:00:00Z');
    await grantWeeklyPrizes(past); // expires_at = past + 7d

    const justAfter = new Date(past.getTime() + 8 * 86_400_000);
    const res = await expirePremiumPrizes(justAfter);
    expect(res.expired).toBe(2);
    expect(await tierOfUser(ids[0])).toBe('free');
    expect((await grantRow(ids[0]))!.revoked_at).not.toBeNull();
  });

  it('does NOT revert a repeat winner who holds a newer, still-active grant', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    const week1At = new Date('2026-02-08T00:00:00Z');
    await grantWeeklyPrizes(week1At); // expires in 7 days from week1At

    // Wins again the following week — a second grant row, still active.
    const WEEK2 = '2026-02-14';
    const ids2 = await seedGroup('composite', [95, 85], WEEK2);
    // Re-seed the SAME winner into week 2 by reusing their id directly.
    await pool.query('delete from league_members where user_id = any($1) and week_start = $2', [ids2, WEEK2]);
    const tid = await tierId('composite');
    const lg2 = await pool.query<{ id: string }>(
      `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
       values ($1, $2, $2, 'closed', 8) returning id`,
      [tid, WEEK2],
    );
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
       values ($1, $2, $3, $4, $5)`,
      [lg2.rows[0].id, ids[0], WEEK2, 100, '2026-02-14T00:00:00Z'],
    );
    // Clearly BEFORE week 1's exact expiry instant (2026-02-15T00:00:00Z), so
    // this is an unambiguous "won again while still covered" case.
    const week2At = new Date('2026-02-13T00:00:00Z');
    await finalizeWeek(WEEK2, week1At);
    await grantWeeklyPrizes(week2At); // extends ids[0]'s premium with a new grant row
    expect((await grantRow(ids[0], WEEK2))!.expires_at).not.toBeNull();

    // Now check the moment week 1's grant would have expired on its own.
    const week1Expiry = new Date(week1At.getTime() + 8 * 86_400_000);
    await expirePremiumPrizes(week1Expiry);
    expect(await tierOfUser(ids[0])).toBe('premium'); // still premium — the week-2 grant covers them
    // Week 1's row is correctly left untouched (not yet a terminal outcome) while
    // a newer grant still covers the user — it is only ever revoked once NEITHER
    // grant is active, which the next test's simpler case already covers.
    expect((await grantRow(ids[0], WEEK))!.revoked_at).toBeNull();
  });

  it('never downgrades a real active subscriber', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    const past = new Date('2026-02-08T00:00:00Z');
    await grantWeeklyPrizes(past);
    await pool.query(
      `insert into subscriptions (user_id, status, plan) values ($1, 'active', 'yearly')`,
      [ids[0]],
    );

    const justAfter = new Date(past.getTime() + 8 * 86_400_000);
    await expirePremiumPrizes(justAfter);
    expect(await tierOfUser(ids[0])).toBe('premium');
  });
});

describe('GET /me pending_premium_grant + POST /premium/grant/seen', () => {
  let app: FastifyInstance;
  beforeEach(async () => { app = await makeApp(); });

  it('surfaces an unseen active grant, then null after acknowledging it', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(NEAR_WEEK);

    // Sign the winner in and check /me.
    const phone = '09121300001';
    await pool.query('update profiles set phone = $1 where id = $2', [phone, ids[0]]);
    const cookie = await loginAs(app, phone);

    const me1 = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me1.json().tier).toBe('premium');
    expect(me1.json().pending_premium_grant).not.toBeNull();

    const seenRes = await app.inject({ method: 'POST', url: '/premium/grant/seen', headers: { cookie } });
    expect(seenRes.statusCode).toBe(200);

    const me2 = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me2.json().pending_premium_grant).toBeNull();
  });

  it('is null for a user with no grant at all', async () => {
    const cookie = await loginAs(app, '09121300002');
    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.json().pending_premium_grant).toBeNull();
  });
});

describe('notifyPremiumPrizes', () => {
  it('announces within the awake window and claims (a second sweep sends nothing new)', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids[0], 700001]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids[1], 700002]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(AWAKE);

    const first = await notifyPremiumPrizes(AWAKE);
    expect(first.notified).toBe(2);
    const second = await notifyPremiumPrizes(AWAKE);
    expect(second.notified).toBe(0);
  });

  it('holds the push outside the awake window, releases it the next morning', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids[0], 700003]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids[1], 700004]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(ASLEEP);

    expect((await notifyPremiumPrizes(ASLEEP)).notified).toBe(0);
    expect((await notifyPremiumPrizes(NEXT_MORNING)).notified).toBe(2);
  });
});
