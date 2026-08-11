import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';

// Account-level player resume state (migration 0039). One row per user — the
// same shape the player keeps in localStorage (dc-resume-state), keyed to the
// account so a signed-in listener resumes across devices. Anonymous listeners
// never reach these routes; their localStorage path is unchanged.
//
// The PUT is called from a throttled saver (every ~15s while playing, plus
// pause/hidden via keepalive), so it stays a cheap single upsert. No history,
// no fan-out, no activity row — listening credit is the listening service's
// job, and this table must never grow a second meaning.

interface PlayerStateRow {
  episode: number;
  position: number;
  anchor: number | null;
  speed: number | null;
  updated_at: Date;
}

export async function playerRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /player/state -> { state: {...} | null }
  app.get('/player/state', async (request, reply) => {
    const res = await pool.query<PlayerStateRow>(
      `select episode, position, anchor, speed, updated_at
         from player_state where user_id = $1`,
      [request.user!.id],
    );
    const row = res.rows[0];
    if (!row) return reply.send({ state: null });
    return reply.send({
      state: {
        episode: row.episode,
        position: row.position,
        anchor: row.anchor,
        speed: row.speed,
        updated_at: row.updated_at.toISOString(),
      },
    });
  });

  // PUT /player/state { episode, position, anchor?, speed? } -> { ok: true }
  app.put('/player/state', {
    schema: {
      body: {
        type: 'object',
        required: ['episode'],
        properties: {
          episode: { type: 'integer', minimum: 0 },
          position: { type: 'number', minimum: 0 },
          anchor: { type: ['integer', 'null'] },
          speed: { type: ['number', 'null'] },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as {
      episode: number; position?: number; anchor?: number | null; speed?: number | null;
    };
    await pool.query(
      `insert into player_state (user_id, episode, position, anchor, speed, updated_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (user_id)
       do update set episode = excluded.episode, position = excluded.position,
                     anchor = excluded.anchor, speed = excluded.speed, updated_at = now()`,
      [request.user!.id, b.episode, b.position ?? 0, b.anchor ?? null, b.speed ?? null],
    );
    return reply.send({ ok: true });
  });
}
