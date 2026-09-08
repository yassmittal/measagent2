'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SpeechCaptureError,
  type SpeechCaptureFailure,
  SpeechCaptureSession,
} from '@/lib/voice/speech-capture';

export type SpeechCaptureStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'finishing';

export interface SpeechCapture {
  status: SpeechCaptureStatus;
  partialTranscript: string;
  unavailableReason: SpeechCaptureFailure | null;
  isCapturing: boolean;
  isListening: boolean;
  startCapture: () => void;
  finishCapture: () => void;
  cancelCapture: () => void;
}

interface UseSpeechCaptureOptions {
  onTranscribed: (transcript: string) => void;
}

export function useSpeechCapture({
  onTranscribed,
}: UseSpeechCaptureOptions): SpeechCapture {
  const [status, setStatus] = useState<SpeechCaptureStatus>('idle');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [unavailableReason, setUnavailableReason] = useState<SpeechCaptureFailure | null>(
    null,
  );

  const sessionRef = useRef<SpeechCaptureSession | null>(null);

  const isHeldRef = useRef(false);

  const onTranscribedRef = useRef(onTranscribed);
  onTranscribedRef.current = onTranscribed;

  const cancelCapture = useCallback(() => {
    isHeldRef.current = false;
    sessionRef.current?.abort();
    sessionRef.current = null;
    setStatus('idle');
    setPartialTranscript('');
  }, []);

  const finishCapture = useCallback(async () => {
    isHeldRef.current = false;

    const session = sessionRef.current;
    if (session === null) return;
    sessionRef.current = null;

    setStatus('finishing');
    const transcript = (await session.stop()).trim();
    setStatus('idle');
    setPartialTranscript('');

    if (transcript !== '') onTranscribedRef.current(transcript);
  }, []);

  const startCapture = useCallback(async () => {
    if (sessionRef.current !== null) return;

    isHeldRef.current = true;
    setStatus('starting');
    setPartialTranscript('');
    setUnavailableReason(null);

    const session = new SpeechCaptureSession({
      onTranscriptChange: setPartialTranscript,
    });
    sessionRef.current = session;

    try {
      await session.start();
    } catch (error) {
      session.abort();
      sessionRef.current = null;
      isHeldRef.current = false;
      setStatus('idle');
      setUnavailableReason(
        error instanceof SpeechCaptureError ? error.failure : 'unreachable',
      );
      return;
    }

    if (!isHeldRef.current) {
      await finishCapture();
      return;
    }

    setStatus('listening');
  }, [finishCapture]);

  useEffect(() => {
    if (unavailableReason !== null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || isTypingInto(event.target)) return;
      event.preventDefault();
      void startCapture();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !isHeldRef.current) return;
      event.preventDefault();
      void finishCapture();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startCapture, finishCapture, unavailableReason]);

  useEffect(() => cancelCapture, [cancelCapture]);

  return {
    status,
    partialTranscript,
    unavailableReason,
    isCapturing: status !== 'idle',
    isListening: status === 'listening',
    startCapture: () => void startCapture(),
    finishCapture: () => void finishCapture(),
    cancelCapture,
  };
}

function isTypingInto(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA'
  );
}
