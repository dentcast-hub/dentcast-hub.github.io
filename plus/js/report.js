// «گزارش ماهانه» (premium): one Jalali month of the reader's own activity,
// derived on request by plus-api/src/services/monthly-report.ts and stored
// nowhere. This module only DRAWS it — every number arrives computed, and
// nothing here adds one up, so the page and the API can never disagree about
// what a month contained.
//
// Reuses the dashboard vocabulary (dcp-dash-sec / dcp-dash-h2 / dcp-sec-hint,
// the pathway progress rows, the badge wall's disc classes) and adds only the
// dcp-rp-* classes in plus-pages.css. Design approved from the mockup in
// .dentcast/monthly-report-mockup.html (founder, 2026-09-13); the decisions
// below are the ones worth restating:
//
//   · A delta down is GREY, never red. A quieter month is not a failing grade —
//     the same argument DES makes for band E — and a red −۲ under «اپیزود»
//     turns a report into a scold.
//   · The current month carries no comparison. Twenty-two days against
//     thirty-one is not a smaller number, it is a different question, and a
//     «−۹ از ماه قبل» on the 22nd would be answering the wrong one.
//   · «دست‌نخورده» lists pillars the reader HAD read before and did not open
//     this month, never pillars they have never touched. The report says what
//     you did; the compass is where what you have never done belongs.
//   · Zero is never printed as a section. A month with no league weeks has no
//     league section, not a «۰ هفته» one — same rule as the heart count.
import { el, faNum, sectionIcon } from './util.js?v=126';
import { api } from './api.js?v=126';
import { FOLDER_EN } from './content-index.js?v=126';
import { markReturnTrail } from './return-trail.js?v=126';
import { monthName, shiftMonth } from './jalali-month.js?v=126';
import { badgeIcon } from './achievements.js?v=126';

const RETURN = { url: '/plus/report.html', eyebrow: 'گزارش ماهانه', title: 'گزارش ماهانه', iconId: 'icon-chart-bar' };

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const PATHWAYS_SHOWN = 4;

/** Read `?month=` off the URL, or null. */
export function monthFromUrl(search = location.search) {
  const m = new URLSearchParams(search).get('month');
  return m && /^\d{4}-\d{2}$/.test(m) ? m : null;
}

function section(title, hint, body, extraClass) {
  return el('div', { class: 'dcp-dash-sec' + (extraClass ? ' ' + extraClass : ''), 'data-ico': sectionIcon(title) }, [
    el('h3', { class: 'dcp-dash-h2' }, title),
    hint ? el('p', { class: 'dcp-sec-hint' }, hint) : null,
    body,
  ].filter(Boolean));
}

// ---------------------------------------------------------------- pieces ---

function delta(now, before, prevName) {
  const d = now - before;
  if (d === 0) return el('span', { class: 'dcp-rp-delta' }, 'مثل ' + prevName);
  const sign = d > 0 ? '+' : '−';
  return el('span', { class: 'dcp-rp-delta' + (d > 0 ? ' is-up' : '') }, sign + faNum(Math.abs(d)) + ' از ' + prevName);
}

/** The three big numbers + the three small ones. */
function hero(r, prevName) {
  const c = r.counts;
  const compare = !r.in_progress && prevName;
  const kpi = (v, label, before) => el('div', { class: 'dcp-rp-kpi' }, [
    el('span', { class: 'dcp-rp-kpi-v' }, faNum(v)),
    el('span', { class: 'dcp-rp-kpi-l' }, label),
    compare ? delta(v, before, prevName) : null,
  ].filter(Boolean));
  // A zero chip is not printed («۰ یادداشت» announces an absence); روز فعال
  // stays because the days grid below is about exactly that number.
  const chip = (v, label, always) => (v > 0 || always) ? el('span', { class: 'dcp-rp-chip' }, [el('b', {}, faNum(v)), ' ' + label]) : null;
  return el('div', { class: 'dcp-rp-hero' }, [
    el('div', { class: 'dcp-rp-kpis' }, [
      kpi(c.articles, 'مقاله', r.previous.articles),
      kpi(c.episodes, 'اپیزود', r.previous.episodes),
      kpi(c.highlights, 'هایلایت', r.previous.highlights),
    ]),
    el('div', { class: 'dcp-rp-chips' }, [
      chip(c.cards_reviewed, 'کارت مرور'),
      chip(c.notes, 'یادداشت'),
      chip(c.active_days, 'روز فعال', true),
    ].filter(Boolean)),
  ]);
}

/** A month of day cells, Saturday-first, active days filled. */
function daysGrid(r) {
  const grid = el('div', { class: 'dcp-rp-days', role: 'img', 'aria-label': faNum(r.counts.active_days) + ' روز فعال از ' + faNum(r.month.days) });
  for (const w of WEEKDAYS) grid.appendChild(el('span', { class: 'dcp-rp-wd', 'aria-hidden': 'true' }, w));
  for (let i = 0; i < r.calendar.first_weekday; i += 1) grid.appendChild(el('span', { class: 'dcp-rp-day is-empty' }));
  const active = new Set(r.calendar.active);
  const shielded = new Set(r.calendar.shielded);
  const today = r.in_progress ? r.calendar.today : r.month.days;
  for (let d = 1; d <= r.month.days; d += 1) {
    let cls = 'dcp-rp-day';
    if (active.has(d)) cls += ' is-on';
    else if (shielded.has(d)) cls += ' is-shield';
    else if (d > today) cls += ' is-future';
    grid.appendChild(el('span', { class: cls }, faNum(d)));
  }
  return grid;
}

function daysSection(r) {
  const bits = [];
  if (r.longest_run > 1) bits.push('بلندترین زنجیره‌ی این ماه: ' + faNum(r.longest_run) + ' روز');
  if (r.shields_used > 0) bits.push(faNum(r.shields_used) + ' سپر خرج شد');
  const hint = 'هر روزی که خواندید، هایلایت کردید یا مرور کردید.' + (bits.length ? ' ' + bits.join(' · ') + '.' : '');
  const legend = el('div', { class: 'dcp-rp-legend' }, [
    el('span', {}, [el('i', { class: 'is-on' }), 'روز فعال']),
    r.shields_used > 0 ? el('span', {}, [el('i', { class: 'is-shield' }), 'با سپر پل زده شد']) : null,
  ].filter(Boolean));
  return section('روزهای فعال', hint, el('div', {}, [daysGrid(r), legend]));
}

function pillarRow(p) {
  const added = p.coverage_after_pct - p.coverage_before_pct;
  return el('div', { class: 'dcp-rp-pillar' }, [
    el('span', { class: 'dcp-rp-pillar-name' }, [
      p.fa + ' ',
      el('span', { class: 'dcp-rp-add' }, '+' + faNum(p.read_this_month) + ' مطلب'),
    ]),
    el('span', { class: 'dcp-rp-pillar-val' }, ['٪' + faNum(p.coverage_before_pct) + ' ← ', el('b', {}, '٪' + faNum(p.coverage_after_pct))]),
    el('div', { class: 'dcp-rp-track' }, [
      el('div', { class: 'dcp-rp-before', style: 'width:' + p.coverage_before_pct + '%' }),
      el('div', { class: 'dcp-rp-new', style: 'width:' + Math.max(added, p.read_this_month > 0 ? 1 : 0) + '%' }),
    ]),
  ]);
}

function dormantRow(d) {
  return el('div', { class: 'dcp-rp-dormant' }, [
    el('b', {}, d.fa),
    el('span', {}, faNum(d.read_before) + ' مطلب تا پیش از این ماه'),
  ]);
}

function pathwayRow(p) {
  const pct = p.total_steps ? Math.round((p.completed_steps / p.total_steps) * 100) : 0;
  return el('a', {
    class: 'dcp-rp-pw' + (p.is_complete ? ' is-done' : ''),
    href: '/plus/pathway.html?id=' + encodeURIComponent(p.id),
  }, [
    el('span', { class: 'dcp-rp-pw-name' }, [
      p.title_fa + ' ',
      p.completed_this_month ? el('span', { class: 'dcp-rp-flag' }, '🏁 این ماه تمام شد') : null,
    ].filter(Boolean)),
    el('span', { class: 'dcp-rp-pw-meta' }, faNum(p.completed_steps) + ' از ' + faNum(p.total_steps) + ' · +' + faNum(p.steps_this_month) + ' این ماه'),
    el('div', { class: 'dcp-rp-pw-track' }, el('div', { class: 'dcp-rp-pw-fill', style: 'width:' + pct + '%' })),
  ]);
}

const OUTCOME_FA = { promoted: '↑ صعود', demoted: '↓ سقوط', stayed: 'ماند' };

function weekCard(w) {
  const day = w.week_start_fa || '';
  return el('div', { class: 'dcp-rp-week' }, [
    el('span', { class: 'dcp-rp-week-ws' }, day),
    w.final_rank
      ? el('span', { class: 'dcp-rp-week-r' }, [faNum(w.final_rank), el('small', {}, ' از ' + faNum(w.group_size))])
      : el('span', { class: 'dcp-rp-week-r is-open' }, '—'),
    el('span', { class: 'dcp-rp-week-tier' }, w.tier_fa),
    el('span', { class: 'dcp-rp-week-o' + (w.outcome === 'promoted' ? ' is-up' : '') },
      w.outcome ? OUTCOME_FA[w.outcome] : faNum(w.weekly_xp) + ' XP'),
  ]);
}

function leagueSection(r) {
  const L = r.league;
  const bits = [];
  if (L.best_rank) bits.push('بهترین رتبه: ' + faNum(L.best_rank));
  if (L.promotions) bits.push(faNum(L.promotions) + (L.promotions === 1 ? ' صعود' : ' صعود'));
  bits.push(faNum(L.total_xp) + ' XP');
  const n = L.weeks.length;
  const hint = (n === 1 ? 'یک هفته‌ای' : faNum(n) + ' هفته‌ای') + ' که شنبه‌اش در ' + r.month.month_fa + ' بود. ' + bits.join(' · ') + '.';
  return section('لیگ', hint, el('div', { class: 'dcp-rp-weeks' }, L.weeks.map(weekCard)));
}

function badgeTile(b) {
  const ring = b.metal ? ' dcp-bg-' + b.metal : ' dcp-bg-oneshot';
  return el('a', { class: 'dcp-rp-badge', href: '/plus/profile.html#achievements' }, [
    el('span', { class: 'dcp-rp-badge-disc' + ring }, badgeIcon(b.icon, 'dcp-bg-ico')),
    el('span', { class: 'dcp-rp-badge-n' }, b.title_fa),
  ]);
}

function itemRow(item) {
  return el('a', { class: 'dcp-pw-step', href: item.url, onclick: () => markReturnTrail(RETURN) }, [
    el('span', { class: 'dcp-pw-step-marker', 'aria-hidden': 'true' }, '📖'),
    el('div', { class: 'dcp-pw-step-body' }, [
      el('div', { class: 'dcp-pw-step-top' }, el('span', { class: 'dcp-pw-step-kind', dir: 'ltr' }, FOLDER_EN[item.type] || item.type)),
      el('div', { class: 'dcp-pw-step-title' }, item.title),
    ]),
  ]);
}

function hasAnything(c) {
  return c.articles + c.episodes + c.highlights + c.cards_reviewed + c.active_days > 0;
}

// ------------------------------------------------------------------ page ---

/**
 * Draw one report into `container`. `nav` is {prev, next, onPick}: the keys of
 * the months either side (null at the ends) and a callback the arrows call.
 */
export function renderReport(container, r, nav) {
  const prevKey = shiftMonth(r.month.key, -1);
  const prevName = prevKey >= r.first_month ? monthName(prevKey) : null;

  const arrow = (key, label, glyph) => el('button', {
    class: 'dcp-rp-arrow', type: 'button', title: key ? label + ' ' + monthName(key) : '', 'aria-label': key ? label : '',
    disabled: key ? null : 'disabled',
    onclick: key ? () => nav.onPick(key) : null,
  }, glyph);

  const head = el('div', { class: 'dcp-rp-head' }, [
    el('div', { class: 'dcp-rp-eyebrow' }, 'گزارش ماهانه'),
    el('div', { class: 'dcp-rp-title' }, [
      el('h1', {}, r.month.title_fa),
      el('nav', { class: 'dcp-rp-nav', 'aria-label': 'ماه' }, [
        arrow(nav.prev, 'ماه قبل:', '›'),
        arrow(nav.next, 'ماه بعد:', '‹'),
      ]),
    ]),
    el('p', { class: 'dcp-rp-sub' }, r.in_progress
      ? ['۱ تا ' + faNum(r.calendar.today) + ' ' + r.month.month_fa + ' · ', el('span', { class: 'dcp-rp-chip is-live' }, 'تا امروز')]
      : '۱ تا ' + faNum(r.month.days) + ' ' + r.month.month_fa + ' · ' + faNum(r.month.days) + ' روز'),
  ]);

  const children = [head, hero(r, prevName)];

  if (!hasAnything(r.counts)) {
    children.push(el('div', { class: 'dcp-empty' }, r.in_progress
      ? 'این ماه هنوز چیزی ثبت نشده؛ با اولین مقاله یا اپیزودی که تمام کنید شروع می‌شود.'
      : 'در ' + r.month.month_fa + ' چیزی ثبت نشده.'));
    container.replaceChildren(...children);
    return;
  }

  children.push(daysSection(r));

  if (r.pillars.length) {
    children.push(section('پیلارها', 'پوشش هر پیلار در آغاز و پایان ماه. رنگِ پررنگ سهم همین ماه است.',
      el('div', { class: 'dcp-rp-pillars' }, r.pillars.map(pillarRow))));
  }

  // Not while the month is still running: on the 5th, «this month you did not
  // open سرامیک» is not an observation yet, it is a nag.
  if (r.dormant.length && !r.in_progress) {
    children.push(section(
      'این ماه دست‌نخورده ماند',
      'حوزه‌هایی که قبلاً در آن‌ها خوانده بودید و این ماه سراغشان نرفتید. حوزه‌هایی که هیچ‌وقت نرفته‌اید این‌جا نیست؛ آن کارِ قطب‌نماست.',
      el('div', { class: 'dcp-rp-dormants' }, [
        ...r.dormant.map(dormantRow),
        el('a', { class: 'dcp-pw-alllink', href: '/plus/reading-compass.html' }, 'قطب‌نمای مطالعه ›'),
      ]),
      'is-unexplored',
    ));
  }

  if (r.pathways.length) {
    // 149 steps are shared between pathways, so one article routinely moves
    // five of them by a step; the reader's story is the two or three that moved
    // most (finishes first), and the rest wait behind a toggle.
    const ordered = [...r.pathways].sort((a, b) =>
      (b.completed_this_month ? 1 : 0) - (a.completed_this_month ? 1 : 0) || b.steps_this_month - a.steps_this_month);
    const shown = ordered.slice(0, PATHWAYS_SHOWN);
    const rest = ordered.slice(PATHWAYS_SHOWN);
    const list = el('div', { class: 'dcp-rp-pws' }, shown.map(pathwayRow));
    let more = null;
    if (rest.length) {
      more = el('button', { class: 'dcp-rp-morebtn', type: 'button' }, 'و ' + faNum(rest.length) + ' مسیر دیگر ›');
      more.addEventListener('click', () => {
        rest.forEach((p) => list.appendChild(pathwayRow(p)));
        more.remove();
      });
    }
    children.push(section('مسیرها', 'قدم‌هایی که این ماه در هر مسیر برداشتید.', el('div', {}, [list, more].filter(Boolean))));
  }

  if (r.league.weeks.length) children.push(leagueSection(r));

  if (r.badges.length) {
    children.push(section('نشان‌های این ماه', 'همان دیسک‌های دیوار افتخارات؛ حلقه رنگ سطح است.',
      el('div', { class: 'dcp-rp-badges' }, r.badges.map(badgeTile))));
  }

  if (r.read_items.length) {
    const rest = r.read_items_total - r.read_items.length;
    children.push(section('این ماه خواندید', 'به ترتیبِ تازه‌ترین.', el('div', {}, [
      el('div', { class: 'dcp-pw-steps' }, r.read_items.map(itemRow)),
      rest > 0 ? el('p', { class: 'dcp-muted dcp-rp-more' }, 'و ' + faNum(rest) + ' مورد دیگر — همه در دفترچه‌ی هایلایت‌ها و قطب‌نما.') : null,
    ].filter(Boolean))));
  }

  children.push(el('p', { class: 'dcp-rp-prov' },
    'همه‌ی اعداد از همان رویدادهایی حساب می‌شوند که امتیاز می‌گیرند: مقاله‌ی تمام‌شده، اپیزود شنیده‌شده، هایلایت، کارت مرورشده، روزِ فعال. زمانِ خواندن اندازه‌گیری نمی‌شود و این‌جا هم نیست.'));

  container.replaceChildren(...children);
}

/**
 * The page: resolve which month, fetch, draw, and keep the URL in step so a
 * refresh or the back button lands on the same month.
 */
export async function renderReportPage(container, initialMonth) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const months = await api.reportMonths().catch(() => null);
  if (!months || !months.months || !months.months.length) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, 'گزارش در دسترس نیست.'));
    return;
  }
  const list = months.months; // newest first
  const lastCompleted = list.length > 1 ? list[1] : list[0];
  let key = initialMonth && list.includes(initialMonth) ? initialMonth : lastCompleted;

  const show = async (k, push) => {
    key = k;
    if (push) history.replaceState(null, '', '/plus/report.html?month=' + k);
    container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
    const r = await api.report(k).catch(() => null);
    if (!r) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'گزارش این ماه در دسترس نیست.')); return; }
    const i = list.indexOf(k);
    renderReport(container, r, {
      prev: i >= 0 && i + 1 < list.length ? list[i + 1] : null,
      next: i > 0 ? list[i - 1] : null,
      onPick: (next) => { void show(next, true); },
    });
    window.scrollTo({ top: 0 });
  };
  await show(key, !!initialMonth && initialMonth !== key);
}
