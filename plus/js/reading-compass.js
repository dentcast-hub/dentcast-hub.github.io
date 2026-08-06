// «قطب‌نمای مطالعه» (premium): a coverage report, not an interest guess — see
// plus-api/src/services/reading-compass.ts. Reuses the same row shapes the
// dashboard/pathways pages already use (dcp-progress-row for bars,
// dcp-pw-step for suggestion rows); is-spotlight/is-unexplored/
// dcp-progress-badge/dcp-compass-ico are the only additions, in
// plus-pages.css.
import { el, faNum } from './util.js';
import { api } from './api.js';
import { FOLDER_EN } from './content-index.js';

// The badge and the percent next to it answer two DIFFERENT questions: the
// badge ranks pillars by the raw NUMBER of items read (service's sort on
// `read`), while the percent is that pillar's coverage (read ÷ its own size).
// Because pillar sizes differ ~7x, the top-read pillar routinely shows the
// LOWEST percent — «بیشترین مطالعه» on a ٪۴ row next to an unbadged ٪۱۰ row
// reads as a bug (user report, 2026-08-06). Printing the count inside the
// badge makes the unit it is ranking visible, so the two numbers stop looking
// like one contradictory number.
function topBadge(c) {
  const label = 'بیشترین مطالعه';
  if (typeof c.read !== 'number') return el('span', { class: 'dcp-progress-badge' }, label);
  return el('span', {
    class: 'dcp-progress-badge',
    title: 'بیشترین تعدادِ محتوای خوانده‌شده در میان پیلارها — درصدِ کنارش پوششِ همین پیلار است، نه رتبه‌اش.',
  }, [label + ' — ', el('b', {}, faNum(c.read) + ' مورد')]);
}

function coverageRow(c, isTop) {
  return el('div', { class: 'dcp-progress-row' }, [
    el('span', { class: 'dcp-progress-name' }, c.fa),
    isTop ? topBadge(c) : null,
    el('div', { class: 'dcp-progress-track' }, el('div', { class: 'dcp-progress-fill', style: 'width:' + c.coverage_pct + '%' })),
    el('span', { class: 'dcp-progress-val' }, '٪' + faNum(c.coverage_pct)),
  ].filter(Boolean));
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

function section(title, hint, body, extraClass) {
  return el('div', { class: 'dcp-dash-sec' + (extraClass ? ' ' + extraClass : '') }, [
    el('h3', { class: 'dcp-dash-h2' }, title),
    hint ? el('p', { class: 'dcp-sec-hint' }, hint) : null,
    body,
  ].filter(Boolean));
}

// Compass-rose glyph beside the page title - the one piece of chrome that
// names the subject (this is a *compass*, not a generic report list).
function compassIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'dcp-compass-ico');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M31 17 L26 26 L17 31 L22 22 Z" fill="currentColor"/>' +
    '<circle cx="24" cy="24" r="2.2" fill="currentColor"/>';
  return svg;
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
    el('div', { class: 'dcp-pw-heading-row' }, [compassIcon(), el('h2', { class: 'dcp-pw-heading' }, 'قطب‌نمای مطالعه')]),
    el('p', { class: 'dcp-sec-hint' },
      'وضعیت واقعیِ خواندن‌هایتان را نسبت به کل محتوای سایت و مسیرهای یادگیری نشان می‌دهد — بر اساس آنچه واقعاً خوانده‌اید، نه حدسِ سلیقه.'),
  ]);

  const children = [top];

  children.push(section(
    'پوشش هر پیلار',
    'چند درصد از هر پیلار را تا اینجا خوانده‌اید.',
    el('div', { class: 'dcp-progress-list' },
      data.clusters.map((c) => coverageRow(c, data.top_cluster && c.key === data.top_cluster.key))),
  ));

  if (data.top_cluster) {
    children.push(section(
      'ادامه در «' + data.top_cluster.fa + '»',
      'بیشترین مطالعه‌تان همین‌جا بوده؛ این‌ها را هنوز نخوانده‌اید.',
      data.same_area.length
        ? el('div', { class: 'dcp-pw-steps' }, data.same_area.map(itemRow))
        : el('div', { class: 'dcp-muted' }, 'همه‌ی این پیلار را خوانده‌اید.'),
      'is-spotlight',
    ));
  }

  children.push(section(
    'حوزه‌هایی که از دیدتان دور مانده',
    'اگر بخواهید دیدتان را گسترش دهید، این‌ها هنوز اصلاً سراغشان نرفته‌اید.',
    data.unexplored.length
      ? el('div', { class: 'dcp-pw-steps' }, data.unexplored.map(itemRow))
      : el('div', { class: 'dcp-muted' }, 'در همه‌ی حوزه‌ها ردی از مطالعه‌ی شما هست.'),
    'is-unexplored',
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
