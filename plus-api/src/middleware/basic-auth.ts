import crypto from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/**
 * HTTP Basic auth for the founder-only admin page. Credentials come from
 * ADMIN_USER / ADMIN_PASSWORD. A browser navigating to /admin gets the native
 * login prompt via the WWW-Authenticate challenge.
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [user, pass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
    if (safeEqual(user || '', config.admin.user) && safeEqual(pass || '', config.admin.password)) {
      return;
    }
  }
  reply
    .header('WWW-Authenticate', 'Basic realm="DentCast Plus admin", charset="UTF-8"')
    .code(401)
    .send({ error: 'unauthorized' });
}
