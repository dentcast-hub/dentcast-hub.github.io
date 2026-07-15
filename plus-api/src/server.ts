import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { anonRoutes } from './routes/anon.js';
import { activityRoutes } from './routes/activity.js';
import { highlightRoutes } from './routes/highlights.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { adminRoutes } from './routes/admin.js';

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

  app.get('/health', async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(anonRoutes);
  await app.register(activityRoutes);
  await app.register(highlightRoutes);
  await app.register(dashboardRoutes);
  await app.register(adminRoutes);

  return app;
}
