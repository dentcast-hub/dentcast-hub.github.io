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
  it('returns real site folders with per-folder highlight counts + landing links', async () => {
    // content_id folder = first path segment.
    const folderKey = cidsInSub[0].split('/')[0];
    await addHighlight(cidsInSub[0], 'اول');
    await addHighlight(cidsInSub[0], 'دوم');

    const res = await app.inject({ method: 'GET', url: '/tree', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total_highlights).toBe(2);
    expect(Array.isArray(body.folders)).toBe(true);

    const folder = body.folders.find((f: any) => f.key === folderKey);
    expect(folder, `folder ${folderKey} present`).toBeTruthy();
    expect(folder.count).toBe(2);
    expect(folder.url).toMatch(/^\//); // landing-page link
    expect(folder.total).toBeGreaterThan(0);
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

  it('scopes a folder archive by content_id prefix (folder:key)', async () => {
    const folderKey = cidsInSub[0].split('/')[0];
    await addHighlight(cidsInSub[0], 'در این فولدر');
    await addHighlight('someotherfolder/x-1', 'فولدر دیگر');
    const res = await app.inject({ method: 'GET', url: '/highlights?topic=folder:' + folderKey, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const texts = res.json().highlights.map((h: any) => h.exact);
    expect(texts).toContain('در این فولدر');
    expect(texts).not.toContain('فولدر دیگر');
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
  it('returns the current week starting Saturday, month comparison, and records', async () => {
    await addHighlight(cidsInSub[0], 'برای آمار');
    const res = await app.inject({ method: 'GET', url: '/profile/stats', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.week).toHaveLength(7);
    // week[0] is a Saturday (getUTCDay 6)
    const [y, m, d] = body.week[0].day.split('-').map(Number);
    expect(new Date(Date.UTC(y, m - 1, d)).getUTCDay()).toBe(6);
    // today is somewhere in the week and is active (we just created a highlight)
    const todayCell = body.week.find((c: any) => c.active);
    expect(todayCell).toBeTruthy();
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
    // folder progress + score (spec change)
    expect(Array.isArray(body.folder_progress)).toBe(true);
    const fp = body.folder_progress.find((f: any) => f.key === cidsInSub[0].split('/')[0]);
    expect(fp.total).toBeGreaterThan(0);
    // A highlight is direct evidence the page was read, so it counts toward the
    // folder's reading progress (article_completed is not emitted by the client yet).
    expect(fp.read).toBe(1);
    expect(fp.read).toBeLessThanOrEqual(fp.total); // numerator never exceeds the folder total
    expect(body.score).toBeGreaterThan(0); // activity-derived, ready for leaderboard
  });

  it('also counts a page as read on an article_completed event', async () => {
    const folderKey = cidsInSub[0].split('/')[0];
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'article_completed', content_id: cidsInSub[0] },
    });
    const res = await app.inject({ method: 'GET', url: '/progress', headers: { cookie } });
    const fp = res.json().folder_progress.find((f: any) => f.key === folderKey);
    expect(fp.read).toBe(1);
    expect(fp.read).toBeLessThanOrEqual(fp.total);
  });
});
