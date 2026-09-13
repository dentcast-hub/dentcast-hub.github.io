// قطعه‌های صوتی — the audio-clip routes (routes/clips.ts, migration 0064).
//
// The assertions that matter are the founder's decision of 2026-09-13 and the
// two things it must NOT break:
//   · creating a clip is premium — the one act on the site gated at creation;
//   · reading, editing, deleting and exporting a clip stay on any plan, so a
//     lapsed subscriber keeps what they marked;
//   · the span is validated as a PAIR, so a clip can never be saved or moved
//     into something that is not a clip (backwards, a mis-tap, the whole episode).
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { MAX_CLIP_SECONDS } from '../src/routes/clips.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

const EP = 'episodes/episode-101';

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200104';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function setTier(tier: 'free' | 'premium'): Promise<void> {
  await pool.query(`update profiles set tier = $2 where phone = $1`, [phone, tier]);
}

async function create(payload: Record<string, unknown>, c = cookie) {
  return app.inject({ method: 'POST', url: '/clips', headers: { cookie: c }, payload });
}

async function createOk(start = 447, end = 483, extra: Record<string, unknown> = {}): Promise<any> {
  const res = await create({ content_id: EP, start_s: start, end_s: end, ...extra });
  expect(res.statusCode).toBe(201);
  return res.json().clip;
}

describe('gates', () => {
  it('refuses an anonymous caller everywhere with 401', async () => {
    for (const [method, url] of [['GET', '/clips?content_id=' + EP], ['GET', '/clips/library'], ['POST', '/clips'], ['DELETE', '/clips/00000000-0000-0000-0000-000000000000']] as const) {
      const res = await app.inject({ method, url, payload: method === 'POST' ? { content_id: EP, start_s: 1, end_s: 5 } : undefined });
      expect(res.statusCode, `${method} ${url}`).toBe(401);
    }
  });

  it('creating a clip is premium: a free reader gets 402 with the premium_required body', async () => {
    const res = await create({ content_id: EP, start_s: 10, end_s: 40 });
    expect(res.statusCode).toBe(402);
    expect(res.json().error).toBe('premium_required');
  });

  it('the library is premium; the per-episode list is not', async () => {
    const lib = await app.inject({ method: 'GET', url: '/clips/library', headers: { cookie } });
    expect(lib.statusCode).toBe(402);
    const list = await app.inject({ method: 'GET', url: '/clips?content_id=' + EP, headers: { cookie } });
    expect(list.statusCode).toBe(200);
    expect(list.json().clips).toEqual([]);
  });

  it('a lapsed subscriber still reads, edits, deletes and exports their clips', async () => {
    await setTier('premium');
    const clip = await createOk(100, 130, { note: 'پروتکل ریشه' });
    await setTier('free');

    const list = await app.inject({ method: 'GET', url: '/clips?content_id=' + EP, headers: { cookie } });
    expect(list.json().clips.map((c: any) => c.id)).toEqual([clip.id]);

    const one = await app.inject({ method: 'GET', url: '/clips/' + clip.id, headers: { cookie } });
    expect(one.statusCode).toBe(200);
    expect(one.json().clip.note).toBe('پروتکل ریشه');

    const patch = await app.inject({ method: 'PATCH', url: '/clips/' + clip.id, headers: { cookie }, payload: { note: 'اصلاح‌شده' } });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().clip.note).toBe('اصلاح‌شده');

    const exp = await app.inject({ method: 'GET', url: '/export/highlights', headers: { cookie } });
    expect(exp.statusCode).toBe(200);
    expect(exp.json().clips).toHaveLength(1);
    expect(exp.json().clips[0]).toMatchObject({ content_id: EP, start_s: 100, end_s: 130, note: 'اصلاح‌شده' });

    const del = await app.inject({ method: 'DELETE', url: '/clips/' + clip.id, headers: { cookie } });
    expect(del.statusCode).toBe(200);
    const again = await app.inject({ method: 'GET', url: '/clips/' + clip.id, headers: { cookie } });
    expect(again.statusCode).toBe(404);
  });
});

describe('POST /clips', () => {
  beforeEach(() => setTier('premium'));

  it('stores the span to a tenth of a second, trims the note, keeps the label', async () => {
    const clip = await createOk(447.26, 483.04, { note: '  ترتیب EDTA و سایلن  ', label: 'clinical_pearl' });
    expect(clip.start_s).toBe(447.3);
    expect(clip.end_s).toBe(483);
    expect(clip.note).toBe('ترتیب EDTA و سایلن');
    expect(clip.label).toBe('clinical_pearl');
    expect(clip.content_id).toBe(EP);
  });

  it('an empty note is stored as null, not as an empty string', async () => {
    const clip = await createOk(1, 5, { note: '   ' });
    expect(clip.note).toBeNull();
  });

  it('refuses a backwards or zero-length span', async () => {
    expect((await create({ content_id: EP, start_s: 50, end_s: 40 })).json().error).toBe('clip_too_short');
    expect((await create({ content_id: EP, start_s: 50, end_s: 50 })).json().error).toBe('clip_too_short');
    expect((await create({ content_id: EP, start_s: 50, end_s: 50.4 })).json().error).toBe('clip_too_short');
  });

  it('refuses a clip longer than the ceiling — that is the episode, not a clip', async () => {
    const res = await create({ content_id: EP, start_s: 0, end_s: MAX_CLIP_SECONDS + 1 });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('clip_too_long');
    expect((await create({ content_id: EP, start_s: 0, end_s: MAX_CLIP_SECONDS })).statusCode).toBe(201);
  });

  it('refuses a negative start, a bad label and a content_id that is not a path', async () => {
    expect((await create({ content_id: EP, start_s: -1, end_s: 5 })).json().error).toBe('invalid_span');
    expect((await create({ content_id: EP, start_s: 1, end_s: 5, label: 'funny' })).json().error).toBe('invalid_label');
    expect((await create({ content_id: 'episode-101', start_s: 1, end_s: 5 })).json().error).toBe('invalid_content_id');
    expect((await create({ content_id: '../etc', start_s: 1, end_s: 5 })).json().error).toBe('invalid_content_id');
  });

  it('a schema-invalid body is a 400, never a 500', async () => {
    const res = await create({ content_id: EP, start_s: 'ten', end_s: 20 });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /clips?content_id', () => {
  it('lists this reader\'s clips on that episode in TIME order, nobody else\'s', async () => {
    await setTier('premium');
    const late = await createOk(900, 930);
    const early = await createOk(60, 90);
    await createOk(10, 20, {}).then(async () => {
      // another episode — must not appear
      const res = await create({ content_id: 'episodes/episode-102', start_s: 5, end_s: 9 });
      expect(res.statusCode).toBe(201);
    });
    const other = await loginAs(app, '09121200105');
    await pool.query(`update profiles set tier = 'premium' where phone = $1`, ['09121200105']);
    expect((await create({ content_id: EP, start_s: 1, end_s: 3 }, other)).statusCode).toBe(201);

    const res = await app.inject({ method: 'GET', url: '/clips?content_id=' + EP, headers: { cookie } });
    const starts = res.json().clips.map((c: any) => c.start_s);
    expect(starts).toEqual([10, 60, 900]);
    expect(res.json().clips.map((c: any) => c.id)).toContain(early.id);
    expect(res.json().clips.map((c: any) => c.id)).toContain(late.id);
  });

  it('needs a content_id', async () => {
    const res = await app.inject({ method: 'GET', url: '/clips', headers: { cookie } });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /clips/library', () => {
  it('groups by episode, newest episode first, clips inside in time order, with the episode resolved', async () => {
    await setTier('premium');
    await createOk(900, 930);
    await createOk(60, 90, { note: 'اول' });
    await create({ content_id: 'episodes/episode-102', start_s: 5, end_s: 9 });

    const res = await app.inject({ method: 'GET', url: '/clips/library', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(3);
    expect(body.article_count).toBe(2);
    // episode-102's clip was made last, so its group leads
    expect(body.articles[0].content_id).toBe('episodes/episode-102');
    const g = body.articles[1];
    expect(g.content_id).toBe(EP);
    expect(g.folder).toBe('episodes');
    expect(g.folder_fa).toBeTruthy();
    expect(g.url).toBe('/episodes/episode-101.html');
    expect(g.title).not.toBe(EP); // resolved from the content index
    expect(g.count).toBe(2);
    expect(g.clips.map((c: any) => c.start_s)).toEqual([60, 900]);
    expect(g.clips[0].note).toBe('اول');
  });

  it('is empty, not an error, for a premium reader with no clips', async () => {
    await setTier('premium');
    const res = await app.inject({ method: 'GET', url: '/clips/library', headers: { cookie } });
    expect(res.json()).toEqual({ total: 0, article_count: 0, articles: [] });
  });
});

describe('PATCH /clips/:id', () => {
  beforeEach(() => setTier('premium'));

  it('moves one end and validates the pair against the stored other end', async () => {
    const clip = await createOk(100, 130);
    // moving the start past the stored end is refused
    const bad = await app.inject({ method: 'PATCH', url: '/clips/' + clip.id, headers: { cookie }, payload: { start_s: 131 } });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('clip_too_short');
    // moving the end too far is refused by the length rule
    const long = await app.inject({ method: 'PATCH', url: '/clips/' + clip.id, headers: { cookie }, payload: { end_s: 100 + MAX_CLIP_SECONDS + 5 } });
    expect(long.json().error).toBe('clip_too_long');
    // an honest nudge goes through, rounded
    const ok = await app.inject({ method: 'PATCH', url: '/clips/' + clip.id, headers: { cookie }, payload: { start_s: 98.94 } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().clip.start_s).toBe(98.9);
    expect(ok.json().clip.end_s).toBe(130);
  });

  it('clears a note with null, refuses an empty patch and a foreign id', async () => {
    const clip = await createOk(1, 9, { note: 'x' });
    const cleared = await app.inject({ method: 'PATCH', url: '/clips/' + clip.id, headers: { cookie }, payload: { note: null } });
    expect(cleared.json().clip.note).toBeNull();
    const empty = await app.inject({ method: 'PATCH', url: '/clips/' + clip.id, headers: { cookie }, payload: {} });
    expect(empty.statusCode).toBe(400);

    const other = await loginAs(app, '09121200105');
    const foreign = await app.inject({ method: 'PATCH', url: '/clips/' + clip.id, headers: { cookie: other }, payload: { note: 'دزدی' } });
    expect(foreign.statusCode).toBe(404);
    const del = await app.inject({ method: 'DELETE', url: '/clips/' + clip.id, headers: { cookie: other } });
    expect(del.statusCode).toBe(404);
    const stillThere = await app.inject({ method: 'GET', url: '/clips/' + clip.id, headers: { cookie } });
    expect(stillThere.statusCode).toBe(200);
  });

  it('a malformed id is a 404, not a database error', async () => {
    const res = await app.inject({ method: 'GET', url: '/clips/not-a-uuid', headers: { cookie } });
    expect(res.statusCode).toBe(404);
  });
});
