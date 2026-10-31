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
  setEnabled, BRAIN_KEY, LEDGER_KEY, TEMPLATE_KEY, type SiteStore, type QpType,
} from '../src/services/quick-publish.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const brainText = fs.readFileSync(path.join(repo, 'dentcast-brain.json'), 'utf8');
const template = fs.readFileSync(path.join(repo, 'quick-publish/template.html'), 'utf8');
const headers = { authorization: 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64') };
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

function memoryStore(seed: Record<string, string>): SiteStore & { files: Map<string, Buffer> } {
  const files = new Map(Object.entries(seed).map(([k, v]) => [k, Buffer.from(v)]));
  return { files, async get(k) { return files.get(k) ?? null; }, async put(k, b) { files.set(k, Buffer.from(b)); } };
}

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
    expect(html).not.toMatch(/\{\{[A-Z_]+\}\}|qp-template|noindex/);
    expect(html).toContain('<link rel="canonical" href="https://dentcast.org/insight/insight-101.html">');
    expect(html).toContain('<link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/insight/insight-101.html">');
    expect(html).toContain('<meta name="robots" content="index, follow, max-image-preview:large">');
    expect(html).toContain("gtag('config', 'G-GMM0WC8X3M')");
    expect(html).toContain('<link rel="preconnect" href="https://api.dentcast.ir" crossorigin>');
    expect(html).toContain('<h1>عنوان &quot;نقل‌قول&quot; &lt;و&gt;</h1>');
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
  });

  it('appends at the absolute tail of the real brain without touching a byte before it', () => {
    const entry = brainEntry('clinical', 101, '/insight/insight-101.html', 'ع', 'ک');
    const next = appendBrainEntry(brainText, entry);
    const head = brainText.slice(0, brainText.lastIndexOf(']')).replace(/\s+$/, '');
    expect(next.startsWith(head + ',\n')).toBe(true);
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
    expect(page).toContain('<h1>یک نکته</h1>');
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
    const on = await app.inject({ method: 'PUT', url: '/admin/quick-publish/enabled', headers, payload: { enabled: true } });
    expect(on.statusCode).toBe(200);
    expect(on.json()).toEqual({ ok: true, enabled: true });
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
});
