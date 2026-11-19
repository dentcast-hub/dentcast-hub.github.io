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
export const FOOTER_LABEL_MAX = 60;

export interface TelegramFooter {
  enabled: boolean;
  text: string;
  url: string;
  /** Display name for the link; empty = show the raw link. */
  label: string;
  updated_at: string | null;
}

export async function getFooter(): Promise<TelegramFooter> {
  const row = await one<{ enabled: boolean; text: string; url: string; label: string; updated_at: Date }>(
    'select enabled, text, url, label, updated_at from telegram_footer_settings where id = true');
  if (!row) return { enabled: false, text: '', url: '', label: '', updated_at: null };
  return {
    enabled: row.enabled,
    text: row.text,
    url: row.url,
    label: row.label,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export type FooterError = { error: string; message: string };

/**
 * Validate and save. Text and link are both required only while the footer is
 * ON: turning it off keeps the last copy so turning it back on is one tap.
 */
export async function setFooter(input: {
  enabled?: unknown; text?: unknown; url?: unknown; label?: unknown;
}): Promise<TelegramFooter | FooterError> {
  const enabled = input.enabled === true;
  const text = typeof input.text === 'string' ? input.text.replace(/\s+/g, ' ').trim() : '';
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  const label = typeof input.label === 'string' ? input.label.replace(/\s+/g, ' ').trim() : '';

  if (text.length > FOOTER_TEXT_MAX) {
    return { error: 'text_too_long', message: `متن حداکثر ${FOOTER_TEXT_MAX} نویسه است.` };
  }
  if (label.length > FOOTER_LABEL_MAX) {
    return { error: 'label_too_long', message: `اسم نمایشی حداکثر ${FOOTER_LABEL_MAX} نویسه است.` };
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

  await query(`insert into telegram_footer_settings (id, enabled, text, url, label)
      values (true, $1, $2, $3, $4)
    on conflict (id) do update
      set enabled = excluded.enabled, text = excluded.text, url = excluded.url,
          label = excluded.label, updated_at = now()`,
  [enabled, text, url, label]);
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
