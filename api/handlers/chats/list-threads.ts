import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ListThreadsQuery, ListThreadsResponse } from '@measagent/shared';
import { toThreadSummary } from '../../lib/chat/messages.js';
import { threadsCollection } from '../../shared/collections.js';
import { THREAD_LIST_LIMIT } from '../../shared/constants.js';
import { readCaller } from '../../shared/identity.js';

/**
 * `GET /v1/chats` — this caller's conversations with one avatar, most recent first.
 *
 * There is no conversation list in the UI; what needs this is a browser that
 * has just signed in on a machine it has never chatted on, and has to find the
 * conversation to reopen. Hence newest-first with a limit rather than paging.
 */
export async function listThreads(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Querystring: ListThreadsQuery }>,
  reply: FastifyReply
): Promise<ListThreadsResponse | undefined> {
  const caller = readCaller(request);
  if (caller === null) {
    return reply.badRequest('Sign in, or send a valid x-device-id header');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const threads = await threadsCollection(db)
    .find({ userId: caller.ownerId, avatarId: request.query.avatarId })
    .sort({ lastMessageAt: -1 })
    .limit(THREAD_LIST_LIMIT)
    .toArray();

  return { chats: threads.map(toThreadSummary) };
}
