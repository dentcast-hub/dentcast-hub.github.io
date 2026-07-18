import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';

/**
 * Session = an httpOnly, signed cookie carrying the user id. Stateless: no
 * server-side session table (schema is fixed to section 4). Signing is done by
 * @fastify/cookie with SESSION_SECRET. Logout clears the cookie.
 *
 * The site and API share a registrable domain in production (dentcast.org /
 * api.dentcast.org), so SameSite=Lax is correct; set SESSION_COOKIE_SECURE=true
 * behind HTTPS.
 */

const MAX_AGE_SECONDS = () => config.session.ttlDays * 24 * 60 * 60;

export function setSessionCookie(reply: FastifyReply, userId: string): void {
  reply.setCookie(config.session.cookieName, userId, {
    path: '/',
    httpOnly: true,
    secure: config.session.secure,
    sameSite: 'lax',
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
  const base = { path: '/', httpOnly: true, secure: config.session.secure, sameSite: 'lax' as const };
  reply.clearCookie(config.session.cookieName, base);
  // Also clear a DOMAIN-scoped variant (.dentcast.ir). The server sets a host-only
  // cookie today, but early builds/proxies could leave a Domain=... cookie behind,
  // and a host-only clear does NOT remove it — the user would stay logged in.
  // Emitting both Set-Cookie clears removes whichever variant the browser holds.
  const domain = registrableParent(request?.headers.host);
  if (domain) reply.clearCookie(config.session.cookieName, { ...base, domain });
}

/** Return the authenticated user id from the signed cookie, or null. */
export function readSession(request: FastifyRequest): string | null {
  const raw = request.cookies[config.session.cookieName];
  if (!raw) return null;
  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || unsigned.value === null) return null;
  return unsigned.value;
}
