'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readDeviceId } from '@/lib/device-id';
import {
  LiveVoiceClient,
  type LiveVoiceStatus,
  normalizeRealtimeUrl,
} from '@/lib/voice/realtime-client';


const REALTIME_URL = normalizeRealtimeUrl(
  process.env.NEXT_PUBLIC_SPEECH_TO_SPEECH_URL ?? '',
);

export interface LiveVoiceSession {
  status: LiveVoiceStatus;
  liveTranscript: string;
  error: string | null;
  isAvailable: boolean;
  startSession: () => Promise<void>;
  stopSession: () => void;
}

interface UseLiveVoiceOptions {
  threadId: string | null;
  onTurnCompleted: () => void;
}

function buildInstructions(threadId: string): string {
  const marker = {
    threadId,
    userId: `device:${readDeviceId()}`,
    sessionId: crypto.randomUUID(),
  };
  return `ma-route: ${JSON.stringify(marker)}`;
}

export function useLiveVoice({
  threadId,
  onTurnCompleted,
}: UseLiveVoiceOptions): LiveVoiceSession {
  const [status, setStatus] = useState<LiveVoiceStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<LiveVoiceClient | null>(null);

  // Read inside callbacks that are created once, where state would be stale.
  const onTurnCompletedRef = useRef(onTurnCompleted);
  onTurnCompletedRef.current = onTurnCompleted;

  const stopSession = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setLiveTranscript('');
  }, []);

  useEffect(() => stopSession, [stopSession]);

  const startSession = useCallback(async () => {
    if (REALTIME_URL === null || threadId === null || clientRef.current !== null) return;

    setError(null);
    const client = new LiveVoiceClient({
      url: REALTIME_URL,
      instructions: buildInstructions(threadId),
      onStatusChange: setStatus,
      onTranscript: (transcript) => {
        setLiveTranscript(transcript.text);
        if (transcript.role === 'assistant' && transcript.isFinal) {
          onTurnCompletedRef.current();
        }
      },
      onError: (caught) => setError(caught.message),
    });

    clientRef.current = client;
    try {
      await client.connect();
    } catch (caught) {
      clientRef.current = null;
      setStatus('error');
      setError(
        caught instanceof DOMException && caught.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser and try again.'
          : 'Could not start the voice session.',
      );
    }
  }, [threadId]);

  return {
    status,
    liveTranscript,
    error,
    isAvailable: REALTIME_URL !== null,
    startSession,
    stopSession,
  };
}
