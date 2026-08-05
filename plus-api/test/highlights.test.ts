import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';

let app: FastifyInstance;
let cookie: string;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, '09121200001');
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const sampleHighlight = {
  content_id: 'resin-cements-overview',
  exact: 'پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است',
  prefix: 'باید توجه داشت که ',
  suffix: '.',
  color: 'yellow',
  underline: false,
  cloze_markers: [[0, 5]],
  note: 'مهم برای بورد',
  label: 'important',
  content_hash: 'abc123',
};

describe('highlights CRUD + anchoring round-trip', () => {
  it('creates a highlight, its card_state row, and logs the event', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/highlights',
      headers: { cookie },
      payload: sampleHighlight,
    });
    expect(res.statusCode).toBe(201);
    const hl = res.json().highlight;
    expect(hl.id).toBeTruthy();
    expect(hl.exact).toBe(sampleHighlight.exact);
    expect(hl.label).toBe('important');
    expect(hl.cloze_markers).toEqual([[0, 5]]);

    // card_state row exists, box 1, next_review_at null
    const cs = await pool.query(
      'select box, next_review_at from card_state where highlight_id = $1',
      [hl.id],
    );
    expect(cs.rowCount).toBe(1);
    expect(cs.rows[0].box).toBe(1);
    expect(cs.rows[0].next_review_at).toBeNull();

    // activity logged
    const act = await pool.query(
      `select count(*)::int as n from user_activity where action = 'highlight_created'`,
    );
    expect(act.rows[0].n).toBe(1);
  });

  it('round-trips anchoring fields for re-anchoring on load', async () => {
    await app.inject({ method: 'POST', url: '/highlights', headers: { cookie }, payload: sampleHighlight });

    const res = await app.inject({
      method: 'GET',
      url: '/highlights?content_id=resin-cements-overview',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const list = res.json().highlights;
    expect(list).toHaveLength(1);
    const h = list[0];
    // exact + prefix + suffix survive so the client can re-anchor
    expect(h.exact).toBe(sampleHighlight.exact);
    expect(h.prefix).toBe(sampleHighlight.prefix);
    expect(h.suffix).toBe(sampleHighlight.suffix);
  });

  it('scopes highlights to the owner', async () => {
    await app.inject({ method: 'POST', url: '/highlights', headers: { cookie }, payload: sampleHighlight });
    const other = await loginAs(app, '09121200002');
    const res = await app.inject({
      method: 'GET',
      url: '/highlights?content_id=resin-cements-overview',
      headers: { cookie: other },
    });
    expect(res.json().highlights).toHaveLength(0);
  });

  it('updates note/label and deletes (cascading card_state)', async () => {
    const create = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie }, payload: sampleHighlight,
    });
    const id = create.json().highlight.id;

    const patch = await app.inject({
      method: 'PATCH', url: `/highlights/${id}`, headers: { cookie },
      payload: { note: 'ویرایش شد', label: 'clinical_pearl' },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().highlight.note).toBe('ویرایش شد');
    expect(patch.json().highlight.label).toBe('clinical_pearl');

    const del = await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);
    const cs = await pool.query('select count(*)::int as n from card_state where highlight_id = $1', [id]);
    expect(cs.rows[0].n).toBe(0); // cascaded
  });

  it('accepts a highlight with null optional fields (workbench with no label)', async () => {
    // The workbench sends explicit nulls for unset fields; the API must accept
    // them (regression: previously rejected with 400 so highlighting never worked).
    const res = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: {
        content_id: 'resin-cements-overview',
        exact: 'یک هایلایت بدون برچسب',
        prefix: 'قبل ', suffix: ' بعد',
        color: 'green', underline: false, cloze_markers: [],
        note: null, label: null, content_hash: 'h',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().highlight.label).toBeNull();
  });

  it('rejects an invalid label', async () => {
    const res = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { ...sampleHighlight, label: 'bogus' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_label');
  });

  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/highlights?content_id=x' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /activity', () => {
  it('appends card_reviewed_manual WITHOUT touching card_state', async () => {
    // create a highlight so a card_state row exists
    const create = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie }, payload: sampleHighlight,
    });
    const hlId = create.json().highlight.id;
    const before = await pool.query(
      'select box, next_review_at, reviewed_count, updated_at from card_state where highlight_id = $1',
      [hlId],
    );

    const res = await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'card_reviewed_manual', content_id: 'resin-cements-overview', meta: { highlight_id: hlId } },
    });
    expect(res.statusCode).toBe(200);

    const after = await pool.query(
      'select box, next_review_at, reviewed_count, updated_at from card_state where highlight_id = $1',
      [hlId],
    );
    expect(after.rows[0]).toEqual(before.rows[0]); // card_state untouched

    const logged = await pool.query(
      `select count(*)::int as n from user_activity where action = 'card_reviewed_manual'`,
    );
    expect(logged.rows[0].n).toBe(1);
  });

  it('rejects a malformed action', async () => {
    const res = await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'NOT VALID action!!' },
    });
    expect(res.statusCode).toBe(400);
  });
});

// The premium library (/plus/highlights.html): every highlight, grouped by the
// article it came from. Built after a reader reported that highlights spread
// over dozens of articles were effectively unreachable — the dashboard's short
// recent list was the only surface (2026-08-05).
describe('GET /highlights/library (premium)', () => {
  async function add(contentId: string, exact: string, label: string | null = null) {
    const res = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: contentId, exact, label },
    });
    expect(res.statusCode).toBe(201);
    return res.json().highlight.id as string;
  }

  it('blocks a free user with 402 (the aggregated VIEW is the premium boundary)', async () => {
    await add('insight/insight-1', 'یک نکته');
    const res = await app.inject({ method: 'GET', url: '/highlights/library', headers: { cookie } });
    expect(res.statusCode).toBe(402);
    expect(res.json().error).toBe('premium_required');
  });

  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/highlights/library' });
    expect(res.statusCode).toBe(401);
  });

  it('groups every highlight by article, newest-touched article first', async () => {
    await add('insight/insight-1', 'اولین نکته‌ی مقاله‌ی یک');
    await add('insight/insight-1', 'دومین نکته‌ی مقاله‌ی یک', 'important');
    await add('notecast/notecast-1', 'تنها نکته‌ی نوت‌کست');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200001'`);

    const res = await app.inject({ method: 'GET', url: '/highlights/library', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(3);
    expect(body.article_count).toBe(2);

    // The most recently highlighted article leads.
    expect(body.articles[0].content_id).toBe('notecast/notecast-1');
    expect(body.articles[0].count).toBe(1);
    expect(body.articles[0].folder).toBe('notecast');

    const insight = body.articles[1];
    expect(insight.content_id).toBe('insight/insight-1');
    expect(insight.count).toBe(2);
    // Within an article, creation order (roughly reading order) is preserved.
    expect(insight.highlights.map((h: { exact: string }) => h.exact)).toEqual([
      'اولین نکته‌ی مقاله‌ی یک', 'دومین نکته‌ی مقاله‌ی یک',
    ]);
    // Bodies AND notes come through: the page must be readable without opening
    // the article — that is the whole point of the endpoint.
    expect(insight.highlights[1].label).toBe('important');
    expect(insight.url).toBeTruthy();
  });

  it('answers an empty library instead of erroring', async () => {
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200001'`);
    const res = await app.inject({ method: 'GET', url: '/highlights/library', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ total: 0, article_count: 0, articles: [] });
  });
});

describe('GET /highlights/recent', () => {
  it('carries whole-library counts alongside the page, on a free plan too', async () => {
    for (const [cid, text] of [
      ['insight/insight-1', 'یک'], ['insight/insight-1', 'دو'], ['notecast/notecast-1', 'سه'],
    ]) {
      await app.inject({
        method: 'POST', url: '/highlights', headers: { cookie },
        payload: { content_id: cid, exact: text },
      });
    }
    const res = await app.inject({ method: 'GET', url: '/highlights/recent?limit=2', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.highlights).toHaveLength(2); // the page
    expect(body.total).toBe(3);              // ...but the truth about the library
    expect(body.article_count).toBe(2);
  });
});
