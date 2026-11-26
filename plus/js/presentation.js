// What the shared scripts build from a page's presentation layer (module 03
// «Structure, chips and callout boxes»). None of it is in any page's markup and
// none of it adds a word to the article: the «در یک نگاه» card repeats the
// sentences the page's own callout boxes already frame, the section pill reads
// the numbers already on the headings, and the glossary preview shows the
// first lines of the term page a link in the text already points to.
//
// The card has one builder, dc-nav.js's `window.dcBuildGlance`: dc-nav.js
// calls it on a standalone page (before first paint, so nothing moves), and
// buildGlance() here calls it in the desktop shell, where that script is
// stripped from the fetched article. Both find-or-create `#dcGlance`.
import { el, faNum } from './util.js?v=265';

const LAYER = '[data-dc-presentation]';
const isEn = (root) => !!(root && root.closest && root.closest('[lang="en"], [dir="ltr"]'))
  || /\/en\//.test((typeof location !== 'undefined' && location.pathname) || '');

const TEXT = {
  fa: { sec: (i, n) => 'بخش ' + faNum(i) + ' از ' + faNum(n), more: 'صفحهٔ کامل در دانشنامه' },
  en: { sec: (i, n) => 'Section ' + i + ' of ' + n, more: 'Full entry in the glossary' },
};

/**
 * «در یک نگاه»: one builder for both shells, `window.dcBuildGlance` in
 * dc-nav.js (which always loads first: it is what injects plus.js). It decides
 * each row's label the way tools/presentation_lint.py decides a box needs
 * none, and never shows a placeholder. No copy here: two copies drifted once
 * and showed «•» for every box the author's words already label.
 */
export function buildGlance(boxes, scope = document) {
  if (typeof window !== 'undefined' && typeof window.dcBuildGlance === 'function') window.dcBuildGlance(boxes, scope);
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
export function mountPresentation(root, boxes, scope = document) {
  if (!root) return;
  try { buildGlance(boxes, scope); } catch (_) { /* never take an article down */ }
  try { mountSectionPill(root); } catch (_) { /* same */ }
  try { mountGlossaryPreview(root); } catch (_) { /* same */ }
}
