import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getClusters } from '../src/content-index.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

// Every real cluster has subtopics (see plus/content-index.json) — bonding
// (باندینگ) is a stable, content-rich example used throughout.
const CLUSTER = getClusters().find((c) => c.key === 'bonding')!;
const SUBTOPIC = CLUSTER.subtopics[0];

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200004';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

async function createHighlight(contentId: string): Promise<void> {
  const res = await app.inject({
    method: 'POST',
    url: '/highlights',
    headers: { cookie },
    payload: { content_id: contentId, exact: 'یک متن هایلایت‌شده برای تست' },
  });
  expect(res.statusCode).toBe(201);
}

function next(body: unknown) {
  return app.inject({ method: 'POST', url: '/assistant/next', headers: { cookie }, payload: body });
}

describe('requirePremium gate', () => {
  it('blocks a free user with 402', async () => {
    const res = await next({ description: 'یک بیمار با شکستگی لبه‌ی دندان' });
    expect(res.statusCode).toBe(402);
  });

  it('blocks an unauthenticated request with 401', async () => {
    const res = await app.inject({ method: 'POST', url: '/assistant/next', payload: { description: 'x' } });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /assistant/next', () => {
  it('400s on an empty description', async () => {
    await makePremium();
    const res = await next({ description: '  ' });
    expect(res.statusCode).toBe(400);
  });

  it('round 1: offers only real top-level pillar keys, never invented ones', async () => {
    await makePremium();
    const res = await next({ description: 'یک بیمار با شکستگی لبه‌ی دندان قدامی' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(false);
    expect(typeof body.question).toBe('string');
    expect(body.options.length).toBeGreaterThan(0);
    const clusterKeys = new Set(getClusters().map((c) => c.key));
    for (const o of body.options) expect(clusterKeys.has(o.key)).toBe(true);
  });

  it('round 2: after picking a pillar, offers only ITS OWN subtopic keys', async () => {
    await makePremium();
    const r1 = await next({ description: 'شکستگی لبه‌ی دندان قدامی' });
    const history = [{ question: r1.json().question, options: r1.json().options, answer: { key: CLUSTER.key, label: CLUSTER.fa } }];
    const r2 = await next({ description: 'شکستگی لبه‌ی دندان قدامی', history });
    expect(r2.statusCode).toBe(200);
    const body = r2.json();
    expect(body.done).toBe(false);
    const subtopicKeys = new Set(CLUSTER.subtopics.map((s) => s.key));
    for (const o of body.options) expect(subtopicKeys.has(o.key)).toBe(true);
  });

  it('resolves once a subtopic (leaf) is picked, with articles only from that subtopic', async () => {
    await makePremium();
    const history = [
      { question: 'q1', options: [], answer: { key: CLUSTER.key, label: CLUSTER.fa } },
      { question: 'q2', options: [], answer: { key: SUBTOPIC.key, label: SUBTOPIC.fa } },
    ];
    const res = await next({ description: 'شکستگی لبه‌ی دندان قدامی', history });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(true);
    expect(body.matched_fa).toBe(SUBTOPIC.fa);
    expect(body.articles.length).toBeGreaterThan(0);
    for (const a of body.articles) expect(SUBTOPIC.contentIds).toContain(a.content_id);
  });

  it('prefers unread articles over ones the user already consumed', async () => {
    await makePremium();
    const already = SUBTOPIC.contentIds[0];
    await createHighlight(already);
    const history = [
      { question: 'q1', options: [], answer: { key: CLUSTER.key, label: CLUSTER.fa } },
      { question: 'q2', options: [], answer: { key: SUBTOPIC.key, label: SUBTOPIC.fa } },
    ];
    const res = await next({ description: 'شکستگی لبه‌ی دندان قدامی', history });
    const ids = res.json().articles.map((a: { content_id: string }) => a.content_id);
    if (SUBTOPIC.contentIds.length > 1) expect(ids).not.toContain(already);
  });

  it('a free-text ("custom") answer does not advance the level', async () => {
    await makePremium();
    const history = [{ question: 'q1', options: [], answer: { custom: 'هیچ‌کدوم دقیق نیست، بیشتر شبیه ...' } }];
    const res = await next({ description: 'شکستگی لبه‌ی دندان قدامی', history });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(false);
    const clusterKeys = new Set(getClusters().map((c) => c.key));
    for (const o of body.options) expect(clusterKeys.has(o.key)).toBe(true); // still top-level
  });

  it('forces a resolution once maxRounds worth of history is sent, even mid-pillar', async () => {
    await makePremium();
    const history = Array.from({ length: config.assistant.maxRounds }, (_, i) => (
      i === 0
        ? { question: 'q', options: [], answer: { key: CLUSTER.key, label: CLUSTER.fa } }
        : { question: 'q', options: [], answer: { custom: 'نامشخص' } }
    ));
    const res = await next({ description: 'شکستگی لبه‌ی دندان قدامی', history });
    const body = res.json();
    expect(body.done).toBe(true);
    expect(body.matched_fa).toBe(CLUSTER.fa); // resolved against the pillar, never reached a subtopic
  });

  it('rate-limits after maxPerUserPerHour requests', async () => {
    await makePremium();
    for (let i = 0; i < config.assistant.maxPerUserPerHour; i += 1) {
      const res = await next({ description: 'شکستگی لبه‌ی دندان قدامی' });
      expect(res.statusCode).toBe(200);
    }
    const blocked = await next({ description: 'شکستگی لبه‌ی دندان قدامی' });
    expect(blocked.statusCode).toBe(429);
  });
});
