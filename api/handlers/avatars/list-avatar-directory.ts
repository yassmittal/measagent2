import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AvatarDirectoryResponse } from '@measagent/shared/avatars';
import {
  findAvatarsWithOwners,
  toAvatarProfile,
} from '../../lib/avatars/avatar-with-owner.js';

/**
 * `GET /v1/avatars` — the public directory.
 *
 * Only reviewed avatars appear, and only while they are live: launching is
 * self-serve, but a list on the front page is something the product vouches
 * for. Newest approval first, so the directory changes as people are let in.
 */
export async function listAvatarDirectory(
  this: FastifyRequest['server'],
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<AvatarDirectoryResponse | undefined> {
  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const listedAvatars = await findAvatarsWithOwners(
    db,
    { listing: 'listed', availability: 'live' },
    { listingReviewedAt: -1 }
  );

  return { avatars: listedAvatars.map(toAvatarProfile) };
}
