import { config } from '../../config.js';
import { outboundFetch, describeError } from '../outbound.js';
import type { AiProvider, NarrowRoundInput, NarrowRoundResult } from './types.js';

// The model is told the shape it must answer in; JSON mode (where the endpoint
// supports it) makes that a hard guarantee instead of a request. Either way we
// never trust the parse blindly — see the validation below.
const SYSTEM_PROMPT = `تو یک دسته‌بند باریک‌بین برای سایت آموزش دندانپزشکی دنت‌کست هستی، نه یک دستیار بالینی. کاربر (یک دندان‌پزشک) وضعیت یک بیمار را با متن آزاد شرح می‌دهد. کارِ تو فقط این است: بین گزینه‌های داده‌شده (فهرست catalog) کدام‌ها به شرحِ او نزدیک‌ترند را برای یک سؤالِ چندگزینه‌ای انتخاب کنی، تا مرحله‌به‌مرحله موضوع را دقیق‌تر کنی و در نهایت به مقاله‌ی درستِ سایت برسی.
قوانین سخت:
- هرگز تشخیص، توصیه‌ی درمانی یا نظرِ بالینی نده. تو فقط مسیر را به محتوای منتشرشده‌ی خودِ سایت نشان می‌دهی.
- گزینه‌هایی که برمی‌گردانی باید دقیقاً از میان کلیدهای catalog داده‌شده باشند؛ هرگز کلید یا موضوع تازه نساز.
- اگر اطلاعات کافی برای رسیدن به یک دسته‌ی روشن داری، done را true برگردان.
- فقط یک شیء JSON برگردان، دقیقاً به این شکل: {"done": false, "question": "...", "options": ["<یکی از کلیدهای catalog>", ...]} یا {"done": true}.`;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = 'openai-compatible';

  async narrowCase({ description, history, catalog }: NarrowRoundInput): Promise<NarrowRoundResult> {
    const allowed = new Map(catalog.map((c) => [c.key, c.label]));
    const userPayload = JSON.stringify({ description, history, catalog });

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
        body: JSON.stringify({
          model: config.ai.model,
          temperature: 0,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPayload },
          ],
          response_format: { type: 'json_object' },
        }),
      }, { proxy: false });
    } catch (err) {
      throw new Error(`[ai:openai-compatible] request failed: ${describeError(err)}`);
    }
    if (!res.ok) throw new Error(`[ai:openai-compatible] http ${res.status}`);

    const data = (await res.json()) as ChatCompletionResponse;
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('[ai:openai-compatible] empty response');

    let parsed: { done?: boolean; question?: unknown; options?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('[ai:openai-compatible] non-JSON response');
    }

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
}
