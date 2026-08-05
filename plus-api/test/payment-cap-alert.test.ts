import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { resetDb } from './helpers.js';
import { pool, closePool } from '../src/db.js';
import { config } from '../src/config.js';
import { checkCapacityAlert } from '../src/services/payment-cap-alert.js';
import { periodStamps, planAmountRial } from '../src/services/payment-capacity.js';
import { notifications } from '../src/providers/registry.js';

/**
 * The founder's warning that the month's gateway ceiling is running out (level
 * 2.6). Two alerts, each fired once per month: a warning while something can
 * still be done about it, and a "sales have stopped" when it is too late.
 *
 * The repeat-suppression is the whole point. A ceiling that sits at 90% for
 * three weeks is one fact, and a nightly re-announcement of it is how a founder
 * learns to ignore the alert that matters.
 */

const PHONE = '09121500001';
let seq = 0;

async function founder(): Promise<string> {
  const r = await pool.query<{ id: string }>(
    'insert into profiles (phone, display_name) values ($1, $2) returning id',
    [PHONE, 'بنیان‌گذار'],
  );
  return r.rows[0].id;
}

async function sell(months: number, count = 1): Promise<void> {
  const s = periodStamps();
  for (let i = 0; i < count; i += 1) {
    seq += 1;
    const buyer = await pool.query<{ id: string }>(
      'insert into profiles (phone, display_name) values ($1, $2) returning id',
      [`0912550${String(seq).padStart(4, '0')}`, `خریدار ${seq}`],
    );
    await pool.query(
      `insert into payments (user_id, amount_rial, months, gateway, order_id, status,
                             period_jalali, period_gregorian)
       values ($1, $2, $3, 'zibal', $4, 'paid', $5, $6)`,
      [buyer.rows[0].id, planAmountRial(months), months, `cap_${seq}`,
        s.period_jalali, s.period_gregorian],
    );
  }
}

async function alertRows(): Promise<Array<{ level: string; period: string }>> {
  const r = await pool.query<{ meta: { level: string; period: string } }>(
    "select meta from user_activity where action = 'payment_cap_alert' order by id",
  );
  return r.rows.map((x) => ({ level: x.meta.level, period: x.meta.period }));
}

let sent: Array<{ kind: string }> = [];

beforeEach(async () => {
  await resetDb();
  seq = 0;
  sent = [];
  config.payments.capAlertPhone = PHONE;
  vi.spyOn(notifications, 'send').mockImplementation(async (_u, _m, kind) => {
    sent.push({ kind });
  });
});
afterAll(closePool);

describe('checkCapacityAlert', () => {
  it('stays quiet while there is room', async () => {
    await founder();
    await sell(6, 5); // 30 of 100 million toman

    const r = await checkCapacityAlert();
    expect(r.sent).toBeNull();
    expect(await alertRows()).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it('warns once the ceiling crosses the threshold', async () => {
    await founder();
    await sell(6, 14); // 84%

    const r = await checkCapacityAlert();
    expect(r.sent).toBe('warn');
    expect(sent).toHaveLength(1);
    // 'system' is exempt from the per-user daily cap — right for a message that
    // means "the shop is about to close".
    expect(sent[0].kind).toBe('system');
  });

  it('says it once, not every night', async () => {
    await founder();
    await sell(6, 14);

    await checkCapacityAlert();
    await checkCapacityAlert();
    await checkCapacityAlert();

    expect(await alertRows()).toHaveLength(1);
    expect(sent).toHaveLength(1);
  });

  it('escalates to "sold out" as its own, separate alert', async () => {
    await founder();
    await sell(6, 14);
    await checkCapacityAlert();          // warn

    await sell(6, 3);                    // 102% — nothing is buyable
    const r = await checkCapacityAlert();

    expect(r.sent).toBe('full');
    expect((await alertRows()).map((a) => a.level)).toEqual(['warn', 'full']);
    expect(sent).toHaveLength(2);
  });

  it('does not warn after the sold-out alert — that news is stale', async () => {
    await founder();
    await sell(6, 17); // straight past the ceiling, no warn stage

    expect((await checkCapacityAlert()).sent).toBe('full');
    // 'full' supersedes 'warn': the warning that sales are ABOUT to stop is not
    // the news once they have.
    expect((await alertRows()).map((a) => a.level)).toEqual(['full']);
  });

  it('speaks again in a new month', async () => {
    await founder();
    await sell(6, 14);
    await checkCapacityAlert();

    // Age everything out of the current period; the next month starts empty and
    // its own crossing is genuinely new news.
    await pool.query("update payments set period_jalali = '1404-01', period_gregorian = '2025-04'");
    await pool.query("update user_activity set meta = jsonb_set(meta, '{period}', '\"1404-01\"') where action = 'payment_cap_alert'");
    await sell(6, 14);

    expect((await checkCapacityAlert()).sent).toBe('warn');
    expect(await alertRows()).toHaveLength(2);
  });

  it('still logs when nobody is configured to be told', async () => {
    config.payments.capAlertPhone = '';
    await sell(6, 17);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await checkCapacityAlert();

    // No recipient, so nothing is sent and nothing is claimed — but a full
    // ceiling must never be silent, and the console line always exists.
    expect(r.sent).toBeNull();
    expect(sent).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain('FULL');
    warn.mockRestore();
  });

  it('does not fall over when the alert phone belongs to nobody', async () => {
    config.payments.capAlertPhone = '09129999999';
    await sell(6, 17);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(checkCapacityAlert()).resolves.toMatchObject({ sent: null });
    warn.mockRestore();
  });

  it('reports the numbers a decision actually needs', async () => {
    const id = await founder();
    await sell(6, 14);
    await checkCapacityAlert();

    const row = await pool.query<{ meta: Record<string, unknown> }>(
      "select meta from user_activity where user_id = $1 and action = 'payment_cap_alert'",
      [id],
    );
    // What was used and how full — so the log itself answers "when did each
    // month fill up", which is the number that decides whether to raise the cap.
    expect(row.rows[0].meta.used_count).toBe(14);
    expect(row.rows[0].meta.used_rial).toBe(14 * 6 * 10_000_000);
    expect(row.rows[0].meta.used_fraction).toBeGreaterThan(0.8);
  });
});
