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

const aiCard = {
  content_id: 'chairside/chairside-1',
  card_id: 'flashcards-c1',
  front: 'جلوی کارت هوش مصنوعی',
  back: 'پشت کارت هوش مصنوعی',
  box: 1,
  next_review_at: null,
  reviewed_count: 0,
};

const answerCalls: Array<{ highlight_id: string; result: string }> = [];
const answerAiCalls: Array<{ content_id: string; card_id: string; result: string }> = [];
let dueResponse: any[] = [];
let aiDueResponse: any[] = [];

vi.mock('/plus/js/api.js', () => ({
  api: {
    reviewDue: () => Promise.resolve({ due: dueResponse, ai_due: aiDueResponse }),
    reviewAnswer: (highlight_id: string, result: string) => {
      answerCalls.push({ highlight_id, result });
      return Promise.resolve({ card_state: { box: 2, next_review_at: new Date().toISOString(), reviewed_count: 1 } });
    },
    reviewAnswerAi: (content_id: string, card_id: string, result: string) => {
      answerAiCalls.push({ content_id, card_id, result });
      return Promise.resolve({ card_state: { box: 2, next_review_at: new Date().toISOString(), reviewed_count: 1 } });
    },
  },
}));

const { renderReview } = await import('../../plus/js/review.js');

describe('premium review view', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    answerCalls.length = 0;
    answerAiCalls.length = 0;
    dueResponse = [];
    aiDueResponse = [];
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

  it('labels a per-highlight note so it never reads as an unexplained box', async () => {
    dueResponse = [{ ...dueCard, note: 'Fggvffggf' }];
    const root = document.getElementById('root')!;
    await renderReview(root);

    const noteEl = root.querySelector('.dcp-rv-note');
    expect(noteEl).toBeTruthy();
    expect(noteEl!.textContent).toContain('یادداشت شما');
    expect(noteEl!.textContent).toContain('Fggvffggf');
  });

  it('renders a multi-line note as a real bulleted list, not run-together text', async () => {
    dueResponse = [{ ...dueCard, note: 'خط اول\nخط دوم\nخط سوم' }];
    const root = document.getElementById('root')!;
    await renderReview(root);

    const items = root.querySelectorAll('.dcp-rv-note .dcp-note-list li');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('خط اول');
    expect(items[2].textContent).toBe('خط سوم');
  });

  it('omits the note box entirely when the highlight has no note', async () => {
    dueResponse = [dueCard]; // note: null
    const root = document.getElementById('root')!;
    await renderReview(root);

    expect(root.querySelector('.dcp-rv-note')).toBeNull();
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

  it('renders an AI card with its amber badge, back hidden until reveal, grading only after', async () => {
    aiDueResponse = [aiCard];
    const root = document.getElementById('root')!;
    await renderReview(root);

    const card = root.querySelector('.dcp-rv-card-ai');
    expect(card).toBeTruthy();
    expect(card!.textContent).toContain('نکته هوش مصنوعی');

    // Before reveal: no back text in the DOM, no grading buttons inside this card.
    expect(card!.textContent).not.toContain(aiCard.back);
    expect(card!.querySelectorAll('button.dcp-rv-btn')).toHaveLength(0);

    const revealBtn = card!.querySelector('.dcp-rv-reveal') as HTMLButtonElement;
    expect(revealBtn).toBeTruthy();
    revealBtn.dispatchEvent(new Event('click', { bubbles: true }));

    // After reveal: back text is present, and the two grading buttons exist.
    expect(card!.textContent).toContain(aiCard.back);
    expect(card!.querySelectorAll('button.dcp-rv-btn')).toHaveLength(2);
  });

  it('grades an AI card via reviewAnswerAi with (content_id, card_id, result)', async () => {
    aiDueResponse = [aiCard];
    const root = document.getElementById('root')!;
    await renderReview(root);

    const card = root.querySelector('.dcp-rv-card-ai')!;
    (card.querySelector('.dcp-rv-reveal') as HTMLButtonElement).dispatchEvent(new Event('click', { bubbles: true }));

    const gotIt = Array.from(card.querySelectorAll('button')).find((b) => b.textContent === 'بلد بودم');
    gotIt!.dispatchEvent(new Event('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(answerAiCalls).toEqual([
      { content_id: aiCard.content_id, card_id: aiCard.card_id, result: 'remembered' },
    ]);
  });

  it('interleaves 2 highlights : 1 AI card, and the highlight card renders unchanged', async () => {
    dueResponse = [
      dueCard,
      { ...dueCard, highlight_id: 'hl-2' },
      { ...dueCard, highlight_id: 'hl-3' },
      { ...dueCard, highlight_id: 'hl-4' },
    ];
    aiDueResponse = [aiCard, { ...aiCard, card_id: 'flashcards-c2' }];
    const root = document.getElementById('root')!;
    await renderReview(root);

    const cards = Array.from(root.querySelectorAll('.dcp-rv-list > .dcp-rv-card'));
    const kinds = cards.map((c) => (c.classList.contains('dcp-rv-card-ai') ? 'ai' : 'hl'));
    expect(kinds).toEqual(['hl', 'hl', 'ai', 'hl', 'hl', 'ai']);

    // The highlight card itself is unchanged: full text, no cloze blank.
    const firstHl = cards[0];
    expect(firstHl.querySelector('.dcp-blank')).toBeNull();
    expect(firstHl.querySelector('mark.dcp-hl')).toBeTruthy();

    // Counter sums both queues.
    expect(root.querySelector('.dcp-rv-count')!.textContent).toContain('۶');
  });

  it('shows AI cards (not the empty state) when `due` is empty but `ai_due` is not', async () => {
    dueResponse = [];
    aiDueResponse = [aiCard];
    const root = document.getElementById('root')!;
    await renderReview(root);

    expect(root.textContent).not.toContain('هنوز چیزی برای مرور نداری');
    expect(root.querySelectorAll('.dcp-rv-card-ai')).toHaveLength(1);
  });
});
