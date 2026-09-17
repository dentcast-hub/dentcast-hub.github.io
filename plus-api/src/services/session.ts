import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';

/**
 * Session = an httpOnly, signed cookie carrying the user id. Stateless: no
 * server-side session table (schema is fixed to section 4). Signing is done by
 * @fastify/cookie with SESSION_SECRET. Logout clears the cookie.
 *
 * The site reaches the API across a subdomain (dentcast.ir -> api.dentcast.ir,
 * and dentcast.org -> api.dentcast.org via a Cloudflare Worker). Strict mobile
 * browsers (iOS Safari / mobile Chrome) drop a SameSite=Lax cookie in that
 * cross-origin fetch/proxy context, so login worked on desktop but not mobile.
 * Use SameSite=None (which REQUIRES Secure) in production so the cookie survives;
 * fall back to Lax only in dev where Secure is off (None+insecure is rejected).
 */

const MAX_AGE_SECONDS = () => config.session.ttlDays * 24 * 60 * 60;

// SameSite=None needs Secure; dev (localhost, Secure off) keeps Lax.
const sameSite = (): 'none' | 'lax' => (config.session.secure ? 'none' : 'lax');

const baseAttrs = () => ({
  path: '/', httpOnly: true, secure: config.session.secure, sameSite: sameSite(),
});

/**
 * Set (or refresh) the session cookie. Passing the request lets this ALSO evict
 * a stale domain-scoped copy of the cookie (see clearSessionCookie): a browser
 * holding both sends both, and if the older, domain-scoped one is unreadable
 * it shadows the fresh login — the reader signs in successfully and is a guest
 * on the very next request, with the «خروج» button that would have cleared it
 * out of reach. Every login now cleans that up on its way in.
 */
export function setSessionCookie(reply: FastifyReply, userId: string, request?: FastifyRequest): void {
  const domain = registrableParent(request?.headers.host);
  if (domain) reply.clearCookie(config.session.cookieName, { ...baseAttrs(), domain });
  reply.setCookie(config.session.cookieName, userId, {
    ...baseAttrs(),
    signed: true,
    maxAge: MAX_AGE_SECONDS(),
  });
}

// Registrable parent of a request host, for the domain-scoped clear below:
// api.dentcast.ir -> .dentcast.ir, api.dentcast.org -> .dentcast.org. Returns
// null for localhost / bare IPs (dev), where a host-only cookie is used.
function registrableParent(host?: string): string | null {
  if (!host) return null;
  const h = host.split(':')[0];
  if (h === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return null;
  const parts = h.split('.');
  if (parts.length < 2) return null;
  return '.' + parts.slice(-2).join('.');
}

export function clearSessionCookie(reply: FastifyReply, request?: FastifyRequest): void {
  // The deletion cookie MUST carry the same attributes it was set with (path,
  // secure, sameSite, httpOnly). A browser only evicts a cookie when the clearing
  // Set-Cookie matches; dropping `Secure`/`SameSite` here left the httpOnly+Secure
  // session cookie in place, so logout appeared to do nothing (user stayed signed
  // in). Mirror setSessionCookie exactly (minus maxAge, which clearCookie sets to 0).
  const base = baseAttrs();
  reply.clearCookie(config.session.cookieName, base);
  // Also clear a DOMAIN-scoped variant (.dentcast.ir). The server sets a host-only
  // cookie today, but early builds/proxies could leave a Domain=... cookie behind,
  // and a host-only clear does NOT remove it — the user would stay logged in.
  // Emitting both Set-Cookie clears removes whichever variant the browser holds.
  const domain = registrableParent(request?.headers.host);
  if (domain) reply.clearCookie(config.session.cookieName, { ...base, domain });
}

/**
 * Every value the browser sent under the session cookie's name, in header
 * order. A browser that holds two cookies of one name (a host-only one and a
 * stale domain-scoped one) sends BOTH, and the cookie parser keeps only the
 * first — which is the OLDER one. Reading them all means a valid session is
 * found whichever position it arrived in.
 */
function cookieValues(request: FastifyRequest): string[] {
  const header = request.headers.cookie;
  if (!header) return [];
  const name = config.session.cookieName + '=';
  const out: string[] = [];
  for (const part of header.split(';')) {
    const p = part.trim();
    if (!p.startsWith(name)) continue;
    let v = p.slice(name.length);
    if (v.length > 1 && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    try { v = decodeURIComponent(v); } catch { /* keep as sent */ }
    out.push(v);
  }
  return out;
}

/** Return the authenticated user id from the signed cookie, or null. */
export function readSession(request: FastifyRequest): string | null {
  const parsed = request.cookies[config.session.cookieName];
  const candidates = cookieValues(request);
  if (parsed && !candidates.includes(parsed)) candidates.unshift(parsed);
  for (const raw of candidates) {
    const unsigned = request.unsignCookie(raw);
    if (unsigned.valid && unsigned.value !== null) return unsigned.value;
  }
  return null;
}
