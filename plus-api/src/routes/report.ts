import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { config } from '../config.js';
import { jalaliMonth } from '../services/time.js';
import {
  monthWindow, shiftMonthKey, availableMonths, computeMonthlyReport,
} from '../services/monthly-report.js';
import { recordActivity } from '../services/activity.js';

/**
 * «گزارش ماهانه» (premium): the reader's own month, derived on request from
 * the activity log and stored nowhere (services/monthly-report.ts). Same
 * shape as the compass: one GET for the page and the dashboard card, one
 * usage row so a feature handed out as a prize can be asked «did anybody
 * open it».
 *
 * The month key is Jalali ('1405-06'). Absent = the LAST COMPLETED month,
 * which is the one the notice announced; the current month is allowed and
 * comes back `in_progress: true`. A month before the account existed, or
 * after today, is a 400 rather than an empty report — the first is not
 * empty, it is nonexistent, and the second is a request for the future.
 */
export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  app.get('/report/months', async (request, reply) => {
    const months = await availableMonths(request.user!.id);
    return reply.send({ months, current: jalaliMonth(new Date(), config.streakTimezone) });
  });

  app.get('/report/monthly', {
    schema: {
      querystring: {
        type: 'object',
        properties: { month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const now = new Date();
    const current = jalaliMonth(now, config.streakTimezone);
    const q = request.query as { month?: string };
    const key = q.month ?? shiftMonthKey(current, -1);
    const w = monthWindow(key);
    if (!w) return reply.code(400).send({ error: 'bad_month' });
    if (key > current) return reply.code(400).send({ error: 'future_month' });
    const months = await availableMonths(request.user!.id, now);
    if (!months.includes(key)) return reply.code(400).send({ error: 'before_account' });

    const report = await computeMonthlyReport(request.user!.id, w, now);
    // content_id null: a feature-usage row, not progress against a page.
    await recordActivity(request.user!.id, 'report_viewed', null, { month: key });
    return reply.send(report);
  });
}
