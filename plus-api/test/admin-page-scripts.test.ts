import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

/**
 * The admin panel is one enormous template literal, and its inline scripts are
 * strings inside it — so an escape that is correct in the `.ts` source can
 * still emit broken JavaScript. `'…؟\n'` is the case that caught this out:
 * perfectly valid TypeScript, and the template literal turns it into a REAL
 * newline inside a single-quoted browser string, which is a syntax error that
 * takes the whole block down. Nothing else notices — the route still answers
 * 200, every server-side test still passes, and the panel silently loses a
 * queue.
 *
 * So: parse what the page actually ships. `new Function` compiles without
 * running, which is exactly the half we want.
 */
let app: FastifyInstance;
const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

beforeAll(async () => { await resetDb(); app = await makeApp(); });
afterAll(async () => { await app?.close(); await pool.end(); });

describe('the panel it actually ships', () => {
  it('emits inline scripts a browser can parse', async () => {
    const page = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
    expect(page.statusCode).toBe(200);

    const blocks = Array.from(page.body.matchAll(/<script>([\s\S]*?)<\/script>/g)).map((m) => m[1]);
    // A rewrite that dropped every inline script would otherwise pass silently.
    expect(blocks.length).toBeGreaterThan(5);

    for (const src of blocks) {
      expect(() => new Function(src)).not.toThrow();
    }
  });

  /**
   * Parsing is not scope. Every block is its own IIFE, so `esc`/`fa` defined in
   * one are NOT in scope in the next — and a block that calls one it never
   * defined parses perfectly and then throws on the first render, which is the
   * same silent-loss failure this file exists for. (2026-09-13: the «محتوا» block
   * was first written exactly that way, and the parse check above passed it.)
   */
  it('never calls esc/fa in a block that does not define them', async () => {
    const page = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
    const blocks = Array.from(page.body.matchAll(/<script>([\s\S]*?)<\/script>/g)).map((m) => m[1]);
    for (const helper of ['esc', 'fa']) {
      const calls = new RegExp(`(^|[^\\w.])${helper}\\(`);
      const defines = new RegExp(`function\\s+${helper}\\s*\\(|(var|let|const)\\s+${helper}\\s*=`);
      for (const src of blocks) {
        if (!calls.test(src)) continue;
        expect(defines.test(src), `a block calls ${helper}() without defining it`).toBe(true);
      }
    }
  });
});
