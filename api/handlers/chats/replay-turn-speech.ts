import type { FastifyReply, FastifyRequest } from 'fastify';
import { toSpeakableText } from '../../lib/speech/speakable-text.js';
import { getSpeechSynthesizer } from '../../services/speech/index.js';
import { messagesCollection } from '../../shared/collections.js';
import { MAX_SPOKEN_REPLY_LENGTH } from '../../shared/constants.js';
import { getErrorMessage } from '../../shared/errors.js';
import { readOwnerId } from '../../shared/identity.js';

export interface ReplayTurnSpeechParams {
  chatId: string;
  turnId: string;
}

export async function replayTurnSpeech(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Params: ReplayTurnSpeechParams }>,
  reply: FastifyReply
): Promise<void> {
  const ownerId = readOwnerId(request);
  if (ownerId === null) {
    return reply.badRequest('A valid x-device-id header is required');
  }

  const synthesizer = getSpeechSynthesizer();
  if (!synthesizer.isConfigured()) {
    return reply.serviceUnavailable('Text-to-speech is not configured');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const { chatId, turnId } = request.params;
  const message = await messagesCollection(db).findOne({
    threadId: chatId,
    turnId,
    userId: ownerId,
    role: 'assistant',
  });

  if (message === null) {
    return reply.notFound('Turn not found');
  }

  const spoken = toSpeakableText(message.text).slice(0, MAX_SPOKEN_REPLY_LENGTH);
  if (spoken === '') {
    return reply.badRequest('That reply has nothing to say out loud');
  }

  try {
    const speech = await synthesizer.synthesizeSpeech(spoken);
    return reply
      .header('Content-Type', speech.contentType)
      .header('Cache-Control', 'no-store')
      .send(speech.audio);
  } catch (error) {
    this.log.error(
      { err: error, chatId, turnId, provider: synthesizer.name },
      'Speech replay failed'
    );
    return reply.serviceUnavailable(getErrorMessage(error));
  }
}
