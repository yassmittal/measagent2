import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Db } from 'mongodb';
import { hasAcceptedTerms } from '../lib/auth/user-profile.js';
import { findAvatarWithOwner } from '../lib/avatars/avatar-with-owner.js';
import { readMessageText } from '../lib/chat/reply-runner.js';
import {
  buildMemoryWriterPrompt,
  EMPTY_VISITOR_MEMORY,
  parseMemoryWriterOutput,
  selectTranscriptWindow,
} from '../lib/memory/memory-writer.js';
import { toVisitorMemory } from '../lib/memory/relationships.js';
import { isReturnReminderWorthWriting } from '../lib/reminders/return-reminder.js';
import { buildChatModel } from '../services/language-model.js';
import {
  messagesCollection,
  relationshipsCollection,
  threadsCollection,
  usersCollection,
} from '../shared/collections.js';
import {
  BACKGROUND_BATCH_SIZE,
  MEMORY_DAILY_SUMMARY_LIMIT,
  MEMORY_MODEL,
} from '../shared/constants.js';
import type { RelationshipDoc } from '../shared/documents.js';
import { getErrorMessage } from '../shared/errors.js';
import {
  claimDueRelationship,
  type JobContext,
  releaseRelationship,
  rescheduleRelationship,
  secondsFromNow,
} from './relationship-lease.js';

/**
 * Reads new conversation into memory, one relationship at a time. Nothing is
 * marked read until the memory it went into has been stored, so a pass that
 * dies halfway leaves the messages to be read again once its lease expires.
 */

/** Messages considered in one go before the transcript window trims them. */
const UNREAD_MESSAGE_LIMIT = 200;

export async function runMemoryPass(context: JobContext): Promise<void> {
  for (let handled = 0; handled < BACKGROUND_BATCH_SIZE; handled += 1) {
    const relationship = await claimDueRelationship(context.db, 'memoryDueAt');
    if (relationship === null) return;

    try {
      await rememberConversation(context, relationship);
    } catch (error) {
      context.log.warn(
        { err: getErrorMessage(error), relationshipId: relationship._id },
        'Memory pass failed for a relationship; it will be retried'
      );
      // Waits a quiet period before retrying, so a writer that keeps failing
      // is not called every pass until the daily budget runs out.
      await rescheduleRelationship(
        context.db,
        relationship,
        'memoryDueAt',
        secondsFromNow(context.quietSeconds)
      );
    } finally {
      await releaseRelationship(context.db, relationship);
    }
  }
}

async function rememberConversation(
  { db, log, reminderAfterSeconds }: JobContext,
  relationship: RelationshipDoc
): Promise<void> {
  const { userId, avatarId } = relationship;

  const visitor = await usersCollection(db).findOne({ _id: userId });
  const avatarWithOwner = await findAvatarWithOwner(db, { _id: avatarId });
  if (visitor === null || !hasAcceptedTerms(visitor) || avatarWithOwner === null) {
    await rescheduleRelationship(db, relationship, 'memoryDueAt', null);
    return;
  }

  const threadIds = await threadsCollection(db).distinct('_id', { userId, avatarId });
  // Resolving and interrupted replies are left unread rather than read half
  // written: a resolving one is read once it completes, and an interrupted one
  // is a fragment that would teach the memory something the avatar never said.
  const unread = await messagesCollection(db)
    .find({ threadId: { $in: threadIds }, memorizedAt: null, status: 'complete', text: { $ne: '' } })
    .sort({ createdAt: 1 })
    .limit(UNREAD_MESSAGE_LIMIT)
    .toArray();
  if (unread.length === 0) {
    await rescheduleRelationship(db, relationship, 'memoryDueAt', null);
    return;
  }

  if (!(await spendSummaryBudget(db, userId))) {
    log.info({ relationshipId: relationship._id }, 'Memory budget spent for today');
    await rescheduleRelationship(db, relationship, 'memoryDueAt', startOfNextUtcDay());
    return;
  }

  const window = selectTranscriptWindow(
    unread.map((message) => ({ id: message._id, role: message.role, text: message.text }))
  );
  const prompt = buildMemoryWriterPrompt(
    avatarWithOwner.owner.name,
    toVisitorMemory(relationship) ?? EMPTY_VISITOR_MEMORY,
    window
  );

  const reply = await buildChatModel({ model: MEMORY_MODEL, temperature: 0, maxTokens: 1024 }).invoke([
    new SystemMessage(prompt.system),
    new HumanMessage(prompt.user),
  ]);
  const memory = parseMemoryWriterOutput(readMessageText(reply));

  const now = new Date();
  // Never an upsert: if the visitor asked to forget while the writer was
  // running, the document is gone and this memory must not bring it back.
  const stored = await relationshipsCollection(db).updateOne(
    { _id: relationship._id },
    {
      $set: {
        ...memory,
        updatedAt: now,
        // The reminder pass checks again when this comes due; this only says
        // when it is first worth looking.
        reminderDueAt: isReturnReminderWorthWriting(memory)
          ? new Date(relationship.lastSeenAt.getTime() + reminderAfterSeconds * 1000)
          : null,
      },
    }
  );
  if (stored.matchedCount === 0) return;

  await messagesCollection(db).updateMany(
    { _id: { $in: window.map((message) => message.id) } },
    { $set: { memorizedAt: now } }
  );

  if (window.length === unread.length) {
    await rescheduleRelationship(db, relationship, 'memoryDueAt', null);
  } else {
    await relationshipsCollection(db).updateOne(
      { _id: relationship._id },
      { $set: { memoryDueAt: now } }
    );
  }
}

/** Atomic, so two instances summarising for the same visitor cannot both take the last one. */
async function spendSummaryBudget(db: Db, userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const result = await usersCollection(db).updateOne(
    {
      _id: userId,
      $or: [
        { 'memoryBudget.day': { $ne: today } },
        { 'memoryBudget.used': { $lt: MEMORY_DAILY_SUMMARY_LIMIT } },
      ],
    },
    [
      {
        $set: {
          memoryBudget: {
            $cond: [
              { $eq: ['$memoryBudget.day', today] },
              { day: today, used: { $add: ['$memoryBudget.used', 1] } },
              { day: today, used: 1 },
            ],
          },
        },
      },
    ]
  );
  return result.modifiedCount === 1;
}

function startOfNextUtcDay(): Date {
  const next = new Date();
  next.setUTCHours(24, 0, 0, 0);
  return next;
}
