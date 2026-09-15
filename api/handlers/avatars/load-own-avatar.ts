import type { FastifyReply, FastifyRequest } from 'fastify';
import type { OwnAvatarResponse } from '@measagent/shared/avatars';
import { toOwnAvatar } from '../../lib/avatars/own-avatar.js';
import { avatarsCollection, usersCollection } from '../../shared/collections.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/** `GET /v1/me/avatar` — the signed-in account's avatar, or 404 if it has none. */
export async function loadOwnAvatar(
  this: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<OwnAvatarResponse | undefined> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Not signed in');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const [owner, avatar] = await Promise.all([
    usersCollection(db).findOne({ _id: ownerId }),
    avatarsCollection(db).findOne({ ownerId }),
  ]);
  if (owner === null) {
    return reply.unauthorized('That account no longer exists');
  }
  if (avatar === null) {
    return reply.notFound('You have not launched an avatar yet');
  }

  return { avatar: toOwnAvatar(avatar, owner) };
}
