import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool, one } from '../src/db.js';
import { config } from '../src/config.js';
import { onArticlePublished, runFreeDigest, backfillExistingContent } from '../src/services/article-notify.js';
import { msUntilNextRun } from '../src/scheduler.js';
import { WebPushNotificationSender } from '../src/providers/notifications/webpush.js';
import { getIndex } from '../src/content-index.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

// --- fixtures ---------------------------------------------------------------
async function makeUser(
  phone: string,
  tier: 'free' | 'premium',
  opts: { newContent?: boolean } = {},
): Promise<string> {
  const settings = opts.newContent ? { reminders: { new_content: true } } : {};
  const row = await one<{ id: string }>(
    `insert into profiles (phone, display_name, tier, settings)
     values ($1, $2, $3, $4::jsonb) returning id`,
    [phone, 'u' + phone, tier, JSON.stringify(settings)],
  );
  return row!.id;
}
async function addSubscription(userId: string, endpoint: string): Promise<void> {
  await pool.query(
    `insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, 'p256', 'authsecret')`,
    [userId, endpoint],
  );
}
async function articleRow(contentId: string) {
  return one<{
    content_id: string; notify_free_after: Date; premium_notified_at: Date | null; free_notified_at: Date | null;
  }>('select content_id, notify_free_after, premium_notified_at, free_notified_at from articles where content_id = $1', [contentId]);
}
async function freeSentIds(): Promise<string[]> {
  const r = await pool.query<{ content_id: string }>(
    'select content_id from articles where free_notified_at is not null order by content_id',
  );
  return r.rows.map((x) => x.content_id);
}

// A fixed publish instant, expressed in UTC. Tehran is UTC+3:30 (no DST):
//   17:30Z == 21:00 Asia/Tehran, so the 21:00 cron on a given day is <day>T17:30:00Z.
const T = new Date('2026-03-10T12:00:00Z'); // 15:30 Tehran, mid-afternoon

describe('new-article notifications — Layer 1 (scheduling & selection)', () => {
  it('premium fires immediately on publish; free is only scheduled, not sent', async () => {
    await makeUser('09120000001', 'premium', { newContent: true });
    await makeUser('09120000002', 'free', { newContent: true });

    const res = await onArticlePublished({
      contentId: 'insight/insight-1', title: 'مطلب تستی', url: '/insight/insight-1.html', publishedAt: T,
    });
    expect(res.recorded).toBe(true);
    expect(res.premiumRecipients).toBe(1); // the one premium opt-in

    const a = await articleRow('insight/insight-1');
    expect(a!.premium_notified_at).not.toBeNull();     // premium: sent now
    expect(a!.free_notified_at).toBeNull();            // free: not yet
    // notify_free_after = published_at + 24h
    expect(a!.notify_free_after.getTime()).toBe(T.getTime() + 24 * 3_600_000);

    // A digest run at publish time finds nothing due (24h not elapsed).
    const digest = await runFreeDigest(T);
    expect(digest.articles).toBe(0);
    expect(await freeSentIds()).toEqual([]);
  });

  it('re-publishing the same content_id does not re-notify premium (idempotent)', async () => {
    await makeUser('09120000001', 'premium', { newContent: true });
    const first = await onArticlePublished({ contentId: 'insight/x', title: 'ا', url: '/insight/x.html', publishedAt: T });
    expect(first.recorded).toBe(true);
    const again = await onArticlePublished({ contentId: 'insight/x', title: 'ا (دوباره)', url: '/insight/x.html', publishedAt: T });
    expect(again.recorded).toBe(false);
    expect(again.premiumRecipients).toBe(0);
  });

  it('the 24h boundary gates the free digest', async () => {
    await makeUser('09120000002', 'free', { newContent: true });
    await onArticlePublished({ contentId: 'insight/b', title: 'ب', url: '/insight/b.html', publishedAt: T });

    const notYet = await runFreeDigest(new Date(T.getTime() + 23 * 3_600_000));
    expect(notYet.articles).toBe(0);

    const due = await runFreeDigest(new Date(T.getTime() + 24 * 3_600_000));
    expect(due.articles).toBe(1);
    expect(await freeSentIds()).toEqual(['insight/b']);
  });

  it('effective free delay is 24–48h across the 21:00 window (just-before vs just-after)', async () => {
    await makeUser('09120000002', 'free', { newContent: true });
    // A: published 20:30 Tehran (17:00Z) -> due at the NEXT 21:00 cron (~24.5h).
    await onArticlePublished({ contentId: 'insight/a', title: 'A', url: '/insight/a.html', publishedAt: new Date('2026-03-10T17:00:00Z') });
    // B: published 21:30 Tehran (18:00Z), just AFTER the window -> waits a full extra
    //    day, due only at the 21:00 cron TWO days later (~47.5h).
    await onArticlePublished({ contentId: 'insight/b', title: 'B', url: '/insight/b.html', publishedAt: new Date('2026-03-10T18:00:00Z') });

    // Cron at 21:00 Tehran on D+1 (2026-03-11T17:30:00Z): only A is due.
    const run1 = await runFreeDigest(new Date('2026-03-11T17:30:00Z'));
    expect(run1.articles).toBe(1);
    expect(await freeSentIds()).toEqual(['insight/a']);

    // Cron at 21:00 Tehran on D+2 (2026-03-12T17:30:00Z): B is now due.
    const run2 = await runFreeDigest(new Date('2026-03-12T17:30:00Z'));
    expect(run2.articles).toBe(1);
    expect(await freeSentIds()).toEqual(['insight/a', 'insight/b']);
  });

  it('batches multiple due articles into one digest and never re-sends them', async () => {
    await makeUser('09120000002', 'free', { newContent: true });
    for (const c of ['insight/1', 'insight/2', 'insight/3']) {
      await onArticlePublished({ contentId: c, title: c, url: `/${c}.html`, publishedAt: T });
    }
    const now = new Date(T.getTime() + 25 * 3_600_000);
    const first = await runFreeDigest(now);
    expect(first.articles).toBe(3);   // one digest covering all three
    expect(first.recipients).toBe(1);
    expect(first.sent).toBe(true);
    expect(await freeSentIds()).toEqual(['insight/1', 'insight/2', 'insight/3']);

    // A second run does not re-send anything.
    const second = await runFreeDigest(now);
    expect(second.articles).toBe(0);
    expect(second.sent).toBe(false);
  });

  it('marks a due batch sent even with zero free opt-ins, so it is never re-scanned', async () => {
    // nobody opted in
    await onArticlePublished({ contentId: 'insight/lonely', title: 'ل', url: '/insight/lonely.html', publishedAt: T });
    const run = await runFreeDigest(new Date(T.getTime() + 25 * 3_600_000));
    expect(run.articles).toBe(1);
    expect(run.recipients).toBe(0);
    expect(run.sent).toBe(false);
    // still marked, so it drops out of future scans
    expect((await articleRow('insight/lonely'))!.free_notified_at).not.toBeNull();
    expect((await runFreeDigest(new Date(T.getTime() + 26 * 3_600_000))).articles).toBe(0);
  });
});

describe('go-live backfill (existing content never fires as new)', () => {
  it('records all current content as already-notified; existing ids then dedup, new ones still fire', async () => {
    const contentIds = Object.keys(getIndex().byContent || {});
    expect(contentIds.length).toBeGreaterThan(0);

    const first = await backfillExistingContent(T);
    expect(first.total).toBe(contentIds.length);
    expect(first.inserted).toBe(contentIds.length); // DB was empty -> all inserted

    // Re-running is idempotent (nothing new inserted).
    const again = await backfillExistingContent(T);
    expect(again.inserted).toBe(0);

    // Editing an EXISTING published page later must NOT re-notify premium.
    await makeUser('09120000001', 'premium', { newContent: true });
    const existing = contentIds[0];
    const editExisting = await onArticlePublished({ contentId: existing, title: 'ویرایش قدیمی', url: `/${existing}.html` });
    expect(editExisting.recorded).toBe(false);
    expect(editExisting.premiumRecipients).toBe(0);

    // A genuinely new content_id still fires (published at T so it is digest-due below).
    const fresh = await onArticlePublished({ contentId: 'insight/brand-new-xyz', title: 'تازه', url: '/insight/brand-new-xyz.html', publishedAt: T });
    expect(fresh.recorded).toBe(true);
    expect(fresh.premiumRecipients).toBe(1);

    // Backfilled (already-sent) content is never selected by the free digest;
    // only the genuinely new article is, once its 24h has passed.
    const digest = await runFreeDigest(new Date(T.getTime() + 100 * 3_600_000));
    expect(digest.articles).toBe(1);
  });
});

describe('new-article notifications — Layer 2 (delivery: web push)', () => {
  it('silently skips a user with no push subscription (no throw, no error)', async () => {
    const userId = await makeUser('09120000009', 'premium', { newContent: true });
    const sender = new WebPushNotificationSender();
    // Must resolve, not reject: a missing subscription is expected, not a bug.
    await expect(
      sender.send(userId, { title: 't', body: 'b', url: '/x' }, 'article_premium'),
    ).resolves.toBeUndefined();
  });

  it('does not throw when a subscription exists but VAPID keys are absent (dev)', async () => {
    const userId = await makeUser('09120000010', 'premium', { newContent: true });
    await addSubscription(userId, 'https://example.com/ep-1');
    const sender = new WebPushNotificationSender();
    await expect(
      sender.send(userId, { title: 't', body: 'b' }, 'article_free_digest'),
    ).resolves.toBeUndefined();
    // no keys -> logged, subscription left intact
    const r = await pool.query('select 1 from push_subscriptions where user_id = $1', [userId]);
    expect(r.rowCount).toBe(1);
  });
});

describe('free-digest scheduler math is Asia/Tehran', () => {
  it('computes ms until the next 21:00 Tehran', () => {
    // 20:00 Tehran (16:30Z) -> 1h to 21:00
    const oneHour = msUntilNextRun(new Date('2026-03-10T16:30:00.000Z'), 21, 'Asia/Tehran');
    expect(Math.round(oneHour / 60000)).toBe(60);
    // 22:00 Tehran (18:30Z) -> already past 21:00 -> 23h to tomorrow's 21:00
    const nextDay = msUntilNextRun(new Date('2026-03-10T18:30:00.000Z'), 21, 'Asia/Tehran');
    expect(Math.round(nextDay / 60000)).toBe(23 * 60);
  });
});

describe('push subscription routes + article_published endpoint', () => {
  const adminHeader =
    'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

  it('stores and removes a push subscription for the logged-in user', async () => {
    const cookie = await loginAs(app, '09121111111');
    const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: 'k1', auth: 'k2' } };

    const add = await app.inject({ method: 'POST', url: '/push/subscribe', headers: { cookie }, payload: { subscription: sub } });
    expect(add.statusCode).toBe(200);
    let rows = await pool.query('select endpoint from push_subscriptions where endpoint = $1', [sub.endpoint]);
    expect(rows.rowCount).toBe(1);

    const del = await app.inject({ method: 'POST', url: '/push/unsubscribe', headers: { cookie }, payload: { endpoint: sub.endpoint } });
    expect(del.statusCode).toBe(200);
    rows = await pool.query('select endpoint from push_subscriptions where endpoint = $1', [sub.endpoint]);
    expect(rows.rowCount).toBe(0);
  });

  it('requires auth to subscribe', async () => {
    const res = await app.inject({ method: 'POST', url: '/push/subscribe', payload: { subscription: { endpoint: 'x', keys: { p256dh: 'a', auth: 'b' } } } });
    expect(res.statusCode).toBe(401);
  });

  it('exposes the (public) VAPID key without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/push/public-key' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('key');
  });

  it('POST /admin/articles/published records and reports premium recipients', async () => {
    await makeUser('09120000001', 'premium', { newContent: true });
    const res = await app.inject({
      method: 'POST', url: '/admin/articles/published',
      headers: { authorization: adminHeader },
      payload: { content_id: 'notecast/n-1', title: 'نوت تازه', url: '/notecast/n-1.html' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.recorded).toBe(true);
    expect(body.premiumRecipients).toBe(1);
    expect((await articleRow('notecast/n-1'))!.premium_notified_at).not.toBeNull();
  });

  it('rejects the publish endpoint without admin credentials', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/articles/published',
      payload: { content_id: 'x/y', title: 't', url: '/x/y.html' },
    });
    expect(res.statusCode).toBe(401);
  });
});
