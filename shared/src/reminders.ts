import type { ThreadMessage } from './messages.js';

export interface DeliverReturnReminderRequest {
  avatarId: string;
}

/** `POST /v1/reminders/return` — null when there is nothing waiting, including the second time. */
export interface DeliverReturnReminderResponse {
  delivery: { chatId: string; message: ThreadMessage } | null;
}
