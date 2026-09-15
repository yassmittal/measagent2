import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RelationshipResponse } from '@measagent/shared';
import { hasAcceptedTerms } from '../../lib/auth/user-profile.js';
import { countVisitorMessages, toVisitorMemory } from '../../lib/memory/relationships.js';
import {
  avatarsCollection,
  relationshipsCollection,
  usersCollection,
} from '../../shared/collections.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/**
 * `GET /v1/relationships/:avatarId` — what one avatar remembers about the
 * caller, for the caller alone. Signed-in only: a device is never remembered,
 * so there would be nothing to show it.
 */
export async function loadRelationship(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Params: { avatarId: string } }>,
  reply: FastifyReply
): Promise<RelationshipResponse | undefined> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Not signed in');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const { avatarId } = request.params;
  const avatar = await avatarsCollection(db).findOne({ _id: avatarId }, { projection: { _id: 1 } });
  if (avatar === null) {
    return reply.notFound('Avatar not found');
  }

  const visitor = await usersCollection(db).findOne({ _id: ownerId });
  if (visitor === null) {
    return reply.unauthorized('That account no longer exists');
  }

  const relationship = hasAcceptedTerms(visitor)
    ? await relationshipsCollection(db).findOne({ userId: ownerId, avatarId })
    : null;
  const memory = relationship === null ? null : toVisitorMemory(relationship);

  return {
    isMemoryOn: hasAcceptedTerms(visitor),
    userMessageCount: await countVisitorMessages(db, ownerId, avatarId),
    memory,
    memoryUpdatedAt: memory === null ? null : (relationship?.updatedAt.toISOString() ?? null),
  };
}
