// @vitest-environment jsdom
// Drives the REAL shipped exam page module (/plus/js/exam-page.js) with a
// mocked API. The page computes nothing about eligibility — it draws the
// state the API answers with — so what is pinned here is that every state
// has a face, the sheet refuses an incomplete submit locally (marking the
// question, never spending the attempt), a draft survives a re-render, and
// the key never reaches the DOM.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let examImpl: () => Promise<unknown>;
let startImpl: (name: string) => Promise<unknown>;
let submitImpl: (answers: Record<string, unknown>) => Promise<unknown>;
let enrolled = false;
class ApiError extends Error { status: number; body: unknown; constructor(s: number, d: unknown) { super('api'); this.status = s; this.body = d; } }

vi.mock('/plus/js/api.js', () => ({
  ApiError,
  api: {
    enrollPathway: () => { enrolled = true; return Promise.resolve({}); },
    exam: () => examImpl(),
    examStart: (_id: string, name: string) => startImpl(name),
    examSubmit: (_id: string, answers: Record<string, unknown>) => submitImpl(answers),
  },
  currentUser: () => Promise.resolve(null),
  meStatus: () => 'ok',
}));
vi.mock('/plus/js/pwa.js', () => ({ registerSW: () => {} }));
vi.mock('/plus/js/premium-cta.js', () => ({
  premiumCta: () => document.createElement('div'), lapsedNote: () => '', guestPremiumExtras: () => [], unreachableGate: () => {},
}));
vi.mock('/plus/js/login-modal.js', () => ({ openLoginModal: () => Promise.resolve(null) }));

const RULES = { question_count: 3, mcq_count: 2, free_count: 1, pass_percent: 70, max_attempts: 2, retry_days: 7, min_answer_chars: 20 };
const BASE = {
  ok: true, pathway_id: 'digital', pathway_title_fa: 'دندانپزشکی دیجیتال', rules: RULES,
  attempts_used: 0, is_complete: true, assigned: false, enrolled: true, retry_at: null, open: null, history: [], certificate: null,
};
const OPEN = {
  ...BASE, state: 'open',
  open: {
    id: 'att-1', reference: 'E-ABC-DEF', holder_name: 'دکتر ن.', started_at: '2026-09-12T10:00:00Z',
    questions: [
      { id: 'm1', kind: 'mcq', prompt_fa: 'سؤال یک؟', options: ['الف', 'ب', 'ج', 'د'] },
      { id: 'm2', kind: 'mcq', prompt_fa: 'سؤال دو؟', options: ['الف', 'ب'] },
      { id: 'f1', kind: 'free', prompt_fa: 'چرا؟', point_count: 3 },
    ],
  },
};
const FAILED = {
  id: 'att-1', attempt_no: 1, reference: 'E-ABC-DEF', status: 'failed', submitted_at: '2026-09-12T10:00:00Z', settled_at: '2026-09-12T10:00:05Z',
  mcq_correct: 1, mcq_total: 2, free_covered: 1, free_total: 3, mcq_percent: 50, free_percent: 33, passed: false,
  per_question: [{ id: 'm1', kind: 'mcq', correct: true }, { id: 'm2', kind: 'mcq', correct: false }, { id: 'f1', kind: 'free', covered: 1, total: 3 }],
};

const settle = () => new Promise((r) => setTimeout(r, 0));
const LONG = 'این یک پاسخ تشریحی به اندازهٔ کافی بلند است که از حداقل عبور کند.';

async function mount(state: unknown) {
  document.body.innerHTML = '<div id="test-root"></div>';
  if (state !== null) examImpl = () => Promise.resolve(state);
  const mod = await import('/plus/js/exam-page.js');
  await mod.renderExam(document.getElementById('test-root')!, 'digital');
  await settle();
  return mod;
}

const stateEl = () => document.querySelector('[data-exam-state]') as HTMLElement | null;
const root = () => document.getElementById('test-root')!;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  startImpl = () => Promise.resolve(OPEN);
  submitImpl = () => Promise.resolve({ ...BASE, state: 'wait', retry_at: '2026-09-19T10:00:00Z', attempts_used: 1, history: [FAILED] });
});

describe('every state has a face', () => {
  it('no_form, locked (with the contract), queued, wait, exhausted, passed', async () => {
    await mount({ ...BASE, state: 'no_form', rules: null });
    expect(stateEl()!.dataset.examState).toBe('no_form');
    expect(root().textContent).toContain('هنوز آماده نشده');

    await mount({ ...BASE, state: 'locked', is_complete: false });
    expect(stateEl()!.dataset.examState).toBe('locked');
    expect(root().querySelector('[data-exam-contract]')!.textContent).toContain('٪۷۰');
    expect(root().querySelector('[data-exam-contract]')!.textContent).toContain('۳ سؤال —');

    await mount({ ...BASE, state: 'queued', history: [{ ...FAILED, status: 'queued', passed: null, per_question: null, mcq_correct: null }] });
    expect(stateEl()!.dataset.examState).toBe('queued');
    expect(root().textContent).toContain('E-ABC-DEF');

    await mount({ ...BASE, state: 'wait', retry_at: '2026-09-19T10:00:00Z', attempts_used: 1, history: [FAILED] });
    expect(stateEl()!.dataset.examState).toBe('wait');
    expect(root().textContent).toContain('تلاش بعدی از');
    // the tally: counts, never the key
    const result = root().querySelector('[data-exam-attempt="1"]')!;
    expect(result.textContent).toContain('۱ از ۲');
    expect(result.textContent).toContain('۱ نکته از ۳');
    expect(result.textContent).toContain('❌');

    await mount({ ...BASE, state: 'exhausted', attempts_used: 2, history: [FAILED, { ...FAILED, attempt_no: 2 }] });
    expect(stateEl()!.dataset.examState).toBe('exhausted');
    expect(root().querySelectorAll('[data-exam-attempt]')).toHaveLength(2);

    await mount({ ...BASE, state: 'passed', certificate: { verify_code: 'DC-K4M-7QA', verify_url: '/plus/certificate.html?c=DC-K4M-7QA' } });
    expect(stateEl()!.dataset.examState).toBe('passed');
    expect(root().querySelector('a[href="/plus/certificate.html?c=DC-K4M-7QA"]')).not.toBeNull();
  });

  it('locked because not enrolled offers «شروع این مسیر» right there, and re-reads after it', async () => {
    enrolled = false;
    examImpl = () => Promise.resolve(enrolled ? { ...BASE, state: 'ready' } : { ...BASE, state: 'locked', enrolled: false });
    await mount(null);
    expect(stateEl()!.dataset.examEnrolled).toBe('no');
    expect(root().textContent).toContain('همین حالا هم همه‌اش را خوانده‌ای');
    (document.getElementById('examEnroll') as HTMLButtonElement).click();
    await settle(); await settle(); await settle();
    expect(stateEl()!.dataset.examState).toBe('ready');
  });

  it('a pass whose certificate was revoked never claims one exists', async () => {
    await mount({ ...BASE, state: 'passed', certificate: null });
    expect(stateEl()!.dataset.examState).toBe('passed');
    expect(root().textContent).toContain('آزمون این مسیر را گذرانده‌ای');
    expect(root().textContent).not.toContain('صادر شده');
    expect(root().querySelector('a[href="/plus/support.html"]')).not.toBeNull();
  });

  it('a dead API is its own state, never a verdict', async () => {
    document.body.innerHTML = '<div id="test-root"></div>';
    examImpl = () => Promise.reject(new TypeError('Failed to fetch'));
    const mod = await import('/plus/js/exam-page.js');
    await mod.renderExam(root(), 'digital');
    await settle();
    expect(stateEl()!.dataset.examState).toBe('unreachable');
  });
});

describe('the contract names the total, never the mix', () => {
  const rulesOf = async (rules: Record<string, number>) => {
    await mount({ ...BASE, state: 'locked', rules: { ...RULES, ...rules } });
    return root().querySelector('[data-exam-contract]')!.textContent || '';
  };

  it('never prints a per-kind count, whatever the pool is made of', async () => {
    for (const r of [
      { question_count: 15, mcq_count: 12, free_count: 3 },
      { question_count: 9, mcq_count: 9, free_count: 0 },
      { question_count: 4, mcq_count: 0, free_count: 4 },
      { question_count: 1, mcq_count: 1, free_count: 0 },
    ]) {
      const text = await rulesOf(r);
      expect(text).toContain(`سؤال —`);
      expect(text).not.toMatch(/سؤال تستی|سؤال تشریحی/);
    }
  });

  it('says «هر بخش جداگانه» only when there is more than one part', async () => {
    expect(await rulesOf({ question_count: 15, mcq_count: 12, free_count: 3 })).toContain('هر بخش جداگانه');
    expect(await rulesOf({ question_count: 9, mcq_count: 9, free_count: 0 })).not.toContain('هر بخش');
    expect(await rulesOf({ question_count: 4, mcq_count: 0, free_count: 4 })).not.toContain('هر بخش');
  });

  it('explains the model only when a free answer can actually be graded by it', async () => {
    expect(await rulesOf({ question_count: 4, mcq_count: 0, free_count: 4 })).toContain('هوش مصنوعی');
    expect(await rulesOf({ question_count: 9, mcq_count: 9, free_count: 0 })).not.toContain('هوش مصنوعی');
  });
});

describe('starting', () => {
  it('needs the holder name, confirms, then draws the open sheet', async () => {
    await mount({ ...BASE, state: 'ready' });
    const seen: string[] = [];
    startImpl = (name) => { seen.push(name); return Promise.resolve(OPEN); };
    (document.getElementById('examStart') as HTMLButtonElement).click();
    await settle();
    expect(seen).toEqual([]);
    expect(root().textContent).toContain('نامی که روی گواهی');

    (document.getElementById('examHolder') as HTMLInputElement).value = 'دکتر ن.';
    (document.getElementById('examStart') as HTMLButtonElement).click();
    await settle(); await settle();
    expect(seen).toEqual(['دکتر ن.']);
    expect(stateEl()!.dataset.examState).toBe('open');
    expect(root().querySelectorAll('[data-exam-q]')).toHaveLength(3);
  });

  it('a 409 from start draws the state the server handed back', async () => {
    await mount({ ...BASE, state: 'ready' });
    startImpl = () => Promise.reject(new ApiError(409, { ...BASE, state: 'wait', retry_at: '2026-09-19T10:00:00Z' }));
    (document.getElementById('examHolder') as HTMLInputElement).value = 'x';
    (document.getElementById('examStart') as HTMLButtonElement).click();
    await settle(); await settle();
    expect(stateEl()!.dataset.examState).toBe('wait');
  });
});

describe('the sheet', () => {
  it('shows every question with no key, refuses an incomplete submit locally, and submits the answers', async () => {
    await mount(OPEN);
    expect(root().innerHTML).not.toContain('correct');
    expect(root().innerHTML).not.toContain('key_points');
    const sent: Record<string, unknown>[] = [];
    submitImpl = (a) => { sent.push(a); return Promise.resolve({ ...BASE, state: 'passed', certificate: { verify_code: 'DC-1', verify_url: '/x' } }); };

    (document.getElementById('examSubmit') as HTMLButtonElement).click();
    await settle();
    expect(sent).toEqual([]);
    expect(root().querySelectorAll('.dcp-exam-q.is-missing')).toHaveLength(3);
    expect(root().textContent).toContain('۳ سؤال بی‌پاسخ');

    (root().querySelector('input[name="q-m1"][value="1"]') as HTMLInputElement).click();
    (root().querySelector('input[name="q-m2"][value="0"]') as HTMLInputElement).click();
    const ta = root().querySelector('textarea[data-q="f1"]') as HTMLTextAreaElement;
    ta.value = 'کوتاه'; ta.dispatchEvent(new Event('input'));
    (document.getElementById('examSubmit') as HTMLButtonElement).click();
    await settle();
    expect(sent).toEqual([]);
    expect(root().querySelectorAll('.dcp-exam-q.is-missing')).toHaveLength(1);
    expect((root().querySelector('.dcp-exam-q.is-missing') as HTMLElement).dataset.examQ).toBe('f1');

    ta.value = LONG; ta.dispatchEvent(new Event('input'));
    (document.getElementById('examSubmit') as HTMLButtonElement).click();
    await settle(); await settle();
    expect(sent).toEqual([{ m1: 1, m2: 0, f1: LONG }]);
    expect(stateEl()!.dataset.examState).toBe('passed');
    expect(localStorage.getItem('dcp-exam-draft:att-1')).toBeNull();
  });

  it('keeps a draft on this device and restores it on re-render', async () => {
    await mount(OPEN);
    (root().querySelector('input[name="q-m1"][value="2"]') as HTMLInputElement).click();
    const ta = root().querySelector('textarea[data-q="f1"]') as HTMLTextAreaElement;
    ta.value = 'نیمه‌کاره'; ta.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 350));
    expect(JSON.parse(localStorage.getItem('dcp-exam-draft:att-1')!)).toEqual({ m1: 2, f1: 'نیمه‌کاره' });

    await mount(OPEN);
    expect((root().querySelector('input[name="q-m1"][value="2"]') as HTMLInputElement).checked).toBe(true);
    expect((root().querySelector('textarea[data-q="f1"]') as HTMLTextAreaElement).value).toBe('نیمه‌کاره');
  });

  it('a server-side incomplete marks the questions it names, and a submit failure keeps the sheet', async () => {
    await mount(OPEN);
    (root().querySelector('input[name="q-m1"][value="1"]') as HTMLInputElement).click();
    (root().querySelector('input[name="q-m2"][value="0"]') as HTMLInputElement).click();
    const ta = root().querySelector('textarea[data-q="f1"]') as HTMLTextAreaElement;
    ta.value = LONG; ta.dispatchEvent(new Event('input'));
    submitImpl = () => Promise.reject(new ApiError(400, { error: 'incomplete', missing: ['m2'], message: 'ناقص' }));
    (document.getElementById('examSubmit') as HTMLButtonElement).click();
    await settle(); await settle();
    expect(stateEl()!.dataset.examState).toBe('open');
    expect((root().querySelector('.dcp-exam-q.is-missing') as HTMLElement).dataset.examQ).toBe('m2');

    submitImpl = () => Promise.reject(new TypeError('Failed to fetch'));
    (document.getElementById('examSubmit') as HTMLButtonElement).click();
    await settle(); await settle();
    expect(stateEl()!.dataset.examState).toBe('open');
    expect(root().textContent).toContain('ذخیره است');
    expect((document.getElementById('examSubmit') as HTMLButtonElement).disabled).toBe(false);
  });
});
