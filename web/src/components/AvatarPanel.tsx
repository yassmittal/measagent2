'use client';

import { useConversation } from '@/state/ConversationProvider';
import { Avatar } from './Avatar';
import { RelationshipLevel } from './RelationshipLevel';

export function AvatarPanel() {
  const { avatar } = useConversation();

  return (
    <aside className="avatar-panel">
      <Avatar portraitUrl={avatar.pictureUrl} label={avatar.name} />
      <div className="avatar-panel-id">
        <span className="avatar-panel-name">{avatar.name}</span>
        <RelationshipLevel />
        <p className="avatar-panel-bio">{avatar.bio}</p>
      </div>
    </aside>
  );
}
