// @vitest-environment jsdom
// Drives the REAL shipped «بازگشت» wiring (/plus/js/page-back.js): the link at
// the top of a destination page points at where the reader CAME FROM.
//
// Pinned: the homepage referrer names the tab the reader left (the same
// `dc:panel` key the homepage restores on load); the dashboard is «پیشخوان»;
// any other page of ours is «صفحهٔ قبل» — except from the dashboard itself,
// which is a hub and never bounces back; no referrer, another site, or the
// page itself leaves the static link untouched; and the click goes through
// history.back() only when there is history, never on a modified click.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const ORIGIN = 'http://localhost:3000';

function setReferrer(v: string) {
  Object.defineProperty(document, 'referrer', { value: v, configurable: true });
}

describe('backTarget', () => {
  let backTarget: (o?: any) => any;
  beforeEach(async () => {
    ({ backTarget } = await import('/plus/js/page-back.js'));
  });
  const here = (pathname: string) => ({ origin: ORIGIN, pathname });

  it('names the tab the reader left when they came from the homepage', () => {
    expect(backTarget({ referrer: ORIGIN + '/', here: here('/challenges/'), panel: 'panel-premium' }))
      .toEqual({ href: '/', label: 'بازگشت به تب پریمیوم' });
    expect(backTarget({ referrer: ORIGIN + '/index.html', here: here('/plus/highlights.html'), panel: 'panel-sharehub' }).label)
      .toBe('بازگشت به آرشیو');
    expect(backTarget({ referrer: ORIGIN + '/', here: here('/up-board/'), panel: 'panel-patient' }).label)
      .toBe('بازگشت به تب بیماران');
    // خانه is never remembered, and an unknown panel is the homepage.
    expect(backTarget({ referrer: ORIGIN + '/', here: here('/up-board/'), panel: '' }).label)
      .toBe('بازگشت به صفحهٔ اصلی');
    expect(backTarget({ referrer: ORIGIN + '/', here: here('/up-board/'), panel: 'panel-studio' }).label)
      .toBe('بازگشت به صفحهٔ اصلی');
  });

  it('the dashboard is «پیشخوان», any other page of ours is «صفحهٔ قبل» with its full URL', () => {
    expect(backTarget({ referrer: ORIGIN + '/plus/', here: here('/challenges/'), panel: 'panel-premium' }))
      .toEqual({ href: '/plus/', label: 'بازگشت به پیشخوان' });
    expect(backTarget({ referrer: ORIGIN + '/plus/pathways.html?x=1#top', here: here('/plus/pathway.html'), panel: '' }))
      .toEqual({ href: '/plus/pathways.html?x=1#top', label: 'بازگشت به صفحهٔ قبل' });
  });

  it('leaves the static link alone: no referrer, another site, the page itself, or the dashboard as a hub', () => {
    expect(backTarget({ referrer: '', here: here('/challenges/'), panel: 'panel-premium' })).toBeNull();
    expect(backTarget({ referrer: 'https://www.linkedin.com/feed/', here: here('/plus/certificate.html'), panel: '' })).toBeNull();
    expect(backTarget({ referrer: 'not a url', here: here('/plus/certificate.html'), panel: '' })).toBeNull();
    expect(backTarget({ referrer: ORIGIN + '/plus/highlights.html?kind=clip', here: here('/plus/highlights.html'), panel: '' })).toBeNull();
    // From highlights → «بازگشت به پیشخوان» → the dashboard must not offer highlights as «قبل».
    expect(backTarget({ referrer: ORIGIN + '/plus/highlights.html', here: here('/plus/'), panel: '' })).toBeNull();
    // ...but the dashboard still knows the homepage.
    expect(backTarget({ referrer: ORIGIN + '/', here: here('/plus/'), panel: 'panel-premium' })!.label).toBe('بازگشت به تب پریمیوم');
  });
});

describe('wirePageBack', () => {
  let wirePageBack: (root?: ParentNode) => void;
  beforeEach(async () => {
    ({ wirePageBack } = await import('/plus/js/page-back.js'));
    document.body.innerHTML = '<header><a class="dcp-page-back" href="/plus/">بازگشت به پیشخوان</a></header>'
      + '<main><a class="ch-back" data-dc-back href="/">بازگشت به صفحهٔ اصلی</a></main>';
    sessionStorage.clear();
    history.replaceState(null, '', '/challenges/'); // jsdom starts ON the homepage, which is «the page itself»
  });

  it('rewrites both link shapes from the referrer and the remembered tab, and goes back through history', () => {
    setReferrer(location.origin + '/');
    sessionStorage.setItem('dc:panel', 'panel-premium');
    const back = vi.fn();
    const orig = history.back;
    history.back = back;
    Object.defineProperty(history, 'length', { value: 3, configurable: true });
    try {
      wirePageBack();
      const links = Array.from(document.querySelectorAll('.dcp-page-back, [data-dc-back]')) as HTMLAnchorElement[];
      expect(links.map((a) => a.textContent)).toEqual(['بازگشت به تب پریمیوم', 'بازگشت به تب پریمیوم']);
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/']);
      // A plain click goes through history; a modified click is the browser's.
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      links[0].dispatchEvent(ev);
      expect(back).toHaveBeenCalledTimes(1);
      expect(ev.defaultPrevented).toBe(true);
      const mod = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
      links[1].dispatchEvent(mod);
      expect(back).toHaveBeenCalledTimes(1);
      expect(mod.defaultPrevented).toBe(false);
      // Idempotent: a second wiring adds no second listener.
      wirePageBack();
      links[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
      expect(back).toHaveBeenCalledTimes(2);
    } finally { history.back = orig; }
  });

  it('with no history the href is followed, and with no referrer nothing changes', () => {
    setReferrer(location.origin + '/plus/');
    Object.defineProperty(history, 'length', { value: 1, configurable: true });
    const back = vi.fn(); const orig = history.back; history.back = back;
    try {
      wirePageBack();
      const a = document.querySelector('[data-dc-back]') as HTMLAnchorElement;
      expect(a.textContent).toBe('بازگشت به پیشخوان');
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      a.dispatchEvent(ev);
      expect(back).not.toHaveBeenCalled();
      expect(ev.defaultPrevented).toBe(false);
    } finally { history.back = orig; }

    document.body.innerHTML = '<a class="dcp-page-back" href="/plus/">بازگشت به پیشخوان</a>';
    setReferrer('');
    wirePageBack();
    const a = document.querySelector('.dcp-page-back') as HTMLAnchorElement;
    expect(a.textContent).toBe('بازگشت به پیشخوان');
    expect(a.getAttribute('href')).toBe('/plus/');
  });

  it('is a no-op on a page without a back link', () => {
    document.body.innerHTML = '<main><h1>x</h1></main>';
    setReferrer(location.origin + '/');
    expect(() => wirePageBack()).not.toThrow();
  });
});
