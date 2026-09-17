'use client';

import { useEffect, useState } from 'react';

const TYPE_MS = 48;
const ERASE_MS = 22;
const HOLD_MS = 2200;
const GAP_MS = 350;

/**
 * Types each phrase out, holds it, erases it and moves to the next — the look of
 * someone about to ask. Starts from the first phrase in full, so the server
 * render and a visitor who prefers reduced motion both get a plain placeholder.
 * Stands still while `isPaused`: a placeholder that moves under the caret is a
 * distraction, not an invitation.
 */
export function useTypedPlaceholder(
  phrases: readonly string[],
  isPaused: boolean,
): string {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [length, setLength] = useState(phrases[0]?.length ?? 0);
  const [isErasing, setErasing] = useState(false);

  const phrase = phrases[phraseIndex % phrases.length] ?? '';

  useEffect(() => {
    if (isPaused || phrases.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let delay: number;
    let step: () => void;

    if (!isErasing && length < phrase.length) {
      delay = TYPE_MS;
      step = () => setLength((current) => current + 1);
    } else if (!isErasing) {
      delay = HOLD_MS;
      step = () => setErasing(true);
    } else if (length > 0) {
      delay = ERASE_MS;
      step = () => setLength((current) => current - 1);
    } else {
      delay = GAP_MS;
      step = () => {
        setErasing(false);
        setPhraseIndex((current) => (current + 1) % phrases.length);
      };
    }

    const timer = window.setTimeout(step, delay);
    return () => window.clearTimeout(timer);
  }, [isPaused, phrases.length, phrase.length, isErasing, length]);

  return phrase.slice(0, length);
}
