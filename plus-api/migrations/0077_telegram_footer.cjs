// /admin «امضای پیام تلگرام»: one short line + one link appended under every
// Telegram channel announcement (tools/announce_telegram_channel.py reads it
// from GET /admin/telegram-footer on the GitHub runner). A single row; off by
// default, and off means the message carries nothing extra. Independent of the
// Spot ad system on the site. Additive.
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`
    create table if not exists telegram_footer_settings (
      id boolean primary key default true check (id = true),
      enabled boolean not null default false,
      text text not null default '',
      url text not null default '',
      updated_at timestamptz not null default now()
    );
  `);
};
// Keep the row on rollback; older API versions ignore it.
exports.down = () => {};
