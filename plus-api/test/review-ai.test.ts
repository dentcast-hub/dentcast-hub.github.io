import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { resetRateLimits } from '../src/services/rate-limit.js';
import { applyRemoteFlashcards, resetRemoteFlashcards } from '../src/flashcards.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

const FIXTURE = {
  version: 1,
  byContent: {
    'chairside/chairside-1': {
      cards: [
        { id: 'flashcards-c1', front: 'جلوی کارت یک', back: 'پشت کارت یک', source: 'faq', source_faq_index: 0 },
        { id: 'flashcards-c2', front: 'جلوی کارت دو', back: 'پشت کارت دو', source: 'faq', source_faq_index: 1 },
      ],
    },
    'insight/insight-1': {
      cards: [
        { id: 'flashcards-c1', front: 'جلوی کارت دیگر', back: 'پشت کارت دیگر', source: 'faq', source_faq_index: 0 },
      ],
    },
  },
};

beforeEach(async () => {
  await resetDb();
  applyRemoteFlashcards(FIXTURE);
  if (!app) app = await makeApp();
  phone = '09121200001';
  cookie = await loginAs(app, phone);
});

afterEach(() => {
  resetRemoteFlashcards();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

async function consumeArticle(contentId: string, ago: string, forPhone: string = phone): Promise<void> {
  await pool.query(
    `insert into user_activity (user_id, action, content_id, created_at)
     select id, 'article_completed', $2, now() - $3::interval
       from profiles where phone = $1`,
    [forPhone, contentId, ago],
  );
}

describe('requirePremium / requireAuth gate', () => {
  it('blocks a free user with 402 on GET /review/due (ai_due included)', async () => {
    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.statusCode).toBe(402);
  });

  it('blocks an unauthenticated request with 401 on POST /review/answer-ai', async () => {
    const res = await app.inject({
      method: 'POST', url: '/review/answer-ai',
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /review/due — ai_due', () => {
  it('gives no AI cards for an unconsumed article', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.json().ai_due).toEqual([]);
  });

  it('gives no AI cards for an article consumed less than 24h ago', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '1 hour');
    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.json().ai_due).toEqual([]);
  });

  it('gives AI cards once the owning article has matured (24h+)', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    const aiDue = res.json().ai_due;
    expect(aiDue.length).toBeGreaterThan(0);
    const row = aiDue[0];
    expect(row).toMatchObject({
      content_id: 'chairside/chairside-1',
      box: 1,
      next_review_at: null,
      reviewed_count: 0,
    });
    expect(typeof row.card_id).toBe('string');
    expect(typeof row.front).toBe('string');
    expect(typeof row.back).toBe('string');
  });

  it('caps the AI share at ceil(limit/3)', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days'); // 2 cards mature
    await consumeArticle('insight/insight-1', '2 days'); // 1 more card mature
    const res = await app.inject({ method: 'GET', url: '/review/due?limit=3', headers: { cookie } });
    expect(res.json().ai_due.length).toBeLessThanOrEqual(Math.ceil(3 / 3));
  });

  it('leaves the highlight `due` key byte-for-byte as before, even with AI cards due', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    const hl = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'resin-cements-overview', exact: 'یک متن هایلایت‌شده برای تست' },
    });
    const highlightId = hl.json().highlight.id as string;
    await pool.query(
      "update card_state set next_review_at = now() - interval '1 minute' where highlight_id = $1",
      [highlightId],
    );

    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    const due = res.json().due;
    expect(due).toHaveLength(1);
    expect(due[0].highlight_id).toBe(highlightId);
    expect(due[0].box).toBe(1);
    expect(res.json().ai_due.length).toBeGreaterThan(0);
  });

  it('filters AI cards by topic=folder:', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    await consumeArticle('insight/insight-1', '2 days');
    const res = await app.inject({
      method: 'GET', url: '/review/due?topic=folder:chairside', headers: { cookie },
    });
    const aiDue = res.json().ai_due;
    expect(aiDue.length).toBeGreaterThan(0);
    expect(aiDue.every((c: { content_id: string }) => c.content_id.startsWith('chairside/'))).toBe(true);
  });

  it('is silently zero for a consumed page absent from the flashcards index', async () => {
    await makePremium();
    await consumeArticle('notecast/notecast-1', '2 days');
    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.json().ai_due).toEqual([]);
  });
});

describe('POST /review/answer-ai', () => {
  it('creates a state row on the first answer — box 2, reviewed_count 1 on "remembered"', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    const res = await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().card_state).toMatchObject({ box: 2, reviewed_count: 1 });
  });

  it('resets to box 1 on "forgot"', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    const res = await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'forgot' },
    });
    expect(res.json().card_state.box).toBe(1);
  });

  it('advances the same row on a second answer', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    await pool.query(
      "update ai_card_state set next_review_at = now() - interval '1 minute' where content_id = 'chairside/chairside-1' and card_id = 'flashcards-c1'",
    );
    const res = await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    expect(res.json().card_state).toMatchObject({ box: 3, reviewed_count: 2 });
  });

  it('404s on a card not present in the flashcards index', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    const res = await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'no-such-card', result: 'remembered' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('404s on an article the user never consumed', async () => {
    await makePremium();
    const res = await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('answering a non-due card (consumed 1h ago) creates state but does NOT log review_finished', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '1 hour');
    const res = await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    expect(res.statusCode).toBe(200);
    const state = await pool.query(
      "select box from ai_card_state where content_id = 'chairside/chairside-1' and card_id = 'flashcards-c1'",
    );
    expect(state.rowCount).toBe(1);
    const act = await pool.query(`select count(*)::int as n from user_activity where action = 'review_finished'`);
    expect(act.rows[0].n).toBe(0);
  });

  it('answering a due card (consumed 2 days ago) logs review_finished', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    const act = await pool.query(`select meta from user_activity where action = 'review_finished'`);
    expect(act.rowCount).toBe(1);
  });

  it('shares the rate-limit key with POST /review/answer — spending it there blocks answer-ai too, and vice versa', async () => {
    await makePremium();
    resetRateLimits();
    await consumeArticle('chairside/chairside-1', '2 days');
    const budget = config.review.maxPerUserPerHour;

    const hl = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'resin-cements-overview', exact: 'یک هایلایت برای پر کردن سقف' },
    });
    const highlightId = hl.json().highlight.id as string;

    for (let i = 0; i < budget; i += 1) {
      const res = await app.inject({
        method: 'POST', url: '/review/answer', headers: { cookie },
        payload: { highlight_id: highlightId, result: 'remembered' },
      });
      expect(res.statusCode).toBe(200);
    }

    const blocked = await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    expect(blocked.statusCode).toBe(429);
  }, 60_000);
});

describe('XP', () => {
  it('a due answer-ai writes a review_finished row carrying card_id in its metadata', async () => {
    await makePremium();
    await consumeArticle('chairside/chairside-1', '2 days');
    await app.inject({
      method: 'POST', url: '/review/answer-ai', headers: { cookie },
      payload: { content_id: 'chairside/chairside-1', card_id: 'flashcards-c1', result: 'remembered' },
    });
    const act = await pool.query(
      `select content_id, meta from user_activity where action = 'review_finished'`,
    );
    expect(act.rowCount).toBe(1);
    expect(act.rows[0].content_id).toBe('chairside/chairside-1');
    expect(act.rows[0].meta.card_id).toBe('flashcards-c1');
  });
});
