// @vitest-environment jsdom
// Drives the REAL shipped «پریمیوم» tab renderer (/plus/js/premium-panel.js)
// and its catalog (/plus/js/premium-catalog.js).
//
// What is pinned here is the contract the tab makes, not its looks: one panel
// with THREE states (locked / live / unknown) that are never conflated, exactly
// one buy link on the locked page and none on the live one, a catalog that can
// never silently miss a canonical feature, and the one founder-worded claim
// («بدون تبلیغ در مقالات», never wider) kept as written.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let meImpl: () => Promise<Record<string, unknown> | null>;
let meStatusImpl: () => string;
let highlightsImpl: () => Promise<unknown>;
let collectionsImpl: () => Promise<unknown>;

vi.mock('/plus/js/api.js', () => ({
  api: {
    recentHighlights: () => highlightsImpl(),
    listCollections: () => collectionsImpl(),
  },
  currentUser: () => meImpl(),
  meStatus: () => meStatusImpl(),
}));

let loginOpened = 0;
vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: () => { loginOpened += 1; },
}));

const CHALLENGES = {
  version: 1,
  byContent: {
    'insight/insight-68': { question: 'q1', image: '/insight/insight68.webp' },
    'insight/insight-70': { question: 'q2', image: '/insight/insight70.webp' },
  },
};

// Both slots, the way index.html carries them, plus the home panel's DES tool
// tab and the real bottom-nav item that switches to it.
const SKELETON = `
  <section class="dc-panel active" id="panel-studio"><button id="dcDesToolTab" type="button">DES</button></section>
  <section class="dc-panel" id="panel-premium"><div id="dcPremiumPanel" hidden></div></section>
  <div id="dcdPremiumPanel" hidden></div>
  <nav><div class="dc-bn-item" data-panel="panel-studio"></div><div class="dc-bn-item active" data-panel="panel-premium"></div></nav>`;

const settle = () => new Promise((r) => setTimeout(r, 0));
const mobile = () => document.getElementById('dcPremiumPanel')!;
const cards = (root: Element = mobile()) => Array.from(root.querySelectorAll('.dcp-hf-card'));
const chip = (key: string, root: Element = mobile()) =>
  root.querySelector(`[data-dcp-key="${key}"] .dcp-hf-state`)?.textContent ?? null;
const pricingLinks = (root: Element = mobile()) =>
  Array.from(root.querySelectorAll('a[href^="/plus/pricing.html"]'));

async function mount() {
  document.body.innerHTML = SKELETON;
  const { initPremiumPanel } = await import('/plus/js/premium-panel.js');
  await initPremiumPanel();
  await settle();
  await settle();
}

beforeEach(() => {
  vi.resetModules();
  loginOpened = 0;
  meImpl = () => Promise.resolve(null);
  meStatusImpl = () => 'anon';
  highlightsImpl = () => Promise.resolve({ total: 132 });
  collectionsImpl = () => Promise.resolve({ collections: [{}, {}, {}] });
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => CHALLENGES })) as any;
  (Element.prototype as any).scrollIntoView = vi.fn();
});

describe('the catalog', () => {
  it('carries every canonical PREMIUM_FEATURES title — a tenth entry cannot go missing', async () => {
    const { PREMIUM_FEATURES } = await import('/plus/js/config.js');
    const { PREMIUM_ENTRIES } = await import('/plus/js/premium-catalog.js');
    const titles = PREMIUM_ENTRIES.filter((e: any) => e.feature).map((e: any) => e.title);
    for (const f of PREMIUM_FEATURES as any[]) expect(titles).toContain(f.title);
    // and the reference is by object, never a re-typed string
    for (const e of PREMIUM_ENTRIES as any[]) {
      if (e.feature) expect((PREMIUM_FEATURES as any[]).includes(e.feature)).toBe(true);
    }
  });

  it('names more than the nine — the eleven that were on no pitch anywhere', async () => {
    const { PREMIUM_ENTRIES } = await import('/plus/js/premium-catalog.js');
    const extra = (PREMIUM_ENTRIES as any[]).filter((e) => !e.feature).map((e) => e.key);
    expect(extra).toEqual(expect.arrayContaining([
      'concepts', 'pillar', 'upboard', 'desboard', 'wayfinder', 'cabinet', 'des-scorer',
      'threads', 'challenge', 'no-ads', 'sms',
    ]));
    const keys = (PREMIUM_ENTRIES as any[]).map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('promises «بدون تبلیغ در مقالات» and never anything wider', async () => {
    const { PREMIUM_ENTRIES } = await import('/plus/js/premium-catalog.js');
    const noAds = (PREMIUM_ENTRIES as any[]).find((e) => e.key === 'no-ads');
    expect(noAds.title).toBe('بدون تبلیغ در مقالات');
    expect(noAds.sub).not.toContain('هیچ‌جا');
    // and the source itself carries no wider claim (the mockup's first draft did)
    const src = fs.readFileSync(path.join(repoRoot, 'plus/js/premium-catalog.js'), 'utf8');
    expect(src).not.toMatch(/هیچ کارت اسپانسری، هیچ‌جا/);
  });

  it('gives every card that leads somewhere a site-absolute href', async () => {
    const { PREMIUM_ENTRIES } = await import('/plus/js/premium-catalog.js');
    for (const e of PREMIUM_ENTRIES as any[]) {
      if (e.href !== null) expect(e.href).toMatch(/^\//);
    }
  });
});

describe('a signed-out visitor', () => {
  it('sees every card locked, ONE buy link, and a sign-in line first', async () => {
    await mount();
    expect(mobile().hidden).toBe(false);
    expect(mobile().querySelector('.dcp-pp')!.getAttribute('data-dcp-state')).toBe('locked');
    const all = cards();
    expect(all.length).toBe(20);
    for (const c of all) expect(c.querySelector('.dcp-hf-state')!.textContent).toBe('🔒');
    const buy = pricingLinks();
    expect(buy).toHaveLength(1);
    expect(buy[0].getAttribute('href')).toBe('/plus/pricing.html?from=premium-tab');
    expect(mobile().textContent).not.toContain('پیشخوان ›');
    const signIn = mobile().querySelector('.dcp-pp-signin') as HTMLElement;
    expect(signIn).not.toBeNull();
    signIn.click();
    expect(loginOpened).toBe(1);
  });

  it('fills the desktop slot with the same panel', async () => {
    await mount();
    const desk = document.getElementById('dcdPremiumPanel')!;
    expect(desk.hidden).toBe(false);
    expect(cards(desk).length).toBe(cards().length);
    expect(pricingLinks(desk)).toHaveLength(1);
  });
});

describe('a free reader', () => {
  it('sees the locked catalog without the sign-in line', async () => {
    meImpl = () => Promise.resolve({ tier: 'free' });
    meStatusImpl = () => 'user';
    await mount();
    expect(mobile().querySelector('.dcp-pp')!.getAttribute('data-dcp-state')).toBe('locked');
    expect(pricingLinks()).toHaveLength(1);
    expect(mobile().querySelector('.dcp-pp-signin')).toBeNull();
  });
});

describe('a subscriber', () => {
  beforeEach(() => {
    meImpl = () => Promise.resolve({
      tier: 'premium',
      due_card_count: 4,
      active_pathway: { id: 'fixed-pros', title_fa: 'پروتز ثابت', current_step: 3, total_steps: 12, is_complete: false },
    });
    meStatusImpl = () => 'user';
  });
  const rows = (root: Element = mobile()) => Array.from(root.querySelectorAll('.dcp-pp-row'));
  const st = (key: string, root: Element = mobile()) =>
    root.querySelector(`[data-dcp-key="${key}"] .dcp-pp-st-text`)?.textContent ?? null;
  const stLive = (key: string) => !!mobile().querySelector(`[data-dcp-key="${key}"] .dcp-pp-st.is-live`);

  it('gets a HOME, not the catalog: no buy link, no amber card, no «باز کردن», the dashboard as the header link', async () => {
    await mount();
    expect(mobile().querySelector('.dcp-pp')!.getAttribute('data-dcp-state')).toBe('live');
    expect(pricingLinks()).toHaveLength(0);
    expect(mobile().querySelector('a[href="/plus/"]')!.textContent).toBe('پیشخوان ›');
    expect(mobile().querySelector('.dcp-pp-signin')).toBeNull();
    expect(cards()).toHaveLength(0);                       // the amber card grammar is the locked page's
    expect(mobile().querySelectorAll('.dcp-hf-state')).toHaveLength(0);
    expect(mobile().textContent).not.toContain('باز کردن');
    // every catalog entry but the hidden one is a row, in one surface per group
    expect(rows()).toHaveLength(19);
    expect(mobile().querySelectorAll('.dcp-pp-group.is-live .dcp-pp-inset')).toHaveLength(4);
    const tints = Array.from(mobile().querySelectorAll('.dcp-pp-group.is-live')).map((g) => g.className);
    expect(tints[0]).toContain('g-blue'); expect(tints[1]).toContain('g-green');
    expect(tints[2]).toContain('g-violet'); expect(tints[3]).toContain('g-teal');
    // the one amber mark
    expect(mobile().querySelector('.dcp-pp-pill')!.textContent).toBe('اشتراک فعال');
    // a row that leads somewhere carries a chevron; the static one does not
    expect(mobile().querySelector('[data-dcp-key="cards"] .dcp-pp-chev')).not.toBeNull();
    expect(mobile().querySelector('[data-dcp-key="no-ads"]')!.tagName).toBe('DIV');
    expect(mobile().querySelector('[data-dcp-key="no-ads"] .dcp-pp-chev')).toBeNull();
    expect(st('no-ads')).toBe('✓ فعال');
  });

  it('leads with the active pathway as the one primary card, with its progress', async () => {
    await mount();
    const hero = mobile().querySelector('.dcp-pp-hero') as HTMLAnchorElement;
    expect(hero.getAttribute('href')).toBe('/plus/pathway.html?id=fixed-pros');
    expect(hero.getAttribute('data-dcp-hero')).toBe('pathway');
    expect(hero.querySelector('.dcp-pp-hero-t')!.textContent).toBe('پروتز ثابت');
    expect(hero.querySelector('.dcp-pp-hero-m')!.textContent).toBe('قدم ۳ از ۱۲');
    expect(hero.querySelector('.dcp-pp-hero-bar')!.getAttribute('aria-valuenow')).toBe('25');
    expect(hero.querySelector('.dcp-pp-hero-cta')!.textContent).toBe('ادامهٔ مسیر ›');
    expect(mobile().querySelectorAll('.dcp-pp-hero')).toHaveLength(1);
  });

  it('a pathway enrolled but not started says «شروع کن», never «ادامه از جایی که بودی»', async () => {
    meImpl = () => Promise.resolve({ tier: 'premium', due_card_count: 0, active_pathway: { id: 'bio', title_fa: 'بیومیمتیک', current_step: 0, total_steps: 97, is_complete: false } });
    await mount();
    const hero = mobile().querySelector('.dcp-pp-hero')!;
    expect(hero.getAttribute('data-dcp-hero')).toBe('pathway');
    expect(hero.querySelector('.dcp-pp-hero-k')!.textContent).toBe('شروع کن');
    expect(hero.querySelector('.dcp-pp-hero-m')!.textContent).toBe('هنوز شروع نشده');
    expect(hero.querySelector('.dcp-pp-hero-cta')!.textContent).toBe('شروع مسیر ›');
    expect(hero.textContent).not.toContain('از همان‌جایی که بودی');
    expect(hero.textContent).not.toContain('قدم ۰');
  });

  it('falls through: a finished pathway → today\'s cards → the دفترچه', async () => {
    meImpl = () => Promise.resolve({ tier: 'premium', due_card_count: 4, active_pathway: { id: 'p', title_fa: 'x', current_step: 5, total_steps: 5, is_complete: true } });
    await mount();
    let hero = mobile().querySelector('.dcp-pp-hero')!;
    expect(hero.getAttribute('data-dcp-hero')).toBe('cards');
    expect(hero.getAttribute('href')).toBe('/plus/cards.html');
    expect(hero.querySelector('.dcp-pp-hero-t')!.textContent).toBe('۴ کارت برای مرور');
    expect(hero.querySelector('.dcp-pp-hero-bar')).toBeNull();
    expect(st('pathways')).toBe('کامل شد');
    expect(stLive('pathways')).toBe(false);

    meImpl = () => Promise.resolve({ tier: 'premium', due_card_count: 0 });
    await mount();
    hero = mobile().querySelector('.dcp-pp-hero')!;
    expect(hero.getAttribute('data-dcp-hero')).toBe('highlights');
    expect(hero.getAttribute('href')).toBe('/plus/highlights.html');
  });

  it('paints what /me carries at once and the counted ones after they answer — blue only where something waits', async () => {
    await mount();
    expect(st('pathways')).toBe('قدم ۳ از ۱۲');
    expect(stLive('pathways')).toBe(true);
    expect(st('cards')).toBe('۴ کارت');
    expect(stLive('cards')).toBe(true);
    expect(st('report')).toMatch(/ آماده$/);
    expect(stLive('report')).toBe(true);
    expect(st('highlights')).toBe('۱۳۲');
    expect(stLive('highlights')).toBe(false);
    expect(st('collections')).toBe('۳');
    expect(st('compass')).toBe('');                          // no honest number for it: chevron only
    expect(st('sms')).toBe('خاموش');
    // the desktop copy is painted too
    expect(st('highlights', document.getElementById('dcdPremiumPanel')!)).toBe('۱۳۲');
  });

  it('leaves the chevron alone rather than guess when a count fails', async () => {
    highlightsImpl = () => Promise.reject(new Error('down'));
    collectionsImpl = () => Promise.resolve({ collections: [] });
    await mount();
    expect(st('highlights')).toBe('');
    expect(st('collections')).toBe('');
    expect(mobile().querySelector('[data-dcp-mine="highlights"] b')!.textContent).toBe('–');
  });

  it('shows the three today numbers as doors, four quick actions, and puts «پیشخوان ›» beside the page title', async () => {
    meImpl = () => Promise.resolve({
      tier: 'premium', due_card_count: 4, current_streak: 17, last_active_day: '2000-01-01',
      subscription: { expires_at: '2026-11-15T00:00:00Z' },
      settings: { notify_channels: { sms: { streak: true } } },
    });
    document.body.innerHTML = SKELETON;
    document.getElementById('panel-premium')!.insertAdjacentHTML('afterbegin',
      '<div class="dc-exa-pagehead"><h2 class="dc-exa-pagetitle">پریمیوم</h2></div>');
    const { initPremiumPanel } = await import('/plus/js/premium-panel.js');
    await initPremiumPanel();
    await settle(); await settle();
    const tiles = Array.from(mobile().querySelectorAll('.dcp-pp-today-tile'));
    expect(tiles.map((t) => t.getAttribute('href'))).toEqual(['/plus/cards.html', '/plus/profile.html', '/plus/highlights.html']);
    expect(tiles.map((t) => t.querySelector('b')!.textContent)).toEqual(['۴', '۱۷ روز', '۱۳۲']);
    expect(tiles[1].querySelector('.dcp-pp-go')!.textContent).toBe('امروز هنوز نه');
    const quick = Array.from(mobile().querySelectorAll('.dcp-pp-quick-a')).map((a) => a.getAttribute('data-dcp-quick'));
    expect(quick).toEqual(['highlights', 'pathways', 'assistant', 'collections']);
    expect(st('sms')).toBe('روشن');
    const head = document.querySelector('#panel-premium .dc-exa-pagehead')!;
    expect(head.querySelector('a.dcp-pp-dash')!.getAttribute('href')).toBe('/plus/');
    expect(mobile().querySelector('.dcp-pp-top a')).toBeNull(); // not twice
    expect(mobile().querySelector('.dcp-pp-status')!.textContent).toMatch(/^اشتراک فعالتا .+$/);
    await initPremiumPanel();
    await settle();
    expect(head.querySelectorAll('a.dcp-pp-dash')).toHaveLength(1);
  });
});

describe('when the API cannot be asked', () => {
  it('draws the catalog with no locks and no offer — never an upsell', async () => {
    meImpl = () => Promise.resolve(null);
    meStatusImpl = () => 'error';
    await mount();
    expect(mobile().querySelector('.dcp-pp')!.getAttribute('data-dcp-state')).toBe('unknown');
    expect(mobile().querySelectorAll('.dcp-hf-state')).toHaveLength(0);
    expect(pricingLinks()).toHaveLength(0);
    expect(mobile().querySelector('.dcp-pp-signin')).toBeNull();
    expect(mobile().querySelector('.dcp-pp-lead')!.textContent).toContain('ارتباط با سرور');
  });
});

describe('the starter bundles («از کجا شروع کنم؟»)', () => {
  const band = (root: Element = mobile()) => root.querySelector('.dcp-pp-bundles');
  const railCards = (root: Element = mobile()) => Array.from(root.querySelectorAll('.dcp-pp-bundles .dcb-railcard'));
  const more = (root: Element = mobile()) => root.querySelector('.dcp-pp-bundles .dcb-band-more') as HTMLAnchorElement | null;

  it('a guest sees the rail at the TOP, every card locked, and the link landing on the catalog band — the offer stays the one buy link', async () => {
    await mount();
    const b = band()!;
    expect(b).toBeTruthy();
    expect(b.getAttribute('data-dcp-bundles')).toBe('locked');
    const firstGroup = mobile().querySelector('.dcp-pp-group')!;
    expect(b.compareDocumentPosition(firstGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(railCards().length).toBe(10);
    expect(railCards().every((c) => c.querySelector('.dcb-railcard-lock')?.textContent?.includes('🔒'))).toBe(true);
    expect(more()!.getAttribute('href')).toBe('/plus/pathways.html#bundles');
    expect(pricingLinks().length).toBe(1);
  });

  it('a free reader sees the same locked rail', async () => {
    meImpl = () => Promise.resolve({ tier: 'free' });
    meStatusImpl = () => 'ok';
    await mount();
    expect(band()!.getAttribute('data-dcp-bundles')).toBe('locked');
    expect(railCards().length).toBe(10);
    expect(pricingLinks().length).toBe(1);
  });

  it('a subscriber gets it live, under the quick actions, with no lock and the same catalog link', async () => {
    meImpl = () => Promise.resolve({ tier: 'premium', display_name: 'x', current_streak: 3 });
    meStatusImpl = () => 'ok';
    await mount();
    const b = band()!;
    expect(b.getAttribute('data-dcp-bundles')).toBe('live');
    const quick = mobile().querySelector('.dcp-pp-quick')!;
    expect(quick.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const firstGroup = mobile().querySelector('.dcp-pp-group')!;
    expect(b.compareDocumentPosition(firstGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(railCards().length).toBe(10);
    expect(mobile().querySelectorAll('.dcb-railcard-lock').length).toBe(0);
    expect(more()!.getAttribute('href')).toBe('/plus/pathways.html#bundles');
  });

  it('the catalog band carries the anchor the link lands on', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'plus/js/pathways.js'), 'utf8');
    expect(src).toMatch(/class: 'dcb-band', id: 'bundles'/);
  });
});

describe('destinations', () => {
  it('sends the چالش card to the landing page, never to one challenge', async () => {
    await mount();
    const c = mobile().querySelector('[data-dcp-key="challenge"]')!;
    expect(c.tagName).toBe('A');
    expect(c.getAttribute('href')).toBe('/challenges/');
    expect((globalThis.fetch as any).mock.calls.length).toBe(0); // no lookup, nothing to fetch
  });

  it('shows گفت‌وگوی زیر مطلب as a static showcase to a guest — never a link to پشتیبانی', async () => {
    await mount();
    const t = mobile().querySelector('[data-dcp-key="threads"]')!;
    expect(t.tagName).toBe('DIV');
    expect(t.classList.contains('is-static')).toBe(true);
    expect(mobile().querySelector('a[href*="support"]')).toBeNull();
  });

  it('leaves گفت‌وگوی زیر مطلب out for a subscriber — it is under every article already', async () => {
    meImpl = () => Promise.resolve({ tier: 'premium' });
    meStatusImpl = () => 'user';
    await mount();
    expect(mobile().querySelector('[data-dcp-key="threads"]')).toBeNull();
    expect(mobile().querySelectorAll('.dcp-pp-row').length).toBe(19);
  });

  it('switches panels for a card whose target lives on خانه — and OPENS the tool it lands on', async () => {
    const later = () => new Promise((r) => setTimeout(r, 420)); // past the 350ms switch delay
    {
      await mount();
      let switched = 0;
      document.querySelector('.dc-bn-item[data-panel="panel-studio"]')!.addEventListener('click', () => { switched += 1; });
      document.getElementById('panel-studio')!.classList.remove('active');
      const tab = document.getElementById('dcDesToolTab')!;
      tab.setAttribute('aria-expanded', 'false');
      tab.addEventListener('click', () => tab.setAttribute('aria-expanded', String(tab.getAttribute('aria-expanded') !== 'true')));
      const des = mobile().querySelector('[data-dcp-key="des-scorer"]') as HTMLAnchorElement;
      expect(des.getAttribute('href')).toBe('/#dcDesToolTab');
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
      des.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(switched).toBe(1);
      await later();
      expect(tab.getAttribute('aria-expanded')).toBe('true'); // opened, not merely scrolled to
      // a tab already open is left open
      des.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await later();
      expect(tab.getAttribute('aria-expanded')).toBe('true');
    }
  });

  it('on the desktop shell, leaves the premium surface and scrolls to the column-C copy', async () => {
    await mount();
    document.body.classList.add('dc-desktop-ui');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="dcd-col-c is-viewer"><div class="dcd-col-c-scroll is-premium"><button id="dcdDesToolTab" type="button">DES</button></div></div>'
      + '<button id="dcd-premium-item" class="active"></button>');
    const des = document.querySelector('#dcdPremiumPanel [data-dcp-key="des-scorer"]') as HTMLAnchorElement;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    des.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    const scroll = document.querySelector('.dcd-col-c-scroll')!;
    expect(scroll.classList.contains('is-premium')).toBe(false);
    expect(document.querySelector('.dcd-col-c')!.classList.contains('is-viewer')).toBe(false);
    expect(document.getElementById('dcd-premium-item')!.classList.contains('active')).toBe(false);
    document.body.classList.remove('dc-desktop-ui');
  });

  it('is wired on the homepage as the fourth panel, in the tab bar and the desktop tree', () => {
    const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
    expect(html).toContain('id="panel-premium"');
    expect(html).toContain('id="dcPremiumPanel"');
    expect(html).toContain('id="dcdPremiumPanel"');
    expect(html).toContain('data-panel="panel-premium"');
    expect(html).toContain("const panelOrder = ['panel-studio','panel-sharehub','panel-premium','panel-patient'];");
    expect(html).toContain('id="dcd-premium-item"');
    expect(html).toMatch(/grid-template-columns:repeat\(4,1fr\);\s*\n\s*background:var\(--bn-bg\)/);
    const plus = fs.readFileSync(path.join(repoRoot, 'plus/plus.js'), 'utf8');
    expect(plus).toContain("step('premium-panel', () => initPremiumPanel())");
    // the profile anchor the پیامک card lands on exists
    const profile = fs.readFileSync(path.join(repoRoot, 'plus/js/profile.js'), 'utf8');
    expect(profile).toContain("section('یادآوری‌ها', remindersBlock(me), 'reminders')");
    // and the tour's tab stop names four tabs
    const tour = fs.readFileSync(path.join(repoRoot, 'plus/js/tour.js'), 'utf8');
    expect(tour).toMatch(/«خانه».*«آرشیو».*«پریمیوم».*«بیماران»/);
  });
});
