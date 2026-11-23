// What the shared scripts build from a page's presentation layer (module 03
// «Structure, chips and callout boxes»). None of it is in any page's markup and
// none of it adds a word to the article: the «در یک نگاه» card repeats the
// sentences the page's own callout boxes already frame, the section pill reads
// the numbers already on the headings, and the glossary preview shows the
// first lines of the term page a link in the text already points to.
//
// The card is built twice by design, as the contents list is: dc-nav.js builds
// it on a standalone page (it runs before first paint, so nothing moves), and
// buildGlance() here builds it in the desktop shell, where that script is
// stripped from the fetched article. Both find-or-create `#dcGlance`.
import { el, faNum } from './util.js?v=262';
import { mountBoxSave } from './box-save.js?v=262';

const LAYER = '[data-dc-presentation]';
const BOX = '.dc-box, div[role="note"]';
const isEn = (root) => !!(root && root.closest && root.closest('[lang="en"], [dir="ltr"]'))
  || /\/en\//.test((typeof location !== 'undefined' && location.pathname) || '');

const TEXT = {
  fa: { glance: 'در یک نگاه', sec: (i, n) => 'بخش ' + faNum(i) + ' از ' + faNum(n), more: 'صفحهٔ کامل در دانشنامه' },
  en: { glance: 'At a glance', sec: (i, n) => 'Section ' + i + ' of ' + n, more: 'Full entry in the glossary' },
};

// The author's words inside a box: its text without the layer's label.
export function boxText(box) {
  let s = '';
  const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) if (!n.parentElement.closest(LAYER)) s += n.data;
  return s.replace(/\s+/g, ' ').trim();
}

export function pageBoxes(boxes) {
  const out = [];
  boxes.forEach((b) => b.querySelectorAll(BOX).forEach((x) => {
    if (!x.closest('.dc-related-section, .author-note') && boxText(x)) out.push(x);
  }));
  return out;
}

// The opening paragraph: the first paragraph of prose that is the author's own
// and stands on its own (not a label, not inside a box, not the disclaimer).
function openingParagraph(boxes) {
  for (const b of boxes) {
    for (const p of b.querySelectorAll('p')) {
      if (p.closest(BOX) || p.closest(LAYER) || p.matches(LAYER + ', .dc-disclaimer, .kicker')) continue;
      if (p.querySelector('.lang-btn') && !p.textContent.replace(/English|فارسی/g, '').trim()) continue;
      if (p.textContent.trim().length > 40) return p;
    }
  }
  return null;
}

// ── what one box gives the card ──────────────────────────────────────────────
// The card sits ABOVE the article, so a box's words reach the reader before the
// paragraph they were written to follow. Two things a box can lean on, and the
// card has to supply or avoid both (dc-nav.js glanceRow does the same):
//   · its NAME — a frame-alone box is unlabelled on purpose when the heading
//     right above already says it («حرف آخر», «جمع‌بندی»), or when its own
//     words open with the author's label («Clinical Tip:»). The card takes that
//     name; a box with no name anywhere gets no row (never a bare «•»);
//   · its FIRST SENTENCE — «این ایمنی شرط داره.» points back at the paragraph
//     before the box. The row starts at the box's first sentence that does not
//     open by pointing back with a demonstrative («این ایمنی…»; «این کیس/مقاله…»
//     names the page itself and stays); a box whose every sentence does gets no row.
const ANAPHOR = /^(?:(?:این|آن|اون|همین|همان|همون)(?![‌\s]*(?:کیس|مطالعه|مقاله|مقالهٔ|مقاله‌ی|اپیزود|مطلب|صفحه|مرور|ویدیو|ایده|قسمت|بخش|نوشته)(?:[\s‌،,.:;]|$))|اینجا|اونجا|اینها|آنها|به همین|this|that|these|those|it|here|there)(?=[\s‌،,.:;]|$)/i;
const AUTHOR_LABEL = /^\s*([^.؟?!:：\n]{2,40})[:：]\s*/;

function headingAbove(box) {
  const prev = box.previousElementSibling;
  if (!prev || !/^H[2-6]$/.test(prev.tagName)) return null;
  let t = '';
  const w = document.createTreeWalker(prev, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) if (!n.parentElement.closest(LAYER)) t += n.data;
  t = t.replace(/^[∆\s]+/, '').replace(/\s+/g, ' ').trim();
  return t || null;
}

/** { label, text } for one box's row in «در یک نگاه», or null for no row. */
export function glanceRow(box) {
  let text = boxText(box);
  const own = box.querySelector(':scope > .dc-box-label')
    || box.querySelector(':scope > ' + LAYER + ':not(.dc-box-save):not(.dc-box-gate)');
  let label = own ? own.textContent.replace(/\s+/g, ' ').trim() : null;
  if (!label) label = headingAbove(box);
  if (!label) {
    const m = AUTHOR_LABEL.exec(text);
    if (m && m[1].trim().split(/\s+/).length <= 6) { label = m[1].trim(); text = text.slice(m[0].length); }
  }
  if (!label) return null;
  // a sentence ends at . ؟ ? ! followed by a space (so «2.5» stays whole)
  const sentences = text.replace(/([.؟?!])\s+/g, '$1\u0001').split('\u0001');
  const i = sentences.findIndex((x) => !ANAPHOR.test(x.trim()));
  if (i < 0) return null;
  return { label, text: sentences.slice(i).join(' ') };
}

/**
 * «در یک نگاه»: the page's boxed sentences, gathered under the opening
 * paragraph; a tap goes to the box. Only when two boxes or more give a row —
 * with one, the card would repeat a sentence the reader is about to meet.
 */
export function buildGlance(boxes, scope = document) {
  if (scope.querySelector('#dcGlance')) return;
  const notes = pageBoxes(boxes).map((box) => ({ box, row: glanceRow(box) })).filter((x) => x.row);
  const lead = openingParagraph(boxes);
  if (notes.length < 2 || !lead) return;
  const T = TEXT[isEn(lead) ? 'en' : 'fa'];
  // marked as presentation layer: it repeats the article's sentences, and the
  // highlight anchoring (anchor.js) must not read them as page text a second time
  const card = el('div', { class: 'dc-glance', id: 'dcGlance', 'data-dc-presentation': '' },
    [el('p', { class: 'dc-glance-h' }, T.glance)]);
  notes.forEach(({ box, row }) => {
    const btn = el('button', { type: 'button' }, [
      el('span', { class: 'dc-glance-lab' }, row.label),
      el('span', { class: 'dc-glance-tx' }, row.text),
    ]);
    btn.addEventListener('click', () => flashBox(box));
    card.appendChild(btn);
  });
  lead.insertAdjacentElement('afterend', card);
}

export function flashBox(box) {
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  box.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
  box.classList.add('dc-flash');
  setTimeout(() => box.classList.remove('dc-flash'), 1400);
}

// ── the section pill ─────────────────────────────────────────────────────────

// The numbered sections of a page: headings whose number the layer added, or
// headings the layer added whole («∆ ۱. …»).
export function numberedSections(root) {
  const out = [];
  root.querySelectorAll('h2, h3, h4').forEach((h) => {
    if (h.closest('.dc-related-section')) return;
    const whole = h.matches(LAYER) && /^\W*[0-9۰-۹]+\s*[.)]/.test(h.textContent.trim());
    const num = h.querySelector(':scope > span' + LAYER);
    if (!whole && !(num && /^[\s]*[0-9۰-۹]+\s*[.)]/.test(num.textContent))) return;
    out.push({ el: h, title: h.textContent.replace(/^\W*[0-9۰-۹]+\s*[.)]\s*/, '').replace(/^[∆\s]+/, '').trim() });
  });
  return out;
}

let pillOff = null;

/** A small fixed pill, «بخش ۲ از ۷ · …», shown once the reader is past the first section heading. */
export function mountSectionPill(root) {
  if (pillOff) { pillOff(); pillOff = null; }
  const secs = numberedSections(root);
  if (secs.length < 3) return;
  const T = TEXT[isEn(root) ? 'en' : 'fa'];
  const num = el('b', {});
  const title = el('span', {});
  const pill = el('div', { class: 'dc-secpill', 'aria-hidden': 'true' }, [num, title]);
  document.body.appendChild(pill);
  let queued = false;
  const draw = () => {
    queued = false;
    if (!root.isConnected) { off(); return; }
    const box = root.getBoundingClientRect();
    // Just under whatever covers the top of the article's column: a fixed or
    // sticky bar there (the site header, the shell's top bar), or the top edge
    // of the column that scrolls (the desktop shell scrolls a column, not the window).
    let top = 0;
    const x = Math.min(Math.max(box.left + box.width / 2, 1), innerWidth - 1);
    for (const hit of document.elementsFromPoint(x, 2)) {
      let n = hit;
      while (n && n !== document.body && n !== pill) {
        const pos = getComputedStyle(n).position;
        if (pos === 'fixed' || pos === 'sticky') {
          const r = n.getBoundingClientRect(); // a bar, not a full-height shell that happens to be fixed
          if (r.height < innerHeight * 0.4) { top = Math.max(top, r.bottom); break; }
        }
        n = n.parentElement;
      }
    }
    for (let n = root.parentElement; n && n !== document.body; n = n.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight) {
        top = Math.max(top, n.getBoundingClientRect().top);
        break;
      }
    }
    top += 8;
    let cur = -1;
    const line = top + innerHeight * 0.35; // a section is current once its heading is in the upper part of the screen
    secs.forEach((s, i) => { if (s.el.getBoundingClientRect().top < line) cur = i; });
    const inside = cur >= 0 && box.bottom > top + 80;
    pill.classList.toggle('is-on', inside);
    if (!inside) return;
    num.textContent = T.sec(cur + 1, secs.length);
    title.textContent = secs[cur].title;
    pill.style.top = top + 'px';
    const w = pill.offsetWidth;
    pill.style.left = Math.max(8, Math.min(box.left + box.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
  const off = () => {
    document.removeEventListener('scroll', onScroll, true);
    removeEventListener('resize', onScroll);
    pill.remove();
  };
  document.addEventListener('scroll', onScroll, true); // capture: the desktop shell scrolls a column, not the window
  addEventListener('resize', onScroll);
  pillOff = off;
  draw();
}

// ── the glossary preview ─────────────────────────────────────────────────────

const termCache = new Map();

// The term's name and the first lines of its definition, read from the term
// page itself (the glossary index carries names only).
async function loadTerm(href) {
  if (termCache.has(href)) return termCache.get(href);
  const job = (async () => {
    const res = await fetch(href, { credentials: 'omit' });
    if (!res.ok) throw new Error('glossary ' + res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const main = doc.querySelector('main') || doc.body;
    const name = (main.querySelector('h1') || doc.querySelector('title')).textContent.replace(/\s+/g, ' ').trim();
    const p = Array.from(main.querySelectorAll('p')).find((x) => !x.matches('.dc-disclaimer') && x.textContent.trim().length > 60);
    if (!p) throw new Error('glossary: no definition');
    const text = p.textContent.replace(/\s+/g, ' ').trim();
    const cut = text.search(/[.؟!](\s|$)/);
    return { name, text: cut > 60 && cut < 320 ? text.slice(0, cut + 1) : text.slice(0, 320) };
  })();
  termCache.set(href, job);
  job.catch(() => termCache.delete(href));
  return job;
}

let pop = null;
function closePop() { if (pop) { pop.remove(); pop = null; } }

/**
 * A tap on a glossary link in the text shows the term's first lines beside it;
 * the link inside the preview goes to the full page. A modified click (new
 * tab, etc.) and any failure leave the link working as it always did.
 */
export function mountGlossaryPreview(root) {
  if (root.dataset.dcGloss) return;
  root.dataset.dcGloss = '1';
  root.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="/glossary/"]');
    if (!a || !root.contains(a) || a.closest('.dc-gloss-pop, .dc-related-section, h1, h2, h3, h4')) return;
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!/\/glossary\/[^/]+\.html(?:[?#].*)?$/.test(a.getAttribute('href') || '')) return;
    e.preventDefault();
    if (pop && pop.dataset.for === a.href) { closePop(); return; }
    closePop();
    const T = TEXT[isEn(a) ? 'en' : 'fa'];
    const href = a.href;
    loadTerm(href).then((term) => {
      closePop();
      pop = el('div', { class: 'dc-gloss-pop', role: 'dialog', 'aria-label': term.name }, [
        el('b', {}, term.name), el('p', {}, term.text), el('a', { href }, T.more),
      ]);
      pop.dataset.for = href;
      pop.dir = isEn(a) ? 'ltr' : 'rtl';
      document.body.appendChild(pop);
      const r = a.getBoundingClientRect();
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      pop.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
      pop.style.top = (r.bottom + h + 12 < innerHeight ? r.bottom + 8 : Math.max(8, r.top - h - 8)) + 'px';
    }).catch(() => { location.href = href; });
  });
  if (!mountGlossaryPreview.wired) {
    mountGlossaryPreview.wired = true;
    document.addEventListener('click', (e) => { if (pop && !pop.contains(e.target) && !e.target.closest('a[href*="/glossary/"]')) closePop(); });
    document.addEventListener('scroll', closePop, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });
  }
}

/** Everything a page's presentation layer gets at run time, on either shell. */
export function mountPresentation(root, boxes, scope = document, contentId = null) {
  if (!root) return;
  try { buildGlance(boxes, scope); } catch (_) { /* never take an article down */ }
  try { mountSectionPill(root); } catch (_) { /* same */ }
  try { mountGlossaryPreview(root); } catch (_) { /* same */ }
  // «ذخیره در دفترچه» on every box (box-save.js) — after «در یک نگاه», which
  // reads the boxes' words, and asynchronous: it waits for /me.
  if (contentId) mountBoxSave(pageBoxes(boxes), contentId, boxText).catch(() => {});
}
