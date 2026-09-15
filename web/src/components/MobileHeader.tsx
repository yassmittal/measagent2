'use client';

import { PLACEHOLDER_PORTRAIT_SRC } from '@/lib/product';
import { useConversation } from '@/state/ConversationProvider';
import { RelationshipLevel } from './RelationshipLevel';

export function MobileHeader() {
  const { avatar } = useConversation();

  return (
    <header className="mobile-header">
      {/* biome-ignore lint/performance/noImgElement: a Google-hosted photo or the static SVG placeholder — see Avatar.tsx */}
      <img
        className="mobile-header-avatar"
        src={avatar.pictureUrl ?? PLACEHOLDER_PORTRAIT_SRC}
        alt=""
        referrerPolicy="no-referrer"
      />
      <div className="mobile-header-id">
        <span className="mobile-header-name">{avatar.name}</span>
        <RelationshipLevel />
      </div>
    </header>
  );
}
