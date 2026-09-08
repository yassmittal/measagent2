import type { FastifyReply, FastifyRequest } from 'fastify';
import { getStreamingTranscriber } from '../../services/transcription/index.js';
import { getErrorMessage } from '../../shared/errors.js';
import { readOwnerId } from '../../shared/identity.js';

export async function createTranscriptionSession(
  this: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const ownerId = readOwnerId(request);
  if (ownerId === null) {
    return reply.badRequest('A valid x-device-id header is required');
  }

  const transcriber = getStreamingTranscriber();
  if (!transcriber.isConfigured()) {
    return reply.serviceUnavailable('Speech-to-text is not configured');
  }

  try {
    return reply.send(await transcriber.createSession());
  } catch (error) {
    this.log.error(
      { err: error, provider: transcriber.name },
      'Could not mint a transcription session'
    );
    return reply.serviceUnavailable(getErrorMessage(error));
  }
}
