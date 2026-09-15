import type { FastifyReply, FastifyRequest } from 'fastify';
import type { OpenVoiceSessionRequest, OpenVoiceSessionResponse } from '@measagent/shared';
import { TOKEN_PURPOSE } from '../../lib/auth/token-purpose.js';
import { encodeRouteMarker } from '../../lib/voice/route-marker.js';
import { avatarsCollection, threadsCollection } from '../../shared/collections.js';
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

  // The marker itself does not need to carry the avatar — every spoken turn
  // reads it from the thread — but a session is not worth opening onto an
  // avatar that will refuse every turn in it.
  const avatar = await avatarsCollection(db).findOne({ _id: thread.avatarId });
  if (avatar?.availability !== 'live') {
    return reply.conflict('This avatar is not taking conversations');
  }

  const routeMarker = encodeRouteMarker(
    this.jwt.sign(
      { sub: caller.ownerId, threadId: thread._id, purpose: TOKEN_PURPOSE.voiceSession },
      { expiresIn: VOICE_SESSION_LIFETIME }
    )
  );

  return { routeMarker };
}
