// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderQuickPublish } from '../src/routes/admin-quick-publish.js';

let calls: { url: string; opts: any }[];
let fetcher: ReturnType<typeof vi.fn>;
let uploads: number;
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
  fetcher = vi.fn(async (url: string, opts: any = {}) => {
    calls.push({ url: String(url), opts });
    if (url === '/admin/quick-publish' && !opts.method) return response({ configured: true, template: true, items: [], types: { clinical: 'Insight', meta: 'Meta' } });
    if (url === '/admin/quick-publish/media') return response({ ok: true, path: `/quick-publish/media/20261101-0000000${++uploads}.jpg` });
    if (url === '/admin/quick-publish') return response({ ok: true, url: 'https://dentcast.ir/insight/insight-101.html', item: {} });
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
