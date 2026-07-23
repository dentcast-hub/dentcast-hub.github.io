import crypto from 'node:crypto';

/**
 * Telegram Login Widget verification (https://core.telegram.org/widgets/login).
 *
 * The widget hands the browser a payload of { id, first_name, last_name,
 * username, photo_url, auth_date, hash }. It is authentic iff:
 *
 *   data_check_string = every field EXCEPT `hash`, sorted by key,
 *                       joined as `key=value` with '\n'
 *   secret_key        = SHA256(bot_token)          // NOTE: the raw digest, not hex
 *   valid             = hex(HMAC_SHA256(data_check_string, secret_key)) === hash
 *
 * We then reject a stale `auth_date` so a captured-but-old payload cannot be
 * replayed indefinitely (the docs advise checking auth_date "to prevent the use
 * of outdated data"; we use a 24h window).
 *
 * We run TWO bots — @Dentcast_bot (/setdomain dentcast.org) and @Dentcast_irbot
 * (/setdomain dentcast.ir) — because a bot's login domain is bound 1:1. A given
 * payload is signed by exactly one of them, but the Telegram USER id is global,
 * so we simply accept a payload that validates against ANY of our bot tokens and
 * don't care which bot signed it (see verifyTelegramAuthAny).
 *
 * IMPORTANT: `params` must contain ONLY Telegram's own fields. The login route
 * adds its own query params (return_to, origin) to the widget's auth-url; those
 * MUST be stripped before calling this, or the signature will never match.
 */

export type TelegramAuthReason =
  | 'missing_hash'
  | 'missing_fields'
  | 'bad_signature'
  | 'expired';

export interface TelegramAuthResult {
  ok: boolean;
  reason?: TelegramAuthReason;
}

function dataCheckString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');
}

/** Constant-time check that `params.hash` is a valid HMAC for `token`. */
function signatureMatches(params: Record<string, string>, token: string): boolean {
  const secretKey = crypto.createHash('sha256').update(token).digest();
  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString(params))
    .digest('hex');
  // timingSafeEqual throws on unequal lengths, so guard first (a wrong-length
  // hash is simply invalid, not an error).
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(params.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verify a payload against a SET of bot tokens (accepts if any one matches).
 * Empty/blank tokens in the list are skipped.
 */
export function verifyTelegramAuthAny(
  params: Record<string, string>,
  tokens: string[],
  maxAgeSeconds: number,
  now: number = Date.now(),
): TelegramAuthResult {
  if (!params.hash) return { ok: false, reason: 'missing_hash' };
  if (!params.id || !params.auth_date) return { ok: false, reason: 'missing_fields' };

  const signatureOk = tokens.some((t) => t && signatureMatches(params, t));
  if (!signatureOk) return { ok: false, reason: 'bad_signature' };

  const authDate = Number(params.auth_date);
  if (!Number.isFinite(authDate)) return { ok: false, reason: 'missing_fields' };
  // Reject both too-old and implausibly-future timestamps (clock skew both ways).
  const ageSeconds = Math.floor(now / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds || ageSeconds < -maxAgeSeconds) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true };
}

/** Single-token convenience wrapper (used by unit tests). */
export function verifyTelegramAuth(
  params: Record<string, string>,
  botToken: string,
  maxAgeSeconds: number,
  now: number = Date.now(),
): TelegramAuthResult {
  return verifyTelegramAuthAny(params, [botToken], maxAgeSeconds, now);
}
