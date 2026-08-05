import type { SmsSender, TemplateParam } from './types.js';

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

  async sendTemplate(phone: string, templateId: number, params: TemplateParam[]): Promise<void> {
    const shown = params.map((p) => `${p.name}=${p.value}`).join(' ');
    // eslint-disable-next-line no-console
    console.log(`\n[SMS] phone=${phone} template=${templateId} ${shown}\n`);
  }
}
