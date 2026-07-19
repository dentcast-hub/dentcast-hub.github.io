import { config } from '../config.js';

/**
 * Minimal Telegram Bot API caller shared by the outbound notification sender
 * (notifications/telegram.ts) and the inbound webhook handler (routes/telegram.ts).
 * No bot token (dev) -> no-op, so both flows still run end to end without secrets.
 */
export async function callTelegramApi(method: string, payload: Record<string, unknown>): Promise<void> {
  if (!config.notify.telegramBotToken) return;
  const url = `https://api.telegram.org/bot${config.notify.telegramBotToken}/${method}`;
  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
