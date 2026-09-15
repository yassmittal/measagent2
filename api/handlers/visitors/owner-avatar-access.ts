import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from 'mongodb';
import { hasAcceptedTerms } from '../../lib/auth/user-profile.js';
import { avatarsCollection, usersCollection } from '../../shared/collections.js';
import type { AvatarDoc } from '../../shared/documents.js';
import { readSessionOwnerId } from '../../shared/identity.js';

export interface OwnerAvatarAccess {
  db: Db;
  avatar: AvatarDoc;
}

/**
 * The gate in front of everything an owner reads about their visitors. Only a
 * session token counts — a device, a voice marker or the admin token is not an
 * owner — and the avatar is looked up by the caller, never named by the
 * request, so there is no id to swap for someone else's.
 *
 * The owner must have accepted the terms too: they say what visitors are told,
 * and reading other people's conversations is the part of them that matters most.
 *
 * Replies itself and returns null when access is refused.
 */
export async function loadOwnerAvatarAccess(
  server: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<OwnerAvatarAccess | null> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    reply.unauthorized('Not signed in');
    return null;
  }

  const db = server.mongo.db;
  if (db === undefined) {
    reply.serviceUnavailable('Storage is not available');
    return null;
  }

  const [owner, avatar] = await Promise.all([
    usersCollection(db).findOne({ _id: ownerId }),
    avatarsCollection(db).findOne({ ownerId }),
  ]);
  if (owner === null) {
    reply.unauthorized('That account no longer exists');
    return null;
  }
  if (!hasAcceptedTerms(owner)) {
    reply.forbidden('Accept the terms to see who talks to your avatar');
    return null;
  }
  if (avatar === null) {
    reply.notFound('You have not launched an avatar yet');
    return null;
  }

  return { db, avatar };
}
