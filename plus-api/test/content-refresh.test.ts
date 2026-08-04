// The runtime taxonomy refresh: what makes publishing an article stop requiring
// an image build. The rules that matter are the defensive ones — a refresh may
// only ever move FORWARD, and nothing a bad response can contain may take the
// API's taxonomy away.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyRemoteIndex, getIndex, indexSource, resetRemoteIndex, getTags } from '../src/content-index.js';
import { applyRemotePathways, getPathways, resetRemotePathways } from '../src/pathways.js';

const GOOD_INDEX = {
  version: 42,
  folders: [{ key: 'notecast', fa: 'نوت‌کست', url: '/notecast/', total: 1 }],
  clusters: [],
  tags: [{ key: 'endo', fa: 'اندو', contentCount: 1, contentIds: ['nc-1'] }],
  aliases: {},
  byContent: { 'nc-1': { cluster: null, subtopic: null, type: 'notecast', title: 'یک', url: '/n/1', secondary: [] } },
};

const GOOD_PATHWAYS = [{ id: 'p1', title_fa: 'یک', description_fa: '', premium: true, steps: [{ content_id: 'nc-1', milestone: false }], reserved: {} }];

beforeEach(() => { resetRemoteIndex(); resetRemotePathways(); });
afterEach(() => { resetRemoteIndex(); resetRemotePathways(); vi.restoreAllMocks(); });

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

describe('the poller itself', () => {
  it('does nothing at all when no URL is configured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { startContentRefresh } = await import('../src/content-refresh.js');
    const stop = startContentRefresh(); // config has no CONTENT_INDEX_URL under test
    stop();
    expect(fetchSpy, 'an unconfigured deployment must not reach the network').not.toHaveBeenCalled();
  });
});
