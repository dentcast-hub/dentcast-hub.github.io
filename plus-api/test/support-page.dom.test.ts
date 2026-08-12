// @vitest-environment jsdom
// Drives the REAL shipped support page (/plus/js/support-page.js).
//
// What this file exists to protect is the PHOTO ROUND TRIP, which no API test
// can see: the reader ticks «عکسی دارم», submits, and has to end up somewhere
// that can actually take them to Telegram — and then, having left for the bank
// and come back, has to find that door a second time.
//
// Every assertion below corresponds to a way that trip was broken on
// 2026-08-12, all three of them silent:
//
//   · the tick was read AFTER the form was cleared, so the success panel was
//     always built as if no photo were coming and the Telegram button was
//     never created at all;
//   · the panel was painted into the OLD tree and then a refresh() rebuilt
//     root over it, so it survived about one frame; and
//   · the code row a returning reader lands on carried the reference and no
//     way to send anything, which is a dead end at the last step.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const TELEGRAM = 'https://t.me/dentcast_support';

let opened: Array<Record<string, unknown>> = [];
let tickets: Array<Record<string, unknown>> = [];
let nextTicket: Record<string, unknown> = {};
let threadTicket: Record<string, unknown> = {};

vi.mock('/plus/js/api.js', () => ({
  currentUser: () => Promise.resolve({ id: 'u1', tier: 'free' }),
  meStatus: () => 'ok',
  api: {
    ticketKinds: () => Promise.resolve({
      kinds: [
        { key: 'bug', title_fa: 'مشکل فنی', hint_fa: 'چه‌کاری کردید', locked: false },
        { key: 'billing', title_fa: 'مشکل در پرداخت', hint_fa: 'پرداخت کردید', locked: false },
        { key: 'student', title_fa: 'تخفیف دانشجویی', hint_fa: 'کارت دانشجویی', locked: false },
      ],
    }),
    tickets: () => Promise.resolve({ tickets }),
    ticket: () => Promise.resolve({ ticket: threadTicket, messages: [] }),
    openTicket: (body: Record<string, unknown>) => {
      opened.push(body);
      return Promise.resolve({ ticket: nextTicket });
    },
  },
}));

vi.mock('/plus/js/premium-cta.js', () => ({ unreachableGate: () => {} }));
vi.mock('/plus/js/login-modal.js', () => ({ openLoginModal: () => Promise.resolve(null) }));
vi.mock('/plus/js/pwa.js', () => ({ registerSW: () => {} }));

const settle = () => new Promise((r) => { setTimeout(r, 0); });

/**
 * Boot the page fresh and wait for its two API calls to land.
 *
 * The module exports nothing and runs itself on import (`main()` immediately,
 * since jsdom's document is already complete), so the root has to exist BEFORE
 * the import and the module registry has to be reset between cases — importing
 * once at the top would run the page against an empty document and every
 * assertion after it would read a blank root.
 */
async function boot(): Promise<HTMLElement> {
  document.body.innerHTML = '<div id="dcp-root"></div>';
  vi.resetModules();
  await import('/plus/js/support-page.js');
  await settle();
  await settle();
  return document.getElementById('dcp-root')!;
}

/** Fill the form and press ثبت درخواست, optionally ticking «عکسی دارم». */
async function submit(root: HTMLElement, withPhoto: boolean): Promise<void> {
  root.querySelector<HTMLInputElement>('input.dcp-input')!.value = 'موضوع';
  root.querySelector<HTMLTextAreaElement>('textarea')!.value = 'متن';
  if (withPhoto) {
    const chk = root.querySelector<HTMLInputElement>('#tk-photo')!;
    chk.checked = true;
    chk.dispatchEvent(new Event('change'));
  }
  const send = [...root.querySelectorAll('button')]
    .find((b) => b.textContent === 'ثبت درخواست')!;
  send.click();
  await settle();
  await settle();
  await settle();
}

const telegramLinks = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLAnchorElement>('a')].filter((a) => a.href.startsWith(TELEGRAM));

beforeEach(() => {
  opened = [];
  tickets = [];
  nextTicket = { id: 't1', reference: 'T-ABC-DEF', subject: 'موضوع', kind_title_fa: 'مشکل فنی' };
  threadTicket = {
    id: 't1', reference: 'T-ABC-DEF', subject: 'موضوع', status: 'open', has_photo: true,
  };
});

describe('the photo round trip', () => {
  it('tells the API a photo is coming — the tick is read before the form is cleared', async () => {
    const root = await boot();
    await submit(root, true);
    expect(opened).toHaveLength(1);
    expect(opened[0].has_photo).toBe(true);
  });

  it('SURVIVES the list refresh and offers Telegram, with the reference beside it', async () => {
    const root = await boot();
    await submit(root, true);

    // The panel is still on screen after the submit settles — it used to be
    // painted and then replaced by the refresh that followed it.
    const panel = root.querySelector('.dcp-support-success');
    expect(panel).not.toBeNull();
    expect(panel!.textContent).toContain('درخواست ثبت شد');
    expect(panel!.textContent).toContain('T-ABC-DEF');

    // And it carries the door, not just the instruction to find one.
    expect(telegramLinks(panel as HTMLElement).length).toBeGreaterThan(0);
  });

  it('offers no Telegram door when no photo was promised', async () => {
    const root = await boot();
    await submit(root, false);
    expect(opened[0].has_photo).toBe(false);
    const panel = root.querySelector('.dcp-support-success')!;
    expect(telegramLinks(panel as HTMLElement)).toHaveLength(0);
    expect(panel.textContent).toContain('اگر بعداً عکسی لازم شد');
  });
});

describe('coming back later — the reader who left for the bank', () => {
  it('gives an existing thread both its reference AND a way to send the photo', async () => {
    tickets = [{
      id: 't1', reference: 'T-ABC-DEF', subject: 'موضوع', kind_title_fa: 'مشکل در پرداخت',
      status: 'open', awaiting: 'founder', message_count: 1,
      last_at: '2026-08-12T10:00:00Z', has_photo: true,
    }];
    const root = await boot();

    // The list flags it, so the reader can see which request the photo is for.
    expect(root.textContent).toContain('📎 عکس در راه');

    // Opening the thread must hand them the code and the door together — the
    // success panel they saw on submit is long gone by now.
    root.querySelector<HTMLElement>('[data-ticket="t1"]')!
      .firstElementChild!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    await settle();

    const row = root.querySelector('.dcp-support-code-row')!;
    expect(row.textContent).toContain('T-ABC-DEF');
    expect(telegramLinks(row as HTMLElement).length).toBeGreaterThan(0);
  });
});

describe('the route chip is a door, not a kind', () => {
  it('links to the pricing page and never opens a ticket', async () => {
    const root = await boot();
    const chip = root.querySelector<HTMLAnchorElement>('.dcp-support-kind-route')!;
    expect(chip.tagName).toBe('A');
    expect(chip.getAttribute('href')).toBe('/plus/pricing.html');
    chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(opened).toHaveLength(0);
  });
});
