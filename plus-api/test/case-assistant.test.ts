import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getAllContent, getClusters, getContentInfo, getTags } from '../src/content-index.js';
import { ai } from '../src/providers/registry.js';
import {
  DEFAULT_QUESTION, FALLBACK_QUESTION, OUTAGE_QUESTION, REPEAT_FALLBACK_QUESTION, REPEAT_TAGS_QUESTION,
  REPEAT_FALLBACK_FINAL_QUESTION, REPEAT_TAGS_FINAL_QUESTION, assistantTags, glossaryFor,
} from '../src/services/case-assistant.js';

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
  // NO LIVE MODEL CALL, EVER.
  //
  // `ai.selectTags` is the service's one call to a provider, and the tag-round
  // block below stubs it in every case. The pillar/subtopic rounds did not —
  // so the first of them reached for the real provider, waited out a network
  // timeout in a container with no egress to it, and blew the 5s case budget
  // (measured 5336ms against 200-300ms for every case after it, because the
  // provider then answers instantly for the rest of the run). It looked like
  // order-dependence and was not: it is a cold first call, and it fails in
  // isolation too once the machine is cold.
  //
  // Those cases are ABOUT the no-model path — they assert the options come
  // from real cluster/subtopic keys, which the service builds itself — so the
  // honest fixture is an empty answer, deterministic and instant, rather than
  // a live call nobody meant to make. A case that wants a model still stubs
  // its own, and `vi.restoreAllMocks()` in afterEach hands it back.
  vi.spyOn(ai, 'selectTags').mockResolvedValue([]);
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

/**
 * THE FIRST ROUND AFTER A DEPLOY MUST NOT STALL THE API.
 *
 * `tagLookup()` normalises all 896 tag keys and labels to build its index, and
 * `normalizeFa` used to scan the whole 2772-entry alias table for every token,
 * re-splitting each variant inside the inner loop. So the first assistant
 * round cost ~4.9 seconds of SYNCHRONOUS cpu — 4097 of 4542 profile samples
 * inside normalizeFa — which on one event loop is every other request waiting
 * too. And not once per deploy: content-refresh.ts reloads the index every few
 * minutes and the caches key on that reference, so each reload bought the next
 * reader another stall.
 *
 * The budget here is deliberately loose (a second, against 4.9 measured before
 * and ~50ms after): this pins the ORDER OF MAGNITUDE on whatever machine runs
 * it, not a millisecond count that would flake on a busy CI box.
 */
describe('the first round is not a stall', () => {
  it('builds its tag index in well under a second', async () => {
    await makePremium();
    const started = Date.now();
    const res = await next({ description: 'یک بیمار با شکستگی لبه‌ی دندان قدامی' });
    const elapsed = Date.now() - started;

    expect(res.statusCode).toBe(200);
    expect(elapsed, `first assistant round took ${elapsed}ms`).toBeLessThan(1000);
  });
});

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
    const subtopicKeys = new Set(CLUSTER.subtopics.map((s) => CLUSTER.key + '/' + s.key));
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
    expect(body.matched_fa).toBe(`${SUBTOPIC.fa} در ${CLUSTER.fa}`); // a subtopic names its pillar
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

  it('a free-text ("custom") answer at the root stays at the top level', async () => {
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
    expect(input.catalog).toHaveLength(assistantTags().length);
    // Each label carries its page count, so a one-page tag looks like one.
    expect(input.catalog).toContain(`${TAG.fa} (${TAG.contentIds.length})`);
  });

  it('reads a label the model copied back with its page count', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['نبود فرول (2)', 'افزایش طول تاج(۱۲)']);
    const body = (await next({ description: 'فرول ندارم' })).json();
    expect(body.options.map((o: { label: string }) => o.label)).toEqual(['نبود فرول', 'افزایش طول تاج']);
  });

  it('rescues a plural or a squashed spelling of a real label', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['فرول\u200cها', 'پست\u200cوکور', 'implants']);
    const body = (await next({ description: 'دندان اندو شده بدون فرول' })).json();
    expect(body.options.map((o: { label: string }) => o.label)).toEqual(['فرول', 'پست و کور', 'ایمپلنت']);
  });

  it('folds the case\'s own words «فضای بی دندان» into the hub that answers it', async () => {
    // «فضای بی دندان» was a one-page tag (a crown that looks too wide next to
    // a gap) echoed from the case's words; A108 made it an alias of the hub.
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['فضای بی دندان', 'RBFDP', 'بریج']);
    const body = (await next({ description: 'یه فضای بی دندانی داره بیمارم در قدام پایین چیکار کنم' })).json();
    const labels = body.options.map((o: { label: string }) => o.label);
    expect(labels).toEqual(['جایگزینی دندان', 'RBFDP', 'بریج']);
  });

  it('drops a one-page tag that only echoes the case', async () => {
    // «تقارن قدامی» leads to ONE page and nothing else picked for the case
    // touches it: echoed from «قدام», it would take a chip from the answers.
    await makePremium();
    expect(assistantTags().find((t) => t.fa === 'تقارن قدامی')!.contentIds).toHaveLength(1);
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['تقارن قدامی', 'RBFDP', 'بریج']);
    const body = (await next({ description: 'یه فضای بی دندانی داره بیمارم در قدام پایین چیکار کنم' })).json();
    expect(body.options.map((o: { label: string }) => o.label)).toEqual(['RBFDP', 'بریج']);
  });

  it('keeps a one-page tag whose page the case actually describes', async () => {
    await makePremium();
    const one = assistantTags().find((t) => t.fa === 'تقارن قدامی')!;
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['تقارن قدامی', 'RBFDP', 'بریج']);
    const title = getContentInfo(one.contentIds[0])!.title;
    const body = (await next({ description: title })).json();
    expect(body.options.map((o: { label: string }) => o.label)).toContain('تقارن قدامی');
  });

  it("keeps the model's order when a tag's pages merely sit inside another's", async () => {
    // «سمان دائم» was moved ahead of «سمان موقت» because its pages are a subset,
    // in a case about temporary cement. Only a label that names a narrower case
    // («نبود فرول» of «فرول») may jump ahead.
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['سمان موقت', 'سمان مجدد', 'سمان دائم']);
    const body = (await next({ description: 'روکش مدام میفته، سمان موقت زدم' })).json();
    expect(body.options[0].label).toBe('سمان موقت');
  });

  it('does not push a broad tag the model ranked high out of the round', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['فرول', 'پست و کور', 'فایبر پست', 'افزایش طول تاج', 'دندان اندوشده']);
    const body = (await next({ description: 'پرمولر اندو شده فرول نداره، پست بزارم؟' })).json();
    expect(body.options.map((o: { label: string }) => o.label)).toContain('پست و کور');
  });

  it('a refinement that leads only back to tags already shown re-offers them and says so', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['فرول']);
    const history = [
      { question: 'q', options: [{ key: 'tag:فرول', label: 'فرول' }, { key: 'tag:نبود فرول', label: 'نبود فرول' }], answer: { custom: 'دیواره‌ها نازکه' } },
    ];
    const body = (await next({ description: 'پرمولر اندو شده', history })).json();
    expect(body.question).toBe(REPEAT_TAGS_QUESTION);
    expect(body.options.map((o: { key: string }) => o.key)).toEqual(['tag:فرول']);
  });

  it('a second miss after the pillars says so instead of repeating the first sentence', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue([]);
    const first = (await next({ description: 'یک شرح مبهم دیگر' })).json();
    expect(first.question).toBe(FALLBACK_QUESTION);
    const history = [{ question: first.question, options: first.options, answer: { custom: 'هنوز نامشخص' } }];
    const second = (await next({ description: 'یک شرح مبهم دیگر', history })).json();
    expect(second.question).toBe(REPEAT_FALLBACK_QUESTION);
  });

  it('keeps both sides of an «X یا Y» case even when one side adds no new page', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['ایمپلنت کوتاه', 'سینوس لیفت']);
    const body = (await next({ description: 'ایمپلنت کوتاه یا سینوس لیفت در ماگزیلا خلفی' })).json();
    expect(body.options.map((o: { label: string }) => o.label)).toEqual(['ایمپلنت کوتاه', 'سینوس لیفت']);
  });

  it('the last round never points at «غیر از این‌ها», which it hides', async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags').mockResolvedValue(['فرول']);
    const shown = [{ key: 'tag:فرول', label: 'فرول' }];
    const lead = Array.from({ length: config.assistant.maxRounds - 1 }, () => ({ question: 'q', options: shown, answer: { custom: 'نه' } }));
    const body = (await next({ description: 'پرمولر اندو شده', history: lead })).json();
    expect(body.final_round).toBe(true);
    expect(body.question).toBe(REPEAT_TAGS_FINAL_QUESTION);
    spy.mockResolvedValue([]);
    const pillars = getClusters().map((c) => ({ key: c.key, label: c.fa }));
    const lead2 = Array.from({ length: config.assistant.maxRounds - 1 }, () => ({ question: 'q', options: pillars, answer: { custom: 'نه هنوز' } }));
    const body2 = (await next({ description: 'یک شرح مبهم', history: lead2 })).json();
    expect(body2.question).toBe(REPEAT_FALLBACK_FINAL_QUESTION);
    for (const q of [body.question, body2.question]) expect(q).not.toContain('غیر از این‌ها');
  });

  it('a plural glossary title leads for the singular tag («سمان‌های رزینی» for «سمان رزینی»)', async () => {
    await makePremium();
    const history = [{ question: 'q', options: [], answer: { key: 'tag:سمان رزینی', label: 'سمان رزینی' } }];
    const body = (await next({ description: 'شرح', history })).json();
    expect(body.articles[0].content_id).toBe('glossary/resin-cements');
  });

  it('a glossary term leads the tag it defines under another name', async () => {
    // Synonyms and slashed titles name the term too: «جراحی افزایش طول تاج»
    // defines #افزایش_طول_تاج, «سندبلاست / آماده‌سازی مکانیکی سطح» #سندبلاست.
    const defines: Record<string, string> = {
      'افزایش طول تاج': 'glossary/crown-lengthening', 'پروفایل امرجنس': 'glossary/emergence-profile',
      'سندبلاست': 'glossary/sandblasting', 'تیتانیوم بیس': 'glossary/ti-base',
      'رابطه مرکزی': 'glossary/centric-relation', 'اتصال پیچ شونده': 'glossary/screw-retained',
      'کانین رایز': 'glossary/canine-guidance', 'بارگذاری ایمپلنت': 'glossary/implant-loading',
      'اچ اند رینس': 'glossary/etch-and-rinse', 'پروتکل باند': 'glossary/bonding-protocol',
      'total occlusal convergence': 'glossary/toc', 'اسپلینت': 'glossary/occlusal-splint',
      'سرامیک هیبرید': 'glossary/hybrid-ceramics', 'پلی کریستالین': 'glossary/polycrystalline-ceramics',
    };
    for (const [label, id] of Object.entries(defines)) expect(glossaryFor(label), label).toBe(id);
    // A synonym is matched as written, never folded through the alias table:
    // «biomimetic restorative dentistry» folds to «کتاب مانیه», a book, not the term.
    expect(glossaryFor('کتاب مانیه')).toBeNull();
  });

  it('every glossary term is reachable from the assistant catalog', () => {
    // Either it leads a tag it defines, or a tag it belongs under carries it
    // (glossary.json `hashtags`: «مونومر HEMA» under #باندینگ). 42 terms
    // were reachable by neither and never appeared in any answer.
    const tags = assistantTags();
    const reached = new Set<string>();
    for (const t of tags) {
      const g = glossaryFor(t.fa);
      if (g) reached.add(g);
      for (const id of t.contentIds) reached.add(id);
    }
    const terms = Object.keys(getAllContent()).filter((id) => getContentInfo(id)!.type === 'glossary');
    expect(terms.length).toBeGreaterThan(100);
    expect(terms.filter((id) => !reached.has(id))).toEqual([]);
  });

  it('a sub-concept term rises under its parent tag when the case names it', async () => {
    await makePremium();
    const tag = getTags().find((x) => x.fa === 'باندینگ')!;
    const options = [{ key: 'tag:' + tag.key, label: tag.fa }];
    const history = [{ question: DEFAULT_QUESTION, options, answer: options[0] }];
    const body = (await next({ description: 'مونومر HEMA در باندینگ چه نقشی دارد؟', history })).json();
    const first4 = body.articles.slice(0, 4).map((a: { content_id: string }) => a.content_id);
    expect(first4).toContain('glossary/hema');
  });

  it('the anterior-gap case shows the veneer-retained bridge among the first replacement options', async () => {
    // share-40 was added to «جایگزینی دندان» after older pages; in index order
    // it sat fifth, behind «مطالب بیشتر». It carries two of the case's other
    // chips (RBFDP, بریج), so it belongs on the first screen.
    await makePremium();
    const description = 'یه فضای بی دندانی داره بیمارم در قدام پایین چیکار کنم';
    const options = ['جایگزینی دندان', 'RBFDP', 'بریج'].map((t) => ({ key: 'tag:' + getTags().find((x) => x.fa === t)!.key, label: t }));
    const history = [{ question: DEFAULT_QUESTION, options, answer: options[0] }];
    const body = (await next({ description, history })).json();
    const first4 = body.articles.slice(0, 4).map((a: { content_id: string }) => a.content_id);
    expect(first4).toContain('sharehub/share-40');
    expect(first4).toContain('dentai/dentai-7');
    expect(body.papers.slice(0, 3).map((p: { id: string }) => p.id)).toContain('P2945');
  });

  it('«کمبود فضای عمودی» reaches the restorative-space hub, not a one-page twin', async () => {
    // «میخوام روکش بسازم برای بیمار فضا کمه» → «فضای عمودی کمه»: the model
    // answered the literal label of a one-page implant tag; the concept's ten
    // pages live under «فضای رستوریتیو» (batch A107 merged the two).
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['کمبود فضای عمودی', 'افزایش VD']);
    const body = (await next({ description: 'میخوام روکش بسازم برای بیمار فضای عمودی کمه' })).json();
    expect(body.options[0].label).toBe('فضای رستوریتیو');
  });

  it('leads with the glossary entry named by an acronym or the entry slug', async () => {
    await makePremium();
    for (const [key, term] of [['tmd', 'glossary/tmd'], ['vdo', 'glossary/vertical-dimension-of-occlusion']]) {
      const history = [{ question: 'q', options: [], answer: { key: 'tag:' + key, label: key } }];
      const body = (await next({ description: 'شرح', history })).json();
      expect(body.articles[0].content_id, key).toBe(term);
    }
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
    const ids = body.articles.map((a: { content_id: string }) => a.content_id);
    expect([...ids].sort()).toEqual([...TAG.contentIds].sort());
    // the page whose title names the case («زینک فسفات») leads
    expect(ids[0]).toBe('insight/insight-59');
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
    expect(body.options.map((o: { key: string }) => o.key)).toEqual(CLUSTER.subtopics.map((s) => CLUSTER.key + '/' + s.key));
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

// QA round 2026-10-27: each case below is a path a simulated dentist actually
// walked into a wrong or empty result.
describe('assistant QA regressions', () => {
  const tag = (fa: string) => getTags().find((t) => t.fa === fa)!;

  it('a verbatim label reaches ITS tag, never a smaller one the alias table folds onto it', async () => {
    // «لمینت» (one LiteCast page) folds onto «لمینیت سرامیکی» (24 pages) through
    // an alias; the single lookup map used to keep the smaller tag.
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['لمینیت سرامیکی', 'پروتز متحرک']);
    const body = (await next({ description: 'تراش لمینیت که مینا بمونه' })).json();
    expect(body.options.map((o: { label: string }) => o.label)).toEqual(['لمینیت سرامیکی', 'پروتز متحرک']);
  });

  it('never offers LiteCast pages or series/people tags', async () => {
    const catalog = assistantTags();
    const keys = new Set(catalog.map((t) => t.key));
    expect(keys.has('دنتکست')).toBe(false);
    expect(keys.has('جوان')).toBe(false);
    expect(keys.has('مدیریت مطب')).toBe(true); // a practice topic, not a series tag
    for (const t of catalog) for (const id of t.contentIds) expect(id.startsWith('litecast/')).toBe(false);
  });

  it('a subtopic resolves under the pillar it was picked from, not the first with the same slug', async () => {
    await makePremium();
    const fixed = getClusters().find((c) => c.key === 'fixed-pros')!;
    const failures = fixed.subtopics.find((s) => s.key === 'failures')!;
    const history = [
      { question: 'q1', options: [], answer: { key: 'fixed-pros', label: fixed.fa } },
      { question: 'q2', options: [], answer: { key: 'fixed-pros/failures', label: failures.fa } },
    ];
    const body = (await next({ description: 'شکست پروتز ثابت', history })).json();
    expect(body.done).toBe(true);
    for (const a of body.articles) expect(failures.contentIds).toContain(a.content_id);
  });

  it('puts the narrower tag first, so its pages are not hidden behind the broad one', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['فرول', 'نبود فرول']);
    const body = (await next({ description: 'دندون پایه ام فرول نداره' })).json();
    const labels = body.options.map((o: { label: string }) => o.label);
    expect(labels[0]).toBe('نبود فرول');
    expect(labels).toContain('فرول');
  });

  it('a provider outage still offers the pillars, but says the model was not reached and offers a retry', async () => {
    // «از توضیحت به هشتگ مستقیمی نرسیدم» told a dentist with a clear case that
    // the case was unclear, when the model had simply not answered.
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags').mockRejectedValue(new Error('gateway down'));
    const res = await next({ description: 'روکش زیرکونیا شکسته' });
    expect(res.statusCode).toBe(200);
    expect(res.json().question).toBe(OUTAGE_QUESTION);
    expect(res.json().retry).toBe(true);
    // The failure is not cached: the retry really asks again.
    spy.mockResolvedValue(['فرول']);
    const again = (await next({ description: 'روکش زیرکونیا شکسته' })).json();
    expect(again.question).toBe(DEFAULT_QUESTION);
  });

  it('answers 400, not 500, to a malformed body or history', async () => {
    await makePremium();
    const bad = [
      [null], [1], ['a'], [{}], [{ answer: null }], [{ answer: 'x' }], [{ answer: { key: 5 } }],
      [{ options: [null], answer: { custom: 'y' } }], [{ question: 'q', options: [], answer: { custom: '\u200c\u200b ' } }],
    ];
    for (const history of bad) {
      const res = await next({ description: 'شرح', history });
      expect(res.statusCode, JSON.stringify(history)).toBe(400);
    }
    expect((await next({ description: 'شرح', history: 'x' })).statusCode).toBe(400);
    expect((await next({ description: 'شرح', history: { a: 1 } })).statusCode).toBe(400);
    const nullBody = await app.inject({ method: 'POST', url: '/assistant/next', headers: { cookie, 'content-type': 'application/json' }, payload: 'null' });
    expect(nullBody.statusCode).toBe(400);
  });

  it('treats an invisible-only case as empty and caps a refinement at 200 characters', async () => {
    await makePremium();
    expect((await next({ description: '\u200b\u200c\u200f ' })).statusCode).toBe(400);
    const spy = vi.spyOn(ai, 'selectTags').mockResolvedValue([]);
    const history = [{ question: 'q', options: [], answer: { custom: 'ا'.repeat(5000) } }];
    expect((await next({ description: 'شرح', history })).statusCode).toBe(200);
    expect(spy.mock.calls[0][0].refinements[0]).toHaveLength(200);
  });

  it('free text under a pillar asks the model again and drops what was already offered', async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags').mockResolvedValue(['فرول', 'افزایش طول تاج']);
    const history = [
      { question: 'q1', options: [{ key: 'tag:فرول', label: 'فرول' }], answer: { key: CLUSTER.key, label: CLUSTER.fa } },
      { question: 'q2', options: [], answer: { custom: 'طول تاج کوتاهه' } },
    ];
    const body = (await next({ description: 'روکش قدامی', history })).json();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(body.options.map((o: { key: string }) => o.key)).toEqual(['tag:افزایش طول تاج']);
  });

  it('maxRounds of free text still resolves to something, not an empty list', async () => {
    await makePremium();
    const offered = [{ key: 'tag:فرول', label: 'فرول' }];
    const history = Array.from({ length: config.assistant.maxRounds }, () => (
      { question: 'q', options: offered, answer: { custom: 'نه' } }));
    const body = (await next({ description: 'روکش قدامی', history })).json();
    expect(body.done).toBe(true);
    expect(body.matched_fa).toBe('فرول');
    expect(body.articles.length).toBeGreaterThan(0);
  });

  it('marks the last round so the client can hide «غیر از این‌ها»', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['فرول']);
    const history = Array.from({ length: config.assistant.maxRounds - 1 }, () => (
      { question: 'q', options: [], answer: { custom: 'نه' } }));
    const body = (await next({ description: 'روکش قدامی', history })).json();
    expect(body.done).toBe(false);
    expect(body.final_round).toBe(true);
  });

  it('rescues a label written without its half-space or with ASCII digits', async () => {
    await makePremium();
    vi.spyOn(ai, 'selectTags').mockResolvedValue(['درمان محافظهکارانه', 'دندان 6']);
    const body = (await next({ description: 'مولر اول' })).json();
    const labels = body.options.map((o: { label: string }) => o.label);
    expect(labels).toContain(tag('درمان محافظه\u200cکارانه').fa);
    expect(labels).toContain(tag('دندان ۶').fa);
  });

  it('leads with the glossary entry that defines the matched tag', async () => {
    await makePremium();
    const history = [{ question: 'q', options: [], answer: { key: 'tag:اندوکراون', label: 'اندوکراون' } }];
    const body = (await next({ description: 'اندوکراون مولر', history })).json();
    expect(body.articles[0].content_id).toBe('glossary/endocrown');
    expect(body.articles.length).toBeLessThanOrEqual(12);
  });

  it('counts only the rounds that call the model against the hourly limit', async () => {
    await makePremium();
    const pick = [{ question: 'q', options: [], answer: { key: CLUSTER.key, label: CLUSTER.fa } }];
    for (let i = 0; i < config.assistant.maxPerUserPerHour + 3; i += 1) {
      expect((await next({ description: 'شکستگی', history: pick })).statusCode).toBe(200);
    }
    expect((await next({ description: 'شکستگی' })).statusCode).toBe(200);
  });
});

// «کتابخانهٔ دنت‌کست»: a matched tag also brings the library papers bridged to
// it (plus/cabinet-bridge.json -> plus/cabinet-papers.json). Plain lookup.
describe('library papers beside the result', () => {
  it('a bridged tag resolves with library papers, ferrule papers for «نبود فرول»', async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags');
    const history = [{ question: 'q', options: [], answer: { key: 'tag:نبود فرول', label: 'نبود فرول' } }];
    const body = (await next({ description: 'دندان پایه فرول ندارد', history })).json();
    expect(body.done).toBe(true);
    expect(body.papers.length).toBeGreaterThan(0);
    expect(body.papers.length).toBeLessThanOrEqual(8);
    expect(body.papers[0].title.toLowerCase()).toContain('ferrule');
    for (const p of body.papers) {
      expect(typeof p.id).toBe('string');
      expect(p.view_url || p.download_url).toBeTruthy();
    }
    expect(spy, 'papers cost no model call').not.toHaveBeenCalled();
  });

  it('a tag with no bridge resolves with an empty paper list, not an error', async () => {
    await makePremium();
    const history = [{ question: 'q', options: [], answer: { key: 'tag:' + getTags().find((t) => t.key === 'زینک فسفات')!.key, label: 'x' } }];
    const body = (await next({ description: 'سمان', history })).json();
    expect(body.done).toBe(true);
    expect(Array.isArray(body.papers)).toBe(true);
  });

  it('a pillar result carries no papers', async () => {
    await makePremium();
    const history = [
      { question: 'q1', options: [], answer: { key: CLUSTER.key, label: CLUSTER.fa } },
      { question: 'q2', options: [], answer: { key: CLUSTER.key + '/' + SUBTOPIC.key, label: SUBTOPIC.fa } },
    ];
    const body = (await next({ description: 'شکستگی', history })).json();
    expect(body.papers).toEqual([]);
  });
});

describe('assistant speed', () => {
  it('the same case sent twice at once makes ONE model call', async () => {
    await makePremium();
    const spy = vi.spyOn(ai, 'selectTags').mockImplementation(
      () => new Promise((r) => { setTimeout(() => r(['فرول']), 50); }));
    const [a, b] = await Promise.all([
      next({ description: 'یک کیس هم‌زمان دوبار' }),
      next({ description: 'یک کیس هم‌زمان دوبار' }),
    ]);
    expect(a.statusCode).toBe(200);
    expect(b.statusCode).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

