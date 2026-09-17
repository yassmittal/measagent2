import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AvatarProfileResponse } from '@measagent/shared/avatars';
import {
  findAvatarWithOwner,
  toAvatarProfile,
} from '../../lib/avatars/avatar-with-owner.js';

/**
 * `GET /v1/avatars/:handle` — what the avatar's page shows.
 *
 * Unlisted avatars are served too: an admin unlisting an avatar takes it off
 * the directory, not off its own link. A
 * paused avatar is returned as paused rather than hidden, so its page can say
 * so instead of claiming the handle does not exist.
 */
export async function loadAvatarProfile(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Params: { handle: string } }>,
  reply: FastifyReply
): Promise<AvatarProfileResponse | undefined> {
  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const avatarWithOwner = await findAvatarWithOwner(db, { handle: request.params.handle });
  if (avatarWithOwner === null) {
    return reply.notFound('Avatar not found');
  }

  return { avatar: toAvatarProfile(avatarWithOwner) };
}
