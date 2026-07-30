// Collections (Phase 3): user-made freeform folders. Unlike a pathway
// (founder-curated) or a topic archive (auto-grouped by the site's own
// taxonomy), a collection is entirely the user's own — any mix of their own
// highlights AND whole pages, regardless of pillar/pathway/topic. This module
// is shared by /plus/collections.html, /plus/collection.html, the workbench's
// «🗂 کالکشن» button, and the dashboard's recent-highlights rows.
import { el, faNum } from './util.js';
import { api, currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { FOLDER_EN } from './content-index.js';

let overlay = null;
function closeOverlay() {
  if (overlay) { overlay.remove(); overlay = null; }
  document.removeEventListener('keydown', onKey);
}
function onKey(e) { if (e.key === 'Escape') closeOverlay(); }

function openOverlay(card) {
  closeOverlay();
  overlay = el('div', {
    class: 'dcp-modal-overlay',
    onclick: (e) => { if (e.target === overlay) closeOverlay(); },
  }, [card]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onKey);
}

function gateCard({ title, sub, cta }) {
  return el('div', { class: 'dcp-modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
    el('button', { class: 'dcp-modal-close', type: 'button', 'aria-label': 'بستن', onclick: closeOverlay }, '×'),
    el('h2', { class: 'dcp-modal-title' }, title),
    el('p', { class: 'dcp-modal-sub' }, sub),
    cta,
  ]);
}

function pickerCard(target) {
  const msg = el('div', { class: 'dcp-modal-msg', role: 'status' });
  const list = el('div', { class: 'dcp-cl-picklist' }, el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const newTitle = el('input', { type: 'text', class: 'dcp-input', placeholder: 'اسمِ کالکشنِ جدید', maxlength: '80' });
  const newBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, '+ ساختن و افزودن');

  async function addTo(collectionId, rowEl) {
    msg.textContent = '';
    try {
      await api.addToCollection(collectionId, target);
      rowEl && rowEl.classList.add('is-added');
      msg.textContent = 'افزوده شد ✓';
      setTimeout(closeOverlay, 700);
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
      await addTo(collection.id);
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
        el('span', {}, c.title),
        el('span', { class: 'dcp-cl-pick-count' }, faNum(c.item_count) + ' مورد'),
      ]);
      row.addEventListener('click', () => addTo(c.id, row));
      return row;
    }));
  }).catch(() => { list.replaceChildren(el('div', { class: 'dcp-empty' }, 'کالکشن‌ها در دسترس نیست.')); });

  return el('div', { class: 'dcp-modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'افزودن به کالکشن' }, [
    el('button', { class: 'dcp-modal-close', type: 'button', 'aria-label': 'بستن', onclick: closeOverlay }, '×'),
    el('h2', { class: 'dcp-modal-title' }, 'افزودن به کالکشن'),
    el('p', { class: 'dcp-modal-sub' }, 'کالکشن یعنی یه پوشه‌ی دلخواه که خودت می‌سازی و هرچی خواستی توش می‌ریزی — برای یه امتحان، یه بیمارِ خاص، یا هر موضوعی که خودت بخوای.'),
    list,
    el('div', { class: 'dcp-cl-picknew' }, [newTitle, newBtn]),
    msg,
  ]);
}

/**
 * Open the "add to collection" flow for one item: a highlight (`highlightId`)
 * or a whole page (`contentId`) — pass exactly one. Handles all three states
 * itself (anon -> login, free -> premium upsell, premium -> the real picker),
 * so every call site (workbench button, dashboard row button) behaves
 * identically without repeating the gate logic.
 */
export async function openCollectionPicker({ highlightId, contentId } = {}) {
  const user = await currentUser();
  if (!user) {
    const res = await openLoginModal({ returnTo: location.pathname + location.search });
    if (!res || !res.user) return;
    return openCollectionPicker({ highlightId, contentId });
  }
  if (user.tier !== 'premium') {
    openOverlay(gateCard({
      title: 'کالکشن‌ها ویژه‌ی پریمیوم است',
      sub: 'هایلایت‌ها و مطالعه‌ی شما همین حالا هم ثبت می‌شود؛ با پریمیوم، می‌توانید آن‌ها را در پوشه‌های دلخواهِ خودتان دسته‌بندی کنید.',
      cta: el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان'),
    }));
    return;
  }
  openOverlay(pickerCard({ highlight_id: highlightId, content_id: contentId }));
}

function itemRow(item, onRemove) {
  const kindLabel = FOLDER_EN[item.type] || item.type;
  const removeBtn = el('button', { class: 'dcp-cl-item-del', type: 'button', 'aria-label': 'حذف از کالکشن', title: 'حذف' }, '×');
  // A highlight-item's text shows exactly like it does in the article/review
  // card (the same mark.dcp-hl[data-color]) - never flattened to plain text.
  const body = item.exact
    ? el('p', { class: 'dcp-cl-item-text' },
        el('mark', { class: 'dcp-hl' + (item.underline ? ' dcp-underline' : ''), 'data-color': item.color || '' }, item.exact))
    : el('p', { class: 'dcp-cl-item-text is-page' }, item.title);

  const row = el('div', { class: 'dcp-cl-item' }, [
    el('a', { class: 'dcp-cl-item-link', href: item.url }, [
      el('span', { class: 'dcp-cl-item-kind', dir: 'ltr' }, kindLabel),
      body,
    ]),
    removeBtn,
  ]);
  removeBtn.addEventListener('click', async () => {
    removeBtn.disabled = true;
    try { await onRemove(item.id); row.remove(); } catch (_) { removeBtn.disabled = false; }
  });
  return row;
}

/** GET /plus/collections.html — every collection the user made, with a quick "+ new". */
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

  const grid = el('div', { class: 'dcp-pw-grid' });

  function renderGrid(collections) {
    if (!collections.length) {
      grid.replaceChildren(el('div', { class: 'dcp-empty' }, [
        el('p', {}, 'هنوز کالکشنی نساختی.'),
        el('p', { class: 'dcp-muted' }, 'یکی بساز و از میزکار یا هایلایت‌های اخیرِ داشبورد چیزی بهش اضافه کن.'),
      ]));
      return;
    }
    grid.replaceChildren(...collections.map((c) => el('a', { class: 'dcp-pw-card', href: '/plus/collection.html?id=' + encodeURIComponent(c.id) }, [
      el('div', { class: 'dcp-pw-card-top' }, [el('h3', { class: 'dcp-pw-card-title' }, c.title)]),
      el('div', { class: 'dcp-pw-card-foot' }, [el('span', {}, faNum(c.item_count) + ' مورد')]),
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
      const fresh = await api.listCollections();
      renderGrid(fresh.collections);
      location.href = '/plus/collection.html?id=' + encodeURIComponent(collection.id);
    } finally { createBtn.disabled = false; }
  });
  titleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') createBtn.click(); });

  container.replaceChildren(top, createRow, grid);
}

/** GET /plus/collection.html?id=... — one collection's items, rename/delete. */
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

  const list = el('div', { class: 'dcp-cl-items' });
  function renderItems() {
    if (!data.items.length) {
      list.replaceChildren(el('div', { class: 'dcp-empty' }, 'این کالکشن هنوز خالیه؛ از میزکارِ یه مقاله یا هایلایت‌های اخیرِ داشبورد چیزی بهش اضافه کن.'));
      return;
    }
    list.replaceChildren(...data.items.map((item) => itemRow(item, async (itemId) => {
      await api.removeCollectionItem(id, itemId);
      data.items = data.items.filter((i) => i.id !== itemId);
      if (!data.items.length) renderItems();
    })));
  }
  renderItems();

  container.replaceChildren(head, list);
}
