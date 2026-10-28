// @vitest-environment jsdom
// Every modal surface declared role=dialog + aria-modal and none held focus:
// Tab walked the page behind the backdrop and closing dropped focus on <body>
// (QA, 2026-10-28). Drives the REAL sheet (/plus/js/sheet.js), which shares
// focus-trap.js with the welcome card, the premium popup and the login modal.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('/plus/js/api.js', () => ({ meStatus: () => 'user' }));
vi.mock('/plus/js/login-modal.js', () => ({ openLoginModal: () => Promise.resolve(null) }));

const { openSheet, closeSheet, gateCard } = await import('/plus/js/sheet.js');
const { trapFocus } = await import('/plus/js/focus-trap.js');

const tab = (shift = false) => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }));
const esc = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

beforeEach(() => {
  closeSheet({ restoreFocus: false });
  document.body.innerHTML = '<button id="opener">باز کن</button><a id="behind" href="/x">پشت</a>';
});

function card() {
  const a = document.createElement('a'); a.href = '/plus/pricing.html'; a.className = 'dcp-btn'; a.textContent = 'خرید';
  return gateCard({ title: 'عنوان', sub: 'توضیح', cta: a });
}

describe('the sheet is one dialog that holds focus', () => {
  it('exactly one role=dialog, named from the card', () => {
    openSheet(card());
    const dialogs = document.querySelectorAll('[role="dialog"]');
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0].classList.contains('dcp-sheet')).toBe(true);
    expect(dialogs[0].getAttribute('aria-modal')).toBe('true');
    expect(dialogs[0].getAttribute('aria-label')).toBe('عنوان');
  });

  it('moves focus in, keeps Tab inside, and Escape hands it back to the opener', () => {
    const opener = document.getElementById('opener') as HTMLButtonElement;
    opener.focus();
    openSheet(card());
    const sheet = document.querySelector('.dcp-sheet')!;
    expect(sheet.contains(document.activeElement)).toBe(true);
    tab(); tab(); tab(true);
    expect(sheet.contains(document.activeElement)).toBe(true);
    esc();
    expect(document.activeElement).toBe(opener);
  });

  it('a sheet replacing another returns focus to the FIRST opener', () => {
    const opener = document.getElementById('opener') as HTMLButtonElement;
    opener.focus();
    openSheet(card());
    openSheet(card());
    esc();
    expect(document.activeElement).toBe(opener);
  });
});

describe('trapFocus', () => {
  it('wraps from last to first and back', () => {
    const d = document.createElement('div');
    d.innerHTML = '<button id="a">a</button><button id="b">b</button>';
    document.body.appendChild(d);
    const release = trapFocus(d);
    expect(document.activeElement!.id).toBe('a');
    tab(true);
    expect(document.activeElement!.id).toBe('b');
    tab();
    expect(document.activeElement!.id).toBe('a');
    release();
  });
});
