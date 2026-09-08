import { kokoroSpeechSynthesizer } from './kokoro.js';
import type { SpeechSynthesizer } from './types.js';

export type { SpeechSynthesizer, SynthesizedSpeech } from './types.js';

/**
 * The single place a voice provider is chosen. Swapping Stage 2's Kokoro for
 * an ElevenLabs clone of Yash is an edit here and nowhere else.
 */
export function getSpeechSynthesizer(): SpeechSynthesizer {
  return kokoroSpeechSynthesizer;
}

export function isSpeechSynthesisConfigured(): boolean {
  return getSpeechSynthesizer().isConfigured();
}
