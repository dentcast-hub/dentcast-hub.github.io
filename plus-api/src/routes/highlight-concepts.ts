import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { conceptsFor, conceptHighlights, glossaryNotes } from '../services/highlight-concepts.js';

/**
 * «نمای موضوعی هایلایت‌ها» (services/highlight-concepts.ts). Two premium
 * views over the reader's own highlights — by concept, across articles — and
 * one door on a glossary page.
 *
 * The gate is on the ARRANGEMENT, never the data: every highlight here is
 * already the reader's, visible in place and in the free archive on any plan
 * (spec principle 2). What premium buys is seeing them gathered by concept.
 * Hence the split below: the concept list and a concept's view are
 * requirePremium outright, while the glossary door is requireAuth only and
 * answers a FREE reader with the COUNT and nothing else — the same shape
 * up-board's gate takes. A free reader with three notes on «سمان رزینی»
 * should learn the arrangement exists over their own notes; a free reader
 * with none must never see a locked box under every one of 109 terms, so
 * the page draws nothing when total is 0, on either plan.
 */
export async function highlightConceptRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);
    scoped.addHook('preHandler', requirePremium);

    // GET /highlights/concepts -> every concept the reader's highlights reach
    scoped.get('/highlights/concepts', async (request, reply) => {
      return reply.send(await conceptsFor(request.user!.id));
    });

    // GET /highlights/concepts/:key -> one concept, grouped by article.
    // `key` is the tag as the index spells it («سمان رزینی»), URL-encoded;
    // the reference's underscore spelling and any alias resolve to it too.
    scoped.get('/highlights/concepts/:key', {
      schema: { params: { type: 'object', properties: { key: { type: 'string', minLength: 1, maxLength: 120 } }, required: ['key'] } },
    }, async (request, reply) => {
      const { key } = request.params as { key: string };
      const view = await conceptHighlights(request.user!.id, key);
      if (!view) return reply.code(404).send({ error: 'unknown_concept' });
      return reply.send(view);
    });
  });

  app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);

    // GET /glossary/:slug/notes -> the reader's own highlights about this term.
    // Premium gets the highlights; a free reader gets `locked: true` with the
    // counts only, which is what lets the page show the door only to somebody
    // who has something behind it.
    scoped.get('/glossary/:slug/notes', {
      schema: { params: { type: 'object', properties: { slug: { type: 'string', pattern: '^[a-z0-9-]{1,120}$' } }, required: ['slug'] } },
    }, async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const notes = await glossaryNotes(request.user!.id, slug);
      if (!notes) return reply.code(404).send({ error: 'unknown_term' });
      if (request.user!.tier !== 'premium') {
        return reply.send({
          locked: true,
          term: notes.term,
          concepts: notes.concepts,
          total: notes.total,
          article_count: notes.article_count,
        });
      }
      return reply.send({ locked: false, ...notes });
    });
  });
}
