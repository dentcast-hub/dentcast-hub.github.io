// The runtime taxonomy refresh: what makes publishing an article stop requiring
// an image build. The rules that matter are the defensive ones — a refresh may
// only ever move FORWARD, and nothing a bad response can contain may take the
// API's taxonomy away.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyRemoteIndex, getIndex, indexSource, resetRemoteIndex, getTags } from '../src/content-index.js';
import { applyRemotePathways, getPathways, resetRemotePathways } from '../src/pathways.js';
import {
  applyRemoteFlashcards, flashcardsSource, resetRemoteFlashcards,
  getCardsFor, getCard, contentIdsWithCards,
} from '../src/flashcards.js';

const GOOD_INDEX = {
  version: 42,
  folders: [{ key: 'notecast', fa: 'نوت‌کست', url: '/notecast/', total: 1 }],
  clusters: [],
  tags: [{ key: 'endo', fa: 'اندو', contentCount: 1, contentIds: ['nc-1'] }],
  aliases: {},
  byContent: { 'nc-1': { cluster: null, subtopic: null, type: 'notecast', title: 'یک', url: '/n/1', secondary: [] } },
};

const GOOD_PATHWAYS = [{ id: 'p1', title_fa: 'یک', description_fa: '', premium: true, steps: [{ content_id: 'nc-1', milestone: false }], reserved: {} }];

const GOOD_FLASHCARDS = {
  version: 7,
  byContent: {
    'nc-1': { cards: [{ id: 'flashcards-c1', front: 'جلو', back: 'پشت', source: 'faq', source_faq_index: 0 }] },
  },
};

beforeEach(() => { resetRemoteIndex(); resetRemotePathways(); resetRemoteFlashcards(); });
afterEach(() => { resetRemoteIndex(); resetRemotePathways(); resetRemoteFlashcards(); vi.restoreAllMocks(); });

describe('a published index replaces the baked one', () => {
  it('adopts a well-formed payload and serves it', () => {
    expect(indexSource()).toBe('image/disk');
    expect(applyRemoteIndex(GOOD_INDEX)).toBe(true);
    expect(indexSource()).toBe('published (version 42)');
    expect(getIndex().version).toBe(42);
    expect(getTags().map((t) => t.key)).toEqual(['endo']);
  });

  it('adopts a newer payload over an already-adopted one', () => {
    applyRemoteIndex(GOOD_INDEX);
    expect(applyRemoteIndex({ ...GOOD_INDEX, version: 43 })).toBe(true);
    expect(getIndex().version).toBe(43);
  });
});

describe('nothing a bad response contains may blank the taxonomy', () => {
  // Each of these is a real failure mode: a CDN error page, a half-written
  // file, a request that succeeded against the wrong URL, a build that emitted
  // an empty index. All must leave the previous copy standing.
  const rejected: Array<[string, unknown]> = [
    ['an HTML error page', '<!doctype html><title>404</title>'],
    ['null', null],
    ['an array where an object belongs', []],
    ['a missing collection', { version: 1, folders: [], clusters: [], byContent: { a: {} } }],
    ['byContent as an array', { version: 1, folders: [], clusters: [], tags: [], byContent: [] }],
    ['a structurally valid but EMPTY index', { version: 99, folders: [], clusters: [], tags: [], aliases: {}, byContent: {} }],
  ];

  for (const [label, payload] of rejected) {
    it(`refuses ${label}`, () => {
      applyRemoteIndex(GOOD_INDEX); // a good copy is already in service
      expect(applyRemoteIndex(payload)).toBe(false);
      expect(getIndex().version, 'the previous copy must still be served').toBe(42);
    });
  }

  it('falls back to the on-disk index when nothing was ever adopted', () => {
    // The repo's own file — proves the boot path is untouched by all of this.
    expect(indexSource()).toBe('image/disk');
    expect(Object.keys(getIndex().byContent).length).toBeGreaterThan(0);
  });
});

describe('pathways follow the same rules', () => {
  it('adopts a well-formed array', () => {
    expect(applyRemotePathways(GOOD_PATHWAYS)).toBe(true);
    expect(getPathways()).toHaveLength(1);
    expect(getPathways()[0].id).toBe('p1');
  });

  it('refuses an empty array, junk, and entries without steps', () => {
    applyRemotePathways(GOOD_PATHWAYS);
    expect(applyRemotePathways([]), 'empty would wipe every pathway page').toBe(false);
    expect(applyRemotePathways({ id: 'p1' })).toBe(false);
    expect(applyRemotePathways([{ id: 'p2' }]), 'no steps array').toBe(false);
    expect(applyRemotePathways([{ steps: [] }]), 'no id').toBe(false);
    expect(getPathways()[0].id, 'the previous copy must still be served').toBe('p1');
  });
});

describe('flashcards follow the same rules', () => {
  it('adopts a well-formed payload and serves it', () => {
    expect(flashcardsSource()).toBe('image/disk');
    expect(applyRemoteFlashcards(GOOD_FLASHCARDS)).toBe(true);
    expect(flashcardsSource()).toBe('published (version 7)');
    expect(getCardsFor('nc-1')).toHaveLength(1);
    expect(getCard('nc-1', 'flashcards-c1')?.front).toBe('جلو');
  });

  const rejected: Array<[string, unknown]> = [
    ['an HTML error page', '<!doctype html><title>404</title>'],
    ['null', null],
    ['an array where an object belongs', []],
    ['no byContent', { version: 1 }],
    ['byContent as an array', { version: 1, byContent: [] }],
    ['a structurally valid but EMPTY byContent', { version: 99, byContent: {} }],
    ['a card missing front', { version: 1, byContent: { a: { cards: [{ id: 'x', back: 'y' }] } } }],
    ['a card with an empty id', { version: 1, byContent: { a: { cards: [{ id: '', front: 'x', back: 'y' }] } } }],
    ['an entry whose cards is not an array', { version: 1, byContent: { a: { cards: 'nope' } } }],
  ];

  for (const [label, payload] of rejected) {
    it(`refuses ${label}`, () => {
      applyRemoteFlashcards(GOOD_FLASHCARDS); // a good copy is already in service
      expect(applyRemoteFlashcards(payload)).toBe(false);
      expect(flashcardsSource(), 'the previous copy must still be served').toBe('published (version 7)');
    });
  }

  it('falls back to the on-disk index when nothing was ever adopted', () => {
    expect(flashcardsSource()).toBe('image/disk');
    expect(contentIdsWithCards().length).toBeGreaterThan(0);
  });

  it('getCardsFor / getCard are tolerant of unknown content or card ids', () => {
    expect(getCardsFor('does/not-exist')).toEqual([]);
    expect(getCard('does/not-exist', 'nope')).toBeNull();
    const known = contentIdsWithCards()[0];
    expect(getCard(known, 'nope')).toBeNull();
  });
});

describe('the poller itself', () => {
  it('does nothing at all when no URL is configured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { startContentRefresh } = await import('../src/content-refresh.js');
    const stop = startContentRefresh(); // config has no CONTENT_INDEX_URL under test
    stop();
    expect(fetchSpy, 'an unconfigured deployment must not reach the network').not.toHaveBeenCalled();
  });

  /**
   * The staleness this module exists to remove came back through its own fetch:
   * `cache-control: no-cache` is a REQUEST header, which an edge may ignore and
   * Cloudflare ignores by default, so a published rename could sit behind a CDN
   * copy while every poll reported success. A query parameter is not ignorable —
   * it is a different URL.
   */
  it('asks for a URL no cache can already hold, and still sends the header', async () => {
    const { config } = await import('../src/config.js');
    const { refreshOnce, contentStatus, resetContentStatus } = await import('../src/content-refresh.js');
    const seen: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return { ok: true, status: 200, json: async () => GOOD_PATHWAYS } as unknown as Response;
    }));
    const saved = config.content.pathwaysUrls;
    config.content.pathwaysUrls = ['https://example.test/plus/pathways.json?x=1'];
    resetContentStatus();
    try {
      await refreshOnce();
      expect(seen).toHaveLength(1);
      // The configured query string survives; ours is appended to it.
      expect(seen[0].url).toMatch(/\?x=1&_dc=\d+$/);
      expect((seen[0].init.headers as Record<string, string>)['cache-control']).toBe('no-cache');

      // And the fetch that was adopted is visible from outside the container:
      // 'image/disk' vs 'published' is what tells an unset env var apart from a
      // rejected payload apart from a cache — one symptom, three fixes.
      const pw = contentStatus().find((f) => f.key === 'pathways')!;
      expect(pw).toMatchObject({ env: 'PATHWAYS_URL', configured: true, last_error: null });
      expect(pw.source).toBe('published (1 pathway(s))');
      expect(pw.last_ok_at).toBeTruthy();
    } finally {
      config.content.pathwaysUrls = saved;
      resetContentStatus();
    }
  });

  it('records WHY a file is still the baked one, per file', async () => {
    const { config } = await import('../src/config.js');
    const { refreshOnce, contentStatus, resetContentStatus } = await import('../src/content-refresh.js');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 504, json: async () => ({}) } as unknown as Response)));
    const saved = config.content.pathwaysUrls;
    config.content.pathwaysUrls = ['https://example.test/plus/pathways.json'];
    resetContentStatus();
    try {
      await refreshOnce();
      const files = contentStatus();
      const pw = files.find((f) => f.key === 'pathways')!;
      expect(pw.source, 'a failed fetch leaves the baked copy in service').toBe('image/disk');
      expect(pw.last_error).toContain('504');
      expect(pw.last_ok_at).toBeNull();
      // An unconfigured file says so rather than looking like a failure.
      const badges = files.find((f) => f.key === 'badges')!;
      expect(badges).toMatchObject({ configured: false, env: 'BADGES_URL', last_try_at: null, last_error: null });
    } finally {
      config.content.pathwaysUrls = saved;
      resetContentStatus();
    }
  });
});
