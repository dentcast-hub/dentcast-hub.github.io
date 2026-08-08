import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * The paper cabinet's LINK MAP — the half of the catalogue the browser is not
 * given.
 *
 * `plus/library-index.json` (built by tools/build_library_index.py) carries what
 * the cabinet page draws: title, journal, type, topic, tags, and an `id`. This
 * module holds the other half — `id -> Drive URLs` — and it never leaves the
 * process except one paper at a time, through `GET /library/paper/:id`, after
 * that route has checked the subscription and the free allowance.
 *
 * WHY THE SPLIT EXISTS. The page used to fetch the whole 6 MB master catalogue,
 * `drive_view`/`drive_download` and all, which meant every visitor received
 * every paper's URL before the first card rendered. The library was called
 * premium on the homepage, but there was no gate anywhere in that path and
 * there could not have been: a static page reading a public JSON has no place
 * to put one. The boundary is here now because this is the first point in the
 * chain that knows who is asking.
 *
 * WHAT THIS DOES NOT CLAIM. The master catalogue is still a file in a public
 * repository and git history keeps every version of it, so the URLs that were
 * already published stay findable, and a Drive file shared by link stays
 * reachable to anyone holding one. This closes the site-side hole and makes
 * access measurable and revocable from today; it cannot un-publish the past.
 * The durable fix is on the Drive side — unshare the folder and mint short-lived
 * URLs from a service account — and it plugs in exactly here, at resolve().
 */

export interface PaperLinks {
  view: string | null;
  download: string | null;
}

let links = new Map<string, PaperLinks>();
let cachedMtimeMs = 0;
/** Set by content-refresh.ts once a published copy has been fetched. */
let remote: Map<string, PaperLinks> | null = null;
let remoteEtag = '';

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'dentcast_cabinet_full_catalog.json');
}

interface RawPaper {
  id?: string;
  drive_id?: string;
  drive_view?: string;
  drive_download?: string;
}

/**
 * Reduce a master catalogue to the map.
 *
 * Both URLs are derived from `drive_id` when the catalogue does not spell them
 * out, because that is the one field every matched paper carries and the two
 * URL shapes are fixed by Google. Deriving beats trusting: a catalogue row
 * whose `drive_view` was hand-edited to point somewhere else would otherwise be
 * a redirect this API happily signs its name to.
 */
function toMap(raw: unknown): Map<string, PaperLinks> {
  const doc = raw as { papers?: RawPaper[] } | RawPaper[];
  const papers = Array.isArray(doc) ? doc : (doc?.papers ?? []);
  const out = new Map<string, PaperLinks>();
  for (const p of papers) {
    const id = (p?.id || '').trim();
    if (!id) continue;
    const driveId = (p.drive_id || '').trim();
    if (driveId) {
      out.set(id, {
        view: `https://drive.google.com/file/d/${driveId}/view`,
        download: `https://drive.google.com/uc?export=download&id=${driveId}`,
      });
      continue;
    }
    // No drive_id: fall back to whatever the catalogue recorded, and only if it
    // is a Drive URL. Anything else is a data error, not a destination.
    const view = isDriveUrl(p.drive_view) ? p.drive_view! : null;
    const download = isDriveUrl(p.drive_download) ? p.drive_download! : null;
    if (view || download) out.set(id, { view, download });
  }
  return out;
}

function isDriveUrl(u: unknown): boolean {
  return typeof u === 'string' && /^https:\/\/(drive|docs)\.google\.com\//.test(u);
}

/**
 * Adopt a freshly fetched catalogue.
 *
 * An empty map is refused for the same reason applyRemotePathways refuses an
 * empty array: it passes every structural check while silently making every
 * paper unopenable, and no real edit produces one.
 */
export function applyRemoteLibrary(raw: unknown, etag = ''): boolean {
  const map = toMap(raw);
  if (map.size === 0) return false;
  remote = map;
  remoteEtag = etag;
  return true;
}

/** The ETag of the copy in hand, so a poll can ask for "only if changed". */
export function libraryEtag(): string {
  return remoteEtag;
}

export function librarySource(): string {
  return remote ? `published (${remote.size} paper(s))` : `image/disk (${current().size} paper(s))`;
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteLibrary(): void {
  remote = null;
  remoteEtag = '';
}

function current(): Map<string, PaperLinks> {
  if (remote) return remote;
  const path = config.libraryCatalogPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (links.size && mtime === cachedMtimeMs) return links;
    links = toMap(JSON.parse(readFileSync(path, 'utf8')));
    cachedMtimeMs = mtime;
  } catch (err) {
    if (links.size) return links; // keep the last good copy on a transient error
    // eslint-disable-next-line no-console
    console.warn(`[library] could not load ${path}; no paper will resolve`);
    links = new Map();
  }
  return links;
}

/** One paper's links, or null if the id is unknown or has no file. */
export function resolvePaper(id: string): PaperLinks | null {
  return current().get(id) ?? null;
}

/** How many papers are resolvable — for GET /health and the refresh log. */
export function libraryCount(): number {
  return current().size;
}
