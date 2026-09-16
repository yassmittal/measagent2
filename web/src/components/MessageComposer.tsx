'use client';

import { ArrowUp, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';
import { PRODUCT_NAME } from '@/lib/product';
import { useConversation } from '@/state/ConversationProvider';
import { isTurnActive } from '@/state/conversation-reducer';
import { PushToTalkBar } from './PushToTalkBar';

const MAX_INPUT_HEIGHT_PX = 216;

interface MessageComposerProps {
  onHeightChange: (height: number) => void;
}

export function MessageComposer({ onHeightChange }: MessageComposerProps) {
  const {
    avatar,
    turn,
    inputError,
    clearInputError,
    sendOrQueueMessage,
    queuedText,
    voice,
    voiceNotice,
    isMuted,
    toggleMuted,
  } = useConversation();

  const [draft, setDraft] = useState('');
  const rowRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const isBusy = isTurnActive(turn);

  // While the microphone is open the input belongs to the transcript: spoken
  // words appear where typed ones would, rather than tucked into the footer.
  const isDictating = voice.isHolding;
  const inputText = isDictating ? voice.spokenDraft : draft;
  const canSend = draft.trim() !== '' && !isDictating;

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
          className={`composer-input${isDictating ? ' is-ghost' : ''}`}
          placeholder={
            isDictating
              ? 'Listening…'
              : isBusy
                ? `${avatar.name} is replying…`
                : `Message ${avatar.name}…`
          }
          aria-label={`Message ${avatar.name}`}
          value={inputText}
          readOnly={isDictating}
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

      <PushToTalkBar voice={voice} avatarName={avatar.name} />

      {inputError !== null ? (
        <p className="composer-error" role="alert">
          {inputError}
        </p>
      ) : queuedText !== null ? (
        <p className="composer-hint" role="status">
          Sends when {avatar.name} finishes
        </p>
      ) : voiceNotice !== null && !isMuted ? (
        <p className="composer-hint" role="status">
          {voiceNotice}
        </p>
      ) : (
        // Anonymous visitors never see the consent card, so this line is how they
        // are told — and it is what makes their conversations visible to the owner
        // (`OWNER_NOTICE_SHOWN_SINCE` in the api). It stays whenever nothing more
        // urgent needs the space.
        <p className="composer-owner-notice">
          {avatar.name} reads conversations with their avatar ·{' '}
          <Link href="/privacy" className="composer-owner-notice-link">
            Privacy
          </Link>
          {/* Hidden on phones, where it would wrap the notice onto a second line
              and push the composer up. */}
          <span className="composer-made-with">
            {' · '}
            <Link href="/" className="composer-owner-notice-link">
              Made with {PRODUCT_NAME}
            </Link>
          </span>
        </p>
      )}
    </footer>
  );
}
