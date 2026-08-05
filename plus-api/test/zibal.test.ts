import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  zibalRequest, zibalVerify, startUrl, readCallback, resultMessage, statusMessage, isSandbox,
} from '../src/services/zibal.js';
import { config } from '../src/config.js';

/**
 * The Zibal client (level 2.2). Everything here exists to protect one rule:
 * only `result: 100` from a server-to-server verify may be treated as a real
 * payment. The gateway's own documentation is unreachable from this build
 * environment, so these tests pin the FAIL-CLOSED behaviour rather than the
 * exact code table — a mis-transcribed code must cost us a false negative, and
 * can never cost us a subscription granted for money that did not arrive.
 */

let fetchMock: ReturnType<typeof vi.fn>;

/** Stub global fetch with one JSON reply. */
function replyWith(body: unknown, status = 200): void {
  fetchMock.mockResolvedValue({
    status,
    json: async () => body,
  } as unknown as Response);
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('zibalRequest', () => {
  it('opens a payment and returns where to send the customer', async () => {
    replyWith({ result: 100, trackId: 3313095131, message: 'success' });

    const r = await zibalRequest({ amountRial: 60_000_000, orderId: 'sub_abc_1' });

    expect(r.ok).toBe(true);
    expect(r.trackId).toBe('3313095131');
    expect(r.redirectUrl).toBe('https://gateway.zibal.ir/start/3313095131');
  });

  it('sends the amount in rial, unconverted, with the merchant and callback', async () => {
    replyWith({ result: 100, trackId: 1 });
    await zibalRequest({ amountRial: 60_000_000, orderId: 'sub_abc_1', mobile: '09121234567' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://gateway.zibal.ir/v1/request');
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.amount).toBe(60_000_000);      // rial, exactly as priced
    expect(sent.merchant).toBe(config.zibal.merchant);
    expect(sent.orderId).toBe('sub_abc_1');
    expect(sent.callbackUrl).toBe(config.zibal.callbackUrl);
    expect(sent.mobile).toBe('09121234567');
  });

  it('omits optional fields rather than sending empty ones', async () => {
    replyWith({ result: 100, trackId: 1 });
    await zibalRequest({ amountRial: 10_000_000, orderId: 'x' });

    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent).not.toHaveProperty('mobile');
    expect(sent).not.toHaveProperty('description');
  });

  it('fails on any result code other than 100', async () => {
    for (const result of [102, 103, 104, 202, 999]) {
      replyWith({ result, trackId: 555 });
      const r = await zibalRequest({ amountRial: 10_000_000, orderId: 'x' });
      expect(r.ok).toBe(false);
      expect(r.redirectUrl).toBeNull();
    }
  });

  it('fails when the gateway says 100 but returns no trackId', async () => {
    replyWith({ result: 100 });
    const r = await zibalRequest({ amountRial: 10_000_000, orderId: 'x' });
    expect(r.ok).toBe(false);
  });

  it('fails on a malformed body or a network error, never throws', async () => {
    fetchMock.mockResolvedValue({ status: 502, json: async () => { throw new Error('not json'); } } as unknown as Response);
    expect((await zibalRequest({ amountRial: 1, orderId: 'x' })).ok).toBe(false);

    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const r = await zibalRequest({ amountRial: 1, orderId: 'x' });
    expect(r.ok).toBe(false);
    expect(r.message).toContain('ECONNREFUSED');
  });
});

describe('zibalVerify', () => {
  it('confirms a real payment and reports what was actually paid', async () => {
    replyWith({
      result: 100, status: 1, amount: 60_000_000,
      refNumber: 1234567890, paidAt: '2026-08-05T21:00:00.000Z',
      cardNumber: '621986******1234', orderId: 'sub_abc_1',
    });

    const v = await zibalVerify('3313095131');

    expect(v.ok).toBe(true);
    expect(v.amountRial).toBe(60_000_000);
    expect(v.refNumber).toBe('1234567890');
    expect(v.status).toBe(1);
    expect(v.cardNumber).toBe('621986******1234');
  });

  it('treats every non-100 code as unpaid — including ones this file may have named wrongly', async () => {
    for (const result of [201, 202, 203, 102, 0, 42]) {
      replyWith({ result, status: 3, amount: 60_000_000 });
      expect((await zibalVerify('t')).ok).toBe(false);
    }
  });

  it('flags an already-verified payment as neither success nor plain failure', async () => {
    replyWith({ result: 201, status: 1, amount: 60_000_000 });
    const v = await zibalVerify('t');

    // Not ok: this call did not settle anything, so it must not grant a month.
    expect(v.ok).toBe(false);
    // But distinguishable, because the money IS real and the caller has to
    // reconcile rather than tell the customer the payment failed.
    expect(v.alreadyVerified).toBe(true);
  });

  it('fails closed on a network error, with no amount to accidentally trust', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));
    const v = await zibalVerify('t');

    expect(v.ok).toBe(false);
    expect(v.alreadyVerified).toBe(false);
    expect(v.amountRial).toBeNull();
  });

  it('carries the transaction status through as a readable reason', async () => {
    replyWith({ result: 202, status: 3 });
    const v = await zibalVerify('t');
    expect(v.statusText).toContain('لغو');
  });
});

describe('the callback is not evidence', () => {
  it('reads the query parameters without judging them', () => {
    const c = readCallback({ success: '1', trackId: '999', orderId: 'sub_x', status: '2' });
    expect(c).toEqual({ success: '1', trackId: '999', orderId: 'sub_x', status: '2' });
  });

  it('tolerates a caller who typed the URL by hand', () => {
    expect(readCallback({})).toEqual({ success: null, trackId: null, orderId: null, status: null });
    // success=1 with no trackId is exactly what a forged callback looks like;
    // the reader records it and lets verify be the one to say no.
    expect(readCallback({ success: '1' }).trackId).toBeNull();
  });
});

describe('gateway routing and mode', () => {
  it('defaults to the sandbox merchant, so an unconfigured deploy cannot take real money', () => {
    expect(config.zibal.merchant).toBe('zibal');
    expect(isSandbox()).toBe(true);
  });

  it('builds the start URL from the gateway base', () => {
    expect(startUrl(42)).toBe('https://gateway.zibal.ir/start/42');
  });

  it('names an unknown code by number instead of swallowing it', () => {
    expect(resultMessage(100)).toBe('موفق');
    expect(resultMessage(7777)).toContain('7777');
    expect(resultMessage(null)).toContain('پاسخی');
    expect(statusMessage(null)).toBeNull();
    expect(statusMessage(5)).toContain('موجودی');
  });
});
