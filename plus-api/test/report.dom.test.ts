// @vitest-environment jsdom
// Drives the REAL shipped renderer (/plus/js/report.js) for «گزارش ماهانه».
//
// The rules held here are the visual ones the API cannot enforce:
//   · a delta DOWN is grey (no is-up class), never a red mark — a quieter
//     month is not a failing grade;
//   · the CURRENT month carries no comparison at all — twenty-two days
//     against thirty-one is a different question, not a smaller number;
//   · a section with nothing in it is ABSENT, never a «۰» heading;
//   · the month arrows are disabled at the ends and call back with the key;
//   · a dormant list is printed only for pillars the reader had read before.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const calls: string[] = [];
const state = { months: ['1405-07', '1405-06', '1405-05'], reports: {} as Record<string, unknown> };

vi.mock('/plus/js/api.js', () => ({
  api: {
    reportMonths: async () => { calls.push('months'); return { months: state.months, current: '1405-07' }; },
    report: async (m: string) => { calls.push('report:' + m); const r = state.reports[m]; if (!r) throw new Error('none'); return r; },
  },
  currentUser: async () => null,
  ApiError: class extends Error {},
}));
vi.mock('/plus/js/return-trail.js', () => ({ markReturnTrail: () => {} }));
vi.mock('/plus/js/achievements.js', () => ({ badgeIcon: (name: string, cls: string) => { const s = document.createElement('span'); s.className = cls; s.dataset.icon = name; return s; } }));

const { renderReport, renderReportPage, monthFromUrl } = await import('/plus/js/report.js');

const counts = (o: Partial<Record<string, number>> = {}) => ({
  articles: 0, episodes: 0, highlights: 0, notes: 0, cards_reviewed: 0, active_days: 0, ...o,
});

function report(over: Record<string, unknown> = {}) {
  return {
    month: { key: '1405-06', jy: 1405, jm: 6, title_fa: 'شهریور ۱۴۰۵', month_fa: 'شهریور', from_day: '2026-08-23', to_day: '2026-09-22', days: 31 },
    in_progress: false,
    calendar: { first_weekday: 1, active: [1, 2, 3, 9], shielded: [4], today: 31 },
    counts: counts({ articles: 7, episodes: 3, highlights: 21, notes: 5, cards_reviewed: 48, active_days: 4 }),
    previous: counts({ articles: 4, episodes: 5, highlights: 21, active_days: 2 }),
    pillars: [{ key: 'ceramics', fa: 'سرامیک', total: 50, read_this_month: 4, coverage_before_pct: 12, coverage_after_pct: 18 }],
    dormant: [{ key: 'removable-pros', fa: 'پروتز متحرک', read_before: 7, total: 20 }],
    longest_run: 3,
    shields_used: 1,
    pathways: [{ id: 'occlusion', title_fa: 'اکلوژن', short_fa: null, total_steps: 17, completed_steps: 17, steps_this_month: 3, is_complete: true, completed_this_month: true }],
    league: { weeks: [{ week_start: '2026-08-29', week_start_fa: '۷ شهریور', tier_fa: 'کامپوزیت', weekly_xp: 40, final_rank: 2, group_size: 8, outcome: 'promoted' }], best_rank: 2, promotions: 1, total_xp: 40 },
    badges: [{ key: 'reviewer', title_fa: 'مرورگر', icon: '🔁', level: 2, metal: 'silver', announced_at: '2026-09-01T00:00:00Z' }],
    read_items: [{ content_id: 'insight/insight-1', title: 'ضخامت کاغذ آرتیکولاسیون', url: '/insight/insight-1.html', type: 'insight' }],
    read_items_total: 3,
    first_month: '1405-03',
    ...over,
  };
}

beforeEach(() => {
  document.body.replaceChildren();
  calls.length = 0;
  state.reports = {};
});

const nav = () => ({ prev: '1405-05', next: '1405-07', onPick: vi.fn() });

describe('renderReport', () => {
  it('draws the month, the three big numbers, and grey/green deltas against the month before', () => {
    const root = document.createElement('div');
    renderReport(root, report(), nav());
    expect(root.querySelector('h1')!.textContent).toBe('شهریور ۱۴۰۵');
    const kpis = Array.from(root.querySelectorAll('.dcp-rp-kpi'));
    expect(kpis.map((k) => k.querySelector('.dcp-rp-kpi-v')!.textContent)).toEqual(['۷', '۳', '۲۱']);
    const deltas = kpis.map((k) => k.querySelector('.dcp-rp-delta')!);
    expect(deltas[0].textContent).toBe('+۳ از مرداد');
    expect(deltas[0].classList.contains('is-up')).toBe(true);
    // Down is grey: the class carries no "down" state and nothing turns red.
    expect(deltas[1].textContent).toBe('−۲ از مرداد');
    expect(deltas[1].className).toBe('dcp-rp-delta');
    expect(deltas[2].textContent).toBe('مثل مرداد');
  });

  it('carries no comparison while the month is in progress, and marks it «تا امروز»', () => {
    const root = document.createElement('div');
    renderReport(root, report({ in_progress: true, calendar: { first_weekday: 1, active: [1], shielded: [], today: 12 } }), nav());
    expect(root.querySelector('.dcp-rp-delta')).toBeNull();
    // …and no «dormant» verdict on a month that is not over.
    expect(Array.from(root.querySelectorAll('.dcp-dash-h2')).map((h) => h.textContent)).not.toContain('این ماه دست‌نخورده ماند');
    expect(root.querySelector('.dcp-rp-sub')!.textContent).toContain('تا امروز');
    expect(root.querySelector('.dcp-rp-sub')!.textContent).toContain('۱ تا ۱۲');
    // Days after today are drawn as future, not as missed.
    expect(root.querySelectorAll('.dcp-rp-day.is-future').length).toBe(31 - 12);
  });

  it('never compares against a month before the account existed', () => {
    const root = document.createElement('div');
    renderReport(root, report({ first_month: '1405-06' }), nav());
    expect(root.querySelector('.dcp-rp-delta')).toBeNull();
  });

  it('lays the day grid out Saturday-first with the active and shielded days marked', () => {
    const root = document.createElement('div');
    renderReport(root, report(), nav());
    const cells = Array.from(root.querySelectorAll('.dcp-rp-day'));
    expect(cells.length).toBe(1 + 31); // one leading empty (first_weekday = 1) + the days
    expect(cells[0].classList.contains('is-empty')).toBe(true);
    expect(cells[1].textContent).toBe('۱');
    expect(cells[1].classList.contains('is-on')).toBe(true);
    expect(cells[4].classList.contains('is-shield')).toBe(true);
    expect(root.querySelectorAll('.dcp-rp-day.is-on').length).toBe(4);
    expect(root.querySelector('.dcp-rp-legend')!.textContent).toContain('سپر');
  });

  it('prints every section that has something, and none that does not', () => {
    const root = document.createElement('div');
    renderReport(root, report(), nav());
    const titles = Array.from(root.querySelectorAll('.dcp-dash-h2')).map((h) => h.textContent);
    expect(titles).toEqual(['روزهای فعال', 'پیلارها', 'این ماه دست‌نخورده ماند', 'مسیرها', 'لیگ', 'نشان‌های این ماه', 'این ماه خواندید']);
    expect(root.querySelector('.dcp-rp-flag')!.textContent).toContain('این ماه تمام شد');
    expect(root.querySelector('.dcp-rp-week-o')!.textContent).toBe('↑ صعود');
    expect(root.querySelector('.dcp-rp-badge-disc')!.classList.contains('dcp-bg-silver')).toBe(true);
    expect((root.querySelector('.dcp-rp-badge-disc .dcp-bg-ico') as HTMLElement).dataset.icon).toBe('🔁');
    // Zero chips are not printed; روز فعال always is.
    expect(Array.from(root.querySelectorAll('.dcp-rp-hero .dcp-rp-chip')).map((c) => c.textContent)).toEqual(['۴۸ کارت مرور', '۵ یادداشت', '۴ روز فعال']);
    expect(root.querySelector('.dcp-rp-more')!.textContent).toContain('۲ مورد دیگر');

    const bare = document.createElement('div');
    renderReport(bare, report({ pillars: [], dormant: [], pathways: [], league: { weeks: [], best_rank: null, promotions: 0, total_xp: 0 }, badges: [], read_items: [], read_items_total: 0 }), nav());
    expect(Array.from(bare.querySelectorAll('.dcp-dash-h2')).map((h) => h.textContent)).toEqual(['روزهای فعال']);
    expect(bare.textContent).not.toContain('۰ هفته');
  });

  it('an empty month says so once, with no sections', () => {
    const root = document.createElement('div');
    renderReport(root, report({ counts: counts(), pillars: [], dormant: [], pathways: [], league: { weeks: [], best_rank: null, promotions: 0, total_xp: 0 }, badges: [], read_items: [], read_items_total: 0 }), nav());
    expect(root.querySelector('.dcp-empty')!.textContent).toContain('در شهریور چیزی ثبت نشده');
    expect(root.querySelectorAll('.dcp-dash-sec').length).toBe(0);
  });

  it('the arrows page through months and are disabled at the ends', () => {
    const root = document.createElement('div');
    const n = nav();
    renderReport(root, report(), n);
    const [older, newer] = Array.from(root.querySelectorAll<HTMLButtonElement>('.dcp-rp-arrow'));
    expect(older.disabled).toBe(false);
    older.click();
    expect(n.onPick).toHaveBeenCalledWith('1405-05');
    newer.click();
    expect(n.onPick).toHaveBeenCalledWith('1405-07');

    const end = document.createElement('div');
    renderReport(end, report(), { prev: null, next: null, onPick: vi.fn() });
    expect(Array.from(end.querySelectorAll<HTMLButtonElement>('.dcp-rp-arrow')).every((b) => b.disabled)).toBe(true);
  });
});

describe('pathways', () => {
  it('shows the four that moved most, finishes first, and folds the rest behind a toggle', () => {
    const pw = (id: string, steps: number, done = false) => ({ id, title_fa: id, short_fa: null, total_steps: 20, completed_steps: 5, steps_this_month: steps, is_complete: done, completed_this_month: done });
    const root = document.createElement('div');
    renderReport(root, report({ pathways: [pw('a', 1), pw('b', 3), pw('c', 1, true), pw('d', 2), pw('e', 1), pw('f', 5)] }), nav());
    const names = () => Array.from(root.querySelectorAll('.dcp-rp-pw-name')).map((n) => n.textContent!.trim().split(' ')[0]);
    expect(names()).toEqual(['c', 'f', 'b', 'd']);
    const more = root.querySelector<HTMLButtonElement>('.dcp-rp-morebtn')!;
    expect(more.textContent).toBe('و ۲ مسیر دیگر ›');
    more.click();
    expect(names()).toEqual(['c', 'f', 'b', 'd', 'a', 'e']);
    expect(root.querySelector('.dcp-rp-morebtn')).toBeNull();
  });
});

describe('renderReportPage', () => {
  it('opens on the last COMPLETED month, not the current one, and honours ?month=', async () => {
    state.reports['1405-06'] = report();
    state.reports['1405-05'] = report({ month: { key: '1405-05', jy: 1405, jm: 5, title_fa: 'مرداد ۱۴۰۵', month_fa: 'مرداد', from_day: '2026-07-23', to_day: '2026-08-22', days: 31 } });
    const root = document.createElement('div');
    document.body.appendChild(root);
    await renderReportPage(root, null);
    expect(calls).toEqual(['months', 'report:1405-06']);
    expect(root.querySelector('h1')!.textContent).toBe('شهریور ۱۴۰۵');

    calls.length = 0;
    await renderReportPage(root, '1405-05');
    expect(calls).toEqual(['months', 'report:1405-05']);
    expect(root.querySelector('h1')!.textContent).toBe('مرداد ۱۴۰۵');
  });

  it('reads a well-formed ?month= and ignores junk', () => {
    expect(monthFromUrl('?month=1405-06')).toBe('1405-06');
    expect(monthFromUrl('?month=abc')).toBeNull();
    expect(monthFromUrl('')).toBeNull();
  });
});
