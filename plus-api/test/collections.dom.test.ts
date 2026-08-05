// @vitest-environment jsdom
// Drives the REAL shipped collections module (/plus/js/collections.js). A board
// used to be a wall of colour bands: no note, no label, no actions, and the
// whole pin was a link into the article — where none of the reader's marks are
// drawn until «میز کار» is pressed again (user report, 2026-08-05). These tests
// pin down the fix: a pin is a card with the same content as a library card,
// and moving an item between boards works over the two endpoints that exist.
import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

const calls: Array<{ op: string; args: any[] }> = [];
let collections: any[] = [];
let board: any = null;

vi.mock('/plus/js/api.js', () => ({
  api: {
    listCollections: () => Promise.resolve({ collections }),
    getCollection: () => Promise.resolve(board),
    createCollection: (title: string) => {
      calls.push({ op: 'create', args: [title] });
      return Promise.resolve({ collection: { id: 'new', title, item_count: 0, preview: [] } });
    },
    addToCollection: (id: string, item: any) => { calls.push({ op: 'add', args: [id, item] }); return Promise.resolve({ ok: true }); },
    removeCollectionItem: (id: string, itemId: string) => { calls.push({ op: 'remove', args: [id, itemId] }); return Promise.resolve({ ok: true }); },
    updateHighlight: (id: string, patch: any) => {
      calls.push({ op: 'patch', args: [id, patch] });
      return Promise.resolve({ highlight: { id, ...patch } });
    },
  },
  currentUser: () => Promise.resolve({ tier: 'premium' }),
}));

const { renderCollectionsList, renderCollectionDetail } = await import('../../plus/js/collections.js');

const hlItem = (over: any = {}) => ({
  id: 'i1', kind: 'highlight', highlight_id: 'hl-1', content_id: 'insight/insight-1',
  title: 'اینسایت یک', url: '/insight/insight-1.html', type: 'insight',
  exact: 'پیوند به عاج ضعیف‌تر است', note: 'برای بورد', label: 'important',
  color: 'yellow', underline: false, created_at: '2026-08-04T10:00:00Z', ...over,
});
const pageItem = (over: any = {}) => ({
  id: 'i2', kind: 'page', highlight_id: null, content_id: 'episodes/episode-40',
  title: 'اپیزود ۴۰', url: '/episodes/episode-40.html', type: 'episodes',
  exact: null, note: null, label: null, color: null, underline: false,
  created_at: '2026-08-03T10:00:00Z', ...over,
});

const actNamed = (fa: string, root: ParentNode = document) => [...root.querySelectorAll('.dcp-hlib-act')]
  .find((b) => (b.textContent || '').includes(fa)) as HTMLElement;

describe('collections catalog', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    calls.length = 0;
    collections = [
      { id: 'c1', title: 'امتحان بورد', item_count: 4, created_at: '2026-07-01T10:00:00Z', last_item_at: '2026-08-04T10:00:00Z', preview: [] },
      { id: 'c2', title: 'کیس خانم ر.', item_count: 2, created_at: '2026-06-01T10:00:00Z', last_item_at: '2026-06-02T10:00:00Z', preview: [] },
    ];
  });

  it('lists boards with their count and when they were last added to', async () => {
    await renderCollectionsList(document.getElementById('root')!);
    const cards = [...document.querySelectorAll('.dcp-cl-board')];
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('امتحان بورد');
    expect(cards[0].textContent).toContain('۴ مورد');
    expect(cards[0].textContent, 'says when it was last added to').toMatch(/(پیش|امروز|دیروز)/);
  });

  it('hides the search row until there are enough boards to need it', async () => {
    await renderCollectionsList(document.getElementById('root')!);
    const tools = document.querySelector('.dcp-hlib-row') as HTMLElement;
    expect(tools.hasAttribute('hidden'), 'two boards need no search').toBe(true);

    collections = Array.from({ length: 6 }, (_, i) => ({
      id: 'c' + i, title: 'کالکشن ' + i, item_count: 1, created_at: '2026-07-01T10:00:00Z', last_item_at: null, preview: [],
    }));
    await renderCollectionsList(document.getElementById('root')!);
    const tools2 = document.querySelector('.dcp-hlib-row') as HTMLElement;
    expect(tools2.hasAttribute('hidden')).toBe(false);

    const search = tools2.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'کالکشن ۳'.replace('۳', '3');
    search.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('.dcp-cl-board')).toHaveLength(1);
  });

  it('points an empty shelf at the highlight library, not at nothing', async () => {
    collections = [];
    await renderCollectionsList(document.getElementById('root')!);
    expect(document.body.textContent).toContain('هنوز کالکشنی نساختی');
    const cta = document.querySelector('a[href="/plus/highlights.html"]');
    expect(cta, 'the empty state tells you where items come from').not.toBeNull();
  });
});

describe('one collection board', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    calls.length = 0;
    collections = [
      { id: 'c1', title: 'امتحان بورد', item_count: 2, created_at: '2026-07-01T10:00:00Z', last_item_at: null, preview: [] },
      { id: 'c2', title: 'کیس خانم ر.', item_count: 0, created_at: '2026-06-01T10:00:00Z', last_item_at: null, preview: [] },
    ];
    board = { id: 'c1', title: 'امتحان بورد', created_at: '2026-07-01T10:00:00Z', items: [hlItem(), pageItem()] };
  });

  it('a pin carries the note, the label and its own actions — and is not a link', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;

    expect(pin.textContent).toContain('پیوند به عاج ضعیف‌تر است');
    expect(pin.textContent, 'the note is on the pin').toContain('برای بورد');
    expect(pin.querySelector('.dcp-card-label')!.textContent).toBe('مهم');
    expect(pin.closest('a'), 'a pin is a card, not a link').toBeNull();
    expect(actNamed('متنِ مقاله', pin).getAttribute('href')).toBe('/insight/insight-1.html?dcphl=hl-1');
  });

  it('a whole-page pin opens the page and offers no highlight-only actions', async () => {
    board = { ...board, items: [pageItem()] };
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    expect(actNamed('بازکردن', pin).getAttribute('href')).toBe('/episodes/episode-40.html');
    expect(actNamed('ویرایش', pin), 'a page has no note to edit here').toBeUndefined();
  });

  it('edits a saved highlight in place, from inside the board', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    actNamed('ویرایش', pin).click();
    const ta = pin.querySelector('.dcp-hlib-ta') as HTMLTextAreaElement;
    ta.value = 'یادداشتِ تازه';
    ([...pin.querySelectorAll('button')].find((b) => b.textContent === 'ذخیره') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    const patch = calls.find((c) => c.op === 'patch');
    expect(patch, 'the edit went to the highlight itself').toBeTruthy();
    expect(patch!.args[0]).toBe('hl-1');
    expect(patch!.args[1].note).toBe('یادداشتِ تازه');
  });

  it('moves an item to another board as add-then-remove over the existing endpoints', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    actNamed('انتقال', pin).click();
    await new Promise((r) => setTimeout(r, 0));

    const rows = [...document.querySelectorAll('.dcp-cl-pick-row')];
    expect(rows.length, 'the board you are moving OUT of is not offered').toBe(1);
    expect(rows[0].textContent).toContain('کیس خانم ر.');
    (rows[0] as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls.map((c) => c.op)).toEqual(['add', 'remove']);
    expect(calls[0].args).toEqual(['c2', { highlight_id: 'hl-1' }]);
    expect(calls[1].args).toEqual(['c1', 'i1']);
  });

  it('filters the board by kind and by text', async () => {
    board = { ...board, items: [hlItem(), pageItem(), hlItem({ id: 'i3', highlight_id: 'hl-3', exact: 'نکته‌ی سوم', note: null, label: null }), hlItem({ id: 'i4', highlight_id: 'hl-4', exact: 'نکته‌ی چهارم', note: null, label: null })] };
    await renderCollectionDetail(document.getElementById('root')!, 'c1');

    const pages = [...document.querySelectorAll('.dcp-hlib-chip')].find((c) => (c.textContent || '').startsWith('صفحه‌ها')) as HTMLElement;
    pages.click();
    expect(document.querySelectorAll('.dcp-cl-pin')).toHaveLength(1);

    const all = [...document.querySelectorAll('.dcp-hlib-chip')].find((c) => (c.textContent || '').startsWith('همه')) as HTMLElement;
    all.click();
    const search = document.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'چهارم';
    search.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('.dcp-cl-pin')).toHaveLength(1);
    expect(document.body.textContent).toContain('۱ از ۴ مورد');
  });

  it('removing an item takes it off the board and keeps the count honest', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    actNamed('حذف', pin).click();
    ([...pin.querySelectorAll('button')].find((b) => b.textContent === 'حذف' && b.classList.contains('dcp-btn-danger')) as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls.find((c) => c.op === 'remove')!.args).toEqual(['c1', 'i1']);
    expect(document.querySelectorAll('.dcp-cl-pin')).toHaveLength(1);
  });
});
