// Drives the «حضور در بازهٔ اخیر» block the panel ACTUALLY ships — markup and
// inline script pulled out of GET /admin and run in a real DOM (the pattern of
// admin-challenge-paste.dom.test.ts). What is pinned here is the draw: it picks
// exactly as many as asked, never twice, only from the ticked rows.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { JSDOM } from 'jsdom';
import { webcrypto } from 'node:crypto';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

let app: FastifyInstance;
let markup = '';
let script = '';

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

beforeAll(async () => {
  await resetDb();
  app = await makeApp();
  const page = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
  expect(page.statusCode).toBe(200);
  const start = page.body.indexOf('<form class="bc" id="spForm"');
  expect(start).toBeGreaterThan(-1);
  const open = page.body.indexOf('<script>', start);
  const close = page.body.indexOf('</script>', open);
  markup = page.body.slice(start, open);
  script = page.body.slice(open + '<script>'.length, close);
});

afterAll(async () => { await app?.close(); await pool.end(); });

const PEOPLE = ['الف', 'ب', 'پ', 'ت', 'ث', 'ج'].map((n, i) => ({
  user_id: 'u' + i, display_name: n, phone: '0915000000' + i,
  active_days: 30 - i, longest_run: 10, current_streak: 5, first_day: '2026-10-19', last_day: '2026-11-17',
}));

async function mount(): Promise<Window & typeof globalThis> {
  const dom = new JSDOM('<!doctype html><body>' + markup + '</body>', { runScripts: 'outside-only' });
  const win = dom.window as unknown as Window & typeof globalThis;
  const w = win as unknown as Record<string, unknown>;
  w.fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      ok: true, days: 30, min_days: 20, from_day: '2026-10-19', to_day: '2026-11-17',
      active_total: 9, qualified_total: PEOPLE.length, cap: 200, rows: PEOPLE,
    }),
  });
  Object.defineProperty(win, 'crypto', { value: webcrypto, configurable: true });
  // The spin is cosmetic; run its timers at once so the test waits on nothing.
  w.setTimeout = (fn: () => void) => { setImmediate(fn); return 0; };
  dom.window.eval(script);
  (win.document.getElementById('spGo') as HTMLButtonElement).click();
  await until(() => win.document.querySelectorAll('#spOut tbody tr').length === PEOPLE.length);
  return win;
}

async function until(cond: () => boolean): Promise<void> {
  for (let i = 0; i < 400 && !cond(); i += 1) await new Promise((r) => setImmediate(r));
  expect(cond()).toBe(true);
}

async function draw(win: Window, k: string): Promise<string[]> {
  (win.document.getElementById('spK') as HTMLInputElement).value = k;
  const btn = win.document.getElementById('spDrawGo') as HTMLButtonElement;
  btn.click();
  await until(() => !btn.disabled);
  return Array.from(win.document.querySelectorAll('#spWin li')).map((li) => li.textContent ?? '');
}

describe('the presence draw the panel ships', () => {
  it('shows the draw only once there is a list, and counts the pool', async () => {
    const win = await mount();
    expect((win.document.getElementById('spDraw') as HTMLElement).hidden).toBe(false);
    expect(win.document.getElementById('spPool')!.textContent).toContain('۶');
  });

  it('picks exactly the number asked for, each person once', async () => {
    const win = await mount();
    const won = await draw(win, '۳');
    expect(won).toHaveLength(3);
    expect(new Set(won).size).toBe(3);
    const marked = Array.from(win.document.querySelectorAll('#spOut tbody tr'))
      .filter((tr) => (tr as HTMLElement).style.background !== '');
    expect(marked).toHaveLength(3);
  });

  it('never picks an unticked row', async () => {
    const win = await mount();
    const boxes = Array.from(win.document.querySelectorAll('#spOut .spIn')) as HTMLInputElement[];
    boxes.slice(0, 4).forEach((b) => { b.checked = false; b.dispatchEvent(new win.Event('change', { bubbles: true })); });
    expect(win.document.getElementById('spPool')!.textContent).toContain('۲');
    for (let i = 0; i < 5; i += 1) {
      const won = await draw(win, '2');
      expect(won).toHaveLength(2);
      expect(won.every((t) => t.startsWith('ث') || t.startsWith('ج'))).toBe(true);
    }
  });

  it('refuses more winners than people, and a count that is not a number', async () => {
    const win = await mount();
    expect(await draw(win, '7')).toHaveLength(0);
    expect(win.document.getElementById('spSpin')!.textContent).toContain('۶');
    expect(await draw(win, 'x')).toHaveLength(0);
    expect(await draw(win, '6')).toHaveLength(6);
  });

  it('reaches everybody over many draws', async () => {
    const win = await mount();
    const seen = new Set<string>();
    for (let i = 0; i < 60; i += 1) (await draw(win, '1')).forEach((t) => seen.add(t));
    expect(seen.size).toBe(PEOPLE.length);
  });
});
