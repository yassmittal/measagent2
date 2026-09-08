import type { TranscriptionSession } from '@measagent/shared';

export interface StreamingTranscriber {
  readonly name: string;
  isConfigured(): boolean;
  createSession(): Promise<TranscriptionSession>;
}
