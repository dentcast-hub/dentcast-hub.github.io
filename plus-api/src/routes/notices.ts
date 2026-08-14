import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { listNotices, markNoticesSeen, markNoticeSeen, unreadNoticeCount } from '../services/notices.js';

/** `log:<uuid>` or `bcast:<uuid>` — the exact shape services/notices.ts's
 *  VISIBLE_NOTICES stamps onto each row's `id`. Rejecting anything else keeps
 *  an authenticated-but-malicious caller from growing notice_reads with
 *  arbitrary keys that can never match a real notice. */
const NOTICE_ID_RE = /^(log|bcast):[0-9a-f-]{36}$/i;

/**
 * اطلاعیه — the in-app inbox behind the dot on the account icon.
 *
 * FREE ON EVERY PLAN, and not a judgement call: these are the site's own
 * messages to the reader. Six of the seven kinds are things a free account
 * already receives by push when it has push, so gating the place they can be
 * READ would mean the only people who cannot see their notifications are the
 * ones who never granted permission — precisely the cohort this exists for.
 *
 * A pure read plus an acknowledgement write (whole-inbox or per-notice).
 * Nothing here decides what a notice says; that is settled where it is sent
 * (services/notify-policy.ts), so a message reads the same in the inbox as it
 * did on the phone.
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

  // POST /notices/seen — move the read watermark to now. Kept as an explicit
  // "mark everything" write; the panel itself no longer calls this on open
  // (see /notices/:id/seen below — a support ticket, 2026-08-14, reported that
  // opening one اطلاعیه was marking every unread one seen at once). Separate
  // from the achievement celebration's own acknowledgement on purpose: reading
  // the inbox must not silently spend a celebration the reader has not been
  // shown yet.
  app.post('/notices/seen', async (request, reply) => {
    await markNoticesSeen(request.user!.id);
    return reply.send({ ok: true });
  });

  // POST /notices/:id/seen — acknowledge exactly ONE notice. This is what the
  // panel calls when a reader opens a single card, so the rest stay coloured
  // until they are opened too.
  app.post('/notices/:id/seen', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!NOTICE_ID_RE.test(id)) return reply.code(400).send({ error: 'bad_notice_id' });
    await markNoticeSeen(request.user!.id, id);
    return reply.send({ ok: true });
  });
}
