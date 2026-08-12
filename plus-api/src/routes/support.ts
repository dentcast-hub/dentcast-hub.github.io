import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import {
  openTicket, addMessage, getTicket, messagesOf, ticketsOfUser, closeTicket, reopenTicket,
  ticketKinds, kindTitle, MAX_OPEN_PER_USER,
} from '../services/support.js';

/**
 * The reader's side of support (services/support.ts holds the reasoning).
 *
 * Every route here is requireAuth and NOT requirePremium — the plan check lives
 * per KIND inside openTicket(), because the reader most likely to need this is
 * the one asking how to become a subscriber. `GET /support/kinds` is what lets
 * the page draw that boundary honestly instead of hiding a door it will refuse
 * to open.
 */
export async function supportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /support/kinds — the catalog, with this reader's own plan folded in, so
  // the form can show a premium kind as locked rather than letting them write a
  // message and then refusing it.
  app.get('/support/kinds', async (request, reply) => {
    const tier = request.user!.tier;
    return reply.send({
      ok: true,
      max_open: MAX_OPEN_PER_USER,
      kinds: ticketKinds().map((k) => ({ ...k, locked: k.premium && tier !== 'premium' })),
    });
  });

  // GET /support/tickets — this reader's own threads, newest activity first.
  app.get('/support/tickets', async (request, reply) => {
    return reply.send({ ok: true, tickets: await ticketsOfUser(request.user!.id) });
  });

  // POST /support/tickets { kind, subject, body }
  app.post('/support/tickets', {
    schema: {
      body: {
        type: 'object',
        required: ['kind', 'subject', 'body'],
        properties: {
          kind: { type: 'string', maxLength: 40 },
          subject: { type: 'string', minLength: 1, maxLength: 120 },
          body: { type: 'string', minLength: 1, maxLength: 4000 },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { kind: string; subject: string; body: string };
    const r = await openTicket({
      userId: request.user!.id, tier: request.user!.tier,
      kind: b.kind, subject: b.subject, body: b.body,
    });
    if (r.outcome === 'opened') {
      return reply.send({
        ok: true,
        ticket: { ...r.ticket!, kind_title_fa: kindTitle(r.ticket!.kind) },
      });
    }
    // A premium-only kind answers 402 like every other paid boundary; the rest
    // are the reader's own input and answer 400.
    const code = r.outcome === 'premium_required' ? 402 : 400;
    return reply.code(code).send({ error: r.outcome, message: r.message });
  });

  // GET /support/tickets/:id — one thread, scoped to its owner.
  app.get('/support/tickets/:id', async (request, reply) => {
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
  app.post('/support/tickets/:id/messages', {
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
    if (!r.ok) return reply.code(r.ticket ? 400 : 404).send({ error: 'rejected', message: r.message });
    return reply.send({ ok: true, message: r.row });
  });

  app.post('/support/tickets/:id/close', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticket = await closeTicket(id, request.user!.id);
    if (!ticket) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true, ticket });
  });

  app.post('/support/tickets/:id/reopen', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticket = await reopenTicket(id, request.user!.id);
    if (!ticket) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true, ticket });
  });
}
