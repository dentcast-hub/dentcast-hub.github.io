import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { markPremiumGrantSeen } from '../services/premium-prize.js';

// POST /premium/grant/seen — acknowledge the "you won a week of premium" banner
// so it stops showing. Mirrors POST /league/outcome/seen.
export async function premiumGrantRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/premium/grant/seen', async (request, reply) => {
    await markPremiumGrantSeen(request.user!.id);
    return reply.send({ ok: true });
  });
}
