import type { MessageRole, MessageStatus, VisitorMemory } from '@measagent/shared';
import type {
  AvatarAvailability,
  AvatarListing,
  AvatarPersonaFields,
} from '@measagent/shared/avatars';

/**
 * The persisted shapes. `userId` exists from the first commit even though
 * Stage 1 has no accounts: an anonymous device id goes in the same field a
 * real account id will later occupy, which makes the sign-in migration one
 * `updateMany` instead of a schema rewrite.
 */

export interface ThreadDoc {
  _id: string;
  /** The person talking. */
  userId: string;
  /**
   * The avatar they are talking to. Owner-plus-avatar is also the key Stage 5's
   * memory will use, so what a visitor tells one avatar never reaches another.
   */
  avatarId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface MessageDoc {
  _id: string;
  threadId: string;
  userId: string;
  role: MessageRole;
  text: string;
  status: MessageStatus;
  /** Groups a user prompt with the reply it produced. A return reminder has a turn of its own. */
  turnId: string;
  /** `return_reminder` is a follow-up the avatar left while the visitor was away. */
  origin: 'turn' | 'return_reminder';
  createdAt: Date;
  feedback: { vote: 'up' | 'down'; reason: string | null; submittedAt: Date } | null;
  /**
   * When the memory pass read this message, or null until it has. Tracked per
   * message rather than as a timestamp per relationship, because claiming hands
   * over messages older than anything already remembered, and forgetting marks
   * everything read so none of it can be summarised back in.
   */
  memorizedAt: Date | null;
}

export interface UserDoc {
  _id: string;
  googleSubject: string;
  email: string;
  name: string;
  pictureUrl: string | null;
  createdAt: Date;
  lastSignedInAt: Date;
  /**
   * Null until the terms are accepted. Accepted once is accepted for good; the
   * version is kept as a record of which wording was on screen at the time.
   */
  consent: { acceptedAt: Date; termsVersion: string } | null;
  /** Memory summaries spent today — absent until the first one. */
  memoryBudget?: { day: string; used: number };
}

/**
 * What one avatar remembers about one visitor. Keyed on the pair, like threads,
 * so nothing a visitor tells one avatar reaches another. Only exists for
 * signed-in visitors who have accepted the terms.
 */
export interface RelationshipDoc extends VisitorMemory {
  _id: string;
  userId: string;
  avatarId: string;
  /** The visitor's latest turn with this avatar. */
  lastSeenAt: Date;
  /** When the memory pass should next read this pair's conversations; null when there is nothing new. */
  memoryDueAt: Date | null;
  /** When a return reminder may be written, if the visitor has not come back by then. */
  reminderDueAt: Date | null;
  /** A background pass is working on this document until then. */
  leaseUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One per account. The name and portrait are not copied here: they are read
 * from the owner's user document, which every sign-in refreshes from Google, so
 * Google stays the only source of who the avatar is.
 */
export interface AvatarDoc extends AvatarPersonaFields {
  _id: string;
  ownerId: string;
  handle: string;
  availability: AvatarAvailability;
  listing: AvatarListing;
  listingReviewedAt: Date | null;
  ownerAttestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A follow-up waiting for a visitor's next visit to one avatar. At most one is
 * pending per pair — a unique partial index makes that a rule — and it is
 * delivered once, into their latest conversation with that avatar.
 */
export interface ReturnReminderDoc {
  _id: string;
  userId: string;
  avatarId: string;
  threadId: string;
  text: string;
  generatedAt: Date;
  /** A reminder about something from weeks ago reads as a non sequitur, so it lapses. */
  expiresAt: Date;
  deliveredAt: Date | null;
}
