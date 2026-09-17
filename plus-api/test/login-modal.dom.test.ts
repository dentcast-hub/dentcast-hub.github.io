// @vitest-environment jsdom
// Drives the REAL shipped login modal (/plus/js/login-modal.js) through the
// three things the 2026-09-17 audit found it doing to readers: refusing a
// correct code typed from a Persian keyboard, reloading into the guest header
// after a login the browser had thrown away, and locking a new reader inside
// the nickname step with «ورود لازم است» and no way out.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number; body: any;
    constructor(status: number, body: any) { super((body && body.message) || 'API error'); this.status = status; this.body = body || {}; }
  }
  return {
    ApiError,
    verifyCalls: [] as string[],
    requestCalls: 0,
    verifyResult: {} as any,
    updateMeImpl: (async () => ({ display_name: 'x' })) as () => Promise<any>,
    me: null as any,
    status: 'anon' as string,
  };
});

vi.mock('/plus/js/api.js', () => ({
  ApiError: h.ApiError,
  api: {
    requestOtp: async () => { h.requestCalls += 1; return { ok: true }; },
    verifyOtp: async (_phone: string, code: string) => { h.verifyCalls.push(code); return h.verifyResult; },
    updateMe: () => h.updateMeImpl(),
  },
  currentUser: async () => h.me,
  meStatus: () => h.status,
}));

vi.mock('/plus/js/config.js', () => ({
  isOrgHost: () => false,
  irMirrorUrl: () => '',
  telegramLoginEnabled: () => false,
  telegramCallbackUrl: () => '',
  telegramBotUsername: () => '',
}));

beforeEach(() => {
  document.body.innerHTML = '';
  h.verifyCalls.length = 0;
  h.requestCalls = 0;
  h.verifyResult = { user: { id: 'u1', display_name: 'nick' }, is_new: false, return_to: '/plus/' };
  h.updateMeImpl = async () => ({ display_name: 'x' });
  h.me = { id: 'u1', display_name: 'nick' };
  h.status = 'user';
  vi.resetModules();
});

const tick = () => new Promise((r) => setTimeout(r, 0));
const q = <T extends Element>(sel: string) => document.querySelector(sel) as T;
const buttons = () => Array.from(document.querySelectorAll('button'));
const btn = (label: string) => buttons().find((b) => b.textContent === label) as HTMLButtonElement;

async function openAtCodeStep() {
  const { openLoginModal } = await import('/plus/js/login-modal.js');
  const done = openLoginModal({ returnTo: '/x' });
  q<HTMLInputElement>('input[type=tel]').value = '09121234567';
  btn('دریافت کد').click();
  await tick(); await tick();
  // Wrapped: an async function RETURNING a promise would await it (promise
  // flattening), and this one settles only when the modal closes.
  return { done };
}

describe('the code step', () => {
  it('folds a Persian-keyboard code before sending it', async () => {
    const { done } = await openAtCodeStep();
    const code = q<HTMLInputElement>('.dcp-input-code');
    code.value = ' ۱۲۳۴۵ ';
    btn('ورود').click();
    await tick(); await tick(); await tick();
    expect(h.verifyCalls).toEqual(['12345']);
    expect(await done).toMatchObject({ user: { id: 'u1' }, return_to: '/plus/' });
  });

  it('offers «ارسال دوباره» behind a countdown, and re-requests the same phone', async () => {
    await openAtCodeStep();
    const resend = buttons().find((b) => b.textContent!.startsWith('ارسال دوباره')) as HTMLButtonElement;
    expect(resend).toBeTruthy();
    expect(resend.disabled).toBe(true);
    expect(resend.textContent).toMatch(/\(۳۰\)/);
    resend.disabled = false; // the clock is real time; skip it
    resend.click();
    await tick(); await tick();
    expect(h.requestCalls).toBe(2);
    expect(q('.dcp-modal-step .dcp-modal-msg')!.textContent).toBe('کد دوباره فرستاده شد.');
  });

  it('says so when the browser kept no session, instead of closing into a guest reload', async () => {
    h.me = null; h.status = 'anon';
    let settled = false;
    const { done } = await openAtCodeStep();
    done.then(() => { settled = true; });
    q<HTMLInputElement>('.dcp-input-code').value = '12345';
    btn('ورود').click();
    await tick(); await tick(); await tick();
    expect(settled).toBe(false);
    expect(q('.dcp-modal-overlay')).toBeTruthy();
    expect(document.body.textContent).toContain('مرورگر شما نشست را نگه نداشت');
    expect(btn('ورود').disabled).toBe(false);
  });

  it('gives the benefit of the doubt when the API could not be asked after login', async () => {
    h.me = null; h.status = 'error';
    const { done } = await openAtCodeStep();
    q<HTMLInputElement>('.dcp-input-code').value = '12345';
    btn('ورود').click();
    await tick(); await tick(); await tick();
    expect(await done).toMatchObject({ user: { id: 'u1' } });
  });
});

describe('the nickname step for a new reader', () => {
  it('unlocks and returns to the code step when the session is gone (401), never a locked «ورود لازم است»', async () => {
    h.verifyResult = { user: { id: 'u2', display_name: '' }, is_new: true, return_to: '/plus/' };
    h.updateMeImpl = async () => { throw new h.ApiError(401, { error: 'unauthorized', message: 'ورود لازم است.' }); };
    await openAtCodeStep();
    q<HTMLInputElement>('.dcp-input-code').value = '12345';
    btn('ورود').click();
    await tick(); await tick(); await tick();
    // The name step is up and locked.
    expect(q('.dcp-modal-close')!.classList.contains('is-hidden')).toBe(true);
    const name = q<HTMLInputElement>('input[type=text]');
    expect(name).toBeTruthy();
    name.value = 'سارا';
    btn('ذخیره و ادامه').click();
    await tick(); await tick(); await tick();
    // Back at the code step, unlocked, with the reason on screen.
    expect(q('.dcp-modal-close')!.classList.contains('is-hidden')).toBe(false);
    expect(q('.dcp-input-code')).toBeTruthy();
    expect(document.body.textContent).toContain('مرورگر شما نشست را نگه نداشت');
    expect(document.body.textContent).not.toContain('ورود لازم است.');
  });

  it('still saves the name and resolves on the happy path', async () => {
    h.verifyResult = { user: { id: 'u2', display_name: '' }, is_new: true, return_to: '/plus/' };
    const { done } = await openAtCodeStep();
    q<HTMLInputElement>('.dcp-input-code').value = '12345';
    btn('ورود').click();
    await tick(); await tick(); await tick();
    q<HTMLInputElement>('input[type=text]').value = 'سارا';
    btn('ذخیره و ادامه').click();
    await tick(); await tick();
    expect(await done).toMatchObject({ user: { display_name: 'x', name_chosen: true } });
  });
});
