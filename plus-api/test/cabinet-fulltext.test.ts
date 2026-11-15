import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { MARK_START, MARK_END, MAX_BODY_CHARS } from '../src/services/cabinet-fulltext.js';

// Full-text search inside the cabinet's PDFs (migration 0075): the founder's
// tool uploads extracted text to two admin routes; a premium reader asks one
// route and gets ids + a short fragment, never a paper's text.
let app: FastifyInstance;
let cookie: string;
const phone = '09121200077';
const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

const TEXT_A = 'Results. Zirconia crowns cemented with a resin cement showed a survival rate of 96.4% after five years. '
  + 'Chipping of the veneering ceramic was the most frequent technical complication. '.repeat(3);
const TEXT_B = 'The connective tissue graft increased the keratinized mucosa width around implants. '
  + 'Marginal bone loss did not differ between groups at 12 months.';

async function upload(papers: unknown[]) {
  return app.inject({ method: 'POST', url: '/admin/cabinet-fulltext', headers: { authorization: basic }, payload: { papers } });
}
const search = (q: string, headers: Record<string, string> = { cookie }) =>
  app.inject({ method: 'GET', url: '/cabinet/fulltext?q=' + encodeURIComponent(q), headers });

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('cabinet full text', () => {
  it('the admin routes refuse anyone without the founder\'s credentials', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/cabinet-fulltext', payload: { papers: [] } });
    expect(res.statusCode).toBe(401);
    const inv = await app.inject({ method: 'GET', url: '/admin/cabinet-fulltext', headers: { cookie } });
    expect(inv.statusCode).toBe(401);
  });

  it('uploads, reports the inventory, and skips a paper whose text has not changed', async () => {
    const first = await upload([
      { id: 'P0001', text: TEXT_A, pages: 9, sha256: sha(TEXT_A) },
      { id: 'P0002', text: TEXT_B, pages: 7, sha256: sha(TEXT_B) },
    ]);
    expect(first.statusCode).toBe(200);
    expect(first.json().written).toBe(2);
    const again = await upload([{ id: 'P0001', text: TEXT_A, pages: 9, sha256: sha(TEXT_A) }]);
    expect(again.json().written, 'same sha256 = no write').toBe(0);
    const inv = await app.inject({ method: 'GET', url: '/admin/cabinet-fulltext', headers: { authorization: basic } });
    expect(inv.json().count).toBe(2);
    expect(inv.json().papers[0]).toEqual({ id: 'P0001', sha256: sha(TEXT_A), pages: 9 });
  });

  it('400s a malformed upload instead of writing part of it', async () => {
    expect((await upload([{ id: 'X1', text: 'a', sha256: sha('a') }])).json().error).toBe('invalid_id');
    expect((await upload([{ id: 'P0003', text: '  ', sha256: sha('') }])).json().error).toBe('empty_text');
    expect((await upload([{ id: 'P0003', text: 'a', sha256: 'nope' }])).json().error).toBe('invalid_sha256');
    expect((await pool.query('select count(*)::int as n from cabinet_fulltext')).rows[0].n).toBe(0);
  });

  it('finds a sentence inside a paper, stemmed, with a marked fragment and no text beyond it', async () => {
    await upload([
      { id: 'P0001', text: TEXT_A, pages: 9, sha256: sha(TEXT_A) },
      { id: 'P0002', text: TEXT_B, pages: 7, sha256: sha(TEXT_B) },
    ]);
    const res = await search('survival rates zirconia');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.indexed).toBe(2);
    expect(body.results.map((r: any) => r.id)).toEqual(['P0001']);
    const snip = body.results[0].snippet as string;
    expect(snip).toContain(MARK_START + 'survival' + MARK_END);
    expect(snip.split(/\s+/).length).toBeLessThanOrEqual(40);
    expect(snip.length).toBeLessThan(TEXT_A.length);
  });

  it('reads web-search syntax: a quoted phrase, OR, and -exclusion', async () => {
    await upload([
      { id: 'P0001', text: TEXT_A, pages: 9, sha256: sha(TEXT_A) },
      { id: 'P0002', text: TEXT_B, pages: 7, sha256: sha(TEXT_B) },
    ]);
    expect((await search('"marginal bone loss"')).json().results.map((r: any) => r.id)).toEqual(['P0002']);
    const either = (await search('chipping OR keratinized')).json().results.map((r: any) => r.id).sort();
    expect(either).toEqual(['P0001', 'P0002']);
    expect((await search('implants -keratinized')).json().results).toEqual([]);
  });

  it('keeps an oversized PDF searchable by cutting its text, not failing the batch', async () => {
    const huge = ('Lithium disilicate fatigue under cyclic loading.\n').repeat(Math.ceil(MAX_BODY_CHARS / 40) + 2000);
    const res = await upload([{ id: 'P0009', text: huge, pages: 400, sha256: sha(huge) }]);
    expect(res.statusCode).toBe(200);
    const len = (await pool.query(`select length(body) as n from cabinet_fulltext where paper_id = 'P0009'`)).rows[0].n;
    expect(len).toBeLessThanOrEqual(MAX_BODY_CHARS);
    expect((await search('lithium disilicate')).json().results[0].id).toBe('P0009');
  });

  it('is premium: a free reader gets 402, a guest 401', async () => {
    await pool.query(`update profiles set tier = 'free' where phone = $1`, [phone]);
    expect((await search('zirconia')).statusCode).toBe(402);
    expect((await search('zirconia', {})).statusCode).toBe(401);
  });

  it('a removed paper leaves the index', async () => {
    await upload([{ id: 'P0001', text: TEXT_A, pages: 9, sha256: sha(TEXT_A) }]);
    const del = await app.inject({
      method: 'POST', url: '/admin/cabinet-fulltext/delete', headers: { authorization: basic }, payload: { ids: ['P0001'] },
    });
    expect(del.json().deleted).toBe(1);
    expect((await search('zirconia')).json().results).toEqual([]);
  });
});
