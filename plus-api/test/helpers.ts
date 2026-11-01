import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { pool } from '../src/db.js';
import { resetRateLimits } from '../src/services/rate-limit.js';
import { clearOtpStore } from '../src/services/otp.js';
import { clearBaleLinkStore } from '../src/services/bale-link.js';
import { clearTagSelectionCache } from '../src/services/case-assistant.js';
import { drainAchievementSyncs } from '../src/services/achievement-sync.js';
import { drainPillarWelcomes } from '../src/services/pillar-notify.js';
import { drainReferralNotifies } from '../src/services/referral-notify.js';
import { drainBroadcasts } from '../src/services/broadcast.js';
import { resetBoardCache } from '../src/services/votes.js';
import { recordActivity, SERVER_MINTED_ACTIONS } from '../src/services/activity.js';

/** Truncate all data tables and reset in-process stores. Call in beforeEach. */
export async function resetDb(): Promise<void> {
  // Several write routes schedule a badge sync off the response (see
  // achievement-sync.ts). That promise outlives the request, so truncating on
  // top of it deadlocks against the row locks it still holds — wait it out
  // rather than making production code behave differently under test.
  // The «ستون» welcome is the same shape and can itself schedule a sync, so
  // it drains first. The founder broadcast's fan-out is the third of these: it
  // was detached from its request on 2026-08-08 so a large audience could not
  // outlive the gateway, and an undrained fan-out writing notification_log is
  // what a truncate here deadlocks against.
  await drainBroadcasts();
  await drainPillarWelcomes();
  await drainReferralNotifies();
  await drainAchievementSyncs();
  // The drains above cover the detached jobs we can name, but a few fire-and
  // -forget writes still escape them (payment.ts's capacity alert and paid-push,
  // spot-stats' receipt sweep). Any one of those, mid-write when we truncate,
  // takes a row lock the TRUNCATE's ACCESS EXCLUSIVE lock then deadlocks
  // against — a rare, timing-dependent 40P01 that fails an unrelated test on the
  // NEXT run's reset. Rather than chase every detached writer into a drain, wait
  // it out (the file's stated approach): a detached job finishes in
  // milliseconds, so a short retry lets the truncate land cleanly.
  for (let attempt = 1; ; attempt += 1) {
    try {
      await pool.query(`
        truncate table
          profiles, user_activity, highlights_all, card_state, audio_clips, content_votes,
          collections, collection_items, snippets, user_pathways,
          subscriptions, payments, gift_redemptions, certificates, pathway_exams,
          pathway_exam_forms, pathway_exam_attempts, pathway_exam_examples, content_exam_questions, anon_events,
          push_subscriptions, articles, auth_identities, spot_stats, spot_delivery_receipts, view_stats,
          notification_log, achievement_announcements, notice_broadcasts, notice_reads,
          discount_grants, discount_redemptions, badge_grants,
          referral_codes, referrals,
          support_tickets, ticket_messages,
          des_requests, des_paper_keys, des_papers,
          challenge_examples, challenge_attempts, challenges,
          assistant_rounds, assistant_tag_scores,
          leagues, league_members, league_weekly_stats, league_audit_log,
          clinic_closures, quick_publications, quick_publish_media, quick_publish_settings
        restart identity cascade
      `);
      break;
    } catch (err) {
      if ((err as { code?: string } | null)?.code === '40P01' && attempt <= 10) {
        await new Promise((r) => { setTimeout(r, 50 * attempt); });
        continue;
      }
      throw err;
    }
  }
  // League seed data (tiers + config) is created ONCE by the migration and must
  // survive truncation — so reset the knobs back to their seed values, because
  // league_config is NOT truncated and a test that retunes one would otherwise
  // hand its change to every test that runs after it.
  //
  // The tier ROWS need the same treatment and did not have it. Tier activation
  // is one-way in production (league-finalize.ts's selfTune only ever switches a
  // tier on), so the suite's activation tests leave metal-ceramic active for
  // every file that runs afterwards — and any assertion about which tiers exist
  // then depends on file ORDER, which is exactly the kind of failure that shows
  // up once, in someone else's unrelated commit.
  await pool.query(`
    update league_tiers
       set is_active = (tier_order <= 3),
           activated_at = case when tier_order <= 3 then coalesce(activated_at, now()) else null end
  `);
  await pool.query(`
    update league_config set value = case key
      when 'group_size_current' then '8'
      when 'min_group_capacity' then '3'
      when 'max_active_tier_order' then '3'
      when 'group_size_last_changed_week' then ''
      when 'promotion_min_weekly_xp' then '30'
      when 'promotion_pct' then '20'
      when 'demotion_pct' then '20'
      when 'min_valid_group_size' then '6'
      when 'cooldown_weeks' then '4'
      when 'xp_active_bonus' then '5'
      when 'xp_read' then '5'
      when 'xp_listen' then '5'
      when 'xp_highlight' then '1'
      when 'xp_highlight_cap' then '3'
      when 'xp_review' then '2'
      when 'xp_share' then '1'
      when 'xp_share_weekly_cap' then '0'
      when 'xp_challenge' then '5'
      when 'xp_challenge_weekly_cap' then '0'
      when 'xp_pathway_step' then '3'
      when 'xp_pathway_step_weekly_cap' then '5'
      when 'xp_pathway_enrolled' then '5'
      when 'xp_pathway_enrolled_weekly_cap' then '2'
      when 'xp_collection_created' then '3'
      when 'xp_collection_created_weekly_cap' then '1'
      when 'xp_collection_item' then '1'
      when 'xp_collection_item_weekly_cap' then '5'
      when 'xp_per_active_day' then '10'
      when 'xp_per_highlight' then '1'
      when 'prize_days' then '2'
      when 'prize_cooldown_weeks' then '2'
      when 'prize_winners_per_group' then '1'
      when 'prize_min_group_size' then '3'
      when 'prize_min_weekly_xp' then '30'
      when 'top_tier_prize_days' then '3'
      else value end,
      locked = false, locked_at = null;
    `);
  await pool.query(
    "update league_tiers set is_active = (tier_order <= 3), activated_at = case when tier_order <= 3 then now() else null end",
  );
  resetRateLimits();
  // up-board's ranking is cached in-process for a minute (services/votes.ts).
  // Without this, a case that votes and then reads the board would be served the
  // PREVIOUS test's ordering — and would pass or fail depending on file order.
  resetBoardCache();
  clearTagSelectionCache();
  clearOtpStore();
  clearBaleLinkStore();
}

export async function makeApp(): Promise<FastifyInstance> {
  const app = await buildServer();
  await app.ready();
  return app;
}

/** Extract the signed session cookie string from a set-cookie header. */
export function sessionCookieFrom(res: { headers: Record<string, unknown> }): string | null {
  const raw = res.headers['set-cookie'];
  const arr = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  const c = arr.find((s) => s.startsWith('dcp_session='));
  return c ? c.split(';')[0] : null;
}

/** The account a session cookie belongs to (the cookie is `<uuid>.<signature>`). */
export function userIdFromCookie(cookie: string): string {
  const value = cookie.replace(/^dcp_session=/, '');
  const id = value.split('.')[0];
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error(`not a session cookie: ${cookie}`);
  return id;
}

/**
 * Write a SERVER-minted activity row the way a service does.
 *
 * POST /activity refuses every action in SERVER_MINTED_ACTIONS — a client that
 * could post `highlight_created` or `review_finished` could buy its own league
 * XP — so a test needing one as SETUP goes through the same door the service
 * uses. Anything else is a real client signal and stays on the route, which is
 * the distinction the guard exists to draw.
 */
export async function mintActivity(
  cookie: string,
  action: string,
  contentId: string | null = null,
  meta: Record<string, unknown> = {},
): Promise<void> {
  if (!SERVER_MINTED_ACTIONS.has(action)) {
    throw new Error(`mintActivity is for server-minted actions; "${action}" is not one`);
  }
  await recordActivity(userIdFromCookie(cookie), action, contentId, meta);
}

/**
 * Insert a real, owned highlight straight into the table and return its id —
 * the SETUP a test needs when it posts `card_reviewed_manual`, which now
 * requires a real owned card (routes/activity.ts). Direct SQL, not POST
 * /highlights, so it does not itself mint a `highlight_created` scoring row and
 * pollute an exact-XP assertion. Each call is a DISTINCT card, which is what the
 * once-per-card-per-day review rule needs to let N reviews pay.
 */
export async function seedHighlight(
  userId: string,
  contentId = 'episodes/episode-1',
  exact = 'seeded selection',
): Promise<string> {
  const r = await pool.query<{ id: string }>(
    `insert into highlights_all (user_id, content_id, exact) values ($1, $2, $3) returning id`,
    [userId, contentId, exact],
  );
  return r.rows[0].id;
}

/** Full OTP login round-trip; returns the session cookie header value. */
export async function loginAs(app: FastifyInstance, phone: string): Promise<string> {
  const req = await app.inject({
    method: 'POST',
    url: '/auth/otp/request',
    payload: { phone },
  });
  const code = req.json().dev_code as string;
  const verify = await app.inject({
    method: 'POST',
    url: '/auth/otp/verify',
    payload: { phone, code },
  });
  const cookie = sessionCookieFrom(verify);
  if (!cookie) throw new Error('login did not set a session cookie');
  return cookie;
}
