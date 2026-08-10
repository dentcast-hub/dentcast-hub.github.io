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
    updateCollection: (id: string, patch: any) => {
      calls.push({ op: 'update', args: [id, patch] });
      return Promise.resolve({ collection: { id, title: 'x', ...patch } });
    },
    orderCollectionItems: (id: string, itemIds: string[]) => {
      calls.push({ op: 'order', args: [id, itemIds] });
      const byId = new Map(board.items.map((i: any) => [i.id, i]));
      const items = itemIds.length
        ? itemIds.map((iid, n) => ({ ...byId.get(iid), position: n }))
        : board.items.map((i: any) => ({ ...i, position: null }));
      return Promise.resolve({ items });
    },
    createSnippet: (collectionId: string, payload: any) => {
      calls.push({ op: 'createSnippet', args: [collectionId, payload] });
      return Promise.resolve({
        item: {
          id: 'new-item', kind: payload.kind, snippet_id: 'new-snippet', highlight_id: null, content_id: null,
          title: payload.title || null, body: payload.body || null, url: null, position: null,
          created_at: '2026-08-05T10:00:00Z',
        },
      });
    },
    updateSnippet: (id: string, patch: any) => {
      calls.push({ op: 'updateSnippet', args: [id, patch] });
      return Promise.resolve({ snippet: { id, ...patch } });
    },
    deleteSnippet: (id: string) => { calls.push({ op: 'deleteSnippet', args: [id] }); return Promise.resolve({ ok: true }); },
  },
  currentUser: () => Promise.resolve({ tier: 'premium' }),
  apiBase: () => Promise.resolve('https://api.dentcast.test'),
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
const noteItem = (over: any = {}) => ({
  id: 'i3', kind: 'text', highlight_id: null, content_id: null, snippet_id: 'sn-1',
  title: 'جمع‌بندی مقدمه', body: 'سه نسل آخر ادهیزیوها عملاً به یک نقطه رسیده‌اند.', url: null,
  created_at: '2026-08-02T10:00:00Z', ...over,
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

// «متن خودم» — a board can originate its own text pin, not only save one from
// an article. The chooser sheet, the composer, and the resulting card.
describe('text pins («متن خودم»)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    calls.length = 0;
    collections = [
      { id: 'c1', title: 'امتحان بورد', item_count: 1, created_at: '2026-07-01T10:00:00Z', last_item_at: null, preview: [] },
      { id: 'c2', title: 'کیس خانم ر.', item_count: 0, created_at: '2026-06-01T10:00:00Z', last_item_at: null, preview: [] },
    ];
    board = { id: 'c1', title: 'امتحان بورد', created_at: '2026-07-01T10:00:00Z', items: [noteItem()] };
  });

  it('«افزودن پین» opens a chooser with متن خودم, رفرنس and a disabled هایلایت row', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent!.includes('افزودن پین')) as HTMLElement).click();

    const opts = [...document.querySelectorAll('.dcp-cl-addopt')];
    expect(opts).toHaveLength(3);
    expect(opts[0].textContent).toContain('متن خودم');
    expect(opts[1].textContent).toContain('رفرنس');
    expect((opts[1] as HTMLButtonElement).disabled, 'reference is a real, working option').toBe(false);
    expect(opts[2].textContent).toContain('هایلایت');
    expect((opts[2] as HTMLButtonElement).disabled, 'highlight stays the existing in-article flow').toBe(true);
  });

  it('the composer posts a text snippet and prepends its card', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent!.includes('افزودن پین')) as HTMLElement).click();
    ([...document.querySelectorAll('.dcp-cl-addopt')][0] as HTMLElement).click();

    const inputs = [...document.querySelectorAll('input.dcp-input')] as HTMLInputElement[];
    const title = inputs.find((i) => (i.placeholder || '').includes('نکته‌ی بحث پایانی'))!;
    const body = document.querySelector('.dcp-hlib-ta') as HTMLTextAreaElement;
    title.value = 'عنوان تست';
    body.value = 'متن تازه‌ی پین‌شده';
    ([...document.querySelectorAll('button')].find((b) => b.textContent === 'پین کن') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    const created = calls.find((c) => c.op === 'createSnippet')!;
    expect(created.args).toEqual(['c1', { kind: 'text', title: 'عنوان تست', body: 'متن تازه‌ی پین‌شده' }]);

    const cards = [...document.querySelectorAll('.dcp-cl-pin')];
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('متن تازه‌ی پین‌شده');
  });

  it('refuses an empty body without calling the API', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent!.includes('افزودن پین')) as HTMLElement).click();
    ([...document.querySelectorAll('.dcp-cl-addopt')][0] as HTMLElement).click();
    ([...document.querySelectorAll('button')].find((b) => b.textContent === 'پین کن') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.find((c) => c.op === 'createSnippet')).toBeUndefined();
  });

  it('renders a text pin as its own card: kind chip, title, body — and no متنِ مقاله link', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    expect(pin.classList.contains('dcp-cl-pin-note')).toBe(true);
    expect(pin.querySelector('.dcp-cl-pin-kind-text')!.textContent).toContain('متن خودم');
    expect(pin.textContent).toContain('جمع‌بندی مقدمه');
    expect(pin.textContent).toContain('سه نسل آخر ادهیزیوها');
    expect(actNamed('متنِ مقاله', pin), 'a text pin has no article to link to').toBeUndefined();
  });

  it('edits a text pin in place via PATCH /snippets/:id', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    actNamed('ویرایش', pin).click();

    const inputs = [...pin.querySelectorAll('.dcp-input')] as HTMLInputElement[];
    inputs[0].value = 'عنوانِ تازه';
    (pin.querySelector('.dcp-hlib-ta') as HTMLTextAreaElement).value = 'متنِ تازه';
    ([...pin.querySelectorAll('button')].find((b) => b.textContent === 'ذخیره') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    const patch = calls.find((c) => c.op === 'updateSnippet')!;
    expect(patch.args).toEqual(['sn-1', { title: 'عنوانِ تازه', body: 'متنِ تازه' }]);
    expect(pin.textContent).toContain('متنِ تازه');
  });

  it('moves a text pin to another board by snippet_id, not highlight/content id', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    actNamed('انتقال', pin).click();
    await new Promise((r) => setTimeout(r, 0));
    (document.querySelector('.dcp-cl-pick-row') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls.map((c) => c.op)).toEqual(['add', 'remove']);
    expect(calls[0].args).toEqual(['c2', { snippet_id: 'sn-1' }]);
  });

  it('removing a text pin uses the same DELETE .../items/:itemId as any other pin', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    actNamed('حذف', pin).click();
    ([...pin.querySelectorAll('button')].find((b) => b.textContent === 'حذف' && b.classList.contains('dcp-btn-danger')) as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.find((c) => c.op === 'remove')!.args).toEqual(['c1', 'i3']);
  });

  it('the «متن من» filter chip narrows the board to text pins', async () => {
    board = { ...board, items: [noteItem(), hlItem(), pageItem()] };
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const chip = [...document.querySelectorAll('.dcp-hlib-chip')].find((c) => (c.textContent || '').startsWith('متن من')) as HTMLElement;
    expect(chip.textContent).toContain('۱');
    chip.click();
    expect(document.querySelectorAll('.dcp-cl-pin')).toHaveLength(1);
    expect(document.querySelector('.dcp-cl-pin')!.classList.contains('dcp-cl-pin-note')).toBe(true);
  });
});

// «رفرنس» — DOI metadata is fetched from Crossref IN THE BROWSER (never by the
// API), with a manual path always available for Persian journals that have no
// DOI. The fetch is the real global fetch (mocked per-test), never api.js.
const refItem = (over: any = {}) => ({
  id: 'i4', kind: 'reference', highlight_id: null, content_id: null, snippet_id: 'sn-ref',
  title: 'Dentin bonding systems: from structure to bond preservation',
  authors: 'Breschi L, et al.', venue: 'Dental Materials', year: 2018,
  doi: '10.1016/j.dental.2017.11.005', url: null, body: null,
  created_at: '2026-08-01T10:00:00Z', ...over,
});
const crossrefResponse = (overrides: any = {}) => ({
  ok: true,
  json: () => Promise.resolve({
    message: {
      title: ['Dentin bonding systems: from structure to bond preservation'],
      author: [{ family: 'Breschi', given: 'Lorenzo' }, { family: 'Second', given: 'Author' }],
      'container-title': ['Dental Materials'],
      issued: { 'date-parts': [[2018, 3]] },
      DOI: '10.1016/j.dental.2017.11.005',
      ...overrides,
    },
  }),
});

describe('reference pins («رفرنس»)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    calls.length = 0;
    collections = [
      { id: 'c1', title: 'امتحان بورد', item_count: 1, created_at: '2026-07-01T10:00:00Z', last_item_at: null, preview: [] },
      { id: 'c2', title: 'کیس خانم ر.', item_count: 0, created_at: '2026-06-01T10:00:00Z', last_item_at: null, preview: [] },
    ];
    board = { id: 'c1', title: 'امتحان بورد', created_at: '2026-07-01T10:00:00Z', items: [refItem()] };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
    (globalThis.fetch as any).mockClear();
  });

  async function openRefComposer() {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent!.includes('افزودن پین')) as HTMLElement).click();
    ([...document.querySelectorAll('.dcp-cl-addopt')][1] as HTMLElement).click();
  }

  it('fetches Crossref, previews the mapped fields, and posts them on افزودن به برد', async () => {
    (globalThis.fetch as any).mockImplementationOnce(() => Promise.resolve(crossrefResponse()));
    await openRefComposer();

    const doiInput = document.querySelector('input[aria-label="DOI یا لینک"]') as HTMLInputElement;
    doiInput.value = 'https://doi.org/10.1016/j.dental.2017.11.005';
    ([...document.querySelectorAll('button')].find((b) => b.textContent === 'دریافت مشخصات') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
      'https://api.crossref.org/works/10.1016%2Fj.dental.2017.11.005',
    );
    const preview = document.querySelector('.dcp-cl-ref-preview') as HTMLElement;
    expect(preview.hidden, 'a resolved DOI shows the preview').toBe(false);
    expect(preview.textContent).toContain('Dentin bonding systems');
    expect(preview.textContent).toContain('Breschi L, et al.');
    expect(preview.textContent).toContain('Dental Materials');

    const addBtn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'افزودن به برد') as HTMLButtonElement;
    expect(addBtn.disabled, 'a resolved reference enables the add button').toBe(false);
    addBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    const created = calls.find((c) => c.op === 'createSnippet')!;
    expect(created.args).toEqual(['c1', {
      kind: 'reference',
      title: 'Dentin bonding systems: from structure to bond preservation',
      authors: 'Breschi L, et al.',
      venue: 'Dental Materials',
      year: 2018,
      doi: '10.1016/j.dental.2017.11.005',
    }]);
  });

  it('on a failed fetch, shows a calm message and auto-opens the manual fields', async () => {
    (globalThis.fetch as any).mockImplementationOnce(() => Promise.resolve({ ok: false }));
    await openRefComposer();

    const doiInput = document.querySelector('input[aria-label="DOI یا لینک"]') as HTMLInputElement;
    doiInput.value = '10.9999/does-not-exist';
    ([...document.querySelectorAll('button')].find((b) => b.textContent === 'دریافت مشخصات') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    expect(document.querySelector('.dcp-cl-ref-preview')!.hasAttribute('hidden')).toBe(true);
    expect(document.body.textContent).toContain('مشخصات پیدا نشد');
    expect(document.querySelector('.dcp-cl-ref-manual')!.hasAttribute('hidden'), 'manual fields open on failure').toBe(false);
  });

  it('«مقاله DOI ندارد» is always available and lets a title-only manual entry through', async () => {
    await openRefComposer();
    ([...document.querySelectorAll('button')].find((b) => b.textContent!.includes('مشخصات را خودم می‌نویسم')) as HTMLElement).click();

    const addBtn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'افزودن به برد') as HTMLButtonElement;
    expect(addBtn.disabled, 'no title yet').toBe(true);

    const manualTitle = document.querySelector('input[aria-label="عنوان مقاله"]') as HTMLInputElement;
    manualTitle.value = 'مقاله‌ی فارسی بدون DOI';
    manualTitle.dispatchEvent(new Event('input'));
    expect(addBtn.disabled).toBe(false);

    addBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    const created = calls.find((c) => c.op === 'createSnippet')!;
    expect(created.args).toEqual(['c1', { kind: 'reference', title: 'مقاله‌ی فارسی بدون DOI' }]);
    expect((globalThis.fetch as any).mock.calls, 'no Crossref call on the manual path').toHaveLength(0);
  });

  it('renders a reference pin: kind chip, LTR title, DOI link, and the annotation', async () => {
    board = { ...board, items: [refItem({ body: 'رفرنس اصلی اسلایدهای ۴ تا ۶' })] };
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;

    expect(pin.classList.contains('dcp-cl-pin-ref')).toBe(true);
    expect(pin.querySelector('.dcp-cl-pin-kind-reference')!.textContent).toContain('رفرنس');
    const title = pin.querySelector('.dcp-cl-ref-title') as HTMLElement;
    expect(title.getAttribute('dir'), 'a Latin title reads left-to-right').toBe('ltr');
    expect(title.textContent).toContain('Dentin bonding systems');
    const doiLink = pin.querySelector('.dcp-cl-doi') as HTMLAnchorElement;
    expect(doiLink.getAttribute('href')).toBe('https://doi.org/10.1016/j.dental.2017.11.005');
    expect(doiLink.getAttribute('rel')).toBe('noopener');
    expect(doiLink.getAttribute('target')).toBe('_blank');
    expect(pin.textContent).toContain('رفرنس اصلی اسلایدهای ۴ تا ۶');
    expect(actNamed('ویرایش', pin), 'a reference has no in-place editor').toBeUndefined();
  });

  it('«کپی استناد» copies a Vancouver-ish citation', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    ([...pin.querySelectorAll('.dcp-hlib-act')].find((b) => b.textContent === 'کپی استناد') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    expect((navigator.clipboard.writeText as any).mock.calls[0][0]).toBe(
      'Breschi L, et al. Dentin bonding systems: from structure to bond preservation. '
      + 'Dental Materials; 2018. doi:10.1016/j.dental.2017.11.005',
    );
  });

  it('moves a reference pin to another board by snippet_id', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const pin = document.querySelector('.dcp-cl-pin') as HTMLElement;
    actNamed('انتقال', pin).click();
    await new Promise((r) => setTimeout(r, 0));
    (document.querySelector('.dcp-cl-pick-row') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(calls[0].args).toEqual(['c2', { snippet_id: 'sn-ref' }]);
  });

  it('the «رفرنس» filter chip narrows the board to reference pins', async () => {
    board = { ...board, items: [refItem(), noteItem(), hlItem()] };
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const chip = [...document.querySelectorAll('.dcp-hlib-chip')].find((c) => (c.textContent || '').startsWith('رفرنس')) as HTMLElement;
    expect(chip.textContent).toContain('۱');
    chip.click();
    expect(document.querySelectorAll('.dcp-cl-pin')).toHaveLength(1);
    expect(document.querySelector('.dcp-cl-pin')!.classList.contains('dcp-cl-pin-ref')).toBe(true);
  });
});

// «خروجی» — a plain navigation to the export endpoint, not fetch+blob. Only
// the docx option ships here (pptx is gated behind Phase E's manual check).
describe('board export', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    calls.length = 0;
    collections = [{ id: 'c1', title: 'امتحان بورد', item_count: 1, created_at: '2026-07-01T10:00:00Z', last_item_at: null, preview: [] }];
    board = { id: 'c1', title: 'امتحان بورد', created_at: '2026-07-01T10:00:00Z', items: [hlItem()] };
  });

  it('«خروجی» opens a sheet with only the docx option (pptx is not shipped yet)', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent!.includes('خروجی')) as HTMLElement).click();

    const opts = [...document.querySelectorAll('.dcp-cl-addopt')];
    expect(opts).toHaveLength(1);
    expect(opts[0].textContent).toContain('Word');
    expect(document.body.textContent).toContain('چیدمانِ دستی برد');
  });

  it('clicking the docx option resolves the API base and closes the sheet', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent!.includes('خروجی')) as HTMLElement).click();
    // Let the sheet's OWN opening rAF settle before acting inside it — sheet.js
    // adds `is-open` on the next animation frame, and racing ahead of that (as
    // no human ever could) makes closeSheet's class removal look like a no-op.
    await new Promise((r) => requestAnimationFrame(r));
    (document.querySelector('.dcp-cl-addopt') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    // The sheet node itself is only removed after its exit transition (a
    // deferred setTimeout in sheet.js); losing `is-open` is the immediate signal.
    expect(document.querySelector('.dcp-sheet')!.className, 'the sheet closes; the browser download UI takes it from here')
      .not.toContain('is-open');
  });
});

// A board is the user's own shelf: it can carry an emoji, a colour and a line
// of its own, and its items can be put in the order the user means (which
// created_at cannot express).
describe('board identity and arrangement', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    calls.length = 0;
    collections = [{ id: 'c1', title: 'امتحان بورد', item_count: 3, created_at: '2026-07-01T10:00:00Z', last_item_at: null, preview: [] }];
    board = {
      id: 'c1', title: 'امتحان بورد', created_at: '2026-07-01T10:00:00Z',
      description: null, emoji: null, color: null,
      items: [
        hlItem({ id: 'i1', highlight_id: 'hl-1', position: null }),
        hlItem({ id: 'i2', highlight_id: 'hl-2', exact: 'دومی', position: null }),
        pageItem({ id: 'i3', position: null }),
      ],
    };
  });

  it('saves emoji, colour, name and description in one edit', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent === 'ویرایشِ کالکشن') as HTMLElement).click();

    const box = document.querySelector('.dcp-cl-editbox') as HTMLElement;
    expect(box, 'the edit panel opened inline').not.toBeNull();
    (box.querySelector('.dcp-cl-emoji-input') as HTMLInputElement).value = '🦷';
    (box.querySelector('.dcp-hlib-ta') as HTMLTextAreaElement).value = 'هرچه برای بورد لازم است';
    (box.querySelector('.dcp-hlib-sw') as HTMLElement).click(); // first colour
    ([...box.querySelectorAll('button')].find((b) => b.textContent === 'ذخیره') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    const update = calls.find((c) => c.op === 'update')!;
    expect(update.args[0]).toBe('c1');
    expect(update.args[1]).toMatchObject({
      title: 'امتحان بورد', emoji: '🦷', color: 'blue', description: 'هرچه برای بورد لازم است',
    });
    expect(document.querySelector('.dcp-cl-editbox'), 'the panel closes on save').toBeNull();
    expect(document.querySelector('.dcp-cl-title-emo')!.textContent).toBe('🦷');
    expect(document.body.textContent).toContain('هرچه برای بورد لازم است');
  });

  it('an emoji suggestion fills the field without typing', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    ([...document.querySelectorAll('button')].find((b) => b.textContent === 'ویرایشِ کالکشن') as HTMLElement).click();
    const box = document.querySelector('.dcp-cl-editbox') as HTMLElement;
    ([...box.querySelectorAll('.dcp-hlib-chip')].find((b) => b.textContent === '🦷') as HTMLElement).click();
    expect((box.querySelector('.dcp-cl-emoji-input') as HTMLInputElement).value).toBe('🦷');
  });

  it('arrange mode moves an item and saves the WHOLE order', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    expect(document.querySelector('.dcp-cl-arrange'), 'no arrange controls until you ask').toBeNull();

    ([...document.querySelectorAll('.dcp-hlib-act')].find((b) => (b.textContent || '').includes('چیدمانِ دستی')) as HTMLElement).click();
    const bars = [...document.querySelectorAll('.dcp-cl-arrange')];
    expect(bars).toHaveLength(3);
    expect(bars[0].textContent).toContain('۱ از ۳');
    // The first item cannot go up, the last cannot go down.
    expect((bars[0].querySelector('button') as HTMLButtonElement).disabled).toBe(true);

    // Push the SECOND item up one place.
    (bars[1].querySelector('button') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    const order = calls.find((c) => c.op === 'order')!;
    expect(order.args[0]).toBe('c1');
    expect(order.args[1], 'the whole board, in its new order').toEqual(['i2', 'i1', 'i3']);
  });

  it('«بازگشت به تازه‌ترین» clears the arrangement', async () => {
    board.items = board.items.map((it: any, i: number) => ({ ...it, position: i }));
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const reset = [...document.querySelectorAll('.dcp-hlib-act')]
      .find((b) => (b.textContent || '').includes('بازگشت به تازه‌ترین')) as HTMLElement;
    expect(reset.hasAttribute('hidden'), 'offered only on an arranged board').toBe(false);
    reset.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls.find((c) => c.op === 'order')!.args[1]).toEqual([]);
  });

  it('offers «چیدمانِ خودم» as a sort only when the board has one', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const opts = () => [...document.querySelectorAll('select option')].map((o) => o.textContent);
    expect(opts()).not.toContain('چیدمانِ خودم');

    board.items = board.items.map((it: any, i: number) => ({ ...it, position: i }));
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    expect(opts()[0]).toBe('چیدمانِ خودم');
  });
});

// One more arrange-mode invariant, kept separate because it is about what the
// mode HIDES: ↑/↓ order the whole board, so a filter that hides part of it
// would move an item past cards that are not on screen.
describe('arrange mode takes the filters off the table', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    calls.length = 0;
    collections = [{ id: 'c1', title: 'برد', item_count: 3, created_at: '2026-07-01T10:00:00Z', last_item_at: null, preview: [] }];
    board = {
      id: 'c1', title: 'برد', created_at: '2026-07-01T10:00:00Z', description: null, emoji: null, color: null,
      items: [hlItem({ id: 'i1' }), hlItem({ id: 'i2', highlight_id: 'hl-2', exact: 'دومی' }), pageItem({ id: 'i3' })],
    };
  });

  it('clears and hides the filters, and shows every item', async () => {
    await renderCollectionDetail(document.getElementById('root')!, 'c1');
    const search = document.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'دومی';
    search.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('.dcp-cl-pin')).toHaveLength(1);

    ([...document.querySelectorAll('.dcp-hlib-act')].find((b) => (b.textContent || '').includes('چیدمانِ دستی')) as HTMLElement).click();
    expect(document.querySelectorAll('.dcp-cl-pin'), 'the whole board is on screen').toHaveLength(3);
    expect(search.hasAttribute('hidden'), 'the search box steps aside').toBe(true);
    expect((document.querySelector('.dcp-hlib-chips') as HTMLElement).hasAttribute('hidden')).toBe(true);
  });
});
