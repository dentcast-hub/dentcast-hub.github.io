// «یادداشت‌های خودت درباره‌ی این مفهوم» — the block under a دانشنامه term
// that gathers what the reader already highlighted about it, on any page.
// Backend: plus-api/src/services/highlight-concepts.ts (glossaryNotes), route
// GET /glossary/:slug/notes. Design approved from the mockup in
// .dentcast/highlight-concepts-mockup.html (founder, 2026-09-13).
//
// Three readers, three answers, and two of them are NOTHING:
//   · premium with notes → the block: the three newest highlights across the
//     term's articles (each under its source line) and a link to all of them
//     in the دفترچه's concept view;
//   · free with notes → a door: the COUNT of their own notes (the API sends a
//     free reader counts and nothing else) and the premium CTA. The number is
//     theirs, which is what makes a locked box honest here;
//   · anyone with nothing, or nobody signed in → no block at all. A locked
//     teaser under every one of 109 terms is an advert, not content — the same
//     rule گفت‌وگوی زیر مطلب follows when it has nothing to show.
//
// Mounted from plus.js's initArticle() on glossary pages only, lazily behind
// an IntersectionObserver like article-threads.js, and directly under the
// prose (mounted just before the bottom action row, so the row still comes
// first). The cards are read-only on purpose: editing lives in the دفترچه.
import { el, faNum } from './util.js?v=143';
import { api, currentUser } from './api.js?v=143';
import { hlMark, noteBlock, highlightHref } from './hl-view.js?v=143';
import { premiumCta } from './premium-cta.js?v=143';
import { FOLDER_EN } from './content-index.js?v=143';

const SHOWN = 3;

export function conceptHref(key) {
  return '/plus/highlights.html?concept=' + encodeURIComponent(key);
}

/** The newest `n` highlights across every article, each carrying its article. */
function newest(articles, n) {
  const all = [];
  for (const a of articles) for (const h of a.highlights) all.push({ a, h });
  all.sort((x, y) => String(y.h.created_at || '').localeCompare(String(x.h.created_at || '')));
  return all.slice(0, n);
}

function card({ a, h }) {
  return el('div', { class: 'dcp-gn-card' }, [
    el('div', { class: 'dcp-gn-body' }, [hlMark(h)]),
    noteBlock(h.note),
    el('div', { class: 'dcp-gn-acts' }, [
      h.match === 'text' ? el('span', { class: 'dcp-gn-via' }, 'در متن هایلایت') : null,
      el('a', { class: 'dcp-gn-go', href: highlightHref(a.url, h.id) }, 'متنِ مقاله ›'),
    ].filter(Boolean)),
  ]);
}

/** Cards grouped under their source line, in the order `newest()` produced. */
function cardList(items) {
  const out = [];
  let last = null;
  for (const it of items) {
    if (it.a.content_id !== last) {
      out.push(el('div', { class: 'dcp-gn-src' }, [
        el('a', { href: it.a.url }, it.a.title),
        el('span', { dir: 'ltr' }, FOLDER_EN[it.a.folder] || it.a.folder_fa || it.a.folder),
      ]));
      last = it.a.content_id;
    }
    out.push(card(it));
  }
  return out;
}

export function renderGlossaryNotes(host, data) {
  const meta = faNum(data.total) + ' هایلایت · ' + faNum(data.article_count) + ' مطلب';
  if (data.locked) {
    host.replaceChildren(el('div', { class: 'dcp-gn-door' }, [
      el('div', { class: 'dcp-gn-lock' }, '🔒 ویژه‌ی پریمیوم'),
      el('p', {}, [
        el('b', {}, faNum(data.total) + ' هایلایت'), ' در ', el('b', {}, faNum(data.article_count) + ' مطلب'),
        ' درباره‌ی همین مفهوم دارید. با پریمیوم همین‌جا زیر واژه جمع می‌شوند — و در دفترچه، برای هر مفهوم دیگری هم.',
      ]),
      premiumCta('glossary-notes'),
    ]));
    return;
  }
  const shown = newest(data.articles, SHOWN);
  const allHref = data.concepts && data.concepts.length ? conceptHref(data.concepts[0].key) : '/plus/highlights.html';
  host.replaceChildren(
    el('div', { class: 'dcp-gn-head' }, [
      el('h3', { class: 'dcp-gn-title' }, 'یادداشت‌های خودت درباره‌ی این مفهوم'),
      el('span', { class: 'dcp-gn-meta' }, meta),
    ]),
    el('p', { class: 'dcp-gn-hint' }, 'آنچه پیش‌تر در مطالب دیگر درباره‌ی ' + data.term.fa_title + ' هایلایت کرده‌اید.'),
    ...cardList(shown),
    el('a', { class: 'dcp-gn-all', href: allHref },
      data.total > shown.length
        ? 'همه‌ی ' + faNum(data.total) + ' هایلایت این مفهوم در دفترچه ›'
        : 'دیدن در دفترچه‌ی هایلایت‌ها ›'),
  );
}

async function draw(host, slug) {
  const user = await currentUser();
  if (!user) { host.remove(); return; }
  const data = await api.glossaryNotes(slug).catch(() => null);
  if (!data || !data.total) { host.remove(); return; }
  renderGlossaryNotes(host, data);
}

/**
 * Mount under `anchor` for a glossary content_id; a no-op (false) for any
 * other page. The host starts as a hairline placeholder and removes itself
 * unless there is something to show, so a page never carries an empty box.
 */
export function mountGlossaryNotes(anchor, contentId) {
  if (!anchor || !contentId || !/^glossary\//.test(contentId)) return false;
  const slug = contentId.slice('glossary/'.length);
  if (!/^[a-z0-9-]+$/i.test(slug)) return false;
  const existing = anchor.parentNode && anchor.parentNode.querySelector('.dcp-gn');
  if (existing) existing.remove();

  const host = el('section', { class: 'dcp-gn', 'aria-label': 'یادداشت‌های خودت درباره‌ی این مفهوم' });
  anchor.insertAdjacentElement('afterend', host);

  let drawn = false;
  const go = () => {
    if (drawn) return;
    drawn = true;
    draw(host, slug).catch(() => { host.remove(); });
  };
  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
    }, { rootMargin: '400px' });
    io.observe(host);
  } else {
    go();
  }
  return true;
}
