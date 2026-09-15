import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  AvatarsForReviewQuery,
  AvatarsForReviewResponse,
} from '@measagent/shared/admin';
import { findAvatarsWithOwners } from '../../lib/avatars/avatar-with-owner.js';
import { toAvatarForReview } from '../../lib/avatars/avatar-for-review.js';
import { isAdminRequest } from '../../shared/identity.js';

/**
 * `GET /v1/admin/avatars?listing=` — one column of the review board.
 *
 * Pending is a queue, so the longest-waiting avatar comes first; the other two
 * are history, so the most recent decision does.
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
    listing === 'pending' ? { updatedAt: 1 } : { listingReviewedAt: -1 }
  );

  return { avatars: avatars.map(toAvatarForReview) };
}
