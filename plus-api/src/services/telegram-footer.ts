/**
 * امضای پیام تلگرام — the short line and link that go under every Telegram
 * channel announcement of a new publish.
 *
 * The announcement itself is sent from a GitHub runner
 * (tools/announce_telegram_channel.py), because api.telegram.org is filtered
 * from this server in Iran. This API only STORES the footer: the runner reads
 * it with GET /admin/telegram-footer just before sending. So a change saved in
 * the panel applies from the next publish, with no repository variable and no
 * commit.
 *
 * Deliberately separate from the Spot ad system (spot/spot-config.json): no
 * rotation, no slots, no audience. One row; `enabled = false` means the message
 * carries nothing extra, whatever text/url are still stored.
 */
import { one, query } from '../db.js';

export const FOOTER_TEXT_MAX = 120;
export const FOOTER_URL_MAX = 500;

export interface TelegramFooter {
  enabled: boolean;
  text: string;
  url: string;
  updated_at: string | null;
}

export async function getFooter(): Promise<TelegramFooter> {
  const row = await one<{ enabled: boolean; text: string; url: string; updated_at: Date }>(
    'select enabled, text, url, updated_at from telegram_footer_settings where id = true');
  if (!row) return { enabled: false, text: '', url: '', updated_at: null };
  return {
    enabled: row.enabled,
    text: row.text,
    url: row.url,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export type FooterError = { error: string; message: string };

/**
 * Validate and save. Text and link are both required only while the footer is
 * ON: turning it off keeps the last copy so turning it back on is one tap.
 */
export async function setFooter(input: {
  enabled?: unknown; text?: unknown; url?: unknown;
}): Promise<TelegramFooter | FooterError> {
  const enabled = input.enabled === true;
  const text = typeof input.text === 'string' ? input.text.replace(/\s+/g, ' ').trim() : '';
  const url = typeof input.url === 'string' ? input.url.trim() : '';

  if (text.length > FOOTER_TEXT_MAX) {
    return { error: 'text_too_long', message: `متن حداکثر ${FOOTER_TEXT_MAX} نویسه است.` };
  }
  if (url.length > FOOTER_URL_MAX) {
    return { error: 'url_too_long', message: 'لینک خیلی بلند است.' };
  }
  if (url && !isHttpUrl(url)) {
    return { error: 'invalid_url', message: 'لینک باید کامل باشد و با https:// یا http:// شروع شود.' };
  }
  if (enabled && !text) {
    return { error: 'text_required', message: 'برای روشن کردن، متن را بنویس.' };
  }
  if (enabled && !url) {
    return { error: 'url_required', message: 'برای روشن کردن، لینک را بنویس.' };
  }

  await query(`insert into telegram_footer_settings (id, enabled, text, url)
      values (true, $1, $2, $3)
    on conflict (id) do update
      set enabled = excluded.enabled, text = excluded.text, url = excluded.url, updated_at = now()`,
  [enabled, text, url]);
  return getFooter();
}

function isHttpUrl(s: string): boolean {
  if (/\s/.test(s)) return false;
  try {
    const u = new URL(s);
    return (u.protocol === 'https:' || u.protocol === 'http:') && !!u.hostname;
  } catch {
    return false;
  }
}
