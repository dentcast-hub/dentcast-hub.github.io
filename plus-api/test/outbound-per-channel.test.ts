import { describe, it, expect, afterEach } from 'vitest';
import { config } from '../src/config.js';
import { webPushOptions, proxyForChannel, hostOfProxy, probe } from '../src/providers/outbound.js';

/**
 * THE REGRESSION (2026-08-07). The egress proxy used to be ONE key shared by
 * every international destination: webPushOptions() read config.outbound.proxyUrl
 * unconditionally, and that key fell back to HTTPS_PROXY/https_proxy. So a proxy
 * added to rescue Telegram — or a platform-level variable nobody set with
 * notifications in mind — was mounted on web push too. If it could not reach
 * FCM/APNs it killed web push, which had been working direct, while Bale (never
 * proxied) kept delivering. The symptom, "only Bale arrives", pointed at egress
 * rather than at the knob that caused it.
 *
 * These tests hold the channels apart.
 */

const saved = { proxyUrl: config.outbound.proxyUrl, webPushProxyUrl: config.outbound.webPushProxyUrl };

afterEach(() => {
  config.outbound.proxyUrl = saved.proxyUrl;
  config.outbound.webPushProxyUrl = saved.webPushProxyUrl;
});

describe('per-channel egress routing', () => {
  it('a proxy set for Telegram leaves web push direct', () => {
    config.outbound.proxyUrl = 'http://telegram-proxy.example:8080';
    config.outbound.webPushProxyUrl = '';

    // The one line that caused the outage.
    expect(webPushOptions().proxy).toBeUndefined();
    expect(proxyForChannel('webpush')).toBe('');
    // ...while Telegram genuinely gets the proxy it was set for.
    expect(proxyForChannel('telegram')).toBe('http://telegram-proxy.example:8080');
  });

  it('web push takes a proxy only from its own variable', () => {
    config.outbound.proxyUrl = 'http://telegram-proxy.example:8080';
    config.outbound.webPushProxyUrl = 'http://push-proxy.example:3128';

    expect(webPushOptions().proxy).toBe('http://push-proxy.example:3128');
    // Setting web push's proxy must not drag Telegram onto it either.
    expect(proxyForChannel('telegram')).toBe('http://telegram-proxy.example:8080');
  });

  it('empty means direct, so an unset variable is not a misconfiguration', () => {
    config.outbound.proxyUrl = '';
    config.outbound.webPushProxyUrl = '';

    expect(webPushOptions().proxy).toBeUndefined();
    expect(webPushOptions().timeout).toBe(config.outbound.timeoutMs);
    expect(proxyForChannel('telegram')).toBe('');
  });

  it('Bale is never proxied, whatever anyone sets', () => {
    config.outbound.proxyUrl = 'http://telegram-proxy.example:8080';
    config.outbound.webPushProxyUrl = 'http://push-proxy.example:3128';

    expect(proxyForChannel('bale')).toBe('');
  });

  it('HTTPS_PROXY is not a source of notification routing', () => {
    // config.ts reads OUTBOUND_PROXY_URL / WEBPUSH_PROXY_URL only. A platform
    // variable must not be able to decide delivery policy, so setting it here
    // changes nothing about where a channel goes.
    process.env.HTTPS_PROXY = 'http://platform-proxy.example:9999';
    try {
      config.outbound.proxyUrl = '';
      config.outbound.webPushProxyUrl = '';
      expect(webPushOptions().proxy).toBeUndefined();
      expect(proxyForChannel('telegram')).toBe('');
    } finally {
      delete process.env.HTTPS_PROXY;
    }
  });
});

describe('the health report can name the route', () => {
  it('hides proxy credentials, keeping host:port', () => {
    expect(hostOfProxy('http://user:secret@proxy.example:8080')).toBe('proxy.example:8080');
    expect(hostOfProxy('')).toBeNull();
    expect(hostOfProxy('not a url')).toBe('invalid-url');
  });

  it('a probe reports the route it actually took, not the global setting', async () => {
    config.outbound.proxyUrl = 'http://telegram-proxy.example:8080';

    // Explicitly direct, even though a global proxy exists: this is how web push
    // is now probed, and it must not be mislabelled "proxy".
    const r = await probe('http://127.0.0.1:1/', { proxy: false, timeoutMs: 300 });
    expect(r.via).toBe('direct');
    expect(r.proxy_host).toBeNull();
    expect(r.ok).toBe(false); // nothing listens on port 1; the label is the point
  });
});
