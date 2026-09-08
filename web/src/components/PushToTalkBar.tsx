'use client';

import { Mic, Square } from 'lucide-react';
import { useLiveVoice } from '@/hooks/useLiveVoice';
import { useConversation } from '@/state/ConversationProvider';

export function PushToTalkBar() {
  const { chat, refreshThread } = useConversation();
  const { status, liveTranscript, error, isAvailable, startSession, stopSession } =
    useLiveVoice({
      threadId: chat?.id ?? null,
      onTurnCompleted: () => void refreshThread(),
    });

  const isActive = status !== 'idle' && status !== 'error';

  if (!isAvailable) {
    const label = 'Voice input is not available yet';
    return (
      <button type="button" className="ptt-bar" aria-label={label} title={label} disabled>
        <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="ptt-bar-label">{label}</span>
      </button>
    );
  }

  if (chat === null) {
    const label = 'Send a message first, then you can talk';
    return (
      <button type="button" className="ptt-bar" aria-label={label} title={label} disabled>
        <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="ptt-bar-label">{label}</span>
      </button>
    );
  }

  const label = error ?? describeSession(status, liveTranscript);

  return (
    <button
      type="button"
      className="ptt-bar"
      data-status={status}
      aria-label={isActive ? 'End the voice conversation' : 'Start a voice conversation'}
      aria-pressed={isActive}
      onClick={() => (isActive ? stopSession() : void startSession())}
    >
      {isActive ? (
        <Square size={18} strokeWidth={1.8} aria-hidden="true" />
      ) : (
        <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
      )}
      <span className="ptt-bar-label">{label}</span>
    </button>
  );
}

function describeSession(
  status: ReturnType<typeof useLiveVoice>['status'],
  liveTranscript: string,
): string {
  switch (status) {
    case 'connecting':
      return 'Connecting…';
    case 'listening':
      return liveTranscript === '' ? 'Listening — just talk' : liveTranscript;
    case 'speaking':
      return liveTranscript === '' ? 'Speaking…' : liveTranscript;
    case 'error':
      return 'Voice session ended';
    default:
      return 'Talk to Yash';
  }
}
