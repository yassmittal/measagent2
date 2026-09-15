import type { FastifyInstance } from 'fastify';
import { listAvatarDirectory } from '../../../handlers/avatars/list-avatar-directory.js';
import { loadAvatarProfile } from '../../../handlers/avatars/load-avatar-profile.js';
import schemas from './schemas.js';

export default async function avatarRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { schema: schemas.listAvatarDirectory }, listAvatarDirectory);

  fastify.get<{ Params: { handle: string } }>(
    '/:handle',
    { schema: schemas.loadAvatarProfile },
    loadAvatarProfile
  );
}
