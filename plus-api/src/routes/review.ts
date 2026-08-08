import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { pool, withTransaction } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { scheduleAchievementSync } from '../services/achievement-sync.js';
import { nextBox, intervalDaysForBox } from '../services/leitner.js';
import { resolveTopic } from '../content-index.js';

// Phase 2: the premium Leitner review engine, scoped to highlights only (spec's
// free/premium line — the card FORM is free, the SCHEDULE is premium). Notes
// and content-authored flashcards are a later phase; card_state.highlight_id
// stays `not null` on purpose until that phase lands.

interface DueCardRow {
  highlight_id: string;
  content_id: string;
  exact: string;
  prefix: string | null;
  suffix: string | null;
  color: string | null;
  label: string | null;
  note: string | null;
  box: number;
  next_review_at: string | null;
  reviewed_count: number;
}

const DUE_COLS = `cs.highlight_id, h.content_id, h.exact, h.prefix, h.suffix, h.color, h.label, h.note,
  cs.box, cs.next_review_at, cs.reviewed_count`;

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  // GET /review/due?topic=&limit= -> cards due now (never reviewed, or past their
  // next_review_at), earliest-due first. `topic` scopes to one folder/cluster the
  // same way GET /highlights?topic= does, so the review UI can live in-place on a
  // topic's own archive rather than only as one global queue.
  app.get('/review/due', async (request, reply) => {
    const q = request.query as { topic?: string; limit?: string };
    const limit = Math.min(Math.max(parseInt(q.limit || '20', 10) || 20, 1), 50);
    const userId = request.user!.id;

    const params: unknown[] = [userId];
    let topicFilter = '';
    if (q.topic) {
      if (q.topic.startsWith('folder:')) {
        const key = q.topic.slice('folder:'.length);
        if (!/^[a-z0-9-]+$/i.test(key)) return reply.code(404).send({ error: 'unknown_topic' });
        params.push(key + '/%');
        topicFilter = `and h.content_id like $${params.length}`;
      } else {
        const resolved = resolveTopic(q.topic);
        if (!resolved) return reply.code(404).send({ error: 'unknown_topic' });
        params.push(resolved.contentIds);
        topicFilter = `and h.content_id = any($${params.length})`;
      }
    }
    params.push(limit);

    const res = await pool.query<DueCardRow>(
      `select ${DUE_COLS}
         from card_state cs
         join highlights h on h.id = cs.highlight_id
        where cs.user_id = $1
          and (cs.next_review_at is null or cs.next_review_at <= now())
          ${topicFilter}
        order by cs.next_review_at asc nulls first, h.created_at asc
        limit $${params.length}`,
      params,
    );
    return reply.send({ due: res.rows });
  });

  // POST /review/answer { highlight_id, result: 'remembered' | 'forgot' } ->
  // advance (or reset) the box, push next_review_at out, log `review_finished`
  // (counts for the streak/score/league — see streak.ts, score.ts, league.ts,
  // all of which already anticipate this action name from Phase 1).
  app.post('/review/answer', {
    schema: {
      body: {
        type: 'object',
        required: ['highlight_id', 'result'],
        properties: {
          highlight_id: { type: 'string' },
          result: { type: 'string', enum: ['remembered', 'forgot'] },
        },
      },
    },
  }, async (request, reply) => {
    const { highlight_id, result } = request.body as {
      highlight_id: string;
      result: 'remembered' | 'forgot';
    };
    const userId = request.user!.id;

    // The ceiling POST /activity has had since 2026-08-08, on the route that
    // actually needed it. `was_due` below stops the SAME card paying twice, but
    // a brand-new card is born due (card_state is inserted with
    // next_review_at = null, which every due check reads as "now"), so a loop
    // that creates highlights and answers them needs no repeats at all: 628
    // highlights across 205 articles became 628 immediately-answerable cards,
    // 420 of them inside one hour. The weekly XP cap bounds what that EARNS;
    // this bounds what it can DO.
    const limit = consume(`review:user:${userId}`, config.review.maxPerUserPerHour, HOUR_MS);
    if (!limit.allowed) {
      reply.header('retry-after', Math.ceil(limit.retryAfterMs / 1000));
      return reply.code(429).send({ error: 'rate_limited' });
    }

    const updated = await withTransaction(async (client) => {
      const cur = await client.query<{ box: number; content_id: string; was_due: boolean }>(
        `select cs.box, h.content_id,
                (cs.next_review_at is null or cs.next_review_at <= now()) as was_due
           from card_state cs
           join highlights h on h.id = cs.highlight_id
          where cs.user_id = $1 and cs.highlight_id = $2
          for update of cs`,
        [userId, highlight_id],
      );
      if (cur.rowCount === 0) return null;
      const { box: currentBox, content_id, was_due: wasDue } = cur.rows[0];
      const box = nextBox(currentBox, result);
      const days = intervalDaysForBox(box);

      const res = await client.query<{ box: number; next_review_at: string; reviewed_count: number }>(
        `update card_state
            set box = $1,
                next_review_at = now() + ($2 || ' days')::interval,
                last_result = $3,
                reviewed_count = reviewed_count + 1,
                updated_at = now()
          where user_id = $4 and highlight_id = $5
          returning box, next_review_at, reviewed_count`,
        [box, days, result, userId, highlight_id],
      );
      // The card still moves — a reader who wants to drill something early is
      // doing the right thing and the box should follow them. What an early
      // review does NOT do is pay: recordActivity is what league.ts prices, so
      // logging one for a card that was not due turned "press the same card
      // again" into an XP tap. Due-ness, not the press, is the unit of study.
      if (wasDue) {
        await recordActivity(userId, 'review_finished', content_id, { highlight_id, result }, client);
      }
      return res.rows[0];
    });

    if (!updated) return reply.code(404).send({ error: 'not_found' });
    scheduleAchievementSync(userId); // «مرورگر» counts finished sessions
    return reply.send({ card_state: updated });
  });
}
