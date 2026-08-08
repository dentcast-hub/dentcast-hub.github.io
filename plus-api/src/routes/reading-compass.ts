import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { computeReadingCompass } from '../services/reading-compass.js';
import { recordActivity } from '../services/activity.js';
import { compassBlindSpots, isPremiumRequest, getQuotaCopy } from '../services/quota.js';

// «قطب‌نمای مطالعه» (premium): a coverage report over the user's own consumption
// (highlights + article_completed + episode_listened). The report itself remains
// pure — it derives everything and stores nothing (services/reading-compass.ts).
//
// The one write is the usage row below. The dashboard widget and the full page
// share this endpoint, so it is the only place that can answer whether a premium
// user ever actually opened the compass — which, for a feature handed out as a
// two-day prize, is the question worth being able to ask. Written per request;
// collapse to per-day with count(distinct (user_id, day)) when reading it.
//
// The free/premium line here is DIAGNOSIS vs PRESCRIPTION. Everyone gets the
// coverage numbers — how much of each pillar they have read, where their
// attention has actually gone — because that is a fact about the reader's own
// activity and telling someone they may not see it would be absurd. What
// premium buys is the answer: `same_area` and `unexplored`, the named articles
// that would close the gap. Those two lists are the work the compass exists to
// do, and they are stripped in the process rather than hidden by the page.
export async function readingCompassRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/reading-compass', async (request, reply) => {
    const compass = await computeReadingCompass(request.user!.id);
    // content_id null: a feature-usage row, not progress against a page.
    await recordActivity(request.user!.id, 'compass_viewed', null);

    if (compassBlindSpots(isPremiumRequest(request))) return reply.send(compass);
    return reply.send({
      ...compass,
      // Counts survive, contents do not: "۷ مقاله در این حوزه نخوانده‌ای" is the
      // honest size of what is behind the wall, and it is a far better argument
      // than an empty list with no explanation.
      same_area: [],
      unexplored: [],
      same_area_count: compass.same_area.length,
      unexplored_count: compass.unexplored.length,
      blind_spots_locked: true,
      locked_message: getQuotaCopy().compass_fa,
    });
  });
}
