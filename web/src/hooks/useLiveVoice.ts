'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LiveVoiceClient,
  type LiveVoiceStatus,
  normalizeRealtimeUrl,
} from '@/lib/voice/realtime-client';
import { openVoiceSession } from '@/lib/voice/session-client';

const REALTIME_URL = normalizeRealtimeUrl(
  process.env.NEXT_PUBLIC_SPEECH_TO_SPEECH_URL ?? '',
);

const TURN_TAIL_MS = 1200;

export interface LiveVoiceSession {
  status: LiveVoiceStatus;
  spokenDraft: string;
  isHolding: boolean;
  isAvailable: boolean;
  error: string | null;
  beginHold: () => void;
  endHold: () => void;
}

interface UseLiveVoiceOptions {
  threadId: string | null;
  onUserSpoke: (text: string) => void;
  onReplyDelta: (text: string) => void;
  onReplyCompleted: () => void;
}


export function useLiveVoice({
  threadId,
  onUserSpoke,
  onReplyDelta,
  onReplyCompleted,
}: UseLiveVoiceOptions): LiveVoiceSession {
  const [status, setStatus] = useState<LiveVoiceStatus>('idle');
  const [spokenDraft, setSpokenDraft] = useState('');
  const [isHolding, setHolding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<LiveVoiceClient | null>(null);
  const connectionRef = useRef<Promise<LiveVoiceClient | null> | null>(null);
  const tailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read inside callbacks that are created once, where state would be stale.
  const callbacksRef = useRef({ onUserSpoke, onReplyDelta, onReplyCompleted });
  callbacksRef.current = { onUserSpoke, onReplyDelta, onReplyCompleted };

  const clearTailTimer = useCallback(() => {
    if (tailTimerRef.current === null) return;
    clearTimeout(tailTimerRef.current);
    tailTimerRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    clearTailTimer();
    clientRef.current?.disconnect();
    clientRef.current = null;
    connectionRef.current = null;
    setHolding(false);
    setSpokenDraft('');
  }, [clearTailTimer]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `threadId` is the change signal, not a value read in the body — the route marker is fixed when the session opens, so a new conversation must close the old session rather than reuse it.
  useEffect(() => disconnect, [disconnect, threadId]);

  const openSession = useCallback(
    async (url: string, chatId: string): Promise<LiveVoiceClient | null> => {
      setError(null);

      let routeMarker: string;
      try {
        routeMarker = await openVoiceSession(chatId);
      } catch {
        connectionRef.current = null;
        setStatus('error');
        setError('Could not start the voice session.');
        return null;
      }

      const client = new LiveVoiceClient({
        url,
        instructions: routeMarker,
        onStatusChange: setStatus,
        onTranscript: (transcript) => {
          if (transcript.role === 'user') {
            if (!transcript.isFinal) {
              setSpokenDraft(transcript.text);
              return;
            }
            // The sentence is settled: it stops being a draft in the composer
            // and becomes a message in the thread.
            setSpokenDraft('');
            setHolding(false);
            callbacksRef.current.onUserSpoke(transcript.text);
            return;
          }

          if (transcript.isFinal) {
            callbacksRef.current.onReplyCompleted();
          } else {
            callbacksRef.current.onReplyDelta(transcript.text);
          }
        },
        onError: (caught) => setError(caught.message),
      });

      clientRef.current = client;
      try {
        await client.connect();
        return client;
      } catch (caught) {
        clientRef.current = null;
        connectionRef.current = null;
        setStatus('error');
        setError(
          caught instanceof DOMException && caught.name === 'NotAllowedError'
            ? 'Microphone access was blocked. Allow it in your browser and try again.'
            : 'Could not start the voice session.',
        );
        return null;
      }
    },
    [],
  );

  const connect = useCallback((): Promise<LiveVoiceClient | null> => {
    if (REALTIME_URL === null || threadId === null) return Promise.resolve(null);
    if (clientRef.current !== null) return Promise.resolve(clientRef.current);

    connectionRef.current ??= openSession(REALTIME_URL, threadId);
    return connectionRef.current;
  }, [threadId, openSession]);

  const beginHold = useCallback(() => {
    clearTailTimer();
    setHolding(true);
    setSpokenDraft('');

    void connect().then((client) => {
      if (client === null) {
        setHolding(false);
        return;
      }
      client.setMicrophoneEnabled(true);
    });
  }, [connect, clearTailTimer]);

  const endHold = useCallback(() => {
    clearTailTimer();
    tailTimerRef.current = setTimeout(() => {
      tailTimerRef.current = null;
      clientRef.current?.setMicrophoneEnabled(false);
      setHolding(false);
    }, TURN_TAIL_MS);
  }, [clearTailTimer]);

  // Once the avatar is talking the turn is plainly over, so the microphone can
  // close early rather than waiting out the tail — and it must, or the avatar
  // hears itself.
  useEffect(() => {
    if (status !== 'speaking') return;
    clearTailTimer();
    clientRef.current?.setMicrophoneEnabled(false);
    setHolding(false);
  }, [status, clearTailTimer]);

  return {
    status,
    spokenDraft,
    isHolding,
    isAvailable: REALTIME_URL !== null && threadId !== null,
    error,
    beginHold,
    endHold,
  };
}
