import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('/anon/event', () => {
  it('records a whitelisted event', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/anon/event',
      payload: { event: 'workbench_button_anon_click', content_id: 'resin-cements-overview' },
    });
    expect(res.statusCode).toBe(204);
    const rows = await pool.query('select event, content_id from anon_events');
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].event).toBe('workbench_button_anon_click');
  });

  it('rejects a non-whitelisted event', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/anon/event',
      payload: { event: 'something_else' },
    });
    expect(res.statusCode).toBe(400);
    const rows = await pool.query('select count(*)::int as n from anon_events');
    expect(rows.rows[0].n).toBe(0);
  });

  it('rate-limits per IP', async () => {
    // Push the per-IP limit down for this test via direct calls beyond the cap.
    // Default cap is 60/hour; issue 61 and expect the last to be blocked.
    let blocked = 0;
    for (let i = 0; i < 61; i += 1) {
      const res = await app.inject({
        method: 'POST',
        url: '/anon/event',
        payload: { event: 'workbench_button_anon_click' },
      });
      if (res.statusCode === 429) blocked += 1;
    }
    expect(blocked).toBeGreaterThanOrEqual(1);
  });
});
