import type { FastifyInstance } from 'fastify';
import { clinicStatus } from '../services/clinic.js';

/**
 * GET /clinic/status — is the clinic away today?
 *
 * The one public, sessionless route in this API besides /health and
 * GET /threads/public. It has to be: the caller is the contact card at
 * /card/, which anonymous visitors open and which knows nothing about
 * accounts. It answers about the clinic's door, not about anybody's reader —
 * there is nothing personal in it.
 *
 *   { ok: true, closed: false }
 *   { ok: true, closed: true, text, starts_on, ends_on, back_on }
 *
 * `text` is the whole contract: the card prints it and computes nothing. Any
 * failure at all — no row, no database, no network — leaves the card on its
 * own ordinary open/closed pill, so this route can never be the reason the
 * card says nothing.
 */
export async function clinicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/clinic/status', async (_request, reply) => {
    return reply.send({ ok: true, ...(await clinicStatus()) });
  });
}
