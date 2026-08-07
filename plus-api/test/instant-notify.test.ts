import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { dayInTz } from '../src/services/time.js';
import { finalizeWeek } from '../src/services/league-finalize.js';
import { notifyLeagueOutcomes } from '../src/services/league-notify.js';
import { runReviewReminders } from '../src/services/review-notify.js';
import { onArticlePublished, runPremiumBacklog, runFreeDigest } from '../src/services/article-notify.js';
import { sendCapped, inAwakeWindow } from '../src/services/notify-policy.js';

/**
 * Instant premium notifications: the league-outcome push, the new-article premium
 * push, the review-due push, and the delivery policy (daily cap + awake window)
 * they all go through.
 *
 * Delivery itself is the stub provider here; `notification_log` is the observable
 * — a DELIVERED row means the message was handed to the senders, no row means
 * policy or selection dropped it.
 *
 * `delivered` matters since the in-app inbox shipped: the same table now also
 * holds messages the cap refused to send, so every assertion about "was it sent"
 * carries the filter (see logRows) and only the cap test below looks at both.
 */

let seq = 0;

/** Instants inside the awake window (09:00-22:00 Tehran) and safely outside it. */
const AWAKE = new Date('2026-02-10T11:00:00+03:30');
const ASLEEP = new Date('2026-02-10T02:00:00+03:30');
/** The morning after ASLEEP, when the release sweep runs. */
const NEXT_MORNING = new Date('2026-02-10T09:00:00+03:30');

async function tierId(slug: string): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from league_tiers where slug = $1', [slug]);
  return r.rows[0].id;
}

/** A profile with a delivery channel (Telegram) at the given tier. */
async function makeUser(tier: 'free' | 'premium', settings = '{}'): Promise<string> {
  seq += 1;
  const r = await pool.query<{ id: string }>(
    `insert into profiles (display_name, tier, telegram_id, settings)
     values ($1, $2, $3, $4::jsonb) returning id`,
    [`u${seq}`, tier, 900000 + seq, settings],
  );
  return r.rows[0].id;
}

/** Every stored row, delivered or not — what the inbox would show. */
async function allRows(userId: string): Promise<number> {
  const r = await pool.query<{ n: number }>(
    'select count(*)::int n from notification_log where user_id = $1',
    [userId],
  );
  return r.rows[0].n;
}

async function logRows(userId: string, kind?: string): Promise<number> {
  const r = await pool.query<{ n: number }>(
    `select count(*)::int n from notification_log
      where user_id = $1 and delivered and ($2::text is null or kind = $2)`,
    [userId, kind ?? null],
  );
  return r.rows[0].n;
}

/**
 * Seed a closed group whose members are the given profiles, then finalize it —
 * the real path that writes `outcome`. Weekly XP descends with the array order,
 * so members[0] is rank 1 (promoted) and the last is bottom (demoted).
 */
async function seedAndFinalize(userIds: string[], week = '2026-02-07'): Promise<void> {
  const tid = await tierId('amalgam');
  const lg = await pool.query<{ id: string }>(
    `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
     values ($1, $2, $2, 'closed', $3) returning id`,
    [tid, week, userIds.length],
  );
  for (let i = 0; i < userIds.length; i += 1) {
    await pool.query('update profiles set current_tier_id = $2 where id = $1', [userIds[i], tid]);
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
       values ($1, $2, $3, $4, $5)`,
      [lg.rows[0].id, userIds[i], week, 100 - i * 10, `2026-02-08T0${i}:00:00Z`],
    );
  }
  await finalizeWeek(week, AWAKE);
}

/** Six premium members: enough to be a valid, full group so both zones apply. */
async function sixPremium(): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < 6; i += 1) ids.push(await makeUser('premium'));
  return ids;
}

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await pool.end(); });

// --- quiet window -----------------------------------------------------------

describe('inAwakeWindow', () => {
  it('covers 09:00-22:00 Tehran and nothing outside it', () => {
    expect(inAwakeWindow(ASLEEP)).toBe(false);
    expect(inAwakeWindow(AWAKE)).toBe(true);
  });

  it('is half-open: 09:00 sharp is awake, 22:00 sharp already waits', () => {
    expect(inAwakeWindow(new Date('2026-02-10T09:00:00+03:30'))).toBe(true);
    expect(inAwakeWindow(new Date('2026-02-10T21:59:00+03:30'))).toBe(true);
    expect(inAwakeWindow(new Date('2026-02-10T22:00:00+03:30'))).toBe(false);
    expect(inAwakeWindow(new Date('2026-02-10T23:30:00+03:30'))).toBe(false);
  });
});

// --- league outcome ---------------------------------------------------------

describe('notifyLeagueOutcomes', () => {
  it('announces promotion and demotion to premium members, once each', async () => {
    const ids = await sixPremium();
    await seedAndFinalize(ids);

    const first = await notifyLeagueOutcomes(AWAKE);
    expect(first.notified).toBeGreaterThan(0);
    expect(await logRows(ids[0], 'league')).toBe(1);          // rank 1 -> promoted
    expect(await logRows(ids[ids.length - 1], 'league')).toBe(1); // bottom -> demoted

    // The claim column makes a second sweep a no-op: never double-announced.
    const second = await notifyLeagueOutcomes(AWAKE);
    expect(second.notified).toBe(0);
    expect(await logRows(ids[0], 'league')).toBe(1);
  });

  it('does not announce to members who merely stayed', async () => {
    const ids = await sixPremium();
    await seedAndFinalize(ids);
    await notifyLeagueOutcomes(AWAKE);

    const stayed = await pool.query<{ user_id: string }>(
      "select user_id from league_members where outcome = 'stayed'",
    );
    expect(stayed.rowCount).toBeGreaterThan(0);
    for (const r of stayed.rows) expect(await logRows(r.user_id, 'league')).toBe(0);
  });

  it('holds everything outside the awake window (league weeks finalize at 00:00)', async () => {
    const ids = await sixPremium();
    await seedAndFinalize(ids);

    expect((await notifyLeagueOutcomes(ASLEEP)).notified).toBe(0);
    expect(await logRows(ids[0], 'league')).toBe(0);
    // Held, not dropped: the morning sweep still announces it.
    expect((await notifyLeagueOutcomes(NEXT_MORNING)).notified).toBeGreaterThan(0);
    expect(await logRows(ids[0], 'league')).toBe(1);
  });

  it('skips free members — the push is the premium lane', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i += 1) ids.push(await makeUser('free'));
    await seedAndFinalize(ids);

    expect((await notifyLeagueOutcomes(AWAKE)).notified).toBe(0);
    expect(await logRows(ids[0], 'league')).toBe(0);
  });

  it('respects the opt-out switch the profile page writes', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i += 1) ids.push(await makeUser('premium', '{"reminders":{"streak":false}}'));
    await seedAndFinalize(ids);

    expect((await notifyLeagueOutcomes(AWAKE)).notified).toBe(0);
  });

  it('skips a premium member with no delivery channel at all', async () => {
    const ids = await sixPremium();
    await pool.query('update profiles set telegram_id = null where id = any($1)', [ids]);
    await seedAndFinalize(ids);

    expect((await notifyLeagueOutcomes(AWAKE)).notified).toBe(0);
  });

  it('ignores a week that ended long ago (no ancient news after downtime)', async () => {
    const ids = await sixPremium();
    await seedAndFinalize(ids, '2025-11-01');

    expect((await notifyLeagueOutcomes(AWAKE)).notified).toBe(0);
  });
});

// --- review-due reminder ----------------------------------------------------

/**
 * Give `userId` `n` cards that are due as of `at` (a highlight + its card_state).
 * Due-ness is seeded RELATIVE to the run instant, not to wall-clock now(): the
 * tests drive the reminder at a fixed date so the quiet window is deterministic.
 */
async function seedDueCards(userId: string, n: number, at: Date = AWAKE): Promise<void> {
  for (let i = 0; i < n; i += 1) {
    const h = await pool.query<{ id: string }>(
      `insert into highlights (user_id, content_id, exact) values ($1, $2, $3) returning id`,
      [userId, 'insight/insight-60', `متن ${i}`],
    );
    await pool.query(
      `insert into card_state (user_id, highlight_id, box, next_review_at)
       values ($1, $2, 1, $3::timestamptz - interval '1 day')`,
      [userId, h.rows[0].id, at.toISOString()],
    );
  }
}

describe('runReviewReminders', () => {
  it('reminds a premium user with due cards, once per day', async () => {
    const u = await makeUser('premium');
    await seedDueCards(u, 3);

    expect((await runReviewReminders(AWAKE)).reminded).toBe(1);
    expect(await logRows(u, 'review')).toBe(1);

    // Same Tehran day -> deduped through notification_log, no second push.
    expect((await runReviewReminders(AWAKE)).reminded).toBe(0);
    expect(await logRows(u, 'review')).toBe(1);
  });

  it('skips a free user — the Leitner schedule itself is premium', async () => {
    const u = await makeUser('free');
    await seedDueCards(u, 2);

    expect((await runReviewReminders(AWAKE)).reminded).toBe(0);
    expect(await logRows(u, 'review')).toBe(0);
  });

  it('skips a premium user whose cards are not due yet', async () => {
    const u = await makeUser('premium');
    const h = await pool.query<{ id: string }>(
      `insert into highlights (user_id, content_id, exact) values ($1, 'insight/insight-60', 'x') returning id`,
      [u],
    );
    await pool.query(
      `insert into card_state (user_id, highlight_id, box, next_review_at)
       values ($1, $2, 3, $3::timestamptz + interval '5 days')`,
      [u, h.rows[0].id, AWAKE.toISOString()],
    );

    expect((await runReviewReminders(AWAKE)).reminded).toBe(0);
  });

  it('respects the opt-out switch', async () => {
    const u = await makeUser('premium', '{"reminders":{"streak":false}}');
    await seedDueCards(u, 2);

    expect((await runReviewReminders(AWAKE)).reminded).toBe(0);
  });
});

// --- new-article premium push (the awake window applies here too) -----------

/** A premium user opted into the new-article notification, with a channel. */
async function premiumSubscriber(): Promise<string> {
  return makeUser('premium', '{"reminders":{"new_content":true}}');
}

async function articleRow(contentId: string): Promise<{ premium_notified_at: string | null }> {
  const r = await pool.query<{ premium_notified_at: string | null }>(
    'select premium_notified_at from articles where content_id = $1', [contentId],
  );
  return r.rows[0];
}

describe('new-article premium push vs the awake window', () => {
  it('fires on publish inside the window', async () => {
    const u = await premiumSubscriber();
    const res = await onArticlePublished({
      contentId: 'insight/awake-1', title: 'ت', url: '/insight/awake-1.html', publishedAt: AWAKE,
    });

    expect(res.deferred).toBe(false);
    expect(res.premiumRecipients).toBe(1);
    expect(await logRows(u, 'article_premium')).toBe(1);
    expect((await articleRow('insight/awake-1')).premium_notified_at).not.toBeNull();
  });

  it('holds a 02:00 publish, then releases it on the morning sweep', async () => {
    const u = await premiumSubscriber();
    const res = await onArticlePublished({
      contentId: 'insight/night-1', title: 'ش', url: '/insight/night-1.html', publishedAt: ASLEEP,
    });

    // Recorded (so the free digest is still scheduled) but not pushed.
    expect(res.recorded).toBe(true);
    expect(res.deferred).toBe(true);
    expect(await logRows(u, 'article_premium')).toBe(0);
    expect((await articleRow('insight/night-1')).premium_notified_at).toBeNull();

    const released = await runPremiumBacklog(NEXT_MORNING);
    expect(released.articles).toBe(1);
    expect(released.recipients).toBe(1);
    expect(await logRows(u, 'article_premium')).toBe(1);
    expect((await articleRow('insight/night-1')).premium_notified_at).not.toBeNull();

    // Claimed: a second sweep the same morning sends nothing again.
    expect((await runPremiumBacklog(NEXT_MORNING)).articles).toBe(0);
    expect(await logRows(u, 'article_premium')).toBe(1);
  });

  it('drops a held article that went stale during a long outage', async () => {
    const u = await premiumSubscriber();
    await onArticlePublished({
      contentId: 'insight/night-2', title: 'ک', url: '/insight/night-2.html', publishedAt: ASLEEP,
    });

    // Container comes back a week later.
    const muchLater = new Date(ASLEEP.getTime() + 7 * 86_400_000);
    const released = await runPremiumBacklog(muchLater);
    expect(released.articles).toBe(0);
    expect(released.stale).toBe(1);
    expect(await logRows(u, 'article_premium')).toBe(0);
    // Still claimed, so it can never resurface later as fresh news.
    expect((await articleRow('insight/night-2')).premium_notified_at).not.toBeNull();
  });

  it('releases several held articles as separate pushes, oldest first', async () => {
    const u = await premiumSubscriber();
    await onArticlePublished({
      contentId: 'insight/night-3', title: 'a', url: '/insight/night-3.html', publishedAt: ASLEEP,
    });
    await onArticlePublished({
      contentId: 'insight/night-4', title: 'b', url: '/insight/night-4.html',
      publishedAt: new Date(ASLEEP.getTime() + 3_600_000),
    });

    const released = await runPremiumBacklog(NEXT_MORNING);
    expect(released.articles).toBe(2);
    expect(await logRows(u, 'article_premium')).toBe(2);
  });
});

// --- the free lane is untouched except for the window -----------------------

describe('free digest vs the awake window', () => {
  it('still batches on its own 24h delay + 21:00 hour, unchanged', async () => {
    const free = await makeUser('free', '{"reminders":{"new_content":true}}');
    const published = new Date('2026-03-08T12:00:00Z'); // 15:30 Tehran
    await onArticlePublished({
      contentId: 'insight/free-1', title: 'ت', url: '/insight/free-1.html', publishedAt: published,
    });

    // Not yet due: the 24h delay is still the free rule.
    expect((await runFreeDigest(new Date('2026-03-08T17:30:00Z'))).articles).toBe(0);
    // Due, at the usual 21:00 Tehran digest hour.
    const run = await runFreeDigest(new Date('2026-03-09T17:30:00Z'));
    expect(run.articles).toBe(1);
    expect(await logRows(free, 'article_free_digest')).toBe(1);
  });

  it('defers a digest run that lands outside the window without claiming the batch', async () => {
    const free = await makeUser('free', '{"reminders":{"new_content":true}}');
    await onArticlePublished({
      contentId: 'insight/free-2', title: 'ش', url: '/insight/free-2.html',
      publishedAt: new Date('2026-03-08T12:00:00Z'),
    });

    // A hand-triggered run at 03:00 Tehran must not wake every free user.
    const night = await runFreeDigest(new Date('2026-03-09T23:30:00Z')); // 03:00 Tehran
    expect(night.deferred).toBe(true);
    expect(night.articles).toBe(0);
    expect(await logRows(free, 'article_free_digest')).toBe(0);

    // Nothing was claimed, so the normal 21:00 run still delivers the batch.
    const evening = await runFreeDigest(new Date('2026-03-10T17:30:00Z'));
    expect(evening.articles).toBe(1);
    expect(await logRows(free, 'article_free_digest')).toBe(1);
  });

  it('never sends a free user the premium instant push', async () => {
    const free = await makeUser('free', '{"reminders":{"new_content":true}}');
    const res = await onArticlePublished({
      contentId: 'insight/free-3', title: 'ک', url: '/insight/free-3.html', publishedAt: AWAKE,
    });

    expect(res.premiumRecipients).toBe(0);
    expect(await logRows(free, 'article_premium')).toBe(0);
  });
});

// --- delivery policy --------------------------------------------------------

describe('sendCapped', () => {
  const msg = { title: 't', body: 'b' };

  // The cap governs the CHANNEL, not the reader's right to the news. Past the
  // limit nothing travels — and the message still lands in اطلاعیه, marked
  // undelivered so it cannot be counted against tomorrow's budget.
  it('stops sending at the daily cap but keeps the excess in the inbox', async () => {
    const u = await makeUser('premium');
    const max = config.notify.maxPerDay;

    for (let i = 0; i < max; i += 1) {
      expect(await sendCapped(u, msg, 'article_premium', AWAKE)).toBe(true);
    }
    expect(await sendCapped(u, msg, 'article_premium', AWAKE)).toBe(false);
    expect(await logRows(u)).toBe(max);          // delivered: exactly the budget
    expect(await allRows(u)).toBe(max + 1);      // stored: the refused one too

    // The load-bearing bit: an undelivered row must never count as sent, or the
    // cap would feed itself and quietly starve the user's push budget.
    const undelivered = await pool.query<{ n: number }>(
      'select count(*)::int n from notification_log where user_id = $1 and not delivered',
      [u],
    );
    expect(undelivered.rows[0].n).toBe(1);
  });

  it('lets a founder broadcast through even when the user is capped out', async () => {
    const u = await makeUser('premium');
    for (let i = 0; i < config.notify.maxPerDay; i += 1) {
      await sendCapped(u, msg, 'article_premium', AWAKE);
    }
    expect(await sendCapped(u, msg, 'system', AWAKE)).toBe(true);
  });

  it('counts per Tehran day, so a new day restores the budget', async () => {
    const u = await makeUser('premium');
    for (let i = 0; i < config.notify.maxPerDay; i += 1) {
      await sendCapped(u, msg, 'article_premium', AWAKE);
    }
    expect(await sendCapped(u, msg, 'article_premium', AWAKE)).toBe(false);

    const nextDay = new Date(AWAKE.getTime() + 24 * 3_600_000);
    expect(dayInTz(nextDay, config.streakTimezone))
      .not.toBe(dayInTz(AWAKE, config.streakTimezone));
    expect(await sendCapped(u, msg, 'article_premium', nextDay)).toBe(true);
  });
});
