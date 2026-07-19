import { query } from '../db.js';

export type LinkResult = 'ok' | 'no_profile' | 'already_linked_elsewhere';

/**
 * Attach a Telegram user id to the profile owning `phone` (already normalized).
 * Shared by the bot webhook (routes/telegram.ts) and the external-caller
 * endpoint (POST /auth/telegram/link) so the linking rule lives in one place.
 *
 * telegram_id is unique across profiles (migrations/0001_init.cjs); relinking
 * an id already claimed by a DIFFERENT phone is rejected rather than silently
 * moving it, which would hand that other user's notifications to whoever
 * shared second.
 */
export async function linkTelegram(phone: string, telegramId: number): Promise<LinkResult> {
  try {
    const res = await query(
      `update profiles set telegram_id = $1 where phone = $2`,
      [telegramId, phone],
    );
    return (res.rowCount ?? 0) > 0 ? 'ok' : 'no_profile';
  } catch (err) {
    if ((err as { code?: string }).code === '23505') return 'already_linked_elsewhere';
    throw err;
  }
}
