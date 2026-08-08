import { config } from './config.js';
import { applyRemoteIndex, indexSource } from './content-index.js';
import { applyRemotePathways, pathwaysSource } from './pathways.js';
import { applyRemoteBadges, badgesSource } from './badges.js';
import { applyRemoteQuota, quotaSource } from './quota.js';
import { applyRemoteLibrary, librarySource, libraryEtag } from './library.js';

/**
 * Keeps the taxonomy index and the pathway definitions current WITHOUT a
 * redeploy.
 *
 * Both files are generated in the site repo and shipped as static assets, but
 * the API reads them from `/app/*.json` baked into the image at build time. That
 * made every publish a deploy: the article itself went live on the static site
 * immediately, while the case assistant, reading compass, dashboard tree and
 * pathway pages kept serving whatever taxonomy the image was built with. At
 * three or four articles a day that is three or four image builds a day, purely
 * to hand the API a JSON file it could have fetched itself.
 *
 * So it fetches it. The baked copy stays exactly as it was and remains the boot
 * value and the permanent floor: if the network is down, if the site is
 * unreachable, if the response is garbage, the API keeps serving the last thing
 * it trusted. A refresh can only ever move forward to a payload that parses AND
 * passes the shape check — it can never blank the taxonomy out.
 *
 * The URL is our own published asset over HTTPS and its content is public data
 * that the browser already downloads on every dashboard open, so nothing secret
 * or new is exposed here. The validators in content-index.ts / pathways.ts are
 * what keep a truncated file or an HTML error page from being adopted.
 */

const TIMEOUT_MS = 10_000;

/**
 * First URL that answers with usable JSON wins. A list exists because the two
 * mirrors fail independently — Arvan (.ir) and Cloudflare (.org) serve the same
 * file, so an outage on one is not an outage on the taxonomy.
 */
async function fetchJson(urls: string[], label: string): Promise<unknown | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        // Defeat any intermediary cache: a CDN holding yesterday's copy would
        // reintroduce exactly the staleness this module exists to remove.
        headers: { 'cache-control': 'no-cache', accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue;
      return await res.json();
    } catch (_err) {
      // Try the next mirror; a total failure is reported by the caller once.
      continue;
    }
  }
  // eslint-disable-next-line no-console
  console.warn(`[content-refresh] ${label}: no mirror answered; keeping the current copy`);
  return null;
}

/** Log only on a real change, so a healthy poll every few minutes stays silent. */
let lastIndexSource = '';
let lastPathwaysSource = '';
let lastBadgesSource = '';
let lastQuotaSource = '';
let lastLibrarySource = '';

export async function refreshOnce(): Promise<void> {
  if (config.content.indexUrls.length) {
    const raw = await fetchJson(config.content.indexUrls, 'content-index');
    if (raw !== null && !applyRemoteIndex(raw)) {
      // eslint-disable-next-line no-console
      console.warn('[content-refresh] content-index: payload rejected by shape check; keeping the current copy');
    }
    const src = indexSource();
    if (src !== lastIndexSource) {
      lastIndexSource = src;
      // eslint-disable-next-line no-console
      console.log(`[content-refresh] content-index now served from ${src}`);
    }
  }

  if (config.content.pathwaysUrls.length) {
    const raw = await fetchJson(config.content.pathwaysUrls, 'pathways');
    if (raw !== null && !applyRemotePathways(raw)) {
      // eslint-disable-next-line no-console
      console.warn('[content-refresh] pathways: payload rejected by shape check; keeping the current copy');
    }
    const src = pathwaysSource();
    if (src !== lastPathwaysSource) {
      lastPathwaysSource = src;
      // eslint-disable-next-line no-console
      console.log(`[content-refresh] pathways now served from ${src}`);
    }
  }

  if (config.content.badgesUrls.length) {
    const raw = await fetchJson(config.content.badgesUrls, 'badges');
    if (raw !== null && !applyRemoteBadges(raw)) {
      // eslint-disable-next-line no-console
      console.warn('[content-refresh] badges: payload rejected by shape check; keeping the current copy');
    }
    const src = badgesSource();
    if (src !== lastBadgesSource) {
      lastBadgesSource = src;
      // eslint-disable-next-line no-console
      console.log(`[content-refresh] badges now served from ${src}`);
    }
  }

  // The free tier's allowances. This is the one file here that decides what a
  // reader may DO rather than what they are shown, so a rejected payload is
  // logged the same way but matters more: the API keeps the last limits it
  // trusted, which is always the safe direction — a stale allowance is a
  // slightly wrong price, while an empty one would lock every free reader out
  // of every feature at once.
  if (config.content.quotaUrls.length) {
    const raw = await fetchJson(config.content.quotaUrls, 'quota');
    if (raw !== null && !applyRemoteQuota(raw)) {
      // eslint-disable-next-line no-console
      console.warn('[content-refresh] quota: payload rejected by shape check; keeping the current copy');
    }
    const src = quotaSource();
    if (src !== lastQuotaSource) {
      lastQuotaSource = src;
      // eslint-disable-next-line no-console
      console.log(`[content-refresh] quota now served from ${src}`);
    }
  }

  // The paper cabinet's link map. Unlike the four above this file is ~6 MB, so
  // it is the one refresh that asks "only if it changed": an If-None-Match with
  // the ETag we already hold makes an unchanged poll a headers-only 304 instead
  // of six megabytes every few minutes. Without this the API would only learn
  // about a newly filed paper on the next image build, and a publish that adds
  // one would leave its button 404ing until then.
  if (config.content.libraryUrls.length) {
    for (const url of config.content.libraryUrls) {
      try {
        const headers: Record<string, string> = { accept: 'application/json' };
        const tag = libraryEtag();
        if (tag) headers['if-none-match'] = tag;
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
        if (res.status === 304) break;      // current; nothing to do
        if (!res.ok) continue;              // try the other mirror
        if (!applyRemoteLibrary(await res.json(), res.headers.get('etag') || '')) {
          // eslint-disable-next-line no-console
          console.warn('[content-refresh] library: payload rejected by shape check; keeping the current copy');
        }
        break;
      } catch (_err) {
        continue;
      }
    }
    const src = librarySource();
    if (src !== lastLibrarySource) {
      lastLibrarySource = src;
      // eslint-disable-next-line no-console
      console.log(`[content-refresh] library links now served from ${src}`);
    }
  }
}

/**
 * Start polling. Returns a stop() like the other background workers.
 *
 * Called from index.ts, never from buildServer(), so tests never start a real
 * timer or touch the network — same rule the schedulers follow.
 */
export function startContentRefresh(): () => void {
  if (!config.content.indexUrls.length && !config.content.pathwaysUrls.length
      && !config.content.badgesUrls.length && !config.content.quotaUrls.length
      && !config.content.libraryUrls.length) {
    return () => { /* not configured: the baked files are the whole story */ };
  }
  // Fetch once at boot rather than waiting out the first interval, so a
  // container restarted right after a publish is current immediately.
  void refreshOnce().catch(() => { /* never let a refresh failure crash boot */ });

  const timer = setInterval(() => {
    void refreshOnce().catch(() => { /* logged inside; never throws upward */ });
  }, Math.max(30, config.content.refreshSeconds) * 1000);
  // Do not keep the process alive solely for this timer.
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
}
