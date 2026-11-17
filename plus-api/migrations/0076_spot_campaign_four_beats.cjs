/**
 * The admin Spot schedule goes from three VISITS to the site's own four BEATS.
 *
 * 0070 stored exactly three entries, one per visit, and the client forced a
 * per-visit cadence on them. The published rotation it was meant to control is
 * four beats (three sponsor, one house) on the cadence spot-config.json sets —
 * so saving a schedule from the panel replaced the rotation with a different
 * shape, and dropped the house beat entirely. The founder asked for the four
 * beats as they are, controllable from the panel.
 *
 * Only the length check changes. A beat is still `{ enabled, creative }`, now
 * with an optional `house: true` meaning "the site's own card"; that is a JSON
 * field, not a column. The bound is 1..8 rather than exactly 4 so a row saved
 * under 0070 (three entries) stays valid until the founder saves it again —
 * spot.js reads any length — and so a different beat count later is a code
 * decision, not another migration.
 */
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`
    alter table spot_campaign_controls drop constraint if exists spot_campaign_controls_sessions_check;
    alter table spot_campaign_controls add constraint spot_campaign_controls_sessions_check
      check (jsonb_typeof(sessions) = 'array' and jsonb_array_length(sessions) between 1 and 8);
  `);
};
// Keep the saved schedule on rollback; an older API simply ignores a longer one.
exports.down = () => {};
