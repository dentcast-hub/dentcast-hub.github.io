import crypto from 'node:crypto';
import { config } from '../config.js';

/**
 * In-process OTP store. Codes live ~2 minutes (config.otp.ttlSeconds). Kept out
 * of the DB because the schema is fixed to spec section 4; fine for the single
 * Phase 1 container. Verification is attempt-limited to blunt brute force.
 */

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, OtpEntry>();
const MAX_VERIFY_ATTEMPTS = 5;

function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out;
}

/** Create and store a fresh code for a phone, replacing any previous one. */
export function issueCode(phone: string, now = Date.now()): string {
  const code = randomCode(config.otp.length);
  store.set(phone, { code, expiresAt: now + config.otp.ttlSeconds * 1000, attempts: 0 });
  return code;
}

export type VerifyResult = 'ok' | 'no_code' | 'expired' | 'mismatch' | 'too_many_attempts';

/** Check a submitted code. On success the code is consumed (single use). */
export function verifyCode(phone: string, code: string, now = Date.now()): VerifyResult {
  const entry = store.get(phone);
  if (!entry) return 'no_code';
  if (now > entry.expiresAt) {
    store.delete(phone);
    return 'expired';
  }
  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    store.delete(phone);
    return 'too_many_attempts';
  }
  entry.attempts += 1;
  // constant-time compare to avoid leaking match progress
  const a = Buffer.from(entry.code);
  const b = Buffer.from(code ?? '');
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!match) return 'mismatch';
  store.delete(phone);
  return 'ok';
}

/** Test-only: peek at the active code without consuming it. */
export function peekCode(phone: string): string | null {
  return store.get(phone)?.code ?? null;
}

export function clearOtpStore(): void {
  store.clear();
}
