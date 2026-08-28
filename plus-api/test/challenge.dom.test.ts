// @vitest-environment jsdom
// Drives the REAL shipped block (/plus/js/challenge.js) against a stub
// GET /challenge/:id + a stub /me, the same shape article-threads.dom.test.ts
// and des-scorer.dom.test.ts already use.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const CONTENT = 'chairside/chairside-99';

let challengesFile: { byContent: Record<string, { question: string; image: string | null }> } | null;
let user: { tier: string } | null;
let status: 'user' | 'anon' | 'error';
let stateImpl: () => Promise<Record<string, unknown>>;

globalThis.fetch = vi.fn((url: string) => {
  if (String(url).includes('/plus/challenges.json')) {
    return Promise.resolve({
      ok: challengesFile !== null,
      json: () => Promise.resolve(challengesFile),
    });
  }
  return Promise.reject(new Error('unexpected fetch: ' + url));
}) as unknown as typeof fetch;

class ApiErrorLike extends Error {
  status: number;
  body: Record<string, unknown>;
  constructor(status: number, body: Record<string, unknown>) {
    super('api error');
    this.status = status;
    this.body = body;
  }
}

vi.mock('/plus/js/api.js', () => ({
  currentUser: () => Promise.resolve(user),
  meStatus: () => status,
  api: {
    challengeState: () => stateImpl(),
    submitChallenge: () => Promise.reject(new ApiErrorLike(402, { error: 'premium_required' })),
  },
}));

vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: () => Promise.resolve(null),
}));

const PREMIUM_MSG = 'برای شرکت در چالش و بررسی پاسختون با هوش مصنوعی اشتراک پرمیوم تهیه کنید';

function anchor(): HTMLElement {
  document.body.innerHTML = `<main><div class="glass-box" id="p">
    <img data-dc-challenge-image src="/img/x.jpg" alt="">
    <h3>چالش</h3>
    <p data-dc-challenge-question>سؤال چالش؟</p>
  </div></main>`;
  return document.getElementById('p')!;
}

// The module draws behind an IntersectionObserver; jsdom has none, so the
// module's own fallback path runs it immediately. Assert on that.
const settle = () => new Promise((r) => setTimeout(r, 0));

let mountChallenge: (anchor: HTMLElement, contentId: string) => boolean;

beforeEach(async () => {
  user = null;
  status = 'anon';
  challengesFile = { byContent: { [CONTENT]: { question: 'سؤال چالش؟', image: '/img/x.jpg' } } };
  stateImpl = () => Promise.resolve({ exists: true });
  // challenge.js caches its plus/challenges.json fetch at module scope (one
  // request per real page-load) — a fresh module instance per test is what
  // lets each test set its own challengesFile/stateImpl without one test's
  // response sticking for every test that runs after it.
  vi.resetModules();
  ({ mountChallenge } = await import('/plus/js/challenge.js'));
});

describe('no چالش for this page', () => {
  it('never inserts anything when plus/challenges.json has no entry', async () => {
    challengesFile = { byContent: {} };
    const a = anchor();
    expect(mountChallenge(a, CONTENT)).toBe(true);
    await settle();
    expect(document.querySelector('.dc-challenge')).toBeNull();
  });

  it('never inserts anything when the API says the row does not exist yet (half-published)', async () => {
    stateImpl = () => Promise.resolve({ exists: false });
    const a = anchor();
    mountChallenge(a, CONTENT);
    await settle();
    expect(document.querySelector('.dc-challenge')).toBeNull();
    expect(document.querySelector('[data-dc-challenge-question]')?.hidden).not.toBe(true);
  });
});

describe('static page markup', () => {
  it('hides the step-4.14 copy once the live block mounts', async () => {
    user = { tier: 'free' };
    status = 'user';
    mountChallenge(anchor(), CONTENT);
    await settle();
    expect(document.querySelector('[data-dc-challenge-question]')?.hidden).toBe(true);
    expect(document.querySelector('[data-dc-challenge-image]')?.hidden).toBe(true);
    expect(document.querySelector('h3')?.hidden).toBe(true);
    expect(document.querySelectorAll('.dc-ch-q')).toHaveLength(1);
  });
});

describe('the answer box — visible to everyone, gated on submit', () => {
  it('a free reader sees the same box as premium, not an upfront lock card', async () => {
    user = { tier: 'free' };
    status = 'user';
    mountChallenge(anchor(), CONTENT);
    await settle();
    const block = document.querySelector('.dc-challenge')!;
    expect(block).not.toBeNull();
    expect(block.textContent).toContain('سؤال چالش؟');
    expect(document.querySelector('textarea')).not.toBeNull();
    expect(document.querySelector('.dc-ch-gate')).toBeNull();
  });

  it('a free reader who presses send sees the premium message and CTA, not an API call', async () => {
    user = { tier: 'free' };
    status = 'user';
    mountChallenge(anchor(), CONTENT);
    await settle();
    document.querySelector<HTMLButtonElement>('.dc-act-primary')!.click();
    await settle();
    expect(document.querySelector('.dc-ch-premium-msg')?.textContent).toBe(PREMIUM_MSG);
    expect(document.querySelector('.dcp-btn-primary')?.textContent).toContain('خرید اشتراک پریمیوم');
  });

  it('a signed-out visitor also sees the box', async () => {
    user = null;
    status = 'anon';
    mountChallenge(anchor(), CONTENT);
    await settle();
    const block = document.querySelector('.dc-challenge')!;
    expect(block.textContent).toContain('سؤال چالش؟');
    expect(document.querySelector('textarea')).not.toBeNull();
  });

  it('/me unreachable: the question alone, no upsell and no box', async () => {
    user = null;
    status = 'error';
    mountChallenge(anchor(), CONTENT);
    await settle();
    const block = document.querySelector('.dc-challenge')!;
    expect(block.textContent).toContain('سؤال چالش؟');
    expect(block.textContent).not.toContain('پریمیوم');
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.querySelector('.dc-ch-gate')).toBeNull();
  });

  it('a premium reader with no attempt yet sees the box', async () => {
    user = { tier: 'premium' };
    status = 'user';
    mountChallenge(anchor(), CONTENT);
    await settle();
    expect(document.querySelector('textarea')).not.toBeNull();
    expect(document.querySelector('.dc-ch-gate')).toBeNull();
  });
});

describe('a settled or queued attempt (the "done" view)', () => {
  it('settled: the verdict word, the count line and answer_fa — no key-point text anywhere', async () => {
    user = { tier: 'premium' };
    status = 'user';
    stateImpl = () => Promise.resolve({
      exists: true, status: 'settled', answer_text: 'جواب من', answer_fa: 'جواب بنیان‌گذار',
      result: 'partial', covered_count: 2, point_count: 3,
    });
    mountChallenge(anchor(), CONTENT);
    await settle();
    const block = document.querySelector('.dc-challenge')!;
    expect(block.textContent).toContain('تا حدی درست بود');
    expect(block.textContent).toContain('۲ از ۳ نکته‌ی کلیدی');
    expect(block.textContent).toContain('جواب بنیان‌گذار');
    expect(document.querySelector('textarea')).toBeNull();
    // No per-point checklist is ever rendered (§7.2/§14) — nothing named "kp".
    expect(block.innerHTML).not.toContain('kp1');
  });

  it('queued: the reference code, the waiting line, and answer_fa', async () => {
    user = { tier: 'premium' };
    status = 'user';
    stateImpl = () => Promise.resolve({
      exists: true, status: 'queued', answer_text: 'جواب من', answer_fa: 'جواب بنیان‌گذار', reference: 'C-ABC-DEF',
    });
    mountChallenge(anchor(), CONTENT);
    await settle();
    const block = document.querySelector('.dc-challenge')!;
    expect(block.textContent).toContain('C-ABC-DEF');
    expect(block.textContent).toContain('جوابت رسید');
    expect(block.textContent).toContain('جواب بنیان‌گذار');
    expect(document.querySelector('textarea')).toBeNull();
  });
});
