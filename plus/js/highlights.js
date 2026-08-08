// Premium «دفترچه‌ی هایلایت‌ها» — every highlight the user owns, readable,
// searchable and editable in one place.
//
// Why this exists (user report, 2026-08-05): a reader who had highlighted a few
// points across dozens of articles could not review them. The dashboard's
// «هایلایت‌های اخیر» showed six rows, and every row was a LINK — clicking it
// threw you back into the article, where the highlights only appear after you
// press «میز کار» again. So the notes existed but were unreachable.
//
// Four rules follow from that, and they are what the layout enforces:
//   1. A highlight is a CARD, not a link. Its full text and its note are the
//      content of the row; reading happens here.
//   2. Editing happens here too — note, label and colour, without reopening the
//      article. Review is exactly when you want to fix a note.
//   3. When you DO go to the article, you land on the highlight itself: every
//      article link carries ?dcphl=<id> (plus.js opens the workbench and
//      scrolls to the mark).
//   4. Every filter lives in the URL, so a filtered view survives a refresh,
//      the back button, and being sent to yourself.
import { el, faNum, debounce } from './util.js';
import { api } from './api.js';
import { FOLDER_EN } from './content-index.js';
import { openCollectionPicker } from './collections.js';
import { LABELS, PALETTE } from './config.js';
import { lockedNote } from './quota.js';
import {
  foldFa, highlightHref, hlMark, noteBlock, labelChip, actionBtn, asText,
  copyToClipboard, toast, skeleton, confirmStrip, inlineEditor,
} from './hl-view.js';

// How many article groups (or flat cards) are drawn before the "load more"
// sentinel takes over. A library of a few thousand highlights must not build a
// few thousand DOM nodes on first paint.
const PAGE_GROUPS = 8;
const PAGE_CARDS = 25;

const SORTS = [
  { key: 'recent', fa: 'تازه‌ترین' },
  { key: 'oldest', fa: 'قدیمی‌ترین' },
  { key: 'most', fa: 'پرهایلایت‌ترین' },
  { key: 'title', fa: 'بر اساس عنوان' },
];

const anchorId = (contentId) => 'hlg-' + String(contentId).replace(/[^a-z0-9]+/gi, '-');

// --- URL state -------------------------------------------------------------
function readState() {
  const p = new URLSearchParams(location.search);
  const sort = p.get('sort');
  return {
    q: p.get('q') || '',
    label: p.get('label') || '',
    color: p.get('color') || '',
    folder: p.get('folder') || '',
    sort: SORTS.some((s) => s.key === sort) ? sort : 'recent',
    view: p.get('view') === 'flat' ? 'flat' : 'grouped',
  };
}

function writeState(state) {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.label) p.set('label', state.label);
  if (state.color) p.set('color', state.color);
  if (state.folder) p.set('folder', state.folder);
  if (state.sort !== 'recent') p.set('sort', state.sort);
  if (state.view !== 'grouped') p.set('view', state.view);
  const qs = p.toString();
  // replaceState, not pushState: typing in a search box must not bury the page
  // under a hundred history entries.
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
}

// --- one highlight ---------------------------------------------------------
/**
 * @param article  the group this highlight belongs to (title/url/folder)
 * @param h        the highlight itself
 * @param ctx      { onDeleted(id), onUpdated(h), showSource }
 */
function highlightCard(article, h, ctx) {
  const card = el('div', { class: 'dcp-hlib-card', 'data-hl': h.id });

  function paint() {
    const body = el('div', { class: 'dcp-hlib-body' }, [hlMark(h)]);
    const note = noteBlock(h.note);

    const edit = actionBtn('✎ ویرایش', {
      onClick: () => {
        if (card.querySelector('.dcp-hlib-editor')) return;
        card.appendChild(inlineEditor(h, {
          onSaved: (updated) => { Object.assign(h, updated); paint(); ctx.onUpdated(h, article); },
        }));
      },
    });
    const copy = actionBtn('کپی', { onClick: (e) => copyToClipboard(asText(h), e.currentTarget) });
    const collect = actionBtn('🗂 کالکشن', { onClick: () => openCollectionPicker({ highlightId: h.id }) });
    const go = actionBtn('متنِ مقاله ›', { href: highlightHref(article.url, h.id) });
    const del = actionBtn('حذف', {
      danger: true,
      onClick: () => {
        if (card.querySelector('.dcp-recent-confirm')) return;
        card.appendChild(confirmStrip('این هایلایت حذف شود؟', async () => {
          await api.deleteHighlight(h.id);
          ctx.onDeleted(h.id);
          toast('هایلایت حذف شد');
        }));
      },
    });

    const actions = el('div', { class: 'dcp-hlib-actions' },
      [labelChip(h.label), edit, copy, collect, go, del].filter(Boolean));

    // In the flat (timeline) view a card has to say where it came from; in the
    // grouped view the group header above it already does.
    const source = ctx.showSource
      ? el('a', { class: 'dcp-hlib-src', href: article.url }, [
        el('span', { class: 'dcp-hlib-folder', dir: 'ltr' }, FOLDER_EN[article.folder] || article.folder),
        el('span', {}, article.title),
      ])
      : null;

    card.replaceChildren(...[source, body, note, actions].filter(Boolean));
  }

  paint();
  return card;
}

// --- one article group -----------------------------------------------------
function articleGroup(article, ctx) {
  const cards = el('div', { class: 'dcp-hlib-cards' },
    article.highlights.map((h) => highlightCard(article, h, ctx)));

  const toggle = el('button', {
    class: 'dcp-hlib-toggle', type: 'button', 'aria-expanded': 'true', title: 'باز/بسته کردن',
  }, '▾');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.textContent = open ? '‹' : '▾';
    cards.hidden = open;
  });

  const copyAll = actionBtn('کپیِ همه', {
    onClick: (e) => copyToClipboard(
      article.title + '\n\n' + article.highlights.map(asText).join('\n\n'), e.currentTarget,
    ),
  });

  const head = el('div', { class: 'dcp-hlib-ghead' }, [
    toggle,
    el('div', { class: 'dcp-hlib-gmeta' }, [
      // The TITLE links to the article (that is what a title is for); the
      // highlights below it do not.
      el('a', { class: 'dcp-hlib-gtitle', href: article.url }, article.title),
      el('div', { class: 'dcp-hlib-gsub' }, [
        el('span', { dir: 'ltr', class: 'dcp-hlib-folder' }, FOLDER_EN[article.folder] || article.folder_fa || article.folder),
        el('span', {}, faNum(article.highlights.length) + ' هایلایت'),
      ]),
    ]),
    copyAll,
  ]);

  return el('section', { class: 'dcp-hlib-group', id: anchorId(article.content_id) }, [head, cards]);
}

/** GET /plus/highlights.html — the whole library. */
export async function renderHighlightLibrary(container) {
  container.replaceChildren(skeleton(3));

  const data = await api.highlightLibrary().catch(() => null);
  if (!data) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'هایلایت‌ها در دسترس نیست.'),
      el('p', { class: 'dcp-muted' }, 'اتصالت را بررسی کن و صفحه را دوباره باز کن.'),
    ]));
    return;
  }

  // `total` means two different things on the two sides of this call. The API
  // sends the size of the WHOLE library (a free reader needs the real number —
  // "you have 340 of these" is the entire argument), while every counter,
  // filter and jump list below counts what is actually on this page. Splitting
  // them here keeps the rest of the file working on the loaded set exactly as
  // it always has, instead of teaching thirty call sites the difference.
  const libraryTotal = data.total;
  const truncated = !!data.preview_truncated;
  if (data.shown != null) data.total = data.shown;

  const state = readState();

  const countLine = el('p', { class: 'dcp-hlib-count' });
  // The two premium study surfaces are one workflow (read here → file into a
  // board), and neither is in the site nav, so each links to the other.
  const top = el('div', { class: 'dcp-pw-top' }, [
    el('div', { class: 'dcp-hlib-head' }, [
      el('h2', { class: 'dcp-pw-heading' }, 'دفترچه‌ی هایلایت‌ها'),
      el('a', { class: 'dcp-pw-alllink', href: '/plus/collections.html' }, '🗂 کالکشن‌ها'),
    ]),
    el('p', { class: 'dcp-sec-hint' },
      'هرچه تا حالا هایلایت کرده‌ای، یکجا و کامل — با یادداشت‌های خودت. همین‌جا بخوان، همین‌جا ویرایش کن؛ «متنِ مقاله» هم تو را دقیقاً روی همان هایلایت می‌برد.'),
  ]);

  if (!data.total) {
    container.replaceChildren(top, el('div', { class: 'dcp-empty dcp-hlib-empty' }, [
      el('div', { class: 'dcp-hlib-empty-ico', 'aria-hidden': 'true' }, '🖍'),
      el('p', {}, 'هنوز هایلایتی نداری.'),
      el('p', { class: 'dcp-muted' }, 'داخلِ هر مقاله دکمه‌ی «میز کار» را بزن و روی متن بکش؛ از همان لحظه اینجا جمع می‌شود.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان'),
    ]));
    return;
  }

  // --- controls ------------------------------------------------------------
  const search = el('input', {
    type: 'search', class: 'dcp-input dcp-hlib-search', value: state.q,
    placeholder: 'جستجو در هایلایت‌ها و یادداشت‌ها  ( / )',
    'aria-label': 'جستجو در هایلایت‌ها',
  });

  const folders = [...new Set(data.articles.map((a) => a.folder))];
  const folderSel = el('select', { class: 'dcp-input dcp-hlib-select', 'aria-label': 'پوشه' }, [
    el('option', { value: '' }, 'همه‌ی پوشه‌ها'),
    ...folders.map((f) => el('option', { value: f }, FOLDER_EN[f] || f)),
  ]);
  folderSel.value = state.folder;

  const sortSel = el('select', { class: 'dcp-input dcp-hlib-select', 'aria-label': 'ترتیب' },
    SORTS.map((s) => el('option', { value: s.key }, s.fa)));
  sortSel.value = state.sort;

  // Label chips carry their own counts — a filter that might return nothing is
  // a filter you should be able to see is empty before you press it.
  const labelChips = el('div', { class: 'dcp-hlib-chips' });
  const colorRow = el('div', { class: 'dcp-hlib-chips' });

  const viewBtn = el('button', { class: 'dcp-hlib-act', type: 'button' });
  const copyAllBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'کپیِ نتایج');
  const foldBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'بستنِ همه');
  const jumpBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, '⇕ فهرست مقاله‌ها');

  const controls = el('div', { class: 'dcp-hlib-controls' }, [
    el('div', { class: 'dcp-hlib-row' }, [search, folderSel, sortSel]),
    el('div', { class: 'dcp-hlib-row' }, [labelChips, colorRow]),
    el('div', { class: 'dcp-hlib-row dcp-hlib-row-tools' }, [countLine, jumpBtn, viewBtn, foldBtn, copyAllBtn]),
  ]);

  const jumpPanel = el('div', { class: 'dcp-hlib-jump', hidden: true });
  const list = el('div', { class: 'dcp-hlib-list' });
  const sentinel = el('div', { class: 'dcp-hlib-sentinel' });

  // --- model helpers -------------------------------------------------------
  const allHighlights = () => data.articles.flatMap((a) => a.highlights.map((h) => ({ a, h })));

  function matches(a, h) {
    if (state.folder && a.folder !== state.folder) return false;
    if (state.label && h.label !== state.label) return false;
    if (state.color && (h.color || '') !== state.color) return false;
    if (!state.q) return true;
    const q = foldFa(state.q);
    return foldFa(h.exact).includes(q) || foldFa(h.note).includes(q) || foldFa(a.title).includes(q);
  }

  function filteredGroups() {
    const groups = [];
    for (const a of data.articles) {
      const hs = a.highlights.filter((h) => matches(a, h));
      if (hs.length) groups.push({ ...a, highlights: hs });
    }
    if (state.sort === 'most') groups.sort((x, y) => y.highlights.length - x.highlights.length);
    else if (state.sort === 'title') groups.sort((x, y) => String(x.title).localeCompare(String(y.title), 'fa'));
    else if (state.sort === 'oldest') groups.reverse(); // data arrives newest-first
    return groups;
  }

  function removeFromModel(id) {
    for (const a of data.articles) a.highlights = a.highlights.filter((h) => h.id !== id);
    data.articles = data.articles.filter((a) => a.highlights.length);
    data.total = data.articles.reduce((n, a) => n + a.highlights.length, 0);
    data.article_count = data.articles.length;
    render();
  }

  // An edit can push a highlight OUT of the active filter (you just changed the
  // very label you are filtering by). Leaving it on screen would be a lie about
  // what the filter says, so that one case re-renders; everything else only
  // refreshes the chip counts and keeps your scroll position.
  const ctx = {
    onDeleted: removeFromModel,
    onUpdated: (h, article) => { if (matches(article, h)) buildChips(); else render(); },
    showSource: false,
  };

  // --- chips ---------------------------------------------------------------
  function buildChips() {
    const counts = new Map();
    let total = 0;
    for (const { a, h } of allHighlights()) {
      if (state.folder && a.folder !== state.folder) continue;
      total += 1;
      counts.set('l:' + (h.label || ''), (counts.get('l:' + (h.label || '')) || 0) + 1);
      counts.set('c:' + (h.color || ''), (counts.get('c:' + (h.color || '')) || 0) + 1);
    }

    const labelDefs = [{ key: '', fa: 'همه', n: total }, ...LABELS.map((l) => ({
      key: l.key, fa: l.fa, n: counts.get('l:' + l.key) || 0,
    }))];
    labelChips.replaceChildren(...labelDefs.map((d) => {
      const b = el('button', {
        class: 'dcp-hlib-chip' + (d.key === state.label ? ' is-on' : ''),
        type: 'button', disabled: d.n === 0 && d.key !== state.label && d.key !== '' ? '' : null,
      }, [d.fa, el('span', { class: 'dcp-hlib-chipn' }, faNum(d.n))]);
      b.addEventListener('click', () => { state.label = d.key; render(); });
      return b;
    }));

    // Colour is how a reader actually files things while reading, so it is a
    // first-class filter, shown as the swatches themselves.
    const swatches = PALETTE.filter((p) => (counts.get('c:' + p.key) || 0) > 0);
    colorRow.replaceChildren(...(swatches.length ? [
      ...swatches.map((p) => {
        const b = el('button', {
          class: 'dcp-hlib-sw' + (state.color === p.key ? ' is-on' : ''), type: 'button',
          style: 'background:' + p.css, title: p.fa + ' (' + faNum(counts.get('c:' + p.key) || 0) + ')',
          'aria-label': 'فیلتر رنگ ' + p.fa,
        });
        b.addEventListener('click', () => { state.color = state.color === p.key ? '' : p.key; render(); });
        return b;
      }),
      state.color ? (() => {
        const b = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'حذفِ فیلترِ رنگ');
        b.addEventListener('click', () => { state.color = ''; render(); });
        return b;
      })() : null,
    ].filter(Boolean) : []));
  }

  // --- incremental rendering ----------------------------------------------
  let pending = [];      // not-yet-drawn groups (or flat items)
  let observer = null;

  function drawMore() {
    if (!pending.length) { sentinel.hidden = true; return; }
    const batch = pending.splice(0, state.view === 'flat' ? PAGE_CARDS : PAGE_GROUPS);
    for (const item of batch) {
      list.appendChild(state.view === 'flat'
        ? highlightCard(item.a, item.h, { ...ctx, showSource: true })
        : articleGroup(item, ctx));
    }
    sentinel.hidden = !pending.length;
  }

  function setupObserver() {
    if (observer) observer.disconnect();
    if (typeof IntersectionObserver !== 'function') { while (pending.length) drawMore(); return; }
    observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) drawMore();
    }, { rootMargin: '600px' });
    observer.observe(sentinel);
  }

  // --- jump list -----------------------------------------------------------
  function buildJump(groups) {
    jumpPanel.replaceChildren(...groups.map((g) => {
      const a = el('button', { class: 'dcp-hlib-jumpitem', type: 'button' }, [
        el('span', { class: 'dcp-hlib-jumpname' }, g.title),
        el('span', { class: 'dcp-hlib-jumpn' }, faNum(g.highlights.length)),
      ]);
      a.addEventListener('click', () => {
        // The target may still be behind the sentinel; draw everything up to it.
        while (pending.length && !document.getElementById(anchorId(g.content_id))) drawMore();
        const node = document.getElementById(anchorId(g.content_id));
        if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        jumpPanel.hidden = true;
      });
      return a;
    }));
    if (!groups.length) jumpPanel.replaceChildren(el('div', { class: 'dcp-muted' }, 'چیزی برای پرش نیست.'));
  }

  // --- render --------------------------------------------------------------
  function render() {
    writeState(state);
    search.value = state.q;
    folderSel.value = state.folder;
    sortSel.value = state.sort;
    viewBtn.textContent = state.view === 'flat' ? '▤ گروه‌بندیِ مقاله' : '☰ فهرستِ زمانی';
    foldBtn.hidden = state.view === 'flat';
    jumpBtn.hidden = state.view === 'flat';
    buildChips();

    const groups = filteredGroups();
    const shown = groups.reduce((n, g) => n + g.highlights.length, 0);
    countLine.replaceChildren(
      el('b', {}, faNum(shown)),
      document.createTextNode(shown === data.total
        ? ' هایلایت در ' + faNum(data.article_count) + ' مطلب'
        : ' از ' + faNum(data.total) + ' هایلایت، در ' + faNum(groups.length) + ' مطلب'),
    );

    buildJump(groups);
    list.replaceChildren();
    allOpen = true;
    foldBtn.textContent = 'بستنِ همه';

    if (!groups.length) {
      pending = [];
      sentinel.hidden = true;
      const clear = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'پاک‌کردنِ فیلترها');
      clear.addEventListener('click', () => {
        state.q = ''; state.label = ''; state.color = ''; state.folder = '';
        render();
      });
      list.replaceChildren(el('div', { class: 'dcp-empty' }, [
        el('p', {}, 'چیزی با این فیلترها پیدا نشد.'), clear,
      ]));
      return;
    }

    pending = state.view === 'flat'
      ? groups.flatMap((g) => g.highlights.map((h) => ({ a: g, h })))
      : groups.slice();
    // The flat view is a single timeline, so it must be ordered by the
    // highlight, not by its article: an article's newest highlight is what put
    // it on top of the grouped view, but here every highlight stands alone.
    if (state.view === 'flat') {
      pending.sort((x, y) => {
        const d = String(x.h.created_at || '').localeCompare(String(y.h.created_at || ''));
        return state.sort === 'oldest' ? d : -d;
      });
    }
    sentinel.hidden = false;
    drawMore();
    setupObserver();
  }

  // --- wiring --------------------------------------------------------------
  search.addEventListener('input', debounce(() => { state.q = search.value; render(); }, 200));
  folderSel.addEventListener('change', () => { state.folder = folderSel.value; render(); });
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });
  viewBtn.addEventListener('click', () => { state.view = state.view === 'flat' ? 'grouped' : 'flat'; render(); });
  jumpBtn.addEventListener('click', () => { jumpPanel.hidden = !jumpPanel.hidden; });

  let allOpen = true;
  foldBtn.addEventListener('click', () => {
    allOpen = !allOpen;
    foldBtn.textContent = allOpen ? 'بستنِ همه' : 'بازکردنِ همه';
    list.querySelectorAll('.dcp-hlib-toggle').forEach((t) => {
      if ((t.getAttribute('aria-expanded') === 'true') !== allOpen) t.click();
    });
  });

  copyAllBtn.addEventListener('click', (e) => {
    const groups = filteredGroups();
    const text = groups.map((g) => g.title + '\n\n' + g.highlights.map(asText).join('\n\n')).join('\n\n———\n\n');
    copyToClipboard(text, e.currentTarget, 'کپی شد ✓');
  });

  // «/» focuses the search from anywhere on the page, Esc clears it — the two
  // shortcuts every search-first tool has.
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
    if (e.key === '/' && !typing) { e.preventDefault(); search.focus(); search.select(); }
    else if (e.key === 'Escape' && e.target === search && state.q) { state.q = ''; render(); search.focus(); }
  });

  // Mount BEFORE the first render: the infinite-scroll sentinel has to be in
  // the document when the observer starts watching it.
  // The note goes UNDER the twenty highlights, never over them: the reader
  // came here to read their own notes, and the count it quotes is only an
  // argument because they have just scrolled past the ones they do have.
  const moreNote = truncated
    ? lockedNote(
      faNum(libraryTotal - data.total) + ' هایلایت دیگر هم داری. ' + (data.locked_message || ''),
      'highlights-library',
    )
    : null;

  container.replaceChildren(...[top, controls, jumpPanel, list, sentinel, moreNote].filter(Boolean));
  render();
}
