import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getClusters, getTags } from '../src/content-index.js';
import { ai } from '../src/providers/registry.js';

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

afterEach(() => {
  vi.restoreAllMocks();
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

// The keyword-search round: an AI-suggested phrase gets matched, IN CODE,
// against every REAL site hashtag (services/case-assistant.ts's
// nextRootCatalog), not the fixed pillar tree. «زینک فسفات» is a real,
// single-content tag (insight/insight-59) — the motivating case: a fixed
// 2-level pillar tree could only ever reach it via one pillar
// (fixed-pros/cementation), never from implantology, even though the article
// covers implant-crown cementation too. The stub AI provider used elsewhere
// in this file never suggests keywords on purpose (deterministic, zero
// network), so these tests mock `ai.suggestKeywords` directly to exercise
// the matching path.
describe('keyword-search round (real site hashtags)', () => {
  const TAG = getTags().find((t) => t.key === 'زینک فسفات')!;

  it('«زینک فسفات» is indexed as a real single-content tag (fixture sanity check)', () => {
    expect(TAG).toBeTruthy();
    expect(TAG.contentIds).toContain('insight/insight-59');
  });

  it('an AI-suggested phrase matching a niche tag is offered as a round-1 option', async () => {
    await makePremium();
    vi.spyOn(ai, 'suggestKeywords').mockResolvedValue(['زینک فسفات']);
    const res = await next({ description: 'دیشب مطلبی راجع به سمان کردن با زینک فسفات نوشتم' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(false);
    expect(body.options).toContainEqual({ key: 'tag:' + TAG.key, label: TAG.fa });
  });

  it('picking a matched tag resolves straight to its content — a leaf, no further narrowing', async () => {
    await makePremium();
    const history = [{ question: 'q', options: [], answer: { key: 'tag:' + TAG.key, label: TAG.fa } }];
    const res = await next({ description: 'سمان زینک فسفات', history });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(true);
    expect(body.matched_fa).toBe(TAG.fa);
    expect(body.articles.map((a: { content_id: string }) => a.content_id)).toEqual(TAG.contentIds.slice(0, 4));
  });

  it('a "غیر از این‌ها" free-text refinement feeds into the NEXT keyword search', async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'suggestKeywords').mockResolvedValue([]);
    const history = [{ question: 'q', options: [], answer: { custom: 'در واقع منظورم زینک فسفات بود' } }];
    await next({ description: 'یک سوال کلی درباره‌ی سمان', history });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('زینک فسفات'));
  });

  it('a specific niche tag outranks a broad popular one on a tied score (regression)', async () => {
    // «ایمپلنت» alone matches ~85 articles; a case about implant-crown
    // cementation should surface «زینک فسفات» (1 article, the actual match)
    // ahead of the generic, popular tag it's also a full-score match against
    // — otherwise a precise niche hit gets buried under a broad one exactly
    // like the fixed pillar tree used to bury it under the wrong pillar.
    await makePremium();
    vi.spyOn(ai, 'suggestKeywords').mockResolvedValue(['زینک فسفات', 'ایمپلنت']);
    const res = await next({ description: 'سمان کردن روکش ایمپلنت با زینک فسفات' });
    const body = res.json();
    expect(body.done).toBe(false);
    const keys: string[] = body.options.map((o: { key: string }) => o.key);
    expect(keys).toContain('tag:' + TAG.key);
    const implantIdx = keys.indexOf('tag:ایمپلنت');
    const zincIdx = keys.indexOf('tag:' + TAG.key);
    if (implantIdx !== -1) expect(zincIdx).toBeLessThan(implantIdx);
  });

  it('never resolves on the ROOT round even if the AI claims "done" — always asks first', async () => {
    // Defense against a genuine ambiguity ("روکش بیمارم میوفته" - implant
    // crown or natural-tooth crown? the description alone can't say) getting
    // silently guessed instead of asked about: an overconfident/misbehaving
    // model declaring done=true before the user has made a single real pick
    // must not be trusted — there's nothing to resolve against yet anyway.
    await makePremium();
    vi.spyOn(ai, 'suggestKeywords').mockResolvedValue(['روکش']);
    vi.spyOn(ai, 'narrowCase').mockResolvedValue({ done: true });
    const res = await next({ description: 'روکش بیمارم میوفته' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(false);
    expect(body.options.length).toBeGreaterThan(0);
  });

  it('falls back to the top-level pillar catalog when the AI suggests nothing', async () => {
    await makePremium();
    vi.spyOn(ai, 'suggestKeywords').mockResolvedValue([]);
    const res = await next({ description: 'توضیحی که هیچ کلیدواژه‌ای از آن استخراج نمی‌شود' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(false);
    const clusterKeys = new Set(getClusters().map((c) => c.key));
    for (const o of body.options) expect(clusterKeys.has(o.key)).toBe(true);
  });
});

describe('keyword-suggestion cache', () => {
  // The root round costs TWO sequential model calls (suggest keywords, then
  // narrow); this cache removes the first one for a description already seen.
  // The stub provider returns [] by design, and an empty list is deliberately
  // NOT cached, so these tests supply a realistic non-empty suggestion and
  // count REAL calls through the provider registry.
  beforeEach(async () => { await makePremium(); });

  const SUGGESTED = ['روکش', 'سمان'];

  /** One spy across the whole test, so a cache hit shows up as a missing call. */
  function spyKeywords(result: string[] = SUGGESTED) {
    return vi.spyOn(ai, 'suggestKeywords').mockResolvedValue(result);
  }

  async function ask(description: string): Promise<void> {
    const res = await next({ description });
    expect(res.statusCode).toBe(200);
  }

  it('asks the model once, then serves the repeat from cache', async () => {
    const spy = spyKeywords();
    const desc = 'روکش بیمارم مدام می‌افتد و سمان قبلی شسته شده';

    await ask(desc);
    expect(spy).toHaveBeenCalledTimes(1);

    await ask(desc);
    expect(spy, 'repeat: no second model call').toHaveBeenCalledTimes(1);
  });

  it('treats spacing differences as the same description', async () => {
    const spy = spyKeywords();

    await ask('تحلیل استخوان اطراف ایمپلنت');
    await ask('  تحلیل   استخوان  اطراف ایمپلنت  ');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('still calls the model for a genuinely different description', async () => {
    const spy = spyKeywords();

    await ask('پوسیدگی عمیق پروگزیمال مولر دوم');
    await ask('بی‌دندانی کامل فک بالا');

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not cache an empty suggestion list (a degraded round must retry next time)', async () => {
    const desc = 'یک شرح مبهم';

    const empty = spyKeywords([]);
    await ask(desc);
    expect(empty).toHaveBeenCalledTimes(1);
    empty.mockRestore();

    // The empty answer was not pinned: the next round asks the model again.
    const again = spyKeywords();
    await ask(desc);
    expect(again, 'an empty result must not be cached').toHaveBeenCalledTimes(1);
  });
});
