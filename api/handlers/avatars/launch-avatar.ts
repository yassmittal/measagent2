import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LaunchAvatarRequest, OwnAvatarResponse } from '@measagent/shared/avatars';
import { MongoServerError } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { isReservedAvatarHandle } from '../../lib/avatars/handle.js';
import { toOwnAvatar } from '../../lib/avatars/own-avatar.js';
import { hasAcceptedTerms } from '../../lib/auth/user-profile.js';
import { avatarsCollection, usersCollection } from '../../shared/collections.js';
import type { AvatarDoc } from '../../shared/documents.js';
import { readSessionOwnerId } from '../../shared/identity.js';

const MONGO_DUPLICATE_KEY = 11000;

/**
 * `POST /v1/me/avatar` — launch the signed-in account's avatar.
 *
 * Only an account can launch, because the only rule that keeps this an avatar
 * *of yourself* is that its name and face come from the Google account behind
 * it. It is live at its link straight away and listed in the directory only
 * once it has been reviewed.
 */
export async function launchAvatar(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: LaunchAvatarRequest }>,
  reply: FastifyReply
): Promise<OwnAvatarResponse | undefined> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Sign in to launch an avatar');
  }

  const bio = request.body.bio.trim();
  if (bio === '') {
    return reply.badRequest('`bio` must not be empty');
  }

  const { handle } = request.body;
  if (isReservedAvatarHandle(handle)) {
    return reply.badRequest(`"${handle}" is reserved. Choose another handle.`);
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const owner = await usersCollection(db).findOne({ _id: ownerId });
  if (owner === null) {
    return reply.unauthorized('That account no longer exists');
  }
  // Launching publishes something under this person's name, so unlike talking
  // it waits for the terms — checked here, not just hidden behind the card.
  if (!hasAcceptedTerms(owner)) {
    return reply.forbidden('Accept the terms before launching an avatar');
  }

  const now = new Date();
  const avatar: AvatarDoc = {
    _id: uuidv4(),
    ownerId,
    handle,
    bio,
    aboutMe: request.body.aboutMe.trim(),
    speakingStyle: request.body.speakingStyle.trim(),
    avoidTopics: request.body.avoidTopics.trim(),
    availability: 'live',
    listing: 'pending',
    listingReviewedAt: null,
    ownerAttestedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await avatarsCollection(db).insertOne(avatar);
  } catch (error) {
    // The unique indexes are the check, so two launches racing each other
    // cannot both win the way a read-then-insert would let them.
    if (error instanceof MongoServerError && error.code === MONGO_DUPLICATE_KEY) {
      return 'ownerId' in (error.keyPattern ?? {})
        ? reply.conflict('This account already has an avatar')
        : reply.conflict(`The handle "${handle}" is taken`);
    }
    throw error;
  }

  reply.status(201);
  return { avatar: toOwnAvatar(avatar, owner) };
}
