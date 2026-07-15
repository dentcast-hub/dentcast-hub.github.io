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

// Full concatenated text of a root, in document order. Range.toString() and
// TreeWalker(SHOW_TEXT) walk text nodes in the same order, so offsets computed
// one way map back the other way.
export function fullText(root) {
  const r = document.createRange();
  r.selectNodeContents(root);
  return r.toString();
}

function offsetOf(root, container, offset) {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(container, offset);
  return r.toString().length;
}

function locate(root, target) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let count = 0;
  let last = null;
  let n;
  while ((n = walker.nextNode())) {
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
export function anchorQuote({ exact, prefix = '', suffix = '' }, root) {
  if (!exact) return null;
  const text = fullText(root);

  const positions = [];
  let idx = text.indexOf(exact);
  while (idx !== -1) { positions.push(idx); idx = text.indexOf(exact, idx + 1); }
  if (!positions.length) return null;

  let best = positions[0];
  let bestScore = -1;
  for (const p of positions) {
    let score = 0;
    if (prefix) score += commonSuffixLen(text.slice(Math.max(0, p - prefix.length), p), prefix);
    if (suffix) score += commonPrefixLen(text.slice(p + exact.length, p + exact.length + suffix.length), suffix);
    if (score > bestScore) { bestScore = score; best = p; }
  }

  const startLoc = locate(root, best);
  const endLoc = locate(root, best + exact.length);
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
