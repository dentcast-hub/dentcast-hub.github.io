// @vitest-environment jsdom
// Drives the REAL shipped gate (/plus/js/profile-page.js) for a signed-out
// visitor who arrived on a deep link.
//
// Four surfaces link into a profile section — the homepage premium rail and
// the exam page's passed card (#certificates), the homepage messenger chips
// (#connect), the monthly report (#achievements) — and all four used to land
// on one sentence that names none of them. What this file pins:
//   · each known hash names its own destination;
//   · an unknown hash, or none, renders EXACTLY the card that shipped before,
//     which is what makes the change additive;
//   · «ورود» leads and NO purchase link appears — these sections open on a
//     free account, and a signed-out visitor may be a subscriber who is not
//     logged in on this device (the 401/402 split);
//   · the terms sheet opens with no account at all;
//   · and returnTo carries the FRAGMENT, or a Telegram login (a real
//     redirect) comes back to the top of the profile instead of the section.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let loginCalls: Array<Record<string, unknown>> = [];

vi.mock('/plus/js/api.js', () => ({
  currentUser: () => Promise.resolve(null),
  meStatus: () => 'ok',
}));
vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: (opts: Record<string, unknown>) => { loginCalls.push(opts); return Promise.resolve(null); },
}));
vi.mock('/plus/js/profile.js', () => ({ renderProfile: () => Promise.resolve() }));
vi.mock('/plus/js/pwa.js', () => ({ registerSW: () => {} }));
vi.mock('/plus/js/premium-cta.js', () => ({ unreachableGate: () => {} }));

const settle = () => new Promise((r) => setTimeout(r, 0));

async function mount(hash: string) {
  document.body.innerHTML = '<div id="dcp-root"></div>';
  window.history.replaceState({}, '', '/plus/profile.html' + hash);
  const mod = await import('/plus/js/profile-page.js');
  const root = document.getElementById('dcp-root')!;
  root.replaceChildren(mod.gateCard(mod.gateKey(), () => {
    void mod; // the page's own handler is exercised through main() below
  }));
  return { root, mod };
}

const txt = () => document.getElementById('dcp-root')!.textContent!.replace(/\s+/g, ' ').trim();
const btn = (label: string) => Array.from(document.querySelectorAll('button'))
  .find((b) => b.textContent!.includes(label));

beforeEach(() => {
  vi.resetModules();
  loginCalls = [];
  document.body.innerHTML = '';
});

describe('the profile gate names its destination', () => {
  it('«#certificates» says what a certificate is, and offers the terms', async () => {
    await mount('#certificates');
    expect(document.querySelector('[data-gate-key]')!.getAttribute('data-gate-key')).toBe('certificates');
    expect(txt()).toContain('گواهی‌نامهٔ تکمیل مسیر');
    expect(txt()).toContain('کد یکتا');
    expect(btn('شرایط گواهی‌نامه')).toBeTruthy();
  });

  it('«#connect» and «#achievements» each say their own thing', async () => {
    await mount('#connect');
    expect(txt()).toContain('اتصال به بله و تلگرام');
    expect(btn('شرایط گواهی‌نامه')).toBeFalsy();

    await mount('#achievements');
    expect(txt()).toContain('افتخارها و نشان‌ها');
  });

  it('an unknown hash and no hash both give the card that shipped before', async () => {
    for (const hash of ['', '#nope', '#phone']) {
      await mount(hash);
      expect(txt(), hash || '(no hash)').toBe('برای دیدن پروفایل وارد شوید.ورود');
      expect(document.querySelector('[data-gate-key]')).toBeNull();
    }
  });

  it('never offers a purchase — the door wants a login, not a subscription', async () => {
    for (const hash of ['#certificates', '#connect', '#achievements', '']) {
      await mount(hash);
      expect(txt(), hash).not.toContain('پریمیوم');
      expect(txt(), hash).not.toContain('خرید');
      expect(document.querySelector('a[href*="pricing"]'), hash).toBeNull();
      expect(btn('ورود'), hash).toBeTruthy();
    }
  });

  it('the terms open with no account at all', async () => {
    await mount('#certificates');
    btn('شرایط گواهی‌نامه')!.click();
    await settle();
    const sheet = document.querySelector('.dcp-sheet')!;
    expect(sheet).toBeTruthy();
    expect(sheet.textContent).toContain('ثبت‌نام');
    expect(sheet.textContent).toContain('پریمیوم'); // said as a CONDITION, inside the sheet
  });
});

describe('the deep link survives the sign-in', () => {
  it('returnTo carries the fragment', async () => {
    document.body.innerHTML = '<div id="dcp-root"></div>';
    window.history.replaceState({}, '', '/plus/profile.html#certificates');
    await import('/plus/js/profile-page.js');
    await settle();
    btn('ورود')!.click();
    await settle();
    expect(loginCalls).toHaveLength(1);
    expect(loginCalls[0].returnTo).toBe('/plus/profile.html#certificates');
  });

  it('and is the bare path when there is no fragment', async () => {
    document.body.innerHTML = '<div id="dcp-root"></div>';
    window.history.replaceState({}, '', '/plus/profile.html');
    await import('/plus/js/profile-page.js');
    await settle();
    btn('ورود')!.click();
    await settle();
    expect(loginCalls[0].returnTo).toBe('/plus/profile.html');
  });
});
