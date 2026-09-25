import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool } from '../db.js';
import { getContentInfo, folderLabel, folderOf } from '../content-index.js';
import { config } from '../config.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import {
  resolveEpisodeAudio, httpRangeReader, cutMp3, buildClipTag, clipFileName, clock, ClipAudioError,
} from '../services/clip-audio.js';

/**
 * قطعه‌های صوتی — audio clips (migration 0064).
 *
 * A clip is a highlight in TIME: `content_id` (an episode), `start_s`, `end_s`,
 * an optional note and label. Nothing else. The audio itself is never touched —
 * every surface that plays a clip seeks the episode's own file to `start_s` and
 * pauses at `end_s`.
 *
 * WHO MAY DO WHAT is the one decision in this file, and it is the founder's
 * (2026-09-13). Every other act of study on the site is free at creation and
 * premium at arrangement («داده مال کاربر، چیدمان برای فروش»). A clip is the
 * first act gated at CREATION, for a reason that is specific to audio: a text
 * highlight is worth little on its own (the article is always there to re-read)
 * and the library is what makes it valuable, so gating the library is gating
 * the value; a podcast is unreturnable without a timestamp, so the value of a
 * clip is felt in full the moment it is made, and a free clip would give away
 * the feature and sell a list. The button stays visible to everybody (amber,
 * the site's «this is what a subscription buys» colour) and the gate is on the
 * tap. So:
 *
 *   · POST                 — requirePremium (the act);
 *   · GET / PATCH / DELETE — requireAuth only: what a subscriber marked while
 *                            premium stays theirs to see on the episode, fix,
 *                            delete and export after the subscription lapses;
 *   · GET /clips/library   — requirePremium: the aggregated view, the same
 *                            boundary the highlight library draws;
 *   · GET /clips/:id/audio — requirePremium: the clip as a real MP3 file (founder,
 *                            1405/07/03 — «هایلایت صوتی فقط برای پریمیومه، پس
 *                            دانلودشم»). The two numbers stay the reader's on
 *                            any plan (GET /export/highlights carries them);
 *                            cutting the audio out is the premium act.
 *
 * No activity row and no XP: a clip is a bookmark, and the argument score.ts
 * makes for excluding `content_shared` (nothing is read or answered by pressing
 * it) applies here too.
 */

const LABELS = new Set(['important', 'unclear', 'clinical_pearl']);
/** A clip longer than this is the episode, not a clip. */
export const MAX_CLIP_SECONDS = 600;
/** Shorter than this cannot carry a sentence; it is a mis-tap. */
export const MIN_CLIP_SECONDS = 1;
const MAX_NOTE = 4000;

interface ClipRow {
  id: string;
  content_id: string;
  start_s: number;
  end_s: number;
  note: string | null;
  label: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLS = `id, content_id, start_s, end_s, note, label, created_at, updated_at`;

function validSpan(start: unknown, end: unknown): string | null {
  const s = Number(start);
  const e = Number(end);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 'invalid_span';
  if (s < 0) return 'invalid_span';
  if (e - s < MIN_CLIP_SECONDS) return 'clip_too_short';
  if (e - s > MAX_CLIP_SECONDS) return 'clip_too_long';
  return null;
}

/** One decimal is plenty for speech and keeps two players' readings identical. */
const round1 = (n: number) => Math.round(n * 10) / 10;

export async function clipRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /clips?content_id=episodes/episode-101 -> this reader's clips on ONE
  // episode, in time order — what the player draws on its bar.
  app.get('/clips', async (request, reply) => {
    const { content_id } = request.query as { content_id?: string };
    if (!content_id) return reply.code(400).send({ error: 'content_id_required' });
    const res = await pool.query<ClipRow>(
      `select ${SELECT_COLS} from audio_clips
        where user_id = $1 and content_id = $2
        order by start_s asc, created_at asc`,
      [request.user!.id, content_id],
    );
    return reply.send({ clips: res.rows });
  });

  // GET /clips/library -> premium: every clip the reader owns, grouped by
  // episode (the highlight library's shape, so the دفترچه can merge the two).
  // Registered before /clips/:id so «library» is never read as an id.
  app.get('/clips/library', { preHandler: requirePremium }, async (request, reply) => {
    const res = await pool.query<ClipRow>(
      `select ${SELECT_COLS} from audio_clips
        where user_id = $1 order by created_at asc`,
      [request.user!.id],
    );
    const groups = new Map<string, { latest: string; clips: ClipRow[] }>();
    for (const c of res.rows) {
      let g = groups.get(c.content_id);
      if (!g) { g = { latest: c.created_at, clips: [] }; groups.set(c.content_id, g); }
      g.clips.push(c);
      if (c.created_at > g.latest) g.latest = c.created_at;
    }
    const articles = [...groups.entries()]
      .sort((a, b) => (a[1].latest < b[1].latest ? 1 : a[1].latest > b[1].latest ? -1 : 0))
      .map(([contentId, g]) => {
        const info = getContentInfo(contentId);
        const folder = folderOf(contentId);
        return {
          content_id: contentId,
          title: info?.title ?? contentId,
          url: info?.url ?? `/${contentId}.html`,
          type: info?.type ?? folder,
          folder,
          folder_fa: folderLabel(folder),
          last_clip_at: g.latest,
          count: g.clips.length,
          // Within an episode a clip list reads in TIME order, not creation
          // order: «۰۷:۲۷» before «۱۵:۱۰» whichever was marked first.
          clips: g.clips.slice().sort((x, y) => x.start_s - y.start_s),
        };
      });
    return reply.send({ total: res.rowCount ?? 0, article_count: articles.length, articles });
  });

  // GET /clips/:id -> one clip (the ?dcclip= landing on the episode page).
  app.get('/clips/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(404).send({ error: 'not_found' });
    const res = await pool.query<ClipRow>(
      `select ${SELECT_COLS} from audio_clips where id = $1 and user_id = $2`,
      [id, request.user!.id],
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ clip: res.rows[0] });
  });

  // GET /clips/:id/audio -> premium: the clip cut out of its episode as an MP3,
  // tagged with where it came from (services/clip-audio.ts). Owner only — a
  // clip id is not a share link. The reader's note is never put in the file.
  app.get('/clips/:id/audio', { preHandler: requirePremium }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(404).send({ error: 'not_found' });
    const res = await pool.query<ClipRow>(
      `select ${SELECT_COLS} from audio_clips where id = $1 and user_id = $2`,
      [id, request.user!.id],
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    const clip = res.rows[0];

    const limit = consume(`clip-audio:${request.user!.id}`, config.episodes.clipDownloadsPerHour, HOUR_MS);
    if (!limit.allowed) {
      return reply.code(429).send({ error: 'rate_limited', retry_after_s: Math.ceil(limit.retryAfterMs / 1000) });
    }

    const episode = await resolveEpisodeAudio(clip.content_id);
    if (!episode) return reply.code(404).send({ error: 'episode_audio_not_found' });

    let cut;
    try {
      cut = await cutMp3(httpRangeReader(episode.audio_url), Number(clip.start_s), Number(clip.end_s));
    } catch (err) {
      const code = err instanceof ClipAudioError ? err.code : 'source_unavailable';
      request.log.warn({ clip: clip.id, audio: episode.audio_url, code, err: (err as Error).message }, 'clip audio cut failed');
      // Past the end of the file is the one case that is about the clip; the
      // rest are about the source, which is ours to fix, not the reader's.
      return reply.code(code === 'out_of_range' ? 422 : 502).send({ error: code });
    }

    const tag = buildClipTag({
      title: `${episode.title} · ${clock(Number(clip.start_s))}–${clock(Number(clip.end_s))}`,
      episodeTitle: episode.title,
      pageUrl: episode.page_url,
    });
    const body = Buffer.concat([tag, cut.audio]);
    const name = clipFileName(clip.content_id, Number(clip.start_s), Number(clip.end_s));
    reply.header('content-type', 'audio/mpeg');
    reply.header('content-length', String(body.length));
    reply.header('content-disposition', `attachment; filename="${name}"`);
    return reply.send(body);
  });

  // POST /clips -> premium: mark a segment.
  app.post('/clips', {
    preHandler: requirePremium,
    schema: {
      body: {
        type: 'object',
        required: ['content_id', 'start_s', 'end_s'],
        properties: {
          content_id: { type: 'string', minLength: 1, maxLength: 200 },
          start_s: { type: 'number' },
          end_s: { type: 'number' },
          note: { type: ['string', 'null'], maxLength: MAX_NOTE },
          label: { type: ['string', 'null'] },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { content_id: string; start_s: number; end_s: number; note?: string | null; label?: string | null };
    const span = validSpan(b.start_s, b.end_s);
    if (span) return reply.code(400).send({ error: span });
    if (b.label != null && !LABELS.has(String(b.label))) return reply.code(400).send({ error: 'invalid_label' });
    // A content_id is a path: folder/slug, the same shape every other table
    // stores. Anything else is not something a player could have produced.
    if (!/^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_./-]*$/i.test(b.content_id)) {
      return reply.code(400).send({ error: 'invalid_content_id' });
    }
    const res = await pool.query<ClipRow>(
      `insert into audio_clips (user_id, content_id, start_s, end_s, note, label)
       values ($1, $2, $3, $4, $5, $6)
       returning ${SELECT_COLS}`,
      [request.user!.id, b.content_id, round1(b.start_s), round1(b.end_s),
        (b.note ?? '').trim() || null, b.label ?? null],
    );
    return reply.code(201).send({ clip: res.rows[0] });
  });

  // PATCH /clips/:id -> note / label / span (owner only, any plan).
  app.patch('/clips/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          start_s: { type: 'number' },
          end_s: { type: 'number' },
          note: { type: ['string', 'null'], maxLength: MAX_NOTE },
          label: { type: ['string', 'null'] },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(404).send({ error: 'not_found' });
    const b = request.body as { start_s?: number; end_s?: number; note?: string | null; label?: string | null };
    if (b.label != null && !LABELS.has(String(b.label))) return reply.code(400).send({ error: 'invalid_label' });

    const current = await pool.query<ClipRow>(
      `select ${SELECT_COLS} from audio_clips where id = $1 and user_id = $2`,
      [id, request.user!.id],
    );
    if (current.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    const row = current.rows[0];

    // The span is validated as a PAIR against what the row already holds, so a
    // PATCH that moves only the start can never be refused for an end it did
    // not send — and can never slip past the length rule either.
    const start = b.start_s !== undefined ? b.start_s : row.start_s;
    const end = b.end_s !== undefined ? b.end_s : row.end_s;
    if (b.start_s !== undefined || b.end_s !== undefined) {
      const span = validSpan(start, end);
      if (span) return reply.code(400).send({ error: span });
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (b.start_s !== undefined) { sets.push(`start_s = $${i++}`); vals.push(round1(start)); }
    if (b.end_s !== undefined) { sets.push(`end_s = $${i++}`); vals.push(round1(end)); }
    if (b.note !== undefined) { sets.push(`note = $${i++}`); vals.push((b.note ?? '').trim() || null); }
    if (b.label !== undefined) { sets.push(`label = $${i++}`); vals.push(b.label); }
    if (sets.length === 0) return reply.code(400).send({ error: 'nothing_to_update' });
    sets.push('updated_at = now()');
    vals.push(id, request.user!.id);

    const res = await pool.query<ClipRow>(
      `update audio_clips set ${sets.join(', ')}
        where id = $${i} and user_id = $${i + 1}
        returning ${SELECT_COLS}`,
      vals,
    );
    return reply.send({ clip: res.rows[0] });
  });

  // DELETE /clips/:id (owner only, any plan).
  app.delete('/clips/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(404).send({ error: 'not_found' });
    const res = await pool.query(
      `delete from audio_clips where id = $1 and user_id = $2`,
      [id, request.user!.id],
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });
}
