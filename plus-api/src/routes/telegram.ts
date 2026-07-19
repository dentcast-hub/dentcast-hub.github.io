import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { normalizePhone } from '../services/phone.js';
import { linkTelegram } from '../services/telegram-link.js';
import { callTelegramApi } from '../providers/telegram-api.js';

/** Minimal shape of the Telegram Update object; only the fields this bot reads. */
interface TelegramContact {
  phone_number: string;
  user_id?: number;
}
interface TelegramMessage {
  from?: { id: number };
  chat: { id: number };
  text?: string;
  contact?: TelegramContact;
}
interface TelegramUpdate {
  message?: TelegramMessage;
}

const CONTACT_KEYBOARD = {
  keyboard: [[{ text: '📱 اشتراک‌گذاری شماره من', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

async function sendText(chatId: number, text: string, withContactButton = false): Promise<void> {
  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: withContactButton ? CONTACT_KEYBOARD : { remove_keyboard: true },
  });
}

/**
 * The Telegram bot: /start -> ask the user to share their own phone via the
 * contact button -> match it to a profile and store telegram_id (spec section
 * 2, "bot: /start -> contact share -> match phone -> store telegram_id"). This
 * is the linking half; actual message delivery goes through
 * providers/notifications/telegram.ts, which reads the telegram_id this stores.
 */
export async function telegramRoutes(app: FastifyInstance): Promise<void> {
  app.post('/telegram/webhook', async (request, reply) => {
    // Telegram echoes the secret_token set at setWebhook time back in this
    // header on every request, proving the call actually came from Telegram
    // and not someone who guessed the public webhook URL.
    const secret = request.headers['x-telegram-bot-api-secret-token'];
    if (!config.notify.telegramWebhookSecret || secret !== config.notify.telegramWebhookSecret) {
      return reply.code(403).send({ error: 'forbidden' });
    }

    const message = (request.body as TelegramUpdate)?.message;
    if (!message) return reply.send({ ok: true }); // non-message update (edits, etc.): ignore

    const chatId = message.chat.id;

    if (message.contact) {
      // Only accept a user's OWN contact card. Telegram's request_contact
      // button always shares the sender's own number, so contact.user_id
      // equals message.from.id in that case; anything else (e.g. a forwarded
      // contact card) would let someone link a stranger's phone to their own
      // telegram_id and hijack that person's notifications, so it is rejected.
      if (!message.from || message.contact.user_id !== message.from.id) {
        await sendText(chatId, 'لطفاً فقط شماره‌ی خودتان را با دکمه‌ی زیر به اشتراک بگذارید.', true);
        return reply.send({ ok: true });
      }

      const phone = normalizePhone(message.contact.phone_number);
      if (!phone) {
        await sendText(chatId, 'این شماره ایرانی به نظر نمی‌رسد. لطفاً دوباره تلاش کنید.');
        return reply.send({ ok: true });
      }

      const result = await linkTelegram(phone, message.from.id);
      if (result === 'ok') {
        await sendText(chatId, 'اتصال با موفقیت انجام شد. از این پس نوتیف‌های دنت‌کست پلاس اینجا هم می‌رسد.');
      } else if (result === 'no_profile') {
        await sendText(
          chatId,
          'ابتدا یک‌بار در dentcast.ir با همین شماره وارد شوید، بعد دوباره اینجا شماره‌تان را به اشتراک بگذارید.',
        );
      } else {
        await sendText(chatId, 'این حساب تلگرام قبلاً به شماره‌ی دیگری متصل است.');
      }
      return reply.send({ ok: true });
    }

    if (message.text === '/start') {
      await sendText(
        chatId,
        'سلام! برای اتصال حساب دنت‌کست پلاس، شماره‌ی موبایل خودتان را با دکمه‌ی زیر به اشتراک بگذارید.',
        true,
      );
      return reply.send({ ok: true });
    }

    await sendText(chatId, 'برای اتصال حساب، دستور /start را بفرستید.');
    return reply.send({ ok: true });
  });
}
