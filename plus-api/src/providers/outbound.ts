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
 * THE PROXY IS PER CHANNEL (proxyForChannel below). It used to be one key shared
 * by every international destination, and that is how a healthy channel died
 * without a trace: a proxy set to rescue Telegram was mounted unconditionally on
 * web push too, so if it could not reach FCM/APNs it killed web push — which had
 * been working direct — while Bale, which is never proxied, kept delivering. The
 * outward symptom ("only Bale arrives") pointed at egress, not at the knob that
 * caused it. One key could not express "Telegram through a proxy, web push
 * direct", so nobody could see, or fix, the difference.
 *
 * Bale is domestic and is never proxied: routing it through an egress proxy adds
 * a hop that can only fail.
 */

// The dispatcher is carried as `unknown` on purpose: @types/node and the undici
// package each ship their own (structurally incompatible) Dispatcher type, and
// naming either one here starts a version fight that adds no safety — the value
// only ever travels from ProxyAgent straight into fetch().

export interface OutboundOptions {
  /** Route through the DEFAULT egress proxy (OUTBOUND_PROXY_URL, Telegram's) when
   *  one is set. Default true; pass false for domestic hosts. A channel with its
   *  own route passes `proxyUrl` instead — see proxyForChannel. */
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

/** The notification channels, as far as egress routing is concerned. */
export type NotifyChannel = 'telegram' | 'webpush' | 'bale';

/**
 * The egress route for ONE channel. '' means direct.
 *
 * Each channel reads its own variable, so setting a proxy for one can never
 * reroute another. Web push defaults to DIRECT and is moved only by
 * WEBPUSH_PROXY_URL — not by OUTBOUND_PROXY_URL, and not by a platform-level
 * HTTPS_PROXY (which config.ts no longer reads at all).
 */
export function proxyForChannel(channel: NotifyChannel): string {
  switch (channel) {
    // Domestic. Not configurable on purpose: there is no proxy that improves a
    // route to tapi.bale.ai from inside Iran, only ones that can break it.
    case 'bale': return '';
    case 'webpush': return config.outbound.webPushProxyUrl;
    case 'telegram': return config.outbound.proxyUrl;
    default: return '';
  }
}

/** host:port of a proxy URL, never its credentials — safe to return from /admin. */
export function hostOfProxy(proxyUrl: string): string | null {
  if (!proxyUrl) return null;
  try {
    return new URL(proxyUrl).host;
  } catch {
    return 'invalid-url';
  }
}

/** True when the DEFAULT egress proxy (Telegram's) is configured. Says nothing
 *  about whether it works — see probe() — or about any other channel. */
export function proxyConfigured(): boolean {
  return Boolean(config.outbound.proxyUrl);
}

/** host:port of the default egress proxy. */
export function proxyHost(): string | null {
  return hostOfProxy(config.outbound.proxyUrl);
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
  // proxyForChannel('webpush'), never config.outbound.proxyUrl: this line is the
  // regression. It used to read the shared key, so a proxy someone set for
  // Telegram — or an HTTPS_PROXY nobody set for notifications at all — was
  // forced onto FCM/APNs, and web push died on a route it never needed.
  const proxy = proxyForChannel('webpush');
  if (proxy) o.proxy = proxy;
  return o;
}

export interface BreakerStatus {
  open: boolean;
  consecutive_failures: number;
  reopen_in_ms: number | null;
}

export interface CircuitBreaker {
  /** May the next request go out? False means "skip this channel, cheaply". */
  allow(): boolean;
  /** The route answered — anything at all, including a 4xx. */
  succeeded(): void;
  /** The route did not answer (timeout / DNS / connection refused). */
  failed(reason: string): void;
  status(): BreakerStatus;
}

/**
 * Fail fast on a channel whose host has gone away.
 *
 * WHY: the send timeout is per USER. A channel that is down still costs the full
 * timeout for every reader in a fan-out, one after another — so on 2026-08-07 a
 * broadcast to every reader spent minutes doing nothing but waiting on Telegram,
 * blew past the gateway timeout (the founder saw a 504 and could not tell whether
 * the announcement had gone out), and left the whole API slow for everyone while
 * it ground through. The route was not going to come back inside that loop; the
 * only thing the waiting bought was damage.
 *
 * Only NETWORK failures trip it. An HTTP answer — even 403 "bot was blocked by
 * the user" — means the route is alive and this user is simply unreachable, which
 * is a fact about them and not about the channel.
 *
 * It re-tries by itself: after the cooldown exactly ONE request is let through,
 * and if the route answers, the channel closes and resumes. That keeps the
 * property telegram.ts was written for — "the code path is intact and self-heals
 * if the route returns" — while removing the cost of asking every single time.
 */
export function createCircuitBreaker(
  name: string,
  opts: { threshold?: number; cooldownMs?: number } = {},
): CircuitBreaker {
  const threshold = opts.threshold ?? config.outbound.breakerThreshold;
  const cooldownMs = opts.cooldownMs ?? config.outbound.breakerCooldownMs;
  let failures = 0;
  let openUntil = 0; // 0 = closed

  return {
    allow(): boolean {
      if (openUntil === 0) return true;
      if (Date.now() < openUntil) return false;
      // Half-open. Re-arming the timer BEFORE returning true is what makes this
      // one trial request rather than a flood: everything behind it is refused
      // again until the next cooldown elapses.
      openUntil = Date.now() + cooldownMs;
      // eslint-disable-next-line no-console
      console.log(`[breaker:${name}] cooldown elapsed — letting one request through to test the route`);
      return true;
    },
    succeeded(): void {
      if (openUntil !== 0) {
        // eslint-disable-next-line no-console
        console.log(`[breaker:${name}] route answered — closing, channel resumes`);
      }
      failures = 0;
      openUntil = 0;
    },
    failed(reason: string): void {
      failures += 1;
      if (failures >= threshold && openUntil === 0) {
        openUntil = Date.now() + cooldownMs;
        // Loud, once. The per-user warnings stop here, so without this line the
        // channel would go quiet exactly when it died — the thing this whole
        // subsystem exists to prevent.
        // eslint-disable-next-line no-console
        console.warn(
          `[breaker:${name}] OPEN after ${failures} consecutive network failures (${reason}).`
          + ` Skipping this channel for ${Math.round(cooldownMs / 1000)}s, then one trial request.`,
        );
      }
    },
    status(): BreakerStatus {
      const open = openUntil > Date.now();
      return {
        open,
        consecutive_failures: failures,
        reopen_in_ms: open ? openUntil - Date.now() : null,
      };
    },
  };
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
  /** host:port of the proxy this probe went through, null when direct. Named so
   *  a health report can never leave "which proxy?" to the reader's memory. */
  proxy_host: string | null;
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
  // Resolved EXACTLY the way outboundFetch resolves it, so `via` can never
  // disagree with the route the request actually took. It used to be computed
  // from the global proxyConfigured(), which reported "proxy" for a probe sent
  // through an explicit per-channel proxyUrl — and "proxy" for a channel that
  // does not use that proxy at all. A diagnosis that mislabels its own route is
  // worse than no diagnosis.
  const proxyUrl = opts.proxyUrl ?? (opts.proxy !== false ? config.outbound.proxyUrl : '');
  const via: 'direct' | 'proxy' = proxyUrl ? 'proxy' : 'direct';
  const timeoutMs = opts.timeoutMs ?? config.outbound.probeTimeoutMs;
  const proxy_host = hostOfProxy(proxyUrl);
  const started = Date.now();
  try {
    const res = await outboundFetch(url, { method: 'GET' }, { proxy: opts.proxy, proxyUrl: opts.proxyUrl, timeoutMs });
    // Drop the body: we only needed the response line, and an undrained body
    // keeps the socket busy.
    await res.body?.cancel().catch(() => {});
    return { url, via, proxy_host, ok: true, status: res.status, ms: Date.now() - started };
  } catch (err) {
    return { url, via, proxy_host, ok: false, error: describeError(err, timeoutMs), ms: Date.now() - started };
  }
}
