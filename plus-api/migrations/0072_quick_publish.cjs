// Emergency minimal publish from /admin («انتشار حداقلی»). The bucket holds the
// live page and its ledger; these rows are the API's own copy of every record
// and image, so a deploy that wiped the bucket before an import can be undone
// from the panel (restore). Additive.
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`
    create table if not exists quick_publications (
      id text primary key,
      type text not null,
      record jsonb not null,
      html text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists quick_publish_media (
      path text primary key,
      content_type text not null,
      data bytea not null,
      created_at timestamptz not null default now()
    );
  `);
};
// Keep the copies on rollback; they are the only backup of what was published.
exports.down = () => {};
