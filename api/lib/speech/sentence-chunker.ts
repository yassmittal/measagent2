import { toSpeakableText } from './speakable-text.js';

const MIN_CHUNK_CHARACTERS = 120;
const MAX_CHUNK_CHARACTERS = 480;

const SENTENCE_END = /[.!?…]["')\]]?\s$/;

export interface SpeakableChunker {
  takeCompleteChunks(replyDelta: string): string[];
  takeRemainder(): string[];
}

export function createSpeakableChunker(): SpeakableChunker {
  let pending = '';

  const cut = (length: number): string => {
    const chunk = pending.slice(0, length);
    pending = pending.slice(length);
    return chunk;
  };

  const takeReadyChunk = (): string | null => {
    if (pending.length >= MAX_CHUNK_CHARACTERS) {
      const lastBreak = pending.lastIndexOf(' ', MAX_CHUNK_CHARACTERS);
      return cut(lastBreak > MIN_CHUNK_CHARACTERS ? lastBreak : MAX_CHUNK_CHARACTERS);
    }
    if (pending.length >= MIN_CHUNK_CHARACTERS && SENTENCE_END.test(pending)) {
      return cut(pending.length);
    }
    return null;
  };

  return {
    takeCompleteChunks(replyDelta) {
      pending += replyDelta;

      const ready: string[] = [];
      for (let chunk = takeReadyChunk(); chunk !== null; chunk = takeReadyChunk()) {
        const speakable = toSpeakableText(chunk);
        if (speakable !== '') ready.push(speakable);
      }
      return ready;
    },

    takeRemainder() {
      const speakable = toSpeakableText(pending);
      pending = '';
      return speakable === '' ? [] : [speakable];
    },
  };
}
