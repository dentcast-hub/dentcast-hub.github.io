// Leitner review (Phase 2). Cards are the user's own highlights, shown
// EXACTLY as they look in the article (same `mark.dcp-hl[data-color]` the
// workbench applies) — always in full. Cloze-hiding a chunk of the user's own
// highlight was confusing (prototype feedback, 2026-07-30): you cannot recall
// something you can't even read. Hiding stays reserved for a later, separate
// card source — AI-authored key points ("نکته هوش مصنوعی") — which will carry
// its own distinct color/badge so the two are never visually confused.
import { el, faNum, signalStreakActivity, renderNoteLines } from './util.js';
import { api } from './api.js';
import { getModel, contentInfo } from './content-index.js';
import { flashcard, sourceHref } from './archive.js';
import { LABELS } from './config.js';
import { quotaStrip, quotaWall, isQuotaError, quotaOf, isMetered } from './quota.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';

// Full sentence context around the highlight, the highlighted span wrapped in
// the SAME mark the article itself uses, so a card looks like the highlight
// the user actually made, not a quiz.
function renderHighlightText(h) {
  const { sentence, clozeStart, clozeEnd } = flashcard(h);
  const p = el('p', { class: 'dcp-rv-text' });
  p.appendChild(document.createTextNode(sentence.slice(0, clozeStart)));
  let cls = 'dcp-hl';
  if (h.underline) cls += ' dcp-underline';
  p.appendChild(el('mark', { class: cls, 'data-color': h.color || '' }, sentence.slice(clozeStart, clozeEnd) || h.exact));
  p.appendChild(document.createTextNode(sentence.slice(clozeEnd)));
  return p;
}

function emptyState(container) {
  container.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'هنوز چیزی برای مرور نداری.'),
    el('p', { class: 'dcp-muted' },
      'هایلایت کردن رو شروع کن؛ نکات مهم هر مطلب رو هایلایت کن، بعد با زمان‌بندی لایتنر همین‌جا می‌بینیش.'),
    el('a', { class: 'dcp-btn dcp-btn-primary', href: '/' }, 'رفتن به مطالب'),
  ]));
}

/**
 * The queue ran out because today's free cards are spent — NOT because there is
 * nothing to review.
 *
 * A distinct state from emptyState() on purpose: telling somebody with two
 * hundred due cards «هنوز چیزی برای مرور نداری» would be false, and telling
 * somebody with no highlights to buy a subscription would be useless. The two
 * situations look identical in the payload (an empty `due`) and are told apart
 * by the allowance, which is the only thing that knows why.
 */
function exhaustedState(container, quota) {
  container.replaceChildren(quotaWall(quota, 'cards-quota'));
}

function renderCard(h, model, onQuota) {
  const info = contentInfo(model, h.content_id);
  const head = el('div', { class: 'dcp-rv-head' }, [
    el('span', { class: 'dcp-rv-badge' }, [
      el('span', { class: 'dcp-rv-badge-dot', 'data-color': h.color || '' }),
      'هایلایت شما',
    ]),
    h.label ? el('span', { class: 'dcp-rv-label' }, labelFa(h.label)) : null,
  ]);
  const href = sourceHref(info, h.exact);
  const src = info ? el('div', { class: 'dcp-rv-src' }, [
    'منبع: ',
    el('a', { href, target: '_top' }, info.title),
  ]) : null;

  const forgotBtn = el('button', { class: 'dcp-rv-btn dcp-rv-btn-again', type: 'button' }, 'دوباره مرورش کن');
  const gotItBtn = el('button', { class: 'dcp-rv-btn dcp-rv-btn-good', type: 'button' }, 'بلد بودم');
  const actions = el('div', { class: 'dcp-rv-actions' }, [forgotBtn, gotItBtn]);
  const gradedTag = el('div', { class: 'dcp-rv-graded-tag' });

  const card = el('article', { class: 'dcp-rv-card' }, [
    head,
    renderHighlightText(h),
    // h.note is a per-highlight note (highlights.note — set from the workbench's
    // 📝 یادداشت button on the SELECTED highlight), distinct from the one
    // whole-article note (article_notes). It only ever shows here when this
    // exact highlight has one saved; labeled so that's obvious at a glance
    // instead of reading as an unexplained box (founder feedback, 2026-07-30).
    h.note ? el('div', { class: 'dcp-rv-note' }, [el('b', {}, 'یادداشت شما: '), renderNoteLines(h.note)]) : null,
    src,
    actions,
    gradedTag,
  ]);

  const grade = async (result) => {
    forgotBtn.disabled = true;
    gotItBtn.disabled = true;
    try {
      const res = await api.reviewAnswer(h.highlight_id, result);
      signalStreakActivity(); // review_finished counts for today's streak
      gradedTag.textContent = result === 'remembered' ? 'بلد بودی ✓' : 'باشه، دوباره میاد ✓';
      card.classList.add('is-graded');
      // The answer that spends the last card is still accepted and still shown
      // as graded — the offer arrives after the work, never instead of it.
      if (res && res.quota) onQuota(res.quota);
    } catch (e) {
      if (isQuotaError(e)) {
        // The server refused it, so nothing was graded. Say so where the
        // buttons were, rather than letting them silently re-enable.
        actions.replaceWith(quotaWall(quotaOf(e), 'cards-quota'));
        return;
      }
      forgotBtn.disabled = false;
      gotItBtn.disabled = false;
    }
  };
  forgotBtn.addEventListener('click', () => grade('forgot'));
  gotItBtn.addEventListener('click', () => grade('remembered'));

  return card;
}

export async function renderReview(container, { topic } = {}) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const [model, data] = await Promise.all([
    getModel(),
    api.reviewDue(topic).catch((e) => ({ error: e })),
  ]);

  if (data.error) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, 'مرور در دسترس نیست.'));
    return;
  }

  const due = data.due || [];
  const quota = data.quota || null;

  if (!due.length) {
    // Nothing to review, or nothing left FOR TODAY — see exhaustedState.
    if (isMetered(quota) && quota.remaining <= 0) exhaustedState(container, quota);
    else emptyState(container);
    return;
  }

  const top = el('div', { class: 'dcp-rv-top' }, [
    el('h2', { class: 'dcp-rv-title' }, 'مرور امروز'),
    el('span', { class: 'dcp-rv-count' }, faNum(due.length) + ' کارت'),
  ]);

  // The remaining-count line is live: it is replaced after every graded card,
  // so the number on screen is always the one the server just reported.
  const stripHost = el('div', {});
  const paintStrip = (q) => {
    const strip = quotaStrip(q, 'cards-quota');
    stripHost.replaceChildren(...(strip ? [strip] : []));
  };
  paintStrip(quota);

  const list = el('div', { class: 'dcp-rv-list' }, due.map((h) => renderCard(h, model, paintStrip)));

  container.replaceChildren(top, stripHost, list);
}
