import crypto from 'node:crypto';

/**
 * In-process Bale connect-token store. When a logged-in user taps "connect Bale"
 * we mint a short, URL-safe token tied to their user id and hand back a deep link
 * `ble.ir/<bot>?start=<token>`. The user opens Bale and presses Start; the bot
 * webhook receives `/start <token>` and consumes it to learn WHICH DentCast
 * account this Bale chat belongs to.
 *
 * Held in memory (not the DB) for the same reason as the OTP store: the schema is
 * fixed and a single container is enough for this lifetime (tokens live minutes).
 * A multi-instance deployment would move this behind the same tiny interface
 * (Redis). Single-use and TTL-bounded so a leaked/old token can't be replayed.
 */

interface LinkEntry {
  userId: string;
  expiresAt: number;
}

const store = new Map<string, LinkEntry>();
export const BALE_LINK_TTL_SECONDS = 15 * 60; // 15 minutes to open Bale and press Start

/** Mint a fresh single-use token for a user, replacing any previous one they hold. */
export function issueBaleLinkToken(userId: string, now = Date.now()): string {
  // Drop any earlier token for this user so only the latest deep link is valid.
  for (const [token, entry] of store) {
    if (entry.userId === userId) store.delete(token);
  }
  // 18 random bytes -> ~24 url-safe chars; ample entropy, still a tidy deep link.
  const token = crypto.randomBytes(18).toString('base64url');
  store.set(token, { userId, expiresAt: now + BALE_LINK_TTL_SECONDS * 1000 });
  return token;
}

/** Resolve + consume a token. Returns the user id, or null if unknown/expired. */
export function consumeBaleLinkToken(token: string, now = Date.now()): string | null {
  const entry = store.get(token);
  if (!entry) return null;
  store.delete(token); // single use, whether or not it was still valid
  if (now > entry.expiresAt) return null;
  return entry.userId;
}

export function clearBaleLinkStore(): void {
  store.clear();
}
