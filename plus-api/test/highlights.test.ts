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
