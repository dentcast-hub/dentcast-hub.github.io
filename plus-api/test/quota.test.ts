import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { quotaState, resetInFlightRuns, withUserLock } from '../src/services/quota.js';
import { applyRemoteQuota, getQuotaConfig, resetRemoteQuota } from '../src/quota.js';
import { jalaliMonthRange, dayInTz, jalaliMonth } from '../src/services/time.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

beforeEach(async () => {
  await resetDb();
  resetRemoteQuota();
  resetInFlightRuns();
  if (!app) app = await makeApp();
  phone = '09121200077';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function userId(): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return r.rows[0].id;
}

describe('quota.json', () => {
  it('the shipped file passes the same shape check a published copy must', () => {
    // getQuotaConfig() throws its parse through isValidQuota, so a version
    // that got here at all is already valid; assert the numbers exist so a
    // typo'd key cannot silently fall back to the built-in floor.
    const c = getQuotaConfig();
    expect(c.version).toBeGreaterThan(0);
    expect(c.quotas.review_cards.limit).toBeGreaterThanOrEqual(0);
    expect(c.quotas.assistant_runs.period).toBe('month');
    expect(c.quotas.collections.period).toBe('total');
    expect(c.previews.library_searches_per_day).toBeGreaterThanOrEqual(0);
  });

  it('refuses a payload that would break the free tier', () => {
    expect(applyRemoteQuota(null)).toBe(false);
    expect(applyRemoteQuota({})).toBe(false);
    // A missing rule: the whole point of the check.
    expect(applyRemoteQuota({ quotas: { review_cards: { limit: 3, period: 'day', label_fa: 'x', exhausted_fa: 'y' } }, previews: {} })).toBe(false);
    // A negative limit is nonsense; a limit of 0 is a legitimate decision.
    const base = getQuotaConfig();
    expect(applyRemoteQuota({ ...base, quotas: { ...base.quotas, review_cards: { ...base.quotas.review_cards, limit: -1 } } })).toBe(false);
    expect(applyRemoteQuota({ ...base, quotas: { ...base.quotas, review_cards: { ...base.quotas.review_cards, limit: 0 } } })).toBe(true);
  });

  it('a rejected payload leaves the previous limits standing', () => {
    const before = getQuotaConfig().quotas.review_cards.limit;
    expect(applyRemoteQuota({ garbage: true })).toBe(false);
    expect(getQuotaConfig().quotas.review_cards.limit).toBe(before);
  });
});

describe('jalaliMonthRange', () => {
  it('brackets today inside a real Persian month', () => {
    const now = new Date();
    const { start, nextStart } = jalaliMonthRange(now);
    const today = dayInTz(now);
    expect(start <= today).toBe(true);
    expect(today < nextStart).toBe(true);

    const span = (Date.parse(nextStart + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 86_400_000;
    expect(span).toBeGreaterThanOrEqual(29); // Esfand in a common year
    expect(span).toBeLessThanOrEqual(31);    // the first six months
  });

  it('agrees with jalaliMonth on both edges — the boundary is ICU’s, not ours', () => {
    const now = new Date();
    const target = jalaliMonth(now);
    const { start, nextStart } = jalaliMonthRange(now);
    // The first day is in the month; the day before it is not.
    expect(jalaliMonth(new Date(Date.parse(start + 'T12:00:00Z')))).toBe(target);
    expect(jalaliMonth(new Date(Date.parse(nextStart + 'T12:00:00Z')))).not.toBe(target);
  });

  it('holds across a whole year of sample days', () => {
    // Twelve probes, one a month: a rule reimplemented instead of asked would
    // drift on the 31/30/29-day changeover, and this is where it would show.
    for (let i = 0; i < 12; i += 1) {
      const probe = new Date(Date.now() + i * 30 * 86_400_000);
      const { start, nextStart } = jalaliMonthRange(probe);
      const day = dayInTz(probe);
      expect(start <= day && day < nextStart).toBe(true);
    }
  });
});

describe('derived counters', () => {
  it('a fresh free account has its whole allowance', async () => {
    const id = await userId();
    const s = await quotaState(id, 'review_cards', false);
    expect(s.limit).toBe(getQuotaConfig().quotas.review_cards.limit);
    expect(s.used).toBe(0);
    expect(s.remaining).toBe(s.limit);
    expect(s.allowed).toBe(true);
    expect(s.resets_at).toBeTruthy();
  });

  it('premium is unlimited and carries no counter', async () => {
    const id = await userId();
    const s = await quotaState(id, 'review_cards', true);
    expect(s.limit).toBeNull();
    expect(s.remaining).toBeNull();
    expect(s.allowed).toBe(true);
    // A subscriber must never be shown a countdown.
    expect(s.remaining_fa).toBe('');
  });

  it('does NOT count cards answered while the account was premium', async () => {
    // The `premium` stamp records what the account was at insert time. A reader
    // whose subscription lapsed at noon must not meet a wall on their first
    // free afternoon because of the morning they paid for.
    const id = await userId();
    await pool.query(
      `insert into user_activity (user_id, action, premium) values ($1, 'review_finished', true), ($1, 'review_finished', true)`,
      [id],
    );
    expect((await quotaState(id, 'review_cards', false)).used).toBe(0);

    await pool.query(
      `insert into user_activity (user_id, action, premium) values ($1, 'review_finished', false)`,
      [id],
    );
    expect((await quotaState(id, 'review_cards', false)).used).toBe(1);
  });

  it('counts yesterday’s cards against yesterday, not today', async () => {
    const id = await userId();
    await pool.query(
      `insert into user_activity (user_id, action, premium, created_at)
       values ($1, 'review_finished', false, now() - interval '2 days')`,
      [id],
    );
    expect((await quotaState(id, 'review_cards', false)).used).toBe(0);
  });

  it('counts assistant runs by DISTINCT case, not by round', async () => {
    const id = await userId();
    // Three rounds of one case is one run; a second hash is a second run.
    await pool.query(
      `insert into assistant_rounds (user_id, desc_hash, words, round_no, offered)
       values ($1,'hash-a','{}',0,'[]'::jsonb), ($1,'hash-a','{}',1,'[]'::jsonb),
              ($1,'hash-a','{}',2,'[]'::jsonb), ($1,'hash-b','{}',0,'[]'::jsonb)`,
      [id],
    );
    const s = await quotaState(id, 'assistant_runs', false);
    expect(s.used).toBe(2);
  });

  it('ignores a case from before this Persian month', async () => {
    const id = await userId();
    const { start } = jalaliMonthRange(new Date());
    await pool.query(
      `insert into assistant_rounds (user_id, desc_hash, words, round_no, offered, created_at)
       values ($1,'old','{}',0,'[]'::jsonb, $2::date - 1)`,
      [id, start],
    );
    expect((await quotaState(id, 'assistant_runs', false)).used).toBe(0);
  });

  it('counts collections as a lifetime total that never refills', async () => {
    const id = await userId();
    await pool.query("insert into collections (user_id, title) values ($1, 'یکی')", [id]);
    const s = await quotaState(id, 'collections', false);
    expect(s.used).toBe(1);
    expect(s.period).toBe('total');
    // Nothing to come back for tomorrow, and the copy must not promise one.
    expect(s.resets_at).toBeNull();
  });

  it('never reports a negative remaining, even past the limit', async () => {
    const id = await userId();
    const limit = getQuotaConfig().quotas.review_cards.limit;
    for (let i = 0; i < limit + 4; i += 1) {
      await pool.query(
        `insert into user_activity (user_id, action, premium) values ($1, 'review_finished', false)`,
        [id],
      );
    }
    const s = await quotaState(id, 'review_cards', false);
    expect(s.remaining).toBe(0);
    expect(s.allowed).toBe(false);
  });
});

describe('withUserLock', () => {
  it('serialises callers on the same key', async () => {
    const order: string[] = [];
    const slow = async (tag: string, ms: number) => withUserLock('k', async () => {
      order.push(tag + ':in');
      await new Promise((r) => { setTimeout(r, ms); });
      order.push(tag + ':out');
    });
    await Promise.all([slow('a', 30), slow('b', 1)]);
    // b must not start before a has finished.
    expect(order).toEqual(['a:in', 'a:out', 'b:in', 'b:out']);
  });

  it('a rejected holder never wedges the queue', async () => {
    // A broken chain would block every later request for that user until the
    // process restarts, which is a far worse failure than the original error.
    await expect(withUserLock('k2', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    await expect(withUserLock('k2', async () => 'fine')).resolves.toBe('fine');
  });

  it('does not serialise different keys', async () => {
    const started: string[] = [];
    const hold = (k: string) => withUserLock(k, async () => {
      started.push(k);
      await new Promise((r) => { setTimeout(r, 20); });
    });
    await Promise.all([hold('x'), hold('y')]);
    expect(started).toHaveLength(2);
  });
});

describe('library papers — the resource, not the search', () => {
  async function open(id: string) {
    return app.inject({ method: 'GET', url: `/library/paper/${id}`, headers: { cookie } });
  }

  it('needs a signed-in reader; a guest gets 401, never a link', async () => {
    const res = await app.inject({ method: 'GET', url: '/library/paper/P0003' });
    expect(res.statusCode).toBe(401);
    expect(res.body).not.toContain('drive.google.com');
  });

  it('hands a free reader a real link and counts it', async () => {
    const res = await open('P0003');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.view).toContain('drive.google.com');
    expect(body.quota.used).toBe(1);
  });

  it('re-opening the same paper is free', async () => {
    await open('P0003');
    await open('P0003');
    const again = await open('P0003');
    expect(again.statusCode).toBe(200);
    expect(again.json().quota.used).toBe(1); // one paper, however many opens
  });

  it('refuses the paper past the monthly allowance', async () => {
    const limit = getQuotaConfig().quotas.library_papers.limit;
    // Distinct papers up to the limit, all admitted; the next one is refused.
    const catalogue = ['P0003', 'P0004', 'P0005', 'P0006', 'P0007', 'P0008', 'P0009'];
    let opened = 0;
    for (const id of catalogue) {
      const res = await open(id);
      if (res.statusCode === 200) opened += 1;
      else {
        expect(res.statusCode).toBe(402);
        expect(res.json().error).toBe('quota_exhausted');
        break;
      }
    }
    expect(opened).toBe(limit);
  });

  it('does not cap a premium reader', async () => {
    await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
    for (const id of ['P0003', 'P0004', 'P0005', 'P0006', 'P0007', 'P0008', 'P0009']) {
      const res = await open(id);
      if (res.statusCode === 404) continue; // not every id exists in the catalogue
      expect(res.statusCode).toBe(200);
      expect(res.json().quota.limit).toBeNull();
    }
  });

  it('answers an unknown id the same way as one with no file — no enumeration', async () => {
    const res = await open('P999999');
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('unknown_paper');
  });

  it('rejects a malformed id before it reaches the map', async () => {
    const res = await app.inject({ method: 'GET', url: '/library/paper/..%2F..%2Fetc', headers: { cookie } });
    expect([400, 404]).toContain(res.statusCode);
  });
});

describe('the published index leaks no link', () => {
  it('plus/library-index.json carries no Drive URL', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const here = dirname(fileURLToPath(import.meta.url));
    const text = readFileSync(resolve(here, '..', '..', 'plus', 'library-index.json'), 'utf8');
    // The whole point of the split: this file is public, so a single Drive
    // handle in it would undo the gate for all 2200 papers at once.
    expect(text).not.toContain('drive.google.com');
    expect(text).not.toContain('drive_id');
    expect(text).not.toContain('local_path');
    expect(JSON.parse(text).papers.length).toBeGreaterThan(2000);
  });
});
