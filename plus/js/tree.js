// Dashboard navigation tree = the real site folders (پادکست، نوت‌کست، ...). Each
// folder is a link to its landing page with the user's highlight count beside it
// (spec change from the prototype feedback). Navigation only: no bodies, no
// cross-article aggregation. Still one shared content model with the Phase 3 map.
import { el, faNum } from './util.js';
import { api } from './api.js';

export async function renderTree(container) {
  container.innerHTML = '';
  container.appendChild(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  const tree = await api.tree().catch(() => ({ folders: [], total_highlights: 0 }));

  container.innerHTML = '';
  const list = el('div', { class: 'dcp-folders' });
  for (const f of tree.folders || []) {
    list.appendChild(el('a', { class: 'dcp-folder' + (f.count ? ' has-hl' : ''), href: f.url }, [
      el('span', { class: 'dcp-folder-name' }, f.fa),
      el('span', { class: 'dcp-folder-count' + (f.count ? '' : ' is-zero') },
        f.count ? faNum(f.count) + ' هایلایت' : 'بدون هایلایت'),
    ]));
  }
  if (!(tree.folders || []).length) {
    list.appendChild(el('div', { class: 'dcp-muted' }, 'فهرست موضوع‌ها در دسترس نیست.'));
  }
  container.appendChild(list);
}
