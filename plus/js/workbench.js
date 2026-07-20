// Study mode controller. A mode of the article page, not a separate page. It
// inherits the site's typography (styles live in plus.css and reference the
// site's own CSS variables). Never auto-enters; the caller decides when.
import { el, faNum, debounce, signalStreakActivity } from './util.js';
import { api } from './api.js';
import { PALETTE, LABELS, SS_MODE } from './config.js';
import { serializeRange, anchorQuote, wrapRange, unwrapMarks, fullText, hashText } from './anchor.js';

export class Workbench {
  constructor({ contentId, proseRoot }) {
    this.contentId = contentId;
    this.root = proseRoot;
    this.active = false;
    this.tool = { kind: 'highlight', color: 'yellow' };
    // «مهم» is pre-selected by default; the user can toggle it off per highlight.
    this.label = 'important';
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
    this._buildNotes();
    // Bind selection BEFORE the network loads below. Otherwise the very first
    // text selection after entering study mode is dropped (handlers not bound
    // yet), and the highlight only lands once a later mouseup fires — which made
    // it feel like you had to click the yellow swatch after selecting. The
    // default tool (yellow highlight) + label («مهم») are set in the constructor,
    // so the first selection highlights immediately.
    this._bindSelection();
    await this._loadAndRender();
    // The article note (one per article, independent of highlights) is loaded up
    // front so the یادداشت button opens instantly with the saved text.
    try { const r = await api.getArticleNote(this.contentId); this.articleNote = (r && r.note) || null; }
    catch (e) { this.articleNote = null; }
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
    if (this._onResize) { window.removeEventListener('resize', this._onResize); this._onResize = null; }
    this._unbindViewport();
    document.body.style.removeProperty('--dcp-editor-dock');
  }

  // --- toolbar --------------------------------------------------------------
  _buildToolbar() {
    // Static instruction line (top of the toolbar); the text never changes.
    const hint = el('div', { class: 'dcp-wb-hint' }, 'بعد از انتخاب متن، رنگ هایلایت را مشخص کنید');

    const swatches = PALETTE.map((p) =>
      el('button', {
        class: 'dcp-swatch', type: 'button', title: p.fa, 'aria-label': 'رنگ ' + p.fa,
        dataset: { color: p.key }, style: '--sw:' + p.css,
        onclick: () => this._setTool({ kind: 'highlight', color: p.key }),
      }));

    const underlineBtn = el('button', { class: 'dcp-tool', type: 'button', title: 'خط ممتد', dataset: { tool: 'underline' }, onclick: () => this._setTool({ kind: 'underline' }) }, '─ خط ممتد');
    const clozeBtn = el('button', { class: 'dcp-tool', type: 'button', title: 'نقطه‌چین (برای مرور)', dataset: { tool: 'cloze' }, onclick: () => this._setTool({ kind: 'cloze' }) }, '⋯ نقطه‌چین');

    const labelChips = LABELS.map((l) =>
      el('button', {
        class: 'dcp-chip', type: 'button', dataset: { label: l.key },
        onclick: () => this._toggleLabel(l.key),
      }, l.fa));

    const notesToggle = el('button', { class: 'dcp-tool', type: 'button', title: 'یادداشت روی هایلایت انتخاب‌شده', onclick: () => this._noteButton() }, '📝 یادداشت');
    const exitBtn = el('button', { class: 'dcp-tool dcp-exit', type: 'button', onclick: () => this.exit() }, '✕ خروج');

    const group = (label, items) => el('span', { class: 'dcp-tool-group' }, [
      el('span', { class: 'dcp-tool-glabel' }, label),
      ...items,
    ]);

    const bar = el('div', { class: 'dcp-toolbar', role: 'toolbar', 'aria-label': 'ابزار میز کار' }, [
      hint,
      group('رنگ هایلایت', swatches),
      group('ابزار', [underlineBtn, clozeBtn]),
      group('برچسب', labelChips),
      el('span', { class: 'dcp-tool-group' }, [notesToggle]),
      exitBtn,
    ]);
    document.body.appendChild(bar);
    this.ui.toolbar = bar;
    this._refreshToolbar();
    // The editor docks just above this toolbar; its height changes as the toolbar
    // wraps to more rows on narrow screens, so keep the dock offset in sync.
    this._syncDock();
    this._onResize = () => this._syncDock();
    window.addEventListener('resize', this._onResize);
  }

  _setTool(tool) { this.tool = tool; this._refreshToolbar(); }
  _toggleLabel(key) { this.label = this.label === key ? null : key; this._refreshToolbar(); }

  _refreshToolbar() {
    const bar = this.ui.toolbar;
    if (!bar) return;
    // No active ring on colour swatches: a pre-selected circle read as "already
    // chosen" and made people think they need not pick a colour.
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
      signalStreakActivity(); // highlight_created counts for today's streak
      this._renderOne(highlight);
      this._currentHl = highlight.id; // becomes the current mark; the یادداشت button writes on it
      this._recountToc();
      this._renderNotes();
      // Applying highlight / underline / cloze just marks the text — it does NOT pop
      // the note editor open. The editor is opened only by the یادداشت button.
    } catch (e) {
      this._toast('ثبت هایلایت ناموفق بود. اتصال به سرور را بررسی کنید.');
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
    // Tapping a highlight only SELECTS it (makes it current); it never opens the
    // editor. The note editor is opened solely by the یادداشت button.
    for (const m of marks) m.addEventListener('click', (e) => { e.stopPropagation(); this._currentHl = h.id; });
    this.items.set(h.id, { data: h, marks });
  }

  // --- editor popover (note / label / color / delete) ----------------------
  _openEditor(h, anchorEl, { focusNote = false } = {}) {
    this._closeEditor();
    const noteInput = el('textarea', { class: 'dcp-note-input', rows: '3', placeholder: 'یادداشت خود را اینجا بنویسید...' });
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
      el('label', { class: 'dcp-editor-label' }, 'یادداشت'),
      noteInput,
      el('label', { class: 'dcp-editor-label' }, 'رنگ'),
      el('div', { class: 'dcp-editor-row' }, colorRow),
      el('label', { class: 'dcp-editor-label' }, 'برچسب'),
      el('div', { class: 'dcp-editor-row' }, labelRow),
      el('div', { class: 'dcp-editor-actions' }, [save, del]),
    ]);
    document.body.appendChild(pop);
    this.ui.editor = pop;
    this._placeEditor();
    // The note is the user's own space: focus the empty field so they can type at
    // once. On mobile the keyboard then opens BELOW the docked editor (see _syncDock).
    setTimeout(() => noteInput.focus(), 30);
    noteInput.addEventListener('focus', () => this._syncDock());
    noteInput.addEventListener('blur', () => setTimeout(() => this._syncDock(), 50));
    setTimeout(() => {
      const off = (e) => { if (!pop.contains(e.target) && e.target !== anchorEl) { this._closeEditor(); document.removeEventListener('mousedown', off); } };
      document.addEventListener('mousedown', off);
    }, 0);
  }

  // The editor's placement is owned by CSS (.dcp-editor: fixed, docked just above
  // the toolbar via the --dcp-editor-dock offset). JS only keeps that offset in
  // sync, so the panel rides above the toolbar — or, while the note field is
  // focused on mobile, above the on-screen keyboard (like a search bar over the
  // keyboard). Driving a CSS var (not inline coords) keeps the !important CSS the
  // single source of truth, immune to the article page's own layout.
  _placeEditor() {
    this._syncDock();
    if (window.visualViewport && !this._vv) {
      this._vv = () => this._syncDock();
      window.visualViewport.addEventListener('resize', this._vv);
      window.visualViewport.addEventListener('scroll', this._vv);
    }
  }

  _syncDock() {
    const toolbarH = (this.ui.toolbar && this.ui.toolbar.offsetHeight) || 96;
    let dock = toolbarH;
    const vv = window.visualViewport;
    if (vv) {
      // Keyboard height = how much the visual viewport is shorter than the layout.
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (kb > toolbarH) dock = kb; // keyboard up → ride above it instead of the toolbar
    }
    document.body.style.setProperty('--dcp-editor-dock', dock + 'px');
  }

  _unbindViewport() {
    if (this._vv && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this._vv);
      window.visualViewport.removeEventListener('scroll', this._vv);
    }
    this._vv = null;
  }

  _closeEditor() {
    if (this.ui.editor) { this.ui.editor.remove(); this.ui.editor = null; }
    this._unbindViewport();
    if (this.active) this._syncDock(); // reset the dock back to the toolbar height
  }

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
      if (this._currentHl === h.id) this._currentHl = null;
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
      el('div', { class: 'dcp-panel-head' }, 'سرفصل‌های مقاله'),
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
      // The note card shows only the user's own note (no highlight text) — the note
      // is the reader's space. Clicking still jumps to the highlight on the page.
      const item = el('div', { class: 'dcp-note-card', onclick: () => marks[0] && marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [
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

  // --- note button ----------------------------------------------------------
  // Writes a note ON the currently-selected highlight (the last one created or
  // clicked) so it shows up in the notes panel. If no highlight is selected, it
  // falls back to the whole-article note.
  _noteButton() {
    if (this.ui.editor) { this._closeEditor(); return; }
    const item = this._currentHl != null ? this.items.get(this._currentHl) : null;
    if (item && item.data && item.marks && item.marks.length) {
      this._openEditor(item.data, item.marks[0], { focusNote: true });
      return;
    }
    this._openArticleNote();
  }

  // The per-article note editor: a single empty/typeable field, docked above the
  // toolbar like the rest, loaded with and saved as the article's own note.
  _openArticleNote() {
    this._closeEditor();
    const ta = el('textarea', { class: 'dcp-note-input', rows: '4', placeholder: 'یادداشت این مقاله را اینجا بنویسید…' });
    ta.value = this.articleNote || '';
    const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', onclick: async () => {
      const val = ta.value.trim() || null;
      try {
        const r = await api.saveArticleNote(this.contentId, val);
        this.articleNote = (r && r.note) || null;
        signalStreakActivity();
        this._closeEditor();
      } catch (e) { this._toast('ذخیره‌ی یادداشت ناموفق بود.'); }
    } }, 'ذخیره');
    const close = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', onclick: () => this._closeEditor() }, 'بستن');
    const pop = el('div', { class: 'dcp-editor', role: 'dialog', 'aria-label': 'یادداشت مقاله' }, [
      el('label', { class: 'dcp-editor-label' }, 'یادداشت مقاله'),
      ta,
      el('div', { class: 'dcp-editor-actions' }, [save, close]),
    ]);
    document.body.appendChild(pop);
    this.ui.editor = pop;
    this._placeEditor();
    setTimeout(() => ta.focus(), 30);
    ta.addEventListener('focus', () => this._syncDock());
    ta.addEventListener('blur', () => setTimeout(() => this._syncDock(), 50));
    setTimeout(() => {
      const off = (e) => { if (!pop.contains(e.target)) { this._closeEditor(); document.removeEventListener('mousedown', off); } };
      document.addEventListener('mousedown', off);
    }, 0);
  }

  // --- mobile panel toggles -------------------------------------------------
  _toggleNotes() { this._closeEditor(); this.ui.notes && this.ui.notes.classList.toggle('is-open'); }
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
