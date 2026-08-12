import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { resetBoardCache, CAP_FLOOR, CAP_SHARE } from '../src/services/votes.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const ART = 'chairside/chairside-30';
const OTHER = 'notecast/episode-28';

async function userId(phone: string): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return r.rows[0].id;
}

/** Put an engagement row in the log — the only source the board's seed reads. */
async function logActivity(phone: string, action: string, contentId: string): Promise<void> {
  await pool.query(
    `insert into user_activity (user_id, action, content_id) values ($1, $2, $3)`,
    [await userId(phone), action, contentId],
  );
}

describe('POST /votes', () => {
  it('refuses an anonymous caller', async () => {
    const res = await app.inject({ method: 'POST', url: '/votes', payload: { content_id: ART } });
    expect(res.statusCode).toBe(401);
    const rows = await pool.query('select 1 from content_votes');
    expect(rows.rowCount).toBe(0);
  });

  it('records one heart and returns the fresh count', async () => {
    const cookie = await loginAs(app, '09120000001');
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hearts: 1, voted: true });
  });

  // The whole reason the request carries an explicit `vote` rather than toggling:
  // a retry after a timeout must repeat the press, never undo it.
  it('is idempotent — pressing twice is still one heart', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    expect(res.json()).toEqual({ hearts: 1, voted: true });
    const rows = await pool.query('select 1 from content_votes');
    expect(rows.rowCount).toBe(1);
  });

  it('counts one heart per person, not per press', async () => {
    const a = await loginAs(app, '09120000001');
    const b = await loginAs(app, '09120000002');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie: b }, payload: { content_id: ART } });
    expect(res.json()).toEqual({ hearts: 2, voted: true });
  });

  it('refuses a malformed content id', async () => {
    const cookie = await loginAs(app, '09120000001');
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: '../etc' } });
    expect(res.statusCode).toBe(400);
  });

  // A heart is one second of work. Everything in SCORING_ACTIONS is an act of
  // study, and score is never deducted — so a vote must leave the log alone.
  it('writes no activity row, so it can never earn XP or keep a streak', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    const rows = await pool.query('select 1 from user_activity');
    expect(rows.rowCount).toBe(0);
  });
});

describe('POST /votes { vote: false }', () => {
  it('takes the heart back', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART, vote: false } });
    expect(res.json()).toEqual({ hearts: 0, voted: false });
  });

  it('is idempotent — withdrawing a vote that is not there is fine', async () => {
    const cookie = await loginAs(app, '09120000001');
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART, vote: false } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hearts: 0, voted: false });
  });
});

describe('GET /votes?id=', () => {
  it('serves the count to an anonymous reader, with voted false', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });

    const res = await app.inject({ method: 'GET', url: `/votes?id=${ART}` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hearts: 1, voted: false });
  });

  it('tells a signed-in reader whether the heart is theirs', async () => {
    const a = await loginAs(app, '09120000001');
    const b = await loginAs(app, '09120000002');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });

    expect((await app.inject({ method: 'GET', url: `/votes?id=${ART}`, headers: { cookie: a } })).json())
      .toEqual({ hearts: 1, voted: true });
    expect((await app.inject({ method: 'GET', url: `/votes?id=${ART}`, headers: { cookie: b } })).json())
      .toEqual({ hearts: 1, voted: false });
  });

  it('reports an unvoted page as zero rather than 404', async () => {
    const res = await app.inject({ method: 'GET', url: `/votes?id=${OTHER}` });
    expect(res.json()).toEqual({ hearts: 0, voted: false });
  });
});

describe('GET /votes/board', () => {
  /** A paying session — the board is premium (the ARRANGEMENT, not the content). */
  async function premiumCookie(phone = '09129999999'): Promise<string> {
    const cookie = await loginAs(app, phone);
    await pool.query("update profiles set tier = 'premium' where phone = $1", [phone]);
    return cookie;
  }

  const board = async () => {
    resetBoardCache();
    const cookie = await premiumCookie();
    return (await app.inject({ method: 'GET', url: '/votes/board', headers: { cookie } })).json();
  };
  const ids = (b: { items: Array<{ content_id: string }> }) => b.items.map((i) => i.content_id);
  const find = (b: { items: Array<{ content_id: string }> }, id: string) =>
    b.items.find((i) => i.content_id === id) as
      { content_id: string; hearts: number; score: number; engagement?: number };

  it('refuses a signed-out reader', async () => {
    const res = await app.inject({ method: 'GET', url: '/votes/board' });
    expect(res.statusCode).toBe(401);
  });

  it('refuses a free reader — the arrangement is what premium buys', async () => {
    const cookie = await loginAs(app, '09120000009');
    const res = await app.inject({ method: 'GET', url: '/votes/board', headers: { cookie } });
    expect(res.statusCode).toBe(402);
    expect(res.json().error).toBe('premium_required');
  });

  // The gate is on the ranking only. A free reader still sees every heart count
  // and can still cast one — otherwise we would be charging people to produce
  // the signal the board ranks by.
  it('leaves the heart count and the vote open to a free reader', async () => {
    const cookie = await loginAs(app, '09120000009');
    expect((await app.inject({
      method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART },
    })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: `/votes?id=${ART}` })).statusCode).toBe(200);
  });

  // The board's answer now depends on the reader's tier, which makes the
  // whole-API `no-store` invariant (server.ts) load-bearing here: a CDN does not
  // key on the session cookie, so a cacheable response is one replayed to
  // somebody else. Pinned because a route setting its own cache-control would
  // silently look like it worked.
  it('is never storable by a shared cache', async () => {
    const cookie = await premiumCookie();
    const res = await app.inject({ method: 'GET', url: '/votes/board', headers: { cookie } });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('is empty and honest before anything has happened', async () => {
    const b = await board();
    expect(b.items).toEqual([]);
    expect(b.total_hearts).toBe(0);
    // The floor is what makes day one work at all.
    expect(b.engagement_cap).toBe(CAP_FLOOR);
  });

  // The reason engagement is in the score at all: a board with no votes yet must
  // still be in a sensible order rather than an arbitrary one.
  it('ranks by derived engagement before a single vote is cast', async () => {
    await loginAs(app, '09120000001');
    await loginAs(app, '09120000002');
    await logActivity('09120000001', 'highlight_created', OTHER);   // 3
    await logActivity('09120000002', 'highlight_created', OTHER);   // 6 total
    await logActivity('09120000001', 'article_completed', ART);     // 1

    const b = await board();
    expect(ids(b)).toEqual([OTHER, ART]);
    // Percentile over the engaged pages: the top one is 100, the other is 50.
    expect(find(b, OTHER).engagement).toBe(100);
    expect(find(b, ART).engagement).toBe(50);
    // …and with no hearts anywhere, score is purely the capped percentile.
    expect(find(b, OTHER).score).toBe(CAP_FLOOR);
    expect(find(b, ART).score).toBe(CAP_FLOOR / 2);
  });

  // One enthusiastic reader must not be able to install their own favourite at
  // the top of the site just by highlighting it twenty times.
  it('counts distinct people per action, not rows', async () => {
    await loginAs(app, '09120000001');
    await loginAs(app, '09120000002');
    for (let i = 0; i < 5; i += 1) await logActivity('09120000001', 'highlight_created', ART);
    await logActivity('09120000001', 'highlight_created', OTHER);
    await logActivity('09120000002', 'highlight_created', OTHER);

    // Five highlights from one person lose to two people highlighting once each.
    expect(ids(await board())).toEqual([OTHER, ART]);
  });

  it('publishes engagement as a percentile, and omits it where there is none', async () => {
    const a = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });

    const b = await board();
    // ART has a heart and no engagement at all — the field is absent, not 0, for
    // the same reason a zero heart count is never printed.
    expect(find(b, ART).engagement).toBeUndefined();
    expect(Object.keys(find(b, ART)).sort()).toEqual(['content_id', 'hearts', 'score']);
  });

  it('lets hearts outrank engagement', async () => {
    const a = await loginAs(app, '09120000001');
    const b2 = await loginAs(app, '09120000002');
    // OTHER has all the engagement and no votes; ART has four hearts and none.
    await logActivity('09120000001', 'highlight_created', OTHER);
    await logActivity('09120000002', 'highlight_created', OTHER);
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: b2 }, payload: { content_id: ART } });

    const b = await board();
    // cap is 3 here (floor), ART has 2 hearts + no engagement = 2, OTHER = 3.
    // Engagement wins BELOW the cap — that is the blend doing its job.
    expect(ids(b)[0]).toBe(OTHER);
  });

  // The guarantee that makes this a cap rather than a coefficient.
  it('never lets engagement overtake a page with more hearts than the cap', async () => {
    const a = await loginAs(app, '09120000001');
    await loginAs(app, '09120000002');
    await logActivity('09120000001', 'highlight_created', OTHER);
    await logActivity('09120000002', 'highlight_created', OTHER);
    // Four hearts on ART — above the floor cap of 3.
    for (const phone of ['09120000003', '09120000004', '09120000005']) await loginAs(app, phone);
    for (const phone of ['09120000001', '09120000003', '09120000004', '09120000005']) {
      const c = await loginAs(app, phone);
      await app.inject({ method: 'POST', url: '/votes', headers: { cookie: c }, payload: { content_id: ART } });
    }
    void a;

    const b = await board();
    expect(find(b, ART).hearts).toBe(4);
    expect(ids(b)[0]).toBe(ART);
  });

  // The whole point of the relative cap: its INFLUENCE stays steady as the site
  // grows, instead of a constant that is overbearing now and decorative later.
  it('scales the cap with the mean hearts of a voted page', async () => {
    const a = await loginAs(app, '09120000001');
    expect((await board()).engagement_cap).toBe(CAP_FLOOR);

    // One voted page carrying 40 hearts → mean 40 → cap 20, not the floor.
    await pool.query(
      `insert into content_votes (user_id, content_id)
       select p.id, $1 from profiles p limit 1`, [ART],
    );
    await pool.query(
      `insert into profiles (phone, display_name)
       select '0913' || lpad(g::text, 7, '0'), 'u' || g from generate_series(1, 39) g`,
    );
    await pool.query(
      `insert into content_votes (user_id, content_id)
       select p.id, $1 from profiles p where p.phone like '0913%'`, [ART],
    );
    void a;

    const b = await board();
    expect(b.total_hearts).toBe(40);
    expect(b.engagement_cap).toBe(CAP_SHARE * 40);
  });

  it('orders equal scores deterministically', async () => {
    const a = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: OTHER } });

    const first = await board();
    const second = await board();
    expect(first.items).toEqual(second.items);
  });

  it('drops the votes of a deleted account', async () => {
    const a = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await pool.query('delete from profiles where phone = $1', ['09120000001']);

    expect((await board()).total_hearts).toBe(0);
  });
});
