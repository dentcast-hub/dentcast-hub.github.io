import { describe, it, expect } from 'vitest';
import {
  shieldCost, shieldThreshold, shieldsGranted, freezesAvailable, pointsToNextFreeze,
  SHIELD_BASE, SHIELD_STEP,
} from '../src/services/score.js';

// The shield ladder, pinned without a database: each shield costs SHIELD_STEP
// more than the one before it, and there is no holding cap — the rising price
// is what limits hoarding.

describe('shieldCost / shieldThreshold', () => {
  it('charges more for every next shield', () => {
    expect(shieldCost(1)).toBe(SHIELD_BASE);          // 200
    expect(shieldCost(2)).toBe(SHIELD_BASE + SHIELD_STEP);      // 250
    expect(shieldCost(3)).toBe(SHIELD_BASE + 2 * SHIELD_STEP);  // 300
  });
  it('accumulates those costs into the score needed to hold n', () => {
    expect(shieldThreshold(0)).toBe(0);
    expect(shieldThreshold(1)).toBe(200);
    expect(shieldThreshold(2)).toBe(450);   // 200 + 250
    expect(shieldThreshold(3)).toBe(750);   // + 300
    expect(shieldThreshold(4)).toBe(1100);  // + 350
    expect(shieldThreshold(5)).toBe(1500);  // + 400
  });
});

describe('shieldsGranted', () => {
  it('unlocks nothing before the first threshold', () => {
    expect(shieldsGranted(0)).toBe(0);
    expect(shieldsGranted(199)).toBe(0);
  });
  it('unlocks each shield exactly at its threshold', () => {
    expect(shieldsGranted(200)).toBe(1);
    expect(shieldsGranted(449)).toBe(1);
    expect(shieldsGranted(450)).toBe(2);
    expect(shieldsGranted(1499)).toBe(4);
    expect(shieldsGranted(1500)).toBe(5);
  });
  it('slows down as the score grows (the price ladder is the limiter)', () => {
    // ~a year of daily activity with no highlights: 365 days * 10 = 3650.
    expect(shieldsGranted(3650)).toBe(9);
    // ...and doubling the score does NOT double the shields.
    expect(shieldsGranted(7300)).toBe(13);
  });
});

describe('freezesAvailable', () => {
  it('is simply granted minus spent — no cap, no clamping surprise', () => {
    expect(freezesAvailable(450, 0)).toBe(2);
    expect(freezesAvailable(450, 1)).toBe(1);
    expect(freezesAvailable(450, 2)).toBe(0);
    expect(freezesAvailable(1500, 0)).toBe(5);
  });
  it('never goes negative on legacy over-spend', () => {
    expect(freezesAvailable(200, 3)).toBe(0);
  });
  it('makes a spent shield cost the NEXT rung, never the one just paid', () => {
    // Held 2 at 450 and spent one: getting back to 2 needs the third rung
    // (750), i.e. 300 more points — not another 250.
    expect(freezesAvailable(450, 1)).toBe(1);
    expect(freezesAvailable(749, 1)).toBe(1);
    expect(freezesAvailable(750, 1)).toBe(2);
  });
});

describe('pointsToNextFreeze', () => {
  it('always has a next shield to count toward (score never goes idle)', () => {
    expect(pointsToNextFreeze(0)).toBe(200);
    expect(pointsToNextFreeze(199)).toBe(1);
    expect(pointsToNextFreeze(200)).toBe(250);   // 450 - 200
    expect(pointsToNextFreeze(450)).toBe(300);   // 750 - 450
    expect(pointsToNextFreeze(3650)).toBe(shieldThreshold(10) - 3650);
  });
});
