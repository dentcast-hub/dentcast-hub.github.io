// Drives the چالش form the panel ACTUALLY ships — the markup and the inline
// script are pulled out of GET /admin and run in a real DOM, because that
// script is a string inside one enormous template literal and nothing else
// executes it. admin-page-scripts.test.ts only proves the block parses; this
// proves the paste box fills the three fields and that ثبت posts what the
// founder pasted.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { JSDOM } from 'jsdom';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

let app: FastifyInstance;
let markup = '';
let script = '';

const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

// The real thing a founder copies out of the challenge draft: one object, with
// the answer's newlines still escaped.
const PASTED = JSON.stringify({
  content_id: 'insight/insight-70',
  answer_fa: 'این طراحی تایید نمی‌شود.\n\nفلوتینگ یک شیارِ عمودیِ ملایم است.',
  key_points: [
    { id: 'kp1', text: 'ایراد در کانتورِ سطح باکال است.' },
    { id: 'kp2', text: 'سطح باکال در یک‌سومِ سرویکالی اورکانتور است.' },
    { id: 'kp3', text: 'علتش نبودِ فلوتینگ است.' },
    { id: 'kp4', text: 'پیامدش تجمع پلاک و التهاب لثه است.' },
  ],
});

beforeAll(async () => {
  await resetDb();
  app = await makeApp();
  const page = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
  expect(page.statusCode).toBe(200);
  const start = page.body.indexOf('<div id="chUpBox"');
  expect(start).toBeGreaterThan(-1);
  const open = page.body.indexOf('<script>', start);
  const close = page.body.indexOf('</script>', open);
  markup = page.body.slice(start, open);
  script = page.body.slice(open + '<script>'.length, close);
});

afterAll(async () => { await app?.close(); await pool.end(); });

type Sent = { url: string; body: Record<string, unknown> };

function mount(): { win: Window & typeof globalThis; sent: Sent[] } {
  // outside-only gives window.eval a real window scope without letting the
  // fetched page's own <script> tags run.
  const dom = new JSDOM('<!doctype html><body>' + markup + '</body>', { runScripts: 'outside-only' });
  const win = dom.window as unknown as Window & typeof globalThis;
  const sent: Sent[] = [];
  (win as unknown as { fetch: unknown }).fetch = (url: string, init: { body: string }) => {
    sent.push({ url, body: JSON.parse(init.body) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
  };
  dom.window.eval(script);
  return { win, sent };
}

function paste(win: Window, raw: string): void {
  const el = win.document.getElementById('chUpPaste') as HTMLTextAreaElement;
  el.value = raw;
  el.dispatchEvent(new win.Event('input', { bubbles: true }));
}

function field(win: Window, id: string): string {
  return (win.document.getElementById(id) as HTMLTextAreaElement | HTMLInputElement).value;
}

describe('the چالش form the panel ships', () => {
  it('fills all three fields from one pasted object', () => {
    const { win } = mount();
    paste(win, PASTED);

    expect(field(win, 'chUpContentId')).toBe('insight/insight-70');
    // The whole point of parsing rather than hand-splitting: \n arrives as a
    // real newline, not as two literal characters the reader would then see.
    expect(field(win, 'chUpAnswer')).toContain('\n\n');
    expect(field(win, 'chUpAnswer')).not.toContain('\\n');
    expect(JSON.parse(field(win, 'chUpKeyPoints'))).toHaveLength(4);
    expect(win.document.getElementById('chUpPasteMsg')?.textContent).toContain('پر شد');
  });

  it('posts exactly what was pasted', async () => {
    const { win, sent } = mount();
    paste(win, PASTED);
    (win.document.getElementById('chUpSave') as HTMLButtonElement).click();

    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe('/admin/challenges/upsert');
    expect(sent[0].body).toEqual(JSON.parse(PASTED));
  });

  it('accepts a bare key_points array without touching the other fields', () => {
    const { win } = mount();
    const kp = JSON.parse(PASTED).key_points;
    paste(win, JSON.stringify(kp));

    expect(field(win, 'chUpContentId')).toBe('');
    expect(field(win, 'chUpAnswer')).toBe('');
    expect(JSON.parse(field(win, 'chUpKeyPoints'))).toHaveLength(4);
  });

  it('says what is wrong instead of posting it', () => {
    const { win, sent } = mount();
    const obj = JSON.parse(PASTED);
    obj.key_points = obj.key_points.slice(0, 2);
    paste(win, JSON.stringify(obj));
    expect(win.document.getElementById('chUpPasteMsg')?.textContent).toContain('سه تا پنج');

    (win.document.getElementById('chUpSave') as HTMLButtonElement).click();
    expect(sent).toHaveLength(0);
    expect(win.document.getElementById('chUpMsg')?.textContent).toContain('سه تا پنج');
  });

  it('leaves the form alone when the paste is not JSON', () => {
    const { win } = mount();
    paste(win, '{ نصفه');
    expect(field(win, 'chUpContentId')).toBe('');
    expect(win.document.getElementById('chUpPasteMsg')?.textContent).toContain('نامعتبر');
  });
});
