'use client';

import { Square } from 'lucide-react';
import { useThinkingPhrase } from '@/hooks/useThinkingPhrase';
import { useConversation } from '@/state/ConversationProvider';
import type { TurnState } from '@/state/conversation-reducer';
import { PhraseCrossfade } from './PhraseCrossfade';

export function LiveTurn({ turn }: { turn: TurnState }) {
  const { cancelActiveTurn } = useConversation();

  const isThinking = turn.text === '';
  const { phrase, tick } = useThinkingPhrase(isThinking);

  const label = isThinking ? phrase : 'Writing the answer…';
  const labelKey = isThinking ? tick : 'writing';

  return (
    <div className="msg-andrew live-turn is-entering" aria-live="polite">
      <div className="journey-wrap">
        <div className="journey-stack">
          <p className="live-progress">
            <PhraseCrossfade text={label} textKey={labelKey} shimmering={true} />
          </p>
          {turn.text !== '' ? (
            // biome-ignore lint/a11y/useSemanticElements: the journey is a nested div structure the stylesheet selects on directly.
            <div className="journey" role="list" aria-label="What the avatar is doing">
              {/* biome-ignore lint/a11y/useSemanticElements: see the parent .journey */}
              <div
                className="journey-node journey-answer"
                data-kind="answer"
                data-status="answering"
                role="listitem"
              >
                <span className="journey-dot" aria-hidden="true" />
                <span className="journey-body">
                  <div className="journey-answer-text">
                    <p>{turn.text}</p>
                  </div>
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {turn.turnId !== null ? (
        <button
          type="button"
          className="live-turn-stop"
          aria-label="Stop responding"
          onClick={cancelActiveTurn}
        >
          <Square size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          Stop
        </button>
      ) : null}
    </div>
  );
}
