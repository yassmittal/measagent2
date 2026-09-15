import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  DeliverReturnReminderRequest,
  DeliverReturnReminderResponse,
} from '@measagent/shared';
import { v4 as uuidv4 } from 'uuid';
import { toThreadMessage } from '../../lib/chat/messages.js';
import {
  avatarsCollection,
  messagesCollection,
  returnRemindersCollection,
  threadsCollection,
} from '../../shared/collections.js';
import type { MessageDoc } from '../../shared/documents.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/**
 * `POST /v1/reminders/return` — hand the signed-in visitor the follow-up an
 * avatar left for them, if one is waiting.
 *
 * A POST, not a GET, because it is spent by being read. Claiming it is one
 * atomic update, so two tabs opening the page at once — or React running the
 * effect twice in development — deliver it exactly once between them.
 */
export async function deliverReturnReminder(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: DeliverReturnReminderRequest }>,
  reply: FastifyReply
): Promise<DeliverReturnReminderResponse | undefined> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Not signed in');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const { avatarId } = request.body;
  // Left waiting rather than spent: it is still worth seeing once the owner
  // unpauses, and it lapses on its own if they do not.
  const avatar = await avatarsCollection(db).findOne({ _id: avatarId });
  if (avatar?.availability !== 'live') {
    return { delivery: null };
  }

  const now = new Date();
  const reminder = await returnRemindersCollection(db).findOneAndUpdate(
    { userId: ownerId, avatarId, deliveredAt: null, expiresAt: { $gt: now } },
    { $set: { deliveredAt: now } },
    { returnDocument: 'after' }
  );
  if (reminder === null) {
    return { delivery: null };
  }

  // The conversation it was written for is normally still the latest; if not,
  // it goes where the visitor will actually look.
  const thread =
    (await threadsCollection(db).findOne({ _id: reminder.threadId, userId: ownerId, avatarId })) ??
    (await threadsCollection(db).findOne({ userId: ownerId, avatarId }, { sort: { lastMessageAt: -1 } }));
  if (thread === null) {
    return { delivery: null };
  }

  const message: MessageDoc = {
    _id: uuidv4(),
    threadId: thread._id,
    userId: ownerId,
    role: 'assistant',
    text: reminder.text,
    status: 'complete',
    turnId: uuidv4(),
    origin: 'return_reminder',
    createdAt: now,
    feedback: null,
    memorizedAt: null,
  };
  await messagesCollection(db).insertOne(message);
  await threadsCollection(db).updateOne(
    { _id: thread._id },
    { $set: { lastMessageAt: now, updatedAt: now } }
  );

  return { delivery: { chatId: thread._id, message: toThreadMessage(message) } };
}
