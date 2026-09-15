import type { FastifyReply, FastifyRequest } from 'fastify';
import type { OwnerVisitorsResponse } from '@measagent/shared';
import { findAvatarVisitors } from '../../lib/visitors/avatar-visitors.js';
import { loadOwnerAvatarAccess } from './owner-avatar-access.js';

/** `GET /v1/me/avatar/visitors` — everyone the owner may see talking to their avatar. */
export async function listOwnVisitors(
  this: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<OwnerVisitorsResponse | FastifyReply> {
  const access = await loadOwnerAvatarAccess(this, request, reply);
  if (access === null) return reply;

  const { visitors, hiddenConversationCount } = await findAvatarVisitors(access.db, access.avatar);
  return { visitors: visitors.map(({ visitor }) => visitor), hiddenConversationCount };
}
