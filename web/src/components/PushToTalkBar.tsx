'use client';

import { Mic } from 'lucide-react';
import type { LiveVoiceSession } from '@/hooks/useLiveVoice';
import { PERSONA_NAME } from '@/lib/persona';
import { ListeningWaveform } from './ListeningWaveform';

const HOLD_LABEL = 'Hold to speak';

function describe(voice: LiveVoiceSession): string {
  if (voice.error !== null) return voice.error;
  if (voice.isHolding) return 'Listening… release to send';
  if (voice.status === 'connecting') return 'Opening the microphone…';
  if (voice.status === 'speaking') return `${PERSONA_NAME} is speaking…`;
  return HOLD_LABEL;
}

export function PushToTalkBar({ voice }: { voice: LiveVoiceSession }) {
  if (!voice.isAvailable) {
    const label = 'Send a message first, then you can talk';
    return (
      <button type="button" className="ptt-bar" aria-label={label} title={label} disabled>
        <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="ptt-bar-label">{label}</span>
      </button>
    );
  }

  const isLive = voice.isHolding || voice.status === 'speaking';

  return (
    <button
      type="button"
      className={`ptt-bar${voice.isHolding ? ' is-listening' : ''}`}
      aria-label={voice.isHolding ? 'Recording — release to send' : HOLD_LABEL}
      aria-pressed={voice.isHolding}
      title={HOLD_LABEL}
      // The pointer is captured on press so the release is still heard if the
      // finger slides off the button, which on a phone it usually does.
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        voice.beginHold();
      }}
      onPointerUp={voice.endHold}
      onPointerCancel={voice.endHold}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="ptt-bar-label">{describe(voice)}</span>
      {isLive ? <ListeningWaveform active={voice.isHolding} /> : null}
    </button>
  );
}
