// Study mode controller. A mode of the article page, not a separate page. It
// inherits the site's typography (styles live in plus.css and reference the
// site's own CSS variables). Never auto-enters; the caller decides when.
import { el, faNum, debounce } from './util.js';
import { api } from './api.js';
import { PALETTE, LABELS, SS_MODE } from './config.js';
import { serializeRange, anchorQuote, wrapRange, unwrapMarks, fullText, hashText } from './anchor.js';

export class Workbench {
  constructor({ contentId, proseRoot }) {
    this.contentId = contentId;
    this.root = proseRoot;
    this.active = false;
    this.tool = { kind: 'highlight', color: 'yellow' };
    this.label = null;
    this.items = new Map(); // id -> { data, marks }
    this.failed = []; // highlights whose anchor could not be found
    this.ui = {};
    this.loaded = false;
  }

  isActive() { return this.active; }

  async enter() {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('dcp-study');
    sessionStorage.setItem(SS_MODE + this.contentId, 'study');
    this._buildToolbar();
    this._buildToc();
    this._buildNotes();
    await this._loadAndRender();
    this._bindSelection();
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('dcp-study');
    sessionStorage.removeItem(SS_MODE + this.contentId);
    for (const { marks } of this.items.values()) unwrapMarks(marks);
    this.items.clear();
    this.failed = [];
    Object.values(this.ui).forEach((n) => n && n.remove && n.remove());
    this.ui = {};
    if (this._onSelect) document.removeEventListener('mouseup', this._onSelect);
    if (this._onSelectTouch) document.removeEventListener('touchend', this._onSelectTouch);
  }

  // --- toolbar --------------------------------------------------------------
  _buildToolbar() {
    const swatches = PALETTE.map((p) =>
      el('button', {
        class: 'dcp-swatch', type: 'button', title: p.fa, 'aria-label': 'رنگ ' + p.fa,
        dataset: { color: p.key }, style: '--sw:' + p.css,
        onclick: () => this._setTool({ kind: 'highlight', color: p.key }),
      }));

    const underlineBtn = el('button', { class: 'dcp-tool', type: 'button', title: 'زیرخط', dataset: { tool: 'underline' }, onclick: () => this._setTool({ kind: 'underline' }) }, 'زیرخط');
    const clozeBtn = el('button', { class: 'dcp-tool', type: 'button', title: 'جای‌خالی', dataset: { tool: 'cloze' }, onclick: () => this._setTool({ kind: 'cloze' }) }, 'جای‌خالی');

    const labelChips = LABELS.map((l) =>
      el('button', {
        class: 'dcp-chip', type: 'button', dataset: { label: l.key },
        onclick: () => this._toggleLabel(l.key),
      }, l.fa));

    const notesToggle = el('button', { class: 'dcp-tool', type: 'button', title: 'یادداشت‌ها', onclick: () => this._toggleNotes() }, 'یادداشت‌ها');
    const tocToggle = el('button', { class: 'dcp-tool dcp-only-mobile', type: 'button', title: 'فهرست', onclick: () => this._toggleToc() }, 'فهرست');
    const exitBtn = el('button', { class: 'dcp-tool dcp-exit', type: 'button', onclick: () => this.exit() }, 'خروج از میز کار');

    const bar = el('div', { class: 'dcp-toolbar', role: 'toolbar', 'aria-label': 'ابزار میز کار' }, [
      el('span', { class: 'dcp-tool-group' }, swatches),
      el('span', { class: 'dcp-tool-group' }, [underlineBtn, clozeBtn]),
      el('span', { class: 'dcp-tool-group' }, labelChips),
      el('span', { class: 'dcp-tool-group' }, [notesToggle, tocToggle]),
      exitBtn,
    ]);
    document.body.appendChild(bar);
    this.ui.toolbar = bar;
    this._refreshToolbar();
  }

  _setTool(tool) { this.tool = tool; this._refreshToolbar(); }
  _toggleLabel(key) { this.label = this.label === key ? null : key; this._refreshToolbar(); }

  _refreshToolbar() {
    const bar = this.ui.toolbar;
    if (!bar) return;
    bar.querySelectorAll('.dcp-swatch').forEach((s) => {
      s.classList.toggle('is-active', this.tool.kind === 'highlight' && this.tool.color === s.dataset.color);
    });
    bar.querySelectorAll('.dcp-tool[data-tool]').forEach((b) => {
      b.classList.toggle('is-active', this.tool.kind === b.dataset.tool);
    });
    bar.querySelectorAll('.dcp-chip').forEach((c) => {
      c.classList.toggle('is-active', this.label === c.dataset.label);
    });
  }

  // --- selection -> highlight ----------------------------------------------
  _bindSelection() {
    const handler = debounce(() => this._captureSelection(), 10);
    this._onSelect = handler;
    this._onSelectTouch = handler;
    document.addEventListener('mouseup', handler);
    document.addEventListener('touchend', handler);
  }

  _captureSelection() {
    if (!this.active) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // selection must be inside the prose root and non-trivial
    if (!this.root.contains(range.commonAncestorContainer)) return;
    const quote = serializeRange(range, this.root);
    if (!quote.exact.trim() || quote.exact.length < 2) return;
    sel.removeAllRanges();
    this._createHighlight(quote);
  }

  async _createHighlight(quote) {
    const payload = {
      content_id: this.contentId,
      exact: quote.exact,
      prefix: quote.prefix,
      suffix: quote.suffix,
      underline: this.tool.kind === 'underline',
      color: this.tool.kind === 'highlight' ? this.tool.color : null,
      cloze_markers: this.tool.kind === 'cloze' ? [[0, quote.exact.length]] : [],
      label: this.label,
      content_hash: hashText(fullText(this.root)),
    };
    try {
      const { highlight } = await api.createHighlight(payload);
      this._renderOne(highlight);
      this._recountToc();
      this._renderNotes();
    } catch (e) {
      this._toast('ثبت هایلایت ناموفق بود.');
    }
  }

  // --- load + render existing ----------------------------------------------
  async _loadAndRender() {
    let list = [];
    try {
      const res = await api.listHighlights(this.contentId);
      list = res.highlights || [];
    } catch (e) { /* offline or unauthorized: render nothing */ }
    this.failed = [];
    for (const h of list) this._renderOne(h);
    this._recountToc();
    this._renderNotes();
    this._renderFailed();
  }

  _renderOne(h) {
    const range = anchorQuote(h, this.root);
    if (!range) {
      this.failed.push(h);
      this.items.set(h.id, { data: h, marks: [] });
      this._renderFailed();
      return;
    }
    let cls = 'dcp-hl';
    if (h.underline) cls += ' dcp-underline';
    if (h.cloze_markers && h.cloze_markers.length) cls += ' dcp-cloze';
    const marks = wrapRange(range, {
      className: cls,
      dataset: { hlId: h.id, color: h.color || '' },
    });
    for (const m of marks) m.addEventListener('click', (e) => { e.stopPropagation(); this._openEditor(h, m); });
    this.items.set(h.id, { data: h, marks });
  }

  // --- editor popover (note / label / color / delete) ----------------------
  _openEditor(h, anchorEl) {
    this._closeEditor();
    const noteInput = el('textarea', { class: 'dcp-note-input', placeholder: 'یادداشت شما...' });
    noteInput.value = h.note || '';

    const colorRow = PALETTE.map((p) => el('button', {
      class: 'dcp-swatch' + (h.color === p.key ? ' is-active' : ''), type: 'button',
      style: '--sw:' + p.css, 'aria-label': p.fa,
      onclick: () => this._patch(h, { color: p.key }),
    }));
    const labelRow = LABELS.map((l) => el('button', {
      class: 'dcp-chip' + (h.label === l.key ? ' is-active' : ''), type: 'button',
      onclick: () => this._patch(h, { label: h.label === l.key ? null : l.key }),
    }, l.fa));

    const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', onclick: async () => {
      await this._patch(h, { note: noteInput.value.trim() || null });
      this._closeEditor();
    } }, 'ذخیره');
    const del = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', onclick: () => this._delete(h) }, 'حذف');

    const pop = el('div', { class: 'dcp-editor', role: 'dialog', 'aria-label': 'ویرایش هایلایت' }, [
      el('div', { class: 'dcp-editor-row' }, colorRow),
      el('div', { class: 'dcp-editor-row' }, labelRow),
      noteInput,
      el('div', { class: 'dcp-editor-actions' }, [save, del]),
    ]);
    document.body.appendChild(pop);
    this.ui.editor = pop;
    const r = anchorEl.getBoundingClientRect();
    pop.style.top = (window.scrollY + r.bottom + 6) + 'px';
    pop.style.right = Math.max(8, document.documentElement.clientWidth - (r.right)) + 'px';
    setTimeout(() => {
      const off = (e) => { if (!pop.contains(e.target) && e.target !== anchorEl) { this._closeEditor(); document.removeEventListener('mousedown', off); } };
      document.addEventListener('mousedown', off);
    }, 0);
  }

  _closeEditor() { if (this.ui.editor) { this.ui.editor.remove(); this.ui.editor = null; } }

  async _patch(h, patch) {
    try {
      const { highlight } = await api.updateHighlight(h.id, patch);
      // re-render this highlight in place
      const item = this.items.get(h.id);
      if (item) unwrapMarks(item.marks);
      this._renderOne(highlight);
      this._recountToc();
      this._renderNotes();
    } catch (e) { this._toast('به‌روزرسانی ناموفق بود.'); }
  }

  async _delete(h) {
    try {
      await api.deleteHighlight(h.id);
      const item = this.items.get(h.id);
      if (item) unwrapMarks(item.marks);
      this.items.delete(h.id);
      this.failed = this.failed.filter((f) => f.id !== h.id);
      this._closeEditor();
      this._recountToc();
      this._renderNotes();
      this._renderFailed();
    } catch (e) { this._toast('حذف ناموفق بود.'); }
  }

  // --- table of contents ----------------------------------------------------
  _headings() {
    let hs = Array.from(this.root.querySelectorAll('h2, h3'));
    if (hs.length < 2) hs = Array.from(this.root.querySelectorAll('h2, h3, h4'));
    return hs;
  }

  _buildToc() {
    const headings = this._headings();
    const list = el('nav', { class: 'dcp-toc', 'aria-label': 'فهرست مطالب' });
    headings.forEach((h, idx) => {
      if (!h.id) h.id = 'dcp-h-' + idx;
      const count = el('span', { class: 'dcp-toc-count', dataset: { for: h.id } }, '');
      const link = el('a', {
        class: 'dcp-toc-link dcp-toc-' + h.tagName.toLowerCase(), href: '#' + h.id,
        onclick: (e) => { e.preventDefault(); h.scrollIntoView({ behavior: 'smooth', block: 'start' }); this._closeMobilePanels(); },
      }, [document.createTextNode(h.textContent.trim()), count]);
      list.appendChild(el('div', { class: 'dcp-toc-item' }, [link]));
    });
    const panel = el('aside', { class: 'dcp-toc-panel' }, [
      el('div', { class: 'dcp-panel-head' }, 'فهرست'),
      list,
    ]);
    document.body.appendChild(panel);
    this.ui.toc = panel;
  }

  _recountToc() {
    if (!this.ui.toc) return;
    const headings = this._headings();
    const counts = new Map(headings.map((h) => [h.id, 0]));
    for (const { marks } of this.items.values()) {
      if (!marks.length) continue;
      const heading = this._headingFor(marks[0]);
      if (heading && counts.has(heading.id)) counts.set(heading.id, counts.get(heading.id) + 1);
    }
    this.ui.toc.querySelectorAll('.dcp-toc-count').forEach((c) => {
      const n = counts.get(c.dataset.for) || 0;
      c.textContent = n ? faNum(n) : '';
      c.classList.toggle('is-empty', n === 0);
    });
  }

  _headingFor(node) {
    const headings = this._headings();
    let best = null;
    for (const h of headings) {
      if (h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) best = h;
      else break;
    }
    return best;
  }

  // --- notes panel ----------------------------------------------------------
  _buildNotes() {
    const panel = el('aside', { class: 'dcp-notes-panel', 'aria-label': 'یادداشت‌ها' }, [
      el('div', { class: 'dcp-panel-head' }, 'یادداشت‌ها'),
      el('div', { class: 'dcp-notes-list' }),
    ]);
    document.body.appendChild(panel);
    this.ui.notes = panel;
    this._renderNotes();
  }

  _renderNotes() {
    if (!this.ui.notes) return;
    const listEl = this.ui.notes.querySelector('.dcp-notes-list');
    listEl.innerHTML = '';
    const withNotes = Array.from(this.items.values()).filter((it) => it.data.note);
    if (!withNotes.length) {
      listEl.appendChild(el('div', { class: 'dcp-notes-empty' }, 'هنوز یادداشتی ندارید.'));
      return;
    }
    for (const { data, marks } of withNotes) {
      const item = el('div', { class: 'dcp-note-card', onclick: () => marks[0] && marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [
        el('div', { class: 'dcp-note-quote' }, data.exact.slice(0, 80)),
        el('div', { class: 'dcp-note-text' }, data.note),
      ]);
      listEl.appendChild(item);
    }
  }

  // --- failed anchors (sidebar fallback) ------------------------------------
  _renderFailed() {
    if (this.ui.failed) { this.ui.failed.remove(); this.ui.failed = null; }
    if (!this.failed.length) return;
    const list = el('div', { class: 'dcp-failed-list' },
      this.failed.map((h) => el('div', { class: 'dcp-failed-item' }, [
        el('div', { class: 'dcp-failed-quote' }, '«' + h.exact.slice(0, 90) + '»'),
        h.note ? el('div', { class: 'dcp-note-text' }, h.note) : null,
      ])));
    const panel = el('aside', { class: 'dcp-failed-panel', 'aria-label': 'هایلایت‌های بدون جایگاه' }, [
      el('div', { class: 'dcp-panel-head' }, 'هایلایت‌هایی که جای‌گذاری نشدند'),
      el('p', { class: 'dcp-failed-note' }, 'متن این هایلایت‌ها در نسخه فعلی صفحه پیدا نشد، اما داده شما حفظ شده است.'),
      list,
    ]);
    document.body.appendChild(panel);
    this.ui.failed = panel;
  }

  // --- mobile panel toggles -------------------------------------------------
  _toggleNotes() { this.ui.notes && this.ui.notes.classList.toggle('is-open'); }
  _toggleToc() { this.ui.toc && this.ui.toc.classList.toggle('is-open'); }
  _closeMobilePanels() {
    this.ui.toc && this.ui.toc.classList.remove('is-open');
    this.ui.notes && this.ui.notes.classList.remove('is-open');
  }

  _toast(text) {
    const t = el('div', { class: 'dcp-toast' }, text);
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('is-in'), 10);
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 300); }, 2600);
  }
}
