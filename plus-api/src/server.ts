import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { baleRoutes } from './routes/bale.js';
import { leagueRoutes } from './routes/league.js';
import { leagueAdminRoutes } from './routes/league-admin.js';
import { anonRoutes } from './routes/anon.js';
import { activityRoutes } from './routes/activity.js';
import { playerRoutes } from './routes/player.js';
import { voteRoutes } from './routes/votes.js';
import { highlightRoutes } from './routes/highlights.js';
import { clipRoutes } from './routes/clips.js';
import { articleNoteRoutes } from './routes/article-note.js';
import { reviewRoutes } from './routes/review.js';
import { pathwayRoutes } from './routes/pathways.js';
import { achievementRoutes } from './routes/achievements.js';
import { noticeRoutes } from './routes/notices.js';
import { collectionRoutes } from './routes/collections.js';
import { snippetRoutes } from './routes/snippets.js';
import { collectionExportRoutes } from './routes/collection-export.js';
import { readingCompassRoutes } from './routes/reading-compass.js';
import { reportRoutes } from './routes/report.js';
import { highlightConceptRoutes } from './routes/highlight-concepts.js';
import { caseAssistantRoutes } from './routes/case-assistant.js';
import { premiumGrantRoutes } from './routes/premium-grant.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { supportRoutes } from './routes/support.js';
import { adminRoutes } from './routes/admin.js';
import { pushRoutes } from './routes/push.js';
import { payRoutes } from './routes/pay.js';
import { referralRoutes } from './routes/referral.js';
import { desRoutes } from './routes/des.js';
import { challengeRoutes } from './routes/challenge.js';
import { clinicRoutes } from './routes/clinic.js';
import { certificateRoutes } from './routes/certificates.js';
import { examRoutes } from './routes/exams.js';

/**
 * Build the Fastify app. Exported separately from the listen() call so tests can
 * drive it with app.inject() without opening a socket.
 */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.env !== 'test',
    trustProxy: true, // behind ArvanCloud's proxy in production; needed for request.ip
  });

  await app.register(cookie, { secret: config.session.secret });
  await app.register(cors, {
    // Reflect the request origin when it is allowed. In production only the
    // configured origins (the .org/.ir sites) pass. In dev we also accept any
    // localhost / 127.0.0.1 origin on ANY port, so the static site can be served
    // from whatever local port without touching config. Reflecting the exact
    // origin (not "*") is required because credentials are enabled.
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / same-origin / non-browser
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      if (!config.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      return cb(null, false); // disallowed: no ACAO header, browser blocks
    },
    credentials: true, // session cookie travels on cross-origin fetches from the site
  });

  // SECURITY: never let a shared cache store an API response. Every response here
  // is per-user, keyed only by the session cookie — which the ArvanCloud /
  // Cloudflare CDN (and any intermediary proxy) does NOT include in its cache
  // key. Without this, a cached GET /me is replayed to a DIFFERENT user and leaks
  // that user's phone/identity (observed in production). `no-store` also stops any
  // Set-Cookie response from being cached and handed to multiple users. This is a
  // whole-API invariant; do not weaken it to `private`/`max-age` on any route.
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('cache-control', 'no-store');
    return payload;
  });

  // Nothing internal goes back to the caller. Fastify's default handler puts an
  // unhandled error's own `message` and `code` in the response body, so every
  // route that took an id straight from the URL into a query answered a typo
  // with `{"statusCode":500,"code":"22P02","message":"invalid input syntax for
  // type uuid: \"xyz\""}` — seventeen reader routes and eight admin ones, found
  // 2026-09-17. Only clips.ts had thought to guard its own id, which is the
  // shape of the problem: a per-route guard is a thing the NEXT route forgets,
  // and the leak was never really about ids.
  //
  // So it is answered once, here, where no future route can drift past it.
  // Deliberately NOT a blanket "bad id -> 404": a handler cannot know that the
  // value came from a path segment rather than a body field, and several routes
  // legitimately take a non-uuid `:id` (/pathways/:id, /notices/:id). 400 is
  // what is actually true of all of them — the request carried a value the
  // database could not read — while clips.ts keeps its own explicit 404 because
  // there the id IS the resource and «not found» is the better answer.
  const CALLER_DATA_ERRORS = new Set([
    '22P02', // invalid text representation — a malformed uuid, enum or integer
    '22001', // string too long for the column
    '22003', // numeric value out of range
    '22007', // invalid datetime format
    '22008', // datetime field overflow
  ]);
  app.setErrorHandler((err, request, reply) => {
    // Fastify's own schema validation, and anything a route threw deliberately
    // with a status, already carry the right answer and a message written for
    // the caller. Those pass through untouched — tests and clients read them.
    const status = (err as { statusCode?: number }).statusCode;
    if (typeof status === 'number' && status < 500) return reply.code(status).send(err);

    const pgCode = (err as { code?: string }).code;
    if (typeof pgCode === 'string' && CALLER_DATA_ERRORS.has(pgCode)) {
      request.log.info({ err: (err as Error).message, pgCode, url: request.url }, 'rejected a malformed value');
      return reply.code(400).send({ error: 'invalid_input' });
    }

    // Everything else is ours. It goes to the log in full and to the caller as
    // nothing at all.
    request.log.error({ err }, 'unhandled error');
    return reply.code(500).send({ error: 'server_error' });
  });

  // Public, unauthenticated, and cheap: a load balancer probes it, and a human
  // uses it to confirm WHICH build is actually serving. The repo is public, so
  // the commit sha reveals nothing; no secret or config value goes in here.
  app.get('/health', async () => ({
    ok: true,
    version: config.build.tag,
    commit: config.build.commit,
    built_at: config.build.builtAt,
  }));

  await app.register(authRoutes);
  await app.register(baleRoutes);
  await app.register(leagueRoutes);
  await app.register(leagueAdminRoutes);
  await app.register(anonRoutes);
  await app.register(activityRoutes);
  await app.register(highlightRoutes);
  await app.register(clipRoutes);
  await app.register(articleNoteRoutes);
  await app.register(reviewRoutes);
  await app.register(pathwayRoutes);
  await app.register(achievementRoutes);
  await app.register(noticeRoutes);
  await app.register(collectionRoutes);
  await app.register(snippetRoutes);
  await app.register(collectionExportRoutes);
  await app.register(readingCompassRoutes);
  await app.register(reportRoutes);
  await app.register(highlightConceptRoutes);
  await app.register(caseAssistantRoutes);
  await app.register(premiumGrantRoutes);
  await app.register(dashboardRoutes);
  await app.register(supportRoutes);
  await app.register(adminRoutes);
  await app.register(pushRoutes);
  await app.register(payRoutes);
  await app.register(referralRoutes);
  await app.register(desRoutes);
  await app.register(challengeRoutes);
  await app.register(playerRoutes);
  await app.register(voteRoutes);
  await app.register(clinicRoutes);
  await app.register(certificateRoutes);
  await app.register(examRoutes);

  return app;
}
