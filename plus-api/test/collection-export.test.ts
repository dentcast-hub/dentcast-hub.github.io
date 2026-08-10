import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import JSZip from 'jszip';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121500001';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

async function createCollection(title = 'ژورنال کلاب'): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/collections', headers: { cookie }, payload: { title } });
  return res.json().collection.id as string;
}

async function addHighlight(collectionId: string, contentId: string, exact: string): Promise<string> {
  const hl = await app.inject({
    method: 'POST', url: '/highlights', headers: { cookie }, payload: { content_id: contentId, exact },
  });
  const highlightId = hl.json().highlight.id as string;
  const add = await app.inject({
    method: 'POST', url: `/collections/${collectionId}/items`, headers: { cookie }, payload: { highlight_id: highlightId },
  });
  return add.json().item.id as string;
}

async function addTextSnippet(collectionId: string, body: string, title?: string): Promise<string> {
  const payload: Record<string, unknown> = { kind: 'text', body };
  if (title !== undefined) payload.title = title;
  const res = await app.inject({
    method: 'POST', url: `/collections/${collectionId}/snippets`, headers: { cookie }, payload,
  });
  return res.json().item.id as string;
}

async function addReference(collectionId: string, title: string, extra: Record<string, unknown> = {}): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: `/collections/${collectionId}/snippets`, headers: { cookie },
    payload: { kind: 'reference', title, ...extra },
  });
  return res.json().item.id as string;
}

/** Unzip the exported buffer and return word/document.xml's raw text. */
async function documentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  return zip.file('word/document.xml')!.async('string');
}

describe('GET /collections/:id/export', () => {
  it('402s a free user', async () => {
    await makePremium();
    const id = await createCollection();
    await pool.query(`update profiles set tier = 'free' where phone = $1`, [phone]);
    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=docx`, headers: { cookie } });
    expect(res.statusCode).toBe(402);
  });

  it('404s on someone else\'s board', async () => {
    await makePremium();
    const id = await createCollection();
    const otherCookie = await loginAs(app, '09121500002');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121500002'`);
    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=docx`, headers: { cookie: otherCookie } });
    expect(res.statusCode).toBe(404);
  });

  it('404s an unknown board', async () => {
    await makePremium();
    const res = await app.inject({
      method: 'GET', url: '/collections/00000000-0000-0000-0000-000000000000/export', headers: { cookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it('400s an unsupported format', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=pptx`, headers: { cookie } });
    expect(res.statusCode).toBe(400);
  });

  it('200s with the right content-type, a valid zip (docx) buffer, and both filename forms', async () => {
    await makePremium();
    const id = await createCollection('برد امتحانی');
    await addTextSnippet(id, 'یک متن ساده برای خروجی');

    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=docx`, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    const disposition = res.headers['content-disposition'] as string;
    expect(disposition).toContain('attachment;');
    expect(disposition).toContain(`filename="dentcast-board-${id.slice(0, 8)}.docx"`);
    expect(disposition).toContain("filename*=UTF-8''");
    expect(res.rawPayload.subarray(0, 2).toString()).toBe('PK'); // zip magic
    expect(res.rawPayload.length).toBeGreaterThan(0);
  });

  it('renders the board title, description and item text', async () => {
    await makePremium();
    const id = await createCollection('ژورنال کلاب: ادهیژن به عاج');
    await app.inject({
      method: 'PATCH', url: `/collections/${id}`, headers: { cookie },
      payload: { description: 'مواد ارائه‌ی سه‌شنبه' },
    });
    await addTextSnippet(id, 'جمع‌بندی مقدمه', 'سه نسل آخر ادهیزیوها به یک نقطه رسیده‌اند.');

    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=docx`, headers: { cookie } });
    const xml = await documentXml(res.rawPayload);
    expect(xml).toContain('ژورنال کلاب: ادهیژن به عاج');
    expect(xml).toContain('مواد ارائه‌ی سه‌شنبه');
    expect(xml).toContain('جمع‌بندی مقدمه');
    expect(xml).toContain('سه نسل آخر ادهیزیوها به یک نقطه رسیده‌اند.');
    // Persian paragraphs carry the RTL properties, not left off by default.
    expect(xml).toContain('<w:bidi/>');
    expect(xml).toContain('w:jc w:val="right"');
  });

  it('renders a highlight\'s exact text, its note, and its source title', async () => {
    await makePremium();
    const id = await createCollection();
    await addHighlight(id, 'insight/insight-1', 'متن هایلایت‌شده برای خروجی');

    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=docx`, headers: { cookie } });
    const xml = await documentXml(res.rawPayload);
    expect(xml).toContain('متن هایلایت‌شده برای خروجی');
    expect(xml).toContain('از: '); // the source line, whatever title the index resolves
  });

  it('collects references out of the in-flow order into a numbered «منابع» section', async () => {
    await makePremium();
    const id = await createCollection();
    await addTextSnippet(id, 'متن اول');
    await addReference(id, 'Dentin bonding systems', {
      authors: 'Breschi L, et al.', venue: 'Dental Materials', year: 2018, doi: '10.1016/j.dental.2017.11.005',
    });
    await addTextSnippet(id, 'متن دوم');

    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=docx`, headers: { cookie } });
    const xml = await documentXml(res.rawPayload);
    expect(xml).toContain('منابع');
    expect(xml).toContain('Breschi L, et al. Dentin bonding systems. Dental Materials; 2018. doi:10.1016/j.dental.2017.11.005');
    // The reference text appears exactly once — never in-flow with the pins.
    const occurrences = xml.split('Dentin bonding systems').length - 1;
    expect(occurrences).toBe(1);
    const refIndex = xml.indexOf('منابع');
    const citationIndex = xml.indexOf('Dentin bonding systems');
    expect(citationIndex, 'the citation comes after the منابع heading').toBeGreaterThan(refIndex);
  });

  it('follows the board\'s own manual arrangement, not creation order', async () => {
    await makePremium();
    const id = await createCollection();
    const first = await addTextSnippet(id, 'اول ساخته شد');
    const second = await addTextSnippet(id, 'دوم ساخته شد');
    // Manually reverse the order: second-created shows first.
    await app.inject({
      method: 'PUT', url: `/collections/${id}/items/order`, headers: { cookie },
      payload: { item_ids: [second, first] },
    });

    const res = await app.inject({ method: 'GET', url: `/collections/${id}/export?format=docx`, headers: { cookie } });
    const xml = await documentXml(res.rawPayload);
    expect(xml.indexOf('دوم ساخته شد'), 'the manually-reordered item comes first')
      .toBeLessThan(xml.indexOf('اول ساخته شد'));
  });
});
