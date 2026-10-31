// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderQuickPublish } from '../src/routes/admin-quick-publish.js';

let calls: { url: string; opts: any }[];
let fetcher: ReturnType<typeof vi.fn>;
let uploads: number;
let statusBody: Record<string, unknown>;
const response = (body: unknown) => ({ ok: true, json: async () => body });
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
function el<T extends HTMLElement>(id: string): T { return document.getElementById(id) as T; }
const radio = (v: string) => document.querySelector(`input[name="qpHasImages"][value="${v}"]`) as HTMLInputElement;

function boot() {
  const html = renderQuickPublish();
  document.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g, '');
  new Function('document', 'fetch', 'localStorage', 'confirm', 'alert', html.match(/<script>([\s\S]*?)<\/script>/)![1])(
    document, fetcher, window.localStorage, () => true, vi.fn());
}
function type(id: string, value: string) { const n = el<HTMLInputElement>(id); n.value = value; n.dispatchEvent(new Event('input')); }
function pick(...files: File[]) {
  const input = el<HTMLInputElement>('qpImage');
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new Event('change'));
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  window.localStorage.clear(); calls = []; uploads = 0;
  statusBody = { enabled: true, configured: true, template: true, items: [], types: { clinical: 'Insight', meta: 'Meta' } };
  fetcher = vi.fn(async (url: string, opts: any = {}) => {
    calls.push({ url: String(url), opts });
    if (url === '/admin/quick-publish' && !opts.method) return response(statusBody);
    if (url === '/admin/quick-publish/media') return response({ ok: true, path: `/quick-publish/media/20261101-0000000${++uploads}.jpg` });
    if (url === '/admin/quick-publish') return response({ ok: true, url: 'https://dentcast.ir/insight/insight-101.html', item: {} });
    if (opts.method === 'PUT' || url === '/admin/quick-publish/workflow') return response({ ok: true });
    return response({ html: '', warning: null });
  });
  boot();
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('quick publish panel — images', () => {
  it('asks about images up front and opens the upload box only on «yes»', async () => {
    await flush();
    expect(el('qpForm').hidden).toBe(false);
    const ask = document.querySelector('.qp-ask')!;
    expect(ask.compareDocumentPosition(el('qpTitle')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el('qpImageBox').hidden).toBe(true);
    radio('yes').checked = true; radio('yes').dispatchEvent(new Event('change'));
    expect(el('qpImageBox').hidden).toBe(false);
    radio('no').checked = true; radio('no').dispatchEvent(new Event('change'));
    expect(el('qpImageBox').hidden).toBe(true);
  });

  it('will not publish until the image question is answered', async () => {
    await flush();
    type('qpTitle', 'عنوان'); type('qpCaption', 'کپشن کوتاه مطلب'); type('qpBody', 'پاراگراف اول متن که به اندازه کافی بلند است.');
    el('qpForm').dispatchEvent(new Event('submit', { cancelable: true })); await flush();
    expect(calls.some(c => c.url === '/admin/quick-publish' && c.opts.method === 'POST')).toBe(false);
  });

  it('uploads several photos one by one, inserts one at the cursor and appends the rest at publish', async () => {
    await flush();
    radio('yes').checked = true; radio('yes').dispatchEvent(new Event('change'));
    type('qpTitle', 'عنوان'); type('qpCaption', 'کپشن کوتاه مطلب'); type('qpBody', 'پاراگراف اول.\n\nپاراگراف دوم.');
    pick(new File(['a'], 'a.jpg', { type: 'image/jpeg' }), new File(['b'], 'b.jpg', { type: 'image/jpeg' }));
    await flush();
    expect(calls.filter(c => c.url === '/admin/quick-publish/media').map(c => c.opts.headers['content-type'])).toEqual(['image/jpeg', 'image/jpeg']);
    const cards = el('qpImages').querySelectorAll('.qp-img');
    expect(cards).toHaveLength(2);
    const alt = cards[0].querySelector('input') as HTMLInputElement;
    alt.value = 'نمای اکلوزال'; alt.dispatchEvent(new Event('input'));
    const body = el<HTMLTextAreaElement>('qpBody');
    body.selectionStart = body.selectionEnd = 'پاراگراف اول.'.length;
    (cards[0].querySelector('button') as HTMLButtonElement).click();
    expect(body.value).toBe('پاراگراف اول.\n\n![نمای اکلوزال](/quick-publish/media/20261101-00000001.jpg)\n\n\n\nپاراگراف دوم.');
    expect(JSON.parse(window.localStorage.getItem('dc-qp-draft')!)).toMatchObject({ hasImages: 'yes', images: [{ alt: 'نمای اکلوزال' }, { alt: '' }] });

    el('qpForm').dispatchEvent(new Event('submit', { cancelable: true })); await flush();
    const sent = JSON.parse(calls.find(c => c.url === '/admin/quick-publish' && c.opts.method === 'POST')!.opts.body);
    expect(sent.body.match(/!\[[^\]]*\]\([^)]+\)/g)).toEqual([
      '![نمای اکلوزال](/quick-publish/media/20261101-00000001.jpg)', '![](/quick-publish/media/20261101-00000002.jpg)']);
    expect(sent.body.endsWith('![](/quick-publish/media/20261101-00000002.jpg)\n')).toBe(true);
  });

  it('brings the photos back with the phone draft', async () => {
    await flush();
    radio('yes').checked = true; radio('yes').dispatchEvent(new Event('change'));
    pick(new File(['a'], 'a.jpg', { type: 'image/jpeg' })); await flush();
    document.body.replaceChildren(); boot(); await flush();
    expect(radio('yes').checked).toBe(true);
    expect(el('qpImageBox').hidden).toBe(false);
    expect(el('qpImages').querySelectorAll('.qp-img')).toHaveLength(1);
  });
});

const qpItem = (o: Record<string, unknown>) => ({ type: 'clinical', n: 101, path: '/insight/insight-101.html', title: 'عنوان', caption: 'کپشن کوتاه مطلب',
  date: '2026-11-01', media: [], ...o });

describe('quick publish panel — switch and workflow picks', () => {
  it('hides the form while off and turns it on through the switch', async () => {
    statusBody = { ...statusBody, enabled: false };
    document.body.replaceChildren(); boot(); await flush();
    expect(el('qpForm').hidden).toBe(true);
    expect(el('qpSwitch').hidden).toBe(false);
    const btn = el<HTMLButtonElement>('qpSwitchBtn');
    expect(btn.textContent).toContain('روشن کردن');
    btn.click(); await flush();
    const put = calls.find(c => c.url === '/admin/quick-publish/enabled')!;
    expect(put.opts.method).toBe('PUT');
    expect(JSON.parse(put.opts.body)).toEqual({ enabled: true });
  });

  it('offers a checkbox for unsent items, sends the picked ones, and lets a sent one be withdrawn', async () => {
    statusBody = { ...statusBody, items: [
      qpItem({ id: 'clinical-101', state: 'imported' }),
      qpItem({ id: 'chairside-47', type: 'chairside', n: 47, path: '/chairside/chairside-47.html', state: 'live', workflow_requested_at: '2026-11-01T00:00:00Z' }),
    ] };
    document.body.replaceChildren(); boot(); await flush();
    const boxes = [...el('qpList').querySelectorAll('.qp-item')];
    expect(boxes).toHaveLength(2);
    const byId = (id: string) => boxes.find(b => b.textContent!.includes(id))!;
    expect(byId('clinical-101').querySelector('input[type=checkbox]')).not.toBeNull();
    expect(byId('chairside-47').querySelector('input[type=checkbox]')).toBeNull();
    const undo = [...byId('chairside-47').querySelectorAll('button')].find(b => b.textContent === 'پس گرفتن')!;
    expect(undo).toBeTruthy();
    expect(el('qpSendRow').hidden).toBe(true);

    const cb = byId('clinical-101').querySelector('input[type=checkbox]') as HTMLInputElement;
    cb.checked = true; cb.dispatchEvent(new Event('change'));
    expect(el('qpSendRow').hidden).toBe(false);
    el('qpSend').click(); await flush();
    let post = calls.filter(c => c.url === '/admin/quick-publish/workflow');
    expect(post).toHaveLength(1);
    expect(post[0].opts.method).toBe('POST');
    expect(JSON.parse(post[0].opts.body)).toEqual({ ids: ['clinical-101'], requested: true });

    undo.click(); await flush();
    post = calls.filter(c => c.url === '/admin/quick-publish/workflow');
    expect(JSON.parse(post[1].opts.body)).toEqual({ ids: ['chairside-47'], requested: false });
  });
});
