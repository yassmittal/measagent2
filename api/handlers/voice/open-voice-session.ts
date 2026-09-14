import type { FastifyReply, FastifyRequest } from 'fastify';
import type { OpenVoiceSessionRequest, OpenVoiceSessionResponse } from '@measagent/shared';
import { encodeRouteMarker } from '../../lib/voice/route-marker.js';
import { threadsCollection } from '../../shared/collections.js';
import { VOICE_SESSION_LIFETIME } from '../../shared/constants.js';
import { readCaller } from '../../shared/identity.js';

export async function openVoiceSession(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: OpenVoiceSessionRequest }>,
  reply: FastifyReply
): Promise<OpenVoiceSessionResponse | undefined> {
  const caller = readCaller(request);
  if (caller === null) {
    return reply.badRequest('Sign in, or send a valid x-device-id header');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const thread = await threadsCollection(db).findOne({
    _id: request.body.chatId,
    userId: caller.ownerId,
  });
  if (thread === null) {
    return reply.notFound('Chat not found');
  }

  const routeMarker = encodeRouteMarker(
    this.jwt.sign(
      { sub: caller.ownerId, threadId: thread._id },
      { expiresIn: VOICE_SESSION_LIFETIME }
    )
  );

  return { routeMarker };
}
