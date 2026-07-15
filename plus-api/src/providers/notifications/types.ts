/**
 * Provider-agnostic notification sender. Telegram is the first implementation;
 * SMS is reserved for OTP only. In-site indicators are always present regardless
 * of this channel. Swapping providers is a change here plus one env var.
 */
export type NotificationKind = 'reminder' | 'streak' | 'system';

export interface NotificationSender {
  readonly name: string;
  /**
   * Deliver a message to a user through the active channel. Implementations look
   * up the user's channel handle (e.g. telegram_id) themselves and no-op quietly
   * if the user has not linked a channel.
   */
  send(userId: string, message: string, kind: NotificationKind): Promise<void>;
}
