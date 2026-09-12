import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { verifyCertificate, listCertificates } from '../services/certificates.js';
import { getPathwayById } from '../pathways.js';

/**
 * Certificates — the reader's own list, and the world's verify lookup.
 *
 * GET /certificates/verify/:code is the FOURTH sessionless route in this API
 * (beside /health, GET /threads/public and GET /clinic/status), and has to
 * be: the caller is whoever a certificate was shown to — an employer, a
 * colleague, LinkedIn's "credential URL" link — and they have no account
 * here. It answers about a document, not about a reader: name as printed,
 * pathway, date, revoked-or-not, and nothing that reaches an account. A code
 * that matches nothing is a plain 404 with no hint, so the route cannot be
 * used to tell "never issued" from "wrong code" any faster than guessing.
 *
 * It lives OUTSIDE the encapsulated scope on purpose — a preHandler applies
 * to every route in its context regardless of registration order, which is
 * the same lesson routes/support.ts learned with GET /threads/public.
 */
export async function certificateRoutes(app: FastifyInstance): Promise<void> {
  app.get('/certificates/verify/:code', async (request, reply) => {
    const { code } = request.params as { code: string };
    const v = await verifyCertificate(code);
    if (!v) return reply.code(404).send({ ok: false, error: 'not_found' });
    return reply.send({ ok: true, certificate: v });
  });

  await app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);

    // GET /certificates — mine. Any plan: a certificate is the reader's own,
    // and the premium gate belongs to earning one, not to looking at it.
    scoped.get('/certificates', async (request, reply) => {
      const rows = await listCertificates(request.user!.id);
      return reply.send({
        certificates: rows.map((c) => ({
          id: c.id,
          pathway_id: c.pathway_id,
          pathway_title_fa: getPathwayById(c.pathway_id)?.title_fa ?? c.pathway_id,
          verify_code: c.verify_code,
          holder_name: c.holder_name,
          issued_at: c.issued_at,
          revoked_at: c.revoked_at,
          verify_url: `/plus/certificate.html?c=${c.verify_code}`,
        })),
      });
    });
  });
}
