import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import {
  searchFulltext, indexedCount, upsertFulltexts, deleteFulltexts, fulltextInventory, PAPER_ID_RE,
  type FulltextUpload,
} from '../services/cabinet-fulltext.js';

/**
 * GET /cabinet/fulltext?q= — premium: which cabinet papers say this, with a
 * short fragment around the match (services/cabinet-fulltext.ts). The cabinet
 * page asks this beside its own catalogue search; a 401/402 there simply
 * means «no full-text section», never an error in the reader's face.
 */
export async function cabinetRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  app.get('/cabinet/fulltext', {
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: { q: { type: 'string', minLength: 2, maxLength: 200 } },
      },
    },
  }, async (request, reply) => {
    const { q } = request.query as { q: string };
    const [results, indexed] = await Promise.all([searchFulltext(q.trim()), indexedCount()]);
    return reply.send({ results, indexed });
  });
}

// One upload request: the tool batches to stay well under this.
const UPLOAD_BODY_LIMIT = 30 * 1024 * 1024;

/**
 * The founder's side, registered INSIDE adminRoutes (after its onRequest
 * requireAdmin hook), driven by tools/cabinet_fulltext.py:
 *   GET  /admin/cabinet-fulltext          what is indexed (id, sha256, pages)
 *   POST /admin/cabinet-fulltext          {papers:[{id,text,pages,sha256}]} upsert, unchanged sha = no write
 *   POST /admin/cabinet-fulltext/delete   {ids:[…]} a paper removed from the catalogue
 */
export async function adminCabinetFulltextRoutes(app: FastifyInstance): Promise<void> {
  app.get('/admin/cabinet-fulltext', async () => fulltextInventory());

  app.post('/admin/cabinet-fulltext', { bodyLimit: UPLOAD_BODY_LIMIT }, async (request, reply) => {
    const papers = (request.body as { papers?: unknown } | null)?.papers;
    if (!Array.isArray(papers) || !papers.length || papers.length > 500) return reply.code(400).send({ error: 'invalid_papers' });
    for (const p of papers as FulltextUpload[]) {
      if (!p || typeof p.id !== 'string' || !PAPER_ID_RE.test(p.id)) return reply.code(400).send({ error: 'invalid_id' });
      if (typeof p.text !== 'string' || !p.text.trim()) return reply.code(400).send({ error: 'empty_text', id: p.id });
      if (typeof p.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(p.sha256)) return reply.code(400).send({ error: 'invalid_sha256', id: p.id });
      if (p.pages != null && (!Number.isInteger(p.pages) || p.pages < 0)) return reply.code(400).send({ error: 'invalid_pages', id: p.id });
    }
    return { ok: true, ...(await upsertFulltexts(papers as FulltextUpload[])) };
  });

  app.post('/admin/cabinet-fulltext/delete', async (request, reply) => {
    const ids = (request.body as { ids?: unknown } | null)?.ids;
    if (!Array.isArray(ids) || !ids.length || ids.length > 5000 || !ids.every((id) => typeof id === 'string' && PAPER_ID_RE.test(id))) {
      return reply.code(400).send({ error: 'invalid_ids' });
    }
    return { ok: true, ...(await deleteFulltexts(ids as string[])) };
  });
}
