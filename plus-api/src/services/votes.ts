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
 * ── Why the seed fades, and why globally ────────────────────────────────────
 *
 * The seed is a starting position, not a permanent handicap. If it stayed at
 * full weight, the board would be frozen: the pages with years of accumulated
 * reading would sit on top forever, the first ten hearts would move nothing
 * visible, and a reader who presses a heart and watches nothing happen has been
 * told their vote does not matter. That is the exact failure this feature cannot
 * survive, because the vote IS the feature.
 *
 * So the seed's weight shrinks as real votes accumulate:
 *
 *     weight = SEED_HALF_AT / (SEED_HALF_AT + total hearts on the site)
 *     score  = hearts + weight × seed
 *
 * Two properties of that formula are deliberate and worth stating, because the
 * obvious alternatives get both wrong:
 *
 *   1. The fade is SITE-WIDE, not per item. Fading an item's own seed as its own
 *      hearts grow sounds fairer and is backwards — it would strip the seed from
 *      exactly the pages readers endorsed while leaving it under the pages
 *      nobody voted for, i.e. it would penalise being liked. A global fade moves
 *      every item at once, so the ORDER only ever changes because of votes.
 *
 *   2. A heart is always worth exactly 1. The weight multiplies the seed and
 *      never the votes, so no reader's press is ever diluted, and the sentence
 *      "your heart is one point" stays true for the whole life of the feature.
 *      Only the inherited head start gets smaller.
 *
 * The board hands itself over on its own schedule — no switch-over day, no
 * second commit, no announcement. `seed_weight` is returned to the client so the
 * page can say truthfully what its ordering is currently made of.
 *
 * ── What happens to the seed afterwards ─────────────────────────────────────
 *
 * It is demoted, not retired. Once the weight is small the seed adds nothing to
 * the score, but hearts are small integers, so at that point most of the board
 * is TIES — and a tie has to be broken by something. The seed breaks it (see the
 * comparator in getBoard). It can never outrank a vote, because it is consulted
 * only after hearts are equal; it just replaces the alphabetical fallback that
 * would otherwise be deciding the order of a site's worth of tied pages.
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
 * Total site hearts at which the seed is worth half of what it started at.
 *
 * Sized against the site, not picked round: 443 pages, so a few hundred votes is
 * the point at which most of the board has heard from somebody and the readers'
 * own ordering deserves to lead. Retuning it changes only how fast the handover
 * happens, never the direction.
 */
export const SEED_HALF_AT = 300;

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

// ── the board ───────────────────────────────────────────────────────────────

export interface BoardItem { content_id: string; hearts: number; score: number }
export interface Board {
  items: BoardItem[];
  /** Site-wide hearts — the thing the seed fades against. */
  total_hearts: number;
  /** Current multiplier on the seed, 1 → 0. The page states its ordering from this. */
  seed_weight: number;
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
}

export async function getBoard(now: number = Date.now()): Promise<Board> {
  if (cached && now - cachedAt < CACHE_MS) return cached;

  try {
    const [voteRows, seeds] = await Promise.all([
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

    const weight = SEED_HALF_AT / (SEED_HALF_AT + total);

    const ids = new Set<string>([...hearts.keys(), ...seeds.keys()]);
    const items: BoardItem[] = [];
    for (const id of ids) {
      const h = hearts.get(id) ?? 0;
      const score = h + weight * (seeds.get(id) ?? 0);
      items.push({ content_id: id, hearts: h, score: Math.round(score * 1000) / 1000 });
    }

    // Hearts break a score tie, then the id — so the order is fully determined
    // and two requests a second apart can never disagree about equal items.
    // score → hearts → seed → id.
    //
    // The seed appears TWICE in this ordering, and the second appearance is the
    // point. As a score term it fades to nothing (weight above), which is what
    // hands the board over to the readers. But fading it out of the SORT
    // entirely would leave equal-hearted pages to be separated by
    // `content_id` — alphabetical order, which says nothing about anything and
    // would quietly become the site's ranking for every tie once the weight is
    // small. Ties are not the rare case they look like: hearts are small
    // integers, so the moment the seed stops separating them, most of the board
    // is ties.
    //
    // So the seed is DEMOTED rather than retired: it stops adding to the score
    // and becomes the tiebreaker. Between two pages the readers rated equally,
    // the one more of them actually read, highlighted and passed on goes first —
    // which is the honest answer to "these are tied, now what", and it can never
    // outrank a real vote because it is only ever consulted after hearts.
    //
    // Deliberately NOT exposed in the response: it is an aggregate of reader
    // behaviour per article, and the board only owes the public a heart count.
    items.sort((a, b) => (b.score - a.score)
      || (b.hearts - a.hearts)
      || ((seeds.get(b.content_id) ?? 0) - (seeds.get(a.content_id) ?? 0))
      || (a.content_id < b.content_id ? -1 : a.content_id > b.content_id ? 1 : 0));

    cached = {
      items,
      total_hearts: total,
      seed_weight: Math.round(weight * 1000) / 1000,
      generated_at: new Date(now).toISOString(),
    };
    cachedAt = now;
    return cached;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}
