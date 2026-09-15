import type { MessageRole, MessageStatus } from '@measagent/shared';
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
  /** Groups a user prompt with the reply it produced. */
  turnId: string;
  createdAt: Date;
  feedback: { vote: 'up' | 'down'; reason: string | null; submittedAt: Date } | null;
}

export interface UserDoc {
  _id: string;
  googleSubject: string;
  email: string;
  name: string;
  pictureUrl: string | null;
  createdAt: Date;
  lastSignedInAt: Date;
  /** Null until the terms are accepted; re-asked when the version moves on. */
  consent: { acceptedAt: Date; termsVersion: string } | null;
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
