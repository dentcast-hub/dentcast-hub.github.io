// @vitest-environment jsdom
// Drives the REAL shipped heart (/plus/js/votes.js).
//
// Three of these pin rules that are decisions rather than implementation, and
// would each be an easy, invisible thing to "clean up" later:
//
//   · zero is never printed — «۰ ❤» announces that nobody cared, on exactly the
//     pages that most need a first reader;
//   · the request carries an explicit `vote`, never a toggle, so a retry after a
//     dropped connection repeats the press instead of undoing it;
//   · an optimistic press is reverted IN FULL when the server refuses, so a
//     heart nobody recorded is never left looking recorded.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let voteState = { hearts: 0, voted: false };
let user: unknown = { id: 'u1' };
let setVoteImpl: (id: string, vote: boolean) => Promise<unknown>;
const setVoteCalls: Array<{ id: string; vote: boolean }> = [];
let loginOpened = 0;
let loginResult: unknown = null;
let orgHost = false;

vi.mock('/plus/js/api.js', () => ({
  api: {
    votes: () => Promise.resolve(voteState),
    setVote: (id: string, vote: boolean) => {
      setVoteCalls.push({ id, vote });
      return setVoteImpl(id, vote);
    },
  },
  currentUser: () => Promise.resolve(user),
}));

vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: () => { loginOpened += 1; return Promise.resolve(loginResult); },
  openOrgNotice: () => Promise.resolve(null),
}));

vi.mock('/plus/js/config.js', () => ({ isOrgHost: () => orgHost }));

const ART = 'chairside/chairside-30';

/** Let the chip's own fetch-then-paint microtasks run. */
const settle = () => new Promise((r) => setTimeout(r, 0));

/** The row dc-nav.js builds above the prose (phase 7b), as the heart finds it. */
const ACTION_ROW =
  '<div id="dcActionRow" class="dc-actions">'
  + '<div class="dc-actions-main"></div><div class="dc-actions-aux"></div></div>';

async function mountRow(): Promise<HTMLElement> {
  const { initHeart } = await import('/plus/js/votes.js');
  document.body.innerHTML = ACTION_ROW;
  initHeart(ART);
  await settle();
  return document.querySelector('.dcp-heart') as HTMLElement;
}

beforeEach(() => {
  voteState = { hearts: 0, voted: false };
  user = { id: 'u1' };
  setVoteCalls.length = 0;
  loginOpened = 0;
  loginResult = null;
  orgHost = false;
  setVoteImpl = (_id, vote) => Promise.resolve({
    hearts: vote ? voteState.hearts + 1 : Math.max(0, voteState.hearts - 1),
    voted: vote,
  });
  document.body.innerHTML = '';
  vi.resetModules();
});

describe('the heart chip', () => {
  // In the MAIN group of the action row, never the quiet one: پسندیدم is
  // something the reader DOES with the page, not something the page reports
  // about itself. Filed as metadata beside «زمان مطالعه» it was invisible.
  it('mounts in the action row, in the group of things you can do', async () => {
    const btn = await mountRow();
    expect(btn).toBeTruthy();
    expect(btn.closest('.dc-actions-main')).toBeTruthy();
    expect(btn.closest('.dc-actions-aux')).toBeNull();
  });

  // Its own colour is what makes it a call to action rather than a third blue
  // pill; the class is what carries that, so it is not an implementation detail.
  it('wears the heart class, not the row default', async () => {
    const btn = await mountRow();
    expect(btn.classList.contains('dc-act-heart')).toBe(true);
  });

  it('says what it is, in a word', async () => {
    const btn = await mountRow();
    expect(btn.querySelector('.dcp-heart-label')!.textContent).toBe('پسندیدم');
  });

  it('spells the count out instead of leaving a bare number', async () => {
    voteState = { hearts: 9, voted: false };
    await mountRow();
    expect(document.querySelector('.dcp-like-count')!.textContent).toBe('۹ نفر پسندیده‌اند');
  });

  it('says nothing at all when nobody has pressed it', async () => {
    await mountRow();
    expect(document.querySelector('.dcp-like-count')!.textContent).toBe('');
  });

  it('mounts nowhere when the page has no action row', async () => {
    const { initHeart } = await import('/plus/js/votes.js');
    document.body.innerHTML = '<main></main>';
    expect(initHeart(ART)).toBe(false);
    expect(document.querySelector('.dcp-heart')).toBeNull();
  });

  it('does not mount twice', async () => {
    const { initHeart } = await import('/plus/js/votes.js');
    await mountRow();
    expect(initHeart(ART)).toBe(false);
    expect(document.querySelectorAll('.dcp-like').length).toBe(1);
  });

  it('never prints a zero', async () => {
    const btn = await mountRow();
    expect(btn.querySelector('.dcp-heart-num')!.textContent).toBe('');
  });

  it('prints a real count in Persian digits', async () => {
    voteState = { hearts: 23, voted: false };
    const btn = await mountRow();
    expect(btn.querySelector('.dcp-heart-num')!.textContent).toBe('۲۳');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it("shows the reader their own heart as pressed", async () => {
    voteState = { hearts: 24, voted: true };
    const btn = await mountRow();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.classList.contains('is-voted')).toBe(true);
  });

  it('shows the first heart the moment it is pressed', async () => {
    const btn = await mountRow();
    btn.click();
    await settle();
    expect(btn.querySelector('.dcp-heart-num')!.textContent).toBe('۱');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('sends the intent, not a toggle', async () => {
    voteState = { hearts: 5, voted: false };
    const btn = await mountRow();
    btn.click();
    await settle();
    expect(setVoteCalls).toEqual([{ id: ART, vote: true }]);

    setVoteImpl = () => Promise.resolve({ hearts: 5, voted: false });
    btn.click();
    await settle();
    expect(setVoteCalls[1]).toEqual({ id: ART, vote: false });
  });

  it('reverts the whole press when the server refuses', async () => {
    voteState = { hearts: 7, voted: false };
    setVoteImpl = () => Promise.reject(new Error('offline'));
    const btn = await mountRow();

    btn.click();
    await settle();

    expect(btn.querySelector('.dcp-heart-num')!.textContent).toBe('۷');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.classList.contains('is-voted')).toBe(false);
  });

  it('shows the count to a signed-out reader but sends them to login on a press', async () => {
    voteState = { hearts: 12, voted: false };
    user = null;
    const btn = await mountRow();
    expect(btn.querySelector('.dcp-heart-num')!.textContent).toBe('۱۲');

    btn.click();
    await settle();
    expect(loginOpened).toBe(1);
    expect(setVoteCalls).toEqual([]);
    // Not silently counted as a vote either.
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('picks the reader up where they left off after signing in', async () => {
    voteState = { hearts: 12, voted: false };
    user = null;
    const btn = await mountRow();

    loginResult = { user: { id: 'u1' } };
    voteState = { hearts: 12, voted: false };
    btn.click();
    await settle();
    expect(loginOpened).toBe(1);
    // The state was re-read rather than the chip left blank.
    expect(btn.querySelector('.dcp-heart-num')!.textContent).toBe('۱۲');
  });

  it('sends an .org reader to the notice instead of a login form', async () => {
    orgHost = true;
    const btn = await mountRow();
    btn.click();
    await settle();
    expect(loginOpened).toBe(0);
    expect(setVoteCalls).toEqual([]);
  });
});
