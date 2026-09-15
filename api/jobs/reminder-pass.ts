import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { hasAcceptedTerms } from '../lib/auth/user-profile.js';
import { findAvatarWithOwner } from '../lib/avatars/avatar-with-owner.js';
import { buildPersonaSystemPrompt } from '../lib/chat/persona.js';
import { readMessageText } from '../lib/chat/reply-runner.js';
import { toVisitorMemory } from '../lib/memory/relationships.js';
import {
  buildReturnReminderRequest,
  cleanReturnReminderText,
  isReturnReminderWorthWriting,
} from '../lib/reminders/return-reminder.js';
import { buildChatModel } from '../services/language-model.js';
import {
  returnRemindersCollection,
  threadsCollection,
  usersCollection,
} from '../shared/collections.js';
import {
  BACKGROUND_BATCH_SIZE,
  RETURN_REMINDER_LIFETIME_DAYS,
  RETURN_REMINDER_MAX_TOKENS,
  RETURN_REMINDER_RETRY_SECONDS,
} from '../shared/constants.js';
import type { RelationshipDoc } from '../shared/documents.js';
import { getErrorMessage, getErrorProperty } from '../shared/errors.js';
import {
  claimDueRelationship,
  type JobContext,
  releaseRelationship,
  rescheduleRelationship,
  secondsFromNow,
} from './relationship-lease.js';

/**
 * Writes the follow-up a visitor finds when they come back to an avatar after
 * leaving something unfinished. It is only written, never sent: delivery waits
 * for the visitor to open that avatar (`handlers/reminders`).
 */

const MONGO_DUPLICATE_KEY = 11000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export async function runReminderPass(context: JobContext): Promise<void> {
  for (let handled = 0; handled < BACKGROUND_BATCH_SIZE; handled += 1) {
    const relationship = await claimDueRelationship(context.db, 'reminderDueAt');
    if (relationship === null) return;

    try {
      await writeReturnReminder(context, relationship);
    } catch (error) {
      context.log.warn(
        { err: getErrorMessage(error), relationshipId: relationship._id },
        'Return reminder failed for a relationship; it will be retried'
      );
      await rescheduleRelationship(
        context.db,
        relationship,
        'reminderDueAt',
        secondsFromNow(RETURN_REMINDER_RETRY_SECONDS)
      );
    } finally {
      await releaseRelationship(context.db, relationship);
    }
  }
}

async function writeReturnReminder(
  { db, reminderAfterSeconds }: JobContext,
  relationship: RelationshipDoc
): Promise<void> {
  const { userId, avatarId } = relationship;

  // The visitor may have come back since this was scheduled; if so it waits
  // for the new absence instead.
  const awayUntil = new Date(relationship.lastSeenAt.getTime() + reminderAfterSeconds * 1000);
  if (awayUntil.getTime() > Date.now()) {
    await rescheduleRelationship(db, relationship, 'reminderDueAt', awayUntil);
    return;
  }

  const memory = toVisitorMemory(relationship);
  const visitor = await usersCollection(db).findOne({ _id: userId });
  const avatarWithOwner = await findAvatarWithOwner(db, { _id: avatarId });
  const latestThread = await threadsCollection(db).findOne(
    { userId, avatarId },
    { sort: { lastMessageAt: -1 } }
  );
  // A paused avatar leaves nobody a follow-up: it would arrive from an avatar
  // that refuses to answer the reply.
  if (
    !isReturnReminderWorthWriting(memory) ||
    visitor === null ||
    !hasAcceptedTerms(visitor) ||
    avatarWithOwner?.avatar.availability !== 'live' ||
    latestThread === null
  ) {
    await rescheduleRelationship(db, relationship, 'reminderDueAt', null);
    return;
  }

  const { avatar, owner } = avatarWithOwner;
  const reply = await buildChatModel({ maxTokens: RETURN_REMINDER_MAX_TOKENS }).invoke([
    new SystemMessage(buildPersonaSystemPrompt({ ...avatar, name: owner.name }, { visitorMemory: memory })),
    new HumanMessage(buildReturnReminderRequest(memory)),
  ]);
  const text = cleanReturnReminderText(readMessageText(reply));

  const now = new Date();
  // A reminder that lapsed unseen would hold the one pending slot forever.
  await returnRemindersCollection(db).deleteMany({
    userId,
    avatarId,
    deliveredAt: null,
    expiresAt: { $lte: now },
  });

  try {
    await returnRemindersCollection(db).insertOne({
      _id: uuidv4(),
      userId,
      avatarId,
      threadId: latestThread._id,
      text,
      generatedAt: now,
      expiresAt: new Date(now.getTime() + RETURN_REMINDER_LIFETIME_DAYS * MILLISECONDS_PER_DAY),
      deliveredAt: null,
    });
  } catch (error) {
    // One is already waiting for them, which is exactly the state wanted.
    if (getErrorProperty(error, 'code') !== MONGO_DUPLICATE_KEY) throw error;
  }

  await rescheduleRelationship(db, relationship, 'reminderDueAt', null);
}
