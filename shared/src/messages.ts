/**
 * The message shapes crossing the web ↔ api boundary.
 *
 * These names mirror the reference product's own vocabulary (a "turn" is one
 * user prompt plus the reply it produces; a "thread" is the persisted
 * conversation) so the frontend port stays a direct read of its behaviour.
 */

export type MessageRole = 'user' | 'assistant';

/**
 * `resolving` is not a transient UI state — it is persisted. A reply whose
 * stream died mid-flight is stored as `resolving` so a later page load can
 * tell "the server may still be writing this" apart from "this is finished".
 */
export type MessageStatus = 'complete' | 'interrupted' | 'resolving';

export type FeedbackVote = 'up' | 'down';

export interface MessageFeedback {
  vote: FeedbackVote;
  reason: string | null;
  submittedAt: string;
}

/** One message as the thread renders it. `at` is an ISO-8601 instant. */
export interface ThreadMessage {
  id: string;
  role: MessageRole;
  text: string;
  status: MessageStatus;
  at: string;
  turnId: string | null;
  feedback: FeedbackVote | null;
}

export interface ThreadSummary {
  id: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string;
}

export interface SendMessageRequest {
  /** Omitted on the very first message of a conversation; the api mints one. */
  chatId?: string;
  text: string;
}

export interface LoadThreadResponse {
  chat: ThreadSummary;
  messages: ThreadMessage[];
}
