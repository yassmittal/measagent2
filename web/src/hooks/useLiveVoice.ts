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

/**
 * How long the microphone stays open after the button is released.
 *
 * The voice service decides for itself when a turn has ended, by listening for
 * the silence that follows speech — so cutting the audio dead on release would
 * leave it waiting for an ending that never arrives. This tail is that silence.
 */
const TURN_TAIL_MS = 1200;

export interface LiveVoiceSession {
  status: LiveVoiceStatus;
  /** What the visitor is saying, while they are still saying it. */
  spokenDraft: string;
  /** True from the press until the turn has been handed to the service. */
  isHolding: boolean;
  isAvailable: boolean;
  error: string | null;
  beginHold: () => void;
  endHold: () => void;
}

interface UseLiveVoiceOptions {
  threadId: string | null;
  /** The visitor's finished sentence, ready to show as a message. */
  onUserSpoke: (text: string) => void;
  /** A piece of the reply, as it is being spoken. */
  onReplyDelta: (text: string) => void;
  onReplyCompleted: () => void;
}

function buildInstructions(threadId: string): string {
  const marker = {
    threadId,
    userId: `device:${readDeviceId()}`,
    sessionId: crypto.randomUUID(),
  };
  return `ma-route: ${JSON.stringify(marker)}`;
}

/**
 * Hold-to-speak over a live voice session.
 *
 * The socket is opened once and then kept, because opening it costs a
 * microphone permission and a service handshake — far too much to pay on every
 * press. Holding the button only decides whether the microphone's audio is
 * actually being sent, so the second press is instant.
 */
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
    setHolding(false);
    setSpokenDraft('');
  }, [clearTailTimer]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `threadId` is the change signal, not a value read in the body — the route marker is fixed when the session opens, so a new conversation must close the old session rather than reuse it.
  useEffect(() => disconnect, [disconnect, threadId]);

  const connect = useCallback(async (): Promise<LiveVoiceClient | null> => {
    if (REALTIME_URL === null || threadId === null) return null;
    if (clientRef.current !== null) return clientRef.current;

    setError(null);
    const client = new LiveVoiceClient({
      url: REALTIME_URL,
      instructions: buildInstructions(threadId),
      onStatusChange: setStatus,
      onTranscript: (transcript) => {
        if (transcript.role === 'user') {
          if (!transcript.isFinal) {
            setSpokenDraft(transcript.text);
            return;
          }
          // The sentence is settled: it stops being a draft in the composer and
          // becomes a message in the thread.
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
      setStatus('error');
      setError(
        caught instanceof DOMException && caught.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser and try again.'
          : 'Could not start the voice session.',
      );
      return null;
    }
  }, [threadId]);

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
