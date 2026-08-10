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
import { getConsumedContentTimes } from '../services/consumption.js';
import { getCard, getCardsFor } from '../flashcards.js';

// Phase 2: the premium Leitner review engine, scoped to highlights only (spec's
// free/premium line — the card FORM is free, the SCHEDULE is premium). Notes
// are still a later phase; card_state.highlight_id stays `not null` on
// purpose — that phase has now landed as a PARALLEL table, ai_card_state
// (migration 0035), because an AI-generated card has no highlight to hang a
// row off of. See GET /review/due's `ai_due` and POST /review/answer-ai below.

const DAY_MS = 24 * 60 * 60 * 1000;

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

interface AiDueRow {
  content_id: string;
  card_id: string;
  front: string;
  back: string;
  box: number;
  next_review_at: string | null;
  reviewed_count: number;
}

/**
 * The AI-card half of GET /review/due. Runs after the SAME topic guard the
 * highlight query uses (an unknown topic already 404s before this is ever
 * called) — folderPrefix/topicContentIds are the two ways that guard can
 * scope things, carried over verbatim rather than re-resolved.
 *
 * Two pools, in priority order: cards with existing state that are due, then
 * cards with no state yet whose owning article "matured" (Leitner box 1's own
 * interval, counted from first consumption — reading an article and
 * answering it in the same instant is not a review). AI_SHARE caps the
 * combined queue to at most a third of it, so the highlight queue this route
 * has always served is never crowded out.
 */
async function buildAiDue(
  userId: string,
  limit: number,
  folderPrefix: string | null,
  topicContentIds: string[] | null,
): Promise<AiDueRow[]> {
  const consumed = await getConsumedContentTimes(userId);
  const topicSet = topicContentIds ? new Set(topicContentIds) : null;
  const inTopic = (contentId: string): boolean => {
    if (folderPrefix) return contentId.startsWith(folderPrefix);
    if (topicSet) return topicSet.has(contentId);
    return true;
  };

  const stateRes = await pool.query<{
    content_id: string; card_id: string; box: number; next_review_at: string; reviewed_count: number;
  }>('select content_id, card_id, box, next_review_at, reviewed_count from ai_card_state where user_id = $1', [userId]);
  const stateMap = new Map(stateRes.rows.map((r) => [`${r.content_id} ${r.card_id}`, r]));

  const now = Date.now();
  const stateDue: Array<AiDueRow & { sortAt: number }> = [];
  const newMature: Array<AiDueRow & { sortAt: number }> = [];

  for (const [contentId, firstAt] of consumed) {
    if (!inTopic(contentId)) continue;
    // A consumed page absent from the flashcards index yields no cards at all
    // — tolerant of incomplete backfill coverage, not an error.
    for (const card of getCardsFor(contentId)) {
      const state = stateMap.get(`${contentId} ${card.id}`);
      if (state) {
        const dueAt = new Date(state.next_review_at).getTime();
        if (dueAt <= now) {
          stateDue.push({
            content_id: contentId,
            card_id: card.id,
            front: card.front,
            back: card.back,
            box: state.box,
            next_review_at: state.next_review_at,
            reviewed_count: state.reviewed_count,
            sortAt: dueAt,
          });
        }
      } else {
        const matureAt = firstAt.getTime() + intervalDaysForBox(1) * DAY_MS;
        if (matureAt <= now) {
          newMature.push({
            content_id: contentId,
            card_id: card.id,
            front: card.front,
            back: card.back,
            box: 1,
            next_review_at: null,
            reviewed_count: 0,
            sortAt: firstAt.getTime(),
          });
        }
      }
    }
  }

  stateDue.sort((a, b) => a.sortAt - b.sortAt);
  newMature.sort((a, b) => a.sortAt - b.sortAt);

  const AI_SHARE = Math.ceil(limit / 3);
  return [...stateDue, ...newMature].slice(0, AI_SHARE).map(({ sortAt, ...rest }) => rest);
}

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
    let folderPrefix: string | null = null;
    let topicContentIds: string[] | null = null;
    if (q.topic) {
      if (q.topic.startsWith('folder:')) {
        const key = q.topic.slice('folder:'.length);
        if (!/^[a-z0-9-]+$/i.test(key)) return reply.code(404).send({ error: 'unknown_topic' });
        folderPrefix = key + '/';
        params.push(key + '/%');
        topicFilter = `and h.content_id like $${params.length}`;
      } else {
        const resolved = resolveTopic(q.topic);
        if (!resolved) return reply.code(404).send({ error: 'unknown_topic' });
        topicContentIds = resolved.contentIds;
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
    const aiDue = await buildAiDue(userId, limit, folderPrefix, topicContentIds);
    return reply.send({ due: res.rows, ai_due: aiDue });
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

  // POST /review/answer-ai { content_id, card_id, result } -> the same Leitner
  // advance as POST /review/answer, mirrored for AI-generated cards, which
  // have no highlight_id to key off of. Deliberately shares that route's
  // rate-limit key (see below) and its "only a DUE card pays" doctrine.
  app.post('/review/answer-ai', {
    schema: {
      body: {
        type: 'object',
        required: ['content_id', 'card_id', 'result'],
        properties: {
          content_id: { type: 'string' },
          card_id: { type: 'string' },
          result: { type: 'string', enum: ['remembered', 'forgot'] },
        },
      },
    },
  }, async (request, reply) => {
    const { content_id, card_id, result } = request.body as {
      content_id: string;
      card_id: string;
      result: 'remembered' | 'forgot';
    };
    const userId = request.user!.id;

    // Same key as POST /review/answer, on purpose: 200/hour is a ceiling on
    // the COMBINED pace of both card types, not one each.
    const limit = consume(`review:user:${userId}`, config.review.maxPerUserPerHour, HOUR_MS);
    if (!limit.allowed) {
      reply.header('retry-after', Math.ceil(limit.retryAfterMs / 1000));
      return reply.code(429).send({ error: 'rate_limited' });
    }

    // Both must hold, or this endpoint would let a client build an arbitrary
    // state row or "answer" content it never read.
    if (!getCard(content_id, card_id)) return reply.code(404).send({ error: 'not_found' });
    const consumed = await getConsumedContentTimes(userId);
    const firstAt = consumed.get(content_id);
    if (!firstAt) return reply.code(404).send({ error: 'not_found' });

    const updated = await withTransaction(async (client) => {
      const cur = await client.query<{ box: number; next_review_at: string }>(
        `select box, next_review_at from ai_card_state
          where user_id = $1 and content_id = $2 and card_id = $3
          for update`,
        [userId, content_id, card_id],
      );

      const currentBox = cur.rowCount ? cur.rows[0].box : 1;
      const wasDue = cur.rowCount
        ? new Date(cur.rows[0].next_review_at).getTime() <= Date.now()
        : firstAt.getTime() + intervalDaysForBox(1) * DAY_MS <= Date.now();
      const box = nextBox(currentBox, result);
      const days = intervalDaysForBox(box);

      const res = cur.rowCount
        ? await client.query<{ box: number; next_review_at: string; reviewed_count: number }>(
          `update ai_card_state
              set box = $1,
                  next_review_at = now() + ($2 || ' days')::interval,
                  last_result = $3,
                  reviewed_count = reviewed_count + 1,
                  updated_at = now()
            where user_id = $4 and content_id = $5 and card_id = $6
            returning box, next_review_at, reviewed_count`,
          [box, days, result, userId, content_id, card_id],
        )
        // on conflict belt: two simultaneous first answers can both miss the
        // `for update` lock (nothing exists yet to lock), so the insert itself
        // must be race-safe.
        : await client.query<{ box: number; next_review_at: string; reviewed_count: number }>(
          `insert into ai_card_state (user_id, content_id, card_id, box, next_review_at, last_result, reviewed_count)
           values ($1, $2, $3, $4, now() + ($5 || ' days')::interval, $6, 1)
           on conflict (user_id, content_id, card_id) do update
             set box = excluded.box,
                 next_review_at = excluded.next_review_at,
                 last_result = excluded.last_result,
                 reviewed_count = ai_card_state.reviewed_count + 1,
                 updated_at = now()
           returning box, next_review_at, reviewed_count`,
          [userId, content_id, card_id, box, days, result],
        );

      // Same doctrine as POST /review/answer: the card always moves, but only
      // a DUE answer counts as a finished review for XP/streak/score/badges.
      if (wasDue) {
        await recordActivity(userId, 'review_finished', content_id, { card_id, result }, client);
      }
      return res.rows[0];
    });

    scheduleAchievementSync(userId);
    return reply.send({ card_state: updated });
  });
}
