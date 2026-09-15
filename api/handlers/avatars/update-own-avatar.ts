import type { FastifyReply, FastifyRequest } from 'fastify';
import type { OwnAvatarResponse, UpdateOwnAvatarRequest } from '@measagent/shared/avatars';
import { buildOwnAvatarChanges, toOwnAvatar } from '../../lib/avatars/own-avatar.js';
import { avatarsCollection, usersCollection } from '../../shared/collections.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/**
 * `PATCH /v1/me/avatar` — edit or pause the signed-in account's avatar.
 *
 * The filter is the caller's own owner id and nothing from the request, so
 * there is no avatar id an owner could swap in to edit someone else's.
 */
export async function updateOwnAvatar(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: UpdateOwnAvatarRequest }>,
  reply: FastifyReply
): Promise<OwnAvatarResponse | undefined> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Not signed in');
  }

  if (request.body.bio !== undefined && request.body.bio.trim() === '') {
    return reply.badRequest('`bio` must not be empty');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const [owner, current] = await Promise.all([
    usersCollection(db).findOne({ _id: ownerId }),
    avatarsCollection(db).findOne({ ownerId }),
  ]);
  if (owner === null) {
    return reply.unauthorized('That account no longer exists');
  }
  if (current === null) {
    return reply.notFound('You have not launched an avatar yet');
  }

  const updated = await avatarsCollection(db).findOneAndUpdate(
    { _id: current._id, ownerId },
    { $set: buildOwnAvatarChanges(current, request.body, new Date()) },
    { returnDocument: 'after' }
  );
  if (updated === null) {
    return reply.notFound('You have not launched an avatar yet');
  }

  return { avatar: toOwnAvatar(updated, owner) };
}
