import type { ThreadMessage, ThreadSummary } from './messages.js';
import type { VisitorMemory } from './relationships.js';
import type { AttentionFlag } from './weekly-summary.js';

/**
 * The owner's side: who has been talking to their avatar. A visitor is either a
 * signed-in account, shown by their Google name and photo, or an anonymous
 * browser, shown only by a number. Neither ever carries an email address or the
 * id the visitor authenticates with.
 */

export type VisitorKind = 'account' | 'anonymous';

export interface OwnerVisitor {
  /** Opaque, and only meaningful to the owner of this avatar. */
  key: string;
  kind: VisitorKind;
  /** The Google name, or "Anonymous visitor 3". */
  name: string;
  pictureUrl: string | null;
  conversationCount: number;
  /** Messages the visitor sent, across every conversation shown. */
  messageCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  /** What the avatar remembers about them; always null for anonymous visitors. */
  memory: VisitorMemory | null;
  /** Flagged in the latest weekly summary sent to the owner, if it was. */
  needsAttention: AttentionFlag | null;
}

/** `GET /v1/me/avatar/visitors` */
export interface OwnerVisitorsResponse {
  visitors: OwnerVisitor[];
  /**
   * Conversations the owner is not shown: anonymous ones started before visitors
   * were told the owner reads them, and ones from accounts that never accepted
   * the terms.
   */
  hiddenConversationCount: number;
}

export interface OwnerVisitorConversation {
  chat: ThreadSummary;
  messages: ThreadMessage[];
}

/** `GET /v1/me/avatar/visitors/:visitorKey` */
export interface OwnerVisitorResponse {
  visitor: OwnerVisitor;
  /** Oldest first, so they read in the order they happened. */
  conversations: OwnerVisitorConversation[];
}
