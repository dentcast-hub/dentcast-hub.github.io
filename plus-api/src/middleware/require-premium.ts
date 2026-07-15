import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * preHandler: gate an endpoint to premium users. Wired from day one so Phase 2's
 * review endpoints go behind it from their first commit. Phase 1 ships NO
 * endpoint that uses it. Must run after requireAuth.
 *
 * Returns a clean 402-style response: the boundary is scheduling/selection over
 * the user's data, never access to the data itself.
 */
export async function requirePremium(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: 'unauthorized', message: 'ورود لازم است.' });
    return;
  }
  if (user.tier !== 'premium') {
    reply.code(402).send({
      error: 'premium_required',
      message: 'این بخش نیازمند اشتراک پریمیوم است.',
    });
    return;
  }
}
