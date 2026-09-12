import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { verifyCertificate, listCertificates } from '../services/certificates.js';
import { getPathwayById, getPathways } from '../pathways.js';
import { examStates, examUrl } from '../services/pathway-exams.js';

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

    /**
     * GET /certificates — mine, plus the wall to hang them on.
     *
     * Any plan: a certificate is the reader's own, and the premium gate
     * belongs to EARNING one, not to looking at it.
     *
     * `pathways` is every full pathway (bundles excluded — 5-8 steps is not
     * certificate-sized), each with its glyph and the certificate held for
     * it, or null. The profile's wall draws a disc per pathway and ticks the
     * ones earned, exactly as the badge wall shows locked badges: a shelf
     * with only the earned ones on it says nothing about what there is to
     * earn. A REVOKED certificate leaves its pathway un-ticked — the wall
     * shows what stands today — while `certificates` still lists it, because
     * that list is the record.
     *
     * `exam` is one word per pathway on where this reader's exam stands
     * (services/pathway-exams.ts examStates) plus the exam page's URL, so
     * the wall's locked card can say «آزمون آماده است» and lead there
     * rather than always «مسیر را تمام کن».
     */
    scoped.get('/certificates', async (request, reply) => {
      const rows = await listCertificates(request.user!.id);
      const full = getPathways().filter((p) => p.kind !== 'bundle');
      const exams = await examStates(request.user!.id, full.map((p) => p.id));
      const shape = (c: typeof rows[number]) => ({
        id: c.id,
        pathway_id: c.pathway_id,
        pathway_title_fa: getPathwayById(c.pathway_id)?.title_fa ?? c.pathway_id,
        verify_code: c.verify_code,
        holder_name: c.holder_name,
        issued_at: c.issued_at,
        revoked_at: c.revoked_at,
        verify_url: `/plus/certificate.html?c=${c.verify_code}`,
      });
      const live = new Map(rows.filter((c) => !c.revoked_at).map((c) => [c.pathway_id, c]));
      return reply.send({
        certificates: rows.map(shape),
        pathways: full.map((p) => ({
          id: p.id,
          title_fa: p.title_fa,
          short_fa: p.short_fa ?? null,
          glyph: p.glyph ?? null,
          certificate: live.has(p.id) ? shape(live.get(p.id)!) : null,
          exam: { state: exams.get(p.id) ?? 'no_form', url: examUrl(p.id) },
        })),
      });
    });
  });
}
