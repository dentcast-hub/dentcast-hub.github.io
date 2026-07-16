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
  | 'article_free_digest';

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
