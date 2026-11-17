// Drives the «پیام به یک نفر» form the panel ships — markup and inline script
// pulled out of GET /admin and run in a real DOM. The endpoint it posts to is
// covered in notices.test.ts; what is pinned here is that the form sends the
// founder's words to ONE reader and says plainly what happened to the push.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { JSDOM } from 'jsdom';
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
  const start = page.body.indexOf('<form class="bc" id="pmForm"');
  expect(start).toBeGreaterThan(-1);
  const open = page.body.indexOf('<script>', start);
  markup = page.body.slice(start, open);
  script = page.body.slice(open + '<script>'.length, page.body.indexOf('</script>', open));
});
afterAll(async () => { await app?.close(); await pool.end(); });

type Sent = { url: string; body: Record<string, unknown> };
function mount(answer: unknown, ok = true, agree = true) {
  const dom = new JSDOM('<!doctype html><body>' + markup + '</body>', { runScripts: 'outside-only' });
  const win = dom.window as unknown as Window & typeof globalThis;
  const sent: Sent[] = [];
  const asked: string[] = [];
  const w = win as unknown as Record<string, unknown>;
  w.fetch = (url: string, init: { body: string }) => {
    sent.push({ url, body: JSON.parse(init.body) });
    return Promise.resolve({ ok, json: () => Promise.resolve(answer) });
  };
  w.confirm = (q: string) => { asked.push(q); return agree; };
  dom.window.eval(script);
  const set = (id: string, v: string) => { (win.document.getElementById(id) as HTMLInputElement).value = v; };
  const send = async () => {
    (win.document.getElementById('pmSend') as HTMLButtonElement).click();
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
  };
  const said = () => win.document.getElementById('pmOut')!.textContent ?? '';
  return { win, sent, asked, set, send, said };
}

describe('the «پیام به یک نفر» form', () => {
  it('sends one reader the title, text and link, with a push by default', async () => {
    const f = mount({ ok: true, display_name: 'کاربر برنده', notice: 'delivered', push: 'queued', push_skipped: null });
    f.set('pmUser', '09150001001'); f.set('pmTitle', 'برنده شدی'); f.set('pmBody', 'تبریک'); f.set('pmUrl', '/plus/support.html');
    await f.send();
    expect(f.asked[0]).toContain('09150001001');
    expect(f.sent).toHaveLength(1);
    expect(f.sent[0]).toMatchObject({
      url: '/admin/notices/user',
      body: { user: '09150001001', title: 'برنده شدی', body: 'تبریک', url: '/plus/support.html', push: true, force: false },
    });
    expect(f.said()).toContain('کاربر برنده');
    expect(f.said()).toContain('نوتیف هم فرستاده شد');
    // The words are cleared so a second tap cannot resend them; the reader stays.
    expect((f.win.document.getElementById('pmTitle') as HTMLInputElement).value).toBe('');
    expect((f.win.document.getElementById('pmUser') as HTMLInputElement).value).toBe('09150001001');
  });

  it('says so when the push stayed home, and warns against sending twice', async () => {
    const f = mount({ ok: true, display_name: null, notice: 'delivered', push: 'off', push_skipped: 'outside_awake_window' });
    f.set('pmUser', 'u1'); f.set('pmTitle', 'سلام');
    await f.send();
    expect(f.said()).toContain('نوتیف نرفت');
    expect(f.said()).toContain('دوباره نفرست');
  });

  it('sends nothing without a reader, without a title, or without the founder\'s yes', async () => {
    const a = mount({});
    a.set('pmTitle', 'سلام'); await a.send();
    expect(a.sent).toHaveLength(0); expect(a.said()).toContain('برای چه کسی');
    const b = mount({});
    b.set('pmUser', 'u1'); await b.send();
    expect(b.sent).toHaveLength(0); expect(b.said()).toContain('عنوان');
    const c = mount({}, true, false);
    c.set('pmUser', 'u1'); c.set('pmTitle', 'سلام'); await c.send();
    expect(c.sent).toHaveLength(0);
  });

  it('shows the server\'s reason when the reader is not found', async () => {
    const f = mount({ error: 'no_profile', message: 'کاربری با این مشخصات پیدا نشد.' }, false);
    f.set('pmUser', '0000'); f.set('pmTitle', 'سلام');
    await f.send();
    expect(f.said()).toContain('پیدا نشد');
  });
});
