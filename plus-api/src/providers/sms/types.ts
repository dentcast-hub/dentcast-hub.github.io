/**
 * Provider-agnostic SMS sender. Switching from the dev console sender to an
 * Iranian provider (sms.ir, Kavenegar, ...) is a change of implementation here
 * plus one env var, never a change to business logic. Callers depend on this
 * interface, not a concrete provider.
 *
 * EVERYTHING IS A TEMPLATE, not free text. Iranian service lines only carry
 * pre-registered templates with named parameters — free-text sending belongs to
 * bulk advertising lines, which a renewal reminder must never go out on. So the
 * second method below is not "send a message", it is "fill in template N".
 */
export interface TemplateParam { name: string; value: string }

export interface SmsSender {
  readonly name: string;
  /** Deliver a one-time code to a phone number (already normalized to 09XXXXXXXXX). */
  sendOtp(phone: string, code: string): Promise<void>;
  /**
   * Fill in a pre-registered template. Used for the subscription reminder, the
   * one notification worth paying for when a user has no messenger connected.
   */
  sendTemplate(phone: string, templateId: number, params: TemplateParam[]): Promise<void>;
}
