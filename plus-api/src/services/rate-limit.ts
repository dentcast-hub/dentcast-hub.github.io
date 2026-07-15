/**
 * In-process sliding-window rate limiter. Used for OTP requests (per phone, per
 * IP) and anonymous events (per IP). Kept out of the DB deliberately: the schema
 * is fixed to spec section 4. For a multi-instance deploy this moves behind the
 * same `consume` signature backed by Redis.
 */

type Bucket = number[]; // sorted-ish list of hit timestamps (ms)

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Record a hit against `key` and report whether it is within `max` hits per
 * `windowMs`. Call this once per attempt; it consumes a slot only when allowed.
 */
export function consume(key: string, max: number, windowMs: number, now = Date.now()): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= max) {
    const retryAfterMs = Math.max(0, hits[0] + windowMs - now);
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: max - hits.length, retryAfterMs: 0 };
}

/** Test/maintenance helper: forget all counters. */
export function resetRateLimits(): void {
  buckets.clear();
}

export const HOUR_MS = 60 * 60 * 1000;
