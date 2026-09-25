// @vitest-environment jsdom
// The gates a reader meets on the way into a pathway, driven through the REAL
// page modules (/plus/js/pathway-page.js, pathways-page.js, exam-page.js) — the
// bugs a walk as guest / free / finisher turned up on 1405/07/03:
//   - a guest who tapped «شروع مسیر ›» on the showcase («باز برای همه») was
//     told the pathway was «ویژه‌ی اشتراک پریمیوم» and offered a purchase;
//   - the guest catalog said the same with a pathway open to every account;
//   - the guest exam page still called the exam premium, though finishing the
//     pathway is what opens it on any plan;
//   - a free reader who had read EVERY step of a premium pathway got the
//     generic «اگر … خوانده باشی» gate on its page, with no way to the exam.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = JSON.parse(fs.readFileSync(path.join(repoRoot, 'plus', 'pathways.json'), 'utf8'));
const OPEN = FILE.find((p: any) => p.kind !== 'bundle' && p.premium === false);
const LOCKED = FILE.find((p: any) => p.kind !== 'bundle' && p.premium !== false);

class ApiError extends Error {
  status: number; body: unknown;
  constructor(status: number, body: unknown = {}) { super('api ' + status); this.status = status; this.body = body; }
}

let me: Record<string, unknown> | null;
let status: string;
let pathwaysImpl: () => Promise<unknown>;
let pathwayImpl: (id: string) => Promise<unknown>;

vi.mock('/plus/js/api.js', () => ({
  ApiError,
  currentUser: () => Promise.resolve(me),
  meStatus: () => status,
  api: {
    pathways: () => pathwaysImpl(),
    pathway: (id: string) => pathwayImpl(id),
    exam: () => Promise.reject(new ApiError(402, { error: 'premium_required' })),
  },
}));
vi.mock('/plus/js/login-modal.js', () => ({ openLoginModal: () => Promise.resolve(null) }));
vi.mock('/plus/js/pwa.js', () => ({ registerSW: () => {} }));
vi.mock('/plus/js/page-back.js', () => ({ wirePageBack: () => {} }));

const settle = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0)); };
const root = () => document.getElementById('dcp-root')!;
const buyLinks = () => root().querySelectorAll('a[href^="/plus/pricing.html"]');

// Literal specifiers: vitest maps `/plus/js/…` only when it can see the path.
const PAGES: Record<string, () => Promise<unknown>> = {
  '/plus/js/pathway-page.js': () => import('/plus/js/pathway-page.js'),
  '/plus/js/pathways-page.js': () => import('/plus/js/pathways-page.js'),
  '/plus/js/exam-page.js': () => import('/plus/js/exam-page.js'),
};

async function load(mod: string, search = '') {
  history.replaceState(null, '', '/x' + search);
  document.body.innerHTML = '<div id="dcp-root"></div>';
  vi.resetModules();
  await PAGES[mod]();
  await settle();
}

beforeEach(() => {
  me = null; status = 'anon';
  pathwaysImpl = () => Promise.resolve({ pathways: [] });
  pathwayImpl = () => Promise.reject(new ApiError(402));
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => FILE })) as any;
});

describe('a guest', () => {
  it('on the OPEN pathway is told it is open to all and asked for a free account — no buy link, no «پریمیوم»', async () => {
    await load('/plus/js/pathway-page.js', '?id=' + OPEN.id);
    const t = root().textContent!;
    expect(t).toContain('این مسیر برای همه باز است');
    expect(t).not.toContain('پریمیوم');
    expect(buyLinks()).toHaveLength(0);
    expect(root().querySelector('button')!.textContent).toBe('ورود');
  });

  it('on a premium pathway still gets the premium gate', async () => {
    await load('/plus/js/pathway-page.js', '?id=' + LOCKED.id);
    expect(root().textContent).toContain('ویژه‌ی اشتراک پریمیوم');
    expect(buyLinks()).toHaveLength(1);
  });

  it('on the catalog is told which pathway a free account opens, and the purchase comes after, quieter', async () => {
    await load('/plus/js/pathways-page.js');
    const t = root().textContent!;
    expect(t).toContain(OPEN.title_fa);
    expect(t).toContain('با حساب رایگان هم باز است');
    expect(t).not.toContain('این بخش ویژه‌ی اشتراک پریمیوم است');
    expect(buyLinks()).toHaveLength(1);
    expect(buyLinks()[0].className).toMatch(/ghost/);
  });

  it('keeps the old guest gate on the catalog when the pathways file cannot be read', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 503, json: async () => null })) as any;
    await load('/plus/js/pathways-page.js');
    expect(root().textContent).toContain('این بخش ویژه‌ی اشتراک پریمیوم است');
  });

  it('on an exam page is told what opens the exam, never that it is premium', async () => {
    await load('/plus/js/exam-page.js', '?id=' + LOCKED.id);
    const t = root().textContent!;
    expect(t).toContain('برای آزمون مسیر وارد شوید');
    expect(t).toContain('همهٔ مطالب مسیر را با حساب کاربری خودش');
    expect(t).not.toContain('پریمیوم');
    expect(buyLinks()).toHaveLength(0);
  });
});

describe('a free reader on a premium pathway page', () => {
  beforeEach(() => { me = { id: 'u', tier: 'free' }; status = 'user'; });

  it('who has read every step is sent to the exam, not shown the «اگر … خوانده باشی» gate', async () => {
    pathwaysImpl = () => Promise.resolve({ pathways: [{ id: LOCKED.id, kind: null, open: false, is_complete: true }] });
    await load('/plus/js/pathway-page.js', '?id=' + LOCKED.id);
    const t = root().textContent!;
    expect(t).toContain('این مسیر را تا آخر خوانده‌ای');
    expect(t).not.toContain('اگر همهٔ مطالب');
    const go = root().querySelector('a.dcp-btn-primary')!;
    expect(go.getAttribute('href')).toBe('/plus/exam.html?id=' + LOCKED.id);
    expect(buyLinks()).toHaveLength(0);
  });

  it('who has not gets the ordinary gate', async () => {
    pathwaysImpl = () => Promise.resolve({ pathways: [{ id: LOCKED.id, kind: null, open: false, is_complete: false }] });
    await load('/plus/js/pathway-page.js', '?id=' + LOCKED.id);
    expect(root().textContent).toContain('اگر همهٔ مطالب');
    expect(buyLinks()).toHaveLength(1);
  });

  it('gets the ordinary gate when the catalog cannot be asked', async () => {
    pathwaysImpl = () => Promise.reject(new Error('503'));
    await load('/plus/js/pathway-page.js', '?id=' + LOCKED.id);
    expect(root().textContent).toContain('اگر همهٔ مطالب');
  });
});
