import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { computeReadingCompass } from '../services/reading-compass.js';

// «قطب‌نمای مطالعه» (premium): a read-only coverage report over the user's own
// consumption (highlights + article_completed + episode_listened), no DB
// writes and nothing new stored — see services/reading-compass.ts.
export async function readingCompassRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  app.get('/reading-compass', async (request, reply) => {
    const compass = await computeReadingCompass(request.user!.id);
    return reply.send(compass);
  });
}
