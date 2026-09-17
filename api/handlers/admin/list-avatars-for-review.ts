import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  AvatarsForReviewQuery,
  AvatarsForReviewResponse,
} from '@measagent/shared/admin';
import { findAvatarsWithOwners } from '../../lib/avatars/avatar-with-owner.js';
import { toAvatarForReview } from '../../lib/avatars/avatar-for-review.js';
import { isAdminRequest } from '../../shared/identity.js';

/**
 * `GET /v1/admin/avatars?listing=` — one tab of the admin portal.
 *
 * Avatars go live without review, so listed and pending come most recently
 * changed first: that is what an admin needs to look at. Unlisted comes most
 * recently taken down first.
 */
export async function listAvatarsForReview(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Querystring: AvatarsForReviewQuery }>,
  reply: FastifyReply
): Promise<AvatarsForReviewResponse | undefined> {
  if (!isAdminRequest(request)) {
    return reply.unauthorized('Admin sign-in required');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const { listing } = request.query;
  const avatars = await findAvatarsWithOwners(
    db,
    { listing },
    listing === 'declined' ? { listingReviewedAt: -1 } : { updatedAt: -1 }
  );

  return { avatars: avatars.map(toAvatarForReview) };
}
