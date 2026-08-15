// DentCast Evidence Score — the reader-facing display.
//
// The score itself is produced at publish time by workflow step 4.13 (the
// scoring prompt in .dentcast/dentcast-evidence-score-v1.6.md) and stored in
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
import { el, faNum } from './util.js';

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

const BAND_FA = {
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
const QTYPE_FA = {
  THERAPY: 'درمانی',
  DIAGNOSTIC: 'تشخیصی',
  MATERIAL: 'مواد (آزمایشگاهی)',
  ETIOLOGY: 'علت‌شناسی',
};

/* ------------------------------------------------------------- pieces --- */

// Five discrete blocks, only the current one coloured. Deliberately not a gauge
// or a continuous bar: the output is not continuous, and a needle would give a
// two-point difference a meaning it does not have.
function bandBar(band) {
  return el('span', { class: 'dc-des-bar', 'aria-hidden': 'true' },
    BANDS.map((b) => el('span', {
      class: 'dc-des-blk dc-des-b-' + b + (b === band ? ' is-on' : ''),
    }, b)));
}

function chipFor(rec) {
  const src = rec.sources[0];
  const multi = rec.sources.length > 1;
  const band = src.band;
  // With several cited papers the chip carries the WEAKEST band, not an average.
  // Averaging bands would invent a value no source has; the weakest is the one
  // honest single-letter summary of "what is this page resting on".
  const worst = rec.sources.reduce((w, s) => (BANDS.indexOf(s.band) < BANDS.indexOf(w) ? s.band : w), band);
  const label = multi
    ? faNum(rec.sources.length) + ' منبع · از ' + worst
    : BAND_FA[band] || band;
  return el('button', {
    class: 'dc-act dc-act-des dc-des-band-' + (multi ? worst : band),
    type: 'button',
    'aria-label': 'ارزیابی شواهد این مطلب',
  }, [
    el('span', { class: 'dc-des-dot' }, multi ? worst : band),
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

function sourceBlock(src, index, total) {
  const parts = [];
  if (total > 1) {
    const cite = src.citation || {};
    parts.push(el('div', { class: 'dc-des-srctitle' },
      faNum(index + 1) + '. ' + (cite.title || cite.doi || 'منبع')));
  }
  parts.push(src.content_type === 'COMMENTARY' ? commentaryCard(src) : researchHead(src));
  if (src.provisional) {
    parts.push(el('span', { class: 'dc-des-prov' }, 'امتیاز مقدماتی — فقط از روی چکیده'));
  }
  parts.push(calcBlock(src));
  if (src.interpretation_fa) {
    parts.push(el('hr', { class: 'dc-des-rule' }));
    parts.push(el('p', { class: 'dc-des-interp' }, src.interpretation_fa));
  }
  return el('div', { class: 'dc-des-src' }, parts);
}

function card(rec) {
  const scored = rec.sources.filter((s) => !s.error);
  if (!scored.length) return null;
  return el('section', { class: 'dc-des-card', id: 'dcDesCard' }, [
    el('h2', { class: 'dc-des-card-h' }, 'ارزیابی شواهد'),
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
 * Order under the article is the score first, then the conversation about it.
 * article-threads.js hangs off the same anchor, so rather than depend on which
 * of the two runs last (this one is async, which would settle it by accident),
 * the card is placed explicitly BEFORE any `.dc-threads` block already there.
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
    // Before the conversation if it is already mounted, otherwise straight after
    // the article. Either way the reader meets the score before the discussion.
    const threads = host && host.querySelector('.dc-threads');
    if (threads) threads.insertAdjacentElement('beforebegin', body);
    else anchor.insertAdjacentElement('afterend', body);
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
