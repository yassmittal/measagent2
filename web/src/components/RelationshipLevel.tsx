'use client';

import { describeRelationshipLevel } from '@measagent/shared/relationships';
import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConversation } from '@/state/ConversationProvider';
import { RelationshipMemory } from './RelationshipMemory';
import { SettingsPanel } from './SettingsPanel';

/**
 * How much a signed-in visitor has talked with this avatar, and the way in to
 * what it remembers. Drawn only while memory is on: the level is a measure of
 * what the memory is made of, so without memory it would be a number about
 * nothing.
 */
export function RelationshipLevel() {
  const { avatar, relationship, reloadRelationship, forgetThisAvatar } =
    useConversation();
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const [isMemoryOpen, setMemoryOpen] = useState(false);
  const tooltipId = useId();

  if (relationship === null || !relationship.isMemoryOn) return null;

  const { level, messagesToNextLevel } = describeRelationshipLevel(
    relationship.userMessageCount,
  );
  const showTooltip = () => setTooltipVisible(true);
  const hideTooltip = () => setTooltipVisible(false);

  return (
    <>
      <div className="relationship-level">
        <button
          type="button"
          className="relationship-level-label"
          aria-describedby={tooltipId}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          onClick={() => {
            hideTooltip();
            reloadRelationship();
            setMemoryOpen(true);
          }}
        >
          Level {level}
        </button>
        <span className="relationship-level-countdown">
          {messagesToNextLevel === null
            ? 'Highest level'
            : `${messagesToNextLevel} ${messagesToNextLevel === 1 ? 'message' : 'messages'} to level ${level + 1}`}
        </span>
        <span
          id={tooltipId}
          role="tooltip"
          className="relationship-level-tooltip"
          data-visible={isTooltipVisible ? '' : undefined}
        >
          Your level goes up as you talk with {avatar.name}&apos;s avatar. It remembers
          what you tell it between chats. Click your level to see what it remembers.
        </span>
      </div>

      {/* Portalled because the level sits inside the avatar panel and the mobile
          header, whose centred and header-sized text a modal must not inherit. */}
      {isMemoryOpen
        ? createPortal(
            <SettingsPanel
              title={`What ${avatar.name}'s avatar remembers`}
              onClose={() => setMemoryOpen(false)}
            >
              <RelationshipMemory
                avatarName={avatar.name}
                relationship={relationship}
                onForget={forgetThisAvatar}
              />
            </SettingsPanel>,
            document.body,
          )
        : null}
    </>
  );
}
