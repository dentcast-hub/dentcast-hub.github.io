// @vitest-environment jsdom
/**
 * THE PROFILE OVERLAY DRAWS THE READER'S SETTINGS, SO IT MUST DRAW THE CURRENT ONES.
 *
 * header.js builds the person menu once, from the /me that answered at boot, and
 * until 2026-10-03 «پروفایل» rendered the overlay from that snapshot every time
 * it was opened. The reminder matrix inside it (the «استریک از پیامک» switch
 * among others) therefore showed the state at page load, and the next tap sent
 * the opposite of what the reader saw. The overlay now renders from a FRESH /me
 * (currentUser({ refresh: true }), which also announces `dcp:me`), falling back
 * to the snapshot only when the API could not be asked.
 *
 * Drives the REAL header.js against a mocked api.js and a recording profile.js;
 * the rest of the header's neighbours are stubbed because none of them is what
 * is being asserted.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

let meCalls: Array<{ refresh: boolean }> = [];
let meNow: Record<string, unknown> | null = null;
vi.mock('/plus/js/api.js', () => ({
  api: { logout: async () => ({ ok: true }) },
  currentUser: ({ refresh = false } = {}) => {
    meCalls.push({ refresh });
    return Promise.resolve(meNow);
  },
  meStatus: () => (meNow ? 'user' : 'anon'),
}));

const rendered: Array<Record<string, unknown> | undefined> = [];
vi.mock('/plus/js/profile.js', () => ({
  renderProfile: async (_root: HTMLElement, opts: { me?: Record<string, unknown> } = {}) => { rendered.push(opts.me); },
}));
vi.mock('/plus/js/dashboard.js', () => ({ renderDashboard: async () => {} }));
vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: () => {}, openOrgNotice: () => {}, openNameGate: async ({ user }: { user: unknown }) => user,
  nameIsChosen: () => true,
}));
vi.mock('/plus/js/welcome.js', () => ({ maybeShowWelcome: () => {} }));
vi.mock('/plus/js/tour.js', () => ({
  startTour: () => {}, maybeOfferTour: () => {}, tourMenuAvailable: () => false, initTourAutostart: () => {},
}));
vi.mock('/plus/js/notif-prompt.js', () => ({ maybeShowNotifPrompt: () => false }));
vi.mock('/plus/js/push.js', () => ({ healPushSubscription: async () => {} }));
vi.mock('/plus/js/premium-popup.js', () => ({ maybeShowPremiumPopup: () => {} }));
vi.mock('/plus/js/notices.js', () => ({ renderNotices: async () => {}, NOTICES_SEEN_EVENT: 'dcp:notices-seen' }));
vi.mock('/plus/js/achievements.js', () => ({ maybeCelebrate: async () => {}, ACHIEVEMENTS_SEEN_EVENT: 'dcp:achievements-seen' }));
vi.mock('/plus/js/library-gate.js', () => ({ installLibraryGate: () => {} }));
vi.mock('/plus/js/page-back.js', () => ({ wirePageBack: () => {} }));

const { initHeader } = await import('/plus/js/header.js');
const { closeOverlay } = await import('/plus/js/overlay.js');

const user = (over: Record<string, unknown> = {}) => ({
  id: 'u1', display_name: 'مهسا', tier: 'premium', streak: 0,
  settings: { reminders: { streak: true }, notify_channels: { sms: { streak: false } } },
  ...over,
});

const tick = () => new Promise((r) => setTimeout(r, 0));

async function openProfileFromMenu() {
  const person = document.querySelector('.dcp-person-btn') as HTMLButtonElement;
  person.click();
  const item = Array.from(document.querySelectorAll('.dcp-person-item'))
    .find((b) => b.textContent === 'پروفایل') as HTMLButtonElement;
  expect(item).toBeTruthy();
  item.click();
  await tick(); await tick();
}

beforeEach(() => {
  closeOverlay();
  document.body.innerHTML = '<div class="dc-topbar"><div class="dc-topbar-actions"></div></div>';
  meCalls = [];
  rendered.length = 0;
});

describe('the profile overlay', () => {
  it('renders from a FRESH /me each time it opens, not from the boot snapshot', async () => {
    meNow = user();
    await initHeader();
    const booted = meCalls.length;

    // The reader switched the SMS streak on (another surface wrote it; /me now says so).
    meNow = user({ settings: { reminders: { streak: true }, notify_channels: { sms: { streak: true } } } });
    await openProfileFromMenu();

    expect(meCalls.slice(booted).some((c) => c.refresh)).toBe(true);
    expect(rendered).toHaveLength(1);
    const me = rendered[0] as { settings: { notify_channels: { sms: { streak: boolean } } } };
    expect(me.settings.notify_channels.sms.streak).toBe(true);

    // …and off again; a second opening sees that too (three rounds in the brief, two here).
    closeOverlay();
    meNow = user();
    await openProfileFromMenu();
    const again = rendered[1] as { settings: { notify_channels: { sms: { streak: boolean } } } };
    expect(again.settings.notify_channels.sms.streak).toBe(false);
  });

  it('falls back to the boot snapshot when the refreshed /me cannot be read, never to nothing', async () => {
    meNow = user();
    await initHeader();
    meNow = null; // the API could not be asked on reopen
    await openProfileFromMenu();
    expect(rendered).toHaveLength(1);
    expect((rendered[0] as { id: string }).id).toBe('u1');
  });
});
