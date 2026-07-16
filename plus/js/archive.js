// Per-folder card archive / flashcards (spec 2.8 + prototype feedback). Cards are
// built from the user's own highlights, important ones first. Full-sentence rule:
// the card text expands to the whole sentence around the highlight, and the
// highlighted piece becomes the cloze blank (revealable). Manual review logs
// card_reviewed_manual and never touches card_state.
import { el, faNum } from './util.js';
import { api } from './api.js';
import { getModel, contentInfo } from './content-index.js';
import { LABELS, PALETTE } from './config.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';
const colorCss = (k) => (PALETTE.find((p) => p.key === k) || {}).css || 'transparent';
const SENT_DELIM = /[.!?؟۔\n]/;

// Expand a highlight to the sentence around it; the highlighted piece is the
// cloze target. Uses the stored prefix/suffix context (best-effort).
function flashcard(h) {
  const prefix = h.prefix || '';
  const exact = h.exact || '';
  const suffix = h.suffix || '';
  const ctx = prefix + exact + suffix;
  const start = prefix.length;
  const end = start + exact.length;

  let sStart = 0;
  for (let i = start - 1; i >= 0; i -= 1) { if (SENT_DELIM.test(ctx[i])) { sStart = i + 1; break; } }
  let sEnd = ctx.length;
  for (let i = end; i < ctx.length; i += 1) { if (SENT_DELIM.test(ctx[i])) { sEnd = i + 1; break; } }
  while (sStart < start && /\s/.test(ctx[sStart])) sStart += 1;
  while (sEnd > end && /\s/.test(ctx[sEnd - 1])) sEnd -= 1;

  return { sentence: ctx.slice(sStart, sEnd), clozeStart: start - sStart, clozeEnd: end - sStart };
}

function renderCardText(h) {
  const { sentence, clozeStart, clozeEnd } = flashcard(h);
  const wrap = el('div', { class: 'dcp-card-text' });
  wrap.appendChild(document.createTextNode(sentence.slice(0, clozeStart)));
  const answer = sentence.slice(clozeStart, clozeEnd) || h.exact;
  const blank = el('button', { class: 'dcp-blank', type: 'button', 'aria-label': 'نمایش پاسخ' }, '□ □ □');
  blank.addEventListener('click', () => { blank.textContent = answer; blank.classList.add('is-open'); });
  wrap.appendChild(blank);
  wrap.appendChild(document.createTextNode(sentence.slice(clozeEnd)));
  return wrap;
}

function sourceHref(info, exact) {
  if (!info) return null;
  return info.url + '#:~:text=' + encodeURIComponent(exact.slice(0, 120));
}

export async function renderArchive(container, topicKey, { inline = false } = {}) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const [model, data] = await Promise.all([
    getModel(),
    api.listTopic(topicKey).catch((e) => ({ error: e })),
  ]);

  if (data.error) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, 'کارت‌ها در دسترس نیست.'));
    return;
  }

  const cards = (data.highlights || []).slice()
    // important first, then by content/creation order the API returned
    .sort((a, b) => (b.label === 'important' ? 1 : 0) - (a.label === 'important' ? 1 : 0));

  let count = cards.length;
  const countEl = el('span', { class: 'dcp-archive-count' }, faNum(count) + ' کارت');
  const setCount = (n) => { count = Math.max(0, n); countEl.textContent = faNum(count) + ' کارت'; };
  const head = el('div', { class: 'dcp-archive-head' }, [
    inline ? null : el('a', { class: 'dcp-back', href: '/plus/cards.html' }, '‹ همه پوشه‌ها'),
    el('h2', { class: 'dcp-archive-title' }, 'فلش‌کارت‌های ' + (data.topic_fa || '')),
    countEl,
  ]);

  if (!cards.length) {
    container.replaceChildren(head, el('div', { class: 'dcp-empty' }, 'هنوز در این پوشه هایلایتی نساخته‌اید. یک مطلب را با میز کار باز کنید و شروع کنید.'));
    return;
  }

  const list = el('div', { class: 'dcp-card-list' });
  for (const h of cards) {
    const info = contentInfo(model, h.content_id);
    const meta = el('div', { class: 'dcp-card-meta' }, [
      h.color ? el('span', { class: 'dcp-card-dot', style: 'background:' + colorCss(h.color) }) : null,
      h.label ? el('span', { class: 'dcp-card-label' }, labelFa(h.label)) : null,
      info ? el('span', { class: 'dcp-card-src' }, info.title) : null,
    ]);
    const actions = el('div', { class: 'dcp-card-actions' });
    const href = sourceHref(info, h.exact);
    if (href) actions.appendChild(el('a', { class: 'dcp-btn dcp-btn-ghost', href, target: '_top' }, 'منبع'));
    const reviewBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'مرور شد');

    // Delete (×): removes the flashcard (i.e. the underlying highlight) after a
    // small inline confirm, so an accidental tap does not destroy data.
    const delBtn = el('button', { class: 'dcp-card-del', type: 'button', 'aria-label': 'حذف فلش‌کارت', title: 'حذف' }, '×');
    const card = el('div', { class: 'dcp-card' }, [delBtn, meta, renderCardText(h), h.note ? el('div', { class: 'dcp-card-note' }, h.note) : null, actions]);

    reviewBtn.addEventListener('click', async () => {
      reviewBtn.disabled = true;
      try {
        await api.activity('card_reviewed_manual', h.content_id, { highlight_id: h.id });
        reviewBtn.textContent = 'مرور شد ✓';
        card.classList.add('is-reviewed');
      } catch (_) { reviewBtn.disabled = false; }
    });
    actions.appendChild(reviewBtn);

    delBtn.addEventListener('click', () => {
      if (card.querySelector('.dcp-card-confirm')) return;
      const yes = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, 'حذف');
      const no = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
      const confirmRow = el('div', { class: 'dcp-card-confirm' }, [
        el('span', {}, 'این فلش‌کارت حذف شود؟'), yes, no,
      ]);
      no.onclick = () => confirmRow.remove();
      yes.onclick = async () => {
        yes.disabled = true;
        try {
          await api.deleteHighlight(h.id);
          card.remove();
          setCount(count - 1);
          if (count === 0) list.appendChild(el('div', { class: 'dcp-empty' }, 'همه کارت‌های این پوشه حذف شد.'));
        } catch (_) { yes.disabled = false; }
      };
      card.appendChild(confirmRow);
    });

    list.appendChild(card);
  }

  const note = el('p', { class: 'dcp-archive-note' }, 'کارت‌ها از هایلایت‌های خودتان ساخته می‌شوند؛ بخش هایلایت‌شده جای خالی مرور است. مرور در استریک حساب می‌شود.');
  container.replaceChildren(head, note, list);
}
