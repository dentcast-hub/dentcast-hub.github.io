// Small DOM + text helpers, dependency-free.

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export function faNum(x) {
  return String(x).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * A reference into the site's shared icon sprite (assets/icons/icons.svg —
 * the single source of truth for every icon; see assets/icons/README.md).
 * `id` is a symbol id from that file, e.g. 'icon-tooth'. Real SVG-namespace
 * nodes (not the HTML el() helper above), because document.createElement
 * produces an HTMLUnknownElement for 'svg'/'use' and <use> never resolves.
 */
export function icon(id, { class: cls = 'dc-icon' } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '/assets/icons/icons.svg#' + id);
  svg.appendChild(use);
  return svg;
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Asia/Tehran calendar day ('YYYY-MM-DD') for the same day boundary the server
// uses, so the client can tell whether a streak is still "active" today.
export function tehranDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function previousDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - 86400000).toISOString().slice(0, 10);
}

// The flame shows TODAY's status: on if the user did a qualifying action today
// (Tehran), off otherwise (prototype feedback: two states, today-based). Never a
// gray flame for guests (that manufactures false loss) - guests see no flame.
export function streakIsActiveToday(lastActiveDay) {
  if (!lastActiveDay) return false;
  return lastActiveDay === tehranDay();
}

// Fired after a qualifying action (highlight created, card reviewed) so the
// header flame can light up live, without waiting for a page reload.
export const STREAK_ACTIVITY_EVENT = 'dcp:streak-activity';
export function signalStreakActivity() {
  try { document.dispatchEvent(new CustomEvent(STREAK_ACTIVITY_EVENT)); } catch (_) { /* ignore */ }
}

// A user's own note, one line per thought, rendered as a real bulleted list
// instead of lines just run together with no visual separation (founder
// feedback, 2026-07-30). A single-line note stays plain text — a list of one
// bullet is not a list.
export function renderNoteLines(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return document.createTextNode(text ?? '');
  const ul = document.createElement('ul');
  ul.className = 'dcp-note-list';
  for (const line of lines) {
    const li = document.createElement('li');
    li.textContent = line;
    ul.appendChild(li);
  }
  return ul;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
