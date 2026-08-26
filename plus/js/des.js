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
import { el, faNum } from './util.js?v=31';

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
function chipFor(rec) {
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
  const label = multi
    ? faNum(rec.sources.length) + ' منبع · ' + spread
    : BAND_FA[band] || band;
  return el('button', {
    class: 'dc-act dc-act-des dc-des-band-' + (multi ? best : band),
    type: 'button',
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
    parts.push(el('div', { class: 'dc-des-srctitle' },
      faNum(index + 1) + '. ' + (cite.title || cite.doi || 'منبع')));
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

function card(rec) {
  const scored = rec.sources.filter((s) => !s.error);
  if (!scored.length) return null;
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
    const oldChip = row.querySelector('.dc-act-des');
    if (oldChip) oldChip.remove();
  }

  const body = card(rec);
  if (anchor && body) {
    // After the conversation if it is already mounted, otherwise straight after
    // the article. Either way the reader meets the discussion before the score.
    const threads = host && host.querySelector('.dc-threads');
    (threads || anchor).insertAdjacentElement('afterend', body);
  }

  if (row) {
    const chip = chipFor(rec);
    // Tapping the chip goes to the card. Deliberately not a popover: this shell
    // scrolls inside #mobile-body rather than on window, so an absolutely
    // positioned panel stays put while the page moves under it — the bug the
    // homepage explainer already had and was rebuilt in flow to fix.
    chip.addEventListener('click', () => {
      const target = document.getElementById('dcDesCard');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    row.appendChild(chip);
  }
  return true;
}
