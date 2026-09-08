import type { FastifyBaseLogger } from 'fastify';
import { createSpeakableChunker } from '../../lib/speech/sentence-chunker.js';
import {
  getSpeechSynthesizer,
  type SpeechSynthesizer,
} from '../../services/speech/index.js';
import type { ChatEventStream } from '../../shared/chat-stream.js';
import { MAX_SPOKEN_REPLY_LENGTH } from '../../shared/constants.js';
import { getErrorMessage } from '../../shared/errors.js';


export interface ReplyVoice {
  speak(replyDelta: string): void;
  finish(): Promise<void>;
}

interface ReplyVoiceOptions {
  stream: ChatEventStream;
  log: FastifyBaseLogger;
  turnId: string;
  enabled: boolean;
  synthesizer?: SpeechSynthesizer;
}

export function createReplyVoice({
  stream,
  log,
  turnId,
  enabled,
  synthesizer = getSpeechSynthesizer(),
}: ReplyVoiceOptions): ReplyVoice {
  if (!enabled) return silentVoice();

  if (!synthesizer.isConfigured()) {
    stream.send({ type: 'voice_unavailable', reason: 'not_configured' });
    return silentVoice();
  }

  const chunker = createSpeakableChunker();
  let sequence = 0;
  let charactersSynthesized = 0;
  let abandoned = false;

  let queue: Promise<void> = Promise.resolve();

  const enqueue = (chunk: string): void => {
    queue = queue.then(async () => {
      if (abandoned || stream.isClosed) return;
      if (charactersSynthesized >= MAX_SPOKEN_REPLY_LENGTH) return;

      try {
        const spoken = await synthesizer.synthesizeSpeech(chunk);
        if (stream.isClosed) return;

        stream.send({
          type: 'audio_delta',
          audio: spoken.audio.toString('base64'),
          format: spoken.contentType,
          sequence: sequence++,
        });
        charactersSynthesized += chunk.length;
      } catch (error) {
        abandoned = true;
        log.error(
          { err: error, turnId, provider: synthesizer.name },
          'Speech synthesis failed; continuing without voice'
        );
        stream.send({ type: 'voice_unavailable', reason: 'synthesis_failed' });
      }
    });
  };

  return {
    speak(replyDelta) {
      if (abandoned) return;
      for (const chunk of chunker.takeCompleteChunks(replyDelta)) enqueue(chunk);
    },

    async finish() {
      if (!abandoned) {
        for (const chunk of chunker.takeRemainder()) enqueue(chunk);
      }

      try {
        await queue;
      } catch (error) {
        log.error({ err: getErrorMessage(error), turnId }, 'Speech queue broke');
        return;
      }

      if (abandoned || stream.isClosed) return;
      stream.send({ type: 'audio_done', charactersSynthesized });
    },
  };
}

/** Used when there is no provider: the turn runs exactly as it did in Stage 1. */
function silentVoice(): ReplyVoice {
  return {
    speak() {},
    async finish() {},
  };
}
