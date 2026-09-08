import type { ThreadMessage, ThreadSummary } from './messages.js';

export interface TurnStartedEvent {
  type: 'turn_started';
  chat: ThreadSummary;
  turnId: string;
  userMessage: ThreadMessage;
  replyMessageId: string;
}

export interface TurnDeltaEvent {
  type: 'delta';
  text: string;
}

export interface TurnCompletedEvent {
  type: 'turn_completed';
  message: ThreadMessage;
}

export interface TurnFailedEvent {
  type: 'turn_failed';
  code: string;
  message: string;
  retryable: boolean;
}

export interface AudioDeltaEvent {
  type: 'audio_delta';
  audio: string;
  format: string;
  sequence: number;
}

export interface AudioCompletedEvent {
  type: 'audio_done';
  charactersSynthesized: number;
}

export type VoiceUnavailableReason = 'not_configured' | 'synthesis_failed';

export interface VoiceUnavailableEvent {
  type: 'voice_unavailable';
  reason: VoiceUnavailableReason;
}

export type ChatStreamEvent =
  | TurnStartedEvent
  | TurnDeltaEvent
  | TurnCompletedEvent
  | TurnFailedEvent
  | AudioDeltaEvent
  | AudioCompletedEvent
  | VoiceUnavailableEvent;
