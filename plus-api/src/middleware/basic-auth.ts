import crypto from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { touchHeartbeat } from '../services/failsafe.js';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/**
 * HTTP Basic auth for the founder-only admin page. Credentials come from
 * ADMIN_USER / ADMIN_PASSWORD. A browser navigating to /admin gets the native
 * login prompt via the WWW-Authenticate challenge.
 *
 * A successful check is also PROOF OF LIFE for the dead-man's switch. This is the
 * single best place for it: only the founder holds these credentials, and every
 * admin route already passes through here, so the switch is fed by the founder's
 * ordinary work — publishing, checking the numbers, sending a test push — rather
 * than depending on them remembering a ritual. Fire-and-forget and debounced;
 * see services/failsafe.ts.
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [user, pass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
    if (safeEqual(user || '', config.admin.user) && safeEqual(pass || '', config.admin.password)) {
      // Awaited, not fire-and-forget. A floating write would land AFTER the
      // handler it belongs to, which both stamps the wrong source on a publish
      // (the generic 'admin' overwriting the 'publish' the handler just forced)
      // and lets /admin render a silence count the very request being served has
      // already reset. The debounce makes this at most one UPDATE an hour, and
      // admin traffic is one person; a failure is swallowed so a heartbeat can
      // still never fail the request that produced it.
      await touchHeartbeat('admin').catch(() => { /* a heartbeat must never fail a request */ });
      return;
    }
  }
  reply
    .header('WWW-Authenticate', 'Basic realm="DentCast Plus admin", charset="UTF-8"')
    .code(401)
    .send({ error: 'unauthorized' });
}
