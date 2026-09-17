'use client';

import { useEffect, useState } from 'react';

const PHRASES = [
  'Thinking…',
  'Give me a second…',
  'Good question, let me think…',
  'Working out what to say…',
  'Finding a good example…',
] as const;

const ROTATION_MS = 3500;

function nextPhrase(current?: string): string {
  const candidates = PHRASES.filter((phrase) => phrase !== current);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? PHRASES[0];
}

export interface ThinkingPhrase {
  phrase: string;
  tick: number;
}

export function useThinkingPhrase(active: boolean): ThinkingPhrase {
  const [phrase, setPhrase] = useState(() => nextPhrase());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const rotation = setInterval(() => {
      setPhrase((current) => nextPhrase(current));
      setTick((current) => current + 1);
    }, ROTATION_MS);
    return () => clearInterval(rotation);
  }, [active]);

  return { phrase, tick };
}
