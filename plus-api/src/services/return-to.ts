/**
 * The login funnel must return the user to the same article after OTP. We only
 * ever honor a same-origin relative path so an attacker cannot use `return_to`
 * as an open redirect. Anything else falls back to the dashboard.
 */
export function sanitizeReturnTo(value: unknown, fallback = '/plus/'): string {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  // must be a root-relative path, not a protocol-relative // or scheme:
  if (!v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  if (v.includes('\\')) return fallback;
  if (/^\/[a-z0-9.+-]*:/i.test(v)) return fallback;
  return v;
}
