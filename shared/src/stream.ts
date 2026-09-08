/**
 * The event stream returned by `POST /v1/chats`.
 *
 * Framed as SSE but deliberately not consumed with `EventSource` — the browser
 * needs to POST a body and send its own headers, so both ends speak SSE over a
 * plain chunked `fetch`. The reference product does exactly this.
 */

import type { ThreadMessage, ThreadSummary } from './messages.js';

/** The turn is live; ids are assigned before the first token arrives. */
export interface TurnStartedEvent {
  type: 'turn_started';
  chat: ThreadSummary;
  turnId: string;
  userMessage: ThreadMessage;
  replyMessageId: string;
}

/** One chunk of reply text. Deltas are additive — never a full re-send. */
export interface TurnDeltaEvent {
  type: 'delta';
  text: string;
}

/** The reply finished and has been persisted in its final form. */
export interface TurnCompletedEvent {
  type: 'turn_completed';
  message: ThreadMessage;
}

/**
 * The turn failed. `retryable` distinguishes "ask again and it may work"
 * (upstream hiccup, rate limit) from "this prompt will never succeed".
 */
export interface TurnFailedEvent {
  type: 'turn_failed';
  code: string;
  message: string;
  retryable: boolean;
}

export type ChatStreamEvent =
  | TurnStartedEvent
  | TurnDeltaEvent
  | TurnCompletedEvent
  | TurnFailedEvent;
