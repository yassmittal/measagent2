import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AvatarDirectoryResponse } from '@measagent/shared/avatars';
import {
  findAvatarsWithOwners,
  toAvatarProfile,
} from '../../lib/avatars/avatar-with-owner.js';

/**
 * `GET /v1/avatars` — the public directory.
 *
 * Every listed avatar, while it is live. Avatars are listed the moment they
 * launch and leave only when an admin unlists them. Newest first, so the front
 * page changes as people join.
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
    { createdAt: -1 }
  );

  return { avatars: listedAvatars.map(toAvatarProfile) };
}
