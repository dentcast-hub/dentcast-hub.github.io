import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { validateSubmission } from '../services/des-gate.js';
import { allDois, allPmids, paperScope, pickIdentifier } from '../services/des-identity.js';
import { lookupExact } from '../services/des-library.js';
import {
  MAX_OPEN_PER_USER, openCountOf, openRequestsOf, createRequest,
} from '../services/des-requests.js';

const TITLE_MAX = 300;
const BODY_MAX = 60_000;
const LINK_MAX = 500;

/**
 * ارزیاب DES — the reader's side. A human (the founder) scores every new
 * paper from `GET /admin/des`; nothing here calls a model. See
 * .dentcast/des-scorer-handoff.md §6 and §0 (RULE 7: no AI provider anywhere
 * in this feature).
 *
 * A paper already in the library answers on the spot — no row is written, no
 * open-request slot is spent, and the response carries no hint that it came
 * from the library (handoff RULE 5): the reader is simply answered.
 */
export async function desRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  app.get('/des/state', async (request, reply) => {
    const open = await openRequestsOf(request.user!.id);
    return reply.send({
      ok: true,
      limit: MAX_OPEN_PER_USER,
      open: open.map((r) => ({
        reference: r.reference,
        title: r.title,
        has_pdf: r.has_pdf,
        created_at: r.created_at,
      })),
    });
  });

  app.post('/des/submit', async (request, reply) => {
    const body = request.body as {
      title?: unknown; body?: unknown; claim?: unknown; link?: unknown; has_pdf?: unknown;
    };
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, TITLE_MAX) : '';
    const text = typeof body.body === 'string' ? body.body.slice(0, BODY_MAX) : '';
    const claim = body.claim === 'FULL_TEXT' ? 'FULL_TEXT' as const : 'ABSTRACT_ONLY' as const;
    const link = typeof body.link === 'string' ? body.link.trim().slice(0, LINK_MAX) : '';
    const hasPdf = body.has_pdf === true;

    const gate = validateSubmission({ title, body: text, claim, hasPdf });
    if (gate.stop) {
      return reply.code(400).send({ ok: false, error: 'invalid_input', issues: gate.issues });
    }

    // Identifiers: the link field wins outright; body is only consulted when
    // the link is empty, and only when it names exactly one candidate — see
    // des-identity.ts's pickIdentifier for why (handoff §6.2 / RULE 1).
    const scope = paperScope(text);
    const head = scope.slice(0, 900).toLowerCase();
    const doi = pickIdentifier(allDois(link), allDois(scope), head);
    const pmid = pickIdentifier(allPmids(link), allPmids(scope), head);

    const hit = await lookupExact({ doi, pmid, title });
    if (hit) {
      // RULE 5: silent about itself. No `cached`/`served_from` field, no
      // timing hint — the reader is simply answered.
      return reply.send({ ok: true, answered: true, des: hit.des, hashtags: hit.hashtags });
    }

    const openNow = await openCountOf(request.user!.id);
    if (openNow >= MAX_OPEN_PER_USER) {
      return reply.code(429).send({
        ok: false,
        error: 'too_many_open',
        message: `هم‌زمان تا ${MAX_OPEN_PER_USER} درخواستِ باز می‌توانی داشته باشی.`,
      });
    }

    const req = await createRequest({
      userId: request.user!.id, title, body: text, claim, link: link || null, hasPdf,
    });
    return reply.send({ ok: true, answered: false, reference: req.reference, has_pdf: req.has_pdf });
  });
}
