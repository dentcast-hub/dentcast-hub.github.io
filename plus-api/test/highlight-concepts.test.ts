import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getIndex, getTags } from '../src/content-index.js';
import { getGlossaryTerm, getGlossaryTerms, applyRemoteGlossary, resetRemoteGlossary } from '../src/glossary.js';
import { foldName, conceptDomain } from '../src/hashtag-ref.js';
import { conceptsFor, conceptHighlights, glossaryNotes } from '../src/services/highlight-concepts.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200093';

// Real data, chosen from the shipped index so nothing here resolves nowhere:
//   · a concept tag with several pages and a glossary term that names it;
//   · a page carrying a BRAND tag (series tags are not concepts);
//   · a page with no tags at all, for the text signal.
const tags = getTags();
const CEMENT = tags.find((t) => foldName(t.key) === 'سمان رزینی')!;
const CEMENT_PAGE = CEMENT.contentIds[0];
const CEMENT_PAGE_2 = CEMENT.contentIds[1];
const BRAND_PAGE = 'insight/insight-1'; // carries «اینسایت» + «اکلوژن» + …
const tagged = new Set(tags.flatMap((t) => t.contentIds));
// Every indexed page carries tags today, so a page OUTSIDE the index stands in
// — legal for a highlight (the library falls back to the id as its title).
const UNTAGGED_PAGE = Object.keys(getIndex().byContent).find((id) => !tagged.has(id) && !id.startsWith('glossary/')) ?? 'chairside/chairside-9999';
const RESIN = getGlossaryTerm('resin-cements')!;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function userId(): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return r.rows[0].id;
}
async function setTier(tier: string): Promise<void> {
  await pool.query('update profiles set tier = $2 where phone = $1', [phone, tier]);
}
async function hl(contentId: string, exact: string, note: string | null = null): Promise<void> {
  await pool.query(`insert into highlights (user_id, content_id, exact, note) values ($1, $2, $3, $4)`, [await userId(), contentId, exact, note]);
}
const get = (url: string, c = cookie) => app.inject({ method: 'GET', url, headers: { cookie: c } });

describe('the fixtures are what the test believes', () => {
  it('finds the tag, the glossary term, a brand page and an untagged page', () => {
    expect(CEMENT.contentIds.length).toBeGreaterThan(2);
    expect(RESIN.fa_title).toBe('سمان‌های رزینی');
    expect(UNTAGGED_PAGE).toBeTruthy();
    expect(conceptDomain('اینسایت')).toBe('brand');
    expect(conceptDomain('اکلوژن')).not.toBe('brand');
  });
});

describe('foldName', () => {
  it('reads the reference, the index and the glossary as one spelling', () => {
    expect(foldName('سمان_رزینی')).toBe('سمان رزینی');
    expect(foldName('سمان‌رزینی')).toBe('سمانرزینی'); // a ZWNJ is not a space
    expect(foldName('  Resin-Cement ')).toBe('resin cement');
    expect(foldName('كتاب مانيه')).toBe('کتاب مانیه');
  });
});

describe('the gate', () => {
  it('concept views are premium; the glossary door is signed-in with counts only', async () => {
    expect((await app.inject({ method: 'GET', url: '/highlights/concepts' })).statusCode).toBe(401);
    expect((await get('/highlights/concepts')).statusCode).toBe(402);
    expect((await get('/highlights/concepts/' + encodeURIComponent(CEMENT.key))).statusCode).toBe(402);

    await hl(CEMENT_PAGE, 'یک جمله درباره‌ی سمان');
    const res = await get('/glossary/resin-cements/notes');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.locked).toBe(true);
    expect(body.total).toBe(1);
    expect(body.article_count).toBe(1);
    expect(body.articles).toBeUndefined();
    expect(body.term.slug).toBe('resin-cements');
    expect((await app.inject({ method: 'GET', url: '/glossary/resin-cements/notes' })).statusCode).toBe(401);
  });
});

describe('GET /highlights/concepts', () => {
  it('lists the concepts a highlighted page carries, never its brand tag, with counts', async () => {
    await setTier('premium');
    await hl(BRAND_PAGE, 'کاغذ نازک‌تر است');
    await hl(BRAND_PAGE, 'تماس زودرس');
    const body = (await get('/highlights/concepts')).json();
    const keys = body.concepts.map((c: { key: string }) => c.key);
    expect(keys).toContain('اکلوژن');
    expect(keys).not.toContain('اینسایت');
    const occ = body.concepts.find((c: { key: string }) => c.key === 'اکلوژن');
    expect(occ.highlights).toBe(2);
    expect(occ.articles).toBe(1);
    expect(occ.pages_total).toBeGreaterThan(1);
    expect(body.total_highlights).toBe(2);
    expect(body.reached_highlights).toBe(2);
  });

  it('is empty for a reader with no highlights', async () => {
    await setTier('premium');
    const body = (await get('/highlights/concepts')).json();
    expect(body).toEqual({ concepts: [], total_highlights: 0, reached_highlights: 0 });
  });

  it('sorts by highlights, then articles, and carries the glossary link where a term names the concept', async () => {
    await setTier('premium');
    await hl(CEMENT_PAGE, 'الف');
    await hl(CEMENT_PAGE, 'ب');
    await hl(CEMENT_PAGE_2, 'ج');
    await hl(BRAND_PAGE, 'د');
    const body = (await get('/highlights/concepts')).json();
    expect(body.concepts[0].key).toBe(CEMENT.key);
    expect(body.concepts[0].highlights).toBe(3);
    expect(body.concepts[0].articles).toBe(2);
    expect(body.concepts[0].glossary).toMatchObject({ slug: 'resin-cements', url: '/glossary/resin-cements.html' });
    for (let i = 1; i < body.concepts.length; i += 1) {
      expect(body.concepts[i - 1].highlights).toBeGreaterThanOrEqual(body.concepts[i].highlights);
    }
  });

  it('counts a text mention on an untagged page once the concept is one of the reader\'s', async () => {
    await setTier('premium');
    await hl(UNTAGGED_PAGE, 'سمان رزینی دوال‌کیور بهتر است');
    let body = (await get('/highlights/concepts')).json();
    // No highlighted page carries the tag yet: the list does not reach for it.
    expect(body.concepts.map((c: { key: string }) => c.key)).not.toContain(CEMENT.key);
    await hl(CEMENT_PAGE, 'یک جمله');
    body = (await get('/highlights/concepts')).json();
    const cem = body.concepts.find((c: { key: string }) => c.key === CEMENT.key);
    expect(cem.highlights).toBe(2);
    expect(cem.articles).toBe(2);
  });
});

describe('GET /highlights/concepts/:key', () => {
  it('groups the concept\'s highlights by article and says how each one got there', async () => {
    await setTier('premium');
    await hl(CEMENT_PAGE, 'یک جمله‌ی بی‌ربط'); // tag only
    await hl(CEMENT_PAGE, 'سمان رزینی این‌جا'); // tag + text
    await hl(UNTAGGED_PAGE, 'این یکی فقط در یادداشت', 'یادداشتی درباره‌ی سمان رزینی'); // text, through the note
    await hl(UNTAGGED_PAGE, 'سمان رزینی لایت‌کیور', 'برای فردا'); // text, in the highlight itself
    await hl(BRAND_PAGE, 'هیچ'); // neither

    const res = await get('/highlights/concepts/' + encodeURIComponent(CEMENT.key));
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.concept).toMatchObject({ key: CEMENT.key, pages_total: CEMENT.contentCount });
    expect(body.concept.glossary.slug).toBe('resin-cements');
    const ids = body.articles.map((a: { content_id: string }) => a.content_id);
    expect(ids).toContain(CEMENT_PAGE);
    expect(ids).toContain(UNTAGGED_PAGE);
    expect(ids).not.toContain(BRAND_PAGE);
    const tagged = body.articles.find((a: { content_id: string }) => a.content_id === CEMENT_PAGE);
    expect(tagged.highlights.map((h: { match: string }) => h.match).sort()).toEqual(['both', 'tag']);
    const untagged = body.articles.find((a: { content_id: string }) => a.content_id === UNTAGGED_PAGE);
    expect(untagged.highlights.every((h: { match: string }) => h.match === 'text')).toBe(true);
    expect(untagged.highlights.some((h: { exact: string }) => h.exact.includes('لایت'))).toBe(true);
    expect(body.total).toBe(body.articles.reduce((n: number, a: { count: number }) => n + a.count, 0));
    expect(body.article_count).toBe(body.articles.length);
  });

  it('resolves the reference\'s underscore spelling to the index\'s tag, and 404s an unknown or brand tag', async () => {
    await setTier('premium');
    await hl(CEMENT_PAGE, 'x');
    const a = (await get('/highlights/concepts/' + encodeURIComponent('سمان_رزینی'))).json();
    expect(a.concept.key).toBe(CEMENT.key);
    expect((await get('/highlights/concepts/' + encodeURIComponent('این-مفهوم-نیست'))).statusCode).toBe(404);
    expect((await get('/highlights/concepts/' + encodeURIComponent('اینسایت'))).statusCode).toBe(404);
  });
});

describe('GET /glossary/:slug/notes', () => {
  it('gathers highlights on the term\'s tagged pages and those that name it, and names its concepts', async () => {
    await setTier('premium');
    await hl(CEMENT_PAGE, 'روی صفحه‌ی تگ‌شده');
    await hl(UNTAGGED_PAGE, 'سمان‌های رزینی را ترجیح می‌دهم'); // the plural title, ZWNJ
    await hl(BRAND_PAGE, 'بی‌ربط');
    const res = await get('/glossary/resin-cements/notes');
    const body = res.json();
    expect(body.locked).toBe(false);
    expect(body.term).toMatchObject({ slug: 'resin-cements', fa_title: 'سمان‌های رزینی' });
    expect(body.concepts.map((c: { key: string }) => c.key)).toContain(CEMENT.key);
    expect(body.total).toBe(2);
    expect(body.article_count).toBe(2);
    const untagged = body.articles.find((a: { content_id: string }) => a.content_id === UNTAGGED_PAGE);
    expect(untagged.highlights[0].match).toBe('text');
  });

  it('answers a term with no concept of its own from the text alone, and 404s an unknown slug', async () => {
    await setTier('premium');
    // «ابفرکشن» is a one-page tag; a mention elsewhere still counts.
    await hl(UNTAGGED_PAGE, 'ضایعه‌ی ابفرکشن در سرویکال');
    const body = (await get('/glossary/abfraction/notes')).json();
    expect(body.total).toBe(1);
    expect(body.articles[0].highlights[0].match).toBe('text');
    expect((await get('/glossary/no-such-term/notes')).statusCode).toBe(404);
    expect((await get('/glossary/BAD_SLUG/notes')).statusCode).toBe(400);
  });

  it('a known term with nothing behind it is total 0, not an error — the page then draws nothing', async () => {
    await setTier('premium');
    const body = (await get('/glossary/resin-cements/notes')).json();
    expect(body.total).toBe(0);
    expect(body.articles).toEqual([]);
  });
});

describe('the text signal', () => {
  it('matches whole words only, and reads a ZWNJ plural as the singular', async () => {
    await setTier('premium');
    const id = await userId();
    await hl(UNTAGGED_PAGE, 'اچینگ سلکتیو مینا'); // contains «اچ» as a fragment only
    await hl(UNTAGGED_PAGE, 'سمان‌های رزینی نسل جدید'); // the plural, ZWNJ-attached
    await hl(UNTAGGED_PAGE, 'سمان‌رزینی‌ها'); // glued with ZWNJ: not the two words
    const view = await conceptHighlights(id, 'سمان رزینی');
    expect(view!.total).toBe(1);
    expect(view!.articles[0].highlights[0].exact).toContain('نسل جدید');
    const etch = getTags().find((t) => foldName(t.key) === 'اچ');
    if (etch) {
      const v = await conceptHighlights(id, 'اچ');
      expect(v!.total).toBe(0);
    }
  });
});

describe('a term published after boot', () => {
  it('answers its notes block once the published glossary is adopted — no restart, no rebuild', async () => {
    await setTier('premium');
    await hl(UNTAGGED_PAGE, 'در مورد سیلان‌سازی زیرکونیا شک دارم');
    expect((await get('/glossary/zirconia-silanization/notes')).statusCode).toBe(404);
    try {
      expect(applyRemoteGlossary({ glossary: [...getGlossaryTerms(), {
        slug: 'zirconia-silanization', title: 'Zirconia Silanization', fa_title: 'سیلان‌سازی زیرکونیا',
        synonyms: ['سیلان زیرکونیا'], url: '/glossary/zirconia-silanization.html',
      }] })).toBe(true);
      const res = await get('/glossary/zirconia-silanization/notes');
      expect(res.statusCode).toBe(200);
      expect(res.json().total).toBe(1);
      expect(res.json().articles[0].highlights[0].match).toBe('text');
    } finally {
      resetRemoteGlossary();
    }
    expect((await get('/glossary/zirconia-silanization/notes')).statusCode).toBe(404);
  });
});

describe('the services directly', () => {
  it('agree with the routes on the same rows', async () => {
    await hl(CEMENT_PAGE, 'الف');
    const id = await userId();
    const list = await conceptsFor(id);
    const view = await conceptHighlights(id, CEMENT.key);
    const notes = await glossaryNotes(id, 'resin-cements');
    expect(list.concepts.find((c) => c.key === CEMENT.key)?.highlights).toBe(1);
    expect(view?.total).toBe(1);
    expect(notes?.total).toBe(1);
    expect(await conceptHighlights(id, 'nope')).toBeNull();
    expect(await glossaryNotes(id, 'nope')).toBeNull();
  });
});
