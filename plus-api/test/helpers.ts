import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { pool } from '../src/db.js';
import { resetRateLimits } from '../src/services/rate-limit.js';
import { clearOtpStore } from '../src/services/otp.js';

/** Truncate all data tables and reset in-process stores. Call in beforeEach. */
export async function resetDb(): Promise<void> {
  await pool.query(`
    truncate table
      profiles, user_activity, highlights, card_state,
      collections, collection_items, user_pathways,
      subscriptions, payments, certificates, anon_events,
      push_subscriptions, articles, auth_identities
    restart identity cascade
  `);
  resetRateLimits();
  clearOtpStore();
}

export async function makeApp(): Promise<FastifyInstance> {
  const app = await buildServer();
  await app.ready();
  return app;
}

/** Extract the signed session cookie string from a set-cookie header. */
export function sessionCookieFrom(res: { headers: Record<string, unknown> }): string | null {
  const raw = res.headers['set-cookie'];
  const arr = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  const c = arr.find((s) => s.startsWith('dcp_session='));
  return c ? c.split(';')[0] : null;
}

/** Full OTP login round-trip; returns the session cookie header value. */
export async function loginAs(app: FastifyInstance, phone: string): Promise<string> {
  const req = await app.inject({
    method: 'POST',
    url: '/auth/otp/request',
    payload: { phone },
  });
  const code = req.json().dev_code as string;
  const verify = await app.inject({
    method: 'POST',
    url: '/auth/otp/verify',
    payload: { phone, code },
  });
  const cookie = sessionCookieFrom(verify);
  if (!cookie) throw new Error('login did not set a session cookie');
  return cookie;
}
