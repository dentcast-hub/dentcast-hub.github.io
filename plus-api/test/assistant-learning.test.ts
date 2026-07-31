import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { getTags } from '../src/content-index.js';
import {
  hashDescription, recordRound, recordChoice, recordFeedback, learnedBonuses,
  attributeStrongSignals, WEIGHTS, LEARN_CAP, ATTRIBUTION_WINDOW_MIN,
} from '../src/services/assistant-learning.js';

/**
 * The learning loop: what the assistant records, how each signal is weighted,
 * and — the part that matters most — the cap that stops it eating its own tail.
 */

const WORDS = ['روکش', 'سمان'];
const HASH = hashDescription('روکش بیمار مدام می‌افتد');
let seq = 0;

async function makeUser(): Promise<string> {
  seq += 1;
  const r = await pool.query<{ id: string }>(
    `insert into profiles (display_name, tier) values ($1, 'premium') returning id`,
    [`assist-u${seq}`],
  );
  return r.rows[0].id;
}

async function scoreOf(word: string, tagKey: string): Promise<number> {
  const r = await pool.query<{ score: number; events: number }>(
    'select score, events from assistant_tag_scores where word = $1 and tag_key = $2',
    [word, tagKey],
  );
  return r.rows[0]?.score ?? 0;
}

/** A real site tag, so attribution has real content ids to look for. */
const TAG = getTags().find((t) => t.contentIds.length > 0)!;

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await pool.end(); });

describe('recording a round', () => {
  it('stores a hash and keyword tokens, never the description itself', async () => {
    const userId = await makeUser();
    const id = await recordRound({
      userId, descHash: HASH, words: WORDS, roundNo: 0,
      offered: [{ key: 'tag:a', label: 'الف', position: 1 }],
      resolvedTag: null,
    });
    expect(id).toBeTruthy();

    const row = await pool.query('select * from assistant_rounds where id = $1', [id]);
    const stored = JSON.stringify(row.rows[0]);
    expect(stored).toContain(HASH);
    expect(stored, 'the raw case text must never be persisted').not.toContain('بیمار مدام');
  });
});

describe('signal weights', () => {
  it('a "none of these" answer penalises every option that was offered', async () => {
    const userId = await makeUser();
    await recordRound({
      userId, descHash: HASH, words: WORDS, roundNo: 0,
      offered: [
        { key: 'tag:a', label: 'الف', position: 1 },
        { key: 'tag:b', label: 'ب', position: 2 },
      ],
      resolvedTag: null,
    });

    await recordChoice({ userId, descHash: HASH, roundNo: 0, chosenKey: null });

    // The complaint is about the whole slate, so both options take it.
    expect(await scoreOf('روکش', 'tag:a')).toBe(WEIGHTS.custom_answer);
    expect(await scoreOf('سمان', 'tag:b')).toBe(WEIGHTS.custom_answer);
  });

  it('discounts a click by its position, so the top option cannot self-confirm', async () => {
    const userId = await makeUser();
    const id = (await recordRound({
      userId, descHash: HASH, words: ['روکش'], roundNo: 0,
      offered: [
        { key: 'first', label: 'اول', position: 1 },
        { key: 'fourth', label: 'چهارم', position: 4 },
      ],
      resolvedTag: null,
    }))!;

    await recordFeedback({ userId, roundId: id, kind: 'click', optionKey: 'first' });
    await recordFeedback({ userId, roundId: id, kind: 'click', optionKey: 'fourth' });

    const top = await scoreOf('روکش', 'first');
    const low = await scoreOf('روکش', 'fourth');
    expect(top).toBeCloseTo(WEIGHTS.click / 1, 5);
    expect(low).toBeCloseTo(WEIGHTS.click / 4, 5);
    expect(low, 'a click further down is worth LESS, not more, in raw terms').toBeLessThan(top);
  });

  it('records an explicit verdict once, and a second press cannot double-count', async () => {
    const userId = await makeUser();
    const id = (await recordRound({
      userId, descHash: HASH, words: ['روکش'], roundNo: 1, offered: [], resolvedTag: 'tag-x',
    }))!;

    await recordFeedback({ userId, roundId: id, kind: 'down' });
    await recordFeedback({ userId, roundId: id, kind: 'down' });
    await recordFeedback({ userId, roundId: id, kind: 'up' });

    expect(await scoreOf('روکش', 'tag-x')).toBe(WEIGHTS.feedback_down);
  });

  it('ignores a round belonging to somebody else', async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const id = (await recordRound({
      userId: owner, descHash: HASH, words: ['روکش'], roundNo: 0, offered: [], resolvedTag: 'tag-y',
    }))!;

    expect(await recordFeedback({ userId: stranger, roundId: id, kind: 'up' })).toBe(false);
    expect(await scoreOf('روکش', 'tag-y')).toBe(0);
  });
});

describe('the learned nudge', () => {
  it('is capped, so history can reorder near-ties but never override the match', async () => {
    const userId = await makeUser();

    // Pile on far more positive signal than any real tag would ever collect.
    for (let i = 0; i < 60; i += 1) {
      const id = (await recordRound({
        userId, descHash: HASH, words: ['روکش'], roundNo: 0, offered: [], resolvedTag: 'runaway',
      }))!;
      await recordFeedback({ userId, roundId: id, kind: 'up' });
    }

    const bonus = (await learnedBonuses(['روکش'])).get('runaway') ?? 0;
    expect(bonus).toBeLessThanOrEqual(LEARN_CAP);
    expect(bonus).toBeCloseTo(LEARN_CAP, 5);
  });

  it('is symmetric: a badly-received tag is pushed down, not merely un-boosted', async () => {
    const userId = await makeUser();
    for (let i = 0; i < 60; i += 1) {
      const id = (await recordRound({
        userId, descHash: HASH, words: ['روکش'], roundNo: 0, offered: [], resolvedTag: 'bad',
      }))!;
      await recordFeedback({ userId, roundId: id, kind: 'down' });
    }

    const bonus = (await learnedBonuses(['روکش'])).get('bad') ?? 0;
    expect(bonus).toBeCloseTo(-LEARN_CAP, 5);
  });

  it('says nothing about words it has never seen', async () => {
    expect((await learnedBonuses(['واژه‌ی‌ناشناخته'])).size).toBe(0);
    expect((await learnedBonuses([])).size).toBe(0);
  });
});

describe('attribution of strong signals', () => {
  /** A resolved round, backdated so its attribution window has closed. */
  async function resolvedRound(userId: string, minutesAgo: number): Promise<string> {
    const id = (await recordRound({
      userId, descHash: HASH, words: ['روکش'], roundNo: 1, offered: [], resolvedTag: TAG.key,
    }))!;
    await pool.query(
      `update assistant_rounds set created_at = now() - ($2 || ' minutes')::interval where id = $1`,
      [id, String(minutesAgo)],
    );
    return id;
  }

  it('credits a highlight on the recommended content to the round that suggested it', async () => {
    const userId = await makeUser();
    await resolvedRound(userId, ATTRIBUTION_WINDOW_MIN + 5);
    await pool.query(
      `insert into user_activity (user_id, action, content_id, created_at)
       values ($1, 'highlight_created', $2, now() - interval '20 minutes')`,
      [userId, TAG.contentIds[0]],
    );

    const res = await attributeStrongSignals(new Date());
    expect(res.credited).toBe(1);
    expect(await scoreOf('روکش', TAG.key)).toBe(WEIGHTS.highlight_created);
  });

  it('counts only the strongest signal, never the sum', async () => {
    const userId = await makeUser();
    await resolvedRound(userId, ATTRIBUTION_WINDOW_MIN + 5);
    for (const action of ['article_completed', 'highlight_created']) {
      await pool.query(
        `insert into user_activity (user_id, action, content_id, created_at)
         values ($1, $2, $3, now() - interval '20 minutes')`,
        [userId, action, TAG.contentIds[0]],
      );
    }

    await attributeStrongSignals(new Date());
    // One article read AND kept is one success, not two.
    expect(await scoreOf('روکش', TAG.key)).toBe(WEIGHTS.highlight_created);
  });

  it('applies the small abandoned penalty when nothing at all followed', async () => {
    const userId = await makeUser();
    await resolvedRound(userId, ATTRIBUTION_WINDOW_MIN + 5);

    const res = await attributeStrongSignals(new Date());
    expect(res.credited).toBe(0);
    expect(await scoreOf('روکش', TAG.key)).toBe(WEIGHTS.abandoned);
  });

  it('leaves a round alone until its attribution window has closed', async () => {
    const userId = await makeUser();
    await resolvedRound(userId, 5); // still inside the 30-minute window

    const res = await attributeStrongSignals(new Date());
    expect(res.rounds).toBe(0);
    expect(await scoreOf('روکش', TAG.key)).toBe(0);
  });

  it('is idempotent — a second sweep does not credit the same round twice', async () => {
    const userId = await makeUser();
    await resolvedRound(userId, ATTRIBUTION_WINDOW_MIN + 5);
    await pool.query(
      `insert into user_activity (user_id, action, content_id, created_at)
       values ($1, 'highlight_created', $2, now() - interval '20 minutes')`,
      [userId, TAG.contentIds[0]],
    );

    await attributeStrongSignals(new Date());
    await attributeStrongSignals(new Date());

    expect(await scoreOf('روکش', TAG.key)).toBe(WEIGHTS.highlight_created);
  });
});
