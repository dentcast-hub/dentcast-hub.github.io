import { describe, it, expect, afterEach } from 'vitest';
import { folderOf, getFolders, getIndex, folderProgress, applyRemoteIndex, resetRemoteIndex } from '../src/content-index.js';
// @ts-expect-error — a browser module, driven as-is
import { freshFolders } from '/plus/js/content-index.js';

// The folder a content_id belongs to. Flat sections are the first path segment;
// a section that lives at a two-level address (/dentai/promptologist/) is the
// whole reason this is not just a split — folding its pages into `dentai` left
// پرامپتولوژیست with a folder row in the index that nothing could ever credit,
// so the dashboard's «پیشرفت هر پوشه» showed ٪۰ for a reader who had read all
// of it (reported 2026-09-18).
describe('folderOf', () => {
  it('returns the first path segment for a flat section', () => {
    expect(folderOf('notecast/episode-2')).toBe('notecast');
    expect(folderOf('dentai/dentai-30')).toBe('dentai');
    expect(folderOf('glossary/bonding-protocol')).toBe('glossary');
  });

  it('returns the nested section itself, not the folder it sits under', () => {
    expect(folderOf('dentai/promptologist/prompt1-1')).toBe('promptologist');
  });

  it('credits every published page of a nested section to that section', () => {
    const idx = getIndex();
    const ids = Object.keys(idx.byContent).filter((id) => id.startsWith('dentai/promptologist/'));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(folderOf(id)).toBe('promptologist');
  });

  it('every folder in the index is reachable — no key can be stranded at ٪۰', () => {
    const idx = getIndex();
    const reached = new Set(Object.keys(idx.byContent).map(folderOf));
    // episodes are indexed by the brain rather than per page; skip a folder with
    // no byContent rows of its own rather than assert on something absent.
    for (const f of getFolders()) {
      const has = Object.keys(idx.byContent).some((id) => id.startsWith((f.prefix || f.key) + '/'));
      if (has) expect(reached.has(f.key), `folder ${f.key} reachable`).toBe(true);
    }
  });

  it('falls back to the split for a content_id no folder claims', () => {
    expect(folderOf('nowhere/page-1')).toBe('nowhere');
  });
});

// plak1-6, 1405/07/02: the site published a sixth part, the API's copy of the
// index still said five, and a reader who had read all six saw «۵ از ۵» on the
// section page and ٪۸۳ on the dashboard. The API's copy can lag; the count it
// sends must not be capped by the lag, and the browser re-bases it on the
// published total it reads itself.
describe('folder progress when the API copy of the index lags a publish', () => {
  afterEach(() => resetRemoteIndex());

  function staleIndex() {
    const idx = JSON.parse(JSON.stringify(getIndex()));
    delete idx.byContent['plak-sefr/plak1-6'];
    for (const f of idx.folders) if (f.key === 'plak-sefr') f.total = 5;
    return idx;
  }
  const readAll = ['plak1-1', 'plak1-2', 'plak1-3', 'plak1-4', 'plak1-5', 'plak1-6'].map((s) => 'plak-sefr/' + s);

  it('counts the part the stale copy has never heard of, uncapped', () => {
    expect(applyRemoteIndex(staleIndex())).toBe(true);
    const f = folderProgress(readAll).find((x) => x.key === 'plak-sefr')!;
    expect(f.total).toBe(5);
    expect(f.read).toBe(5); // older clients keep the capped number
    expect(f.consumed).toBe(6);
  });

  it('never credits a landing page or an en mirror as a part read', () => {
    const f = folderProgress([...readAll.slice(0, 2), 'plak-sefr/index', 'plak-sefr/en/plak1-3'])
      .find((x) => x.key === 'plak-sefr')!;
    expect(f.consumed).toBe(2);
  });

  it('the browser re-bases on the published total: ۶ از ۶, not ۵ از ۵', () => {
    applyRemoteIndex(staleIndex());
    const api = folderProgress(readAll);
    const published = { folders: getFolders().map((f) => ({ ...f, total: f.key === 'plak-sefr' ? 6 : f.total })) };
    const f = freshFolders(api, published).find((x: any) => x.key === 'plak-sefr');
    expect([f.read, f.total]).toEqual([6, 6]);
  });

  it('an older API (no `consumed`) and a failed model load change nothing', () => {
    const old = [{ key: 'plak-sefr', total: 5, read: 5 }];
    expect(freshFolders(old, null)[0]).toMatchObject({ read: 5, total: 5 });
    expect(freshFolders(old, { folders: [{ key: 'plak-sefr', total: 6 }] })[0]).toMatchObject({ read: 5, total: 6 });
  });
});
