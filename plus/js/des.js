// DentCast Evidence Score — the reader-facing display.
//
// The score itself is produced at publish time by workflow step 4.13 (the
// scoring prompt in .dentcast/dentcast-evidence-score-v1.9.md) and stored in
// plus/des-scores.json, keyed by content_id. Nothing here computes, judges, or
// re-derives anything: this module renders what that file already says.
//
// NO PAGE CARRIES DES MARKUP. Same rule the article action row runs on — zero
// of the article pages carry that markup either, which is exactly why tidying
// it cost no page edits. A DES badge appearing on 449 pages must therefore
// cost 449 page edits of nothing at all, so it lives here and reads the file.
//
// TWO SURFACES, like votes.js and article-threads.js before it: the standalone
// article page, and the desktop shell, which fetches an article into column C
// with dc-nav.js stripped out. Both call mountDes(); a feature that quietly
// works on phones and not on desktop is the gap buildShareButton() was written
// to close.
//
// THE ABSENCE RULE — this is the whole exception mechanism, and it is data, not
// a branch here: a content_id with no record renders NOTHING. An episode that
// is only a caption and an audio file has no identified paper, so Question 4.8
// of the workflow gives it no score, so this module draws nothing on it. There
// is deliberately no "podcast" test in this file — an episode that DOES cite
// papers (episodes/episode-161 cites three) is scored and shown like anything
// else. The rule is "no record, no badge", never "no audio, no badge".
import { el, faNum } from './util.js?v=180';

/* ------------------------------------------------------------ the data -- */

let filePromise = null;

// One fetch per page-load, shared by the chip and the card. `no-cache` (not
// `no-store`) so the browser still revalidates cheaply rather than re-downloading
// on every article — the same posture content-index.js takes for its model.
function loadScores() {
  if (!filePromise) {
    filePromise = fetch('/plus/des-scores.json', { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return filePromise;
}

/* ----------------------------------------------------------- vocabulary -- */

const BANDS = ['E', 'D', 'C', 'B', 'A'];

// Exported so any OTHER surface that draws a DES band — currently
// plus/js/des-scorer.js's answer card — uses this exact vocabulary instead of
// re-typing it. "Reuse the vocabulary, never draw a second band" is the rule
// this file was built on; it applies to every future caller too.
export const BAND_FA = {
  A: 'شواهد قوی',
  B: 'شواهد متوسط',
  C: 'شواهد محدود',
  D: 'شواهد ضعیف',
  E: 'سطح پایه / دیدگاه',
};

// The question type is welded to the band everywhere it appears. Bands are
// comparable only INSIDE one question type — an A on a bench test and an A on a
// clinical trial come from two different design tables — so the band letter is
// never printed without it.
export const QTYPE_FA = {
  THERAPY: 'درمانی',
  DIAGNOSTIC: 'تشخیصی',
  MATERIAL: 'مواد (آزمایشگاهی)',
  ETIOLOGY: 'علت‌شناسی',
};

const SOURCE_KIND_FA = { book: 'کتاب مرجع' };

/* ------------------------------------------------------------- pieces --- */

// Five discrete blocks, only the current one coloured. Deliberately not a gauge
// or a continuous bar: the output is not continuous, and a needle would give a
// two-point difference a meaning it does not have. Exported for des-scorer.js.
export function bandBar(band) {
  return el('span', { class: 'dc-des-bar', 'aria-hidden': 'true' },
    BANDS.map((b) => el('span', {
      class: 'dc-des-blk dc-des-b-' + b + (b === band ? ' is-on' : ''),
    }, b)));
}

// The chip for a page citing SEVERAL papers shows the RANGE, and its colour is
// the strongest band in it.
//
// It used to show the weakest, on the reasoning that the weakest is the honest
// one-letter summary of what a page rests on. That holds for three sources and
// breaks completely at thirteen: sharehub/share-14 cites two meta-analyses and
// an RCT alongside a couple of narrative reviews, and the minimum rule printed
// «۱۳ منبع · از E» — a page standing on the best evidence in its field, labelled
// weak because of the weakest thing it happened to also cite. Past a handful of
// citations the minimum is almost always E, so the chip stopped carrying any
// information and only ever read as bad news.
//
// The minimum is not merely pessimistic, it is wrong about what a citation list
// IS. Sources are independent supports, not links in a chain: adding a narrative
// review to a page does not weaken the meta-analysis already cited there. A rule
// under which adding evidence can only ever lower the score is backwards.
//
// The maximum alone would be the opposite error — it reads as cherry-picking and
// hides that the page also leans on weak material. The range says both in the
// same breath and hides nothing, and the card below lists every source with its
// own band anyway.
function chipFor(rec, named) {
  const src = rec.sources[0];
  const multi = rec.sources.length > 1;
  const band = src.band;
  const idx = (b) => BANDS.indexOf(b);
  // A NOT_APPRAISABLE source (a textbook) has no band, so it defines no end of
  // the range — but it IS a source the page cites, so it still counts. Dropping
  // it from the count would put the chip and the card in disagreement about how
  // many references the page has.
  const banded = rec.sources.filter((s) => idx(s.band) >= 0);
  const seed = (banded[0] || {}).band;
  const best = banded.reduce((w, s) => (idx(s.band) > idx(w) ? s.band : w), seed);
  const worst = banded.reduce((w, s) => (idx(s.band) < idx(w) ? s.band : w), seed);
  const spread = best !== worst ? best + '–' + worst : best;
  const label = named
    ? 'سطح شواهد: ' + (multi ? spread : band)
    : multi
      ? faNum(rec.sources.length) + ' منبع · ' + spread
      : BAND_FA[band] || band;
  return el('button', {
    class: 'dc-act dc-act-des dc-des-band-' + (multi ? best : band),
    type: 'button',
    'data-pane': 'src',
    'aria-label': multi
      ? 'ارزیابی شواهد این مطلب — ' + faNum(rec.sources.length) + ' منبع، از باند ' + best + ' تا ' + worst
      : 'ارزیابی شواهد این مطلب',
  }, [
    el('span', { class: 'dc-des-dot' }, multi ? best : band),
    el('span', { class: 'dc-des-chip-txt' }, label),
  ]);
}

function penaltyRows(list) {
  const real = (list || []).filter((p) => Number(p.points) > 0);
  if (!real.length) return null;
  return el('div', { class: 'dc-des-calc-line' },
    'جریمه‌ها: ' + real.map((p) => p.item + ' (−' + faNum(p.points) + ')').join(' · '));
}

// The audit layer, folded away. A reader who wants the number gets all of it;
// a reader who does not is never shown a table of tool domains.
function calcBlock(src) {
  const rows = [];
  if (src.s_design) {
    rows.push(el('div', { class: 'dc-des-calc-line' },
      'امتیاز طراحی: ' + faNum(src.s_design.value) + (src.s_design.anchor ? ' — ' + src.s_design.anchor : '')));
  }
  if (src.q_method) {
    rows.push(el('div', { class: 'dc-des-calc-line' },
      'ضریب روش (' + src.q_method.tool + '): ' + faNum(src.q_method.multiplier)));
    const doms = (src.q_method.domains || []).filter((d) => d.domain);
    if (doms.length) {
      rows.push(el('ul', { class: 'dc-des-doms' }, doms.map((d) => el('li', {},
        d.domain + ' — ' + (d.rating === 'NR' ? 'گزارش نشده' : d.rating)))));
    }
  }
  const pen = penaltyRows(src.penalties);
  if (pen) rows.push(pen);
  if (src.commentary_checklist) {
    rows.push(el('ul', { class: 'dc-des-doms' }, src.commentary_checklist.map((c) => el('li', {},
      (Number(c.points) > 0 ? '✓ ' : '× ') + c.item + ' (' + faNum(c.points) + ')'))));
  }
  rows.push(el('div', { class: 'dc-des-calc-final' },
    'امتیاز: ' + faNum(src.des_score) + ' از ۱۰۰ → باند ' + src.band));
  return el('details', { class: 'dc-des-calc' }, [
    el('summary', {}, 'محاسبه'),
    el('div', { class: 'dc-des-calc-body' }, rows),
  ]);
}

// DentCast's own authored content never gets a band bar. It is not a paper and
// scoring it as one would compare a clinical note to a trial; what it gets is a
// transparency score — how honestly the piece states its own basis — with band E
// kept behind the calculation rather than deleted.
function commentaryCard(src) {
  const earned = (src.commentary_checklist || []).reduce((n, c) => n + Number(c.points || 0), 0) + 5;
  return el('div', { class: 'dc-des-head' }, [
    el('span', { class: 'dc-des-badge' }, 'تجربه‌ی بالینی'),
    el('span', { class: 'dc-des-score' }, 'شفافیت: ' + faNum(earned) + ' از ۱۹'),
  ]);
}

// A source that is real, correctly cited, and has no method to appraise — a
// textbook. It gets no band bar and no number, because the machinery below a
// band measures study method and a textbook has none; inventing a number here
// would give it the shape of a measurement and none of the substance. Saying
// «cited, not scored» is the honest third answer, and it beats the alternative
// this replaced: the source was dropped from the record silently.
function notAppraisableHead(src) {
  return el('div', { class: 'dc-des-head' }, [
    el('span', { class: 'dc-des-badge dc-des-badge-na' }, SOURCE_KIND_FA[src.source_kind] || 'منبع'),
    el('span', { class: 'dc-des-score' }, 'امتیازدهی نمی‌شود'),
  ]);
}

function researchHead(src) {
  return el('div', { class: 'dc-des-head dc-des-band-' + src.band }, [
    bandBar(src.band),
    el('span', { class: 'dc-des-meta' }, [
      el('span', { class: 'dc-des-bandname' }, src.band + ' · ' + (BAND_FA[src.band] || '')),
      el('span', { class: 'dc-des-qtype' }, 'نوع سؤال: ' + (QTYPE_FA[src.question_type] || src.question_type || '—')),
    ]),
    el('span', { class: 'dc-des-score' }, faNum(src.des_score) + '/۱۰۰'),
  ]);
}

// Exported so des-scorer.js can build a single-source answer card with the
// exact same DOM — band header, provisional hatching, the "محاسبه" detail,
// "تفسیر امتیاز" — without a second implementation of any of it. Its own
// heading/provenance/footer text differs by context (a reader's own
// submission, not a cited source on an article), so des-scorer.js wraps this
// in its own shell rather than reusing card().
export function sourceBlock(src, index, total) {
  const parts = [];
  if (total > 1) {
    const cite = src.citation || {};
    // A Latin citation title in an RTL block scatters its numbers and periods;
    // `dir=auto` lets each title set its own direction, so a Persian one is
    // untouched and an English one reads left-to-right. The ordinal is kept
    // out of that decision, in its own isolated span, so «۱.» stays first.
    parts.push(el('div', { class: 'dc-des-srctitle' }, [
      el('span', { class: 'dc-des-srcnum' }, faNum(index + 1) + '. '),
      el('bdi', { dir: 'auto' }, cite.title || cite.doi || 'منبع'),
    ]));
  }
  const na = src.content_type === 'NOT_APPRAISABLE';
  parts.push(na ? notAppraisableHead(src)
    : src.content_type === 'COMMENTARY' ? commentaryCard(src) : researchHead(src));
  if (src.provisional) {
    parts.push(el('span', { class: 'dc-des-prov' }, 'امتیاز مقدماتی — فقط از روی چکیده'));
  }
  if (!na) parts.push(calcBlock(src)); // nothing was calculated, so there is no calculation to show
  if (src.interpretation_fa) {
    parts.push(el('hr', { class: 'dc-des-rule' }));
    // Labelled, so the paragraph announces what it is before it is read. It is
    // the longest block in the card and used to be set in the article's own
    // typography, which is most of why the card read as the next section.
    parts.push(el('span', { class: 'dc-des-interp-lbl' }, 'تفسیر امتیاز'));
    parts.push(el('p', { class: 'dc-des-interp' }, src.interpretation_fa));
  }
  return el('div', { class: 'dc-des-src' }, parts);
}

/* ------------------------------------------------------------ fidelity -- */
// Spec v2.8 FIDELITY, the second question the card answers: does THIS page say
// what its sources say? It is shown BESIDE the source scores, never instead of
// them and never in the band colours (spec appendix rule 5) — a weak paper can
// be quoted faithfully and a strong one misquoted, so the two are two tabs.
//
// What a reader sees is ONE WORD, a refinement of the stored `level`, never a
// second scale (founder, 1405/07/17): a percentage over four claims and one
// over fifty look equally precise and are not, so the number lives one tap
// away in «چطور حساب شد». A record stamped before 2.8 is not drawn at all:
// its level was computed with silence in the denominator, and the words below
// mean the 2.8 rule.

const FID_KIND_FA = {
  HEDGE_REMOVED: 'قاطع‌تر از منبع',
  HEDGE_ADDED: 'محتاط‌تر از منبع',
  MAGNITUDE_CHANGED: 'عدد متفاوت با منبع',
  POPULATION_OR_CONDITION_CHANGED: 'گسترده‌تر از منبع',
  GROUP_OR_COMPARATOR_CHANGED: 'مقایسه‌ی متفاوت با منبع',
};

function verAtLeast(v, major, minor) {
  const [a, b] = String(v || '').split('.').map((x) => parseInt(x, 10));
  return Number.isFinite(a) && (a > major || (a === major && (b || 0) >= minor));
}

// The fidelity objects worth drawing: the one POOLED object, or the non-null
// slots of a SOURCE-scope array (each tagged with the source it belongs to).
function fidelityOf(rec) {
  const f = rec.fidelity;
  const ok = (o) => o && o.mode === 'FIDELITY' && verAtLeast(o.des_version, 2, 8) && Array.isArray(o.claims);
  if (f && !Array.isArray(f)) return ok(f) ? [{ f, src: null }] : [];
  if (!Array.isArray(f)) return [];
  const slots = f.map((o, i) => (ok(o) ? { f: o, src: rec.sources[i], i } : null)).filter(Boolean);
  return slots.length > 1 ? [{ f: combineFidelity(slots), src: null }] : slots;
}

// Several per-source FIDELITY objects are shown as ONE (founder, 1405/07/17):
// the reader's question is whether this page says what its sources say, not
// how each source fared. Display only — the record keeps one object per
// source, the spec's shape, and nothing derived is stored. Per page unit:
// a unit judged under two sources (it names both) is ONE claim; each call
// judged its own half, so any REVERSED wins, then any ALTERED, then any
// MATCHES, then silence; NOT_A_CLAIM / AUTHOR_VIEW only when every call said
// so. `source_ref` («S<n>», by position in rec.sources) carries which paper a
// quoted sentence comes from. The tally is scored by spec F4 (v2.8+).
function combineFidelity(slots) {
  const ORDER = ['REVERSED', 'ALTERED', 'MATCHES', 'NOT_IN_SOURCE', 'NOT_ASSESSABLE'];
  const byUnit = new Map();
  slots.forEach(({ f, i }) => f.claims.forEach((c) => {
    if (!byUnit.has(c.id)) byUnit.set(c.id, []);
    byUnit.get(c.id).push({ ...c, source_ref: 'S' + (i + 1) });
  }));
  const num = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  const claims = [...byUnit.keys()].sort((a, b) => num(a) - num(b)).map((id) => {
    const cs = byUnit.get(id);
    for (const v of ORDER) {
      const hit = cs.find((c) => c.verdict === v);
      if (hit) return hit;
    }
    return cs[0];
  });
  const n = (v) => claims.filter((c) => c.verdict === v).length;
  const counts = {
    matches: n('MATCHES'), altered: n('ALTERED'), reversed: n('REVERSED'),
    not_in_source: n('NOT_IN_SOURCE'), not_assessable: n('NOT_ASSESSABLE'),
    author_view: n('AUTHOR_VIEW'), not_a_claim: n('NOT_A_CLAIM'),
  };
  const m = counts.matches, a = counts.altered, r = counts.reversed;
  const assessable = m + a + r;
  let score = null, level = 'INSUFFICIENT_CLAIMS';
  if (assessable >= 3) {
    score = Math.floor((2 * (m * 100 + a * 50) + assessable) / (2 * assessable)); // round half up, exact
    const oneNotch = a === 1 && !r;
    level = score < 60 ? 'LOW' : (r || (score <= 84 && !oneNotch)) ? 'MEDIUM' : 'HIGH';
  }
  const fs = slots.map((x) => x.f);
  return {
    des_version: fs[0].des_version, mode: 'FIDELITY', scope: 'COMBINED',
    claims, counts, assessable, fidelity_score: score, level,
    provisional: fs.some((f) => f.provisional),
    source_conclusion: slots.map(({ f, i }) => (f.source_conclusion ? '[S' + (i + 1) + '] ' + f.source_conclusion : ''))
      .filter(Boolean).join('\n'),
    per_source: slots.map(({ f, src }) => ({ src, f })),
  };
}

// The word, from `level` (spec v2.8 appendix rule 5). `key` drives the dot.
export function fidelityWord(f) {
  if (f.level === 'INSUFFICIENT_CLAIMS') return { word: 'ادعای کافی برای سنجش ندارد', key: 'none' };
  if (f.level === 'LOW') return { word: 'تطابق پایین', key: 'low' };
  if (f.level === 'MEDIUM') return { word: 'تطابق متوسط', key: 'med' };
  const c = f.counts || {};
  if (!c.altered && !c.reversed) return { word: 'کاملاً مطابق', key: 'full' };
  return f.fidelity_score >= 95 ? { word: 'تطابق خیلی بالا', key: 'full' } : { word: 'تطابق بالا', key: 'hi' };
}
const LEVEL_RANK = { INSUFFICIENT_CLAIMS: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };

function citeName(src) {
  const c = (src && src.citation) || {};
  const first = String(c.authors || '').split(',')[0].trim();
  return [first ? first + ' و همکاران' : '', c.year].filter(Boolean).join('، ') || 'منبع';
}

// `srcFor(claim)`: which source a quoted sentence comes from — `source_ref`
// («S2») under POOLED, the slot's own source under SOURCE scope.
function fidelityBlock(f, one, srcFor) {
  const SRC = one ? 'منبع' : 'منابع';
  const claims = f.claims;
  const c = f.counts || {};
  const { word, key } = fidelityWord(f);
  const flagged = claims.filter((x) => x.verdict === 'ALTERED' || x.verdict === 'REVERSED');
  const silent = claims.filter((x) => x.verdict === 'NOT_IN_SOURCE' || x.verdict === 'NOT_ASSESSABLE');
  const matched = claims.filter((x) => x.verdict === 'MATCHES');
  const outside = claims.length - flagged.length - silent.length - matched.length;

  const say = [faNum(c.matches || 0) + ' جمله همان را می‌گوید که ' + SRC + ' گفته‌اند.'];
  if (c.reversed) say.push(faNum(c.reversed) + ' جا برعکسِ منبع است.');
  if (c.altered) say.push(faNum(c.altered) + ' جا کمی قاطع‌تر یا گسترده‌تر از منبع است.');

  const parts = [
    el('p', { class: 'dc-fid-ask' }, 'این نوشته چقدر با ' + (one ? 'منبع اصلی‌اش' : 'منابع اصلی‌اش') + ' تطابق دارد؟'),
    el('div', { class: 'dc-fid-verdict' }, [
      el('span', { class: 'dc-fid-dot is-' + key, 'aria-hidden': 'true' }),
      el('span', { class: 'dc-fid-word is-' + key }, word),
    ]),
  ];
  if (f.level !== 'INSUFFICIENT_CLAIMS') parts.push(el('p', { class: 'dc-fid-say' }, say.join(' ')));
  if (f.provisional) parts.push(el('span', { class: 'dc-des-prov' }, 'مقدماتی — فقط از روی چکیده'));

  if (flagged.length) {
    parts.push(el('div', { class: 'dc-fid-diff-h' }, faNum(flagged.length) + ' جا که با ' + SRC + ' فرق دارد'));
    flagged.forEach((x) => {
      const rev = x.verdict === 'REVERSED';
      parts.push(el('div', { class: 'dc-fid-diff' }, [
        el('div', { class: 'dc-fid-diff-top' }, [
          el('span', { class: 'dc-fid-tag' + (rev ? ' is-rev' : '') }, rev ? 'برعکسِ منبع' : (FID_KIND_FA[x.change_kind] || 'متفاوت با منبع')),
          el('p', {}, x.claim_quote),
        ]),
        x.source_quote ? el('details', { class: 'dc-fid-src' }, [
          el('summary', {}, 'منبع چه می‌گوید'),
          el('p', { class: 'dc-fid-q', dir: 'auto' }, [
            el('small', {}, citeName(srcFor(x))),
            x.source_quote,
          ]),
        ]) : null,
      ].filter(Boolean)));
    });
  }

  const row = (title, n, body) => el('details', { class: 'dc-fid-row' }, [
    el('summary', {}, [el('span', {}, title), n != null ? el('span', { class: 'dc-fid-n' }, faNum(n)) : null].filter(Boolean)),
    el('div', { class: 'dc-fid-rbody' }, body),
  ]);
  const list = (xs) => el('ol', {}, xs.map((x) => el('li', {}, x.claim_quote)));
  const rows = [];
  if (silent.length) {
    rows.push(row('جمله‌هایی از دانش یا استدلال نویسنده', silent.length, [
      el('p', {}, 'این جمله‌ها چیزی می‌گویند که ' + SRC + ' درباره‌اش حرفی ' + (one ? 'نزده' : 'نزده‌اند') + '. خطا حساب نمی‌شوند و در ارزیابی نیستند.'),
      list(silent),
    ]));
  }
  rows.push(row('این ارزیابی چطور حساب شد', null, [
    f.fidelity_score == null
      ? el('p', { class: 'dc-fid-calc' }, 'منابع کمتر از سه ادعای این نوشته را پوشش می‌دهند؛ برای سنجش دست‌کم سه ادعا لازم است.')
      : el('p', { class: 'dc-fid-calc' }, 'از ' + faNum(f.assessable) + ' ادعایی که ' + SRC + ' به آن پرداخته‌اند، ' +
        faNum(c.matches || 0) + ' مورد کاملاً مطابق است (امتیاز کامل)' +
        (c.altered ? '، ' + faNum(c.altered) + ' مورد کمی جلوتر رفته (نصف امتیاز)' : '') +
        (c.reversed ? '، ' + faNum(c.reversed) + ' مورد برعکس است (بدون امتیاز)' : '') +
        ': ٪' + faNum(f.fidelity_score) + '.'),
    el('div', { class: 'dc-fid-scale' }, [
      ['کاملاً مطابق', 'هیچ جمله‌ای فرق ندارد'],
      ['تطابق خیلی بالا', '٪۹۵ و بالاتر'],
      ['تطابق بالا', '٪۸۵ تا ٪۹۴، یا فقط یک جمله کمی جلوتر'],
      ['تطابق متوسط', '٪۶۰ تا ٪۸۴، یا هر جمله‌ی برعکس'],
      ['تطابق پایین', 'زیر ٪۶۰'],
    ].flatMap(([a, b]) => [el('span', {}, a), el('span', {}, b)])),
    el('p', {}, (one ? '' : f.scope === 'COMBINED'
      ? 'هر جمله با همان منبعی سنجیده شده که به آن اشاره می‌کند؛ اینجا همه با هم شمرده شده‌اند. '
      : 'هر جمله جداگانه با هر منبع سنجیده شده؛ اگر یکی از منابع آن را بگوید، مطابق است. ') +
      faNum(outside) + ' جمله (تیترها، جمله‌های راهنما) ادعا نیستند و بیرون مانده‌اند.'),
  ]));
  if (matched.length) rows.push(row('همه‌ی جمله‌های مطابق', matched.length, [list(matched)]));
  if (f.per_source) {
    rows.push(row('به تفکیک منبع', f.per_source.length, [
      el('ul', { class: 'dc-fid-persrc' }, f.per_source.map(({ src, f: pf }) => {
        const pc = pf.counts || {};
        const k = (pc.matches || 0) + (pc.altered || 0) + (pc.reversed || 0);
        return el('li', {}, [
          el('bdi', { dir: 'rtl' }, citeName(src)), ': ',
          faNum(k) + ' ادعا' + (pc.altered || pc.reversed
            ? '، ' + faNum((pc.altered || 0) + (pc.reversed || 0)) + ' متفاوت'
            : k ? '، همه مطابق' : ''),
        ]);
      })),
    ]));
  }
  if (f.source_conclusion) {
    rows.push(row('جمع‌بندیِ خودِ ' + SRC, null, [
      ...String(f.source_conclusion).split('\n').filter(Boolean).map((l) => {
        const m = l.match(/^\[(S\d+)\]\s*(.*)$/);
        return el('p', { class: 'dc-fid-q', dir: 'auto' }, [
          el('small', {}, citeName(m ? srcFor({ source_ref: m[1] }) : srcFor({}))),
          m ? m[2] : l,
        ]);
      }),
      el('p', {}, 'برای اطلاع؛ ارزیابی روی آن نیست.'),
    ]));
  }
  parts.push(el('div', { class: 'dc-fid-rows' }, rows));
  return el('div', { class: 'dc-fid' }, parts);
}

function fidelityPane(rec, fids) {
  const one = rec.sources.filter((s) => !s.error).length === 1;
  const bySlot = (src) => () => src;
  const byRef = (x) => rec.sources[(parseInt(String(x.source_ref || '').slice(1), 10) || 1) - 1];
  const blocks = fids.map(({ f, src }) => {
    const b = fidelityBlock(f, one || !!src, src ? bySlot(src) : byRef);
    return src && fids.length > 1 ? el('div', { class: 'dc-des-src' }, [
      el('div', { class: 'dc-des-srctitle' }, el('bdi', { dir: 'auto' }, (src.citation || {}).title || citeName(src))), b]) : b;
  });
  return el('div', { class: 'dc-des-pane', 'data-pane': 'fid' }, [
    ...blocks,
    el('p', { class: 'dc-des-foot' },
      'این ارزیابی فقط می‌پرسد جمله‌های متن همان را می‌گویند که ' + (one ? 'منبع گفته' : 'منابع گفته‌اند') +
      ' یا نه؛ درباره‌ی سطح شواهد (زبانه‌ی کنار) چیزی نمی‌گوید.'),
  ]);
}

// The weakest of several per-source fidelity results speaks for the chip:
// one misquoted source is the news, however faithfully the others are quoted.
// A source with too few claims to measure is not a weak result, it is no
// result: it never speaks for the page while another source was measured
// (sharehub/share-18 read «ادعای کافی برای سنجش ندارد» because one of five
// sources carried a single claim, beside four at «کاملاً مطابق»).
function headlineFidelity(fids) {
  const measured = fids.filter((x) => x.f.level !== 'INSUFFICIENT_CLAIMS');
  const pool = measured.length ? measured : fids;
  return pool.reduce((w, x) => (LEVEL_RANK[x.f.level] < LEVEL_RANK[w.f.level] ? x : w), pool[0]).f;
}

function selectPane(cardEl, which) {
  if (!cardEl) return;
  cardEl.querySelectorAll('.dc-des-seg button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pane === which)));
  cardEl.querySelectorAll('.dc-des-pane').forEach((p) => { p.hidden = p.dataset.pane !== which; });
}

function card(rec) {
  const scored = rec.sources.filter((s) => !s.error);
  if (!scored.length) return null;
  const fids = fidelityOf(rec);
  if (fids.length) return tabbedCard(rec, scored, fids);
  return el('section', { class: 'dc-des-card', id: 'dcDesCard' }, [
    // The heading names the MACHINE, not a topic. «ارزیابی شواهد» alone is a
    // section title an author could plausibly have written, and readers took it
    // for one; «ارزیابی خودکار شواهد» cannot be mistaken for authored prose.
    el('h2', { class: 'dc-des-card-h' }, 'ارزیابی خودکار شواهد'),
    // Provenance first. The footnote below says what the score MEASURES, which
    // is a different claim and arrives too late to stop the misreading.
    el('p', { class: 'dc-des-prov-note' },
      'این بخش را دنت‌کست به‌صورت خودکار محاسبه می‌کند و بخشی از متنِ نویسنده نیست.'),
    ...scored.map((s, i) => sourceBlock(s, i, scored.length)),
    el('p', { class: 'dc-des-foot' },
      'این امتیاز ساختار مطالعه را می‌سنجد، نه اینکه یافته‌اش برای بیمار شما مناسب است یا نه.'),
  ]);
}

// The same card with two questions in it. Fidelity first: it is the one about
// THIS page. The strength pane is the untabbed card's own content, unchanged.
function tabbedCard(rec, scored, fids) {
  const one = scored.length === 1;
  const SRC = one ? 'منبع' : 'منابع';
  const seg = el('div', { class: 'dc-des-seg', role: 'tablist' }, [
    el('button', { type: 'button', role: 'tab', 'aria-selected': 'true', 'data-pane': 'fid' }, 'تطابق با ' + SRC),
    el('button', { type: 'button', role: 'tab', 'aria-selected': 'false', 'data-pane': 'src' }, 'سطح شواهد'),
  ]);
  const srcPane = el('div', { class: 'dc-des-pane', 'data-pane': 'src', hidden: '' }, [
    el('p', { class: 'dc-fid-ask' }, (one ? 'منبعی' : 'منابعی') + ' که این نوشته به ' + (one ? 'آن' : 'آن‌ها') + ' تکیه کرده چه سطحی از شواهد دارند؟'),
    ...scored.map((s, i) => sourceBlock(s, i, scored.length)),
    el('p', { class: 'dc-des-foot' },
      'این امتیاز ساختار مطالعه را می‌سنجد، نه اینکه یافته‌اش برای بیمار شما مناسب است یا نه.'),
  ]);
  const node = el('section', { class: 'dc-des-card has-fid', id: 'dcDesCard' }, [
    el('h2', { class: 'dc-des-card-h' }, 'ارزیابی خودکار شواهد'),
    el('p', { class: 'dc-des-prov-note' },
      'این بخش را دنت‌کست به‌صورت خودکار محاسبه می‌کند و بخشی از متنِ نویسنده نیست.'),
    seg,
    fidelityPane(rec, fids),
    srcPane,
  ]);
  srcPane.hidden = true;
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-pane]');
    if (b) selectPane(node, b.dataset.pane);
  });
  return node;
}

// The second chip, beside the strength chip and never merged into it: two
// questions, two colours (band scale / the card's chrome).
function fidelityChip(rec, fids) {
  const one = rec.sources.filter((s) => !s.error).length === 1;
  const { word, key } = fidelityWord(headlineFidelity(fids));
  return el('button', {
    class: 'dc-act dc-act-fid',
    type: 'button',
    'data-pane': 'fid',
    'aria-label': 'تطابق این نوشته با ' + (one ? 'منبع' : 'منابع') + ': ' + word,
  }, [
    el('span', { class: 'dc-fid-dot is-' + key, 'aria-hidden': 'true' }),
    el('span', { class: 'dc-fid-chip-lbl' }, 'تطابق با ' + (one ? 'منبع' : 'منابع') + ':'),
    el('span', { class: 'dc-fid-chip-val' }, word.replace(/^تطابق /, '')),
  ]);
}

/* -------------------------------------------------------------- mount --- */

/**
 * Draw the DES chip and card for `contentId`.
 *
 * `row`    — the article action row's aux group, where the chip goes. The band
 *            is something the page says ABOUT ITSELF, which is exactly what that
 *            group is for (زمان مطالعه lives there); it is not an action, so it
 *            never goes in .dc-actions-main.
 * `anchor` — the element the card hangs off, i.e. findProseEnd(): the LAST prose
 *            box, so the card lands under the whole article. On the 26 legacy
 *            NoteCast pages whose body is a row of sibling boxes, findProseBox()
 *            would put it after section 1 of 8.
 *
 * Order under the article is the conversation first, then the score behind it
 * (flipped 2026-08-19 on founder feedback — leading with the evaluation card
 * pushed the "پاسخ یا سؤال" button below it on every single page).
 * article-threads.js hangs off the same anchor, so rather than depend on which
 * of the two runs last (this one is async, which would settle it by accident),
 * the card is placed explicitly AFTER any `.dc-threads` block already there.
 *
 * Returns false when there is nothing to draw — which is the normal case for any
 * page with no record, and needs no apology on screen.
 */
export async function mountDes(row, anchor, contentId) {
  if (!contentId || (!row && !anchor)) return false;
  let rec;
  try {
    const all = await loadScores();
    rec = all && all[contentId];
  } catch (_) { return false; }
  if (!rec || !Array.isArray(rec.sources) || !rec.sources.length) return false;
  if (!rec.sources.some((s) => !s.error)) return false; // every source unscorable

  // Idempotent per surface: re-mounting the shell on a second article replaces
  // the previous article's badge rather than stacking a second one.
  const host = anchor && anchor.parentNode;
  if (host) {
    const old = host.querySelector('#dcDesCard');
    if (old) old.remove();
  }
  if (row) {
    row.querySelectorAll('.dc-act-des, .dc-act-fid').forEach((c) => c.remove());
  }

  const body = card(rec);
  if (anchor && body) {
    // After the conversation if it is already mounted, otherwise straight after
    // the article. Either way the reader meets the discussion before the score.
    const threads = host && host.querySelector('.dc-threads');
    (threads || anchor).insertAdjacentElement('afterend', body);
  }

  if (row) {
    const fids = fidelityOf(rec);
    const chips = [chipFor(rec, fids.length > 0)];
    if (fids.length) chips.push(fidelityChip(rec, fids));
    // Tapping a chip goes to the card (and, when the card has two tabs, to
    // that chip's own tab). Deliberately not a popover: this shell scrolls
    // inside #mobile-body rather than on window, so an absolutely positioned
    // panel stays put while the page moves under it — the bug the homepage
    // explainer already had and was rebuilt in flow to fix.
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const target = document.getElementById('dcDesCard');
        if (!target) return;
        if (target.classList.contains('has-fid')) selectPane(target, chip.dataset.pane || 'src');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      row.appendChild(chip);
    });
  }
  return true;
}
