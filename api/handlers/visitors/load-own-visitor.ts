import type { FastifyReply, FastifyRequest } from 'fastify';
import type { OwnerVisitorResponse } from '@measagent/shared';
import { toThreadMessage, toThreadSummary } from '../../lib/chat/messages.js';
import { findAvatarVisitors } from '../../lib/visitors/avatar-visitors.js';
import { messagesCollection } from '../../shared/collections.js';
import { loadOwnerAvatarAccess } from './owner-avatar-access.js';

/**
 * `GET /v1/me/avatar/visitors/:visitorKey` — one visitor's conversations, read-only.
 *
 * The visitor is found among the owner's own visitors rather than looked up by
 * key directly, so a key from another avatar, or for a conversation the owner is
 * not shown, reads as not found through the same rule the list uses.
 */
export async function loadOwnVisitor(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Params: { visitorKey: string } }>,
  reply: FastifyReply
): Promise<OwnerVisitorResponse | FastifyReply> {
  const access = await loadOwnerAvatarAccess(this, request, reply);
  if (access === null) return reply;

  const { visitors } = await findAvatarVisitors(access.db, access.avatar);
  const match = visitors.find(({ visitor }) => visitor.key === request.params.visitorKey);
  if (match === undefined) {
    return reply.notFound('Visitor not found');
  }

  const messages = await messagesCollection(access.db)
    .find({ threadId: { $in: match.threads.map((thread) => thread._id) } })
    .sort({ createdAt: 1 })
    .toArray();

  return {
    visitor: match.visitor,
    conversations: match.threads.map((thread) => ({
      chat: toThreadSummary(thread),
      messages: messages
        .filter((message) => message.threadId === thread._id)
        .map(toThreadMessage),
    })),
  };
}
