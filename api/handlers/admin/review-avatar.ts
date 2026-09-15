import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ReviewAvatarRequest, ReviewAvatarResponse } from '@measagent/shared/admin';
import { toAvatarForReview } from '../../lib/avatars/avatar-for-review.js';
import { findAvatarWithOwner } from '../../lib/avatars/avatar-with-owner.js';
import { avatarsCollection } from '../../shared/collections.js';
import { isAdminRequest } from '../../shared/identity.js';

/**
 * `PATCH /v1/admin/avatars/:avatarId` — list or decline an avatar.
 *
 * Declining a listed avatar is how it is unlisted. Only the listing changes:
 * the avatar stays live at its link, because review decides what the front
 * page vouches for, not whether a person may have an avatar at all.
 */
export async function reviewAvatar(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Params: { avatarId: string }; Body: ReviewAvatarRequest }>,
  reply: FastifyReply
): Promise<ReviewAvatarResponse | undefined> {
  if (!isAdminRequest(request)) {
    return reply.unauthorized('Admin sign-in required');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const { avatarId } = request.params;
  const result = await avatarsCollection(db).updateOne(
    { _id: avatarId },
    { $set: { listing: request.body.listing, listingReviewedAt: new Date() } }
  );
  if (result.matchedCount === 0) {
    return reply.notFound('Avatar not found');
  }

  const reviewed = await findAvatarWithOwner(db, { _id: avatarId });
  if (reviewed === null) {
    return reply.notFound('Avatar not found');
  }

  return { avatar: toAvatarForReview(reviewed) };
}
