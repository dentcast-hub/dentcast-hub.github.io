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
import { articleNoteRoutes } from './routes/article-note.js';
import { reviewRoutes } from './routes/review.js';
import { pathwayRoutes } from './routes/pathways.js';
import { achievementRoutes } from './routes/achievements.js';
import { noticeRoutes } from './routes/notices.js';
import { collectionRoutes } from './routes/collections.js';
import { snippetRoutes } from './routes/snippets.js';
import { collectionExportRoutes } from './routes/collection-export.js';
import { readingCompassRoutes } from './routes/reading-compass.js';
import { caseAssistantRoutes } from './routes/case-assistant.js';
import { premiumGrantRoutes } from './routes/premium-grant.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { supportRoutes } from './routes/support.js';
import { adminRoutes } from './routes/admin.js';
import { pushRoutes } from './routes/push.js';
import { payRoutes } from './routes/pay.js';

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
  await app.register(articleNoteRoutes);
  await app.register(reviewRoutes);
  await app.register(pathwayRoutes);
  await app.register(achievementRoutes);
  await app.register(noticeRoutes);
  await app.register(collectionRoutes);
  await app.register(snippetRoutes);
  await app.register(collectionExportRoutes);
  await app.register(readingCompassRoutes);
  await app.register(caseAssistantRoutes);
  await app.register(premiumGrantRoutes);
  await app.register(dashboardRoutes);
  await app.register(supportRoutes);
  await app.register(adminRoutes);
  await app.register(pushRoutes);
  await app.register(payRoutes);
  await app.register(playerRoutes);
  await app.register(voteRoutes);

  return app;
}
