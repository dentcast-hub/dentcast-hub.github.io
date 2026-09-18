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
import { el, faNum, debounce } from './util.js?v=93';
import { api } from './api.js?v=93';
import { FOLDER_EN } from './content-index.js?v=93';
import { openCollectionPicker } from './collections.js?v=93';
import { LABELS, PALETTE } from './config.js?v=93';
import {
  foldFa, highlightHref, hlMark, noteBlock, labelChip, actionBtn, asText,
  copyToClipboard, toast, skeleton, confirmStrip, inlineEditor,
} from './hl-view.js?v=93';
// قطعه‌های صوتی ride in the same library: a clip is a highlight in time, so it
// sits in its episode's group beside the caption highlights (clip-view.js).
import { clipCard, createClipPlayer, clipAsText } from './clip-view.js?v=93';

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
    concept: p.get('concept') || '',
    // «نوع»: text highlights, audio clips, or both (the default).
    kind: p.get('kind') === 'clip' || p.get('kind') === 'text' ? p.get('kind') : '',
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
  if (state.concept) p.set('concept', state.concept);
  if (state.kind) p.set('kind', state.kind);
  if (state.sort !== 'recent') p.set('sort', state.sort);
  if (state.view !== 'grouped') p.set('view', state.view);
  const qs = p.toString();
  // replaceState, not pushState: typing in a search box must not bury the page
  // under a hundred history entries.
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
}

// --- one item (a text highlight or an audio clip) ---------------------------
const isClip = (h) => h && h.kind === 'clip';
/** Plain text of either kind, for the copy actions. */
const itemText = (h, article = null) => (isClip(h) ? clipAsText(h, article) : asText(h));
/** «where it came from», for the flat view — one line, both kinds. */
function sourceLink(article) {
  return el('a', { class: 'dcp-hlib-src', href: article.url }, [
    el('span', { class: 'dcp-hlib-folder', dir: 'ltr' }, FOLDER_EN[article.folder] || article.folder),
    el('span', {}, article.title),
  ]);
}
function itemCard(article, h, ctx) {
  return isClip(h)
    ? clipCard(article, h, { ...ctx, source: sourceLink, onCollect: (clip) => openCollectionPicker({ clipId: clip.id }) })
    : highlightCard(article, h, ctx);
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

    // In a concept view a card says HOW it got there only when that is the
    // exception: a page carrying the concept's tag is the default and wears
    // nothing; a highlight found through its own words is marked.
    const via = h.match === 'text' ? el('span', { class: 'dcp-hlib-via' }, 'در متن هایلایت') : null;
    const actions = el('div', { class: 'dcp-hlib-actions' },
      [labelChip(h.label), via, edit, copy, collect, go, del].filter(Boolean));

    // In the flat (timeline) view a card has to say where it came from; in the
    // grouped view the group header above it already does.
    const source = ctx.showSource ? sourceLink(article) : null;

    card.replaceChildren(...[source, body, note, actions].filter(Boolean));
  }

  paint();
  return card;
}

// --- one article group -----------------------------------------------------
function articleGroup(article, ctx) {
  const cards = el('div', { class: 'dcp-hlib-cards' },
    article.highlights.map((h) => itemCard(article, h, ctx)));

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
      article.title + '\n\n' + article.highlights.map((h) => itemText(h)).join('\n\n'), e.currentTarget,
    ),
  });
  // «۲ هایلایت · ۱ هایلایت صوتی» — each kind counted by its own name.
  const nText = article.highlights.filter((h) => !isClip(h)).length;
  const nClip = article.highlights.length - nText;
  const countText = [nText ? faNum(nText) + ' هایلایت' : null, nClip ? faNum(nClip) + ' هایلایت صوتی' : null].filter(Boolean).join(' · ');

  const head = el('div', { class: 'dcp-hlib-ghead' }, [
    toggle,
    el('div', { class: 'dcp-hlib-gmeta' }, [
      // The TITLE links to the article (that is what a title is for); the
      // highlights below it do not.
      el('a', { class: 'dcp-hlib-gtitle', href: article.url }, article.title),
      el('div', { class: 'dcp-hlib-gsub' }, [
        el('span', { dir: 'ltr', class: 'dcp-hlib-folder' }, FOLDER_EN[article.folder] || article.folder_fa || article.folder),
        el('span', {}, countText),
      ]),
    ]),
    copyAll,
  ]);

  return el('section', { class: 'dcp-hlib-group', id: anchorId(article.content_id) }, [head, cards]);
}

/**
 * Fold the clip library (GET /clips/library) into the highlight library's own
 * shape: a clip joins its episode's group as an item with kind 'clip', a new
 * group is made for an episode that has clips but no caption highlight, and
 * the groups are re-ordered by whichever kind was touched last. `clip_total`
 * is kept beside `total` so the headline can name each kind.
 */
function mergeClips(data, clipLib) {
  const byId = new Map(data.articles.map((a) => [a.content_id, a]));
  let added = 0;
  for (const g of clipLib.articles || []) {
    let a = byId.get(g.content_id);
    if (!a) {
      a = { ...g, highlights: [], last_highlight_at: g.last_clip_at, count: 0 };
      delete a.clips;
      byId.set(g.content_id, a);
      data.articles.push(a);
    }
    for (const c of g.clips || []) {
      a.highlights.push({ ...c, kind: 'clip' });
      added += 1;
    }
    if (g.last_clip_at > (a.last_highlight_at || '')) a.last_highlight_at = g.last_clip_at;
    a.count = a.highlights.length;
  }
  data.articles.sort((x, y) => String(y.last_highlight_at || '').localeCompare(String(x.last_highlight_at || '')));
  data.total = (data.total || 0) + added;
  data.clip_total = added;
  data.article_count = data.articles.length;
}

/** GET /plus/highlights.html — the whole library. */
export async function renderHighlightLibrary(container) {
  container.replaceChildren(skeleton(3));

  // The concept catalog rides beside the library: every concept the reader's
  // highlights reach, with counts (plus-api services/highlight-concepts.ts).
  // Optional — a library with no concept row is still the library.
  const [data, conceptCatalog, clipLib] = await Promise.all([
    api.highlightLibrary().catch(() => null),
    api.highlightConcepts().catch(() => null),
    api.clipLibrary().catch(() => null),
  ]);
  if (data && clipLib) mergeClips(data, clipLib);
  if (!data) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'هایلایت‌ها در دسترس نیست.'),
      el('p', { class: 'dcp-muted' }, 'اتصالت را بررسی کن و صفحه را دوباره باز کن.'),
    ]));
    return;
  }

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
  // «مفهوم» — the third chip row and the head card a chosen concept opens;
  // filled by buildConceptChips()/buildConceptHead() below.
  const conceptChips = el('div', { class: 'dcp-hlib-chips dcp-hlib-concepts' });
  const conceptHead = el('div', { class: 'dcp-hlib-chead' });
  conceptHead.hidden = true;
  // «نوع» — drawn only once the reader owns at least one clip; a row with one
  // choice is not a filter.
  const kindChips = el('div', { class: 'dcp-hlib-chips dcp-hlib-kinds' });
  // One <audio> for every clip card on the page (clip-view.js).
  const player = createClipPlayer();

  const viewBtn = el('button', { class: 'dcp-hlib-act', type: 'button' });
  const copyAllBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'کپیِ نتایج');
  const foldBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'بستنِ همه');
  const jumpBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, '⇕ فهرست مقاله‌ها');

  const controls = el('div', { class: 'dcp-hlib-controls' }, [
    el('div', { class: 'dcp-hlib-row' }, [search, folderSel, sortSel]),
    el('div', { class: 'dcp-hlib-row' }, [conceptChips]),
    el('div', { class: 'dcp-hlib-row' }, [kindChips]),
    el('div', { class: 'dcp-hlib-row' }, [labelChips, colorRow]),
    el('div', { class: 'dcp-hlib-row dcp-hlib-row-tools' }, [countLine, jumpBtn, viewBtn, foldBtn, copyAllBtn]),
  ]);

  const jumpPanel = el('div', { class: 'dcp-hlib-jump', hidden: true });
  const list = el('div', { class: 'dcp-hlib-list' });
  const sentinel = el('div', { class: 'dcp-hlib-sentinel' });

  // --- model helpers -------------------------------------------------------
  // «نمای موضوعی»: when a concept is chosen the groups come from the concept
  // view (GET /highlights/concepts/:key — the same article/highlight shape,
  // each highlight carrying `match`), and every filter, chip and count below
  // reads through source() so they all agree on what is on screen.
  let conceptView = null;
  const source = () => conceptView || data;
  const allHighlights = () => source().articles.flatMap((a) => a.highlights.map((h) => ({ a, h })));

  function matches(a, h) {
    if (state.folder && a.folder !== state.folder) return false;
    if (state.kind === 'clip' && !isClip(h)) return false;
    if (state.kind === 'text' && isClip(h)) return false;
    if (state.label && h.label !== state.label) return false;
    // A clip has no colour, so a colour filter is a text filter by definition.
    if (state.color && (isClip(h) || (h.color || '') !== state.color)) return false;
    if (!state.q) return true;
    const q = foldFa(state.q);
    return foldFa(h.exact).includes(q) || foldFa(h.note).includes(q) || foldFa(a.title).includes(q);
  }

  function filteredGroups() {
    const groups = [];
    for (const a of source().articles) {
      const hs = a.highlights.filter((h) => matches(a, h));
      if (hs.length) groups.push({ ...a, highlights: hs });
    }
    if (state.sort === 'most') groups.sort((x, y) => y.highlights.length - x.highlights.length);
    else if (state.sort === 'title') groups.sort((x, y) => String(x.title).localeCompare(String(y.title), 'fa'));
    else if (state.sort === 'oldest') groups.reverse(); // data arrives newest-first
    return groups;
  }

  function removeFromModel(id) {
    for (const m of [data, conceptView].filter(Boolean)) {
      for (const a of m.articles) a.highlights = a.highlights.filter((h) => h.id !== id);
      m.articles = m.articles.filter((a) => a.highlights.length);
      m.total = m.articles.reduce((n, a) => n + a.highlights.length, 0);
      m.clip_total = m.articles.reduce((n, a) => n + a.highlights.filter(isClip).length, 0);
      m.article_count = m.articles.length;
    }
    render();
  }

  // --- concepts ------------------------------------------------------------
  let conceptsOpen = false;
  const CONCEPTS_SHOWN = 8;

  async function setConcept(key) {
    state.concept = key;
    state.label = ''; state.color = '';
    if (!key) { conceptView = null; render(); return; }
    list.replaceChildren(skeleton(2));
    const view = await api.highlightConcept(key).catch(() => null);
    if (state.concept !== key) return; // the reader moved on while this loaded
    if (!view) { state.concept = ''; conceptView = null; toast('این مفهوم در دسترس نیست', { icon: '!' }); }
    else conceptView = view;
    render();
  }

  function buildConceptChips() {
    const concepts = (conceptCatalog && conceptCatalog.concepts) || [];
    if (!concepts.length) { conceptChips.hidden = true; return; }
    conceptChips.hidden = false;
    // Eight by default; the chosen one always among them, so a deep link to
    // the twentieth concept still shows its own chip lit.
    let shown = conceptsOpen ? concepts : concepts.slice(0, CONCEPTS_SHOWN);
    if (state.concept && !shown.some((c) => c.key === state.concept)) {
      const active = concepts.find((c) => c.key === state.concept);
      if (active) shown = [...shown, active];
    }
    const chip = (key, fa, n) => {
      const b = el('button', {
        class: 'dcp-hlib-chip' + (key === state.concept ? ' is-on' : ''), type: 'button',
      }, [fa, n === null ? null : el('span', { class: 'dcp-hlib-chipn' }, faNum(n))].filter(Boolean));
      b.addEventListener('click', () => { if (key !== state.concept) void setConcept(key); });
      return b;
    };
    const rest = concepts.length - shown.length;
    const more = rest > 0 ? (() => {
      const b = el('button', { class: 'dcp-hlib-chip is-more', type: 'button' }, '+' + faNum(rest) + ' مفهوم دیگر');
      b.addEventListener('click', () => { conceptsOpen = true; buildConceptChips(); });
      return b;
    })() : null;
    conceptChips.replaceChildren(...[
      el('span', { class: 'dcp-hlib-chips-label' }, 'مفهوم'),
      chip('', 'همه', null),
      ...shown.map((c) => chip(c.key, c.fa, c.highlights)),
      more,
    ].filter(Boolean));
  }

  function buildConceptHead() {
    if (!conceptView) { conceptHead.hidden = true; conceptHead.replaceChildren(); return; }
    const c = conceptView.concept;
    conceptHead.hidden = false;
    conceptHead.replaceChildren(...[
      el('div', { class: 'dcp-hlib-chead-t' }, [c.fa, el('span', { class: 'dcp-hlib-chead-x' }, 'مفهوم')]),
      el('div', { class: 'dcp-hlib-chead-m' },
        faNum(conceptView.total) + ' هایلایت در ' + faNum(conceptView.article_count) + ' مطلب · '
        + faNum(c.pages_total) + ' صفحه از سایت این تگ را دارد'),
      c.glossary ? el('div', { class: 'dcp-hlib-chead-links' }, [
        el('a', { href: c.glossary.url }, 'مدخل دانشنامه: ' + c.glossary.fa_title + ' ›'),
      ]) : null,
    ].filter(Boolean));
  }

  // An edit can push a highlight OUT of the active filter (you just changed the
  // very label you are filtering by). Leaving it on screen would be a lie about
  // what the filter says, so that one case re-renders; everything else only
  // refreshes the chip counts and keeps your scroll position.
  const ctx = {
    onDeleted: removeFromModel,
    onUpdated: (h, article) => { if (matches(article, h)) buildChips(); else render(); },
    showSource: false,
    player,
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

  // --- «نوع» chips ---------------------------------------------------------
  function buildKindChips() {
    const all = allHighlights();
    const nClip = all.filter(({ h }) => isClip(h)).length;
    if (!nClip || conceptView) { kindChips.replaceChildren(); kindChips.hidden = true; return; }
    kindChips.hidden = false;
    const nText = all.length - nClip;
    const defs = [
      { key: '', fa: 'همه', n: all.length },
      { key: 'text', fa: 'متن', n: nText },
      { key: 'clip', fa: '🎧 هایلایت صوتی', n: nClip },
    ];
    kindChips.replaceChildren(el('span', { class: 'dcp-hlib-chips-label' }, 'نوع'), ...defs.map((d) => {
      const b = el('button', {
        class: 'dcp-hlib-chip' + (d.key === state.kind ? ' is-on' : ''), type: 'button', 'data-kind': d.key,
      }, [d.fa, el('span', { class: 'dcp-hlib-chip-n' }, faNum(d.n))]);
      b.addEventListener('click', () => { state.kind = d.key; render(); });
      return b;
    }));
  }

  // --- incremental rendering ----------------------------------------------
  let pending = [];      // not-yet-drawn groups (or flat items)
  let observer = null;

  function drawMore() {
    if (!pending.length) { sentinel.hidden = true; return; }
    const batch = pending.splice(0, state.view === 'flat' ? PAGE_CARDS : PAGE_GROUPS);
    for (const item of batch) {
      list.appendChild(state.view === 'flat'
        ? itemCard(item.a, item.h, { ...ctx, showSource: true })
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
    buildConceptChips();
    buildConceptHead();
    buildKindChips();
    buildChips();

    const groups = filteredGroups();
    const shown = groups.reduce((n, g) => n + g.highlights.length, 0);
    const src = source();
    // With clips in the library the headline counts each kind by its name:
    // «۱۳۲ هایلایت · ۹ هایلایت صوتی در ۴۱ مطلب».
    const clipTotal = src.clip_total || 0;
    const textTotal = src.total - clipTotal;
    const kinds = clipTotal
      ? faNum(textTotal) + ' هایلایت · ' + faNum(clipTotal) + ' هایلایت صوتی'
      : faNum(src.total) + ' هایلایت';
    // Filtered, with both kinds in the library, «۳ از ۴ مورد» — «۳ از ۱ هایلایت
    // · ۳ هایلایت صوتی» reads as a sum that does not add up.
    const of = clipTotal ? faNum(src.total) + ' مورد' : faNum(src.total) + ' هایلایت';
    countLine.replaceChildren(...(shown === src.total
      ? [document.createTextNode(kinds + ' در ' + faNum(src.article_count) + ' مطلب')]
      : [el('b', {}, faNum(shown)), document.createTextNode(' از ' + of + '، در ' + faNum(groups.length) + ' مطلب')]));

    buildJump(groups);
    list.replaceChildren();
    allOpen = true;
    foldBtn.textContent = 'بستنِ همه';

    if (!groups.length) {
      pending = [];
      sentinel.hidden = true;
      const clear = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'پاک‌کردنِ فیلترها');
      clear.addEventListener('click', () => {
        state.q = ''; state.label = ''; state.color = ''; state.folder = ''; state.kind = '';
        if (state.concept) { void setConcept(''); return; }
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
    const text = groups.map((g) => g.title + '\n\n' + g.highlights.map((h) => itemText(h)).join('\n\n')).join('\n\n———\n\n');
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
  container.replaceChildren(top, controls, conceptHead, jumpPanel, list, sentinel);
  if (state.concept) {
    // ?concept= is a deep link (the glossary block, a shared URL): open ON it.
    await setConcept(state.concept);
  } else {
    render();
  }
}
