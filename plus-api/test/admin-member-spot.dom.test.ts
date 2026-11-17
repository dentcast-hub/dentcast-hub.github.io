// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderMemberSpotControls } from '../src/routes/admin-member-spot-ui.js';

const user = (id: string) => ({ id, display_name: '<member>', created_at: '2026-01-01',
  phone: null, identities: [], is_premium: false, subscription: null, league_grant: null, last_subscription_event: null });
const controls = { home: { enabled: true, creative: {
  badge: 'b', title: '<title>', text: 'body', cta: '', url: '', image: null,
} } };
let calls: { url: string; opts: any }[], members: any[], defaultsFailure: boolean;
let fetcher: ReturnType<typeof vi.fn>;
const response = (body: unknown) => ({ ok: true, json: async () => body });
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function el<T extends HTMLElement>(id: string): T { return document.getElementById(id) as T; }

function bootPanel() {
  const html = renderMemberSpotControls();
  document.body.innerHTML = html.replace(/<script>[\s\S]*?<\/script>/g, '');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
  new Function('document', 'fetch', 'URL', script)(document, fetcher, URL);
}

beforeEach(() => {
  defaultsFailure = false; calls = []; members = [{ users: [user('one')], next_cursor: 'next' }, { users: [user('two')], next_cursor: null }];
  fetcher = vi.fn(async (url: string, opts: any = {}) => {
    calls.push({ url: String(url), opts });
    if (String(url).startsWith('/admin/users?')) {
      return response(members.shift() || { users: [], next_cursor: null });
    }
    if (url === '/admin/spot/config') return response({ placements: { home: 'خانه', article: 'مقاله', sidebar: 'کنار' }, slots: structuredClone(controls), upload_configured: false });
    if (url === '/admin/spot/defaults') return defaultsFailure ? { ok: false, json: async () => ({ error: 'spot_defaults_unavailable' }) } : response({ slots: { home: { enabled: true } }, creatives: {}, rotation: { sequence: ['premium'] } });
    if (url === '/admin/spot/campaign') return response({ sessions: null });
    return response({ ok: true });
  });
  bootPanel();
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('admin member and Spot UI', () => {
  it('appends older pages, resets pagination on sort/search, and renders member text safely', async () => {
    await flush();
    expect(el('memberRows').children).toHaveLength(1);
    expect(el('memberRows').querySelector('strong')?.textContent).toBe('<member>');
    expect(el('memberMore').hidden).toBe(false);
    el<HTMLButtonElement>('memberMore').click(); await flush();
    expect(el('memberRows').children).toHaveLength(2);
    expect(calls.some(c => c.url.includes('cursor=next'))).toBe(true);
    expect(el('memberMore').hidden).toBe(true);
    members = [{ users: [user('oldest')], next_cursor: null }];
    el<HTMLSelectElement>('memberOrder').value = 'oldest';
    el('memberOrder').dispatchEvent(new Event('change')); await flush();
    expect(el('memberRows').children).toHaveLength(1);
    const request = calls.filter(c => c.url.startsWith('/admin/users?')).at(-1)!;
    expect(request.url).toContain('order=oldest'); expect(request.url).not.toContain('cursor=');
    el<HTMLInputElement>('memberQuery').value = 'صدرا';
    el('memberFilters').dispatchEvent(new Event('submit', { cancelable: true })); await flush();
    expect(decodeURIComponent(calls.filter(c => c.url.startsWith('/admin/users?')).at(-1)!.url)).toContain('q=صدرا');
  });
  it('loads saved content, previews literal text, and persists the selected placement', async () => {
    await flush();
    expect(el('spotControlForm').hidden).toBe(false);
    expect(el<HTMLInputElement>('spotTitle').value).toBe('<title>');
    expect(el('spotPreview').querySelector('h4')?.textContent).toBe('<title>');
    expect(el<HTMLButtonElement>('spotUploadButton').disabled).toBe(true);
    el<HTMLInputElement>('spotTitle').value = 'updated';
    el('spotControlForm').dispatchEvent(new Event('submit', { cancelable: true })); await flush();
    const save = calls.find(c => c.opts.method === 'PUT')!;
    expect(save.url).toBe('/admin/spot/config/home');
    expect(JSON.parse(save.opts.body)).toMatchObject({ title: 'updated', enabled: true, image: null });
    expect(el('spotControlStatus').textContent).toContain('ذخیره شد');
  });
  it('previews disabled content and refuses active destination URLs before saving', async () => {
    await flush();
    el<HTMLInputElement>('spotEnabled').checked = false;
    el('spotControlForm').dispatchEvent(new Event('input', { bubbles: true }));
    expect(el('spotPreview').textContent).toContain('غیرفعال');
    el<HTMLInputElement>('spotEnabled').checked = true;
    el<HTMLInputElement>('spotUrl').value = 'javascript:alert(1)';
    el('spotControlForm').dispatchEvent(new Event('submit', { cancelable: true })); await flush();
    expect(calls.some(c => c.opts.method === 'PUT')).toBe(false);
    expect(el('spotControlStatus').textContent).toContain('معتبر نیست');
  });
  it('keeps preview running and blocks saving malformed destinations', async () => {
    await flush();
    for (const value of ['https://', 'http://[', 'https://user:pass@example.com/']) {
      el<HTMLInputElement>('spotUrl').value = value;
      el('spotControlForm').dispatchEvent(new Event('input', { bubbles: true }));
      expect(el('spotPreview').querySelector('a')).toBeNull();
      el('spotControlForm').dispatchEvent(new Event('submit', { cancelable: true }));
      await flush();
      expect(el('spotControlStatus').textContent).toContain('معتبر نیست');
    }
    expect(calls.some(c => c.opts.method === 'PUT')).toBe(false);
    el<HTMLInputElement>('spotUrl').value = 'https://example.com/';
    el('spotControlForm').dispatchEvent(new Event('input', { bubbles: true }));
    expect(el('spotPreview').querySelector('a')?.href).toBe('https://example.com/');
  });
  it('uses a same-origin defaults request and keeps failed loads explicitly unknown', async () => {
    await flush(); defaultsFailure = true; calls = []; bootPanel(); await flush();
    expect(calls.some(c => c.url === '/admin/spot/defaults')).toBe(true);
    expect(calls.some(c => c.url.startsWith('https://dentcast.'))).toBe(false);
    expect(el('spotControlForm').hidden).toBe(true);
    expect(el('spotControlStatus').textContent).toContain('وضعیت جایگاه‌ها هنوز مشخص نیست');
    expect(calls.some(c => c.opts.method === 'PUT')).toBe(false);
  });
  it('resets the selected placement through the authenticated server endpoint', async () => {
    await flush(); el<HTMLButtonElement>('spotReset').click(); await flush();
    expect(calls.find(c => c.url.endsWith('/reset'))).toMatchObject({
      url: '/admin/spot/config/home/reset', opts: { method: 'POST', credentials: 'include' },
    });
    expect(el('spotControlMode').textContent).toContain('چرخش فعلی سایت');
  });
  it('opens on the four beats the site is running and saves them as one schedule', async () => {
    await flush();
    expect(el('campaignForm').hidden).toBe(false);
    expect(el('campaignSessions').children).toHaveLength(4);
    // Nothing saved yet: the published rotation is ['premium'], so every beat is our own card.
    expect([1, 2, 3, 4].map(i => el<HTMLSelectElement>('campaign' + i + 'Mode').value)).toEqual(['house', 'house', 'house', 'house']);
    expect(el('campaignStatus').textContent).toContain('همان چرخشِ فعلیِ سایت');
    expect(el('campaignSteps').children).toHaveLength(4);

    const set = (i: number, mode: string) => {
      const m = el<HTMLSelectElement>('campaign' + i + 'Mode'); m.value = mode;
      m.dispatchEvent(new Event('change', { bubbles: true }));
    };
    set(1, 'custom');
    el<HTMLSelectElement>('campaign1Kind').value = 'text';
    el<HTMLInputElement>('campaign1Title').value = 'آگهی بیرونی';
    el<HTMLInputElement>('campaign1Url').value = 'https://brand.example/';
    set(3, 'off');
    // The body of a beat is only there for a sponsor beat.
    expect(el('campaign1Card').querySelector<HTMLElement>('.cmp-body')!.hidden).toBe(false);
    expect(el('campaign2Card').querySelector<HTMLElement>('.cmp-body')!.hidden).toBe(true);
    expect(el('campaign2Card').querySelector<HTMLElement>('.cmp-note-house')!.hidden).toBe(false);
    expect(el('campaign3Card').querySelector<HTMLElement>('.cmp-note-off')!.hidden).toBe(false);
    expect(el('campaignDirty').hidden).toBe(false);
    expect(Array.from(el('campaignSteps').children).map(c => c.textContent)).toEqual(
      ['زمان اولاسپانسر', 'زمان دومدنت‌کست', 'زمان سومخالی', 'زمان چهارمدنت‌کست']);

    el('campaignForm').dispatchEvent(new Event('submit', { cancelable: true })); await flush();
    const save = calls.find(c => c.url === '/admin/spot/campaign' && c.opts.method === 'PUT')!;
    const body = JSON.parse(save.opts.body);
    expect(body.sessions.map((s: any) => s.mode)).toEqual(['custom', 'house', 'off', 'house']);
    expect(body.sessions[0]).toMatchObject({ title: 'آگهی بیرونی', url: 'https://brand.example/' });
    expect(el('campaignStatus').textContent).toContain('برنامه ذخیره شد');
    expect(el('campaignDirty').hidden).toBe(true);
  });
  it('refuses a sponsor beat with nothing in it, naming the beat', async () => {
    await flush();
    const m = el<HTMLSelectElement>('campaign2Mode'); m.value = 'custom';
    m.dispatchEvent(new Event('change', { bubbles: true }));
    el('campaignForm').dispatchEvent(new Event('submit', { cancelable: true })); await flush();
    expect(calls.some(c => c.url === '/admin/spot/campaign' && c.opts.method === 'PUT')).toBe(false);
    expect(el('campaignStatus').textContent).toContain('زمان دوم');
    expect(el('campaignStatus').className).toContain('err');
  });
});
