// The saved-box CARD — how a کادر kept from an article (box-save.js,
// routes/boxes.ts) is drawn in the دفترچه. Same rule as hl-view.js and
// clip-view.js: a card, never a link. Its content is the box as the author
// framed it — the label, then the words — and going to the article is one
// action among others.
import { el } from './util.js?v=262';
import { api } from './api.js?v=262';
import { actionBtn, confirmStrip, toast, copyToClipboard } from './hl-view.js?v=262';

/** Plain-text form of a saved box, for the copy actions. */
export function boxAsText(box, article = null) {
  const head = box.label ? box.label + '\n' : '';
  return head + box.text + (article ? '\n— ' + article.title : '');
}

/**
 * @param article the group (title/url/folder)
 * @param box     { id, label, text, created_at, kind: 'box' }
 * @param ctx     { onDeleted(id), showSource, source(article) }
 */
export function boxCard(article, box, ctx) {
  const card = el('div', { class: 'dcp-hlib-card dcp-box-card', 'data-box': box.id });
  const label = el('span', { class: 'dcp-box-card-k' }, box.label || 'کادر');
  const body = el('p', { class: 'dcp-box-card-t' }, box.text);
  const copy = actionBtn('کپی', { onClick: (e) => copyToClipboard(boxAsText(box), e.currentTarget) });
  const go = actionBtn('متنِ مقاله ›', { href: article.url });
  const del = actionBtn('حذف', {
    danger: true,
    onClick: () => {
      if (card.querySelector('.dcp-recent-confirm')) return;
      card.appendChild(confirmStrip('این کادر از دفترچه حذف شود؟', async () => {
        try { await api.deleteBox(box.id); }
        catch (e) { if (!(e && e.status === 404)) throw e; }
        ctx.onDeleted(box.id);
        toast('کادر حذف شد');
      }));
    },
  });
  const actions = el('div', { class: 'dcp-hlib-actions' }, [copy, go, del]);
  const source = ctx.showSource && ctx.source ? ctx.source(article) : null;
  card.replaceChildren(...[source, label, body, actions].filter(Boolean));
  return card;
}
