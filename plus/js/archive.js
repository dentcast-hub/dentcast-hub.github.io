// Per-topic card archive (free, spec 2.8). Lists the user's highlights for one
// taxonomy branch as cards: text with revealable cloze blanks, note, label, and
// a link back to the source at the exact anchor. A manual pass logs
// card_reviewed_manual and counts for the streak. It MUST NOT change scheduling:
// the client only calls /activity, which never touches card_state.
import { el, faNum } from './util.js';
import { api } from './api.js';
import { getModel, contentInfo } from './content-index.js';
import { LABELS, PALETTE } from './config.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';
const colorCss = (k) => (PALETTE.find((p) => p.key === k) || {}).css || 'transparent';

// Build the card text with cloze blanks revealable on tap.
function renderText(exact, markers) {
  const wrap = el('div', { class: 'dcp-card-text' });
  const ranges = (markers || []).slice().sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  if (!ranges.length) { wrap.textContent = exact; return wrap; }
  for (const [start, end] of ranges) {
    if (start > cursor) wrap.appendChild(document.createTextNode(exact.slice(cursor, start)));
    const answer = exact.slice(start, end);
    const blank = el('button', { class: 'dcp-blank', type: 'button', 'aria-label': 'نمایش پاسخ' }, '□□□');
    blank.addEventListener('click', () => { blank.textContent = answer; blank.classList.add('is-open'); });
    wrap.appendChild(blank);
    cursor = end;
  }
  if (cursor < exact.length) wrap.appendChild(document.createTextNode(exact.slice(cursor)));
  return wrap;
}

function sourceHref(info, exact) {
  if (!info) return null;
  // Text fragment scrolls the article to the exact quote.
  const frag = '#:~:text=' + encodeURIComponent(exact.slice(0, 120));
  return info.url + frag;
}

export async function renderArchive(container, topicKey) {
  container.innerHTML = '';
  container.appendChild(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const [model, data] = await Promise.all([
    getModel(),
    api.listTopic(topicKey).catch((e) => ({ error: e })),
  ]);

  if (data.error) {
    container.innerHTML = '';
    container.appendChild(el('div', { class: 'dcp-empty' }, 'این موضوع یافت نشد.'));
    return;
  }

  container.innerHTML = '';
  container.appendChild(el('div', { class: 'dcp-archive-head' }, [
    el('a', { class: 'dcp-back', href: '/plus/cards.html' }, '‹ همه موضوع‌ها'),
    el('h1', { class: 'dcp-archive-title' }, 'کارت‌های ' + (data.topic_fa || '')),
    el('span', { class: 'dcp-archive-count' }, faNum((data.highlights || []).length) + ' کارت'),
  ]));

  if (!data.highlights || !data.highlights.length) {
    container.appendChild(el('div', { class: 'dcp-empty' }, 'هنوز در این موضوع هایلایتی نساخته‌اید. یک مقاله را با میز کار باز کنید و شروع کنید.'));
    return;
  }

  container.appendChild(el('p', { class: 'dcp-archive-note' }, 'اینجا کارت‌هایتان را آزادانه و به هر ترتیبی مرور کنید. مرور شما در استریک حساب می‌شود.'));

  const list = el('div', { class: 'dcp-card-list' });
  for (const h of data.highlights) {
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
    reviewBtn.addEventListener('click', async () => {
      reviewBtn.disabled = true;
      try {
        await api.activity('card_reviewed_manual', h.content_id, { highlight_id: h.id });
        reviewBtn.textContent = 'مرور شد ✓';
        card.classList.add('is-reviewed');
      } catch (_) { reviewBtn.disabled = false; }
    });
    actions.appendChild(reviewBtn);

    const card = el('div', { class: 'dcp-card' }, [
      meta,
      renderText(h.exact, h.cloze_markers),
      h.note ? el('div', { class: 'dcp-card-note' }, h.note) : null,
      actions,
    ]);
    list.appendChild(card);
  }
  container.appendChild(list);
}
