// «قطب‌نمای مطالعه» (premium): a coverage report, not an interest guess — see
// plus-api/src/services/reading-compass.ts. Reuses the same row shapes the
// dashboard/pathways pages already use (dcp-progress-row for bars,
// dcp-pw-step for suggestion rows) so this page needs no new CSS.
import { el, faNum } from './util.js';
import { api } from './api.js';
import { FOLDER_EN } from './content-index.js';

function coverageRow(c) {
  return el('div', { class: 'dcp-progress-row' }, [
    el('span', { class: 'dcp-progress-name' }, c.fa),
    el('div', { class: 'dcp-progress-track' }, el('div', { class: 'dcp-progress-fill', style: 'width:' + c.coverage_pct + '%' })),
    el('span', { class: 'dcp-progress-val' }, '٪' + faNum(c.coverage_pct)),
  ]);
}

function pathwayRow(p) {
  return el('a', { class: 'dcp-progress-row', href: '/plus/pathway.html?id=' + encodeURIComponent(p.id) }, [
    el('span', { class: 'dcp-progress-name' }, p.title_fa),
    el('div', { class: 'dcp-progress-track' }, el('div', { class: 'dcp-progress-fill', style: 'width:' + p.pct + '%' })),
    el('span', { class: 'dcp-progress-val' }, '٪' + faNum(p.pct)),
  ]);
}

function itemRow(item) {
  return el('a', { class: 'dcp-pw-step', href: item.url }, [
    el('span', { class: 'dcp-pw-step-marker', 'aria-hidden': 'true' }, '📖'),
    el('div', { class: 'dcp-pw-step-body' }, [
      el('div', { class: 'dcp-pw-step-top' }, el('span', { class: 'dcp-pw-step-kind', dir: 'ltr' }, FOLDER_EN[item.type] || item.type)),
      el('div', { class: 'dcp-pw-step-title' }, item.title),
    ]),
  ]);
}

function section(title, hint, body) {
  return el('div', { class: 'dcp-dash-sec' }, [
    el('h3', { class: 'dcp-dash-h2' }, title),
    hint ? el('p', { class: 'dcp-sec-hint' }, hint) : null,
    body,
  ].filter(Boolean));
}

/** GET /plus/reading-compass.html — the full coverage report + both suggestion buckets. */
export async function renderReadingCompass(container) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const data = await api.readingCompass().catch(() => null);
  if (!data) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'قطب‌نما در دسترس نیست.')); return; }

  if (!data.total_read) {
    container.replaceChildren(el('div', { class: 'dcp-empty' },
      'هنوز چیزی نخوانده‌اید؛ با اولین مقاله یا اپیزودی که تمام کنید، قطب‌نما فعال می‌شود.'));
    return;
  }

  const top = el('div', { class: 'dcp-pw-top' }, [
    el('h2', { class: 'dcp-pw-heading' }, 'قطب‌نمای مطالعه'),
    el('p', { class: 'dcp-sec-hint' },
      'وضعیت واقعیِ خواندن‌هایتان را نسبت به کل محتوای سایت و مسیرهای یادگیری نشان می‌دهد — بر اساس آنچه واقعاً خوانده‌اید، نه حدسِ سلیقه.'),
  ]);

  const children = [top];

  children.push(section(
    'پوشش هر پیلار',
    'چند درصد از هر پیلار را تا اینجا خوانده‌اید.',
    el('div', { class: 'dcp-progress-list' }, data.clusters.map(coverageRow)),
  ));

  if (data.top_cluster) {
    children.push(section(
      'ادامه در «' + data.top_cluster.fa + '»',
      'بیشترین مطالعه‌تان همین‌جا بوده؛ این‌ها را هنوز نخوانده‌اید.',
      data.same_area.length
        ? el('div', { class: 'dcp-pw-steps' }, data.same_area.map(itemRow))
        : el('div', { class: 'dcp-muted' }, 'همه‌ی این پیلار را خوانده‌اید.'),
    ));
  }

  children.push(section(
    'حوزه‌هایی که از دیدتان دور مانده',
    'اگر بخواهید دیدتان را گسترش دهید، این‌ها هنوز اصلاً سراغشان نرفته‌اید.',
    data.unexplored.length
      ? el('div', { class: 'dcp-pw-steps' }, data.unexplored.map(itemRow))
      : el('div', { class: 'dcp-muted' }, 'در همه‌ی حوزه‌ها ردی از مطالعه‌ی شما هست.'),
  ));

  if (data.pathways.length) {
    children.push(section(
      'پیشرفت در مسیرهای یادگیری',
      null,
      el('div', { class: 'dcp-progress-list' }, data.pathways.map(pathwayRow)),
    ));
  }

  container.replaceChildren(...children);
}
