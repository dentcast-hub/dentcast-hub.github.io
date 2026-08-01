import { config } from '../../config.js';
import { outboundFetch, describeError } from '../outbound.js';
import type { AiProvider, NarrowRoundInput, NarrowRoundResult } from './types.js';

// The model is told the shape it must answer in; JSON mode (where the endpoint
// supports it) makes that a hard guarantee instead of a request. Either way we
// never trust the parse blindly — see the validation below.
const NARROW_SYSTEM_PROMPT = `تو یک دسته‌بند باریک‌بین برای سایت آموزش دندانپزشکی دنت‌کست هستی، نه یک دستیار بالینی. کاربر (یک دندان‌پزشک) وضعیت یک بیمار را با متن آزاد شرح می‌دهد. کارِ تو فقط این است: بین گزینه‌های داده‌شده (فهرست catalog) کدام‌ها به شرحِ او نزدیک‌ترند را برای یک سؤالِ چندگزینه‌ای انتخاب کنی، تا مرحله‌به‌مرحله موضوع را دقیق‌تر کنی و در نهایت به مقاله‌ی درستِ سایت برسی.
قوانین سخت:
- هرگز تشخیص، توصیه‌ی درمانی یا نظرِ بالینی نده. تو فقط مسیر را به محتوای منتشرشده‌ی خودِ سایت نشان می‌دهی.
- گزینه‌هایی که برمی‌گردانی باید دقیقاً از میان کلیدهای catalog داده‌شده باشند؛ هرگز کلید یا موضوع تازه نساز.
- اگر اطلاعات کافی برای رسیدن به یک دسته‌ی روشن داری، done را true برگردان.
- فقط یک شیء JSON برگردان، دقیقاً به این شکل: {"done": false, "question": "...", "options": ["<یکی از کلیدهای catalog>", ...]} یا {"done": true}.`;

// Asks for at most FOUR phrases, not eight. This is a reasoning model: it emits
// a full thinking pass before its answer, so the response length is a direct
// latency cost, and four good keywords already saturate the tag match (the
// shortlist is capped at four options anyway).
//
// A separate, narrower prompt: this call never sees a catalog and never picks
// anything — it only reads free text and proposes candidate topic phrases in
// the site's own hashtag style. services/case-assistant.ts matches those
// against the REAL site hashtags in code; the model itself has no way to
// point at content that doesn't actually carry a matching tag.
const KEYWORDS_SYSTEM_PROMPT = `تو یک استخراج‌کننده‌ی کلیدواژه برای سایت آموزش دندانپزشکی دنت‌کست هستی، نه یک دستیار بالینی. کاربر (یک دندان‌پزشک) وضعیت یک بیمار یا موضوع مورد نظرش را با متن آزاد شرح می‌دهد.
کارِ تو فقط این است: از این متن، حداکثر ۴ عبارتِ کوتاهِ فارسیِ تخصصیِ دندان‌پزشکی (هرکدام ۱ تا ۳ کلمه) استخراج یا پیشنهاد کنی که احتمالاً به‌عنوان هشتگِ محتوای سایت به‌کار رفته باشند — دقیقاً در سبکِ هشتگ‌های خودِ سایت (مثل «زینک فسفات»، «سمان ایمپلنت»، «اکلوژن»).
قوانین سخت:
- هرگز تشخیص، توصیه‌ی درمانی یا نظرِ بالینی نده.
- فقط عبارت‌های موضوعی/تخصصی بده، نه جمله؛ هیچ عبارتی را تکرار نکن.
- فقط یک شیء JSON برگردان، دقیقاً به این شکل: {"keywords": ["...", "..."]}.`;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * A failure worth trying again. The ArvanCloud gateway intermittently answers a
 * perfectly valid request with a generic 400 ("The request contained invalid
 * input") that succeeds unchanged moments later, so 400 is treated as transient
 * HERE — unusual, and deliberate. The cost of being wrong is bounded: a
 * genuinely malformed request just fails after `maxAttempts` instead of once,
 * and every retry is logged, so a permanent 400 shows up as a repeated line
 * rather than a silent stall.
 *
 * Auth and routing failures (401/403/404) are NOT retryable: those mean the key
 * or the gateway URL is wrong, and repeating the call only delays a clear error.
 */
class TransientAiError extends Error {}

const RETRYABLE_STATUS = new Set([400, 408, 409, 425, 429, 500, 502, 503, 504]);

/** Backoff before attempt 2, 3, ... The last value repeats if attempts go higher. */
const BACKOFF_MS = [400, 1200];

const sleep = (ms: number): Promise<void> => new Promise((r) => { setTimeout(r, ms); });

/**
 * JSON mode is a REQUEST, not a guarantee the endpoint honours it. ArvanCloud's
 * gateway rejects `response_format` with a bare 400, so this starts from
 * AI_JSON_MODE and latches OFF for the process the first time a 400 says so —
 * paying that failed call once at boot instead of on every round. Endpoints that
 * do support it keep the hard guarantee. resetJsonMode() exists for tests.
 */
let jsonModeOff = false;

function jsonModeEnabled(): boolean {
  return config.ai.jsonMode && !jsonModeOff;
}

function disableJsonMode(): void {
  if (jsonModeOff) return;
  jsonModeOff = true;
  // eslint-disable-next-line no-console
  console.warn('[ai:openai-compatible] endpoint rejected response_format — disabling JSON mode for this process');
}

export function resetJsonMode(): void {
  jsonModeOff = false;
}

/**
 * Parse the model's answer. Without JSON mode a model often wraps the object in
 * a ```json fence or a sentence, so fall back to the first balanced-looking
 * {...} span before giving up. Returns null when nothing parses.
 */
function parseJson(raw: string): Record<string, unknown> | null {
  const attempt = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s) as unknown;
      return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  const direct = attempt(raw.trim());
  if (direct) return direct;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const inner = attempt(fenced[1].trim());
    if (inner) return inner;
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) return attempt(raw.slice(start, end + 1));

  return null;
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = 'openai-compatible';

  /**
   * Retry the transient failures, once the gateway has shown it produces them.
   *
   * Two bounds, because a human is waiting on this: `maxAttempts`
   * (AI_MAX_ATTEMPTS) caps the calls, and `retryBudgetMs` caps the wall clock —
   * without the second, three 10s timeouts plus backoff would keep a user
   * staring at a spinner for half a minute. The budget is checked BEFORE
   * sleeping, so an attempt already in flight is always allowed to finish.
   * Shared by narrowCase and suggestKeywords — both hit the same gateway with
   * the same failure modes.
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const attempts = Math.max(1, config.ai.maxAttempts);
    const started = Date.now();

    for (let attempt = 1; ; attempt += 1) {
      try {
        return await fn();
      } catch (err) {
        const transient = err instanceof TransientAiError;
        const elapsed = Date.now() - started;
        const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
        if (!transient || attempt >= attempts || elapsed + delay >= config.ai.retryBudgetMs) {
          throw err;
        }
        // eslint-disable-next-line no-console
        console.warn(`[ai:openai-compatible] attempt ${attempt}/${attempts} failed (${(err as Error).message}) — retrying in ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  /** One HTTP round trip: POST, unwrap, parse. Throws TransientAiError for
   * anything worth retrying (see withRetry), a plain Error for a permanent
   * failure (401/403/404). Never throws for a wrong JSON *shape* — that's the
   * caller's job to validate, same as the pre-refactor code did. */
  private async chatJson(systemPrompt: string, userContent: string): Promise<Record<string, unknown>> {
    const useJsonMode = jsonModeEnabled();

    const body: Record<string, unknown> = {
      model: config.ai.model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    };
    if (useJsonMode) body.response_format = { type: 'json_object' };

    let res: Response;
    try {
      // Arvan is a domestic (Iranian) provider, same reasoning as Bale in
      // providers/outbound.ts: no international egress proxy needed or wanted.
      res = await outboundFetch(`${config.ai.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.ai.apiKey}`,
        },
        body: JSON.stringify(body),
      }, { proxy: false, timeoutMs: config.ai.timeoutMs });
    } catch (err) {
      // A dead socket or a timeout is the textbook retryable failure.
      throw new TransientAiError(`[ai:openai-compatible] request failed: ${describeError(err, config.ai.timeoutMs)}`);
    }
    if (!res.ok) {
      // A 400 while asking for JSON mode is the gateway saying it does not
      // support response_format (ArvanCloud rejects it outright). Remember that
      // for the rest of this process and let the retry go without it — the
      // system prompt already demands a bare JSON object, and parseJson() below
      // tolerates the fenced output a model gives when it is not forced.
      if (res.status === 400 && useJsonMode) disableJsonMode();
      const Err = RETRYABLE_STATUS.has(res.status) ? TransientAiError : Error;
      throw new Err(`[ai:openai-compatible] http ${res.status}`);
    }

    const data = (await res.json().catch(() => ({}))) as ChatCompletionResponse;
    const raw = data.choices?.[0]?.message?.content;
    // A 200 with no usable content is the gateway hiccuping, not a bad request.
    if (!raw) throw new TransientAiError('[ai:openai-compatible] empty response');

    const parsed = parseJson(raw);
    // Nothing JSON-shaped survived even the fence/brace fallbacks; a re-roll
    // usually fixes it.
    if (!parsed) throw new TransientAiError('[ai:openai-compatible] non-JSON response');

    return parsed;
  }

  async narrowCase(input: NarrowRoundInput): Promise<NarrowRoundResult> {
    return this.withRetry(() => this.narrowAttempt(input));
  }

  private async narrowAttempt({ description, history, catalog }: NarrowRoundInput): Promise<NarrowRoundResult> {
    const allowed = new Map(catalog.map((c) => [c.key, c.label]));
    const userPayload = JSON.stringify({ description, history, catalog });

    const parsed = await this.chatJson(NARROW_SYSTEM_PROMPT, userPayload) as
      { done?: boolean; question?: unknown; options?: unknown };

    if (parsed.done) return { done: true };

    // Hard safety net: an option only survives if its key is one WE offered this
    // round. The label is always OUR label for that key, never the model's own
    // text — so even a fully hijacked response can only ever point at a real,
    // pre-existing catalog entry, never invent one.
    const rawOptions = Array.isArray(parsed.options) ? parsed.options : [];
    const options = rawOptions
      .map((k) => (typeof k === 'string' ? k : (k as { key?: unknown })?.key))
      .filter((k): k is string => typeof k === 'string' && allowed.has(k))
      .slice(0, 4)
      .map((key) => ({ key, label: allowed.get(key)! }));

    if (!options.length) return { done: true }; // nothing valid survived — stop rather than guess

    const question = typeof parsed.question === 'string' && parsed.question.trim()
      ? parsed.question.trim().slice(0, 200)
      : 'کدام‌یک به شرایط بیمار نزدیک‌تر است؟';

    return { done: false, question, options };
  }

  async suggestKeywords(text: string): Promise<string[]> {
    return this.withRetry(() => this.keywordsAttempt(text));
  }

  private async keywordsAttempt(text: string): Promise<string[]> {
    const parsed = await this.chatJson(KEYWORDS_SYSTEM_PROMPT, JSON.stringify({ text })) as { keywords?: unknown };

    // Same philosophy as narrowCase's option filter: whatever doesn't look
    // like a short real phrase is just dropped, never thrown on — a
    // malformed-but-parseable answer degrades to "no suggestions" (the
    // pillar-tree fallback in case-assistant.ts), not an error screen.
    const raw = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    return raw
      .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim().slice(0, 40))
      .slice(0, 8);
  }
}
