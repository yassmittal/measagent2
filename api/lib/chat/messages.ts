import type { ThreadMessage, ThreadSummary } from '@measagent/shared';
import type { MessageDoc, ThreadDoc } from '../../shared/documents.js';

/** Pure mappers from stored documents to the shapes the browser receives. */

export function toThreadMessage(doc: MessageDoc): ThreadMessage {
  return {
    id: doc._id,
    role: doc.role,
    text: doc.text,
    status: doc.status,
    at: doc.createdAt.toISOString(),
    turnId: doc.turnId,
    feedback: doc.feedback?.vote ?? null,
  };
}

export function toThreadSummary(doc: ThreadDoc): ThreadSummary {
  return {
    id: doc._id,
    title: doc.title,
    createdAt: doc.createdAt.toISOString(),
    lastMessageAt: doc.lastMessageAt.toISOString(),
  };
}

const MAX_TITLE_LENGTH = 60;

/**
 * A thread is titled from its opening message, the way the reference product
 * does — there is no separate title-generation call, and a cheap deterministic
 * title beats a second round trip to the model on the first message.
 */
export function deriveThreadTitle(firstUserMessage: string): string {
  const flattened = firstUserMessage.replace(/\s+/g, ' ').trim();
  if (flattened.length <= MAX_TITLE_LENGTH) return flattened;
  return `${flattened.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}
