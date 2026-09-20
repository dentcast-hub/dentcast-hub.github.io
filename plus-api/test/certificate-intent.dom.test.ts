// @vitest-environment jsdom
// Drives the REAL shipped strip (/plus/js/pathways.js certificateStrip +
// intentRow) and the terms sheet behind it (/plus/js/certificate-terms.js).
//
// What this file is guarding, all of it a bug that shipped:
//   · the wish was a question that RETURNED NULL once answered — including
//     «فعلاً نه» — and nothing else called examIntent, so a reader's answer
//     was final in the UI while the server would happily rewrite it;
//   · answering on the pathway page acknowledged nothing;
//   · the terms of the thing being wished for were unreachable on any
//     pathway whose exam form had not been written yet — which is all of
//     them until the founder writes one;
//   · and NO NUMBER may appear in any of it: publishing step 5.6 files new
//     content into existing pathways, so a step count printed here is stale
//     by the next publish (founder, 1405/06/29).
import { describe, it, expect, beforeEach, vi } from 'vitest';

let intentCalls: Array<[string, string]> = [];
let nextIntent: (id: string, intent: string) => unknown;

vi.mock('/plus/js/api.js', () => ({
  api: {
    examIntent: (id: string, intent: string) => {
      intentCalls.push([id, intent]);
      return Promise.resolve(nextIntent(id, intent));
    },
  },
}));

const BASE = {
  state: 'locked',
  pathway_id: 'post-and-core',
  pathway_title_fa: 'پست و کور',
  rules: null,
  enrolled: true,
  is_complete: false,
  certificate_intent: null,
  certificate: null,
};

const settle = () => new Promise((r) => setTimeout(r, 0));

async function mount(state: Record<string, unknown>, opts: Record<string, unknown> = {}) {
  document.body.innerHTML = '<div id="root"></div>';
  const { certificateStrip } = await import('/plus/js/pathways.js');
  const root = document.getElementById('root')!;
  const draw = (s: Record<string, unknown>) => root.replaceChildren(certificateStrip(s, draw, opts));
  draw(state);
  return root;
}

const txt = () => document.getElementById('root')!.textContent!.replace(/\s+/g, ' ').trim();
const btn = (label: string) => Array.from(document.querySelectorAll('button'))
  .find((b) => b.textContent!.includes(label));
const sheet = () => document.querySelector('.dcp-sheet');

/** Persian and Latin digits alike — neither belongs on any of these surfaces. */
const DIGITS = /[0-9۰-۹]/;

beforeEach(() => {
  vi.resetModules();
  intentCalls = [];
  nextIntent = (_id, intent) => ({ ...BASE, certificate_intent: intent });
  document.body.innerHTML = '';
});

describe('the certificate strip — three moments', () => {
  it('at step zero it INFORMS rather than asking: no question mark, and the opt-in is «می‌خواهمش»', async () => {
    await mount(BASE, { started: false });
    expect(txt()).toContain('این مسیر گواهی‌نامه دارد');
    expect(txt()).not.toContain('را می‌خواهی؟');
    expect(btn('می‌خواهمش')).toBeTruthy();
    expect(btn('فعلاً نه')).toBeTruthy();
  });

  it('mid-pathway it asks plainly', async () => {
    await mount(BASE, { started: true });
    expect(txt()).toContain('گواهی‌نامهٔ این مسیر را می‌خواهی؟');
    expect(btn('بله، می‌خواهم')).toBeTruthy();
  });

  it('once the exam is open the CTA takes over and the question is gone — starting an attempt answers it', async () => {
    await mount({ ...BASE, state: 'ready', is_complete: true });
    expect(txt()).toContain('آزمون این مسیر برایت باز است');
    expect(document.querySelector('[data-pw-intent-row]')).toBeNull();
    // At `ready` the CTA asks before it travels, so it is a button; the link
    // to the exam page lives inside the sheet it opens.
    expect(document.querySelector('[data-exam-cta]')).toBeTruthy();
    expect(document.querySelector('a.dcp-btn-primary')).toBeNull();
  });

  it('«ادامهٔ آزمون» travels straight through — there is nothing left to ask', async () => {
    await mount({ ...BASE, state: 'open', is_complete: true });
    expect(document.querySelector('[data-exam-cta]')).toBeNull();
    expect(document.querySelector('a.dcp-btn-primary')!.getAttribute('href'))
      .toBe('/plus/exam.html?id=post-and-core');
  });

  it('a pathway whose series is unfinished asks nothing at all', async () => {
    await mount({ ...BASE, state: 'pending' });
    expect(txt()).toContain('هنوز باز نشده');
    expect(document.querySelector('[data-pw-intent-row]')).toBeNull();
  });

  it('a reader who has not pressed «شروع این مسیر» is pointed at that button, and still gets the question', async () => {
    await mount({ ...BASE, enrolled: false }, { started: true });
    expect(txt()).toContain('شروع این مسیر');
    expect(document.querySelector('[data-pw-intent-row]')).toBeTruthy();
  });
});

describe('the answer is a state, not a spent question', () => {
  it('«بله» stays on screen, says what it bought, and can be changed', async () => {
    await mount(BASE, { started: true });
    btn('بله، می‌خواهم')!.click();
    await settle();

    expect(intentCalls).toEqual([['post-and-core', 'wanted']]);
    expect(txt()).toContain('✓ گواهی‌نامه را می‌خواهی');
    // the echo the pathway page never had — and it is now a promise something keeps
    expect(txt()).toContain('در «اطلاعیه» خبرت می‌کنیم');
    expect(btn('تغییر')).toBeTruthy();
  });

  it('«فعلاً نه» is not a one-way door', async () => {
    await mount(BASE, { started: true });
    btn('فعلاً نه')!.click();
    await settle();
    expect(txt()).toContain('فعلاً گواهی نمی‌خواهی');

    btn('نظرم عوض شد')!.click();
    expect(btn('بله، می‌خواهم')).toBeTruthy();
    btn('بله، می‌خواهم')!.click();
    await settle();
    expect(intentCalls).toEqual([['post-and-core', 'declined'], ['post-and-core', 'wanted']]);
    expect(txt()).toContain('✓ گواهی‌نامه را می‌خواهی');
  });

  it('«بی‌خیال» leaves the stored answer alone', async () => {
    await mount({ ...BASE, certificate_intent: 'wanted' }, { started: true });
    btn('تغییر')!.click();
    btn('بی‌خیال')!.click();
    expect(intentCalls).toEqual([]);
    expect(txt()).toContain('✓ گواهی‌نامه را می‌خواهی');
  });

  it('a refused write leaves the row where it was rather than pretending', async () => {
    nextIntent = () => { throw new Error('nope'); };
    await mount(BASE, { started: true });
    btn('بله، می‌خواهم')!.click();
    await settle();
    expect(txt()).toContain('ثبت نشد.');
    expect(btn('بله، می‌خواهم')!.disabled).toBe(false);
  });

  it('once a form exists the echo promises the exam rather than a notice', async () => {
    await mount({ ...BASE, rules: { question_count: 15, pass_percent: 70 } }, { started: true });
    nextIntent = (_id, intent) => ({ ...BASE, rules: { question_count: 15, pass_percent: 70 }, certificate_intent: intent });
    btn('بله، می‌خواهم')!.click();
    await settle();
    expect(txt()).toContain('نزدیک پایانِ مسیر، آزمون برایت باز می‌شود');
  });
});

describe('the terms, reachable from every moment', () => {
  it('opens from a pathway that has no exam form — the case that had no door at all', async () => {
    await mount({ ...BASE, state: 'no_form' }, { started: true });
    btn('شرایط ›')!.click();
    await settle();
    const s = sheet()!;
    expect(s).toBeTruthy();
    expect(s.textContent).toContain('پست و کور');
    expect(s.textContent).toContain('ثبت‌نام');
    expect(s.textContent).toContain('پریمیوم');
    // the line that used to appear only UNDER a certificate already issued
    expect(s.textContent).toContain('امتیاز بازآموزی');
  });

  it('a held certificate needs no terms button', async () => {
    await mount({ ...BASE, state: 'passed', certificate: { verify_code: 'DC-K4M-7QA', verify_url: '/plus/certificate.html?c=DC-K4M-7QA' } });
    expect(btn('شرایط ›')).toBeFalsy();
    expect(document.querySelector('a.dcp-btn')!.getAttribute('href')).toBe('/plus/certificate.html?c=DC-K4M-7QA');
  });
});

describe('no numbers, anywhere', () => {
  it('no state of the strip prints a digit', async () => {
    for (const state of ['pending', 'no_form', 'locked', 'ready', 'open', 'queued', 'wait', 'exhausted', 'passed']) {
      for (const started of [true, false]) {
        await mount({ ...BASE, state, rules: { question_count: 15, pass_percent: 70, max_attempts: 2, retry_days: 7 } }, { started });
        expect(txt(), `${state}/${started}`).not.toMatch(DIGITS);
      }
    }
  });

  it('nor does the answered row, in either direction', async () => {
    for (const intent of ['wanted', 'declined']) {
      await mount({ ...BASE, certificate_intent: intent }, { started: true });
      expect(txt(), intent).not.toMatch(DIGITS);
    }
  });

  it('nor the «الان آزمون بدهیم؟» sheet — the numbers belong to the exam page', async () => {
    await mount({ ...BASE, state: 'ready', is_complete: true });
    (document.querySelector('[data-exam-cta]') as HTMLButtonElement).click();
    await settle();
    const body = sheet()!.textContent!;
    expect(body).not.toMatch(DIGITS);
    expect(body).toContain('چیزی را شروع نمی‌کند');
  });

  it('nor the terms sheet — it says WHERE the numbers are, never what they are', async () => {
    await mount(BASE, { started: true });
    btn('شرایط ›')!.click();
    await settle();
    // The rule is about numbers that GO STALE, so the two that cannot are
    // allowed and named here rather than silently passing: the list's own
    // ordinals (drawn in <i> markers) and the paper size «A4».
    const body = Array.from(sheet()!.querySelectorAll('span, p'))
      .map((n) => n.textContent).join(' ').replace(/A4/g, '');
    expect(body).not.toMatch(DIGITS);
    expect(body).toContain('در صفحهٔ آزمونِ همان مسیر');
    expect(body).not.toContain('٪');
  });
});

/**
 * The door asks, and «الان نه» is a whole answer (founder, 2026-09-20).
 *
 * The CTA was a bare link: tapping it to see what was there landed the reader
 * on a page whose first button draws the questions. Nothing was lost by
 * looking — the attempt opens on «شروع آزمون», not on arrival — but from this
 * side that was unknowable, so the safest move was not to tap.
 */
describe('«الان آزمون بدهیم؟»', () => {
  const openAsk = async () => {
    await mount({ ...BASE, state: 'ready', is_complete: true });
    (document.querySelector('[data-exam-cta]') as HTMLButtonElement).click();
    await settle();
  };

  it('asks before it travels, and says that travelling starts nothing', async () => {
    await openAsk();
    const card = document.querySelector('[data-exam-ask]')!;
    expect(card.textContent).toContain('پست و کور');
    expect(card.textContent).toContain('رفتن به صفحهٔ آزمون چیزی را شروع نمی‌کند');
    expect(card.querySelector('[data-exam-go]')!.getAttribute('href'))
      .toBe('/plus/exam.html?id=post-and-core');
  });

  it('«الان نه» closes the sheet and leaves the card exactly as it was', async () => {
    await openAsk();
    (document.querySelector('[data-exam-stay]') as HTMLButtonElement).click();
    await settle();
    // sheet.js takes the node out only after its exit transition (300ms), so
    // «closed» is asserted on the node being gone rather than on a class the
    // opening rAF may still be about to set.
    await new Promise((r) => setTimeout(r, 350));
    expect(sheet()).toBeNull();
    expect(intentCalls).toEqual([]);                       // nothing recorded
    expect(document.querySelector('[data-exam-cta]')).toBeTruthy(); // same button, same place
    expect(txt()).toContain('آزمون این مسیر برایت باز است');
  });
});
