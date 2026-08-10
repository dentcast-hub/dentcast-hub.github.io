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
import { openSheet, closeSheet, gateCard } from './sheet.js';
import { premiumCta } from './premium-cta.js';
import { api, currentUser, apiBase } from './api.js';
import { openLoginModal } from './login-modal.js';
import { FOLDER_EN } from './content-index.js';
import { PALETTE } from './config.js';
import {
  foldFa, highlightHref, hlMark, noteBlock, labelChip, actionBtn, asText,
  copyToClipboard, toast, skeleton, confirmStrip, inlineEditor,
  kindChip, snippetInlineEditor, looksLatin,
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
// A snippet pin (text/reference) has no highlight colour and no content type —
// its cover tile borrows the same accent its card uses, so a board's collage
// stays legible the moment its first «متن خودم»/«رفرنس» pin lands.
const SNIPPET_COVER_COLOR = { text: 'var(--dcp-gold)', reference: 'var(--dcp-ref)' };
const SNIPPET_COVER_ICON = { text: '✍️', reference: '🔗' };
const coverColorOf = (p) => (
  p.kind === 'highlight' ? hlColorCss(p.color)
    : SNIPPET_COVER_COLOR[p.kind] || TYPE_COVER_COLOR[p.type] || '#8aaac8'
);

function coverTile(p) {
  if (p.kind === 'highlight') return el('span', { class: 'dcp-cl-cover-tile', style: 'background:' + coverColorOf(p) });
  return el('span', {
    class: 'dcp-cl-cover-tile dcp-cl-cover-tile-page', style: 'background:' + coverColorOf(p),
  }, SNIPPET_COVER_ICON[p.kind] || TYPE_ICON[p.type] || '📄');
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
      const target = item.snippet_id ? { snippet_id: item.snippet_id }
        : item.highlight_id ? { highlight_id: item.highlight_id }
          : { content_id: item.content_id };
      await api.addToCollection(c.id, target);
      await removeFromHere(item.id);
    },
  }));
}

/**
 * The «خروجی» sheet: a Word handout or a slide skeleton, in the board's own
 * چیدمانِ دستی order. pptx passed the handoff §4.3 gate on 2026-08-10: the
 * founder opened a mixed fa/en deck and ruled the letters/word order intact
 * («حروف به هم نریختن») — the one known blemish is that GOOGLE's viewers
 * ignore the per-paragraph rtl flag (bullets render on the left there), which
 * real PowerPoint honors, and was judged not worth pulling the feature over.
 *
 * A plain navigation (not fetch+blob): the session cookie rides along on the
 * cross-origin GET the same way any other API call does (SameSite=None in
 * prod), and the browser's own download UI takes it from there — there is no
 * download-complete event to hook, so the sheet just closes on click.
 */
function exportSheetCard(collectionId, itemCount) {
  function formatOption(format, ico, icoClass, name, desc) {
    const opt = el('button', { class: 'dcp-cl-addopt', type: 'button' }, [
      el('span', { class: 'dcp-cl-addopt-ico ' + icoClass }, ico),
      el('span', { class: 'dcp-cl-addopt-txt' }, [el('b', {}, name), el('small', {}, desc)]),
    ]);
    opt.addEventListener('click', async () => {
      toast('در حال آماده شدن…');
      const base = await apiBase();
      location.href = base + '/collections/' + encodeURIComponent(collectionId) + '/export?format=' + format;
      closeSheet();
    });
    return opt;
  }

  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-sheet-top' }, [el('h2', { class: 'dcp-sheet-title' }, '⬇ خروجی از این برد')]),
    el('p', { class: 'dcp-sheet-sub' }, faNum(itemCount) + ' پین، به همان ترتیبی که چیده‌اید.'),
    formatOption('docx', '📄', 'blue', 'جزوه‌ی Word (docx)',
      'هایلایت‌ها با یادداشت‌هایشان، متن‌های خودتان، و فهرست منابع در انتها — آماده‌ی ویرایش.'),
    formatOption('pptx', '🎞', 'gold', 'اسکلت اسلاید (pptx)',
      'هر پین یک اسلاید: تیتر + متن. طراحی و عکس با خودتان — ساختار با ما.'),
    el('div', { class: 'dcp-cl-order-note' }, [
      el('span', { 'aria-hidden': 'true' }, '⇅'),
      el('span', {}, 'ترتیب خروجی = چیدمانِ دستی برد. قبل از خروجی، برد را همان‌طور بچینید که می‌خواهید ارائه پیش برود.'),
    ]),
  ]);
}

/**
 * The «افزودن پین» chooser: what kind of thing gets added to this board.
 * «هایلایت» stays disabled here — that path is unchanged (select text inside
 * an article, «افزودن به کالکشن»); this sheet is only for the kinds a board
 * can originate itself.
 */
function addPinChooserCard(collectionId, { onAdded }) {
  const noteOpt = el('button', { class: 'dcp-cl-addopt', type: 'button' }, [
    el('span', { class: 'dcp-cl-addopt-ico gold' }, '✍️'),
    el('span', { class: 'dcp-cl-addopt-txt' }, [
      el('b', {}, ['متن خودم', el('span', { class: 'dcp-cl-addopt-tag' }, 'جدید')]),
      el('small', {}, 'هر متنی که می‌خواهید — جمع‌بندی، نکته‌ی کلاس، پاراگرافی از هر جا. مثل هایلایت‌ها قابل پین به چند برد.'),
    ]),
  ]);
  noteOpt.addEventListener('click', () => openSheet(noteComposerCard(collectionId, { onAdded })));

  const refOpt = el('button', { class: 'dcp-cl-addopt', type: 'button' }, [
    el('span', { class: 'dcp-cl-addopt-ico ref' }, '🔗'),
    el('span', { class: 'dcp-cl-addopt-txt' }, [
      el('b', {}, ['رفرنس', el('span', { class: 'dcp-cl-addopt-tag' }, 'جدید')]),
      el('small', {}, 'با DOI یا لینک PubMed مشخصات مقاله خودکار می‌آید؛ مقاله‌ی فارسی و بدون DOI را هم دستی وارد کنید.'),
    ]),
  ]);
  refOpt.addEventListener('click', () => openSheet(referenceComposerCard(collectionId, { onAdded })));

  const hlOpt = el('button', { class: 'dcp-cl-addopt', type: 'button', disabled: '' }, [
    el('span', { class: 'dcp-cl-addopt-ico blue' }, '🖍'),
    el('span', { class: 'dcp-cl-addopt-txt' }, [
      el('b', {}, 'هایلایت'),
      el('small', {}, 'از داخل مقاله: متن را انتخاب کنید و «افزودن به کالکشن» را بزنید — همان مسیر فعلی.'),
    ]),
  ]);

  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-sheet-top' }, [el('h2', { class: 'dcp-sheet-title' }, 'چه چیزی به این برد اضافه شود؟')]),
    el('p', { class: 'dcp-sheet-sub' }, 'هایلایت‌ها مثل همیشه از داخل خود مقاله اضافه می‌شوند.'),
    noteOpt,
    refOpt,
    hlOpt,
  ]);
}

/** The «متن خودم» composer: title (optional) + body, pinned to the board on save. */
function noteComposerCard(collectionId, { onAdded }) {
  const titleInput = el('input', {
    type: 'text', class: 'dcp-input', maxlength: '200',
    placeholder: 'مثلاً: نکته‌ی بحث پایانی', 'aria-label': 'عنوان (اختیاری)',
  });
  const ta = el('textarea', {
    class: 'dcp-hlib-ta', rows: '6', maxlength: '10000',
    placeholder: 'بنویسید یا پیست کنید…', 'aria-label': 'متن',
  });
  const MAX = 10000;
  const count = el('p', { class: 'dcp-cl-note-count' }, faNum(0) + ' / ' + faNum(MAX) + ' حرف');
  ta.addEventListener('input', () => { count.textContent = faNum(ta.value.length) + ' / ' + faNum(MAX) + ' حرف'; });

  const msg = el('span', { class: 'dcp-hlib-msg', role: 'status' });
  const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'پین کن');
  const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
  cancel.addEventListener('click', () => closeSheet());

  save.addEventListener('click', async () => {
    const body = ta.value.trim();
    if (!body) { msg.textContent = 'متن خالی است.'; return; }
    save.disabled = true;
    msg.textContent = '';
    try {
      const { item } = await api.createSnippet(collectionId, { kind: 'text', title: titleInput.value.trim() || undefined, body });
      closeSheet();
      onAdded(item);
      toast('پین شد ✓');
    } catch (_) {
      save.disabled = false;
      msg.textContent = 'ذخیره نشد؛ دوباره تلاش کن.';
    }
  });

  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-sheet-top' }, [el('h2', { class: 'dcp-sheet-title' }, '✍️ متن خودم')]),
    el('label', { class: 'dcp-editor-label' }, 'عنوان (اختیاری)'),
    titleInput,
    el('label', { class: 'dcp-editor-label' }, 'متن'),
    ta,
    count,
    el('div', { class: 'dcp-hlib-erow dcp-hlib-esave' }, [cancel, save, msg]),
  ]);
}

// A bare DOI, stripped of an optional doi.org URL prefix (the API also does
// this server-side; stripping here too means the preview shows the same DOI
// that will be stored).
function normalizeDoi(raw) {
  return String(raw || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
}

// Crossref's `author` array -> "Family G, et al." (mockup's own format).
function firstAuthorLine(authors) {
  if (!Array.isArray(authors) || !authors.length) return null;
  const a = authors[0];
  const name = [a.family, a.given ? a.given[0] : null].filter(Boolean).join(' ');
  if (!name) return null;
  return name + (authors.length > 1 ? ', et al.' : '');
}

/**
 * The «رفرنس» composer: DOI in, bibliographic fields out — fetched from
 * Crossref IN THE BROWSER (api.crossref.org is CORS-open; the API never sees
 * or fetches this, since the container's international egress is
 * unreliable). «مشخصات را خودم می‌نویسم» is always available, not only on a
 * failed fetch — Persian journals mostly have no DOI to look up.
 */
function referenceComposerCard(collectionId, { onAdded }) {
  const doiInput = el('input', {
    type: 'text', dir: 'ltr', class: 'dcp-input', maxlength: '300',
    placeholder: '10.xxxx/xxxxx', 'aria-label': 'DOI یا لینک',
  });
  const fetchBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'دریافت مشخصات');
  const doiRow = el('div', { class: 'dcp-cl-doi-row' }, [doiInput, fetchBtn]);

  const fetchState = el('p', { class: 'dcp-cl-fetch-state' }, '⏳ در حال پرس‌وجو از Crossref…');
  fetchState.hidden = true;
  const previewTitle = el('h3', { class: 'dcp-cl-ref-title' });
  const previewMeta = el('p', { class: 'dcp-cl-ref-meta' });
  const preview = el('div', { class: 'dcp-cl-ref-preview' }, [
    el('p', { class: 'dcp-cl-ref-preview-ok' }, '✓ پیدا شد'),
    previewTitle,
    previewMeta,
  ]);
  preview.hidden = true;
  const errMsg = el('p', { class: 'dcp-hlib-msg' });
  errMsg.hidden = true;

  const manualTitle = el('input', { type: 'text', class: 'dcp-input', maxlength: '200', placeholder: 'عنوان کامل', 'aria-label': 'عنوان مقاله' });
  const manualAuthors = el('input', { type: 'text', class: 'dcp-input', maxlength: '300', placeholder: 'نویسنده‌ی اول و همکاران', 'aria-label': 'نویسندگان' });
  const manualVenue = el('input', {
    type: 'text', class: 'dcp-input', maxlength: '200',
    placeholder: 'مثلاً: مجله دندانپزشکی مشهد — ۱۴۰۲', 'aria-label': 'مجله / سال',
  });
  const manualFields = el('div', { class: 'dcp-cl-ref-manual' }, [
    el('label', { class: 'dcp-editor-label' }, 'عنوان مقاله'), manualTitle,
    el('label', { class: 'dcp-editor-label' }, 'نویسندگان'), manualAuthors,
    el('label', { class: 'dcp-editor-label' }, 'مجله / سال'), manualVenue,
  ]);
  manualFields.hidden = true;
  const manualToggle = el('button', { class: 'dcp-cl-manual-toggle', type: 'button' },
    'مقاله DOI ندارد؟ مشخصات را خودم می‌نویسم');

  const msg = el('span', { class: 'dcp-hlib-msg', role: 'status' });
  const addBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', disabled: '' }, 'افزودن به برد');
  const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
  cancel.addEventListener('click', () => closeSheet());

  let fetched = null; // { title, authors, venue, year, doi } once a DOI resolves
  function refreshAddEnabled() {
    addBtn.disabled = !(fetched || (!manualFields.hidden && manualTitle.value.trim()));
  }

  manualToggle.addEventListener('click', () => { manualFields.hidden = !manualFields.hidden; refreshAddEnabled(); });
  manualTitle.addEventListener('input', refreshAddEnabled);

  fetchBtn.addEventListener('click', async () => {
    const doi = normalizeDoi(doiInput.value);
    if (!doi) return;
    preview.hidden = true;
    errMsg.hidden = true;
    fetchState.hidden = false;
    fetchBtn.disabled = true;
    fetched = null;
    try {
      const res = await fetch('https://api.crossref.org/works/' + encodeURIComponent(doi));
      if (!res.ok) throw new Error('crossref_not_found');
      const data = await res.json();
      const m = data && data.message;
      const title = m && m.title && m.title[0];
      if (!title) throw new Error('crossref_no_title');
      fetched = {
        title,
        authors: firstAuthorLine(m.author),
        venue: (m['container-title'] && m['container-title'][0]) || null,
        year: (m.issued && m.issued['date-parts'] && m.issued['date-parts'][0] && m.issued['date-parts'][0][0]) || null,
        doi: m.DOI || doi,
      };
      previewTitle.textContent = fetched.title;
      previewTitle.classList.toggle('dcp-cl-ref-en', looksLatin(fetched.title));
      previewTitle.dir = looksLatin(fetched.title) ? 'ltr' : null;
      previewMeta.textContent = [fetched.authors, [fetched.venue, fetched.year].filter(Boolean).join(', ')]
        .filter(Boolean).join(' — ');
      previewMeta.classList.toggle('dcp-cl-ref-en', looksLatin(previewMeta.textContent));
      preview.hidden = false;
    } catch (_) {
      errMsg.textContent = 'مشخصات پیدا نشد؛ می‌توانید دستی وارد کنید.';
      errMsg.hidden = false;
      manualFields.hidden = false;
    } finally {
      fetchState.hidden = true;
      fetchBtn.disabled = false;
      refreshAddEnabled();
    }
  });

  addBtn.addEventListener('click', async () => {
    const payload = fetched
      ? {
        kind: 'reference', title: fetched.title, authors: fetched.authors || undefined,
        venue: fetched.venue || undefined, year: fetched.year || undefined, doi: fetched.doi,
      }
      : {
        kind: 'reference', title: manualTitle.value.trim(),
        authors: manualAuthors.value.trim() || undefined, venue: manualVenue.value.trim() || undefined,
      };
    if (!payload.title) return;
    addBtn.disabled = true;
    msg.textContent = '';
    try {
      const { item } = await api.createSnippet(collectionId, payload);
      closeSheet();
      onAdded(item);
      toast('رفرنس پین شد ✓');
    } catch (_) {
      addBtn.disabled = false;
      msg.textContent = 'ذخیره نشد؛ دوباره تلاش کن.';
    }
  });

  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-sheet-top' }, [el('h2', { class: 'dcp-sheet-title' }, '🔗 رفرنس')]),
    el('p', { class: 'dcp-sheet-sub' }, 'DOI یا لینک PubMed را بدهید؛ مشخصات از مرورگر خودتان گرفته می‌شود.'),
    el('label', { class: 'dcp-editor-label' }, 'DOI یا لینک'),
    doiRow,
    fetchState,
    preview,
    errMsg,
    manualToggle,
    manualFields,
    el('div', { class: 'dcp-hlib-erow dcp-hlib-esave' }, [cancel, addBtn, msg]),
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
  const pinKindClass = item.kind === 'text' ? ' dcp-cl-pin-note' : item.kind === 'reference' ? ' dcp-cl-pin-ref' : '';
  const pin = el('div', { class: 'dcp-cl-pin' + pinKindClass });

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

  // Shared by every kind: انتقال is always the same "add there, remove here"
  // flow, and حذف is always the same inline confirm — never a native confirm().
  function moveAction() {
    return actionBtn('انتقال', {
      title: 'انتقال به کالکشنِ دیگر',
      onClick: () => openCollectionMove(item, collectionId, onRemove),
    });
  }
  function deleteAction() {
    return actionBtn('حذف', {
      danger: true,
      onClick: () => {
        if (pin.querySelector('.dcp-recent-confirm')) return;
        pin.appendChild(confirmStrip('از این کالکشن حذف شود؟', async () => {
          await onRemove(item.id);
          toast('از کالکشن حذف شد');
        }));
      },
    });
  }

  function paintNote() {
    const body = el('div', { class: 'dcp-cl-pin-body' }, [
      kindChip('text'),
      item.title ? el('h3', { class: 'dcp-cl-pin-note-title' }, item.title) : null,
      el('p', { class: 'dcp-cl-pin-note-body' }, item.body),
    ].filter(Boolean));

    const actions = [
      actionBtn('✎ ویرایش', {
        onClick: () => {
          if (pin.querySelector('.dcp-hlib-editor')) return;
          pin.appendChild(snippetInlineEditor({ id: item.snippet_id, title: item.title, body: item.body }, {
            onSaved: (updated) => {
              Object.assign(item, { title: updated.title, body: updated.body });
              paint();
              if (onChanged) onChanged(item);
            },
          }));
        },
      }),
      actionBtn('کپی', {
        onClick: (e) => copyToClipboard(item.title ? item.title + '\n' + item.body : item.body, e.currentTarget),
      }),
      moveAction(),
      deleteAction(),
    ];

    pin.replaceChildren(body, arrange ? arrangeBar() : el('div', { class: 'dcp-hlib-actions dcp-cl-pin-actions' }, actions));
  }

  // "Authors. Title. Venue; Year. doi:DOI" — the same Vancouver-ish shape the
  // server's docx export builds for the «منابع» list (handoff §4.2), so
  // copying one citation here reads identically to the exported one.
  // «Breschi L, et al.» already ends in its own period — appending another
  // blindly would double it, so every field's terminator checks first.
  function withDot(s, sep = '.') {
    return /[.!?]$/.test(s) ? s : s + sep;
  }
  function vancouverCitation() {
    const parts = [];
    if (item.authors) parts.push(withDot(item.authors));
    parts.push(withDot(item.title));
    if (item.venue) parts.push(withDot(item.venue, item.year ? ';' : '.'));
    if (item.year) parts.push(item.year + '.');
    if (item.doi) parts.push('doi:' + item.doi);
    return parts.join(' ');
  }

  function paintReference() {
    const latinTitle = looksLatin(item.title);
    const metaText = [item.authors, [item.venue, item.year].filter(Boolean).join(', ')].filter(Boolean).join(' — ');
    const body = el('div', { class: 'dcp-cl-pin-body' }, [
      kindChip('reference'),
      el('h3', { class: 'dcp-cl-ref-title' + (latinTitle ? ' dcp-cl-ref-en' : ''), dir: latinTitle ? 'ltr' : null }, item.title),
      metaText ? el('p', {
        class: 'dcp-cl-ref-meta' + (looksLatin(metaText) ? ' dcp-cl-ref-en' : ''),
        dir: looksLatin(metaText) ? 'ltr' : null,
      }, metaText) : null,
      item.doi ? el('a', {
        class: 'dcp-cl-doi', href: 'https://doi.org/' + item.doi, target: '_blank', rel: 'noopener',
      }, 'doi:' + item.doi) : null,
      noteBlock(item.body),
    ].filter(Boolean));

    const actions = [
      actionBtn('کپی استناد', {
        onClick: (e) => copyToClipboard(vancouverCitation(), e.currentTarget, 'استناد کپی شد ✓'),
      }),
      moveAction(),
      deleteAction(),
    ];

    pin.replaceChildren(body, arrange ? arrangeBar() : el('div', { class: 'dcp-hlib-actions dcp-cl-pin-actions' }, actions));
  }

  function paint() {
    // A snippet pin (text/reference) has no content page and no highlight
    // fields — a wholly different shape from the highlight/page pin below.
    if (item.kind === 'text') { paintNote(); return; }
    if (item.kind === 'reference') { paintReference(); return; }

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
    actions.push(moveAction());
    // A highlight-item opens ON its highlight (?dcphl=); a page-item opens the page.
    actions.push(actionBtn(item.highlight_id ? 'متنِ مقاله ›' : 'بازکردن ›', {
      href: highlightHref(item.url, item.highlight_id),
    }));
    actions.push(deleteAction());

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
  const addPinBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, '+ افزودن پین');
  addPinBtn.addEventListener('click', () => openSheet(addPinChooserCard(id, {
    onAdded: (item) => {
      data.items = [item, ...data.items];
      renderItems();
    },
  })));
  const exportBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, '⬇ خروجی');
  exportBtn.addEventListener('click', () => openSheet(exportSheetCard(id, data.items.length)));
  const editBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'ویرایشِ کالکشن');
  const deleteBtn = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, 'حذفِ کالکشن');
  const titleWrap = el('div', { class: 'dcp-cl-title-wrap' }, [titleEl, descEl]);
  const actionsRow = el('div', { class: 'dcp-cl-detail-actions' }, [addPinBtn, exportBtn, editBtn, deleteBtn]);

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
  const KINDS = [
    { key: '', fa: 'همه' }, { key: 'highlight', fa: 'هایلایت‌ها' }, { key: 'page', fa: 'صفحه‌ها' },
    { key: 'text', fa: 'متن من' }, { key: 'reference', fa: 'رفرنس' },
  ];
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

    const counts = { '': data.items.length, highlight: 0, page: 0, text: 0, reference: 0 };
    for (const it of data.items) counts[it.kind] = (counts[it.kind] || 0) + 1;
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
      if (kind && it.kind !== kind) return false;
      if (!q) return true;
      return foldFa(it.exact).includes(q) || foldFa(it.note).includes(q)
        || foldFa(it.title).includes(q) || foldFa(it.body).includes(q);
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
