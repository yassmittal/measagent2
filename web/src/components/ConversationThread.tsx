'use client';

import type { ThreadMessage } from '@measagent/shared';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatDateDivider } from '@/lib/format-date';
import { EMPTY_THREAD_PROMPT } from '@/lib/persona';
import { isTurnActive, type TurnState } from '@/state/conversation-reducer';
import { ScrollDownIcon } from './icons';
import { LiveTurn } from './LiveTurn';
import { MessageRow } from './MessageRow';

const PINNED_THRESHOLD_PX = 80;

interface ConversationThreadProps {
  messages: ThreadMessage[];
  turn: TurnState;
  isLoading: boolean;
}

export function ConversationThread({
  messages,
  turn,
  isLoading,
}: ConversationThreadProps) {
  const scrollRef = useRef<HTMLElement | null>(null);
  const [isPinnedToBottom, setPinnedToBottom] = useState(true);

  // Which messages arrived during this session, so a cold load does not play
  // an entrance animation for a hundred rows at once.
  const seenOnMount = useRef<Set<string> | null>(null);
  if (seenOnMount.current === null && !isLoading) {
    seenOnMount.current = new Set(messages.map((message) => message.id));
  }

  const isActive = isTurnActive(turn);

  useLayoutEffect(() => {
    const thread = scrollRef.current;
    if (thread === null || !isPinnedToBottom) return;
    thread.scrollTop = thread.scrollHeight;
  }, [isPinnedToBottom]);

  useEffect(() => {
    const thread = scrollRef.current;
    if (thread === null || !isPinnedToBottom) return;
    thread.scrollTop = thread.scrollHeight;
  }, [messages, turn.text, isPinnedToBottom]);

  const scrollToBottom = () => {
    const thread = scrollRef.current;
    if (thread === null) return;
    setPinnedToBottom(true);
    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      <section
        className="thread"
        role="log"
        tabIndex={0}
        aria-label="Conversation"
        ref={scrollRef}
        onScroll={(event) => {
          const thread = event.currentTarget;
          const distanceFromBottom =
            thread.scrollHeight - thread.scrollTop - thread.clientHeight;
          setPinnedToBottom(distanceFromBottom < PINNED_THRESHOLD_PX);
        }}
      >
        <div className="thread-col">
          <div className="thread-items">
            {messages.length === 0 && !isActive && !isLoading ? (
              <p className="thread-empty">{EMPTY_THREAD_PROMPT}</p>
            ) : null}

            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const divider = formatDateDivider(message.at);
              const startsNewDay =
                divider !== '' &&
                (previous === undefined || formatDateDivider(previous.at) !== divider);

              return (
                <Fragment key={message.id}>
                  {startsNewDay ? <div className="date-divider">{divider}</div> : null}
                  <MessageRow
                    message={message}
                    entering={seenOnMount.current?.has(message.id) === false}
                  />
                </Fragment>
              );
            })}

            {isActive ? <LiveTurn turn={turn} /> : null}

            {turn.phase === 'failed' && turn.failure !== null ? (
              <div className="thread-notice" role="alert">
                {turn.failure}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {isPinnedToBottom ? null : (
        <button
          type="button"
          className="scroll-bottom"
          aria-label="Scroll to bottom"
          onClick={scrollToBottom}
        >
          <ScrollDownIcon />
        </button>
      )}
    </>
  );
}
