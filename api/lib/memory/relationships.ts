import type { VisitorMemory } from '@measagent/shared';
import type { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import {
  messagesCollection,
  relationshipsCollection,
  returnRemindersCollection,
  threadsCollection,
} from '../../shared/collections.js';
import type { RelationshipDoc } from '../../shared/documents.js';

/**
 * Reading and scheduling one visitor's memory of one avatar. Nothing here
 * checks consent — callers decide who is remembered (`hasAcceptedTerms`), and
 * this file only ever touches the pair it is given.
 */

export function toVisitorMemory(relationship: RelationshipDoc): VisitorMemory | null {
  const { summary, interests, openThreads } = relationship;
  const isEmpty = summary === '' && interests.length === 0 && openThreads.length === 0;
  return isEmpty ? null : { summary, interests, openThreads };
}

export async function findVisitorMemory(
  db: Db,
  userId: string,
  avatarId: string
): Promise<VisitorMemory | null> {
  const relationship = await relationshipsCollection(db).findOne({ userId, avatarId });
  return relationship === null ? null : toVisitorMemory(relationship);
}

/**
 * Called after every remembered turn. Summarising waits for the conversation to
 * go quiet, so each new turn pushes the due time back rather than queueing work,
 * and a reminder is never due while the visitor is here.
 */
export async function recordVisitorTurn(
  db: Db,
  userId: string,
  avatarId: string,
  at: Date,
  quietSeconds: number
): Promise<void> {
  await markMemoryDue(db, userId, avatarId, at, new Date(at.getTime() + quietSeconds * 1000));
}

/**
 * Conversations claimed at sign-in arrive with every message unread, so making
 * the account's memory of those avatars due now is all a merge needs: the next
 * pass reads the claimed messages into whatever the account already remembers.
 */
export async function scheduleMemoryForClaimedAvatars(
  db: Db,
  userId: string,
  avatarIds: string[],
  at: Date
): Promise<void> {
  for (const avatarId of avatarIds) {
    await markMemoryDue(db, userId, avatarId, at, at);
  }
}

/** Counted from the messages rather than kept as a counter, so claimed conversations count and nothing can drift. */
export async function countVisitorMessages(
  db: Db,
  userId: string,
  avatarId: string
): Promise<number> {
  const threadIds = await threadsCollection(db).distinct('_id', { userId, avatarId });
  return messagesCollection(db).countDocuments({
    threadId: { $in: threadIds },
    userId,
    role: 'user',
  });
}

/**
 * Forget what one avatar — or, with no avatar, every avatar — remembers about a
 * visitor, along with any reminder still waiting for them. Conversations are
 * kept; they are only marked as already read.
 *
 * The order matters. Messages are marked first, so a memory pass that starts in
 * between finds nothing to read; the memory is deleted second, and a pass
 * already running cannot bring it back because it never upserts.
 */
export async function forgetVisitorMemory(
  db: Db,
  userId: string,
  avatarId: string | null
): Promise<void> {
  const pair = avatarId === null ? { userId } : { userId, avatarId };
  const threadIds = await threadsCollection(db).distinct('_id', pair);

  await messagesCollection(db).updateMany(
    { threadId: { $in: threadIds }, memorizedAt: null },
    { $set: { memorizedAt: new Date() } }
  );
  await relationshipsCollection(db).deleteMany(pair);
  await returnRemindersCollection(db).deleteMany({ ...pair, deliveredAt: null });
}

async function markMemoryDue(
  db: Db,
  userId: string,
  avatarId: string,
  lastSeenAt: Date,
  memoryDueAt: Date
): Promise<void> {
  await relationshipsCollection(db).updateOne(
    { userId, avatarId },
    {
      $max: { lastSeenAt },
      $set: { memoryDueAt, reminderDueAt: null, updatedAt: lastSeenAt },
      $setOnInsert: {
        _id: uuidv4(),
        summary: '',
        interests: [],
        openThreads: [],
        leaseUntil: null,
        createdAt: lastSeenAt,
      },
    },
    { upsert: true }
  );
}
