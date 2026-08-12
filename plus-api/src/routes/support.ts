import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import {
  openTicket, addMessage, getTicket, messagesOf, ticketsOfUser, closeTicket, reopenTicket,
  ticketKinds, kindTitle, MAX_OPEN_PER_USER,
  commentOnArticle, publicThreadsFor, myThreadFor,
} from '../services/support.js';

/**
 * The reader's side of support and of the threads under an article
 * (services/support.ts holds the reasoning for both).
 *
 * Nothing here is `requirePremium`, and the two reasons are different. For a
 * support ticket the plan check is per KIND, because the reader most likely to
 * need the door is the one asking how to become a subscriber. For an article
 * thread it is premium-only — but the check still lives in the service, so the
 * rule and its reason stay in one place.
 *
 * ONE endpoint answers with no session at all: `GET /threads/public`. A thread
 * the founder published is part of the article now, so a signed-out visitor
 * reads it the way they read the prose. It therefore lives OUTSIDE the
 * encapsulated scope below — a `preHandler` hook applies to every route in its
 * encapsulation context regardless of registration order, so "declare it first"
 * is not a way to keep a route public. The scope is.
 */
export async function supportRoutes(app: FastifyInstance): Promise<void> {
  app.get('/threads/public', {
    schema: {
      querystring: {
        type: 'object', required: ['content_id'],
        properties: { content_id: { type: 'string', maxLength: 200 } },
      },
    },
  }, async (request, reply) => {
    const { content_id: contentId } = request.query as { content_id: string };
    return reply.send({ ok: true, threads: await publicThreadsFor(contentId) });
  });

  await app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);

    /* ------------------------------------------------ threads under a page -- */

    // POST /threads { content_id, body } — comment under an article.
    scoped.post('/threads', {
      schema: {
        body: {
          type: 'object', required: ['content_id', 'body'],
          properties: {
            content_id: { type: 'string', minLength: 1, maxLength: 200 },
            body: { type: 'string', minLength: 1, maxLength: 4000 },
          },
        },
      },
    }, async (request, reply) => {
      const b = request.body as { content_id: string; body: string };
      const r = await commentOnArticle({
        userId: request.user!.id, tier: request.user!.tier,
        contentId: b.content_id, body: b.body,
      });
      if (r.outcome === 'posted') return reply.send({ ok: true, ticket: r.ticket });
      const code = r.outcome === 'premium_required' ? 402 : 400;
      return reply.code(code).send({ error: r.outcome, message: r.message });
    });

    // GET /threads/mine?content_id= — this reader's own thread under one page,
    // published or not. Separate from /threads/public because it answers for
    // the one person who can see a private thread.
    scoped.get('/threads/mine', {
      schema: {
        querystring: {
          type: 'object', required: ['content_id'],
          properties: { content_id: { type: 'string', maxLength: 200 } },
        },
      },
    }, async (request, reply) => {
      const { content_id: contentId } = request.query as { content_id: string };
      const mine = await myThreadFor(request.user!.id, contentId);
      return reply.send({ ok: true, thread: mine?.ticket ?? null, messages: mine?.messages ?? [] });
    });

    /* -------------------------------------------------------- support page -- */

    // GET /support/kinds — the catalog, with this reader's own plan folded in,
    // so the form can show a premium kind as locked rather than letting them
    // write a message and then refusing it.
    scoped.get('/support/kinds', async (request, reply) => {
      const tier = request.user!.tier;
      return reply.send({
        ok: true,
        max_open: MAX_OPEN_PER_USER,
        kinds: ticketKinds().map((k) => ({ ...k, locked: k.premium && tier !== 'premium' })),
      });
    });

    // GET /support/tickets — this reader's own threads, newest activity first.
    scoped.get('/support/tickets', async (request, reply) => {
      return reply.send({ ok: true, tickets: await ticketsOfUser(request.user!.id) });
    });

    // POST /support/tickets { kind, subject, body, has_photo? }
    scoped.post('/support/tickets', {
      schema: {
        body: {
          type: 'object',
          required: ['kind', 'subject', 'body'],
          properties: {
            kind: { type: 'string', maxLength: 40 },
            subject: { type: 'string', minLength: 1, maxLength: 120 },
            body: { type: 'string', minLength: 1, maxLength: 4000 },
            has_photo: { type: 'boolean' },
          },
        },
      },
    }, async (request, reply) => {
      const b = request.body as {
        kind: string; subject: string; body: string; has_photo?: boolean;
      };
      const r = await openTicket({
        userId: request.user!.id, tier: request.user!.tier,
        kind: b.kind, subject: b.subject, body: b.body, hasPhoto: b.has_photo,
      });
      if (r.outcome === 'opened') {
        return reply.send({
          ok: true,
          ticket: { ...r.ticket!, kind_title_fa: kindTitle(r.ticket!.kind) },
        });
      }
      // A premium-only kind answers 402 like every other paid boundary; the
      // rest are the reader's own input and answer 400.
      const code = r.outcome === 'premium_required' ? 402 : 400;
      return reply.code(code).send({ error: r.outcome, message: r.message });
    });

    // GET /support/tickets/:id — one thread, scoped to its owner.
    scoped.get('/support/tickets/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const ticket = await getTicket(id, request.user!.id);
      if (!ticket) return reply.code(404).send({ error: 'not_found' });
      return reply.send({
        ok: true,
        ticket: { ...ticket, kind_title_fa: kindTitle(ticket.kind) },
        messages: await messagesOf(ticket.id),
      });
    });

    // POST /support/tickets/:id/messages { body }
    scoped.post('/support/tickets/:id/messages', {
      schema: {
        body: {
          type: 'object', required: ['body'],
          properties: { body: { type: 'string', minLength: 1, maxLength: 4000 } },
        },
      },
    }, async (request, reply) => {
      const { id } = request.params as { id: string };
      const { body } = request.body as { body: string };
      const r = await addMessage({
        ticketId: id, author: 'user', body, userId: request.user!.id,
      });
      if (!r.ok) {
        return reply.code(r.ticket ? 400 : 404).send({ error: 'rejected', message: r.message });
      }
      return reply.send({ ok: true, message: r.row });
    });

    scoped.post('/support/tickets/:id/close', async (request, reply) => {
      const { id } = request.params as { id: string };
      const ticket = await closeTicket(id, request.user!.id);
      if (!ticket) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ ok: true, ticket });
    });

    scoped.post('/support/tickets/:id/reopen', async (request, reply) => {
      const { id } = request.params as { id: string };
      const ticket = await reopenTicket(id, request.user!.id);
      if (!ticket) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ ok: true, ticket });
    });
  });
}
