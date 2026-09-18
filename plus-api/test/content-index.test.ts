import { describe, it, expect } from 'vitest';
import { folderOf, getFolders, getIndex } from '../src/content-index.js';

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
