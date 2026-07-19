/**
 * One-time (or re-run-after-token-rotation) admin action: point the Telegram
 * bot at this API's webhook, with the shared secret Telegram will echo back on
 * every call (routes/telegram.ts checks it). Requires TELEGRAM_BOT_TOKEN and
 * TELEGRAM_WEBHOOK_SECRET to already be set in the environment this runs in.
 *
 *   npm run telegram:set-webhook -- https://api.dentcast.ir/telegram/webhook
 */
import { config } from '../config.js';

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: npm run telegram:set-webhook -- https://api.dentcast.ir/telegram/webhook');
    process.exit(1);
  }
  if (!config.notify.telegramBotToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  if (!config.notify.telegramWebhookSecret) throw new Error('TELEGRAM_WEBHOOK_SECRET is not set');

  const api = `https://api.telegram.org/bot${config.notify.telegramBotToken}/setWebhook`;
  const res = await fetch(api, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, secret_token: config.notify.telegramWebhookSecret }),
  });
  const body = (await res.json()) as { ok?: boolean };
  console.log(body);
  if (!body.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
