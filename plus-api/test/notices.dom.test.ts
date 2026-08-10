// @vitest-environment jsdom
// Drives the REAL shipped renderers (/plus/js/notices.js and the celebration in
// /plus/js/achievements.js).
//
// Three of the rules this feature rests on are purely visual, which means only a
// DOM test can hold them:
//
//   · the unread mark is a DOT, never a recolouring of the account icon. The
//     icon is the identity indicator (gray = guest, blue = signed in) and one
//     careless line turning it red costs a reader the ability to tell whether
//     they are even logged in.
//   · a notice row is a CARD, not a link — the same rule the highlight library
//     and collection boards follow — with an action only where there is somewhere
//     worth going.
//   · a level is a RING COLOUR, never the word «طلا». The celebration card is a
//     new surface and is exactly where that rule gets broken by accident.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const apiCalls: string[] = [];
const state = {
  notices: [] as unknown[],
  unread: 0,
  pending: [] as unknown[],
};

vi.mock('/plus/js/api.js', () => ({
  api: {
    notices: async () => { apiCalls.push('notices'); return { notices: state.notices, unread: state.unread }; },
    noticesSeen: async () => { apiCalls.push('noticesSeen'); return { ok: true }; },
    achievementsPending: async () => { apiCalls.push('pending'); return { items: state.pending }; },
    achievementsSeen: async () => { apiCalls.push('achievementsSeen'); return { ok: true }; },
  },
  currentUser: async () => null,
  ApiError: class extends Error {},
}));

const { renderNotices } = await import('/plus/js/notices.js');
const { maybeCelebrate } = await import('/plus/js/achievements.js');

const notice = (over: Record<string, unknown> = {}) => ({
  id: 'n1',
  kind: 'league',
  title: 'صعود کردی',
  body: 'هفته را در جایگاه ۱ بستی.',
  url: null,
  created_at: new Date().toISOString(),
  unread: true,
  ...over,
});

beforeEach(() => {
  document.body.replaceChildren();
  apiCalls.length = 0;
  state.notices = [];
  state.unread = 0;
  state.pending = [];
});

// ------------------------------------------------------------------ inbox ---

describe('the inbox', () => {
  it('draws a row as a card, and links only where there is somewhere to go', async () => {
    state.notices = [
      notice({ id: 'a', url: null }),
      notice({ id: 'b', kind: 'achievement', title: 'نشانِ تازه: شعله', url: '/plus/profile.html' }),
    ];
    state.unread = 2;
    const root = document.createElement('div');
    await renderNotices(root);

    const rows = root.querySelectorAll('.dcp-nt');
    expect(rows.length).toBe(2);
    // The row itself is never an anchor: its text IS the content, and most
    // notices have no destination at all.
    expect(root.querySelectorAll('a.dcp-nt')).toHaveLength(0);
    expect(rows[0].querySelectorAll('a')).toHaveLength(0);
    expect(rows[1].querySelector('a.dcp-nt-go')?.getAttribute('href'))
      .toBe('/plus/profile.html');
  });

  /**
   * A stored row outlives the mistake that wrote it. The collections
   * announcement went out with a full https://dentcast.ir/... link, and the
   * mirrors keep separate sessions — so for a reader signed in on .org that
   * link was a way out of their own account, on the one page (pricing) whose
   * content is personal. Rewriting at render time repairs the rows already
   * sitting in people's inboxes, not only the ones written afterwards.
   */
  it('keeps a link to our own site on the mirror the reader is already on', async () => {
    state.notices = [notice({ id: 'c', url: 'https://dentcast.ir/plus/pricing.html' })];
    const root = document.createElement('div');
    await renderNotices(root);

    const href = root.querySelector('a.dcp-nt-go')?.getAttribute('href');
    expect(href).toBe(location.origin + '/plus/pricing.html');
    expect(href).not.toContain('dentcast.ir');
  });

  it('does not touch a link that is not ours', async () => {
    const doi = 'https://doi.org/10.1016/j.prosdent.2020.01.001';
    state.notices = [notice({ id: 'd', url: doi })];
    const root = document.createElement('div');
    await renderNotices(root);

    expect(root.querySelector('a.dcp-nt-go')?.getAttribute('href')).toBe(doi);
  });

  it('moves the watermark as soon as the list is on screen', async () => {
    state.notices = [notice()];
    state.unread = 1;
    await renderNotices(document.createElement('div'));
    await new Promise((r) => setTimeout(r, 0));
    // Not on close: asking a reader to dismiss the panel "properly" to clear a
    // dot is a rule only we would know about.
    expect(apiCalls).toContain('noticesSeen');
  });

  it('does not write a watermark when there was nothing unread', async () => {
    state.notices = [notice({ unread: false })];
    state.unread = 0;
    await renderNotices(document.createElement('div'));
    await new Promise((r) => setTimeout(r, 0));
    expect(apiCalls).not.toContain('noticesSeen');
  });

  it('says something useful when the inbox is empty', async () => {
    const root = document.createElement('div');
    await renderNotices(root);
    expect(root.querySelector('.dcp-nt-empty')).toBeTruthy();
    expect(root.textContent).toContain('هنوز اطلاعیه‌ای نداری');
  });
});

// ------------------------------------------------------------ celebration ---

describe('the badge celebration', () => {
  const badge = (over: Record<string, unknown> = {}) => ({
    key: 'flame', title_fa: 'شعله', body_fa: 'هفت روزِ پشتِ هم.', icon: 'flame', metal: 'bronze', ...over,
  });

  it('shows nothing at all when /me reports no queue', async () => {
    await maybeCelebrate({ pending_achievements: 0 });
    expect(apiCalls).not.toContain('pending');
    expect(document.querySelector('.dcp-cel')).toBeNull();
  });

  it('names the badge and gives the catalog\'s own reason', async () => {
    state.pending = [badge()];
    await maybeCelebrate({ pending_achievements: 1 });
    const card = document.querySelector('.dcp-cel');
    expect(card).toBeTruthy();
    expect(card!.textContent).toContain('شعله');
    expect(card!.textContent).toContain('هفت روزِ پشتِ هم.');
  });

  it('shows the level as a ring colour and never as a word', async () => {
    state.pending = [badge({ metal: 'gold', body_fa: 'صد روز. این دیگر اسمش انضباط است.' })];
    await maybeCelebrate({ pending_achievements: 1 });
    const card = document.querySelector('.dcp-cel')!;
    expect(card.querySelector('.dcp-bg-disc.is-gold')).toBeTruthy();
    expect(card.textContent).not.toContain('طلا');
  });

  it('pages several badges through one card instead of stacking overlays', async () => {
    state.pending = [badge(), badge({ key: 'quill', title_fa: 'قلم', body_fa: 'اولین هایلایتت.' })];
    await maybeCelebrate({ pending_achievements: 2 });
    expect(document.querySelectorAll('.dcp-sheet-overlay')).toHaveLength(1);
    const card = document.querySelector('.dcp-cel')!;
    expect(card.textContent).toContain('۱ از ۲');

    const next = Array.from(card.querySelectorAll('button'))
      .find((b) => b.textContent === 'بعدی') as HTMLButtonElement;
    expect(next).toBeTruthy();
    next.click();
    expect(document.querySelector('.dcp-cel')!.textContent).toContain('قلم');
    // Acknowledged on dismissal, not on fetch: a reader who closed the tab
    // mid-card is offered it again, which is the right way round for the one
    // moment this whole feature exists to deliver.
    expect(apiCalls).not.toContain('achievementsSeen');
  });

  it('acknowledges the queue only when the card is dismissed', async () => {
    state.pending = [badge()];
    await maybeCelebrate({ pending_achievements: 1 });
    const seen = Array.from(document.querySelectorAll('.dcp-cel button'))
      .find((b) => b.textContent === 'دیدم') as HTMLButtonElement;
    seen.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(apiCalls).toContain('achievementsSeen');
  });

  it('draws a league medal with the shield, not a borrowed badge glyph', async () => {
    state.pending = [{
      key: 'medal:medal_gold', title_fa: 'طلای کامپوزیت',
      body_fa: 'اولِ گروهت شدی.', icon: null, metal: null,
    }];
    await maybeCelebrate({ pending_achievements: 1 });
    const card = document.querySelector('.dcp-cel')!;
    expect(card.querySelector('.dcp-md-shield')).toBeTruthy();
    expect(card.querySelector('.dcp-bg-disc')).toBeNull();
  });
});
