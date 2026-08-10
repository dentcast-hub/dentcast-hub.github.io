// Shared vocabulary for every surface that shows a saved highlight: the
// دفترچه (/plus/highlights.html), a کالکشن board (/plus/collection.html) and
// anything that comes after. Before this module the two pages drew the same
// object in two different ways — one as a full card, one as a bare colour band
// with no note and no actions — so the same highlight looked like two different
// things depending on where you found it.
//
// Everything here is presentational + one inline editor. No page owns a copy.
import { el, renderNoteLines } from './util.js';
import { api } from './api.js';
import { LABELS, PALETTE } from './config.js';

export const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';

/** Search-only normalization: Arabic ی/ک, ZWNJ and diacritics fold together so
 *  «اندو‌شده» is found by typing «اندو شده». Never applied to stored text. */
export function foldFa(s) {
  return String(s || '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200B-\u200F\u064B-\u0652\u0640]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/** The article link that lands ON the highlight: plus.js reads ?dcphl=, enters
 *  study mode and scrolls to the mark, so you never arrive at an article that
 *  shows none of your own marks. */
export function highlightHref(url, highlightId) {
  if (!url) return '#';
  if (!highlightId) return url;
  return url + (url.includes('?') ? '&' : '?') + 'dcphl=' + encodeURIComponent(highlightId);
}

/** The user's own mark, exactly as the article draws it (colour + underline). */
export function hlMark(h) {
  return el('mark', {
    class: 'dcp-hl' + (h.underline ? ' dcp-underline' : ''),
    'data-color': h.color || '',
  }, h.exact || '');
}

export function noteBlock(note) {
  return note ? el('div', { class: 'dcp-hlib-note' }, renderNoteLines(note)) : null;
}

export function labelChip(label) {
  return label ? el('span', { class: 'dcp-card-label' }, labelFa(label)) : null;
}

// A collection pin's kind badge — only for the kinds that carry no other visual
// tell (a highlight already reads as itself via its coloured mark, a page via
// its type icon/colour; a text or reference pin has neither, so it needs one).
const SNIPPET_KIND_LABEL = { text: '✍️ متن خودم', reference: '🔗 رفرنس' };
export function kindChip(kind) {
  return el('span', { class: 'dcp-cl-pin-kind dcp-cl-pin-kind-' + kind }, SNIPPET_KIND_LABEL[kind] || kind);
}

/** One small pill action. `href` makes it a link, otherwise a button. */
export function actionBtn(text, { onClick = null, href = null, danger = false, title = null } = {}) {
  const cls = 'dcp-hlib-act' + (danger ? ' dcp-hlib-del' : '');
  if (href) return el('a', { class: cls, href, title }, text);
  const b = el('button', { class: cls, type: 'button', title }, text);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

/** Plain-text form of a highlight (text + note), for the copy actions. */
export function asText(h) {
  const note = (h.note || '').trim();
  return note ? h.exact + '\n— ' + note : h.exact;
}

export async function copyToClipboard(text, btn, okLabel = 'کپی شد ✓') {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = okLabel;
  } catch (_) {
    btn.textContent = 'کپی نشد';
  }
  setTimeout(() => { btn.textContent = original; }, 1600);
}

// --- toast ----------------------------------------------------------------
// One implementation for both pages (collections.js had its own; same markup
// and the same .dcp-cl-toast styling, so nothing moves visually).
export function toast(text, { icon = '✓' } = {}) {
  const t = el('div', { class: 'dcp-cl-toast' }, [
    el('span', { class: 'dcp-cl-toast-check' }, icon),
    el('span', {}, text),
  ]);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-shown'));
  setTimeout(() => { t.classList.remove('is-shown'); setTimeout(() => t.remove(), 300); }, 2400);
}

/** Shimmering placeholders while the first request is in flight — a spinner
 *  says "wait", a skeleton says "this is what is coming". */
export function skeleton(rows = 3) {
  return el('div', { class: 'dcp-skel-wrap', 'aria-hidden': 'true' },
    Array.from({ length: rows }, () => el('div', { class: 'dcp-skel-card' }, [
      el('div', { class: 'dcp-skel-line dcp-skel-w70' }),
      el('div', { class: 'dcp-skel-line' }),
      el('div', { class: 'dcp-skel-line dcp-skel-w40' }),
    ])));
}

/** An inline confirm strip (never a native confirm()). */
export function confirmStrip(question, onYes, { yesText = 'حذف' } = {}) {
  const yes = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, yesText);
  const no = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
  const strip = el('div', { class: 'dcp-recent-confirm' }, [question, yes, no]);
  no.onclick = () => strip.remove();
  yes.onclick = async () => {
    yes.disabled = true;
    try { await onYes(); } catch (_) { yes.disabled = false; }
  };
  return strip;
}

// --- inline editor --------------------------------------------------------
/**
 * Edit a highlight WHERE YOU FOUND IT: note, label and colour in one row, one
 * save. Reviewing your own notes is when you actually want to fix them —
 * before this, the only way to touch a note was to reopen the article and turn
 * the workbench on, which is the round trip this whole feature exists to end.
 *
 * onSaved(updatedHighlight) is called with the server's copy so the caller can
 * re-render its own card and keep its in-memory model in step.
 */
export function inlineEditor(h, { onSaved, onClose }) {
  const ta = el('textarea', {
    class: 'dcp-hlib-ta', rows: '3', placeholder: 'یادداشتت را اینجا بنویس…',
    'aria-label': 'یادداشت هایلایت',
  });
  ta.value = h.note || '';

  let label = h.label || null;
  const labelBtns = [{ key: null, fa: 'بدون برچسب' }, ...LABELS.map((l) => ({ key: l.key, fa: l.fa }))]
    .map((d) => {
      const b = el('button', {
        class: 'dcp-hlib-chip' + (d.key === label ? ' is-on' : ''), type: 'button',
      }, d.fa);
      b.addEventListener('click', () => {
        label = d.key;
        labelBtns.forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
      });
      return b;
    });

  let color = h.color || null;
  const colorBtns = PALETTE.map((p) => {
    const b = el('button', {
      class: 'dcp-hlib-sw' + (p.key === color ? ' is-on' : ''), type: 'button',
      style: 'background:' + p.css, title: p.fa || p.key, 'aria-label': p.fa || p.key,
    });
    b.addEventListener('click', () => {
      color = p.key;
      colorBtns.forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
    });
    return b;
  });

  const msg = el('span', { class: 'dcp-hlib-msg', role: 'status' });
  const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ذخیره');
  const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');

  const box = el('div', { class: 'dcp-hlib-editor' }, [
    ta,
    el('div', { class: 'dcp-hlib-erow' }, labelBtns),
    el('div', { class: 'dcp-hlib-erow' }, colorBtns),
    el('div', { class: 'dcp-hlib-erow dcp-hlib-esave' }, [save, cancel, msg]),
  ]);

  cancel.addEventListener('click', () => { box.remove(); if (onClose) onClose(); });
  save.addEventListener('click', async () => {
    save.disabled = true;
    msg.textContent = '';
    const patch = { note: ta.value.trim() || null, label, color };
    try {
      const { highlight } = await api.updateHighlight(h.id, patch);
      box.remove();
      onSaved(highlight);
      toast('ذخیره شد');
    } catch (_) {
      save.disabled = false;
      msg.textContent = 'ذخیره نشد؛ دوباره تلاش کن.';
    }
  });
  // Ctrl/⌘+Enter saves — the shortcut every note field on the web has.
  ta.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save.click();
    if (e.key === 'Escape') cancel.click();
  });
  setTimeout(() => ta.focus(), 0);
  return box;
}

/**
 * Edit a text snippet («متن خودم») WHERE YOU FOUND IT — title + body, one
 * save. Same shape as inlineEditor above, but PATCHes /snippets/:id: `s` is
 * `{ id, title, body }` (the snippet's own id, not the pin's).
 */
export function snippetInlineEditor(s, { onSaved, onClose }) {
  const titleInput = el('input', {
    type: 'text', class: 'dcp-input', maxlength: '200',
    placeholder: 'مثلاً: نکته‌ی بحث پایانی', 'aria-label': 'عنوان (اختیاری)',
  });
  titleInput.value = s.title || '';
  const ta = el('textarea', {
    class: 'dcp-hlib-ta', rows: '5', placeholder: 'بنویسید یا پیست کنید…', 'aria-label': 'متن',
  });
  ta.value = s.body || '';

  const msg = el('span', { class: 'dcp-hlib-msg', role: 'status' });
  const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ذخیره');
  const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');

  const box = el('div', { class: 'dcp-hlib-editor' }, [
    titleInput,
    ta,
    el('div', { class: 'dcp-hlib-erow dcp-hlib-esave' }, [save, cancel, msg]),
  ]);

  cancel.addEventListener('click', () => { box.remove(); if (onClose) onClose(); });
  save.addEventListener('click', async () => {
    const body = ta.value.trim();
    if (!body) { msg.textContent = 'متن نمی‌تواند خالی باشد.'; return; }
    save.disabled = true;
    msg.textContent = '';
    try {
      const { snippet } = await api.updateSnippet(s.id, { title: titleInput.value.trim() || null, body });
      box.remove();
      onSaved(snippet);
      toast('ذخیره شد');
    } catch (_) {
      save.disabled = false;
      msg.textContent = 'ذخیره نشد؛ دوباره تلاش کن.';
    }
  });
  ta.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save.click();
    if (e.key === 'Escape') cancel.click();
  });
  setTimeout(() => ta.focus(), 0);
  return box;
}
