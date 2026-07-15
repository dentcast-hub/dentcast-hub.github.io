import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { anonRoutes } from './routes/anon.js';

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
    origin: config.corsOrigins,
    credentials: true, // session cookie travels on cross-origin fetches from the site
  });

  app.get('/health', async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(anonRoutes);

  return app;
}
