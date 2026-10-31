import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import {
  QP_TYPES, signV4, renderBody, renderPage, brainEntry, appendBrainEntry, replaceBrainEntry, setSiteStore,
  setEnabled, faNumberWords, landingFor, BRAIN_KEY, LEDGER_KEY, TEMPLATE_KEY, type SiteStore, type QpType,
} from '../src/services/quick-publish.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const brainText = fs.readFileSync(path.join(repo, 'dentcast-brain.json'), 'utf8');
const template = fs.readFileSync(path.join(repo, 'quick-publish/template.html'), 'utf8');
const headers = { authorization: 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64') };
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

function memoryStore(seed: Record<string, string>): SiteStore & { files: Map<string, Buffer>; failOnce(key: string): void } {
  const files = new Map(Object.entries(seed).map(([k, v]) => [k, Buffer.from(v)]));
  const failing = new Set<string>();
  return {
    files,
    failOnce(key) { failing.add(key); },
    async get(k) { return files.get(k) ?? null; },
    async put(k, b) {
      if (failing.delete(k)) throw new Error('qp_storage_http_500');
      files.set(k, Buffer.from(b));
    },
  };
}
const landingFile = (dir: string) => fs.readFileSync(path.join(repo, dir, 'index.html'), 'utf8');

describe('quick publish — pure parts', () => {
  it('signs exactly like AWS’s published SigV4 GET-object example', () => {
    const auth = signV4({ method: 'GET', host: 'examplebucket.s3.amazonaws.com', path: '/test.txt', headers: { range: 'bytes=0-9' },
      payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      accessKey: 'AKIAIOSFODNN7EXAMPLE', secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region: 'us-east-1', amzDate: '20130524T000000Z' });
    expect(auth).toBe('AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, '
      + 'SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');
  });

  it('writes brain entries with the same keys, in the same order, as the latest entry of each type', () => {
    const brain = JSON.parse(brainText) as Record<string, unknown>[];
    for (const type of Object.keys(QP_TYPES) as QpType[]) {
      const latest = brain.filter(e => e.type === type).at(-1)!;
      const t = QP_TYPES[type];
      expect(String(latest[t.urlKey])).toMatch(new RegExp(`^/${t.folder}/${t.stem}\\d+\\.html$`));
      expect(Object.keys(brainEntry(type, 7, '/x.html', 'عنوان', 'کپشن'))).toEqual(Object.keys(latest));
    }
  });

  it('fills the repo template into a complete, indexable page with valid JSON-LD', () => {
    const html = renderPage(template, { type: 'clinical', path: '/insight/insight-101.html', title: 'عنوان "نقل‌قول" <و>',
      caption: 'کپشنی برای توضیح متا', date: '2026-11-01', body: '<p>بدنه</p>' });
    expect(html).not.toMatch(/\{\{[A-Z0-9_]+\}\}|qp-template|noindex/);
    expect(html).toContain('<link rel="canonical" href="https://dentcast.org/insight/insight-101.html">');
    expect(html).toContain('<link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/insight/insight-101.html">');
    expect(html).toContain('<meta name="robots" content="index, follow, max-image-preview:large">');
    expect(html).toContain("gtag('config', 'G-GMM0WC8X3M')");
    expect(html).toContain('<link rel="preconnect" href="https://api.dentcast.ir" crossorigin>');
    expect(html).toMatch(/<h1>[^]*?عنوان &quot;نقل‌قول&quot; &lt;و&gt;<\/h1>/);
    expect(html).not.toContain('dc-related-section');
    expect(html).not.toContain('dc-notify');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    expect(blocks).toHaveLength(2);
    expect(blocks[0]['@graph'][0]).toMatchObject({ headline: 'عنوان "نقل‌قول" <و>', datePublished: '2026-11-01', dateModified: '2026-11-01' });
    expect(blocks[1].itemListElement[1]).toMatchObject({ name: 'Clinical Insight', item: 'https://dentcast.org/insight/' });
  });

  it('keeps the template itself out of search', () => {
    expect(template).toContain('<meta name="robots" content="noindex, nofollow" data-qp-template>');
    expect(fs.readFileSync(path.join(repo, 'robots.txt'), 'utf8')).toContain('Disallow: /quick-publish/template.html');
  });

  it('renders the phone markup and escapes everything else', () => {
    const r = renderBody('سلام <b>دنیا</b> و **مهم** و [واژه](/glossary/x.html) و [بد](javascript:alert(1))\nخط دوم\n\n## تیتر\n- یک\n- دو\n\n۱. اول\n۲. دوم\n\n![عکس](/quick-publish/media/20261101-abcd1234.jpg)');
    expect(r.firstBlock).toBe('p');
    expect(r.html).toContain('<p>سلام &lt;b&gt;دنیا&lt;/b&gt; و <strong>مهم</strong> و <a href="/glossary/x.html">واژه</a> و [بد](javascript:alert(1))<br>\nخط دوم</p>');
    expect(r.html).toContain('<h2>تیتر</h2>');
    expect(r.html).toContain('<ul>\n  <li>یک</li>\n  <li>دو</li>\n</ul>');
    expect(r.html).toContain('<ol>\n  <li>اول</li>\n  <li>دوم</li>\n</ol>');
    expect(r.html).toContain('<img src="/quick-publish/media/20261101-abcd1234.jpg" alt="عکس" loading="lazy" decoding="async">');
    expect(r.media).toEqual(['quick-publish/media/20261101-abcd1234.jpg']);
    expect(() => renderBody('متن\n\n![x](https://evil.example/a.jpg)')).toThrow('invalid_image_reference');
    expect(renderBody('## اول تیتر\n\nبعد').firstBlock).toBe('h');
    // The panel's display-only direction marks around an image line are not part of it.
    expect(renderBody('متن\n\n\u2066![x](/quick-publish/media/20261101-abcd1234.jpg)\u2069').html)
      .toContain('<img src="/quick-publish/media/20261101-abcd1234.jpg" alt="x"');
  });

  it('does not turn a backslash-host link into an anchor', () => {
    const r = renderBody('سلام [x](/\\evil.example) و [y](//evil.example)');
    expect(r.html).not.toContain('<a');
    expect(r.html).toContain('[x](/\\evil.example)');
  });

  it('writes Persian number words the way metanotes/index.html does', () => {
    expect(faNumberWords(23)).toBe('بیست\u200cوسه');
    expect(faNumberWords(7)).toBe('هفت');
    expect(faNumberWords(20)).toBe('بیست');
  });

  it('renders an image caption as figure/figcaption (escaped), and a bare img without one', () => {
    const withCap = renderBody('متن\n\n![زیرنویس <b>&"x"</b>](/quick-publish/media/20261101-abcd1234.jpg)').html;
    expect(withCap).toContain('<figure>\n  <img src="/quick-publish/media/20261101-abcd1234.jpg" alt="زیرنویس &lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;" loading="lazy" decoding="async">'
      + '\n  <figcaption>زیرنویس &lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;</figcaption>\n</figure>');
    expect(withCap).not.toContain('<b>');
    const plain = renderBody('متن\n\n![](/quick-publish/media/20261101-abcd1234.jpg)').html;
    expect(plain).toContain('<img src="/quick-publish/media/20261101-abcd1234.jpg" alt="" loading="lazy" decoding="async">');
    expect(plain).not.toMatch(/<figure|<figcaption/);
  });

  it('template wraps long words and styles figcaption', () => {
    expect(template).toContain('.glass-box { overflow-wrap: anywhere; }');
    expect(template).toMatch(/\.glass-box figcaption\s*\{/);
    expect(template).toContain('overflow-wrap: anywhere');
  });

  it('normalises landing labels instead of losing or doubling the number', () => {
    expect(landingFor('chairside', 47, 'Chairside 9 — عنوان').line).toBe('<li><a href="chairside-47.html">Chairside 47 — عنوان</a></li>');
    expect(landingFor('chairside', 47, 'عنوان ساده').line).toContain('>Chairside 47 — عنوان ساده<');
    expect(landingFor('meta', 23, 'متانوت آزمایشی: عنوان').line).toBe('<li><a href="meta-23.html">متانوت بیست\u200cوسه: عنوان</a></li>');
    expect(landingFor('meta', 23, 'عنوان').line).toContain('>متانوت بیست\u200cوسه: عنوان<');
  });

  it('appends at the absolute tail of the real brain without touching a byte before it', () => {
    const entry = brainEntry('clinical', 101, '/insight/insight-101.html', 'ع', 'ک');
    const next = appendBrainEntry(brainText, entry);
    const head = brainText.slice(0, brainText.lastIndexOf(']')).replace(/\s+$/, '');
    // The brain is CRLF in git; the appended entry keeps that, so no line of it is rewritten.
    expect(brainText.endsWith('\r\n')).toBe(true);
    expect(next.startsWith(head + ',\r\n')).toBe(true);
    expect(next.slice(head.length).replace(/\r\n/g, '')).not.toContain('\n');
    expect(JSON.parse(next).at(-1)).toEqual(entry);
    expect(JSON.parse(next)).toHaveLength(JSON.parse(brainText).length + 1);
    const edited = brainEntry('clinical', 101, '/insight/insight-101.html', 'عنوان تازه', 'ک');
    expect(JSON.parse(replaceBrainEntry(next, entry, edited)!).at(-1)).toEqual(edited);
    expect(replaceBrainEntry(brainText, entry, edited)).toBeNull();
  });
});

describe('quick publish — admin routes', () => {
  let app: FastifyInstance;
  let store: ReturnType<typeof memoryStore>;
  const body = 'پاراگراف اول که متن را باز می‌کند و به اندازه‌ی کافی بلند است.\n\n## تیتر\n- مورد';
  const post = (payload: object) => app.inject({ method: 'POST', url: '/admin/quick-publish', headers, payload });

  beforeEach(async () => {
    await resetDb();
    store = memoryStore({ [BRAIN_KEY]: brainText, [TEMPLATE_KEY]: template });
    setSiteStore(store);
    await setEnabled(true);
    if (!app) app = await makeApp();
  });
  afterAll(async () => { setSiteStore(null); await app?.close(); await pool.end(); });

  it('is behind the admin password', async () => {
    for (const r of [
      { method: 'GET' as const, url: '/admin/quick-publish' },
      { method: 'POST' as const, url: '/admin/quick-publish', payload: {} },
      { method: 'POST' as const, url: '/admin/quick-publish/preview', payload: {} },
      { method: 'PUT' as const, url: '/admin/quick-publish/enabled', payload: { enabled: true } },
      { method: 'POST' as const, url: '/admin/quick-publish/workflow', payload: { ids: ['clinical-1'], requested: true } },
      { method: 'PUT' as const, url: '/admin/quick-publish/clinical-1', payload: {} },
      { method: 'POST' as const, url: '/admin/quick-publish/clinical-1/restore' },
      { method: 'POST' as const, url: '/admin/quick-publish/media', payload: PNG, headers: { 'content-type': 'image/png' } },
    ]) expect((await app.inject(r)).statusCode).toBe(401);
  });

  it('publishes page, brain tail and ledger line, numbering after the live brain', async () => {
    const brain = JSON.parse(brainText) as Record<string, unknown>[];
    const last = Math.max(...brain.filter(e => e.type === 'clinical').map(e => Number(String(e.page_url).match(/insight-(\d+)/)![1])));
    const r = await post({ type: 'clinical', title: 'یک نکته', caption: 'کپشن کوتاه برای این نکته', body });
    expect(r.statusCode).toBe(200);
    const path1 = `/insight/insight-${last + 1}.html`;
    expect(r.json()).toMatchObject({ ok: true, url: 'https://dentcast.ir' + path1, item: { id: `clinical-${last + 1}`, state: 'live' } });
    const page = store.files.get(path1.slice(1))!.toString();
    expect(page).toMatch(/<h1>[^]*?یک نکته<\/h1>/);
    expect(page).toContain('<h2>تیتر</h2>');
    const nextBrain = JSON.parse(store.files.get(BRAIN_KEY)!.toString());
    expect(nextBrain.at(-1)).toEqual({ type: 'clinical', id: `clinical-${last + 1}`, title: 'یک نکته', caption: 'کپشن کوتاه برای این نکته',
      hashtags: [], keywords: [], page_url: path1, pillar: { primary: null, secondary: [], subtopic: null } });
    const ledger = JSON.parse(store.files.get(LEDGER_KEY)!.toString());
    expect(ledger.items.map((i: { id: string }) => i.id)).toEqual([`clinical-${last + 1}`]);
    expect((await pool.query('select id from quick_publications')).rows).toEqual([{ id: `clinical-${last + 1}` }]);

    const second = await post({ type: 'clinical', title: 'نکتهٔ دوم', caption: 'کپشن کوتاه برای نکتهٔ دوم', body });
    expect(second.json().item.id).toBe(`clinical-${last + 2}`);
    const share = await post({ type: 'sharehub', title: 'خوانش', caption: 'کپشن کوتاه برای خوانش', body });
    expect(share.json().item.brain_entry).toMatchObject({ type: 'sharehub', author: 'دکتر فواد شهابیان', url: share.json().item.path });
  });

  it('never overwrites a page that already sits at the next address', async () => {
    const brain = JSON.parse(brainText) as Record<string, unknown>[];
    const last = Math.max(...brain.filter(e => e.type === 'chairside').map(e => Number(String(e.page_url).match(/chairside-(\d+)/)![1])));
    store.files.set(`chairside/chairside-${last + 1}.html`, Buffer.from('someone else'));
    const r = await post({ type: 'chairside', title: 'کیس', caption: 'کپشن کوتاه برای کیس', body });
    expect(r.json().item.path).toBe(`/chairside/chairside-${last + 2}.html`);
    expect(store.files.get(`chairside/chairside-${last + 1}.html`)!.toString()).toBe('someone else');
  });

  it('refuses bodies that open with a heading, and reports a missing template', async () => {
    expect((await post({ type: 'meta', title: 'متا', caption: 'کپشن کوتاه برای متا', body: '## تیتر\n\nپاراگرافی بعد از تیتر که بلند است' })).json())
      .toEqual({ error: 'first_block_not_paragraph' });
    store.files.delete(TEMPLATE_KEY);
    expect((await post({ type: 'meta', title: 'متا', caption: 'کپشن کوتاه برای متا', body })).json()).toEqual({ error: 'template_missing' });
    expect((await app.inject({ url: '/admin/quick-publish', headers })).json()).toMatchObject({ configured: true, template: false });
  });

  it('edits in place until imported, then refuses', async () => {
    const { item } = (await post({ type: 'clinical', title: 'نسخهٔ اول', caption: 'کپشن کوتاه نسخهٔ اول', body })).json();
    const src = await app.inject({ url: `/admin/quick-publish/${item.id}/source`, headers });
    expect(src.json().body).toBe(body);
    const put = await app.inject({ method: 'PUT', url: `/admin/quick-publish/${item.id}`, headers,
      payload: { type: 'clinical', title: 'نسخهٔ دوم', caption: 'کپشن کوتاه نسخهٔ دوم', body: body + '\n\nپاراگراف تازه.' } });
    expect(put.statusCode).toBe(200);
    const brain = JSON.parse(store.files.get(BRAIN_KEY)!.toString());
    expect(brain.filter((e: { id: string }) => e.id === item.id)).toHaveLength(1);
    expect(brain.at(-1).title).toBe('نسخهٔ دوم');
    expect(store.files.get(item.path.slice(1))!.toString()).toContain('پاراگراف تازه.');
    expect(store.files.get(item.path.slice(1))!.toString()).toContain(`datetime="${item.date}"`);
    expect(put.json().item.modified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(store.files.get(item.path.slice(1))!.toString()).toContain(`"dateModified": "${put.json().item.modified}"`);

    const ledger = JSON.parse(store.files.get(LEDGER_KEY)!.toString());
    ledger.items[0].state = 'imported';
    store.files.set(LEDGER_KEY, Buffer.from(JSON.stringify(ledger)));
    const again = await app.inject({ method: 'PUT', url: `/admin/quick-publish/${item.id}`, headers,
      payload: { type: 'clinical', title: 'نسخهٔ سوم', caption: 'کپشن کوتاه نسخهٔ سوم', body } });
    expect(again.json()).toEqual({ error: 'already_imported' });
  });

  it('uploads images, accepts only uploaded ones in the body, and restores a wiped publication', async () => {
    const up = await app.inject({ method: 'POST', url: '/admin/quick-publish/media', headers: { ...headers, 'content-type': 'image/png' }, payload: PNG });
    expect(up.statusCode).toBe(200);
    const img = up.json().path as string;
    expect(img).toMatch(/^\/quick-publish\/media\/\d{8}-[0-9a-f]{8}\.png$/);
    expect((await app.inject({ method: 'POST', url: '/admin/quick-publish/media', headers: { ...headers, 'content-type': 'image/png' }, payload: Buffer.from('not a png at all') })).json())
      .toEqual({ error: 'invalid_image' });
    expect((await post({ type: 'clinical', title: 'با عکس', caption: 'کپشن کوتاه با عکس', body: body + '\n\n![x](/quick-publish/media/20990101-deadbeef.png)' })).json())
      .toEqual({ error: 'image_not_uploaded' });
    const { item } = (await post({ type: 'clinical', title: 'با عکس', caption: 'کپشن کوتاه با عکس', body: body + `\n\n![x](${img})` })).json();
    expect(item.media).toEqual([img.slice(1)]);

    // An unguarded deploy's --delete: page, image, ledger gone; brain back to git's copy.
    store.files.delete(item.path.slice(1)); store.files.delete(img.slice(1)); store.files.delete(LEDGER_KEY);
    store.files.set(BRAIN_KEY, Buffer.from(brainText));
    const r = await app.inject({ method: 'POST', url: `/admin/quick-publish/${item.id}/restore`, headers });
    expect(r.json().restored).toEqual(['page', img.slice(1), 'brain', 'ledger']);
    expect(store.files.get(img.slice(1))).toEqual(PNG);
    expect(JSON.parse(store.files.get(BRAIN_KEY)!.toString()).at(-1).id).toBe(item.id);
    expect((await app.inject({ method: 'POST', url: `/admin/quick-publish/${item.id}/restore`, headers })).json().restored).toEqual([]);
  });

  it('is off until switched on: publish and uploads answer 403 disabled', async () => {
    await setEnabled(false);
    const r = await post({ type: 'clinical', title: 'یک نکته', caption: 'کپشن کوتاه برای این نکته', body });
    expect(r.statusCode).toBe(403);
    expect(r.json()).toEqual({ error: 'disabled' });
    const up = await app.inject({ method: 'POST', url: '/admin/quick-publish/media', headers: { ...headers, 'content-type': 'image/png' }, payload: PNG });
    expect(up.statusCode).toBe(403);
    expect(up.json()).toEqual({ error: 'disabled' });
    expect((await app.inject({ url: '/admin/quick-publish', headers })).json()).toMatchObject({ enabled: false });

    const bad = await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: 'yes' } });
    expect(bad.statusCode).toBe(400);
    // A ledger already on the bucket (the switch never creates one); without it the answer is ledger_written:false.
    expect((await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: true } })).json().ledger_written).toBe(false);
    store.files.set(LEDGER_KEY, Buffer.from(JSON.stringify({ version: 1, items: [] })));
    const on = await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: true } });
    expect(on.statusCode).toBe(200);
    expect(on.json()).toEqual({ ok: true, enabled: true, ledger_written: true });
    expect((await app.inject({ url: '/admin/quick-publish', headers })).json()).toMatchObject({ enabled: true });
    expect((await post({ type: 'clinical', title: 'یک نکته', caption: 'کپشن کوتاه برای این نکته', body })).statusCode).toBe(200);
  });

  it('marks items for the full workflow without touching their content, and takes the mark back', async () => {
    const a = (await post({ type: 'clinical', title: 'نکتهٔ اول', caption: 'کپشن کوتاه نکتهٔ اول', body })).json().item;
    const b = (await post({ type: 'clinical', title: 'نکتهٔ دوم', caption: 'کپشن کوتاه نکتهٔ دوم', body })).json().item;
    const wf = (payload: unknown) => app.inject({ method: 'POST', url: '/admin/quick-publish/workflow', headers, payload: payload as object });
    const ledger = () => JSON.parse(store.files.get(LEDGER_KEY)!.toString()).items as Record<string, unknown>[];
    const row = async (id: string) => (await pool.query(`select record->>'id' as rid, record->>'workflow_requested_at' as flag, record->'workflow_requested_at' as raw from quick_publications where id = $1`, [id])).rows[0];

    const r = await wf({ ids: [a.id], requested: true });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ ok: true, changed: [a.id] });
    expect(typeof ledger()[0].workflow_requested_at).toBe('string');
    expect(ledger()[0].updated_at).toBe(a.updated_at);
    expect(ledger()[1].workflow_requested_at ?? null).toBeNull();
    expect((await row(a.id)).flag).toBe(ledger()[0].workflow_requested_at);
    expect((await row(b.id)).flag).toBeNull();

    expect((await wf({ ids: [a.id], requested: true })).json()).toEqual({ ok: true, changed: [] });

    expect((await wf({ ids: [a.id], requested: false })).json()).toEqual({ ok: true, changed: [a.id] });
    expect(ledger()[0].workflow_requested_at).toBeNull();
    const cleared = await row(a.id);
    expect(cleared.rid).toBe(a.id);
    expect(cleared.raw).toBeNull();

    const unknown = await wf({ ids: [a.id, 'clinical-99999'], requested: true });
    expect(unknown.statusCode).toBe(404);
    expect(ledger()[0].workflow_requested_at).toBeNull();

    const items = ledger(); items[1].state = 'completed';
    store.files.set(LEDGER_KEY, Buffer.from(JSON.stringify({ version: 1, items })));
    const done = await wf({ ids: [b.id], requested: true });
    expect(done.statusCode).toBe(409);
    expect(done.json()).toEqual({ error: 'already_completed' });

    for (const bad of [{}, { ids: [], requested: true }, { ids: [a.id] }, { ids: [a.id], requested: 'yes' }, { ids: [5], requested: true }, { ids: ['Bad Id'], requested: true }])
      expect((await wf(bad)).statusCode).toBe(400);
  });

  it('shows the section on the admin page', async () => {
    const page = await app.inject({ url: '/admin', headers });
    expect(page.body).toContain('<h3 style="margin-top:26px">انتشار حداقلی (اضطراری)</h3>');
    expect(page.body).toContain("['quick-publish', 'انتشار حداقلی (اضطراری)', 'انتشار حداقلی', 'qpWaiting'");
  });

  describe('review-round behaviour', () => {
  const put = (id: string, payload: object) => app.inject({ method: 'PUT', url: `/admin/quick-publish/${id}`, headers, payload });
  const restoreOf = (id: string) => app.inject({ method: 'POST', url: `/admin/quick-publish/${id}/restore`, headers });
  const getStatus = async () => (await app.inject({ url: '/admin/quick-publish', headers })).json();
  const ledger = () => JSON.parse(store.files.get(LEDGER_KEY)!.toString()) as { panel_enabled?: boolean; items: Record<string, any>[] };
  const brainOf = () => JSON.parse(store.files.get(BRAIN_KEY)!.toString()) as { id?: string; title?: string }[];
  const input = (title: string, extra: object = {}) => ({ type: 'clinical', title, caption: 'کپشن کوتاه برای این نکته', body, ...extra });

  it('mirrors the switch into the bucket ledger, and every ledger write carries the current value', async () => {
    store.files.set(LEDGER_KEY, Buffer.from(JSON.stringify({ version: 1, items: [] })));
    await setEnabled(true);
    expect(ledger().panel_enabled).toBe(true);
    const off = await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: false } });
    expect(off.json()).toEqual({ ok: true, enabled: false, ledger_written: true });
    expect(ledger().panel_enabled).toBe(false);
    await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: true } });
    expect(ledger().panel_enabled).toBe(true);
    const a = (await post(input('نکتهٔ اول'))).json().item;
    expect(ledger().panel_enabled).toBe(true);
    const wf = await app.inject({ method: 'POST', url: '/admin/quick-publish/workflow', headers, payload: { ids: [a.id], requested: true } });
    expect(wf.statusCode).toBe(200);
    expect(ledger().panel_enabled).toBe(true);
    // Edits are refused while off, but the ledger value follows the switch when status() notices drift.
    await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: false } });
    expect(ledger().panel_enabled).toBe(false);
    expect(ledger().items).toHaveLength(1);
  });

  it('reports ledger_written false when the bucket is not configured', async () => {
    setSiteStore(null);
    const saved = { ...process.env };
    for (const k of ['QP_S3_ENDPOINT', 'QP_S3_BUCKET', 'QP_S3_ACCESS_KEY', 'QP_S3_SECRET_KEY']) delete process.env[k];
    try {
      const r = await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: true } });
      expect(r.json()).toEqual({ ok: true, enabled: true, ledger_written: false });
    } finally { Object.assign(process.env, saved); setSiteStore(store); }
  });

  it('writes the ledger first: a failed brain write leaves a listed item that restore completes, and a retry with the same ref returns it', async () => {
    store.files.set('insight/index.html', Buffer.from(landingFile('insight')));
    store.failOnce(BRAIN_KEY);
    const ref = 'draft-aaaa1111';
    const failed = await post(input('نکتهٔ نیمه‌کاره', { ref }));
    expect(failed.statusCode).toBe(502);
    expect(failed.json().error).toBe('storage_unavailable');
    const listed = ledger().items;
    expect(listed).toHaveLength(1);
    const item = listed[0];
    expect(item.client_ref).toBe(ref);
    expect(store.files.has(item.path.slice(1))).toBe(false);
    expect(brainOf().some(e => e.id === item.id)).toBe(false);
    expect((await getStatus()).items.map((i: { id: string }) => i.id)).toEqual([item.id]);

    // The lost-response retry: same item, no second number, nothing new written.
    const again = await post(input('نکتهٔ نیمه‌کاره', { ref }));
    expect(again.statusCode).toBe(200);
    expect(again.json().item.id).toBe(item.id);
    expect(ledger().items).toHaveLength(1);
    expect((await pool.query('select id from quick_publications')).rows).toEqual([{ id: item.id }]);

    // The retry itself finished the job (page, landing, brain), so a later restore has nothing left.
    const r = await restoreOf(item.id);
    expect(r.statusCode).toBe(200);
    expect(r.json().restored).toEqual([]);
    expect(store.files.get(item.path.slice(1))!.toString()).toMatch(/<h1>[^]*?نکتهٔ نیمه‌کاره<\/h1>/);
    expect(brainOf().filter(e => e.id === item.id)).toHaveLength(1);
    expect(store.files.get('insight/index.html')!.toString()).toContain(`<a href="insight-${item.n}.html">نکتهٔ نیمه‌کاره</a>`);
    expect((await restoreOf(item.id)).json().restored).toEqual([]);
  });

  it('answers a retried ref from the API backup even when the bucket ledger lost the item', async () => {
    const ref = 'draft-bbbb2222';
    const first = (await post(input('نکته با ref', { ref }))).json().item;
    store.files.set(LEDGER_KEY, Buffer.from(JSON.stringify({ version: 1, items: [] })));
    const again = await post(input('نکته با ref', { ref }));
    expect(again.statusCode).toBe(200);
    expect(again.json().item.id).toBe(first.id);
    expect((await pool.query('select id from quick_publications')).rowCount).toBe(1);
  });

  it('gives two publishes without a ref two items, and rejects a malformed ref', async () => {
    const a = (await post(input('بدون ref اول'))).json().item;
    const b = (await post(input('بدون ref اول'))).json().item;
    expect(a.id).not.toBe(b.id);
    expect(a.path).not.toBe(b.path);
    const bad = await post(input('نکته', { ref: 'BAD REF' }));
    expect(bad.statusCode).toBe(400);
    expect(bad.json()).toEqual({ error: 'invalid_ref' });
    expect((await post(input('نکته', { ref: 5 }))).json()).toEqual({ error: 'invalid_ref' });
    expect(ledger().items).toHaveLength(2);
  });

  it('retries an edit after the brain was already written: one entry for the id, latest title, no brain_entry_moved', async () => {
    const { item } = (await post(input('نسخهٔ اول'))).json();
    const edit = (title: string) => put(item.id, { type: 'clinical', title, caption: 'کپشن کوتاه برای این نکته', body });
    store.failOnce(item.path.slice(1)); // ledger and brain are written, the page is not
    expect((await edit('نسخهٔ دوم')).statusCode).toBe(502);
    expect(brainOf().filter(e => e.id === item.id).map(e => e.title)).toEqual(['نسخهٔ دوم']);
    const retry = await edit('نسخهٔ سوم');
    expect(retry.statusCode).toBe(200);
    expect(retry.json().error).toBeUndefined();
    expect(brainOf().filter(e => e.id === item.id).map(e => e.title)).toEqual(['نسخهٔ سوم']);
    expect(store.files.get(item.path.slice(1))!.toString()).toMatch(/<h1>[^]*?نسخهٔ سوم<\/h1>/);
    expect(ledger().items[0].title).toBe('نسخهٔ سوم');
  });

  it('after an edit whose ledger write failed, retry succeeds and restore brings the ledger line up to the backup', async () => {
    const { item } = (await post(input('نسخهٔ اول'))).json();
    const edit = (title: string) => put(item.id, { type: 'clinical', title, caption: 'کپشن کوتاه برای این نکته', body });
    store.failOnce(LEDGER_KEY);
    expect((await edit('نسخهٔ دوم')).statusCode).toBe(502);
    expect(ledger().items[0].title).toBe('نسخهٔ اول');
    // The backup already holds the founder's latest text.
    expect((await app.inject({ url: `/admin/quick-publish/${item.id}/source`, headers })).json().item.title).toBe('نسخهٔ دوم');
    const r = await restoreOf(item.id);
    expect(r.statusCode).toBe(200);
    // The page the half-failed edit left behind is replaced too, not only brain and ledger.
    expect(r.json().restored).toEqual(expect.arrayContaining(['page', 'brain', 'ledger']));
    expect(store.files.get(item.path.slice(1))!.toString()).toMatch(/<h1>[^]*?نسخهٔ دوم<\/h1>/);
    expect(ledger().items[0]).toMatchObject({ title: 'نسخهٔ دوم', state: 'live' });
    expect(brainOf().filter(e => e.id === item.id).map(e => e.title)).toEqual(['نسخهٔ دوم']);
    expect((await edit('نسخهٔ سوم')).statusCode).toBe(200);
    expect(brainOf().filter(e => e.id === item.id)).toHaveLength(1);
  });

  it('puts an uploaded image back from the DB backup at publish, and refuses one neither side has', async () => {
    const up = await app.inject({ method: 'POST', url: '/admin/quick-publish/media', headers: { ...headers, 'content-type': 'image/png' }, payload: PNG });
    const img = up.json().path as string;
    store.files.delete(img.slice(1));
    const r = await post(input('با عکس پاک‌شده', { body: body + `\n\n![x](${img})` }));
    expect(r.statusCode).toBe(200);
    expect(store.files.get(img.slice(1))).toEqual(PNG);

    await pool.query('delete from quick_publish_media where path = $1', [img.slice(1)]);
    store.files.delete(img.slice(1));
    const gone = await post(input('عکس گم‌شده', { body: body + `\n\n![x](${img})` }));
    expect(gone.statusCode).toBe(400);
    expect(gone.json()).toEqual({ error: 'image_not_uploaded' });
  });

  it('lists an item whose ledger line is gone as missing, and heals a dropped workflow flag', async () => {
    const a = (await post(input('نکتهٔ اول'))).json().item;
    const b = (await post(input('نکتهٔ دوم'))).json().item;
    await app.inject({ method: 'POST', url: '/admin/quick-publish/workflow', headers, payload: { ids: [a.id], requested: true } });
    const flag = ledger().items[0].workflow_requested_at as string;
    expect(typeof flag).toBe('string');

    // A deploy's sync overwrote the ledger with a copy that has no flag.
    const l = ledger(); delete l.items[0].workflow_requested_at;
    store.files.set(LEDGER_KEY, Buffer.from(JSON.stringify(l)));
    const s1 = await getStatus();
    expect(s1.items.find((i: { id: string }) => i.id === a.id).workflow_requested_at).toBe(flag);
    expect(ledger().items[0].workflow_requested_at).toBe(flag);

    // The whole ledger line of b is gone, but the DB backup exists.
    const l2 = ledger(); l2.items = l2.items.filter(i => i.id !== b.id);
    store.files.set(LEDGER_KEY, Buffer.from(JSON.stringify(l2)));
    const s2 = await getStatus();
    const missing = s2.items.find((i: { id: string }) => i.id === b.id);
    expect(missing).toMatchObject({ id: b.id, missing: true, title: 'نکتهٔ دوم' });
    expect(missing.body).toBeUndefined();
    expect(s2.items.find((i: { id: string }) => i.id === a.id).missing).toBeUndefined();

    // Restore puts the ledger line back and the item stops being «missing».
    expect((await restoreOf(b.id)).json().restored).toContain('ledger');
    const s3 = await getStatus();
    expect(s3.items.every((i: { missing?: boolean }) => !i.missing)).toBe(true);
  });

  it('finishes the job on a retry by the same ref after a failed ledger PUT (existing ledger)', async () => {
    store.files.set('insight/index.html', Buffer.from(landingFile('insight')));
    await post(input('نکتهٔ پیشین')); // the ledger key exists from here on
    const ref = 'draft-cccc3333';
    store.failOnce(LEDGER_KEY);
    const failed = await post(input('نکتهٔ ledger-fail', { ref }));
    expect(failed.statusCode).toBe(502);
    expect(ledger().items).toHaveLength(1);
    const [row] = (await pool.query(`select record from quick_publications where record->>'client_ref' = $1`, [ref])).rows;
    const item = row.record;
    expect(store.files.has(item.path.slice(1))).toBe(false);
    const again = await post(input('نکتهٔ ledger-fail', { ref }));
    expect(again.statusCode).toBe(200);
    expect(again.json().item.id).toBe(item.id);
    expect(store.files.get(item.path.slice(1))!.toString()).toMatch(/<h1>[^]*?نکتهٔ ledger-fail<\/h1>/);
    expect(brainOf().filter(e => e.id === item.id)).toHaveLength(1);
    expect(store.files.get('insight/index.html')!.toString()).toContain(`<a href="insight-${item.n}.html">`);
    expect(ledger().items.map(i => i.id)).toContain(item.id);
    expect(ledger().items).toHaveLength(2);
  });

  it('after a failed FIRST ledger PUT (no ledger key yet) the retry with the same ref finishes the job', async () => {
    store.files.set('insight/index.html', Buffer.from(landingFile('insight')));
    const ref = 'draft-dddd4444';
    store.failOnce(LEDGER_KEY);
    expect((await post(input('نکتهٔ اول ledger-fail', { ref }))).statusCode).toBe(502);
    expect(store.files.has(LEDGER_KEY)).toBe(false);
    // The draft's ref is looked up before the wiped-ledger guard, so the retry completes it.
    const again = await post(input('نکتهٔ اول ledger-fail', { ref }));
    expect(again.statusCode).toBe(200);
    // Without a ref, a ledger still missing while backups exist is refused (wipe guard).
    store.files.delete(LEDGER_KEY);
    expect((await post(input('بدون ref'))).json()).toEqual({ error: 'ledger_missing' });
    await restoreOf(again.json().item.id);
    const item = (await pool.query(`select record from quick_publications where record->>'client_ref' = $1`, [ref])).rows[0].record;
    expect((await restoreOf(item.id)).statusCode).toBe(200);
    expect(store.files.get(item.path.slice(1))!.toString()).toContain('نکتهٔ اول ledger-fail');
    expect(brainOf().filter(e => e.id === item.id)).toHaveLength(1);
    expect(store.files.get('insight/index.html')!.toString()).toContain(`<a href="insight-${item.n}.html">`);
    expect(ledger().items.map(i => i.id)).toEqual([item.id]);
  });

  it('finishes the job on a retry by the same ref after a failed brain PUT: page, brain, landing and ledger all land', async () => {
    store.files.set('insight/index.html', Buffer.from(landingFile('insight')));
    const ref = 'draft-eeee5555';
    store.failOnce(BRAIN_KEY);
    expect((await post(input('نکتهٔ brain-fail', { ref }))).statusCode).toBe(502);
    const again = await post(input('نکتهٔ brain-fail', { ref }));
    expect(again.statusCode).toBe(200);
    const item = again.json().item;
    expect(store.files.get(item.path.slice(1))!.toString()).toContain('نکتهٔ brain-fail');
    expect(brainOf().filter(e => e.id === item.id)).toHaveLength(1);
    expect(store.files.get('insight/index.html')!.toString()).toContain(`<a href="insight-${item.n}.html">`);
    expect(ledger().items.map(i => i.id)).toEqual([item.id]);
  });

  it('restore re-adds the brain entry in the repo key order (top level and pillar)', async () => {
    const repoBrain = JSON.parse(brainText) as Record<string, any>[];
    for (const type of ['clinical', 'chairside', 'meta', 'sharehub'] as QpType[]) {
      const { item } = (await post({ type, title: 'ترتیب کلید', caption: 'کپشن کوتاه برای ترتیب', body })).json();
      store.files.set(BRAIN_KEY, Buffer.from(brainText)); // brain back to git's copy
      const r = await restoreOf(item.id);
      expect(r.json().restored).toContain('brain');
      const tail = JSON.parse(store.files.get(BRAIN_KEY)!.toString()).at(-1);
      expect(tail.id).toBe(item.id);
      const latest = repoBrain.filter(e => e.type === type).at(-1)!;
      expect(Object.keys(tail)).toEqual(Object.keys(brainEntry(type, item.n, item.path, 'ترتیب کلید', 'کپشن کوتاه برای ترتیب')));
      expect(Object.keys(tail)).toEqual(Object.keys(latest));
      expect(Object.keys(tail.pillar)).toEqual(['primary', 'secondary', 'subtopic']);
    }
    const { item } = (await post(input('کلیدها'))).json();
    store.files.set(BRAIN_KEY, Buffer.from(brainText));
    await restoreOf(item.id);
    expect(Object.keys(brainOf().at(-1)!)).toEqual(['type', 'id', 'title', 'caption', 'hashtags', 'keywords', 'page_url', 'pillar']);
  });

  it('restore leaves a page git owns alone when the ledger was wiped (git_owned)', async () => {
    const { item } = (await post(input('صفحهٔ گیت'))).json();
    store.files.delete(LEDGER_KEY);
    store.files.set(item.path.slice(1), Buffer.from('<html>git completed version</html>'));
    const brainBefore = store.files.get(BRAIN_KEY)!.toString();
    const r = await restoreOf(item.id);
    expect(r.statusCode).toBe(200);
    expect(r.json().restored).toEqual(['git_owned']);
    expect(store.files.get(item.path.slice(1))!.toString()).toBe('<html>git completed version</html>');
    expect(store.files.get(BRAIN_KEY)!.toString()).toBe(brainBefore);
    expect(store.files.has(LEDGER_KEY)).toBe(false);
  });

  describe('wiped ledger safety', () => {
    it('refuses to publish, never recreates the ledger on switch or status, and restore brings it back', async () => {
      const a = (await post(input('نکتهٔ الف'))).json().item;
      const b = (await post(input('نکتهٔ ب'))).json().item;
      store.files.delete(LEDGER_KEY);

      const refused = await post(input('نکتهٔ ج'));
      expect(refused.statusCode).toBe(409);
      expect(refused.json()).toEqual({ error: 'ledger_missing' });
      expect(store.files.has(LEDGER_KEY)).toBe(false);

      const sw = await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: true } });
      expect(sw.statusCode).toBe(200);
      expect(sw.json()).toEqual({ ok: true, enabled: true, ledger_written: false });
      expect(store.files.has(LEDGER_KEY)).toBe(false);

      const st = await getStatus();
      expect(store.files.has(LEDGER_KEY)).toBe(false);
      expect(st.items.map((i: { id: string }) => i.id)).toEqual([a.id, b.id]);
      expect(st.items.every((i: { missing?: boolean }) => i.missing === true)).toBe(true);

      expect((await restoreOf(a.id)).json().restored).toContain('ledger');
      expect(store.files.has(LEDGER_KEY)).toBe(true);
      expect(ledger().items.map(i => i.id)).toEqual([a.id]);
      const st2 = await getStatus();
      expect(st2.items.find((i: { id: string }) => i.id === b.id).missing).toBe(true);
      expect(st2.items.find((i: { id: string }) => i.id === a.id).missing).toBeUndefined();
    });
  });

  describe('section landing lists', () => {
    const lineOf = (text: string, href: string) => text.split('\n').find(l => l.includes(`<a href="${href}">`))!;
    const hrefCount = (text: string, href: string) => text.split(`<a href="${href}">`).length - 1;

    it('adds a clinical item directly above the previous top item, keeping its indent and line ending, and edits it in place', async () => {
      const original = landingFile('insight');
      store.files.set('insight/index.html', Buffer.from(original));
      const topN = Math.max(...[...original.matchAll(/<li><a href="insight-(\d+)\.html">/g)].map(m => Number(m[1])));
      const topLine = lineOf(original, `insight-${topN}.html`);
      const indent = topLine.match(/^[ \t]*/)![0];
      const eol = topLine.endsWith('\r') ? '\r\n' : '\n';

      const { item } = (await post(input('نکتهٔ تازهٔ فهرست'))).json();
      expect(item.n).toBe(topN + 1);
      const href = `insight-${item.n}.html`;
      expect(item.landing).toMatchObject({ file: 'insight/index.html', href, order: 'top', line: `<li><a href="${href}">نکتهٔ تازهٔ فهرست</a></li>` });
      const after = store.files.get('insight/index.html')!.toString();
      const newLine = `${indent}<li><a href="${href}">نکتهٔ تازهٔ فهرست</a></li>${eol}`;
      expect(after).toContain(newLine + topLine.replace(/\r$/, '') + (eol === '\r\n' ? '\r' : ''));
      expect(after.replace(newLine, '')).toBe(original);

      const ed = await put(item.id, { type: 'clinical', title: 'عنوان ویرایش‌شده', caption: 'کپشن کوتاه برای این نکته', body });
      expect(ed.statusCode).toBe(200);
      const edited = store.files.get('insight/index.html')!.toString();
      expect(hrefCount(edited, href)).toBe(1);
      expect(edited).toBe(after.replace('نکتهٔ تازهٔ فهرست', 'عنوان ویرایش‌شده'));
      expect(ed.json().item.landing.line).toContain('عنوان ویرایش‌شده');
    });

    it('appends a meta item after the highest meta line, labelled «متانوت <words>: …»', async () => {
      const original = landingFile('metanotes');
      store.files.set('metanotes/index.html', Buffer.from(original));
      const topN = Math.max(...[...original.matchAll(/<li><a href="meta-(\d+)\.html">/g)].map(m => Number(m[1])));
      const r = await post({ type: 'meta', title: 'عنوان متا', caption: 'کپشن کوتاه برای متا', body });
      expect(r.statusCode).toBe(200);
      const { item } = r.json();
      expect(item.n).toBe(topN + 1);
      expect(item.landing.order).toBe('bottom');
      expect(item.landing.line).toBe(`<li><a href="meta-${item.n}.html">متانوت ${faNumberWords(item.n)}: عنوان متا</a></li>`);
      if (item.n === 23) expect(item.landing.line).toContain('متانوت بیست‌وسه: عنوان متا');
      const after = store.files.get('metanotes/index.html')!.toString();
      const prevLine = lineOf(original, `meta-${topN}.html`);
      const indent = prevLine.match(/^[ \t]*/)![0];
      const eol = prevLine.endsWith('\r') ? '\r\n' : '\n';
      const idx = after.indexOf(prevLine);
      expect(after.slice(idx + prevLine.length - (eol === '\r\n' ? 1 : 0))).toMatch(
        new RegExp('^' + eol.replace(/\r/g, '\\r').replace(/\n/g, '\\n') + indent + '<li><a href="meta-' + item.n + '\\.html">'));
      expect(after.replace(`${indent}${item.landing.line}${eol}`, '')).toBe(original);
    });

    it('publishes fine without a landing file, with item.landing null', async () => {
      const r = await post(input('بدون فهرست'));
      expect(r.statusCode).toBe(200);
      expect(r.json().item.landing).toBeNull();
      expect(store.files.has('insight/index.html')).toBe(false);
    });
  });
  });
});
