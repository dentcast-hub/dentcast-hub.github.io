import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { resetRateLimits } from '../src/services/rate-limit.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200001';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

async function createHighlight(overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/highlights',
    headers: { cookie },
    payload: {
      content_id: 'resin-cements-overview',
      exact: 'پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است',
      ...overrides,
    },
  });
  return res.json().highlight.id as string;
}

/**
 * Bring a card to its due date.
 *
 * A card is created SCHEDULED — one day out, box 1's own Leitner interval — so
 * "due" is no longer the same thing as "just made". That is the whole point of
 * the 2026-08-09 change (see routes/highlights.ts): a highlight answered the
 * second it was written is not spaced repetition, and it was the farm's engine.
 * Tests that want a due card now have to say so.
 */
async function mature(highlightId: string): Promise<void> {
  await pool.query(
    "update card_state set next_review_at = now() - interval '1 minute' where highlight_id = $1",
    [highlightId],
  );
}

describe('a new card is scheduled, not due', () => {
  it('is not reviewable the moment it is made', async () => {
    await makePremium();
    await createHighlight();

    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.json().due).toHaveLength(0);
  });

  it('carries box 1 and its interval, so it comes back tomorrow', async () => {
    await makePremium();
    const id = await createHighlight();

    const cs = await pool.query<{ box: number; next_review_at: string; reviewed_count: number }>(
      'select box, next_review_at, reviewed_count from card_state where highlight_id = $1', [id],
    );
    expect(cs.rows[0].box).toBe(1);
    expect(cs.rows[0].reviewed_count).toBe(0);
    const hours = (new Date(cs.rows[0].next_review_at).getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(23);
    expect(hours).toBeLessThan(25);
  });

  it('answering it early still moves the card, but pays nothing', async () => {
    // `was_due` has always been the payment gate; what changed is that a fresh
    // card no longer satisfies it.
    await makePremium();
    const id = await createHighlight();
    const res = await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().card_state.box).toBe(2);
    const act = await pool.query(
      "select count(*)::int as n from user_activity where action = 'review_finished'",
    );
    expect(act.rows[0].n, 'an early answer is not a review session').toBe(0);
  });
});

describe('requirePremium gate', () => {
  it('blocks a free user with 402', async () => {
    await createHighlight();
    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.statusCode).toBe(402);
  });

  it('blocks an unauthenticated request with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/review/due' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /review/due', () => {
  it('lists a card that has reached its due date', async () => {
    await makePremium();
    const id = await createHighlight();
    await mature(id);

    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const due = res.json().due;
    expect(due).toHaveLength(1);
    expect(due[0].highlight_id).toBe(id);
    expect(due[0].box).toBe(1);
  });

  it('excludes a card scheduled in the future', async () => {
    await makePremium();
    const id = await createHighlight();
    await mature(id);
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });

    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.json().due).toHaveLength(0);
  });

  it('scopes to a folder topic', async () => {
    await makePremium();
    const inFolder = await createHighlight({ content_id: 'chairside/chairside-1' });
    const other = await createHighlight({ content_id: 'insight/insight-1' });
    await mature(inFolder);
    await mature(other);

    const res = await app.inject({
      method: 'GET', url: '/review/due?topic=folder:chairside', headers: { cookie },
    });
    const due = res.json().due;
    expect(due).toHaveLength(1);
    expect(due[0].highlight_id).toBe(inFolder);
  });
});

describe('POST /review/answer', () => {
  it('advances the box and schedules next_review_at on "remembered"', async () => {
    await makePremium();
    const id = await createHighlight();

    const res = await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    expect(res.statusCode).toBe(200);
    const cs = res.json().card_state;
    expect(cs.box).toBe(2);
    expect(cs.reviewed_count).toBe(1);
    expect(new Date(cs.next_review_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('resets to box 1 on "forgot", even from a higher box', async () => {
    await makePremium();
    const id = await createHighlight();
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    const res = await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'forgot' },
    });
    expect(res.json().card_state.box).toBe(1);
  });

  it('never advances box past 5', async () => {
    await makePremium();
    const id = await createHighlight();
    let box = 1;
    for (let i = 0; i < 8; i += 1) {
      const res = await app.inject({
        method: 'POST', url: '/review/answer', headers: { cookie },
        payload: { highlight_id: id, result: 'remembered' },
      });
      box = res.json().card_state.box;
    }
    expect(box).toBe(5);
  });

  it('logs review_finished (counts for streak/score/league)', async () => {
    await makePremium();
    const id = await createHighlight();
    await mature(id);
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    const act = await pool.query(
      `select count(*)::int as n from user_activity where action = 'review_finished'`,
    );
    expect(act.rows[0].n).toBe(1);
  });

  it('404s on a highlight that does not belong to the caller', async () => {
    await makePremium();
    const id = await createHighlight();
    const other = await loginAs(app, '09121200002');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200002'`);

    const res = await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie: other },
      payload: { highlight_id: id, result: 'remembered' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('does NOT touch card_state on the free manual-review path (card_reviewed_manual)', async () => {
    await makePremium();
    const id = await createHighlight();
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'card_reviewed_manual', content_id: 'resin-cements-overview', meta: { highlight_id: id } },
    });
    // The card must be untouched: box 1, still on the schedule it was created
    // with, never answered. (It used to assert a null next_review_at — cards are
    // created scheduled now, so "untouched" is a future date, not an absent one.)
    const cs = await pool.query('select box, next_review_at, reviewed_count from card_state where highlight_id = $1', [id]);
    expect(cs.rows[0].box).toBe(1);
    expect(cs.rows[0].reviewed_count).toBe(0);
    expect(new Date(cs.rows[0].next_review_at).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('GET /me due_card_count', () => {
  it('is absent for a free user', async () => {
    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect('due_card_count' in res.json()).toBe(false);
  });

  it('reflects the real due count for a premium user', async () => {
    await makePremium();
    await mature(await createHighlight());
    await mature(await createHighlight({ exact: 'یک هایلایت دوم', content_id: 'resin-cements-overview' }));

    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.json().due_card_count).toBe(2);
  });
});

/**
 * The ceiling on the review engine itself (2026-08-09).
 *
 * `was_due` stops the SAME card paying twice, and xp_review_weekly_cap bounds
 * what reviewing EARNS. Neither bounds how fast the route can be driven, and a
 * brand-new card is born due — card_state is inserted with next_review_at =
 * null, which every due check reads as "now". So a loop needs no repeats at
 * all: make highlights, answer them immediately. One account did exactly that
 * on 2026-08-08 — 628 highlights across 205 articles, 420 answers inside a
 * single hour, against a route with no limit of any kind.
 */
describe('POST /review/answer — rate limit', () => {
  it('stops a loop at the hourly ceiling, with retry-after', async () => {
    await makePremium();
    resetRateLimits();
    const budget = config.review.maxPerUserPerHour;

    // A few fresh cards, cycled: the limiter counts CALLS, so spending the
    // budget does not need a new highlight per call — and creating two hundred
    // of them is the slow part, not the thing under test. What the farm proved
    // is that fresh cards are unlimited, which the first cards here stand for.
    const cards = [] as string[];
    for (let i = 0; i < 3; i += 1) {
      cards.push(await createHighlight({ exact: `card ${i} — ${'x'.repeat(8)}` }));
    }

    let lastOk = 0;
    let blocked: Awaited<ReturnType<typeof app.inject>> | null = null;
    for (let i = 0; i < budget + 1; i += 1) {
      const res = await app.inject({
        method: 'POST', url: '/review/answer', headers: { cookie },
        payload: { highlight_id: cards[i % cards.length], result: 'remembered' },
      });
      if (res.statusCode === 429) { blocked = res; break; }
      expect(res.statusCode).toBe(200);
      lastOk = i + 1;
    }

    expect(blocked, 'the loop must hit a wall').not.toBeNull();
    expect(lastOk).toBe(budget);
    expect(blocked!.json().error).toBe('rate_limited');
    expect(Number(blocked!.headers['retry-after'])).toBeGreaterThan(0);
  }, 60_000);

  it('does not touch a genuine session — the budget is four full due-queues', async () => {
    // GET /review/due serves at most 50 cards, so a real sitting is well inside
    // this. A limit a reader can feel would be a worse bug than the farm.
    await makePremium();
    resetRateLimits();
    expect(config.review.maxPerUserPerHour).toBeGreaterThanOrEqual(50 * 4);

    for (let i = 0; i < 50; i += 1) {
      const hid = await createHighlight({ exact: `session card ${i} — ${'y'.repeat(8)}` });
      const res = await app.inject({
        method: 'POST', url: '/review/answer', headers: { cookie },
        payload: { highlight_id: hid, result: 'remembered' },
      });
      expect(res.statusCode).toBe(200);
    }
  });
});
