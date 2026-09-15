import type { FastifyReply, FastifyRequest } from 'fastify';
import { forgetVisitorMemory } from '../../lib/memory/relationships.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/** `DELETE /v1/relationships/:avatarId` — one avatar forgets the caller. */
export async function forgetRelationship(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Params: { avatarId: string } }>,
  reply: FastifyReply
): Promise<void> {
  await forgetForCaller(this, request, reply, request.params.avatarId);
}

/** `DELETE /v1/relationships` — every avatar forgets the caller. */
export async function forgetAllRelationships(
  this: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await forgetForCaller(this, request, reply, null);
}

async function forgetForCaller(
  fastify: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply,
  avatarId: string | null
): Promise<void> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Not signed in');
  }

  const db = fastify.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  // Forgetting something that was never remembered is still a success: the
  // caller asked for a state, and that state now holds.
  await forgetVisitorMemory(db, ownerId, avatarId);
  return reply.code(204).send();
}
