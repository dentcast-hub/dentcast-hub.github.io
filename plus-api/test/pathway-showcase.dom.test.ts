// @vitest-environment jsdom
// Drives the REAL shipped showcase (/plus/js/pathway-showcase.js) against the
// REAL plus/pathways.json, and its homepage placement (/plus/js/home-features.js).
//
// What is pinned is the approved mockup's contract
// (.dentcast/pathway-showcase-mockup.html, founder 1405/07/03): the open
// pathway first with a verb for a button, the rest of the family as locked
// discs visible without a tap, no «رایگان» anywhere on it, no step count, no
// buy link, and a subscriber never shown it.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = JSON.parse(fs.readFileSync(path.join(repoRoot, 'plus', 'pathways.json'), 'utf8'));
const FULL = FILE.filter((p: any) => p.kind !== 'bundle');
const OPEN = FULL.filter((p: any) => p.premium === false);
const LOCKED = FULL.filter((p: any) => p.premium !== false);
const FA = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

let meImpl: () => Promise<Record<string, unknown> | null>;
let pathwaysImpl: () => Promise<unknown>;
vi.mock('/plus/js/api.js', () => ({
  api: {
    pathways: () => pathwaysImpl(),
    recentHighlights: () => Promise.resolve({ total: 0 }),
    listCollections: () => Promise.resolve({ collections: [] }),
  },
  currentUser: () => meImpl(),
}));

const settle = async () => { for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0)); };

beforeEach(() => {
  vi.resetModules();
  meImpl = () => Promise.resolve(null);
  pathwaysImpl = () => Promise.resolve({ pathways: [] });
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => FILE })) as any;
});

async function render(me: Record<string, unknown> | null = null) {
  const { loadShowcase, pathwayShowcase } = await import('/plus/js/pathway-showcase.js');
  return pathwayShowcase(await loadShowcase(me)) as HTMLElement;
}

describe('the showcase', () => {
  it('has at least one open pathway to show (the file this whole design rests on)', () => {
    expect(OPEN.length).toBeGreaterThan(0);
    expect(LOCKED.length).toBeGreaterThan(6);
  });

  it('features the open pathway with a verb, never a price', async () => {
    const sc = await render();
    const feat = sc.querySelector('.dcp-pws-feat')!;
    expect(feat.getAttribute('data-dcp-pws-open')).toBe(OPEN[0].id);
    expect(feat.textContent).toContain(OPEN[0].title_fa);
    const go = feat.querySelector('a.dcp-pws-go')!;
    expect(go.textContent).toBe('شروع مسیر ›');
    expect(go.getAttribute('href')).toBe('/plus/pathway.html?id=' + OPEN[0].id);
    // founder: «هی رایگان رایگان نکنیم» — the shape says it, not the word
    expect(sc.textContent).not.toContain('رایگان');
  });

  it('shows the family without a tap: six locked discs and «+N», then every one on expand', async () => {
    const sc = await render();
    expect(sc.querySelector('.dcp-pws-others')!.textContent)
      .toBe(FA(LOCKED.length) + ' مسیر دیگر — همین شکل، با اشتراک پریمیوم');
    const strip = sc.querySelector('details.dcp-pws-more > summary .dcp-pws-strip')!;
    expect(strip.querySelectorAll('.dcp-pws-pt-disc')).toHaveLength(6);
    expect(strip.querySelector('.dcp-pws-pt-more b')!.textContent).toBe('+' + FA(LOCKED.length - 6));
    expect(sc.querySelector('.dcp-pws-tog-c')!.textContent).toBe('دیدن هر ' + FA(LOCKED.length) + ' مسیر ▾');
    const grid = Array.from(sc.querySelectorAll('.dcp-pws-grid a.dcp-pws-pg'));
    expect(grid.map((a) => a.querySelector('.dcp-pws-pgt')!.textContent)).toEqual(LOCKED.map((p: any) => p.title_fa));
    // a locked pathway leads to the catalog, never to the pricing page
    for (const a of grid) expect(a.getAttribute('href')).toBe('/plus/pathways.html');
    expect(sc.querySelector('a[href^="/plus/pricing.html"]')).toBeNull();
  });

  it('counts pathways, never steps — the one number a publish cannot move', async () => {
    const sc = await render();
    expect(sc.querySelector('.dcp-pws-ht span')!.textContent).toContain(FA(FULL.length) + ' مسیر');
    expect(sc.textContent).not.toMatch(/قدم|مرحله/);
  });

  it('labels the certificate grey «به‌زودی» while pending, green once certifiable', async () => {
    let sc = await render();
    const cert = sc.querySelector('.dcp-pws-feat .dcp-pws-cert')!;
    expect(OPEN[0].certificate).toBe('pending');
    expect(cert.textContent).toBe('🎓 گواهی‌نامه: به‌زودی');
    expect(cert.classList.contains('is-open')).toBe(false);

    vi.resetModules();
    pathwaysImpl = () => Promise.resolve({ pathways: [{ id: OPEN[0].id, certifiable: true, completed_steps: 0, total_steps: 10 }] });
    sc = await render({ id: 'u1', tier: 'free' });
    const open = sc.querySelector('.dcp-pws-feat .dcp-pws-cert')!;
    expect(open.textContent).toBe('🎓 گواهی‌نامه');
    expect(open.classList.contains('is-open')).toBe(true);
  });

  it('draws a started reader\'s bar with no number on it', async () => {
    pathwaysImpl = () => Promise.resolve({ pathways: [{ id: OPEN[0].id, enrolled: true, completed_steps: 5, total_steps: 10 }] });
    const sc = await render({ id: 'u1', tier: 'free' });
    const feat = sc.querySelector('.dcp-pws-feat')!;
    expect(feat.querySelector('.dcp-pws-bar i')!.getAttribute('style')).toBe('width:50%');
    expect(feat.querySelector('.dcp-pws-prog')!.textContent).toBe('ادامه از جایی که ماندی');
    expect(feat.querySelector('.dcp-pws-go')!.textContent).toBe('ادامهٔ مسیر ›');
  });

  it('still draws when the API refuses — the file alone is enough', async () => {
    pathwaysImpl = () => Promise.reject(new Error('503'));
    const sc = await render({ id: 'u1', tier: 'free' });
    expect(sc.querySelector('.dcp-pws-go')!.textContent).toBe('شروع مسیر ›');
  });
});

describe('on the homepage', () => {
  const SKELETON = '<div id="dcPlusFeatures" hidden></div><div id="dcdPlusFeatures" hidden></div>';
  async function mount() {
    document.body.innerHTML = SKELETON;
    const { initHomeFeatures } = await import('/plus/js/home-features.js');
    await initHomeFeatures();
    await settle();
  }
  const section = (id = 'dcPlusFeatures') => document.getElementById(id)!.querySelector('.dcp-hf')!;

  it('replaces the pathway row with the showcase, first under the header, in both slots', async () => {
    const { PREMIUM_FEATURES } = await import('/plus/js/config.js');
    await mount();
    for (const id of ['dcPlusFeatures', 'dcdPlusFeatures']) {
      const kids = Array.from(section(id).children);
      expect(kids[0].classList.contains('dcp-hf-sec')).toBe(true);
      expect(kids[1].hasAttribute('data-dcp-showcase')).toBe(true);
      expect(section(id).querySelector(`[data-dcp-feature="${(PREMIUM_FEATURES as any)[1].title}"]`)).toBeNull();
      // still exactly one buy link in the section: the header's
      expect(section(id).querySelectorAll('a[href^="/plus/pricing.html"]')).toHaveLength(1);
    }
  });

  it('keeps the plain locked row when the pathways file cannot be read', async () => {
    const { PREMIUM_FEATURES } = await import('/plus/js/config.js');
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 503, json: async () => null })) as any;
    await mount();
    expect(section().querySelector('[data-dcp-showcase]')).toBeNull();
    expect(section().children[1].getAttribute('data-dcp-feature')).toBe((PREMIUM_FEATURES as any)[1].title);
  });

  it('never shows a subscriber the showcase — their pathway row stays live and first', async () => {
    const { PREMIUM_FEATURES } = await import('/plus/js/config.js');
    meImpl = () => Promise.resolve({
      id: 'u9', tier: 'premium', due_card_count: 0,
      active_pathway: { is_complete: false, current_step: 12, total_steps: 40 },
    });
    await mount();
    expect(section().querySelector('[data-dcp-showcase]')).toBeNull();
    const row = section().children[1];
    expect(row.getAttribute('data-dcp-feature')).toBe((PREMIUM_FEATURES as any)[1].title);
    expect(row.querySelector('.dcp-hf-state')!.textContent).toBe('قدم ۱۲ از ۴۰');
    expect((globalThis.fetch as any).mock.calls.length).toBe(0);
  });
});
