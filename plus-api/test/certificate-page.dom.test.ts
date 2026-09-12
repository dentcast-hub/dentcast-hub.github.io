// @vitest-environment jsdom
// Drives the REAL shipped verify page module (/plus/js/certificate-page.js).
//
// The one thing a stranger comes to this page for is the verdict, so the
// rules under test are about the verdict never lying: a live certificate says
// genuine, a revoked one says revoked (and still shows the sheet — it is a
// record), an unknown code says "not registered" and nothing more, and a
// dead API says "could not check" — never "forged".
import { describe, it, expect, beforeEach, vi } from 'vitest';

let verifyImpl: (code: string) => Promise<unknown>;
vi.mock('/plus/js/api.js', () => ({
  api: { certificateVerify: (code: string) => verifyImpl(code) },
}));
vi.mock('/plus/js/pwa.js', () => ({ registerSW: () => {} }));

const LIVE = {
  certificate: {
    verify_code: 'DC-K4M-7QA',
    holder_name: 'دکتر مهسا رضایی',
    pathway_id: 'ceramics',
    pathway_title_fa: 'سرامیک دندانی: از انتخاب ماده تا سمان',
    issued_at: '2026-09-12T10:00:00.000Z',
    revoked: false,
    revoked_at: null,
  },
};
const REVOKED = {
  certificate: { ...LIVE.certificate, revoked: true, revoked_at: '2026-09-20T10:00:00.000Z' },
};

const notFound = () => Object.assign(new Error('not_found'), { status: 404 });
const settle = () => new Promise((r) => setTimeout(r, 0));

// A root that is NOT #dcp-root, so the module's own boot stays out of the way.
async function mount(code: string) {
  document.body.innerHTML = '<div id="test-root"></div>';
  const mod = await import('/plus/js/certificate-page.js');
  await mod.renderCertificate(document.getElementById('test-root')!, code);
  await settle();
  return mod;
}

const verdict = () => document.querySelector('[data-cert-verdict]') as HTMLElement | null;
const sheetEl = () => document.querySelector('[data-cert-sheet]') as HTMLElement | null;

beforeEach(() => {
  vi.resetModules();
  verifyImpl = () => Promise.resolve(LIVE);
});

describe('the verdict', () => {
  it('says genuine for a live certificate, and shows the sheet as approved', async () => {
    await mount('DC-K4M-7QA');
    expect(verdict()!.dataset.certVerdict).toBe('ok');
    expect(verdict()!.textContent).toContain('این گواهی اصل است');
    expect(verdict()!.textContent).toContain('دکتر مهسا رضایی');
    expect(verdict()!.textContent).toContain('سرامیک دندانی');

    const s = sheetEl()!;
    expect(s.classList.contains('is-revoked')).toBe(false);
    expect(s.querySelector('.dc-cert-holder')!.textContent).toBe('دکتر مهسا رضایی');
    expect(s.querySelector('.dc-cert-pathway')!.textContent).toBe('سرامیک دندانی: از انتخاب ماده تا سمان');
    expect(s.querySelector('.dc-cert-ver-id')!.textContent).toBe('DC-K4M-7QA');
    expect(s.querySelector('.dc-cert-kicker')!.textContent).toBe('گواهی‌نامهٔ تکمیل مسیر یادگیری');
    // the honest line is on the document itself
    expect(s.querySelector('.dc-cert-fine')!.textContent).toContain('امتیاز بازآموزی');
    // no step count anywhere: a permanent document must not carry a number
    // that the next publish changes
    expect(s.textContent).not.toMatch(/قدم/);
    expect(document.getElementById('certPrint')).not.toBeNull();
  });

  it('says revoked, and still shows the sheet — greyed and marked', async () => {
    verifyImpl = () => Promise.resolve(REVOKED);
    await mount('DC-K4M-7QA');
    expect(verdict()!.dataset.certVerdict).toBe('revoked');
    expect(verdict()!.textContent).toContain('باطل شده');
    const s = sheetEl()!;
    expect(s.classList.contains('is-revoked')).toBe(true);
    expect(s.querySelector('.dc-cert-kicker')!.textContent).toBe('باطل شده');
  });

  it('says not registered on a 404, and shows no sheet', async () => {
    verifyImpl = () => Promise.reject(notFound());
    await mount('DC-AAA-AAA');
    expect(verdict()!.dataset.certVerdict).toBe('missing');
    expect(verdict()!.textContent).toContain('ثبت نشده');
    expect(sheetEl()).toBeNull();
  });

  it('never calls a certificate forged when it simply could not ask', async () => {
    verifyImpl = () => Promise.reject(new TypeError('Failed to fetch'));
    await mount('DC-K4M-7QA');
    expect(verdict()!.dataset.certVerdict).toBe('unreachable');
    expect(verdict()!.textContent).toContain('نتوانستیم');
    expect(verdict()!.textContent).not.toContain('ثبت نشده');
    expect(sheetEl()).toBeNull();
  });

  it('shows the lookup alone with no code', async () => {
    await mount('');
    expect(verdict()).toBeNull();
    expect(sheetEl()).toBeNull();
    expect(document.getElementById('certCode')).not.toBeNull();
  });
});

describe('the lookup box', () => {
  it('submits the typed code, cleaned', async () => {
    const seen: string[] = [];
    verifyImpl = (code) => { seen.push(code); return Promise.resolve(LIVE); };
    await mount('');
    const input = document.getElementById('certCode') as HTMLInputElement;
    input.value = ' dc k4m 7qa ';
    (document.querySelector('.dc-cert-lookup') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true, bubbles: true }),
    );
    await settle(); await settle();
    expect(seen).toEqual(['DC-K4M-7QA']);
    expect(verdict()!.dataset.certVerdict).toBe('ok');
  });

  it('forgives a code typed without dashes or in lowercase', async () => {
    const { cleanCode } = await import('/plus/js/certificate-page.js');
    expect(cleanCode('dck4m7qa')).toBe('DC-K4M-7QA');
    expect(cleanCode('DC--K4M-7QA')).toBe('DC-K4M-7QA');
    expect(cleanCode('  dc-k4m-7qa ')).toBe('DC-K4M-7QA');
    expect(cleanCode('')).toBe('');
  });
});

describe('verdictFor', () => {
  it('is pure and covers all four states', async () => {
    const { verdictFor } = await import('/plus/js/certificate-page.js');
    expect(verdictFor('ok', LIVE.certificate).kind).toBe('ok');
    expect(verdictFor('revoked', REVOKED.certificate).kind).toBe('revoked');
    expect(verdictFor('missing', null).kind).toBe('missing');
    expect(verdictFor('anything-else', null).kind).toBe('unreachable');
  });
});
