// Emergency minimal publish («انتشار حداقلی») — the founder publishes from a
// phone through /admin while GitHub is out of reach. The API writes straight to
// the Arvan bucket that serves dentcast.ir: the page (from the site's own
// quick-publish/template.html), one entry at the tail of dentcast-brain.json,
// and quick-publish/ledger.json, the list of everything published this way.
//
// The ledger is what keeps git the source of truth. tools/quick_publish.py
// imports every ledger item into the repo after the link returns, and both
// deploys refuse to sync while the bucket ledger holds something git does not —
// their `--delete` would otherwise erase these pages. Each imported item then
// goes through the full publishing workflow. Owner doc: .dentcast/quick-publish.md
import crypto, { randomUUID } from 'node:crypto';
import { one, query } from '../db.js';

export const QP_TYPES = {
  clinical: { label: 'Insight — نکتهٔ کلینیکی', folder: 'insight', stem: 'insight-', id: (n: number) => `clinical-${n}`, urlKey: 'page_url', section: 'Clinical Insight' },
  chairside: { label: 'Chairside — کیس و تصمیم بالینی', folder: 'chairside', stem: 'chairside-', id: (n: number) => `chairside-${n}`, urlKey: 'page_url', section: 'Chairside' },
  meta: { label: 'MetaNote — متانوت', folder: 'metanotes', stem: 'meta-', id: (n: number) => `meta-${n}`, urlKey: 'page_url', section: 'Meta Note' },
  sharehub: { label: 'Share Hub — خوانش مقاله', folder: 'sharehub', stem: 'share-', id: (n: number) => String(n), urlKey: 'url', section: 'Share Hub' },
} as const;
export type QpType = keyof typeof QP_TYPES;
export const isQpType = (t: unknown): t is QpType => typeof t === 'string' && Object.hasOwn(QP_TYPES, t);

export const BRAIN_KEY = 'dentcast-brain.json';
export const LEDGER_KEY = 'quick-publish/ledger.json';
export const TEMPLATE_KEY = 'quick-publish/template.html';
export const MEDIA_PREFIX = 'quick-publish/media/';
export const MAX_QP_IMAGE_BYTES = 8 * 1024 * 1024;
const IR_ORIGIN = 'https://dentcast.ir';
const ORG_ORIGIN = 'https://dentcast.org';

// ── storage ────────────────────────────────────────────────────────────────

export interface SiteStore {
  get(key: string): Promise<Buffer | null>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
}

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const sha256 = (b: Buffer | string) => crypto.createHash('sha256').update(b).digest('hex');
const hmac = (key: Buffer | string, s: string) => crypto.createHmac('sha256', key).update(s).digest();

/** AWS Signature V4 for one S3 request; pure so it can be checked against AWS's published vector. */
export function signV4(o: { method: string; host: string; path: string; headers: Record<string, string>;
  payloadHash: string; accessKey: string; secretKey: string; region: string; amzDate: string }): string {
  const day = o.amzDate.slice(0, 8);
  const all: Record<string, string> = { ...o.headers, host: o.host, 'x-amz-date': o.amzDate, 'x-amz-content-sha256': o.payloadHash };
  const names = Object.keys(all).map(k => k.toLowerCase()).sort();
  const lower = Object.fromEntries(Object.entries(all).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const signed = names.join(';');
  const canonical = [o.method, o.path, '', names.map(n => `${n}:${lower[n]}\n`).join(''), signed, o.payloadHash].join('\n');
  const scope = `${day}/${o.region}/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', o.amzDate, scope, sha256(canonical)].join('\n');
  const key = hmac(hmac(hmac(hmac('AWS4' + o.secretKey, day), o.region), 's3'), 'aws4_request');
  return `AWS4-HMAC-SHA256 Credential=${o.accessKey}/${scope}, SignedHeaders=${signed}, Signature=${hmac(key, toSign).toString('hex')}`;
}

export function s3Store(c: { endpoint: string; bucket: string; accessKey: string; secretKey: string; region: string }): SiteStore {
  const base = new URL(c.endpoint);
  const request = async (method: 'GET' | 'PUT', key: string, body?: Buffer, contentType?: string) => {
    const path = '/' + enc(c.bucket) + '/' + key.split('/').map(enc).join('/');
    const payloadHash = sha256(body ?? '');
    const amzDate = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const headers: Record<string, string> = body ? { 'content-type': contentType!, 'cache-control': 'no-cache' } : {};
    const authorization = signV4({ method, host: base.host, path, headers, payloadHash, accessKey: c.accessKey, secretKey: c.secretKey, region: c.region, amzDate });
    return fetch(base.origin + path, { method, body, signal: AbortSignal.timeout(30_000),
      headers: { ...headers, 'x-amz-date': amzDate, 'x-amz-content-sha256': payloadHash, authorization } });
  };
  return {
    async get(key) {
      const r = await request('GET', key);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`qp_storage_http_${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    },
    async put(key, body, contentType) {
      const r = await request('PUT', key, body, contentType);
      if (!r.ok) throw new Error(`qp_storage_http_${r.status}`);
    },
  };
}

let storeOverride: SiteStore | null = null;
/** Tests swap in an in-memory bucket. */
export function setSiteStore(s: SiteStore | null): void { storeOverride = s; }
export function siteStore(): SiteStore | null {
  if (storeOverride) return storeOverride;
  const e = process.env;
  if (!e.QP_S3_ENDPOINT || !e.QP_S3_BUCKET || !e.QP_S3_ACCESS_KEY || !e.QP_S3_SECRET_KEY) return null;
  return s3Store({ endpoint: e.QP_S3_ENDPOINT, bucket: e.QP_S3_BUCKET, accessKey: e.QP_S3_ACCESS_KEY,
    secretKey: e.QP_S3_SECRET_KEY, region: e.QP_S3_REGION || 'us-east-1' });
}
function requireStore(): SiteStore {
  const s = siteStore();
  if (!s) throw new QpError('storage_not_configured', 503);
  return s;
}

export class QpError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

// ── body markup ────────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const safeHref = (u: string) => /^(https?:\/\/|\/)[^\s"'<>]*$/.test(u) && !u.startsWith('//');
const MEDIA_RE = /^\/quick-publish\/media\/[a-z0-9-]+\.(?:webp|png|jpe?g|gif)$/;

function inline(s: string): string {
  let out = '', i = 0;
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  for (let m: RegExpExecArray | null; (m = re.exec(s));) {
    out += esc(s.slice(i, m.index));
    if (m[1] !== undefined) out += '<strong>' + esc(m[1]) + '</strong>';
    else if (safeHref(m[3])) out += `<a href="${esc(m[3])}"${m[3].startsWith('/') ? '' : ' rel="noopener"'}>${esc(m[2])}</a>`;
    else out += esc(m[0]);
    i = m.index + m[0].length;
  }
  return out + esc(s.slice(i));
}

/**
 * A phone-typeable subset of Markdown: blank line between paragraphs, «## »/«### »
 * headings, «- » or «۱. »/«1. » lists, **bold**, [text](link), and an uploaded
 * image alone on its line as ![caption](/quick-publish/media/…). Everything
 * else is text, escaped.
 */
export function renderBody(src: string): { html: string; media: string[]; firstBlock: string | null } {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [], media: string[] = [];
  let para: string[] = [], list: { tag: 'ul' | 'ol'; items: string[] } | null = null, firstBlock: string | null = null;
  const mark = (b: string) => { if (firstBlock === null) firstBlock = b; };
  const flush = () => {
    if (para.length) { mark('p'); out.push('<p>' + para.map(inline).join('<br>\n') + '</p>'); para = []; }
    if (list) { mark(list.tag); out.push(`<${list.tag}>\n` + list.items.map(t => '  <li>' + inline(t) + '</li>').join('\n') + `\n</${list.tag}>`); list = null; }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{2,3})\s+(.+)$/))) { flush(); mark('h'); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      flush();
      if (!MEDIA_RE.test(m[2])) throw new QpError('invalid_image_reference');
      media.push(m[2].slice(1)); mark('img');
      out.push(`<img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy" decoding="async">`);
      continue;
    }
    const ul = line.match(/^[-•*]\s+(.+)$/), ol = line.match(/^[0-9۰-۹]+[.)]\s+(.+)$/);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      if (para.length || (list && list.tag !== tag)) flush();
      (list ??= { tag, items: [] }).items.push((ul ?? ol)![1]);
      continue;
    }
    if (list) flush();
    para.push(line);
  }
  flush();
  return { html: out.join('\n\n'), media: [...new Set(media)], firstBlock };
}

// ── brain / ledger text ───────────────────────────────────────────────────

/** Serialised the way the repo's brain is: two-space JSON, entries indented by two. */
export function serialiseEntry(entry: object): string {
  return JSON.stringify(entry, null, 2).split('\n').map(l => '  ' + l).join('\n');
}
/** Append at the absolute tail without re-serialising the rest of the file. */
export function appendBrainEntry(text: string, entry: object): string {
  const end = text.lastIndexOf(']');
  if (end < 0) throw new QpError('brain_unreadable', 502);
  const head = text.slice(0, end).replace(/\s+$/, '');
  const empty = head.endsWith('[');
  const next = head + (empty ? '\n' : ',\n') + serialiseEntry(entry) + '\n]\n';
  JSON.parse(next);
  return next;
}
/** Swap one of OUR entries (serialised by serialiseEntry) in place; null if it is not there verbatim. */
export function replaceBrainEntry(text: string, before: object, after: object): string | null {
  const old = serialiseEntry(before);
  const at = text.indexOf(old);
  if (at < 0 || text.indexOf(old, at + 1) >= 0) return null;
  const next = text.slice(0, at) + serialiseEntry(after) + text.slice(at + old.length);
  JSON.parse(next);
  return next;
}

export interface QpItem {
  id: string; type: QpType; n: number; path: string; title: string; caption: string; date: string;
  media: string[]; brain_entry: Record<string, unknown>; created_at: string; updated_at: string;
  state: 'live' | 'imported' | 'completed'; imported_at: string | null; completed_at: string | null;
  /** Set only by the founder's «بفرست تو ورک‌فلو»; nothing goes to the full workflow on its own. */
  workflow_requested_at?: string | null;
}
interface Ledger { version: 1; items: QpItem[] }

function parseLedger(b: Buffer | null): Ledger {
  if (!b) return { version: 1, items: [] };
  const j = JSON.parse(b.toString('utf8'));
  if (!j || !Array.isArray(j.items)) throw new QpError('ledger_unreadable', 502);
  return j as Ledger;
}
const ledgerBytes = (l: Ledger) => Buffer.from(JSON.stringify(l, null, 2) + '\n');

// ── page ───────────────────────────────────────────────────────────────────

export function tehranDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const jsonStr = (s: string) => JSON.stringify(s).slice(1, -1).replace(/</g, '\\u003c');

export function renderPage(template: string, o: { type: QpType; path: string; title: string; caption: string; date: string; body: string }): string {
  const t = QP_TYPES[o.type];
  const tokens: Record<string, string> = {
    TITLE: esc(o.title), TITLE_JSON: jsonStr(o.title), DESCRIPTION: esc(o.caption), DESCRIPTION_JSON: jsonStr(o.caption),
    CANONICAL: ORG_ORIGIN + o.path, IR_URL: IR_ORIGIN + o.path, DATE: o.date,
    SECTION_NAME: jsonStr(t.section), SECTION_PATH: `/${t.folder}/`, BODY: o.body,
  };
  if (!template.includes('data-qp-template') || !template.includes('{{BODY}}')) throw new QpError('template_invalid', 502);
  return template
    .replace(/<!-- qp-template:[\s\S]*?-->\n?/g, '')
    .replace(/<meta name="robots" content="noindex, nofollow" data-qp-template>/, '<meta name="robots" content="index, follow, max-image-preview:large">')
    .replace(/\{\{([A-Z_]+)\}\}/g, (m, k: string) => (Object.hasOwn(tokens, k) ? tokens[k] : m));
}

/** Same key set and order as the latest entries of each type in the repo's brain (schema parity). */
export function brainEntry(type: QpType, n: number, path: string, title: string, caption: string): Record<string, unknown> {
  const t = QP_TYPES[type];
  const pillar = { primary: null, secondary: [], subtopic: null };
  if (type === 'sharehub') {
    return { type, id: t.id(n), title, caption, author: 'دکتر فواد شهابیان', source: ORG_ORIGIN,
      hashtags: [], keywords: [], url: path, pillar };
  }
  return { type, id: t.id(n), title, caption, hashtags: [], keywords: [], [t.urlKey]: path, pillar };
}

function numberFrom(entryUrl: unknown, type: QpType): number {
  const t = QP_TYPES[type];
  const m = typeof entryUrl === 'string' && entryUrl.match(new RegExp(`^/${t.folder}/${t.stem}(\\d+)\\.html$`));
  return m ? Number(m[1]) : 0;
}

// ── operations ────────────────────────────────────────────────────────────

let chain: Promise<unknown> = Promise.resolve();
/** One writer at a time: the brain and the ledger are read-modify-write. */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

// ── on/off ────────────────────────────────────────────────────────────────

/** Off by default: this path exists for a cut, not for normal publishing. */
export async function isEnabled(): Promise<boolean> {
  return !!(await one<{ enabled: boolean }>('select enabled from quick_publish_settings where id = true'))?.enabled;
}
export async function setEnabled(enabled: boolean): Promise<void> {
  await query(`insert into quick_publish_settings (id, enabled) values (true, $1)
    on conflict (id) do update set enabled = excluded.enabled, updated_at = now()`, [enabled]);
}
async function requireEnabled(): Promise<void> {
  if (!(await isEnabled())) throw new QpError('disabled', 403);
}

export interface QpInput { type: unknown; title: unknown; caption: unknown; body: unknown }
function validate(i: QpInput): { type: QpType; title: string; caption: string; body: string } {
  if (!isQpType(i.type)) throw new QpError('invalid_type');
  const title = typeof i.title === 'string' ? i.title.trim().replace(/\s+/g, ' ') : '';
  const caption = typeof i.caption === 'string' ? i.caption.trim().replace(/\s+/g, ' ') : '';
  const body = typeof i.body === 'string' ? i.body : '';
  if (title.length < 3 || title.length > 200) throw new QpError('invalid_title');
  if (caption.length < 10 || caption.length > 400) throw new QpError('invalid_caption');
  if (body.trim().length < 20 || body.length > 60_000) throw new QpError('invalid_body');
  return { type: i.type, title, caption, body };
}

export function preview(body: unknown): { html: string; warning: string | null } {
  if (typeof body !== 'string' || body.length > 60_000) throw new QpError('invalid_body');
  const r = renderBody(body);
  return { html: r.html, warning: r.firstBlock && r.firstBlock !== 'p' ? 'first_block_not_paragraph' : null };
}

async function readText(store: SiteStore, key: string, missing: string): Promise<string> {
  const b = await store.get(key);
  if (!b) throw new QpError(missing, 409);
  return b.toString('utf8');
}

async function writeLive(store: SiteStore, item: QpItem, html: string, brainText: string, ledger: Ledger): Promise<void> {
  await store.put(item.path.slice(1), Buffer.from(html), 'text/html; charset=utf-8');
  await store.put(BRAIN_KEY, Buffer.from(brainText), 'application/json; charset=utf-8');
  await store.put(LEDGER_KEY, ledgerBytes(ledger), 'application/json; charset=utf-8');
}

async function backup(item: QpItem, html: string, body: string): Promise<void> {
  await query(`insert into quick_publications (id, type, record, html) values ($1, $2, $3, $4)
    on conflict (id) do update set record = excluded.record, html = excluded.html, updated_at = now()`,
  [item.id, item.type, JSON.stringify({ ...item, body }), html]);
}

export function publish(input: QpInput): Promise<{ item: QpItem; url: string }> {
  const v = validate(input);
  const rendered = renderBody(v.body);
  if (rendered.firstBlock !== 'p') throw new QpError('first_block_not_paragraph');
  return serial(async () => {
    await requireEnabled();
    const store = requireStore();
    const template = await readText(store, TEMPLATE_KEY, 'template_missing');
    let brainText = await readText(store, BRAIN_KEY, 'brain_missing');
    const brain = JSON.parse(brainText) as Record<string, unknown>[];
    const ledger = parseLedger(await store.get(LEDGER_KEY));
    await assertMedia(store, rendered.media);
    const t = QP_TYPES[v.type];
    let n = Math.max(0, ...brain.filter(e => e.type === v.type).map(e => numberFrom(e[t.urlKey] ?? e.url ?? e.page_url, v.type)),
      ...ledger.items.filter(x => x.type === v.type).map(x => x.n)) + 1;
    // A page already at that address means the bucket and its brain disagree;
    // never overwrite someone else's page — take the next free number.
    for (let tries = 0; await store.get(`${t.folder}/${t.stem}${n}.html`); tries++) {
      if (tries >= 5) throw new QpError('no_free_address', 409);
      n++;
    }
    const path = `/${t.folder}/${t.stem}${n}.html`;
    const now = new Date().toISOString();
    const entry = brainEntry(v.type, n, path, v.title, v.caption);
    const item: QpItem = { id: entry.id as string, type: v.type, n, path, title: v.title, caption: v.caption, date: tehranDate(),
      media: rendered.media, brain_entry: entry, created_at: now, updated_at: now, state: 'live', imported_at: null, completed_at: null };
    if (brain.some(e => e.id === item.id && e.type === item.type)) throw new QpError('id_taken', 409);
    const html = renderPage(template, { ...item, body: rendered.html });
    brainText = appendBrainEntry(brainText, entry);
    ledger.items.push(item);
    await backup(item, html, v.body);
    await writeLive(store, item, html, brainText, ledger);
    return { item, url: IR_ORIGIN + path };
  });
}

export function edit(id: string, input: QpInput): Promise<{ item: QpItem; url: string }> {
  const v = validate(input);
  const rendered = renderBody(v.body);
  if (rendered.firstBlock !== 'p') throw new QpError('first_block_not_paragraph');
  return serial(async () => {
    await requireEnabled();
    const store = requireStore();
    const template = await readText(store, TEMPLATE_KEY, 'template_missing');
    let brainText = await readText(store, BRAIN_KEY, 'brain_missing');
    const ledger = parseLedger(await store.get(LEDGER_KEY));
    const at = ledger.items.findIndex(x => x.id === id);
    if (at < 0) throw new QpError('not_found', 404);
    const old = ledger.items[at];
    if (old.state !== 'live') throw new QpError('already_imported', 409);
    if (old.type !== v.type) throw new QpError('type_locked');
    await assertMedia(store, rendered.media);
    const entry = brainEntry(old.type, old.n, old.path, v.title, v.caption);
    const swapped = replaceBrainEntry(brainText, old.brain_entry, entry);
    if (swapped === null) throw new QpError('brain_entry_moved', 409);
    brainText = swapped;
    const item: QpItem = { ...old, title: v.title, caption: v.caption, media: rendered.media, brain_entry: entry, updated_at: new Date().toISOString() };
    const html = renderPage(template, { ...item, body: rendered.html });
    ledger.items[at] = item;
    await backup(item, html, v.body);
    await writeLive(store, item, html, brainText, ledger);
    return { item, url: IR_ORIGIN + item.path };
  });
}

/** Put a backed-up record back on the bucket: page, images, brain entry, ledger line. Idempotent. */
export function restore(id: string): Promise<{ restored: string[] }> {
  return serial(async () => {
    const store = requireStore();
    const row = await one<{ record: QpItem; html: string }>('select record, html from quick_publications where id = $1', [id]);
    if (!row) throw new QpError('not_found', 404);
    const { body: _body, ...item } = row.record as QpItem & { body?: string };
    const restored: string[] = [];
    if (!(await store.get(item.path.slice(1)))) {
      await store.put(item.path.slice(1), Buffer.from(row.html), 'text/html; charset=utf-8'); restored.push('page');
    }
    for (const m of item.media) {
      if (await store.get(m)) continue;
      const media = await one<{ content_type: string; data: Buffer }>('select content_type, data from quick_publish_media where path = $1', [m]);
      if (media) { await store.put(m, media.data, media.content_type); restored.push(m); }
    }
    const brainText = await readText(store, BRAIN_KEY, 'brain_missing');
    const brain = JSON.parse(brainText) as Record<string, unknown>[];
    if (!brain.some(e => e.id === item.id && e.type === item.type)) {
      await store.put(BRAIN_KEY, Buffer.from(appendBrainEntry(brainText, item.brain_entry)), 'application/json; charset=utf-8'); restored.push('brain');
    }
    const ledger = parseLedger(await store.get(LEDGER_KEY));
    if (!ledger.items.some(x => x.id === item.id)) {
      ledger.items.push(item);
      await store.put(LEDGER_KEY, ledgerBytes(ledger), 'application/json; charset=utf-8'); restored.push('ledger');
    }
    return { restored };
  });
}

const IMAGE_TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif' };
export function imageExtension(buffer: Buffer, contentType: string): string | null {
  const ext = IMAGE_TYPES[contentType];
  if (!ext || buffer.length < 12 || buffer.length > MAX_QP_IMAGE_BYTES) return null;
  const sig = buffer.subarray(0, 12);
  const ok = ext === 'png' ? sig.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    : ext === 'jpg' ? sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff
    : ext === 'gif' ? sig.subarray(0, 4).toString('latin1') === 'GIF8'
    : sig.subarray(0, 4).toString('latin1') === 'RIFF' && sig.subarray(8, 12).toString('latin1') === 'WEBP';
  return ok ? ext : null;
}

export async function uploadImage(buffer: Buffer, contentType: string): Promise<string> {
  const ext = imageExtension(buffer, contentType);
  if (!ext) throw new QpError('invalid_image');
  await requireEnabled();
  const store = requireStore();
  const key = `${MEDIA_PREFIX}${tehranDate().replace(/-/g, '')}-${randomUUID().slice(0, 8)}.${ext}`;
  await query('insert into quick_publish_media (path, content_type, data) values ($1, $2, $3)', [key, contentType, buffer]);
  await store.put(key, buffer, contentType);
  return '/' + key;
}

async function assertMedia(store: SiteStore, media: string[]): Promise<void> {
  for (const m of media) {
    const known = await one('select 1 from quick_publish_media where path = $1', [m]);
    if (!known && !(await store.get(m))) throw new QpError('image_not_uploaded');
  }
}

/**
 * The founder's pick, after the link returns: which minimal publications go
 * through the full workflow. Writes only the flag; content and updated_at stay,
 * so an already-imported page is not re-imported, but the deploy guard still
 * holds until git has the flag too (tools/quick_publish.py import carries it).
 */
export function requestWorkflow(ids: string[], requested: boolean): Promise<{ changed: string[] }> {
  return serial(async () => {
    const store = requireStore();
    const ledger = parseLedger(await store.get(LEDGER_KEY));
    const byId = new Map(ledger.items.map(x => [x.id, x]));
    for (const id of ids) {
      const it = byId.get(id);
      if (!it) throw new QpError('not_found', 404);
      if (it.state === 'completed') throw new QpError('already_completed', 409);
    }
    const changed: string[] = [], now = new Date().toISOString();
    for (const id of ids) {
      const it = byId.get(id)!;
      if (!!it.workflow_requested_at === requested) continue;
      it.workflow_requested_at = requested ? now : null;
      changed.push(id);
    }
    if (changed.length) {
      await store.put(LEDGER_KEY, ledgerBytes(ledger), 'application/json; charset=utf-8');
      await query(`update quick_publications set record = jsonb_set(record, '{workflow_requested_at}', coalesce(to_jsonb($2::text), 'null'::jsonb)), updated_at = now()
        where id = any($1)`, [changed, requested ? now : null]);
    }
    return { changed };
  });
}

export async function status(): Promise<{ enabled: boolean; configured: boolean; template: boolean; items: QpItem[]; error?: string }> {
  const enabled = await isEnabled();
  const store = siteStore();
  if (!store) return { enabled, configured: false, template: false, items: [] };
  try {
    const [template, ledger] = await Promise.all([store.get(TEMPLATE_KEY), store.get(LEDGER_KEY)]);
    return { enabled, configured: true, template: !!template, items: parseLedger(ledger).items };
  } catch (err) {
    return { enabled, configured: true, template: false, items: [], error: (err as Error).message };
  }
}

/** The body as it was typed, for editing; the backup keeps it alongside the page. */
export async function source(id: string): Promise<{ item: QpItem; body: string } | null> {
  const row = await one<{ record: QpItem & { body?: string } }>('select record from quick_publications where id = $1', [id]);
  return row ? { item: row.record, body: row.record.body ?? '' } : null;
}
