'use client';

import { useEffect, useRef, useState } from 'react';

const FADE_MS = 600;

interface PhraseCrossfadeProps {
  text: string;
  textKey: string | number;
  shimmering: boolean;
}

export function PhraseCrossfade({ text, textKey, shimmering }: PhraseCrossfadeProps) {
  const [leaving, setLeaving] = useState<{ key: string | number; text: string } | null>(
    null,
  );
  const current = useRef({ key: textKey, text });

  useEffect(() => {
    if (current.current.key === textKey) return;

    const previous = current.current;
    current.current = { key: textKey, text };
    setLeaving(previous);

    const timer = setTimeout(() => {
      setLeaving((value) =>
        value !== null && value.key === previous.key ? null : value,
      );
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [text, textKey]);

  const shimmer = shimmering ? ' is-shimmering' : '';

  return (
    <span className="phrase-crossfade">
      {leaving !== null ? (
        <span key={leaving.key} className={`phrase-fade-leaving${shimmer}`}>
          {leaving.text}
        </span>
      ) : null}
      <span key={textKey} className={`phrase-fade${shimmer}`}>
        {text}
      </span>
    </span>
  );
}
