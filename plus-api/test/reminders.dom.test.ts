// @vitest-environment jsdom
// Drives the REAL shipped renderer (/plus/js/reminders.js) — the profile's
// «یادآوری‌ها» section: the master switch and the «از کجا برسد» matrix.
//
// The rules only a DOM test can hold:
//   · the پیامک row is drawn for EVERY reader and is amber, and its «مطلب جدید»
//     cell is a dash — never an unchecked box, which would promise a thing the
//     registered template cannot carry;
//   · a free reader's tap on the پیامک box opens the gate and writes NOTHING;
//   · a premium reader without a phone sees the row greyed with the reason,
//     not a missing row;
//   · every write sends the WHOLE `notify_channels` object (PATCH /me merges
//     `settings` one level deep);
//   · the master switch still writes `reminders` whole, both keys together;
//   · and a tick CARRIES the master key for its kind when that key is off —
//     the matrix picks a channel, the master decides whether the reminder
//     happens at all, and a tick that saves into silence is what two readers
//     hit on 2026-09-18.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const calls: Array<Record<string, unknown>> = [];
const sheets: string[] = [];
const pushCalls: string[] = [];

vi.mock('/plus/js/api.js', () => ({
  api: { updateMe: async (patch: Record<string, unknown>) => { calls.push(patch); return {}; } },
  currentUser: async () => null,
  ApiError: class extends Error {},
}));
vi.mock('/plus/js/push.js', () => ({
  pushSupported: () => true,
  ensurePushSubscription: async () => { pushCalls.push('ensure'); return 'ok'; },
  removePushSubscription: async () => { pushCalls.push('remove'); },
}));
vi.mock('/plus/js/config.js', () => ({ baleEnabled: () => true }));
vi.mock('/plus/js/sheet.js', () => ({
  openSheet: (card: HTMLElement) => { sheets.push(card.getAttribute('aria-label') || ''); },
  gateCard: ({ title }: { title: string }) => {
    const d = document.createElement('div');
    d.setAttribute('aria-label', title);
    return d;
  },
}));
vi.mock('/plus/js/premium-cta.js', () => ({ premiumCta: () => document.createElement('a') }));

const { remindersBlock, channelPrefs, maskPhone } = await import('/plus/js/reminders.js');

const me = (over: Record<string, unknown> = {}) => ({
  tier: 'premium',
  phone: '09121234561',
  bale_linked: true,
  settings: { reminders: { new_content: true, streak: true } },
  ...over,
});

const row = (root: HTMLElement, i: number) => root.querySelectorAll('tbody tr')[i] as HTMLTableRowElement;
const boxes = (tr: HTMLTableRowElement) => Array.from(tr.querySelectorAll('input.dcp-rem-box')) as HTMLInputElement[];
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  calls.length = 0;
  sheets.length = 0;
  pushCalls.length = 0;
  document.body.innerHTML = '';
  Object.defineProperty(globalThis, 'Notification', { value: { permission: 'granted' }, configurable: true });
});

describe('channelPrefs / maskPhone (pure)', () => {
  it('fills the defaults: browser and Bale on, SMS off', () => {
    expect(channelPrefs({})).toEqual({
      webpush: { new_content: true, streak: true },
      bale: { new_content: true, streak: true },
      sms: { streak: false },
    });
    expect(channelPrefs({ notify_channels: { bale: { streak: false }, sms: { streak: true } } }).bale.streak).toBe(false);
    expect(channelPrefs({ notify_channels: { sms: { streak: true } } }).sms.streak).toBe(true);
  });

  it('masks a phone to its first and last four digits, in Persian digits', () => {
    expect(maskPhone('09121234561')).toBe('۰۹۱۲···۴۵۶۱');
  });
});

describe('the matrix', () => {
  it('draws three rows; the پیامک row is amber, streak-only, with a dash under «مطلب جدید»', () => {
    const root = remindersBlock(me());
    document.body.appendChild(root);
    const rows = root.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(row(root, 0).textContent).toContain('مرورگر');
    expect(row(root, 1).textContent).toContain('بله');
    const sms = row(root, 2);
    expect(sms.classList.contains('is-premium')).toBe(true);
    expect(sms.textContent).toContain('پیامک');
    expect(sms.querySelector('.dcp-rem-tag')?.textContent).toBe('پریمیوم');
    expect(sms.querySelector('.dcp-rem-dash')).not.toBeNull();
    const smsBoxes = boxes(sms);
    expect(smsBoxes).toHaveLength(1);
    expect(smsBoxes[0].classList.contains('is-amber')).toBe(true);
    expect(smsBoxes[0].checked).toBe(false); // opt-in: absent means off
    expect(sms.textContent).toContain('۰۹۱۲···۴۵۶۱');
  });

  it('a premium reader ticking پیامک writes the WHOLE notify_channels object and leaves reminders alone', async () => {
    const root = remindersBlock(me());
    document.body.appendChild(root);
    const box = boxes(row(root, 2))[0];
    box.click();
    await tick();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      settings: {
        notify_channels: {
          webpush: { new_content: true, streak: true },
          bale: { new_content: true, streak: true },
          sms: { streak: true },
        },
      },
    });
    expect((calls[0].settings as Record<string, unknown>).reminders).toBeUndefined();
  });

  it('a tick carries the master key when that key is off — the matrix alone cannot deliver', async () => {
    // The state the profile draws as fully live while the streak column is dead:
    // the master renders on `new_content || streak`, so new_content alone lights
    // it. Ticking پیامک here used to write a preference that nothing would read.
    const root = remindersBlock(me({ settings: { reminders: { new_content: true, streak: false } } }));
    document.body.appendChild(root);
    const master = root.querySelector('#dcp-rem-master') as HTMLInputElement;
    expect(master.checked).toBe(true); // lit by new_content — this is the trap

    boxes(row(root, 2))[0].click();
    await tick();

    // Both halves, and the master one FIRST: the channel is worthless without it.
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual({ settings: { reminders: { new_content: true, streak: true } } });
    const written = (calls[1].settings as { notify_channels: Record<string, Record<string, boolean>> }).notify_channels;
    expect(written.sms).toEqual({ streak: true });
  });

  it('a tick does NOT touch the master when it is already on', async () => {
    const root = remindersBlock(me());
    document.body.appendChild(root);
    boxes(row(root, 2))[0].click();
    await tick();
    expect(calls).toHaveLength(1);
    expect((calls[0].settings as Record<string, unknown>).reminders).toBeUndefined();
  });

  it('opening the profile never signs a reader up for a kind they did not ask for', async () => {
    // The repair is on the TICK, never on render: `{new_content:false}` is a
    // reader who declined article notices, not a state to quietly fix for them.
    const root = remindersBlock(me({ settings: { reminders: { new_content: false, streak: true } } }));
    document.body.appendChild(root);
    await tick();
    expect(calls).toHaveLength(0);
  });

  it('a free reader tapping پیامک gets the gate and nothing is written', async () => {
    const root = remindersBlock(me({ tier: 'free' }));
    document.body.appendChild(root);
    const box = boxes(row(root, 2))[0];
    expect(box.disabled).toBe(false); // drawn live so it can be wanted
    box.click();
    await tick();
    expect(box.checked).toBe(false);
    expect(sheets).toEqual(['پیامکِ استریک ویژه‌ی پریمیوم است']);
    expect(calls).toHaveLength(0);
  });

  it('a premium reader with no phone keeps the row, greyed, with the reason and a way to fix it', () => {
    const root = remindersBlock(me({ phone: null }));
    document.body.appendChild(root);
    const sms = row(root, 2);
    expect(sms.classList.contains('is-muted')).toBe(true);
    expect(boxes(sms)[0].disabled).toBe(true);
    expect(sms.textContent).toContain('شماره ثبت نشده');
    expect(sms.querySelector('a[href="#phone"]')).not.toBeNull();
  });

  it('an unlinked Bale row is greyed with a link to the messenger section', () => {
    const root = remindersBlock(me({ bale_linked: false }));
    document.body.appendChild(root);
    const bale = row(root, 1);
    expect(bale.classList.contains('is-muted')).toBe(true);
    expect(boxes(bale).every((b) => b.disabled)).toBe(true);
    expect(bale.querySelector('a[href="#connect"]')).not.toBeNull();
  });

  it('switching Bale off for streak only writes that flag and keeps its sibling on', async () => {
    const root = remindersBlock(me());
    document.body.appendChild(root);
    const [, streak] = boxes(row(root, 1));
    streak.click();
    await tick();
    const written = (calls[0].settings as { notify_channels: Record<string, Record<string, boolean>> }).notify_channels;
    expect(written.bale).toEqual({ new_content: true, streak: false });
    expect(written.webpush).toEqual({ new_content: true, streak: true });
  });

  it('turning a browser cell on while permission is not granted asks for the subscription first', async () => {
    Object.defineProperty(globalThis, 'Notification', { value: { permission: 'default' }, configurable: true });
    const root = remindersBlock(me({ settings: { reminders: { streak: true }, notify_channels: { webpush: { streak: false } } } }));
    document.body.appendChild(root);
    const [, streak] = boxes(row(root, 0));
    expect(streak.checked).toBe(false);
    streak.click();
    await tick();
    expect(pushCalls).toContain('ensure');
    expect(calls).toHaveLength(1);
  });
});

describe('the master switch', () => {
  it('reflects the stored state, dims the matrix when off, and writes both reminders keys together', async () => {
    const root = remindersBlock(me({ settings: { reminders: { new_content: false, streak: false } } }));
    document.body.appendChild(root);
    const master = root.querySelector('#dcp-rem-master') as HTMLInputElement;
    const matrix = root.querySelector('.dcp-rem-matrix') as HTMLElement;
    expect(master.checked).toBe(false);
    expect(matrix.classList.contains('is-off')).toBe(true);

    master.click();
    await tick();
    expect(matrix.classList.contains('is-off')).toBe(false);
    expect(pushCalls).toEqual(['ensure']);
    expect(calls[0]).toEqual({ settings: { reminders: { new_content: true, streak: true } } });

    master.click();
    await tick();
    expect(matrix.classList.contains('is-off')).toBe(true);
    expect(calls[1]).toEqual({ settings: { reminders: { new_content: false, streak: false } } });
    expect(pushCalls).toEqual(['ensure', 'remove']);
  });
});
