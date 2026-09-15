import { kokoroSpeechSynthesizer } from './kokoro.js';
import type { SpeechSynthesizer } from './types.js';

export type { SpeechSynthesizer, SynthesizedSpeech } from './types.js';

/**
 * The single place a voice provider is chosen. Every avatar shares this one
 * voice for now; giving each avatar its own would start here.
 */
export function getSpeechSynthesizer(): SpeechSynthesizer {
  return kokoroSpeechSynthesizer;
}
