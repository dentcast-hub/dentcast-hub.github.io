// @vitest-environment jsdom
// Drives the REAL shipped library module (/plus/js/highlights.js) — the premium
// «دفترچه‌ی هایلایت‌ها». The three assertions that matter are the three things
// the feature was built to fix (user report, 2026-08-05):
//   1. the highlight TEXT is on the page, in full, with its note — reading
//      happens here, not inside the article;
//   2. a highlight row is NOT a link (only the article title is), so a click
//      cannot throw you back into the article;
//   3. the «متنِ مقاله» action carries ?dcphl=<id>, so going there lands ON the
//      highlight with the workbench already open.
import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

const deleted: string[] = [];
let libraryResponse: any = null;

vi.mock('/plus/js/api.js', () => ({
  api: {
    highlightLibrary: () => Promise.resolve(libraryResponse),
    deleteHighlight: (id: string) => { deleted.push(id); return Promise.resolve({ ok: true }); },
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
          },
          {
            id: 'hl-2', content_id: 'insight/insight-1', exact: 'نکته‌ی دوم',
            color: 'blue', underline: false, note: null, label: 'unclear',
          },
        ],
      },
    ],
  };
}

describe('premium highlight library', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    deleted.length = 0;
    libraryResponse = library();
  });

  it('renders every highlight in full, with its note, without opening the article', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const text = document.body.textContent || '';

    expect(document.querySelectorAll('.dcp-hlib-group')).toHaveLength(2);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
    // Full text, not a truncated preview.
    expect(text).toContain('پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است');
    expect(text).toContain('برای بورد مهم است'); // the user's own note
    expect(text).toContain('۳ هایلایت در ۲ مطلب');
    // The mark keeps the colour the reader chose.
    const mark = document.querySelector('.dcp-hlib-body mark.dcp-hl') as HTMLElement;
    expect(mark.getAttribute('data-color')).toBe('green');
  });

  it('a highlight is a card, not a link, and its article link lands on the highlight', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);

    const card = document.querySelector('.dcp-hlib-card') as HTMLElement;
    expect(card.closest('a'), 'the card is not wrapped in a link').toBeNull();
    expect(card.querySelector('.dcp-hlib-body a'), 'the highlight text is not a link').toBeNull();

    const go = card.querySelector('.dcp-hlib-go') as HTMLAnchorElement;
    expect(go.getAttribute('href')).toBe('/notecast/notecast-1.html?dcphl=hl-3');
  });

  it('search matches the note as well as the text, folding ZWNJ and Arabic letters', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const search = document.querySelector('input[type="search"]') as HTMLInputElement;

    search.value = 'براي بورد'; // Arabic ي, and a plain space where the data has none
    search.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 260)); // debounce

    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(1);
    expect(document.body.textContent).toContain('۱ از ۳ هایلایت');
  });

  it('filters by label chip', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const chips = [...document.querySelectorAll('.dcp-hlib-chip')] as HTMLElement[];
    const unclear = chips.find((c) => c.textContent === 'مبهم')!;
    unclear.click();
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(1);
    expect(document.body.textContent).toContain('نکته‌ی دوم');
  });

  it('deleting drops the row and the counts follow', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const card = document.querySelector('.dcp-hlib-card') as HTMLElement;
    (card.querySelector('.dcp-hlib-del') as HTMLElement).click();
    const yes = [...card.querySelectorAll('button')].find((b) => b.textContent === 'حذف' && b.classList.contains('dcp-btn-danger'))!;
    yes.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(deleted).toEqual(['hl-3']);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(2);
    // The article that held it disappears with it, and the count line agrees.
    expect(document.querySelectorAll('.dcp-hlib-group')).toHaveLength(1);
    expect(document.body.textContent).toContain('۲ هایلایت در ۱ مطلب');
  });

  it('shows a real empty state, not an error, for a premium user with no highlights', async () => {
    libraryResponse = { total: 0, article_count: 0, articles: [] };
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(document.body.textContent).toContain('هنوز هایلایتی نداری');
  });
});
