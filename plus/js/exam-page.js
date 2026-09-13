// /plus/exam.html?id=<pathway> — the reader's side of آزمون مسیر.
//
// One page, one call (`GET /exams/:id`), and the page draws whatever STATE
// the API answers with. It computes nothing about eligibility, attempts or
// dates itself: services/pathway-exams.ts examState is the single source, so
// the page can never disagree with the server about whether «شروع» is
// allowed — it only asks, and shows what it was told.
//
// The states, in the order a reader meets them:
//   no_form    → nothing to sit yet; back to the pathway
//   locked     → finish the pathway (or be let in) first
//   ready      → the contract (what the exam is, how it is passed, how many
//                tries) + the name the certificate will carry → «شروع»
//   open       → the questions, all on one sheet, one submit. Answers are
//                drafted to localStorage per attempt so a closed tab costs
//                nothing; a refused submit (a question skipped) marks the
//                question, never spends the attempt.
//   queued     → submitted, the founder is reading it; the reference
//   wait       → not this time; when the next try opens, and the tally
//   exhausted  → not this time, and no tries left
//   passed     → the certificate
//
// The tally after a settled attempt shows COUNTS — which multiple-choice
// answers were right, how many key points each free answer covered — and
// never the key itself: the pool is small and the second attempt may draw
// the same question.
import { el, faNum, debounce } from './util.js?v=78';
import { api, ApiError, currentUser, meStatus } from './api.js?v=78';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js?v=78';
import { openLoginModal } from './login-modal.js?v=78';
import { registerSW } from './pwa.js?v=78';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });
const FA_DATETIME = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });
const when = (iso, withTime = false) => {
  try { return (withTime ? FA_DATETIME : FA_DATE).format(new Date(iso)); } catch (_) { return ''; }
};
const pathwayHref = (id) => '/plus/pathway.html?id=' + encodeURIComponent(id);
const DRAFT_KEY = (attemptId) => 'dcp-exam-draft:' + attemptId;

function readDraft(attemptId) {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY(attemptId)) || '{}') || {}; } catch (_) { return {}; }
}
function writeDraft(attemptId, answers) {
  try { localStorage.setItem(DRAFT_KEY(attemptId), JSON.stringify(answers)); } catch (_) { /* private mode */ }
}
function clearDraft(attemptId) {
  try { localStorage.removeItem(DRAFT_KEY(attemptId)); } catch (_) { /* ignore */ }
}

/* ------------------------------------------------------------- pieces -- */

function head(s, kicker) {
  return el('div', { class: 'dcp-pw-detail-head' }, [
    el('div', { class: 'dcp-cert-card-kicker' }, kicker || 'آزمون پایانی مسیر'),
    el('h2', { class: 'dcp-pw-detail-title' }, s.pathway_title_fa),
  ]);
}

/**
 * What the exam IS — said before the reader commits to it.
 *
 * It names the TOTAL and never the mix (founder, 2026-09-13): the pool is
 * whatever he pasted, in whatever proportion, and a sentence like «۱۲ تستی و
 * ۳ تشریحی» is a promise about a shape he has not committed to — one that
 * would have to be re-read every time he changes how he asks. The threshold
 * sentence says «هر بخش جداگانه» without naming which parts exist, so it stays
 * true for an all-multiple-choice form, an all-free-text one, and anything
 * added later.
 */
export function contract(rules, s) {
  const items = [];
  const total = rules.question_count || (rules.mcq_count + rules.free_count);
  const parts = (rules.mcq_count ? 1 : 0) + (rules.free_count ? 1 : 0);
  items.push(faNum(total) + ' سؤال — همه روی یک صفحه، یک بار ارسال.');
  items.push('نصاب قبولی ٪' + faNum(rules.pass_percent)
    + (parts > 1 ? ' — و هر بخش جداگانه حساب می‌شود.' : '.'));
  if (rules.free_count) {
    items.push('پاسخ تشریحی را هوش مصنوعی روی نکته‌های کلیدی می‌سنجد و در موارد مبهم، دکتر شهابیان خودش می‌خواند؛ نتیجه در «اطلاعیه» می‌آید.');
  }
  items.push(faNum(rules.max_attempts) + ' تلاش'
    + (rules.retry_days ? ' با فاصلهٔ دست‌کم ' + faNum(rules.retry_days) + ' روز' : '')
    + (s.attempts_used ? ' — ' + faNum(s.attempts_used) + ' تلاش استفاده شده' : '') + '.');
  items.push('با قبولی، گواهی‌نامهٔ تکمیل مسیر با کد یکتا و صفحهٔ تأیید عمومی به نام خودت صادر می‌شود، به‌علاوهٔ ٪۱۰ تخفیف خرید بعدی.');
  return el('ul', { class: 'dcp-exam-contract', 'data-exam-contract': '' }, items.map((t) => el('li', {}, t)));
}

function startCard(s, root, id) {
  const input = el('input', {
    id: 'examHolder', class: 'dcp-input', type: 'text', maxlength: '120',
    placeholder: 'مثلاً دکتر مهسا رضایی', autocomplete: 'name', 'aria-label': 'نام روی گواهی',
  });
  const msg = el('p', { class: 'dcp-muted dcp-exam-msg', 'aria-live': 'polite' });
  const btn = el('button', { id: 'examStart', class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'شروع آزمون');
  btn.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) { msg.textContent = 'نامی که روی گواهی چاپ می‌شود را بنویس.'; input.focus(); return; }
    if (!confirm('آزمون شروع شود؟ سؤال‌ها همین حالا برایت قرعه می‌خورند و تا ارسال، همین‌ها می‌مانند.')) return;
    btn.disabled = true; msg.textContent = 'در حال آماده‌سازی…';
    try {
      const next = await api.examStart(id, name);
      renderState(root, id, next);
    } catch (e) {
      btn.disabled = false;
      // 409 = the server says not now; it hands the state back — draw that.
      if (e instanceof ApiError && e.status === 409 && e.body && e.body.state) { renderState(root, id, e.body); return; }
      msg.textContent = (e && e.body && e.body.message) || 'شروع نشد. دوباره تلاش کن.';
    }
  });
  return el('div', { class: 'dcp-card dcp-exam-card', 'data-exam-state': 'ready' }, [
    el('b', {}, 'پیش از شروع'),
    contract(s.rules, s),
    el('label', { class: 'dcp-exam-label', for: 'examHolder' }, 'نامی که روی گواهی چاپ می‌شود'),
    input,
    el('p', { class: 'dcp-muted' }, 'همان‌طور که می‌خواهی روی گواهی و در صفحهٔ تأیید دیده شود. بعد از صدور تغییر نمی‌کند.'),
    btn, msg,
  ]);
}

function questionBlock(q, idx, draft, onChange) {
  const num = el('span', { class: 'dcp-exam-qnum' }, faNum(idx + 1));
  const kind = el('span', { class: 'dcp-pill' }, q.kind === 'mcq' ? 'تستی' : 'تشریحی');
  const prompt = el('p', { class: 'dcp-exam-prompt' }, q.prompt_fa);
  const body = [];
  if (q.kind === 'mcq') {
    body.push(el('div', { class: 'dcp-exam-options', role: 'radiogroup', 'aria-label': q.prompt_fa },
      q.options.map((opt, i) => {
        const r = el('input', { type: 'radio', name: 'q-' + q.id, value: String(i) });
        if (draft[q.id] === i) r.checked = true;
        r.addEventListener('change', () => onChange(q.id, i));
        return el('label', { class: 'dcp-exam-option' }, [r, el('span', {}, opt)]);
      })));
  } else {
    const ta = el('textarea', {
      class: 'dcp-input dcp-exam-ta', rows: '6', 'data-q': q.id,
      placeholder: 'پاسخت را با استدلال بنویس — ' + faNum(q.point_count) + ' نکتهٔ کلیدی سنجیده می‌شود.',
    });
    if (typeof draft[q.id] === 'string') ta.value = draft[q.id];
    const count = el('span', { class: 'dcp-muted dcp-exam-count' }, faNum(ta.value.length) + ' نویسه');
    ta.addEventListener('input', () => { count.textContent = faNum(ta.value.length) + ' نویسه'; onChange(q.id, ta.value); });
    body.push(ta, count);
  }
  return el('section', { class: 'dcp-exam-q', 'data-exam-q': q.id }, [
    el('div', { class: 'dcp-exam-qhd' }, [num, kind]),
    prompt, ...body,
    el('p', { class: 'dcp-exam-missing', hidden: '' }, 'این سؤال بی‌پاسخ است.'),
  ]);
}

function sheet(s, root, id) {
  const attempt = s.open;
  const answers = readDraft(attempt.id);
  const save = debounce(() => writeDraft(attempt.id, answers), 300);
  const onChange = (qid, v) => { answers[qid] = v; save(); };
  const minChars = (s.rules && s.rules.min_answer_chars) || 20;

  const msg = el('p', { class: 'dcp-muted dcp-exam-msg', 'aria-live': 'polite' });
  const btn = el('button', { id: 'examSubmit', class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ارسال پاسخ‌ها');
  const blocks = attempt.questions.map((q, i) => questionBlock(q, i, answers, onChange));

  const markMissing = (ids) => {
    for (const b of blocks) {
      const note = b.querySelector('.dcp-exam-missing');
      const miss = ids.includes(b.dataset.examQ);
      b.classList.toggle('is-missing', miss);
      if (miss) note.removeAttribute('hidden'); else note.setAttribute('hidden', '');
    }
    const first = blocks.find((b) => ids.includes(b.dataset.examQ));
    if (first && first.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const localCheck = () => attempt.questions
    .filter((q) => (q.kind === 'mcq' ? !Number.isInteger(answers[q.id]) : String(answers[q.id] || '').trim().length < minChars))
    .map((q) => q.id);

  btn.addEventListener('click', async () => {
    const missing = localCheck();
    if (missing.length) {
      markMissing(missing);
      msg.textContent = faNum(missing.length) + ' سؤال بی‌پاسخ (یا کوتاه‌تر از ' + faNum(minChars) + ' نویسه) دارد.';
      return;
    }
    if (!confirm('پاسخ‌ها ارسال شود؟ بعد از ارسال قابل تغییر نیست و این تلاش حساب می‌شود.')) return;
    btn.disabled = true; msg.textContent = 'در حال ارسال و تصحیح… (چند ثانیه)';
    try {
      const next = await api.examSubmit(id, answers);
      clearDraft(attempt.id);
      renderState(root, id, next);
    } catch (e) {
      btn.disabled = false;
      if (e instanceof ApiError && e.status === 400 && e.body && Array.isArray(e.body.missing)) {
        markMissing(e.body.missing);
        msg.textContent = e.body.message || 'همهٔ سؤال‌ها باید پاسخ داشته باشند.';
        return;
      }
      if (e instanceof ApiError && e.status === 429) { msg.textContent = 'کمی صبر کن و دوباره ارسال کن.'; return; }
      if (e instanceof ApiError && e.status === 409 && e.body && e.body.state) { renderState(root, id, e.body); return; }
      msg.textContent = 'ارسال نشد — پاسخ‌هایت روی همین دستگاه ذخیره است؛ دوباره تلاش کن.';
    }
  });

  return el('div', { class: 'dcp-exam-sheet', 'data-exam-state': 'open' }, [
    el('div', { class: 'dcp-card dcp-exam-card' }, [
      el('div', { class: 'dcp-exam-meta' }, [
        el('span', {}, faNum(attempt.questions.length) + ' سؤال'),
        el('span', {}, 'نصاب ٪' + faNum(s.rules.pass_percent)),
        el('span', { dir: 'ltr' }, attempt.reference),
      ]),
      el('p', { class: 'dcp-muted' },
        'همهٔ سؤال‌ها را پاسخ بده و یک بار ارسال کن. پاسخ‌هایت همین‌جا روی دستگاهت ذخیره می‌شود؛ اگر صفحه بسته شد، برگرد و ادامه بده.'),
    ]),
    ...blocks,
    el('div', { class: 'dcp-card dcp-exam-card' }, [btn, msg]),
  ]);
}

function resultCard(h, rules) {
  const rows = [];
  if (h.mcq_total) rows.push(el('div', { class: 'dcp-exam-score' }, [
    el('span', {}, 'تستی'), el('b', {}, faNum(h.mcq_correct) + ' از ' + faNum(h.mcq_total)),
    el('span', { class: 'dcp-pill' }, '٪' + faNum(h.mcq_percent)),
  ]));
  if (h.free_total) rows.push(el('div', { class: 'dcp-exam-score' }, [
    el('span', {}, 'تشریحی'), el('b', {}, faNum(h.free_covered) + ' نکته از ' + faNum(h.free_total)),
    el('span', { class: 'dcp-pill' }, '٪' + faNum(h.free_percent)),
  ]));
  const per = (h.per_question || []).map((p, i) => el('li', {}, p.kind === 'mcq'
    ? [(p.correct ? '✅' : '❌') + ' سؤال ' + faNum(i + 1) + ' (تستی)']
    : ['سؤال ' + faNum(i + 1) + ' (تشریحی): ' + faNum(p.covered) + ' از ' + faNum(p.total) + ' نکته']));
  const verdict = h.status === 'passed' ? 'قبول' : h.status === 'failed' ? 'به نصاب نرسید' : 'در انتظار بررسی';
  return el('div', { class: 'dcp-card dcp-exam-card dcp-exam-result ' + h.status, 'data-exam-attempt': String(h.attempt_no) }, [
    el('div', { class: 'dcp-exam-qhd' }, [
      el('b', {}, 'تلاش ' + faNum(h.attempt_no)),
      el('span', { class: 'dcp-pill' }, verdict),
      h.submitted_at ? el('span', { class: 'dcp-muted' }, when(h.submitted_at, true)) : null,
    ].filter(Boolean)),
    ...rows,
    per.length ? el('ul', { class: 'dcp-exam-per' }, per) : null,
    rules && h.status === 'failed' ? el('p', { class: 'dcp-muted' }, 'نصاب ٪' + faNum(rules.pass_percent) + ' در هر بخش.') : null,
  ].filter(Boolean));
}

function history(s) {
  const done = (s.history || []).filter((h) => h.status !== 'queued');
  if (!done.length) return null;
  return el('div', { class: 'dcp-exam-history' }, [
    el('h3', { class: 'dcp-sec-title' }, 'نتیجه'),
    ...done.slice().reverse().map((h) => resultCard(h, s.rules)),
  ]);
}

function simpleCard(state, title, text, actions = []) {
  return el('div', { class: 'dcp-card dcp-exam-card', 'data-exam-state': state }, [
    el('b', {}, title),
    el('p', { class: 'dcp-cert-card-lead' }, text),
    actions.length ? el('div', { class: 'dcp-cert-actions' }, actions) : null,
  ].filter(Boolean));
}

const backBtn = (id) => el('a', { class: 'dcp-btn dcp-btn-ghost', href: pathwayHref(id) }, 'رفتن به مسیر');

/**
 * Not enrolled: the one door the reader can open themselves, right here.
 * Progress is derived, so a reader who finished before pressing «شروع این
 * مسیر» loses nothing — the button is the deliberate act, not a restart.
 */
function enrollCard(s, root, id) {
  const msg = el('p', { class: 'dcp-muted dcp-exam-msg', 'aria-live': 'polite' });
  const btn = el('button', { id: 'examEnroll', class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'شروع این مسیر');
  btn.addEventListener('click', async () => {
    btn.disabled = true; msg.textContent = 'در حال ثبت…';
    try {
      await api.enrollPathway(id);
      await renderExam(root, id);
    } catch (_) { btn.disabled = false; msg.textContent = 'ثبت نشد. دوباره تلاش کن.'; }
  });
  return el('div', { class: 'dcp-card dcp-exam-card', 'data-exam-state': 'locked', 'data-exam-enrolled': 'no' }, [
    el('b', {}, 'اول مسیر را شروع کن'),
    el('p', { class: 'dcp-cert-card-lead' },
      'آزمون برای کسی است که این مسیر را شروع کرده. با یک ضربه شروعش کن؛ هر چه تا حالا خوانده‌ای به حساب می‌آید'
      + (s.is_complete ? ' — و همین حالا هم همه‌اش را خوانده‌ای.' : '.')),
    el('div', { class: 'dcp-cert-actions' }, [btn, backBtn(id)]),
    msg,
  ]);
}

/* --------------------------------------------------------------- page -- */

/** Draw one state. Exported for the DOM test. */
export function renderState(root, id, s) {
  const back = document.getElementById('examBack');
  if (back) back.href = pathwayHref(id);
  const parts = [head(s)];

  switch (s.state) {
    case 'pending':
      parts.push(simpleCard('pending', 'گواهی‌نامهٔ این مسیر هنوز باز نشده',
        'این مسیر هنوز کامل نیست — بر سری‌ای ایستاده که هنوز تمام نشده. با آمدنِ آخرین قسمت، آزمون و گواهی‌نامه‌اش همین‌جا باز می‌شود.', [backBtn(id)]));
      break;
    case 'no_form':
      parts.push(simpleCard('no_form', 'آزمون این مسیر هنوز آماده نشده',
        'وقتی سؤال‌ها آماده شود، همین‌جا باز می‌شود و در «اطلاعیه» خبرش را می‌گیری.', [backBtn(id)]));
      break;
    case 'locked':
      parts.push(s.enrolled
        ? simpleCard('locked', 'اول مسیر را تا آخر بخوان',
          'آزمون پایانی وقتی باز می‌شود که همهٔ قدم‌های مسیر خوانده شده باشد. اگر نزدیک پایانی، ممکن است زودتر برایت باز شود.',
          [backBtn(id)])
        : enrollCard(s, root, id));
      parts.push(el('div', { class: 'dcp-card dcp-exam-card' }, [el('b', {}, 'آزمون چیست'), contract(s.rules, s)]));
      break;
    case 'ready':
      parts.push(startCard(s, root, id));
      break;
    case 'open':
      parts.push(sheet(s, root, id));
      break;
    case 'queued': {
      const q = (s.history || []).find((h) => h.status === 'queued');
      parts.push(simpleCard('queued', 'پاسخ‌هایت رسید',
        'بخش تشریحی را دکتر شهابیان خودش می‌خواند. نتیجه در «اطلاعیه» می‌آید'
        + (q ? ' — شمارهٔ پیگیری: ' + q.reference : '') + '.', [backBtn(id)]));
      break;
    }
    case 'wait':
      parts.push(simpleCard('wait', 'این بار به نصاب نرسید',
        'تلاش بعدی از ' + when(s.retry_at) + ' باز می‌شود. تا آن روز، قدم‌هایی از مسیر را که کمتر مطمئنی دوباره بخوان.',
        [backBtn(id)]));
      break;
    case 'exhausted':
      parts.push(simpleCard('exhausted', 'تلاش‌های این آزمون تمام شد',
        'به نصاب نرسید و تلاشی نمانده. اگر فکر می‌کنی جای بازبینی دارد، از پشتیبانی بپرس.',
        [backBtn(id), el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/support.html' }, 'پشتیبانی')]));
      break;
    case 'passed': {
      const c = s.certificate;
      // A certificate the founder revoked leaves a passed attempt behind, so
      // this card must not assert one exists: the pass is the reader's either
      // way, and telling them they hold a certificate they cannot open would
      // send them to the profile to look for nothing.
      parts.push(simpleCard('passed', 'قبول شدی 🎓', c
        ? 'گواهی‌نامهٔ تکمیل این مسیر به نامت صادر شده — کد ' + c.verify_code + '. از پروفایلت هم قابل دانلود است.'
        : 'آزمون این مسیر را گذرانده‌ای. گواهی‌نامه‌ای همین حالا به نامت فعال نیست؛ اگر باید باشد، از پشتیبانی بپرس.',
        [
          c ? el('a', { class: 'dcp-btn dcp-btn-primary', href: c.verify_url }, 'دیدن گواهی') : null,
          el('a', {
            class: 'dcp-btn' + (c ? ' dcp-btn-ghost' : ''),
            href: c ? '/plus/profile.html#certificates' : '/plus/support.html',
          }, c ? 'گواهی‌نامه‌ها در پروفایل' : 'پشتیبانی'),
        ].filter(Boolean)));
      break;
    }
    default:
      parts.push(simpleCard('unknown', 'وضعیت نامشخص', 'صفحه را دوباره باز کن.', [backBtn(id)]));
  }
  const hist = history(s);
  if (hist && s.state !== 'open') parts.push(hist);
  root.replaceChildren(el('div', { class: 'dcp-exam-page' }, parts));
}

/** Fetch and draw. Exported for the DOM test. */
export async function renderExam(root, id) {
  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری…'));
  try {
    const s = await api.exam(id);
    renderState(root, id, s);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      root.replaceChildren(el('div', { class: 'dcp-empty' }, [
        el('p', {}, 'این مسیر آزمون ندارد.'),
        el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/pathways.html' }, 'بازگشت به مسیرها'),
      ]));
      return;
    }
    root.replaceChildren(el('div', { class: 'dcp-empty', 'data-exam-state': 'unreachable' }, [
      el('p', {}, 'وضعیت آزمون خوانده نشد. کمی بعد دوباره امتحان کن.'),
      backBtn(id),
    ]));
  }
}

function gate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'آزمون مسیر و گواهی‌نامه، ویژه‌ی دنت‌کست پریمیوم است.'),
    premiumCta('gate-exam'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ].filter(Boolean)));
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    root.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'مسیری مشخص نشده.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/pathways.html' }, 'بازگشت به مسیرها'),
    ]));
    return;
  }
  const user = await currentUser();
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    const returnTo = '/plus/exam.html?id=' + encodeURIComponent(id);
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای آزمون مسیر وارد شوید.'), btn, ...guestPremiumExtras('guest-exam'),
    ]));
    return;
  }
  if (user.tier !== 'premium') { gate(root, user); return; }
  await renderExam(root, id);
}

// Boot only on the real page; the DOM test renders into its own root.
if (document.getElementById('dcp-root')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
}
