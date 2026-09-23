// Learning pathways (Phase 3, spec sections 5 + 8): curated, cross-pillar
// learning journeys. Progress is entirely DERIVED server-side from the user's
// own highlights/reading (plus-api/src/pathways.ts) — there is no "mark step
// complete" button here. "شروع مسیر" only starts the API tracking a
// current_step cache so GET /me can headline it on the dashboard; browsing a
// pathway before that still shows real credit for content already consumed.
import { el, faNum, icon } from './util.js?v=140';
import { api } from './api.js?v=140';
import { FOLDER_EN } from './content-index.js?v=140';
import { markReturnTrail } from './return-trail.js?v=140';
import { openSheet, closeSheet } from './sheet.js?v=140';
import { certificateTerms } from './certificate-terms.js?v=140';

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

/**
 * A full pathway's certificate chip, in the catalog card's foot.
 *
 * The catalog was the top of the funnel and said neither «گواهی» nor «آزمون»
 * anywhere, so a reader who never opened a pathway page had no way to learn
 * that finishing one is worth anything. Four states and no numbers — a count
 * of remaining steps here would be stale by the next publish.
 *
 * Certificate GREEN, never amber: amber means «this is what a subscription
 * buys» and this whole page is already behind the subscription, so a gold chip
 * would say nothing here while colliding with the badge wall's metals. Where a
 * free reader can see a certificate (the profile wall), premium is said in
 * words instead.
 */
function certChip(p) {
  if (p.kind === 'bundle') return null;
  if (p.certifiable === false) return el('span', { class: 'dcp-pw-chip is-soon' }, '🎓 گواهی‌نامه: به‌زودی');
  if (p.certificate_held) return el('span', { class: 'dcp-pw-chip is-held' }, '🎓 گواهی‌نامه‌اش را داری ✓');
  if (p.certificate_intent === 'wanted') return el('span', { class: 'dcp-pw-chip' }, '🎓 می‌خواهمش ✓');
  return el('span', { class: 'dcp-pw-chip' }, '🎓 گواهی‌نامه');
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
    // Its own line rather than a third item in the foot: three chips in a
    // ~300px card is exactly the crowding the action row was tidied out of.
    certChip(p),
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

  const termsLink = el('button', { class: 'dcp-cs-terms', type: 'button', 'data-cert-terms-btn': '' }, 'شرایط گواهی‌نامه');
  termsLink.addEventListener('click', () => openSheet(certificateTerms(null)));

  const top = el('div', { class: 'dcp-pw-top' }, [
    el('h2', { class: 'dcp-pw-heading' }, 'مسیرهای یادگیری'),
    el('p', { class: 'dcp-sec-hint' }, [
      'هر مسیر مجموعه‌ای از مقاله‌ها، اپیزودها و ویدیوهاست که به ترتیبِ منطقیِ یادگیری چیده شده؛ یک مطلب می‌تواند در چند مسیر مختلف هم باشد. با خواندن، گوش‌دادن یا هایلایت‌کردن، پیشرفتِ هر مسیر خودش جلو می‌رود. ',
      el('b', {}, 'مسیرهای کامل در پایان، آزمون و گواهی‌نامه دارند'),
      ' — ', termsLink,
    ]),
  ]);

  const sections = [top];

  // Bundles as one compact amber band with a horizontal rail — the same
  // small, contained strip they are on the homepage, never a stack of ten
  // full-width cards pushing the real catalog below the fold («یه جای مشخص
  // کوچیک، نه وسط بازار» — founder, 2026-08-09).
  if (bundles.length) {
    // id: the direct link's landing («همه‌ی باندل‌ها ›» on the premium tab and the homepage).
    sections.push(el('div', { class: 'dcb-band', id: 'bundles' }, [
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

  // A #bundles arrival: the band renders after load, so the browser's own hash

  // scroll has already missed it.

  if (location.hash === '#bundles') {

    const band = container.querySelector('#bundles');

    if (band && band.scrollIntoView) band.scrollIntoView({ block: 'start' });

  }
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

/* ---------------------------------------------- the certificate strip -- */

/**
 * One strip under the progress bar, and it never leaves.
 *
 * Until 1405/06/29 this area was two independent things: `examCard`, which
 * said where the exam stood, and `intentRow`, the «گواهی می‌خواهی؟» question,
 * which returned null the moment it had an answer — including «فعلاً نه». So
 * the answer was final in the UI although `setCertificateIntent` would
 * happily rewrite it, the pathway page acknowledged nothing (the dashboard's
 * copy of the same component did), and the terms of the thing being wished
 * for were unreachable on any pathway whose exam form had not been written.
 *
 * Now: one component, three tones, and the answer is a STATE rather than a
 * spent question — always shown, always changeable.
 *
 *   قدم صفر  → news, not a question. A wish declared before reading anything
 *              is cheap, so the strip tells the reader a certificate exists
 *              and offers «می‌خواهمش»; it does not interrogate them.
 *   وسط مسیر → the question, plainly.
 *   آزمون باز → the CTA takes over and the question disappears: starting an
 *              attempt records the intent by itself (services/pathway-exams.ts
 *              startAttempt), so asking there would be asking for something
 *              the next tap already says.
 *
 * NO NUMBERS anywhere in here (founder, 1405/06/29). Publishing step 5.6 files
 * new content into existing pathways, so «۳۹ قدم» and «۲۲ قدم مانده» are both
 * true only until the next publish. The strip says where you are in words; the
 * exam page states its own form's rules, which are true by construction.
 */

const STRIP = {
  pending: ['گواهی‌نامهٔ این مسیر هنوز باز نشده',
    'این مسیر هنوز کامل نیست؛ با آمدنِ آخرین قسمت، آزمون و گواهی‌نامه‌اش باز می‌شود.', null],
  no_form: ['آزمون پایانی و گواهی‌نامه',
    'سؤال‌های این مسیر هنوز آماده نشده‌اند. اگر گواهی‌اش را بخواهی، همان روزی که باز شود در «اطلاعیه» خبرت می‌کنیم.', null],
  locked: ['آزمون پایانی و گواهی‌نامه',
    'وقتی همهٔ قدم‌های مسیر خوانده شد، آزمون این‌جا باز می‌شود؛ با قبولی، گواهی‌نامه به نام خودت صادر می‌شود.', null],
  ready: ['آزمون این مسیر برایت باز است',
    'هر وقت آماده بودی شروع کن؛ با قبولی، گواهی‌نامه به نام خودت صادر می‌شود.', 'رفتن به آزمون'],
  open: ['یک آزمون نیمه‌کاره داری', 'سؤال‌ها همان‌هایی‌اند که دیده‌ای؛ برگرد و ارسال کن.', 'ادامهٔ آزمون'],
  queued: ['پاسخ‌هایت در حال بررسی است', 'نتیجه در «اطلاعیه» می‌آید.', 'دیدن وضعیت'],
  wait: ['این بار به نصاب نرسید', 'تلاش بعدی به‌زودی باز می‌شود — تاریخش در صفحهٔ آزمون.', 'دیدن نتیجه'],
  exhausted: ['تلاش‌های آزمون تمام شد', 'نتیجه در صفحهٔ آزمون است.', 'دیدن نتیجه'],
  passed: ['گواهی‌نامهٔ این مسیر را داری 🎓', 'از پروفایلت قابل دانلود است.', 'دیدن گواهی'],
};

/** Nothing has been read yet — the strip informs instead of asking. */
const NOT_STARTED = ['این مسیر گواهی‌نامه دارد',
  'با خواندن همهٔ قدم‌ها، آزمون پایانی باز می‌شود و با قبولی، گواهی‌نامه به نام خودت صادر می‌شود.', null];

/**
 * Enrolment is the one door the reader opens themselves.
 *
 * Written as two whole sentences, deliberately: the first draft was three
 * subjectless fragments joined by a dash («برای کسی است که مسیر را شروع
 * کرده — دکمهٔ «شروع این مسیر» بالا. خوانده‌هایت به حساب می‌آید.»), which
 * reads like a machine listing conditions rather than a person explaining
 * one (founder, 1405/06/29). The order is the argument: who the exam is
 * for, what to press, and then the reassurance that starting late costs
 * nothing — that last one is the actual worry, so it ends the sentence
 * instead of trailing off it.
 */
const NOT_ENROLLED = ['آزمون پایانی و گواهی‌نامه',
  'آزمون پایانی و گواهی‌نامهٔ این مسیر برای کسانی است که مسیر را شروع کرده‌اند. '
  + 'با دکمهٔ «شروع این مسیر» در بالای صفحه ثبت‌نام کن؛ هر چه تا حالا از این مسیر '
  + 'خوانده‌ای، از همان لحظه در پیشرفتت حساب می‌شود.', null];

/** Once an attempt exists, acting has answered the question. */
const ANSWERED_BY_ACTING = ['ready', 'open', 'queued', 'wait', 'exhausted', 'passed'];

/**
 * «الان آزمون بدهیم؟» — the one question in front of the exam door
 * (founder, 2026-09-20).
 *
 * The CTA used to be a bare link, and a reader who tapped it to see what was
 * behind it landed on a page whose first button draws the questions. Nothing
 * was actually lost by looking — the attempt opens on «شروع آزمون», not on
 * arrival — but nobody could know that from this side, so the tap read as
 * irreversible and the safest move was not to tap at all.
 *
 * So the sheet's job is NOT to warn. It is to say the one thing that makes
 * «بله» safe and «الان نه» free: going there starts nothing, and nothing is
 * recorded either way. «الان نه» closes the sheet and leaves the reader
 * exactly where they were, with the same card and the same button.
 *
 * NO NUMBERS, deliberately, like everything else on this page: «۱۵ سؤال ·
 * نصاب ۷۰٪» belongs to the form and is printed by the exam page, which reads
 * it from the form the reader is about to sit. A count quoted here would be
 * a promise this page cannot keep.
 */
function examAskCard(titleFa, href) {
  const go = el('a', { class: 'dcp-btn dcp-btn-primary', href, 'data-exam-go': '' }, 'بله، برویم');
  const stay = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', 'data-exam-stay': '' }, 'الان نه');
  stay.addEventListener('click', () => closeSheet());
  return el('div', { class: 'dcp-cert-card', 'data-exam-ask': '' }, [
    el('div', { class: 'dcp-cert-card-kicker' }, 'آزمون پایانی مسیر'),
    el('b', {}, titleFa ? `الان آزمون «${titleFa}» را بدهیم؟` : 'الان آزمون بدهیم؟'),
    el('p', { class: 'dcp-muted' },
      'سؤال‌ها روی یک صفحه‌اند و یک بار ارسال می‌شوند، پس بهتر است وقتِ بی‌وقفه داشته باشی.'),
    el('p', { class: 'dcp-muted' },
      'رفتن به صفحهٔ آزمون چیزی را شروع نمی‌کند — قرعهٔ سؤال‌ها و شمارشِ تلاش با دکمهٔ «شروع آزمون» '
      + 'در همان صفحه اتفاق می‌افتد، و قواعدِ کاملِ این آزمون هم آن‌جا نوشته است.'),
    el('div', { class: 'dcp-exam-ask-acts' }, [go, stay]),
  ]);
}

function termsBtn(titleFa) {
  const b = el('button', { class: 'dcp-cs-terms', type: 'button', 'data-cert-terms-btn': '' }, 'شرایط ›');
  b.addEventListener('click', () => openSheet(certificateTerms(titleFa)));
  return b;
}

/**
 * The reader's own answer, as a row that is always present once there is
 * something to show. Three shapes: the question, «می‌خواهی» + تغییر, and
 * «نمی‌خواهی» + نظرم عوض شد.
 */
export function intentRow(state, onIntent, opts = {}) {
  // Nothing to wish for while the pathway's series is unfinished
  // (`certificate: 'pending'` — the API refuses the answer anyway), and
  // nothing to ask once the exam itself is the next step.
  if (state.state === 'pending' || state.certifiable === false) return null;
  if (ANSWERED_BY_ACTING.includes(state.state)) return null;

  const started = opts.started !== false;
  const row = el('div', { class: 'dcp-pw-intent', 'data-pw-intent-row': '' });
  const msg = el('span', { class: 'dcp-muted' });
  let editing = false;

  const send = async (intent, buttons) => {
    buttons.forEach((b) => { b.disabled = true; });
    msg.textContent = 'ثبت…';
    try {
      const next = await api.examIntent(state.pathway_id, intent);
      editing = false;
      if (onIntent) onIntent(next);
      else draw({ ...state, certificate_intent: intent });
    } catch (_) {
      buttons.forEach((b) => { b.disabled = false; });
      msg.textContent = 'ثبت نشد.';
    }
  };

  function ask() {
    const yes = el('button', { class: 'dcp-btn dcp-btn-sm dcp-btn-cert', type: 'button', 'data-pw-intent': 'wanted' },
      started ? 'بله، می‌خواهم' : 'می‌خواهمش');
    const no = el('button', { class: 'dcp-btn dcp-btn-sm dcp-btn-ghost', type: 'button', 'data-pw-intent': 'declined' }, 'فعلاً نه');
    yes.addEventListener('click', () => send('wanted', [yes, no]));
    no.addEventListener('click', () => send('declined', [yes, no]));
    const parts = [
      started ? el('span', { class: 'dcp-cs-grow' }, 'گواهی‌نامهٔ این مسیر را می‌خواهی؟') : el('span', { class: 'dcp-cs-grow' }),
      yes, no,
    ];
    if (editing) {
      const cancel = el('button', { class: 'dcp-cs-terms', type: 'button' }, 'بی‌خیال');
      cancel.addEventListener('click', () => { editing = false; draw(state); });
      parts.push(cancel);
    }
    parts.push(msg);
    return parts;
  }

  function answered(intent, s) {
    const wanted = intent === 'wanted';
    const chg = el('button', { class: 'dcp-btn dcp-btn-sm dcp-btn-ghost', type: 'button', 'data-pw-intent-change': '' },
      wanted ? 'تغییر' : 'نظرم عوض شد');
    chg.addEventListener('click', () => { editing = true; draw(s); });
    const parts = [
      el('span', { class: 'dcp-cs-state dcp-cs-grow ' + (wanted ? 'is-on' : 'is-off') },
        wanted ? '✓ گواهی‌نامه را می‌خواهی' : 'فعلاً گواهی نمی‌خواهی'),
      chg,
    ];
    if (wanted) {
      // What the «بله» actually buys the reader — and it is now true: a form
      // written for this pathway notifies everyone who asked for it
      // (services/pathway-exams.ts notifyAssigneesOfNewForm).
      parts.push(el('span', { class: 'dcp-cs-echo' }, s.rules
        ? 'ثبت شد — نزدیک پایانِ مسیر، آزمون برایت باز می‌شود.'
        : 'ثبت شد — همان روزی که آزمونِ این مسیر باز شود، در «اطلاعیه» خبرت می‌کنیم.'));
    }
    return parts;
  }

  function draw(s) {
    msg.textContent = '';
    row.replaceChildren(...((s.certificate_intent && !editing) ? answered(s.certificate_intent, s) : ask()));
  }

  draw(state);
  return row;
}

/**
 * The strip: what a certificate is, where this reader stands, and their own
 * answer. Full pathways only — a bundle is 5–8 steps and is not
 * certificate-sized. Drawn lazily and dropped silently when the API cannot
 * answer: a pathway page must never fail to render because the exam service
 * did.
 */
export function certificateStrip(state, onIntent, opts = {}) {
  const started = opts.started !== false;
  let line = STRIP[state.state] || STRIP.no_form;
  if (state.state === 'locked' || state.state === 'no_form') {
    if (state.enrolled === false) line = NOT_ENROLLED;
    else if (!started) line = NOT_STARTED;
  }
  const held = state.state === 'passed';
  const href = held && state.certificate
    ? state.certificate.verify_url
    : '/plus/exam.html?id=' + encodeURIComponent(state.pathway_id);

  return el('div', {
    class: 'dcp-card dcp-cs ' + state.state + (held ? ' is-held' : ''),
    'data-pw-exam': state.state,
  }, [
    el('div', { class: 'dcp-cs-top' }, [
      el('span', { class: 'dcp-cs-ico', 'aria-hidden': 'true' }, held ? '✓' : '🎓'),
      el('span', { class: 'dcp-cs-h' }, [el('b', {}, line[0]), el('p', { class: 'dcp-muted' }, line[1])]),
      held ? null : termsBtn(state.pathway_title_fa),
    ].filter(Boolean)),
    line[2] ? el('div', { class: 'dcp-cs-cta' }, [cta(state, href, line[2])]) : null,
    intentRow(state, onIntent, { started }),
  ].filter(Boolean));
}

/**
 * The strip's one button. At `ready` — and only there — it asks first: that
 * is the single state where the next page can begin something. «ادامهٔ آزمون»
 * goes straight through (the attempt is already open, the questions already
 * drawn), and so does every state that only shows a result.
 */
function cta(state, href, label) {
  const primary = state.state === 'ready' || state.state === 'open';
  const cls = 'dcp-btn ' + (primary ? 'dcp-btn-primary' : 'dcp-btn-ghost');
  if (state.state !== 'ready') return el('a', { class: cls, href }, label);
  const b = el('button', { class: cls, type: 'button', 'data-exam-cta': '' }, label);
  b.addEventListener('click', () => openSheet(examAskCard(state.pathway_title_fa, href)));
  return b;
}

/** Kept for callers that still say «exam card»; it is the same strip. */
export const examCard = certificateStrip;

async function mountExamCard(slot, id, started) {
  if (typeof api.exam !== 'function') return;
  const draw = (state) => {
    if (state && state.state) slot.replaceChildren(certificateStrip(state, draw, { started }));
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

  // Plus 2.0 skin: the hero's ring reads the same percent as the meta line.
  const progressWrap = el('div', { class: 'dcp-pw-detail-progress', style: '--p:' + pct }, [
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
  if (examSlot) mountExamCard(examSlot, data.id, data.completed_steps > 0);
}
