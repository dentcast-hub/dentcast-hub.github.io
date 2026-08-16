// /des-board/ — DentCast's pages arranged by the strength of the evidence under
// them. The explanation above this module's mount point is STATIC markup in the
// page; everything here is the arrangement, which is what premium buys.
//
// THE GATE IS ON THE ARRANGEMENT, NEVER ON THE PAGE. The same split `pillar` and
// `up-board` already make, so this is one rule applied a third time rather than a
// new one: the page, its title, and the whole explanation are public — a claim
// about how carefully this site handles evidence is worth nothing if only people
// who already paid can read it. What a subscription buys is seeing WHICH page
// sits on WHICH shelf.
//
// THE TAB IS SHOWN TO EVERYONE, in the same place, locked or not. A reader who
// cannot open it must still learn the arrangement exists, or there is nothing to
// want — and the gate names the shelves and how full each one is before it names
// a price, because nobody buys an ordering they have never seen.
//
// NOTHING IS STORED AND NOTHING IS COMPUTED TWICE. Every number here is derived
// at render time from two files that already exist: plus/des-scores.json (written
// by publish step 4.13) and up-board/index.json (written by
// tools/build_upboard_index.py on every publish). There is no endpoint, no
// migration, and no third copy of a page's title that could drift from the other
// two — the API is asked exactly one question, «is this reader premium».
import { el, faNum } from './util.js?v=9';
import { currentUser, meStatus } from './api.js?v=9';
import { premiumCta, guestPremiumExtras, lapsedNote, unreachableGate } from './premium-cta.js?v=9';
import { openLoginModal } from './login-modal.js?v=9';

/** Which gate sent a buyer, for the pricing page's ?from= report. */
const FROM = 'gate-desboard';

// Carried onto the data fetches so one asset_version bump invalidates the code
// and the catalogs together — the same trick upboard-page.js plays.
const ASSET_V = '1';

/* ---------------------------------------------------------- vocabulary --- */

// Weakest→strongest. This is the band's own order everywhere on the site
// (plus/js/des.js draws its five blocks E D C B A), and comparing bands means
// comparing positions in THIS list.
const LADDER = ['E', 'D', 'C', 'B', 'A'];

const BAND_FA = {
  A: 'شواهد قوی', B: 'شواهد متوسط', C: 'شواهد محدود',
  D: 'شواهد ضعیف', E: 'سطح پایه',
};

// Deliberately plainer than des.js's own labels: «مواد (آزمایشگاهی)» is the
// spec's word for the question type, «مواد» is what a reader scanning a list
// needs. The welding rule is unchanged — the type is printed with every band.
const QT_FA = {
  THERAPY: 'درمان', ETIOLOGY: 'علت بیماری',
  DIAGNOSTIC: 'تشخیص', MATERIAL: 'مواد و آزمایشگاه',
};

// The transparency shelves for DentCast's own writing. Deliberately shelves and
// not a ranking: 80 of these pages score exactly 15 and 34 score exactly 19, so a
// numbered ladder over them would be 80 rungs at one height.
const SHELVES = [
  [19, 19, '۱۹', 'کاملاً شفاف'],
  [16, 18, '۱۸', 'شفاف'],
  [15, 15, '۱۵', 'شفافیت پایه'],
  [0, 14, 'زیر ۱۵', 'کمتر از پایه'],
];

const bandIdx = (b) => LADDER.indexOf(b);

/* ---------------------------------------------------------------- data --- */

async function loadData() {
  const [scores, index] = await Promise.all([
    fetch('/plus/des-scores.json?v=' + ASSET_V, { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('des-scores ' + r.status)))),
    fetch('/up-board/index.json?v=' + ASSET_V, { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('index ' + r.status)))),
  ]);
  const meta = new Map((index.items || []).map((i) => [i.id, i]));

  const pages = [];
  Object.keys(scores).forEach((cid) => {
    const rec = scores[cid];
    const m = meta.get(cid);
    // A scored page missing from the catalog is a page that no longer exists (or
    // was renamed). Dropping it is right: this page links INTO articles, and a
    // row whose URL we cannot resolve is a dead link, not a missing feature.
    if (!m || !Array.isArray(rec.sources)) return;
    const src = rec.sources;
    const res = src.filter((s) => s.content_type === 'RESEARCH');
    const na = src.filter((s) => s.content_type === 'NOT_APPRAISABLE');
    const own = src.filter((s) => s.content_type === 'COMMENTARY');
    const p = {
      cid, url: m.u, title: m.ti, sec: m.tf, date: m.d,
      ord: (index.items || []).indexOf(m), res, na, own,
    };
    if (res.length) {
      // The page takes the band of its STRONGEST source — the same rule the chip
      // on the article itself already runs on (des.js chipFor). Sources are
      // independent supports, not links in a chain: citing a narrative review
      // alongside a meta-analysis does not weaken the meta-analysis. The full
      // range is printed beside the letter so nothing is hidden.
      const best = res.reduce((w, s) => (
        bandIdx(s.band) > bandIdx(w.band)
        || (s.band === w.band && (s.des_score || 0) > (w.des_score || 0)) ? s : w), res[0]);
      const worst = res.reduce((w, s) => (bandIdx(s.band) < bandIdx(w.band) ? s : w), res[0]);
      p.kind = 'research';
      p.band = best.band;
      p.score = best.des_score;
      p.qt = best.question_type;
      p.worst = worst.band;
    } else {
      p.kind = 'own';
      p.score = own.length ? own[0].des_score : null;
      p.author = own.length ? ((own[0].citation || {}).authors || '') : '';
    }
    pages.push(p);
  });
  return pages;
}

/* -------------------------------------------------------------- pieces --- */

// One block per cited paper, strongest first. A page's shape at a glance: «one
// strong column» and «twelve light ones» are different objects, and the count
// alone cannot tell them apart.
function spectrum(p) {
  const blocks = p.res.slice()
    .sort((a, b) => bandIdx(b.band) - bandIdx(a.band))
    .map((s) => el('span', { class: 'sp-b bd-' + s.band, title: BAND_FA[s.band] || s.band }));
  p.na.forEach(() => blocks.push(
    el('span', { class: 'sp-b sp-na', title: 'کتاب مرجع — امتیازدهی نمی‌شود' })));
  return el('span', { class: 'sp', 'aria-hidden': 'true' }, blocks);
}

function sourceRow(s) {
  const c = s.citation || {};
  // A textbook is tertiary literature: no protocol, no search strategy, no
  // risk-of-bias appraisal of what it summarises, so the appraisal tools have
  // nothing to measure. It is not a low grade — it is the honest third answer,
  // and dropping it from the list is the bug spec v1.9 fixed.
  if (s.content_type === 'NOT_APPRAISABLE') {
    return el('li', { class: 'sr sr-na' }, [
      el('span', { class: 'sr-g sr-gna' }, 'کتاب'),
      el('div', { class: 'sr-m' }, [
        el('p', { class: 'sr-t' }, c.title || ''),
        el('p', { class: 'sr-s fa' },
          'کتاب مرجع است، نه مطالعه — روشی ندارد که بشود ارزیابی کرد، پس نمره نمی‌گیرد.'),
      ]),
    ]);
  }
  const bits = [c.journal, c.year ? faNum(c.year) : ''].filter(Boolean).join(' · ');
  const meta = el('p', { class: 'sr-s' }, bits);
  if (c.doi) {
    meta.appendChild(document.createTextNode(bits ? ' · ' : ''));
    meta.appendChild(el('a', {
      class: 'sr-doi', href: 'https://doi.org/' + c.doi,
      target: '_blank', rel: 'noopener',
    }, 'DOI'));
  }
  return el('li', { class: 'sr bd-' + s.band }, [
    el('span', { class: 'sr-g' }, s.band),
    el('div', { class: 'sr-m' }, [
      el('p', { class: 'sr-t' }, c.title || ''),
      meta,
      el('p', { class: 'sr-s fa' }, [
        el('span', { class: 'sr-tag' }, 'پرسشِ ' + (QT_FA[s.question_type] || '—')),
        // ABSTRACT_ONLY is a caveat on the number, not an alarm about the paper.
        s.provisional ? el('span', { class: 'sr-tag sr-prov' }, 'فقط چکیده در دسترس بود') : null,
      ].filter(Boolean)),
    ]),
  ]);
}

// The DentCast page is the object and the paper is its evidence — never the other
// way round. The title is the link; a page citing fourteen papers is one card, not
// fourteen rows scattered across four shelves.
function researchCard(p) {
  const n = p.res.length + p.na.length;
  const spread = p.band === p.worst ? '' : ' (از ' + p.band + ' تا ' + p.worst + ')';
  const sources = p.res.slice().sort((a, b) => bandIdx(b.band) - bandIdx(a.band)).concat(p.na);
  return el('li', { class: 'pc bd-' + p.band }, [
    el('a', { class: 'pc-t', href: p.url }, p.title),
    el('p', { class: 'pc-m' }, [el('span', { class: 'chipx' }, p.sec), p.date || '']),
    el('div', { class: 'pc-e' }, [
      el('span', { class: 'pc-g' }, p.band),
      el('div', { class: 'pc-gm' }, [
        el('b', {}, BAND_FA[p.band] || p.band),
        el('i', {}, 'بر پایه‌ی ' + faNum(n) + ' منبع' + spread
          + ' · پرسشِ ' + (QT_FA[p.qt] || '—')),
      ]),
    ]),
    spectrum(p),
    el('details', { class: 'pc-d' }, [
      el('summary', {}, ['این مطلب از چه مقاله‌هایی آمده؟ ',
        el('span', { class: 'pc-dn' }, faNum(n))]),
      el('ul', { class: 'sl' }, sources.map(sourceRow)),
    ]),
  ]);
}

// The author travels with the card. Most of these are the founder's, but guests
// write here too — six of them in the current set — and one blanket sentence
// naming him misattributes every one of theirs.
function ownCard(p) {
  return el('li', { class: 'pc pc-own' }, [
    el('a', { class: 'pc-t', href: p.url }, p.title),
    el('p', { class: 'pc-m' }, [el('span', { class: 'chipx' }, p.sec), p.date || '']),
    el('div', { class: 'pc-e' }, [
      el('span', { class: 'pc-g pc-gown' }, [faNum(p.score), el('i', {}, '/۱۹')]),
      el('div', { class: 'pc-gm' }, [
        el('b', {}, 'تجربه و تحلیل بالینی'),
        el('i', {}, p.author || 'دنت‌کست'),
      ]),
    ]),
  ]);
}

function groupHeader(badge, title, count, ownStyle) {
  return el('header', { class: 'gh' }, [
    el('span', { class: 'gh-g' + (ownStyle ? ' gh-own' : '') }, badge),
    el('div', {}, [el('h3', {}, title)]),
    el('span', { class: 'gh-n' }, faNum(count) + ' مطلب'),
  ]);
}

/**
 * The distribution in one line — the page's only summary, and its index.
 *
 * `cells` is [key, badge, count]. An empty shelf is drawn dimmed rather than
 * dropped: «no page on this site reaches A» is the single most informative thing
 * the scale can say, and a rail that silently omits A would hide it.
 *
 * `jump` is passed only where the shelves exist to be scrolled to. Inside the
 * gate they do not, so the same rail renders as a static preview — which is the
 * point of it being one component: the summary a subscriber reads and the
 * preview a visitor is shown can never disagree about what is on the site.
 */
function bandRail(cells, ownStyle, jump) {
  return el('div', { class: 'rail' + (ownStyle ? ' rail-own' : ''), role: 'group' },
    cells.map(([key, badge, n]) => {
      const cell = el('button', {
        class: 'rail-c' + (ownStyle ? '' : ' bd-' + key),
        type: 'button',
        disabled: n && jump ? null : 'disabled',
        'aria-label': badge + ' — ' + faNum(n) + ' مطلب',
      }, [
        el('span', { class: 'rail-g' }, badge),
        el('span', { class: 'rail-n' }, faNum(n)),
      ]);
      if (n && jump) cell.addEventListener('click', () => jump(key));
      return cell;
    }));
}

/* ------------------------------------------------------ the arrangement --- */

function buildArrangement(pages) {
  const research = pages.filter((p) => p.kind === 'research')
    .sort((a, b) => bandIdx(b.band) - bandIdx(a.band)
      || (b.score || 0) - (a.score || 0)
      || a.cid.localeCompare(b.cid));
  const own = pages.filter((p) => p.kind === 'own').sort((a, b) => a.ord - b.ord);

  const resPanel = el('div', { id: 'dbRes' }, [
    bandRail(['A', 'B', 'C', 'D', 'E'].map((b) => [b, b, research.filter((p) => p.band === b).length]),
      false, (b) => {
        const t = resPanel.querySelector('[data-shelf="' + b + '"]');
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }),
  ]);
  ['A', 'B', 'C', 'D', 'E'].forEach((b) => {
    const grp = research.filter((p) => p.band === b);
    if (!grp.length) return;
    resPanel.appendChild(el('section', { class: 'grp', 'data-shelf': b }, [
      groupHeader(b, BAND_FA[b], grp.length, false),
      el('ul', { class: 'pl' }, grp.map(researchCard)),
    ]));
  });

  const ownPanel = el('div', { id: 'dbOwn', hidden: true }, [
    bandRail(SHELVES.map(([lo, hi, badge]) =>
      [String(lo), badge, own.filter((p) => (p.score || 0) >= lo && (p.score || 0) <= hi).length]),
    true, (k) => {
      const t = ownPanel.querySelector('[data-shelf="' + k + '"]');
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  ]);
  SHELVES.forEach(([lo, hi, badge, name]) => {
    const rows = own.filter((p) => (p.score || 0) >= lo && (p.score || 0) <= hi);
    if (!rows.length) return;
    ownPanel.appendChild(el('section', { class: 'grp', 'data-shelf': String(lo) }, [
      groupHeader(badge, name, rows.length, true),
      el('ul', { class: 'pl' }, rows.map(ownCard)),
    ]));
  });

  const srcCount = research.reduce((n, p) => n + p.res.length + p.na.length, 0);
  const tabs = el('div', { class: 'seg', role: 'tablist' }, [
    el('button', { role: 'tab', 'aria-selected': 'true', 'data-p': 'res' },
      ['بر پایه‌ی مقاله', el('i', {}, faNum(research.length) + ' مطلب، ' + faNum(srcCount) + ' منبع')]),
    el('button', { role: 'tab', 'aria-selected': 'false', 'data-p': 'own' },
      ['تجربه و تحلیل دنت‌کست', el('i', {}, faNum(own.length) + ' مطلب')]),
  ]);
  Array.from(tabs.children).forEach((btn) => {
    btn.addEventListener('click', () => {
      Array.from(tabs.children).forEach((x) => x.setAttribute('aria-selected', x === btn ? 'true' : 'false'));
      resPanel.hidden = btn.dataset.p !== 'res';
      ownPanel.hidden = btn.dataset.p !== 'own';
    });
  });

  return el('div', {}, [tabs, resPanel, ownPanel]);
}

/* --------------------------------------------------------------- gates --- */

function gateView(pages, user, guest) {
  const foot = el('div', { class: 'gate-f' }, [
    lapsedNote(user) ? el('p', {}, lapsedNote(user)) : null,
    el('p', {}, ['قفسه‌ها را می‌بینید؛ پریمیوم نشان می‌دهد ',
      el('b', {}, 'کدام مطلب روی کدام قفسه است'), '.']),
    // A signed-out reader may already be a subscriber who is simply logged out on
    // this device, and selling a subscription to somebody who owns one is worse
    // than saying nothing. So sign-in leads and the purchase link follows.
    guest
      ? el('button', {
        class: 'dcp-btn dcp-btn-primary', type: 'button',
        onclick: async () => {
          const res = await openLoginModal({ returnTo: '/des-board/' });
          if (res && res.user) location.reload();
        },
      }, 'ورود')
      : premiumCta(FROM),
    el('span', { class: 'gate-s' },
      'درجه‌ی هر مطلب روی خودِ همان مطلب، برای همه، رایگان است.'),
  ].filter(Boolean));
  if (guest) guestPremiumExtras(FROM).forEach((n) => foot.appendChild(n));

  const research = pages.filter((p) => p.kind === 'research');
  const own = pages.filter((p) => p.kind === 'own');
  return el('div', { class: 'gate' }, [
    el('h2', { class: 'gate-h' }, 'طبقه‌بندی بر اساس قدرت شواهد'),
    el('p', { class: 'gate-p' },
      'هر مطلب سرِ قفسه‌ای می‌رود که قوی‌ترین منبعش تعیین می‌کند.'),
    // The same rail a subscriber sees, with only the membership withheld: the
    // shape of the arrangement is shown before it is priced, because nobody
    // buys an ordering they have never seen.
    bandRail(['A', 'B', 'C', 'D', 'E'].map((b) => [b, b, research.filter((p) => p.band === b).length]), false, null),
    bandRail(SHELVES.map(([lo, hi, badge]) =>
      [String(lo), badge, own.filter((p) => (p.score || 0) >= lo && (p.score || 0) <= hi).length]), true, null),
    foot,
  ]);
}

/* ---------------------------------------------------------------- init --- */

export async function initDesBoard(root) {
  if (!root) return;
  const body = root.querySelector('#dbBody');
  const tab = root.querySelector('#dbTab');
  const lock = root.querySelector('#dbTabLock');
  const sub = root.querySelector('#dbTabSub');
  const chev = root.querySelector('#dbTabChev');
  if (!body || !tab) return;

  // THREE answers, not two, and conflating any of them is a real bug. A reader
  // who is signed out is not a reader without a subscription, and «we could not
  // ask» is neither — while the API is redeploying, a gate that guesses tells
  // paying subscribers to go and buy what they already own. premium-cta.js's
  // unreachableGate exists for exactly this.
  const user = await currentUser();
  const unreachable = !user && meStatus() === 'error';
  const guest = !user && !unreachable;
  const premium = !!user && user.tier === 'premium';

  if (unreachable) {
    lock.hidden = true;
    sub.textContent = 'ارتباط با سرور برقرار نشد';
    tab.addEventListener('click', () => {
      tab.setAttribute('aria-expanded', 'true');
      unreachableGate(body);
      body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return;
  }

  let pages;
  try {
    pages = await loadData();
  } catch (err) {
    // The catalogs are static files on the same origin. If they cannot be read
    // the arrangement does not exist to gate, and the explanation above is still
    // the whole free experience — so say so plainly and sell nothing.
    lock.hidden = true;
    sub.textContent = 'فهرست در دسترس نیست';
    tab.addEventListener('click', () => {
      body.replaceChildren(el('p', { class: 'note' },
        'فهرست مطالب الان در دسترس نیست. کمی بعد دوباره امتحان کنید.'));
    });
    return;
  }

  const subEl = root.querySelector('#dbSub');
  if (subEl) {
    const nRes = pages.filter((p) => p.kind === 'research').length;
    const nSrc = pages.reduce((n, p) => n + p.res.length + p.na.length, 0);
    subEl.textContent = faNum(pages.length) + ' مطلب ارزیابی‌شده · '
      + faNum(nRes) + ' مورد بر پایه‌ی ' + faNum(nSrc) + ' مقاله‌ی منتشرشده';
  }

  if (premium) {
    lock.hidden = true;
    sub.hidden = true;
  }

  let built = false;
  const open = () => {
    if (!built) {
      body.replaceChildren(premium ? buildArrangement(pages) : gateView(pages, user, guest));
      built = true;
    }
    const isOpen = tab.getAttribute('aria-expanded') === 'true';
    if (!isOpen) {
      tab.setAttribute('aria-expanded', 'true');
      chev.style.transform = 'rotate(90deg)';
    }
    body.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  tab.addEventListener('click', open);

  // A premium reader came here for the arrangement; making them press a button to
  // see the thing they pay for is a toll booth, not a disclosure. A free reader
  // keeps the tap, so the gate is something they opened rather than something
  // that was put in front of them.
  if (premium) open();
}
