import type { MessageRole, MessageStatus } from '@measagent/shared';

/**
 * The persisted shapes. `userId` exists from the first commit even though
 * Stage 1 has no accounts: an anonymous device id goes in the same field a
 * real account id will later occupy, which makes the sign-in migration one
 * `updateMany` instead of a schema rewrite.
 */

export interface ThreadDoc {
  _id: string;
  userId: string;
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
