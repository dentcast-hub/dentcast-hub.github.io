// @vitest-environment jsdom
// Drives the REAL shipped module (/plus/js/des-scorer.js) against index.html's
// static tab+drawer shell. No AI provider anywhere in this feature — the
// module only ever talks to /des/state and /des/submit, both stubbed here.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let user: { tier: string } | null = { tier: 'premium' };
let meErr = false;
let submitImpl: (payload: unknown) => Promise<unknown>;
let stateImpl: () => Promise<unknown>;

vi.mock('/plus/js/api.js', () => ({
  currentUser: () => Promise.resolve(user),
  meStatus: () => (user ? 'user' : meErr ? 'error' : 'anon'),
  api: {
    desSubmit: (payload: unknown) => submitImpl(payload),
    desState: () => stateImpl(),
    requestOtp: () => Promise.resolve({}),
  },
}));

const { initDesTool } = await import('/plus/js/des-scorer.js');

const settle = () => new Promise((r) => setTimeout(r, 0));

function shell(): void {
  document.body.innerHTML = `
    <div class="dc-destool-wrap">
      <button type="button" id="dcDesToolTab" aria-expanded="false" aria-controls="dcDesToolPanel">tab</button>
      <div id="dcDesToolDrawer"><div><div id="dcDesToolPanel"></div></div></div>
    </div>`;
}

function openTab(): void {
  document.getElementById('dcDesToolTab')!.dispatchEvent(new Event('click', { bubbles: true }));
}

const GOOD_DES = {
  content_type: 'RESEARCH', question_type: 'ETIOLOGY', text_basis: 'FULL_TEXT',
  band: 'B', des_score: 68, provisional: false,
  s_design: { value: 100, anchor: 'x', evidence_quote: 'x' },
  q_method: {
    tool: 'AMSTAR-2',
    domains: [
      { domain: 'a', rating: 'low', evidence_quote: 'x' },
      { domain: 'b', rating: 'low', evidence_quote: 'x' },
      { domain: 'c', rating: 'some_concerns', evidence_quote: 'x' },
      { domain: 'd', rating: 'low', evidence_quote: 'x' },
      { domain: 'e', rating: 'low', evidence_quote: 'x' },
      { domain: 'f', rating: 'low', evidence_quote: 'x' },
    ],
    multiplier: 0.8,
  },
  penalties: [
    { item: 'بیانیه‌ی تعارض منافع وجود ندارد', base_points: 8, points: 0, note: 'x' },
    { item: 'کارآزمایی به‌صورت پیش‌نگر ثبت نشده', base_points: 5, points: 0, note: 'x' },
    { item: 'توجیه حجم نمونه یا آنالیز توان وجود ندارد', base_points: 5, points: 0, note: 'x' },
    { item: 'دوره‌ی پیگیری کوتاه‌تر از آنچه پیامد لازم دارد', base_points: 3, points: 0, note: 'x' },
  ],
  interpretation_fa: 'خلاصه‌ی کوتاه.',
};

const LONG_ENGLISH_ABSTRACT = [
  'Objective: To assess the association between smoking and early dental implant failure.',
  'Methods: Five databases were searched. Eighty-four patients were randomized to single-visit',
  'or multiple-visit treatment; outcome assessors were blinded to group allocation.',
  'Results: Mean VAS score at 24 hours was 3.8 (SD 1.9) versus 2.6 (SD 1.7), p = 0.014, 95% CI 0.25-2.15.',
  'Conclusions: Single-visit treatment was associated with greater pain on the first day in this cohort.',
].join(' ');

beforeEach(() => {
  user = { tier: 'premium' };
  meErr = false;
  submitImpl = () => Promise.resolve({ ok: true, answered: false, reference: 'D-KRM-TQF', has_pdf: false });
  stateImpl = () => Promise.resolve({ ok: true, limit: 2, open: [] });
  shell();
});

describe('gating', () => {
  it('renders a premium CTA for a signed-in free reader', async () => {
    user = { tier: 'free' };
    initDesTool();
    openTab();
    await settle();
    expect(document.querySelector('.dcp-gate')).not.toBeNull();
    expect(document.querySelector('a[href*="pricing"]')).not.toBeNull();
    expect(document.querySelector('.dc-destool-titlerow')).toBeNull();
  });

  it('offers a login button when signed out', async () => {
    user = null;
    initDesTool();
    openTab();
    await settle();
    expect(document.querySelector('.dcp-gate')).not.toBeNull();
    expect(document.body.textContent).toContain('وارد شو');
  });

  it('shows the real form for a premium reader', async () => {
    initDesTool();
    openTab();
    await settle();
    expect(document.querySelector('.dc-destool-titlerow input')).not.toBeNull();
  });
});

describe('the compose form', () => {
  it('blocks submit on an empty title, without calling the API', async () => {
    let called = false;
    submitImpl = () => { called = true; return Promise.resolve({}); };
    initDesTool();
    openTab();
    await settle();
    (document.querySelector('.dc-destool-go') as HTMLButtonElement).click();
    await settle();
    expect(called).toBe(false);
    expect(document.querySelector('.dc-destool-issue-stop')).not.toBeNull();
  });

  it('submits a valid paper and renders the queued receipt with the server reference', async () => {
    initDesTool();
    openTab();
    await settle();
    const title = document.querySelector('.dc-destool-titlerow input') as HTMLInputElement;
    const body = document.querySelector('.dc-destool-field textarea') as HTMLTextAreaElement;
    title.value = 'Smoking in relation to early dental implant failure';
    title.dispatchEvent(new Event('input', { bubbles: true }));
    body.value = LONG_ENGLISH_ABSTRACT;
    body.dispatchEvent(new Event('input', { bubbles: true }));

    (document.querySelector('.dc-destool-go') as HTMLButtonElement).click();
    await settle();

    expect(document.querySelector('.dc-destool-refcode')?.textContent).toBe('D-KRM-TQF');
    expect(document.querySelector('.dc-destool-view[data-view="queued"]')?.classList.contains('is-on')).toBe(true);
  });

  it('renders an instant answer using des.js\'s own band-bar DOM (no second renderer)', async () => {
    submitImpl = () => Promise.resolve({ ok: true, answered: true, des: GOOD_DES, hashtags: ['#ایمپلنت'] });
    initDesTool();
    openTab();
    await settle();
    const title = document.querySelector('.dc-destool-titlerow input') as HTMLInputElement;
    const body = document.querySelector('.dc-destool-field textarea') as HTMLTextAreaElement;
    title.value = 'Smoking in relation to early dental implant failure';
    body.value = LONG_ENGLISH_ABSTRACT;
    body.dispatchEvent(new Event('input', { bubbles: true }));

    (document.querySelector('.dc-destool-go') as HTMLButtonElement).click();
    await settle();

    // sourceBlock()'s own classes — proof this reuses des.js, not a copy of it
    expect(document.querySelector('.dc-des-bar')).not.toBeNull();
    expect(document.querySelector('.dc-des-b-B.is-on')).not.toBeNull();
    expect(document.querySelector('.dc-des-bandname')?.textContent).toContain('B');
    expect(document.querySelector('.dc-destool-tag')?.textContent).toBe('#ایمپلنت');
    // RULE 5: nothing on screen says this came from the library.
    expect(document.body.textContent).not.toMatch(/کش|حافظه|library|cache/i);
  });

  it('shows the PDF hand-off block when has_pdf comes back true', async () => {
    submitImpl = () => Promise.resolve({ ok: true, answered: false, reference: 'D-ABC-DEF', has_pdf: true });
    initDesTool();
    openTab();
    await settle();
    const title = document.querySelector('.dc-destool-titlerow input') as HTMLInputElement;
    const tick = document.querySelector('.dc-destool-pdfrow input') as HTMLInputElement;
    title.value = 'Some paper title here';
    title.dispatchEvent(new Event('input', { bubbles: true }));
    tick.checked = true;
    tick.dispatchEvent(new Event('change', { bubbles: true }));

    (document.querySelector('.dc-destool-go') as HTMLButtonElement).click();
    await settle();

    const tg = document.querySelector('.dc-destool-tgbtn') as HTMLAnchorElement;
    expect(tg).not.toBeNull();
    expect(tg.closest('[hidden]')).toBeNull();
    expect(tg.getAttribute('href')).toBe('https://t.me/dentcast_support');
  });

  it('shows the "two open" view on a 429', async () => {
    const err = Object.assign(new Error('too many'), { status: 429, body: { error: 'too_many_open' } });
    submitImpl = () => Promise.reject(err);
    initDesTool();
    openTab();
    await settle();
    const title = document.querySelector('.dc-destool-titlerow input') as HTMLInputElement;
    const body = document.querySelector('.dc-destool-field textarea') as HTMLTextAreaElement;
    title.value = 'Some paper title here';
    body.value = LONG_ENGLISH_ABSTRACT;
    body.dispatchEvent(new Event('input', { bubbles: true }));

    (document.querySelector('.dc-destool-go') as HTMLButtonElement).click();
    await settle();
    expect(document.querySelector('.dc-destool-view[data-view="spent"]')?.classList.contains('is-on')).toBe(true);
  });
});

describe('reopening the tab', () => {
  it('shows open requests in flight instead of a blank form', async () => {
    stateImpl = () => Promise.resolve({
      ok: true, limit: 2,
      open: [{ reference: 'D-ONE-TWO3', title: 'مقاله‌ی من', has_pdf: false, created_at: new Date().toISOString() }],
    });
    initDesTool();
    openTab();
    await settle();
    expect(document.querySelector('.dc-destool-view[data-view="pending"]')?.classList.contains('is-on')).toBe(true);
    expect(document.querySelector('.dc-destool-ftitle')?.textContent).toBe('مقاله‌ی من');
    expect(document.querySelector('.dc-destool-fmeta code')?.textContent).toBe('D-ONE-TWO3');
  });
});
