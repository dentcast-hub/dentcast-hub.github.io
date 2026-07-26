import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { pool } from '../src/db.js';
import { resetRateLimits } from '../src/services/rate-limit.js';
import { clearOtpStore } from '../src/services/otp.js';
import { clearBaleLinkStore } from '../src/services/bale-link.js';

/** Truncate all data tables and reset in-process stores. Call in beforeEach. */
export async function resetDb(): Promise<void> {
  await pool.query(`
    truncate table
      profiles, user_activity, highlights, card_state,
      collections, collection_items, user_pathways,
      subscriptions, payments, certificates, anon_events,
      push_subscriptions, articles, auth_identities, spot_stats, view_stats,
      leagues, league_members, league_weekly_stats, league_audit_log
    restart identity cascade
  `);
  // League seed data (tiers + config) is created ONCE by the migration and must
  // survive truncation — reset only the auto-tuned state back to seed defaults so
  // each test starts from a known baseline.
  await pool.query(`
    update league_config set value = case key
      when 'group_size_current' then '8'
      when 'max_active_tier_order' then '3'
      when 'group_size_last_changed_week' then ''
      else value end,
      locked = false, locked_at = null;
    `);
  await pool.query(
    "update league_tiers set is_active = (tier_order <= 3), activated_at = case when tier_order <= 3 then now() else null end",
  );
  resetRateLimits();
  clearOtpStore();
  clearBaleLinkStore();
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
