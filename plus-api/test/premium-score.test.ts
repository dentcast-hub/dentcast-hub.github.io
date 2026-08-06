import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import {
  computeScore, scoreSelectSql, combineScore,
  POINTS_PER_ACTIVE_DAY, POINTS_PER_CONTENT, PREMIUM_SCORE_MULTIPLIER,
  SCORING_ACTIONS, CONSUMPTION_ACTIONS, shieldsGranted, SHIELD_BASE,
} from '../src/services/score.js';
import { activateMonths } from '../src/services/subscription.js';
import { config } from '../src/config.js';

/**
 * The premium score multiplier (×1.2).
 *
 * The property that matters most here is NOT that a subscriber earns more — it
 * is that nobody ever earns less. Score is spent on streak shields and compared
 * against other people's scores, and the whole design (a stamp written onto each
 * row at the moment it happens, rather than a condition evaluated at read time)
 * exists so that an expiring subscription takes nothing back. The expiry test
 * below is the one that would fail under the obvious implementation.
 */

let app: FastifyInstance;
let cookie: string;
let userId: string;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, '09121400077');
  userId = (await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json()).id;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const read = (contentId: string) => app.inject({
  method: 'POST', url: '/activity', headers: { cookie },
  payload: { action: 'article_completed', content_id: contentId },
});

const score = async () => (await computeScore(pool, userId)).score;

/** Make the account premium from now on. */
const goPremium = () => activateMonths(userId, 6, { source: 'payment' });

/**
 * End the subscription the way the calendar does — by moving the expiry into
 * the past. `isPremiumNow` reads the DATE, not `status`, so this is exactly the
 * state a real account is in the moment its months run out.
 */
async function lapse(): Promise<void> {
  await pool.query(
    "update subscriptions set expires_at = now() - interval '1 day' where user_id = $1",
    [userId],
  );
}

/** The rank query's view of this user — the SQL mirror of computeScore. */
async function scoreViaSql(): Promise<number> {
  const r = await pool.query<{ score: string }>(
    `with scores as (${scoreSelectSql({ tz: '$1', scoring: '$2', consumption: '$3' })})
     select score from scores where id = $4`,
    [config.streakTimezone, SCORING_ACTIONS, CONSUMPTION_ACTIONS, userId],
  );
  return Number(r.rows[0]?.score ?? 0);
}

describe('the premium multiplier', () => {
  it('leaves a free account exactly where it was', async () => {
    await read('insight/insight-20');
    await read('insight/insight-27');

    // One active day + two articles, at face value. This is the pre-multiplier
    // formula, and a free user must not be able to tell anything changed.
    expect(await score()).toBe(POINTS_PER_ACTIVE_DAY + 2 * POINTS_PER_CONTENT);
    expect((await computeScore(pool, userId)).premium_bonus).toBe(0);
  });

  it('pays a subscriber 1.2× for what they earn while subscribed', async () => {
    await goPremium();
    await read('insight/insight-20');
    await read('insight/insight-27');

    const base = POINTS_PER_ACTIVE_DAY + 2 * POINTS_PER_CONTENT;
    expect(await score()).toBe(Math.floor(base * PREMIUM_SCORE_MULTIPLIER));

    const b = await computeScore(pool, userId);
    expect(b.premium_bonus).toBe(Math.floor(base * PREMIUM_SCORE_MULTIPLIER) - base);
    expect(b.premium_days).toBe(1);
    expect(b.premium_content).toBe(2);
  });

  it('THE POINT: an expiring subscription does not take a single point back', async () => {
    await goPremium();
    await read('insight/insight-20');
    await read('insight/insight-27');
    const whilePremium = await score();

    await lapse();

    // Not "less than before" and not "reset to base" — identical. Everything was
    // earned on a paid plan and keeps its weight for good.
    expect(await score()).toBe(whilePremium);
  });

  it('and a lapsed subscriber simply stops being multiplied from then on', async () => {
    await goPremium();
    await read('insight/insight-20');          // premium: day + content
    const whilePremium = await score();

    await lapse();
    await read('insight/insight-27');          // free: a second article, same day

    // The day was already bought at the premium rate and stays there; only the
    // new article is added at face value.
    expect(await score()).toBe(whilePremium + POINTS_PER_CONTENT);
  });

  it('a day that starts free and turns premium is paid as a premium day', async () => {
    await read('insight/insight-20');          // free
    await goPremium();
    await read('insight/insight-27');          // premium, SAME Tehran day

    const b = await computeScore(pool, userId);
    // One active day in total, and it counts as the subscriber's — a day is one
    // indivisible unit and the tie goes to the person who paid.
    expect(b.active_days).toBe(1);
    expect(b.premium_days).toBe(1);
    // …but only the second article is a premium content credit.
    expect(b.content_completed).toBe(2);
    expect(b.premium_content).toBe(1);

    const base = POINTS_PER_ACTIVE_DAY + 2 * POINTS_PER_CONTENT;
    const premiumPart = POINTS_PER_ACTIVE_DAY + POINTS_PER_CONTENT;
    expect(b.score).toBe(Math.floor(base + premiumPart * (PREMIUM_SCORE_MULTIPLIER - 1)));
  });

  it('counts a highlight made while premium at the premium rate', async () => {
    await goPremium();
    await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'insight/insight-20', exact: 'یک تکه متن' },
    });

    const b = await computeScore(pool, userId);
    expect(b.total_highlights).toBe(1);
    expect(b.premium_highlights).toBe(1);
  });

  it('a highlight made on a free plan keeps its face value after upgrading', async () => {
    await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'insight/insight-20', exact: 'متنِ رایگان' },
    });
    await goPremium();

    const b = await computeScore(pool, userId);
    expect(b.total_highlights).toBe(1);
    // Buying a subscription does not retroactively re-price yesterday's work —
    // that is the same rule as the expiry case, pointing the other way.
    expect(b.premium_highlights).toBe(0);
  });

  it('deleting a premium highlight removes it from both counts', async () => {
    await goPremium();
    const created = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'insight/insight-20', exact: 'حذف‌شدنی' },
    });
    const id = created.json().highlight.id;
    await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } });

    const b = await computeScore(pool, userId);
    expect(b.total_highlights).toBe(0);
    expect(b.premium_highlights).toBe(0); // never negative, never orphaned
  });

  it('the SQL used for rank agrees with computeScore, free and premium alike', async () => {
    await read('insight/insight-20');
    expect(await scoreViaSql()).toBe(await score());   // free

    await goPremium();
    await read('insight/insight-27');
    await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'insight/insight-27', exact: 'برای رتبه' },
    });

    // The two hand-written copies of the formula (one TS, one SQL) are the thing
    // most likely to drift, and a user whose rank disagreed with their own score
    // is exactly the bug the shared formula exists to prevent.
    expect(await scoreViaSql()).toBe(await score());
    expect((await computeScore(pool, userId)).premium_bonus).toBeGreaterThan(0);
  });

  it('reaches the first streak shield sooner than the same effort would free', async () => {
    const parts = {
      active_days: 17, content_completed: 0, total_highlights: 0,
      premium_days: 0, premium_content: 0, premium_highlights: 0,
    };
    const free = combineScore(parts);
    const premium = combineScore({ ...parts, premium_days: 17 });

    // 170 points of effort: not a shield on a free plan, one on a paid one.
    expect(free.score).toBe(170);
    expect(shieldsGranted(free.score)).toBe(0);
    expect(premium.score).toBe(204);
    expect(premium.score).toBeGreaterThanOrEqual(SHIELD_BASE);
    expect(shieldsGranted(premium.score)).toBe(1);
  });

  it('never reports a fractional score', async () => {
    // 1.2 × an odd number of highlight points is where a fraction would appear.
    for (const n of [1, 3, 7, 11, 13]) {
      const { score: s } = combineScore({
        active_days: 0, content_completed: 0, total_highlights: n,
        premium_days: 0, premium_content: 0, premium_highlights: n,
      });
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBe(Math.floor(n * PREMIUM_SCORE_MULTIPLIER)); // floored, never rounded up
    }
  });
});
