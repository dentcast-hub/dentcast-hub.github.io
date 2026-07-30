// @vitest-environment jsdom
// Drives the REAL shipped premium review module (/plus/js/review.js): renders
// the due queue, grades a card, and checks the empty-state CTA (the "start
// highlighting" nudge agreed for a premium user with nothing due yet).
import { describe, it, expect, beforeEach, vi } from 'vitest';

// No real network for the content-index fetch inside content-index.js; it has
// its own catch and falls back to an empty model, so this just keeps the test
// hermetic (same pattern as workbench.dom.test.ts).
globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

const dueCard = {
  highlight_id: 'hl-1',
  content_id: 'insight/insight-1',
  exact: 'متن هایلایت‌شده',
  prefix: 'قبل از آن ',
  suffix: ' و بعد از آن.',
  color: 'yellow',
  label: 'important',
  note: null,
  box: 1,
  next_review_at: null,
  reviewed_count: 0,
};

const answerCalls: Array<{ highlight_id: string; result: string }> = [];
let dueResponse: any[] = [];

vi.mock('/plus/js/api.js', () => ({
  api: {
    reviewDue: () => Promise.resolve({ due: dueResponse }),
    reviewAnswer: (highlight_id: string, result: string) => {
      answerCalls.push({ highlight_id, result });
      return Promise.resolve({ card_state: { box: 2, next_review_at: new Date().toISOString(), reviewed_count: 1 } });
    },
  },
}));

const { renderReview } = await import('../../plus/js/review.js');

describe('premium review view', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    answerCalls.length = 0;
    dueResponse = [];
  });

  it('shows the "start highlighting" empty state when nothing is due', async () => {
    const root = document.getElementById('root')!;
    await renderReview(root);

    expect(root.textContent).toContain('هنوز چیزی برای مرور نداری');
    expect(root.textContent).toContain('هایلایت کردن رو شروع کن');
  });

  it('renders a due card and grades it as "remembered"', async () => {
    dueResponse = [dueCard];
    const root = document.getElementById('root')!;
    await renderReview(root);

    expect(root.querySelectorAll('.dcp-rv-card')).toHaveLength(1);

    // The highlight shows in FULL, marked like it is in the article — never
    // hidden behind a cloze blank (prototype feedback, 2026-07-30: hiding a
    // user's own highlight from them is confusing, not a recall test).
    expect(root.querySelector('.dcp-blank')).toBeNull();
    const mark = root.querySelector('mark.dcp-hl');
    expect(mark).toBeTruthy();
    expect(mark!.getAttribute('data-color')).toBe('yellow');
    expect(mark!.textContent).toBe(dueCard.exact);
    expect(root.querySelector('.dcp-rv-text')!.textContent).toBe(
      dueCard.prefix + dueCard.exact + dueCard.suffix,
    );

    const gotIt = Array.from(root.querySelectorAll('button')).find((b) => b.textContent === 'بلد بودم');
    expect(gotIt).toBeTruthy();

    gotIt!.dispatchEvent(new Event('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(answerCalls).toEqual([{ highlight_id: 'hl-1', result: 'remembered' }]);
  });

  it('grades a card as "forgot" via the دوباره مرورش کن button', async () => {
    dueResponse = [dueCard];
    const root = document.getElementById('root')!;
    await renderReview(root);

    const again = Array.from(root.querySelectorAll('button')).find((b) => b.textContent === 'دوباره مرورش کن');
    again!.dispatchEvent(new Event('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(answerCalls).toEqual([{ highlight_id: 'hl-1', result: 'forgot' }]);
  });
});
