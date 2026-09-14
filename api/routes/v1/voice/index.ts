import type { FastifyInstance } from 'fastify';
import type { OpenVoiceSessionRequest } from '@measagent/shared';
import { openVoiceSession } from '../../../handlers/voice/open-voice-session.js';
import schemas from './schemas.js';

export default async function voiceRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: OpenVoiceSessionRequest }>(
    '/sessions',
    { schema: schemas.openVoiceSession },
    openVoiceSession
  );
}
