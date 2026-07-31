import { createHash } from 'node:crypto';
import { query, one, type Queryable, pool } from '../db.js';
import { getTags } from '../content-index.js';

/**
 * What the assistant learns from, and how much each thing is worth.
 *
 * The problem this solves: the narrowing algorithm is static — it scores a site
 * tag by how much of it the AI's suggested words cover, and deliberately breaks
 * ties AGAINST popularity so a niche tag is not buried under a broad one. That
 * is a good prior, but it never improves. This module adds the missing half: a
 * record of what actually happened after each round, aggregated per
 * (word -> tag), fed back as a BOUNDED nudge to the ranking.
 *
 * Bounded is the whole design. The learned bonus is capped (LEARN_CAP) well
 * below the range of a real match score, so it can reorder near-ties — exactly
 * where the static algorithm has no opinion — but can never promote a tag the
 * words do not actually match. Without that cap the loop eats its own tail: the
 * tag shown first gets picked most, so it scores highest, so it is shown first.
 *
 * Privacy: the description itself is never stored. Rounds are keyed by a sha256
 * of the normalised text, and the only text kept is the normalised keyword
 * tokens the tag match already ran on — specialist topic words, not prose.
 */

/** Signal weights. Tuned to the ladder: a click is a maybe, a highlight is
 *  "worth keeping", a review card is "worth memorising". Negative signals are
 *  heavier than their positive twins because they are rarer and unambiguous —
 *  we are hunting for failures, not collecting praise. */
export const WEIGHTS = {
  /** Divided by the option's 1-based position, so a click on a lower option —
   *  one the user scrolled past better-ranked ones to reach — counts for more.
   *  Without that discount, clicks only ever confirm the existing order. */
  click: 1,
  feedback_up: 5,
  article_completed: 5,
  highlight_created: 10,
  review_card: 15,
  /** "None of these" — the sharpest negative there is: the user is telling us
   *  every option we offered was wrong, with no attribution window needed. */
  custom_answer: -5,
  feedback_down: -10,
  /** Resolved, then nothing at all happened. */
  abandoned: -1,
} as const;

/** Ceiling on how far learning may move a tag's match score (which runs 0..1). */
export const LEARN_CAP = 0.25;
/** Score at which a (word, tag) pair reaches the full LEARN_CAP nudge. */
const LEARN_SATURATION = 40;
/** How long after a resolved round a strong signal still counts as caused by it. */
export const ATTRIBUTION_WINDOW_MIN = 30;

/** sha256 of the normalised text. The text itself is never persisted. */
export function hashDescription(normalised: string): string {
  return createHash('sha256').update(normalised).digest('hex');
}

export interface OfferedOption { key: string; label: string; position: number }

/** Record a round the assistant just showed. Returns its id for the client to
 *  echo back with a click or an explicit thumbs up/down. */
export async function recordRound(input: {
  userId: string;
  descHash: string;
  words: string[];
  roundNo: number;
  offered: OfferedOption[];
  resolvedTag: string | null;
}, client: Queryable = pool): Promise<string | null> {
  const row = await one<{ id: string }>(
    `insert into assistant_rounds (user_id, desc_hash, words, round_no, offered, resolved_tag)
     values ($1, $2, $3, $4, $5::jsonb, $6)
     returning id`,
    [
      input.userId, input.descHash, input.words, input.roundNo,
      JSON.stringify(input.offered), input.resolvedTag,
    ],
    client,
  );
  return row?.id ?? null;
}

/**
 * The user answered the previous round. Called on the NEXT request, where the
 * history's last entry IS that answer — so recording a choice costs the client
 * nothing and cannot be forgotten by it.
 *
 * A custom ("none of these") answer credits every option we offered with the
 * negative weight: the complaint is about the whole slate, not one option.
 */
export async function recordChoice(input: {
  userId: string;
  descHash: string;
  roundNo: number;
  chosenKey: string | null;
}): Promise<void> {
  const round = await one<{ id: string; words: string[]; offered: OfferedOption[] }>(
    // $4 is cast explicitly: it arrives as NULL for a "none of these" answer and
    // is read both as a value and by `is null`, which leaves Postgres no way to
    // infer its type on its own.
    `update assistant_rounds
        set chosen_key = $4::text, was_custom = ($4::text is null)
      where user_id = $1 and desc_hash = $2 and round_no = $3 and chosen_key is null and was_custom = false
      returning id, words, offered`,
    [input.userId, input.descHash, input.roundNo, input.chosenKey],
  );
  if (!round) return;

  if (input.chosenKey === null) {
    for (const o of round.offered) await credit(round.words, o.key, WEIGHTS.custom_answer);
  }
}

/** An explicit thumbs up/down, or a click on one of the offered options. */
export async function recordFeedback(input: {
  userId: string;
  roundId: string;
  kind: 'up' | 'down' | 'click';
  optionKey?: string;
}): Promise<boolean> {
  const round = await one<{ id: string; words: string[]; offered: OfferedOption[]; resolved_tag: string | null; feedback: string | null }>(
    'select id, words, offered, resolved_tag, feedback from assistant_rounds where id = $1 and user_id = $2',
    [input.roundId, input.userId],
  );
  if (!round) return false;

  if (input.kind === 'click') {
    const opt = round.offered.find((o) => o.key === input.optionKey);
    // Position discount: the further down it was, the more a click means.
    const weight = WEIGHTS.click / Math.max(1, opt?.position ?? 1);
    await credit(round.words, input.optionKey ?? round.resolved_tag ?? '', weight);
    await query('update assistant_rounds set clicked_at = now() where id = $1', [round.id]);
    return true;
  }

  // One verdict per round: a second press must not double-count.
  if (round.feedback) return true;
  await query('update assistant_rounds set feedback = $2 where id = $1', [round.id, input.kind]);
  const weight = input.kind === 'up' ? WEIGHTS.feedback_up : WEIGHTS.feedback_down;
  await credit(round.words, round.resolved_tag ?? '', weight);
  return true;
}

/** Add `delta` to a (word, tag) pair for every word of the round. */
async function credit(words: string[], tagKey: string, delta: number): Promise<void> {
  if (!tagKey || !words.length || !delta) return;
  await query(
    `insert into assistant_tag_scores (word, tag_key, score, events)
     select w, $2, $3, 1 from unnest($1::text[]) as w
     on conflict (word, tag_key) do update
       set score = assistant_tag_scores.score + excluded.score,
           events = assistant_tag_scores.events + 1,
           updated_at = now()`,
    [words, tagKey, delta],
  );
}

/**
 * The learned nudge for a set of suggested words: a map of tag_key -> bonus in
 * [-LEARN_CAP, +LEARN_CAP]. Saturating rather than linear, so a pair with a
 * huge history cannot run away from one with a merely good history.
 */
export async function learnedBonuses(words: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!words.length) return out;

  const res = await query<{ tag_key: string; total: number }>(
    `select tag_key, sum(score)::float as total
       from assistant_tag_scores
      where word = any($1::text[])
      group by tag_key`,
    [words],
  );
  for (const r of res.rows) {
    const ratio = Math.max(-1, Math.min(1, r.total / LEARN_SATURATION));
    out.set(r.tag_key, ratio * LEARN_CAP);
  }
  return out;
}

/**
 * Credit the strong signals — the ones the client cannot be trusted to report
 * and should not have to. Looks for a qualifying action on content that belongs
 * to a resolved round's tag, inside the attribution window after it.
 *
 * Run on a schedule rather than in the request path: attribution is inherently
 * after-the-fact (the user has to go and read something first), and a sweep is
 * idempotent — `attributed_at` marks a round as counted exactly once.
 *
 * A resolved round that reaches the end of the window with nothing at all gets
 * the small `abandoned` penalty. That is not the same as a bad answer, which is
 * why it is -1 and not -10.
 */
export async function attributeStrongSignals(now: Date = new Date()): Promise<{
  rounds: number; credited: number;
}> {
  const cutoff = new Date(now.getTime() - ATTRIBUTION_WINDOW_MIN * 60_000);
  const due = await query<{ id: string; user_id: string; words: string[]; resolved_tag: string; created_at: string }>(
    `select id, user_id, words, resolved_tag, created_at
       from assistant_rounds
      where resolved_tag is not null and attributed_at is null and created_at <= $1
      order by created_at
      limit 500`,
    [cutoff.toISOString()],
  );

  let credited = 0;
  for (const r of due.rows) {
    const tag = getTags().find((t) => t.key === r.resolved_tag);
    const contentIds = tag?.contentIds ?? [];
    let best = 0;

    if (contentIds.length) {
      // The window end is computed here rather than in SQL: expressing it as
      // `$2 || ' minutes'` left Postgres unable to infer the parameter's type.
      const from = new Date(r.created_at);
      const to = new Date(from.getTime() + ATTRIBUTION_WINDOW_MIN * 60_000);
      const acts = await query<{ action: string }>(
        `select distinct action from user_activity
          where user_id = $1
            and created_at > $2::timestamptz and created_at <= $3::timestamptz
            and content_id = any($4::text[])
            and action in ('article_completed', 'highlight_created', 'review_finished', 'card_reviewed_manual')`,
        [r.user_id, from.toISOString(), to.toISOString(), contentIds],
      );
      for (const a of acts.rows) {
        if (a.action === 'highlight_created') best = Math.max(best, WEIGHTS.highlight_created);
        else if (a.action === 'article_completed') best = Math.max(best, WEIGHTS.article_completed);
        else best = Math.max(best, WEIGHTS.review_card);
      }
    }

    // Only the STRONGEST signal counts, never the sum: one article read, kept
    // and turned into a card is one success, not three.
    await credit(r.words, r.resolved_tag, best || WEIGHTS.abandoned);
    if (best) credited += 1;
    await query('update assistant_rounds set attributed_at = now() where id = $1', [r.id]);
  }

  return { rounds: due.rowCount ?? 0, credited };
}
