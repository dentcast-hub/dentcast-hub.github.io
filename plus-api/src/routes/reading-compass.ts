import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { computeReadingCompass } from '../services/reading-compass.js';
import { recordActivity } from '../services/activity.js';

// «قطب‌نمای مطالعه» (premium): a coverage report over the user's own consumption
// (highlights + article_completed + episode_listened). The report itself remains
// pure — it derives everything and stores nothing (services/reading-compass.ts).
//
// The one write is the usage row below. The dashboard widget and the full page
// share this endpoint, so it is the only place that can answer whether a premium
// user ever actually opened the compass — which, for a feature handed out as a
// three-day prize, is the question worth being able to ask. Written per request;
// collapse to per-day with count(distinct (user_id, day)) when reading it.
export async function readingCompassRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  app.get('/reading-compass', async (request, reply) => {
    const compass = await computeReadingCompass(request.user!.id);
    // content_id null: a feature-usage row, not progress against a page.
    await recordActivity(request.user!.id, 'compass_viewed', null);
    return reply.send(compass);
  });
}
