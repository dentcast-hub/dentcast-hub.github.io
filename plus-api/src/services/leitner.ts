/**
 * Leitner scheduling math (spec section 1 + 4): boxes 1..5, intervals in days
 * 1/3/7/14/30. A "remembered" grade advances one box (capped at 5); a "forgot"
 * grade drops straight back to box 1. This is the only place box transitions
 * are computed, so `POST /review/answer` stays a thin wrapper around it.
 */

export const BOX_INTERVAL_DAYS = [1, 3, 7, 14, 30]; // index 0 = box 1
export const MAX_BOX = BOX_INTERVAL_DAYS.length;

export type ReviewResult = 'remembered' | 'forgot';

export function nextBox(currentBox: number, result: ReviewResult): number {
  if (result === 'forgot') return 1;
  return Math.min(currentBox + 1, MAX_BOX);
}

export function intervalDaysForBox(box: number): number {
  const idx = Math.min(Math.max(box, 1), MAX_BOX) - 1;
  return BOX_INTERVAL_DAYS[idx];
}
