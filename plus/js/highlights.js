// Premium «دفترچه‌ی هایلایت‌ها» — every highlight the user owns, readable in
// one place, grouped by the article it came from.
//
// Why this exists (user report, 2026-08-05): a reader who had highlighted a few
// points across dozens of articles could not review them. The dashboard's
// «هایلایت‌های اخیر» showed six rows, and every row was a LINK — clicking it
// threw you back into the article, where the highlights only appear after you
// press «میز کار» again. So the notes existed but were unreachable, and premium
// changed nothing about that.
//
// Two rules follow from that, and both are load-bearing here:
//   1. A highlight row is NOT a link. Its text is the content of the row, shown
//      in full, with its note under it. Reading happens here; «متن مقاله» is a
//      small, deliberate, secondary action.
//   2. When you DO go to the article, you land on the highlight itself —
//      every link carries ?dcphl=<id>, which makes plus.js open the workbench
//      and scroll the mark into view (no second «میز کار» press).
import { el, faNum, debounce, renderNoteLines } from './util.js';
import { api } from './api.js';
import { FOLDER_EN } from './content-index.js';
import { openCollectionPicker } from './collections.js';
import { LABELS } from './config.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';

/** Search-only normalization: Arabic ی/ک, ZWNJ and diacritics fold together so
 *  «اندو‌شده» is found by typing «اندو شده». Never applied to stored text. */
function foldFa(s) {
  return String(s || '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200B-\u200F\u064B-\u0652\u0640]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/** The article link that lands ON the highlight (see rule 2 in the header). */
export function highlightHref(article, h) {
  const sep = article.url.includes('?') ? '&' : '?';
  return article.url + sep + 'dcphl=' + encodeURIComponent(h.id);
}

/** Plain-text form of one highlight, for the copy buttons. */
function asText(h) {
  const note = (h.note || '').trim();
  return note ? h.exact + '\n— ' + note : h.exact;
}

async function copyText(text, btn, okLabel) {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = okLabel;
  } catch (_) {
    btn.textContent = 'کپی نشد';
  }
  setTimeout(() => { btn.textContent = original; }, 1600);
}

function highlightCard(article, h, onDeleted) {
  const body = el('div', { class: 'dcp-hlib-body' }, [
    // The user's own colour/underline, exactly as the article renders it — a
    // highlight flattened to plain text is not the thing they made.
    el('mark', {
      class: 'dcp-hl' + (h.underline ? ' dcp-underline' : ''),
      'data-color': h.color || '',
    }, h.exact),
  ]);
  if (h.note) body.appendChild(el('div', { class: 'dcp-hlib-note' }, renderNoteLines(h.note)));

  const copyBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'کپی');
  copyBtn.addEventListener('click', () => copyText(asText(h), copyBtn, 'کپی شد ✓'));

  const collectBtn = el('button', { class: 'dcp-hlib-act', type: 'button' }, '🗂 کالکشن');
  collectBtn.addEventListener('click', () => openCollectionPicker({ highlightId: h.id }));

  const goLink = el('a', { class: 'dcp-hlib-act dcp-hlib-go', href: highlightHref(article, h) }, 'متنِ مقاله ›');

  const delBtn = el('button', { class: 'dcp-hlib-act dcp-hlib-del', type: 'button' }, 'حذف');

  const actions = el('div', { class: 'dcp-hlib-actions' }, [
    h.label ? el('span', { class: 'dcp-card-label' }, labelFa(h.label)) : null,
    copyBtn, collectBtn, goLink, delBtn,
  ].filter(Boolean));

  const card = el('div', { class: 'dcp-hlib-card' }, [body, actions]);

  // Inline confirm row (the dashboard's own delete shape), never a native confirm().
  delBtn.addEventListener('click', () => {
    if (card.querySelector('.dcp-recent-confirm')) return;
    const yes = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, 'حذف');
    const no = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
    const confirm = el('div', { class: 'dcp-recent-confirm' }, ['این هایلایت حذف شود؟', yes, no]);
    no.onclick = () => confirm.remove();
    yes.onclick = async () => {
      yes.disabled = true;
      try { await api.deleteHighlight(h.id); onDeleted(h.id); }
      catch (_) { yes.disabled = false; }
    };
    card.appendChild(confirm);
  });

  return card;
}

function articleGroup(article, onDeleted) {
  const cards = el('div', { class: 'dcp-hlib-cards' },
    article.highlights.map((h) => highlightCard(article, h, onDeleted)));

  const toggle = el('button', {
    class: 'dcp-hlib-toggle', type: 'button', 'aria-expanded': 'true',
    title: 'باز/بسته کردن',
  }, '▾');

  const copyAll = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'کپیِ همه');
  copyAll.addEventListener('click', () => copyText(
    article.title + '\n\n' + article.highlights.map(asText).join('\n\n'),
    copyAll, 'کپی شد ✓',
  ));

  const head = el('div', { class: 'dcp-hlib-ghead' }, [
    toggle,
    el('div', { class: 'dcp-hlib-gmeta' }, [
      // The TITLE links to the article (that is what a title is for); the
      // highlights below it do not.
      el('a', { class: 'dcp-hlib-gtitle', href: article.url }, article.title),
      el('div', { class: 'dcp-hlib-gsub' }, [
        el('span', { dir: 'ltr', class: 'dcp-hlib-folder' }, FOLDER_EN[article.folder] || article.folder_fa || article.folder),
        el('span', {}, faNum(article.count) + ' هایلایت'),
      ]),
    ]),
    copyAll,
  ]);

  const group = el('section', { class: 'dcp-hlib-group' }, [head, cards]);
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.textContent = open ? '‹' : '▾';
    cards.hidden = open;
  });
  return group;
}

/** GET /plus/highlights.html — the whole library, filterable, readable in place. */
export async function renderHighlightLibrary(container) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const data = await api.highlightLibrary().catch(() => null);
  if (!data) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, 'هایلایت‌ها در دسترس نیست؛ دوباره تلاش کنید.'));
    return;
  }

  const countLine = el('p', { class: 'dcp-sec-hint' });
  const top = el('div', { class: 'dcp-pw-top' }, [
    el('h2', { class: 'dcp-pw-heading' }, 'دفترچه‌ی هایلایت‌ها'),
    el('p', { class: 'dcp-sec-hint' },
      'هرچه تا حالا هایلایت کرده‌ای، یکجا و کامل — با یادداشت‌های خودت، بدون اینکه لازم باشه دوباره سراغِ مقاله بری. برای مرورِ سریع همین‌جا بخون؛ اگر متنِ کامل را خواستی، «متنِ مقاله» تو را دقیقاً روی همان هایلایت می‌برد.'),
    countLine,
  ]);

  if (!data.total) {
    container.replaceChildren(top, el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'هنوز هایلایتی نداری.'),
      el('p', { class: 'dcp-muted' }, 'داخلِ هر مقاله دکمه‌ی «میز کار» را بزن و روی متن هایلایت بکش؛ از همان لحظه اینجا جمع می‌شود.'),
    ]));
    return;
  }

  // --- controls ------------------------------------------------------------
  const search = el('input', {
    type: 'search', class: 'dcp-input', placeholder: 'جستجو در هایلایت‌ها و یادداشت‌ها',
    'aria-label': 'جستجو در هایلایت‌ها',
  });

  const folders = [...new Set(data.articles.map((a) => a.folder))];
  const folderSel = el('select', { class: 'dcp-input dcp-hlib-select', 'aria-label': 'پوشه' }, [
    el('option', { value: '' }, 'همه‌ی پوشه‌ها'),
    ...folders.map((f) => el('option', { value: f }, FOLDER_EN[f] || f)),
  ]);

  let activeLabel = '';
  const labelChips = el('div', { class: 'dcp-hlib-chips' });
  const chipDefs = [{ key: '', fa: 'همه' }, ...LABELS.map((l) => ({ key: l.key, fa: l.fa }))];
  const chips = chipDefs.map((d) => {
    const b = el('button', { class: 'dcp-hlib-chip' + (d.key === '' ? ' is-on' : ''), type: 'button' }, d.fa);
    b.addEventListener('click', () => {
      activeLabel = d.key;
      chips.forEach((c) => c.classList.remove('is-on'));
      b.classList.add('is-on');
      apply();
    });
    return b;
  });
  labelChips.replaceChildren(...chips);

  const expandAll = el('button', { class: 'dcp-hlib-act', type: 'button' }, 'بستنِ همه');
  const controls = el('div', { class: 'dcp-hlib-controls' }, [
    el('div', { class: 'dcp-hlib-row' }, [search, folderSel]),
    el('div', { class: 'dcp-hlib-row' }, [labelChips, expandAll]),
  ]);

  const list = el('div', { class: 'dcp-hlib-list' });
  const nothing = el('div', { class: 'dcp-empty' }, 'چیزی با این فیلترها پیدا نشد.');

  // A deleted highlight is dropped from the in-memory model and the view is
  // recomputed, so the count line and the filters never disagree with what is
  // actually on screen (an article whose last highlight went away disappears
  // with it).
  function removeFromModel(id) {
    for (const a of data.articles) a.highlights = a.highlights.filter((h) => h.id !== id);
    data.articles = data.articles.filter((a) => a.highlights.length);
    data.total = data.articles.reduce((n, a) => n + a.highlights.length, 0);
    data.article_count = data.articles.length;
    apply();
  }

  function apply() {
    const q = foldFa(search.value);
    const folder = folderSel.value;
    let shownHl = 0;
    let shownArticles = 0;
    const groups = [];
    for (const a of data.articles) {
      if (folder && a.folder !== folder) continue;
      const hs = a.highlights.filter((h) => {
        if (activeLabel && h.label !== activeLabel) return false;
        if (!q) return true;
        return foldFa(h.exact).includes(q) || foldFa(h.note).includes(q)
          || foldFa(a.title).includes(q);
      });
      if (!hs.length) continue;
      shownHl += hs.length;
      shownArticles += 1;
      groups.push(articleGroup({ ...a, highlights: hs, count: hs.length }, removeFromModel));
    }
    countLine.textContent = shownHl === data.total
      ? faNum(data.total) + ' هایلایت در ' + faNum(data.article_count) + ' مطلب'
      : faNum(shownHl) + ' از ' + faNum(data.total) + ' هایلایت، در ' + faNum(shownArticles) + ' مطلب';
    list.replaceChildren(...(groups.length ? groups : [nothing]));
    if (!data.total) list.replaceChildren(el('div', { class: 'dcp-empty' }, 'دیگر هایلایتی نمانده.'));
  }

  search.addEventListener('input', debounce(apply, 180));
  folderSel.addEventListener('change', apply);

  let allOpen = true;
  expandAll.addEventListener('click', () => {
    allOpen = !allOpen;
    expandAll.textContent = allOpen ? 'بستنِ همه' : 'بازکردنِ همه';
    list.querySelectorAll('.dcp-hlib-toggle').forEach((t) => {
      if ((t.getAttribute('aria-expanded') === 'true') !== allOpen) t.click();
    });
  });

  apply();
  container.replaceChildren(top, controls, list);
}
