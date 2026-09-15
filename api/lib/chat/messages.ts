import type { ThreadMessage, ThreadSummary } from '@measagent/shared';
import type { MessageDoc, ThreadDoc } from '../../shared/documents.js';

export function toThreadMessage(doc: MessageDoc): ThreadMessage {
  return {
    id: doc._id,
    role: doc.role,
    text: doc.text,
    status: doc.status,
    at: doc.createdAt.toISOString(),
    turnId: doc.turnId,
    feedback: doc.feedback?.vote ?? null,
    isReturnReminder: doc.origin === 'return_reminder',
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

export function deriveThreadTitle(firstUserMessage: string): string {
  const flattened = firstUserMessage.replace(/\s+/g, ' ').trim();
  if (flattened.length <= MAX_TITLE_LENGTH) return flattened;
  return `${flattened.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}
