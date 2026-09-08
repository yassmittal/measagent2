'use client';

import type { AudioDeltaEvent } from '@measagent/shared';
import { useCallback, useEffect, useRef } from 'react';

export interface SpeechPlayback {
  enqueueSpan: (span: AudioDeltaEvent) => void;
  stopPlayback: () => void;
}

function toAudioUrl(base64: string, format: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return URL.createObjectURL(new Blob([bytes], { type: format }));
}

export function useSpeechPlayback(): SpeechPlayback {
  const elementRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const pendingRef = useRef(new Map<number, AudioDeltaEvent>());
  const nextSequenceRef = useRef(0);
  const playingRef = useRef(false);

  const playNext = useCallback(() => {
    const element = elementRef.current;
    const nextUrl = queueRef.current.shift();

    if (element === null || nextUrl === undefined) {
      playingRef.current = false;
      return;
    }

    playingRef.current = true;
    element.src = nextUrl;
    void element.play().catch(() => {
      URL.revokeObjectURL(nextUrl);
      playNext();
    });
  }, []);

  useEffect(() => {
    const element = new Audio();
    elementRef.current = element;

    const onEnded = () => {
      URL.revokeObjectURL(element.src);
      playNext();
    };
    element.addEventListener('ended', onEnded);
    element.addEventListener('error', onEnded);

    return () => {
      element.removeEventListener('ended', onEnded);
      element.removeEventListener('error', onEnded);
      element.pause();
      elementRef.current = null;
    };
  }, [playNext]);

  const stopPlayback = useCallback(() => {
    for (const url of queueRef.current) URL.revokeObjectURL(url);
    queueRef.current = [];
    pendingRef.current.clear();
    nextSequenceRef.current = 0;
    playingRef.current = false;

    const element = elementRef.current;
    if (element !== null) {
      element.pause();
      element.removeAttribute('src');
    }
  }, []);

  const enqueueSpan = useCallback(
    (span: AudioDeltaEvent) => {
      pendingRef.current.set(span.sequence, span);

      for (
        let inOrder = pendingRef.current.get(nextSequenceRef.current);
        inOrder !== undefined;
        inOrder = pendingRef.current.get(nextSequenceRef.current)
      ) {
        pendingRef.current.delete(nextSequenceRef.current);
        nextSequenceRef.current += 1;
        queueRef.current.push(toAudioUrl(inOrder.audio, inOrder.format));
      }

      if (!playingRef.current) playNext();
    },
    [playNext],
  );

  return { enqueueSpan, stopPlayback };
}
