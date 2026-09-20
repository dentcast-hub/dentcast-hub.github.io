// @vitest-environment jsdom
// Drives the REAL shipped /challenges/ renderer (/plus/js/challenges-page.js).
//
// Pinned: the list is the join of the two published catalogs in the catalog's
// own (newest-first) order, every card links to its challenge, a signed-in
// reader's own answered challenges are marked and nobody else's, and the one
// line about who may answer follows the three-answer rule (guest / free /
// premium / unreachable).
import { describe, it, expect, beforeEach, vi } from 'vitest';

let meImpl: () => Promise<Record<string, unknown> | null>;
let meStatusImpl: () => string;
let stateImpl: (cid: string) => Promise<unknown>;

vi.mock('/plus/js/api.js', () => ({
  api: { challengeState: (cid: string) => stateImpl(cid) },
  currentUser: () => meImpl(),
  meStatus: () => meStatusImpl(),
}));

const CHALLENGES = {
  version: 1,
  byContent: {
    'insight/insight-68': { question: 'سؤال ۶۸', image: '/insight/insight68.webp' },
    'insight/insight-70': { question: 'سؤال ۷۰', image: '' },
    'insight/insight-71': { question: 'سؤال ۷۱', image: '/insight/insight71.webp' },
  },
};
const INDEX = {
  items: [
    { id: 'insight/insight-71', u: '/insight/insight-71.html', tf: 'Clinical Insight', ti: 'هفتاد و یک', d: '۱۶ شهریور' },
    { id: 'chairside/chairside-3', u: '/chairside/chairside-3.html', tf: 'چیرساید', ti: 'نه چالش', d: '' },
    { id: 'insight/insight-70', u: '/insight/insight-70.html', tf: 'Clinical Insight', ti: 'هفتاد', d: '۸ شهریور' },
    { id: 'insight/insight-68', u: '/insight/insight-68.html', tf: 'Clinical Insight', ti: 'شصت و هشت', d: '۶ شهریور' },
  ],
};

const settle = () => new Promise((r) => setTimeout(r, 0));
const root = () => document.getElementById('chRoot')!;
const cards = () => Array.from(root().querySelectorAll('.ch-card'));

async function mount() {
  document.body.innerHTML = '<main id="chRoot"><p id="chSub"></p></main>';
  const { initChallengesPage } = await import('/plus/js/challenges-page.js');
  await initChallengesPage(root());
  await settle(); await settle();
}

beforeEach(() => {
  vi.resetModules();
  meImpl = () => Promise.resolve(null);
  meStatusImpl = () => 'anon';
  stateImpl = () => Promise.resolve({ exists: true });
  globalThis.fetch = vi.fn((url: string) => Promise.resolve({
    ok: true, status: 200,
    json: async () => (String(url).includes('challenges.json') ? CHALLENGES : INDEX),
  })) as any;
});

describe('/challenges/', () => {
  it('lists every challenge newest-first, each linking to its own page', async () => {
    await mount();
    expect(cards().map((c) => c.getAttribute('data-cid'))).toEqual(['insight/insight-71', 'insight/insight-70', 'insight/insight-68']);
    expect(cards()[0].querySelector('a.ch-title')!.getAttribute('href')).toBe('/insight/insight-71.html');
    expect(cards()[0].querySelector('.ch-q')!.textContent).toBe('سؤال ۷۱');
    expect(cards()[0].querySelector('.ch-media img')!.getAttribute('src')).toBe('/insight/insight71.webp');
    expect(cards()[1].querySelector('.ch-media')).toBeNull(); // no image, no empty frame
    expect(document.getElementById('chSub')!.textContent).toBe('۳ چالش');
  });

  it('tells a guest that answering is premium, sign-in first', async () => {
    await mount();
    const note = root().querySelector('.ch-note')!;
    expect(note.textContent).toContain('وارد شوید');
    expect(note.querySelector('a')!.getAttribute('href')).toBe('/plus/pricing.html?from=gate-challenges');
    expect(root().querySelectorAll('.ch-state:not([hidden])')).toHaveLength(0);
  });

  it('marks the challenges a signed-in reader has answered — and only those', async () => {
    meImpl = () => Promise.resolve({ tier: 'free' });
    meStatusImpl = () => 'user';
    stateImpl = (cid) => Promise.resolve(cid === 'insight/insight-70' ? { exists: true, status: 'settled', answer_text: 'x' } : { exists: true });
    await mount();
    await settle();
    const marked = cards().filter((c) => !(c.querySelector('.ch-state') as HTMLElement).hidden).map((c) => c.getAttribute('data-cid'));
    expect(marked).toEqual(['insight/insight-70']);
    expect(root().querySelector('.ch-note')!.textContent).not.toContain('وارد شوید');
  });

  it('says nothing about buying to a subscriber, or when the API cannot be asked', async () => {
    meImpl = () => Promise.resolve({ tier: 'premium' });
    meStatusImpl = () => 'user';
    await mount();
    expect(root().querySelector('.ch-note')).toBeNull();
    meImpl = () => Promise.resolve(null);
    meStatusImpl = () => 'error';
    await mount();
    expect(root().querySelector('.ch-note')).toBeNull();
  });

  it('fails soft when a catalog is missing', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404, json: async () => ({}) })) as any;
    await mount();
    expect(cards()).toHaveLength(0);
    expect(root().querySelector('.ch-empty')!.textContent).toContain('در دسترس نیست');
  });
});
