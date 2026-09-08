import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LoadThreadResponse } from '@measagent/shared';
import { toThreadMessage, toThreadSummary } from '../../lib/chat/messages.js';
import { messagesCollection, threadsCollection } from '../../shared/collections.js';
import { readOwnerId } from '../../shared/identity.js';

/**
 * `GET /v1/chats/:chatId` — the thread as it should render on a cold load.
 *
 * Ownership is part of the query rather than a check after the fact, so an id
 * belonging to another device reads as "not found" and leaks nothing.
 */
export async function loadThread(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Params: { chatId: string } }>,
  reply: FastifyReply
): Promise<LoadThreadResponse | undefined> {
  const ownerId = readOwnerId(request);
  if (ownerId === null) {
    return reply.badRequest('A valid x-device-id header is required');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const thread = await threadsCollection(db).findOne({
    _id: request.params.chatId,
    userId: ownerId,
  });
  if (thread === null) {
    return reply.notFound('Chat not found');
  }

  const messages = await messagesCollection(db)
    .find({ threadId: thread._id })
    .sort({ createdAt: 1 })
    .toArray();

  return { chat: toThreadSummary(thread), messages: messages.map(toThreadMessage) };
}
