// «مسیرهای یادگیری» as a SHOWCASE — the first thing under «دنت‌کست پریمیوم» on
// the homepage and under the offer on the پریمیوم tab, for everybody who does
// not already have every pathway (approved mockup
// .dentcast/pathway-showcase-mockup.html, founder 1405/07/03).
//
// It exists because one pathway is now open to every account (`premium: false`
// in plus/pathways.json) and nothing outside the catalog said so: the homepage
// carried one locked «مسیرهای یادگیری» row among nine, so the open door sat
// behind a lock icon. The showcase says two things at once, and the second is
// why it is not simply a card for the open pathway:
//   1. this pathway can be walked now — the disc, the description and a blue
//      «شروع مسیر ›» button, or the reader's own progress bar once started;
//   2. it is ONE OF A FAMILY — a strip of the other pathways' discs, locked,
//      visible without a tap, and «دیدن هر N مسیر» expanding them in place.
// A lone open card would have read as «this is what there is».
//
// THE WORD «رایگان» IS NOT ON IT (founder: «هی رایگان رایگان نکنیم»). What says
// the door is open is its shape: no lock beside fourteen locks, and a button
// that is a verb, not a price. The amber line under it («… با اشتراک پریمیوم»)
// names the subscription once, which is what makes the contrast readable.
//
// Four rules, all from the mockup's notes:
//   - NO STEP COUNT anywhere: publishing step 5.6 grows pathways, and a number
//     on a homepage would be true only until the next publish. Progress is a
//     bar (its own proportion) and the family is a count of PATHWAYS, which
//     changes rarely.
//   - The certificate label is grey «به‌زودی» until the pathway is
//     certifiable, green «گواهی‌نامه» after — never a promise that is not open.
//   - No buy link: the section header / the tab's offer card stays the one.
//     A locked pathway leads to the catalog, never to the pricing page.
//   - A subscriber never sees it (every pathway is theirs); the callers decide
//     that, this module only draws.
import { el, faNum, icon } from './util.js?v=159';
import { api } from './api.js?v=159';

const CATALOG_HREF = '/plus/pathways.html';
/** How many locked discs the collapsed strip shows before «+N». */
export const STRIP_SIZE = 6;
// Mirrors plus-api/src/pathways.ts MIN_CERTIFICATE_STEPS / isCertifiable(),
// used ONLY for a visitor with no account (the API's `certifiable` wins
// whenever it is in hand). A wrong guess here costs one grey-vs-green label.
const MIN_CERTIFICATE_STEPS = 15;

let fileP = null;
function pathwaysFile() {
  if (!fileP) {
    fileP = fetch('/plus/pathways.json', { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('pathways ' + r.status))))
      .catch((e) => { fileP = null; throw e; });
  }
  return fileP;
}

// One load per reader per page: the homepage section and the tab ask together.
const loads = new Map();

/**
 * Every FULL pathway (bundles have their own rail), in the file's order, with
 * whether it is open to every account and — for a signed-in reader — their own
 * progress. The file supplies the shape (short labels, glyphs; `GET /pathways`
 * carries neither `short_fa` nor anything for a guest), the API the progress.
 * A failed API answer is not a failure: the showcase draws without progress.
 */
export function loadShowcase(me) {
  const key = me ? String(me.id || 'me') : 'anon';
  if (loads.has(key)) return loads.get(key);
  // Everything inside a .then, so nothing here can throw into the caller's
  // render: the showcase is an enhancement of a row that is already drawn.
  const p = Promise.resolve().then(() => Promise.all([
    pathwaysFile(),
    me ? Promise.resolve().then(() => api.pathways()).catch(() => null) : null,
  ])).then(([file, mine]) => {
    const own = new Map(((mine && mine.pathways) || []).map((x) => [x.id, x]));
    return (Array.isArray(file) ? file : [])
      .filter((p) => p && p.kind !== 'bundle')
      .map((p) => {
        const s = own.get(p.id);
        const steps = Array.isArray(p.steps) ? p.steps.length : 0;
        return {
          id: p.id,
          title_fa: p.title_fa,
          short_fa: p.short_fa || p.title_fa,
          glyph: p.glyph || 'icon-lightning',
          description_fa: p.description_fa || '',
          open: p.premium === false,
          certifiable: s && typeof s.certifiable === 'boolean'
            ? s.certifiable
            : p.certificate !== 'pending' && steps >= MIN_CERTIFICATE_STEPS,
          completed_steps: s ? s.completed_steps || 0 : 0,
          total_steps: s ? s.total_steps || steps : steps,
          started: !!(s && (s.enrolled || s.completed_steps > 0)),
          // The percent THIS pathway's certificate mints, read from the file
          // (`certificate_discount_percent`, 1405/07/03) — never typed into the
          // card, so retuning it is one edit. Absent = the API's default, which
          // the client does not know, so the card then names no number.
          discount: discountOf(p.certificate_discount_percent),
        };
      });
  });
  p.catch(() => loads.delete(key));
  loads.set(key, p);
  return p;
}

const pathwayHref = (id) => '/plus/pathway.html?id=' + encodeURIComponent(id);

function discountOf(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 100 ? Math.round(n) : null;
}

/**
 * The certificate and what it buys, on ONE label (founder, 1405/07/03): the
 * discount belongs to the certificate, so it is said beside it and nowhere
 * else on the card. While the certificate is not open the whole line stays
 * grey and ends in «به‌زودی» — a discount nobody can earn yet is not
 * announced loudly. Once open it turns certificate green, never amber: the
 * discount is earned, not bought. «٪۲۰» is true for every reader who can see
 * the card (a first purchase takes it whole, a returning one in cap-sized
 * instalments), which is why the card never says «یک‌جا».
 */
function certLabel(p) {
  const off = p.discount ? '٪' + faNum(p.discount) + ' تخفیف اشتراک' : null;
  if (p.certifiable) {
    return el('span', { class: 'dcp-pws-cert is-open' }, off ? '🎓 گواهی‌نامه · ' + off : '🎓 گواهی‌نامه');
  }
  return el('span', { class: 'dcp-pws-cert' }, off ? '🎓 گواهی‌نامه + ' + off + ' · به‌زودی' : '🎓 گواهی‌نامه: به‌زودی');
}

function featured(p) {
  const pct = p.started && p.total_steps > 0
    ? Math.max(3, Math.min(100, Math.round((p.completed_steps / p.total_steps) * 100)))
    : 0;
  return el('div', { class: 'dcp-pws-feat', 'data-dcp-pws-open': p.id }, [
    el('div', { class: 'dcp-pws-ft-row' }, [
      el('span', { class: 'dcp-pws-disc' }, icon(p.glyph)),
      el('span', { class: 'dcp-pws-ft-t' }, [
        el('b', { class: 'dcp-pws-ft-title' }, p.title_fa),
        // One word, once, and not a price: «باز» says you can walk in, which
        // is the point; «رایگان» would say what it costs (founder: «هی رایگان
        // رایگان نکنیم»).
        el('span', { class: 'dcp-pws-ft-open' }, 'باز برای همه'),
      ]),
    ]),
    p.description_fa ? el('p', { class: 'dcp-pws-ft-desc' }, p.description_fa) : null,
    p.started ? el('div', { class: 'dcp-pws-prog' }, [
      el('span', { class: 'dcp-pws-bar' }, [el('i', { style: 'width:' + pct + '%' })]),
      el('span', {}, 'ادامه از جایی که ماندی'),
    ]) : null,
    el('div', { class: 'dcp-pws-ft-foot' }, [
      certLabel(p),
      el('a', { class: 'dcp-pws-go', href: pathwayHref(p.id) }, p.started ? 'ادامهٔ مسیر ›' : 'شروع مسیر ›'),
    ]),
  ].filter(Boolean));
}

function stripDisc(p) {
  return el('span', { class: 'dcp-pws-pt' }, [
    el('span', { class: 'dcp-pws-pt-disc' }, icon(p.glyph)),
    el('i', { class: 'dcp-pws-lk', 'aria-hidden': 'true' }, '🔒'),
    el('span', { class: 'dcp-pws-pt-name' }, p.short_fa),
  ]);
}

function gridItem(p) {
  return el('a', { class: 'dcp-pws-pg', href: CATALOG_HREF }, [
    el('span', { class: 'dcp-pws-pgi' }, icon(p.glyph)),
    el('span', { class: 'dcp-pws-pgt' }, p.title_fa),
    el('span', { class: 'dcp-pws-pgl', 'aria-hidden': 'true' }, '🔒'),
  ]);
}

/**
 * The showcase element, or null when there is nothing to show (an empty file).
 * `list` is loadShowcase()'s answer.
 */
export function pathwayShowcase(list) {
  const all = Array.isArray(list) ? list : [];
  if (!all.length) return null;
  const open = all.filter((p) => p.open);
  const locked = all.filter((p) => !p.open);

  const head = el('div', { class: 'dcp-pws-head' }, [
    el('span', { class: 'dcp-pws-ico' }, icon('icon-lightning')),
    el('div', { class: 'dcp-pws-ht' }, [
      el('b', {}, 'مسیرهای یادگیری'),
      el('span', {}, faNum(all.length) + ' مسیر · هر کدام از پیش‌نیاز تا پیشرفته، به ترتیب درست'),
    ]),
  ]);

  const parts = [head, ...open.map(featured)];
  if (locked.length) {
    parts.push(el('div', { class: 'dcp-pws-others' }, open.length
      ? faNum(locked.length) + ' مسیر دیگر — همین شکل، با اشتراک پریمیوم'
      : faNum(locked.length) + ' مسیر — با اشتراک پریمیوم'));
    const shown = locked.slice(0, STRIP_SIZE);
    const rest = locked.length - shown.length;
    const strip = el('span', { class: 'dcp-pws-strip' }, [
      ...shown.map(stripDisc),
      rest > 0 ? el('span', { class: 'dcp-pws-pt dcp-pws-pt-more' }, [
        el('b', { dir: 'ltr' }, '+' + faNum(rest)), // «+۸», never bidi-flipped to «۸+»
        el('span', { class: 'dcp-pws-pt-name' }, 'مسیر دیگر'),
      ]) : null,
    ].filter(Boolean));
    parts.push(el('details', { class: 'dcp-pws-more' }, [
      el('summary', {}, [
        strip,
        el('span', { class: 'dcp-pws-tog' }, [
          el('span', { class: 'dcp-pws-tog-c' }, 'دیدن هر ' + faNum(locked.length) + ' مسیر ▾'),
          el('span', { class: 'dcp-pws-tog-o' }, 'بستن ▴'),
        ]),
      ]),
      el('div', { class: 'dcp-pws-grid' }, locked.map(gridItem)),
      el('a', { class: 'dcp-pws-cat', href: CATALOG_HREF }, 'کاتالوگ مسیرها: ترتیب، پیشرفت و آزمون هر مسیر ›'),
    ]));
  }
  return el('div', { class: 'dcp-pws', 'data-dcp-showcase': '' }, parts);
}

/**
 * The full pathways a signed-OUT visitor may walk into (`premium: false`), by
 * id → title, straight from the published file. The gates on the catalog, a
 * pathway page and the exam page ask it before saying «ویژه‌ی پریمیوم», so a
 * guest who tapped «شروع مسیر ›» on the showcase is never told the pathway the
 * card called «باز برای همه» is premium. A failed read resolves to an empty
 * map — the gate then says what it said before.
 */
export function openPathways() {
  return pathwaysFile()
    .then((file) => new Map((Array.isArray(file) ? file : [])
      .filter((p) => p && p.kind !== 'bundle' && p.premium === false)
      .map((p) => [p.id, p.title_fa])))
    .catch(() => new Map());
}
