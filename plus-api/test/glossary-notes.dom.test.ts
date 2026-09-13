// @vitest-environment jsdom
// Drives the REAL shipped module (/plus/js/glossary-notes.js): the block under
// a دانشنامه term that gathers the reader's own highlights about it.
//
// The rules only a DOM test can hold:
//   · it mounts on glossary content_ids ONLY, and directly after the anchor;
//   · nobody signed in, or nothing behind the term → the host REMOVES itself
//     (a locked box under 109 terms would be an advert, not content);
//   · a free reader with notes gets a door with THEIR count, never the notes;
//   · premium gets the three newest across articles, each under its source,
//     a «در متن هایلایت» mark only on a text match, and a link to the concept
//     view in the دفترچه.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const state = { user: null as null | { tier: string }, notes: null as any, calls: [] as string[] };

vi.mock('/plus/js/api.js', () => ({
  api: {
    glossaryNotes: async (slug: string) => { state.calls.push(slug); if (!state.notes) throw new Error('none'); return state.notes; },
  },
  currentUser: async () => state.user,
}));
vi.mock('/plus/js/premium-cta.js', () => ({
  premiumCta: (from: string) => { const a = document.createElement('a'); a.className = 'dcp-btn'; a.dataset.from = from; a.textContent = 'خرید اشتراک پریمیوم'; return a; },
}));

const { mountGlossaryNotes, renderGlossaryNotes, conceptHref } = await import('/plus/js/glossary-notes.js');

const hl = (id: string, exact: string, over: Record<string, unknown> = {}) => ({
  id, content_id: 'x', exact, prefix: null, suffix: null, color: 'yellow', underline: false,
  cloze_markers: [], note: null, label: null, content_hash: null,
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', match: 'tag', ...over,
});

function notes(over: Record<string, unknown> = {}) {
  return {
    locked: false,
    term: { slug: 'resin-cements', fa_title: 'سمان‌های رزینی', url: '/glossary/resin-cements.html' },
    concepts: [{ key: 'سمان رزینی', fa: 'سمان رزینی' }],
    total: 4,
    article_count: 2,
    articles: [
      {
        content_id: 'episodes/episode-148', title: 'راهنمای انتخاب سمان رزینی', url: '/episodes/episode-148.html',
        type: 'episodes', folder: 'episodes', folder_fa: 'پادکست', last_highlight_at: '2026-09-03T00:00:00Z', count: 2,
        highlights: [
          hl('h1', 'برای زیرکونیا، سمان رزینی با MDP', { created_at: '2026-09-03T00:00:00Z', note: 'یادداشت' }),
          hl('h2', 'دوال‌کیور زیر رستوریشن ضخیم', { created_at: '2026-09-02T00:00:00Z' }),
        ],
      },
      {
        content_id: 'insight/insight-1', title: 'ضخامت کاغذ آرتیکولاسیون', url: '/insight/insight-1.html',
        type: 'insight', folder: 'insight', folder_fa: 'اینسایت', last_highlight_at: '2026-09-01T00:00:00Z', count: 2,
        highlights: [
          hl('h3', 'بعد از سمان رزینی، اضافه‌ی سمان را بردار', { created_at: '2026-09-01T12:00:00Z', match: 'text' }),
          hl('h4', 'قدیمی‌ترین', { created_at: '2026-08-01T00:00:00Z', match: 'text' }),
        ],
      },
    ],
    ...over,
  };
}

function page() {
  document.body.innerHTML = '<main><article class="prose"><p>متن واژه</p></article><div class="dc-related-section">کاوش بیشتر</div></main>';
  return document.querySelector('article')!;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  state.user = null; state.notes = null; state.calls = [];
  (globalThis as any).IntersectionObserver = undefined;
});

describe('mountGlossaryNotes', () => {
  it('is a no-op off the glossary, and refuses a slug that is not one', () => {
    const anchor = page();
    expect(mountGlossaryNotes(anchor, 'insight/insight-1')).toBe(false);
    expect(mountGlossaryNotes(anchor, 'glossary/../etc')).toBe(false);
    expect(document.querySelector('.dcp-gn')).toBeNull();
  });

  it('mounts directly after the anchor, above «کاوش بیشتر», and removes itself for a stranger', async () => {
    const anchor = page();
    expect(mountGlossaryNotes(anchor, 'glossary/resin-cements')).toBe(true);
    const host = document.querySelector('.dcp-gn')!;
    expect(host.previousElementSibling).toBe(anchor);
    expect(host.nextElementSibling!.className).toBe('dc-related-section');
    await flush(); await flush();
    expect(document.querySelector('.dcp-gn')).toBeNull();
    expect(state.calls).toEqual([]); // never even asked
  });

  it('removes itself when there is nothing behind the term, on any plan', async () => {
    state.user = { tier: 'premium' };
    state.notes = notes({ total: 0, article_count: 0, articles: [] });
    mountGlossaryNotes(page(), 'glossary/resin-cements');
    await flush(); await flush();
    expect(document.querySelector('.dcp-gn')).toBeNull();
    expect(state.calls).toEqual(['resin-cements']);
  });

  it('draws the block for a premium reader with notes', async () => {
    state.user = { tier: 'premium' };
    state.notes = notes();
    mountGlossaryNotes(page(), 'glossary/resin-cements');
    await flush(); await flush();
    const host = document.querySelector('.dcp-gn')!;
    expect(host).not.toBeNull();
    expect(host.querySelector('.dcp-gn-title')!.textContent).toBe('یادداشت‌های خودت درباره‌ی این مفهوم');
    expect(host.querySelector('.dcp-gn-meta')!.textContent).toBe('۴ هایلایت · ۲ مطلب');
  });
});

describe('renderGlossaryNotes', () => {
  it('shows the three newest across articles, each under its source, marks text matches, and links to the concept view', () => {
    const host = document.createElement('section');
    renderGlossaryNotes(host, notes());
    const marks = Array.from(host.querySelectorAll('mark.dcp-hl')).map((m) => m.textContent);
    expect(marks).toEqual(['برای زیرکونیا، سمان رزینی با MDP', 'دوال‌کیور زیر رستوریشن ضخیم', 'بعد از سمان رزینی، اضافه‌ی سمان را بردار']);
    const sources = Array.from(host.querySelectorAll('.dcp-gn-src a')).map((a) => a.textContent);
    expect(sources).toEqual(['راهنمای انتخاب سمان رزینی', 'ضخامت کاغذ آرتیکولاسیون']);
    expect(host.querySelectorAll('.dcp-gn-via').length).toBe(1);
    expect(host.querySelector('.dcp-hlib-note')!.textContent).toBe('یادداشت');
    const go = host.querySelectorAll<HTMLAnchorElement>('.dcp-gn-go');
    expect(go[0].getAttribute('href')).toContain('/episodes/episode-148.html');
    expect(go[0].getAttribute('href')).toContain('dcphl=h1');
    const all = host.querySelector<HTMLAnchorElement>('.dcp-gn-all')!;
    expect(all.textContent).toBe('همه‌ی ۴ هایلایت این مفهوم در دفترچه ›');
    expect(all.getAttribute('href')).toBe(conceptHref('سمان رزینی'));
    expect(host.querySelector('.dcp-gn-door')).toBeNull();
  });

  it('a free reader gets a door with their own count and no highlight text', () => {
    const host = document.createElement('section');
    renderGlossaryNotes(host, { locked: true, term: notes().term, concepts: [], total: 3, article_count: 2 });
    const door = host.querySelector('.dcp-gn-door')!;
    expect(door).not.toBeNull();
    expect(door.textContent).toContain('۳ هایلایت');
    expect(door.textContent).toContain('۲ مطلب');
    expect(door.querySelector('.dcp-btn')!.textContent).toBe('خرید اشتراک پریمیوم');
    expect(host.querySelector('mark.dcp-hl')).toBeNull();
    expect(host.querySelector('.dcp-gn-all')).toBeNull();
  });

  it('with three or fewer notes the link still leads to the دفترچه, worded plainly', () => {
    const host = document.createElement('section');
    const n = notes();
    n.total = 2; n.articles[1].highlights = []; n.articles[0].highlights = n.articles[0].highlights.slice(0, 2);
    renderGlossaryNotes(host, n);
    expect(host.querySelector('.dcp-gn-all')!.textContent).toBe('دیدن در دفترچه‌ی هایلایت‌ها ›');
  });
});
