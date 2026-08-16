// The seventh-anniversary batch grant (plus-api/src/scripts/anniversary-grant.ts):
// eligibility is phone OR telegram (not phone alone), and a second run must
// neither re-badge nor re-add the seven days — the idempotency the whole
// script leans on is `grantBadge()`'s own (user, badge) uniqueness, not a flag
// this test has to trust blindly.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from './helpers.js';
import { pool, closePool } from '../src/db.js';
import { runAnniversaryGrant } from '../src/scripts/anniversary-grant.js';
import { getSubscription } from '../src/services/subscription.js';
import { listBadgeGrants } from '../src/services/badge-grants.js';

let seq = 0;

async function makeUser(opts: { phone?: string | null; telegramId?: number | null } = {}): Promise<string> {
  seq += 1;
  const phone = opts.phone === undefined ? `0912900${String(seq).padStart(4, '0')}` : opts.phone;
  const r = await pool.query<{ id: string }>(
    'insert into profiles (phone, telegram_id, display_name) values ($1, $2, $3) returning id',
    [phone, opts.telegramId ?? null, `کاربر ${seq}`],
  );
  return r.rows[0].id;
}

beforeEach(resetDb);
afterAll(closePool);

describe('runAnniversaryGrant', () => {
  it('counts phone-only and telegram-only accounts, but not a fully anonymous row', async () => {
    await makeUser({ phone: '09121234567', telegramId: null });
    await makeUser({ phone: null, telegramId: 555 });
    await makeUser({ phone: '', telegramId: null }); // neither, in practice

    const r = await runAnniversaryGrant({ dryRun: true });
    expect(r.eligible).toBe(2);
    expect(r.badgeGranted).toBe(0); // dry-run writes nothing
  });

  it('badges every eligible account and adds seven days on top of whatever premium it had', async () => {
    const free = await makeUser();
    const now = new Date('2026-08-30T09:00:00Z');

    const r = await runAnniversaryGrant({ now });
    expect(r.eligible).toBe(1);
    expect(r.badgeGranted).toBe(1);
    expect(r.daysGranted).toBe(1);

    const sub = await getSubscription(free);
    expect(sub?.status).toBe('active');
    const daysOut = Math.round((sub!.expires_at!.getTime() - now.getTime()) / 86_400_000);
    expect(daysOut).toBe(7);

    const grants = await listBadgeGrants(free);
    expect(grants.map((g) => g.badge_key)).toContain('anniversary7');
  });

  it('running it twice does not add fourteen days — the second pass is a no-op per user', async () => {
    const user = await makeUser();
    const now = new Date('2026-08-30T09:00:00Z');

    await runAnniversaryGrant({ now });
    const again = await runAnniversaryGrant({ now: new Date('2026-08-31T09:00:00Z') });

    expect(again.badgeGranted).toBe(0);
    expect(again.alreadyHadBadge).toBe(1);
    expect(again.daysGranted).toBe(0);

    const sub = await getSubscription(user);
    const daysOut = Math.round((sub!.expires_at!.getTime() - now.getTime()) / 86_400_000);
    expect(daysOut).toBe(7); // still seven, not fourteen
  });
});
