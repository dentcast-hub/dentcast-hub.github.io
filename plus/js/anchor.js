// TextQuoteSelector anchoring: exact + prefix + suffix, with re-anchoring on
// load and a robust multi-node wrap. On failure callers show the highlight in a
// sidebar fallback list instead of silently dropping it (spec 2.2).

// Prefix/suffix are captured out to the surrounding SENTENCE boundaries (capped),
// not a fixed window. This means even a half-sentence or single-word highlight
// records enough context that its flashcard shows the whole meaningful sentence,
// while the colored mark stays on exactly what the user selected. Longer context
// also strengthens re-anchoring disambiguation.
const CONTEXT_MAX = 400; // hard cap so a delimiter-less block cannot store a novel
const SENTENCE_DELIM = /[.!?؟۔\n]/;

// The presentation layer (`data-dc-presentation`: an added section heading, the
// number on an author's heading, a sub-label, a chip, a callout-box label) is
// not page text: a quote is taken and re-found in the text WITHOUT it, so adding
// or removing that layer never moves a reader's highlight, and a mark is never
// drawn on it.
const LAYER = '[data-dc-presentation]';
function inLayer(node) {
  const el = node.parentElement;
  return !!(el && el.closest && el.closest(LAYER));
}
function textNodes(root, raw) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out = [];
  let n;
  while ((n = walker.nextNode())) if (raw || !inLayer(n)) out.push(n);
  return out;
}

// Full concatenated text of a root, in document order, without the
// presentation layer. `raw` gives the text WITH it (what Range.toString() saw
// before the layer was skipped): only the re-anchoring fallback below reads it.
export function fullText(root, raw = false) {
  let s = '';
  for (const n of textNodes(root, raw)) s += n.data;
  return s;
}

// Offset of a DOM point in fullText(root): the text of every counted node that
// ends before the point, plus the part of the point's own node before it.
function offsetOf(root, container, offset) {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(container, offset);
  let count = 0;
  for (const n of textNodes(root, false)) {
    if (n === container) { count += Math.min(offset, n.data.length); break; }
    if (r.comparePoint(n, n.data.length) > 0) break; // this node ends after the point
    count += n.data.length;
  }
  return count;
}

function locate(root, target, raw = false) {
  let count = 0;
  let last = null;
  for (const n of textNodes(root, raw)) {
    last = n;
    const len = n.data.length;
    if (target <= count + len) return { node: n, offset: target - count };
    count += len;
  }
  return last ? { node: last, offset: last.data.length } : null;
}

// Turn a live selection Range into a storable quote selector whose prefix/suffix
// reach the surrounding sentence boundaries (capped at CONTEXT_MAX).
export function serializeRange(range, root) {
  const text = fullText(root);
  const start = offsetOf(root, range.startContainer, range.startOffset);
  const end = offsetOf(root, range.endContainer, range.endOffset);

  // prefix: walk back to the start of the sentence (just after the previous
  // delimiter), but no further than the cap.
  let ps = Math.max(0, start - CONTEXT_MAX);
  for (let i = start - 1; i >= ps; i -= 1) {
    if (SENTENCE_DELIM.test(text[i])) { ps = i + 1; break; }
  }
  // suffix: walk forward to the end of the sentence (including its delimiter).
  let se = Math.min(text.length, end + CONTEXT_MAX);
  for (let i = end; i < se; i += 1) {
    if (SENTENCE_DELIM.test(text[i])) { se = i + 1; break; }
  }

  return {
    exact: text.slice(start, end),
    prefix: text.slice(ps, start),
    suffix: text.slice(end, se),
  };
}

function commonSuffixLen(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i += 1;
  return i;
}
function commonPrefixLen(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
}

// Re-anchor a stored quote to a live Range in root, or null if not found.
// Two passes: the text without the presentation layer (every quote taken since
// the layer is skipped, and every quote taken before a page got its layer),
// then the text with it — a quote saved on a page that already carried the
// layer, while the layer was still read as text, holds layer words in `exact`.
export function anchorQuote(quote, root) {
  if (!quote || !quote.exact) return null;
  return anchorIn(quote, root, false) || anchorIn(quote, root, true);
}

// Whitespace runs folded to one space, with the raw index of every folded
// character (and one past the end). The layer leaves whitespace behind where it
// stands (the newline around an added heading, the space beside a chip), so a
// quote is compared with the page text under this fold, never raw.
function fold(text) {
  let s = '';
  const map = [];
  let inSpace = false;
  for (let i = 0; i < text.length; i += 1) {
    if (/\s/.test(text[i])) {
      if (!inSpace) { s += ' '; map.push(i); inSpace = true; }
    } else { s += text[i]; map.push(i); inSpace = false; }
  }
  map.push(text.length);
  return { s, map };
}

function anchorIn({ exact, prefix = '', suffix = '' }, root, raw) {
  const page = fold(fullText(root, raw));
  const text = page.s;
  const want = fold(exact).s;
  const pre = fold(prefix).s;
  const suf = fold(suffix).s;

  const positions = [];
  let idx = text.indexOf(want);
  while (idx !== -1) { positions.push(idx); idx = text.indexOf(want, idx + 1); }
  if (!positions.length) return null;

  let best = positions[0];
  let bestScore = -1;
  for (const p of positions) {
    let score = 0;
    if (pre) score += commonSuffixLen(text.slice(Math.max(0, p - pre.length), p), pre);
    if (suf) score += commonPrefixLen(text.slice(p + want.length, p + want.length + suf.length), suf);
    if (score > bestScore) { bestScore = score; best = p; }
  }

  const startLoc = locate(root, page.map[best], raw);
  const endLoc = locate(root, page.map[best + want.length - 1] + 1, raw);
  if (!startLoc || !endLoc) return null;
  const range = document.createRange();
  try {
    range.setStart(startLoc.node, startLoc.offset);
    range.setEnd(endLoc.node, endLoc.offset);
  } catch (_) {
    return null;
  }
  return range;
}

// Text-node segments a range covers, precomputed before any DOM mutation.
function segmentsInRange(range) {
  const res = [];
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) {
    return [{ node: root, start: range.startOffset, end: range.endOffset }];
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (!range.intersectsNode(n)) continue;
    // never draw on the presentation layer, unless the range starts or ends in
    // it (a quote from before the layer was skipped: the fallback pass above)
    if (inLayer(n) && n !== range.startContainer && n !== range.endContainer) continue;
    let start = 0;
    let end = n.data.length;
    if (n === range.startContainer) start = range.startOffset;
    if (n === range.endContainer) end = range.endOffset;
    if (end > start) res.push({ node: n, start, end });
  }
  return res;
}

// Wrap a range's text in <mark> elements (one per text node it spans). Returns
// the created elements so a caller can remove or restyle them. Each element
// carries the same data-hl-id so the group behaves as one highlight.
export function wrapRange(range, { className = 'dcp-hl', dataset = {} } = {}) {
  const segments = segmentsInRange(range);
  const marks = [];
  for (const seg of segments) {
    const r = document.createRange();
    r.setStart(seg.node, seg.start);
    r.setEnd(seg.node, seg.end);
    const mark = document.createElement('mark');
    mark.className = className;
    Object.assign(mark.dataset, dataset);
    try {
      r.surroundContents(mark);
      marks.push(mark);
    } catch (_) {
      // surroundContents throws if the range partially selects a non-text node;
      // our per-text-node segments avoid that, but stay safe.
    }
  }
  return marks;
}

export function unwrapMarks(marks) {
  for (const m of marks) {
    const parent = m.parentNode;
    if (!parent) continue;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  }
}

// Cheap stable hash of the prose text, stored as content_hash for provenance.
export function hashText(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
