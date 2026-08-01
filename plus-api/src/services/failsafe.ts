import { config } from '../config.js';
import { query, one } from '../db.js';
import { notifications } from '../providers/registry.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * The dead-man's switch. See migration 0018 for WHY it is shaped this way; this
 * file is the mechanism.
 *
 * Three moving parts:
 *   touchHeartbeat()   - proof of life. Called from requireAdmin (every admin
 *                        request), from the publish webhook, and from the
 *                        explicit "I'm here" button.
 *   runFailsafeCheck() - the daily sweep. Warns during the grace period, arms
 *                        after it.
 *   isArmed()          - the read path, consulted on every single /me. Cached,
 *                        because a 90-day clock does not need per-request
 *                        freshness and /me is the busiest route on the site.
 *
 * Everything is idempotent and re-derived from the row on every run, so a
 * container that was down for a week self-heals on its next sweep — the same
 * property finalizeDueWeeks and grantWeeklyPrizes rely on.
 */

const DAY_MS = 86_400_000;

export type HeartbeatSource = 'publish' | 'admin' | 'manual' | 'bootstrap';

export interface FailsafeState {
  last_heartbeat_at: string;
  last_heartbeat_source: HeartbeatSource;
  warned_at: string | null;
  warned_for_heartbeat_at: string | null;
  armed_at: string | null;
  armed_reason: string | null;
}

/** The state plus everything derived from it — what /admin/failsafe answers. */
export interface FailsafeStatus extends FailsafeState {
  enabled: boolean;
  armed: boolean;
  silent_days: number;
  /** Days until the switch fires; 0 once armed. Negative is clamped away. */
  days_until_arm: number;
  /** Days until the FIRST warning goes out; null once the grace period started. */
  days_until_warning: number | null;
  in_grace_period: boolean;
  warn_days: number;
  arm_days: number;
  /** False when no founder profile is configured/found — warnings cannot be sent. */
  can_warn: boolean;
}

/** pg hands back timestamptz as a Date; every consumer here wants an ISO string. */
interface FailsafeRow {
  last_heartbeat_at: Date;
  last_heartbeat_source: HeartbeatSource;
  warned_at: Date | null;
  warned_for_heartbeat_at: Date | null;
  armed_at: Date | null;
  armed_reason: string | null;
}

function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export async function getFailsafeState(): Promise<FailsafeState> {
  const row = await one<FailsafeRow>(
    `select last_heartbeat_at, last_heartbeat_source, warned_at,
            warned_for_heartbeat_at, armed_at, armed_reason
       from failsafe_state where id = 1`,
  );
  // The migration seeds the row, so this only fires against a database that has
  // been tampered with. Re-seed rather than throw: a missing row must never be
  // able to take /me (and therefore every page on the site) down.
  if (!row) {
    await query('insert into failsafe_state (id) values (1) on conflict (id) do nothing');
    return getFailsafeState();
  }
  return {
    ...row,
    last_heartbeat_at: row.last_heartbeat_at.toISOString(),
    warned_at: iso(row.warned_at),
    warned_for_heartbeat_at: iso(row.warned_for_heartbeat_at),
    armed_at: iso(row.armed_at),
  };
}

// ── the read path ────────────────────────────────────────────────────────────

// isArmed() is called from loadUser(), i.e. once per page view per visitor. The
// answer changes at most once every few months, so a short cache turns that back
// into roughly one query per minute. TTL rather than invalidation on purpose:
// the admin routes that flip the flag can clear it directly (below), and if a
// second container ever runs, its stale copy self-corrects within the minute.
const CACHE_MS = 60_000;
let cachedArmed: boolean | null = null;
let cachedAt = 0;

/** Drop the isArmed() cache — called after any write that changes armed state. */
export function clearFailsafeCache(): void {
  cachedArmed = null;
  cachedAt = 0;
}

/**
 * Is the switch currently firing? Never throws: a database hiccup must not
 * decide entitlements, so an error falls back to the last known answer, or to
 * "not armed" if we have never had one. Failing CLOSED is right here — the cost
 * of a wrong "not armed" is a few minutes of normal gating, while a wrong
 * "armed" would hand out premium on a transient error.
 */
export async function isArmed(now: Date = new Date()): Promise<boolean> {
  if (!config.failsafe.enabled) return false;
  const t = now.getTime();
  if (cachedArmed !== null && t - cachedAt < CACHE_MS) return cachedArmed;
  try {
    const row = await one<{ armed_at: string | null }>('select armed_at from failsafe_state where id = 1');
    cachedArmed = row?.armed_at != null;
    cachedAt = t;
  } catch {
    return cachedArmed ?? false;
  }
  return cachedArmed;
}

// ── heartbeat ────────────────────────────────────────────────────────────────

// Debounce companion: the timestamp of the last write we actually performed, so
// the common case (another admin request seconds later) costs zero queries.
let lastWriteAt = 0;

/**
 * Record proof of life. `force` skips the debounce — used where the source is
 * itself meaningful (a publish, or the explicit button), so the founder's status
 * page shows what actually fed the switch rather than whichever admin request
 * happened to win the hour.
 *
 * Fire-and-forget by design at every call site: a failed heartbeat must never
 * fail the request that produced it. The cost of a dropped one is that the clock
 * keeps running from the previous heartbeat, which the next request re-fixes.
 *
 * Deliberately does NOT disarm. If the switch has already fired, coming back
 * takes premium away from every reader who has it — too visible an act to happen
 * as a side effect of opening an admin page. It is an explicit disarm() instead,
 * and the admin dashboard shows a banner so it cannot be missed.
 */
export async function touchHeartbeat(
  source: HeartbeatSource,
  { force = false, now = new Date() }: { force?: boolean; now?: Date } = {},
): Promise<void> {
  const t = now.getTime();
  if (!force && lastWriteAt && t - lastWriteAt < config.failsafe.heartbeatDebounceMs) return;
  lastWriteAt = t;
  await query(
    `update failsafe_state
        set last_heartbeat_at = $1, last_heartbeat_source = $2, updated_at = now()
      where id = 1`,
    [now.toISOString(), source],
  );
}

/** Test seam: forget the in-process debounce so a test can heartbeat twice. */
export function resetHeartbeatDebounce(): void {
  lastWriteAt = 0;
}

// ── arm / disarm ─────────────────────────────────────────────────────────────

async function logEvent(event: string, detail: string): Promise<void> {
  await query('insert into failsafe_log (event, detail) values ($1, $2)', [event, detail]);
}

/** Fire the switch. Idempotent: an already-armed switch keeps its original armed_at. */
export async function arm(reason: 'silence' | 'manual', detail: string, now: Date = new Date()): Promise<boolean> {
  const res = await query(
    `update failsafe_state
        set armed_at = $1, armed_reason = $2, updated_at = now()
      where id = 1 and armed_at is null`,
    [now.toISOString(), reason],
  );
  if (res.rowCount === 0) return false;
  await logEvent('armed', detail);
  clearFailsafeCache();
  // eslint-disable-next-line no-console
  console.warn(`[failsafe] ARMED (${reason}): ${detail} — every signed-in reader is now premium.`);
  return true;
}

/**
 * Stand the switch back down and restart the clock. Clears the warning marks
 * too: whatever silence armed it is over, and the next one should get its own
 * full grace period rather than inheriting a warning that was already spent.
 */
export async function disarm(detail: string, now: Date = new Date()): Promise<boolean> {
  const res = await query(
    `update failsafe_state
        set armed_at = null, armed_reason = null,
            warned_at = null, warned_for_heartbeat_at = null,
            last_heartbeat_at = $1, last_heartbeat_source = 'manual', updated_at = now()
      where id = 1 and armed_at is not null`,
    [now.toISOString()],
  );
  clearFailsafeCache();
  if (res.rowCount === 0) return false;
  await logEvent('disarmed', detail);
  return true;
}

// ── the daily sweep ──────────────────────────────────────────────────────────

function daysBetween(from: string | Date, to: Date): number {
  const a = from instanceof Date ? from : new Date(from);
  return Math.floor((to.getTime() - a.getTime()) / DAY_MS);
}

/** The founder's profile id, for the warning. Null when unconfigured/not found. */
async function founderUserId(): Promise<string | null> {
  const { founderUserId: id, founderPhone: phone } = config.failsafe;
  if (id) {
    const row = await one<{ id: string }>('select id from profiles where id = $1', [id]);
    if (row) return row.id;
  }
  if (phone) {
    const row = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
    if (row) return row.id;
  }
  return null;
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

function warningMessage(silentDays: number, daysLeft: number): NotificationMessage {
  return {
    title: 'کلید ایمنی دنت‌کست',
    body:
      `${toFa(silentDays)} روز است هیچ فعالیتی از شما ثبت نشده. ` +
      `اگر تا ${toFa(daysLeft)} روز دیگر برنگردید، دسترسی پرمیوم برای همه‌ی کاربران باز می‌شود. ` +
      'برای تمدید، کافی است وارد پیشخوان شوید.',
    url: '/plus/',
    tag: 'failsafe_warning',
  };
}

export interface FailsafeCheckResult {
  silentDays: number;
  warned: boolean;
  armed: boolean;
  /** True when a warning was due but no founder profile could be resolved. */
  warnUndeliverable: boolean;
}

/**
 * One day's evaluation. Safe to run any number of times a day and safe to miss
 * for a week; it only ever compares the clock against the stored row.
 *
 * Order matters: arming is checked BEFORE warning, so a sweep that comes back
 * after a long outage (silence already past armDays) fires immediately instead
 * of spending another grace period warning a founder who has been unreachable
 * the whole time.
 */
export async function runFailsafeCheck(now: Date = new Date()): Promise<FailsafeCheckResult> {
  const cfg = config.failsafe;
  const state = await getFailsafeState();
  const silentDays = daysBetween(state.last_heartbeat_at, now);
  const result: FailsafeCheckResult = { silentDays, warned: false, armed: false, warnUndeliverable: false };

  if (!cfg.enabled) return result;
  if (state.armed_at) return result; // already fired; only an explicit disarm ends it

  if (silentDays >= cfg.armDays) {
    result.armed = await arm(
      'silence',
      `${silentDays} days without a heartbeat (threshold ${cfg.armDays})`,
      now,
    );
    return result;
  }

  if (silentDays < cfg.warnDays) return result;

  // In the grace period. Warn on entry, then every reminderEveryDays.
  //
  // The staleness check is what makes a return cancel the alarm: warned_for_
  // heartbeat_at pins each warning to the silence it belongs to, so once a real
  // heartbeat lands the stored value no longer matches and the next grace period
  // opens with a fresh first warning instead of continuing the old cadence.
  const warningIsForThisSilence =
    state.warned_for_heartbeat_at != null &&
    new Date(state.warned_for_heartbeat_at).getTime() === new Date(state.last_heartbeat_at).getTime();
  const daysSinceWarning = warningIsForThisSilence && state.warned_at ? daysBetween(state.warned_at, now) : null;
  if (daysSinceWarning !== null && daysSinceWarning < cfg.reminderEveryDays) return result;

  const daysLeft = Math.max(0, cfg.armDays - silentDays);
  const userId = await founderUserId();
  if (userId) {
    // Sent directly, NOT through sendCapped: this is the one message in the
    // system whose whole purpose is to arrive, and a busy notification day must
    // not be able to drop it.
    await notifications.send(userId, warningMessage(silentDays, daysLeft), 'failsafe');
  } else {
    result.warnUndeliverable = true;
    // eslint-disable-next-line no-console
    console.warn('[failsafe] warning due but no founder profile configured (FAILSAFE_FOUNDER_USER_ID/PHONE)');
  }

  // The marks are written whether or not delivery had a destination, so an
  // unconfigured founder produces one log line per interval rather than one per
  // sweep — and the arming clock keeps running regardless.
  await query(
    `update failsafe_state
        set warned_at = $1, warned_for_heartbeat_at = last_heartbeat_at, updated_at = now()
      where id = 1`,
    [now.toISOString()],
  );
  await logEvent(
    'warned',
    `${silentDays} days silent, ${daysLeft} until arming` + (userId ? '' : ' (no founder destination)'),
  );
  result.warned = true;
  return result;
}

/** Everything the founder's status panel needs, derived fresh. */
export async function getFailsafeStatus(now: Date = new Date()): Promise<FailsafeStatus> {
  const cfg = config.failsafe;
  const state = await getFailsafeState();
  const silentDays = daysBetween(state.last_heartbeat_at, now);
  return {
    ...state,
    enabled: cfg.enabled,
    armed: state.armed_at != null,
    silent_days: silentDays,
    days_until_arm: state.armed_at ? 0 : Math.max(0, cfg.armDays - silentDays),
    days_until_warning: silentDays >= cfg.warnDays ? null : cfg.warnDays - silentDays,
    in_grace_period: state.armed_at == null && silentDays >= cfg.warnDays,
    warn_days: cfg.warnDays,
    arm_days: cfg.armDays,
    can_warn: (await founderUserId()) != null,
  };
}

export interface FailsafeLogRow { at: string; event: string; detail: string | null }

export async function getFailsafeLog(limit = 20): Promise<FailsafeLogRow[]> {
  const res = await query<{ at: Date; event: string; detail: string | null }>(
    'select at, event, detail from failsafe_log order by at desc limit $1',
    [limit],
  );
  return res.rows.map((r) => ({ ...r, at: r.at.toISOString() }));
}
