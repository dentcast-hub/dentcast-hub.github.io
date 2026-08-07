import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { listNotices, markNoticesSeen, unreadNoticeCount } from '../services/notices.js';

/**
 * اطلاعیه — the in-app inbox behind the dot on the account icon.
 *
 * FREE ON EVERY PLAN, and not a judgement call: these are the site's own
 * messages to the reader. Six of the seven kinds are things a free account
 * already receives by push when it has push, so gating the place they can be
 * READ would mean the only people who cannot see their notifications are the
 * ones who never granted permission — precisely the cohort this exists for.
 *
 * A pure read plus one watermark write. Nothing here decides what a notice says;
 * that is settled where it is sent (services/notify-policy.ts), so a message
 * reads the same in the inbox as it did on the phone.
 */
export async function noticeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/notices', async (request, reply) => {
    const userId = request.user!.id;
    const [notices, unread] = await Promise.all([
      listNotices(userId),
      unreadNoticeCount(userId),
    ]);
    return reply.send({ notices, unread });
  });

  // POST /notices/seen — move the read watermark to now, which is what turns the
  // dot off. Separate from the achievement celebration's own acknowledgement on
  // purpose: reading the inbox must not silently spend a celebration the reader
  // has not been shown yet.
  app.post('/notices/seen', async (request, reply) => {
    await markNoticesSeen(request.user!.id);
    return reply.send({ ok: true });
  });
}
