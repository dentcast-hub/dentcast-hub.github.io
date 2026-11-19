// «امضای پیام تلگرام»: optional display name for the footer link. Empty means
// the raw link is shown, as before; set means the link goes behind this name.
// Additive.
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`alter table telegram_footer_settings add column if not exists label text not null default ''`);
};
exports.down = () => {};
