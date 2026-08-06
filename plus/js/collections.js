// Collections (Phase 3): user-made freeform folders. Unlike a pathway
// (founder-curated) or a topic archive (auto-grouped by the site's own
// taxonomy), a collection is entirely the user's own — any mix of their own
// highlights AND whole pages, regardless of pillar/pathway/topic. Presented
// Pinterest-style (boards -> pins), localized to the site's own tokens/RTL:
// a board's cover is a collage of its own items' colors/icons, and a board
// opens into a masonry grid of "pins." This module is shared by
// /plus/collections.html, /plus/collection.html, the workbench's two
// single-purpose collection buttons, and the dashboard.
import { el, faNum } from './util.js';
import { openSheet, closeSheet } from './sheet.js';
import { premiumCta } from './premium-cta.js';
import { api, currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { FOLDER_EN } from './content-index.js';
import { PALETTE } from './config.js';
import {
  foldFa, highlightHref, hlMark, noteBlock, labelChip, actionBtn, asText,
  copyToClipboard, toast, skeleton, confirmStrip, inlineEditor,
} from './hl-view.js';

const hlColorCss = (key) => (PALETTE.find((p) => p.key === key) || {}).css || '#eaecf5';

// A whole-page item has no highlight color, so its pin/cover tile is colored
// by content TYPE instead — a fixed, distinguishable palette, one hue per
// folder. Values are deliberately solid/saturated (white icon/text sits on top).
const TYPE_COVER_COLOR = {
  episodes: '#0b5fff', notecast: '#0e9f6e', insight: '#e0a100', dentai: '#7c5cff',
  chairside: '#16a34a', metanotes: '#db2777', sharehub: '#ea580c', photocast: '#0891b2',
  'dentcast-plus': '#4f46e5', glossary: '#64748b',
};
const TYPE_ICON = {
  episodes: '🎙️', notecast: '📝', insight: '📄', dentai: '🤖', chairside: '🦷',
  metanotes: '🔬', sharehub: '🔗', photocast: '📷', 'dentcast-plus': '🎬', glossary: '📖',
};
const coverColorOf = (p) => (p.kind === 'highlight' ? hlColorCss(p.color) : (TYPE_COVER_COLOR[p.type] || '#8aaac8'));

function coverTile(p) {
  if (p.kind === 'highlight') return el('span', { class: 'dcp-cl-cover-tile', style: 'background:' + coverColorOf(p) });
  return el('span', {
    class: 'dcp-cl-cover-tile dcp-cl-cover-tile-page', style: 'background:' + coverColorOf(p),
  }, TYPE_ICON[p.type] || '📄');
}

// A board's own colour (chosen by its owner; the API validates the same six).
// These are surfaces the title sits on, so each is a soft tint that works under
// both themes rather than a saturated brand colour.
export const BOARD_COLORS = [
  { key: 'blue', fa: 'آبی', css: '#dbe9ff' },
  { key: 'green', fa: 'سبز', css: '#d9f2e2' },
  { key: 'amber', fa: 'کهربایی', css: '#fdeecd' },
  { key: 'pink', fa: 'صورتی', css: '#fbdfe9' },
  { key: 'purple', fa: 'بنفش', css: '#e6e0fb' },
  { key: 'slate', fa: 'خاکستری', css: '#e2e8f0' },
];
const boardColorCss = (key) => (BOARD_COLORS.find((c) => c.key === key) || {}).css || null;

/**
 * A board's cover: the owner's own emoji if they set one, otherwise the
 * Pinterest-style collage of its 3 most recent items. A shelf of identical
 * generated covers is a shelf you cannot scan — the emoji is the fastest way
 * to tell «امتحان بورد» from «کیس خانم ر.» at a glance.
 */
export function boardCover(preview, collection = null) {
  const tint = collection && boardColorCss(collection.color);
  if (collection && collection.emoji) {
    return el('div', {
      class: 'dcp-cl-cover dcp-cl-cover-emoji',
      style: tint ? 'background:' + tint : null,
    }, el('span', { class: 'dcp-cl-cover-emo' }, collection.emoji));
  }
  const cover = el('div', {
    class: 'dcp-cl-cover dcp-cl-cover-' + Math.min(preview.length, 3),
    style: tint && !preview.length ? 'background:' + tint : null,
  });
  if (!preview.length) { cover.appendChild(el('span', { class: 'dcp-cl-cover-empty' }, '🗂')); return cover; }
  preview.slice(0, 3).forEach((p) => cover.appendChild(coverTile(p)));
  return cover;
}

// The bottom sheet now lives in sheet.js: the achievements wall needed the same
// object, and a second copy is exactly what hl-view.js was created to prevent.

function gateCard({ title, sub, cta }) {
  return el('div', { class: 'dcp-sheet-card', role: 'dialog', 'aria-label': title }, [
    el('h2', { class: 'dcp-sheet-title' }, title),
    el('p', { class: 'dcp-sheet-sub' }, sub),
    cta,
  ]);
}

/**
 * The board chooser sheet, shared by "add to collection" and "move to another
 * collection" — both are the same question ("which board?"), so they are the
 * same sheet, with a filter box once you own enough boards for scanning them to
 * be work.
 *
 * @param onPick   async (collection) => void; the sheet closes on success
 * @param exclude  a collection id to leave out (the one you are moving OUT of)
 */
function chooserCard({ title, hint, onPick, exclude = null, okText = 'اضافه شد' }) {
  const msg = el('div', { class: 'dcp-modal-msg', role: 'status' });
  const list = el('div', { class: 'dcp-cl-picklist' }, skeleton(2));
  const filter = el('input', {
    type: 'search', class: 'dcp-input dcp-cl-pickfilter', placeholder: 'جستجوی کالکشن…',
    'aria-label': 'جستجوی کالکشن',
  });
  filter.hidden = true;

  const newTitle = el('input', { type: 'text', class: 'dcp-input', placeholder: 'اسمِ کالکشنِ جدید', maxlength: '80' });
  const newBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, '+ ساختن');

  async function pick(c) {
    try {
      await onPick(c);
      closeSheet();
      toast('«' + c.title + '» — ' + okText);
    } catch (_) {
      msg.textContent = 'انجام نشد؛ دوباره تلاش کنید.';
    }
  }

  newBtn.addEventListener('click', async () => {
    const t = newTitle.value.trim();
    if (!t) { msg.textContent = 'یک اسم برای کالکشن بنویس.'; return; }
    newBtn.disabled = true;
    try {
      const { collection } = await api.createCollection(t);
      await pick(collection);
    } catch (_) {
      msg.textContent = 'ساختِ کالکشن ناموفق بود؛ دوباره تلاش کنید.';
      newBtn.disabled = false;
    }
  });
  newTitle.addEventListener('keydown', (e) => { if (e.key === 'Enter') newBtn.click(); });

  let all = [];
  function paintList() {
    const q = foldFa(filter.value);
    const rows = all.filter((c) => !q || foldFa(c.title).includes(q));
    if (!rows.length) {
      list.replaceChildren(el('p', { class: 'dcp-cl-pick-empty' },
        all.length ? 'کالکشنی با این اسم نیست؛ می‌توانی همین‌جا بسازی:' : 'هنوز کالکشنی نساخته‌ای؛ یکی بساز:'));
      return;
    }
    list.replaceChildren(...rows.map((c) => {
      const row = el('button', { class: 'dcp-cl-pick-row', type: 'button' }, [
        boardCover(c.preview || [], c),
        el('span', { class: 'dcp-cl-pick-txt' }, [
          el('span', { class: 'dcp-cl-pick-name' }, c.title),
          el('span', { class: 'dcp-cl-pick-count' }, faNum(c.item_count || 0) + ' مورد'),
        ]),
      ]);
      row.addEventListener('click', () => pick(c));
      return row;
    }));
  }

  api.listCollections().then(({ collections }) => {
    all = collections.filter((c) => c.id !== exclude);
    filter.hidden = all.length < 6;
    paintList();
  }).catch(() => { list.replaceChildren(el('div', { class: 'dcp-empty' }, 'کالکشن‌ها در دسترس نیست.')); });
  filter.addEventListener('input', paintList);

  // «؟» reveal, same pattern as the homepage promo card's score caption and the
  // workbench's own two collection buttons: hidden by default, toggled inline.
  const cap = el('p', { class: 'dcp-sheet-cap' }, hint);
  cap.hidden = true;
  const infoBtn = el('button', { class: 'dcp-wb-info', type: 'button', title: 'کالکشن یعنی چی؟', 'aria-label': 'کالکشن یعنی چی؟' }, '؟');
  infoBtn.addEventListener('click', () => { cap.hidden = !cap.hidden; });

  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-sheet-top' }, [el('h2', { class: 'dcp-sheet-title' }, title), infoBtn]),
    cap,
    filter,
    list,
    el('div', { class: 'dcp-cl-picknew' }, [newTitle, newBtn]),
    msg,
  ]);
}

const PICKER_HINT = 'کالکشن یعنی یه پوشه‌ی دلخواه که خودت می‌سازی و هرچی خواستی توش می‌ریزی — برای یه امتحان، یه بیمارِ خاص، یا هر موضوعی که خودت بخوای.';

function pickerCard(target) {
  return chooserCard({
    title: 'افزودن به کالکشن',
    hint: PICKER_HINT,
    okText: 'اضافه شد',
    onPick: (c) => api.addToCollection(c.id, target),
  });
}

/**
 * Move one saved item to another board. There is no move endpoint and none is
 * needed: add here, then let the caller's own remove take it off this board —
 * and the add is idempotent at the DB level, so the worst case of a half
 * finished move is the item sitting in both boards, never lost.
 *
 * `removeFromHere` is the board's OWN remove (API call + its in-memory model),
 * so a move leaves the open board redrawn correctly and never deletes twice.
 */
export function openCollectionMove(item, fromCollectionId, removeFromHere) {
  openSheet(chooserCard({
    title: 'انتقال به کالکشنِ دیگر',
    hint: PICKER_HINT,
    okText: 'منتقل شد',
    exclude: fromCollectionId,
    onPick: async (c) => {
      await api.addToCollection(c.id, item.highlight_id
        ? { highlight_id: item.highlight_id }
        : { content_id: item.content_id });
      await removeFromHere(item.id);
    },
  }));
}

/**
 * Open the "add to collection" flow for one item: a highlight (`highlightId`)
 * or a whole page (`contentId`) — pass exactly one. Handles all three states
 * itself (anon -> login, free -> premium upsell, premium -> the real picker),
 * so every call site (the two workbench buttons, the dashboard row button)
 * behaves identically without repeating the gate logic.
 */
export async function openCollectionPicker({ highlightId, contentId } = {}) {
  const user = await currentUser();
  if (!user) {
    const res = await openLoginModal({ returnTo: location.pathname + location.search });
    if (!res || !res.user) return;
    return openCollectionPicker({ highlightId, contentId });
  }
  if (user.tier !== 'premium') {
    openSheet(gateCard({
      title: 'کالکشن‌ها ویژه‌ی پریمیوم است',
      sub: 'هایلایت‌ها و مطالعه‌ی شما همین حالا هم ثبت می‌شود؛ با پریمیوم، می‌توانید آن‌ها را در پوشه‌های دلخواهِ خودتان دسته‌بندی کنید.',
      cta: premiumCta('gate-collection-sheet'),
    }));
    return;
  }
  openSheet(pickerCard({ highlight_id: highlightId, content_id: contentId }));
}

// --- masonry "pin" (one saved item inside a board) --------------------------
/**
 * A pin is a CARD, not a link — the same rule the دفترچه follows, and for the
 * same reason: a saved highlight used to be a colour band that, when clicked,
 * threw you into the article with none of your marks drawn and no note in
 * sight (user report, 2026-08-05). A pin now carries the note, the label and
 * its own actions (edit / copy / move / open / remove), so a board is
 * something you can actually study from.
 *
 * @param collectionId  the board it lives in (needed for move + remove)
 */
function pinCard(item, collectionId, { onRemove, onChanged, arrange = null }) {
  const kindLabel = FOLDER_EN[item.type] || item.type;
  const pin = el('div', { class: 'dcp-cl-pin' });

  // While the board is being arranged, the pin's own actions step aside for
  // the two that matter — up and down. Position is shown as «۲ از ۷» so the
  // move you just made is legible without counting cards.
  function arrangeBar() {
    const up = el('button', {
      class: 'dcp-hlib-act', type: 'button', title: 'بالاتر', 'aria-label': 'انتقال به بالاتر',
      disabled: arrange.index === 0 ? '' : null,
    }, '↑');
    const down = el('button', {
      class: 'dcp-hlib-act', type: 'button', title: 'پایین‌تر', 'aria-label': 'انتقال به پایین‌تر',
      disabled: arrange.index === arrange.total - 1 ? '' : null,
    }, '↓');
    up.addEventListener('click', () => arrange.move(-1));
    down.addEventListener('click', () => arrange.move(1));
    return el('div', { class: 'dcp-hlib-actions dcp-cl-pin-actions dcp-cl-arrange' }, [
      up, down,
      el('span', { class: 'dcp-cl-arrange-pos' }, faNum(arrange.index + 1) + ' از ' + faNum(arrange.total)),
    ]);
  }

  function paint() {
    // A highlight-pin shows the SAME solid pastel the article's own mark.dcp-hl
    // uses (never flattened to plain text); a page-pin gets its type color + icon.
    const band = item.exact
      ? el('div', { class: 'dcp-cl-pin-band' }, [hlMark(item)])
      : el('div', { class: 'dcp-cl-pin-band dcp-cl-pin-page', style: 'background:' + (TYPE_COVER_COLOR[item.type] || '#8aaac8') }, [
        el('span', { class: 'dcp-cl-pin-ico' }, TYPE_ICON[item.type] || '📄'),
        el('span', {}, item.title),
      ]);

    const actions = [];
    if (item.highlight_id) {
      actions.push(actionBtn('✎ ویرایش', {
        onClick: () => {
          if (pin.querySelector('.dcp-hlib-editor')) return;
          pin.appendChild(inlineEditor({ id: item.highlight_id, note: item.note, label: item.label, color: item.color }, {
            onSaved: (updated) => {
              Object.assign(item, { note: updated.note, label: updated.label, color: updated.color });
              paint();
              if (onChanged) onChanged(item);
            },
          }));
        },
      }));
      actions.push(actionBtn('کپی', {
        onClick: (e) => copyToClipboard(asText({ exact: item.exact, note: item.note }), e.currentTarget),
      }));
    }
    actions.push(actionBtn('انتقال', {
      title: 'انتقال به کالکشنِ دیگر',
      onClick: () => openCollectionMove(item, collectionId, onRemove),
    }));
    // A highlight-item opens ON its highlight (?dcphl=); a page-item opens the page.
    actions.push(actionBtn(item.highlight_id ? 'متنِ مقاله ›' : 'بازکردن ›', {
      href: highlightHref(item.url, item.highlight_id),
    }));
    actions.push(actionBtn('حذف', {
      danger: true,
      onClick: () => {
        if (pin.querySelector('.dcp-recent-confirm')) return;
        pin.appendChild(confirmStrip('از این کالکشن حذف شود؟', async () => {
          await onRemove(item.id);
          toast('از کالکشن حذف شد');
        }));
      },
    }));

    const foot = el('div', { class: 'dcp-cl-pin-foot' }, [
      el('a', { class: 'dcp-cl-pin-src', href: item.url }, [
        el('span', { dir: 'ltr', class: 'dcp-hlib-folder' }, kindLabel),
        item.highlight_id ? el('span', {}, item.title) : null,
      ].filter(Boolean)),
      labelChip(item.label),
    ].filter(Boolean));

    pin.replaceChildren(...[
      band,
      noteBlock(item.note),
      foot,
      arrange ? arrangeBar() : el('div', { class: 'dcp-hlib-actions dcp-cl-pin-actions' }, actions),
    ].filter(Boolean));
  }

  paint();
  return pin;
}

// "۳ روز پیش" — a relative day count is what a shelf of boards actually needs
// (which one did I touch last?), not a formatted date nobody reads.
function agoFa(iso) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (!Number.isFinite(days) || days < 0) return null;
  if (days === 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 30) return faNum(days) + ' روز پیش';
  const months = Math.floor(days / 30);
  return faNum(months) + ' ماه پیش';
}

const BOARD_SORTS = [
  { key: 'recent', fa: 'تازه‌ترین' },
  { key: 'active', fa: 'آخرین افزوده' },
  { key: 'most', fa: 'پرمورد‌ترین' },
  { key: 'title', fa: 'بر اساس نام' },
];

/** GET /plus/collections.html — every collection as a Pinterest-style board grid. */
export async function renderCollectionsList(container) {
  container.replaceChildren(skeleton(2));
  const data = await api.listCollections().catch(() => null);
  if (!data) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'کالکشن‌ها در دسترس نیست.')); return; }

  const top = el('div', { class: 'dcp-pw-top' }, [
    // The two premium study surfaces are one workflow (read in the دفترچه →
    // file into a board), and neither is in the site nav, so each links to the
    // other.
    el('div', { class: 'dcp-hlib-head' }, [
      el('h2', { class: 'dcp-pw-heading' }, 'کالکشن‌ها'),
      el('a', { class: 'dcp-pw-alllink', href: '/plus/highlights.html' }, '🖍 دفترچه‌ی هایلایت‌ها'),
    ]),
    el('p', { class: 'dcp-sec-hint' },
      'هایلایت‌ها یا کلِ یه مقاله/اپیزود رو تو پوشه‌های دلخواهِ خودت بریز — برای یه امتحان، یه بیمارِ خاص، یا هر موضوعی که خودت بخوای؛ برخلافِ آرشیوِ موضوعی، این چیدمان کاملاً دستِ خودته.'),
  ]);

  const titleInput = el('input', { type: 'text', class: 'dcp-input', placeholder: 'اسمِ کالکشنِ جدید', maxlength: '80' });
  const createBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, '+ کالکشنِ جدید');
  const createRow = el('div', { class: 'dcp-cl-picknew' }, [titleInput, createBtn]);

  const search = el('input', {
    type: 'search', class: 'dcp-input dcp-hlib-search', placeholder: 'جستجوی کالکشن…', 'aria-label': 'جستجوی کالکشن',
  });
  const sortSel = el('select', { class: 'dcp-input dcp-hlib-select', 'aria-label': 'ترتیب' },
    BOARD_SORTS.map((s) => el('option', { value: s.key }, s.fa)));
  // The search row only earns its space once there is something to search.
  const tools = el('div', { class: 'dcp-hlib-row' }, [search, sortSel]);
  tools.hidden = data.collections.length < 4;

  const grid = el('div', { class: 'dcp-cl-board-grid' });

  function renderGrid() {
    if (!data.collections.length) {
      grid.replaceChildren(el('div', { class: 'dcp-empty dcp-hlib-empty' }, [
        el('div', { class: 'dcp-hlib-empty-ico', 'aria-hidden': 'true' }, '🗂'),
        el('p', {}, 'هنوز کالکشنی نساختی.'),
        el('p', { class: 'dcp-muted' }, 'یکی بساز، بعد از دفترچه‌ی هایلایت‌ها یا از میزکارِ هر مقاله چیزی بهش اضافه کن.'),
        el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/highlights.html' }, 'رفتن به دفترچه‌ی هایلایت‌ها'),
      ]));
      return;
    }
    const q = foldFa(search.value);
    const rows = data.collections.filter((c) => !q || foldFa(c.title).includes(q));
    const sort = sortSel.value;
    if (sort === 'most') rows.sort((a, b) => (b.item_count || 0) - (a.item_count || 0));
    else if (sort === 'title') rows.sort((a, b) => String(a.title).localeCompare(String(b.title), 'fa'));
    else if (sort === 'active') {
      rows.sort((a, b) => String(b.last_item_at || b.created_at).localeCompare(String(a.last_item_at || a.created_at)));
    }

    if (!rows.length) {
      grid.replaceChildren(el('div', { class: 'dcp-empty' }, 'کالکشنی با این اسم پیدا نشد.'));
      return;
    }
    grid.replaceChildren(...rows.map((c) => {
      // Only ever "when something was last added" — dating an empty board by
      // when it was created reads as activity that never happened.
      const ago = agoFa(c.last_item_at);
      return el('a', { class: 'dcp-cl-board', href: '/plus/collection.html?id=' + encodeURIComponent(c.id) }, [
        boardCover(c.preview, c),
        el('div', { class: 'dcp-cl-board-meta' }, [
          el('p', { class: 'dcp-cl-board-title' }, c.title),
          c.description ? el('p', { class: 'dcp-cl-board-desc' }, c.description) : null,
          el('p', { class: 'dcp-cl-board-count' },
            faNum(c.item_count) + ' مورد' + (ago ? ' · ' + ago : '')),
        ].filter(Boolean)),
      ]);
    }));
  }
  search.addEventListener('input', renderGrid);
  sortSel.addEventListener('change', renderGrid);
  renderGrid();

  createBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    if (!title) return;
    createBtn.disabled = true;
    try {
      const { collection } = await api.createCollection(title);
      titleInput.value = '';
      location.href = '/plus/collection.html?id=' + encodeURIComponent(collection.id);
    } finally { createBtn.disabled = false; }
  });
  titleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') createBtn.click(); });

  container.replaceChildren(top, createRow, tools, grid);
}

/** GET /plus/collection.html?id=... — one board's masonry pin grid, rename/delete. */
export async function renderCollectionDetail(container, id) {
  container.replaceChildren(skeleton(2));
  const data = await api.getCollection(id).catch(() => null);
  if (!data) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'این کالکشن پیدا نشد.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/collections.html' }, 'بازگشت به کالکشن‌ها'),
    ]));
    return;
  }

  const titleEl = el('h2', { class: 'dcp-pw-detail-title' }, [
    data.emoji ? el('span', { class: 'dcp-cl-title-emo' }, data.emoji) : null,
    el('span', {}, data.title),
  ].filter(Boolean));
  const descEl = el('p', { class: 'dcp-cl-detail-desc' }, data.description || '');
  descEl.hidden = !data.description;
  const editBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'ویرایشِ کالکشن');
  const deleteBtn = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, 'حذفِ کالکشن');
  const titleWrap = el('div', { class: 'dcp-cl-title-wrap' }, [titleEl, descEl]);
  const actionsRow = el('div', { class: 'dcp-cl-detail-actions' }, [editBtn, deleteBtn]);

  function repaintHead() {
    titleEl.replaceChildren(...[
      data.emoji ? el('span', { class: 'dcp-cl-title-emo' }, data.emoji) : null,
      el('span', {}, data.title),
    ].filter(Boolean));
    descEl.textContent = data.description || '';
    descEl.hidden = !data.description;
  }

  // Board identity: name, emoji, colour and a one-line description, in ONE
  // inline panel with one save. A board is the user's own shelf; before this
  // every shelf looked identical and only its name could ever change.
  editBtn.addEventListener('click', () => {
    if (titleWrap.querySelector('.dcp-cl-editbox')) return;

    const nameInput = el('input', { class: 'dcp-input', value: data.title, maxlength: '80', 'aria-label': 'نامِ کالکشن' });
    const emojiInput = el('input', {
      class: 'dcp-input dcp-cl-emoji-input', value: data.emoji || '', maxlength: '8',
      placeholder: '🗂', 'aria-label': 'ایموجی کالکشن',
    });
    const descInput = el('textarea', {
      class: 'dcp-hlib-ta', rows: '2', maxlength: '400',
      placeholder: 'این کالکشن برای چیست؟ (اختیاری)', 'aria-label': 'توضیحِ کالکشن',
    });
    descInput.value = data.description || '';

    // A short list of ready-made emoji beside the free field: picking is one
    // tap on a phone, where summoning the emoji keyboard is not.
    const SUGGESTED = ['📚', '🦷', '🧪', '💊', '🩺', '📝', '⭐️', '🔥', '🎯', '🧠'];
    const emojiRow = el('div', { class: 'dcp-hlib-erow' }, SUGGESTED.map((e) => {
      const b = el('button', { class: 'dcp-hlib-chip', type: 'button', 'aria-label': 'ایموجی ' + e }, e);
      b.addEventListener('click', () => { emojiInput.value = e; });
      return b;
    }));

    let color = data.color || null;
    const colorBtns = BOARD_COLORS.map((c) => {
      const b = el('button', {
        class: 'dcp-hlib-sw' + (c.key === color ? ' is-on' : ''), type: 'button',
        style: 'background:' + c.css, title: c.fa, 'aria-label': 'رنگ ' + c.fa,
      });
      b.addEventListener('click', () => {
        color = color === c.key ? null : c.key; // pressing the active one clears it
        colorBtns.forEach((x) => x.classList.remove('is-on'));
        if (color) b.classList.add('is-on');
      });
      return b;
    });

    const msg = el('span', { class: 'dcp-hlib-msg', role: 'status' });
    const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ذخیره');
    const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
    const box = el('div', { class: 'dcp-cl-editbox' }, [
      el('div', { class: 'dcp-hlib-erow' }, [emojiInput, nameInput]),
      emojiRow,
      el('div', { class: 'dcp-hlib-erow' }, colorBtns),
      descInput,
      el('div', { class: 'dcp-hlib-erow dcp-hlib-esave' }, [save, cancel, msg]),
    ]);

    cancel.addEventListener('click', () => box.remove());
    save.addEventListener('click', async () => {
      const next = nameInput.value.trim();
      if (!next) { msg.textContent = 'اسمِ کالکشن نمی‌تواند خالی باشد.'; return; }
      save.disabled = true;
      msg.textContent = '';
      try {
        const { collection } = await api.updateCollection(id, {
          title: next,
          emoji: emojiInput.value.trim() || null,
          color,
          description: descInput.value.trim() || null,
        });
        Object.assign(data, collection);
        repaintHead();
        box.remove();
        toast('ذخیره شد');
      } catch (_) {
        save.disabled = false;
        msg.textContent = 'ذخیره نشد؛ ایموجی را ساده‌تر بگیر یا دوباره تلاش کن.';
      }
    });
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') save.click(); });
    titleWrap.appendChild(box);
    nameInput.focus();
  });

  // Delete: inline "حذف شود؟" confirm row (dashboard.js's recent-highlight
  // delete pattern), never a native confirm().
  deleteBtn.addEventListener('click', () => {
    if (actionsRow.querySelector('.dcp-recent-confirm')) return;
    const yes = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, 'حذف');
    const no = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
    const confirmRow = el('span', { class: 'dcp-recent-confirm' }, ['این کالکشن و همه‌ی موردهاش حذف شود؟', yes, no]);
    no.onclick = () => confirmRow.remove();
    yes.onclick = async () => {
      yes.disabled = true;
      try { await api.deleteCollection(id); location.href = '/plus/collections.html'; }
      catch (_) { yes.disabled = false; }
    };
    actionsRow.appendChild(confirmRow);
  });

  const back = el('a', { class: 'dcp-back', href: '/plus/collections.html' }, '‹ همه‌ی کالکشن‌ها');
  const head = el('div', { class: 'dcp-pw-detail-head' }, [
    back,
    el('div', { class: 'dcp-cl-detail-top' }, [titleWrap, actionsRow]),
  ]);

  // --- filters over the board's own items ----------------------------------
  const search = el('input', {
    type: 'search', class: 'dcp-input dcp-hlib-search',
    placeholder: 'جستجو در این کالکشن…', 'aria-label': 'جستجو در این کالکشن',
  });
  const KINDS = [{ key: '', fa: 'همه' }, { key: 'highlight', fa: 'هایلایت‌ها' }, { key: 'page', fa: 'صفحه‌ها' }];
  let kind = '';
  const kindChips = el('div', { class: 'dcp-hlib-chips' });
  // A board that the owner has arranged by hand opens in THAT order, and says
  // so — the sort control offers «چیدمانِ خودم» only once there is one.
  const hasManual = () => data.items.some((it) => it.position != null);
  const sortSel = el('select', { class: 'dcp-input dcp-hlib-select', 'aria-label': 'ترتیب' });
  function paintSort() {
    const current = sortSel.value;
    sortSel.replaceChildren(...[
      hasManual() ? el('option', { value: 'manual' }, 'چیدمانِ خودم') : null,
      el('option', { value: 'recent' }, 'تازه‌ترین'),
      el('option', { value: 'oldest' }, 'قدیمی‌ترین'),
      el('option', { value: 'source' }, 'بر اساس مقاله'),
    ].filter(Boolean));
    sortSel.value = current && [...sortSel.options].some((o) => o.value === current)
      ? current
      : (hasManual() ? 'manual' : 'recent');
  }

  // Arranging is a MODE, not a permanent set of buttons on every card: outside
  // it a board stays a clean reading surface. Inside it each pin grows ↑/↓
  // controls — deliberately buttons, not drag: dragging a masonry card is
  // unusable on a phone and invisible to a keyboard.
  let arranging = false;
  const arrangeBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, '⇅ چیدمانِ دستی');
  const resetBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'بازگشت به تازه‌ترین');
  const countLine = el('p', { class: 'dcp-hlib-count' });
  const tools = el('div', { class: 'dcp-hlib-controls' }, [
    el('div', { class: 'dcp-hlib-row' }, [search, sortSel]),
    el('div', { class: 'dcp-hlib-row dcp-hlib-row-tools' }, [kindChips, countLine, arrangeBtn, resetBtn]),
  ]);

  const grid = el('div', { class: 'dcp-cl-pin-grid' });

  async function removeItem(itemId) {
    await api.removeCollectionItem(id, itemId);
    data.items = data.items.filter((i) => i.id !== itemId);
    renderItems();
  }

  // Save the WHOLE order, every time: positions are then only ever fully
  // written, so two tabs can never leave the board half-arranged.
  async function saveOrder() {
    try {
      const { items } = await api.orderCollectionItems(id, data.items.map((i) => i.id));
      data.items = items;
    } catch (_) { toast('ذخیره‌ی چیدمان ناموفق بود', { icon: '⚠️' }); }
    renderItems();
  }

  async function moveItem(itemId, delta) {
    const from = data.items.findIndex((i) => i.id === itemId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= data.items.length) return;
    const [row] = data.items.splice(from, 1);
    data.items.splice(to, 0, row);
    renderItems();          // move first, save after: the board must feel instant
    await saveOrder();
  }

  arrangeBtn.addEventListener('click', () => {
    arranging = !arranging;
    if (arranging) {
      // Arranging orders the WHOLE board, so it cannot run under a filter that
      // is hiding part of it.
      search.value = '';
      kind = '';
      sortSel.value = 'manual';
    }
    renderItems();
  });

  resetBtn.addEventListener('click', async () => {
    try {
      const { items } = await api.orderCollectionItems(id, []);
      data.items = items;
      arranging = false;
      sortSel.value = 'recent';
      toast('چیدمان به تازه‌ترین برگشت');
    } catch (_) { toast('انجام نشد', { icon: '⚠️' }); }
    renderItems();
  });

  function renderItems() {
    tools.hidden = data.items.length < 4;
    paintSort();
    arrangeBtn.textContent = arranging ? '✓ پایانِ چیدمان' : '⇅ چیدمانِ دستی';
    arrangeBtn.classList.toggle('is-on', arranging);
    resetBtn.hidden = !hasManual();
    if (!data.items.length) {
      countLine.textContent = '';
      kindChips.replaceChildren();
      grid.replaceChildren(el('div', { class: 'dcp-empty dcp-hlib-empty' }, [
        el('div', { class: 'dcp-hlib-empty-ico', 'aria-hidden': 'true' }, '📌'),
        el('p', {}, 'این کالکشن هنوز خالیه.'),
        el('p', { class: 'dcp-muted' }, 'از دفترچه‌ی هایلایت‌ها یا از میزکارِ هر مقاله، چیزی بهش اضافه کن.'),
        el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/highlights.html' }, 'رفتن به دفترچه‌ی هایلایت‌ها'),
      ]));
      return;
    }

    const counts = { '': data.items.length, highlight: 0, page: 0 };
    for (const it of data.items) counts[it.highlight_id ? 'highlight' : 'page'] += 1;
    kindChips.replaceChildren(...KINDS.map((k) => {
      const b = el('button', { class: 'dcp-hlib-chip' + (k.key === kind ? ' is-on' : ''), type: 'button' },
        [k.fa, el('span', { class: 'dcp-hlib-chipn' }, faNum(counts[k.key]))]);
      b.addEventListener('click', () => { kind = k.key; renderItems(); });
      return b;
    }));

    // Arranging orders the WHOLE board, so while it is on the filters step
    // aside entirely: ↑/↓ over a filtered subset would move an item past cards
    // that are not on screen.
    search.hidden = arranging;
    sortSel.hidden = arranging;
    kindChips.hidden = arranging;

    const q = arranging ? '' : foldFa(search.value);
    let rows = data.items.filter((it) => {
      if (arranging) return true;
      if (kind === 'highlight' && !it.highlight_id) return false;
      if (kind === 'page' && it.highlight_id) return false;
      if (!q) return true;
      return foldFa(it.exact).includes(q) || foldFa(it.note).includes(q) || foldFa(it.title).includes(q);
    });
    // `data.items` already arrives in the board's own display order (manual
    // placement first, then newest), so 'manual'/'recent' need no client sort.
    const sort = arranging ? 'manual' : sortSel.value;
    if (sort === 'oldest') rows = rows.slice().reverse();
    else if (sort === 'source') {
      rows = rows.slice().sort((a, b) => String(a.title).localeCompare(String(b.title), 'fa'));
    }

    countLine.replaceChildren(
      el('b', {}, faNum(rows.length)),
      document.createTextNode(rows.length === data.items.length
        ? ' مورد' : ' از ' + faNum(data.items.length) + ' مورد'),
    );

    if (!rows.length) {
      grid.replaceChildren(el('div', { class: 'dcp-empty' }, 'موردی با این فیلترها پیدا نشد.'));
      return;
    }
    grid.classList.toggle('is-arranging', arranging);
    grid.replaceChildren(...rows.map((item, i) => pinCard(item, id, {
      onRemove: removeItem,
      onChanged: () => renderItems(),
      arrange: arranging
        ? { index: i, total: rows.length, move: (delta) => moveItem(item.id, delta) }
        : null,
    })));
  }
  search.addEventListener('input', renderItems);
  sortSel.addEventListener('change', renderItems);
  renderItems();

  container.replaceChildren(head, tools, grid);
}
