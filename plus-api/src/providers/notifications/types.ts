/**
 * Provider-agnostic notification sender. Telegram/Bale are messenger channels
 * (also the OTP fallback); web push is the browser/PWA channel. SMS is reserved
 * for OTP only. In-site indicators are always present regardless of this channel.
 * Swapping or adding a provider is a change here plus one env var; business logic
 * (e.g. the new-article scheduler) never imports a concrete provider.
 */
export type NotificationKind =
  | 'reminder'
  | 'streak'
  | 'system'
  | 'article_premium'
  | 'article_free_digest'
  /** League promotion/demotion, fired when a week is finalized (premium). */
  | 'league'
  /** Leitner cards are due (premium — the review schedule itself is premium). */
  | 'review'
  /** Won a week of premium as the weekly league's top-tier prize. */
  | 'premium_prize'
  /**
   * A paid subscription is about to end, or ends today. UNCAPPED in
   * notify-policy.ts: this is the only notification the site sends with money
   * on the other side of it, and dropping it because the user already got a
   * streak nudge that morning costs a renewal — the daily cap exists to stop us
   * pestering people, not to ration the one message they actually need.
   */
  | 'subscription_expiry'
  /**
   * A badge or medal just lit up. IN-APP ONLY — written straight to the inbox by
   * services/achievement-sync.ts and never handed to a sender. A badge lights
   * while the reader is almost always already on the page, so a push would
   * arrive at the one moment it is pure noise, and it would spend a slot of a
   * budget that exists to protect a channel we do not get back once muted.
   */
  | 'achievement';

/**
 * A message may be a plain string (messenger text) or a structured payload.
 * Web push needs a title/body and a click target (url); messenger providers
 * flatten it to text. Keeping both shapes lets one call site serve every channel.
 */
export interface NotificationMessage {
  title: string;
  body: string;
  /** Deep-link opened when the notification is clicked (web push). */
  url?: string;
  /** Collapse key so repeats of the same thing do not stack (web push). */
  tag?: string;
}

/** Flatten any message to messenger text (title + body). */
export function messageText(message: string | NotificationMessage): string {
  if (typeof message === 'string') return message;
  return message.body ? `${message.title}\n${message.body}` : message.title;
}

export interface NotificationSender {
  readonly name: string;
  /**
   * Deliver a message to a user through the active channel. Implementations look
   * up the user's channel handle (telegram_id, push subscriptions, ...) themselves
   * and no-op QUIETLY if the user has not linked/enabled that channel. A user with
   * no destination is an expected state, never an error.
   */
  send(userId: string, message: string | NotificationMessage, kind: NotificationKind): Promise<void>;
}
