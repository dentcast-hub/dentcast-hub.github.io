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
import { api, currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { FOLDER_EN } from './content-index.js';
import { PALETTE } from './config.js';

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

/** A board's cover: a small collage of up to 3 of its items (Pinterest's own board-cover shape). */
export function boardCover(preview) {
  const cover = el('div', { class: 'dcp-cl-cover dcp-cl-cover-' + Math.min(preview.length, 3) });
  if (!preview.length) { cover.appendChild(el('span', { class: 'dcp-cl-cover-empty' }, '🗂')); return cover; }
  preview.slice(0, 3).forEach((p) => cover.appendChild(coverTile(p)));
  return cover;
}

// --- bottom sheet (Pinterest's own "save to board" shape, localized) -------
let sheetOverlay = null;
function closeSheet() {
  if (!sheetOverlay) return;
  const { overlay, sheet } = sheetOverlay;
  overlay.classList.remove('is-open');
  sheet.classList.remove('is-open');
  document.removeEventListener('keydown', onSheetKey);
  setTimeout(() => overlay.remove(), 300);
  sheetOverlay = null;
}
function onSheetKey(e) { if (e.key === 'Escape') closeSheet(); }

function openSheet(card) {
  closeSheet();
  const sheet = el('div', { class: 'dcp-sheet', role: 'dialog', 'aria-modal': 'true' }, [
    el('div', { class: 'dcp-sheet-handle' }),
    card,
  ]);
  const overlay = el('div', { class: 'dcp-sheet-overlay', onclick: (e) => { if (e.target === overlay) closeSheet(); } }, [sheet]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onSheetKey);
  sheetOverlay = { overlay, sheet };
  requestAnimationFrame(() => { overlay.classList.add('is-open'); sheet.classList.add('is-open'); });
}

function toast(text) {
  const t = el('div', { class: 'dcp-cl-toast' }, [el('span', { class: 'dcp-cl-toast-check' }, '✓'), el('span', {}, text)]);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-shown'));
  setTimeout(() => { t.classList.remove('is-shown'); setTimeout(() => t.remove(), 300); }, 2400);
}

function gateCard({ title, sub, cta }) {
  return el('div', { class: 'dcp-sheet-card', role: 'dialog', 'aria-label': title }, [
    el('h2', { class: 'dcp-sheet-title' }, title),
    el('p', { class: 'dcp-sheet-sub' }, sub),
    cta,
  ]);
}

function pickerCard(target) {
  const msg = el('div', { class: 'dcp-modal-msg', role: 'status' });
  const list = el('div', { class: 'dcp-cl-picklist' }, el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const newTitle = el('input', { type: 'text', class: 'dcp-input', placeholder: 'اسمِ کالکشنِ جدید', maxlength: '80' });
  const newBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, '+ ساختن');

  async function addTo(collectionId, title) {
    try {
      await api.addToCollection(collectionId, target);
      closeSheet();
      toast('به «' + title + '» اضافه شد');
    } catch (_) {
      msg.textContent = 'افزودن ناموفق بود؛ دوباره تلاش کنید.';
    }
  }

  newBtn.addEventListener('click', async () => {
    const title = newTitle.value.trim();
    if (!title) { msg.textContent = 'یک اسم برای کالکشن بنویس.'; return; }
    newBtn.disabled = true;
    try {
      const { collection } = await api.createCollection(title);
      await addTo(collection.id, collection.title);
    } catch (_) {
      msg.textContent = 'ساختِ کالکشن ناموفق بود؛ دوباره تلاش کنید.';
      newBtn.disabled = false;
    }
  });
  newTitle.addEventListener('keydown', (e) => { if (e.key === 'Enter') newBtn.click(); });

  api.listCollections().then(({ collections }) => {
    if (!collections.length) {
      list.replaceChildren(el('p', { class: 'dcp-cl-pick-empty' }, 'هنوز کالکشنی نساخته‌ای؛ یکی بساز:'));
      return;
    }
    list.replaceChildren(...collections.map((c) => {
      const row = el('button', { class: 'dcp-cl-pick-row', type: 'button' }, [
        boardCover(c.preview),
        el('span', { class: 'dcp-cl-pick-txt' }, [
          el('span', { class: 'dcp-cl-pick-name' }, c.title),
          el('span', { class: 'dcp-cl-pick-count' }, faNum(c.item_count) + ' مورد'),
        ]),
      ]);
      row.addEventListener('click', () => addTo(c.id, c.title));
      return row;
    }));
  }).catch(() => { list.replaceChildren(el('div', { class: 'dcp-empty' }, 'کالکشن‌ها در دسترس نیست.')); });

  // «؟» reveal, same pattern as the homepage promo card's score caption and the
  // workbench's own two collection buttons: hidden by default, toggled inline.
  const cap = el('p', { class: 'dcp-sheet-cap' },
    'کالکشن یعنی یه پوشه‌ی دلخواه که خودت می‌سازی و هرچی خواستی توش می‌ریزی — برای یه امتحان، یه بیمارِ خاص، یا هر موضوعی که خودت بخوای.');
  cap.hidden = true;
  const infoBtn = el('button', { class: 'dcp-wb-info', type: 'button', title: 'کالکشن یعنی چی؟', 'aria-label': 'کالکشن یعنی چی؟' }, '؟');
  infoBtn.addEventListener('click', () => { cap.hidden = !cap.hidden; });

  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-sheet-top' }, [el('h2', { class: 'dcp-sheet-title' }, 'افزودن به کالکشن'), infoBtn]),
    cap,
    list,
    el('div', { class: 'dcp-cl-picknew' }, [newTitle, newBtn]),
    msg,
  ]);
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
      cta: el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان'),
    }));
    return;
  }
  openSheet(pickerCard({ highlight_id: highlightId, content_id: contentId }));
}

// --- masonry "pin" (one saved item inside a board) --------------------------
function pinCard(item, onRemove) {
  const kindLabel = FOLDER_EN[item.type] || item.type;
  const removeBtn = el('button', { class: 'dcp-cl-pin-del', type: 'button', 'aria-label': 'حذف از کالکشن', title: 'حذف' }, '×');

  // A highlight-pin shows the SAME solid pastel the article's own mark.dcp-hl
  // uses (never flattened to plain text); a page-pin gets its type color + icon.
  const band = item.exact
    ? el('div', { class: 'dcp-cl-pin-band' }, [
        el('mark', { class: 'dcp-hl' + (item.underline ? ' dcp-underline' : ''), 'data-color': item.color || '' }, item.exact),
      ])
    : el('div', { class: 'dcp-cl-pin-band dcp-cl-pin-page', style: 'background:' + (TYPE_COVER_COLOR[item.type] || '#8aaac8') }, [
        el('span', { class: 'dcp-cl-pin-ico' }, TYPE_ICON[item.type] || '📄'),
        el('span', {}, item.title),
      ]);

  // A highlight-pin links to the highlight itself (?dcphl= — plus.js opens the
  // workbench and scrolls to it); a page-pin links to the page.
  const href = item.highlight_id
    ? item.url + (item.url.includes('?') ? '&' : '?') + 'dcphl=' + encodeURIComponent(item.highlight_id)
    : item.url;
  const pin = el('div', { class: 'dcp-cl-pin' }, [
    removeBtn,
    el('a', { class: 'dcp-cl-pin-link', href }, [band, el('div', { class: 'dcp-cl-pin-foot' }, el('span', { dir: 'ltr' }, kindLabel))]),
  ]);
  removeBtn.addEventListener('click', async () => {
    removeBtn.disabled = true;
    try { await onRemove(item.id); pin.remove(); } catch (_) { removeBtn.disabled = false; }
  });
  return pin;
}

/** GET /plus/collections.html — every collection as a Pinterest-style board grid. */
export async function renderCollectionsList(container) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const data = await api.listCollections().catch(() => null);
  if (!data) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'کالکشن‌ها در دسترس نیست.')); return; }

  const top = el('div', { class: 'dcp-pw-top' }, [
    el('h2', { class: 'dcp-pw-heading' }, 'کالکشن‌ها'),
    el('p', { class: 'dcp-sec-hint' },
      'هایلایت‌ها یا کلِ یه مقاله/اپیزود رو تو پوشه‌های دلخواهِ خودت بریز — برای یه امتحان، یه بیمارِ خاص، یا هر موضوعی که خودت بخوای؛ برخلافِ آرشیوِ موضوعی، این چیدمان کاملاً دستِ خودته.'),
  ]);

  const titleInput = el('input', { type: 'text', class: 'dcp-input', placeholder: 'اسمِ کالکشنِ جدید', maxlength: '80' });
  const createBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, '+ کالکشنِ جدید');
  const createRow = el('div', { class: 'dcp-cl-picknew' }, [titleInput, createBtn]);

  const grid = el('div', { class: 'dcp-cl-board-grid' });

  function renderGrid(collections) {
    if (!collections.length) {
      grid.replaceChildren(el('div', { class: 'dcp-empty' }, [
        el('p', {}, 'هنوز کالکشنی نساختی.'),
        el('p', { class: 'dcp-muted' }, 'یکی بساز و از میزکار یا هایلایت‌های اخیرِ داشبورد چیزی بهش اضافه کن.'),
      ]));
      return;
    }
    grid.replaceChildren(...collections.map((c) => el('a', { class: 'dcp-cl-board', href: '/plus/collection.html?id=' + encodeURIComponent(c.id) }, [
      boardCover(c.preview),
      el('div', { class: 'dcp-cl-board-meta' }, [
        el('p', { class: 'dcp-cl-board-title' }, c.title),
        el('p', { class: 'dcp-cl-board-count' }, faNum(c.item_count) + ' مورد'),
      ]),
    ])));
  }
  renderGrid(data.collections);

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

  container.replaceChildren(top, createRow, grid);
}

/** GET /plus/collection.html?id=... — one board's masonry pin grid, rename/delete. */
export async function renderCollectionDetail(container, id) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const data = await api.getCollection(id).catch(() => null);
  if (!data) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'این کالکشن پیدا نشد.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/collections.html' }, 'بازگشت به کالکشن‌ها'),
    ]));
    return;
  }

  const titleEl = el('h2', { class: 'dcp-pw-detail-title' }, data.title);
  const renameBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'تغییرِ نام');
  const deleteBtn = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, 'حذفِ کالکشن');
  const titleWrap = el('div', { class: 'dcp-cl-title-wrap' }, [titleEl]);
  const actionsRow = el('div', { class: 'dcp-cl-detail-actions' }, [renameBtn, deleteBtn]);

  // Rename: swap the title for an inline input+save+cancel row (profile.js's
  // pseudonym-field pattern), never a native prompt().
  renameBtn.addEventListener('click', () => {
    if (titleWrap.querySelector('.dcp-field-row')) return;
    const input = el('input', { class: 'dcp-input', value: data.title, maxlength: '80' });
    const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ذخیره');
    const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
    const row = el('div', { class: 'dcp-field-row' }, [input, save, cancel]);
    cancel.onclick = () => row.remove();
    save.onclick = async () => {
      const next = input.value.trim();
      if (!next) return;
      save.disabled = true;
      try {
        const { collection } = await api.renameCollection(id, next);
        titleEl.textContent = collection.title;
        data.title = collection.title;
        row.remove();
      } catch (_) { save.disabled = false; }
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save.click(); });
    titleWrap.appendChild(row);
    input.focus();
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

  const head = el('div', { class: 'dcp-pw-detail-head' }, [
    el('div', { class: 'dcp-cl-detail-top' }, [titleWrap, actionsRow]),
  ]);

  const grid = el('div', { class: 'dcp-cl-pin-grid' });
  function renderItems() {
    if (!data.items.length) {
      grid.replaceChildren(el('div', { class: 'dcp-empty' }, 'این کالکشن هنوز خالیه؛ از میزکارِ یه مقاله یا هایلایت‌های اخیرِ داشبورد چیزی بهش اضافه کن.'));
      return;
    }
    grid.replaceChildren(...data.items.map((item) => pinCard(item, async (itemId) => {
      await api.removeCollectionItem(id, itemId);
      data.items = data.items.filter((i) => i.id !== itemId);
      if (!data.items.length) renderItems();
    })));
  }
  renderItems();

  container.replaceChildren(head, grid);
}
