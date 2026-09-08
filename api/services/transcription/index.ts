import { assemblyAiTranscriber } from './assemblyai.js';
import type { StreamingTranscriber } from './types.js';

export type { StreamingTranscriber } from './types.js';

export function getStreamingTranscriber(): StreamingTranscriber {
  return assemblyAiTranscriber;
}

export function isTranscriptionConfigured(): boolean {
  return getStreamingTranscriber().isConfigured();
}
