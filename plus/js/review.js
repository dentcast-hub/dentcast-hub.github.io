// Premium Leitner review (Phase 2). Cards are the user's own highlights — same
// card FORM as the free path (flashcard() / renderCardText() from archive.js),
// but scheduled: only what's due today shows up, and grading calls the
// scheduling engine (POST /review/answer) instead of the free "مرور شد" beacon.
import { el, faNum, signalStreakActivity } from './util.js';
import { api } from './api.js';
import { getModel, contentInfo } from './content-index.js';
import { flashcard, renderCardText, sourceHref } from './archive.js';
import { LABELS, PALETTE } from './config.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';
const colorCss = (k) => (PALETTE.find((p) => p.key === k) || {}).css || 'transparent';

function emptyState(container) {
  container.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'هنوز چیزی برای مرور نداری.'),
    el('p', { class: 'dcp-muted' },
      'هایلایت کردن رو شروع کن؛ نکات مهم هر مطلب رو هایلایت کن، بعد با زمان‌بندی لایتنر همین‌جا می‌بینیش.'),
    el('a', { class: 'dcp-btn dcp-btn-primary', href: '/' }, 'رفتن به مطالب'),
  ]));
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
  if (!due.length) { emptyState(container); return; }

  let remaining = due.length;
  const countEl = el('span', { class: 'dcp-archive-count' }, faNum(remaining) + ' کارت برای امروز');
  const head = el('div', { class: 'dcp-archive-head' }, [
    el('h2', { class: 'dcp-archive-title' }, 'مرور امروز'),
    countEl,
  ]);

  const list = el('div', { class: 'dcp-card-list' });
  for (const h of due) {
    const info = contentInfo(model, h.content_id);
    const meta = el('div', { class: 'dcp-card-meta' }, [
      h.color ? el('span', { class: 'dcp-card-dot', style: 'background:' + colorCss(h.color) }) : null,
      h.label ? el('span', { class: 'dcp-card-label' }, labelFa(h.label)) : null,
      info ? el('span', { class: 'dcp-card-src' }, info.title) : null,
    ]);
    const actions = el('div', { class: 'dcp-card-actions' });
    const href = sourceHref(info, h.exact);
    if (href) actions.appendChild(el('a', { class: 'dcp-btn dcp-btn-ghost', href, target: '_top' }, 'منبع'));

    const forgotBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'دوباره مرورش کن');
    const gotItBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'بلد بودم');
    const card = el('div', { class: 'dcp-card' }, [meta, renderCardText(h), h.note ? el('div', { class: 'dcp-card-note' }, h.note) : null, actions]);

    const grade = async (result, btn) => {
      forgotBtn.disabled = true;
      gotItBtn.disabled = true;
      try {
        await api.reviewAnswer(h.highlight_id, result);
        signalStreakActivity(); // review_finished counts for today's streak
        btn.textContent = result === 'remembered' ? 'ثبت شد ✓' : 'باشه، دوباره میاد ✓';
        card.classList.add('is-reviewed');
        remaining -= 1;
        countEl.textContent = faNum(Math.max(remaining, 0)) + ' کارت برای امروز';
        if (remaining <= 0) {
          list.appendChild(el('div', { class: 'dcp-empty' }, 'مرور امروز تمام شد. فردا برمی‌گردی.'));
        }
      } catch (_) {
        forgotBtn.disabled = false;
        gotItBtn.disabled = false;
      }
    };
    forgotBtn.addEventListener('click', () => grade('forgot', forgotBtn));
    gotItBtn.addEventListener('click', () => grade('remembered', gotItBtn));
    actions.appendChild(forgotBtn);
    actions.appendChild(gotItBtn);

    list.appendChild(card);
  }

  const note = el('p', { class: 'dcp-archive-note' },
    'این کارت‌ها از هایلایت‌های خودتان ساخته می‌شوند. زمان مرور بعدی هر کارت با پاسخ شما تنظیم می‌شود.');
  container.replaceChildren(head, note, list);
}
