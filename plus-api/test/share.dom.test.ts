// @vitest-environment jsdom
// Drives the REAL shipped bridge (/plus/js/share.js). Everything this module
// does happens between two files that cannot import each other — dc-nav.js is a
// classic script and the API session lives behind api.js — so the contract
// between them is a string on an event bus, and nothing but a DOM test holds it.
//
// Two of the three cases below are about the DESKTOP shell, where one document
// shows many articles over its lifetime. That is the surface where an
// event listener written the obvious way (closing over the contentId it was
// created with) keeps crediting the first article the reader ever opened, for
// the rest of the tab's life, silently.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const calls: Array<[string, string]> = [];

vi.mock('/plus/js/api.js', () => ({
  api: {
    activity: (action: string, contentId: string) => {
      calls.push([action, contentId]);
      return Promise.resolve({ ok: true });
    },
  },
}));

const { initShareScoring, signalShared, buildShareButton, SHARE_EVENT } =
  await import('/plus/js/share.js');

beforeEach(() => { calls.length = 0; });

describe('the dc-nav → plus bridge', () => {
  it('reports one share for the page it was aimed at', async () => {
    initShareScoring('insight/insight-1');
    signalShared();
    await Promise.resolve();
    expect(calls).toEqual([['content_shared', 'insight/insight-1']]);
  });

  it('listens for the event name dc-nav.js actually dispatches', async () => {
    // dc-nav.js cannot import this constant — it hardcodes the string. If either
    // side is renamed without the other, sharing silently stops paying and
    // nothing throws, so the literal is pinned here on purpose.
    expect(SHARE_EVENT).toBe('dcp:content-shared');
    initShareScoring('insight/insight-2');
    document.dispatchEvent(new CustomEvent('dcp:content-shared'));
    await Promise.resolve();
    expect(calls).toEqual([['content_shared', 'insight/insight-2']]);
  });

  it('does not spend a second request on a double tap', async () => {
    initShareScoring('insight/insight-3');
    signalShared();
    signalShared();
    await Promise.resolve();
    expect(calls).toHaveLength(1);
  });

  it('follows the desktop shell from one article to the next', async () => {
    initShareScoring('insight/insight-4');
    signalShared();
    initShareScoring('insight/insight-5'); // the reader opened another article
    signalShared();
    await Promise.resolve();
    expect(calls).toEqual([
      ['content_shared', 'insight/insight-4'],
      ['content_shared', 'insight/insight-5'],
    ]);
  });

  it('credits nothing before an article has been named', async () => {
    initShareScoring(null);
    signalShared();
    await Promise.resolve();
    expect(calls).toEqual([]);
  });
});

describe('the desktop shell button', () => {
  it('sends the article URL it was given, not the shell address bar', async () => {
    const shared: Array<{ title: string; url: string }> = [];
    (navigator as unknown as { share: unknown }).share = (d: { title: string; url: string }) => {
      shared.push(d);
      return Promise.resolve();
    };
    initShareScoring('insight/insight-6');
    const btn = buildShareButton(() => ({ title: 'یک مقاله', url: 'https://dentcast.ir/insight/insight-6.html' }));
    btn.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(shared).toEqual([{ title: 'یک مقاله', url: 'https://dentcast.ir/insight/insight-6.html' }]);
    expect(calls).toEqual([['content_shared', 'insight/insight-6']]);
  });

  it('credits nothing when the reader backs out of the share sheet', async () => {
    // A rejected navigator.share() is the one honest "no" any platform gives us
    // (a RESOLVED one proves nothing — some platforms resolve on dismiss), so it
    // is the one signal that must be obeyed.
    (navigator as unknown as { share: unknown }).share = () => Promise.reject(new Error('AbortError'));
    initShareScoring('insight/insight-7');
    const btn = buildShareButton(() => ({ title: 'ت', url: 'https://dentcast.ir/insight/insight-7.html' }));
    btn.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(calls).toEqual([]);
  });
});
