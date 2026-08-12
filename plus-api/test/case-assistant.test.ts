import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getClusters, getTags } from '../src/content-index.js';
import { ai } from '../src/providers/registry.js';
import { DEFAULT_QUESTION, FALLBACK_QUESTION } from '../src/services/case-assistant.js';

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

// The tag round: ONE model call per round that needs one. The model is shown
// the site's whole hashtag catalog and returns a subset of it; this module
// keeps only what really exists in the index. The stub AI provider used
// elsewhere in this file returns nothing on purpose (deterministic, zero
// network), so these tests mock `ai.selectTags` directly to exercise the path.
describe('tag round (real site hashtags)', () => {
  const TAG = getTags().find((t) => t.key === 'زینک فسفات')!;

  it('«زینک فسفات» is indexed as a real single-content tag (fixture sanity check)', () => {
    expect(TAG).toBeTruthy();
    expect(TAG.contentIds).toContain('insight/insight-59');
  });

  it('the «نبودن نسج» case: understands the words, offers the ferrule tags, in ONE model call', async () => {
    // The motivating bug. «نسج» appears in none of the site's hashtags and in
    // none of its aliases, so the old word-overlap matcher could only latch
    // onto «روکش» — which sits inside 25 unrelated tags — and asked a question
    // full of irrelevant crown options. The bridge from the speaker's word to
    // the site's vocabulary is now the model's whole job, and the tags it
    // needs («نبود فرول», «افزایش طول تاج») have existed all along.
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags').mockResolvedValue(['نبود فرول', 'افزایش طول تاج']);

    const res = await next({ description: 'برای روکش قدامی نسج کافی ندارم' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(false);
    expect(body.question).toBe(DEFAULT_QUESTION);
    expect(body.options).toEqual([
      { key: 'tag:نبود فرول', label: 'نبود فرول' },
      { key: 'tag:افزایش طول تاج', label: 'افزایش طول تاج' },
    ]);
    expect(spy, 'a root round costs exactly one model call').toHaveBeenCalledTimes(1);
  });

  it("shows the model the real catalog and the user's own refinements", async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags').mockResolvedValue([]);
    const history = [{ question: 'q', options: [], answer: { custom: 'در واقع منظورم زینک فسفات بود' } }];

    await next({ description: 'یک سوال کلی درباره‌ی سمان', history });

    const input = spy.mock.calls[0][0];
    expect(input.description).toBe('یک سوال کلی درباره‌ی سمان');
    expect(input.refinements).toEqual(['در واقع منظورم زینک فسفات بود']);
    expect(input.catalog).toHaveLength(getTags().length);
    expect(input.catalog).toContain(TAG.fa);
  });

  it("keeps the model's own ranking order", async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['افزایش طول تاج', 'نبود فرول']);
    const res = await next({ description: 'طول تاج کلینیکی کوتاه است' });
    const keys: string[] = res.json().options.map((o: { key: string }) => o.key);
    expect(keys).toEqual(['tag:افزایش طول تاج', 'tag:نبود فرول']);
  });

  it('drops an invented hashtag but rescues a normalisable spelling', async () => {
    // The safety net: nothing reaches the user that is not a real site tag.
    // An Arabic ي/ك or a stray diacritic is an orthographic wobble, not a
    // different tag, so normalizeFa folds it back; a label naming nothing
    // real is simply not an option.
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue([
      'هشتگ من‌درآوردی که وجود ندارد',
      'نبودِ فرول',          // same tag, one extra diacritic
      'مديريت بافت نرم',      // same tag, Arabic ي
    ]);

    const res = await next({ description: 'کمبود نسج و بافت نرم برای روکش' });
    const body = res.json();

    expect(body.options).toEqual([
      { key: 'tag:نبود فرول', label: 'نبود فرول' },
      { key: 'tag:مدیریت بافت نرم', label: 'مدیریت بافت نرم' },
    ]);
  });

  it("always shows the INDEX's own label, never the model's text", async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['نبودِ فرول']);
    const res = await next({ description: 'فرول ندارم' });
    expect(res.json().options[0].label).toBe('نبود فرول');
  });

  it('caps the round at four options', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(getTags().slice(0, 8).map((t) => t.fa));
    const res = await next({ description: 'یک شرح' });
    expect(res.json().options.length).toBeLessThanOrEqual(4);
  });

  it('picking a matched tag resolves straight to its content — a leaf, no model call', async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags');
    const history = [{ question: 'q', options: [], answer: { key: 'tag:' + TAG.key, label: TAG.fa } }];
    const res = await next({ description: 'سمان زینک فسفات', history });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(true);
    expect(body.matched_fa).toBe(TAG.fa);
    expect(body.articles.map((a: { content_id: string }) => a.content_id)).toEqual(TAG.contentIds.slice(0, 4));
    expect(spy, 'resolving costs no model call').not.toHaveBeenCalled();
  });

  it('picking a pillar walks its subtopics with no model call', async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags');
    const history = [{ question: 'q', options: [], answer: { key: CLUSTER.key, label: CLUSTER.fa } }];
    const res = await next({ description: 'شکستگی لبه‌ی دندان قدامی', history });
    const body = res.json();
    expect(body.done).toBe(false);
    expect(body.question).toBe(DEFAULT_QUESTION);
    expect(body.options.map((o: { key: string }) => o.key)).toEqual(CLUSTER.subtopics.map((s) => s.key));
    expect(spy, 'tree rounds cost no model call').not.toHaveBeenCalled();
  });

  it('falls back to the pillar catalog — and SAYS so — when nothing real matched', async () => {
    // Honesty: the pillar list is a broad-area question, not a shortlist of
    // matches, so it never borrows the wording that would claim relevance.
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue([]);
    const res = await next({ description: 'توضیحی که هیچ ربطی به دندانپزشکی ندارد' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.done).toBe(false);
    expect(body.question).toBe(FALLBACK_QUESTION);
    const clusterKeys = new Set(getClusters().map((c) => c.key));
    for (const o of body.options) expect(clusterKeys.has(o.key)).toBe(true);
  });

  it('falls back the same way when every tag the model named was invented', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['یک چیز کاملاً ساختگی', 'باز هم ساختگی']);
    const body = (await next({ description: 'یک شرح مبهم' })).json();
    expect(body.question).toBe(FALLBACK_QUESTION);
    const clusterKeys = new Set(getClusters().map((c) => c.key));
    for (const o of body.options) expect(clusterKeys.has(o.key)).toBe(true);
  });
});

describe('tag-selection cache', () => {
  // The root round costs one model call over the whole tag catalog; this cache
  // removes it for a description already seen. The stub provider returns []
  // by design, and an empty list is deliberately NOT cached, so these tests
  // supply a realistic non-empty selection and count REAL calls through the
  // provider registry.
  beforeEach(async () => { await makePremium(); });

  const SELECTED = ['نبود فرول', 'افزایش طول تاج'];

  /** One spy across the whole test, so a cache hit shows up as a missing call. */
  function spySelect(result: string[] = SELECTED) {
    return vi.spyOn(ai, 'selectTags').mockResolvedValue(result);
  }

  async function ask(description: string): Promise<void> {
    const res = await next({ description });
    expect(res.statusCode).toBe(200);
  }

  it('asks the model once, then serves the repeat from cache', async () => {
    const spy = spySelect();
    const desc = 'روکش بیمارم مدام می‌افتد و سمان قبلی شسته شده';

    await ask(desc);
    expect(spy).toHaveBeenCalledTimes(1);

    await ask(desc);
    expect(spy, 'repeat: no second model call').toHaveBeenCalledTimes(1);
  });

  it('treats spacing differences as the same description', async () => {
    const spy = spySelect();

    await ask('تحلیل استخوان اطراف ایمپلنت');
    await ask('  تحلیل   استخوان  اطراف ایمپلنت  ');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('still calls the model for a genuinely different description', async () => {
    const spy = spySelect();

    await ask('پوسیدگی عمیق پروگزیمال مولر دوم');
    await ask('بی‌دندانی کامل فک بالا');

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not cache an empty selection (a degraded round must retry next time)', async () => {
    const desc = 'یک شرح مبهم';

    const empty = spySelect([]);
    await ask(desc);
    expect(empty).toHaveBeenCalledTimes(1);
    empty.mockRestore();

    // The empty answer was not pinned: the next round asks the model again.
    const again = spySelect();
    await ask(desc);
    expect(again, 'an empty result must not be cached').toHaveBeenCalledTimes(1);
  });
});
