// @vitest-environment jsdom
// Drives the REAL shipped gate (/plus/js/library-gate.js).
//
// THE BUG (reported 2026-08-09): «سرچ مقاله‌ها تو موبایل پشت پرداخت هست اما تو
// دسکتاپ نه». The gate was an inline script in index.html bound to ONE element,
// `#card-library` — the archive tab's hero card. The cabinet has three doors,
// and the other two are plain <a href> links no script ever saw: the desktop
// topbar icon (#dcd-hdr-cabinet) and #btn-cabinet, which dc-nav.js injects into
// EVERY page and header.js then moves into the hamburger as «کتابخانه». So the
// gate held on the mobile homepage and nowhere else — the desktop half was the
// visible symptom, the hamburger (open on every page, on every device) was the
// bigger hole.
//
// These pin the doors, not the card: a gate that is one element's click handler
// is one refactor away from being bypassed again.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let meResult: { ok: boolean; status: number; body: any } | 'network-error' = {
  ok: true, status: 200, body: { id: 'u1', tier: 'free' },
};

globalThis.fetch = vi.fn(() => {
  if (meResult === 'network-error') return Promise.reject(new TypeError('Failed to fetch'));
  const r = meResult;
  return Promise.resolve({
    ok: r.ok, status: r.status,
    json: async () => r.body,
    text: async () => JSON.stringify(r.body),
  });
}) as any;

let gateOpened: string | null = null;
vi.mock('/plus/js/sheet.js', () => ({
  openSheet: () => {},
  gateCard: (o: { cta: any }) => { gateOpened = o.cta; return document.createElement('div'); },
}));
vi.mock('/plus/js/premium-cta.js', () => ({ premiumCta: (from: string) => from }));

const CABINET = '/dentcast_cabinet_search.html';

/** Where the gate sent the browser, if anywhere. */
let navigatedTo: string | null = null;

/**
 * A stand-in for `location` that is a REAL URL underneath, only with `href =`
 * captured instead of navigated (jsdom refuses navigation).
 *
 * The URL part is not a nicety: the gate asks /me through the shipped api.js,
 * and `config.js` derives the API host from `location.hostname` on module
 * evaluation. A hand-built `{pathname, origin}` object therefore threw inside
 * the dynamic import, every probe came back `error`, and the gate did the right
 * thing for the wrong reason — it failed OPEN in all thirteen cases, so the six
 * "premium walks in" assertions passed while nothing was actually gated.
 */
function setLocation(pathname: string) {
  const url = new URL('https://dentcast.ir' + pathname);
  const fake = new Proxy(url, {
    get(t, k) {
      const v = (t as any)[k];
      return typeof v === 'function' ? v.bind(t) : v;
    },
    set(t, k, v) {
      if (k === 'href') { navigatedTo = String(v); return true; }
      (t as any)[k] = v;
      return true;
    },
  });
  Object.defineProperty(window, 'location', { value: fake, writable: true, configurable: true });
}

// The gate delegates from `document`, which OUTLIVES a test — and each test
// reinstalls it. Without this, listeners from earlier tests were still live and
// a later test's "the gate must not fire here" assertion was answered by an
// older test's handler.
const realAdd = document.addEventListener.bind(document);
let installed: Array<[string, any, any]> = [];
document.addEventListener = ((type: string, fn: any, opts: any) => {
  installed.push([type, fn, opts]);
  return realAdd(type, fn, opts);
}) as any;

beforeEach(() => {
  vi.resetModules();
  gateOpened = null;
  navigatedTo = null;
  meResult = { ok: true, status: 200, body: { id: 'u1', tier: 'free' } };
  delete (window as any).__dcLibraryGate;
  document.body.innerHTML = '';
  try { localStorage.clear(); sessionStorage.clear(); } catch (_) { /* no storage */ }
  setLocation('/');
});

afterEach(() => {
  for (const [type, fn, opts] of installed) document.removeEventListener(type, fn, opts);
  installed = [];
});

async function install(): Promise<void> {
  const m = await import('/plus/js/library-gate.js');
  m.installLibraryGate();
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

async function clickAndSettle(el: HTMLElement): Promise<void> {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

/** Each of the three doors, built the way the site actually builds it. */
const DOORS: Array<{ name: string; html: string; id: string }> = [
  {
    name: 'the desktop topbar icon',
    id: 'dcd-hdr-cabinet',
    html: `<a id="dcd-hdr-cabinet" href="${CABINET}">cabinet</a>`,
  },
  {
    name: 'the hamburger tool (every page)',
    id: 'btn-cabinet',
    html: `<div class="dc-toolbar-drawer-inner"><a id="btn-cabinet" href="${CABINET}">کتابخانه</a></div>`,
  },
  {
    name: 'the archive card',
    id: 'card-library',
    html: `<div id="card-library" role="button" tabindex="0">کتابخانه</div>
           <span id="card-library-lock">🔒</span>`,
  },
];

describe('every door to the cabinet is gated, not just the card', () => {
  for (const door of DOORS) {
    it(`stops a free reader at ${door.name}`, async () => {
      document.body.innerHTML = door.html;
      await install();
      await clickAndSettle(document.getElementById(door.id)!);

      expect(navigatedTo, 'a free reader must not reach the cabinet').toBeNull();
      expect(gateOpened, 'the premium sheet is what they get instead').toBeTruthy();
    });

    it(`lets a premium reader through ${door.name}`, async () => {
      meResult = { ok: true, status: 200, body: { id: 'u1', tier: 'premium' } };
      document.body.innerHTML = door.html;
      await install();
      await clickAndSettle(document.getElementById(door.id)!);

      expect(navigatedTo).toBe(CABINET);
      expect(gateOpened).toBeNull();
    });
  }
});

describe('the rules the original card script carried', () => {
  it('FAILS OPEN when /me cannot be asked at all', async () => {
    // A subscriber shut out by a network blip is worse than a visitor getting
    // in: this is a product gate, and the cabinet is a public static page.
    meResult = 'network-error';
    document.body.innerHTML = DOORS[0].html;
    await install();
    await clickAndSettle(document.getElementById('dcd-hdr-cabinet')!);

    expect(navigatedTo).toBe(CABINET);
    expect(gateOpened).toBeNull();
  });

  it('hides the lock badge for a premium reader without a tap', async () => {
    meResult = { ok: true, status: 200, body: { id: 'u1', tier: 'premium' } };
    document.body.innerHTML = DOORS[2].html;
    await install();

    expect(document.getElementById('card-library-lock')!.style.display).toBe('none');
  });

  it('keeps the lock badge on for a free reader', async () => {
    document.body.innerHTML = DOORS[2].html;
    await install();

    expect(document.getElementById('card-library-lock')!.style.display).not.toBe('none');
  });

  it('tags the gate with the door it came from, so ?from= still means something', async () => {
    document.body.innerHTML = DOORS[1].html;
    await install();
    await clickAndSettle(document.getElementById('btn-cabinet')!);

    expect(gateOpened).toBe('gate-library-drawer');
  });
});

describe('what the gate must NOT do', () => {
  it('leaves every other link alone', async () => {
    document.body.innerHTML = '<a id="x" href="/insight/insight-1.html">مقاله</a>';
    await install();
    const a = document.getElementById('x')!;
    const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 0));

    expect(ev.defaultPrevented, 'an ordinary link must navigate normally').toBe(false);
    expect(gateOpened).toBeNull();
  });

  it('does not gate the cabinet page itself', async () => {
    setLocation(CABINET);
    document.body.innerHTML = DOORS[0].html;
    await install();
    const a = document.getElementById('dcd-hdr-cabinet')!;
    const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 0));

    expect(ev.defaultPrevented, 'already through the door').toBe(false);
  });

  it('installs once, however many times it is called', async () => {
    document.body.innerHTML = DOORS[0].html;
    const m = await import('/plus/js/library-gate.js');
    m.installLibraryGate();
    m.installLibraryGate();
    m.installLibraryGate();
    await new Promise((r) => setTimeout(r, 0));
    await clickAndSettle(document.getElementById('dcd-hdr-cabinet')!);

    expect(navigatedTo).toBeNull();
    expect(gateOpened).toBeTruthy();
  });
});
