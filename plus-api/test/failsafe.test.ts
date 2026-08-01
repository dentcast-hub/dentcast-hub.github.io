import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import {
  runFailsafeCheck, touchHeartbeat, isArmed, arm, disarm, getFailsafeStatus,
  clearFailsafeCache, resetHeartbeatDebounce,
} from '../src/services/failsafe.js';
import { notifications } from '../src/providers/registry.js';

/**
 * The dead-man's switch. These tests are the only place its behaviour is ever
 * actually observed: in production it is meant to lie dormant for years, so an
 * untested one is a promise rather than a mechanism.
 */

let app: FastifyInstance;

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

/** Rewind the heartbeat to `days` ago, as if the founder had gone quiet. */
async function silentFor(days: number): Promise<void> {
  await pool.query(
    `update failsafe_state set last_heartbeat_at = now() - ($1 || ' days')::interval where id = 1`,
    [String(days)],
  );
  clearFailsafeCache();
  resetHeartbeatDebounce();
}

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('the silence clock', () => {
  it('does nothing while the founder is active', async () => {
    const r = await runFailsafeCheck(new Date());
    expect(r.warned).toBe(false);
    expect(r.armed).toBe(false);
    expect(await isArmed()).toBe(false);
  });

  it('warns once the grace period opens, without changing anything for readers', async () => {
    await silentFor(config.failsafe.warnDays + 1);
    const r = await runFailsafeCheck(new Date());
    expect(r.warned).toBe(true);
    expect(r.armed).toBe(false);
    // The whole point of the grace period: warnings go out, entitlements do not move.
    expect(await isArmed()).toBe(false);
  });

  it('does not re-warn before the reminder interval elapses', async () => {
    await silentFor(config.failsafe.warnDays + 1);
    expect((await runFailsafeCheck(new Date())).warned).toBe(true);
    // Same day, second sweep (a restart, or a manual /admin/failsafe/run).
    expect((await runFailsafeCheck(new Date())).warned).toBe(false);
  });

  it('re-warns after the reminder interval', async () => {
    await silentFor(config.failsafe.warnDays + 1);
    expect((await runFailsafeCheck(new Date())).warned).toBe(true);
    await pool.query(
      `update failsafe_state set warned_at = warned_at - ($1 || ' days')::interval where id = 1`,
      [String(config.failsafe.reminderEveryDays + 1)],
    );
    expect((await runFailsafeCheck(new Date())).warned).toBe(true);
  });

  it('arms after the full silence threshold', async () => {
    await silentFor(config.failsafe.armDays + 1);
    const r = await runFailsafeCheck(new Date());
    expect(r.armed).toBe(true);
    expect(await isArmed()).toBe(true);
  });

  it('arms immediately when a long outage means the grace period already passed', async () => {
    // Container down through the whole warning window: the first sweep back must
    // fire, not restart the countdown by spending a fresh grace period on a
    // founder who has been unreachable the entire time.
    await silentFor(config.failsafe.armDays + 30);
    const r = await runFailsafeCheck(new Date());
    expect(r.armed).toBe(true);
    expect(r.warned).toBe(false);
  });

  it('is idempotent once armed', async () => {
    await silentFor(config.failsafe.armDays + 1);
    expect((await runFailsafeCheck(new Date())).armed).toBe(true);
    const first = (await getFailsafeStatus()).armed_at;
    expect(typeof first).toBe('string'); // ISO, not a pg Date — the admin page formats it
    expect((await runFailsafeCheck(new Date())).armed).toBe(false);
    expect((await getFailsafeStatus()).armed_at).toBe(first);
  });
});

describe('proof of life', () => {
  it('a heartbeat cancels the countdown', async () => {
    await silentFor(config.failsafe.armDays - 1);
    expect((await getFailsafeStatus()).in_grace_period).toBe(true);
    await touchHeartbeat('manual', { force: true });
    const s = await getFailsafeStatus();
    expect(s.silent_days).toBe(0);
    expect(s.in_grace_period).toBe(false);
    expect((await runFailsafeCheck(new Date())).armed).toBe(false);
  });

  it('a return during the grace period restarts warnings from scratch', async () => {
    await silentFor(config.failsafe.warnDays + 1);
    expect((await runFailsafeCheck(new Date())).warned).toBe(true);

    // Founder comes back, then goes quiet again long enough to re-enter grace.
    await touchHeartbeat('manual', { force: true });
    await silentFor(config.failsafe.warnDays + 1);

    // The stale warned_at must not suppress the new silence's first warning.
    expect((await runFailsafeCheck(new Date())).warned).toBe(true);
  });

  it('a publish counts as a heartbeat', async () => {
    await silentFor(config.failsafe.warnDays + 1);
    const res = await app.inject({
      method: 'POST', url: '/admin/articles/published',
      headers: { authorization: basic },
      payload: { content_id: 'notecast/heartbeat', title: 'x', url: '/notecast/x.html' },
    });
    expect(res.statusCode).toBe(200);
    const s = await getFailsafeStatus();
    expect(s.silent_days).toBe(0);
    expect(s.last_heartbeat_source).toBe('publish');
  });

  it('an authenticated admin request counts as a heartbeat', async () => {
    await silentFor(config.failsafe.warnDays + 1);
    const res = await app.inject({ method: 'GET', url: '/admin/kpis', headers: { authorization: basic } });
    expect(res.statusCode).toBe(200);
    expect((await getFailsafeStatus()).silent_days).toBe(0);
  });

  it('a REJECTED admin request does not', async () => {
    // Otherwise anyone on the internet could keep the switch alive forever.
    await silentFor(config.failsafe.warnDays + 1);
    const res = await app.inject({
      method: 'GET', url: '/admin/kpis',
      headers: { authorization: 'Basic ' + Buffer.from('founder:wrong').toString('base64') },
    });
    expect(res.statusCode).toBe(401);
    expect((await getFailsafeStatus()).silent_days).toBeGreaterThanOrEqual(config.failsafe.warnDays);
  });

  it('does not disarm a switch that has already fired', async () => {
    await arm('silence', 'test');
    await touchHeartbeat('manual', { force: true });
    // Taking premium back from every reader is an explicit decision, never a
    // side effect of the founder opening a page.
    expect(await isArmed()).toBe(true);
  });
});

describe('the warning message', () => {
  it('goes to the configured founder profile', async () => {
    const row = await pool.query<{ id: string }>(
      "insert into profiles (phone, display_name) values ('+989120000001', 'founder') returning id",
    );
    const founderId = row.rows[0].id;
    const spy = vi.spyOn(notifications, 'send').mockResolvedValue(undefined);
    const original = config.failsafe.founderUserId;
    config.failsafe.founderUserId = founderId;
    try {
      await silentFor(config.failsafe.warnDays + 1);
      const r = await runFailsafeCheck(new Date());
      expect(r.warned).toBe(true);
      expect(r.warnUndeliverable).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
      const [userId, message, kind] = spy.mock.calls[0];
      expect(userId).toBe(founderId);
      expect(kind).toBe('failsafe');
      expect((message as { body: string }).body).toContain('پرمیوم');
    } finally {
      config.failsafe.founderUserId = original;
    }
  });

  it('still arms on schedule when no founder profile is configured', async () => {
    // Failing to be able to ASK must never become a reason not to ACT — that is
    // the exact scenario the switch exists for.
    await silentFor(config.failsafe.warnDays + 1);
    expect((await runFailsafeCheck(new Date())).warnUndeliverable).toBe(true);
    await silentFor(config.failsafe.armDays + 1);
    expect((await runFailsafeCheck(new Date())).armed).toBe(true);
  });
});

describe('what an armed switch actually changes', () => {
  it('lets a free user through a premium gate', async () => {
    const cookie = await loginAs(app, '+989120000002');
    const before = await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } });
    expect(before.statusCode).toBe(402);

    await arm('manual', 'test');

    const after = await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } });
    expect(after.statusCode).toBe(200);
  });

  it('reports the effective tier and the real one separately on /me', async () => {
    const cookie = await loginAs(app, '+989120000003');
    await arm('manual', 'test');
    const me = (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.tier).toBe('premium');        // what they may do
    expect(me.base_tier).toBe('free');      // what the account really is
    expect(me.failsafe_premium).toBe(true); // why
  });

  it('leaves the stored tier column untouched', async () => {
    // The column is what the league prize and any future payment flow read; the
    // switch must not overwrite the site's record of who actually has premium.
    const cookie = await loginAs(app, '+989120000004');
    await arm('manual', 'test');
    await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    const rows = await pool.query<{ tier: string }>('select tier from profiles');
    expect(rows.rows.every((r) => r.tier === 'free')).toBe(true);
  });

  it('covers users who sign up AFTER it fired', async () => {
    // The reason it is a flag and not a bulk UPDATE: there is nobody left to run
    // the sweep again for tomorrow's readers.
    await arm('manual', 'test');
    const cookie = await loginAs(app, '+989120000005');
    const me = (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.tier).toBe('premium');
  });

  it('does not mark a real premium user as failsafe_premium', async () => {
    const cookie = await loginAs(app, '+989120000006');
    // By phone would need normalizePhone's output form; this is the only profile.
    await pool.query("update profiles set tier = 'premium'");
    await arm('manual', 'test');
    const me = (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.base_tier).toBe('premium');
    expect(me.failsafe_premium).toBe(false);
  });

  it('restores normal gating on disarm', async () => {
    const cookie = await loginAs(app, '+989120000007');
    await arm('manual', 'test');
    expect((await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } })).statusCode).toBe(200);

    expect(await disarm('test')).toBe(true);

    expect((await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } })).statusCode).toBe(402);
    // Disarming also restarts the clock, so the switch cannot immediately re-fire.
    const s = await getFailsafeStatus();
    expect(s.silent_days).toBe(0);
    expect(s.warned_at).toBeNull();
  });
});

describe('admin surface', () => {
  it('requires admin auth on every failsafe route', async () => {
    for (const [method, url] of [
      ['GET', '/admin/failsafe'],
      ['POST', '/admin/failsafe/heartbeat'],
      ['POST', '/admin/failsafe/run'],
      ['POST', '/admin/failsafe/disarm'],
    ] as const) {
      const res = await app.inject({ method, url, payload: {} });
      expect(res.statusCode, `${method} ${url}`).toBe(401);
    }
  });

  it('reports status and the countdown', async () => {
    await silentFor(10);
    const res = await app.inject({ method: 'GET', url: '/admin/failsafe', headers: { authorization: basic } });
    // Reaching the route is itself a heartbeat (requireAdmin), so by the time the
    // handler answers, the clock is back at zero — which is the intended
    // behaviour, not an artifact: a founder well enough to check is alive.
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.armed).toBe(false);
    expect(body.silent_days).toBe(0);
    expect(body.arm_days).toBe(config.failsafe.armDays);
    expect(Array.isArray(body.log)).toBe(true);
  });

  it('refuses a manual arm without the confirm token', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/failsafe/arm',
      headers: { authorization: basic }, payload: { confirm: 'yes' },
    });
    expect(res.statusCode).toBe(400);
    expect(await isArmed()).toBe(false);
  });

  it('arms and disarms with the confirm token, and logs both', async () => {
    const armed = await app.inject({
      method: 'POST', url: '/admin/failsafe/arm',
      headers: { authorization: basic }, payload: { confirm: 'ARM', note: 'drill' },
    });
    expect(armed.statusCode).toBe(200);
    expect(armed.json().armed).toBe(true);

    const off = await app.inject({
      method: 'POST', url: '/admin/failsafe/disarm', headers: { authorization: basic },
    });
    expect(off.json().armed).toBe(false);

    const log = await pool.query<{ event: string }>('select event from failsafe_log order by at');
    expect(log.rows.map((r) => r.event)).toEqual(['armed', 'disarmed']);
  });

  it('shows the armed state on the dashboard page', async () => {
    await arm('silence', 'test');
    const res = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
    expect(res.body).toContain('کلید ایمنی فعال شده است');
  });
});
