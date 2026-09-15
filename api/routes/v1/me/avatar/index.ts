import type { FastifyInstance } from 'fastify';
import type { LaunchAvatarRequest, UpdateOwnAvatarRequest } from '@measagent/shared/avatars';
import { launchAvatar } from '../../../../handlers/avatars/launch-avatar.js';
import { loadOwnAvatar } from '../../../../handlers/avatars/load-own-avatar.js';
import { updateOwnAvatar } from '../../../../handlers/avatars/update-own-avatar.js';
import schemas from './schemas.js';

export default async function ownAvatarRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { schema: schemas.loadOwnAvatar }, loadOwnAvatar);

  fastify.post<{ Body: LaunchAvatarRequest }>(
    '/',
    { schema: schemas.launchAvatar },
    launchAvatar
  );

  fastify.patch<{ Body: UpdateOwnAvatarRequest }>(
    '/',
    { schema: schemas.updateOwnAvatar },
    updateOwnAvatar
  );
}
