import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getIndex } from '../src/content-index.js';

let app: FastifyInstance;
let cookie: string;

// Pick real content_ids from the taxonomy so tree/topic have something to group.
// Use a category + subcategory that actually contain content (the site-order
// index can start with an empty subcategory).
const idx = getIndex();
const cluster = idx.clusters.find((c) => c.subtopics.some((s) => s.contentCount >= 2))!;
const sub = cluster.subtopics.find((s) => s.contentCount >= 2)!;
const cidsInSub = sub.contentIds.slice(0, 2);
// A different category, for cross-category scoping checks.
const otherCluster = idx.clusters.find((c) => c.key !== cluster.key && c.contentCount >= 1)!;
const otherCid = otherCluster.contentIds[0];

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, '09121400001');
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function addHighlight(content_id: string, exact: string) {
  return app.inject({
    method: 'POST', url: '/highlights', headers: { cookie },
    payload: { content_id, exact, color: 'yellow' },
  });
}

describe('GET /tree', () => {
  it('aggregates highlight counts per taxonomy branch with links, no bodies', async () => {
    await addHighlight(cidsInSub[0], 'اول');
    await addHighlight(cidsInSub[0], 'دوم');
    await addHighlight(cidsInSub[1] || cidsInSub[0], 'سوم');

    const res = await app.inject({ method: 'GET', url: '/tree', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total_highlights).toBe(3);

    const branch = body.clusters.find((c: any) => c.key === cluster.key);
    expect(branch).toBeTruthy();
    expect(branch.count).toBe(3);
    expect(branch.topicKey).toBe('cluster:' + cluster.key);
    const subBranch = branch.subtopics.find((s: any) => s.key === sub.key);
    expect(subBranch.count).toBe(3);
    // no highlight bodies leak into the tree
    expect(JSON.stringify(body)).not.toContain('اول');
  });
});

describe('GET /highlights?topic=', () => {
  it('returns the per-topic archive across the branch content, in card form', async () => {
    await addHighlight(cidsInSub[0], 'کارت یک');
    await addHighlight(cidsInSub[1] || cidsInSub[0], 'کارت دو');

    const res = await app.inject({
      method: 'GET', url: '/highlights?topic=subtopic:' + sub.key, headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.topic_fa).toBe(sub.fa);
    expect(body.highlights.length).toBeGreaterThanOrEqual(2);
    // card form carries exact/cloze/note/label + anchor fields
    expect(body.highlights[0]).toHaveProperty('exact');
    expect(body.highlights[0]).toHaveProperty('cloze_markers');
  });

  it('404s on an unknown topic', async () => {
    const res = await app.inject({ method: 'GET', url: '/highlights?topic=cluster:nope', headers: { cookie } });
    expect(res.statusCode).toBe(404);
  });

  it('scopes a category archive to ONLY that category (issue 4)', async () => {
    await addHighlight(cidsInSub[0], 'داخل دسته');       // in `cluster`
    await addHighlight(otherCid, 'دسته دیگر');            // in `otherCluster`

    const inCat = await app.inject({ method: 'GET', url: '/highlights?topic=cluster:' + cluster.key, headers: { cookie } });
    const texts = inCat.json().highlights.map((h: any) => h.exact);
    expect(texts).toContain('داخل دسته');
    expect(texts).not.toContain('دسته دیگر'); // the other category never leaks in

    const other = await app.inject({ method: 'GET', url: '/highlights?topic=cluster:' + otherCluster.key, headers: { cookie } });
    const otherTexts = other.json().highlights.map((h: any) => h.exact);
    expect(otherTexts).toContain('دسته دیگر');
    expect(otherTexts).not.toContain('داخل دسته');
  });
});

describe('PATCH /me', () => {
  it('updates the pseudonym and merges settings', async () => {
    const patch = await app.inject({ method: 'PATCH', url: '/me', headers: { cookie },
      payload: { display_name: 'نام تازه', settings: { reminders: { enabled: true } } } });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().display_name).toBe('نام تازه');
    expect(patch.json().settings.reminders.enabled).toBe(true);

    const me = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.display_name).toBe('نام تازه');
  });
});

describe('GET /profile/stats', () => {
  it('returns a 7-day week strip, month comparison, and records', async () => {
    await addHighlight(cidsInSub[0], 'برای آمار');
    const res = await app.inject({ method: 'GET', url: '/profile/stats', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.week).toHaveLength(7);
    expect(body.week[6].active).toBe(true); // today had a qualifying action (highlight)
    expect(body.month_vs_month.highlights_this).toBe(1);
    expect(body.records).toHaveProperty('longest_streak');
  });
});

describe('GET /export/highlights', () => {
  it('dumps the user data with an attachment header', async () => {
    await addHighlight(cidsInSub[0], 'برای اکسپورت');
    const res = await app.inject({ method: 'GET', url: '/export/highlights', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    const body = res.json();
    expect(body.count).toBe(1);
    expect(body.highlights[0].exact).toBe('برای اکسپورت');
  });
});

describe('GET /highlights/recent', () => {
  it('returns the latest highlights newest-first, capped by limit', async () => {
    await addHighlight(cidsInSub[0], 'قدیمی');
    await addHighlight(cidsInSub[0], 'جدیدتر');
    const res = await app.inject({ method: 'GET', url: '/highlights/recent?limit=1', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const list = res.json().highlights;
    expect(list).toHaveLength(1);
    expect(list[0].exact).toBe('جدیدتر');
  });
});

describe('GET /progress', () => {
  it('reports totals and last content', async () => {
    await addHighlight(cidsInSub[0], 'یک');
    const res = await app.inject({ method: 'GET', url: '/progress', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total_highlights).toBe(1);
    expect(body.last_content_id).toBe(cidsInSub[0]);
  });
});
