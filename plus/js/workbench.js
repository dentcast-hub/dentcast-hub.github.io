// Study mode controller. A mode of the article page, not a separate page. It
// inherits the site's typography (styles live in plus.css and reference the
// site's own CSS variables). Never auto-enters; the caller decides when.
import { el, faNum, debounce, signalStreakActivity, renderNoteLines } from './util.js?v=134';
import { api } from './api.js?v=134';
import { PALETTE, LABELS, SS_MODE } from './config.js?v=134';
import { serializeRange, anchorQuote, wrapRange, unwrapMarks, fullText, hashText } from './anchor.js?v=134';
import { openCollectionPicker } from './collections.js?v=134';

/**
 * The workbench's history — undo/redo over SERVER writes.
 *
 * Every act in میز کار is a request the moment it happens (POST / PATCH /
 * DELETE), so this is not a DOM stack: each entry carries the two inverse
 * calls, `undo` and `redo`, and the entry moves from `done` to `undone`
 * only AFTER the call it ran has resolved. A refused call leaves the pointer
 * where it was — otherwise the stack would drift from the server and every
 * later undo would run against a state the server never had. `busy` makes a
 * double tap on ↶ wait for the first to settle rather than race it.
 *
 * Any new act empties `undone`: history does not branch, and the mockup
 * that led here (.dentcast/highlight-undo-redo-mockup.html, §1) explains
 * that rule to the reader before anything else.
 *
 * Per article, per session: it is cleared on exit() and never persisted —
 * a stack in sessionStorage would hold ids the server may have moved on
 * from, and an id-shaped promise that fails on the first press is worse
 * than an empty stack.
 */
export class History {
  constructor() { this.done = []; this.undone = []; this.busy = false; }
  canUndo() { return this.done.length > 0 && !this.busy; }
  canRedo() { return this.undone.length > 0 && !this.busy; }
  push(entry) { this.done.push(entry); this.undone.length = 0; }
  clear() { this.done.length = 0; this.undone.length = 0; }
  async undo() {
    if (!this.canUndo()) return null;
    const entry = this.done[this.done.length - 1];
    this.busy = true;
    try { await entry.undo(); } finally { this.busy = false; }
    this.done.pop(); this.undone.push(entry);
    return entry;
  }
  async redo() {
    if (!this.canRedo()) return null;
    const entry = this.undone[this.undone.length - 1];
    this.busy = true;
    try { await entry.redo(); } finally { this.busy = false; }
    this.undone.pop(); this.done.push(entry);
    return entry;
  }
}

// The two glyphs everybody recognises (the Material «undo»/«redo» shapes): a
// full arrowhead on a short curl. The first version was a hand-drawn half
// circle with a three-unit head, which at 16px read as a hook. They are two
// separate drawings, never one mirrored from the other, and they are NOT
// mirrored for RTL either — see .dcp-hist in plus.css.
const UNDO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>';
const REDO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>';

export class Workbench {
  // onChange fires on EVERY enter/exit, including the toolbar's own ✕ خروج. The
  // میز کار button above the article lives outside this class (plus.js), so
  // without this callback exiting from the toolbar left that button still
  // reading «خروج از میز کار» / aria-pressed="true" — the mode was off but the
  // button said it was on.
  constructor({ contentId, proseRoot, onChange = null }) {
    this.contentId = contentId;
    this.root = proseRoot;
    this.onChange = onChange;
    this.active = false;
    // Colour is the only persistent choice (one is always active, yellow by
    // default). Tools are momentary actions, not modes: you select text, then
    // press a tool, and it applies THAT mark type in the active colour to the
    // held selection. Nothing about the tools is remembered/highlighted.
    this.color = 'yellow';
    this._pendingQuote = null;
    // «مهم» is pre-selected by default; the user can toggle it off per highlight.
    this.label = 'important';
    this.items = new Map(); // id -> { data, marks }
    this.failed = []; // highlights whose anchor could not be found
    this.ui = {};
    this.loaded = false;
    this.history = new History();
    // The selected highlight (`_currentHl`) is what یادداشت / کالکشن / حذف act
    // on, and it is set two ways: a mark just CREATED becomes current (so
    // «highlight, then press یادداشت» keeps working), or a mark is TAPPED.
    // `_currentBy` remembers which, because the two mean different things to
    // the colour and label controls: after a tap they EDIT the selected mark
    // (a change the stack can undo); after a create they keep their old job
    // of setting the default for the NEXT mark — otherwise «highlight A, then
    // press green meaning the next one» would silently repaint A.
    this._currentBy = null;
  }

  isActive() { return this.active; }

  _notify() { if (this.onChange) { try { this.onChange(this.active); } catch (_) { /* never break the mode on a UI hook */ } } }

  async enter() {
    if (this.active) return;
    this.active = true;
    this._notify();
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
    this._notify();
    document.body.classList.remove('dcp-study');
    sessionStorage.removeItem(SS_MODE + this.contentId);
    for (const { marks } of this.items.values()) unwrapMarks(marks);
    this.items.clear();
    this.failed = [];
    Object.values(this.ui).forEach((n) => n && n.remove && n.remove());
    this.ui = {};
    if (this._onSelect) document.removeEventListener('mouseup', this._onSelect);
    if (this._onSelectTouch) document.removeEventListener('touchend', this._onSelectTouch);
    if (this._onKey) { document.removeEventListener('keydown', this._onKey); this._onKey = null; }
    if (this._onRootClick) { this.root.removeEventListener('click', this._onRootClick); this._onRootClick = null; }
    if (this._onResize) { window.removeEventListener('resize', this._onResize); this._onResize = null; }
    this._unbindViewport();
    document.body.style.removeProperty('--dcp-editor-dock');
    this.history.clear();
    this._currentHl = null;
    this._currentBy = null;
  }

  // --- toolbar --------------------------------------------------------------
  _buildToolbar() {
    // Top row: ↶ ↷ at the start, the instruction line centred, an empty cell
    // at the end to keep it centred. The line's text follows the selection
    // state (see _refreshToolbar) so the reader is told what the selected-
    // highlight buttons will act on.
    const hint = el('div', { class: 'dcp-wb-hint', 'aria-live': 'polite' }, 'بعد از انتخاب متن، ابزار را مشخص کنید');
    const undoBtn = el('button', { class: 'dcp-ubtn dcp-ubtn-undo', type: 'button', title: 'بازگردانی (Ctrl+Z)', 'aria-label': 'بازگردانی', onclick: () => this.undo() });
    undoBtn.innerHTML = UNDO_SVG;
    const redoBtn = el('button', { class: 'dcp-ubtn dcp-ubtn-redo', type: 'button', title: 'ازنو (Ctrl+Shift+Z)', 'aria-label': 'ازنو', onclick: () => this.redo() });
    redoBtn.innerHTML = REDO_SVG;
    const undoCount = el('span', { class: 'dcp-ubtn-count' }, '');
    const redoCount = el('span', { class: 'dcp-ubtn-count' }, '');
    undoBtn.appendChild(undoCount); redoBtn.appendChild(redoCount);
    const top = el('div', { class: 'dcp-wb-top' }, [
      el('span', { class: 'dcp-hist' }, [undoBtn, redoBtn]),
      hint,
      el('span'),
    ]);

    // Fire the action on pointerdown (not click) with preventDefault, so ONE tap
    // applies even while text is selected: mobile otherwise spends the first tap
    // dismissing the selection (hence the old "tap twice"). Capturing here grabs
    // the still-live selection right before the browser can drop it.
    const armApply = (btn, run) => {
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); this._captureSelection(); run(); });
      return btn;
    };

    const swatches = PALETTE.map((p) => armApply(
      el('button', {
        class: 'dcp-swatch', type: 'button', title: p.fa, 'aria-label': 'رنگ ' + p.fa,
        dataset: { color: p.key }, style: '--sw:' + p.css,
      }), () => this._setColor(p.key)));

    // Tools apply the CURRENT colour: highlight (fill), underline, cloze.
    const highlightBtn = armApply(el('button', { class: 'dcp-tool', type: 'button', title: 'هایلایت' }, '🖍 هایلایت'), () => this._apply('highlight'));
    const underlineBtn = armApply(el('button', { class: 'dcp-tool', type: 'button', title: 'خط ممتد' }, '─ خط ممتد'), () => this._apply('underline'));
    const clozeBtn = armApply(el('button', { class: 'dcp-tool', type: 'button', title: 'نقطه‌چین (برای مرور)' }, '⋯ نقطه‌چین'), () => this._apply('cloze'));

    const labelChips = LABELS.map((l) =>
      el('button', {
        class: 'dcp-chip', type: 'button', dataset: { label: l.key },
        onclick: () => this._toggleLabel(l.key),
      }, l.fa));

    // کالکشن and حذف act on the SELECTED highlight and are disabled until one
    // is selected — the disabled state is what says «pick one first», which is
    // why the old «افزودنِ هایلایت به کالکشن» (a whole toolbar row on a phone)
    // can be just «کالکشن» now.
    //
    // یادداشت is NOT one of them, and that is the whole point of it: with a
    // highlight selected it writes that highlight's note, with none it writes
    // the note for the WHOLE article (_noteButton's two branches). Disabling it
    // alongside the other two made that second branch unreachable and left the
    // article note with no door at all on any page — the only way in there has
    // ever been this button.
    const notesToggle = el('button', { class: 'dcp-tool', type: 'button', onclick: () => this._noteButton() }, '📝 یادداشت');
    const collectionBtn = el('button', { class: 'dcp-tool', type: 'button', title: 'افزودنِ هایلایتِ انتخاب‌شده به کالکشن', onclick: () => this._collectionButton() }, '🗂 کالکشن');
    const collectionCap = el('p', { class: 'dcp-wb-cap' }, 'هایلایتِ انتخاب‌شده (آخرین موردی که ساختی یا رویش کلیک کردی) به یکی از کالکشن‌های خودت اضافه می‌شود.');
    collectionCap.hidden = true;
    const collectionInfo = el('button', {
      class: 'dcp-wb-info', type: 'button', 'aria-label': 'کالکشن یعنی چی؟', title: 'کالکشن یعنی چی؟',
      onclick: () => { collectionCap.hidden = !collectionCap.hidden; this._syncDock(); },
    }, '؟');
    // No confirm dialog on purpose: the دفترچه confirms because it has no undo;
    // here ↶ (and the toast's own «بازگردانی») IS the confirmation, and a
    // better one, because it comes after the act instead of in front of it.
    const deleteBtn = el('button', { class: 'dcp-tool dcp-tool-danger', type: 'button', title: 'حذف هایلایت انتخاب‌شده', onclick: () => this._deleteButton() }, '🗑 حذف');
    const exitBtn = el('button', { class: 'dcp-tool dcp-exit', type: 'button', onclick: () => this.exit() }, '✕ خروج');

    const group = (label, items) => el('span', { class: 'dcp-tool-group' }, [
      el('span', { class: 'dcp-tool-glabel' }, label),
      ...items,
    ]);

    const bar = el('div', { class: 'dcp-toolbar', role: 'toolbar', 'aria-label': 'ابزار میز کار' }, [
      top,
      group('رنگ', swatches),
      group('ابزار', [highlightBtn, underlineBtn, clozeBtn]),
      group('برچسب', labelChips),
      el('span', { class: 'dcp-tool-group' }, [notesToggle, collectionBtn, collectionInfo, deleteBtn]),
      exitBtn,
      collectionCap,
    ]);
    document.body.appendChild(bar);
    this.ui.toolbar = bar;
    this.ui.hint = hint;
    this.ui.undoBtn = undoBtn; this.ui.redoBtn = redoBtn;
    this.ui.undoCount = undoCount; this.ui.redoCount = redoCount;
    this.ui.noteBtn = notesToggle;
    this.ui.selectedBtns = [collectionBtn, deleteBtn];
    this._refreshToolbar();
    this._bindKeys();
    // The editor docks just above this toolbar; its height changes as the toolbar
    // wraps to more rows on narrow screens, so keep the dock offset in sync.
    this._syncDock();
    this._onResize = () => this._syncDock();
    window.addEventListener('resize', this._onResize);
  }

  // Set the active colour (persistent). Pressing a colour also applies a
  // highlight in it to the held selection — "select, then press a colour".
  // With a TAPPED highlight selected and no text held, it recolours that
  // highlight instead (see `_currentBy` in the constructor for why a tap and
  // a create differ here).
  _setColor(color) {
    const target = this._editTarget();
    if (target && !this._pendingQuote) {
      if ((target.color || 'yellow') !== color) this._patch(target, { color }, { record: true });
      this.color = color;
      this._refreshToolbar();
      return;
    }
    this.color = color;
    this._refreshToolbar();
    this._apply('highlight');
  }

  // The highlight the colour/label controls edit: the selected one, and only
  // when it was selected by a tap.
  _editTarget() {
    if (this._currentBy !== 'tap' || this._currentHl == null) return null;
    const item = this.items.get(this._currentHl);
    return item ? item.data : null;
  }

  // Select a highlight (or clear the selection with null). Draws the ring on
  // its marks and syncs the toolbar's colour/label to it after a tap, so the
  // toolbar describes the mark the reader is looking at.
  _setCurrent(id, by = null) {
    this._currentHl = id;
    this._currentBy = id == null ? null : by;
    for (const [hid, { marks }] of this.items) {
      for (const m of marks) m.classList.toggle('is-current', hid === id);
    }
    if (id != null && by === 'tap') {
      const item = this.items.get(id);
      if (item && item.data) { this.color = item.data.color || this.color; this.label = item.data.label || null; }
    }
    this._refreshToolbar();
  }

  // Apply a tool (highlight / underline / cloze) to the held selection in the
  // active colour, then clear it. One-shot: tools are actions, not modes.
  _apply(kind) {
    if (!this._pendingQuote) return;
    const quote = this._pendingQuote;
    this._pendingQuote = null;
    const sel = window.getSelection(); if (sel) sel.removeAllRanges();
    this._createHighlight(quote, kind);
  }

  _toggleLabel(key) {
    const next = this.label === key ? null : key;
    const target = this._editTarget();
    if (target) this._patch(target, { label: next }, { record: true });
    this.label = next;
    this._refreshToolbar();
  }

  _refreshToolbar() {
    const bar = this.ui.toolbar;
    if (!bar) return;
    // Only the active COLOUR is shown (yellow by default). Tools get no ring —
    // they are momentary actions, not a remembered mode.
    bar.querySelectorAll('.dcp-swatch').forEach((s) => {
      s.classList.toggle('is-active', this.color === s.dataset.color);
    });
    bar.querySelectorAll('.dcp-chip').forEach((c) => {
      c.classList.toggle('is-active', this.label === c.dataset.label);
    });
    const h = this.history;
    if (this.ui.undoBtn) {
      this.ui.undoBtn.disabled = !h.canUndo();
      this.ui.redoBtn.disabled = !h.canRedo();
      this.ui.undoCount.textContent = h.done.length ? faNum(h.done.length) : '';
      this.ui.redoCount.textContent = h.undone.length ? faNum(h.undone.length) : '';
    }
    const selected = this._currentHl != null && this.items.has(this._currentHl);
    if (this.ui.selectedBtns) for (const b of this.ui.selectedBtns) b.disabled = !selected;
    // یادداشت stays enabled either way; only WHICH note it opens changes, and
    // the label cannot say so without resizing the button every time a mark is
    // tapped (this toolbar already wraps on a phone). So the title carries it.
    if (this.ui.noteBtn) {
      const t = selected ? 'یادداشت روی هایلایت انتخاب‌شده' : 'یادداشت این مقاله';
      this.ui.noteBtn.title = t;
      this.ui.noteBtn.setAttribute('aria-label', t);
    }
    if (this.ui.hint) {
      this.ui.hint.textContent = !selected
        ? 'بعد از انتخاب متن، ابزار را مشخص کنید'
        : this._currentBy === 'tap'
          ? 'یک هایلایت انتخاب شده — رنگ، برچسب، یادداشت و حذف روی همین اعمال می‌شود'
          : 'هایلایت ثبت شد — می‌توانی یادداشت بگذاری یا حذفش کنی';
    }
  }

  // Ctrl/⌘+Z and Ctrl/⌘+Shift+Z (or Ctrl+Y) while in study mode — never while
  // typing in a field, where the browser's own undo owns those keys.
  _bindKeys() {
    if (this._onKey) return;
    this._onKey = (e) => {
      if (!this.active || !(e.ctrlKey || e.metaKey)) return;
      const t = e.target;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable)) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); this.redo(); }
    };
    document.addEventListener('keydown', this._onKey);
  }

  // --- history ---------------------------------------------------------------
  async undo() {
    if (!this.history.canUndo()) return false;
    this._closeEditor();
    this._refreshToolbar(); // buttons go quiet while the call is in flight
    try {
      const e = await this.history.undo();
      this._toast('بازگردانده شد — ' + e.label);
      return true;
    } catch (_) {
      this._toast('بازگردانی انجام نشد. اتصال به سرور را بررسی کنید.');
      return false;
    } finally { this._refreshToolbar(); }
  }

  async redo() {
    if (!this.history.canRedo()) return false;
    this._closeEditor();
    this._refreshToolbar();
    try {
      const e = await this.history.redo();
      this._toast('دوباره اعمال شد — ' + e.label);
      return true;
    } catch (_) {
      this._toast('اعمالِ دوباره انجام نشد. اتصال به سرور را بررسی کنید.');
      return false;
    } finally { this._refreshToolbar(); }
  }

  // Remove a highlight from the page and from `items` (the DOM half of a
  // delete; the server half is the caller's).
  _dropLocal(id) {
    const item = this.items.get(id);
    if (item) unwrapMarks(item.marks);
    this.items.delete(id);
    this.failed = this.failed.filter((f) => f.id !== id);
    if (this._currentHl === id) this._setCurrent(null);
    this._recountToc();
    this._renderNotes();
  }

  // Put a highlight back on the page from the server's row (the DOM half of a
  // restore) and select it, flashing it so the reader sees where it landed.
  _restoreLocal(highlight) {
    this._renderOne(highlight);
    this._setCurrent(highlight.id, 'tap');
    const item = this.items.get(highlight.id);
    if (item && item.marks.length) {
      item.marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      item.marks.forEach((m) => m.classList.add('dcp-hl-focus'));
      setTimeout(() => item.marks.forEach((m) => m.classList.remove('dcp-hl-focus')), 2600);
    }
    this._recountToc();
    this._renderNotes();
  }

  // --- selection -> highlight ----------------------------------------------
  _bindSelection() {
    const handler = debounce(() => this._captureSelection(), 10);
    this._onSelect = handler;
    this._onSelectTouch = handler;
    document.addEventListener('mouseup', handler);
    document.addEventListener('touchend', handler);
    // A click on plain prose deselects (marks stop propagation of their own
    // click, so this never fires for a tap on a highlight). Without a way to
    // deselect, the ring — and the colour/label edit it enables — would stick
    // to the last tapped mark for the rest of the session.
    this._onRootClick = (e) => {
      if (this._currentHl == null) return;
      if (e.target && e.target.closest && e.target.closest('mark.dcp-hl')) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return; // a drag-select is not a deselect click
      this._setCurrent(null);
    };
    this.root.addEventListener('click', this._onRootClick);
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
    // Hold the selection; a mark is created only when a colour/tool is pressed.
    this._pendingQuote = quote;
  }

  async _createHighlight(quote, kind) {
    const payload = {
      content_id: this.contentId,
      exact: quote.exact,
      prefix: quote.prefix,
      suffix: quote.suffix,
      underline: kind === 'underline',
      color: this.color, // the mark carries the active colour for every tool
      cloze_markers: kind === 'cloze' ? [[0, quote.exact.length]] : [],
      label: this.label,
      content_hash: hashText(fullText(this.root)),
    };
    try {
      const { highlight } = await api.createHighlight(payload);
      signalStreakActivity(); // highlight_created counts for today's streak
      this._renderOne(highlight);
      this._setCurrent(highlight.id, 'create'); // the یادداشت button writes on it
      this._recountToc();
      this._renderNotes();
      // The inverse of a create is a (soft) delete, and its redo a restore of
      // the SAME id — the card and any pins made in between survive.
      const id = highlight.id;
      this.history.push({
        label: (kind === 'underline' ? 'خط ممتد' : kind === 'cloze' ? 'نقطه‌چین' : 'هایلایت'),
        undo: async () => { await api.deleteHighlight(id); this._dropLocal(id); },
        redo: async () => { const r = await api.restoreHighlight(id); this._restoreLocal(r.highlight); },
      });
      this._refreshToolbar();
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
  }

  _renderOne(h) {
    const range = anchorQuote(h, this.root);
    if (!range) {
      this.failed.push(h);
      this.items.set(h.id, { data: h, marks: [] });
      return;
    }
    let cls = 'dcp-hl';
    if (h.underline) cls += ' dcp-underline';
    if (h.cloze_markers && h.cloze_markers.length) cls += ' dcp-cloze';
    const marks = wrapRange(range, {
      className: cls,
      dataset: { hlId: h.id, color: h.color || '' },
    });
    // Tapping a highlight only SELECTS it (ring + toolbar follow it); it never
    // opens the editor. The note editor is opened solely by the یادداشت button.
    for (const m of marks) m.addEventListener('click', (e) => { e.stopPropagation(); this._setCurrent(h.id, 'tap'); });
    if (this._currentHl === h.id) for (const m of marks) m.classList.add('is-current');
    this.items.set(h.id, { data: h, marks });
  }

  // (The old `_openEditor` popover — note + colour + label + delete in one
  // dialog — lived here until 2026-09-14. Nothing had called it since tapping
  // a mark became «select only», which is exactly how میز کار came to have a
  // working `_delete()` and no way to reach it. Delete is a toolbar button
  // now, and colour/label edit the tapped highlight from the toolbar.)

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

  // Apply a server-side edit and redraw the mark. `record` pushes the inverse
  // onto the history (the fields the patch names, as they were before it).
  async _patch(h, patch, { record = true } = {}) {
    const before = {};
    for (const k of Object.keys(patch)) before[k] = h[k] === undefined ? null : h[k];
    try {
      const { highlight } = await this._applyPatch(h.id, patch);
      if (record) {
        const id = highlight.id;
        this.history.push({
          label: 'note' in patch ? 'یادداشت' : 'color' in patch ? 'رنگ' : 'label' in patch ? 'برچسب' : 'ویرایش',
          undo: async () => { const r = await this._applyPatch(id, before); this._setCurrent(id, 'tap'); return r; },
          redo: async () => { const r = await this._applyPatch(id, patch); this._setCurrent(id, 'tap'); return r; },
        });
        this._refreshToolbar();
      }
      return highlight;
    } catch (e) { this._toast('به‌روزرسانی ناموفق بود.'); return null; }
  }

  async _applyPatch(id, patch) {
    const res = await api.updateHighlight(id, patch);
    const item = this.items.get(id);
    if (item) unwrapMarks(item.marks);
    this._renderOne(res.highlight);
    this._recountToc();
    this._renderNotes();
    return res;
  }

  // «حذف» on the toolbar: the selected highlight, at once, undoable. Soft on
  // the server (migration 0066), so the undo is a restore of the same row.
  _deleteButton() {
    const item = this._currentHl != null ? this.items.get(this._currentHl) : null;
    if (!item || !item.data) { this._toast('اول روی یکی از هایلایت‌هایت کلیک کن.'); return; }
    this._delete(item.data);
  }

  async _delete(h) {
    const id = h.id;
    try {
      await api.deleteHighlight(id);
      this._dropLocal(id);
      this._closeEditor();
      this.history.push({
        label: 'حذف',
        undo: async () => { const r = await api.restoreHighlight(id); this._restoreLocal(r.highlight); },
        redo: async () => { await api.deleteHighlight(id); this._dropLocal(id); },
      });
      this._refreshToolbar();
      this._toast('هایلایت حذف شد.', { action: { label: 'بازگردانی', run: () => this.undo() } });
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
        el('div', { class: 'dcp-note-text' }, renderNoteLines(data.note)),
      ]);
      listEl.appendChild(item);
    }
  }

  /**
   * Scroll to ONE highlight and flash it. Called after entering study mode from
   * a ?dcphl=<id> deep link (plus.js) — the دفترچه‌ی هایلایت‌ها, the dashboard's
   * recent list and a collection all link this way, so «متنِ مقاله» lands on the
   * highlight itself instead of the top of an article whose highlights are not
   * even drawn yet.
   *
   * Returns false when the id is unknown or its anchor no longer matches the
   * page (an edited article — see the orphan note below); the caller just does
   * nothing then, since the page is still the right page.
   */
  focusHighlight(id) {
    const item = this.items.get(id);
    if (!item || !item.marks || !item.marks.length) return false;
    const mark = item.marks[0];
    this._setCurrent(id, 'tap'); // it becomes the selected highlight, as if tapped
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    item.marks.forEach((m) => m.classList.add('dcp-hl-focus'));
    setTimeout(() => item.marks.forEach((m) => m.classList.remove('dcp-hl-focus')), 2600);
    return true;
  }

  // --- orphaned anchors -----------------------------------------------------
  // A highlight whose stored text no longer exists in the page (the article was
  // edited after it was made) is kept in `this.failed` so it is never treated as
  // deleted — its data lives on and still shows in the archive / پیشخوان. It is
  // deliberately NOT surfaced on the article itself: the old floating
  // «هایلایت‌هایی که جای‌گذاری نشدند» panel sat above the toolbar and read as an
  // error the reader can do nothing about. Silent here, intact everywhere else.

  // --- note button ----------------------------------------------------------
  // Writes a note ON the currently-selected highlight (the last one created or
  // clicked) so it shows up in the notes panel. If no highlight is selected, it
  // falls back to the whole-article note.
  _noteButton() {
    if (this.ui.editor) { this._closeEditor(); return; }
    const item = this._currentHl != null ? this.items.get(this._currentHl) : null;
    if (item && item.data) {
      this._openHighlightNote(item.data);
      return;
    }
    this._openArticleNote();
  }

  // --- collection button ------------------------------------------------------
  // Single-purpose (unlike the note button): only ever adds the currently
  // SELECTED highlight. Saving the WHOLE page is a separate, always-visible
  // button next to میز کار (see injectWorkbenchButton in plus.js) — the two
  // are deliberately not overloaded onto one control.
  _collectionButton() {
    const item = this._currentHl != null ? this.items.get(this._currentHl) : null;
    if (!item || !item.data) {
      this._toast('اول یه هایلایت بزن یا رو یکی از هایلایت‌هات کلیک کن.');
      return;
    }
    openCollectionPicker({ highlightId: item.data.id });
  }

  // A plain note field for the selected highlight — JUST the note (no colour /
  // label / delete UI). Saving attaches it to the highlight, so it shows in the
  // notes panel as a sticky-note card.
  _openHighlightNote(h) {
    this._closeEditor();
    const ta = el('textarea', { class: 'dcp-note-input', rows: '4', placeholder: 'یادداشت خود را اینجا بنویسید…' });
    ta.value = h.note || '';
    const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', onclick: async () => {
      const note = ta.value.trim() || null;
      if (note !== (h.note || null)) await this._patch(h, { note });
      this._closeEditor();
    } }, 'ذخیره');
    const close = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', onclick: () => this._closeEditor() }, 'بستن');
    const pop = el('div', { class: 'dcp-editor', role: 'dialog', 'aria-label': 'یادداشت' }, [
      el('label', { class: 'dcp-editor-label' }, 'یادداشت'),
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

  // The per-article note editor: a single empty/typeable field, docked above the
  // toolbar like the rest, loaded with and saved as the article's own note.
  _openArticleNote() {
    this._closeEditor();
    const ta = el('textarea', { class: 'dcp-note-input', rows: '4', placeholder: 'یادداشت این مقاله را اینجا بنویسید…' });
    ta.value = this.articleNote || '';
    const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', onclick: async () => {
      const val = ta.value.trim() || null;
      const prev = this.articleNote || null;
      try {
        const r = await api.saveArticleNote(this.contentId, val);
        this.articleNote = (r && r.note) || null;
        signalStreakActivity();
        this._closeEditor();
        if (val !== prev) {
          const cid = this.contentId;
          const saveAs = async (v) => { const rr = await api.saveArticleNote(cid, v); this.articleNote = (rr && rr.note) || null; };
          this.history.push({ label: 'یادداشت مقاله', undo: () => saveAs(prev), redo: () => saveAs(val) });
          this._refreshToolbar();
        }
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

  // One toast at a time; an optional action («بازگردانی» after a delete) is
  // the only control a toast carries.
  _toast(text, { action = null } = {}) {
    if (this.ui.toast) { this.ui.toast.remove(); this.ui.toast = null; }
    const kids = [document.createTextNode(text)];
    if (action) kids.push(el('button', { class: 'dcp-toast-act', type: 'button', onclick: () => { hide(); action.run(); } }, action.label));
    const t = el('div', { class: 'dcp-toast', role: 'status' }, kids);
    this.ui.toast = t;
    document.body.appendChild(t);
    const hide = () => { if (this.ui.toast === t) this.ui.toast = null; t.classList.remove('is-in'); setTimeout(() => t.remove(), 300); };
    setTimeout(() => t.classList.add('is-in'), 10);
    setTimeout(hide, action ? 5000 : 2600);
  }
}
