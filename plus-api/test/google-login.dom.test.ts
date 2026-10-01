// @vitest-environment jsdom
// Drives the REAL shipped login modal (/plus/js/login-modal.js) and the Google
// button module (/plus/js/google-login.js) with Google login ENABLED, through a
// fake `window.google` — Google's script cannot load under jsdom, and the
// contract that matters is ours: where the button is drawn, what we ask Google
// for, and what the modal does with the token it hands back.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number; body: any;
    constructor(status: number, body: any) { super((body && body.message) || 'API error'); this.status = status; this.body = body || {}; }
  }
  return {
    ApiError,
    googleCalls: [] as Array<{ credential: string; return_to: string }>,
    googleImpl: (async () => ({})) as (c: string, r: string) => Promise<any>,
    updateMeImpl: (async () => ({ display_name: 'x' })) as () => Promise<any>,
    me: null as any,
    status: 'anon' as string,
    telegram: false,
    google: true,
  };
});

vi.mock('/plus/js/api.js', () => ({
  ApiError: h.ApiError,
  api: {
    requestOtp: async () => ({ ok: true }),
    verifyOtp: async () => ({}),
    googleLogin: async (credential: string, return_to: string) => {
      h.googleCalls.push({ credential, return_to });
      return h.googleImpl(credential, return_to);
    },
    updateMe: () => h.updateMeImpl(),
  },
  currentUser: async () => h.me,
  meStatus: () => h.status,
}));

vi.mock('/plus/js/config.js', () => ({
  isOrgHost: () => false,
  irMirrorUrl: () => '',
  telegramLoginEnabled: () => h.telegram,
  telegramCallbackUrl: () => 'https://api.example/auth/telegram/callback',
  telegramBotUsername: () => 'Dentcast_bot',
  googleLoginEnabled: () => h.google,
  GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
}));

// A stand-in for accounts.google.com/gsi/client: records initialize() and
// renderButton(), draws a button we can press, and keeps the callback so a
// test can hand the page a "credential" the way Google would.
type Gsi = {
  initialize: ReturnType<typeof vi.fn>;
  renderButton: ReturnType<typeof vi.fn>;
  callback: ((r: { credential: string }) => void) | null;
};
function installFakeGoogle(): Gsi {
  const g: Gsi = { initialize: vi.fn(), renderButton: vi.fn(), callback: null };
  g.initialize.mockImplementation((cfg: any) => { g.callback = cfg.callback; });
  g.renderButton.mockImplementation((holder: HTMLElement, opts: any) => {
    const b = document.createElement('div');
    b.setAttribute('role', 'button');
    b.className = 'fake-gsi';
    b.textContent = opts.text;
    holder.appendChild(b);
  });
  (window as any).google = { accounts: { id: g } };
  return g;
}

beforeEach(() => {
  document.body.innerHTML = '';
  // The GSI loader appends its <script> to <head>, which resetting the body
  // never clears; drop any from an earlier case so counts are per test.
  document.head.querySelectorAll('script[src^="https://accounts.google.com"]').forEach((s) => s.remove());
  document.documentElement.removeAttribute('data-theme');
  delete (window as any).google;
  h.googleCalls.length = 0;
  h.googleImpl = async () => ({ user: { id: 'u1', display_name: 'nick' }, is_new: false, return_to: '/x' });
  h.updateMeImpl = async () => ({ display_name: 'x' });
  h.me = { id: 'u1', display_name: 'nick' };
  h.status = 'user';
  h.telegram = false;
  h.google = true;
  vi.resetModules();
});

const tick = () => new Promise((r) => setTimeout(r, 0));
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const q = <T extends Element>(sel: string) => document.querySelector(sel) as T;

async function openModal() {
  const { openLoginModal } = await import('/plus/js/login-modal.js');
  const done = openLoginModal({ returnTo: '/insight/insight-1.html' });
  await frame(); await tick();
  return { done };
}

describe('the login modal with Google enabled', () => {
  it('draws the Google holder above the phone step and asks Google for the approved button', async () => {
    const g = installFakeGoogle();
    await openModal();
    const holder = q<HTMLElement>('[data-dc-google-login]');
    expect(holder).toBeTruthy();
    // Above «یا با شماره موبایل» and the phone input, inside the quick block.
    const card = q<HTMLElement>('.dcp-modal-card');
    const order = Array.from(card.querySelectorAll('[data-dc-google-login], .dcp-modal-or, input[type=tel]'));
    expect(order.map((n) => n.tagName === 'INPUT' ? 'tel' : (n.hasAttribute('data-dc-google-login') ? 'google' : 'or')))
      .toEqual(['google', 'or', 'tel']);
    expect(q('.dcp-tg-caption').textContent).toBe('ورود سریع با گوگل');
    expect(q('.dcp-modal-sub').textContent).toBe('با گوگل وارد شوید، یا از شماره موبایل استفاده کنید.');

    expect(g.initialize).toHaveBeenCalledTimes(1);
    const init = g.initialize.mock.calls[0][0];
    expect(init.client_id).toBe('test-client-id.apps.googleusercontent.com');
    expect(init.ux_mode).toBe('popup'); // no redirect, no auth-url: a token in a callback
    expect(init.auto_select).toBe(false);

    expect(g.renderButton).toHaveBeenCalledTimes(1);
    const [target, opts] = g.renderButton.mock.calls[0];
    expect(target).toBe(holder);
    // The approved mockup: full width, rectangular (10px corners come from
    // Google's own rectangular shape), Persian label, light theme = outline.
    expect(opts).toMatchObject({ type: 'standard', shape: 'rectangular', size: 'large', locale: 'fa', text: 'signin_with', theme: 'outline' });
    expect(opts.width).toBeGreaterThanOrEqual(200);
    expect(opts.width).toBeLessThanOrEqual(400);
    expect(q('.fake-gsi')).toBeTruthy();
  });

  it('names both providers when Telegram is enabled beside it', async () => {
    h.telegram = true;
    installFakeGoogle();
    await openModal();
    expect(q('.dcp-tg-caption').textContent).toBe('ورود سریع');
    expect(q('.dcp-modal-sub').textContent).toBe('با تلگرام یا گوگل وارد شوید، یا از شماره موبایل استفاده کنید.');
    expect(q('.dcp-tg-holder')).toBeTruthy();
    expect(q('[data-dc-google-login]')).toBeTruthy();
  });

  it('draws nothing of Google where it is not enabled (.ir), exactly the old modal', async () => {
    h.google = false;
    installFakeGoogle();
    await openModal();
    expect(q('[data-dc-google-login]')).toBeNull();
    expect(q('.dcp-tg-caption')).toBeNull();
    expect(q('.dcp-modal-sub').textContent).toBe('با شماره موبایل وارد شوید. کد یکبار مصرف برایتان ارسال می‌شود.');
  });

  it('asks for the dark button in the dark theme', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const g = installFakeGoogle();
    await openModal();
    expect(g.renderButton.mock.calls[0][1].theme).toBe('filled_black');
  });

  it('posts the credential with return_to and closes with the user for a returning reader', async () => {
    const g = installFakeGoogle();
    const { done } = await openModal();
    g.callback!({ credential: 'eyJ.fake.token' });
    await tick(); await tick();
    expect(h.googleCalls).toEqual([{ credential: 'eyJ.fake.token', return_to: '/insight/insight-1.html' }]);
    const res = await done;
    expect(res).toEqual({ user: { id: 'u1', display_name: 'nick' }, return_to: '/x' });
    expect(q('.dcp-modal-overlay')).toBeNull();
  });

  it('a new account goes to the mandatory nickname step, Google block and phone step gone', async () => {
    h.googleImpl = async () => ({ user: { id: 'u9', display_name: '' }, is_new: true, return_to: '/x' });
    h.me = { id: 'u9', display_name: '' };
    const g = installFakeGoogle();
    const { done } = await openModal();
    g.callback!({ credential: 'eyJ.fake.token' });
    await tick(); await tick();
    expect(q('[data-dc-google-login]')).toBeNull();
    expect(q('input[type=tel]')).toBeNull();
    const nameInput = q<HTMLInputElement>('.dcp-modal-step input.dcp-input');
    expect(nameInput).toBeTruthy();
    expect(nameInput.value).toBe(''); // never a pre-filled generated name
    // Locked: × hidden until a name is saved.
    expect(q('.dcp-modal-close').classList.contains('is-hidden')).toBe(true);
    nameInput.value = 'سارا';
    (Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'ذخیره و ادامه') as HTMLButtonElement).click();
    await tick(); await tick();
    const res: any = await done;
    expect(res.user.display_name).toBe('x');
  });

  it('a session the browser threw away is said on the Google row, not reloaded into', async () => {
    h.me = null; h.status = 'anon';
    const g = installFakeGoogle();
    await openModal();
    g.callback!({ credential: 'eyJ.fake.token' });
    await tick(); await tick();
    const msg = q<HTMLElement>('[data-dc-google-login] + .dcp-modal-msg');
    expect(msg.textContent).toMatch(/نشست را نگه نداشت/);
    expect(q('.dcp-modal-overlay')).toBeTruthy();
  });

  it("shows the API's Persian sentence when the token is refused", async () => {
    h.googleImpl = async () => { throw new h.ApiError(409, { error: 'google_taken', message: 'این حساب گوگل قبلاً به یک حساب دیگر متصل است.' }); };
    const g = installFakeGoogle();
    await openModal();
    g.callback!({ credential: 'eyJ.fake.token' });
    await tick(); await tick();
    expect(q('[data-dc-google-login] + .dcp-modal-msg').textContent).toBe('این حساب گوگل قبلاً به یک حساب دیگر متصل است.');
    expect(q('input[type=tel]')).toBeTruthy(); // the other doors stay open
  });

  it('says so when the Google script cannot load, instead of leaving a gap', async () => {
    // No window.google: the module injects a <script>; fire its error.
    await openModal();
    const s = document.querySelector('script[src^="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
    expect(s).toBeTruthy();
    s.onerror!(new Event('error'));
    await tick();
    expect(q('[data-dc-google-login] + .dcp-modal-msg').textContent).toMatch(/بارگذاری نشد/);
  });
});

describe('google-login.js', () => {
  it('mountGoogleButton draws nothing and returns false where Google login is off', async () => {
    h.google = false;
    const g = installFakeGoogle();
    const { mountGoogleButton } = await import('/plus/js/google-login.js');
    const holder = document.createElement('div');
    document.body.appendChild(holder);
    expect(mountGoogleButton(holder, { onCredential: () => {} })).toBe(false);
    await frame(); await tick();
    expect(g.renderButton).not.toHaveBeenCalled();
  });

  it('loads Google\'s script exactly once across callers', async () => {
    const { loadGsi } = await import('/plus/js/google-login.js');
    const p1 = loadGsi();
    const p2 = loadGsi();
    expect(document.querySelectorAll('script[src^="https://accounts.google.com/gsi/client"]')).toHaveLength(1);
    installFakeGoogle();
    (document.querySelector('script[src^="https://accounts.google.com/gsi/client"]') as HTMLScriptElement).onload!(new Event('load'));
    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toBe(b);
  });
});
