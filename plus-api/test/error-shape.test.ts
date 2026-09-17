// What an error looks like from outside.
//
// Fastify's default handler puts an unhandled error's own `message` and `code`
// in the response body. Every route that took an id from the URL straight into
// a query therefore answered a typo with the driver's own words —
// `{"statusCode":500,"code":"22P02","message":"invalid input syntax for type
// uuid: \"xyz\""}` — across seventeen reader routes and eight admin ones
// (2026-09-17). Only clips.ts guarded its own id, which is the shape of the
// problem: a per-route guard is the thing the next route forgets.
//
// It is answered once, in server.ts's error handler, so no future route can
// drift past it. These are the three outcomes that handler has to keep apart.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { buildServer } from '../src/server.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200411';

const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
  // Most of these routes are premium; without this the gate answers 402 and the
  // id never reaches a query, which is not what is under test here.
  await pool.query("update profiles set tier = 'premium' where phone = $1", [phone]);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

/** Every route that takes a uuid straight out of the path. */
const READER_ROUTES: Array<[string, string, object?]> = [
  ['GET', '/collections/xyz'],
  ['PATCH', '/collections/xyz', { title: 'x' }],
  ['DELETE', '/collections/xyz'],
  ['GET', '/collections/xyz/export?format=docx'],
  ['POST', '/collections/xyz/items', { content_id: 'insight/insight-1' }],
  ['POST', '/collections/xyz/snippets', { kind: 'text', body: 'x' }],
  ['PUT', '/collections/xyz/items/order', { item_ids: [] }],
  ['PATCH', '/snippets/xyz', { body: 'x' }],
  ['DELETE', '/snippets/xyz'],
  ['PATCH', '/highlights/xyz', { note: 'x' }],
  ['DELETE', '/highlights/xyz'],
  ['POST', '/highlights/xyz/restore'],
  ['GET', '/support/tickets/xyz'],
  ['POST', '/support/tickets/xyz/messages', { body: 'یک پیام به اندازه‌ی کافی بلند برای عبور از اعتبارسنجی' }],
  ['POST', '/support/tickets/xyz/close'],
  ['POST', '/support/tickets/xyz/reopen'],
];

const ADMIN_ROUTES: Array<[string, string, object?]> = [
  ['GET', '/admin/support/xyz'],
  ['POST', '/admin/support/xyz/reply', { body: 'x' }],
  ['POST', '/admin/support/messages/xyz/publish', { public: true }],
  ['POST', '/admin/exam-attempts/xyz/rule', { decision: 'pass' }],
  ['POST', '/admin/certificates/revoke', { id: 'xyz' }],
];

describe('a malformed id is the caller\'s mistake, not a 500', () => {
  it('answers every reader route 400 invalid_input, with nothing internal in it', async () => {
    for (const [method, url, payload] of READER_ROUTES) {
      const res = await app.inject({ method: method as 'GET', url, headers: { cookie }, payload });
      const body = res.body;
      expect(res.statusCode, `${method} ${url}`).toBe(400);
      expect(JSON.parse(body)).toEqual({ error: 'invalid_input' });
      expect(body, `${method} ${url} leaked the driver`).not.toContain('22P02');
      expect(body).not.toContain('invalid input syntax');
    }
  });

  it('answers the admin routes the same way', async () => {
    for (const [method, url, payload] of ADMIN_ROUTES) {
      const res = await app.inject({
        method: method as 'GET', url, headers: { authorization: basic }, payload,
      });
      expect(res.statusCode, `${method} ${url}`).toBe(400);
      expect(JSON.parse(res.body)).toEqual({ error: 'invalid_input' });
    }
  });

  it('leaves clips their own 404 — there the id IS the resource', async () => {
    for (const [method, url] of [['GET', '/clips/xyz'], ['DELETE', '/clips/xyz']] as const) {
      const res = await app.inject({ method, url, headers: { cookie } });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('not_found');
    }
  });

  it('does not touch a route whose :id is legitimately not a uuid', async () => {
    const r = await app.inject({ method: 'GET', url: '/pathways/occlusion', headers: { cookie } });
    expect(r.statusCode).toBe(200);
    expect(r.json().id).toBe('occlusion');
  });
});

describe('the handler keeps the three outcomes apart', () => {
  it('passes a schema rejection through with its own message', async () => {
    const res = await app.inject({
      method: 'POST', url: '/collections', headers: { cookie }, payload: { nope: 1 },
    });
    expect(res.statusCode).toBe(400);
    // Deliberately unchanged: clients and tests read these.
    expect(res.json().code).toBe('FST_ERR_VALIDATION');
    expect(res.json().message).toContain('title');
  });

  it('answers a genuine server fault with nothing at all', async () => {
    // buildServer(), not makeApp(): the route has to be added before ready().
    const probe = await buildServer();
    probe.get('/boom', async () => { throw new Error('a secret internal detail'); });
    await probe.ready();
    const res = await probe.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'server_error' });
    expect(res.body).not.toContain('secret internal detail');
    await probe.close();
  });

  it('still answers a well-formed id that simply is not there', async () => {
    const res = await app.inject({
      method: 'GET', url: '/collections/00000000-0000-0000-0000-000000000000', headers: { cookie },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('not_found');
  });
});
