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

export function clearSessionCookie(reply: FastifyReply): void {
  // The deletion cookie MUST carry the same attributes it was set with (path,
  // secure, sameSite, httpOnly). A browser only evicts a cookie when the clearing
  // Set-Cookie matches; dropping `Secure`/`SameSite` here left the httpOnly+Secure
  // session cookie in place, so logout appeared to do nothing (user stayed signed
  // in). Mirror setSessionCookie exactly (minus maxAge, which clearCookie sets to 0).
  reply.clearCookie(config.session.cookieName, {
    path: '/',
    httpOnly: true,
    secure: config.session.secure,
    sameSite: 'lax',
  });
}

/** Return the authenticated user id from the signed cookie, or null. */
export function readSession(request: FastifyRequest): string | null {
  const raw = request.cookies[config.session.cookieName];
  if (!raw) return null;
  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || unsigned.value === null) return null;
  return unsigned.value;
}
