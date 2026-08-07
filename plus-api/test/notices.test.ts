// اطلاعیه — the in-app inbox — and the achievement announcement ledger.
//
// The property this file exists to pin is the GO-LIVE GUARD, because it is the
// one that cannot be fixed after the fact: a badge wall that derives everything
// means a two-year-old account opens it with fifteen badges already lit, and the
// first sync would otherwise read every one of them as brand new. Fifteen
// notifications for last spring is not a launch, it is an incident. Three
// separate mechanisms stop it and all three are tested here.
//
// The second property is the daily cap's independence: notification_log now
// holds messages that were never sent, and if those counted as sent the cap
// would feed itself and silently starve a user's push budget.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { syncAchievements } from '../src/services/achievement-sync.js';
import { listNotices, unreadNoticeCount, noticeCounters, recordBroadcast } from '../src/services/notices.js';
import { onArticlePublished, runFreeDigest } from '../src/services/article-notify.js';
import { sendCapped } from '../src/services/notify-policy.js';

let app: FastifyInstance;
let cookie: string;
const PHONE = '09121200099';

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, PHONE);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function userId(): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [PHONE]);
  return r.rows[0].id;
}

/** Give the account a longest_streak, which is «شعله»'s metric (bronze at 7). */
async function setStreak(days: number): Promise<void> {
  await pool.query('update profiles set longest_streak = $2 where id = $1', [await userId(), days]);
}

/** Put the account back in the pre-launch state migration 0025 leaves behind. */
async function asPreLaunchAccount(): Promise<void> {
  await pool.query(
    `update profiles
        set achievements_seeded = false, achievements_synced_at = null, notices_seen_at = now()
      where id = $1`,
    [await userId()],
  );
}

/**
 * One forced sync, returning how many announcements it wrote.
 *
 * Note that ANY test account earns «پیشگام» the moment it is created — its
 * metric is signup order and every test profile is inside the first 500 seats —
 * so tests that are about a specific badge take a baseline sync first and then
 * measure the delta, rather than asserting on absolute totals that would move
 * the day a founder-seat rule changes.
 */
async function sync(): Promise<number> {
  return (await syncAchievements(await userId(), { force: true })).announced;
}

/** The inbox rows whose title names a given badge. */
async function noticesNaming(fragment: string): Promise<number> {
  const rows = await listNotices(await userId());
  return rows.filter((r) => r.title.includes(fragment)).length;
}

async function ledger(): Promise<{ badge_key: string; level: number; seen_at: string | null }[]> {
  const r = await pool.query(
    'select badge_key, level, seen_at from achievement_announcements where user_id = $1 order by badge_key',
    [await userId()],
  );
  return r.rows as never;
}

// ---------------------------------------------------------------- go-live ---

describe('the launch is silent for accounts that already existed', () => {
  it('files an old account\'s whole history without announcing any of it', async () => {
    await setStreak(120); // gold «شعله», plus whatever else that implies
    await asPreLaunchAccount();

    const first = await syncAchievements(await userId(), { force: true });
    expect(first.seeded).toBe(true);
    expect(first.announced).toBe(0);

    const rows = await ledger();
    expect(rows.length).toBeGreaterThan(0);           // history WAS filed…
    expect(rows.every((r) => r.seen_at !== null)).toBe(true); // …and pre-acknowledged
    expect(await unreadNoticeCount(await userId())).toBe(0);
    expect((await noticeCounters(await userId())).pending_achievements).toBe(0);
  });

  it('announces normally once the catch-up has happened', async () => {
    await asPreLaunchAccount();
    await syncAchievements(await userId(), { force: true }); // the silent seed

    await setStreak(7);
    const res = await syncAchievements(await userId(), { force: true });
    expect(res.seeded).toBe(false);
    expect(res.announced).toBe(1);

    const notices = await listNotices(await userId());
    expect(notices.length).toBe(1);
    expect(notices[0].kind).toBe('achievement');
    expect(notices[0].title).toContain('شعله');
    // The reason line is the catalog's own words for the level reached, not a
    // sentence assembled in the announcer.
    expect(notices[0].body).toContain('هفت روزِ پشتِ هم');
  });

  // The default on profiles.achievements_seeded is TRUE, so an account created
  // after the migration starts with an empty ledger and gets told about its very
  // first badge — the one that actually matters.
  it('announces the first badge of a brand-new account', async () => {
    const me = await userId();
    const flags = await pool.query<{ achievements_seeded: boolean }>(
      'select achievements_seeded from profiles where id = $1', [me],
    );
    expect(flags.rows[0].achievements_seeded).toBe(true);

    // «پیشگام» is earned by signup order, so it is already true on the first
    // sync of a fresh account — and it is announced, not swallowed.
    expect(await sync()).toBe(1);
    expect(await noticesNaming('پیشگام')).toBe(1);
  });
});

// ------------------------------------------------------------- high water ---

describe('an announcement happens exactly once', () => {
  it('does not repeat itself on the next sync', async () => {
    await sync();                     // baseline: «پیشگام»
    await setStreak(7);
    expect(await sync()).toBe(1);
    expect(await sync()).toBe(0);
    expect(await noticesNaming('شعله')).toBe(1);
  });

  it('announces a level-up, and only the level-up', async () => {
    await sync();                     // baseline
    await setStreak(7);
    await sync();                     // bronze
    await setStreak(30);
    expect(await sync()).toBe(1);     // silver, and nothing else
    const rows = await ledger();
    expect(rows.find((r) => r.badge_key === 'flame')!.level).toBe(1);
    const notices = await listNotices(await userId());
    expect(notices[0].body).toContain('یک ماهِ کامل'); // newest first
    expect(await noticesNaming('شعله')).toBe(2);
  });

  // A badge can go dark again — «فاتح» un-earns itself the moment a publish
  // drops a folder below complete. The stored level only ever rises, so
  // re-earning is silent; otherwise one publish would re-announce to everyone.
  it('stays quiet when a badge is re-earned', async () => {
    await sync();                     // baseline
    await setStreak(7);
    await sync();
    await setStreak(0);
    await sync();
    await setStreak(7);
    expect(await sync()).toBe(0);
    expect(await noticesNaming('شعله')).toBe(1);
  });

  it('debounces a burst of activity into one derivation', async () => {
    const me = await userId();
    await setStreak(7);
    await syncAchievements(me);                       // stamps achievements_synced_at
    await setStreak(30);
    const second = await syncAchievements(me);        // inside the window
    expect(second.skipped).toBe(true);
    expect(second.announced).toBe(0);
  });
});

// ------------------------------------------------------------------ inbox ---

describe('GET /notices', () => {
  it('never shows a row written before the inbox existed', async () => {
    const me = await userId();
    // Exactly what the pre-launch table looks like: kind and day, no message.
    await pool.query(
      "insert into notification_log (user_id, kind, day) values ($1, 'streak', current_date)",
      [me],
    );
    const res = await app.inject({ method: 'GET', url: '/notices', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().notices).toEqual([]);
    expect(res.json().unread).toBe(0);
  });

  it('marks everything read from one watermark write', async () => {
    await setStreak(7);
    await sync();
    const before = (await app.inject({ method: 'GET', url: '/notices', headers: { cookie } })).json();
    expect(before.unread).toBe(before.notices.length);
    expect(before.unread).toBeGreaterThan(1);   // one write, several rows

    const seen = await app.inject({ method: 'POST', url: '/notices/seen', headers: { cookie } });
    expect(seen.statusCode).toBe(200);

    const after = (await app.inject({ method: 'GET', url: '/notices', headers: { cookie } })).json();
    expect(after.unread).toBe(0);
    expect(after.notices.length).toBe(before.notices.length); // read, not deleted
  });

  it('requires a session', async () => {
    expect((await app.inject({ method: 'GET', url: '/notices' })).statusCode).toBe(401);
  });
});

// ---------------------------------------------------------- celebration -----

describe('the celebration is acknowledged separately from the inbox', () => {
  it('survives the inbox being read', async () => {
    const me = await userId();
    await sync();                     // baseline
    await app.inject({ method: 'POST', url: '/achievements/seen', headers: { cookie } });
    await setStreak(7);
    await sync();

    // Reading the inbox must not silently spend a celebration the reader has
    // not been shown — they are two different acknowledgements on purpose.
    await app.inject({ method: 'POST', url: '/notices/seen', headers: { cookie } });
    const pending = await app.inject({
      method: 'GET', url: '/achievements/pending', headers: { cookie },
    });
    expect(pending.json().items.length).toBe(1);
    expect(pending.json().items[0].key).toBe('flame');
    expect(pending.json().items[0].metal).toBe('bronze'); // a ring colour, not a word
    expect((await noticeCounters(me)).pending_achievements).toBe(1);

    await app.inject({ method: 'POST', url: '/achievements/seen', headers: { cookie } });
    expect((await noticeCounters(me)).pending_achievements).toBe(0);
    expect((await app.inject({
      method: 'GET', url: '/achievements/pending', headers: { cookie },
    })).json().items).toEqual([]);
  });

  it('is carried on /me for the header dot', async () => {
    await setStreak(7);
    const n = await sync();
    const body = (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(body.unread_notices).toBe(n);
    expect(body.pending_achievements).toBe(n);
  });
});

// -------------------------------------------------------------- broadcasts ---

/** Instants inside the awake window (09:00-22:00 Tehran) and safely outside it. */
const AWAKE = new Date('2026-02-10T11:00:00+03:30');
const ASLEEP = new Date('2026-02-10T02:00:00+03:30');

describe('the inbox has no schedule', () => {
  // The awake window and the daily cap protect a PHONE and a bot token. Neither
  // is involved in writing a row, so a publish at 02:00 is in اطلاعیه at 02:00 —
  // for a free reader as much as a premium one, with no 24-hour digest delay and
  // no opt-in toggle in the way.
  it('puts a 02:00 publish in the inbox at 02:00, for a free reader', async () => {
    const res = await onArticlePublished({
      contentId: 'notecast/note-99', title: 'پوسیدگی پنهان', url: '/notecast/note-99.html',
      pulse: 'یک جملهٔ بلندِ پالس که قرار نیست داخل اطلاعیه بیاید.', publishedAt: ASLEEP,
    });
    expect(res.deferred).toBe(true);       // the PUSH waited for morning…
    expect(res.premiumRecipients).toBe(0);

    const rows = await listNotices(await userId());   // …the notice did not
    expect(rows.length).toBe(1);
    expect(rows[0].kind).toBe('article');
    expect(rows[0].unread).toBe(true);
  });

  it('says where the article is, not what it argues', async () => {
    await onArticlePublished({
      contentId: 'notecast/note-98', title: 'پوسیدگی پنهان', url: '/notecast/note-98.html',
      pulse: 'یک پاراگرافِ کاملاً طولانی دربارهٔ محتوای مقاله که در فهرست جایی ندارد.',
      publishedAt: AWAKE,
    });
    const row = (await listNotices(await userId()))[0];
    expect(row.title).toContain('مطلب جدید در');
    expect(row.body).toBe('پوسیدگی پنهان');
    // The Pulse belongs on a lock screen, never in a row the reader scans.
    expect(row.body).not.toContain('پاراگراف');
    expect(row.url).toBe('/notecast/note-98.html');
  });

  it('shows one publish once, however many pushes follow it', async () => {
    await pool.query(
      `update profiles set settings = '{"reminders":{"new_content":true}}'::jsonb where id = $1`,
      [await userId()],
    );
    await onArticlePublished({
      contentId: 'notecast/note-97', title: 'مطلبِ تازه', url: '/notecast/note-97.html',
      publishedAt: AWAKE,
    });
    // The free digest carries the same news in a longer wording, on a schedule.
    // Due relative to the injected clock, not to the wall clock the suite runs on.
    await pool.query("update articles set notify_free_after = '2026-01-01'");
    const digest = await runFreeDigest(AWAKE);
    expect(digest.recipients).toBe(1);

    const rows = await listNotices(await userId());
    expect(rows.filter((r) => r.kind === 'article').length).toBe(1);
    // …and its counter row still exists, or the daily cap would stop counting.
    const counter = await pool.query<{ n: number }>(
      "select count(*)::int n from notification_log where kind = 'article_free_digest' and delivered",
      [],
    );
    expect(counter.rows[0].n).toBe(1);
  });

  it('never shows a reader news from before they existed', async () => {
    await recordBroadcast({ kind: 'system', title: 'قبل از ثبت‌نامِ او' });
    await pool.query("update notice_broadcasts set created_at = now() - interval '5 days'");
    expect(await listNotices(await userId())).toEqual([]);
    expect(await unreadNoticeCount(await userId())).toBe(0);
  });

  it('honours the audience a broadcast was addressed to', async () => {
    await recordBroadcast({ kind: 'system', title: 'فقط برای پریمیوم', audience: 'premium' });
    expect(await unreadNoticeCount(await userId())).toBe(0);

    await pool.query("update profiles set tier = 'premium' where id = $1", [await userId()]);
    expect(await unreadNoticeCount(await userId())).toBe(1);
  });
});

describe('the founder broadcast', () => {
  const auth = 'Basic ' + Buffer.from(
    `${config.admin.user}:${config.admin.password}`,
  ).toString('base64');

  it('lands in every reader\'s inbox from one row, and turns the dot on', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/notices/broadcast',
      headers: { authorization: auth },
      payload: { title: 'فردا سایت به‌روزرسانی می‌شود', body: 'حدود یک ساعت.' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);

    const me = (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.unread_notices).toBe(1);

    const rows = (await app.inject({ method: 'GET', url: '/notices', headers: { cookie } })).json();
    expect(rows.notices[0].title).toBe('فردا سایت به‌روزرسانی می‌شود');
    expect(rows.notices[0].body).toBe('حدود یک ساعت.');

    // …and seeing it takes the dot away.
    await app.inject({ method: 'POST', url: '/notices/seen', headers: { cookie } });
    const after = (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(after.unread_notices).toBe(0);
  });

  it('refuses an empty title rather than posting a blank row', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/notices/broadcast',
      headers: { authorization: auth }, payload: { title: '   ' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('requires admin credentials', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/notices/broadcast', payload: { title: 'سلام' },
    });
    expect(res.statusCode).toBe(401);
  });
});
