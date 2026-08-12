// @vitest-environment jsdom
// Drives the REAL shipped block (/plus/js/article-threads.js).
//
// Three behaviours carry this feature and none of them is visible from the API
// tests:
//
//   · with nothing published and no way to write, the block REMOVES ITSELF —
//     444 articles wearing an empty comment box reads as a dead site, and that
//     is the whole reason publishing is a founder decision here,
//   · a signed-out visitor still reads a published thread (it is part of the
//     page now), and
//   · the warning that the founder may publish is shown BEFORE the reader
//     writes, not after it happens.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let publicImpl: () => Promise<{ threads: unknown[] }>;
let mineImpl: () => Promise<{ thread: unknown; messages: unknown[] }>;
let user: { tier: string } | null = null;
const posted: Array<{ contentId: string; body: string }> = [];

vi.mock('/plus/js/api.js', () => ({
  currentUser: () => Promise.resolve(user),
  api: {
    publicThreads: () => publicImpl(),
    myThread: () => mineImpl(),
    postThread: (contentId: string, body: string) => {
      posted.push({ contentId, body });
      return Promise.resolve({ ok: true });
    },
  },
}));

const { mountArticleThreads } = await import('/plus/js/article-threads.js');

const msg = (author: string, body: string) =>
  ({ author, body, created_at: '2026-08-12T10:00:00Z' });

function anchor(): HTMLElement {
  document.body.innerHTML = '<main><div class="prose" id="p">متن</div></main>';
  return document.getElementById('p')!;
}

// The module draws behind an IntersectionObserver; jsdom has none, so the
// module's own fallback path runs it immediately. Assert on that.
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  user = null;
  posted.length = 0;
  publicImpl = () => Promise.resolve({ threads: [] });
  mineImpl = () => Promise.resolve({ thread: null, messages: [] });
});

describe('the block earns its place or leaves', () => {
  it('removes itself when nothing is published and the reader cannot write', async () => {
    const a = anchor();
    expect(mountArticleThreads(a, 'notecast/n-1')).toBe(true);
    await settle();
    expect(document.querySelector('.dc-threads')).toBeNull();
  });

  it('removes itself for a signed-in FREE reader too — no advert-only block', async () => {
    user = { tier: 'free' };
    mountArticleThreads(anchor(), 'notecast/n-1');
    await settle();
    expect(document.querySelector('.dc-threads')).toBeNull();
  });

  it('stays for a premium reader, because they can start the conversation', async () => {
    user = { tier: 'premium' };
    mountArticleThreads(anchor(), 'notecast/n-1');
    await settle();
    expect(document.querySelector('.dc-threads')).not.toBeNull();
    expect(document.querySelector('.dc-th-input')).not.toBeNull();
  });
});

describe('a published thread is part of the page', () => {
  const PUBLISHED = {
    threads: [{
      id: 't1',
      content_id: 'notecast/n-1',
      author_name: 'کنجکاوِ مینا',
      made_public_at: '2026-08-12T10:00:00Z',
      messages: [msg('user', 'سؤال من'), msg('founder', 'جواب من')],
    }],
  };

  it('renders for a signed-out visitor, with the pseudonym and both sides', async () => {
    publicImpl = () => Promise.resolve(PUBLISHED);
    mountArticleThreads(anchor(), 'notecast/n-1');
    await settle();

    const block = document.querySelector('.dc-threads')!;
    expect(block).not.toBeNull();
    expect(block.textContent).toContain('کنجکاوِ مینا');
    expect(block.textContent).toContain('سؤال من');
    expect(block.textContent).toContain('جواب من');
    expect(block.textContent).toContain('دکتر شهابیان');
    // Nothing to write with, but the upsell rides beside real content.
    expect(document.querySelector('.dc-th-input')).toBeNull();
    expect(document.querySelector('.dc-th-gate')).not.toBeNull();
  });

  it('never asks a free reader for a session it does not need', async () => {
    publicImpl = () => Promise.resolve(PUBLISHED);
    const seen: string[] = [];
    mineImpl = () => { seen.push('mine'); return Promise.resolve({ thread: null, messages: [] }); };
    mountArticleThreads(anchor(), 'notecast/n-1');
    await settle();
    expect(seen).toEqual([]); // signed out -> /threads/mine is never called
  });
});

describe('the reader is told before they write, not after', () => {
  it('warns that the founder may publish, while the box is still empty', async () => {
    user = { tier: 'premium' };
    mountArticleThreads(anchor(), 'notecast/n-1');
    await settle();
    const note = document.querySelector('.dc-th-compose .dc-th-note')!;
    expect(note.textContent).toContain('عمومی');
    expect(note.textContent).toContain('خصوصی');
  });

  it('shows a premium reader their own private thread, marked as private', async () => {
    user = { tier: 'premium' };
    mineImpl = () => Promise.resolve({
      thread: { id: 't9', content_id: 'notecast/n-1', is_public: false },
      messages: [msg('user', 'حرف خودم')],
    });
    mountArticleThreads(anchor(), 'notecast/n-1');
    await settle();
    const mine = document.querySelector('.dc-th-mine')!;
    expect(mine.textContent).toContain('خصوصی');
    expect(mine.textContent).toContain('حرف خودم');
  });

  it('sends the comment and refuses an empty one', async () => {
    user = { tier: 'premium' };
    mountArticleThreads(anchor(), 'notecast/n-1');
    await settle();

    const send = document.querySelector('.dc-th-send') as HTMLButtonElement;
    send.click();
    await settle();
    expect(posted).toEqual([]); // empty box posts nothing

    (document.querySelector('.dc-th-input') as HTMLTextAreaElement).value = '  نظر من  ';
    send.click();
    await settle();
    expect(posted).toEqual([{ contentId: 'notecast/n-1', body: 'نظر من' }]);
  });
});
