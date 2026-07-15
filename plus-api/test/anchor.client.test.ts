// @vitest-environment jsdom
//
// Client-side anchoring round-trip. Imports the real browser module the site
// ships (../../plus/js/anchor.js) and exercises serialize -> re-anchor -> wrap
// in a DOM, including the prefix/suffix disambiguation for repeated text.
import { describe, it, expect, beforeEach } from 'vitest';
import { serializeRange, anchorQuote, wrapRange, fullText } from '../../plus/js/anchor.js';

function setProse(html: string): HTMLElement {
  document.body.innerHTML = `<main class="article-content-wrap"><div class="text-box">${html}</div></main>`;
  return document.querySelector('.text-box') as HTMLElement;
}

// Build a Range by finding the Nth occurrence of `needle` in the root text.
function rangeForOccurrence(root: HTMLElement, needle: string, occurrence = 0): Range {
  const text = fullText(root);
  let idx = -1;
  for (let i = 0; i <= occurrence; i += 1) idx = text.indexOf(needle, idx + 1);
  // locate node/offset for idx and idx+len via a walker
  function locate(target: number) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let count = 0;
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const len = (n as Text).data.length;
      if (target <= count + len) return { node: n, offset: target - count };
      count += len;
    }
    return { node: root, offset: 0 };
  }
  const s = locate(idx);
  const e = locate(idx + needle.length);
  const r = document.createRange();
  r.setStart(s.node, s.offset);
  r.setEnd(e.node, e.offset);
  return r;
}

describe('client anchoring round-trip', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('serializes a selection and re-anchors it to the same text', () => {
    const root = setProse('<p>سمان رزینی به عاج پیوند می‌خورد و دوام دارد.</p>');
    const range = rangeForOccurrence(root, 'پیوند می‌خورد');
    const quote = serializeRange(range, root);
    expect(quote.exact).toBe('پیوند می‌خورد');

    const re = anchorQuote(quote, root);
    expect(re).not.toBeNull();
    expect(re!.toString()).toBe('پیوند می‌خورد');
  });

  it('uses prefix/suffix to disambiguate repeated text', () => {
    const root = setProse(
      '<p>باند به عاج ضعیف است.</p><p>در مقابل، باند به مینا قوی است.</p>',
    );
    // "باند به" appears twice; select the second one (before "مینا")
    const range = rangeForOccurrence(root, 'باند به', 1);
    const quote = serializeRange(range, root);
    expect(quote.suffix.startsWith(' مینا')).toBe(true);

    const re = anchorQuote(quote, root);
    expect(re).not.toBeNull();
    // the re-anchored range should be followed by مینا, not عاج
    const after = fullText(root).slice(
      fullText(root).indexOf(re!.toString()) === -1 ? 0 : 0,
    );
    expect(re!.toString()).toBe('باند به');
    // confirm it picked the occurrence whose suffix is مینا
    const startOffset = (() => {
      const t = fullText(root);
      // find occurrence matching the suffix
      let idx = t.indexOf('باند به');
      idx = t.indexOf('باند به', idx + 1);
      return idx;
    })();
    const t = fullText(root);
    expect(t.slice(startOffset + 'باند به'.length).trimStart().startsWith('مینا')).toBe(true);
  });

  it('wraps a range spanning multiple elements into <mark>s', () => {
    const root = setProse('<p>بخش اول <b>پررنگ</b> و ادامه متن.</p>');
    const range = rangeForOccurrence(root, 'اول پررنگ و');
    const marks = wrapRange(range, { className: 'dcp-hl', dataset: { hlId: 'x', color: 'yellow' } });
    expect(marks.length).toBeGreaterThanOrEqual(2); // spans the <b> boundary
    const rendered = root.querySelectorAll('mark.dcp-hl');
    expect(rendered.length).toBe(marks.length);
    // combined mark text equals the original selection
    const combined = Array.from(rendered).map((m) => m.textContent).join('');
    expect(combined).toBe('اول پررنگ و');
  });

  it('returns null when the text no longer exists (fallback path)', () => {
    const root = setProse('<p>متن کاملا متفاوت.</p>');
    const re = anchorQuote({ exact: 'چیزی که نیست', prefix: '', suffix: '' }, root);
    expect(re).toBeNull();
  });
});
