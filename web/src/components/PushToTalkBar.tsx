'use client';

import { Mic } from 'lucide-react';
import type { SpeechCapture } from '@/hooks/useSpeechCapture';
import type { SpeechCaptureFailure } from '@/lib/voice/speech-capture';
import { ListeningWaveform } from './ListeningWaveform';

const UNAVAILABLE_LABELS: Record<SpeechCaptureFailure, string> = {
  mic_denied: 'Microphone access is blocked — check your browser permissions',
  not_configured: 'Voice input is not switched on yet',
  unreachable: 'Voice input is not available right now',
};

const HOLD_LABEL = 'Hold to speak (spacebar)';
const LISTENING_LABEL = 'Listening… release to send';

export function PushToTalkBar({ capture }: { capture: SpeechCapture }) {
  const { unavailableReason, isCapturing, isListening } = capture;

  if (unavailableReason !== null) {
    const label = UNAVAILABLE_LABELS[unavailableReason];
    return (
      <button type="button" className="ptt-bar" aria-label={label} title={label} disabled>
        <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="ptt-bar-label">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`ptt-bar${isListening ? ' is-listening' : ''}`}
      aria-label={isCapturing ? 'Recording — release to send' : 'Hold to speak'}
      aria-pressed={isCapturing}
      title={HOLD_LABEL}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        capture.startCapture();
      }}
      onPointerUp={capture.finishCapture}
      onPointerCancel={capture.cancelCapture}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="ptt-bar-label">{isCapturing ? LISTENING_LABEL : HOLD_LABEL}</span>
      {isListening ? <ListeningWaveform active={true} /> : null}
    </button>
  );
}
