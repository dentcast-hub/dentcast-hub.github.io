import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import {
  computeScore, scoreSelectSql, combineScore,
  POINTS_PER_ACTIVE_DAY, POINTS_PER_CONTENT,
  PREMIUM_SCORE_MULTIPLIER, PREMIUM_POINTS_PER_ACTIVE_DAY,
  SCORING_ACTIONS, CONSUMPTION_ACTIONS, shieldsGranted, SHIELD_BASE,
} from '../src/services/score.js';
import { activateMonths } from '../src/services/subscription.js';
import { config } from '../src/config.js';

/**
 * The premium score multiplier: a DAY earned while subscribed pays 12 instead
 * of 10. Articles, episodes and highlights keep their face value on every plan.
 *
 * Two properties carry the whole design, and each has a test here that fails
 * under the obvious alternative implementation:
 *
 *   1. NOBODY EVER EARNS LESS. Score buys streak shields, so a multiplier
 *      applied to the live total would take points — and shields — back from
 *      anyone whose subscription lapsed. The stamp is written per day earned.
 *   2. NO SCORE IS EVER FRACTIONAL. That is why the multiplier is on the daily
 *      point and nowhere else: 10 × 1.2 = 12, but 1 × 1.2 = 1.2, so multiplying
 *      highlights would need a rounding step that quietly eats earned points.
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

const highlight = (contentId: string, exact: string) => app.inject({
  method: 'POST', url: '/highlights', headers: { cookie },
  payload: { content_id: contentId, exact },
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

/** Backdate every activity row, so the next one lands on a fresh Tehran day. */
async function newDay(): Promise<void> {
  await pool.query(
    "update user_activity set created_at = created_at - interval '1 day' where user_id = $1",
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
  it('the rule: a premium day is worth 12 where a free day is worth 10', () => {
    expect(POINTS_PER_ACTIVE_DAY).toBe(10);
    expect(PREMIUM_POINTS_PER_ACTIVE_DAY).toBe(12);
    expect(PREMIUM_POINTS_PER_ACTIVE_DAY).toBe(POINTS_PER_ACTIVE_DAY * PREMIUM_SCORE_MULTIPLIER);
  });

  it('leaves a free account exactly where it was', async () => {
    await read('insight/insight-20');
    await read('insight/insight-27');

    expect(await score()).toBe(POINTS_PER_ACTIVE_DAY + 2 * POINTS_PER_CONTENT);
    expect((await computeScore(pool, userId)).premium_bonus).toBe(0);
  });

  it('pays a subscriber 12 for the day and face value for everything else', async () => {
    await goPremium();
    await read('insight/insight-20');
    await read('insight/insight-27');
    await highlight('insight/insight-20', 'یک تکه متن');

    // 12 for the premium day + 2 articles × 5 + 1 highlight × 1 — the articles
    // and the highlight are NOT multiplied.
    expect(await score()).toBe(PREMIUM_POINTS_PER_ACTIVE_DAY + 2 * POINTS_PER_CONTENT + 1);

    const b = await computeScore(pool, userId);
    expect(b.premium_days).toBe(1);
    expect(b.premium_bonus).toBe(2); // exactly the 10 → 12 difference, once
  });

  it('does not multiply articles, episodes or highlights', async () => {
    await goPremium();
    await read('insight/insight-20');
    const afterDay = await score();

    await read('insight/insight-27');
    expect((await score()) - afterDay).toBe(POINTS_PER_CONTENT);       // 5, not 6

    const afterSecond = await score();
    await highlight('insight/insight-27', 'هایلایت');
    expect((await score()) - afterSecond).toBe(1);                     // 1, not 1.2
  });

  it('THE POINT: an expiring subscription does not take a single point back', async () => {
    await goPremium();
    await read('insight/insight-20');
    await read('insight/insight-27');
    const whilePremium = await score();

    await lapse();

    // Not "less than before" and not "reset to base" — identical. The day was
    // earned on a paid plan and keeps its weight for good.
    expect(await score()).toBe(whilePremium);
    expect((await computeScore(pool, userId)).premium_bonus).toBe(2);
  });

  it('and a lapsed subscriber simply stops earning 12 from then on', async () => {
    await goPremium();
    await read('insight/insight-20');           // premium day
    const whilePremium = await score();

    await lapse();
    await newDay();                             // …tomorrow, on a free plan
    await read('insight/insight-27');

    const b = await computeScore(pool, userId);
    expect(b.active_days).toBe(2);
    expect(b.premium_days).toBe(1);             // yesterday keeps its rate
    expect(await score()).toBe(whilePremium + POINTS_PER_ACTIVE_DAY + POINTS_PER_CONTENT);
  });

  it('a day that starts free and turns premium is paid as a premium day', async () => {
    await read('insight/insight-20');           // free
    await goPremium();
    await read('insight/insight-27');           // premium, SAME Tehran day

    const b = await computeScore(pool, userId);
    // A day is one indivisible unit and the tie goes to the person who paid.
    expect(b.active_days).toBe(1);
    expect(b.premium_days).toBe(1);
    expect(b.score).toBe(PREMIUM_POINTS_PER_ACTIVE_DAY + 2 * POINTS_PER_CONTENT);
  });

  it('buying a subscription does not re-price yesterday', async () => {
    await read('insight/insight-20');           // a free day
    await newDay();
    await goPremium();
    await read('insight/insight-27');           // a premium day

    const b = await computeScore(pool, userId);
    expect(b.active_days).toBe(2);
    expect(b.premium_days).toBe(1);             // not 2 — the same rule as the expiry case
    expect(b.score).toBe(
      POINTS_PER_ACTIVE_DAY + PREMIUM_POINTS_PER_ACTIVE_DAY + 2 * POINTS_PER_CONTENT,
    );
  });

  it('never reports a fractional score, whatever the mix', async () => {
    await goPremium();
    for (const n of [1, 3, 7, 11, 13]) {
      const { score: s, premium_bonus } = combineScore({
        active_days: n, premium_days: n, content_completed: n, total_highlights: n,
      });
      expect(Number.isInteger(s)).toBe(true);
      expect(Number.isInteger(premium_bonus)).toBe(true);
      // No floor, no round: the exact arithmetic, stated independently here.
      expect(s).toBe(n * 12 + n * 5 + n);
    }

    // …and through the real path, where an odd highlight count is the case that
    // used to produce 8.4 before the multiplier moved onto the daily point.
    await read('insight/insight-20');
    for (let i = 0; i < 7; i += 1) await highlight('insight/insight-20', `تکه ${i}`);
    const s = await score();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBe(PREMIUM_POINTS_PER_ACTIVE_DAY + POINTS_PER_CONTENT + 7);
  });

  it('the SQL used for rank agrees with computeScore, free and premium alike', async () => {
    await read('insight/insight-20');
    expect(await scoreViaSql()).toBe(await score());   // free

    await newDay();
    await goPremium();
    await read('insight/insight-27');
    await highlight('insight/insight-27', 'برای رتبه');

    // The two hand-written copies of the formula (one TS, one SQL) are the thing
    // most likely to drift, and a user whose rank disagreed with their own score
    // is exactly the bug the shared formula exists to prevent.
    expect(await scoreViaSql()).toBe(await score());
    expect((await computeScore(pool, userId)).premium_bonus).toBe(2);
  });

  it('reaches the first streak shield sooner than the same days would free', () => {
    const parts = { active_days: 17, content_completed: 0, total_highlights: 0 };
    const free = combineScore({ ...parts, premium_days: 0 });
    const premium = combineScore({ ...parts, premium_days: 17 });

    // Seventeen days of showing up: not a shield on a free plan, one on a paid
    // one. Free needs 20 days for the first shield, premium needs 17.
    expect(free.score).toBe(170);
    expect(shieldsGranted(free.score)).toBe(0);
    expect(premium.score).toBe(204);
    expect(premium.score).toBeGreaterThanOrEqual(SHIELD_BASE);
    expect(shieldsGranted(premium.score)).toBe(1);
  });
});
