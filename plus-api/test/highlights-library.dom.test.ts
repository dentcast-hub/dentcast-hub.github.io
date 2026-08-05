// @vitest-environment jsdom
// Drives the REAL shipped library module (/plus/js/highlights.js) — the premium
// «دفترچه‌ی هایلایت‌ها». The assertions that matter are the promises the feature
// makes (user report, 2026-08-05):
//   1. the highlight TEXT is on the page, in full, with its note — reading
//      happens here, not inside the article;
//   2. a highlight row is NOT a link, so a click cannot throw you back into the
//      article, and the «متنِ مقاله» action carries ?dcphl=<id> so going there
//      lands ON the highlight with the workbench open;
//   3. note/label/colour are editable in place;
//   4. every filter is in the URL, so a filtered view survives a refresh.
import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

const deleted: string[] = [];
const patched: Array<{ id: string; patch: any }> = [];
let libraryResponse: any = null;

vi.mock('/plus/js/api.js', () => ({
  api: {
    highlightLibrary: () => Promise.resolve(libraryResponse),
    deleteHighlight: (id: string) => { deleted.push(id); return Promise.resolve({ ok: true }); },
    updateHighlight: (id: string, patch: any) => {
      patched.push({ id, patch });
      return Promise.resolve({ highlight: { id, exact: 'x', ...patch } });
    },
    listCollections: () => Promise.resolve({ collections: [] }),
  },
  currentUser: () => Promise.resolve({ tier: 'premium' }),
}));

const { renderHighlightLibrary } = await import('../../plus/js/highlights.js');

function library() {
  return {
    total: 3,
    article_count: 2,
    articles: [
      {
        content_id: 'notecast/notecast-1',
        title: 'نوت‌کست یک',
        url: '/notecast/notecast-1.html',
        type: 'notecast', folder: 'notecast', folder_fa: 'نوت‌کست',
        last_highlight_at: '2026-08-05T10:00:00Z', count: 1,
        highlights: [{
          id: 'hl-3', content_id: 'notecast/notecast-1', exact: 'نکته‌ی نوت‌کست',
          color: 'green', underline: false, note: null, label: null,
          created_at: '2026-08-05T10:00:00Z',
        }],
      },
      {
        content_id: 'insight/insight-1',
        title: 'اینسایت یک',
        url: '/insight/insight-1.html',
        type: 'insight', folder: 'insight', folder_fa: 'اینسایت',
        last_highlight_at: '2026-08-04T10:00:00Z', count: 2,
        highlights: [
          {
            id: 'hl-1', content_id: 'insight/insight-1',
            exact: 'پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است',
            color: 'yellow', underline: false, note: 'برای بورد مهم است', label: 'important',
            created_at: '2026-08-04T09:00:00Z',
          },
          {
            id: 'hl-2', content_id: 'insight/insight-1', exact: 'نکته‌ی دوم',
            color: 'blue', underline: false, note: null, label: 'unclear',
            created_at: '2026-08-04T10:00:00Z',
          },
        ],
      },
    ],
  };
}

const chipNamed = (fa: string) => [...document.querySelectorAll('.dcp-hlib-chip')]
  .find((c) => (c.textContent || '').startsWith(fa)) as HTMLElement;
const actNamed = (fa: string, root: ParentNode = document) => [...root.querySelectorAll('.dcp-hlib-act')]
  .find((b) => (b.textContent || '').includes(fa)) as HTMLElement;

describe('premium highlight library', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    history.replaceState(null, '', '/plus/highlights.html');
    deleted.length = 0;
    patched.length = 0;
    libraryResponse = library();
  });

  it('renders every highlight in full, with its note, without opening the article', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const text = document.body.textContent || '';

    expect(document.querySelectorAll('.dcp-hlib-group')).toHaveLength(2);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
    expect(text).toContain('پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است'); // full, not clipped
    expect(text).toContain('برای بورد مهم است');                              // the user's own note
    expect(text).toContain('۳ هایلایت در ۲ مطلب');
    const mark = document.querySelector('.dcp-hlib-body mark.dcp-hl') as HTMLElement;
    expect(mark.getAttribute('data-color')).toBe('green');
  });

  it('a highlight is a card, not a link, and its article link lands on the highlight', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const card = document.querySelector('.dcp-hlib-card') as HTMLElement;
    expect(card.closest('a'), 'the card is not wrapped in a link').toBeNull();
    expect(card.querySelector('.dcp-hlib-body a'), 'the highlight text is not a link').toBeNull();
    expect(actNamed('متنِ مقاله', card).getAttribute('href')).toBe('/notecast/notecast-1.html?dcphl=hl-3');
  });

  it('search matches the note as well as the text, folding ZWNJ and Arabic letters', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const search = document.querySelector('input[type="search"]') as HTMLInputElement;

    search.value = 'براي بورد'; // Arabic ي, and a plain space where the data has none
    search.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 280)); // debounce

    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(1);
    expect(document.body.textContent).toContain('۱ از ۳ هایلایت');
    expect(location.search, 'the query lives in the URL').toContain('q=');
  });

  it('filters by label chip and by colour swatch, and says so in the URL', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);

    chipNamed('مبهم').click();
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(1);
    expect(document.body.textContent).toContain('نکته‌ی دوم');
    expect(location.search).toBe('?label=unclear');

    chipNamed('همه').click();
    const green = document.querySelector('.dcp-hlib-sw[aria-label*="سبز"]') as HTMLElement;
    green.click();
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(1);
    expect(location.search).toBe('?color=green');
  });

  it('restores a filtered view from the URL alone', async () => {
    history.replaceState(null, '', '/plus/highlights.html?label=important');
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(1);
    expect(document.body.textContent).toContain('۱ از ۳ هایلایت');
  });

  it('the flat view is one timeline, newest first, each card naming its source', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    actNamed('فهرستِ زمانی').click();

    const cards = [...document.querySelectorAll('.dcp-hlib-list > .dcp-hlib-card')];
    expect(cards).toHaveLength(3);
    expect(document.querySelectorAll('.dcp-hlib-group'), 'no article groups in flat view').toHaveLength(0);
    expect(cards[0].textContent).toContain('نکته‌ی نوت‌کست'); // newest highlight leads
    expect(cards[0].querySelector('.dcp-hlib-src'), 'a flat card names its article').not.toBeNull();
    expect(location.search).toBe('?view=flat');
  });

  it('edits note, label and colour in place — no trip back to the article', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const card = document.querySelector('.dcp-hlib-card') as HTMLElement;
    actNamed('ویرایش', card).click();

    const ta = card.querySelector('.dcp-hlib-ta') as HTMLTextAreaElement;
    expect(ta, 'the editor opened inside the card').not.toBeNull();
    ta.value = 'یادداشتِ تازه';
    // The editor has its OWN label chips — scope to the card, or you press the
    // toolbar's filter chip of the same name instead.
    const editor = card.querySelector('.dcp-hlib-editor') as HTMLElement;
    ([...editor.querySelectorAll('.dcp-hlib-chip')]
      .find((c) => c.textContent === 'نکته بالینی') as HTMLElement).click();
    (card.querySelector('.dcp-hlib-sw[aria-label*="آبی"]') as HTMLElement).click();
    ([...card.querySelectorAll('button')].find((b) => b.textContent === 'ذخیره') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));

    expect(patched).toHaveLength(1);
    expect(patched[0].id).toBe('hl-3');
    expect(patched[0].patch).toMatchObject({ note: 'یادداشتِ تازه', label: 'clinical_pearl', color: 'blue' });
    expect(card.querySelector('.dcp-hlib-editor'), 'the editor closes on save').toBeNull();
    expect(card.textContent, 'the card shows the new note immediately').toContain('یادداشتِ تازه');
  });

  it('deleting drops the row and the counts follow', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const card = document.querySelector('.dcp-hlib-card') as HTMLElement;
    actNamed('حذف', card).click();
    const yes = [...card.querySelectorAll('button')]
      .find((b) => b.textContent === 'حذف' && b.classList.contains('dcp-btn-danger'))!;
    yes.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(deleted).toEqual(['hl-3']);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(2);
    // The article that held it disappears with it, and the count line agrees.
    expect(document.querySelectorAll('.dcp-hlib-group')).toHaveLength(1);
    expect(document.body.textContent).toContain('۲ هایلایت در ۱ مطلب');
  });

  it('offers a way out of a filter that matched nothing', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const search = document.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'چیزی که وجود ندارد';
    search.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 280));

    expect(document.body.textContent).toContain('چیزی با این فیلترها پیدا نشد');
    const clear = [...document.querySelectorAll('button')].find((b) => b.textContent === 'پاک‌کردنِ فیلترها')!;
    clear.click();
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
  });

  it('shows a real empty state, not an error, for a premium user with no highlights', async () => {
    libraryResponse = { total: 0, article_count: 0, articles: [] };
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(document.body.textContent).toContain('هنوز هایلایتی نداری');
  });
});
