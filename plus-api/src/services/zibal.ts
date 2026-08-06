import { config } from '../config.js';
import { outboundFetch, describeError } from '../providers/outbound.js';

/**
 * The Zibal IPG client — the only place that speaks to the payment gateway.
 *
 * The flow it implements, and the one rule that matters in it:
 *
 *   1. request  -> we hand Zibal an amount and get back a `trackId`
 *   2. start    -> the customer's browser goes to gateway.zibal.ir/start/{trackId}
 *   3. callback -> Zibal sends them back to us with success/trackId/orderId/status
 *   4. verify   -> WE ask Zibal, server to server, whether that payment is real
 *
 * STEP 3 IS NOT EVIDENCE. The callback arrives as query parameters on a URL in
 * the customer's own browser, which means anyone can type it. `success=1` proves
 * nothing whatsoever. Only step 4's answer, fetched over our own connection with
 * our own merchant key, may grant a subscription. Everything in this module is
 * shaped to make that hard to get wrong.
 *
 * FAIL CLOSED. Exactly one result code means "this payment is real and now
 * settled": 100. Every other code, every malformed body, every timeout and every
 * network error resolves to `ok: false`. That includes codes this file may have
 * named wrongly — the documentation is not reachable from the build environment
 * and the tables below were written from prior knowledge, so the design assumes
 * they contain a mistake. A wrong code then costs us a successful payment read
 * as a failure, which a human can put right from the admin panel; the opposite
 * default would cost a subscription granted for money that never arrived.
 *
 * WHY THE CALLS CAN GO THROUGH THEIR OWN PROXY. Zibal's merchant registration
 * whitelists one outbound IP (confirmed by their support, 2026-08-05) and a
 * container platform does not guarantee a stable egress address. Routing only
 * these calls through a fixed-IP host fixes that without moving the rest of the
 * API anywhere. Two shapes of that are supported, and both default to empty so
 * a host with its own fixed IP needs neither:
 *
 *   ZIBAL_API_BASE_URL    a REVERSE proxy the request is addressed to
 *                         (ours: https://pay.dentcast.ir, + ZIBAL_PROXY_TOKEN)
 *   ZIBAL_EGRESS_PROXY_URL  a FORWARD proxy the request is tunnelled through
 *
 * ONLY STEPS 1 AND 4 MOVE. Step 2 is the customer's own browser and always goes
 * to the real gateway — `startUrl()` reads ZIBAL_BASE_URL, never the proxy. Send
 * a browser at the reverse proxy and it gets a 403, because it cannot know the
 * token; and the IP whitelist was never about the customer's connection anyway.
 */

const RESULT_SUCCESS = 100;
const RESULT_ALREADY_VERIFIED = 201;

/**
 * Gateway result codes. Advisory: used for the message shown to a human, never
 * to decide whether a payment counts — that decision reads RESULT_SUCCESS alone.
 * An unlisted code is reported by number rather than swallowed.
 */
const RESULT_MESSAGES: Record<number, string> = {
  100: 'موفق',
  102: 'مرچنت یافت نشد',
  103: 'مرچنت غیرفعال است',
  104: 'مرچنت نامعتبر است',
  201: 'قبلاً تأیید شده است',
  202: 'سفارش پرداخت نشده یا ناموفق بوده است',
  203: 'شناسه پیگیری نامعتبر است',
};

/** Transaction status codes, for the human-readable failure reason. */
const STATUS_MESSAGES: Record<number, string> = {
  '-1': 'در انتظار پرداخت',
  '-2': 'خطای داخلی درگاه',
  1: 'پرداخت شده — تأیید شده',
  2: 'پرداخت شده — تأیید نشده',
  3: 'پرداخت توسط کاربر لغو شد',
  4: 'شماره کارت نامعتبر است',
  5: 'موجودی حساب کافی نیست',
  6: 'رمز واردشده نادرست است',
  7: 'تعداد درخواست بیش از حد مجاز',
  8: 'تعداد پرداخت اینترنتی بیش از حد مجاز',
  9: 'مبلغ پرداخت بیش از حد مجاز',
  10: 'صادرکننده کارت نامعتبر است',
  11: 'خطای سوییچ بانکی',
  12: 'کارت قابل دسترسی نیست',
};

export function resultMessage(result: number | null | undefined): string {
  if (result == null) return 'پاسخی از درگاه دریافت نشد';
  return RESULT_MESSAGES[result] ?? `کد پاسخ درگاه: ${result}`;
}

export function statusMessage(status: number | null | undefined): string | null {
  if (status == null) return null;
  return STATUS_MESSAGES[status] ?? `وضعیت تراکنش: ${status}`;
}

/** True when running against Zibal's sandbox merchant (no money moves). */
export function isSandbox(): boolean {
  return config.zibal.merchant === 'zibal';
}

/** Where the customer's browser is sent after a successful request. */
export function startUrl(trackId: string | number): string {
  return `${config.zibal.baseUrl}/start/${trackId}`;
}

export interface ZibalRequestResult {
  ok: boolean;
  /** Gateway reference for this attempt; present only when ok. */
  trackId: string | null;
  /** Where to send the customer; present only when ok. */
  redirectUrl: string | null;
  result: number | null;
  message: string;
}

export interface ZibalVerifyResult {
  ok: boolean;
  /**
   * Zibal says this payment was verified before. NOT a success and NOT a
   * failure — it means the money is real but somebody has already settled it,
   * so the caller must reconcile against its own ledger rather than act. The
   * one case where guessing would either double-grant or lose a paid month.
   */
  alreadyVerified: boolean;
  result: number | null;
  message: string;
  /**
   * What Zibal says was actually paid, in rial. The caller MUST compare this
   * with the amount it requested before granting anything: the customer travels
   * through the gateway unsupervised, and this is the only figure that reflects
   * what really left their account.
   */
  amountRial: number | null;
  refNumber: string | null;
  paidAt: string | null;
  status: number | null;
  statusText: string | null;
  cardNumber: string | null;
  orderId: string | null;
}

/** POST a JSON body to a gateway endpoint. Never throws — see FAIL CLOSED. */
async function post(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; body: Record<string, unknown>; error: string | null }> {
  try {
    // apiBaseUrl (the fixed-IP reverse proxy) when set, otherwise the gateway
    // itself. NOT startUrl's base — see config.zibal.apiBaseUrl.
    const base = config.zibal.apiBaseUrl || config.zibal.baseUrl;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (config.zibal.proxyToken) headers['x-proxy-token'] = config.zibal.proxyToken;

    const res = await outboundFetch(
      `${base}${path}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ merchant: config.zibal.merchant, ...body }),
      },
      { proxyUrl: config.zibal.egressProxyUrl, timeoutMs: config.zibal.timeoutMs },
    );
    // A non-2xx still carries a JSON error body often enough to be worth
    // reading; the result code below is what decides, not the HTTP status.
    const parsed = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!parsed) {
      // The proxy's own rejection, not the gateway's. Worth naming: a wrong or
      // unset ZIBAL_PROXY_TOKEN otherwise reads as "the gateway is broken" and
      // sends whoever is on call to Zibal's status page instead of to the env.
      if (res.status === 403 && config.zibal.apiBaseUrl) {
        return { ok: false, body: {}, error: 'پروکسی درگاه درخواست را رد کرد — X-Proxy-Token نادرست یا تنظیم‌نشده است' };
      }
      return { ok: false, body: {}, error: `پاسخ نامعتبر از درگاه (HTTP ${res.status})` };
    }
    return { ok: true, body: parsed, error: null };
  } catch (err) {
    return { ok: false, body: {}, error: describeError(err, config.zibal.timeoutMs) };
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function text(v: unknown): string | null {
  return v === null || v === undefined || v === '' ? null : String(v);
}

/**
 * Open a payment. `amountRial` is in RIAL — the unit the gateway expects and the
 * unit `payments.amount_rial` stores, so no conversion happens anywhere between
 * the price list and the bank.
 */
export async function zibalRequest(params: {
  amountRial: number;
  orderId: string;
  description?: string;
  mobile?: string;
  callbackUrl?: string;
}): Promise<ZibalRequestResult> {
  const { ok, body, error } = await post('/v1/request', {
    amount: params.amountRial,
    callbackUrl: params.callbackUrl ?? config.zibal.callbackUrl,
    orderId: params.orderId,
    ...(params.description ? { description: params.description } : {}),
    ...(params.mobile ? { mobile: params.mobile } : {}),
  });

  if (!ok) {
    return { ok: false, trackId: null, redirectUrl: null, result: null, message: error ?? 'خطای ارتباط با درگاه' };
  }

  const result = num(body.result);
  const trackId = text(body.trackId);
  if (result !== RESULT_SUCCESS || !trackId) {
    return { ok: false, trackId: null, redirectUrl: null, result, message: resultMessage(result) };
  }
  return { ok: true, trackId, redirectUrl: startUrl(trackId), result, message: resultMessage(result) };
}

/**
 * Ask the gateway whether a payment is real. This answer, and nothing else, is
 * what may activate a subscription.
 */
export async function zibalVerify(trackId: string): Promise<ZibalVerifyResult> {
  const { ok, body, error } = await post('/v1/verify', { trackId });

  const empty: ZibalVerifyResult = {
    ok: false,
    alreadyVerified: false,
    result: null,
    message: error ?? 'خطای ارتباط با درگاه',
    amountRial: null,
    refNumber: null,
    paidAt: null,
    status: null,
    statusText: null,
    cardNumber: null,
    orderId: null,
  };
  if (!ok) return empty;

  const result = num(body.result);
  const status = num(body.status);
  return {
    // The single place success is decided.
    ok: result === RESULT_SUCCESS,
    alreadyVerified: result === RESULT_ALREADY_VERIFIED,
    result,
    message: resultMessage(result),
    amountRial: num(body.amount),
    refNumber: text(body.refNumber),
    paidAt: text(body.paidAt),
    status,
    statusText: statusMessage(status),
    cardNumber: text(body.cardNumber),
    orderId: text(body.orderId),
  };
}

/** What Zibal puts on the URL it sends the customer back to. Proof of nothing. */
export interface ZibalCallbackParams {
  success: string | null;
  trackId: string | null;
  orderId: string | null;
  status: string | null;
}

export function readCallback(query: Record<string, unknown>): ZibalCallbackParams {
  return {
    success: text(query.success),
    trackId: text(query.trackId),
    orderId: text(query.orderId),
    status: text(query.status),
  };
}
