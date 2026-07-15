import type { SmsSender } from './types.js';

/**
 * Dev SMS sender: prints the OTP to the API console instead of sending an SMS.
 * This is the `SMS_PROVIDER=console` implementation the spec asks for in dev.
 */
export class ConsoleSmsSender implements SmsSender {
  readonly name = 'console';

  async sendOtp(phone: string, code: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`\n[OTP] phone=${phone} code=${code}\n`);
  }
}
