/**
 * One-off grant for the seventh-anniversary campaign: every account that has
 * ever logged in — phone OR Telegram, `profiles.phone is not null or
 * profiles.telegram_id is not null` — gets the «هفت‌سالگی» badge, and, only on
 * a FRESH grant (never a repeat), seven days added to whatever premium it has
 * right now. The addition goes through `activateDays()`
 * (services/subscription.ts), the same `max(now, current expiry) + N` rule a
 * real renewal uses: a free account's zero becomes seven, a subscriber with
 * twenty days left ends up with twenty-seven. A founder/«ستون» row is left
 * untouched by that same function — already premium forever, nothing to add —
 * but still gets the badge.
 *
 * IDEMPOTENT BY CONSTRUCTION, not by a flag this script has to get right:
 * `grantBadge()` is unique per (user, badge) at the database level, so a
 * second run sees `already: true` for everyone already touched and calls
 * `activateDays()` for NOBODY twice. Safe to re-run after a partial failure —
 * crash it halfway through and running it again only finishes the rest.
 *
 * WHEN TO RUN: not before the campaign's own start date. `activateDays()`
 * extends from `max(now, current expiry)`, so running this early starts
 * everyone's seven-day clock early too — the gift's start date IS the date
 * this script is executed, there is no separate "schedule for later" inside
 * the grant itself.
 *
 *   npm run anniversary-grant             # writes for real
 *   npm run anniversary-grant -- --dry-run  # counts eligible accounts, writes nothing
 */
import { pool } from '../db.js';
import { grantBadge } from '../services/badge-grants.js';
import { activateDays } from '../services/subscription.js';

const BADGE_KEY = 'anniversary7';
const GIFT_DAYS = 7;
const CAMPAIGN = 'anniversary_7';

export interface AnniversaryGrantResult {
  eligible: number;
  badgeGranted: number;
  alreadyHadBadge: number;
  daysGranted: number;
}

export async function runAnniversaryGrant(
  opts: { dryRun?: boolean; now?: Date } = {},
): Promise<AnniversaryGrantResult> {
  const now = opts.now ?? new Date();

  const rows = await pool.query<{ id: string }>(
    `select id from profiles
      where (phone is not null and phone <> '') or telegram_id is not null`,
  );

  const result: AnniversaryGrantResult = {
    eligible: rows.rows.length, badgeGranted: 0, alreadyHadBadge: 0, daysGranted: 0,
  };
  if (opts.dryRun) return result;

  for (const { id } of rows.rows) {
    const grant = await grantBadge(id, BADGE_KEY);
    if (grant.already) {
      result.alreadyHadBadge += 1;
      continue;
    }
    result.badgeGranted += 1;
    await activateDays(id, GIFT_DAYS, { source: 'admin', now, meta: { campaign: CAMPAIGN } });
    result.daysGranted += 1;
  }

  return result;
}

// Run directly (not when imported by a test).
const isDirect = process.argv[1] && process.argv[1].includes('anniversary-grant');
if (isDirect) {
  const dryRun = process.argv.includes('--dry-run');
  runAnniversaryGrant({ dryRun })
    .then((r) => {
      if (dryRun) {
        console.log(`[dry-run] ${r.eligible} eligible account(s) found. Nothing written.`);
      } else {
        console.log(
          `Done. ${r.eligible} eligible, ${r.badgeGranted} newly badged (+${GIFT_DAYS} days each), `
          + `${r.alreadyHadBadge} already had the badge (skipped — no days re-added).`,
        );
      }
      return pool.end();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
