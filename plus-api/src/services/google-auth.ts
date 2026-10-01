import crypto from 'node:crypto';
import { config } from '../config.js';
import { outboundFetch } from '../providers/outbound.js';

/**
 * «Sign in with Google» — verification of the ID token the Google Identity
 * Services button hands the browser (https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
 *
 * The shape is the Telegram Login Widget's, one level up: a provider signs a
 * payload about WHO this is, the browser posts it to us, and we check the
 * signature server-side before trusting a byte of it. Telegram signs with an
 * HMAC over the bot token; Google signs a JWT (RS256) with a key pair whose
 * PUBLIC half it publishes as a JWK set. So verification here is:
 *
 *   header.kid  -> the Google public key that signed this token
 *   signature   -> RSA-SHA256 over `header.payload`, against that key
 *   iss         -> accounts.google.com (with or without the scheme)
 *   aud         -> OUR client id, so a token minted for another site is refused
 *   exp / iat   -> fresh (one minute of skew either way)
 *
 * Deliberately NO dependency: Node 22 imports a JWK straight into a KeyObject
 * and verifies RS256 natively, and a JWT library would be the first package in
 * this API to parse untrusted input with its own quirks. The whole check is
 * ~40 lines and every one of them is on this page.
 *
 * THE KEY SET IS FETCHED, AND THE CONTAINER LIVES IN IRAN. googleapis.com is one
 * of the hosts Google answers selectively by region, so the fetch goes through
 * `outboundFetch` with its own route (GOOGLE_PROXY_URL — per destination, on the
 * same argument providers/outbound.ts makes for the notification channels: a
 * proxy added for one host must never silently reroute another) and a bounded
 * timeout. Keys are cached for the max-age Google states (clamped), a token
 * whose `kid` is unknown triggers at most one refetch a minute (Google rotates
 * keys; a flood of bad tokens must not become a flood of fetches), and a
 * refetch that fails keeps the LAST GOOD set rather than refusing every login
 * until the route returns — the same last-good doctrine content-refresh.ts uses.
 *
 * The scoring of what Google tells us is narrow on purpose: `sub` is the
 * identity (stable, never reused); `email` is kept only when Google itself says
 * `email_verified`, and only to name the account back to its owner in the
 * profile. Nothing here sends mail.
 */

export type GoogleAuthReason =
  | 'not_configured'    // no GOOGLE_CLIENT_ID on the server
  | 'malformed'         // not a three-part JWT, or header/payload not JSON
  | 'unsupported_alg'   // anything but RS256
  | 'unknown_key'       // header.kid not in Google's current set (after a refetch)
  | 'keys_unavailable'  // the key set could not be fetched and none is cached
  | 'bad_signature'
  | 'wrong_issuer'
  | 'wrong_audience'
  | 'expired'
  | 'not_yet_valid'
  | 'missing_sub';

export interface GoogleIdentity {
  /** Google's stable account id — the join key for auth_identities. */
  sub: string;
  /** Present only when Google asserts email_verified; never trusted otherwise. */
  email: string | null;
  name: string | null;
  picture: string | null;
}

export type GoogleAuthResult =
  | { ok: true; identity: GoogleIdentity }
  | { ok: false; reason: GoogleAuthReason };

/** One entry of Google's JWK set (only the RSA fields we use). */
export interface GoogleJwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
  use?: string;
}

export interface GoogleKeySet {
  keys: GoogleJwk[];
  /** How long this set may be served from cache. */
  maxAgeMs: number;
}

export type GoogleKeyFetcher = () => Promise<GoogleKeySet>;

const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const DEFAULT_MAX_AGE_MS = 60 * 60 * 1000;
const MIN_MAX_AGE_MS = 5 * 60 * 1000;
const MAX_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** A token naming an unknown kid refetches the set at most this often. */
const MISS_REFETCH_COOLDOWN_MS = 60 * 1000;

interface KeyCache {
  byKid: Map<string, crypto.KeyObject>;
  fetchedAt: number;
  maxAgeMs: number;
}

let cache: KeyCache | null = null;
let lastMissRefetchAt = 0;
let fetcher: GoogleKeyFetcher = fetchGoogleKeys;

/** Parse `max-age=N` out of a Cache-Control header; the default when absent. */
export function maxAgeFrom(cacheControl: string | null | undefined): number {
  const m = /(?:^|,)\s*max-age\s*=\s*(\d+)/i.exec(cacheControl ?? '');
  if (!m) return DEFAULT_MAX_AGE_MS;
  const ms = Number(m[1]) * 1000;
  return Math.min(MAX_MAX_AGE_MS, Math.max(MIN_MAX_AGE_MS, ms));
}

/** The production fetcher: Google's JWK set, through this destination's own route. */
async function fetchGoogleKeys(): Promise<GoogleKeySet> {
  const g = config.auth.google;
  const res = await outboundFetch(
    g.jwksUrl,
    { headers: { accept: 'application/json' } },
    { proxyUrl: g.proxyUrl, timeoutMs: g.timeoutMs },
  );
  if (!res.ok) throw new Error(`google jwks: http ${res.status}`);
  const body = (await res.json()) as { keys?: GoogleJwk[] };
  if (!body || !Array.isArray(body.keys)) throw new Error('google jwks: no keys array');
  return { keys: body.keys, maxAgeMs: maxAgeFrom(res.headers.get('cache-control')) };
}

/**
 * Tests inject a fetcher that serves their own RSA key; `null` restores the
 * network one. Either way the cache is dropped, so a test never verifies
 * against a key another test planted.
 */
export function setGoogleKeyFetcher(f: GoogleKeyFetcher | null): void {
  fetcher = f ?? fetchGoogleKeys;
  clearGoogleKeyCache();
}

export function clearGoogleKeyCache(): void {
  cache = null;
  lastMissRefetchAt = 0;
}

function toKeyObjects(keys: GoogleJwk[]): Map<string, crypto.KeyObject> {
  const out = new Map<string, crypto.KeyObject>();
  for (const k of keys) {
    if (!k || k.kty !== 'RSA' || !k.kid || !k.n || !k.e) continue;
    if (k.alg && k.alg !== 'RS256') continue;
    try {
      out.set(k.kid, crypto.createPublicKey({ key: { kty: 'RSA', n: k.n, e: k.e }, format: 'jwk' }));
    } catch {
      // One malformed entry must not take the whole set down.
    }
  }
  return out;
}

/** Refresh the cache; on failure keep whatever was there (last good). */
async function refresh(now: number): Promise<void> {
  try {
    const set = await fetcher();
    cache = { byKid: toKeyObjects(set.keys), fetchedAt: now, maxAgeMs: set.maxAgeMs };
  } catch (err) {
    if (!cache) throw err;
    // Stale beats nothing: a filtered route must not sign every reader out.
    cache.fetchedAt = now; // do not hammer the route; retry after one max-age
  }
}

async function keyFor(kid: string, now: number): Promise<crypto.KeyObject | null | 'unavailable'> {
  if (!cache || now - cache.fetchedAt > cache.maxAgeMs) {
    try {
      await refresh(now);
    } catch {
      return 'unavailable';
    }
  }
  let key = cache!.byKid.get(kid);
  if (!key && now - lastMissRefetchAt > MISS_REFETCH_COOLDOWN_MS) {
    // Google rotated keys since we cached: one more look, then give up.
    lastMissRefetchAt = now;
    try {
      await refresh(now);
    } catch {
      /* keep the last-good set */
    }
    key = cache!.byKid.get(kid);
  }
  return key ?? null;
}

function b64urlJson(part: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v !== '' ? v : null;
}

export interface VerifyOptions {
  /** Defaults to config.auth.google.clientId. Empty = not configured. */
  clientId?: string;
  /** Milliseconds since the epoch; defaults to Date.now(). */
  now?: number;
  /** Seconds of clock skew tolerated on exp/iat. */
  clockSkewSeconds?: number;
}

/**
 * Verify a Google ID token end to end. Never throws: every failure is a reason
 * the route can turn into a status code and a Persian sentence.
 */
export async function verifyGoogleIdToken(
  token: string,
  opts: VerifyOptions = {},
): Promise<GoogleAuthResult> {
  const clientId = opts.clientId ?? config.auth.google.clientId;
  if (!clientId) return { ok: false, reason: 'not_configured' };
  const now = opts.now ?? Date.now();
  const skew = (opts.clockSkewSeconds ?? config.auth.google.clockSkewSeconds) * 1000;

  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [h, p, s] = parts;
  const header = b64urlJson(h);
  const payload = b64urlJson(p);
  if (!header || !payload) return { ok: false, reason: 'malformed' };
  if (header.alg !== 'RS256') return { ok: false, reason: 'unsupported_alg' };
  const kid = str(header.kid);
  if (!kid) return { ok: false, reason: 'malformed' };

  const key = await keyFor(kid, now);
  if (key === 'unavailable') return { ok: false, reason: 'keys_unavailable' };
  if (!key) return { ok: false, reason: 'unknown_key' };

  let sigOk = false;
  try {
    sigOk = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${h}.${p}`, 'utf8'),
      key,
      Buffer.from(s, 'base64url'),
    );
  } catch {
    sigOk = false;
  }
  if (!sigOk) return { ok: false, reason: 'bad_signature' };

  // Claims — checked only AFTER the signature, so a forged token never gets
  // to steer which error it is shown.
  const iss = str(payload.iss);
  if (!iss || !ISSUERS.has(iss)) return { ok: false, reason: 'wrong_issuer' };
  const aud = payload.aud;
  const audOk = Array.isArray(aud) ? aud.includes(clientId) : aud === clientId;
  if (!audOk) return { ok: false, reason: 'wrong_audience' };
  const exp = typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  if (!exp || exp + skew < now) return { ok: false, reason: 'expired' };
  const iat = typeof payload.iat === 'number' ? payload.iat * 1000 : 0;
  if (iat && iat - skew > now) return { ok: false, reason: 'not_yet_valid' };
  const sub = str(payload.sub);
  if (!sub) return { ok: false, reason: 'missing_sub' };

  const verified = payload.email_verified === true || payload.email_verified === 'true';
  return {
    ok: true,
    identity: {
      sub,
      email: verified ? str(payload.email) : null,
      name: str(payload.name),
      picture: str(payload.picture),
    },
  };
}

/**
 * The owner's own address, half hidden: `foad.shahabian@gmail.com` reads as
 * `f•••••••••••n@gmail.com`. Shown in the profile so a reader can tell WHICH
 * Google account is connected without the page printing the whole thing into
 * a screenshot. One or two characters before the @ are kept whole.
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return local + domain;
  return local[0] + '•'.repeat(Math.max(3, local.length - 2)) + local[local.length - 1] + domain;
}
