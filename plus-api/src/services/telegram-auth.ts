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

export function verifyTelegramAuth(
  params: Record<string, string>,
  botToken: string,
  maxAgeSeconds: number,
  now: number = Date.now(),
): TelegramAuthResult {
  const hash = params.hash;
  if (!hash) return { ok: false, reason: 'missing_hash' };
  if (!params.id || !params.auth_date) return { ok: false, reason: 'missing_fields' };

  const dataCheckString = Object.keys(params)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Constant-time compare. timingSafeEqual throws on unequal lengths, so guard
  // first (a wrong-length hash is simply invalid, not an error).
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  const authDate = Number(params.auth_date);
  if (!Number.isFinite(authDate)) return { ok: false, reason: 'missing_fields' };
  // Reject both too-old and implausibly-future timestamps (clock skew both ways).
  const ageSeconds = Math.floor(now / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds || ageSeconds < -maxAgeSeconds) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true };
}
