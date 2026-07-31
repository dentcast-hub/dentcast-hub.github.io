import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config } from '../src/config.js';
import { OpenAiCompatibleProvider, resetJsonMode } from '../src/providers/ai/openai-compatible.js';
import type { NarrowRoundInput } from '../src/providers/ai/types.js';

/**
 * Retry behaviour of the openai-compatible provider. The ArvanCloud gateway was
 * observed answering a valid request with a generic 400 that then succeeded
 * unchanged, so 400 is retried here — unusual enough that it deserves a test
 * pinning it, along with the failures that must NOT be retried (a wrong key
 * should fail fast, not three times).
 *
 * `outboundFetch` calls global fetch, so a stubbed globalThis.fetch drives the
 * whole thing offline: no key, no network, no spend.
 */

const INPUT: NarrowRoundInput = {
  description: 'درد شبانه در مولر اول',
  history: [],
  catalog: [
    { key: 'operative', label: 'دندانپزشکی ترمیمی' },
    { key: 'occlusion', label: 'اکلوژن' },
  ],
};

/** A gateway response carrying the model's JSON payload. */
function ok(payload: unknown): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

function status(code: number): Response {
  return new Response(JSON.stringify({ error: 'nope' }), { status: code });
}

/** Queue of responses/throws, one per fetch call, in order. */
function stubFetch(queue: Array<Response | Error>): { calls: () => number } {
  let i = 0;
  globalThis.fetch = vi.fn(async () => {
    const next = queue[Math.min(i, queue.length - 1)];
    i += 1;
    if (next instanceof Error) throw next;
    return next.clone();
  }) as unknown as typeof fetch;
  return { calls: () => i };
}

const realFetch = globalThis.fetch;
let provider: OpenAiCompatibleProvider;

beforeEach(() => {
  provider = new OpenAiCompatibleProvider();
  // The JSON-mode latch is process-wide by design; un-latch it per test.
  resetJsonMode();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('openai-compatible retry', () => {
  it('retries a transient 400 and returns the successful re-roll', async () => {
    const f = stubFetch([
      status(400),
      ok({ done: false, question: 'کدام‌یک؟', options: ['operative'] }),
    ]);

    const out = await provider.narrowCase(INPUT);

    expect(f.calls()).toBe(2);
    expect(out).toEqual({
      done: false,
      question: 'کدام‌یک؟',
      options: [{ key: 'operative', label: 'دندانپزشکی ترمیمی' }],
    });
  });

  it('gives up after maxAttempts when the 400 is permanent', async () => {
    const f = stubFetch([status(400)]);

    await expect(provider.narrowCase(INPUT)).rejects.toThrow('http 400');
    expect(f.calls()).toBe(config.ai.maxAttempts);
  });

  it('does NOT retry a 401 — a wrong key must fail fast', async () => {
    const f = stubFetch([status(401)]);

    await expect(provider.narrowCase(INPUT)).rejects.toThrow('http 401');
    expect(f.calls()).toBe(1);
  });

  it('does NOT retry a 404 — a wrong gateway URL must fail fast', async () => {
    const f = stubFetch([status(404)]);

    await expect(provider.narrowCase(INPUT)).rejects.toThrow('http 404');
    expect(f.calls()).toBe(1);
  });

  it('retries a network error / timeout', async () => {
    const f = stubFetch([
      Object.assign(new Error('fetch failed'), { name: 'TimeoutError' }),
      ok({ done: true }),
    ]);

    await expect(provider.narrowCase(INPUT)).resolves.toEqual({ done: true });
    expect(f.calls()).toBe(2);
  });

  it('retries a 200 whose body is not JSON (the model ignored JSON mode)', async () => {
    let i = 0;
    globalThis.fetch = vi.fn(async () => {
      i += 1;
      return i === 1
        ? new Response(JSON.stringify({ choices: [{ message: { content: 'سلام، نه JSON' } }] }), { status: 200 })
        : ok({ done: true });
    }) as unknown as typeof fetch;

    await expect(provider.narrowCase(INPUT)).resolves.toEqual({ done: true });
    expect(i).toBe(2);
  });

  it('retries a 200 with an empty choices array', async () => {
    let i = 0;
    globalThis.fetch = vi.fn(async () => {
      i += 1;
      return i === 1
        ? new Response(JSON.stringify({ choices: [] }), { status: 200 })
        : ok({ done: true });
    }) as unknown as typeof fetch;

    await expect(provider.narrowCase(INPUT)).resolves.toEqual({ done: true });
    expect(i).toBe(2);
  });

  it('drops response_format after the endpoint rejects it, and succeeds without', async () => {
    // Exactly the ArvanCloud behaviour: response_format => 400, without it => 200.
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string } = {}) => {
      const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;
      bodies.push(body);
      return body.response_format
        ? status(400)
        : ok({ done: false, question: 'کدام؟', options: ['occlusion'] });
    }) as unknown as typeof fetch;

    const out = await provider.narrowCase(INPUT);

    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toHaveProperty('response_format');
    expect(bodies[1].response_format, 'retry must drop JSON mode').toBeUndefined();
    expect(out).toEqual({
      done: false,
      question: 'کدام؟',
      options: [{ key: 'occlusion', label: 'اکلوژن' }],
    });
  });

  it('stays off once latched: a later call never re-sends response_format', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string } = {}) => {
      const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;
      bodies.push(body);
      return body.response_format ? status(400) : ok({ done: true });
    }) as unknown as typeof fetch;

    await provider.narrowCase(INPUT); // latches JSON mode off
    bodies.length = 0;
    await provider.narrowCase(INPUT);

    expect(bodies).toHaveLength(1); // no wasted 400 on the second call
    expect(bodies[0].response_format).toBeUndefined();
  });

  it('parses a ```json fenced answer (what a model returns without JSON mode)', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: '```json\n{"done": false, "question": "کدام؟", "options": ["operative"]}\n```' } }],
    }), { status: 200 })) as unknown as typeof fetch;

    await expect(provider.narrowCase(INPUT)).resolves.toEqual({
      done: false,
      question: 'کدام؟',
      options: [{ key: 'operative', label: 'دندانپزشکی ترمیمی' }],
    });
  });

  it('parses a JSON object buried in a sentence', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: 'بله حتماً: {"done": true} — امیدوارم کمک کند.' } }],
    }), { status: 200 })) as unknown as typeof fetch;

    await expect(provider.narrowCase(INPUT)).resolves.toEqual({ done: true });
  });

  it('still drops option keys outside the catalog after a retry', async () => {
    const f = stubFetch([
      status(500),
      ok({ done: false, question: 'کدام؟', options: ['operative', 'INVENTED-KEY'] }),
    ]);

    const out = await provider.narrowCase(INPUT);

    expect(f.calls()).toBe(2);
    expect(out).toEqual({
      done: false,
      question: 'کدام؟',
      options: [{ key: 'operative', label: 'دندانپزشکی ترمیمی' }],
    });
  });
});
