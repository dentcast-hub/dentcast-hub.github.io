/**
 * Provider-agnostic SMS sender. OTP is the only thing sent over SMS. Switching
 * from the dev console sender to an Iranian provider (sms.ir, Kavenegar, ...) is
 * a change of implementation here plus one env var, never a change to business
 * logic. Callers depend on this interface, not a concrete provider.
 */
export interface SmsSender {
  readonly name: string;
  /** Deliver a one-time code to a phone number (already normalized to 09XXXXXXXXX). */
  sendOtp(phone: string, code: string): Promise<void>;
}
