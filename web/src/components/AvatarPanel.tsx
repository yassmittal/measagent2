'use client';

import { useConversation } from '@/state/ConversationProvider';
import { Avatar } from './Avatar';
import { AvatarProfileDetails } from './AvatarProfileDetails';
import { RelationshipLevel } from './RelationshipLevel';

export function AvatarPanel() {
  const { avatar } = useConversation();

  return (
    <aside className="avatar-panel">
      <Avatar portraitUrl={avatar.pictureUrl} label={avatar.name} />
      <div className="avatar-panel-id">
        {/* The page's one heading: server rendered with the shell, so a crawler
            reads whose avatar this is without running the chat. */}
        <h1 className="avatar-panel-name">{avatar.name}</h1>
        <RelationshipLevel />
        <p className="avatar-panel-bio">{avatar.bio}</p>
        <AvatarProfileDetails />
      </div>
    </aside>
  );
}
