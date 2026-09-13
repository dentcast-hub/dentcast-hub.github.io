import { config } from './config.js';
import { applyRemoteIndex, indexSource } from './content-index.js';
import { applyRemotePathways, pathwaysSource } from './pathways.js';
import { applyRemoteBadges, badgesSource } from './badges.js';
import { applyRemoteFlashcards, flashcardsSource } from './flashcards.js';

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
 * A CACHE KEY we have never asked for before, appended to every refresh fetch.
 *
 * This module used to send `cache-control: no-cache` as a REQUEST header and
 * call that "defeat any intermediary cache". It is not: a request header is a
 * hint to an origin, and an edge does not have to honour it — Cloudflare
 * ignores `Cache-Control` on an inbound request by default, and the repo's own
 * `_headers` (which sets `no-cache` on `/plus/*`) is read by Cloudflare alone,
 * so on the Arvan mirror nothing was asking for a fresh copy at all. A rename
 * inside pathways.json could therefore sit published on the site and invisible
 * in the product for as long as an edge chose to hold it, with the refresh loop
 * reporting success every five minutes (founder, 2026-09-13 — the implant
 * pathway's new name).
 *
 * A query parameter is not a hint. It changes the URL, and a URL nothing has
 * fetched before cannot be answered from a cache, on any CDN, with no rules to
 * configure on either mirror. The header stays as well — it costs nothing and
 * some intermediaries do respect it.
 *
 * The cost is one origin hit per file per poll, which is what this loop is FOR.
 */
function bustUrl(url: string, stamp: number): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}_dc=${stamp}`;
}

/**
 * First URL that answers with usable JSON wins. A list exists because the two
 * mirrors fail independently — Arvan (.ir) and Cloudflare (.org) serve the same
 * file, so an outage on one is not an outage on the taxonomy.
 */
async function fetchJson(urls: string[], label: string): Promise<unknown | null> {
  const stamp = Date.now();
  const errors: string[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(bustUrl(url, stamp), {
        headers: { 'cache-control': 'no-cache', accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) { errors.push(`${url} → ${res.status}`); continue; }
      return await res.json();
    } catch (err) {
      // Try the next mirror; a total failure is reported by the caller once.
      errors.push(`${url} → ${(err as Error).message}`);
      continue;
    }
  }
  note(label, { error: errors.join(' · ') || 'no mirror answered' });
  // eslint-disable-next-line no-console
  console.warn(`[content-refresh] ${label}: no mirror answered; keeping the current copy`);
  return null;
}

/* ------------------------------------------------------------- what is live -- */

/**
 * Which copy of each file is actually in service, and when it last arrived.
 *
 * Before this, `pathwaysSource()` was written to stdout at boot and on change
 * and nowhere else — so from outside the container "the published file has not
 * been picked up" was indistinguishable from "PATHWAYS_URL was never set in
 * this deployment" and from "an edge is holding an old copy". Three different
 * problems with three different fixes and one symptom. The founder should not
 * have to read container logs to tell them apart, so `GET /admin/content`
 * reports this and `POST /admin/content/refresh` runs the poll on demand
 * instead of waiting out the interval.
 */
export interface ContentFileStatus {
  key: 'content-index' | 'pathways' | 'badges' | 'flashcards';
  /** The env var that turns the refresh on for this file. */
  env: string;
  configured: boolean;
  /** What getX() is serving right now: 'image/disk' or 'published (…)'. */
  source: string;
  last_try_at: string | null;
  /** When a payload was last ADOPTED — not merely fetched. */
  last_ok_at: string | null;
  last_error: string | null;
}

const FILES: Array<{
  key: ContentFileStatus['key'];
  env: string;
  urls: () => string[];
  apply: (raw: unknown) => boolean;
  source: () => string;
}> = [
  { key: 'content-index', env: 'CONTENT_INDEX_URL', urls: () => config.content.indexUrls, apply: applyRemoteIndex, source: indexSource },
  { key: 'pathways', env: 'PATHWAYS_URL', urls: () => config.content.pathwaysUrls, apply: applyRemotePathways, source: pathwaysSource },
  { key: 'badges', env: 'BADGES_URL', urls: () => config.content.badgesUrls, apply: applyRemoteBadges, source: badgesSource },
  { key: 'flashcards', env: 'FLASHCARDS_URL', urls: () => config.content.flashcardsUrls, apply: applyRemoteFlashcards, source: flashcardsSource },
];

const state = new Map<string, { last_try_at: string | null; last_ok_at: string | null; last_error: string | null }>();

function note(key: string, patch: { ok?: true; error?: string | null }): void {
  const now = new Date().toISOString();
  const cur = state.get(key) ?? { last_try_at: null, last_ok_at: null, last_error: null };
  state.set(key, {
    last_try_at: now,
    last_ok_at: patch.ok ? now : cur.last_ok_at,
    last_error: patch.ok ? null : (patch.error ?? cur.last_error),
  });
}

export function contentStatus(): ContentFileStatus[] {
  return FILES.map((f) => {
    const s = state.get(f.key) ?? { last_try_at: null, last_ok_at: null, last_error: null };
    return {
      key: f.key, env: f.env, configured: f.urls().length > 0, source: f.source(),
      last_try_at: s.last_try_at, last_ok_at: s.last_ok_at, last_error: s.last_error,
    };
  });
}

/** Test-only: forget what the poller has recorded. */
export function resetContentStatus(): void {
  state.clear();
}

/** Log only on a real change, so a healthy poll every few minutes stays silent. */
const lastLogged = new Map<string, string>();

/**
 * One pass over every configured file. Table-driven rather than four copies of
 * the same twelve lines: the four differed only in which validator they called,
 * and a fifth file should be a row in FILES, not another paragraph here.
 */
export async function refreshOnce(): Promise<void> {
  for (const f of FILES) {
    if (!f.urls().length) continue;
    const raw = await fetchJson(f.urls(), f.key);
    if (raw !== null) {
      if (f.apply(raw)) {
        note(f.key, { ok: true });
      } else {
        note(f.key, { error: 'payload rejected by shape check' });
        // eslint-disable-next-line no-console
        console.warn(`[content-refresh] ${f.key}: payload rejected by shape check; keeping the current copy`);
      }
    }
    const src = f.source();
    if (src !== lastLogged.get(f.key)) {
      lastLogged.set(f.key, src);
      // eslint-disable-next-line no-console
      console.log(`[content-refresh] ${f.key} now served from ${src}`);
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
  if (!FILES.some((f) => f.urls().length)) {
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
