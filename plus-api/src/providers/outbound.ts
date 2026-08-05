import { config } from '../config.js';

/**
 * Outbound HTTP for the notification channels — one place for the two things a
 * container hosted in Iran gets wrong: a destination it can only reach through a
 * proxy, and a request that never comes back.
 *
 * WHY THIS EXISTS: on 2026-07-26 a redeploy landed the API on a pod with no
 * international egress. Telegram failed with a bare `fetch failed`, web push
 * failed with NO log line at all, and Bale kept working — so for eight hours the
 * only symptom was "some users stopped getting notifications". This module makes
 * that class of failure both survivable (proxy) and bounded (timeout); the
 * senders make it visible (they log every failure), and /admin/notify/health
 * answers "is it happening right now?" without sending anything.
 *
 * The proxy is for INTERNATIONAL destinations only (Telegram, FCM, APNs). Bale is
 * domestic and always goes direct: routing it through an egress proxy adds a hop
 * that can only fail.
 */

// The dispatcher is carried as `unknown` on purpose: @types/node and the undici
// package each ship their own (structurally incompatible) Dispatcher type, and
// naming either one here starts a version fight that adds no safety — the value
// only ever travels from ProxyAgent straight into fetch().

export interface OutboundOptions {
  /** Route through OUTBOUND_PROXY_URL when one is set. Default true; pass false for domestic hosts. */
  proxy?: boolean;
  /**
   * Use THIS proxy instead of the configured one, and use it regardless of
   * `proxy`. For a destination that needs a specific egress address rather than
   * merely a working route — the payment gateway, whose merchant registration
   * whitelists one outbound IP, while this container's egress IP is not stable
   * across redeploys. Empty string means direct, so an unset env var is simply
   * "no proxy" rather than a misconfiguration.
   */
  proxyUrl?: string;
  /** Overrides config.outbound.timeoutMs. 0 disables the timeout. */
  timeoutMs?: number;
}

/** True when an egress proxy is configured (does not mean it works — see probe()). */
export function proxyConfigured(): boolean {
  return Boolean(config.outbound.proxyUrl);
}

/** host:port of the proxy, never its credentials — safe to return from /admin. */
export function proxyHost(): string | null {
  if (!config.outbound.proxyUrl) return null;
  try {
    return new URL(config.outbound.proxyUrl).host;
  } catch {
    return 'invalid-url';
  }
}

// One dispatcher per proxy URL, built once and reused (each pools connections).
// Keyed rather than single because the egress proxy a destination needs for its
// IP is not the same proxy another needs for its route.
const dispatchers = new Map<string, Promise<unknown>>();

/**
 * undici's ProxyAgent, built once and reused (it pools connections). Imported
 * lazily so a deployment without a proxy never loads it, and a missing/broken
 * package degrades to a direct request with one warning instead of a crash.
 */
async function proxyDispatcher(proxyUrl: string = config.outbound.proxyUrl): Promise<unknown> {
  if (!proxyUrl) return undefined;
  let dispatcherPromise = dispatchers.get(proxyUrl);
  if (!dispatcherPromise) {
    dispatcherPromise = import('undici')
      .then((u) => new u.ProxyAgent(proxyUrl) as unknown)
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.warn(`[outbound] proxy unavailable, falling back to direct: ${(err as Error).message}`);
        return undefined;
      });
    dispatchers.set(proxyUrl, dispatcherPromise);
  }
  return dispatcherPromise;
}

/**
 * fetch() with a timeout and (optionally) the egress proxy. A plain fetch has NO
 * timeout: against a filtered host it can hang until the socket dies, which in a
 * notification batch means one unreachable user stalls everyone behind them.
 */
export async function outboundFetch(
  url: string,
  init: RequestInit = {},
  opts: OutboundOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? config.outbound.timeoutMs;
  const full: RequestInit = { ...init };
  if (!full.signal && timeoutMs > 0) full.signal = AbortSignal.timeout(timeoutMs);
  // An explicit proxyUrl wins over `proxy` in both directions: a destination
  // that needs a particular egress address needs it whether or not the default
  // proxy is in play, and must not silently fall back onto the wrong one.
  const proxyUrl = opts.proxyUrl ?? (opts.proxy !== false ? config.outbound.proxyUrl : '');
  if (proxyUrl) {
    const dispatcher = await proxyDispatcher(proxyUrl);
    if (dispatcher) (full as unknown as Record<string, unknown>).dispatcher = dispatcher;
  }
  return fetch(url, full);
}

/**
 * Per-request options for the `web-push` library. It has its own proxy + timeout
 * support (it uses node:https, not fetch, so it cannot share the dispatcher above).
 */
export function webPushOptions(): { proxy?: string; timeout: number } {
  const o: { proxy?: string; timeout: number } = { timeout: config.outbound.timeoutMs };
  if (config.outbound.proxyUrl) o.proxy = config.outbound.proxyUrl;
  return o;
}

/** A network error's short, log-safe description (timeouts say so explicitly). */
export function describeError(err: unknown, timeoutMs: number = config.outbound.timeoutMs): string {
  const e = err as { name?: string; message?: string; cause?: { message?: string } };
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
    return `timeout after ${timeoutMs}ms`;
  }
  const cause = e?.cause?.message;
  return cause ? `${e.message} (${cause})` : (e?.message ?? String(err));
}

export interface ProbeResult {
  url: string;
  via: 'direct' | 'proxy';
  ok: boolean;
  status?: number;
  error?: string;
  ms: number;
}

/**
 * Can this container reach that host AT ALL? Any HTTP status counts as reachable
 * — we are testing the network path, not the endpoint's semantics (api.telegram.org
 * answers 404 at the root, and that 404 is the good news). Sends nothing and
 * carries no credentials, so it is safe on a read-only admin route.
 */
export async function probe(url: string, opts: OutboundOptions = {}): Promise<ProbeResult> {
  const via: 'direct' | 'proxy' = opts.proxy !== false && proxyConfigured() ? 'proxy' : 'direct';
  const timeoutMs = opts.timeoutMs ?? config.outbound.probeTimeoutMs;
  const started = Date.now();
  try {
    const res = await outboundFetch(url, { method: 'GET' }, { proxy: opts.proxy, timeoutMs });
    // Drop the body: we only needed the response line, and an undrained body
    // keeps the socket busy.
    await res.body?.cancel().catch(() => {});
    return { url, via, ok: true, status: res.status, ms: Date.now() - started };
  } catch (err) {
    return { url, via, ok: false, error: describeError(err, timeoutMs), ms: Date.now() - started };
  }
}
