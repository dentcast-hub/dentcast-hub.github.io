// Dashboard navigation tree: the site taxonomy with the user's highlight count
// per branch, each branch linking to that topic's card archive. Navigation only
// (spec 2.6): no highlight bodies, no cross-article aggregation. Rendered as a
// counts layer over the shared content model.
import { el, faNum } from './util.js';
import { getModel } from './content-index.js';
import { api } from './api.js';

export async function renderTree(container) {
  container.innerHTML = '';
  container.appendChild(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const [model, tree] = await Promise.all([
    getModel(),
    api.tree().catch(() => ({ clusters: [], total_highlights: 0 })),
  ]);

  // counts layer keyed by topicKey, from /tree
  const count = new Map();
  for (const c of tree.clusters || []) {
    count.set('cluster:' + c.key, c.count);
    for (const s of c.subtopics || []) count.set('subtopic:' + s.key, s.count);
  }

  container.innerHTML = '';
  container.appendChild(el('div', { class: 'dcp-tree-head' }, [
    el('span', {}, 'درخت موضوعی شما'),
    el('span', { class: 'dcp-tree-total' }, faNum(tree.total_highlights || 0) + ' هایلایت'),
  ]));

  const list = el('div', { class: 'dcp-tree' });
  for (const c of model.clusters || []) {
    const cCount = count.get('cluster:' + c.key) || 0;
    const cluster = el('details', { class: 'dcp-tree-cluster' + (cCount ? ' has-hl' : '') }, [
      el('summary', { class: 'dcp-tree-summary' }, [
        el('a', {
          class: 'dcp-tree-link', href: '/plus/cards.html?topic=cluster:' + c.key,
          onclick: (e) => e.stopPropagation(),
        }, c.fa),
        el('span', { class: 'dcp-tree-count' + (cCount ? '' : ' is-zero') }, cCount ? faNum(cCount) : ''),
      ]),
    ]);
    for (const s of c.subtopics || []) {
      const sCount = count.get('subtopic:' + s.key) || 0;
      cluster.appendChild(el('div', { class: 'dcp-tree-sub' }, [
        el('a', { class: 'dcp-tree-link', href: '/plus/cards.html?topic=subtopic:' + s.key }, s.fa),
        el('span', { class: 'dcp-tree-count' + (sCount ? '' : ' is-zero') }, sCount ? faNum(sCount) : ''),
      ]));
    }
    list.appendChild(cluster);
  }
  container.appendChild(list);
}
