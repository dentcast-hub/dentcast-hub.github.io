import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config } from '../src/config.js';
import { OpenAiCompatibleProvider, resetJsonMode } from '../src/providers/ai/openai-compatible.js';
import type { MatchKeyPointsInput } from '../src/providers/ai/types.js';

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

const INPUT: MatchKeyPointsInput = {
  keyPoints: [{ id: 'kp1', text: 'درد شبانه' }, { id: 'kp2', text: 'مولر اول' }],
  answer: 'درد شبانه در مولر اول',
  examples: [],
};

const KP1 = [{ id: 'kp1', state: 'covered' }];

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

/**
 * AI_JSON_MODE now defaults to FALSE, because the endpoint we run on rejects
 * response_format outright. The two tests below are specifically about what
 * happens on an endpoint where it IS requested, so they turn it on explicitly
 * and put it back afterwards.
 */
function withJsonModeOn(): () => void {
  const previous = config.ai.jsonMode;
  (config.ai as { jsonMode: boolean }).jsonMode = true;
  return () => { (config.ai as { jsonMode: boolean }).jsonMode = previous; };
}

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('openai-compatible matchKeyPoints', () => {
  it("returns the model's verdicts", async () => {
    stubFetch([ok({ points: [{ id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'missing' }] })]);

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual([{ id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'missing' }]);
  });

  it('retries a transient 400 and returns the successful re-roll', async () => {
    const f = stubFetch([
      status(400),
      ok({ points: KP1 }),
    ]);

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual(KP1);
    expect(f.calls()).toBe(2);
  });

  it('gives up after maxAttempts when the 400 is permanent', async () => {
    const f = stubFetch([status(400)]);

    await expect(provider.matchKeyPoints(INPUT)).rejects.toThrow('http 400');
    expect(f.calls()).toBe(config.ai.maxAttempts);
  });

  it('does NOT retry a 401 — a wrong key must fail fast', async () => {
    const f = stubFetch([status(401)]);

    await expect(provider.matchKeyPoints(INPUT)).rejects.toThrow('http 401');
    expect(f.calls()).toBe(1);
  });

  it('does NOT retry a 403 — a rejected key must fail fast', async () => {
    const f = stubFetch([status(403)]);

    await expect(provider.matchKeyPoints(INPUT)).rejects.toThrow('http 403');
    expect(f.calls()).toBe(1);
  });

  it('does NOT retry a 404 — a wrong gateway URL must fail fast', async () => {
    const f = stubFetch([status(404)]);

    await expect(provider.matchKeyPoints(INPUT)).rejects.toThrow('http 404');
    expect(f.calls()).toBe(1);
  });

  it('retries a network error / timeout', async () => {
    const f = stubFetch([
      Object.assign(new Error('fetch failed'), { name: 'TimeoutError' }),
      ok({ points: [] }),
    ]);

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual([]);
    expect(f.calls()).toBe(2);
  });

  it('retries a 200 whose body is not JSON (the model ignored JSON mode)', async () => {
    let i = 0;
    globalThis.fetch = vi.fn(async () => {
      i += 1;
      return i === 1
        ? new Response(JSON.stringify({ choices: [{ message: { content: 'سلام، نه JSON' } }] }), { status: 200 })
        : ok({ points: KP1 });
    }) as unknown as typeof fetch;

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual(KP1);
    expect(i).toBe(2);
  });

  it('retries a 200 with an empty choices array', async () => {
    let i = 0;
    globalThis.fetch = vi.fn(async () => {
      i += 1;
      return i === 1
        ? new Response(JSON.stringify({ choices: [] }), { status: 200 })
        : ok({ points: KP1 });
    }) as unknown as typeof fetch;

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual(KP1);
    expect(i).toBe(2);
  });

  it('drops response_format after the endpoint rejects it, and succeeds without', async () => {
    const restore = withJsonModeOn();
    // Exactly the ArvanCloud behaviour: response_format => 400, without it => 200.
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string } = {}) => {
      const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;
      bodies.push(body);
      return body.response_format ? status(400) : ok({ points: KP1 });
    }) as unknown as typeof fetch;

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual(KP1);

    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toHaveProperty('response_format');
    expect(bodies[1].response_format, 'retry must drop JSON mode').toBeUndefined();
    restore();
  });

  it('stays off once latched: a later call never re-sends response_format', async () => {
    const restore = withJsonModeOn();
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string } = {}) => {
      const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;
      bodies.push(body);
      return body.response_format ? status(400) : ok({ points: [] });
    }) as unknown as typeof fetch;

    await provider.matchKeyPoints(INPUT); // latches JSON mode off
    bodies.length = 0;
    await provider.matchKeyPoints(INPUT);

    expect(bodies).toHaveLength(1); // no wasted 400 on the second call
    expect(bodies[0].response_format).toBeUndefined();
    restore();
  });

  it('parses a ```json fenced answer (what a model returns without JSON mode)', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: '```json\n{"points": [{"id": "kp1", "state": "covered"}]}\n```' } }],
    }), { status: 200 })) as unknown as typeof fetch;

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual(KP1);
  });

  it('parses a JSON object buried in a sentence', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: 'بله حتماً: {"points": [{"id": "kp1", "state": "covered"}]} — امیدوارم کمک کند.' } }],
    }), { status: 200 })) as unknown as typeof fetch;

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual(KP1);
  });

  it('returns [] on a malformed-but-parseable answer instead of throwing', async () => {
    // The caller (services/challenge.ts) treats [] as an all-`unsure` answer and
    // queues it, never an error screen.
    stubFetch([ok({ points: 'not-an-array' })]);

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual([]);
  });

  it('drops unknown ids, invalid states and non-object entries', async () => {
    stubFetch([ok({ points: [{ id: 'kp1', state: 'covered' }, { id: 'kp9', state: 'covered' }, { id: 'kp2', state: 'maybe' }, null, 'kp2'] })]);

    await expect(provider.matchKeyPoints(INPUT)).resolves.toEqual(KP1);
  });
});

describe('AI_JSON_MODE default', () => {
  it('is OFF, so the gateway we actually run on never pays a doomed 400', async () => {
    expect(config.ai.jsonMode).toBe(false);

    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = vi.fn(async (_url: unknown, init: { body?: string } = {}) => {
      bodies.push(JSON.parse(init.body ?? '{}') as Record<string, unknown>);
      return ok({ points: [] });
    }) as unknown as typeof fetch;

    await provider.matchKeyPoints(INPUT);

    expect(bodies).toHaveLength(1);
    expect(bodies[0].response_format).toBeUndefined();
  });
});

describe('the timeout / retry-budget pair', () => {
  // These two only make sense together: the loop checks the budget BEFORE
  // sleeping, so a budget larger than the timeout buys another whole timeout of
  // waiting. The pair was 45s/20s, which produced no retry at all and a 45s
  // ceiling; a naive "raise the budget" fix would have made the ceiling worse.
  const BACKOFF = [400, 1200];

  function worstCase(timeout: number, budget: number, attempts: number) {
    let elapsed = 0;
    let used = 0;
    for (let a = 1; a <= attempts; a += 1) {
      elapsed += timeout;
      used = a;
      const delay = BACKOFF[Math.min(a - 1, BACKOFF.length - 1)];
      if (a >= attempts || elapsed + delay >= budget) break;
      elapsed += delay;
    }
    return { attempts: used, worstMs: elapsed };
  }

  it('keeps the worst case a user can wait under half a minute', () => {
    const w = worstCase(config.ai.timeoutMs, config.ai.retryBudgetMs, config.ai.maxAttempts);
    expect(w.worstMs).toBeLessThan(30_000);
  });

  it('still allows every attempt when failures are FAST', () => {
    // A 2.6s round (the measured median) failing three times must not be cut
    // short by the budget — that budget exists for stalls, not for quick errors.
    const fast = 2_600;
    let elapsed = 0;
    let used = 0;
    for (let a = 1; a <= config.ai.maxAttempts; a += 1) {
      elapsed += fast;
      used = a;
      const delay = BACKOFF[Math.min(a - 1, BACKOFF.length - 1)];
      if (a >= config.ai.maxAttempts || elapsed + delay >= config.ai.retryBudgetMs) break;
      elapsed += delay;
    }
    expect(used).toBe(config.ai.maxAttempts);
  });
});

describe('sampling temperature per model', () => {
  it('sends none to Claude models, 0 to the rest, and honours AI_TEMPERATURE', async () => {
    const { samplingTemperature } = await import('../src/providers/ai/openai-compatible.js');
    expect(samplingTemperature('Claude-Haiku-5.5', undefined)).toBeNull();
    expect(samplingTemperature('GPT-5-Nano', undefined)).toBe(0);
    expect(samplingTemperature('GPT-5-Nano', '')).toBeNull();
    expect(samplingTemperature('Claude-Haiku-5.5', '0.2')).toBe(0.2);
  });
});

