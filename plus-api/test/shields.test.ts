import { describe, it, expect } from 'vitest';
import {
  foldShieldBalance, thresholdsCrossed, pointsToNextFreeze,
  SHIELD_CAP, SHIELD_POINTS,
} from '../src/services/score.js';

// Pure shield-ceiling tests: no database, so the rule itself is pinned down
// independently of the query that feeds it. `grantsAtSpends[i]` is how many
// SHIELD_POINTS thresholds the score had crossed at the i-th spend.
const at = (score: number) => thresholdsCrossed(score);

describe('thresholdsCrossed', () => {
  it('counts one grant per SHIELD_POINTS crossed', () => {
    expect(at(0)).toBe(0);
    expect(at(SHIELD_POINTS - 1)).toBe(0);
    expect(at(SHIELD_POINTS)).toBe(1);
    expect(at(400)).toBe(2);   // 150 and 300
    expect(at(450)).toBe(3);
  });
});

describe('foldShieldBalance', () => {
  it('holds one shield per threshold, up to the cap', () => {
    expect(foldShieldBalance(at(0), [])).toBe(0);
    expect(foldShieldBalance(at(150), [])).toBe(1);
    expect(foldShieldBalance(at(400), [])).toBe(SHIELD_CAP);
  });

  it('does not refill a spend from an already-crossed threshold', () => {
    // 400 points, two shields, spend one: the 150 and 300 thresholds are used
    // up, so the slot stays empty until the score reaches 450.
    expect(foldShieldBalance(at(400), [at(400)])).toBe(1);
    expect(foldShieldBalance(at(449), [at(400)])).toBe(1);
    expect(foldShieldBalance(at(450), [at(400)])).toBe(SHIELD_CAP);
  });

  it('BURNS a grant that lands while both slots are full (the cap is hard)', () => {
    // 900 points = 6 thresholds, never spent. Four of them landed on a full
    // pair and are gone: the first spend must leave 1, not 2, and a user can
    // never absorb more than SHIELD_CAP missed days back to back.
    expect(foldShieldBalance(at(900), [])).toBe(SHIELD_CAP);
    expect(foldShieldBalance(at(900), [at(900)])).toBe(1);
    expect(foldShieldBalance(at(900), [at(900), at(900)])).toBe(0);
    // ...and the next threshold (1050) gives exactly one back.
    expect(foldShieldBalance(at(1050), [at(900), at(900)])).toBe(1);
  });

  it('never exceeds the cap or drops below zero', () => {
    expect(foldShieldBalance(at(10_000), [])).toBe(SHIELD_CAP);
    // legacy rows: spends recorded under the old (stockpiling) rule can exceed
    // what the strict fold would have allowed — they clamp instead of going
    // negative, so the balance simply starts empty.
    expect(foldShieldBalance(at(300), [at(300), at(300), at(300)])).toBe(0);
  });

  it('accumulates grants earned between two spends', () => {
    // spend at 150, then score climbs past 300 and 450 before the next spend
    expect(foldShieldBalance(at(450), [at(150)])).toBe(SHIELD_CAP);
    expect(foldShieldBalance(at(450), [at(150), at(450)])).toBe(1);
  });
});

describe('pointsToNextFreeze', () => {
  it('counts to the next absolute threshold, not a fresh SHIELD_POINTS', () => {
    expect(pointsToNextFreeze(400, 1)).toBe(50);   // 450 is the next multiple
    expect(pointsToNextFreeze(449, 1)).toBe(1);
    expect(pointsToNextFreeze(300, 1)).toBe(SHIELD_POINTS);
  });
  it('is null once the cap is held (nothing to wait for)', () => {
    expect(pointsToNextFreeze(400, SHIELD_CAP)).toBeNull();
  });
});
