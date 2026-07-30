// Learning pathways (Phase 3, spec sections 5 + 8): curated, cross-pillar
// learning journeys. Progress is entirely DERIVED server-side from the user's
// own highlights/reading (plus-api/src/pathways.ts) — there is no "mark step
// complete" button here. "شروع مسیر" only starts the API tracking a
// current_step cache so GET /me can headline it on the dashboard; browsing a
// pathway before that still shows real credit for content already consumed.
import { el, faNum } from './util.js';
import { api } from './api.js';
import { FOLDER_EN } from './content-index.js';

function progressBar(completed, total) {
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((completed / total) * 100))) : 0;
  return el('div', { class: 'dcp-progress-track' }, el('div', { class: 'dcp-progress-fill', style: 'width:' + pct + '%' }));
}

function pathwayCard(p) {
  const tag = p.is_complete
    ? el('span', { class: 'dcp-pw-tag is-done' }, 'تکمیل شد')
    : (p.enrolled || p.completed_steps > 0)
      ? el('span', { class: 'dcp-pw-tag is-active' }, 'ادامه')
      : null;

  return el('a', { class: 'dcp-pw-card', href: '/plus/pathway.html?id=' + encodeURIComponent(p.id) }, [
    el('div', { class: 'dcp-pw-card-top' }, [
      el('h3', { class: 'dcp-pw-card-title' }, p.title_fa),
      tag,
    ]),
    el('p', { class: 'dcp-pw-card-desc' }, p.description_fa),
    progressBar(p.completed_steps, p.total_steps),
    el('div', { class: 'dcp-pw-card-foot' }, [
      el('span', {}, faNum(p.completed_steps) + ' از ' + faNum(p.total_steps) + ' مرحله'),
      p.milestone_count ? el('span', { class: 'dcp-pw-card-ms' }, '🏁 ' + faNum(p.milestone_count) + ' نقطه‌عطف') : null,
    ]),
  ]);
}

/** GET /plus/pathways.html — the catalog of every pathway, own progress overlaid. */
export async function renderPathwaysList(container) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const data = await api.pathways().catch(() => null);
  if (!data) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'مسیرها در دسترس نیست.')); return; }

  const pathways = data.pathways || [];
  if (!pathways.length) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'هنوز مسیری تعریف نشده.')); return; }

  const top = el('div', { class: 'dcp-pw-top' }, [
    el('h2', { class: 'dcp-pw-heading' }, 'مسیرهای یادگیری'),
    el('p', { class: 'dcp-sec-hint' },
      'هر مسیر مجموعه‌ای از مقاله‌ها، اپیزودها و ویدیوهاست که به ترتیبِ منطقیِ یادگیری چیده شده؛ یک مطلب می‌تواند در چند مسیر مختلف هم باشد. با خواندن، گوش‌دادن یا هایلایت‌کردن، پیشرفتِ هر مسیر خودش جلو می‌رود.'),
  ]);
  const grid = el('div', { class: 'dcp-pw-grid' }, pathways.map(pathwayCard));
  container.replaceChildren(top, grid);
}

function stepRow(step, idx, currentStep) {
  const isCurrent = !step.completed && idx === currentStep;
  const cls = 'dcp-pw-step' + (step.completed ? ' is-done' : '') + (isCurrent ? ' is-current' : '');
  const marker = el('span', { class: 'dcp-pw-step-marker' }, step.completed ? '✓' : faNum(idx + 1));

  return el('a', { class: cls, href: step.url }, [
    marker,
    el('div', { class: 'dcp-pw-step-body' }, [
      el('div', { class: 'dcp-pw-step-top' }, [
        el('span', { class: 'dcp-pw-step-kind', dir: 'ltr' }, FOLDER_EN[step.type] || step.type),
        step.milestone ? el('span', { class: 'dcp-pw-step-ms', 'aria-hidden': 'true', title: 'نقطه‌عطف' }, '🏁') : null,
      ]),
      el('div', { class: 'dcp-pw-step-title' }, step.title),
    ]),
    isCurrent ? el('span', { class: 'dcp-pw-step-here' }, 'اینجا هستید') : null,
  ]);
}

function enrollArea(id, enrolled) {
  const wrap = el('div', { class: 'dcp-pw-enroll' });
  if (enrolled) {
    wrap.appendChild(el('span', { class: 'dcp-pw-enrolled-tag' }, '✓ این مسیر را شروع کرده‌اید'));
    return wrap;
  }
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'شروع این مسیر');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await api.enrollPathway(id);
      wrap.replaceChildren(el('span', { class: 'dcp-pw-enrolled-tag' }, '✓ این مسیر را شروع کرده‌اید'));
    } catch (_) { btn.disabled = false; }
  });
  wrap.append(
    btn,
    el('p', { class: 'dcp-pw-enroll-hint' },
      'پیشرفت خودش از روی هایلایت‌ها و مطالعه‌تان حساب می‌شود؛ با شروع مسیر، آن را در پیشخوانتان هم می‌بینید.'),
  );
  return wrap;
}

/** GET /plus/pathway.html?id=... — one pathway's full step list + progress. */
export async function renderPathwayDetail(container, id) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const data = await api.pathway(id).catch(() => null);
  if (!data) {
    container.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'این مسیر پیدا نشد.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/pathways.html' }, 'بازگشت به مسیرها'),
    ]));
    return;
  }

  const milestoneCount = data.steps.filter((s) => s.milestone).length;
  const pct = data.total_steps > 0 ? Math.round((data.completed_steps / data.total_steps) * 100) : 0;

  const head = el('div', { class: 'dcp-pw-detail-head' }, [
    el('h2', { class: 'dcp-pw-detail-title' }, data.title_fa),
    el('p', { class: 'dcp-sec-hint' }, data.description_fa),
  ]);

  const progressWrap = el('div', { class: 'dcp-pw-detail-progress' }, [
    progressBar(data.completed_steps, data.total_steps),
    el('div', { class: 'dcp-pw-detail-meta' }, [
      el('span', {}, data.is_complete
        ? 'این مسیر را کامل کرده‌اید 🎉'
        : (faNum(data.completed_steps) + ' از ' + faNum(data.total_steps) + ' مرحله ' + '(٪' + faNum(pct) + ')')),
      milestoneCount ? el('span', {}, '🏁 ' + faNum(milestoneCount) + ' نقطه‌عطف') : null,
    ]),
  ]);

  const steps = el('div', { class: 'dcp-pw-steps' },
    data.steps.map((s, i) => stepRow(s, i, data.current_step)));

  container.replaceChildren(head, progressWrap, enrollArea(data.id, data.enrolled), steps);
}
