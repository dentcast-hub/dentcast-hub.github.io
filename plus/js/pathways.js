// Learning pathways (Phase 3, spec sections 5 + 8): curated, cross-pillar
// learning journeys. Progress is entirely DERIVED server-side from the user's
// own highlights/reading (plus-api/src/pathways.ts) — there is no "mark step
// complete" button here. "شروع مسیر" only starts the API tracking a
// current_step cache so GET /me can headline it on the dashboard; browsing a
// pathway before that still shows real credit for content already consumed.
import { el, faNum, icon } from './util.js?v=76';
import { api } from './api.js?v=76';
import { FOLDER_EN } from './content-index.js?v=76';
import { markReturnTrail } from './return-trail.js?v=76';

/** A "lightning + label" chip — a leading icon from the shared sprite
 * (assets/icons/icons.svg), never a raw emoji. Used for every .dcb-chip
 * in this module. */
function boltChip(label) {
  return el('span', { class: 'dcb-chip' }, [icon('icon-lightning'), ' ' + label]);
}

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

/** A bundle's rail card — glyph + title + step meta, same compact shape as the
 * homepage's "از کجا شروع کنم؟" rail (one visual identity for bundles
 * everywhere; the dashboard's «از کجا شروع کنم؟» block imports this too).
 * Deliberately NO .dcp-progress-track inside: that class carries
 * `flex: 0 0 100%` from plus-pages.css (written for the dashboard's flex-ROW
 * progress rows), and inside a stretched flex COLUMN card that basis resolves
 * against the card's HEIGHT — a ~100px gray pill (founder report,
 * 2026-08-09). Started/completed state rides the meta text + tag instead. */
export function bundleRailCard(p) {
  const started = p.enrolled || p.completed_steps > 0;
  const meta = started
    ? faNum(p.completed_steps) + ' از ' + faNum(p.total_steps) + ' قدم'
    : faNum(p.total_steps) + ' قدم';
  const tag = p.is_complete ? 'تکمیل شد' : started ? 'ادامه' : null;

  return el('a', { class: 'dcb-railcard', href: '/plus/pathway.html?id=' + encodeURIComponent(p.id) }, [
    el('span', { class: 'dcb-railcard-glyph' }, icon(p.glyph || 'icon-lightning')),
    el('p', { class: 'dcb-railcard-title' }, p.title_fa),
    el('div', { class: 'dcb-railcard-foot' }, [
      el('span', { class: 'dcb-railcard-meta' }, meta),
      tag ? el('span', { class: 'dcb-railcard-tag' }, tag) : null,
    ]),
  ]);
}

/** GET /plus/pathways.html — the catalog: bundles (short, curated starters) above
 * full pathways (unchanged), own progress overlaid on both. */
export async function renderPathwaysList(container) {
  container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const data = await api.pathways().catch(() => null);
  if (!data) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'مسیرها در دسترس نیست.')); return; }

  const pathways = data.pathways || [];
  if (!pathways.length) { container.replaceChildren(el('div', { class: 'dcp-empty' }, 'هنوز مسیری تعریف نشده.')); return; }

  const bundles = pathways.filter((p) => p.kind === 'bundle');
  const full = pathways.filter((p) => p.kind !== 'bundle');

  const top = el('div', { class: 'dcp-pw-top' }, [
    el('h2', { class: 'dcp-pw-heading' }, 'مسیرهای یادگیری'),
    el('p', { class: 'dcp-sec-hint' },
      'هر مسیر مجموعه‌ای از مقاله‌ها، اپیزودها و ویدیوهاست که به ترتیبِ منطقیِ یادگیری چیده شده؛ یک مطلب می‌تواند در چند مسیر مختلف هم باشد. با خواندن، گوش‌دادن یا هایلایت‌کردن، پیشرفتِ هر مسیر خودش جلو می‌رود.'),
  ]);

  const sections = [top];

  // Bundles as one compact amber band with a horizontal rail — the same
  // small, contained strip they are on the homepage, never a stack of ten
  // full-width cards pushing the real catalog below the fold («یه جای مشخص
  // کوچیک، نه وسط بازار» — founder, 2026-08-09).
  if (bundles.length) {
    sections.push(el('div', { class: 'dcb-band' }, [
      el('div', { class: 'dcb-band-row' }, [
        el('h3', { class: 'dcb-band-title' }, [
          icon('icon-lightning'),
          ' باندل‌های شروع',
          el('span', { class: 'dcb-band-count' }, faNum(bundles.length) + ' باندل'),
        ]),
      ]),
      el('p', { class: 'dcb-band-hint' }, 'هسته‌ی هر موضوع در چند قدم — بدون نکته‌های حاشیه‌ای.'),
      el('div', { class: 'dcb-railwrap' }, bundles.map(bundleRailCard)),
    ]));
  }

  if (full.length) {
    sections.push(el('div', { class: 'dcb-sec-head' }, [el('h3', { class: 'dcb-sec-title' }, 'مسیرهای کامل')]));
    sections.push(el('p', { class: 'dcp-sec-hint' }, 'از پایه تا پیشرفته، با همه‌ی نکته‌ها و کیس‌ها.'));
    sections.push(el('div', { class: 'dcp-pw-grid' }, full.map(pathwayCard)));
  }

  container.replaceChildren(...sections);
}

function stepRow(step, idx, currentStep, pathway) {
  const isCurrent = !step.completed && idx === currentStep;
  const cls = 'dcp-pw-step' + (step.completed ? ' is-done' : '') + (isCurrent ? ' is-current' : '');
  const marker = el('span', { class: 'dcp-pw-step-marker' }, step.completed ? '✓' : faNum(idx + 1));
  const isBundle = pathway.kind === 'bundle';
  const onclick = () => markReturnTrail({
    url: '/plus/pathway.html?id=' + encodeURIComponent(pathway.id),
    eyebrow: isBundle ? 'باندل' : 'مسیر یادگیری',
    title: pathway.title_fa,
    iconId: isBundle ? 'icon-lightning' : 'icon-node-graph',
  });

  return el('a', { class: cls, href: step.url, onclick }, [
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

/** Bundle-only: a referral card to the prereq bundle — never a lock, just a
 * pointer, per .dentcast/bundles-handoff.md §1 ("پیش‌نیاز ارجاعی، نه تکراری"). */
function prereqCard(prereq) {
  if (!prereq) return null;
  return el('a', { class: 'dcb-prereq', href: '/plus/pathway.html?id=' + encodeURIComponent(prereq.id) }, [
    icon(prereq.glyph || 'icon-lightning'),
    el('span', {}, [
      'پیش‌نیاز: اگر با این موضوع آشنا نیستید، اول باندل «',
      el('b', {}, prereq.title_fa),
      '» را بردارید.',
    ]),
  ]);
}

/** Bundle-only: after its steps, invite the reader into the full pathway the
 * bundle was drawn from — the notes/cases trimmed out of the bundle live
 * there. Per .dentcast/bundles-handoff.md §1 ("پایان باندل، دعوت به مسیر است"). */
function continueCard(continuesInto) {
  if (!continuesInto) return null;
  return el('div', { class: 'dcb-continue' }, [
    el('b', {}, 'هسته را تمام کردید — حالا عمق:'),
    'نکته‌ها و کیس‌های تکمیلیِ این موضوع در مسیر کامل هستند. ',
    el('a', { href: '/plus/pathway.html?id=' + encodeURIComponent(continuesInto.id) },
      'ادامه در مسیر «' + continuesInto.title_fa + '» ›'),
  ]);
}

/* ------------------------------------------------------------ the exam -- */

const EXAM_LINE = {
  no_form: ['آزمون این مسیر هنوز آماده نشده', 'وقتی سؤال‌ها آماده شود، همین‌جا باز می‌شود و در «اطلاعیه» خبرش را می‌گیری.', null],
  locked: ['آزمون پایانی و گواهی‌نامه', 'با خواندن همهٔ قدم‌ها، آزمون باز می‌شود؛ با قبولی، گواهی‌نامه به نام خودت صادر می‌شود.', 'دربارهٔ آزمون'],
  ready: ['آزمون این مسیر برایت باز است', 'هر وقت آماده بودی شروع کن؛ با قبولی، گواهی‌نامه به نام خودت صادر می‌شود.', 'رفتن به آزمون'],
  open: ['یک آزمون نیمه‌کاره داری', 'سؤال‌ها همان‌هایی‌اند که دیده‌ای؛ برگرد و ارسال کن.', 'ادامهٔ آزمون'],
  queued: ['پاسخ‌هایت در حال بررسی است', 'نتیجه در «اطلاعیه» می‌آید.', 'دیدن وضعیت'],
  wait: ['این بار به نصاب نرسید', 'تلاش بعدی به‌زودی باز می‌شود — تاریخش در صفحهٔ آزمون.', 'دیدن نتیجه'],
  exhausted: ['تلاش‌های آزمون تمام شد', 'نتیجه در صفحهٔ آزمون است.', 'دیدن نتیجه'],
  passed: ['گواهی‌نامهٔ این مسیر را داری 🎓', 'از پروفایلت قابل دانلود است.', 'دیدن گواهی'],
};

/**
 * The exam card under the progress bar — one line on where this reader's
 * exam stands, from GET /exams/:id, and the way to it. Full pathways only:
 * a bundle is 5–8 steps and is not certificate-sized. Drawn lazily and
 * dropped silently when the API cannot answer: a pathway page must never
 * fail to render because the exam service did.
 */
export function examCard(state, onIntent) {
  const line = state.state === 'locked' && state.enrolled === false
    ? ['آزمون پایانی و گواهی‌نامه', 'برای کسی است که مسیر را شروع کرده — دکمهٔ «شروع این مسیر» بالا. خوانده‌هایت به حساب می‌آید.', 'دربارهٔ آزمون']
    : (EXAM_LINE[state.state] || EXAM_LINE.no_form);
  const href = state.state === 'passed' && state.certificate
    ? state.certificate.verify_url
    : '/plus/exam.html?id=' + encodeURIComponent(state.pathway_id);
  return el('div', { class: 'dcp-card dcp-pw-exam ' + state.state, 'data-pw-exam': state.state }, [
    el('div', {}, [el('b', {}, line[0]), el('p', { class: 'dcp-muted' }, line[1])]),
    line[2] ? el('a', { class: 'dcp-btn ' + (state.state === 'ready' || state.state === 'open' ? 'dcp-btn-primary' : 'dcp-btn-ghost'), href }, line[2]) : null,
    intentRow(state, onIntent),
  ].filter(Boolean));
}

/**
 * «گواهی‌نامهٔ این مسیر را می‌خواهی؟» — asked ONCE, here rather than at the
 * start of the pathway, because a wish declared at step zero is cheap and
 * one declared at step twelve is real; and here is on every visit, so
 * nobody who is already mid-pathway has «missed» it. The answer is what the
 * founder's near-the-end alert is filtered by (services/pathway-standings.ts):
 * a «بله» from somebody already close is news that goes out at once.
 */
export function intentRow(state, onIntent) {
  if (state.certificate_intent || state.state === 'passed' || state.state === 'open' || state.state === 'queued') return null;
  const msg = el('span', { class: 'dcp-muted' });
  const mk = (label, intent, primary) => {
    const b = el('button', { class: 'dcp-btn dcp-btn-sm' + (primary ? '' : ' dcp-btn-ghost'), type: 'button', 'data-pw-intent': intent }, label);
    b.addEventListener('click', async () => {
      row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      msg.textContent = 'ثبت…';
      try {
        const next = await api.examIntent(state.pathway_id, intent);
        if (onIntent) onIntent(next);
      } catch (_) {
        row.querySelectorAll('button').forEach((x) => { x.disabled = false; });
        msg.textContent = 'ثبت نشد.';
      }
    });
    return b;
  };
  const row = el('div', { class: 'dcp-pw-intent', 'data-pw-intent-row': '' }, [
    el('span', {}, 'گواهی‌نامهٔ این مسیر را می‌خواهی؟'),
    mk('بله، می‌خواهم', 'wanted', true),
    mk('فعلاً نه', 'declined', false),
    msg,
  ]);
  return row;
}

async function mountExamCard(slot, id) {
  if (typeof api.exam !== 'function') return;
  const draw = (state) => {
    if (state && state.state) slot.replaceChildren(examCard(state, draw));
  };
  try {
    draw(await api.exam(id));
  } catch (_) { /* the page stands without it */ }
}

/** GET /plus/pathway.html?id=... — one pathway's full step list + progress.
 * Same view for a bundle, plus its type chip, prereq referral, and closing
 * invite into the full pathway it was drawn from. */
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

  const isBundle = data.kind === 'bundle';
  const milestoneCount = data.steps.filter((s) => s.milestone).length;
  const pct = data.total_steps > 0 ? Math.round((data.completed_steps / data.total_steps) * 100) : 0;

  const head = el('div', { class: 'dcp-pw-detail-head' }, [
    isBundle ? boltChip('باندل شروع') : null,
    el('h2', { class: 'dcp-pw-detail-title' }, data.title_fa),
    el('p', { class: 'dcp-sec-hint' }, data.description_fa),
    isBundle ? prereqCard(data.prereq_bundle) : null,
  ]);

  const progressWrap = el('div', { class: 'dcp-pw-detail-progress' }, [
    progressBar(data.completed_steps, data.total_steps),
    el('div', { class: 'dcp-pw-detail-meta' }, [
      el('span', {}, data.is_complete
        ? 'این مسیر را کامل کرده‌اید 🎉'
        : (faNum(data.completed_steps) + ' از ' + faNum(data.total_steps) + (isBundle ? ' قدم ' : ' مرحله ') + '(٪' + faNum(pct) + ')')),
      milestoneCount ? el('span', {}, '🏁 ' + faNum(milestoneCount) + ' نقطه‌عطف') : null,
    ]),
  ]);

  const steps = el('div', { class: 'dcp-pw-steps' },
    data.steps.map((s, i) => stepRow(s, i, data.current_step, data)));

  const examSlot = isBundle ? null : el('div', { class: 'dcp-pw-exam-slot' });
  container.replaceChildren(...[
    head, progressWrap, enrollArea(data.id, data.enrolled), examSlot, steps,
    isBundle ? continueCard(data.continues_pathway) : null,
  ].filter(Boolean));
  if (examSlot) mountExamCard(examSlot, data.id);
}
