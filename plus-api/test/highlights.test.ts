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

    // card_state row exists, box 1, and SCHEDULED a day out rather than due now.
    // It used to be inserted with a null next_review_at, which every due check
    // reads as "due" — so a highlight was answerable the instant it was written,
    // and that is what the 2026-08-08 review farm ran on (routes/highlights.ts).
    const cs = await pool.query<{ box: number; next_review_at: string }>(
      'select box, next_review_at from card_state where highlight_id = $1',
      [hl.id],
    );
    expect(cs.rowCount).toBe(1);
    expect(cs.rows[0].box).toBe(1);
    const hours = (new Date(cs.rows[0].next_review_at).getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(23);
    expect(hours).toBeLessThan(25);

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
    // SOFT since migration 0066: the card is NOT cascaded away. It waits, box
    // intact, for the undo that the workbench can now offer.
    const cs = await pool.query('select count(*)::int as n from card_state where highlight_id = $1', [id]);
    expect(cs.rows[0].n).toBe(1);
    const gone = await app.inject({ method: 'GET', url: '/highlights?content_id=resin-cements-overview', headers: { cookie } });
    expect(gone.json().highlights).toHaveLength(0);
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

describe('soft delete + restore (migration 0066 — the inverse of «حذف» for undo)', () => {
  async function create(payload = sampleHighlight): Promise<string> {
    const res = await app.inject({ method: 'POST', url: '/highlights', headers: { cookie }, payload });
    expect(res.statusCode).toBe(201);
    return res.json().highlight.id as string;
  }
  const list = async () =>
    (await app.inject({ method: 'GET', url: '/highlights?content_id=resin-cements-overview', headers: { cookie } })).json().highlights;

  it('restore brings back the SAME id with its card box untouched', async () => {
    const id = await create();
    // climb the card to box 3 so the restore has something to preserve
    await pool.query('update card_state set box = 3 where highlight_id = $1', [id]);

    expect((await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } })).statusCode).toBe(200);
    expect(await list()).toHaveLength(0);

    const res = await app.inject({ method: 'POST', url: `/highlights/${id}/restore`, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().highlight.id).toBe(id);
    expect(res.json().highlight.exact).toBe(sampleHighlight.exact);
    expect(res.json().highlight.note).toBe(sampleHighlight.note);

    const back = await list();
    expect(back).toHaveLength(1);
    expect(back[0].id).toBe(id);
    const cs = await pool.query<{ box: number }>('select box from card_state where highlight_id = $1', [id]);
    expect(cs.rows[0].box).toBe(3);
  });

  it('logs highlight_restored and never a second highlight_created (no XP for pressing ↶)', async () => {
    const id = await create();
    await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } });
    await app.inject({ method: 'POST', url: `/highlights/${id}/restore`, headers: { cookie } });
    const acts = await pool.query<{ action: string; n: number }>(
      `select action, count(*)::int as n from user_activity group by action order by action`,
    );
    const byAction = Object.fromEntries(acts.rows.map((r) => [r.action, r.n]));
    expect(byAction.highlight_created).toBe(1);
    expect(byAction.highlight_deleted).toBe(1);
    expect(byAction.highlight_restored).toBe(1);
  });

  it('a repeat delete and a restore of a live row are both 404 — the client stack advances only on success', async () => {
    const id = await create();
    expect((await app.inject({ method: 'POST', url: `/highlights/${id}/restore`, headers: { cookie } })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } })).statusCode).toBe(404);
    // still exactly one deleted event
    const n = await pool.query(`select count(*)::int as n from user_activity where action = 'highlight_deleted'`);
    expect(n.rows[0].n).toBe(1);
  });

  it('a deleted highlight cannot be patched, restored by someone else, or pinned', async () => {
    const id = await create();
    await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } });
    const patch = await app.inject({ method: 'PATCH', url: `/highlights/${id}`, headers: { cookie }, payload: { note: 'x' } });
    expect(patch.statusCode).toBe(404);
    const other = await loginAs(app, '09121200002');
    const theirs = await app.inject({ method: 'POST', url: `/highlights/${id}/restore`, headers: { cookie: other } });
    expect(theirs.statusCode).toBe(404);
    // still deleted for the owner
    expect(await list()).toHaveLength(0);
  });

  it('is invisible to every count while deleted: recent totals and the due-card bell', async () => {
    const id = await create();
    await pool.query(`update profiles set tier = 'premium'`);
    await pool.query('update card_state set next_review_at = now() - interval \'1 hour\' where highlight_id = $1', [id]);

    const before = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(before.json().due_card_count).toBe(1);
    expect((await app.inject({ method: 'GET', url: '/highlights/recent', headers: { cookie } })).json().total).toBe(1);

    await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } });
    const during = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(during.json().due_card_count).toBe(0);
    expect((await app.inject({ method: 'GET', url: '/highlights/recent', headers: { cookie } })).json().total).toBe(0);

    await app.inject({ method: 'POST', url: `/highlights/${id}/restore`, headers: { cookie } });
    const after = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(after.json().due_card_count).toBe(1);
  });

  it('a collection pin hides with its highlight and comes back with it', async () => {
    await pool.query(`update profiles set tier = 'premium'`);
    const id = await create();
    const col = await app.inject({ method: 'POST', url: '/collections', headers: { cookie }, payload: { title: 'بورد' } });
    expect(col.statusCode).toBe(201);
    const colId = col.json().collection.id;
    const pin = await app.inject({ method: 'POST', url: `/collections/${colId}/items`, headers: { cookie }, payload: { highlight_id: id } });
    expect(pin.statusCode).toBe(201);

    const board = async () => (await app.inject({ method: 'GET', url: `/collections/${colId}`, headers: { cookie } })).json().items;
    const shelf = async () => (await app.inject({ method: 'GET', url: '/collections', headers: { cookie } })).json().collections[0];
    expect(await board()).toHaveLength(1);
    expect((await shelf()).item_count).toBe(1);

    await app.inject({ method: 'DELETE', url: `/highlights/${id}`, headers: { cookie } });
    expect(await board()).toHaveLength(0);
    expect((await shelf()).item_count).toBe(0);
    // the pin row itself was never touched
    const rows = await pool.query('select count(*)::int as n from collection_items where highlight_id = $1', [id]);
    expect(rows.rows[0].n).toBe(1);
    // and a deleted highlight cannot be pinned afresh
    const again = await app.inject({ method: 'POST', url: `/collections/${colId}/items`, headers: { cookie }, payload: { highlight_id: id } });
    expect(again.statusCode).toBe(404);

    await app.inject({ method: 'POST', url: `/highlights/${id}/restore`, headers: { cookie } });
    expect(await board()).toHaveLength(1);
    expect((await shelf()).item_count).toBe(1);
  });
});
