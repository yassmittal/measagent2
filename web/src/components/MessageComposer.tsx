'use client';

import { ArrowUp, Volume2, VolumeX } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useSpeechCapture } from '@/hooks/useSpeechCapture';
import { PRODUCT_NAME } from '@/lib/persona';
import { useConversation } from '@/state/ConversationProvider';
import { isTurnActive } from '@/state/conversation-reducer';
import { PushToTalkBar } from './PushToTalkBar';

const MAX_INPUT_HEIGHT_PX = 216;

interface MessageComposerProps {
  onHeightChange: (height: number) => void;
}

export function MessageComposer({ onHeightChange }: MessageComposerProps) {
  const {
    turn,
    inputError,
    clearInputError,
    sendOrQueueMessage,
    queuedText,
    voiceNotice,
    isMuted,
    toggleMuted,
  } = useConversation();

  const [draft, setDraft] = useState('');
  const rowRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const capture = useSpeechCapture({ onTranscribed: sendOrQueueMessage });

  const isBusy = isTurnActive(turn);

  const inputText = capture.isCapturing ? capture.partialTranscript : draft;
  const canSend = inputText.trim() !== '' && !capture.isCapturing;

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (row === null) return;

    const report = () => onHeightChange(Math.ceil(row.getBoundingClientRect().height));
    report();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(row);
    return () => observer.disconnect();
  }, [onHeightChange]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `inputText` is the change signal — the textarea is re-measured through its ref after the new text renders.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input === null) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT_PX)}px`;
  }, [inputText]);

  const submitDraft = () => {
    if (!canSend) return;
    setDraft('');
    sendOrQueueMessage(draft);
  };

  return (
    <footer ref={rowRef} className="composer-row">
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          submitDraft();
        }}
      >
        <button
          className={`composer-icon-btn composer-voice${isMuted ? ' muted' : ''}`}
          type="button"
          aria-label={isMuted ? 'Turn spoken replies on' : 'Turn spoken replies off'}
          aria-pressed={!isMuted}
          title={isMuted ? 'Spoken replies are off' : 'Spoken replies are on'}
          onClick={toggleMuted}
        >
          {isMuted ? (
            <VolumeX size={18} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <Volume2 size={18} strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>

        <textarea
          ref={inputRef}
          rows={1}
          className={`composer-input${capture.isCapturing ? ' is-ghost' : ''}`}
          placeholder={
            isBusy ? `${PRODUCT_NAME} is replying…` : `Message ${PRODUCT_NAME}…`
          }
          aria-label={`Message ${PRODUCT_NAME}`}
          value={inputText}
          readOnly={capture.isCapturing}
          onChange={(event) => {
            setDraft(event.target.value);
            if (inputError !== null) clearInputError();
          }}
          onKeyDown={(event) => {
            // `isComposing` / keyCode 229 mean an IME is mid-word; Enter there
            // commits the candidate rather than sending the message.
            if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)
              return;
            if (event.key !== 'Enter' || event.shiftKey) return;
            event.preventDefault();
            submitDraft();
          }}
        />

        <button
          className="composer-send"
          aria-label={isBusy ? 'Queue' : 'Send'}
          type="submit"
          disabled={!canSend}
        >
          <ArrowUp size={20} aria-hidden="true" />
        </button>
      </form>

      <PushToTalkBar capture={capture} />

      {inputError !== null ? (
        <p className="composer-error" role="alert">
          {inputError}
        </p>
      ) : queuedText !== null ? (
        <p className="composer-hint" role="status">
          Sends when {PRODUCT_NAME} finishes
        </p>
      ) : voiceNotice !== null && !isMuted ? (
        <p className="composer-hint" role="status">
          {voiceNotice}
        </p>
      ) : null}
    </footer>
  );
}
