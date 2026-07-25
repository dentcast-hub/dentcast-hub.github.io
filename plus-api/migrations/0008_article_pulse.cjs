/**
 * New-article notifications now carry the article's Pulse sentence (the brain's
 * `caption`) as the message body, instead of a bare count/title. Stored per
 * article so the free digest can list each new article's Pulse. NULL is fine —
 * the sender falls back to "a new article in {section}".
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql('alter table articles add column pulse text;');
};

exports.down = (pgm) => {
  pgm.sql('alter table articles drop column if exists pulse;');
};
