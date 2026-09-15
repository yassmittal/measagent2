import type { FastifyInstance } from 'fastify';
import type { AvatarsForReviewQuery, ReviewAvatarRequest } from '@measagent/shared/admin';
import { listAvatarsForReview } from '../../../../handlers/admin/list-avatars-for-review.js';
import { reviewAvatar } from '../../../../handlers/admin/review-avatar.js';
import schemas from './schemas.js';

export default async function adminAvatarRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: AvatarsForReviewQuery }>(
    '/',
    { schema: schemas.listAvatarsForReview },
    listAvatarsForReview
  );

  fastify.patch<{ Params: { avatarId: string }; Body: ReviewAvatarRequest }>(
    '/:avatarId',
    { schema: schemas.reviewAvatar },
    reviewAvatar
  );
}
