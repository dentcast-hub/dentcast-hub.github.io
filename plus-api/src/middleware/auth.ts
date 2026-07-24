import type { FastifyReply, FastifyRequest } from 'fastify';
import { one } from '../db.js';
import { readSession } from '../services/session.js';

export interface AuthUser {
  id: string;
  phone: string;
  display_name: string;
  tier: 'free' | 'premium';
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
  const user = await one<AuthUser>(
    `select id, phone, display_name, tier, current_streak, longest_streak,
            last_active_day, telegram_id, bale_id, settings
       from profiles where id = $1`,
    [userId],
  );
  return user;
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
