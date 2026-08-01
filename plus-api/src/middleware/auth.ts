import type { FastifyReply, FastifyRequest } from 'fastify';
import { one } from '../db.js';
import { readSession } from '../services/session.js';
import { isArmed } from '../services/failsafe.js';

export interface AuthUser {
  id: string;
  phone: string;
  display_name: string;
  /**
   * The EFFECTIVE tier — what this user may do right now. Normally the profiles
   * column, but forced to 'premium' while the dead-man's switch is armed
   * (services/failsafe.ts). Resolving it here, in the one function every
   * authenticated path already goes through, is what lets the switch work with
   * no changes to requirePremium or to any of the frontend's `tier !== 'premium'`
   * gates — the same leverage migration 0014's league prize gets from flipping
   * the column itself, without the column having to be rewritten for every user.
   */
  tier: 'free' | 'premium';
  /**
   * The tier as actually STORED — what this user paid for or won. Anything that
   * asks "what is this account really?" rather than "what may it do?" must read
   * this one: the ad system (a failsafe-premium reader still sees ads, because
   * ad revenue is what keeps the server that serves them alive) and the page-view
   * counter (whose premium bucket is the Spot report's control group, and would
   * become meaningless if the switch moved everyone into it).
   */
  base_tier: 'free' | 'premium';
  /** True only when this user's premium comes from the armed switch. */
  failsafe_premium: boolean;
  current_streak: number;
  longest_streak: number;
  last_active_day: string | null;
  telegram_id: number | null;
  bale_id: number | null;
  settings: Record<string, unknown>;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/** Load the profile for the current session, or null if not authenticated. */
export async function loadUser(request: FastifyRequest): Promise<AuthUser | null> {
  const userId = readSession(request);
  if (!userId) return null;
  const row = await one<AuthUser>(
    `select id, phone, display_name, tier, current_streak, longest_streak,
            last_active_day, telegram_id, bale_id, settings
       from profiles where id = $1`,
    [userId],
  );
  if (!row) return null;

  // Overlay the dead-man's switch. isArmed() is cached in-process and never
  // throws, so this stays a memory read on all but one request a minute.
  const armed = await isArmed();
  const baseTier = row.tier;
  return {
    ...row,
    base_tier: baseTier,
    tier: armed ? 'premium' : baseTier,
    failsafe_premium: armed && baseTier !== 'premium',
  };
}

/**
 * preHandler: require a valid session. Attaches request.user or replies 401.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await loadUser(request);
  if (!user) {
    reply.code(401).send({ error: 'unauthorized', message: 'ورود لازم است.' });
    return;
  }
  request.user = user;
}
