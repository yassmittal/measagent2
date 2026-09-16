import type { MessageRole, MessageStatus, VisitorMemory } from '@measagent/shared';
import type { AttentionFlag } from '@measagent/shared/weekly-summary';
import type {
  AvatarAvailability,
  AvatarListing,
  AvatarPersonaFields,
  AvatarSubject,
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
  /**
   * The owner's weekly email. Absent means on, in UTC; either field may be
   * absent on its own, so read it through `readWeeklySummarySettings`.
   */
  weeklySummary?: { isEnabled?: boolean; timeZone?: string };
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
  /*
   * The four fields below arrived after the first avatars launched, so older
   * documents lack them. Read them through `lib/avatars/avatar-public-details.ts`,
   * which supplies the defaults, rather than migrating every document.
   */
  subject?: AvatarSubject;
  askMeAbout?: string[];
  websiteUrl?: string | null;
  isHiddenFromSearch?: boolean;
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

export type WeeklySummaryStatus = 'summarizing' | 'sending' | 'sent' | 'skipped' | 'failed';

/** One visitor in one owner's week. Their conversation text is never copied here. */
export interface WeeklySummaryVisitor {
  key: string;
  name: string;
  isNew: boolean;
  conversationCount: number;
  /** Messages the visitor sent during the week. */
  messageCount: number;
  /** Null until the model has summarised this visitor's week. */
  summary: string | null;
  needsAttention: AttentionFlag | null;
}

/**
 * One owner's summary of one week, from the moment it is due until it is sent.
 * The unique `(ownerId, weekKey)` index is what makes "once per owner per week"
 * a rule: whichever instance creates the document owns that week, and every
 * later step is claimed with a lease on it.
 */
export interface WeeklySummaryDoc {
  _id: string;
  ownerId: string;
  avatarId: string;
  /** The owner's local date of the Monday the email goes out, `YYYY-MM-DD`. */
  weekKey: string;
  periodStart: Date;
  periodEnd: Date;
  status: WeeklySummaryStatus;
  /** Null until the week has been read. Emptied once sent — only the flags are kept. */
  visitors: WeeklySummaryVisitor[] | null;
  totals: { visitorCount: number; newVisitorCount: number; messageCount: number } | null;
  /** Kept after sending, for the "needs you" marks on the visitors page. */
  attentionFlags: { visitorKey: string; flag: AttentionFlag }[];
  attempts: number;
  nextAttemptAt: Date | null;
  leaseUntil: Date | null;
  /** Why it was skipped or failed, or the last error it will be retried after. */
  lastError: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
