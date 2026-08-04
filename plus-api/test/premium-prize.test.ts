import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { finalizeWeek } from '../src/services/league-finalize.js';
import { grantWeeklyPrizes, expirePremiumPrizes } from '../src/services/premium-prize.js';
import { notifyPremiumPrizes, PREMIUM_FEATURE_TITLES } from '../src/services/premium-prize-notify.js';
import { readFile, readdir } from 'node:fs/promises';
import { notifications } from '../src/providers/registry.js';
import { getLeagueConfig } from '../src/services/league-config.js';
import { vi } from 'vitest';

/**
 * Weekly league prize: the top of EVERY VALID group (not the top of one tier),
 * prize_days of premium, a cooldown that passes the prize down rather than
 * wasting it, idempotent, never misleads an already-premium winner, and
 * auto-reverts unless the user wins again or holds a real subscription.
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

/** Groups below this award nothing — four people is not a race (seed default: 6). */
const MIN_VALID = 6;

/**
 * A closed group in `tierSlug` with the given weekly_xp values, in rank order.
 * PADDED up to MIN_VALID with low-XP filler members, because the prize only
 * looks at valid groups now: without the padding every fixture here would be an
 * undersized group and win nothing. Returns only the ids of the members whose
 * XP was named, so a test's ids[0] is still rank 1.
 */
async function seedGroup(tierSlug: string, xps: number[], week = WEEK, size = MIN_VALID): Promise<string[]> {
  const tid = await tierId(tierSlug);
  const total = Math.max(xps.length, size);
  const lg = await pool.query<{ id: string }>(
    `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
     values ($1, $2, $2, 'closed', $3) returning id`,
    [tid, week, Math.max(total, 8)],
  );
  const named: string[] = [];
  for (let i = 0; i < total; i += 1) {
    seq += 1;
    const u = await pool.query<{ id: string }>(
      'insert into profiles (display_name, current_tier_id) values ($1, $2) returning id',
      [`u${seq}`, tid],
    );
    if (i < xps.length) named.push(u.rows[0].id);
    // Filler always ranks below every named member.
    const xp = i < xps.length ? xps[i] : 1;
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
       values ($1, $2, $3, $4, $5)`,
      [lg.rows[0].id, u.rows[0].id, week, xp, `2026-02-0${(i % 9) + 1}T00:00:00Z`],
    );
  }
  return named;
}

/** Retune a prize knob for one test (league_config is restored by resetDb). */
async function setPrizeCfg(key: string, value: string): Promise<void> {
  await pool.query('update league_config set value = $2 where key = $1', [key, value]);
}

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await pool.end(); });

describe('grantWeeklyPrizes — top of every valid group', () => {
  it('grants in EVERY tier that had a valid group, not only the highest one', async () => {
    // The old rule stopped at the highest tier with a group, which left every
    // lower-tier player permanently ineligible. Both groups must win now.
    const amalgamIds = await seedGroup('amalgam', [90, 80, 70]);
    const compositeIds = await seedGroup('composite', [60, 50, 40]);
    await finalizeWeek(WEEK);

    const res = await grantWeeklyPrizes(NEAR_WEEK);
    expect(res.granted).toBe(2); // one per group

    expect(await tierOfUser(compositeIds[0])).toBe('premium');
    expect(await tierOfUser(amalgamIds[0])).toBe('premium');
    // ...and only the top of each.
    expect(await tierOfUser(compositeIds[1])).toBe('free');
    expect(await tierOfUser(amalgamIds[1])).toBe('free');
  });

  it('gives every valid group of the SAME tier its own winner', async () => {
    const a = await seedGroup('acrylic', [90, 80]);
    const b = await seedGroup('acrylic', [70, 60]);
    await finalizeWeek(WEEK);

    expect((await grantWeeklyPrizes(NEAR_WEEK)).granted).toBe(2);
    expect(await tierOfUser(a[0])).toBe('premium');
    expect(await tierOfUser(b[0])).toBe('premium');
  });

  it('still awards in a group too small to PROMOTE from — climbing must not cost you', async () => {
    // Four is below min_valid_group_size (6), so finalizeWeek gives this group
    // no promotions. The prize floor is separate (3) precisely so a user who
    // climbed into a thin upper tier is not left unable to win OR advance while
    // the group they left behind keeps winning.
    const small = await seedGroup('composite', [90, 80, 70, 60], WEEK, 4);
    await finalizeWeek(WEEK);

    expect((await grantWeeklyPrizes(NEAR_WEEK)).granted).toBe(1);
    expect(await tierOfUser(small[0])).toBe('premium');
    expect(await tierOfUser(small[1])).toBe('free');
  });

  it('awards nothing below the prize floor — first of two is not a result', async () => {
    const tiny = await seedGroup('composite', [90, 80], WEEK, 2);
    await finalizeWeek(WEEK);

    expect((await grantWeeklyPrizes(NEAR_WEEK)).granted).toBe(0);
    for (const id of tiny) expect(await tierOfUser(id)).toBe('free');
  });

  it('awards at exactly the prize floor', async () => {
    const three = await seedGroup('composite', [90, 80, 70], WEEK, 3);
    await finalizeWeek(WEEK);

    expect((await grantWeeklyPrizes(NEAR_WEEK)).granted).toBe(1);
    expect(await tierOfUser(three[0])).toBe('premium');
  });

  it('awards prize_winners_per_group when the group is big enough to carry them', async () => {
    await setPrizeCfg('prize_winners_per_group', '2');
    const g = await seedGroup('acrylic', [90, 80, 70], WEEK, 6);
    await finalizeWeek(WEEK);

    expect((await grantWeeklyPrizes(NEAR_WEEK)).granted).toBe(2);
    expect(await tierOfUser(g[0])).toBe('premium');
    expect(await tierOfUser(g[1])).toBe('premium');
    expect(await tierOfUser(g[2])).toBe('free');
  });

  it('scales the winner count down in a thin group, so climbing never cheapens the prize', async () => {
    // The reason this exists: upper tiers hold few people, so their groups never
    // fill. With a flat 2 a composite group of 3 would crown two thirds of its
    // members, and first place would mean LESS the higher you climbed.
    await setPrizeCfg('prize_winners_per_group', '2');
    const thin = await seedGroup('composite', [90, 80, 70], WEEK, 3);
    await finalizeWeek(WEEK);

    expect((await grantWeeklyPrizes(NEAR_WEEK)).granted).toBe(1);
    expect(await tierOfUser(thin[0])).toBe('premium');
    expect(await tierOfUser(thin[1])).toBe('free');
  });

  it('needs a WHOLE extra prize-floor block before it hands out a second prize', async () => {
    // Five is one short of two blocks of three, so it still awards one. The
    // step, not a ratio, is what keeps the count predictable to a user.
    await setPrizeCfg('prize_winners_per_group', '2');
    const five = await seedGroup('amalgam', [90, 80, 70], WEEK, 5);
    await finalizeWeek(WEEK);

    expect((await grantWeeklyPrizes(NEAR_WEEK)).granted).toBe(1);
    expect(await tierOfUser(five[0])).toBe('premium');
    expect(await tierOfUser(five[1])).toBe('free');
  });

  it('keeps the two floors distinct, so neither change silently moves the other', async () => {
    const cfg = await getLeagueConfig();
    expect(cfg.prize_min_group_size, 'prize floor').toBe(3);
    expect(cfg.min_valid_group_size, 'promotion floor').toBe(6);
    expect(cfg.prize_min_group_size).toBeLessThan(cfg.min_valid_group_size);
  });

  it('sets the configured prize length and marks the winner in premium_grants', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    const now = new Date('2026-02-08T00:00:00Z');
    await grantWeeklyPrizes(now);

    const g = await grantRow(ids[0]);
    expect(g).not.toBeNull();
    expect(g!.revoked_at).toBeNull();
    expect(g!.seen).toBe(false);
    const days = (new Date(g!.expires_at).getTime() - now.getTime()) / 86_400_000;
    expect(Math.round(days), 'prize_days').toBe(3);
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

  it('skips a winner who is already premium and passes the prize down', async () => {
    const ids = await seedGroup('composite', [90, 80, 70]);
    await pool.query("update profiles set tier = 'premium' where id = $1", [ids[0]]);
    await finalizeWeek(WEEK);

    const res = await grantWeeklyPrizes(NEAR_WEEK);
    expect(res.granted).toBe(1);
    expect(await grantRow(ids[0]), 'never claim credit for premium we did not grant').toBeNull();
    expect(await grantRow(ids[1]), 'rank 2 gets the prize instead of it being wasted').not.toBeNull();
  });
});

describe('the cooldown', () => {
  /** Seed the same user as rank 1 of a group in `week`. */
  async function seedWinnerAgain(userId: string, week: string): Promise<void> {
    const tid = await tierId('composite');
    const lg = await pool.query<{ id: string }>(
      `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
       values ($1, $2, $2, 'closed', 8) returning id`,
      [tid, week],
    );
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
       values ($1, $2, $3, 100, $4)`,
      [lg.rows[0].id, userId, week, `${week}T00:00:00Z`],
    );
    for (let i = 0; i < MIN_VALID - 1; i += 1) {
      seq += 1;
      const u = await pool.query<{ id: string }>(
        'insert into profiles (display_name, current_tier_id) values ($1, $2) returning id',
        [`c${seq}`, tid],
      );
      await pool.query(
        `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
         values ($1, $2, $3, $4, $5)`,
        [lg.rows[0].id, u.rows[0].id, week, 50 - i, `${week}T00:00:00Z`],
      );
    }
  }

  it('passes the prize DOWN to the next member instead of wasting the week', async () => {
    const ids = await seedGroup('composite', [90, 80, 70]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(NEAR_WEEK); // ids[0] wins and starts their cooldown

    // Next week, same person tops the group again — but is still cooling down.
    const WEEK2 = '2026-02-14';
    await seedWinnerAgain(ids[0], WEEK2);
    await finalizeWeek(WEEK2, NEAR_WEEK);
    const nextWeekAt = new Date('2026-02-15T00:00:00Z');
    const res = await grantWeeklyPrizes(nextWeekAt);

    expect(res.granted, 'the group still produces a winner').toBe(1);
    expect(await grantRow(ids[0], WEEK2), 'but not the same person').toBeNull();
  });

  it('lets the same user win again once the cooldown has passed', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(NEAR_WEEK);

    const WEEK4 = '2026-02-28'; // three weeks later — outside a 2-week cooldown
    await seedWinnerAgain(ids[0], WEEK4);
    await finalizeWeek(WEEK4, NEAR_WEEK);
    await grantWeeklyPrizes(new Date('2026-03-01T00:00:00Z'));

    expect(await grantRow(ids[0], WEEK4)).not.toBeNull();
  });

  it('is disabled when prize_cooldown_weeks is 0', async () => {
    await setPrizeCfg('prize_cooldown_weeks', '0');
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(NEAR_WEEK);

    const WEEK2 = '2026-02-14';
    await seedWinnerAgain(ids[0], WEEK2);
    await finalizeWeek(WEEK2, NEAR_WEEK);
    await grantWeeklyPrizes(new Date('2026-02-15T00:00:00Z'));

    expect(await grantRow(ids[0], WEEK2)).not.toBeNull();
  });
});

describe('expirePremiumPrizes', () => {
  it('reverts tier to free once expires_at has passed', async () => {
    // Two groups, so this still exercises reverting a BATCH — one winner each.
    const ids = await seedGroup('composite', [90, 80]);
    await seedGroup('composite', [70, 60]);
    await finalizeWeek(WEEK);
    const past = new Date('2026-02-08T00:00:00Z');
    await grantWeeklyPrizes(past);

    const justAfter = new Date(past.getTime() + 8 * 86_400_000);
    const res = await expirePremiumPrizes(justAfter);
    expect(res.expired).toBe(2);
    expect(await tierOfUser(ids[0])).toBe('free');
    expect((await grantRow(ids[0]))!.revoked_at).not.toBeNull();
  });

  it('does NOT revert a repeat winner who holds a newer, still-active grant', async () => {
    // Winning twice in consecutive weeks is only possible with the cooldown
    // off; with it on, the pass-down rule means somebody else wins instead.
    await setPrizeCfg('prize_cooldown_weeks', '0');
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
    // Pad to a valid group — an undersized one awards nothing at all now.
    for (let i = 0; i < MIN_VALID - 1; i += 1) {
      seq += 1;
      const filler = await pool.query<{ id: string }>(
        'insert into profiles (display_name, current_tier_id) values ($1, $2) returning id',
        [`w2f${seq}`, tid],
      );
      await pool.query(
        `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
         values ($1, $2, $3, $4, '2026-02-14T00:00:00Z')`,
        [lg2.rows[0].id, filler.rows[0].id, WEEK2, 10 - i],
      );
    }
    // Clearly BEFORE week 1's exact expiry instant (2026-02-15T00:00:00Z), so
    // this is an unambiguous "won again while still covered" case.
    const week2At = new Date('2026-02-13T00:00:00Z');
    await finalizeWeek(WEEK2, week1At);
    await grantWeeklyPrizes(week2At); // extends ids[0]'s premium with a new grant row
    expect((await grantRow(ids[0], WEEK2))!.expires_at).not.toBeNull();

    // A moment when week 1's grant HAS expired but week 2's has not: week 1 ran
    // 02-08 -> 02-11 and week 2 runs 02-13 -> 02-16 (prize_days = 3), so 02-14
    // sits in the gap. Derived from prize_days, not a fixed offset — the old
    // +8d was arithmetic for the 7-day prize this replaced.
    await expirePremiumPrizes(new Date('2026-02-14T00:00:00Z'));
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
    const ids2 = await seedGroup('composite', [70, 60]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids[0], 700001]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids2[0], 700002]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(AWAKE);

    const first = await notifyPremiumPrizes(AWAKE);
    expect(first.notified).toBe(2);
    const second = await notifyPremiumPrizes(AWAKE);
    expect(second.notified).toBe(0);
  });

  it('holds the push outside the awake window, releases it the next morning', async () => {
    const ids = await seedGroup('composite', [90, 80]);
    const ids2 = await seedGroup('composite', [70, 60]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids[0], 700003]);
    await pool.query('update profiles set telegram_id = $2 where id = $1', [ids2[0], 700004]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(ASLEEP);

    expect((await notifyPremiumPrizes(ASLEEP)).notified).toBe(0);
    expect((await notifyPremiumPrizes(NEXT_MORNING)).notified).toBe(2);
  });
});

describe('what the winner is actually told', () => {
  /** Capture the message handed to the senders for the first notified user. */
  async function announce(at = AWAKE): Promise<{ title: string; body: string }> {
    const sent: Array<{ title: string; body: string }> = [];
    const spy = vi.spyOn(notifications, 'send').mockImplementation(async (_u, m) => {
      if (typeof m !== 'string') sent.push({ title: m.title, body: m.body });
    });
    await notifyPremiumPrizes(at);
    spy.mockRestore();
    return sent[0];
  }

  async function winAndAnnounce(): Promise<{ title: string; body: string }> {
    const ids = await seedGroup('composite', [90, 80]);
    await pool.query('update profiles set telegram_id = 700900 where id = $1', [ids[0]]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(AWAKE);
    return announce();
  }

  it('states the REAL prize length, not a number frozen into the copy', async () => {
    const msg = await winAndAnnounce();
    const cfg = await getLeagueConfig();

    expect(msg.body).toContain('۳ روز');
    expect(cfg.prize_days, 'the copy must match the config, not a literal').toBe(3);
    // The exact regression this test exists for: the copy promised a week long
    // after the prize became three days, so the winner lost premium on day four.
    expect(msg.body).not.toContain('یک هفته');
  });

  it('follows a retune of prize_days', async () => {
    await setPrizeCfg('prize_days', '5');
    const msg = await winAndAnnounce();
    expect(msg.body).toContain('۵ روز');
  });

  it('says GROUP, not league — the user can see their group and never their tier', async () => {
    const msg = await winAndAnnounce();
    expect(msg.body).toContain('گروهت');
    expect(msg.body).not.toContain('لیگِ این هفته');
  });

  it('gives the banner the cooldown, so a winner knows why next week is quiet', async () => {
    const app2 = await makeApp();
    const ids = await seedGroup('composite', [90, 80]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(NEAR_WEEK);

    const phone = '09121300009';
    await pool.query('update profiles set phone = $1 where id = $2', [phone, ids[0]]);
    const cookie = await loginAs(app2, phone);
    const me = await app2.inject({ method: 'GET', url: '/me', headers: { cookie } });

    const grant = me.json().pending_premium_grant;
    expect(grant.cooldown_weeks).toBe(2);
    // The banner derives the length from these two, so they must be usable.
    const days = Math.round((new Date(grant.expires_at) - new Date(grant.granted_at)) / 86400000);
    expect(days).toBe(3);
    await app2.close();
  });
});

describe('the premium features named in the prize', () => {
  it('names every feature the banner lists, in the push too', async () => {
    const sent: string[] = [];
    const ids = await seedGroup('composite', [90, 80]);
    await pool.query('update profiles set telegram_id = 700910 where id = $1', [ids[0]]);
    await finalizeWeek(WEEK);
    await grantWeeklyPrizes(AWAKE);

    const spy = vi.spyOn(notifications, 'send').mockImplementation(async (_u, m) => {
      if (typeof m !== 'string') sent.push(m.body);
    });
    await notifyPremiumPrizes(AWAKE);
    spy.mockRestore();

    for (const title of PREMIUM_FEATURE_TITLES) {
      expect(sent[0], `push must name «${title}»`).toContain(title);
    }
  });

  it('stays in step with the banner list it mirrors', async () => {
    // The server copy (push) and the client copy (banner) are separate
    // constants in different languages, so nothing but this test stops them
    // drifting — which is precisely how the prize copy went stale before.
    //
    // The list is SEARCHED FOR rather than read from a fixed path: it already
    // moved once (dashboard.js -> config.js) and this test failed on the move
    // rather than on a real drift. Finding it keeps the guard pointed at the
    // content it actually cares about.
    const dir = new URL('../../plus/js/', import.meta.url);
    let block = '';
    for (const name of await readdir(dir)) {
      if (!name.endsWith('.js')) continue;
      const src = await readFile(new URL(name, dir), 'utf8');
      const at = src.indexOf('PREMIUM_FEATURES = [');
      if (at === -1) continue;
      block = src.slice(at, src.indexOf('];', at));
      break;
    }
    const bannerTitles = [...block.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);

    expect(bannerTitles.length, 'found the banner list in plus/js/').toBeGreaterThan(0);
    expect(PREMIUM_FEATURE_TITLES).toEqual(bannerTitles);
  });
});
