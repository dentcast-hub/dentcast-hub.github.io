import { pool } from '../db.js';

/**
 * up-board — the reader-ordered view of the whole site, and the قلب behind it.
 *
 * Two numbers meet in this file and only one of them is written down.
 *
 *   · HEARTS are state. One row per (reader, page) in `content_votes`, put there
 *     by a press and taken away by the next one. Nothing here derives them.
 *   · The SEED is derived, every time, from `user_activity` — the append-only
 *     log that has carried `content_id` since migration 0001. It is not stored,
 *     not cached in a column and not backfilled anywhere, for the same reason
 *     the badge wall stores no badges: a written copy of a derived number is a
 *     second source of truth, and the first time the two disagree the public
 *     number is wrong with nothing to notice it.
 *
 * ── Why a seed exists at all ────────────────────────────────────────────────
 *
 * A vote-ordered board with no votes yet is 443 items in arbitrary order, which
 * is worse than no board: the first reader sees a list that is visibly random,
 * concludes the feature is broken, and never presses anything — so the votes
 * that would have fixed it never arrive. The seed is what makes the board
 * sensible on day one, and it costs nothing to produce because the signal is
 * already in the log: who finished a page, who highlighted it, who pinned it,
 * who passed it on.
 *
 * It counts DISTINCT USERS per action, never rows. One reader who leaves twenty
 * highlights on one article is one person who found it worth marking up, and
 * counting the rows would let a single enthusiastic reader install their own
 * favourite at the top of the site.
 *
 * ── How engagement enters the score, and why it is capped ───────────────────
 *
 * Engagement is a starting position AND a permanent tie-breaking pressure — but
 * never a way to out-shout the readers. Two mechanisms do that work together.
 *
 * FIRST, it is expressed as a PERCENTILE (1..100), not a raw total. The raw
 * numbers are wildly skewed — one much-studied article can carry twenty times
 * the engagement of a typical one — so any scale anchored to the maximum
 * squashes the whole middle of the site into single digits and stops
 * distinguishing the pages it most needs to. A percentile is uniform by
 * construction: half the engaged pages are above 50 and half below, which is
 * what makes the number worth printing next to a heart count at all. It is also
 * the only 0..100 form of this that can be said out loud without lying — «از
 * ۶۲٪ مطالب سایت تعامل بیشتری گرفته» is a fact, where «۶۲٪ تعامل» would be a
 * percentage of nothing.
 *
 * SECOND, that percentile buys at most `engagement_cap` points, and the cap is
 * RELATIVE to the site's own heart economy rather than a constant:
 *
 *     cap   = max(CAP_FLOOR, CAP_SHARE × mean hearts per voted page)
 *     score = hearts + cap × (percentile / 100)
 *
 * A fixed cap could only ever be right once. Three points is most of the
 * ranking while the busiest page has five hearts, and it is noise once the
 * busiest page has four hundred — so a constant would start out overbearing and
 * end up decorative, and nobody would notice the day it crossed over. Scaling it
 * to the mean keeps its INFLUENCE steady instead of its value: engagement is
 * always worth about half of what an average voted page earns in hearts,
 * whatever that number happens to be that year.
 *
 * ── Why the percentile is taken WITHIN a class ──────────────────────────────
 *
 * An audio episode cannot earn most of the seed. `highlight` and `pin` are
 * three points each and neither door exists on a podcast — not because nobody
 * walks through it but because there is no workbench to open. So a podcast's
 * reachable ceiling is `share` + `consumed`, a fraction of an article's, and
 * ranking the two against one shared scale does not measure that a podcast drew
 * less interest. It measures that it had fewer ways to show it.
 *
 * The fix is the argument that made engagement a percentile in the first place,
 * applied one level deeper. Up there, raw totals were not comparable across
 * pages, so we compared RANKS. Here the two classes' totals are not comparable
 * either, so each page is ranked among its own kind: the top podcast reaches
 * 100 exactly as the top article does, and a quiet podcast still sits below a
 * busy one, which is the distinction the board exists to draw.
 *
 * Deliberately NOT a weight — «a listen is worth ten» was the obvious other
 * answer and it is the same mistake the cap above avoids. Ten is calibrated to
 * this year's mix: it makes podcasts dominate the day they get busy and does
 * nothing the day they go quiet, and it lifts all 210 of them together rather
 * than telling them apart. Ranking within a class needs no constant at all and
 * stays right on its own, whatever happens to the volume or the mix of actions.
 *
 * The class is DERIVED from the content_id, like everything else here — there is
 * no column and nothing to keep in step. `MIN_CLASS_SIZE` is the one guard: a
 * percentile over a handful of pages is noise (three items can only ever say 33,
 * 67 or 100), so a class too small to rank internally is ranked against the
 * whole site instead. Same shape as the league's `min_valid_group_size`, and for
 * the same reason: a scale needs a population before it means anything.
 *
 * `CAP_FLOOR` is what makes the board work on day one. With no votes yet the
 * relative term is zero, every score would be zero, and the board would open in
 * arbitrary order — the exact failure the seed exists to prevent. The floor
 * means the opening board is ordered purely by engagement, and the relative term
 * takes over from it silently as votes arrive.
 *
 * What the cap guarantees, and the reason it is a cap rather than a coefficient:
 * a page with more than `cap` hearts CANNOT be overtaken by engagement alone, no
 * matter how much of it there is. Hearts stay the senior signal permanently,
 * with no fade to schedule and no switch-over day.
 */

// ── the vote itself ─────────────────────────────────────────────────────────

/**
 * A content id is the page's own path, minus the leading slash and the `.html`
 * (see detectContentId in plus/js/config.js) — `chairside/chairside-30`,
 * `dentai/promptologist/prompt4-2`. Uppercase is allowed because LiteCast files
 * are named `lite-CAST17`.
 *
 * Bounded in shape and length for the same reason the Spot slot vocabulary is:
 * this string becomes a permanent key in a table, and a forged one would sit
 * there forever. `..` is refused outright — nothing here resolves a path, but an
 * id that cannot describe a real page has no business being stored.
 */
const CONTENT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9/._-]{0,127}$/;

export function isValidContentId(id: unknown): id is string {
  return typeof id === 'string' && CONTENT_ID_RE.test(id) && !id.includes('..');
}

/**
 * Cast a vote. Idempotent by the primary key: a double tap, a retried request
 * and two tabs racing all land on the same row.
 *
 * Idempotent rather than a toggle on purpose. A toggle endpoint turns a flaky
 * connection into a bug — the request that timed out may well have succeeded,
 * and the retry would silently undo it. With an explicit add/remove pair the
 * client's intent survives any number of retries.
 */
export async function addVote(userId: string, contentId: string): Promise<void> {
  await pool.query(
    `insert into content_votes (user_id, content_id) values ($1, $2)
     on conflict (user_id, content_id) do nothing`,
    [userId, contentId],
  );
}

/** Take a vote back. Also idempotent — removing a vote that is not there is fine. */
export async function removeVote(userId: string, contentId: string): Promise<void> {
  await pool.query(
    `delete from content_votes where user_id = $1 and content_id = $2`,
    [userId, contentId],
  );
}

export interface VoteState { hearts: number; voted: boolean }

/**
 * One page's heart count, plus whether THIS reader is one of them.
 *
 * `voted` is false for an anonymous caller rather than an error: the count is
 * public (it is printed on the page for everyone) and only the pressing is
 * gated. Asking the two questions in one round trip is what lets the article
 * render the chip in its final state instead of flickering from empty to filled.
 */
export async function getVoteState(contentId: string, userId: string | null): Promise<VoteState> {
  const res = await pool.query<{ hearts: string; voted: boolean }>(
    `select count(*)::bigint as hearts,
            bool_or(user_id = $2::uuid) as voted
       from content_votes where content_id = $1`,
    [contentId, userId],
  );
  const row = res.rows[0];
  return { hearts: Number(row?.hearts ?? 0), voted: Boolean(row?.voted) };
}

// ── the seed ────────────────────────────────────────────────────────────────

/**
 * What each kind of engagement is worth, in units of "one reader".
 *
 * The order is by cost to the reader, which is the only ranking of these signals
 * that is defensible: highlighting a passage and pinning a page to a board are
 * deliberate acts of study, sharing is a public recommendation, and finishing is
 * the floor — it means the page held someone to the end, which is real but
 * cheap. A heart is worth 1, so these are readable against it directly: a page
 * three people highlighted starts where a page nine people hearted would be.
 *
 * `article_completed` is young — the client only started emitting it when
 * reading.js shipped — so in practice the early board leans on highlights, which
 * go back to the beginning of Plus. That is fine and self-correcting: the term
 * grows on its own, and the whole seed is shrinking anyway.
 */
const SEED_WEIGHTS = {
  highlight: 3,
  pin: 3,
  share: 2,
  consumed: 1,
} as const;

/**
 * What engagement is worth, as a share of the mean heart count of a voted page.
 *
 * Half: enough that a much-studied page reliably outranks a barely-voted one,
 * never enough to reorder the top of the board on its own. Retuning it changes
 * how loud engagement is; it can never change which signal is senior, because
 * the cap is applied to engagement alone.
 */
export const CAP_SHARE = 0.5;

/**
 * The floor under that cap, in hearts, and the reason the board is not empty on
 * its first day. Sized as "a few hearts" deliberately: large enough to order 443
 * pages sensibly before anybody has voted, small enough that the first handful
 * of real votes already outrank it.
 */
export const CAP_FLOOR = 3;

/**
 * The two kinds of page the board ranks. Audio is everything under `episodes/`
 * — the one folder whose pages carry no workbench, which is exactly what makes
 * its seed incomparable with the rest of the site (see the header).
 *
 * Derived from the content_id and nowhere else. A column would be one more
 * thing that can disagree with the URL it describes, and the folder already
 * decides every other audio behaviour in the codebase (plus.js's episode
 * branch, the streak's `episode_listened`, the seen-tick folders).
 */
export type ContentClass = 'audio' | 'readable';

export function contentClass(contentId: string): ContentClass {
  return /^episodes\//.test(contentId) ? 'audio' : 'readable';
}

/**
 * How many ENGAGED pages a class needs before it is ranked internally.
 *
 * Below this, a within-class percentile says less than a site-wide one: over
 * three pages the only values it can produce are 33, 67 and 100, which reads as
 * a measurement and is really just a sort order. Twelve is small enough that
 * both of today's classes clear it many times over (210 audio, 234 readable)
 * and large enough that a class arriving with a handful of pages falls back to
 * the whole site until it has a population of its own.
 */
export const MIN_CLASS_SIZE = 12;

async function seedByContent(): Promise<Map<string, number>> {
  const res = await pool.query<{
    content_id: string; u_hl: string; u_pin: string; u_share: string; u_consumed: string;
  }>(
    `select content_id,
            count(distinct user_id) filter (where action = 'highlight_created')     as u_hl,
            count(distinct user_id) filter (where action = 'collection_item_added') as u_pin,
            count(distinct user_id) filter (where action = 'content_shared')        as u_share,
            count(distinct user_id) filter (where action in ('article_completed','episode_listened')) as u_consumed
       from user_activity
      where content_id is not null
      group by content_id`,
  );
  const out = new Map<string, number>();
  for (const r of res.rows) {
    const seed = Number(r.u_hl) * SEED_WEIGHTS.highlight
      + Number(r.u_pin) * SEED_WEIGHTS.pin
      + Number(r.u_share) * SEED_WEIGHTS.share
      + Number(r.u_consumed) * SEED_WEIGHTS.consumed;
    if (seed > 0) out.set(r.content_id, seed);
  }
  return out;
}

// ── the counts ──────────────────────────────────────────────────────────────

/**
 * Every page's heart count, in one map. PUBLIC.
 *
 * The same information `GET /votes?id=` already hands out one page at a time,
 * and it has to be reachable in bulk for the same reason it is public at all:
 * the count is printed beside the article for everybody, so a list of articles
 * must be able to print it too. Splitting it out of getBoard() is what lets the
 * ranked ARRANGEMENT be premium without the counts going premium with it —
 * which is what happened the first time the gate went on, and left the free
 * list with no signal at all next to its rows.
 *
 * Its own small cache: this is on the free path, so it is asked far more often
 * than the board and must never wait on the seed aggregate.
 */
let countsCache: Map<string, number> | null = null;
let countsAt = 0;

export async function getHeartCounts(now: number = Date.now()): Promise<Record<string, number>> {
  if (!countsCache || now - countsAt >= CACHE_MS) {
    const res = await pool.query<{ content_id: string; hearts: string }>(
      `select content_id, count(*)::bigint as hearts from content_votes group by content_id`,
    );
    countsCache = new Map(res.rows.map((r) => [r.content_id, Number(r.hearts)]));
    countsAt = now;
  }
  return Object.fromEntries(countsCache);
}

// ── the board ───────────────────────────────────────────────────────────────

export interface BoardItem {
  content_id: string;
  hearts: number;
  /**
   * Engagement as a PERCENTILE among the pages that have any, 1..100 — «this
   * page drew more study than N% of the site». Absent (undefined) for a page
   * nothing has happened on yet, never 0: the same rule the heart count follows,
   * because a printed zero is an announcement rather than a measurement.
   *
   * A percentile, not a share of the maximum, and not a "percentage of readers":
   * we have no per-article view count anywhere (view_stats is per day and viewer
   * class; spot_stats is per ad slot), so any denominator claiming to be readers
   * would be invented. This one has a real referent — the rest of the site.
   */
  engagement?: number;
  score: number;
}
export interface Board {
  items: BoardItem[];
  /** Site-wide hearts. */
  total_hearts: number;
  /**
   * What a percentile of 100 is currently worth, in hearts. Scales with the
   * site's own heart economy (see the header), so the page can state the rule
   * truthfully instead of hard-coding a number that goes stale.
   */
  engagement_cap: number;
  /**
   * The classes whose engagement was ranked among THEMSELVES this run; anything
   * absent was ranked against the whole site (see MIN_CLASS_SIZE).
   *
   * Published because the page has to say what the number means, and the two
   * regimes mean different things: «more than ۶۲٪ of podcasts» and «more than
   * ۶۲٪ of the site» are different claims and only one of them is true at a
   * time. The fallback is not hypothetical — audio needs twelve engaged pages
   * before it can be ranked internally, and early on it will not have them.
   */
  engagement_scope: ContentClass[];
  generated_at: string;
}

/**
 * The board is a whole-table aggregate over `user_activity`, so it is computed
 * on a short timer rather than per request. A minute of staleness is invisible
 * on a list whose whole point is accumulated preference, and the alternative —
 * recomputing the seed for every visitor on every page — would put the site's
 * busiest read path on top of its biggest table.
 *
 * The cached copy is also what a failed refresh falls back to (same rule as
 * content-index.ts): serving last minute's order always beats serving none.
 */
const CACHE_MS = 60_000;
let cached: Board | null = null;
let cachedAt = 0;

/** Test-only: drop the cached board so a case can start from a known state. */
export function resetBoardCache(): void {
  cached = null;
  cachedAt = 0;
  countsCache = null;
  countsAt = 0;
}

export async function getBoard(now: number = Date.now()): Promise<Board> {
  if (cached && now - cachedAt < CACHE_MS) return cached;

  try {
    const [voteRows, weighted] = await Promise.all([
      pool.query<{ content_id: string; hearts: string }>(
        `select content_id, count(*)::bigint as hearts
           from content_votes group by content_id`,
      ),
      seedByContent(),
    ]);

    const hearts = new Map<string, number>();
    let total = 0;
    for (const r of voteRows.rows) {
      const n = Number(r.hearts);
      hearts.set(r.content_id, n);
      total += n;
    }

    // The cap, in hearts, that a percentile of 100 is worth right now. Relative
    // to the MEAN of a voted page rather than to the site total: the total grows
    // simply because the site publishes more, which would inflate the cap every
    // month without anyone reading anything differently. The mean tracks what a
    // page is actually worth in votes, which is the quantity engagement is being
    // measured against.
    const votedPages = hearts.size;
    const meanHearts = votedPages > 0 ? total / votedPages : 0;
    const cap = Math.max(CAP_FLOOR, CAP_SHARE * meanHearts);

    // Engagement → percentile, over the pages that HAVE engagement. Ranking over
    // all 443 instead would put every engaged page above the ~2/3 of the site
    // that has never been touched, so the scale would start at 68 and say
    // nothing about the pages it is meant to separate.
    //
    // Rank is by count of STRICTLY smaller values, so equal engagement gets an
    // equal percentile — a page cannot be pushed above its twin by iteration
    // order. Shifted by one so the range is 1..100: the least-engaged page still
    // shows a number, and the most-engaged shows exactly 100.
    const rankIn = (values: number[], v: number): number => {
      const n = values.length;
      if (n === 0) return 0;
      let lo = 0;
      let hi = n;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (values[mid] < v) lo = mid + 1; else hi = mid; }
      return Math.max(1, Math.min(100, Math.round(((lo + 1) / n) * 100)));
    };

    // …and ranked within the page's own class, because a podcast has fewer ways
    // to earn a seed than an article does (see the header). The site-wide array
    // stays, as the fallback for a class too small to rank inside.
    const allValues = [...weighted.values()].sort((x, y) => x - y);
    const byClass = new Map<ContentClass, number[]>();
    for (const [id, v] of weighted) {
      const c = contentClass(id);
      const arr = byClass.get(c);
      if (arr) arr.push(v); else byClass.set(c, [v]);
    }
    for (const arr of byClass.values()) arr.sort((x, y) => x - y);

    const rankedInternally = (c: ContentClass): boolean =>
      (byClass.get(c)?.length ?? 0) >= MIN_CLASS_SIZE;

    const percentile = (id: string, v: number): number => {
      const c = contentClass(id);
      const own = byClass.get(c);
      return rankIn(rankedInternally(c) && own ? own : allValues, v);
    };

    const ids = new Set<string>([...hearts.keys(), ...weighted.keys()]);
    const items: BoardItem[] = [];
    for (const id of ids) {
      const h = hearts.get(id) ?? 0;
      const raw = weighted.get(id);
      const pct = raw === undefined ? undefined : percentile(id, raw);
      const score = h + cap * ((pct ?? 0) / 100);
      const item: BoardItem = { content_id: id, hearts: h, score: Math.round(score * 1000) / 1000 };
      // Absent, never 0 — see the field's own note.
      if (pct !== undefined) item.engagement = pct;
      items.push(item);
    }

    // score → hearts → engagement → id.
    //
    // Hearts break a score tie ahead of engagement so that when the two combine
    // to the same total, the page with more real votes wins — the senior signal
    // stays senior even inside a tie. The id is last and is only reached by two
    // pages that agree on everything, which keeps the order fully determined:
    // two requests a second apart can never disagree.
    items.sort((x, y) => (y.score - x.score)
      || (y.hearts - x.hearts)
      || ((y.engagement ?? 0) - (x.engagement ?? 0))
      || (x.content_id < y.content_id ? -1 : x.content_id > y.content_id ? 1 : 0));

    cached = {
      items,
      total_hearts: total,
      engagement_cap: Math.round(cap * 100) / 100,
      engagement_scope: (['audio', 'readable'] as ContentClass[]).filter(rankedInternally),
      generated_at: new Date(now).toISOString(),
    };
    cachedAt = now;
    return cached;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}
