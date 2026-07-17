import type { SmsSender } from './types.js';
import { config } from '../../config.js';

/**
 * SMS.ir OTP sender (production). Uses the template-based "verify" endpoint,
 * which Iranian regulation requires for one-time codes (sent from high-priority
 * service lines, not bulk lines):
 *
 *   POST https://api.sms.ir/v1/send/verify
 *   header  x-api-key: <key>
 *   body    { mobile, templateId, parameters: [{ name, value }] }
 *   ok      HTTP 200 + JSON { status: 1, message, data: { messageId, cost } }
 *
 * Create a template in the SMS.ir panel with ONE parameter (default name
 * "CODE") whose value is the code, then put the numeric template id in
 * SMSIR_TEMPLATE_ID and (if the parameter isn't named CODE) SMSIR_PARAM_NAME.
 * Selected by SMS_PROVIDER=smsir; nothing else in the auth flow changes.
 */
export class SmsIrSender implements SmsSender {
  readonly name = 'smsir';

  private readonly apiKey = config.otp.smsir.apiKey;
  private readonly templateId = config.otp.smsir.templateId;
  private readonly paramName = config.otp.smsir.paramName;
  private readonly endpoint = 'https://api.sms.ir/v1/send/verify';

  constructor() {
    // Fail fast at startup rather than on the first login attempt.
    if (!this.apiKey) throw new Error('SMSIR_API_KEY is required for SMS_PROVIDER=smsir');
    if (!this.templateId) throw new Error('SMSIR_TEMPLATE_ID is required for SMS_PROVIDER=smsir');
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          mobile: phone,
          templateId: this.templateId,
          parameters: [{ name: this.paramName, value: code }],
        }),
      });
    } catch (err) {
      // Never leak the OTP into logs; surface only the transport failure.
      throw new Error(`SMS.ir request failed: ${(err as Error).message}`);
    }

    // SMS.ir replies HTTP 200 with a JSON envelope; status === 1 means sent.
    type SmsIrResponse = { status?: number | string; message?: string };
    let body: SmsIrResponse | null = null;
    try { body = (await res.json()) as SmsIrResponse; } catch { /* non-JSON error page */ }

    const ok = res.ok && body != null && (body.status === 1 || body.status === '1');
    if (!ok) {
      const reason = (body && body.message) || `HTTP ${res.status}`;
      throw new Error(`SMS.ir send failed: ${reason}`);
    }
  }
}
