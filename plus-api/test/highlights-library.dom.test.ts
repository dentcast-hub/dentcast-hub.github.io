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
let conceptsResponse: any = null;
let conceptViewResponse: any = null;
const conceptCalls: string[] = [];
let clipLibResponse: any = null;
const addedToCollection: Array<{ id: string; item: any }> = [];
const clipDeleted: string[] = [];
const clipPatched: Array<{ id: string; patch: any }> = [];

vi.mock('/plus/js/api.js', () => ({
  api: {
    highlightLibrary: () => Promise.resolve(libraryResponse),
    highlightConcepts: () => (conceptsResponse ? Promise.resolve(conceptsResponse) : Promise.reject(new Error('none'))),
    highlightConcept: (key: string) => { conceptCalls.push(key); return conceptViewResponse ? Promise.resolve(conceptViewResponse) : Promise.reject(new Error('none')); },
    deleteHighlight: (id: string) => { deleted.push(id); return Promise.resolve({ ok: true }); },
    updateHighlight: (id: string, patch: any) => {
      patched.push({ id, patch });
      return Promise.resolve({ highlight: { id, exact: 'x', ...patch } });
    },
    listCollections: () => Promise.resolve({ collections: [{ id: 'c1', title: 'برد اول', item_count: 0, preview: [] }] }),
    addToCollection: (id: string, item: any) => { addedToCollection.push({ id, item }); return Promise.resolve({ ok: true }); },
    clipLibrary: () => (clipLibResponse ? Promise.resolve(clipLibResponse) : Promise.reject(new Error('none'))),
    deleteClip: (id: string) => { clipDeleted.push(id); return Promise.resolve({ ok: true }); },
    updateClip: (id: string, patch: any) => {
      clipPatched.push({ id, patch });
      return Promise.resolve({ clip: { id, content_id: 'episodes/episode-101', start_s: 447, end_s: 483, note: null, label: null, ...patch } });
    },
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
    conceptCalls.length = 0;
    libraryResponse = library();
    conceptsResponse = null;
    conceptViewResponse = null;
    clipLibResponse = null;
    clipDeleted.length = 0;
    clipPatched.length = 0;
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

// ---------------------------------------------------------------- concepts ---
// «نمای موضوعی»: the reader's own highlights gathered by concept. The chips
// are the concepts THEIR highlights reach (with counts), a chosen one swaps the
// list for the concept view, and the URL carries it like every other filter.
function concepts() {
  return {
    concepts: [
      { key: 'سمان رزینی', fa: 'سمان رزینی', highlights: 2, articles: 2, pages_total: 18, glossary: { slug: 'resin-cements', url: '/glossary/resin-cements.html', fa_title: 'سمان‌های رزینی' } },
      { key: 'اکلوژن', fa: 'اکلوژن', highlights: 1, articles: 1, pages_total: 40, glossary: null },
    ],
    total_highlights: 3, reached_highlights: 3,
  };
}
function conceptView() {
  const lib = library();
  return {
    concept: { key: 'سمان رزینی', fa: 'سمان رزینی', pages_total: 18, glossary: { slug: 'resin-cements', url: '/glossary/resin-cements.html', fa_title: 'سمان‌های رزینی' } },
    total: 2, article_count: 2,
    articles: [
      { ...lib.articles[0], count: 1, highlights: [{ ...lib.articles[0].highlights[0], match: 'text' }] },
      { ...lib.articles[1], count: 1, highlights: [{ ...lib.articles[1].highlights[0], match: 'tag' }] },
    ],
  };
}

describe('concept view', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    history.replaceState(null, '', '/plus/highlights.html');
    libraryResponse = library();
    conceptsResponse = concepts();
    conceptViewResponse = conceptView();
    conceptCalls.length = 0;
  });

  it('shows the concepts the reader\'s highlights reach, with counts, and nothing when the catalog is absent', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const row = document.querySelector('.dcp-hlib-concepts') as HTMLElement;
    expect(row.hidden).toBe(false);
    const chips = Array.from(row.querySelectorAll('.dcp-hlib-chip')).map((c) => c.textContent);
    expect(chips).toEqual(['همه', 'سمان رزینی۲', 'اکلوژن۱']);
    expect(document.querySelector('.dcp-hlib-chead')!.hasAttribute('hidden')).toBe(true);

    conceptsResponse = null;
    document.body.innerHTML = '<div id="root"></div>';
    await renderHighlightLibrary(document.getElementById('root')!);
    expect((document.querySelector('.dcp-hlib-concepts') as HTMLElement).hidden).toBe(true);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3); // the library is still the library
  });

  it('a chosen concept swaps the list for its view, names it, links the glossary and marks text matches', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    chipNamed('سمان رزینی').click();
    await new Promise((r) => setTimeout(r, 0));
    expect(conceptCalls).toEqual(['سمان رزینی']);
    expect(location.search).toContain('concept=');
    expect(new URLSearchParams(location.search).get('concept')).toBe('سمان رزینی');
    const head = document.querySelector('.dcp-hlib-chead') as HTMLElement;
    expect(head.hidden).toBe(false);
    expect(head.querySelector('.dcp-hlib-chead-t')!.textContent).toContain('سمان رزینی');
    expect(head.querySelector('.dcp-hlib-chead-m')!.textContent).toContain('۲ هایلایت در ۲ مطلب');
    expect(head.querySelector('.dcp-hlib-chead-links a')!.getAttribute('href')).toBe('/glossary/resin-cements.html');
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(2);
    expect(document.querySelectorAll('.dcp-hlib-via')).toHaveLength(1); // only the text match wears the mark
    expect(document.querySelector('.dcp-hlib-count')!.textContent).toContain('۲ هایلایت در ۲ مطلب');
    expect(chipNamed('سمان رزینی').classList.contains('is-on')).toBe(true);

    // «همه» is the way back: the full library, the URL cleared.
    chipNamed('همه').click();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
    expect(location.search).not.toContain('concept=');
    expect((document.querySelector('.dcp-hlib-chead') as HTMLElement).hidden).toBe(true);
  });

  it('opens ON a deep-linked concept before the first paint', async () => {
    history.replaceState(null, '', '/plus/highlights.html?concept=' + encodeURIComponent('سمان رزینی'));
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(conceptCalls).toEqual(['سمان رزینی']);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(2);
    expect((document.querySelector('.dcp-hlib-chead') as HTMLElement).hidden).toBe(false);
  });

  it('shows eight chips, folds the rest, and keeps a deep-linked concept beyond the cap lit — with no stray text', async () => {
    const many = { concepts: Array.from({ length: 12 }, (_, i) => ({ key: 'c' + i, fa: 'مفهوم ' + i, highlights: 12 - i, articles: 1, pages_total: 3, glossary: null })), total_highlights: 3, reached_highlights: 3 };
    conceptsResponse = many;
    await renderHighlightLibrary(document.getElementById('root')!);
    let row = document.querySelector('.dcp-hlib-concepts') as HTMLElement;
    expect(row.querySelectorAll('.dcp-hlib-chip:not(.is-more)')).toHaveLength(1 + 8);
    expect(row.querySelector('.dcp-hlib-chip.is-more')!.textContent).toBe('+۴ مفهوم دیگر');
    expect(row.textContent).not.toContain('null');
    (row.querySelector('.dcp-hlib-chip.is-more') as HTMLElement).click();
    expect(row.querySelectorAll('.dcp-hlib-chip:not(.is-more)')).toHaveLength(1 + 12);

    conceptViewResponse = { ...conceptView(), concept: { key: 'c11', fa: 'مفهوم 11', pages_total: 3, glossary: null } };
    history.replaceState(null, '', '/plus/highlights.html?concept=c11');
    document.body.innerHTML = '<div id="root"></div>';
    await renderHighlightLibrary(document.getElementById('root')!);
    row = document.querySelector('.dcp-hlib-concepts') as HTMLElement;
    const lit = row.querySelector('.dcp-hlib-chip.is-on')!;
    expect(lit.textContent).toContain('مفهوم 11');
    expect(row.querySelectorAll('.dcp-hlib-chip:not(.is-more)')).toHaveLength(1 + 8 + 1);
    expect((document.querySelector('.dcp-hlib-chead') as HTMLElement).textContent).not.toContain('null');
  });

  it('«#concepts» (the premium tab\'s card) opens the concept row in full and scrolls to it', async () => {
    const many = { concepts: Array.from({ length: 12 }, (_, i) => ({ key: 'c' + i, fa: 'مفهوم ' + i, highlights: 12 - i, articles: 1, pages_total: 3, glossary: null })), total_highlights: 3, reached_highlights: 3 };
    conceptsResponse = many;
    const scrolled: any[] = [];
    (window as any).scrollTo = (o: any) => { scrolled.push(o); };
    history.replaceState(null, '', '/plus/highlights.html#concepts');
    await renderHighlightLibrary(document.getElementById('root')!);
    const row = document.querySelector('.dcp-hlib-concepts') as HTMLElement;
    expect(row.hidden).toBe(false);
    // Every concept, no «+N مفهوم دیگر» to tap first — the card named this row.
    expect(row.querySelector('.dcp-hlib-chip.is-more')).toBeNull();
    expect(row.querySelectorAll('.dcp-hlib-chip')).toHaveLength(1 + 12);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0].behavior).toBe('smooth');
    expect(row.classList.contains('dcp-flash')).toBe(true);
    // The whole library is still the list: the hash picks a row, not a concept.
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
    expect(conceptCalls).toEqual([]);

    // Under the audio filter the row does not exist, so nothing is scrolled to.
    scrolled.length = 0;
    history.replaceState(null, '', '/plus/highlights.html?kind=clip#concepts');
    document.body.innerHTML = '<div id="root"></div>';
    await renderHighlightLibrary(document.getElementById('root')!);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(scrolled).toHaveLength(0);
    history.replaceState(null, '', '/plus/highlights.html');
  });

  it('an unknown deep-linked concept falls back to the whole library rather than an empty page', async () => {
    conceptViewResponse = null;
    history.replaceState(null, '', '/plus/highlights.html?concept=nope');
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
    expect(location.search).not.toContain('concept=');
  });
});


// --- قطعه‌های صوتی in the same library ------------------------------------------
function clipLibrary() {
  return {
    total: 2, article_count: 1,
    articles: [{
      content_id: 'episodes/episode-101',
      title: 'باندینگ به دنتین ریشه', url: '/episodes/episode-101.html',
      type: 'episodes', folder: 'episodes', folder_fa: 'پادکست',
      last_clip_at: '2026-09-13T10:00:00Z', count: 2,
      clips: [
        { id: 'clip-1', content_id: 'episodes/episode-101', start_s: 447, end_s: 483, note: 'ترتیب EDTA و سایلن', label: 'clinical_pearl', created_at: '2026-09-13T10:00:00Z' },
        { id: 'clip-2', content_id: 'episodes/episode-101', start_s: 910, end_s: 962, note: null, label: null, created_at: '2026-09-12T10:00:00Z' },
      ],
    }],
  };
}

describe('audio clips in the library', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    history.replaceState(null, '', '/plus/highlights.html');
    libraryResponse = library();
    clipLibResponse = clipLibrary();
    conceptsResponse = null;
    clipDeleted.length = 0;
    clipPatched.length = 0;
  });

  it('a clip is a card in its episode\'s group: the span, the length, the note — and the headline names both kinds', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(document.querySelectorAll('.dcp-hlib-group')).toHaveLength(3);
    // the episode's clips were touched last, so its group leads
    expect(document.querySelector('.dcp-hlib-group .dcp-hlib-gtitle')!.textContent).toBe('باندینگ به دنتین ریشه');
    const cards = document.querySelectorAll('.dcp-clipcard-wrap');
    expect(cards).toHaveLength(2);
    const first = cards[0] as HTMLElement;
    expect(first.querySelector('.dcp-clipcard-times')!.textContent).toBe('07:27 → 08:03');
    expect(first.querySelector('.dcp-clipcard-len')!.textContent).toBe('۳۶ ثانیه');
    expect(first.textContent).toContain('ترتیب EDTA و سایلن');
    expect(first.querySelector('.dcp-card-label')!.textContent).toBe('نکته بالینی');
    expect(first.closest('a')).toBeNull(); // a card, never a link
    expect(document.querySelector('.dcp-hlib-count')!.textContent).toContain('۳ هایلایت · ۲ هایلایت صوتی در ۳ مطلب');
    expect(document.querySelector('.dcp-hlib-gsub')!.textContent).toContain('۲ هایلایت صوتی');
  });

  it('under «هایلایت صوتی» the rows a clip cannot use are gone and the label counts follow', async () => {
    conceptsResponse = concepts();
    history.replaceState(null, '', '/plus/highlights.html?kind=clip');
    await renderHighlightLibrary(document.getElementById('root')!);
    // concept views carry no clips, so the concept row would only lead out of the filter
    expect((document.querySelector('.dcp-hlib-concepts') as HTMLElement).hidden).toBe(true);
    // a clip has no colour: no swatches
    expect(document.querySelectorAll('.dcp-hlib-sw')).toHaveLength(0);
    // label chips count clips only (one carries «نکته بالینی», one none) — the
    // label row's «همه» is the LAST such chip; the kind row's comes first
    const allChips = [...document.querySelectorAll('.dcp-hlib-chip')].filter((c) => (c.textContent || '').startsWith('همه'));
    expect(allChips[allChips.length - 1].textContent).toBe('همه۲');
    expect(chipNamed('نکته بالینی').textContent).toBe('نکته بالینی۱');
    expect((chipNamed('مهم') as HTMLButtonElement).disabled).toBe(true);
    // back to «همه» on the kind row: the rows return
    (document.querySelector('.dcp-hlib-kinds .dcp-hlib-chip') as HTMLElement).click();
    expect((document.querySelector('.dcp-hlib-concepts') as HTMLElement).hidden).toBe(false);
    expect(document.querySelectorAll('.dcp-hlib-sw').length).toBeGreaterThan(0);
  });

  it('the episode link lands ON the clip (?dcclip=) and the kind filter lives in the URL', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const card = document.querySelector('.dcp-clipcard-wrap') as HTMLElement;
    expect(actNamed('شنیدن در اپیزود', card).getAttribute('href')).toBe('/episodes/episode-101.html?dcclip=clip-1');

    const kinds = document.querySelector('.dcp-hlib-kinds') as HTMLElement;
    expect(kinds.hidden).toBe(false);
    (kinds.querySelector('[data-kind="clip"]') as HTMLElement).click();
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(2);
    expect(document.querySelectorAll('.dcp-clipcard-wrap')).toHaveLength(2);
    expect(location.search).toBe('?kind=clip');
    (kinds.querySelector('[data-kind="text"]') as HTMLElement).click();
    expect(document.querySelectorAll('.dcp-clipcard-wrap')).toHaveLength(0);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
    expect(location.search).toBe('?kind=text');
  });

  it('opens ON ?kind=clip, and a colour filter never matches a clip', async () => {
    history.replaceState(null, '', '/plus/highlights.html?kind=clip');
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(2);
    expect(document.querySelectorAll('.dcp-clipcard-wrap')).toHaveLength(2);

    (document.querySelector('.dcp-hlib-kinds [data-kind=""]') as HTMLElement).click();
    (document.querySelector('.dcp-hlib-sw') as HTMLElement).click(); // first colour swatch
    expect(document.querySelectorAll('.dcp-clipcard-wrap')).toHaveLength(0);
  });

  it('the «نوع» row is absent when the reader owns no clip', async () => {
    clipLibResponse = { total: 0, article_count: 0, articles: [] };
    await renderHighlightLibrary(document.getElementById('root')!);
    expect((document.querySelector('.dcp-hlib-kinds') as HTMLElement).hidden).toBe(true);
    expect(document.querySelector('.dcp-hlib-count')!.textContent).toContain('۳ هایلایت در ۲ مطلب');
  });

  it('a clip library that fails to load leaves the text library intact', async () => {
    clipLibResponse = null;
    await renderHighlightLibrary(document.getElementById('root')!);
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(3);
    expect(document.querySelectorAll('.dcp-clipcard-wrap')).toHaveLength(0);
  });

  it('search finds a clip by its note; delete and edit go to the clip routes', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const search = document.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'سایلن';
    search.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 280));
    expect(document.querySelectorAll('.dcp-hlib-card')).toHaveLength(1);
    expect(document.querySelector('.dcp-clipcard-wrap')).not.toBeNull();

    const card = document.querySelector('.dcp-clipcard-wrap') as HTMLElement;
    actNamed('ویرایش', card).click();
    const ta = card.querySelector('textarea') as HTMLTextAreaElement;
    ta.value = 'اصلاح‌شده';
    // nudge the end by a second, then save
    ([...card.querySelectorAll('.dcp-clip-nudge')].find((b) => (b as HTMLElement).getAttribute('aria-label') === 'پایان +۱ ثانیه') as HTMLElement).click();
    (card.querySelector('.dcp-btn-primary') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(clipPatched).toEqual([{ id: 'clip-1', patch: { note: 'اصلاح‌شده', label: 'clinical_pearl', end_s: 484 } }]);
    expect(card.querySelector('.dcp-clipcard-times')!.textContent).toBe('07:27 → 08:04');

    actNamed('حذف', card).click();
    (card.querySelector('.dcp-btn-danger') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(clipDeleted).toEqual(['clip-1']);
    expect(document.querySelectorAll('.dcp-clipcard-wrap')).toHaveLength(0);
  });

  it('a clip whose episode file cannot be resolved says so instead of spinning', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const card = document.querySelector('.dcp-clipcard-wrap') as HTMLElement;
    (card.querySelector('.dcp-clipcard-play') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(card.querySelector('.dcp-clipcard-play')!.classList.contains('is-playing')).toBe(false);
    expect(document.querySelector('.dcp-cl-toast')!.textContent).toContain('فایل این اپیزود پیدا نشد');
  });
});

describe('a clip card files into a collection', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    history.replaceState(null, '', '/plus/highlights.html');
    libraryResponse = library();
    clipLibResponse = clipLibrary();
    conceptsResponse = null;
    addedToCollection.length = 0;
    document.querySelectorAll('.dcp-sheet-overlay').forEach((n) => n.remove());
  });

  it('«🗂 کالکشن» on a clip card opens the picker and adds by clip_id', async () => {
    await renderHighlightLibrary(document.getElementById('root')!);
    const card = document.querySelector('.dcp-clipcard-wrap') as HTMLElement;
    actNamed('کالکشن', card).click();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const row = document.querySelector('.dcp-cl-pick-row') as HTMLElement;
    expect(row, 'the picker sheet lists the boards').not.toBeNull();
    row.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(addedToCollection).toEqual([{ id: 'c1', item: { clip_id: 'clip-1' } }]);
  });
});
