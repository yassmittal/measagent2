'use client';

import { useThinkingPhrase } from '@/hooks/useThinkingPhrase';
import type { TurnState } from '@/state/conversation-reducer';
import { PhraseCrossfade } from './PhraseCrossfade';

export function LiveTurn({ turn }: { turn: TurnState }) {
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
            <div className="journey" role="list" aria-label="What the avatar is doing">
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
    </div>
  );
}
